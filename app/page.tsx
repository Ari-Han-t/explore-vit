"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { domains } from "@/lib/data";
import { fetchMentorProfiles } from "@/lib/supabase-data";
import type { AppProfile } from "@/lib/types";

const featureCards = [
  {
    href: "/domains",
    title: "Explore Domains",
    description: "Browse hands-on starter workshops in CP, Data Science, core engineering, research, and entrepreneurship.",
  },
  {
    href: "/mentors",
    title: "Meet Mentors",
    description: "Shortlist seniors and faculty-like mentors, then walk through a booking flow for quick guidance.",
  },
  {
    href: "/reflection",
    title: "Reflection Log",
    description: "Track what you tried, rate your energy, and turn scattered exploration into a useful signal.",
  },
  {
    href: "/decision-support",
    title: "Decision Support",
    description: "Convert activity data into ranked domain suggestions and club recommendations.",
  },
];

export default function Home() {
  const { isLoading, isSupabaseEnabled, profile } = useAuth();
  const [mentorProfiles, setMentorProfiles] = useState<AppProfile[]>([]);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      return;
    }

    void fetchMentorProfiles()
      .then(setMentorProfiles)
      .catch(() => setMentorProfiles([]));
  }, [isSupabaseEnabled]);

  if (isLoading) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Loading workspace...</div>;
  }

  if (profile?.role === "mentor") {
    return (
      <div className="space-y-8">
        <section className="glass-panel overflow-hidden rounded-[2rem]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
            <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Mentor Home
            </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Support students through the right conversation, not the whole product.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  Keep track of active student conversations and the context you need to guide each student clearly and confidently.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/mentor"
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-[#9d4e23]"
                >
                  Open Mentor Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="rounded-full border border-border bg-white/70 px-5 py-3 text-sm font-semibold transition hover:bg-white"
                >
                  View Mentor Profile
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,#fff7ef_0%,#f4dcc8_100%)] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                What You Can See
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-sm text-muted">Student context</p>
                  <p className="mt-1 text-lg font-semibold">Name, email, current interests, reflections, and conversations</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-sm text-muted">Your focus</p>
                  <p className="mt-1 text-lg font-semibold">Helpful guidance, session follow-ups, and timely support</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              href: "/mentor",
              title: "Session Queue",
              description: "Review active student sessions and open a conversation with the right context loaded.",
            },
            {
              href: "/mentor",
              title: "Student Signals",
              description: "See current interest and explored domains before you jump into advice.",
            },
            {
              href: "/profile",
              title: "Mentor Profile",
              description: "Keep your mentor identity and scope separate from the student-facing product.",
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="glass-panel rounded-[1.5rem] p-5 transition hover:translate-y-[-2px] hover:border-accent/30"
            >
              <p className="text-sm font-semibold text-accent">{card.title}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{card.description}</p>
            </Link>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="glass-panel overflow-hidden rounded-[2rem]">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-10">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Explore VIT
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Help students discover the right domain before they lock into the wrong one.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Explore domains, talk to mentors, reflect on what you try, and build confidence about where you want to grow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/domains"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-[#9d4e23]"
              >
                Start Exploring
              </Link>
              <Link
                href="/reflection"
                className="rounded-full border border-border bg-white/70 px-5 py-3 text-sm font-semibold transition hover:bg-white"
              >
                Open Reflection Log
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,#fff7ef_0%,#f4dcc8_100%)] p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Your Journey
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-muted">Explore</p>
                <p className="mt-1 text-lg font-semibold">Try workshops, events, and guided activities</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-muted">Reflect</p>
                <p className="mt-1 text-lg font-semibold">Track what felt energizing and what did not</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-muted">Decide</p>
                <p className="mt-1 text-lg font-semibold">Use your activity history to find a stronger direction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="glass-panel rounded-[1.5rem] p-5 transition hover:translate-y-[-2px] hover:border-accent/30"
          >
            <p className="text-sm font-semibold text-accent">{card.title}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Live Modules</p>
              <h2 className="mt-2 text-2xl font-semibold">What You Can Do</h2>
            </div>
            <div className="rounded-full border border-border px-3 py-1 text-sm font-medium text-muted">
              {domains.length} domains
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {domains.map((domain) => (
              <div key={domain.slug} className="rounded-3xl border border-border bg-white/70 p-4">
                <p className="text-lg font-semibold">{domain.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{domain.summary}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-accent">
                  Workshops
                </p>
                <p className="mt-2 text-sm text-muted">{domain.workshops[0]?.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Mentors</p>
          <h2 className="mt-2 text-2xl font-semibold">Talk to people who have walked the path</h2>
          <div className="mt-6 space-y-4">
            {mentorProfiles.length ? (
              mentorProfiles.slice(0, 4).map((mentor) => (
                <div key={mentor.id} className="rounded-3xl border border-border bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{mentor.full_name || mentor.email}</p>
                      <p className="text-sm text-muted">{mentor.email}</p>
                    </div>
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-[#6f3519]">
                      {mentor.domain_interest || "Mentor"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {mentor.bio || "This mentor has not added a bio yet."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(mentor.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-border bg-white/70 p-4">
                <p className="font-semibold">Mentors will appear here soon</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Once mentor accounts are active, you will be able to compare their focus areas and choose who to talk to.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
