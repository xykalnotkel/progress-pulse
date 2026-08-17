import { getSupabasePublic } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/auth";

export async function requestHasAdminAccess(request: Request) {
  const supabase = getSupabasePublic();
  const header = request.headers.get("authorization");
  if (!supabase || !header?.startsWith("Bearer ")) return false;

  const { data, error } = await supabase.auth.getUser(header.slice(7));
  return !error && isAdminEmail(data.user?.email);
}
