import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

type LegalLayoutProps = {
  kicker?: string;
  title: string;
  lead: string;
  updated: string;
  sections: LegalSection[];
};

export default function LegalLayout({ kicker = "LEGAL", title, lead, updated, sections }: LegalLayoutProps) {
  return (
    <main className="docs-page">
      <div className="docs-ambient" />
      <nav className="docs-nav">
        <Link href="/" className="docs-brand"><span className="docs-logo" /> XySpace <span>Blog</span></Link>
        <Link href="/" className="docs-back"><ArrowLeft size={14} /> Kembali ke blog</Link>
      </nav>

      <header className="docs-hero docs-hero-legal">
        <p className="docs-eyebrow"><span className="live-dot" /> {kicker}</p>
        <h1>{title}</h1>
        <p className="docs-lead">{lead}</p>
        <p className="docs-updated">Terakhir diperbarui: {updated}</p>
      </header>

      <div className="docs-body">
        {sections.map((section, index) => (
          <section className="docs-section" key={index}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, pIndex) => <p key={pIndex}>{paragraph}</p>)}
            {section.list && (
              <ul className="legal-list">
                {section.list.map((item, iIndex) => <li key={iIndex}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
        <section className="docs-section">
          <h2>Kontak</h2>
          <p>Kalau ada pertanyaan soal dokumen ini, hubungi kami lewat <Link href="/about">halaman About</Link>.</p>
        </section>
      </div>

      <footer className="docs-footer">
        <div className="docs-footer-links">
          <Link href="/">Beranda</Link>
          <Link href="/terms">Syarat &amp; Ketentuan</Link>
          <Link href="/privacy">Privasi</Link>
          <Link href="/cookies">Cookie</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </div>
        <span>© 2026 XySpace Blog.</span>
      </footer>
    </main>
  );
}
