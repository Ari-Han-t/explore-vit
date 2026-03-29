"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import type { AppRole } from "@/lib/types";

export function RoleAccess({
  allow,
  title,
  description,
  ctaHref,
  ctaLabel,
  children,
}: {
  allow: AppRole[];
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  children: React.ReactNode;
}) {
  const { isLoading, profile } = useAuth();

  if (isLoading) {
    return <div className="glass-panel rounded-[1.8rem] p-6">Loading workspace...</div>;
  }

  if (profile && !allow.includes(profile.role)) {
    return (
      <div className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Role-Limited View</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>
        <Link
          href={ctaHref}
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9d4e23]"
        >
          {ctaLabel}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
