import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeApiRateLimit, createVisitorHash } from "@/lib/abuse";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePublicContent } from "@/lib/revalidation";
import type { CommentReaction } from "@/lib/types";

const payload = z.object({
  commentId: z.string().uuid(),
  reaction: z.enum(["membantu", "setuju", "terima kasih"]),
  visitorId: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data reaksi tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const allowed = await consumeApiRateLimit(supabase, request, {
      action: "comment_reaction",
      limit: 20,
      windowSeconds: 600,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak reaksi. Coba lagi beberapa menit lagi." },
        { status: 429 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Proteksi anti-spam belum siap." }, { status: 503 });
  }

  const { data: comment } = await supabase
    .from("comments")
    .select("id, update_id")
    .eq("id", parsed.data.commentId)
    .eq("status", "approved")
    .maybeSingle();
  if (!comment) {
    return NextResponse.json({ error: "Komentar tidak ditemukan." }, { status: 404 });
  }

  const visitorHash = createVisitorHash(request, parsed.data.visitorId);
  const { error } = await supabase.from("comment_reactions").insert({
    comment_id: parsed.data.commentId,
    reaction: parsed.data.reaction as CommentReaction,
    visitor_hash: visitorHash,
  });

  if (error?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan reaksi." }, { status: 500 });
  }

  revalidatePublicContent(comment.update_id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
