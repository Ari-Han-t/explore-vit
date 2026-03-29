export const domainNames = [
  "Data Science",
  "Competitive Programming",
  "Core Engineering",
  "Research",
  "Entrepreneurship",
] as const;

export const activities = [
  "Workshop",
  "Mentor Chat",
  "Club Event",
  "Self Study",
  "Project Sprint",
] as const;

export type DomainName = (typeof domainNames)[number];
export type ActivityType = (typeof activities)[number];
export type AppRole = "student" | "mentor" | "admin";
export type AccountProvider = "google" | "email";

export interface Workshop {
  title: string;
  format: string;
  duration: string;
  takeaway: string;
}

export interface DomainCard {
  slug: string;
  name: DomainName;
  prompt: string;
  summary: string;
  clubs: string[];
  keywords: string[];
  workshops: Workshop[];
}

export interface MentorProfile {
  id: string;
  name: string;
  role: string;
  domain: DomainName;
  bio: string;
  tags: string[];
  slots: string[];
  sessionPitch: string;
}

export interface ReflectionEntry {
  id: string;
  domain: DomainName;
  rating: number;
  notes: string;
  activityType: ActivityType;
  createdAt: string;
  source: "local" | "supabase";
}

export interface TrialEvent {
  id: string;
  domain: DomainName;
  createdAt: string;
  workshopTitle: string;
}

export interface RecommendationResult {
  recommendation: string;
  clubs: string[];
  scores: Record<string, number>;
  reasoning: string[];
}

export interface AppProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  account_provider: AccountProvider;
  domain_interest: DomainName | null;
  bio: string | null;
  tags: string[];
  is_active: boolean;
}

export interface MentorSessionRecord {
  id: string;
  student_id: string;
  mentor_id: string;
  status: string;
  created_at: string;
  student_profile?: Pick<AppProfile, "id" | "full_name" | "email" | "domain_interest" | "bio"> | null;
  mentor_profile?: Pick<AppProfile, "id" | "full_name" | "email" | "bio" | "tags"> | null;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface StudentContextSummary {
  profile: Pick<AppProfile, "id" | "full_name" | "email" | "domain_interest" | "bio"> | null;
  exploredDomains: string[];
  latestReflection: {
    domain: string;
    activity_type: string;
    rating: number;
    notes: string;
    created_at: string;
  } | null;
}
