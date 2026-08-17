import { getSupabasePublic } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/auth";

/**
 * Returns the authenticated admin email, or `false` when the request does not
 * belong to the owner. Callers treat `false` as "unauthorized".
 */
export async function requestHasAdminAccess(request: Request): Promise<string | false> {
  const supabase = getSupabasePublic();
  const header = request.headers.get("authorization");
  if (!supabase || !header?.startsWith("Bearer ")) return false;

  const { data, error } = await supabase.auth.getUser(header.slice(7));
  if (error) return false;
  return isAdminEmail(data.user?.email) ? (data.user!.email as string) : false;
}
