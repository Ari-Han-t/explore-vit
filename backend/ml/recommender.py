from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Iterable

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.ml.domain_profiles import DOMAIN_PROFILES


@dataclass
class ReflectionSignal:
    domain: str
    rating: int
    notes: str = ""
    activity_type: str = "Workshop"


def _build_domain_corpus() -> tuple[list[str], list[str]]:
    domain_names = list(DOMAIN_PROFILES.keys())
    corpus = [
        f"{DOMAIN_PROFILES[name]['description']} {' '.join(DOMAIN_PROFILES[name]['keywords'])}"
        for name in domain_names
    ]
    return domain_names, corpus


def generate_recommendation(reflections: Iterable[ReflectionSignal]) -> dict[str, object]:
    reflection_list = [reflection for reflection in reflections if reflection.domain in DOMAIN_PROFILES]

    if not reflection_list:
        return {
            "recommendation": "Explore more domains first!",
            "clubs": [],
            "scores": {},
            "reasoning": [
                "No usable reflection signals were provided, so the engine cannot rank domains yet.",
            ],
        }

    domain_names, domain_corpus = _build_domain_corpus()
    combined_notes = " ".join(
        f"{reflection.activity_type} {reflection.notes}".strip() for reflection in reflection_list
    )

    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([*domain_corpus, combined_notes or "student exploration"])
    similarity_scores = cosine_similarity(matrix[-1], matrix[:-1]).flatten()

    scores: defaultdict[str, float] = defaultdict(float)

    for index, domain_name in enumerate(domain_names):
        scores[domain_name] += float(similarity_scores[index]) * 3.5

    for reflection in reflection_list:
        scores[reflection.domain] += reflection.rating * 1.8
        if reflection.activity_type in {"Mentor Chat", "Project Sprint"}:
            scores[reflection.domain] += 0.75
        elif reflection.activity_type in {"Workshop", "Club Event"}:
            scores[reflection.domain] += 0.35

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    best_domain = ranked[0][0]
    best_profile = DOMAIN_PROFILES[best_domain]

    domain_entry_count = sum(1 for reflection in reflection_list if reflection.domain == best_domain)
    reasoning = [
        f"{best_domain} ranked highest after combining text similarity and weighted activity ratings.",
        f"{domain_entry_count} reflection entries directly supported this path.",
        f"Recommended clubs: {', '.join(best_profile['clubs'])}.",
    ]

    return {
        "recommendation": best_domain,
        "clubs": best_profile["clubs"],
        "scores": {domain: round(score, 2) for domain, score in ranked},
        "reasoning": reasoning,
    }
