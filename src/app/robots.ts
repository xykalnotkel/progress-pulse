import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://progress-pulse-phi.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/auth/", "/api/"] }], sitemap: `${siteUrl}/sitemap.xml` };
}
