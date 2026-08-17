"use client";

import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      flowType: "pkce",
      // The callback page exchanges the PKCE code itself. Disabling automatic URL
      // detection avoids a race where Supabase clears `?code=` before the page reads it.
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
