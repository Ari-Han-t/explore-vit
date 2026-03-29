"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { domains } from "@/lib/data";
import { fetchStudentContext, fetchUserSessions, updateProfile } from "@/lib/supabase-data";
import type { MentorSessionRecord, StudentContextSummary } from "@/lib/types";

export default function MentorDashboardPage() {
  const { isSupabaseEnabled, isLoading, profile, refreshProfile, user } = useAuth();
  const [sessions, setSessions] = useState<MentorSessionRecord[]>([]);
  const [studentSnapshots, setStudentSnapshots] = useState<Record<string, StudentContextSummary>>({});
  const [status, setStatus] = useState("Loading mentor workspace...");
  const [mentorForm, setMentorForm] = useState({
    full_name: "",
    domain_interest: "",
    bio: "",
    tags: "",
  });
  const [formMessage, setFormMessage] = useState("");
  const [mentorFormUserId, setMentorFormUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== "mentor" || !isSupabaseEnabled) {
      return;
    }

    void fetchUserSessions(user.id, "mentor")
      .then(async (data) => {
        setSessions(data);
        const entries = await Promise.all(
          data.map(async (session) => [session.student_id, await fetchStudentContext(session.student_id)] as const)
        );
        setStudentSnapshots(Object.fromEntries(entries));
        setStatus(data.length ? "Open any session to continue the conversation." : "No student sessions yet.");
      })
      .catch((error: { message?: string }) => setStatus(error.message ?? "Could not load mentor sessions."));
  }, [isSupabaseEnabled, profile?.role, user]);

  if (profile?.role === "mentor" && mentorFormUserId !== profile.id) {
    queueMicrotask(() => {
      setMentorForm({
        full_name: profile.full_name || "",
        domain_interest: profile.domain_interest || "",
        bio: profile.bio || "",
        tags: (profile.tags || []).join(", "),
      });
      setMentorFormUserId(profile.id);
    });
  }

  const handleMentorProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !profile || profile.role !== "mentor") {
      return;
    }

    try {
      await updateProfile(user.id, {
        full_name: mentorForm.full_name.trim() || null,
        domain_interest: (mentorForm.domain_interest.trim() || null) as
          | (typeof domains)[number]["name"]
          | null,
        bio: mentorForm.bio.trim() || null,
        tags: mentorForm.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await refreshProfile();
      setFormMessage("Your mentor details have been updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update your profile.";
      setFormMessage(message);
    }
  };

  if (!isSupabaseEnabled) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Configure Supabase to enable mentor chat workflows.</div>;
  }

  if (isLoading) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Loading mentor dashboard...</div>;
  }

  if (!user || profile?.role !== "mentor") {
    return (
      <div className="glass-panel rounded-[1.8rem] p-6">
        <p className="text-sm text-muted">This dashboard is only for mentor accounts.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Mentor Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Focused view for student sessions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          This dashboard only shows the student context a mentor needs: current interest, explored domains, and the latest reflection signal.
        </p>
        <p className="mt-3 text-sm text-muted">{status}</p>
      </section>

      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">About You</p>
            <h2 className="mt-2 text-2xl font-semibold">Help students understand how you can support them</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Add a strong bio, your main domain focus, and the areas you are comfortable guiding students through.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-white/75 px-4 py-3 text-sm text-muted">
            This information appears on the mentor list for students.
          </div>
        </div>

        <form onSubmit={handleMentorProfileSave} className="mt-6 grid gap-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-muted">Display name</span>
            <input
              value={mentorForm.full_name}
              onChange={(event) => setMentorForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Your name"
              className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-muted">Primary domain</span>
            <select
              value={mentorForm.domain_interest}
              onChange={(event) => setMentorForm((current) => ({ ...current, domain_interest: event.target.value }))}
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
            <span className="font-medium text-muted">Bio</span>
            <textarea
              value={mentorForm.bio}
              onChange={(event) => setMentorForm((current) => ({ ...current, bio: event.target.value }))}
              placeholder="Tell students what you have worked on, what kinds of decisions you can help with, and how you approach mentoring."
              rows={5}
              className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-muted">Specialisations</span>
            <input
              value={mentorForm.tags}
              onChange={(event) => setMentorForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="Example: Internships, CP, ML projects, Research papers"
              className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
            />
            <p className="text-xs text-muted">Separate each item with a comma.</p>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
            >
              Save Mentor Details
            </button>
            {formMessage ? <p className="text-sm text-muted">{formMessage}</p> : null}
          </div>
        </form>
      </section>

      <section className="grid gap-5">
        {sessions.map((session) => {
          const student = studentSnapshots[session.student_id];
          const studentName =
            student?.profile?.full_name || session.student_profile?.full_name || session.student_profile?.email || "Student";

          return (
            <div key={session.id} className="glass-panel rounded-[1.75rem] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <p className="text-2xl font-semibold">{studentName}</p>
                  <p className="text-sm text-muted">
                    {student?.profile?.email || session.student_profile?.email || "Student email unavailable"}
                  </p>
                  <p className="text-sm text-muted">
                    Current interest: {student?.profile?.domain_interest || "Not set yet"}
                  </p>
                  <p className="text-sm text-muted">
                    Looking for help with: {student?.profile?.bio || "No guidance note shared yet"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(student?.exploredDomains.length ? student.exploredDomains : ["No reflections yet"]).map((domain) => (
                      <span
                        key={domain}
                        className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="max-w-xl rounded-[1.4rem] border border-border bg-white/70 p-4">
                  <p className="text-sm font-semibold text-accent">Latest reflection snapshot</p>
                  <p className="mt-2 text-sm text-muted">
                    Domain: {student?.latestReflection?.domain || "Not available"} | Activity:{" "}
                    {student?.latestReflection?.activity_type || "Not available"} | Rating:{" "}
                    {student?.latestReflection?.rating ?? "-"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {student?.latestReflection?.notes || "No written reflection yet."}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href={`/chat/${session.id}`}
                  className="inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
                >
                  Open Chat with {studentName}
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
