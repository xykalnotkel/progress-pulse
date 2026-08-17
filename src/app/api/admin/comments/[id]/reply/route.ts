import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

const payload = z.object({ body: z.string().trim().min(2).max(1000) });

/**
 * Owner/team reply to a comment. Replies appear instantly and carry the
 * writer badge (XyDev for the owner, XyTeam for listed collaborators).
 * The display name and avatar come from the writer's custom profile when set.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requestHasAdminAccess(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = payload.safeParse(await request.json().catch(() => null));
  const { id } = await params;
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data: parent } = await supabase
    .from("comments")
    .select("id, update_id, parent_id")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (!parent || parent.parent_id !== null) {
    return NextResponse.json({ error: "Komentar yang dibalas tidak ditemukan." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, title, avatar_url")
    .eq("email", identity.email)
    .maybeSingle();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      update_id: parent.update_id,
      parent_id: parent.id,
      author_name: profile?.display_name || identity.name,
      author_badge: identity.badge,
      author_avatar: profile?.avatar_url ?? null,
      author_title: profile?.title ?? null,
      body: parsed.data.body,
      status: "approved",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal menyimpan balasan." }, { status: 500 });

  return NextResponse.json({ ok: true, comment: data }, { status: 201 });
}
