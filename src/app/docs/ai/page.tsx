import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, KeyRound, Route, ShieldCheck, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Integration API — XySpace Blog",
  description: "Dokumentasi lengkap API integrasi AI untuk XySpace Blog: endpoint, aksi, payload, dan contoh curl.",
  alternates: { canonical: "/docs/ai" },
};

const code = (value: string) => <pre className="docs-code"><code>{value}</code></pre>;

const endpoints = [
  { method: "GET", path: "/api/ingest/schema", auth: "tidak", use: "Panduan mesin-readable untuk agent AI" },
  { method: "POST", path: "/api/ingest", auth: "Bearer token", use: "Aksi utama: create_app, create_update, draft_copy" },
  { method: "POST", path: "/api/ingest/upload", auth: "Bearer token", use: "Upload media (multipart) ke Cloudinary" },
  ];

const createAppFields = [
  ["name", "string", "wajib", "Nama aplikasi, maks 80 karakter"],
  ["slug", "string", "wajib", "kebab-case unik: a-z, 0-9, tanda strip"],
  ["tagline", "string", "opsional", "Satu baris janji produk, maks 180"],
  ["description", "string", "opsional", "Deskripsi singkat, maks 3000"],
  ["coverUrl", "string (url)", "opsional", "URL media cover"],
  ["links", "array", "opsional", "Maks 8 item { label, url }"],
  ["isPublished", "boolean", "opsional", "default true"],
];

const createUpdateFields = [
  ["appSlug", "string", "wajib", "Slug aplikasi yang sudah ada"],
  ["title", "string", "wajib", "Judul update, maks 160"],
  ["description", "string", "opsional", "Isi update, maks 5000"],
  ["status", "enum", "opsional", "planning | building | testing | shipped (default building)"],
  ["version", "string", "opsional", "Contoh v0.8.0, maks 40"],
  ["media", "array url", "opsional", "Maks 12 URL media Cloudinary"],
  ["isPublished", "boolean", "opsional", "default true"],
];

const draftCopyFields = [
  ["appName", "string", "wajib", "Nama aplikasi untuk konteks"],
  ["context", "string", "wajib", "Catatan bebas, min 8 maks 6000"],
  ["tone", "string", "opsional", "Contoh: clear, optimistic, concise"],
];

const errors = [
  ["400", "Payload tidak valid atau slug sudah dipakai"],
  ["401", "Token AI tidak dikirim atau salah"],
  ["404", "appSlug / update tidak ditemukan"],
  ["413", "File upload melebihi 10MB"],
  ["415", "Tipe file tidak diizinkan"],
  ["429", "Terlalu banyak request"],
  ["500", "Kesalahan server / database"],
  ["503", "Konfigurasi env belum lengkap"],
];

