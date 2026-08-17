import { NextResponse } from "next/server";
import { hasValidIngestToken } from "@/lib/auth";
import { getCloudinary } from "@/lib/cloudinary";
import { optimizeMediaUrl } from "@/lib/media";

export const runtime = "nodejs";

// Only these media types may enter the public library. Rejecting SVG prevents
// stored-XSS risk, and the allowlist keeps the public feed to real previews.
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request) {
  if (!hasValidIngestToken(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const appSlug = String(form?.get("appSlug") ?? "general").replace(/[^a-z0-9-]/gi, "").slice(0, 60) || "general";
  if (!(file instanceof File)) return NextResponse.json({ error: "Field file wajib diisi." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Maksimal file 10MB." }, { status: 413 });
  if (!ALLOWED_MIME_TYPES.has(file.type))
    return NextResponse.json({ error: "Tipe file tidak diizinkan. Gunakan PNG, JPEG, WebP, GIF, atau MP4/WebM/MOV." }, { status: 415 });

  const cloudinary = getCloudinary();
  if (!cloudinary) return NextResponse.json({ error: "Cloudinary belum dikonfigurasi." }, { status: 503 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
  try {
    const uploaded = await cloudinary.uploader.upload(dataUri, { folder: `progress-pulse/${appSlug}`, resource_type: "auto" });
    return NextResponse.json({ ok: true, url: optimizeMediaUrl(uploaded.secure_url), publicId: uploaded.public_id, resourceType: uploaded.resource_type, width: uploaded.width, height: uploaded.height }, { status: 201 });
  } catch { return NextResponse.json({ error: "Upload Cloudinary gagal." }, { status: 502 }); }
}
