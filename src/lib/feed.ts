import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { demoApps, demoUpdates } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Comment, CommentReaction, Contributor, ProgressUpdate, Project } from "@/lib/types";
import { REACTIONS } from "@/lib/constants";
import { optimizeMediaList } from "@/lib/media";

function getFeedClient() { return getSupabaseAdmin(); }
function isDemoMode() { return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !getFeedClient(); }
function publicUpdateFilter() { return `is_published.eq.true,scheduled_for.lte.${new Date().toISOString()}`; }

type UpdateWithStats = Omit<ProgressUpdate, "contributors"> & { comments?: Comment[]; contributors?: string[] };
type CommentCountRow = { id: string; update_id: string; parent_id: string | null };
const REACTIONS_LOCAL: CommentReaction[] = ["membantu", "setuju", "terima kasih"];

function nest(comments: Comment[], reactionsMap: Map<string, Partial<Record<CommentReaction, number>>>) {
  const byParent = new Map<string | null, Comment[]>();
  for (const comment of comments) { const list = byParent.get(comment.parent_id) ?? []; list.push(comment); byParent.set(comment.parent_id, list); }
  return (byParent.get(null) ?? []).map((comment) => ({ ...comment, reactions: reactionsMap.get(comment.id) ?? {}, replies: (byParent.get(comment.id) ?? []).map((reply) => ({ ...reply, reactions: reactionsMap.get(reply.id) ?? {} })) }));
}

async function attachStats(updates: UpdateWithStats[], includeThreads = false): Promise<ProgressUpdate[]> {
  const supabase = getFeedClient();
  if (!updates.length) return [];
  if (!supabase) return updates.map((update) => ({ ...update, contributors: [] }));
  const ids = updates.map((update) => update.id);
  const commentsPromise = includeThreads
    ? supabase.from("comments").select("id,update_id,parent_id,author_name,author_badge,author_avatar,author_title,body,created_at").eq("status", "approved").in("update_id", ids).order("created_at", { ascending: true })
    : supabase.from("comments").select("id,update_id,parent_id").eq("status", "approved").in("update_id", ids);
  const [likesResult, commentsResult] = await Promise.all([
    supabase.from("progress_updates").select("id, likes(count)").in("id", ids), commentsPromise,
  ]);
  const likesMap = new Map<string, number>();
  for (const row of likesResult.data ?? []) likesMap.set(row.id, (row.likes as { count?: number }[] | undefined)?.[0]?.count ?? 0);
  const countMap = new Map<string, number>();
  for (const row of (commentsResult.data ?? []) as CommentCountRow[]) countMap.set(row.update_id, (countMap.get(row.update_id) ?? 0) + 1);

  const fullComments = includeThreads ? (commentsResult.data ?? []) as Comment[] : [];
  const commentsByUpdate = new Map<string, Comment[]>();
  for (const comment of fullComments) { const list = commentsByUpdate.get(comment.update_id) ?? []; list.push(comment); commentsByUpdate.set(comment.update_id, list); }
  const reactionsMap = new Map<string, Partial<Record<CommentReaction, number>>>();
  if (includeThreads && fullComments.length) {
    const reactionsResult = await supabase.from("comment_reactions").select("comment_id,reaction").in("comment_id", fullComments.map((comment) => comment.id));
    for (const row of reactionsResult.data ?? []) { const counts = reactionsMap.get(row.comment_id) ?? {}; counts[row.reaction as CommentReaction] = (counts[row.reaction as CommentReaction] ?? 0) + 1; reactionsMap.set(row.comment_id, counts); }
  }

  const emails = new Set<string>();
  for (const update of updates) for (const email of update.contributors ?? []) emails.add(email.toLowerCase());
  const profileIndex = new Map<string, Contributor>();
  if (emails.size) {
    const { data } = await supabase.from("profiles").select("email,display_name,avatar_url").in("email", [...emails]);
    for (const profile of data ?? []) profileIndex.set(String(profile.email).toLowerCase(), { name: profile.display_name || "Tim", avatar_url: profile.avatar_url ?? null });
  }

  return updates.map((update) => {
    const threads = includeThreads ? nest(commentsByUpdate.get(update.id) ?? [], reactionsMap) : undefined;
    return { ...update, media: optimizeMediaList(update.media), likes_count: likesMap.get(update.id) ?? 0, comments: threads, comment_count: countMap.get(update.id) ?? 0, contributors: (update.contributors ?? []).map((email) => profileIndex.get(email.toLowerCase()) ?? { name: "Kontributor", avatar_url: null }) };
  });
}

