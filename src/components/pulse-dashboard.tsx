"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleEllipsis,
  ExternalLink,
  Heart,
  Layers3,
  MessageCircle,
  Menu,
  Moon,
  Plus,
  Search,
  Send,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { REACTIONS, REACTION_LABELS } from "@/lib/constants";
import type { AuthorBadge, Comment, CommentReaction, Contributor, ProgressUpdate, Project, UpdateStatus } from "@/lib/types";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getVisitorId } from "@/lib/visitor-id";

const HumanCheck = dynamic(() => import("@/components/human-check"), { ssr: false });

function subscribeUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}
function getUrlApp() {
  return new URLSearchParams(window.location.search).get("app") ?? "all";
}
function subscribeTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}
function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem("pulse-theme");
    return stored ? stored !== "light" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true;
  }
}

type View = "home" | "apps" | "updates" | "about";

type Props = {
  apps: Project[];
  updates: ProgressUpdate[];
  isDemo?: boolean;
  view?: View;
};

type WriterIdentity = { email: string; name: string; avatar: string | null; title: string | null; badge: AuthorBadge };

const statusMeta: Record<UpdateStatus, { label: string; className: string }> = {
  planning: { label: "Planning", className: "status-planning" },
  building: { label: "Building", className: "status-building" },
  testing: { label: "Testing", className: "status-testing" },
  shipped: { label: "Shipped", className: "status-shipped" },
};

function dateText(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function relativeText(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 45) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  return dateText(value);
}

function AppMark({ slug, size = "normal" }: { slug: string; size?: "normal" | "small" }) {
  const letter = slug.slice(0, 1).toUpperCase();
  return <span className={`app-mark app-mark-${slug} ${size === "small" ? "app-mark-small" : ""}`}>{letter}</span>;
}

function ShimmerImage({ src, alt, className, width, height, fill }: { src: string; alt: string; className: string; width?: number; height?: number; fill?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const sizes = "(max-width: 720px) 100vw, (max-width: 1100px) 70vw, 720px";
  if (width && height) {
    return (
      <span className={`shimmer-image ${className} ${loaded ? " shimmer-image-loaded" : ""}`}>
        <Image src={src} alt={alt} width={width} height={height} onLoadingComplete={() => setLoaded(true)} />
      </span>
    );
  }
  if (fill) {
    return (
      <span className={`shimmer-image ${className} ${loaded ? " shimmer-image-loaded" : ""}`}>
        <Image src={src} alt={alt} fill sizes={sizes} onLoadingComplete={() => setLoaded(true)} />
      </span>
    );
  }
  return (
    <span className={`shimmer-image ${className} ${loaded ? " shimmer-image-loaded" : ""}`}>
      <Image src={src} alt={alt} width={720} height={420} onLoadingComplete={() => setLoaded(true)} />
    </span>
  );
}

function PreviewArt({ update }: { update: ProgressUpdate }) {
  const kind = update.app?.slug ?? "orbit";
  const mediaUrl = update.media?.[0];
  if (mediaUrl) {
    const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);
    return (
      <div className="preview-art preview-uploaded">
        {isVideo ? <video src={mediaUrl} muted autoPlay loop playsInline /> : <ShimmerImage src={mediaUrl} alt={`Preview ${update.title}`} className="preview-art-img" />}
        <div className="uploaded-shade" />
      </div>
    );
  }
  if (kind === "frame") {
    return (
      <div className="preview-art preview-frame">
        <div className="frame-wall frame-wall-a" />
        <div className="frame-wall frame-wall-b" />
        <div className="frame-card card-one"><span /></div>
        <div className="frame-card card-two"><span /></div>
        <div className="frame-card card-three"><span /></div>
        <div className="frame-cursor" />
        <div className="art-caption">Saved Views</div>
      </div>
    );
  }
  if (kind === "signal") {
    return (
      <div className="preview-art preview-signal">
        <div className="signal-grid" />
        <div className="signal-ring ring-one" />
        <div className="signal-ring ring-two" />
        <div className="signal-core"><i /><i /><i /></div>
        <div className="signal-card"><b>Quiet mode</b><span>Grouped by intent</span></div>
      </div>
    );
  }
  return (
    <div className="preview-art preview-orbit">
      <div className="orbit-haze" />
      <div className="orbit-panel">
        <div className="orbit-top"><span>August overview</span><i /></div>
        <div className="orbit-chart"><span className="chart-bar bar-a" /><span className="chart-bar bar-b" /><span className="chart-bar bar-c" /><span className="chart-bar bar-d" /><span className="chart-bar bar-e" /></div>
        <div className="orbit-stat"><span>Spent this month</span><b>Rp 6.840.000</b><em>−12.8%</em></div>
      </div>
      <div className="orbit-orb orb-a" /><div className="orbit-orb orb-b" />
    </div>
  );
}

