"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleAccess } from "@/components/role-access";
import { useAuth } from "@/components/auth-provider";
import { computeLocalRecommendation } from "@/lib/recommendation";
import { fetchUserReflections } from "@/lib/supabase-data";
import { getStoredReflections, getStoredTrials } from "@/lib/storage";
import type { RecommendationResult, ReflectionEntry, TrialEvent } from "@/lib/types";

export default function DecisionSupportPage() {
  const { isSupabaseEnabled, user } = useAuth();
  const localReflections = useMemo<ReflectionEntry[]>(
    () => (typeof window === "undefined" ? [] : getStoredReflections()),
    []
  );
  const [reflections, setReflections] = useState<ReflectionEntry[]>(localReflections);
  const [hasResolvedSupabase, setHasResolvedSupabase] = useState(false);
  const trials = useMemo<TrialEvent[]>(
    () => (typeof window === "undefined" ? [] : getStoredTrials()),
    []
  );

  useEffect(() => {
    if (!user || !isSupabaseEnabled) {
      return;
    }

    void fetchUserReflections(user.id)
      .then((supabaseReflections) => {
        const nextReflections = supabaseReflections.length ? supabaseReflections : localReflections;
        setReflections(nextReflections);
      })
      .catch(() => {
        setReflections(localReflections);
      })
      .finally(() => setHasResolvedSupabase(true));
  }, [isSupabaseEnabled, localReflections, user]);

  const isLoading = Boolean(user && isSupabaseEnabled && !hasResolvedSupabase);

  const recommendation: RecommendationResult | null = useMemo(() => {
    if (!reflections.length && !trials.length) {
      return null;
    }

    return computeLocalRecommendation(reflections, trials);
  }, [reflections, trials]);

  const status = useMemo(() => {
    if (isLoading) {
      return "Loading your latest decision signals...";
    }

    if (reflections.length) {
      return user && isSupabaseEnabled
        ? "Showing your latest reflections."
        : "Showing your saved reflections.";
    }

    return "Add reflections to unlock a stronger recommendation.";
  }, [isLoading, isSupabaseEnabled, reflections.length, user]);

  return (
    <RoleAccess
      allow={["student", "admin"]}
      title="Decision support is student-only"
      description="Mentor accounts should not access the student recommendation workspace directly. They only see the student signals needed for guidance."
      ctaHref="/mentor"
      ctaLabel="Go to Mentor Dashboard"
    >
      <div className="space-y-6">
        <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Decision Support</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn exploration activity into a ranked direction
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            See which domains are rising to the top based on what you have tried and reflected on so far.
          </p>
          <p className="mt-3 text-sm text-muted">{status}</p>
        </section>

        {isLoading ? (
          <div className="glass-panel rounded-[1.75rem] p-6 text-sm text-muted">
            Loading your decision support workspace...
          </div>
        ) : recommendation ? (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="glass-panel rounded-[1.75rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Current Best Fit</p>
              <h2 className="mt-2 text-3xl font-semibold">{recommendation.recommendation}</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {recommendation.clubs.map((club) => (
                  <span
                    key={club}
                    className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                  >
                    {club}
                  </span>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {recommendation.reasoning.map((reason) => (
                  <div key={reason} className="rounded-2xl bg-white/75 p-4 text-sm leading-6 text-muted">
                    {reason}
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-border bg-white/70 p-4">
                  <p className="text-sm text-muted">Reflections</p>
                  <p className="mt-1 text-3xl font-semibold">{reflections.length}</p>
                </div>
                <div className="rounded-[1.4rem] border border-border bg-white/70 p-4">
                  <p className="text-sm text-muted">Domain trials</p>
                  <p className="mt-1 text-3xl font-semibold">{trials.length}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Score Breakdown</p>
              <div className="mt-5 space-y-4">
                {Object.entries(recommendation.scores).map(([domain, score]) => (
                  <div key={domain}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{domain}</span>
                      <span className="text-muted">{score.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-white/70">
                      <div
                        className="h-3 rounded-full bg-[linear-gradient(90deg,#b55d2d_0%,#e7a36e_100%)]"
                        style={{ width: `${Math.min(100, Math.max(10, score * 10))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-lg font-semibold">No decision signal yet</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Save at least one reflection so the system can start ranking domains for you.
            </p>
          </div>
        )}
      </div>
    </RoleAccess>
  );
}
