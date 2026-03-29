"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { createOrGetMentorSession, fetchMentorProfiles, fetchUserSessions } from "@/lib/supabase-data";
import type { AppProfile, MentorSessionRecord } from "@/lib/types";

export default function MentorsPage() {
  const router = useRouter();
  const { isLoading, isSupabaseEnabled, profile, user } = useAuth();
  const [mentorProfiles, setMentorProfiles] = useState<AppProfile[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("Browse mentors and start a conversation when you are ready.");
  const [sessions, setSessions] = useState<MentorSessionRecord[]>([]);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      return;
    }

    void fetchMentorProfiles()
      .then((data) => {
        setMentorProfiles(data);
        setSelectedMentorId(data[0]?.id ?? "");
        setStatus(data.length ? "Choose a mentor and start a conversation." : "No mentors are available right now.");
      })
      .catch((error: { message?: string }) => setStatus(error.message ?? "We could not load mentors right now."));
  }, [isSupabaseEnabled]);

  useEffect(() => {
    if (!user || profile?.role !== "student" || !isSupabaseEnabled) {
      return;
    }

    void fetchUserSessions(user.id, "student")
      .then(setSessions)
      .catch(() => undefined);
  }, [isSupabaseEnabled, profile?.role, user]);

  const displayMentors = useMemo(() => {
    return mentorProfiles.map((mentor) => ({
      id: mentor.id,
      full_name: mentor.full_name,
      email: mentor.email,
      bio: mentor.bio,
      tags: mentor.tags,
      domain_interest: mentor.domain_interest,
    }));
  }, [mentorProfiles]);

  const selectedMentor = displayMentors.find((mentor) => mentor.id === selectedMentorId) ?? displayMentors[0];

  if (isLoading) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Loading workspace...</div>;
  }

  if (!user || !profile) {
    return (
      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Sign In Required</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Please log in to view mentors</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Mentor discovery, session booking, and chat are only available to signed-in students.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-5 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
        >
          Go to Login
        </button>
      </section>
    );
  }

  const handleBook = () => {
    if (!selectedMentor || !selectedSlot) {
      setConfirmation("Pick a slot before booking.");
      return;
    }

    setConfirmation(
      `Session booked with ${selectedMentor.full_name || selectedMentor.email} for ${selectedSlot}.`
    );
  };

  const handleStartChat = async () => {
    if (!user || profile?.role !== "student" || !selectedMentor || !isSupabaseEnabled) {
      setStatus("Please sign in as a student to start a conversation.");
      return;
    }

    try {
      const session = await createOrGetMentorSession(user.id, selectedMentor.id);
      setSessions((current) =>
        current.some((item) => item.id === session.id)
          ? current
          : [session as MentorSessionRecord, ...current]
      );
      router.push(`/chat/${session.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open the mentor session.";
      setStatus(message);
    }
  };

  return (
    <div className="space-y-6">
      {profile?.role === "mentor" ? (
        <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
          <p className="text-sm text-muted">Mentor accounts now use the dedicated mentor dashboard.</p>
          <button
            type="button"
            onClick={() => router.push("/mentor")}
            className="mt-4 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
          >
            Open Mentor Dashboard
          </button>
        </section>
      ) : null}

      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Phase 3</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Mentor discovery and session booking</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Compare mentors by domain fit, focus areas, and background before you decide who to reach out to.
        </p>
        <p className="mt-3 text-sm text-muted">{status}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {displayMentors.length ? displayMentors.map((mentor) => {
            const isActive = mentor.id === selectedMentorId;

            return (
              <button
                key={mentor.id}
                type="button"
                onClick={() => {
                  setSelectedMentorId(mentor.id);
                  setSelectedSlot("");
                  setConfirmation("");
                }}
                className={`glass-panel w-full rounded-[1.5rem] p-5 text-left transition ${
                  isActive ? "border-accent/40 shadow-[0_18px_50px_-30px_rgba(181,93,45,0.8)]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold">{mentor.full_name || mentor.email}</p>
                    <p className="mt-1 text-sm text-muted">{mentor.email}</p>
                  </div>
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-[#6f3519]">
                    {mentor.domain_interest ?? "Mentor"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">{mentor.bio || "This mentor has not added a bio yet."}</p>
                <div className="mt-4 rounded-2xl bg-[#fff7ef] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Specialisations</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {(mentor.tags || []).length
                      ? (mentor.tags || []).join(", ")
                      : "General mentoring and student guidance"}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(mentor.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          }) : (
            <div className="glass-panel rounded-[1.5rem] p-5 text-left">
              <p className="text-xl font-semibold">No mentors available yet</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Check back after mentor profiles have been added. You will be able to compare bios, specialisations, and domain focus here.
              </p>
            </div>
          )}
        </div>

        {selectedMentor ? (
          <aside className="glass-panel rounded-[1.8rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Session Planner</p>
            <h2 className="mt-2 text-2xl font-semibold">{selectedMentor.full_name || selectedMentor.email}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {selectedMentor.bio || "Use this mentor slot to validate whether the student should keep exploring or commit to a domain."}
            </p>
            <div className="mt-4 rounded-[1.4rem] border border-border bg-white/75 p-4">
              <p className="text-sm font-semibold text-accent">Focus Areas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedMentor.tags || []).length ? (
                  (selectedMentor.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-white/90 px-3 py-1 text-xs font-medium text-muted"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted">General mentoring and domain guidance</span>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-accent">Available slots</p>
              <div className="mt-3 grid gap-3">
                {[
                  "Mon, 6:00 PM",
                  "Thu, 7:30 PM",
                  "Sat, 11:30 AM",
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selectedSlot === slot
                        ? "border-accent bg-[#fff0e6] text-[#7a3717]"
                        : "border-border bg-white/75 text-muted hover:bg-white"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleBook}
              className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
            >
              Book Session
            </button>
            <button
              type="button"
              onClick={() => void handleStartChat()}
              className="mt-3 rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold transition hover:bg-white"
            >
              Start Realtime Chat
            </button>

            <div className="mt-6 rounded-[1.5rem] border border-border bg-white/75 p-4">
              <p className="text-sm font-semibold text-accent">Realtime chat next</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Continue your mentor conversation here after opening a session.
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl bg-[#fff4eb] p-3 text-[#6f3519]">
                  Hi! I tried two DS workshops but I am still unsure about the math depth.
                </div>
                <div className="rounded-2xl bg-[#f8f6f2] p-3 text-muted">
                  Let&apos;s map your comfort with coding, projects, and theory before you commit.
                </div>
              </div>
            </div>

            {confirmation ? (
              <p className="mt-4 text-sm font-medium text-[#7a3717]">{confirmation}</p>
            ) : null}

            {profile?.role === "student" && sessions.length ? (
              <div className="mt-6 rounded-[1.5rem] border border-border bg-white/75 p-4">
                <p className="text-sm font-semibold text-accent">Your active mentor chats</p>
                <div className="mt-3 space-y-3">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => router.push(`/chat/${session.id}`)}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-left text-sm transition hover:border-accent/30"
                    >
                      Chat with {session.mentor_profile?.full_name || session.mentor_profile?.email || "mentor"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        ) : null}
      </section>
    </div>
  );
}
