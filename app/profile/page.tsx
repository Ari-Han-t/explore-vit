"use client";

import { FormEvent, useMemo, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { domains } from "@/lib/data";
import { updateProfile } from "@/lib/supabase-data";
import type { ReflectionEntry, TrialEvent } from "@/lib/types";

function subscribeToStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = () => onStoreChange();
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function getLocalStorageSnapshot(key: string) {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(key) ?? "[]";
}

export default function ProfilePage() {
  const { isLoading, profile, refreshProfile, user } = useAuth();
  const reflectionsSnapshot = useSyncExternalStore(
    subscribeToStorage,
    () => getLocalStorageSnapshot("explore-vit:reflections"),
    () => "[]"
  );
  const trialsSnapshot = useSyncExternalStore(
    subscribeToStorage,
    () => getLocalStorageSnapshot("explore-vit:trials"),
    () => "[]"
  );
  const reflections = useMemo<ReflectionEntry[]>(() => {
    try {
      return JSON.parse(reflectionsSnapshot) as ReflectionEntry[];
    } catch {
      return [];
    }
  }, [reflectionsSnapshot]);
  const trials = useMemo<TrialEvent[]>(() => {
    try {
      return JSON.parse(trialsSnapshot) as TrialEvent[];
    } catch {
      return [];
    }
  }, [trialsSnapshot]);

  const latestReflection = reflections[0];
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    domain_interest: "",
    bio: "",
  });
  const [studentFormUserId, setStudentFormUserId] = useState<string | null>(null);
  const [studentFormMessage, setStudentFormMessage] = useState("");

  if (isLoading) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Loading workspace...</div>;
  }

  if (!user || !profile) {
    return (
      <div className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Sign In Required</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Please log in to view your profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Your profile, mentor note, and activity summary are only available inside your signed-in workspace.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (profile && profile.role !== "mentor" && studentFormUserId !== profile.id) {
    queueMicrotask(() => {
      setStudentForm({
        full_name: profile.full_name || "",
        domain_interest: profile.domain_interest || "",
        bio: profile.bio || "",
      });
      setStudentFormUserId(profile.id);
    });
  }

  if (profile?.role === "mentor") {
    return (
      <div className="space-y-6">
        <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Mentor Profile</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {profile.full_name || profile.email}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Your mentor profile is focused on conversations, student context, and session support.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Access Model</p>
            <div className="mt-5 space-y-4">
              {[
                "See each student's current interest and exploration signals.",
                "Open conversations directly from the mentor dashboard.",
                "Focus on support, guidance, and follow-up.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-white/75 px-4 py-3 text-sm text-muted">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Next Step</p>
            <h2 className="mt-2 text-2xl font-semibold">Open your mentor dashboard</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              View active student sessions and continue your conversations from one place.
            </p>
            <Link
              href="/mentor"
              className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
            >
              Go to Mentor Dashboard
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const handleStudentProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      await updateProfile(user.id, {
        full_name: studentForm.full_name.trim() || null,
        domain_interest: (studentForm.domain_interest.trim() || null) as
          | (typeof domains)[number]["name"]
          | null,
        bio: studentForm.bio.trim() || null,
        tags: profile?.tags || [],
      });
      await refreshProfile();
      setStudentFormMessage("Your mentor guidance note has been updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update your profile.";
      setStudentFormMessage(message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Student progress snapshot</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Keep track of your recent activity and how your interests are evolving.
        </p>
      </section>

      <section className="glass-panel rounded-[1.75rem] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Mentor Note</p>
            <h2 className="mt-2 text-2xl font-semibold">Tell mentors what you want help with</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Share your current interests, what kind of guidance you want, and where you still feel unsure before you start a conversation.
            </p>
          </div>
        </div>

        <form onSubmit={handleStudentProfileSave} className="mt-6 grid gap-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-muted">Name</span>
            <input
              value={studentForm.full_name}
              onChange={(event) => setStudentForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Your name"
              className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-muted">Current interest</span>
            <select
              value={studentForm.domain_interest}
              onChange={(event) => setStudentForm((current) => ({ ...current, domain_interest: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
            >
              <option value="">Select a domain</option>
              {domains.map((domain) => (
                <option key={domain.slug} value={domain.name}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-muted">What do you want help with?</span>
            <textarea
              value={studentForm.bio}
              onChange={(event) => setStudentForm((current) => ({ ...current, bio: event.target.value }))}
              placeholder="Example: I am torn between data science and research, and I want help understanding which path fits my strengths better."
              rows={5}
              className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
            >
              Save My Mentor Note
            </button>
            {studentFormMessage ? <p className="text-sm text-muted">{studentFormMessage}</p> : null}
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[1.75rem] p-6">
          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,#fff8f1_0%,#f4ddc7_100%)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Demo user</p>
            <h2 className="mt-2 text-3xl font-semibold">Your Profile</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Your recent activity appears here as you explore and reflect.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-border bg-white/75 p-4">
              <p className="text-sm text-muted">Reflections logged</p>
              <p className="mt-1 text-3xl font-semibold">{reflections.length}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-white/75 p-4">
              <p className="text-sm text-muted">Trials completed</p>
              <p className="mt-1 text-3xl font-semibold">{trials.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Quick Overview</p>
          <div className="mt-5 space-y-4">
            {[
              "Review your recent reflections and trials.",
              "Track which domains you keep returning to.",
              "Use mentor conversations to validate your direction.",
              "Come back often as your interests evolve.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-white/75 px-4 py-3 text-sm text-muted">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-border bg-white/75 p-4">
            <p className="text-sm font-semibold text-accent">Latest reflection</p>
            <p className="mt-2 text-lg font-semibold">{latestReflection?.domain ?? "No entries yet"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {latestReflection?.notes || "Once a user saves reflections, the latest note will surface here for a quick recap."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
