import { getSupabasePublic } from "@/lib/supabase";
import { getBadgeForEmail, isAdminEmail } from "@/lib/auth";
import type { AuthorBadge } from "@/lib/types";

export type AdminIdentity = { email: string; badge: AuthorBadge; name: string; isOwner: boolean };

function displayName(user: { email?: string; user_metadata?: Record<string, unknown> }): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim().slice(0, 48);
  const fallback = user.email?.split("@")[0] ?? "Tim";
  return fallback.slice(0, 48) || "Tim";
}

/**
 * Returns the authenticated writer identity (email, comment badge, display
 * name) when the request belongs to the owner or a listed team member,
 * or `false` otherwise.
 */
export async function requestHasAdminAccess(request: Request): Promise<AdminIdentity | false> {
  const supabase = getSupabasePublic();
  const header = request.headers.get("authorization");
  if (!supabase || !header?.startsWith("Bearer ")) return false;

  const { data, error } = await supabase.auth.getUser(header.slice(7));
  if (error) return false;

  const email = data.user?.email;
  const badge = getBadgeForEmail(email);
  if (!email || !badge) return false;

  return { email, badge, name: displayName(data.user as { email?: string; user_metadata?: Record<string, unknown> }), isOwner: isAdminEmail(email) };
}
