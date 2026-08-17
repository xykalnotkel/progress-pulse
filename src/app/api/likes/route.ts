import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeApiRateLimit, createVisitorHash } from "@/lib/abuse";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePublicContent } from "@/lib/revalidation";

const payload = z.object({
  updateId: z.string().uuid(),
  visitorId: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data like tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const allowed = await consumeApiRateLimit(supabase, request, {
      action: "like",
      limit: 12,
      windowSeconds: 600,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak like. Coba lagi beberapa menit lagi." },
        { status: 429 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Proteksi anti-spam belum siap." }, { status: 503 });
  }

  const { data: update } = await supabase
    .from("progress_updates")
    .select("id")
    .eq("id", parsed.data.updateId)
    .or(`is_published.eq.true,scheduled_for.lte.${new Date().toISOString()}`)
    .maybeSingle();
  if (!update) {
    return NextResponse.json({ error: "Update tidak ditemukan." }, { status: 404 });
  }

  const visitorHash = createVisitorHash(request, parsed.data.visitorId);
  const { error } = await supabase.from("likes").insert({
    update_id: parsed.data.updateId,
    visitor_hash: visitorHash,
  });

  if (error?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan like." }, { status: 500 });
  }

  revalidatePublicContent(parsed.data.updateId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