function CommentBadge({ badge }: { badge?: AuthorBadge | null }) {
  if (!badge) return null;
  return <span className={`comment-badge-text badge-text-${badge.toLowerCase()}`}>{badge}</span>;
}

function CommentAvatar({ comment }: { comment: Comment }) {
  if (comment.author_avatar) return <Image className="comment-avatar comment-avatar-img" src={comment.author_avatar} alt="" width={27} height={27} />;
  return <div className="comment-avatar">{comment.author_name.slice(0, 1)}</div>;
}

function CommentReactionBar({ comment, isDemo }: { comment: Comment; isDemo: boolean }) {
  const [delta, setDelta] = useState<Partial<Record<CommentReaction, number>>>({});
  const [done, setDone] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("pp-reacted") ?? "[]") as string[]; } catch { return []; }
  });

  async function react(reaction: CommentReaction) {
    const key = `${comment.id}:${reaction}`;
    if (done.includes(key)) return;
    if (!isDemo) {
      try {
        const response = await fetch("/api/comment-reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commentId: comment.id, reaction, visitorId: getVisitorId() }),
        });
        if (!response.ok) return;
      } catch { return; }
    }
    setDone((list) => { const next = [...list, key]; window.localStorage.setItem("pp-reacted", JSON.stringify(next)); return next; });
    setDelta((current) => ({ ...current, [reaction]: (current[reaction] ?? 0) + 1 }));
  }

  return (
    <div className="reaction-row">
      {REACTIONS.map((reaction) => {
        const count = (comment.reactions?.[reaction] ?? 0) + (delta[reaction] ?? 0);
        const active = done.includes(`${comment.id}:${reaction}`);
        return (
          <button type="button" key={reaction} className={`react-chip${active ? " react-chip-active" : ""}`} onClick={() => react(reaction)} aria-pressed={active}>
            {REACTION_LABELS[reaction]}
            {count > 0 && <b>{count}</b>}
          </button>
        );
      })}
    </div>
  );
}

