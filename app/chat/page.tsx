"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function ChatIndexPage() {
  const router = useRouter();
  const { isLoading, profile, user } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user || !profile) {
      router.replace("/login");
      return;
    }

    router.replace(profile?.role === "mentor" ? "/mentor" : "/mentors");
  }, [isLoading, profile?.role, profile, router, user]);

  return (
    <div className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
      <p className="text-sm text-muted">Redirecting to the right workspace...</p>
    </div>
  );
}
