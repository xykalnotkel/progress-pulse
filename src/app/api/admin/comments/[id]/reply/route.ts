import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

const payload = z.object({ body: z.string().trim().min(2).max(1000) });

/**
 * Owner/team reply to a comment. Replies from the admin side are approved
 * immediately and carry the writer badge (XyDev for the owner, XyTeam for
 * listed collaborators).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requestHasAdminAccess(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = payload.safeParse(await request.json().catch(() => null));
  const { id } = await params;
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data: parent } = await supabase.from("comments").select("id, update_id").eq("id", id).maybeSingle();
  if (!parent) return NextResponse.json({ error: "Komentar yang dibalas tidak ditemukan." }, { status: 404 });

  const { data, error } = await supabase
    .from("comments")
    .insert({
      update_id: parent.update_id,
      parent_id: parent.id,
      author_name: identity.name,
      author_badge: identity.badge,
      body: parsed.data.body,
      status: "approved",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal menyimpan balasan." }, { status: 500 });

  return NextResponse.json({ ok: true, comment: data }, { status: 201 });
}
