"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  fetchSession,
  fetchSessionMessages,
  fetchStudentContext,
  sendSessionMessage,
  subscribeToSessionMessages,
} from "@/lib/supabase-data";
import type { ChatMessageRecord, MentorSessionRecord, StudentContextSummary } from "@/lib/types";

export default function ChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const { isSupabaseEnabled, profile, user } = useAuth();
  const [session, setSession] = useState<MentorSessionRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("Loading conversation...");
  const [studentContext, setStudentContext] = useState<StudentContextSummary | null>(null);

  useEffect(() => {
    if (!user || !sessionId || !isSupabaseEnabled) {
      return;
    }

    void fetchSession(sessionId)
      .then((sessionData) => {
        if (!sessionData) {
          throw new Error("Session not found.");
        }

        setSession(sessionData);
        if (profile?.role === "mentor") {
          void fetchStudentContext(sessionData.student_id)
            .then(setStudentContext)
            .catch(() => setStudentContext(null));
        }
        return fetchSessionMessages(sessionId);
      })
      .then((messageData) => {
        setMessages(messageData);
        setStatus("Realtime chat connected.");
      })
      .catch((error: { message?: string }) => setStatus(error.message ?? "Could not load session."));

    const unsubscribe = subscribeToSessionMessages(sessionId, (message) => {
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message]
      );
    });

    return () => {
      unsubscribe?.();
    };
  }, [isSupabaseEnabled, profile?.role, sessionId, user]);

  const counterpart = useMemo(() => {
    if (!session || !profile) {
      return null;
    }

    return profile.role === "mentor" ? session.student_profile : session.mentor_profile;
  }, [profile, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !draft.trim()) {
      return;
    }

    try {
      await sendSessionMessage(sessionId, user.id, draft.trim());
      setDraft("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send message.";
      setStatus(message);
    }
  };

  if (!isSupabaseEnabled) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Configure Supabase to enable chat.</div>;
  }

  if (!user || !profile) {
    return (
      <div className="glass-panel rounded-[1.8rem] p-6">
        <p className="text-sm text-muted">Please sign in before opening a chat session.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Live Session</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {counterpart?.full_name || counterpart?.email || "Conversation"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          You are chatting with {counterpart?.full_name || counterpart?.email || "this participant"}.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">{status}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel rounded-[1.8rem] p-6">
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.sender_id === user.id;

              return (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    isOwn ? "ml-auto bg-[#fff0e6] text-[#6f3519]" : "bg-white/80 text-muted"
                  }`}
                >
                  <p>{message.body}</p>
                  <p className="mt-2 text-xs opacity-70">{new Date(message.created_at).toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Send a message..."
              className="flex-1 rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
            >
              Send
            </button>
          </form>
        </div>

        {profile.role === "mentor" ? (
          <aside className="glass-panel rounded-[1.8rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Student Snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {studentContext?.profile?.full_name || session?.student_profile?.full_name || "Student"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {studentContext?.profile?.email || session?.student_profile?.email || "Student email unavailable"}
            </p>
            <p className="mt-3 text-sm text-muted">
              Current interest: {studentContext?.profile?.domain_interest || "Not set yet"}
            </p>
            <div className="mt-4 rounded-[1.4rem] border border-border bg-white/75 p-4">
              <p className="text-sm font-semibold text-accent">What the student wants help with</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {studentContext?.profile?.bio || "The student has not added a guidance note yet."}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-accent">Domains being explored</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(studentContext?.exploredDomains.length ? studentContext.exploredDomains : ["No reflection signal yet"]).map(
                  (domain) => (
                    <span
                      key={domain}
                      className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                    >
                      {domain}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-border bg-white/75 p-4">
              <p className="text-sm font-semibold text-accent">Latest reflection</p>
              <p className="mt-2 text-sm text-muted">
                {studentContext?.latestReflection?.domain || "No domain"} | {studentContext?.latestReflection?.activity_type || "No activity"} | Rating{" "}
                {studentContext?.latestReflection?.rating ?? "-"}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                {studentContext?.latestReflection?.notes || "No written note yet."}
              </p>
            </div>
          </aside>
        ) : (
          <aside className="glass-panel rounded-[1.8rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Mentor Context</p>
            <h2 className="mt-2 text-2xl font-semibold">{session?.mentor_profile?.full_name || "Mentor"}</h2>
            <p className="mt-2 text-sm text-muted">
              {session?.mentor_profile?.email || "Mentor email unavailable"}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {session?.mentor_profile?.bio || "Use this chat to clarify fit, next steps, and whether this domain still feels energizing."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(session?.mentor_profile?.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </aside>
        )}
      </section>
    </div>
  );
}
