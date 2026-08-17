import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { revalidatePublicContent } from "@/lib/revalidation";

const payload = z.object({ status: z.enum(["approved", "rejected"]) });

/**
 * Hide ("rejected") or show ("approved") a comment. Owner-only: this is the
 * safety valve after a comment has already appeared publicly.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = payload.safeParse(await request.json().catch(() => null));
  const { id } = await params;
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data, error } = await supabase
    .from("comments")
    .update({ status: parsed.data.status, moderated_at: new Date().toISOString(), moderated_by: identity.email })
    .eq("id", id)
    .select("update_id")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Gagal memperbarui komentar." }, { status: 400 });

  revalidatePublicContent(data.update_id);
  return NextResponse.json({ ok: true });
}
