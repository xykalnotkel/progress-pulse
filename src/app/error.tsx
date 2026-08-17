"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <main className="error-page">
      <div className="error-orb" />
      <div className="error-card">
        <span className="error-eyebrow">SOMETHING BROKE</span>
        <h1>Terjadi kesalahan saat memuat halaman.</h1>
        <p>Kami sudah catat errornya. Coba muat ulang, atau balik ke beranda.</p>
        <p className="error-digest">{error.digest ?? error.message}</p>
        <div className="error-actions">
          <button type="button" onClick={reset}><RefreshCw size={14} /> Muat ulang</button>
          <Link className="error-button" href="/"><Home size={14} /> Beranda</Link>
        </div>
      </div>
    </main>
  );
}
