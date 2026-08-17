import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { revalidatePublicContent } from "@/lib/revalidation";

/**
 * Owner-only update management: DELETE removes a progress update and
 * cascades to its comments, likes and comment reactions via foreign keys.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = z.string().uuid().safeParse((await params).id);
  if (!parsed.success) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { error } = await supabase.from("progress_updates").delete().eq("id", parsed.data);
  if (error) return NextResponse.json({ error: "Gagal menghapus update." }, { status: 400 });

  revalidatePublicContent(parsed.data);
  return NextResponse.json({ ok: true });
}
