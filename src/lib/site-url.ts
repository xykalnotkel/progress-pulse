/**
 * Canonical site URL used by SEO metadata, sitemap, robots and share links.
 * Override with NEXT_PUBLIC_SITE_URL in production.
 */
export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://progress-pulse-phi.vercel.app";
}
