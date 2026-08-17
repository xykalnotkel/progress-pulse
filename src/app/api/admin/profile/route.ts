import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { isConfiguredCloudinaryUrl, isSafeHttpsUrl } from "@/lib/url-validation";

const httpsUrl = z.string().trim().refine(isSafeHttpsUrl, "URL HTTPS tidak valid.");
const cloudinaryUrl = z.string().trim().refine(isConfiguredCloudinaryUrl, "Media Cloudinary tidak valid.");
const link = z.object({ label: z.string().trim().min(1).max(24), url: httpsUrl });
const payload = z.object({
  displayName: z.string().trim().min(1).max(48).optional(),
  title: z.string().trim().max(80).optional().nullable(),
  avatarUrl: cloudinaryUrl.optional().nullable(),
  bannerUrl: cloudinaryUrl.optional().nullable(),
  bio: z.string().trim().max(240).optional().nullable(),
  links: z.array(link).max(6).optional(),
});

export async function GET(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data } = await supabase.from("profiles").select("*").eq("email", identity.email.toLowerCase()).maybeSingle();
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

  const update: Record<string, unknown> = { updated_at: new Date().toISOString(), badge: identity.badge, email: identity.email.toLowerCase() };
  if (parsed.data.displayName !== undefined) update.display_name = parsed.data.displayName;
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.avatarUrl !== undefined) update.avatar_url = parsed.data.avatarUrl;
  if (parsed.data.bannerUrl !== undefined) update.banner_url = parsed.data.bannerUrl;
  if (parsed.data.bio !== undefined) update.bio = parsed.data.bio;
  if (parsed.data.links !== undefined) update.links = parsed.data.links;

  const { error } = await supabase.from("profiles").upsert(update, { onConflict: "email" });
  if (error) return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
