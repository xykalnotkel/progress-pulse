import "server-only";

import { createHmac } from "crypto";
import { isIP } from "net";
import type { SupabaseClient } from "@supabase/supabase-js";

export class AbuseControlUnavailableError extends Error {
  constructor() {
    super("Abuse controls are unavailable.");
    this.name = "AbuseControlUnavailableError";
  }
}

function secret() {
  const value = process.env.ABUSE_HASH_SECRET;
  if (!value || value.length < 32) throw new AbuseControlUnavailableError();
  return value;
}

function digest(scope: string, value: string) {
  return createHmac("sha256", secret()).update(`${scope}\0${value}`).digest("hex");
}

function firstIp(value: string | null) {
  if (!value) return null;
  const candidate = value.split(",")[0]?.trim().replace(/^\[|\]$/g, "") ?? "";
  return isIP(candidate) ? candidate : null;
}

/**
 * Vercel's forwarding header is preferred because the platform controls it.
 * Cloudflare and generic proxy headers are fallbacks for local/alternate hosts.
 */
export function getClientIp(request: Request) {
  return (
    firstIp(request.headers.get("x-vercel-forwarded-for")) ??
    firstIp(request.headers.get("cf-connecting-ip")) ??
    firstIp(request.headers.get("x-forwarded-for")) ??
    firstIp(request.headers.get("x-real-ip")) ??
    "unknown"
  );
}

export function createVisitorHash(request: Request, visitorId: string) {
  return digest("visitor-v1", `${getClientIp(request)}\0${visitorId}`);
}

export async function consumeApiRateLimit(
  supabase: SupabaseClient,
  request: Request,
  options: { action: string; limit: number; windowSeconds: number },
) {
  const keyHash = digest("rate-limit-v1", getClientIp(request));
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_key_hash: keyHash,
    p_action: options.action,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });

  if (error || typeof data !== "boolean") {
    console.error("[abuse-control] durable limiter unavailable", {
      action: options.action,
      code: error?.code ?? "invalid-response",
    });
    throw new AbuseControlUnavailableError();
  }

  return data;
}
