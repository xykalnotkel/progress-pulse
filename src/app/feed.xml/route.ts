import { getPublicRssUpdates } from "@/lib/feed";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 300;

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const updates = await getPublicRssUpdates();
  const items = updates.map((update) => {
    const url = `${siteUrl}/updates/${update.id}`;
    const description = update.description ?? `Progress update dari ${update.app?.name ?? "XySpace"}.`;
    const category = update.app?.name ?? "XySpace";
    return `<item>
      <title>${xml(update.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <pubDate>${new Date(update.created_at).toUTCString()}</pubDate>
      <category>${xml(category)}</category>
      <description>${xml(description)}</description>
    </item>`;
  }).join("\n");

  const document = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>XySpace Blog</title>
    <link>${xml(siteUrl)}</link>
    <description>Catatan progres aplikasi, eksperimen, dan produk XySpace.</description>
    <language>id-ID</language>
    <atom:link href="${xml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(document, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
