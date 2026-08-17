import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getPublicSitemapUpdates, getPublicUpdateById } from "@/lib/feed";
import { getSiteUrl } from "@/lib/site-url";
import type { Contributor } from "@/lib/types";
import { notFound } from "next/navigation";
import ShareLinks from "@/components/share-links/ShareLinks";
import UpdateDetailInteractions from "@/components/update-detail-interactions";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const updates = await getPublicSitemapUpdates();
  return updates.map((update) => ({ id: update.id }));
}

type PageProps = { params: Promise<{ id: string }> };

function dateText(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
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
    keywords: update.tags ?? [],
    alternates: { canonical, types: { "application/rss+xml": "/feed.xml" } },
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
    keywords: update.tags?.join(", ") || undefined,
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
        {(update.tags ?? []).length ? <div className="detail-tags">{update.tags!.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}
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
        <ShareLinks url={shareUrl} title={update.title} />
        <UpdateDetailInteractions updateId={update.id} initialComments={comments} initialLikeCount={likeCount} initialCommentCount={commentCount} isDemo={process.env.NEXT_PUBLIC_DEMO_MODE === "true"} />
        <div className="detail-bottom">
          <Link href="/updates"><ArrowLeft size={15} /> Kembali ke progress log</Link>
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
