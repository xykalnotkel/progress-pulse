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
  app?: Pick<Project, "id" | "name" | "slug">;
  comment_count?: number;
};

export type Comment = {
  id: string;
  update_id: string;
  author_name: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};
