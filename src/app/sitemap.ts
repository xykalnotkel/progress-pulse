import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const modified = new Date();
  return ["", "/apps", "/updates", "/about", "/docs/ai"].map((path) => ({ url: `${siteUrl}${path}`, lastModified: modified, changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 }));
}
