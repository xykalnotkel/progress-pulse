import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { optimizeMediaList } from "@/lib/media";
import { isConfiguredCloudinaryUrl } from "@/lib/url-validation";

const cloudinaryUrl = z.string().trim().refine(isConfiguredCloudinaryUrl, "Media Cloudinary tidak valid.");
const payload = z.object({
  appId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(["planning", "building", "testing", "shipped"]),
  version: z.string().trim().max(40).optional().nullable(),
  media: z.array(cloudinaryUrl).max(12).default([]),
  isPublished: z.boolean().default(true),
  contributors: z.array(z.string().trim().toLowerCase().email()).max(8).optional().default([]),
});

/** Create a progress update from the authenticated control room. */
export async function POST(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data update tidak valid.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const input = parsed.data;
  const { data, error } = await supabase
    .from("progress_updates")
    .insert({
      app_id: input.appId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      version: input.version ?? null,
      media: optimizeMediaList(input.media),
      is_published: input.isPublished,
      contributors: input.contributors,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan update." }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

/** Owner-only listing of every progress update with app and contributor data. */
export async function GET(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("progress_updates")
    .select("id, title, status, version, is_published, created_at, contributors, app:apps(id, name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Gagal memuat daftar update." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
