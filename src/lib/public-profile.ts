import "server-only";

import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { PublicProfile } from "@/lib/types";

export type PublicOwnerProfile = Omit<PublicProfile, "email">;

export const getPublicOwnerProfile = cache(async (): Promise<PublicOwnerProfile> => {
  const admin = getSupabaseAdmin();
  const ownerEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!admin || !ownerEmail) {
    return { display_name: "Kall", title: "Founder & builder", avatar_url: null, banner_url: null, bio: null, links: [], badge: "XyDev", status_kind: "offline" };
  }

  const { data } = await admin.from("profiles").select("display_name,title,avatar_url,banner_url,bio,links,badge,status_text,status_kind,activity_text,status_updated_at").eq("email", ownerEmail).maybeSingle();
  return {
    display_name: data?.display_name ?? "Kall",
    title: data?.title ?? "Founder & builder",
    avatar_url: data?.avatar_url ?? null,
    banner_url: data?.banner_url ?? null,
    bio: data?.bio ?? null,
    links: Array.isArray(data?.links) ? data.links : [],
    badge: data?.badge ?? "XyDev",
    status_text: data?.status_text ?? null,
    status_kind: data?.status_kind ?? "offline",
    activity_text: data?.activity_text ?? null,
    status_updated_at: data?.status_updated_at ?? null,
  };
});