export default function AIDocsPage() {
  return (
    <main className="docs-page">
      <div className="docs-ambient" />
      <nav className="docs-nav">
        <Link href="/" className="docs-brand"><span className="docs-logo" /> XySpace <span>Blog</span></Link>
        <Link href="/" className="docs-back"><ArrowLeft size={14} /> Kembali ke blog</Link>
      </nav>

      <header className="docs-hero">
        <p className="docs-eyebrow"><span className="live-dot" /> AI INTEGRATION API</p>
        <h1>Berikan AI jalur publishing yang aman.</h1>
        <p className="docs-lead">Agent AI bisa membuat aplikasi, menulis update progres, upload media, dan meminta draft copy — semuanya lewat satu token server yang tidak pernah terbuka ke publik.</p>
        <div className="docs-hero-actions">
          <a className="docs-button docs-button-primary" href="#authentication"><KeyRound size={15} /> Mulai dari autentikasi</a>
          <a className="docs-button docs-button-ghost" href="/api/ingest/schema" target="_blank">Schema JSON mentah <ArrowUpRight size={13} /></a>
        </div>
      </header>

      <div className="docs-body">
        <section className="docs-section" id="authentication">
          <h2><KeyRound size={18} /> Autentikasi</h2>
          <p>Semua endpoint tulis (POST) wajib mengirim token di header <code>Authorization</code>. Token disimpan sebagai env <code>AI_INGEST_TOKEN</code> di server dan hanya diberikan ke agent AI / layanan otomasi yang lo percaya.</p>
          {code(`Authorization: Bearer YOUR_AI_INGEST_TOKEN
Content-Type: application/json`)}
          <div className="docs-tip"><ShieldCheck size={16} /><p><b>Catatan keamanan:</b> token ini tidak boleh masuk ke JavaScript browser atau prompt publik. Generate dengan <code>openssl rand -hex 32</code>. Waktu pembuatan post (created_at) selalu dari server — client maupun AI tidak bisa memanipulasinya.</p></div>
        </section>

        <section className="docs-section" id="endpoints">
          <h2><Route size={18} /> Endpoint</h2>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Method</th><th>Path</th><th>Auth</th><th>Fungsi</th></tr></thead>
              <tbody>
                {endpoints.map((row) => (
                  <tr key={row.path}>
                    <td><span className={`docs-method docs-method-${row.method.toLowerCase()}`}>{row.method}</span></td>
                    <td><code>{row.path}</code></td>
                    <td>{row.auth}</td>
                    <td>{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="docs-section" id="create-app">
          <h2>1. Membuat aplikasi</h2>
          <p><code>action: &quot;create_app&quot;</code> — daftarkan aplikasi baru di ekosistem. Slug wajib unik.</p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Field</th><th>Tipe</th><th>Wajib</th><th>Keterangan</th></tr></thead>
              <tbody>{createAppFields.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody>
            </table>
          </div>
          {code(`curl -X POST https://YOUR-DOMAIN/api/ingest \\
  -H 'Authorization: Bearer YOUR_AI_INGEST_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "action": "create_app",
    "name": "Orbit",
    "slug": "orbit",
    "tagline": "Personal finance, in perfect motion.",
    "links": [{ "label": "Open app", "url": "https://example.com" }]
  }'`)}
        </section>

        <section className="docs-section" id="create-update">
          <h2>2. Menulis update progres</h2>
          <p><code>action: &quot;create_update&quot;</code> — catat progres terbaru untuk aplikasi yang sudah ada.</p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Field</th><th>Tipe</th><th>Wajib</th><th>Keterangan</th></tr></thead>
              <tbody>{createUpdateFields.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody>
            </table>
          </div>
          {code(`curl -X POST https://YOUR-DOMAIN/api/ingest \\
  -H 'Authorization: Bearer YOUR_AI_INGEST_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "action": "create_update",
    "appSlug": "orbit",
    "title": "Dashboard baru siap diuji",
    "description": "Filter kategori dan ringkasan pengeluaran sudah masuk tahap testing.",
    "status": "testing",
    "version": "v0.8.0",
    "media": ["https://res.cloudinary.com/YOUR_CLOUD/image/upload/.../preview.png"],
    "isPublished": true
  }'`)}
        </section>

        <section className="docs-section" id="upload">
          <h2>3. Upload media</h2>
          <p><code>POST /api/ingest/upload</code> (multipart) — upload preview ke Cloudinary. Respons berisi URL yang bisa dipakai di field <code>media</code>.</p>
          <div className="docs-tip"><ShieldCheck size={16} /><p><b>Batas file:</b> maksimal 10MB. Tipe yang diizinkan: PNG, JPEG, WebP, GIF, MP4, WebM, MOV. Format lain (termasuk SVG) ditolak demi keamanan.</p></div>
          {code(`curl -X POST https://YOUR-DOMAIN/api/ingest/upload \\
  -H 'Authorization: Bearer YOUR_AI_INGEST_TOKEN' \\
  -F 'appSlug=orbit' \\
  -F 'file=@./preview.png'

// Respons
{ "ok": true, "url": "https://res.cloudinary.com/.../preview.png",
  "publicId": "progress-pulse/orbit/xxxx", "resourceType": "image",
  "width": 1200, "height": 630 }`)}
        </section>

        <section className="docs-section" id="draft">
          <h2>4. Meminta draft copy (opsional)</h2>
          <p><code>action: &quot;draft_copy&quot;</code> — butuh <code>OPENAI_API_KEY</code> di server. AI menghasilkan draft JSON yang bisa lo review sebelum dikirim lewat <code>create_update</code>.</p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Field</th><th>Tipe</th><th>Wajib</th><th>Keterangan</th></tr></thead>
              <tbody>{draftCopyFields.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody>
            </table>
          </div>
          {code(`{
  "action": "draft_copy",
  "appName": "Orbit",
  "context": "Added category filtering and a monthly overview graph. QA begins today.",
  "tone": "clear, optimistic, concise"
}

// Respons
{ "draft": {
    "title": "Filter kategori dan grafik bulanan siap diuji",
    "description": "Ringkasan pengeluaran kini lebih tajam...",
    "status": "testing",
    "version": "v0.8.0"
  }
}`)}
        </section>

        <section className="docs-section" id="errors">
          <h2>Kode error</h2>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Kode</th><th>Arti</th></tr></thead>
              <tbody>{errors.map((row) => <tr key={row[0]}><td><code>{row[0]}</code></td><td>{row[1]}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="docs-section">
          <h2><Terminal size={18} /> Mulai cepat untuk agent AI</h2>
          <p>Alur standar: <code>create_app</code> (sekali) → <code>upload</code> media → <code>create_update</code> dengan media URL. Kalau mau copy yang lebih hidup, ambil <code>draft_copy</code> dulu.</p>
          <div className="docs-tip"><BookOpen size={16} /><p>Referensi cepat juga tersedia di <Link href="/api/ingest/schema">/api/ingest/schema</Link> dalam bentuk JSON yang bisa dibaca mesin.</p></div>
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
        <span>XySpace Blog — AI Integration API docs.</span>
      </footer>
    </main>
  );
}
