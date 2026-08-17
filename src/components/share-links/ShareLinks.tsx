"use client";

import { useState } from "react";
import { Copy, Plus, Share2, X as Close } from "lucide-react";
import { FaFacebookF, FaTelegram, FaTiktok, FaWhatsapp, FaXTwitter } from "react-icons/fa6";

type Props = { url: string; title: string };

export default function ShareLinks({ url, title }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `${title} — dari XySpace Blog`;
  const links = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  };

  async function copyLink() { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* noop */ } }
  async function nativeShare() { if (navigator.share) await navigator.share({ title, text, url }); else await copyLink(); }

  return <div className="share-cluster">
    <button type="button" className="share-main" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? <Close size={16}/> : <Plus size={17}/>}<span>Bagikan</span></button>
    {open ? <div className="share-popover">
      <a href={links.x} target="_blank" rel="noreferrer" aria-label="Bagikan ke X"><FaXTwitter/></a>
      <a href={links.facebook} target="_blank" rel="noreferrer" aria-label="Bagikan ke Facebook"><FaFacebookF/></a>
      <a href={links.whatsapp} target="_blank" rel="noreferrer" aria-label="Bagikan ke WhatsApp"><FaWhatsapp/></a>
      <a href={links.telegram} target="_blank" rel="noreferrer" aria-label="Bagikan ke Telegram"><FaTelegram/></a>
      <button type="button" onClick={nativeShare} aria-label="Bagikan lewat TikTok atau aplikasi lain"><FaTiktok/></button>
      <button type="button" onClick={copyLink} aria-label="Salin tautan">{copied ? <Share2/> : <Copy/>}</button>
    </div> : null}
  </div>;
}
