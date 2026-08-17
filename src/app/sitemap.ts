import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://progress-pulse-phi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const modified = new Date();
  return ["", "/apps", "/updates", "/about"].map((path) => ({ url: `${siteUrl}${path}`, lastModified: modified, changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 }));
}
