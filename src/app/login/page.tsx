"use client";

import { ArrowLeft, Globe, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [message, setMessage] = useState("");

  async function signIn() {
    const supabase = getSupabaseBrowser();
    if (!supabase) { setMessage("Tambahkan kredensial Supabase di .env.local terlebih dahulu."); return; }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) setMessage(error.message);
  }

  return <main className="login-page"><div className="login-glow" /><Link href="/" className="login-back"><ArrowLeft size={15} /> Kembali ke XySpace</Link><section className="login-card"><div className="login-logo">p<span>.</span></div><p className="eyebrow">OWNER ACCESS</p><h1>Welcome back.</h1><p>Sign in with the Google account configured as the owner of this progress log.</p><button onClick={signIn}><Globe size={18} /> Continue with Google</button>{message && <small>{message}</small>}<div className="login-note"><ShieldCheck size={15} /> Hanya email admin yang disetujui yang dapat mengelola konten.</div></section></main>;
}
