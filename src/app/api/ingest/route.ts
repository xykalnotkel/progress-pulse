import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeApiRateLimit } from "@/lib/abuse";
import { hasValidIngestToken } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { optimizeMediaList } from "@/lib/media";
import { isConfiguredCloudinaryUrl, isSafeHttpsUrl } from "@/lib/url-validation";

const httpsUrl = z.string().trim().refine(isSafeHttpsUrl, "URL HTTPS tidak valid.");
const cloudinaryUrl = z.string().trim().refine(isConfiguredCloudinaryUrl, "Media Cloudinary tidak valid.");
const link = z.object({ label: z.string().trim().min(1).max(30), url: httpsUrl });
const createApp = z.object({ action: z.literal("create_app"), name: z.string().trim().min(1).max(80), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), tagline: z.string().trim().max(180).optional(), description: z.string().trim().max(3000).optional(), coverUrl: cloudinaryUrl.optional(), links: z.array(link).max(8).default([]), isPublished: z.boolean().default(true) });
const createUpdate = z.object({ action: z.literal("create_update"), appSlug: z.string().trim().toLowerCase().min(1).max(80), title: z.string().trim().min(1).max(160), description: z.string().trim().max(5000).optional(), status: z.enum(["planning", "building", "testing", "shipped"]).default("building"), version: z.string().trim().max(40).optional(), media: z.array(cloudinaryUrl).max(12).default([]), isPublished: z.boolean().default(true) });
const draftCopy = z.object({ action: z.literal("draft_copy"), appName: z.string().trim().min(1).max(80), context: z.string().trim().min(8).max(6000), tone: z.string().trim().max(80).default("confident, concise, warm") });
const schema = z.discriminatedUnion("action", [createApp, createUpdate, draftCopy]);

async function getDraft(input: z.infer<typeof draftCopy>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY belum dikonfigurasi.");
  const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: "You create Indonesian product progress updates. Respond only as JSON with title (max 100 chars), description (max 500 chars), status (planning|building|testing|shipped), and version (optional)." }, { role: "user", content: `App: ${input.appName}\nTone: ${input.tone}\nNotes: ${input.context}` }] }) });
  if (!response.ok) throw new Error("Provider AI menolak permintaan draft.");
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

export async function POST(request: Request) {
  if (!hasValidIngestToken(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Payload tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  try {
    const allowed = await consumeApiRateLimit(supabase, request, {
      action: "ai_ingest",
      limit: 60,
      windowSeconds: 600,
    });
    if (!allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "Proteksi API belum siap." }, { status: 503 });
  }

  if (input.action === "draft_copy") {
    try { return NextResponse.json({ draft: await getDraft(input) }); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal membuat draft." }, { status: 503 }); }
  }

  if (input.action === "create_app") {
    const { data, error } = await supabase.from("apps").insert({ name: input.name, slug: input.slug, tagline: input.tagline ?? null, description: input.description ?? null, cover_url: input.coverUrl ?? null, links: input.links, is_published: input.isPublished }).select().single();
    if (error) return NextResponse.json({ error: error.code === "23505" ? "Slug aplikasi sudah dipakai." : "Gagal membuat aplikasi." }, { status: 400 });
    return NextResponse.json({ ok: true, app: data }, { status: 201 });
  }

  const { data: app } = await supabase.from("apps").select("id,slug").eq("slug", input.appSlug).single();
  if (!app) return NextResponse.json({ error: "Aplikasi dengan appSlug tersebut tidak ditemukan." }, { status: 404 });
  const { data, error } = await supabase.from("progress_updates").insert({ app_id: app.id, title: input.title, description: input.description ?? null, status: input.status, version: input.version ?? null, media: optimizeMediaList(input.media), is_published: input.isPublished }).select().single();
  if (error) return NextResponse.json({ error: "Gagal membuat update." }, { status: 400 });
  return NextResponse.json({ ok: true, update: data }, { status: 201 });
}
