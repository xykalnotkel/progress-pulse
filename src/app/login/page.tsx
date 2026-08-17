"use client";

import { ArrowLeft, Globe, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const loginErrors: Record<string, string> = {
  setup: "Konfigurasi Supabase belum tersedia di website.",
  callback: "Login belum menerima callback yang valid. Periksa Site URL dan Redirect URL di Supabase.",
  oauth: "Login Google dibatalkan atau ditolak oleh provider.",
};

export default function LoginPage() {
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    const error = new URLSearchParams(window.location.search).get("error");
    return error ? loginErrors[error] ?? "Login tidak dapat dilanjutkan." : "";
  });

  async function signIn() {
    const supabase = getSupabaseBrowser();
    if (!supabase) { setMessage("Konfigurasi Supabase belum tersedia. Coba refresh beberapa saat lagi."); return; }
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) setMessage(error.message);
  }

  return <main className="login-page"><div className="login-glow" /><Link href="/" className="login-back"><ArrowLeft size={15} /> Kembali ke XySpace Blog</Link><section className="login-card"><div className="login-logo"><Image className="login-logo-image" src="/images/xyspace-logo.webp" alt="XySpace" width={72} height={72} priority /></div><p className="eyebrow">OWNER ACCESS</p><h1>Welcome back.</h1><p>Masuk dengan akun Google pemilik untuk mengelola aplikasi dan update progres.</p><button onClick={signIn}><Globe size={18} /> Continue with Google</button>{message && <small>{message}</small>}<div className="login-note"><ShieldCheck size={15} /> Hanya email admin yang disetujui yang dapat mengelola konten.</div></section></main>;
}
