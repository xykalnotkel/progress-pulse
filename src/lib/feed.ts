import { demoApps, demoUpdates } from "@/lib/demo-data";
import { getSupabasePublic } from "@/lib/supabase";
import type { Comment, ProgressUpdate, Project } from "@/lib/types";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !getSupabasePublic();
}

type UpdateWithStats = ProgressUpdate & { comments?: Comment[] };

/**
 * Attach real like counts and approved comments to a list of updates.
 * Uses a single aggregate query for likes and one filtered query for comments.
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
    .select("id, update_id, author_name, body, created_at")
    .eq("status", "approved")
    .in("update_id", ids)
    .order("created_at", { ascending: true });

  const commentsMap = new Map<string, Comment[]>();
  for (const comment of (commentsResult.data ?? []) as Comment[]) {
    const list = commentsMap.get(comment.update_id) ?? [];
    list.push(comment);
    commentsMap.set(comment.update_id, list);
  }

  return updates.map((update) => ({
    ...update,
    likes_count: likesMap.get(update.id) ?? 0,
    comments: commentsMap.get(update.id) ?? [],
    comment_count: (commentsMap.get(update.id) ?? []).length,
  }));
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
