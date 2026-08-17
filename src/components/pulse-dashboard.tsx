"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import type { Comment, ProgressUpdate, Project, UpdateStatus } from "@/lib/types";

type View = "home" | "apps" | "updates" | "about";

type Props = {
  apps: Project[];
  updates: ProgressUpdate[];
  isDemo?: boolean;
  view?: View;
};

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

function timeText(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AppMark({ slug, size = "normal" }: { slug: string; size?: "normal" | "small" }) {
  const letter = slug.slice(0, 1).toUpperCase();
  return <span className={`app-mark app-mark-${slug} ${size === "small" ? "app-mark-small" : ""}`}>{letter}</span>;
}

function PreviewArt({ update }: { update: ProgressUpdate }) {
  const kind = update.app?.slug ?? "orbit";
  const mediaUrl = update.media?.[0];
  if (mediaUrl) {
    const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl);
    return <div className="preview-art preview-uploaded">{isVideo ? <video src={mediaUrl} muted autoPlay loop playsInline /> : <img src={mediaUrl} alt={`Preview ${update.title}`} />}<div className="uploaded-shade" /></div>;
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

export default function PulseDashboard({ apps, updates, isDemo = false, view = "home" }: Props) {
  const [activeApp, setActiveApp] = useState(() => {
    if (typeof window === "undefined") return "all";
    return new URLSearchParams(window.location.search).get("app") ?? "all";
  });
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("pulse-theme") !== "light";
  });
  const [selected, setSelected] = useState<ProgressUpdate | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("pp-liked") ?? "[]") as string[]; } catch { return []; }
  });
  const [likeDelta, setLikeDelta] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, { name: string; body: string; when: string }[]>>({});
  const [commentName, setCommentName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentState, setCommentState] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => window.localStorage.setItem("pulse-theme", dark ? "dark" : "light"), [dark]);

  const filteredUpdates = useMemo(
    () => updates.filter((update) => activeApp === "all" || update.app?.slug === activeApp),
    [activeApp, updates],
  );

  const isLiked = (id: string) => likedIds.includes(id);
  const likeCount = (update: ProgressUpdate) => (update.likes_count ?? 0) + (likeDelta[update.id] ?? 0);

  async function toggleLike(update: ProgressUpdate) {
    if (isLiked(update.id)) return;
    if (!isDemo) {
      try {
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updateId: update.id }),
        });
        if (!response.ok) return;
      } catch {
        return;
      }
    }
    setLikedIds((list) => {
      const next = [...list, update.id];
      window.localStorage.setItem("pp-liked", JSON.stringify(next));
      return next;
    });
    setLikeDelta((delta) => ({ ...delta, [update.id]: (delta[update.id] ?? 0) + 1 }));
  }

  const toDisplayComment = (comment: Comment) => ({ name: comment.author_name, body: comment.body, when: dateText(comment.created_at) });
  const commentList = (update: ProgressUpdate) => [...(update.comments ?? []).map(toDisplayComment), ...(comments[update.id] ?? [])];
  const commentCount = (update: ProgressUpdate) => commentList(update).length;

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || commentName.trim().length < 2 || commentBody.trim().length < 2) return;
    setCommentState("sending");

    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      setComments((previous) => ({
        ...previous,
        [selected.id]: [...(previous[selected.id] ?? []), { name: commentName.trim(), body: commentBody.trim(), when: "baru saja" }],
      }));
      setCommentName("");
      setCommentBody("");
      setCommentState("success");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId: selected.id, authorName: commentName, body: commentBody }),
      });
      if (!response.ok) throw new Error("Unable to send comment");
      setCommentName("");
      setCommentBody("");
      setCommentState("success");
    } catch {
      setCommentState("error");
    }
  }

  return (
    <main className="pulse-shell" data-theme={dark ? "dark" : "light"}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grain" />
      <nav className="topbar">
        <Link className="brand" href="/" aria-label="XySpace Blog home"><img className="brand-logo" src="/images/xyspace-logo.webp" alt="" /><span>XySpace <span className="brand-blog">Blog</span></span></Link>
        <div className="nav-links"><Link href="/">Home</Link><Link href="/updates">Updates</Link><Link href="/apps">Apps</Link><Link href="/about">About</Link></div>
        <div className="nav-actions">
          <button className="theme-toggle" type="button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
            <Sun size={15} /><span className={dark ? "toggle-knob" : "toggle-knob toggle-knob-light"}><Moon size={13} /></span>
          </button>
        </div>
      </nav>

      {view === "home" && <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> BUILDING IN PUBLIC</p>
          <h1>Small steps.<br /><em>Real momentum.</em></h1>
          <p className="hero-description">A living record of what I’m making — the ideas, iterations, and launches along the way.</p>
          <div className="hero-buttons"><Link href="/updates" className="button button-primary">See latest progress <ArrowRight size={17} /></Link><Link href="/apps" className="button button-ghost">Explore apps <ChevronDown size={16} /></Link></div>
        </div>
        <div className="hero-sculpture">
          <img className="hero-render" src="/images/xyspace-hero-3d.webp" alt="Ilustrasi abstrak 3D XySpace" fetchPriority="high" />
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
        {updates.length > 0 && <div className="home-latest"><div className="home-latest-heading"><div><p className="eyebrow">LATEST SIGNAL</p><h2>From the progress log</h2></div><Link href="/updates" className="text-link">View all <ArrowRight size={15} /></Link></div><div className="home-latest-grid">{updates.slice(0, 2).map((update) => <article className="home-update" key={update.id}><button type="button" onClick={() => { setSelected(update); setCommentState("idle"); }}><PreviewArt update={update} /></button><div><span><AppMark slug={update.app?.slug ?? "orbit"} size="small" /> {update.app?.name} · {dateText(update.created_at)}</span><h3>{update.title}</h3><p>{update.description}</p><Link href={`/updates/${update.id}`}>Read note <ArrowUpRight size={14} /></Link></div></article>)}</div></div>}
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
        <div className="updates-heading"><div><p className="eyebrow">PROGRESS LOG</p><h2>Latest from the bench</h2></div><p>Every post is a small signal of where the work is heading.</p></div>
        <div className="filter-row" role="tablist" aria-label="Filter updates">
          <button className={activeApp === "all" ? "filter-active" : ""} onClick={() => setActiveApp("all")}>All work <span>{updates.length}</span></button>
          {apps.map((app) => <button key={app.id} className={activeApp === app.slug ? "filter-active" : ""} onClick={() => setActiveApp(app.slug)}><AppMark slug={app.slug} size="small" /> {app.name}</button>)}
        </div>
        <div className="updates-grid">
          {filteredUpdates.map((update, index) => {
            const meta = statusMeta[update.status];
            return <article className={`update-card update-card-${index + 1}`} key={update.id}>
              <button type="button" className="update-art-button" onClick={() => { setSelected(update); setCommentState("idle"); }} aria-label={`Read ${update.title}`}><PreviewArt update={update} /><span className={`status-pill ${meta.className}`}><i />{meta.label}</span></button>
              <div className="update-body"><div className="update-meta"><span className="update-app"><AppMark slug={update.app?.slug ?? "orbit"} size="small" /> {update.app?.name}</span><span>{dateText(update.created_at)}</span></div><h3>{update.title}</h3><p>{update.description}</p><div className="update-footer"><button type="button" className={isLiked(update.id) ? "reaction reaction-liked" : "reaction"} onClick={() => toggleLike(update)}><Heart size={15} fill={isLiked(update.id) ? "currentColor" : "none"} /> {likeCount(update)}</button><button type="button" className="reaction" onClick={() => { setSelected(update); setCommentState("idle"); }}><MessageCircle size={15} /> {update.comment_count ?? 0}</button><Link className="read-link" href={`/updates/${update.id}`}>View update <ArrowUpRight size={15} /></Link></div></div>
            </article>;
          })}
        </div>
        {filteredUpdates.length === 0 && <div className="empty-feed">Nothing in this lane just yet.</div>}
        <div className="load-more"><button type="button">Load earlier updates <ArrowRight size={16} /></button></div>
      </section>}

      {view === "about" && <section className="closing" id="about"><div className="closing-orb" /><p className="eyebrow">STAY IN THE LOOP</p><h2>More soon.<br /><em>Always building.</em></h2><p>Follow the work as it takes shape, one release at a time.</p><a className="button button-primary" href="mailto:hello@example.com">Get in touch <ArrowUpRight size={16} /></a></section>}
      <footer><Link className="brand" href="/"><img className="brand-logo" src="/images/xyspace-logo.webp" alt="" /><span>XySpace <span className="brand-blog">Blog</span></span></Link><span>© 2026 — made with intent</span><div><Link href="/">Back to home ↑</Link></div></footer>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="update-modal" role="dialog" aria-modal="true" aria-label="Progress update" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close"><X size={19} /></button><div className="modal-visual"><PreviewArt update={selected} /><span className={`status-pill ${statusMeta[selected.status].className}`}><i />{statusMeta[selected.status].label}</span></div><div className="modal-content"><div className="modal-app"><AppMark slug={selected.app?.slug ?? "orbit"} size="small" /> {selected.app?.name} <span /> {dateText(selected.created_at)} at {timeText(selected.created_at)} {selected.version && <><span /> {selected.version}</>}</div><h2>{selected.title}</h2><p className="modal-description">{selected.description}</p><div className="modal-actions"><button type="button" className={isLiked(selected.id) ? "reaction reaction-liked" : "reaction"} onClick={() => toggleLike(selected)}><Heart size={15} fill={isLiked(selected.id) ? "currentColor" : "none"} /> {likeCount(selected)} likes</button><span><Sparkles size={14} /> Built in public</span></div><div className="comments"><div className="comments-heading"><h3>Comments <span>{commentCount(selected)}</span></h3><p>Keep it kind, useful, and on-topic.</p></div>{commentList(selected).map((comment, index) => <div className="comment" key={`${comment.name}-${index}`}><div className="comment-avatar">{comment.name.slice(0, 1)}</div><div><div><strong>{comment.name}</strong><span>{comment.when}</span></div><p>{comment.body}</p></div></div>)}{commentState === "success" && !isDemo && <p className="comment-notice success"><Check size={15} /> Komentar dikirim untuk moderasi.</p>}{commentState === "error" && <p className="comment-notice error">Belum bisa mengirim komentar. Coba lagi.</p>}<form className="comment-form" onSubmit={submitComment}><div><input value={commentName} onChange={(event) => setCommentName(event.target.value)} maxLength={48} placeholder="Nama kamu" required /><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={1000} placeholder="Tulis komentar yang bermanfaat..." required /></div><button className="send-button" disabled={commentState === "sending"} type="submit">{commentState === "sending" ? "Mengirim..." : <><Send size={15} /> Kirim</>}</button></form></div></div></section></div>}
    </main>
  );
}
