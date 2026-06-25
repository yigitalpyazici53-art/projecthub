/**
 * Shared domain types used across pages and components.
 * Single source of truth — import from here, never redefine inline.
 */

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  university: string | null;
  role: string | null;
  bio: string | null;
  skills: string | null;
  interests: string | null;
  github_url: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  is_ai_generated?: boolean;
};

export type Project = {
  id: string;
  owner_id: string | null;
  title: string | null;
  tagline: string | null;
  description: string | null;
  category: string | null;
  stage: string | null;
  looking_for: string | null;
  tech_stack: string | null;
  created_at: string;
  is_ai_generated?: boolean;
  // Proof-of-work links — backend fields, conditionally shown when present
  github_url?: string | null;
  demo_url?: string | null;
  figma_url?: string | null;
  website_url?: string | null;
  time_commitment?: string | null;
};

export type Connection = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
};

export type Notification = {
  id: string;
  user_id: string;
  type: "connection_request" | "connection_accepted" | "project_liked" | "profile_viewed" | "application_received" | "application_accepted" | "application_rejected";
  from_user_id: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
};

export type Endorsement = {
  id: string;
  endorser_id: string;
  profile_id: string;
  skill: string;
  created_at: string;
};

export type ProjectUpdate = {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type Application = {
  id: string;
  project_id: string;
  applicant_id: string;
  role: string | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};
