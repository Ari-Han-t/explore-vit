from __future__ import annotations

import os
from typing import Any
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.ml.domain_profiles import DOMAIN_PROFILES
from backend.ml.recommender import ReflectionSignal, generate_recommendation

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="Explore VIT API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_supabase_client():
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        return None

    try:
        from supabase import create_client
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Supabase env vars are set, but the Python `supabase` package is not installed. "
                "Install backend requirements again after switching to a compatible Python version."
            ),
        ) from exc

    return create_client(supabase_url, service_role_key)


class ReflectionPayload(BaseModel):
    domain: str
    rating: int = Field(ge=1, le=5)
    notes: str = ""
    activity_type: str = "Workshop"


class RecommendationRequest(BaseModel):
    user_id: UUID | None = None
    reflections: list[ReflectionPayload] = Field(default_factory=list)


def fetch_user_reflections(user_id: UUID) -> list[ReflectionSignal]:
    supabase = get_supabase_client()

    if supabase is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured. Add SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to backend/.env.",
        )

    response = (
        supabase.table("reflections")
        .select("domain, rating, notes, activity_type")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .execute()
    )

    return [
        ReflectionSignal(
            domain=row["domain"],
            rating=row["rating"],
            notes=row.get("notes", "") or "",
            activity_type=row.get("activity_type", "Workshop"),
        )
        for row in response.data
        if row.get("domain") in DOMAIN_PROFILES
    ]


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "supabase_configured": get_supabase_client() is not None,
        "supported_domains": list(DOMAIN_PROFILES.keys()),
    }


@app.post("/recommend")
def recommend(payload: RecommendationRequest) -> dict[str, Any]:
    reflections: list[ReflectionSignal] = []

    if payload.reflections:
        reflections = [
            ReflectionSignal(
                domain=item.domain,
                rating=item.rating,
                notes=item.notes,
                activity_type=item.activity_type,
            )
            for item in payload.reflections
            if item.domain in DOMAIN_PROFILES
        ]
    elif payload.user_id:
        reflections = fetch_user_reflections(payload.user_id)
    else:
        raise HTTPException(
            status_code=400,
            detail="Send either `reflections` directly or a `user_id` that exists in Supabase.",
        )

    return generate_recommendation(reflections)
