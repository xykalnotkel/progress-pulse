import { after, NextResponse } from "next/server";
import { z } from "zod";
import { consumeApiRateLimit } from "@/lib/abuse";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestHasAdminAccess } from "@/lib/request-auth";
import { revalidatePublicContent } from "@/lib/revalidation";
import { verifyTurnstile } from "@/lib/turnstile";
import { verifyCommentProof } from "@/lib/comment-proof";

const payload = z.object({
  updateId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
  authorName: z.string().trim().max(48),
  body: z.string().trim().min(2).max(1000),
  visitorId: z.string().uuid(),
  turnstileToken: z.string().max(2048).optional(),
  turnstileProof: z.string().max(1000).optional(),
  website: z.literal("").optional(),
});

const banned = ["viagra", "casino", "slot gacor", "crypto giveaway"];

export async function POST(request: Request) {
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data komentar tidak valid." }, { status: 400 });
  }
  if (banned.some((word) => parsed.data.body.toLowerCase().includes(word))) {
    return NextResponse.json({ error: "Komentar tidak dapat dikirim." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const action = parsed.data.parentId ? "comment_reply" : "comment";
  const hasBearer = request.headers.get("authorization")?.startsWith("Bearer ") ?? false;
  const proofValid = verifyCommentProof(request, parsed.data.turnstileProof, action);
  const limiterPromise = consumeApiRateLimit(supabase, request, { action: "comment", limit: 5, windowSeconds: 600 });
  const identityPromise = requestHasAdminAccess(request);
  const humanPromise = proofValid || hasBearer ? Promise.resolve<boolean | null>(proofValid ? true : null) : verifyTurnstile(request, parsed.data.turnstileToken, action);
  const updatePromise = supabase.from("progress_updates").select("id").eq("id", parsed.data.updateId).or(`is_published.eq.true,scheduled_for.lte.${new Date().toISOString()}`).maybeSingle();
  const parentPromise = parsed.data.parentId
    ? supabase.from("comments").select("id,update_id,parent_id").eq("id", parsed.data.parentId).eq("status", "approved").maybeSingle()
    : Promise.resolve({ data: null, error: null });

  let allowed: boolean;
  let identity: Awaited<ReturnType<typeof requestHasAdminAccess>>;
  let human: boolean | null;
  let updateResult: Awaited<typeof updatePromise>;
  let parentResult: Awaited<typeof parentPromise>;
  try {
    [allowed, identity, human, updateResult, parentResult] = await Promise.all([limiterPromise, identityPromise, humanPromise, updatePromise, parentPromise]);
  } catch {
    return NextResponse.json({ error: "Proteksi anti-spam belum siap." }, { status: 503 });
  }
  if (!allowed) return NextResponse.json({ error: "Terlalu banyak komentar. Coba lagi beberapa menit lagi." }, { status: 429 });
  if (!identity) {
    const verified = human ?? await verifyTurnstile(request, parsed.data.turnstileToken, action);
    if (!verified) return NextResponse.json({ error: "Verifikasi anti-bot gagal." }, { status: 403 });
  }
  if (!updateResult.data) return NextResponse.json({ error: "Update tidak ditemukan." }, { status: 404 });
  if (parsed.data.parentId) {
    const parent = parentResult.data;
    if (!parent || parent.update_id !== parsed.data.updateId || parent.parent_id !== null) return NextResponse.json({ error: "Komentar yang dibalas tidak ditemukan." }, { status: 404 });
  }

  // Authenticated owner/team comments use the protected profile. Typed names
  // are only accepted for anonymous visitors.
  let authorName = parsed.data.authorName;
  let authorBadge: string | null = null;
  let authorAvatar: string | null = null;
  let authorTitle: string | null = null;
  if (!identity && authorName.length < 2) {
    return NextResponse.json({ error: "Nama komentar tidak valid." }, { status: 400 });
  }
  if (identity) {
    authorName = identity.name;
    authorBadge = identity.badge;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, title, avatar_url")
      .eq("email", identity.email.toLowerCase())
      .maybeSingle();
    if (profile?.display_name) authorName = profile.display_name;
    authorAvatar = profile?.avatar_url ?? identity.avatar;
    authorTitle = profile?.title ?? null;
  }

  const { error } = await supabase.from("comments").insert({
    update_id: parsed.data.updateId,
    parent_id: parsed.data.parentId ?? null,
    author_name: authorName,
    body: parsed.data.body,
    status: "approved",
    author_badge: authorBadge,
    author_avatar: authorAvatar,
    author_title: authorTitle,
  });
  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan komentar." }, { status: 500 });
  }

  after(() => revalidatePublicContent(parsed.data.updateId));
  return NextResponse.json(
    { ok: true, identity: identity ? { badge: identity.badge, name: authorName } : null },
    { status: 201 },
  );
}
