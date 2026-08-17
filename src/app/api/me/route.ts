import { NextResponse } from "next/server";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Public endpoint: returns the writer's identity when they belong to the
 * owner/team, with profile data attached. The public site uses this to
 * detect admin/team sessions so the comment form can prefill profile info.
 */
export async function GET(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity) return NextResponse.json({ identity: null });

  const admin = getSupabaseAdmin();
  let profile = null;
  if (admin) {
    const { data } = await admin.from("profiles").select("*").eq("email", identity.email.toLowerCase()).maybeSingle();
    profile = data ?? null;
  }

  return NextResponse.json({ identity, profile });
}
