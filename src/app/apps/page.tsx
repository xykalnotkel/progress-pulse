import type { Metadata } from "next";
import PulseDashboard from "@/components/pulse-dashboard";
import { getPublicFeed } from "@/lib/feed";

export const revalidate = 300;
export const metadata: Metadata = { title: "Apps", description: "Aplikasi dan produk yang sedang dibangun oleh XySpace.", alternates: { canonical: "/apps", types: { "application/rss+xml": "/feed.xml" } } };

export default async function AppsPage() {
  const { apps, updates, isDemo } = await getPublicFeed();
  return <PulseDashboard apps={apps} updates={updates} isDemo={isDemo} view="apps" />;
}
