import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";

export async function GET(request: Request) {
  if (!(await requestHasAdminAccess(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = new URL(request.url).searchParams.get("status") ?? "pending";
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const { data, error } = await supabase
    .from("comments")
    .select("id, update_id, parent_id, author_name, author_badge, author_avatar, body, status, created_at, moderated_at, moderated_by, update:progress_updates(id, title, app:apps(name))")
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Gagal memuat komentar." }, { status: 500 });
  return NextResponse.json(data ?? []);
}
