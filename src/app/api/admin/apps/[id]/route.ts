import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { revalidatePublicContent } from "@/lib/revalidation";
import { isConfiguredCloudinaryUrl, isSafeHttpsUrl } from "@/lib/url-validation";

const appId = z.string().uuid();
const httpsUrl = z.string().trim().refine(isSafeHttpsUrl, "URL HTTPS tidak valid.");
const cloudinaryUrl = z.string().trim().refine(isConfiguredCloudinaryUrl, "Media Cloudinary tidak valid.");
const link = z.object({ label: z.string().trim().min(1).max(30), url: httpsUrl });
const payload = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  tagline: z.string().trim().max(180).optional().nullable(),
  description: z.string().trim().max(3000).optional().nullable(),
  coverUrl: cloudinaryUrl.optional().nullable(),
  links: z.array(link).max(8).default([]),
  isPublished: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = appId.safeParse((await params).id);
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsedId.success || !parsed.success) {
    return NextResponse.json({ error: "Data aplikasi tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const input = parsed.data;
  const { data, error } = await supabase
    .from("apps")
    .update({
      name: input.name,
      slug: input.slug,
      tagline: input.tagline ?? null,
      description: input.description ?? null,
      cover_url: input.coverUrl ?? null,
      links: input.links,
      is_published: input.isPublished,
    })
    .eq("id", parsedId.data)
    .select()
    .maybeSingle();
  if (error?.code === "23505") {
    return NextResponse.json({ error: "Slug aplikasi sudah dipakai." }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: "Gagal memperbarui aplikasi." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Aplikasi tidak ditemukan." }, { status: 404 });

  revalidatePublicContent();
  return NextResponse.json(data);
}
