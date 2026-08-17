"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export default function HumanCheck({
  action,
  onToken,
}: {
  action: "comment" | "comment_reply";
  onToken: (token: string | null) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return <p className="comment-notice error">Proteksi anti-bot belum tersedia.</p>;

  return (
    <Turnstile
      siteKey={siteKey}
      options={{ action, size: "invisible", execution: "render", language: "id" }}
      onSuccess={onToken}
      onExpire={() => onToken(null)}
      onError={() => onToken(null)}
    />
  );
}
