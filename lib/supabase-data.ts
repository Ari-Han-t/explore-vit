import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  ActivityType,
  AppProfile,
  AppRole,
  ChatMessageRecord,
  DomainName,
  MentorSessionRecord,
  ReflectionEntry,
  StudentContextSummary,
} from "@/lib/types";

type SessionJoinRow = {
  id: string;
  student_id: string;
  mentor_id: string;
  status: string;
  created_at: string;
  student_profile?: Array<Pick<AppProfile, "id" | "full_name" | "email" | "domain_interest" | "bio">>;
  mentor_profile?: Array<Pick<AppProfile, "id" | "full_name" | "email" | "bio" | "tags">>;
};

function normalizeSessionRow(row: SessionJoinRow): MentorSessionRecord {
  return {
    id: row.id,
    student_id: row.student_id,
    mentor_id: row.mentor_id,
    status: row.status,
    created_at: row.created_at,
    student_profile: row.student_profile?.[0] ?? null,
    mentor_profile: row.mentor_profile?.[0] ?? null,
  };
}

export async function fetchProfile(userId: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data as AppProfile | null;
}

export async function updateProfile(
  userId: string,
  updates: Pick<AppProfile, "full_name" | "bio" | "domain_interest" | "tags">
) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client
    .from("profiles")
    .update({
      full_name: updates.full_name,
      bio: updates.bio,
      domain_interest: updates.domain_interest,
      tags: updates.tags,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AppProfile;
}

export async function fetchUserReflections(userId: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("reflections")
    .select("id, domain, activity_type, rating, notes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{
    id: string;
    domain: DomainName;
    activity_type: ActivityType;
    rating: number;
    notes: string;
    created_at: string;
  }>).map((item) => ({
    id: item.id,
    domain: item.domain,
    activityType: item.activity_type,
    rating: item.rating,
    notes: item.notes,
    createdAt: item.created_at,
    source: "supabase",
  })) as ReflectionEntry[];
}

export async function insertReflection(
  userId: string,
  reflection: Pick<ReflectionEntry, "domain" | "activityType" | "rating" | "notes">
) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client
    .from("reflections")
    .insert({
      user_id: userId,
      domain: reflection.domain,
      activity_type: reflection.activityType,
      rating: reflection.rating,
      notes: reflection.notes,
    })
    .select("id, domain, activity_type, rating, notes, created_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    domain: data.domain as DomainName,
    activityType: data.activity_type as ActivityType,
    rating: data.rating,
    notes: data.notes,
    createdAt: data.created_at,
    source: "supabase",
  } as ReflectionEntry;
}

export async function fetchMentorProfiles() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("role", "mentor")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as AppProfile[];
}

export async function createOrGetMentorSession(studentId: string, mentorId: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data: existing, error: existingError } = await client
    .from("mentor_sessions")
    .select("*")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing as MentorSessionRecord;
  }

  const { data, error } = await client
    .from("mentor_sessions")
    .insert({
      student_id: studentId,
      mentor_id: mentorId,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as MentorSessionRecord;
}

export async function fetchUserSessions(userId: string, role: AppRole) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return [];
  }

  const column = role === "mentor" ? "mentor_id" : "student_id";
  const { data, error } = await client
    .from("mentor_sessions")
    .select(
      "id, student_id, mentor_id, status, created_at, student_profile:profiles!mentor_sessions_student_id_fkey(id, full_name, email, domain_interest, bio), mentor_profile:profiles!mentor_sessions_mentor_id_fkey(id, full_name, email, bio, tags)"
    )
    .eq(column, userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SessionJoinRow[]).map(normalizeSessionRow);
}

export async function fetchSession(sessionId: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("mentor_sessions")
    .select(
      "id, student_id, mentor_id, status, created_at, student_profile:profiles!mentor_sessions_student_id_fkey(id, full_name, email, domain_interest, bio), mentor_profile:profiles!mentor_sessions_mentor_id_fkey(id, full_name, email, bio, tags)"
    )
    .eq("id", sessionId)
    .single();

  if (error) {
    throw error;
  }

  return normalizeSessionRow(data as SessionJoinRow);
}

export async function fetchSessionMessages(sessionId: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("messages")
    .select("id, session_id, sender_id, body, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatMessageRecord[];
}

export async function fetchStudentContext(studentId: string): Promise<StudentContextSummary> {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      profile: null,
      exploredDomains: [],
      latestReflection: null,
    };
  }

  const [{ data: profileData, error: profileError }, { data: reflectionData, error: reflectionError }] =
    await Promise.all([
      client
        .from("profiles")
        .select("id, full_name, email, domain_interest, bio")
        .eq("id", studentId)
        .maybeSingle(),
      client
        .from("reflections")
        .select("domain, activity_type, rating, notes, created_at")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false }),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (reflectionError) {
    throw reflectionError;
  }

  const exploredDomains = Array.from(
    new Set((reflectionData ?? []).map((item) => item.domain).filter(Boolean))
  );

  return {
    profile: (profileData as StudentContextSummary["profile"]) ?? null,
    exploredDomains,
    latestReflection: ((reflectionData ?? [])[0] as StudentContextSummary["latestReflection"]) ?? null,
  };
}

export async function sendSessionMessage(sessionId: string, senderId: string, body: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await client.from("messages").insert({
    session_id: sessionId,
    sender_id: senderId,
    body,
  });

  if (error) {
    throw error;
  }
}

export function subscribeToSessionMessages(
  sessionId: string,
  onInsert: (message: ChatMessageRecord) => void
) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return null;
  }

  const channel: RealtimeChannel = client
    .channel(`messages:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => onInsert(payload.new as ChatMessageRecord)
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
