"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallback() {
  const [status, setStatus] = useState("Menyelesaikan login aman...");

  useEffect(() => {
    async function complete() {
      const supabase = getSupabaseBrowser();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const providerError = url.searchParams.get("error") || url.searchParams.get("error_description");

      if (!supabase) {
        setStatus("Konfigurasi Supabase belum tersedia. Kembali ke login...");
        window.setTimeout(() => window.location.replace("/login?error=setup"), 1400);
        return;
      }
      if (providerError) {
        setStatus("Google menolak atau membatalkan login. Kembali ke login...");
        window.setTimeout(() => window.location.replace("/login?error=oauth"), 1400);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("Sesi Google tidak dapat dibuat. Kembali ke login...");
          window.setTimeout(() => window.location.replace("/login?error=callback"), 1400);
          return;
        }
        window.location.replace("/admin");
        return;
      }

      // Fallback for an implicit OAuth response. PKCE is explicitly configured,
      // but this keeps login resilient if an older provider response is returned.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) { window.location.replace("/admin"); return; }
      }

      setStatus("Kode callback tidak ditemukan. Periksa Site URL dan Redirect URL Supabase.");
      window.setTimeout(() => window.location.replace("/login?error=callback"), 1800);
    }
    complete();
  }, []);

  return <main className="callback-page"><div className="callback-orb" /><p>{status}</p></main>;
}
