import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

const payload = z.object({ status: z.enum(["approved", "rejected"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requestHasAdminAccess(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  const { id } = await params;
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  const { error } = await supabase.from("comments").update({ status: parsed.data.status, moderated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Gagal memoderasi komentar." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
