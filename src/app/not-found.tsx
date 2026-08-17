import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="error-orb" />
      <div className="error-card">
        <span className="error-eyebrow">404</span>
        <h1>Halaman yang lo cari nggak ada.</h1>
        <p>Alamat mungkin salah, atau udah dipindah. Balik ke progress log aja dulu.</p>
        <div className="error-actions">
          <Link className="error-button" href="/updates"><Search size={14} /> Cari update</Link>
          <Link className="error-button error-button-primary" href="/"><Home size={14} /> Beranda</Link>
        </div>
      </div>
    </main>
  );
}
