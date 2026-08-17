"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  Heart,
  MessageCircle,
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import type { ProgressUpdate, Project, UpdateStatus } from "@/lib/types";

type Props = {
  apps: Project[];
  updates: ProgressUpdate[];
  isDemo?: boolean;
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

export default function PulseDashboard({ apps, updates, isDemo = false }: Props) {
  const [activeApp, setActiveApp] = useState("all");
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("pulse-theme") !== "light";
  });
  const [selected, setSelected] = useState<ProgressUpdate | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, { name: string; body: string; when: string }[]>>({
    "update-01": [
      { name: "Nadia", body: "The hierarchy here feels incredibly clear. Can’t wait to try the category drill-down.", when: "2 jam lalu" },
      { name: "Dimas", body: "Love the direction. The calm detail is a really nice touch.", when: "1 jam lalu" },
    ],
  });
  const [commentName, setCommentName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentState, setCommentState] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => window.localStorage.setItem("pulse-theme", dark ? "dark" : "light"), [dark]);

  const filteredUpdates = useMemo(
    () => updates.filter((update) => activeApp === "all" || update.app?.slug === activeApp),
    [activeApp, updates],
  );

  const likes = (id: string) => 28 + (id.charCodeAt(id.length - 1) % 17) + (liked.includes(id) ? 1 : 0);

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
        <a className="brand" href="#top" aria-label="Pulse home"><span className="brand-orb"><i /></span><span>pulse<span className="brand-dot">.</span></span></a>
        <div className="nav-links"><a href="#updates">Updates</a><a href="#apps">Apps</a><a href="#about">About</a></div>
        <div className="nav-actions">
          <button className="theme-toggle" type="button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
            <Sun size={15} /><span className={dark ? "toggle-knob" : "toggle-knob toggle-knob-light"}><Moon size={13} /></span>
          </button>
          <a href="/login" className="admin-link">Admin <ArrowUpRight size={14} /></a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> BUILDING IN PUBLIC</p>
          <h1>Small steps.<br /><em>Real momentum.</em></h1>
          <p className="hero-description">A living record of what I’m making — the ideas, iterations, and launches along the way.</p>
          <div className="hero-buttons"><a href="#updates" className="button button-primary">See latest progress <ArrowRight size={17} /></a><a href="#apps" className="button button-ghost">Explore apps <ChevronDown size={16} /></a></div>
        </div>
        <div className="hero-sculpture" aria-hidden="true">
          <div className="metal-stage" /><div className="metal-ring ring-back" /><div className="metal-ring ring-front" /><div className="liquid-orb"><div className="orb-shine" /></div><div className="metal-float float-one" /><div className="metal-float float-two" />
          <div className="sculpture-label"><span>01</span><i />IN PROGRESS</div>
        </div>
      </section>

      <section className="app-rail" id="apps">
        <div className="rail-heading"><div><p className="eyebrow">THE ECOSYSTEM</p><h2>Currently in motion</h2></div><a href="#updates" className="text-link">All updates <ArrowRight size={15} /></a></div>
        <div className="apps-grid">
          {apps.map((app, index) => (
            <article className={`app-card card-${index + 1}`} key={app.id}>
              <div className="app-card-glow" /><div className="app-card-top"><AppMark slug={app.slug} /><span className="app-card-number">0{index + 1}</span></div>
              <div className="app-card-copy"><h3>{app.name}</h3><p>{app.tagline ?? app.description}</p></div>
              <div className="app-card-bottom"><button type="button" onClick={() => { setActiveApp(app.slug); document.getElementById("updates")?.scrollIntoView({ behavior: "smooth" }); }}>View progress <ArrowRight size={15} /></button>{app.links[0] && <a href={app.links[0].url} target="_blank" rel="noreferrer" aria-label={`Open ${app.name}`}><ExternalLink size={15} /></a>}</div>
            </article>
          ))}
          <article className="app-card add-card"><div className="add-plus"><Plus size={22} /></div><div><h3>Next idea</h3><p>Always room for the next thing.</p></div><span>COMING SOON</span></article>
        </div>
      </section>

      <section className="updates-section" id="updates">
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
              <div className="update-body"><div className="update-meta"><span className="update-app"><AppMark slug={update.app?.slug ?? "orbit"} size="small" /> {update.app?.name}</span><span>{dateText(update.created_at)}</span></div><h3>{update.title}</h3><p>{update.description}</p><div className="update-footer"><button type="button" className={liked.includes(update.id) ? "reaction reaction-liked" : "reaction"} onClick={() => setLiked((list) => list.includes(update.id) ? list.filter((id) => id !== update.id) : [...list, update.id])}><Heart size={15} fill={liked.includes(update.id) ? "currentColor" : "none"} /> {likes(update.id)}</button><button type="button" className="reaction" onClick={() => { setSelected(update); setCommentState("idle"); }}><MessageCircle size={15} /> {update.comment_count ?? 0}</button><button type="button" className="read-link" onClick={() => { setSelected(update); setCommentState("idle"); }}>View update <ArrowUpRight size={15} /></button></div></div>
            </article>;
          })}
        </div>
        {filteredUpdates.length === 0 && <div className="empty-feed">Nothing in this lane just yet.</div>}
        <div className="load-more"><button type="button">Load earlier updates <ArrowRight size={16} /></button></div>
      </section>

      <section className="closing" id="about"><div className="closing-orb" /><p className="eyebrow">STAY IN THE LOOP</p><h2>More soon.<br /><em>Always building.</em></h2><p>Follow the work as it takes shape, one release at a time.</p><a className="button button-primary" href="mailto:hello@example.com">Get in touch <ArrowUpRight size={16} /></a></section>
      <footer><a className="brand" href="#top"><span className="brand-orb"><i /></span><span>pulse<span className="brand-dot">.</span></span></a><span>© 2026 — made with intent</span><div><a href="#top">Back to top ↑</a></div></footer>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="update-modal" role="dialog" aria-modal="true" aria-label="Progress update" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close"><X size={19} /></button><div className="modal-visual"><PreviewArt update={selected} /><span className={`status-pill ${statusMeta[selected.status].className}`}><i />{statusMeta[selected.status].label}</span></div><div className="modal-content"><div className="modal-app"><AppMark slug={selected.app?.slug ?? "orbit"} size="small" /> {selected.app?.name} <span /> {dateText(selected.created_at)} at {timeText(selected.created_at)} {selected.version && <><span /> {selected.version}</>}</div><h2>{selected.title}</h2><p className="modal-description">{selected.description}</p><div className="modal-actions"><button type="button" className={liked.includes(selected.id) ? "reaction reaction-liked" : "reaction"} onClick={() => setLiked((list) => list.includes(selected.id) ? list.filter((id) => id !== selected.id) : [...list, selected.id])}><Heart size={15} fill={liked.includes(selected.id) ? "currentColor" : "none"} /> {likes(selected.id)} likes</button><span><Sparkles size={14} /> Built in public</span></div><div className="comments"><div className="comments-heading"><h3>Comments <span>{(comments[selected.id]?.length ?? selected.comment_count ?? 0)}</span></h3><p>Keep it kind, useful, and on-topic.</p></div>{(comments[selected.id] ?? []).map((comment, index) => <div className="comment" key={`${comment.name}-${index}`}><div className="comment-avatar">{comment.name.slice(0, 1)}</div><div><div><strong>{comment.name}</strong><span>{comment.when}</span></div><p>{comment.body}</p></div></div>)}{commentState === "success" && !isDemo && <p className="comment-notice success"><Check size={15} /> Komentar dikirim untuk moderasi.</p>}{commentState === "error" && <p className="comment-notice error">Belum bisa mengirim komentar. Coba lagi.</p>}<form className="comment-form" onSubmit={submitComment}><div><input value={commentName} onChange={(event) => setCommentName(event.target.value)} maxLength={48} placeholder="Nama kamu" required /><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={1000} placeholder="Tulis komentar yang bermanfaat..." required /></div><button className="send-button" disabled={commentState === "sending"} type="submit">{commentState === "sending" ? "Mengirim..." : <><Send size={15} /> Kirim</>}</button></form></div></div></section></div>}
    </main>
  );
}
