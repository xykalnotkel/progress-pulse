import { getSupabasePublic, getSupabaseAdmin } from "@/lib/supabase";
import { getBadgeForEmail, isAdminEmail } from "@/lib/auth";
import type { AuthorBadge } from "@/lib/types";

export type AdminIdentity = { email: string; badge: AuthorBadge; name: string; isOwner: boolean; avatar: string | null };

function displayName(user: { email?: string; user_metadata?: Record<string, unknown> }): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim().slice(0, 48);
  const fallback = user.email?.split("@")[0] ?? "Tim";
  return fallback.slice(0, 48) || "Tim";
}

export async function requestHasAdminAccess(request: Request): Promise<AdminIdentity | false> {
  const supabase = getSupabasePublic();
  const header = request.headers.get("authorization");
  if (!supabase || !header?.startsWith("Bearer ")) return false;

  const { data, error } = await supabase.auth.getUser(header.slice(7));
  if (error) return false;

  const email = data.user?.email;
  if (!email) return false;

  const isOwner = isAdminEmail(email);
  let badge: AuthorBadge | null = isOwner ? "XyDev" : null;
  if (!badge) {
    const admin = getSupabaseAdmin();
    try {
      let tm: { email: string } | null = null;
      if (admin) {
        const { data } = await admin.from("team_members").select("email").eq("email", email.toLowerCase()).maybeSingle();
        tm = data ?? null;
      }
      if (tm?.email) badge = "XyTeam";
    } catch {
      badge = getBadgeForEmail(email); // env fallback
    }
  }

  if (!badge) return false;

  let avatar: string | null = null;
  const admin = getSupabaseAdmin();
  try {
    if (admin) {
      const { data } = await admin.from("profiles").select("avatar_url").eq("email", email.toLowerCase()).maybeSingle();
      avatar = data?.avatar_url ?? null;
    }
  } catch {
    // non-fatal
  }

  return {
    email,
    badge,
    name: displayName(data.user as { email?: string; user_metadata?: Record<string, unknown> }),
    isOwner,
    avatar,
  };
}
