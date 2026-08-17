import { NextResponse } from "next/server";
import { z } from "zod";
import { hasValidIngestToken } from "@/lib/auth";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { createUploadSignature } from "@/lib/cloudinary";

const payload = z.object({
  purpose: z.enum(["update", "profile-avatar", "profile-banner"]).default("update"),
});

const folders = {
  update: "progress-pulse",
  "profile-avatar": "progress-pulse/profile-avatar",
  "profile-banner": "progress-pulse/profile-banner",
} as const;

export async function POST(request: Request) {
  const allowed = hasValidIngestToken(request) || (await requestHasAdminAccess(request));
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = payload.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tujuan upload tidak valid." }, { status: 400 });
  }

  const signature = createUploadSignature(folders[parsed.data.purpose]);
  if (!signature) {
    return NextResponse.json({ error: "Cloudinary belum dikonfigurasi." }, { status: 503 });
  }

  return NextResponse.json(signature);
}
