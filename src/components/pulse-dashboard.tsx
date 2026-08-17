"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
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
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import type { Contributor, ProgressUpdate, Project, UpdateStatus } from "@/lib/types";
import type { PublicOwnerProfile } from "@/lib/public-profile";


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
  ownerProfile?: PublicOwnerProfile;
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

function UpdatePost({ update }: { update: ProgressUpdate }) {
  const meta = statusMeta[update.status];
  return <article className="update-post">
    <Link className="update-post-visual" href={`/updates/${update.id}`} aria-label={`Baca ${update.title}`}>
      <PreviewArt update={update}/><span className={`status-pill ${meta.className}`}><i/>{meta.label}</span>
    </Link>
    <div className="update-post-body">
      <div className="update-post-meta"><span className="update-app"><AppMark slug={update.app?.slug ?? "orbit"} size="small"/> {update.app?.name}</span><span>{dateText(update.created_at)}</span>{update.version ? <span className="update-version">{update.version}</span> : null}{(update.tags ?? []).slice(0,3).map((tag)=><span className="update-tag" key={tag}>#{tag}</span>)}<ContributorStack contributors={update.contributors ?? []}/></div>
      <h3>{update.title}</h3><p className="update-post-description">{update.description}</p>
      <div className="update-post-actions"><Link className="reaction" href={`/updates/${update.id}`}><Heart size={15}/> {update.likes_count ?? 0} Like</Link><Link className="reaction" href={`/updates/${update.id}#tulis-komentar`}><MessageCircle size={15}/> {update.comment_count ?? 0} Komentar</Link><Link className="read-link" href={`/updates/${update.id}`}>Baca lengkap <ArrowUpRight size={15}/></Link></div>
    </div>
  </article>;
}

export default function PulseDashboard({ apps, updates, view = "home", ownerProfile }: Props) {
  const urlActiveApp = useSyncExternalStore(subscribeUrl, getUrlApp, () => "all");
  const storedDark = useSyncExternalStore(subscribeTheme, getStoredTheme, () => true);
  const [activeAppOverride, setActiveApp] = useState<string | null>(null);
  const activeApp = activeAppOverride ?? urlActiveApp;
  const [darkOverride, setDarkOverride] = useState<boolean | null>(null);
  const dark = darkOverride ?? storedDark;
  const [navOpen, setNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<UpdateStatus | "all">("all");

  function toggleTheme() {
    const next = !dark;
    setDarkOverride(next);
    try { window.localStorage.setItem("pulse-theme", next ? "dark" : "light"); } catch { /* noop */ }
  }


  const filteredUpdates = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("id-ID");
    return updates.filter((update) => {
      const matchesApp = activeApp === "all" || update.app?.slug === activeApp;
      const matchesStatus = activeStatus === "all" || update.status === activeStatus;
      const haystack = `${update.title} ${update.description ?? ""} ${update.app?.name ?? ""} ${update.version ?? ""} ${(update.tags ?? []).join(" ")}`.toLocaleLowerCase("id-ID");
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
          {ownerProfile ? <Link href="/profile" className="floating-profile-card">
            <span className="floating-profile-avatar">{ownerProfile.avatar_url ? <Image src={ownerProfile.avatar_url} alt={ownerProfile.display_name ?? "Kall"} width={42} height={42}/> : (ownerProfile.display_name ?? "K").slice(0,1)}</span>
            <span className="floating-profile-copy"><b>{ownerProfile.display_name ?? "Kall"}</b><small>{ownerProfile.activity_text || ownerProfile.status_text || "Lihat profil"}</small></span>
            <i className={`presence-dot presence-${ownerProfile.status_kind ?? "offline"}`}/>
          </Link> : null}
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
            <UpdatePost key={update.id} update={update} />
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
