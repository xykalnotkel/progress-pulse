import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { getClientIp } from "@/lib/abuse";

type Action = "comment" | "comment_reply";
type Payload = { action: Action; exp: number; ip: string };

function key() {
  const secret = process.env.ABUSE_HASH_SECRET;
  if (!secret) throw new Error("Missing proof secret");
  return secret;
}
function ipDigest(request: Request) { return createHmac("sha256", key()).update(`comment-proof-ip\0${getClientIp(request)}`).digest("hex"); }
function sign(encoded: string) { return createHmac("sha256", key()).update(encoded).digest("base64url"); }

export function createCommentProof(request: Request, action: Action) {
  const payload: Payload = { action, exp: Date.now() + 5 * 60_000, ip: ipDigest(request) };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyCommentProof(request: Request, proof: string | undefined, action: Action) {
  if (!proof || proof.length > 1000) return false;
  try {
    const [encoded, signature] = proof.split(".");
    if (!encoded || !signature) return false;
    const expected = Buffer.from(sign(encoded)); const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Payload;
    return payload.action === action && payload.exp >= Date.now() && payload.ip === ipDigest(request);
  } catch { return false; }
}
