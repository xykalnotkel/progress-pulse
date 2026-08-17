"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallback() {
  const [status, setStatus] = useState("Menyelesaikan login aman...");

  useEffect(() => {
    async function complete() {
      const supabase = getSupabaseBrowser();
      const code = new URLSearchParams(window.location.search).get("code");
      if (!supabase || !code) { window.location.replace("/login?error=setup"); return; }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) { setStatus("Login gagal. Silakan coba lagi."); return; }
      window.location.replace("/admin");
    }
    complete();
  }, []);

  return <main className="callback-page"><div className="callback-orb" /><p>{status}</p></main>;
}
