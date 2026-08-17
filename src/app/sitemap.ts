import type { MetadataRoute } from "next";
import { getPublicSitemapUpdates } from "@/lib/feed";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, priority: 1, changeFrequency: "weekly" },
    { url: `${siteUrl}/apps`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${siteUrl}/updates`, priority: 0.9, changeFrequency: "daily" },
    { url: `${siteUrl}/about`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${siteUrl}/docs/ai`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${siteUrl}/terms`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${siteUrl}/privacy`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${siteUrl}/cookies`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${siteUrl}/disclaimer`, priority: 0.3, changeFrequency: "yearly" },
  ];

  const updates = await getPublicSitemapUpdates();
  return [
    ...staticRoutes,
    ...updates.map((update) => ({
      url: `${siteUrl}/updates/${update.id}`,
      lastModified: new Date(update.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
