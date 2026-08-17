import { NextResponse } from "next/server";
import { hasValidIngestToken } from "@/lib/auth";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { createUploadSignature } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const allowed = hasValidIngestToken(request) || await requestHasAdminAccess(request);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const signature = createUploadSignature("progress-pulse");
  if (!signature) return NextResponse.json({ error: "Cloudinary belum dikonfigurasi." }, { status: 503 });
  return NextResponse.json(signature);
}
