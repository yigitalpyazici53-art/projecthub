export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          username: string | null;
          university: string | null;
          role: string | null;
          bio: string | null;
          skills: string | null;
          interests: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          portfolio_url: string | null;
          avatar_url: string | null;
          created_at: string;
          is_ai_generated: boolean;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          username?: string | null;
          university?: string | null;
          role?: string | null;
          bio?: string | null;
          skills?: string | null;
          interests?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          is_ai_generated?: boolean;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          username?: string | null;
          university?: string | null;
          role?: string | null;
          bio?: string | null;
          skills?: string | null;
          interests?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          is_ai_generated?: boolean;
        };
        Relationships: [];
      };
      projects: {
        Row: {
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
          is_ai_generated: boolean;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          title?: string | null;
          tagline?: string | null;
          description?: string | null;
          category?: string | null;
          stage?: string | null;
          looking_for?: string | null;
          tech_stack?: string | null;
          created_at?: string;
          is_ai_generated?: boolean;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          title?: string | null;
          tagline?: string | null;
          description?: string | null;
          category?: string | null;
          stage?: string | null;
          looking_for?: string | null;
          tech_stack?: string | null;
          created_at?: string;
          is_ai_generated?: boolean;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string;
          read: boolean;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string;
          read?: boolean;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string;
          read?: boolean;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          project_id: string;
          applicant_id: string;
          role: string | null;
          message: string | null;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          applicant_id: string;
          role?: string | null;
          message?: string | null;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          applicant_id?: string;
          role?: string | null;
          message?: string | null;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "connection_request" | "connection_accepted" | "project_liked" | "profile_viewed" | "application_received" | "application_accepted" | "application_rejected";
          from_user_id: string | null;
          entity_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "connection_request" | "connection_accepted" | "project_liked" | "profile_viewed" | "application_received" | "application_accepted" | "application_rejected";
          from_user_id?: string | null;
          entity_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "connection_request" | "connection_accepted" | "project_liked" | "profile_viewed" | "application_received" | "application_accepted" | "application_rejected";
          from_user_id?: string | null;
          entity_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      project_updates: {
        Row: {
          id: string;
          project_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      endorsements: {
        Row: {
          id: string;
          endorser_id: string;
          profile_id: string;
          skill: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          endorser_id: string;
          profile_id: string;
          skill: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          endorser_id?: string;
          profile_id?: string;
          skill?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      builder_applications: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          university: string | null;
          role: string | null;
          skills: string | null;
          project_name: string | null;
          what_building: string | null;
          looking_for_teammates: boolean;
          looking_for_roles: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          demo_url: string | null;
          why_join: string | null;
          status: string;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          university?: string | null;
          role?: string | null;
          skills?: string | null;
          project_name?: string | null;
          what_building?: string | null;
          looking_for_teammates?: boolean;
          looking_for_roles?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          demo_url?: string | null;
          why_join?: string | null;
          status?: string;
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          university?: string | null;
          role?: string | null;
          skills?: string | null;
          project_name?: string | null;
          what_building?: string | null;
          looking_for_teammates?: boolean;
          looking_for_roles?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          demo_url?: string | null;
          why_join?: string | null;
          status?: string;
          admin_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_stats: {
        Args: Record<string, never>;
        Returns: {
          builders: number;
          projects: number;
          connections: number;
        }[];
      };
    };
  };
};
