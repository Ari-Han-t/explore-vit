"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { fetchProfile } from "@/lib/supabase-data";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";
import type { AppProfile } from "@/lib/types";

type AuthContextValue = {
  isSupabaseEnabled: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: AppProfile | null;
  signInStudentWithGoogle: (next?: string) => Promise<string | null>;
  signInMentorWithPassword: (email: string, password: string) => Promise<string | null>;
  signUpMentorWithPassword: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [isLoading, setIsLoading] = useState(hasSupabaseEnv);

  useEffect(() => {
    const client = getSupabaseBrowserClient();

    if (!client) {
      return;
    }

    const load = async () => {
      const { data } = await client.auth.getSession();
      setSession(data.session);

      if (data.session?.user) {
        try {
          setProfile(await fetchProfile(data.session.user.id));
        } catch {
          setProfile(null);
        }
      }

      setIsLoading(false);
    };

    void load();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id)
          .then(setProfile)
          .catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isSupabaseEnabled: hasSupabaseEnv,
      isLoading,
      session,
      user: session?.user ?? null,
      profile,
      signInStudentWithGoogle: async (next = "/chat") => {
        const client = getSupabaseBrowserClient();

        if (!client) {
          return "Supabase is not configured.";
        }

        const redirectBase = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
        const { error } = await client.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${redirectBase}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });

        return error?.message ?? null;
      },
      signInMentorWithPassword: async (email: string, password: string) => {
        const client = getSupabaseBrowserClient();

        if (!client) {
          return "Supabase is not configured.";
        }

        const { error } = await client.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      signUpMentorWithPassword: async (email: string, password: string) => {
        const client = getSupabaseBrowserClient();

        if (!client) {
          return "Supabase is not configured.";
        }

        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback?next=%2Fmentor`,
          },
        });

        return error?.message ?? null;
      },
      signOut: async () => {
        const client = getSupabaseBrowserClient();

        if (!client) {
          return;
        }

        await client.auth.signOut();
        setProfile(null);
      },
      refreshProfile: async () => {
        if (!session?.user) {
          setProfile(null);
          return;
        }

        setProfile(await fetchProfile(session.user.id));
      },
    }),
    [isLoading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
