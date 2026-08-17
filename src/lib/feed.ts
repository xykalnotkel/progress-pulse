import "server-only";

import { cache } from "react";
import { demoApps, demoUpdates } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Comment, CommentReaction, Contributor, ProgressUpdate, Project } from "@/lib/types";
import { REACTIONS } from "@/lib/constants";
import { optimizeMediaList } from "@/lib/media";

function getFeedClient() {
  return getSupabaseAdmin();
}

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !getFeedClient();
}

type UpdateWithStats = Omit<ProgressUpdate, "contributors"> & {
  comments?: Comment[];
  contributors?: string[];
};

const REACTIONS_LOCAL: CommentReaction[] = ["membantu", "setuju", "terima kasih"];

function nest(comments: Comment[], reactionsMap: Map<string, Partial<Record<CommentReaction, number>>>): Comment[] {
  const byParent = new Map<string | null, Comment[]>();
  for (const comment of comments) {
    const list = byParent.get(comment.parent_id) ?? [];
    list.push(comment);
    byParent.set(comment.parent_id, list);
  }
  return (byParent.get(null) ?? []).map((comment) => ({
    ...comment,
    reactions: reactionsMap.get(comment.id) ?? {},
    replies: (byParent.get(comment.id) ?? []).map((reply) => ({
      ...reply,
      reactions: reactionsMap.get(reply.id) ?? {},
    })),
  }));
}

async function attachStats(updates: UpdateWithStats[]): Promise<ProgressUpdate[]> {
  const supabase = getFeedClient();
  if (!updates.length) return [];
  if (!supabase) {
    return updates.map((update) => ({ ...update, contributors: [] }));
  }

  const ids = updates.map((update) => update.id);

  const [likesResult, commentsResult] = await Promise.all([
    supabase.from("progress_updates").select("id, likes(count)").in("id", ids),
    supabase.from("comments").select("id, update_id, parent_id, author_name, author_badge, author_avatar, author_title, body, created_at").eq("status", "approved").in("update_id", ids).order("created_at", { ascending: true }),
  ]);

  const likesMap = new Map<string, number>();
  for (const row of likesResult.data ?? []) {
    likesMap.set(row.id, (row.likes as { count?: number }[] | undefined)?.[0]?.count ?? 0);
  }

  const commentsByUpdate = new Map<string, Comment[]>();
  for (const comment of (commentsResult.data ?? []) as Comment[]) {
    const list = commentsByUpdate.get(comment.update_id) ?? [];
    list.push(comment);
    commentsByUpdate.set(comment.update_id, list);
  }

  const allCommentIds = (commentsResult.data ?? []).map((c: Comment) => c.id);
  const reactionsMap = new Map<string, Partial<Record<CommentReaction, number>>>();
  if (allCommentIds.length) {
    const reactionsResult = await supabase.from("comment_reactions").select("comment_id, reaction").in("comment_id", allCommentIds);
    for (const row of reactionsResult.data ?? []) {
      const counts = reactionsMap.get(row.comment_id) ?? {};
      counts[row.reaction as CommentReaction] = (counts[row.reaction as CommentReaction] ?? 0) + 1;
      reactionsMap.set(row.comment_id, counts);
    }
  }

  // Resolve contributor emails via the profiles table. The DB column holds
  // emails; the wire type exposes resolved Contributor objects.
  const emails = new Set<string>();
  for (const update of updates) for (const email of update.contributors ?? []) emails.add(email.toLowerCase());
  const profileIndex = new Map<string, Contributor>();
  if (emails.size) {
    const { data } = await supabase.from("profiles").select("email, display_name, avatar_url").in("email", [...emails]);
    for (const profile of data ?? []) {
      const key = String(profile.email).toLowerCase();
      profileIndex.set(key, { email: key, name: profile.display_name || key.split("@")[0] || "Tim", avatar_url: profile.avatar_url ?? null });
    }
  }

  return updates.map((update) => {
    const threads = nest(commentsByUpdate.get(update.id) ?? [], reactionsMap);
    const contributors = (update.contributors ?? []).map((e) => {
      const key = e.toLowerCase();
      return profileIndex.get(key) ?? { email: key, name: key.split("@")[0] || "Tim", avatar_url: null };
    });
    return {
      ...update,
      media: optimizeMediaList(update.media),
      likes_count: likesMap.get(update.id) ?? 0,
      comments: threads,
      comment_count: threads.reduce((count, thread) => count + 1 + (thread.replies?.length ?? 0), 0),
      contributors,
    };
  });
}

export const getPublicUpdateById = cache(async function getPublicUpdateById(id: string) {
  const supabase = getFeedClient();
  if (isDemoMode()) {
    const update = demoUpdates.find((item) => item.id === id) ?? null;
    return update ?? null;
  }

  const { data } = await supabase!
    .from("progress_updates")
    .select("*, app:apps(id,name,slug)")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (!data) return null;
  const [enriched] = await attachStats([data as UpdateWithStats]);
  return enriched ?? null;
});

export async function getPublicFeed() {
  const supabase = getFeedClient();
  if (isDemoMode()) return { apps: demoApps, updates: demoUpdates, isDemo: true };

  const [{ data: appRows }, { data: updateRows }] = await Promise.all([
    supabase!.from("apps").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    supabase!
      .from("progress_updates")
      .select("*, app:apps(id,name,slug)")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  const enriched = await attachStats((updateRows ?? []) as UpdateWithStats[]);

  return {
    apps: (appRows ?? []) as Project[],
    updates: enriched as ProgressUpdate[],
    isDemo: false,
  };
}

export async function getPublicSitemapUpdates() {
  const supabase = getFeedClient();
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabase) {
    return demoUpdates.map((update) => ({
      id: update.id,
      updated_at: update.created_at,
    }));
  }

  const { data, error } = await supabase
    .from("progress_updates")
    .select("id, updated_at, created_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Gagal memuat sitemap update.");
  return (data ?? []).map((update) => ({
    id: String(update.id),
    updated_at: String(update.updated_at ?? update.created_at),
  }));
}

export { REACTIONS_LOCAL as REACTIONS_FEED, REACTIONS };
