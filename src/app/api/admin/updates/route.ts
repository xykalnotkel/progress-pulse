import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

/** Owner-only listing of every progress update with app name + contributor count. */
export async function GET(request: Request) {
  const identity = await requestHasAdminAccess(request);
  if (!identity || !identity.isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data, error } = await supabase
    .from("progress_updates")
    .select("id, title, status, version, is_published, created_at, contributors, app:apps(id, name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "Gagal memuat daftar update." }, { status: 500 });
  return NextResponse.json(data ?? []);
}
