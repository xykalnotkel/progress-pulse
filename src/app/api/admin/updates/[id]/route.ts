import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { revalidatePublicContent } from "@/lib/revalidation";
import { optimizeMediaList } from "@/lib/media";
import { isConfiguredCloudinaryUrl } from "@/lib/url-validation";

const updateId = z.string().uuid();
const cloudinaryUrl = z.string().trim().refine(isConfiguredCloudinaryUrl, "Media Cloudinary tidak valid.");
const payload = z.object({
  appId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(["planning", "building", "testing", "shipped"]),
  version: z.string().trim().max(40).optional().nullable(),
  media: z.array(cloudinaryUrl).max(12).default([]),
  isPublished: z.boolean(),
  contributors: z.array(z.string().trim().toLowerCase().email()).max(8).default([]),
  tags: z.array(z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).max(10).default([]),
  scheduledFor: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = updateId.safeParse((await params).id);
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsedId.success || !parsed.success) {
    return NextResponse.json({ error: "Data update tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const input = parsed.data;
  const { data, error } = await supabase
    .from("progress_updates")
    .update({
      app_id: input.appId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      version: input.version ?? null,
      media: optimizeMediaList(input.media),
      is_published: input.scheduledFor ? false : input.isPublished,
      contributors: input.contributors,
      tags: input.tags,
      scheduled_for: input.scheduledFor ?? null,
    })
    .eq("id", parsedId.data)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Gagal memperbarui update." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Update tidak ditemukan." }, { status: 404 });

  revalidatePublicContent(parsedId.data);
  return NextResponse.json(data);
}

/** Delete an update and its dependent comments, likes, and reactions. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateId.safeParse((await params).id);
  if (!parsed.success) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const { error } = await supabase.from("progress_updates").delete().eq("id", parsed.data);
  if (error) return NextResponse.json({ error: "Gagal menghapus update." }, { status: 400 });

  revalidatePublicContent(parsed.data);
  return NextResponse.json({ ok: true });
}
