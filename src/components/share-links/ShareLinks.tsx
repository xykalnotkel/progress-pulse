"use client";

import { useState } from "react";

type Props = { url: string; title: string };

export default function ShareLinks({ url, title }: Props) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — dari XySpace Blog`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const tiktok = `https://www.tiktok.com/share?url=${encodeURIComponent(url)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="share-bar">
      <span className="share-label">Bagikan:</span>
      <a className="share-btn share-btn-x" href={x} target="_blank" rel="noreferrer" aria-label="Bagikan ke X (Twitter)">X</a>
      <a className="share-btn share-btn-fb" href={facebook} target="_blank" rel="noreferrer" aria-label="Bagikan ke Facebook">Facebook</a>
      <a className="share-btn share-btn-wa" href={whatsapp} target="_blank" rel="noreferrer" aria-label="Bagikan ke WhatsApp">WhatsApp</a>
      <a className="share-btn share-btn-tg" href={telegram} target="_blank" rel="noreferrer" aria-label="Bagikan ke Telegram">Telegram</a>
      <a className="share-btn share-btn-tt" href={tiktok} target="_blank" rel="noreferrer" aria-label="Bagikan ke TikTok">TikTok</a>
      <button type="button" className="share-btn share-btn-copy" onClick={copyLink} aria-label="Salin URL">
        {copied ? "Tersalin" : "Salin URL"}
      </button>
    </div>
  );
}