function CommentReplyBox({ comment, updateId, isDemo, onReplyCreated, preselectedName, sessionToken, hideNameInput, writerBadge }: {
  comment: Comment;
  updateId: string;
  isDemo: boolean;
  onReplyCreated: (local: { name: string; body: string; badge?: AuthorBadge; avatar?: string | null; repliedTo?: string }) => void;
  preselectedName: string;
  sessionToken?: string | null;
  hideNameInput: boolean;
  writerBadge?: AuthorBadge;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(preselectedName);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const needsHumanCheck = !isDemo && !hideNameInput;

  function resetHumanCheck() {
    setTurnstileToken(null);
    setTurnstileVersion((version) => version + 1);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim().length < 2 || (!hideNameInput && name.trim().length < 2)) return;
    if (needsHumanCheck && !turnstileToken) {
      setState("error");
      return;
    }
    setState("sending");
    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      onReplyCreated({ name: name.trim() || "Tim", body: body.trim(), badge: writerBadge, repliedTo: comment.author_name });
      setOpen(false); setBody(""); setState("success");
      return;
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
      const response = await fetch("/api/comments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          updateId,
          parentId: comment.id,
          authorName: name || preselectedName,
          body,
          visitorId: getVisitorId(),
          turnstileToken: turnstileToken ?? undefined,
          website: "",
        }),
      });
      if (!response.ok) throw new Error("Unable to send reply");
      onReplyCreated({
        name: name.trim() || preselectedName || "Tim",
        body: body.trim(),
        badge: writerBadge,
        repliedTo: comment.author_name,
      });
      resetHumanCheck();
      setOpen(false); setBody(""); setState("success");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      resetHumanCheck();
      setState("error");
    }
  }

  return (
    <>
      <button type="button" className="comment-reply-link" onClick={() => setOpen((value) => !value)}>
        {open ? <X size={11} /> : <MessageCircle size={11} />} Balas{comment.author_name ? ` ke @${comment.author_name.split(" ")[0]}` : ""}
      </button>
      {open && (
        <form className="reply-form" onSubmit={submit}>
          <div className="reply-context">Membalas ke <strong>@{comment.author_name}</strong></div>
          {!hideNameInput && <input value={name} onChange={(event) => setName(event.target.value)} maxLength={48} placeholder="Nama kamu" required />}
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} placeholder={`Tulis balasan untuk @${comment.author_name.split(" ")[0]}...`} required />
          {needsHumanCheck ? (
            <HumanCheck key={turnstileVersion} action="comment_reply" onToken={setTurnstileToken} />
          ) : null}
          {state === "error" && <p className="comment-notice error">Belum bisa mengirim balasan. Coba lagi.</p>}
          {state === "success" && !isDemo && <p className="comment-notice success"><Check size={15} /> Balasan terkirim.</p>}
          <div className="reply-actions">
            <button type="button" className="reply-cancel" onClick={() => setOpen(false)}>Batal</button>
            <button className="reply-send" disabled={state === "sending" || (needsHumanCheck && !turnstileToken)} type="submit">{state === "sending" ? "Mengirim..." : "Kirim balasan"}</button>
          </div>
        </form>
      )}
    </>
  );
}

function CommentThread({ comment, updateId, isDemo, onPrependLocal, sessionToken, hideNameInput, writerBadge }: {
  comment: Comment;
  updateId: string;
  isDemo: boolean;
  onPrependLocal: (local: { name: string; body: string; badge?: AuthorBadge; avatar?: string | null; repliedTo?: string }) => void;
  sessionToken?: string | null;
  hideNameInput: boolean;
  writerBadge?: AuthorBadge;
}) {
  const isTeam = comment.author_badge === "XyDev" || comment.author_badge === "XyTeam";
  return (
    <div className={`comment ${isTeam ? "comment-team" : ""} ${comment.parent_id ? "comment-is-reply" : ""}`}>
      <CommentAvatar comment={comment} />
      <div className="comment-main">
        <div className={`comment-head ${isTeam ? "comment-head-team" : ""}`}>
          <strong>{comment.author_name}</strong>
          <CommentBadge badge={comment.author_badge} />
          {comment.author_title && <span className="comment-title">{comment.author_title}</span>}
          <span className="comment-time" title={new Date(comment.created_at).toLocaleString("id-ID")}>{relativeText(comment.created_at)}</span>
        </div>
        <p>{comment.body}</p>
        <CommentReactionBar comment={comment} isDemo={isDemo} />
        {(comment.replies ?? []).map((reply) => {
          const rIsTeam = reply.author_badge === "XyDev" || reply.author_badge === "XyTeam";
          return (
            <div className={`comment comment-reply ${rIsTeam ? "comment-team" : ""}`} key={reply.id}>
              <div className="thread-line" aria-hidden />
              <CommentAvatar comment={reply} />
              <div className="comment-main">
                <div className={`comment-head ${rIsTeam ? "comment-head-team" : ""}`}>
                  <strong>{reply.author_name}</strong>
                  <CommentBadge badge={reply.author_badge} />
                  {reply.author_title && <span className="comment-title">{reply.author_title}</span>}
                  <span className="comment-time" title={new Date(reply.created_at).toLocaleString("id-ID")}>{relativeText(reply.created_at)}</span>
                </div>
                <span className="replied-to">membalas <strong>@{comment.author_name.split(" ")[0]}</strong></span>
                <p>{reply.body}</p>
                <CommentReactionBar comment={reply} isDemo={isDemo} />
              </div>
            </div>
          );
        })}
        <CommentReplyBox comment={comment} updateId={updateId} isDemo={isDemo} onReplyCreated={onPrependLocal} preselectedName="" sessionToken={sessionToken} hideNameInput={hideNameInput} writerBadge={writerBadge} />
      </div>
    </div>
  );
}

