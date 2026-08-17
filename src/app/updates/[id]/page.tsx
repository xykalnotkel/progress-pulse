import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Heart, MessageCircle } from "lucide-react";
import { getPublicUpdateById } from "@/lib/feed";
import { getSiteUrl } from "@/lib/site-url";
import type { Comment, Contributor } from "@/lib/types";
import { notFound } from "next/navigation";
import ShareLinks from "@/components/share-links/ShareLinks";

export const revalidate = 300;

type PageProps = { params: Promise<{ id: string }> };

function dateText(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
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

function imageMedia(url?: string) {
  return Boolean(url && !/\.(mp4|webm|mov)(\?.*)?$/i.test(url));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const update = await getPublicUpdateById(id);
  if (!update) {
    return {
      title: "Update tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/updates/${update.id}`;
  const description = (update.description || `Update terbaru dari ${update.app?.name ?? "XySpace"}.`)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  const firstMedia = update.media?.[0];
  const ogImage = imageMedia(firstMedia)
    ? firstMedia!
    : (() => {
        const image = new URL("/opengraph-image", siteUrl);
        image.searchParams.set("title", update.title);
        image.searchParams.set("app", update.app?.name ?? "XySpace Blog");
        return image.toString();
      })();

  return {
    title: update.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: update.title,
      description,
      publishedTime: update.created_at,
      authors: ["XySpace"],
      images: [{ url: ogImage, alt: `Preview ${update.title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: update.title,
      description,
      images: [ogImage],
    },
  };
}

function CommentBadge({ badge }: { badge?: string | null }) {
  if (!badge) return null;
  return <span className={`comment-badge-text badge-text-${badge.toLowerCase()}`}>{badge}</span>;
}

function CommentAvatar({ comment }: { comment: Comment }) {
  if (comment.author_avatar) {
    return <Image className="comment-avatar comment-avatar-img" src={comment.author_avatar} alt="" width={27} height={27} />;
  }
  return <div className="comment-avatar">{comment.author_name.slice(0, 1)}</div>;
}

function ContributorStack({ contributors }: { contributors: Contributor[] }) {
  if (!contributors.length) return null;
  return (
    <div className="contributor-stack" aria-label={`${contributors.length} kontributor`}>
      {contributors.slice(0, 5).map((c, idx) => (
        c.avatar_url ? (
          <Image key={c.email + idx} className="contributor-avatar" src={c.avatar_url} alt={c.name} title={c.name} width={22} height={22} />
        ) : (
          <span key={c.email + idx} className="contributor-avatar contributor-avatar-fallback" title={c.name}>{c.name.slice(0, 1).toUpperCase()}</span>
        )
      ))}
      {contributors.length > 5 && <span className="contributor-more">+{contributors.length - 5}</span>}
    </div>
  );
}

export default async function UpdateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const update = await getPublicUpdateById(id);
  if (!update) notFound();

  const media = update.media?.[0];
  const hasImage = imageMedia(media);
  const siteUrl = getSiteUrl();
  const comments = update.comments ?? [];
  const commentCount = update.comment_count ?? comments.length;
  const likeCount = update.likes_count ?? 0;
  const shareUrl = `${siteUrl}/updates/${update.id}`;
  const mediaAlt = `Preview ${update.title}`;
  const articleJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: update.title,
    description: update.description ?? undefined,
    datePublished: update.created_at,
    dateModified: update.updated_at ?? update.created_at,
    mainEntityOfPage: shareUrl,
    author: { "@type": "Organization", name: "XySpace" },
    publisher: { "@type": "Organization", name: "XySpace" },
    image: hasImage && media ? [media] : undefined,
  }).replace(/</g, "\\u003c");

  return (
    <main className="detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd }} />
      <div className="detail-ambient detail-ambient-one" />
      <div className="detail-ambient detail-ambient-two" />
      <nav className="detail-nav">
        <Link href="/" className="detail-brand"><Image className="detail-brand-img" src="/images/xyspace-logo.webp" alt="XySpace" width={40} height={40} priority /><span className="detail-brand-text">XySpace <span>Blog</span></span></Link>
        <Link href="/updates" className="detail-back"><ArrowLeft size={14} /> Semua update</Link>
      </nav>
      <article className="detail-article">
        <div className="detail-meta">
          <span className="detail-app">{update.app?.name ?? "XySpace"}</span><i /> <time dateTime={update.created_at}><CalendarDays size={14} /> {dateText(update.created_at)}</time>
          {update.version ? <><i /> <span className="update-version">{update.version}</span></> : null}
          <ContributorStack contributors={update.contributors ?? []} />
        </div>
        <h1>{update.title}</h1>
        <p className="detail-description">{update.description}</p>
        {media ? (
          <div className="detail-media">
            {hasImage ? (
              <Image className="detail-media-img" src={media} alt={mediaAlt} width={1200} height={630} />
            ) : (
              <video src={media} controls playsInline />
            )}
          </div>
        ) : null}
        <div className={`detail-reactions ${likeCount || commentCount ? "" : "detail-reactions-empty"}`}>
          <span><Heart size={14} /> {likeCount} likes</span>
          <span><MessageCircle size={14} /> {commentCount} komentar</span>
        </div>
        <ShareLinks url={shareUrl} title={update.title} />
        <div className="detail-bottom">
          <Link href="/updates"><ArrowLeft size={15} /> Kembali ke progress log</Link>
        </div>
        <div className="detail-comments">
          <div className="comments-heading"><h3>Komentar <span>{commentCount}</span></h3><p>Keep it kind, useful, and on-topic.</p></div>
          {comments.length ? (
            <div className="detail-comments-list">
              {comments.map((comment) => (
                <CommentBlock key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <p className="detail-comments-empty">Belum ada komentar untuk update ini. Buka progress log untuk ikut memberi masukan.</p>
          )}
          <p className="detail-comments-note"><MessageCircle size={17} /><span>Untuk menulis komentar, balasan, dan reaksi, langsung lewat halaman progress log.</span></p>
        </div>
      </article>
      <footer className="detail-footer">
        <div><Link href="/">XySpace Blog</Link> &nbsp;·&nbsp; <Link href="/updates">Semua update</Link></div>
        <div className="detail-footer-legal">
          <Link href="/terms">Syarat</Link>
          <Link href="/privacy">Privasi</Link>
          <Link href="/cookies">Cookie</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </div>
      </footer>
    </main>
  );
}

function CommentBlock({ comment, parent }: { comment: Comment; parent?: Comment }) {
  const isTeam = comment.author_badge === "XyDev" || comment.author_badge === "XyTeam";
  return (
    <div className={`comment ${isTeam ? "comment-team" : ""} ${parent ? "comment-reply" : ""}`}>
      {parent ? <div className="thread-line" aria-hidden /> : null}
      <CommentAvatar comment={comment} />
      <div className="comment-main">
        <div className={`comment-head ${isTeam ? "comment-head-team" : ""}`}>
          <strong>{comment.author_name}</strong>
          <CommentBadge badge={comment.author_badge} />
          {comment.author_title ? <span className="comment-title">{comment.author_title}</span> : null}
          <span className="comment-time" title={new Date(comment.created_at).toLocaleString("id-ID")}>{relativeText(comment.created_at)}</span>
        </div>
        {parent ? <span className="replied-to">membalas <strong>@{parent.author_name.split(" ")[0]}</strong></span> : null}
        <p>{comment.body}</p>
        {!parent ? (comment.replies ?? []).map((reply) => <CommentBlock key={reply.id} comment={reply} parent={comment} />) : null}
      </div>
    </div>
  );
}
