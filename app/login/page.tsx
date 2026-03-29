"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const allowedStudentDomain = process.env.NEXT_PUBLIC_ALLOWED_STUDENT_DOMAIN ?? "vitstudent.ac.in";

export default function LoginPage() {
  const router = useRouter();
  const {
    isSupabaseEnabled,
    isLoading,
    profile,
    signInMentorWithPassword,
    signInStudentWithGoogle,
    signUpMentorWithPassword,
    user,
  } = useAuth();
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleMentorLogin = async () => {
    const error = await signInMentorWithPassword(mentorEmail, mentorPassword);

    if (error) {
      setMessage(error);
      return;
    }

    router.push("/chat");
  };

  const handleMentorSignup = async () => {
    const error = await signUpMentorWithPassword(mentorEmail, mentorPassword);

    if (error) {
      setMessage(error);
      return;
    }

    setMessage("Mentor account created. If email confirmation is enabled, verify your inbox and then sign in.");
  };

  if (isLoading) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Checking session...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Student Access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Google OAuth for VIT students</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Students sign in with their VIT Google account.
        </p>
        <div className="mt-6 rounded-3xl border border-border bg-white/75 p-5">
          <p className="text-sm text-muted">Allowed student email domain</p>
          <p className="mt-2 text-xl font-semibold">@{allowedStudentDomain}</p>
        </div>
        <button
          type="button"
          disabled={!isSupabaseEnabled}
          onClick={() => void signInStudentWithGoogle("/chat")}
          className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>
      </section>

      <section className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Mentor Access</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Email and password login</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Mentors sign in with their email and password.
        </p>

        <form onSubmit={handleMentorLogin} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="mentor@vit.ac.in"
            value={mentorEmail}
            onChange={(event) => setMentorEmail(event.target.value)}
            className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={mentorPassword}
            onChange={(event) => setMentorPassword(event.target.value)}
            className="w-full rounded-2xl border border-border bg-white/75 px-4 py-3 outline-none"
          />
          <button
            type="submit"
            disabled={!isSupabaseEnabled}
            className="rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign in as Mentor
          </button>
          <button
            type="button"
            onClick={() => void handleMentorSignup()}
            disabled={!isSupabaseEnabled}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign up as Mentor
          </button>
        </form>

        <p className="mt-4 text-sm text-muted">
          Your email must already be approved for mentor access before signup will succeed.
        </p>
        {message ? <p className="mt-4 text-sm text-[#7a3717]">{message}</p> : null}
        {user ? (
          <p className="mt-4 text-sm text-muted">
            Current session: <span className="font-medium text-foreground">{profile?.role ?? user.email}</span>
          </p>
        ) : null}
      </section>
    </div>
  );
}
