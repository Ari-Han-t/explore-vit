"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/domains", label: "Domains" },
  { href: "/mentors", label: "Mentors" },
  { href: "/reflection", label: "Reflection" },
  { href: "/decision-support", label: "Decision Support" },
  { href: "/profile", label: "Profile" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { profile, signOut, user } = useAuth();
  const visibleNavItems =
    !user
      ? [{ href: "/", label: "Home" }, { href: "/login", label: "Login" }]
      : profile?.role === "mentor"
      ? [
          { href: "/", label: "Home" },
          { href: "/mentor", label: "Mentor Dashboard" },
          { href: "/profile", label: "Profile" },
        ]
      : navItems;

  return (
    <header className="sticky top-4 z-20 py-4">
      <div className="glass-panel flex flex-col gap-4 rounded-[1.6rem] px-4 py-4 shadow-[0_18px_50px_-35px_rgba(55,40,20,0.45)] sm:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight">
              Explore VIT
            </Link>
            <p className="text-sm text-muted">Career exploration, mentor access, and guided decision-making.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <div className="rounded-full border border-border bg-white/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {profile?.role ?? "authenticated"}
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full border border-border bg-white/75 px-4 py-2 text-sm font-medium text-muted transition hover:bg-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "border border-border bg-white/70 text-muted hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user ? (
          <p className="text-sm text-muted">
            Signed in as <span className="font-medium text-foreground">{profile?.full_name || user.email}</span>
          </p>
        ) : null}
      </div>
    </header>
  );
}
