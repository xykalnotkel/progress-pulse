/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Heart, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicUpdateById } from "@/lib/feed";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

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
  if (!update) return { title: "Update tidak ditemukan", robots: { index: false, follow: false } };
  const description = update.description ?? `Progress update terbaru dari ${update.app?.name ?? "XySpace"}.`;
  const fallback = `/opengraph-image?title=${encodeURIComponent(update.title)}&app=${encodeURIComponent(update.app?.name ?? "XySpace")}`;
  const ogImage = imageMedia(update.media?.[0]) ? update.media[0] : fallback;
  return {
    title: update.title,
    description,
    alternates: { canonical: `/updates/${update.id}` },
    openGraph: { type: "article", title: update.title, description, publishedTime: update.created_at, authors: ["XySpace"], images: [{ url: ogImage, alt: update.title }] },
    twitter: { card: "summary_large_image", title: update.title, description, images: [ogImage] },
  };
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

  return (
    <main className="detail-page">
      <div className="detail-ambient detail-ambient-one" />
      <div className="detail-ambient detail-ambient-two" />
      <nav className="detail-nav">
        <Link href="/" className="detail-brand"><img src="/images/xyspace-logo.webp" alt="" /> XySpace <span>Blog</span></Link>
        <Link href="/updates" className="detail-back"><ArrowLeft size={15} /> Semua update</Link>
      </nav>
      <article className="detail-article">
        <div className="detail-meta">
          <span className="detail-app">{update.app?.name ?? "XySpace"}</span><i /> <time dateTime={update.created_at}><CalendarDays size={14} /> {dateText(update.created_at)}</time>
          {update.version && <><i /> <span>{update.version}</span></>}
        </div>
        <h1>{update.title}</h1>
        <p className="detail-description">{update.description}</p>
        {media && <div className="detail-media">{hasImage ? <img src={media} alt={`Preview ${update.title}`} /> : <video src={media} controls playsInline />}</div>}
        <div className="detail-reactions"><span><Heart size={14} /> {likeCount} likes</span><span><MessageCircle size={14} /> {commentCount} komentar</span></div>
        <div className="detail-bottom">
          <Link href="/updates"><ArrowLeft size={15} /> Kembali ke progress log</Link>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(update.title)}&url=${encodeURIComponent(`${siteUrl}/updates/${update.id}`)}`} target="_blank" rel="noreferrer">Bagikan update <ArrowUpRight size={15} /></a>
        </div>
        <div className="detail-comments">
          <div className="comments-heading"><h3>Komentar <span>{commentCount}</span></h3><p>Keep it kind, useful, and on-topic.</p></div>
          {comments.length ? comments.map((comment) => (
            <div className="comment" key={comment.id}>
              <div className="comment-avatar">{comment.author_name.slice(0, 1)}</div>
              <div>
                <div><strong>{comment.author_name}</strong><span>{dateText(comment.created_at)}</span></div>
                <p>{comment.body}</p>
              </div>
            </div>
          )) : <p className="detail-comments-empty">Belum ada komentar untuk update ini. Buka progress log untuk ikut memberi masukan.</p>}
          <p className="detail-comments-note"><MessageCircle size={17} /><span>Komentar baru lewat progress log, disaring moderasi dulu sebelum tampil.</span></p>
        </div>
      </article>
    </main>
  );
}
