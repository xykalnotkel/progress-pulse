import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CommentReaction } from "@/lib/types";

const payload = z.object({
  commentId: z.string().uuid(),
  reaction: z.enum(["membantu", "setuju", "terima kasih"]),
});

const buckets = new Map<string, { count: number; expires: number }>();

function canReact(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.expires < now) { buckets.set(ip, { count: 1, expires: now + 10 * 60_000 }); return true; }
  if (bucket.count >= 20) return false;
  bucket.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!canReact(request))
    return NextResponse.json({ error: "Terlalu banyak reaksi. Coba lagi beberapa menit lagi." }, { status: 429 });

  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data reaksi tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  // Only approved comments can be reacted to.
  const { data: comment } = await supabase.from("comments").select("id").eq("id", parsed.data.commentId).eq("status", "approved").maybeSingle();
  if (!comment) return NextResponse.json({ error: "Komentar tidak ditemukan." }, { status: 404 });

  const { error } = await supabase.from("comment_reactions").insert({
    comment_id: parsed.data.commentId,
    reaction: parsed.data.reaction as CommentReaction,
  });
  if (error) return NextResponse.json({ error: "Gagal menyimpan reaksi." }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