function ContributorStack({ contributors }: { contributors: Contributor[] }) {
  if (!contributors.length) return null;
  return (
    <div className="contributor-stack" aria-label={`${contributors.length} kontributor`}>
      {contributors.slice(0, 5).map((c, idx) => (
        c.avatar_url ? (
          <Image key={`${c.name}-${idx}`} className="contributor-avatar" src={c.avatar_url} alt={c.name} title={c.name} width={22} height={22} />
        ) : (
          <span key={`${c.name}-${idx}`} className="contributor-avatar contributor-avatar-fallback" title={c.name}>{c.name.slice(0, 1).toUpperCase()}</span>
        )
      ))}
      {contributors.length > 5 && <span className="contributor-more">+{contributors.length - 5}</span>}
    </div>
  );
}

type LocalComment = { name: string; body: string; when: string; badge?: AuthorBadge | null; avatar?: string | null; isLocal?: boolean; repliedTo?: string };

function UpdatePost({ update, isDemo, sessionToken, writerIdentity, isWriterAdmin }: {
  update: ProgressUpdate;
  isDemo: boolean;
  sessionToken: string | null;
  writerIdentity: WriterIdentity | null;
  isWriterAdmin: boolean;
}) {
  const meta = statusMeta[update.status];
  const [localComments, setLocalComments] = useState<LocalComment[]>([]);
  const [name, setName] = useState(writerIdentity?.name ?? "");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const needsHumanCheck = !isDemo && !isWriterAdmin;
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("pp-liked") ?? "[]") as string[]; } catch { return []; }
  });
  const [likeDelta, setLikeDelta] = useState<Record<string, number>>({});

  const serverComments = update.comments ?? [];
  const serverCommentCount = update.comment_count ?? serverComments.length;

  function isLiked(id: string) { return likedIds.includes(id); }
  function likeCount(u: ProgressUpdate) { return (u.likes_count ?? 0) + (likeCountDelta[u.id] ?? 0); }
  const likeCountDelta = likeDelta;

  function appendLocalReply(parentName: string, reply: { name: string; body: string; badge?: AuthorBadge; avatar?: string | null; repliedTo?: string }) {
    const local: LocalComment = { name: reply.name, body: reply.body, when: "baru saja", badge: reply.badge ?? null, avatar: reply.avatar ?? null, repliedTo: parentName, isLocal: true };
    setLocalComments((list) => [...list, local]);
  }

  function resetHumanCheck() {
    setTurnstileToken(null);
    setTurnstileVersion((version) => version + 1);
  }

  async function toggleLike() {
    if (isLiked(update.id)) return;
    if (!isDemo) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
        const response = await fetch("/api/likes", {
          method: "POST",
          headers,
          body: JSON.stringify({ updateId: update.id, visitorId: getVisitorId() }),
        });
        if (!response.ok) return;
      } catch { return; }
    }
    setLikedIds((list) => { const next = [...list, update.id]; window.localStorage.setItem("pp-liked", JSON.stringify(next)); return next; });
    setLikeDelta((delta) => ({ ...delta, [update.id]: (delta[update.id] ?? 0) + 1 }));
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    const finalName = writerIdentity?.name ?? name;
    if (body.trim().length < 2 || (!isWriterAdmin && finalName.trim().length < 2)) return;
    if (needsHumanCheck && !turnstileToken) {
      setState("error");
      return;
    }
    setState("sending");
    const sentName = finalName.trim();
    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      setLocalComments((list) => [...list, { name: sentName, body: body.trim(), when: "baru saja", badge: writerIdentity?.badge ?? null, avatar: writerIdentity?.avatar ?? null, isLocal: true }]);
      setBody(""); setState("success");
      return;
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
      const response = await fetch("/api/comments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          updateId: update.id,
          authorName: isWriterAdmin ? "" : sentName,
          body,
          visitorId: getVisitorId(),
          turnstileToken: turnstileToken ?? undefined,
          website: "",
        }),
      });
      if (!response.ok) throw new Error("Unable to send comment");
      const result = await response.json().catch(() => null);
      setLocalComments((list) => [...list, { name: result?.identity?.name ?? sentName, body: body.trim(), when: "baru saja", badge: result?.identity?.badge ?? writerIdentity?.badge ?? null, avatar: writerIdentity?.avatar ?? null, isLocal: true }]);
      resetHumanCheck();
      setBody(""); setState("success");
    } catch {
      resetHumanCheck();
      setState("error");
    }
  }

  return (
    <article className="update-post">
      <div className="update-post-visual">
        <PreviewArt update={update} />
        <span className={`status-pill ${meta.className}`}><i />{meta.label}</span>
      </div>
      <div className="update-post-body">
        <div className="update-post-meta">
          <span className="update-app"><AppMark slug={update.app?.slug ?? "orbit"} size="small" /> {update.app?.name}</span>
          <span>{dateText(update.created_at)}</span>
          {update.version && <span className="update-version">{update.version}</span>}
          <ContributorStack contributors={update.contributors ?? []} />
        </div>
        <h3>{update.title}</h3>
        <p className="update-post-description">{update.description}</p>
        <div className="update-post-actions">
          <button type="button" className={isLiked(update.id) ? "reaction reaction-liked" : "reaction"} onClick={toggleLike}>
            <Heart size={15} fill={isLiked(update.id) ? "currentColor" : "none"} /> {likeCount(update)} like{likeCount(update) === 1 ? "" : "s"}
          </button>
          <a className="reaction" href={`#komentar-${update.id}`}><MessageCircle size={15} /> {serverCommentCount + localComments.length} komentar</a>
          <Link className="read-link" href={`/updates/${update.id}`}>Buka halaman update <ArrowUpRight size={15} /></Link>
        </div>

        <div className="post-comments" id={`komentar-${update.id}`}>
          <div className="comments-heading">
            <h3>Komentar <span>{serverCommentCount + localComments.length}</span></h3>
            <p>Keep it kind, useful, and on-topic. Komentar langsung tampil — tanpa persetujuan.</p>
          </div>
          {serverComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              updateId={update.id}
              isDemo={isDemo}
              onPrependLocal={(reply) => appendLocalReply(comment.author_name, reply)}
              sessionToken={sessionToken}
              hideNameInput={isWriterAdmin}
              writerBadge={writerIdentity?.badge}
            />
          ))}
          {localComments.map((local, index) => (
            <div className={`comment ${local.badge ? "comment-team" : ""}`} key={`local-${index}`}>
              <div className="comment-avatar">{local.name.slice(0, 1)}</div>
              <div className="comment-main">
                <div className={`comment-head ${local.badge ? "comment-head-team" : ""}`}>
                  <strong>{local.name}</strong>
                  <CommentBadge badge={local.badge} />
                  <span className="comment-time">{local.when}</span>
                </div>
                {local.repliedTo && <span className="replied-to">membalas <strong>@{local.repliedTo.split(" ")[0]}</strong></span>}
                <p>{local.body}</p>
              </div>
            </div>
          ))}
          {state === "success" && !isDemo && <p className="comment-notice success"><Check size={15} /> Komentar terkirim dan langsung tampil.</p>}
          {state === "error" && <p className="comment-notice error">Belum bisa mengirim komentar. Coba lagi.</p>}
          <form className="comment-form" onSubmit={submitComment}>
            <div>
              {!isWriterAdmin && <input value={name} onChange={(event) => setName(event.target.value)} maxLength={48} placeholder="Nama kamu" required />}
              {isWriterAdmin && writerIdentity && (
                <div className="comment-form-as">
                  {writerIdentity.avatar ? <Image className="comment-form-avatar" src={writerIdentity.avatar} alt="" width={30} height={30} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /> : null}
                  <div className="comment-form-name">
                    <strong>{writerIdentity.name}</strong>
                    <span>Akan tampil sebagai <CommentBadge badge={writerIdentity.badge} /></span>
                  </div>
                </div>
              )}
              <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} placeholder="Tulis komentar yang bermanfaat..." required />
              {needsHumanCheck ? (
                <HumanCheck key={turnstileVersion} action="comment" onToken={setTurnstileToken} />
              ) : null}
            </div>
            <button className="send-button" disabled={state === "sending" || (needsHumanCheck && !turnstileToken)} type="submit">{state === "sending" ? "Mengirim..." : <><Send size={15} /> Kirim</>}</button>
          </form>
        </div>
      </div>
    </article>
  );
}

