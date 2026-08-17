import { NextResponse } from "next/server";
import { consumeApiRateLimit } from "@/lib/abuse";
import { hasValidIngestToken } from "@/lib/auth";
import { getCloudinary } from "@/lib/cloudinary";
import { detectMediaMime, declaredMimeMatches } from "@/lib/file-signature";
import { optimizeMediaUrl } from "@/lib/media";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasValidIngestToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  try {
    const allowed = await consumeApiRateLimit(supabase, request, {
      action: "ai_upload",
      limit: 20,
      windowSeconds: 600,
    });
    if (!allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "Proteksi API belum siap." }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const appSlug = String(form?.get("appSlug") ?? "general")
    .replace(/[^a-z0-9-]/gi, "")
    .slice(0, 60) || "general";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Field file wajib diisi." }, { status: 400 });
  }
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Maksimal file 10MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectMediaMime(buffer);
  if (!detectedMime || !declaredMimeMatches(detectedMime, file.type)) {
    return NextResponse.json(
      { error: "Isi file tidak cocok dengan tipe media yang diizinkan." },
      { status: 415 },
    );
  }

  const cloudinary = getCloudinary();
  if (!cloudinary) {
    return NextResponse.json({ error: "Cloudinary belum dikonfigurasi." }, { status: 503 });
  }

  const dataUri = `data:${detectedMime};base64,${buffer.toString("base64")}`;
  try {
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: `progress-pulse/${appSlug}`,
      resource_type: "auto",
    });
    return NextResponse.json(
      {
        ok: true,
        url: optimizeMediaUrl(uploaded.secure_url),
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
        width: uploaded.width,
        height: uploaded.height,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Upload Cloudinary gagal." }, { status: 502 });
  }
}
