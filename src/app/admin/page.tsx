"use client";
import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  FilePlus2,
  Eye,
  EyeOff,
  Layers3,
  LogOut,
  MessageSquareText,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { AuthorBadge, Comment, ProfileLink, Project, UpdateStatus } from "@/lib/types";

type Notice = { kind: "success" | "error"; text: string } | null;
type ManagedComment = Comment & { update?: { id: string; title: string; app?: { name: string } | null } | null };
type Profile = { email: string; display_name: string | null; title: string | null; avatar_url: string | null; banner_url: string | null; bio: string | null; links: ProfileLink[]; badge: AuthorBadge | null };
type TeamMember = { email: string; added_at: string; added_by: string | null };
type AdminUpdate = {
  id: string; title: string; description: string | null; status: UpdateStatus;
  version: string | null; media: string[]; is_published: boolean;
  created_at: string; contributors: string[] | null;
  app: { id: string; name: string; slug: string } | null;
};

const blankApp = { name: "", slug: "", tagline: "", description: "", website: "", coverUrl: "", isPublished: true };
const blankUpdate = { appId: "", title: "", description: "", status: "building" as UpdateStatus, version: "", media: "", contributorsText: "", isPublished: true };

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

function CommentAvatar({ comment }: { comment: ManagedComment }) {
  if (comment.author_avatar) {
    return <Image className="comment-avatar comment-avatar-img" src={comment.author_avatar} alt="" width={27} height={27} />;
  }
  return <div className="comment-avatar">{comment.author_name.slice(0, 1)}</div>;
}

function LinkRowEditor({ index, link, updateLink, removeLink }: { index: number; link: ProfileLink; updateLink: (idx: number, key: keyof ProfileLink, value: string) => void; removeLink: (idx: number) => void }) {
  return (
    <div className="profile-link-block">
      <input value={link.label} onChange={(event) => updateLink(index, "label", event.target.value)} placeholder="Label (GitHub, X, dll)" maxLength={24} />
      <input value={link.url} onChange={(event) => updateLink(index, "url", event.target.value)} placeholder="https://…" maxLength={300} />
      <button type="button" onClick={() => removeLink(index)} className="mod-reply-chip"><X size={11} /> Hapus link</button>
    </div>
  );
}