export default function PulseDashboard({ apps, updates, isDemo = false, view = "home" }: Props) {
  const urlActiveApp = useSyncExternalStore(subscribeUrl, getUrlApp, () => "all");
  const storedDark = useSyncExternalStore(subscribeTheme, getStoredTheme, () => true);
  const [activeAppOverride, setActiveApp] = useState<string | null>(null);
  const activeApp = activeAppOverride ?? urlActiveApp;
  const [darkOverride, setDarkOverride] = useState<boolean | null>(null);
  const dark = darkOverride ?? storedDark;
  const [navOpen, setNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<UpdateStatus | "all">("all");
  const [writer, setWriter] = useState<WriterIdentity | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  function toggleTheme() {
    const next = !dark;
    setDarkOverride(next);
    try { window.localStorage.setItem("pulse-theme", next ? "dark" : "light"); } catch { /* noop */ }
  }

  useEffect(() => {
    if (isDemo) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    let active = true;
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!active) return;
      const token = session.session?.access_token ?? null;
      setSessionToken(token);
      if (!token) return setWriter(null);
      try {
        const response = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const data = await response.json();
        if (data.identity) setWriter({ email: data.identity.email, name: data.profile?.display_name ?? data.identity.name, avatar: data.profile?.avatar_url ?? data.identity.avatar, title: data.profile?.title ?? null, badge: data.identity.badge });
      } catch { /* noop */ }
    })();
    return () => { active = false; };
  }, [isDemo]);

  const filteredUpdates = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("id-ID");
    return updates.filter((update) => {
      const matchesApp = activeApp === "all" || update.app?.slug === activeApp;
      const matchesStatus = activeStatus === "all" || update.status === activeStatus;
      const haystack = `${update.title} ${update.description ?? ""} ${update.app?.name ?? ""} ${update.version ?? ""}`.toLocaleLowerCase("id-ID");
      return matchesApp && matchesStatus && (!query || haystack.includes(query));
    });
  }, [activeApp, activeStatus, searchQuery, updates]);

  return (
    <main className="pulse-shell" data-theme={dark ? "dark" : "light"}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient floating-shape shape-a" />
      <div className="ambient floating-shape shape-b" />
      <div className="ambient floating-shape shape-c" />
      <div className="grain" />
      <nav className="topbar">
        <Link className="brand" href="/" aria-label="XySpace Blog home">
          <Image className="brand-logo" src="/images/xyspace-logo.webp" alt="XySpace" width={44} height={44} priority />
          <span>XySpace <span className="brand-blog">Blog</span></span>
        </Link>
        <div className={`nav-links ${navOpen ? "nav-links-open" : ""}`}>
          <Link href="/" onClick={() => setNavOpen(false)}>Home</Link>
          <Link href="/updates" onClick={() => setNavOpen(false)}>Updates</Link>
          <Link href="/apps" onClick={() => setNavOpen(false)}>Apps</Link>
          <Link href="/about" onClick={() => setNavOpen(false)}>About</Link>
        </div>
        <div className="nav-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Ganti tema" aria-pressed={!dark}>
            <Sun size={15} /><span className={dark ? "toggle-knob" : "toggle-knob toggle-knob-light"}><Moon size={13} /></span>
          </button>
          <button className="mobile-menu-toggle" type="button" onClick={() => setNavOpen((value) => !value)} aria-label="Buka navigasi" aria-expanded={navOpen}>
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {view === "home" && <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> BUILDING IN PUBLIC</p>
          <h1>Small steps.<br /><em>Real momentum.</em></h1>
          <p className="hero-description">A living record of what I&apos;m making — the ideas, iterations, and launches along the way.</p>
          <div className="hero-buttons"><Link href="/updates" className="button button-primary">See latest progress <ArrowRight size={17} /></Link><Link href="/apps" className="button button-ghost">Explore apps <ChevronDown size={16} /></Link></div>
        </div>
        <div className="hero-sculpture">
          <ShimmerImage src="/images/xyspace-hero-3d.webp" alt="Ilustrasi abstrak 3D XySpace" className="hero-render" fill />
          <div className="sculpture-label"><span>01</span><i />IN PROGRESS</div>
        </div>
      </section>}

      {view === "home" && <section className="home-overview">
        <div className="home-overview-heading"><div><p className="eyebrow">THE WORKBENCH</p><h2>More than a launch log.</h2></div><p>A home for the applications, releases, and small decisions that move the work forward.</p></div>
        <div className="home-route-grid">
          <Link href="/apps" className="home-route-card route-apps"><span className="route-number">01</span><Layers3 size={24} /><strong>{apps.length || "New"} apps in motion</strong><p>Each product has its own space, link, and story.</p><span className="route-arrow">Explore apps <ArrowRight size={15} /></span></Link>
          <Link href="/updates" className="home-route-card route-updates"><span className="route-number">02</span><Sparkles size={24} /><strong>{updates.length || "Fresh"} progress notes</strong><p>Small releases, experiments, and the reasoning behind them.</p><span className="route-arrow">Read updates <ArrowRight size={15} /></span></Link>
          <Link href="/about" className="home-route-card route-about"><span className="route-number">03</span><CircleEllipsis size={24} /><strong>Built in the open</strong><p>Follow the ideas while they are still becoming real.</p><span className="route-arrow">About XySpace <ArrowRight size={15} /></span></Link>
        </div>
        {updates.length > 0 && <div className="home-latest"><div className="home-latest-heading"><div><p className="eyebrow">LATEST SIGNAL</p><h2>From the progress log</h2></div><Link href="/updates" className="text-link">View all <ArrowRight size={15} /></Link></div><div className="home-latest-grid">{updates.slice(0, 2).map((update) => (
          <article className="home-update" key={update.id}>
            <Link href={`/updates/${update.id}`} aria-label={`Read ${update.title}`}><PreviewArt update={update} /></Link>
            <div>
              <span><AppMark slug={update.app?.slug ?? "orbit"} size="small" /> {update.app?.name} · {dateText(update.created_at)}</span>
              <h3>{update.title}</h3>
              <p>{update.description}</p>
              <Link href={`/updates/${update.id}`}>Read note <ArrowUpRight size={14} /></Link>
            </div>
          </article>
        ))}</div></div>}
      </section>}

      {view === "apps" && <section className="app-rail" id="apps">
        <div className="rail-heading"><div><p className="eyebrow">THE ECOSYSTEM</p><h2>Currently in motion</h2></div><Link href="/updates" className="text-link">All updates <ArrowRight size={15} /></Link></div>
        <div className="apps-grid">
          {apps.map((app, index) => (
            <article className={`app-card card-${index + 1}`} key={app.id}>
              <div className="app-card-glow" /><div className="app-card-top"><AppMark slug={app.slug} /><span className="app-card-number">0{index + 1}</span></div>
              <div className="app-card-copy"><h3>{app.name}</h3><p>{app.tagline ?? app.description}</p></div>
              <div className="app-card-bottom"><Link className="app-progress-link" href={`/updates?app=${app.slug}`}>View progress <ArrowRight size={15} /></Link>{app.links[0] && <a href={app.links[0].url} target="_blank" rel="noreferrer" aria-label={`Open ${app.name}`}><ExternalLink size={15} /></a>}</div>
            </article>
          ))}
          <article className="app-card add-card"><div className="add-plus"><Plus size={22} /></div><div><h3>Next idea</h3><p>Always room for the next thing.</p></div><span>COMING SOON</span></article>
        </div>
      </section>}

      {view === "updates" && <section className="updates-section" id="updates">
        <div className="updates-heading"><div><p className="eyebrow">PROGRESS LOG</p><h2>Latest from the bench</h2></div><p>Setiap post punya komentar yang tampil langsung — tanpa persetujuan. Komentar admin/team otomatis muncul dengan badge XyDev/XyTeam dan avatar dari profil.</p></div>
        <div className="filter-row" role="tablist" aria-label="Filter updates">
          <button className={activeApp === "all" ? "filter-active" : ""} onClick={() => setActiveApp("all")}>All work <span>{updates.length}</span></button>
          {apps.map((app) => <button key={app.id} className={activeApp === app.slug ? "filter-active" : ""} onClick={() => setActiveApp(app.slug)}><AppMark slug={app.slug} size="small" /> {app.name}</button>)}
        </div>
        <div className="update-discovery">
          <label className="update-search"><Search size={15} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari judul, aplikasi, versi..." aria-label="Cari update" /></label>
          <div className="status-filter" aria-label="Filter status">
            {(["all", "planning", "building", "testing", "shipped"] as const).map((status) => (
              <button type="button" key={status} className={activeStatus === status ? "status-filter-active" : ""} onClick={() => setActiveStatus(status)}>{status === "all" ? "Semua status" : statusMeta[status].label}</button>
            ))}
          </div>
        </div>
        <div className="updates-list">
          {filteredUpdates.map((update) => (
            <UpdatePost key={update.id} update={update} isDemo={isDemo} sessionToken={sessionToken} writerIdentity={writer} isWriterAdmin={Boolean(writer)} />
          ))}
        </div>
        {filteredUpdates.length === 0 && <div className="empty-feed">Nothing in this lane just yet.</div>}
      </section>}

      {view === "about" && <section className="closing" id="about"><div className="closing-orb" /><p className="eyebrow">STAY IN THE LOOP</p><h2>More soon.<br /><em>Always building.</em></h2><p>Follow the work as it takes shape, one release at a time.</p><a className="button button-primary" href="https://github.com/xykalnotkel" target="_blank" rel="noreferrer">Open GitHub <ArrowUpRight size={16} /></a></section>}

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link className="brand" href="/"><Image className="brand-logo" src="/images/xyspace-logo.webp" alt="XySpace" width={44} height={44} priority /><span>XySpace <span className="brand-blog">Blog</span></span></Link>
            <p>Catatan terbuka dari proses membangun — aplikasi, keputusan, dan pelajaran di sepanjang jalan.</p>
            <span className="footer-copyright">© 2026 XySpace. Dibuat dengan niat baik.</span>
          </div>
          <div className="footer-col">
            <h4>Navigasi</h4>
            <Link href="/">Home</Link>
            <Link href="/updates">Updates</Link>
            <Link href="/apps">Apps</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="footer-col">
            <h4>Developer</h4>
            <Link href="/docs/ai">AI API docs</Link>
            <a href="/api/ingest/schema" target="_blank" rel="noreferrer">Schema JSON</a>
            <Link href="/updates">Progress feed</Link>
            <a href="/feed.xml">RSS feed</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link href="/terms">Syarat &amp; Ketentuan</Link>
            <Link href="/privacy">Kebijakan Privasi</Link>
            <Link href="/cookies">Kebijakan Cookie</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
        <div className="footer-bottom">Dibangun secara terbuka — setiap update adalah sinyal kecil ke mana arah pekerjaan.</div>
      </footer>
    </main>
  );
}
