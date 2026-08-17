import { NextResponse } from "next/server";
import { z } from "zod";
import { detectMediaMime, declaredMimeMatches } from "@/lib/file-signature";
import { getCloudinary } from "@/lib/cloudinary";
import { optimizeMediaUrl } from "@/lib/media";
import { requestHasAdminAccess } from "@/lib/request-auth";

export const runtime = "nodejs";

const purposeSchema = z.enum(["update", "profile-avatar", "profile-banner"]);
const folders = {
  update: "progress-pulse",
  "profile-avatar": "progress-pulse/profile-avatar",
  "profile-banner": "progress-pulse/profile-banner",
} as const;
const maximumBytes = {
  update: 10 * 1024 * 1024,
  "profile-avatar": 5 * 1024 * 1024,
  "profile-banner": 8 * 1024 * 1024,
} as const;

export async function POST(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const parsedPurpose = purposeSchema.safeParse(form?.get("purpose"));
  if (!(file instanceof File) || !parsedPurpose.success) {
    return NextResponse.json({ error: "File atau tujuan upload tidak valid." }, { status: 400 });
  }

  const purpose = parsedPurpose.data;
  if (file.size < 1 || file.size > maximumBytes[purpose]) {
    return NextResponse.json({ error: "Ukuran file melewati batas upload." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectMediaMime(buffer);
  const profileUpload = purpose !== "update";
  if (
    !detectedMime ||
    !declaredMimeMatches(detectedMime, file.type) ||
    (profileUpload && !detectedMime.startsWith("image/"))
  ) {
    return NextResponse.json({ error: "Isi file tidak cocok dengan tipe media yang diizinkan." }, { status: 415 });
  }

  const cloudinary = getCloudinary();
  if (!cloudinary) {
    return NextResponse.json({ error: "Cloudinary belum dikonfigurasi." }, { status: 503 });
  }

  const dataUri = `data:${detectedMime};base64,${buffer.toString("base64")}`;
  try {
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: folders[purpose],
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
