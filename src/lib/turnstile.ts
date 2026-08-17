import "server-only";

import { randomUUID } from "crypto";
import { getClientIp } from "@/lib/abuse";
import { getSiteUrl } from "@/lib/site-url";

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(
  request: Request,
  token: string | undefined,
  expectedAction: "comment" | "comment_reply",
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: randomUUID(),
  });
  const ip = getClientIp(request);
  if (ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(7_000),
      },
    );
    if (!response.ok) return false;

    const result = (await response.json()) as TurnstileResponse;
    const expectedHostname = new URL(getSiteUrl()).hostname;
    const valid =
      result.success === true &&
      result.hostname === expectedHostname &&
      result.action === expectedAction;
    if (!valid) {
      console.warn("[turnstile] verification rejected", {
        action: result.action ?? null,
        hostname: result.hostname ?? null,
        errors: result["error-codes"] ?? [],
      });
    }
    return valid;
  } catch {
    return false;
  }
}
