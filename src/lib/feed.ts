import { demoApps, demoUpdates } from "@/lib/demo-data";
import { getSupabasePublic } from "@/lib/supabase";
import type { Comment, CommentReaction, ProgressUpdate, Project } from "@/lib/types";
import { REACTIONS } from "@/lib/constants";
import { optimizeMediaList } from "@/lib/media";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !getSupabasePublic();
}

type UpdateWithStats = ProgressUpdate & { comments?: Comment[] };

/** Nest flat approved comments into one level of threads and attach reaction counts. */
function buildThreads(comments: Comment[], reactionsMap: Map<string, Partial<Record<CommentReaction, number>>>): Comment[] {
  const byParent = new Map<string | null, Comment[]>();
  for (const comment of comments) {
    const key = comment.parent_id;
    const list = byParent.get(key) ?? [];
    list.push(comment);
    byParent.set(key, list);
  }
  const topLevel = byParent.get(null) ?? [];
  return topLevel.map((comment) => ({
    ...comment,
    reactions: reactionsMap.get(comment.id) ?? {},
    replies: (byParent.get(comment.id) ?? []).map((reply) => ({
      ...reply,
      reactions: reactionsMap.get(reply.id) ?? {},
    })),
  }));
}

/**
 * Attach real like counts, approved comment threads and comment reaction
 * counts to a list of updates.
 */
async function attachStats(updates: UpdateWithStats[]) {
  const supabase = getSupabasePublic();
  if (!updates.length || !supabase) return updates;

  const ids = updates.map((update) => update.id);

  const likesResult = await supabase
    .from("progress_updates")
    .select("id, likes(count)")
    .in("id", ids);

  const likesMap = new Map<string, number>();
  for (const row of likesResult.data ?? []) {
    const count = (row.likes as { count?: number }[] | undefined)?.[0]?.count ?? 0;
    likesMap.set(row.id, count);
  }

  const commentsResult = await supabase
    .from("comments")
    .select("id, update_id, parent_id, author_name, author_badge, author_avatar, body, created_at")
    .eq("status", "approved")
    .in("update_id", ids)
    .order("created_at", { ascending: true });

  const commentsByUpdate = new Map<string, Comment[]>();
  for (const comment of (commentsResult.data ?? []) as Comment[]) {
    const list = commentsByUpdate.get(comment.update_id) ?? [];
    list.push(comment);
    commentsByUpdate.set(comment.update_id, list);
  }

  const allCommentIds = (commentsResult.data ?? []).map((comment: Comment) => comment.id);
  const reactionsMap = new Map<string, Partial<Record<CommentReaction, number>>>();
  if (allCommentIds.length) {
    const reactionsResult = await supabase
      .from("comment_reactions")
      .select("comment_id, reaction")
      .in("comment_id", allCommentIds);
    for (const row of reactionsResult.data ?? []) {
      const counts = reactionsMap.get(row.comment_id) ?? {};
      counts[row.reaction as CommentReaction] = (counts[row.reaction as CommentReaction] ?? 0) + 1;
      reactionsMap.set(row.comment_id, counts);
    }
  }

  return updates.map((update) => {
    const flat = commentsByUpdate.get(update.id) ?? [];
    const threads = buildThreads(flat, reactionsMap);
    return {
      ...update,
      media: optimizeMediaList(update.media),
      likes_count: likesMap.get(update.id) ?? 0,
      comments: threads,
      comment_count: threads.length,
    };
  });
}

export async function getPublicUpdateById(id: string) {
  const supabase = getSupabasePublic();
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
}

export async function getPublicFeed() {
  const supabase = getSupabasePublic();
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

export { REACTIONS };
