"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AuthCallbackClient({ next }: { next: string }) {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    router.replace(user ? next : "/login");
  }, [isLoading, next, router, user]);

  return (
    <div className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
      <p className="text-sm text-muted">Finishing sign-in...</p>
    </div>
  );
}
