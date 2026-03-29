import { Suspense } from "react";
import { AuthCallbackClient } from "@/components/auth-callback-client";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const next = typeof resolvedSearchParams.next === "string" ? resolvedSearchParams.next : "/chat";

  return (
    <Suspense
      fallback={
        <div className="glass-panel rounded-[1.8rem] p-6 sm:p-8">
          <p className="text-sm text-muted">Finishing sign-in...</p>
        </div>
      }
    >
      <AuthCallbackClient next={next} />
    </Suspense>
  );
}