async function loadUpdate(id: string) {
  const supabase = getFeedClient();
  if (!supabase) return null;
  const { data } = await supabase.from("progress_updates").select("*,app:apps(id,name,slug)").eq("id", id).or(publicUpdateFilter()).maybeSingle();
  if (!data) return null;
  return (await attachStats([data as UpdateWithStats], true))[0] ?? null;
}
const cachedUpdate = unstable_cache(loadUpdate, ["public-update"], { revalidate: 300, tags: ["public-content"] });
export const getPublicUpdateById = cache(async (id: string) => isDemoMode() ? demoUpdates.find((item) => item.id === id) ?? null : cachedUpdate(id));

async function loadFeed() {
  const supabase = getFeedClient();
  if (!supabase) return { apps: [], updates: [], isDemo: false };
  const [{ data: appRows }, { data: updateRows }] = await Promise.all([
    supabase.from("apps").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("progress_updates").select("*,app:apps(id,name,slug)").or(publicUpdateFilter()).order("created_at", { ascending: false }).limit(100),
  ]);
  return { apps: (appRows ?? []) as Project[], updates: await attachStats((updateRows ?? []) as UpdateWithStats[], false), isDemo: false };
}
const cachedFeed = unstable_cache(loadFeed, ["public-feed"], { revalidate: 300, tags: ["public-content"] });
export async function getPublicFeed() { return isDemoMode() ? { apps: demoApps, updates: demoUpdates, isDemo: true } : cachedFeed(); }

const cachedApps = unstable_cache(async () => {
  const supabase = getFeedClient();
  if (!supabase) return [];
  const { data } = await supabase.from("apps").select("*").eq("is_published", true).order("created_at", { ascending: false });
  return (data ?? []) as Project[];
}, ["public-apps"], { revalidate: 300, tags: ["public-content"] });
export async function getPublicApps() { return isDemoMode() ? demoApps : cachedApps(); }

export async function getPublicRssUpdates() {
  const supabase = getFeedClient();
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabase) return demoUpdates.slice(0, 50);
  const { data, error } = await supabase.from("progress_updates").select("id,app_id,title,description,status,version,media,is_published,scheduled_for,tags,created_at,updated_at,app:apps(id,name,slug)").or(publicUpdateFilter()).order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error("Gagal memuat RSS update.");
  return (data ?? []).map((row) => ({ id: String(row.id), app_id: String(row.app_id), title: String(row.title), description: row.description ? String(row.description) : null, status: row.status as ProgressUpdate["status"], version: row.version ? String(row.version) : null, media: Array.isArray(row.media) ? row.media.map(String) : [], is_published: Boolean(row.is_published), scheduled_for: row.scheduled_for ? String(row.scheduled_for) : null, tags: Array.isArray(row.tags) ? row.tags.map(String) : [], created_at: String(row.created_at), updated_at: String(row.updated_at), app: (Array.isArray(row.app) ? row.app[0] : row.app) ?? undefined }));
}

export async function getPublicSitemapUpdates() {
  const supabase = getFeedClient();
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabase) return demoUpdates.map((update) => ({ id: update.id, updated_at: update.created_at }));
  const { data, error } = await supabase.from("progress_updates").select("id,updated_at,created_at").or(publicUpdateFilter()).order("updated_at", { ascending: false }).limit(1000);
  if (error) throw new Error("Gagal memuat sitemap update.");
  return (data ?? []).map((update) => ({ id: String(update.id), updated_at: String(update.updated_at ?? update.created_at) }));
}

export { REACTIONS_LOCAL as REACTIONS_FEED, REACTIONS };
