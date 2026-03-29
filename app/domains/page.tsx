"use client";

import { useState } from "react";
import { RoleAccess } from "@/components/role-access";
import { domains } from "@/lib/data";
import { addStoredTrial, getStoredTrials } from "@/lib/storage";
import type { DomainName, TrialEvent } from "@/lib/types";

export default function DomainsPage() {
  const [trials, setTrials] = useState<TrialEvent[]>(() =>
    typeof window === "undefined" ? [] : getStoredTrials()
  );
  const [status, setStatus] = useState("Pick a domain and log a trial workshop.");

  const trialCounts = trials.reduce<Record<DomainName, number>>((acc, trial) => {
    acc[trial.domain] = (acc[trial.domain] ?? 0) + 1;
    return acc;
  }, {} as Record<DomainName, number>);

  const handleTryDomain = (domain: DomainName, workshopTitle: string) => {
    const updated = addStoredTrial({
      id: "",
      domain,
      createdAt: "",
      workshopTitle,
    });
    setTrials(updated);
    setStatus(`Logged "${workshopTitle}" for ${domain}.`);
  };

  return (
    <RoleAccess
      allow={["student", "admin"]}
      title="Domain exploration is student-only"
      description="Mentor accounts do not use the domain exploration workspace. Their home flow starts from the mentor dashboard and active student sessions."
      ctaHref="/mentor"
      ctaLabel="Go to Mentor Dashboard"
    >
    <div className="space-y-6">
      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Phase 2</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Explore domains through low-risk, high-signal trials
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              Start with short workshop experiences to get a feel for what matches your interests and energy.
            </p>
          </div>
          <div className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm text-muted">
            {status}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {domains.map((domain) => (
          <article key={domain.slug} className="glass-panel rounded-[1.75rem] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                  {domain.prompt}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{domain.name}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{domain.summary}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Trials Logged</p>
                <p className="mt-1 text-2xl font-semibold">{trialCounts[domain.name] ?? 0}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {domain.workshops.map((workshop) => (
                <div key={workshop.title} className="rounded-3xl border border-border bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{workshop.title}</p>
                    <span className="rounded-full bg-[#f6eadf] px-3 py-1 text-xs font-medium text-[#7f5a3b]">
                      {workshop.duration}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{workshop.format}</p>
                  <p className="mt-4 text-sm leading-6 text-muted">{workshop.takeaway}</p>
                  <button
                    type="button"
                    onClick={() => handleTryDomain(domain.name, workshop.title)}
                    className="mt-5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
                  >
                    Try This Domain
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {domain.clubs.map((club) => (
                <span
                  key={club}
                  className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                >
                  {club}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
    </RoleAccess>
  );
}
