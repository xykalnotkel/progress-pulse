import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

const payload = z.object({
  displayName: z.string().trim().min(1).max(48).optional(),
  title: z.string().trim().max(80).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function GET(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data } = await supabase.from("profiles").select("*").eq("email", identity.email).maybeSingle();
  return NextResponse.json({
    profile: data ?? null,
    badge: identity.badge,
    isOwner: identity.isOwner,
    email: identity.email,
  });
}

export async function PUT(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data profil tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { error } = await supabase.from("profiles").upsert(
    {
      email: identity.email,
      display_name: parsed.data.displayName ?? null,
      title: parsed.data.title ?? null,
      avatar_url: parsed.data.avatarUrl ?? null,
      badge: identity.badge,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
