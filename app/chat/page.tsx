"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function ChatIndexPage() {
  const router = useRouter();
  const { isLoading, profile } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    router.replace(profile?.role === "mentor" ? "/mentor" : "/mentors");
  }, [isLoading, profile?.role, router]);

  return (
    <div className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
      <p className="text-sm text-muted">Redirecting to the right workspace...</p>
    </div>
  );
}
