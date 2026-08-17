"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CloudUpload, ExternalLink, FilePlus2, Layers3, LogOut, Plus, RefreshCw, Sparkles, Upload, WandSparkles } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Project, UpdateStatus } from "@/lib/types";

type Notice = { kind: "success" | "error"; text: string } | null;
const blankApp = { name: "", slug: "", tagline: "", description: "", website: "" };
const blankUpdate = { appId: "", title: "", description: "", status: "building" as UpdateStatus, version: "", media: "" };

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function AdminPage() {
  const [apps, setApps] = useState<Project[]>([]);
  const [appForm, setAppForm] = useState(blankApp);
  const [updateForm, setUpdateForm] = useState(blankUpdate);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"app" | "update" | "upload" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const selectedApp = useMemo(() => apps.find((app) => app.id === updateForm.appId), [apps, updateForm.appId]);

  useEffect(() => {
    async function initialize() {
      const supabase = getSupabaseBrowser();
      if (!supabase) { setLoading(false); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { window.location.replace("/login"); return; }
      setToken(sessionData.session.access_token);
      setEmail(sessionData.session.user.email ?? null);
      const { data } = await supabase.from("apps").select("*").order("created_at", { ascending: false });
      const rows = (data ?? []) as Project[];
      setApps(rows);
      if (rows[0]) setUpdateForm((current) => ({ ...current, appId: rows[0].id }));
      setLoading(false);
    }
    initialize();
  }, []);

  async function api(path: string, body: unknown) {
    if (!token) throw new Error("Sesi admin tidak ditemukan.");
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "Terjadi masalah pada server.");
    return data;
  }

  async function createApp(event: FormEvent) {
    event.preventDefault(); setNotice(null); setSaving("app");
    try {
      const app = await api("/api/admin/apps", { name: appForm.name, slug: appForm.slug, tagline: appForm.tagline || null, description: appForm.description || null, links: appForm.website ? [{ label: "Open app", url: appForm.website }] : [] });
      setApps((items) => [app, ...items]);
      setUpdateForm((current) => ({ ...current, appId: app.id }));
      setAppForm(blankApp); setNotice({ kind: "success", text: "Aplikasi baru sudah dibuat." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal membuat aplikasi." }); }
    finally { setSaving(null); }
  }

  async function createUpdate(event: FormEvent) {
    event.preventDefault(); setNotice(null); setSaving("update");
    try {
      await api("/api/admin/updates", { appId: updateForm.appId, title: updateForm.title, description: updateForm.description || null, status: updateForm.status, version: updateForm.version || null, media: updateForm.media ? [updateForm.media] : [] });
      setUpdateForm((current) => ({ ...blankUpdate, appId: current.appId }));
      setNotice({ kind: "success", text: "Update dipublikasikan. Tanggal dibuat otomatis oleh server." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal menyimpan update." }); }
    finally { setSaving(null); }
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setNotice(null); setSaving("upload");
    try {
      const signResponse = await fetch("/api/media/signature", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new Error(signed.error ?? "Tidak bisa menyiapkan upload.");
      const form = new FormData();
      form.append("file", file); form.append("api_key", signed.apiKey); form.append("timestamp", String(signed.timestamp)); form.append("signature", signed.signature); form.append("folder", signed.folder);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`, { method: "POST", body: form });
      const uploaded = await response.json();
      if (!response.ok) throw new Error(uploaded.error?.message ?? "Upload Cloudinary gagal.");
      setUpdateForm((current) => ({ ...current, media: uploaded.secure_url }));
      setNotice({ kind: "success", text: "Media berhasil masuk ke Cloudinary." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Upload gagal." }); }
    finally { setSaving(null); event.target.value = ""; }
  }

  async function signOut() { const supabase = getSupabaseBrowser(); await supabase?.auth.signOut(); window.location.replace("/"); }

  if (loading) return <main className="admin-page admin-loading"><RefreshCw className="spin" size={19} /> Memuat dashboard aman...</main>;
  if (!token) return <main className="admin-page admin-loading"><p>Supabase belum tersambung.</p><a href="/login">Ke halaman login</a></main>;

  return <main className="admin-page"><header className="admin-top"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Lihat situs</Link><div className="admin-title"><span className="admin-sphere" /> pulse<span>.</span> / control room</div><div className="admin-user"><span>{email ?? "Admin"}</span><button onClick={signOut}><LogOut size={15} /> Keluar</button></div></header><div className="admin-layout"><aside className="admin-side"><div className="admin-label">CONTROL ROOM</div><a className="admin-nav-active" href="#new-update"><FilePlus2 size={16} /> Post update</a><a href="#new-app"><Layers3 size={16} /> Kelola aplikasi <span>{apps.length}</span></a><a href="/api/ingest/schema" target="_blank"><WandSparkles size={16} /> AI integration <ExternalLink size={13} /></a><div className="admin-tip"><Sparkles size={17} /><p><b>Tip singkat</b>Setiap post memakai waktu server secara otomatis—tidak bisa dimanipulasi oleh AI atau browser.</p></div></aside><section className="admin-content"><div className="admin-intro"><div><p className="admin-kicker">GOOD TO SEE YOU</p><h1>Keep the signal moving.</h1><p>Tambah aplikasi baru, upload preview ke Cloudinary, lalu catat progresnya dalam satu tempat.</p></div><div className="admin-stats"><div><b>{apps.length}</b><span>apps live</span></div><div><b>auto</b><span>server dates</span></div></div></div>{notice && <div className={`admin-notice ${notice.kind}`}><CheckCircle2 size={17} />{notice.text}</div>}<div className="admin-panels"><form className="admin-panel update-panel" id="new-update" onSubmit={createUpdate}><div className="panel-heading"><div><p className="admin-kicker">NEW PROGRESS LOG</p><h2>Publish an update</h2></div><span><span className="small-live" /> public</span></div><label>Untuk aplikasi<select required value={updateForm.appId} onChange={(e) => setUpdateForm({ ...updateForm, appId: e.target.value })}><option value="" disabled>Pilih aplikasi</option>{apps.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}</select></label><div className="form-row"><label>Judul update<input required maxLength={160} placeholder="Contoh: Dashboard baru siap diuji" value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} /></label><label>Versi <input maxLength={40} placeholder="v0.8.0" value={updateForm.version} onChange={(e) => setUpdateForm({ ...updateForm, version: e.target.value })} /></label></div><label>Deskripsi<textarea maxLength={5000} required placeholder="Apa yang berubah? Ceritakan konteks singkatnya..." value={updateForm.description} onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })} /></label><div className="form-row"><label>Status<select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as UpdateStatus })}><option value="planning">Planning</option><option value="building">Building</option><option value="testing">Testing</option><option value="shipped">Shipped</option></select></label><label>Media Cloudinary<div className="upload-inline"><input className="url-input" placeholder="URL media atau upload" value={updateForm.media} onChange={(e) => setUpdateForm({ ...updateForm, media: e.target.value })} /><label className="upload-button"><Upload size={14} /><input type="file" accept="image/*,video/*" onChange={uploadMedia} />{saving === "upload" ? "..." : "Upload"}</label></div></label></div>{updateForm.media && <div className="media-ready"><CloudUpload size={14} /> Preview media siap untuk {selectedApp?.name ?? "aplikasi"}</div>}<button className="publish-button" disabled={saving !== null || !apps.length} type="submit">{saving === "update" ? "Menerbitkan..." : <><Plus size={17} /> Publish update</>}</button></form><form className="admin-panel app-panel" id="new-app" onSubmit={createApp}><div className="panel-heading"><div><p className="admin-kicker">YOUR ECOSYSTEM</p><h2>Add an app</h2></div><span className="panel-number">0{apps.length + 1}</span></div><label>Nama aplikasi<input required maxLength={80} placeholder="Contoh: Orbit" value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value, slug: appForm.slug || slugify(e.target.value) })} /></label><label>Slug (untuk AI & link)<input required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="orbit" value={appForm.slug} onChange={(e) => setAppForm({ ...appForm, slug: slugify(e.target.value) })} /></label><label>Tagline<input maxLength={180} placeholder="A one-line promise" value={appForm.tagline} onChange={(e) => setAppForm({ ...appForm, tagline: e.target.value })} /></label><label>Link aplikasi<input type="url" placeholder="https://..." value={appForm.website} onChange={(e) => setAppForm({ ...appForm, website: e.target.value })} /></label><label>Catatan / deskripsi<textarea maxLength={3000} placeholder="Deskripsi singkat aplikasi" value={appForm.description} onChange={(e) => setAppForm({ ...appForm, description: e.target.value })} /></label><button className="outline-submit" disabled={saving !== null} type="submit">{saving === "app" ? "Menyimpan..." : <><Plus size={16} /> Tambahkan aplikasi</>}</button><div className="app-list"><p>APPS YANG SUDAH ADA</p>{apps.length ? apps.map((app) => <div key={app.id}><span>{app.name.slice(0,1)}</span><b>{app.name}</b><code>/{app.slug}</code></div>) : <small>Belum ada aplikasi. Buat yang pertama di sini.</small>}</div></form></div><section className="ai-callout"><div className="ai-spark"><WandSparkles size={21} /></div><div><p className="admin-kicker">AUTOMATION READY</p><h3>Give your AI a secure publishing lane.</h3><p>AI dapat membuat draft copy, upload file media, membuat aplikasi, dan mem-post update lewat token server khusus. Token tidak pernah dibuka ke publik.</p></div><a href="/api/ingest/schema" target="_blank">Lihat API schema <ExternalLink size={15} /></a></section></section></div></main>;
}
