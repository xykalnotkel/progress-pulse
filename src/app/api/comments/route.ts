import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

const payload = z.object({
  updateId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
  authorName: z.string().trim().min(2).max(48),
  body: z.string().trim().min(2).max(1000),
});
const banned = ["viagra", "casino", "slot gacor", "crypto giveaway"];
const buckets = new Map<string, { count: number; expires: number }>();

function canPost(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.expires < now) { buckets.set(ip, { count: 1, expires: now + 10 * 60_000 }); return true; }
  if (bucket.count >= 5) return false;
  bucket.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!canPost(request)) return NextResponse.json({ error: "Terlalu banyak komentar. Coba lagi beberapa menit lagi." }, { status: 429 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data komentar tidak valid." }, { status: 400 });
  if (banned.some((word) => parsed.data.body.toLowerCase().includes(word))) return NextResponse.json({ error: "Komentar tidak dapat dikirim." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data: update } = await supabase.from("progress_updates").select("id").eq("id", parsed.data.updateId).eq("is_published", true).maybeSingle();
  if (!update) return NextResponse.json({ error: "Update tidak ditemukan." }, { status: 404 });

  if (parsed.data.parentId) {
    const { data: parent } = await supabase.from("comments").select("id, update_id").eq("id", parsed.data.parentId).maybeSingle();
    if (!parent || parent.update_id !== parsed.data.updateId)
      return NextResponse.json({ error: "Komentar yang dibalas tidak ditemukan." }, { status: 404 });
  }

  // If the request carries an admin/team session, use the profile (name,
  // badge, avatar) and ignore the typed-in authorName.
  const identity = await requestHasAdminAccess(request);
  let author_name = parsed.data.authorName;
  let author_badge: string | null = null;
  let author_avatar: string | null = null;
  let author_title: string | null = null;
  if (identity) {
    author_name = identity.name;
    author_badge = identity.badge;
    const { data: profile } = await supabase.from("profiles").select("display_name, title, avatar_url").eq("email", identity.email.toLowerCase()).maybeSingle();
    if (profile?.display_name) author_name = profile.display_name;
    author_avatar = profile?.avatar_url ?? identity.avatar;
    author_title = profile?.title ?? null;
  }

  // Comments appear instantly: no manual approval step. Automated guards
  // (spam word filter + rate limiter) plus the owner-only hide panel are the
  // safety net.
  const { error } = await supabase.from("comments").insert({
    update_id: parsed.data.updateId,
    parent_id: parsed.data.parentId ?? null,
    author_name,
    body: parsed.data.body,
    status: "approved",
    author_badge,
    author_avatar,
    author_title,
  });
  if (error) return NextResponse.json({ error: "Gagal menyimpan komentar." }, { status: 500 });
  return NextResponse.json({ ok: true, identity: identity ? { badge: identity.badge, name: author_name } : null }, { status: 201 });
}
