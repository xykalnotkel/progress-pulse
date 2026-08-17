"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  FilePlus2,
  Layers3,
  LogOut,
  MessageSquareText,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Comment, Project, UpdateStatus } from "@/lib/types";

type Notice = { kind: "success" | "error"; text: string } | null;
type PendingComment = Comment & { update?: { id: string; title: string; app?: { name: string } | null } | null };

const blankApp = { name: "", slug: "", tagline: "", description: "", website: "" };
const blankUpdate = { appId: "", title: "", description: "", status: "building" as UpdateStatus, version: "", media: "" };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function AdminPage() {
  const [apps, setApps] = useState<Project[]>([]);
  const [appForm, setAppForm] = useState(blankApp);
  const [updateForm, setUpdateForm] = useState(blankUpdate);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"app" | "update" | "upload" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pendingComments, setPendingComments] = useState<PendingComment[] | null>(null);
  const [approvedComments, setApprovedComments] = useState<PendingComment[] | null>(null);
  const [commentTab, setCommentTab] = useState<"pending" | "approved">("pending");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState<string | null>(null);

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

  const fetchComments = useCallback(async (status: "pending" | "approved"): Promise<PendingComment[]> => {
    if (!token) return [];
    try {
      const response = await fetch(`/api/admin/comments?status=${status}`, { headers: { Authorization: `Bearer ${token}` } });
      return response.ok ? ((await response.json()) as PendingComment[]) : [];
    } catch {
      return [];
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    async function load() {
      setPendingComments(await fetchComments("pending"));
    }
    load();
  }, [fetchComments, token]);

  useEffect(() => {
    if (!token || commentTab !== "approved") return;
    async function load() {
      setApprovedComments(await fetchComments("approved"));
    }
    load();
  }, [fetchComments, commentTab, token]);

  async function moderateComment(id: string, status: "approved" | "rejected") {
    if (!token) return;
    setModeratingId(id);
    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal memoderasi komentar.");
      }
      setPendingComments((list) => (list ?? []).filter((comment) => comment.id !== id));
      if (status === "approved" && commentTab === "approved") setApprovedComments(await fetchComments("approved"));
      setNotice({ kind: "success", text: status === "approved" ? "Komentar disetujui dan langsung tampil publik." : "Komentar ditolak." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal memoderasi komentar." });
    } finally {
      setModeratingId(null);
    }
  }

  async function createApp(event: FormEvent) {
    event.preventDefault(); setNotice(null); setSaving("app");
    try {
      const response = await fetch("/api/admin/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ name: appForm.name, slug: appForm.slug, tagline: appForm.tagline || null, description: appForm.description || null, links: appForm.website ? [{ label: "Open app", url: appForm.website }] : [] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Gagal membuat aplikasi.");
      const app = data as Project;
      setApps((items) => [app, ...items]);
      setUpdateForm((current) => ({ ...current, appId: app.id }));
      setAppForm(blankApp);
      setNotice({ kind: "success", text: "Aplikasi baru sudah dibuat." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal membuat aplikasi." }); }
    finally { setSaving(null); }
  }

  async function createUpdate(event: FormEvent) {
    event.preventDefault(); setNotice(null); setSaving("update");
    try {
      const response = await fetch("/api/admin/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ appId: updateForm.appId, title: updateForm.title, description: updateForm.description || null, status: updateForm.status, version: updateForm.version || null, media: updateForm.media ? [updateForm.media] : [] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Gagal menyimpan update.");
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

  async function sendReply(commentId: string) {
    if (!token || replyBody.trim().length < 2) return;
    setReplyBusy(commentId);
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: replyBody }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal mengirim balasan.");
      }
      setReplyOpenId(null); setReplyBody("");
      setNotice({ kind: "success", text: "Balasan tim terkirim dan langsung tampil dengan badge tim." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal mengirim balasan." });
    } finally {
      setReplyBusy(null);
    }
  }

  async function signOut() { const supabase = getSupabaseBrowser(); await supabase?.auth.signOut(); window.location.replace("/"); }

  if (loading) return <main className="admin-page admin-loading"><RefreshCw className="spin" size={19} /> Memuat dashboard aman...</main>;
  if (!token) return <main className="admin-page admin-loading"><p>Supabase belum tersambung.</p><a href="/login">Ke halaman login</a></main>;

  return (
    <main className="admin-page">
      <header className="admin-top">
        <Link href="/" className="admin-back"><ArrowLeft size={15} /> Lihat situs</Link>
        <div className="admin-title"><span className="admin-sphere" /> XySpace<span>.</span> / control room</div>
        <div className="admin-user"><span>{email ?? "Admin"}</span><button onClick={signOut}><LogOut size={15} /> Keluar</button></div>
      </header>

      <div className="admin-layout">
        <aside className="admin-side">
          <div className="admin-label">CONTROL ROOM</div>
          <a className="admin-nav-active" href="#new-update"><FilePlus2 size={16} /> Post update</a>
          <a href="#moderation"><MessageSquareText size={16} /> Moderasi komentar <span>{pendingComments?.length ?? 0}</span></a>
          <a href="#new-app"><Layers3 size={16} /> Kelola aplikasi <span>{apps.length}</span></a>
          <a href="/docs/ai"><WandSparkles size={16} /> AI integration <ExternalLink size={13} /></a>
          <div className="admin-tip"><Sparkles size={17} /><p><b>Tip singkat</b>Setiap post memakai waktu server secara otomatis—tidak bisa dimanipulasi oleh AI atau browser.</p></div>
        </aside>

        <section className="admin-content">
          <div className="admin-intro">
            <div>
              <p className="admin-kicker">GOOD TO SEE YOU</p>
              <h1>Keep the signal moving.</h1>
              <p>Tambah aplikasi baru, upload preview ke Cloudinary, lalu catat progresnya dalam satu tempat.</p>
            </div>
            <div className="admin-stats">
              <div><b>{apps.length}</b><span>apps live</span></div>
              <div><b>{pendingComments?.length ?? 0}</b><span>pending comments</span></div>
              <div><b>auto</b><span>server dates</span></div>
            </div>
          </div>

          {notice && <div className={`admin-notice ${notice.kind}`}><CheckCircle2 size={17} />{notice.text}</div>}

          <div className="admin-panels">
            <form className="admin-panel update-panel" id="new-update" onSubmit={createUpdate}>
              <div className="panel-heading">
                <div><p className="admin-kicker">NEW PROGRESS LOG</p><h2>Publish an update</h2></div>
                <span><span className="small-live" /> public</span>
              </div>
              <label>Untuk aplikasi
                <select required value={updateForm.appId} onChange={(e) => setUpdateForm({ ...updateForm, appId: e.target.value })}>
                  <option value="" disabled>Pilih aplikasi</option>
                  {apps.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}
                </select>
              </label>
              <div className="form-row">
                <label>Judul update<input required maxLength={160} placeholder="Contoh: Dashboard baru siap diuji" value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} /></label>
                <label>Versi <input maxLength={40} placeholder="v0.8.0" value={updateForm.version} onChange={(e) => setUpdateForm({ ...updateForm, version: e.target.value })} /></label>
              </div>
              <label>Deskripsi<textarea maxLength={5000} required placeholder="Apa yang berubah? Ceritakan konteks singkatnya..." value={updateForm.description} onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })} /></label>
              <div className="form-row">
                <label>Status
                  <select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as UpdateStatus })}>
                    <option value="planning">Planning</option>
                    <option value="building">Building</option>
                    <option value="testing">Testing</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </label>
                <label>Media Cloudinary
                  <div className="upload-inline">
                    <input className="url-input" placeholder="URL media atau upload" value={updateForm.media} onChange={(e) => setUpdateForm({ ...updateForm, media: e.target.value })} />
                    <label className="upload-button"><Upload size={14} /><input type="file" accept="image/*,video/*" onChange={uploadMedia} />{saving === "upload" ? "..." : "Upload"}</label>
                  </div>
                </label>
              </div>
              {updateForm.media && <div className="media-ready"><CloudUpload size={14} /> Preview media siap untuk {selectedApp?.name ?? "aplikasi"}</div>}
              <button className="publish-button" disabled={saving !== null || !apps.length} type="submit">{saving === "update" ? "Menerbitkan..." : <><Plus size={17} /> Publish update</>}</button>
            </form>

            <form className="admin-panel app-panel" id="new-app" onSubmit={createApp}>
              <div className="panel-heading">
                <div><p className="admin-kicker">YOUR ECOSYSTEM</p><h2>Add an app</h2></div>
                <span className="panel-number">0{apps.length + 1}</span>
              </div>
              <label>Nama aplikasi<input required maxLength={80} placeholder="Contoh: Orbit" value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value, slug: appForm.slug || slugify(e.target.value) })} /></label>
              <label>Slug (untuk AI & link)<input required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="orbit" value={appForm.slug} onChange={(e) => setAppForm({ ...appForm, slug: slugify(e.target.value) })} /></label>
              <label>Tagline<input maxLength={180} placeholder="A one-line promise" value={appForm.tagline} onChange={(e) => setAppForm({ ...appForm, tagline: e.target.value })} /></label>
              <label>Link aplikasi<input type="url" placeholder="https://..." value={appForm.website} onChange={(e) => setAppForm({ ...appForm, website: e.target.value })} /></label>
              <label>Catatan / deskripsi<textarea maxLength={3000} placeholder="Deskripsi singkat aplikasi" value={appForm.description} onChange={(e) => setAppForm({ ...appForm, description: e.target.value })} /></label>
              <button className="outline-submit" disabled={saving !== null} type="submit">{saving === "app" ? "Menyimpan..." : <><Plus size={16} /> Tambahkan aplikasi</>}</button>
              <div className="app-list">
                <p>APPS YANG SUDAH ADA</p>
                {apps.length ? apps.map((app) => <div key={app.id}><span>{app.name.slice(0, 1)}</span><b>{app.name}</b><code>/{app.slug}</code></div>) : <small>Belum ada aplikasi. Buat yang pertama di sini.</small>}
              </div>
            </form>
          </div>

          <section className="admin-panel moderation-panel" id="moderation">
            <div className="panel-heading">
              <div><p className="admin-kicker">PUBLIC COMMENTS</p><h2>Moderasi komentar</h2></div>
              <span><span className="small-live" /> {commentTab === "pending" ? `${pendingComments?.length ?? 0} pending` : `${approvedComments?.length ?? 0} approved`}</span>
            </div>
            <div className="mod-tabs" role="tablist" aria-label="Filter komentar">
              <button className={commentTab === "pending" ? "mod-tab mod-tab-active" : "mod-tab"} onClick={() => setCommentTab("pending")}>Menunggu <span>{pendingComments?.length ?? 0}</span></button>
              <button className={commentTab === "approved" ? "mod-tab mod-tab-active" : "mod-tab"} onClick={() => setCommentTab("approved")}>Disetujui <span>{approvedComments?.length ?? 0}</span></button>
            </div>
            {commentTab === "pending" && (pendingComments === null ? (
              <p className="moderation-empty">Memuat komentar...</p>
            ) : pendingComments.length === 0 ? (
              <p className="moderation-empty">Tidak ada komentar yang menunggu moderasi. Komentar publik masuk ke sini setelah dikirim.</p>
            ) : (
              <div className="moderation-list">
                {pendingComments.map((comment) => (
                  <div className="moderation-item" key={comment.id}>
                    <div className="moderation-body">
                      <div className="moderation-head">
                        <span className="comment-avatar">{comment.author_name.slice(0, 1)}</span>
                        <strong>{comment.author_name}</strong>
                        {comment.parent_id && <span className="mod-reply-chip">balasan</span>}
                        <span className="moderation-meta">{timeAgo(comment.created_at)}</span>
                        <span className="moderation-target">di {comment.update?.app?.name ?? "aplikasi"} — {comment.update?.title ?? "update"}</span>
                      </div>
                      <p>{comment.body}</p>
                    </div>
                    <div className="moderation-actions">
                      <button className="mod-approve" disabled={moderatingId === comment.id} onClick={() => moderateComment(comment.id, "approved")}><Check size={14} /> Setujui</button>
                      <button className="mod-reject" disabled={moderatingId === comment.id} onClick={() => moderateComment(comment.id, "rejected")}><X size={14} /> Tolak</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {commentTab === "approved" && (approvedComments === null ? (
              <p className="moderation-empty">Memuat komentar...</p>
            ) : approvedComments.length === 0 ? (
              <p className="moderation-empty">Belum ada komentar yang disetujui.</p>
            ) : (
              <div className="moderation-list">
                {approvedComments.map((comment) => (
                  <div className="moderation-item" key={comment.id}>
                    <div className="moderation-body">
                      <div className="moderation-head">
                        <span className="comment-avatar">{comment.author_name.slice(0, 1)}</span>
                        <strong>{comment.author_name}</strong>
                        {comment.author_badge && <span className={`comment-badge badge-${comment.author_badge.toLowerCase()}`}>{comment.author_badge}</span>}
                        {comment.parent_id && <span className="mod-reply-chip">balasan</span>}
                        <span className="moderation-meta">{timeAgo(comment.created_at)}</span>
                        <span className="moderation-target">di {comment.update?.app?.name ?? "aplikasi"} — {comment.update?.title ?? "update"}</span>
                      </div>
                      <p>{comment.body}</p>
                    </div>
                    <div className="moderation-actions">
                      <button className="mod-reject" disabled={moderatingId === comment.id} onClick={() => moderateComment(comment.id, "rejected")}><X size={14} /> Tolak</button>
                      <button className="mod-reply" disabled={replyBusy === comment.id} onClick={() => { setReplyOpenId(replyOpenId === comment.id ? null : comment.id); setReplyBody(""); }}><MessageSquareText size={14} /> Balas</button>
                    </div>
                    {replyOpenId === comment.id && (
                      <div className="reply-form admin-reply-form">
                        <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} maxLength={1000} placeholder="Balasan tim — langsung tampil publik dengan badge XyDev/XyTeam..." />
                        <div className="reply-actions">
                          <button type="button" className="reply-cancel" onClick={() => setReplyOpenId(null)}>Batal</button>
                          <button className="reply-send" disabled={replyBusy === comment.id || replyBody.trim().length < 2} onClick={() => sendReply(comment.id)}>{replyBusy === comment.id ? "Mengirim..." : "Kirim balasan"}</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className="ai-callout">
            <div className="ai-spark"><WandSparkles size={21} /></div>
            <div>
              <p className="admin-kicker">AUTOMATION READY</p>
              <h3>Give your AI a secure publishing lane.</h3>
              <p>AI dapat membuat draft copy, upload file media, membuat aplikasi, dan mem-post update lewat token server khusus. Token tidak pernah dibuka ke publik.</p>
            </div>
            <a href="/docs/ai">Lihat docs AI <ExternalLink size={15} /></a>
          </section>
        </section>
      </div>
    </main>
  );
}
