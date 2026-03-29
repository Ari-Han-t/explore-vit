"use client";

import { FormEvent, startTransition, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { RoleAccess } from "@/components/role-access";
import { activities, domains } from "@/lib/data";
import { computeLocalRecommendation } from "@/lib/recommendation";
import { fetchUserReflections, insertReflection } from "@/lib/supabase-data";
import { addStoredReflection, getStoredReflections, getStoredTrials } from "@/lib/storage";
import type { ActivityType, RecommendationResult, ReflectionEntry } from "@/lib/types";

const defaultForm = {
  domain: domains[0]?.name ?? "Data Science",
  rating: 4,
  notes: "",
  activityType: activities[0] as ActivityType,
};

export default function ReflectionPage() {
  const { isSupabaseEnabled, user } = useAuth();
  const [reflections, setReflections] = useState<ReflectionEntry[]>(() =>
    typeof window === "undefined" ? [] : getStoredReflections()
  );
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("Capture what you tried and how it felt.");
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  useEffect(() => {
    if (!user || !isSupabaseEnabled) {
      return;
    }

    void fetchUserReflections(user.id)
      .then((data) => {
        setReflections(data);
        setMessage(data.length ? "Your reflections are ready." : "No reflections yet. Save your first one below.");
      })
      .catch(() => {
        setMessage("We could not load your reflections right now.");
      });
  }, [isSupabaseEnabled, user]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      domain: form.domain,
      rating: Number(form.rating),
      notes: form.notes.trim(),
      activityType: form.activityType,
    };

    void (async () => {
      if (user && isSupabaseEnabled) {
        try {
          const saved = await insertReflection(user.id, payload);
          setReflections((current) => [saved, ...current]);
          setForm(defaultForm);
          setMessage(`Saved your ${form.domain} reflection.`);
          return;
        } catch {
          setMessage("We could not save that reflection right now.");
        }
      }

      const updated = addStoredReflection({
        id: "",
        domain: payload.domain,
        rating: payload.rating,
        notes: payload.notes,
        activityType: payload.activityType,
        createdAt: "",
        source: "local",
      });

      setReflections(updated);
      setForm(defaultForm);
      setMessage(`Saved your ${form.domain} reflection.`);
    })();
  };

  const handleRecommendation = () => {
    if (!reflections.length) {
      setRecommendation(computeLocalRecommendation([], []));
      setMessage("Add at least one reflection to unlock a meaningful recommendation.");
      return;
    }

    setIsLoadingRecommendation(true);
    setMessage("Generating recommendation...");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"}/recommend`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reflections: reflections.map((reflection) => ({
                  domain: reflection.domain,
                  rating: reflection.rating,
                  notes: reflection.notes,
                  activity_type: reflection.activityType,
                })),
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Backend recommendation request failed.");
          }

          const result = (await response.json()) as RecommendationResult;
          setRecommendation(result);
          setMessage("Your recommendation is ready.");
        } catch {
          const fallback = computeLocalRecommendation(reflections, getStoredTrials());
          setRecommendation(fallback);
          setMessage("Your recommendation is ready.");
        } finally {
          setIsLoadingRecommendation(false);
        }
      })();
    });
  };

  return (
    <RoleAccess
      allow={["student", "admin"]}
      title="Reflection is student-only"
      description="Mentors should not land in the student reflection workspace. Their relevant context appears inside the mentor dashboard and chat session sidebar."
      ctaHref="/mentor"
      ctaLabel="Go to Mentor Dashboard"
    >
    <div className="space-y-6">
      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Phase 4</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Reflection log and recommendation trigger</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Capture what you tried, how much you enjoyed it, and what patterns you noticed. This is the input layer for the recommendation engine.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="glass-panel rounded-[1.75rem] p-6">
          <h2 className="text-2xl font-semibold">New reflection</h2>
          <div className="mt-6 grid gap-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-muted">Domain</span>
              <select
                value={form.domain}
                onChange={(event) =>
                  setForm((current) => ({ ...current, domain: event.target.value as ReflectionEntry["domain"] }))
                }
                className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
              >
                {domains.map((domain) => (
                  <option key={domain.slug} value={domain.name}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-muted">Activity type</span>
              <select
                value={form.activityType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, activityType: event.target.value as ActivityType }))
                }
                className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
              >
                {activities.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-muted">Star rating</span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={form.rating}
                onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                className="w-full accent-[#b55d2d]"
              />
              <p className="text-sm text-muted">{form.rating}/5</p>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-muted">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="What did you try? What energized you? What felt draining?"
                rows={6}
                className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
            >
              Save Reflection
            </button>
            <button
              type="button"
              onClick={handleRecommendation}
              className="rounded-full border border-border bg-white/70 px-5 py-3 text-sm font-semibold transition hover:bg-white"
            >
              {isLoadingRecommendation ? "Thinking..." : "Get My Recommendation"}
            </button>
          </div>

          <p className="mt-4 text-sm text-muted">{message}</p>
        </form>

        <div className="space-y-6">
          <div className="glass-panel rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Past reflections</h2>
              <span className="rounded-full border border-border px-3 py-1 text-sm text-muted">
                {reflections.length} entries
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {reflections.length ? (
                reflections.map((reflection) => (
                  <div key={reflection.id} className="rounded-[1.4rem] border border-border bg-white/75 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-[#6f3519]">
                        {reflection.domain}
                      </span>
                      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                        {reflection.activityType}
                      </span>
                      <span className="text-xs text-muted">{reflection.rating}/5</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {reflection.notes || "No notes yet. This entry still counts toward the weighted score."}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
                      {new Date(reflection.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted">
                  Your reflection history will show up here after the first submission.
                </p>
              )}
            </div>
          </div>

          {recommendation ? (
            <div className="glass-panel rounded-[1.75rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Recommendation Output</p>
              <h2 className="mt-2 text-2xl font-semibold">{recommendation.recommendation}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {recommendation.clubs.map((club) => (
                  <span
                    key={club}
                    className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                  >
                    {club}
                  </span>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {recommendation.reasoning.map((reason) => (
                  <p key={reason} className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-muted">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
    </RoleAccess>
  );
}
