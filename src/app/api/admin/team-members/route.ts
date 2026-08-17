import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

const email = z.string().trim().toLowerCase().email().max(120);

export async function GET(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data, error } = await supabase.from("team_members").select("email, added_at, added_by").order("added_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Gagal memuat tim." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = z.object({ email }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { error } = await supabase.from("team_members").upsert({ email: parsed.data.email, added_by: identity.email }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: "Gagal menambah anggota tim." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const parsed = email.safeParse(url.searchParams.get("email"));
  if (!parsed.success) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { error } = await supabase.from("team_members").delete().eq("email", parsed.data);
  if (error) return NextResponse.json({ error: "Gagal menghapus anggota tim." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
