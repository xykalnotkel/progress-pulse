import { timingSafeEqual } from "crypto";
import type { AuthorBadge } from "@/lib/types";

export function isAdminEmail(email?: string | null) {
  return Boolean(email && process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase());
}

/**
 * Resolve the comment badge for an authenticated writer:
 * - the owner (ADMIN_EMAIL) writes as XyDev
 * - collaborators listed in TEAM_EMAILS (comma separated) write as XyTeam
 * - everyone else has no badge
 */
export function getBadgeForEmail(email?: string | null): AuthorBadge | null {
  if (isAdminEmail(email)) return "XyDev";
  const teamList = (process.env.TEAM_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (email && teamList.includes(email.toLowerCase())) return "XyTeam";
  return null;
}

export function hasValidIngestToken(request: Request) {
  const expected = process.env.AI_INGEST_TOKEN;
  const header = request.headers.get("authorization");
  if (!expected || !header?.startsWith("Bearer ")) return false;

  const received = header.slice(7);
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
