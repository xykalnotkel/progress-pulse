import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const payload = z.object({ updateId: z.string().uuid() });

// Lightweight in-memory guard, same pattern as /api/comments.
// Replace with a durable limiter before high-traffic launch.
const buckets = new Map<string, { count: number; expires: number }>();

function canLike(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.expires < now) {
    buckets.set(ip, { count: 1, expires: now + 10 * 60_000 });
    return true;
  }
  if (bucket.count >= 12) return false;
  bucket.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!canLike(request))
    return NextResponse.json({ error: "Terlalu banyak like. Coba lagi beberapa menit lagi." }, { status: 429 });

  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data like tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { error } = await supabase.from("likes").insert({ update_id: parsed.data.updateId });
  if (error) return NextResponse.json({ error: "Gagal menyimpan like." }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
