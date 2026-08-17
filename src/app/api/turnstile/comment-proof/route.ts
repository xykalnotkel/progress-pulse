import { NextResponse } from "next/server";
import { z } from "zod";
import { createCommentProof } from "@/lib/comment-proof";
import { verifyTurnstile } from "@/lib/turnstile";

const payload = z.object({ token: z.string().min(10).max(2048), action: z.enum(["comment", "comment_reply"]) });

export async function POST(request: Request) {
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data verifikasi tidak valid." }, { status: 400 });
  if (!await verifyTurnstile(request, parsed.data.token, parsed.data.action)) return NextResponse.json({ error: "Verifikasi gagal." }, { status: 403 });
  return NextResponse.json({ proof: createCommentProof(request, parsed.data.action) }, { headers: { "Cache-Control": "no-store" } });
}
