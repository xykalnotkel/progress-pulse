import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

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

  // Only accept comments on updates that are actually published.
  const { data: update } = await supabase.from("progress_updates").select("id").eq("id", parsed.data.updateId).eq("is_published", true).maybeSingle();
  if (!update) return NextResponse.json({ error: "Update tidak ditemukan." }, { status: 404 });

  // Replies must point to an existing comment on the same update.
  if (parsed.data.parentId) {
    const { data: parent } = await supabase.from("comments").select("id, update_id").eq("id", parsed.data.parentId).maybeSingle();
    if (!parent || parent.update_id !== parsed.data.updateId)
      return NextResponse.json({ error: "Komentar yang dibalas tidak ditemukan." }, { status: 404 });
  }

  const { error } = await supabase.from("comments").insert({
    update_id: parsed.data.updateId,
    parent_id: parsed.data.parentId ?? null,
    author_name: parsed.data.authorName,
    body: parsed.data.body,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: "Gagal menyimpan komentar." }, { status: 500 });
  return NextResponse.json({ ok: true, moderation: "pending" }, { status: 201 });
}
