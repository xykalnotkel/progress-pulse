export type UpdateStatus = "planning" | "building" | "testing" | "shipped";

export type AppLink = {
  label: string;
  url: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_url: string | null;
  links: AppLink[];
  is_published: boolean;
  created_at: string;
};

export type CommentReaction = "membantu" | "setuju" | "terima kasih";

export type AuthorBadge = "XyDev" | "XyTeam";

export type ProfileLink = { label: string; url: string };

/**
 * Public profile data (selectable by anyone). Returned by the profile API
 * and rendered both on admin replies and on the contributor stack.
 */
export type PublicProfile = {
  email: string;
  display_name: string | null;
  title: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  links: ProfileLink[];
  badge: AuthorBadge | null;
};

export type Comment = {
  id: string;
  update_id: string;
  parent_id: string | null;
  author_name: string;
  author_badge?: AuthorBadge | null;
  author_avatar?: string | null;
  author_title?: string | null;
  body: string;
  status?: "pending" | "approved" | "rejected";
  created_at: string;
  moderated_at?: string | null;
  moderated_by?: string | null;
  replies?: Comment[];
  reactions?: Partial<Record<CommentReaction, number>>;
};

export type Contributor = {
  email: string;
  name: string;
  avatar_url: string | null;
};

export type ProgressUpdate = {
  id: string;
  app_id: string;
  title: string;
  description: string | null;
  status: UpdateStatus;
  version: string | null;
  media: string[];
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  app?: Pick<Project, "id" | "name" | "slug">;
  comment_count?: number;
  likes_count?: number;
  comments?: Comment[];
  contributors?: Contributor[];
};