export default function AdminPage() {
  const [apps, setApps] = useState<Project[]>([]);
  const [appForm, setAppForm] = useState(blankApp);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState(blankUpdate);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"app" | "update" | "upload" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const [approvedComments, setApprovedComments] = useState<ManagedComment[] | null>(null);
  const [hiddenComments, setHiddenComments] = useState<ManagedComment[] | null>(null);
  const [commentTab, setCommentTab] = useState<"approved" | "rejected">("approved");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileBanner, setProfileBanner] = useState("");
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [profileBusy, setProfileBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [bannerBusy, setBannerBusy] = useState(false);

  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [teamEmail, setTeamEmail] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [updatesList, setUpdatesList] = useState<AdminUpdate[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedApp = useMemo(() => apps.find((app) => app.id === updateForm.appId), [apps, updateForm.appId]);

  useEffect(() => {
    async function initialize() {
      const supabase = getSupabaseBrowser();
      if (!supabase) { setLoading(false); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { window.location.replace("/login"); return; }
      setToken(sessionData.session.access_token);
      setEmail(sessionData.session.user.email ?? null);
      const appResponse = await fetch("/api/admin/apps", { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } });
      const rows = appResponse.ok ? ((await appResponse.json()) as Project[]) : [];
      setApps(rows);
      if (rows[0]) setUpdateForm((current) => ({ ...current, appId: rows[0].id }));
      setLoading(false);
    }
    initialize();
  }, []);

  const fetchComments = useCallback(async (status: "approved" | "rejected"): Promise<ManagedComment[]> => {
    if (!token) return [];
    try {
      const response = await fetch(`/api/admin/comments?status=${status}`, { headers: { Authorization: `Bearer ${token}` } });
      return response.ok ? ((await response.json()) as ManagedComment[]) : [];
    } catch {
      return [];
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    async function load() {
      setApprovedComments(await fetchComments("approved"));
      setHiddenComments(isOwner ? await fetchComments("rejected") : []);
    }
    load();
  }, [fetchComments, isOwner, token]);

  useEffect(() => {
    if (!token) return;
    async function loadProfile() {
      try {
        const response = await fetch("/api/admin/profile", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const data = await response.json();
        setIsOwner(Boolean(data.isOwner));
        const p = data.profile as Profile | null;
        setProfile(p);
        setProfileName(p?.display_name ?? "");
        setProfileTitle(p?.title ?? "");
        setProfileBio(p?.bio ?? "");
        setProfileAvatar(p?.avatar_url ?? "");
        setProfileBanner(p?.banner_url ?? "");
        setProfileLinks(Array.isArray(p?.links) ? p?.links ?? [] : []);
      } catch { /* non fatal */ }
    }
    loadProfile();
  }, [token]);

  useEffect(() => {
    if (!token || !isOwner) return;
    (async () => {
      try {
        const response = await fetch("/api/admin/team-members", { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) setTeamList((await response.json()) as TeamMember[]);
      } catch { /* non fatal */ }
    })();
  }, [token, isOwner]);

  useEffect(() => {
    if (!token || !isOwner) return;
    (async () => {
      try {
        const response = await fetch("/api/admin/updates", { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) setUpdatesList((await response.json()) as AdminUpdate[]);
      } catch { /* non fatal */ }
    })();
  }, [token, isOwner]);

  async function moderateComment(id: string, status: "approved" | "rejected") {
    if (!token || !isOwner) return;
    setModeratingId(id);
    try {
      const response = await fetch(`/api/admin/comments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error ?? "Gagal memperbarui komentar."); }
      setApprovedComments(await fetchComments("approved"));
      setHiddenComments(await fetchComments("rejected"));
      setNotice({ kind: "success", text: status === "rejected" ? "Komentar disembunyikan dari publik." : "Komentar ditampilkan kembali." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal memperbarui komentar." }); }
    finally { setModeratingId(null); }
  }

  async function sendReply(commentId: string) {
    if (!token || replyBody.trim().length < 2) return;
    setReplyBusy(commentId);
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/reply`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ body: replyBody }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error ?? "Gagal mengirim balasan."); }
      setReplyOpenId(null); setReplyBody("");
      setNotice({ kind: "success", text: "Balasan terkirim dan langsung tampil dengan badge tim." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal mengirim balasan." }); }
    finally { setReplyBusy(null); }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setProfileBusy(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: profileName, title: profileTitle || null, avatarUrl: profileAvatar || null, bannerUrl: profileBanner || null, bio: profileBio || null, links: profileLinks }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Gagal menyimpan profil.");
      setNotice({ kind: "success", text: "Profil tim tersimpan. Perubahan langsung berlaku global untuk balasan dan komentar publik." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal menyimpan profil." }); }
    finally { setProfileBusy(false); }
  }

  async function uploadAsset(field: "avatar" | "banner", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    const setBusy = field === "avatar" ? setAvatarBusy : setBannerBusy;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", `profile-${field}`);
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const uploaded = await response.json();
      if (!response.ok) throw new Error(uploaded.error ?? "Upload gagal.");
      if (field === "avatar") setProfileAvatar(uploaded.url); else setProfileBanner(uploaded.url);
      setNotice({ kind: "success", text: `${field === "avatar" ? "Avatar" : "Banner"} terupload. Klik Simpan profil.` });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Upload gagal." }); }
    finally { setBusy(false); event.target.value = ""; }
  }

  function addLinkField() {
    if (profileLinks.length >= 6) return;
    setProfileLinks([...profileLinks, { label: "", url: "" }]);
  }
  function updateLink(idx: number, key: keyof ProfileLink, value: string) {
    setProfileLinks((list) => list.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  }
  function removeLink(idx: number) { setProfileLinks((list) => list.filter((_, i) => i !== idx)); }

  async function addTeamMember(event: FormEvent) {
    event.preventDefault();
    if (!teamEmail.trim()) return;
    setTeamBusy(true);
    try {
      const response = await fetch("/api/admin/team-members", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }, body: JSON.stringify({ email: teamEmail.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Gagal menambah anggota tim.");
      setTeamEmail("");
      const list = await fetch("/api/admin/team-members", { headers: { Authorization: `Bearer ${token ?? ""}` } });
      if (list.ok) setTeamList((await list.json()) as TeamMember[]);
      setNotice({ kind: "success", text: `Email ditambahkan ke tim. Orang ini sekarang bisa login via Google dan balas dengan badge XyTeam.` });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal menambah tim." }); }
    finally { setTeamBusy(false); }
  }
  async function deleteUpdate(id: string) {
    if (!token || !isOwner) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/updates/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error ?? "Gagal menghapus update."); }
      setUpdatesList((list) => (list ?? []).filter((u) => u.id !== id));
      setNotice({ kind: "success", text: "Update dihapus. Komentar, like, dan reaksi terkait ikut bersih via foreign key cascade." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal menghapus update." }); }
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  }

  async function removeTeamMember(memberEmail: string) {
    setTeamBusy(true);
    try {
      const response = await fetch(`/api/admin/team-members?email=${encodeURIComponent(memberEmail)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token ?? ""}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Gagal menghapus anggota tim.");
      setTeamList((list) => list.filter((m) => m.email !== memberEmail));
      setNotice({ kind: "success", text: `Email ${memberEmail} dihapus dari tim.` });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal menghapus." }); }
    finally { setTeamBusy(false); }
  }

  function startEditingApp(app: Project) {
    setEditingAppId(app.id);
    setAppForm({
      name: app.name,
      slug: app.slug,
      tagline: app.tagline ?? "",
      description: app.description ?? "",
      website: app.links[0]?.url ?? "",
      coverUrl: app.cover_url ?? "",
      isPublished: app.is_published,
    });
    document.getElementById("new-app")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEditingApp() {
    setEditingAppId(null);
    setAppForm(blankApp);
  }

  async function createApp(event: FormEvent) {
    event.preventDefault(); setNotice(null); setSaving("app");
    try {
      const response = await fetch(editingAppId ? `/api/admin/apps/${editingAppId}` : "/api/admin/apps", {
        method: editingAppId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ name: appForm.name, slug: appForm.slug, tagline: appForm.tagline || null, description: appForm.description || null, coverUrl: appForm.coverUrl || null, links: appForm.website ? [{ label: "Open app", url: appForm.website }] : [], isPublished: appForm.isPublished }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Gagal membuat aplikasi.");
      const app = data as Project;
      setApps((items) => editingAppId ? items.map((item) => item.id === app.id ? app : item) : [app, ...items]);
      if (!editingAppId) setUpdateForm((current) => ({ ...current, appId: app.id }));
      setEditingAppId(null);
      setAppForm(blankApp);
      setNotice({ kind: "success", text: editingAppId ? "Aplikasi berhasil diperbarui." : "Aplikasi baru sudah dibuat." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal membuat aplikasi." }); }
    finally { setSaving(null); }
  }

  function startEditing(update: AdminUpdate) {
    setEditingId(update.id);
    setUpdateForm({
      appId: update.app?.id ?? "",
      title: update.title,
      description: update.description ?? "",
      status: update.status,
      version: update.version ?? "",
      media: update.media?.[0] ?? "",
      contributorsText: (update.contributors ?? []).join(", "),
      isPublished: update.is_published,
    });
    document.getElementById("new-update")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEditing() {
    setEditingId(null);
    setUpdateForm((current) => ({ ...blankUpdate, appId: current.appId }));
  }

  async function createUpdate(event: FormEvent) {
    event.preventDefault(); setNotice(null); setSaving("update");
    try {
      const contributors = updateForm.contributorsText.split(/[\s,]+/).map((c) => c.trim().toLowerCase()).filter((c) => /.+@.+\..+/.test(c));
      const response = await fetch(editingId ? `/api/admin/updates/${editingId}` : "/api/admin/updates", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({
          appId: updateForm.appId,
          title: updateForm.title,
          description: updateForm.description || null,
          status: updateForm.status,
          version: updateForm.version || null,
          media: updateForm.media ? [updateForm.media] : [],
          contributors,
          isPublished: updateForm.isPublished,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Gagal menyimpan update.");
      const list = await fetch("/api/admin/updates", { headers: { Authorization: `Bearer ${token ?? ""}` } });
      if (list.ok) setUpdatesList((await list.json()) as AdminUpdate[]);
      setUpdateForm((current) => ({ ...blankUpdate, appId: current.appId }));
      setEditingId(null);
      setNotice({
        kind: "success",
        text: editingId
          ? "Update berhasil diperbarui."
          : updateForm.isPublished
            ? "Update diterbitkan."
            : "Draft update tersimpan.",
      });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Gagal menyimpan update." }); }
    finally { setSaving(null); }
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !token) return;
    setNotice(null); setSaving("upload");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "update");
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const uploaded = await response.json();
      if (!response.ok) throw new Error(uploaded.error ?? "Upload Cloudinary gagal.");
      setUpdateForm((current) => ({ ...current, media: uploaded.url }));
      setNotice({ kind: "success", text: "Media terupload (otomatis dikompresi, WebP)." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Upload gagal." }); }
    finally { setSaving(null); event.target.value = ""; }
  }

  async function signOut() { const supabase = getSupabaseBrowser(); await supabase?.auth.signOut(); window.location.replace("/"); }

  if (loading) return <main className="admin-page admin-loading"><RefreshCw className="spin" size={19} /> Memuat dashboard aman...</main>;
  if (!token) return <main className="admin-page admin-loading"><p>Supabase belum tersambung.</p><a href="/login">Ke halaman login</a></main>;

  const activeComments = commentTab === "approved" ? approvedComments : hiddenComments;

  return (
    <main className="admin-page">
      <header className="admin-top">
        <Link href="/" className="admin-back"><ArrowLeft size={15} /> Lihat situs</Link>
        <div className="admin-title"><span className="admin-sphere" /> XySpace<span>.</span> / control room</div>
        <div className="admin-user">
          {profile?.avatar_url ? <Image className="admin-avatar" src={profile.avatar_url} alt="" width={22} height={22} /> : <span className="admin-avatar admin-avatar-fallback">{profile?.display_name?.slice(0, 1).toUpperCase() ?? email?.slice(0, 1).toUpperCase()}</span>}
          <span>{profile?.display_name ?? email ?? "Admin"}</span>
          {isOwner && <span className="owner-chip">OWNER</span>}
          <button onClick={signOut}><LogOut size={15} /> Keluar</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-side">
          <div className="admin-label">CONTROL ROOM</div>
          {isOwner ? <a className="admin-nav-active" href="#new-update"><FilePlus2 size={16} /> Post update</a> : null}
          <a className={isOwner ? "" : "admin-nav-active"} href="#comments"><MessageSquareText size={16} /> Kelola komentar <span>{approvedComments?.length ?? 0}</span></a>
          {isOwner ? <a href="#new-app"><Layers3 size={16} /> Kelola aplikasi <span>{apps.length}</span></a> : null}
          <a href="#profile"><UserRound size={16} /> Profile tim</a>
          {isOwner ? <a href="#team"><Users size={16} /> XyTeam <span>{teamList.length}</span></a> : null}
          {isOwner ? <a href="#updates-list"><Layers3 size={16} /> Daftar update <span>{updatesList?.length ?? 0}</span></a> : null}
          <a href="/docs/ai"><WandSparkles size={16} /> AI integration <ExternalLink size={13} /></a>
          <div className="admin-tip"><Sparkles size={17} /><p><b>Tip singkat</b>Komentar publik tampil langsung — owner bisa sembunyikan yang toxic; team balas dengan badge XyTeam dari profil custom mereka.</p></div>
        </aside>

        <section className="admin-content">
          <div className="admin-intro">
            <div>
              <p className="admin-kicker">GOOD TO SEE YOU</p>
              <h1>Keep the signal moving.</h1>
              <p>Publikasi update, atur moderation komentar, dan rancang profile tim — semua dari satu tempat.</p>
            </div>
            <div className="admin-stats">
              <div><b>{apps.length}</b><span>apps live</span></div>
              <div><b>{approvedComments?.length ?? 0}</b><span>komentar aktif</span></div>
              <div><b>{teamList.length}</b><span>tim</span></div>
            </div>
          </div>

          {notice ? <div className={`admin-notice ${notice.kind}`}><CheckCircle2 size={17} />{notice.text}</div> : null}

          {isOwner ? <div className="admin-panels">
            <form className="admin-panel update-panel" id="new-update" onSubmit={createUpdate}>
              <div className="panel-heading">
                <div><p className="admin-kicker">{editingId ? "EDIT PROGRESS LOG" : "NEW PROGRESS LOG"}</p><h2>{editingId ? "Update a post" : "Publish an update"}</h2></div>
                <span><span className="small-live" /> {updateForm.isPublished ? "public" : "draft"}</span>
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
              <label>Kontributor (email, pisah koma atau spasi)<input value={updateForm.contributorsText} onChange={(e) => setUpdateForm({ ...updateForm, contributorsText: e.target.value })} placeholder="email1@kamu.id, email2@kamu.id" maxLength={400} /></label>
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
              {updateForm.media ? <div className="media-ready"><CloudUpload size={14} /> Preview siap untuk {selectedApp?.name ?? "aplikasi"} (auto WebP + q_auto)</div> : null}
              <label className="draft-toggle">
                <input type="checkbox" checked={updateForm.isPublished} onChange={(e) => setUpdateForm({ ...updateForm, isPublished: e.target.checked })} />
                <span><b>{updateForm.isPublished ? "Publikasikan" : "Simpan sebagai draft"}</b><small>{updateForm.isPublished ? "Langsung tampil di feed publik." : "Hanya terlihat di control room."}</small></span>
              </label>
              <div className="update-form-actions">
                {editingId ? <button className="reply-cancel" type="button" onClick={cancelEditing}>Batal edit</button> : null}
                <button className="publish-button" disabled={saving !== null || !apps.length} type="submit">{saving === "update" ? "Menyimpan..." : <><Plus size={17} /> {editingId ? "Simpan perubahan" : updateForm.isPublished ? "Publish update" : "Simpan draft"}</>}</button>
              </div>
            </form>

            <form className="admin-panel app-panel" id="new-app" onSubmit={createApp}>
              <div className="panel-heading">
                <div><p className="admin-kicker">YOUR ECOSYSTEM</p><h2>{editingAppId ? "Edit an app" : "Add an app"}</h2></div>
                <span className="panel-number">0{apps.length + 1}</span>
              </div>
              <label>Nama aplikasi<input required maxLength={80} placeholder="Contoh: Orbit" value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value, slug: appForm.slug || slugify(e.target.value) })} /></label>
              <label>Slug (untuk AI & link)<input required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="orbit" value={appForm.slug} onChange={(e) => setAppForm({ ...appForm, slug: slugify(e.target.value) })} /></label>
              <label>Tagline<input maxLength={180} placeholder="A one-line promise" value={appForm.tagline} onChange={(e) => setAppForm({ ...appForm, tagline: e.target.value })} /></label>
              <label>Link aplikasi<input type="url" placeholder="https://..." value={appForm.website} onChange={(e) => setAppForm({ ...appForm, website: e.target.value })} /></label>
              <label>Catatan / deskripsi<textarea maxLength={3000} placeholder="Deskripsi singkat aplikasi" value={appForm.description} onChange={(e) => setAppForm({ ...appForm, description: e.target.value })} /></label>
              <label className="draft-toggle"><input type="checkbox" checked={appForm.isPublished} onChange={(e) => setAppForm({ ...appForm, isPublished: e.target.checked })} /><span><b>{appForm.isPublished ? "Aplikasi publik" : "Aplikasi tersembunyi"}</b><small>Kontrol visibilitas kartu aplikasi.</small></span></label>
              <div className="update-form-actions">{editingAppId ? <button type="button" className="reply-cancel" onClick={cancelEditingApp}>Batal edit</button> : null}<button className="outline-submit" disabled={saving !== null} type="submit">{saving === "app" ? "Menyimpan..." : <><Plus size={16} /> {editingAppId ? "Simpan aplikasi" : "Tambahkan aplikasi"}</>}</button></div>
              <div className="app-list">
                <p>APPS YANG SUDAH ADA</p>
                {apps.length ? apps.map((app) => <div key={app.id}><span>{app.name.slice(0, 1)}</span><b>{app.name}</b><code>/{app.slug}</code><button type="button" className="mod-reply" onClick={() => startEditingApp(app)}>Edit</button></div>) : <small>Belum ada aplikasi. Buat yang pertama di sini.</small>}
              </div>
            </form>
          </div> : null}

          <section className="admin-panel moderation-panel" id="comments">
            <div className="panel-heading">
              <div><p className="admin-kicker">PUBLIC COMMENTS</p><h2>Kelola komentar</h2></div>
              <span><span className="small-live" /> tampil instan</span>
            </div>
            <div className="mod-tabs" role="tablist" aria-label="Filter komentar">
              <button className={commentTab === "approved" ? "mod-tab mod-tab-active" : "mod-tab"} onClick={() => setCommentTab("approved")}>Aktif <span>{approvedComments?.length ?? 0}</span></button>
              {isOwner ? <button className={commentTab === "rejected" ? "mod-tab mod-tab-active" : "mod-tab"} onClick={() => setCommentTab("rejected")}>Disembunyikan <span>{hiddenComments?.length ?? 0}</span></button> : null}
            </div>
            {activeComments === null ? <p className="moderation-empty">Memuat komentar...</p>
              : activeComments.length === 0 ? <p className="moderation-empty">{commentTab === "approved" ? "Belum ada komentar. Komentar publik muncul di sini otomatis — tanpa perlu disetujui." : "Tidak ada komentar yang disembunyikan."}</p>
              : (
                <div className="moderation-list">
                  {activeComments.map((comment) => (
                    <div className="moderation-item" key={comment.id}>
                      <div className="moderation-body">
                        <div className="moderation-head">
                          <CommentAvatar comment={comment} />
                          <strong>{comment.author_name}</strong>
                          {comment.author_badge ? <span className={`comment-badge-text badge-text-${comment.author_badge.toLowerCase()}`}>{comment.author_badge}</span> : null}
                          {comment.author_title ? <span className="comment-title-mini">{comment.author_title}</span> : null}
                          {comment.parent_id ? <span className="mod-reply-chip">balasan</span> : null}
                          <span className="moderation-meta">{timeAgo(comment.created_at)}</span>
                          <span className="moderation-target">di {comment.update?.app?.name ?? "aplikasi"} — {comment.update?.title ?? "update"}</span>
                        </div>
                        <p>{comment.body}</p>
                      </div>
                      <div className="moderation-actions">
                        {isOwner ? <button className={comment.status === "rejected" ? "mod-approve" : "mod-reject"} disabled={moderatingId === comment.id} onClick={() => moderateComment(comment.id, comment.status === "rejected" ? "approved" : "rejected")}>
                          {comment.status === "rejected" ? <><Eye size={14} /> Tampilkan</> : <><EyeOff size={14} /> Sembunyikan</>}
                        </button> : null}
                        {!comment.parent_id ? <button className="mod-reply" disabled={replyBusy === comment.id} onClick={() => { setReplyOpenId(replyOpenId === comment.id ? null : comment.id); setReplyBody(""); }}><MessageSquareText size={14} /> Balas</button> : null}
                      </div>
                      {replyOpenId === comment.id ? (
                        <div className="reply-form admin-reply-form">
                          <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} maxLength={1000} placeholder="Balasan tim — langsung tampil publik dengan badge XyDev/XyTeam dari profil lo" />
                          <div className="reply-actions">
                            <button type="button" className="reply-cancel" onClick={() => setReplyOpenId(null)}>Batal</button>
                            <button className="reply-send" disabled={replyBusy === comment.id || replyBody.trim().length < 2} onClick={() => sendReply(comment.id)}>{replyBusy === comment.id ? "Mengirim..." : "Kirim balasan"}</button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
          </section>

          <section className="admin-panel profile-panel" id="profile">
            <div className="panel-heading">
              <div><p className="admin-kicker">CUSTOM PROFILE</p><h2>Profile tim</h2></div>
              <span>{isOwner ? <><span className="small-live" /> OWNER — akses penuh</> : <><span className="small-live" /> TEAM</>}</span>
            </div>
            <form className="profile-form" onSubmit={saveProfile}>
              <div className="profile-layout">
                <div className="profile-avatar-block">
                  <p className="profile-asset-label">Avatar</p>
                  {profileAvatar ? <Image className="profile-avatar-preview" src={profileAvatar} alt="" width={84} height={84} /> : <div className="profile-avatar-preview profile-avatar-fallback">{profileName.slice(0, 1) || email?.slice(0, 1)?.toUpperCase()}</div>}
                  <label className="upload-button profile-upload"><Upload size={14} /><input type="file" accept="image/*" onChange={(e) => uploadAsset("avatar", e)} />{avatarBusy ? "..." : "Upload avatar"}</label>
                </div>
                <div className="profile-avatar-block">
                  <p className="profile-asset-label">Banner (ratio 3:1)</p>
                  {profileBanner ? <Image className="profile-banner-preview" src={profileBanner} alt="" width={400} height={133} /> : <div className="profile-banner-preview profile-avatar-fallback">Belum ada banner</div>}
                  <label className="upload-button profile-upload"><Upload size={14} /><input type="file" accept="image/*" onChange={(e) => uploadAsset("banner", e)} />{bannerBusy ? "..." : "Upload banner"}</label>
                </div>
              </div>
              <label>Nama tampilan<input value={profileName} onChange={(e) => setProfileName(e.target.value)} maxLength={48} placeholder="Contoh: xy studio" required /></label>
              <label>Jabatan / bio singkat<input value={profileTitle} onChange={(e) => setProfileTitle(e.target.value)} maxLength={80} placeholder="Contoh: Founder & builder" /></label>
              <label>Bio<input value={profileBio} onChange={(e) => setProfileBio(e.target.value)} maxLength={240} placeholder="Tulis dua-tiga kalimat tentang lo — tampil di balasan komentar publik." /></label>
              <div className="profile-links">
                <div className="profile-links-head"><p>Links (maks 6)</p><button type="button" className="outline-submit profile-add-link" onClick={addLinkField}>+ Tambah link</button></div>
                {profileLinks.map((link, idx) => (
                  <LinkRowEditor key={idx} index={idx} link={link} updateLink={updateLink} removeLink={removeLink} />
                ))}
              </div>
              <button className="outline-submit" disabled={profileBusy} type="submit">{profileBusy ? "Menyimpan..." : <><Check size={16} /> Simpan profil</>}</button>
              <small className="profile-hint">Perubahan profil langsung berlaku ke seluruh web — termasuk balasan komentar publik dan avatar kontributor.</small>
            </form>
          </section>

          {isOwner ? <section className="admin-panel team-panel" id="team">
            <div className="panel-heading">
              <div><p className="admin-kicker">XYTEAM MEMBERS</p><h2>Tambah anggota tim</h2></div>
              <span><span className="small-live" /> OWNER ONLY</span>
            </div>
            <form className="team-form" onSubmit={addTeamMember}>
              <input value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} placeholder="email@orang.keren.id" type="email" required maxLength={120} />
              <button type="submit" className="outline-submit" disabled={teamBusy}>{teamBusy ? "..." : <><Plus size={14} /> Tambah</>}</button>
            </form>
            <div className="team-list">
              {teamList.length === 0 ? <small>Belum ada anggota. Tambahin email di atas — orangnya login via Google dan langsung dapat badge XyTeam.</small> :
                teamList.map((m) => <div className="team-item" key={m.email}><div><span className="comment-avatar">{m.email.slice(0, 1).toUpperCase()}</span><b>{m.email}</b><small>sejak {new Date(m.added_at).toLocaleDateString("id-ID")}</small></div><button type="button" onClick={() => removeTeamMember(m.email)} disabled={teamBusy}>Hapus</button></div>)}
            </div>
          </section> : null}

          {isOwner ? (
            <section className="admin-panel updates-panel" id="updates-list">
              <div className="panel-heading">
                <div><p className="admin-kicker">BLOG POSTS</p><h2>Daftar update</h2></div>
                <span><span className="small-live" /> OWNER ONLY</span>
              </div>
              {updatesList === null ? (
                <p className="moderation-empty">Memuat daftar update...</p>
              ) : updatesList.length === 0 ? (
                <p className="moderation-empty">Belum ada update. Buat yang pertama lewat form di atas.</p>
              ) : (
                <div className="updates-list-table">
                  {updatesList.map((update) => (
                    <div className="updates-list-row" key={update.id}>
                      <div className="updates-list-cell updates-list-cell-title">
                        <strong>{update.title}</strong>
                        <small>{update.app?.name ?? "Tanpa aplikasi"} · {new Date(update.created_at).toLocaleString("id-ID")}</small>
                      </div>
                      <div className="updates-list-cell updates-list-cell-meta">
                        <span className={`status-pill status-${update.status}`}><i />{update.status}</span>
                        {!update.is_published ? <span className="draft-chip">draft</span> : null}
                        {update.version ? <span className="update-version-mini">{update.version}</span> : null}
                        {(update.contributors ?? []).length ? <span className="contributor-chip">{update.contributors!.length} kontributor</span> : null}
                      </div>
                      <div className="updates-list-cell updates-list-cell-actions">
                        {update.is_published ? <Link className="mod-reply" href={`/updates/${update.id}`} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Lihat</Link> : null}
                        <button type="button" className="mod-reply" onClick={() => startEditing(update)}><FilePlus2 size={13} /> Edit</button>
                        <button
                          type="button"
                          className="mod-reject"
                          disabled={deletingId === update.id}
                          onClick={() => setConfirmDeleteId(update.id)}
                        >
                          <X size={13} /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {confirmDeleteId ? (
                <div className="confirm-overlay" role="dialog" aria-modal="true">
                  <div className="confirm-card">
                    <h3>Hapus update ini?</h3>
                    <p>Semua komentar, like, dan reaksi terkait akan ikut terhapus (foreign key cascade). Tindakan ini nggak bisa dibatalkan.</p>
                    <div className="confirm-actions">
                      <button type="button" className="reply-cancel" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                      <button type="button" className="mod-reject" disabled={deletingId !== null} onClick={() => deleteUpdate(confirmDeleteId)}>
                        {deletingId === confirmDeleteId ? "Menghapus..." : "Ya, hapus permanen"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="ai-callout">
            <div className="ai-spark"><WandSparkles size={21} /></div>
            <div><p className="admin-kicker">AUTOMATION READY</p><h3>Give your AI a secure publishing lane.</h3><p>AI dapat membuat draft copy, upload file media, membuat aplikasi, dan mem-post update lewat token server khusus. Token tidak pernah dibuka ke publik.</p></div>
            <a href="/docs/ai">Lihat docs AI <ExternalLink size={15} /></a>
          </section>
        </section>
      </div>
    </main>
  );
}
