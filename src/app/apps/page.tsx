import type { Metadata } from "next";
import PulseDashboard from "@/components/pulse-dashboard";
import { getPublicApps } from "@/lib/feed";

export const revalidate = 300;
export const metadata: Metadata = { title: "Apps", description: "Aplikasi dan produk yang sedang dibangun oleh XySpace.", alternates: { canonical: "/apps", types: { "application/rss+xml": "/feed.xml" } } };

export default async function AppsPage() {
  const apps = await getPublicApps();
  return <PulseDashboard apps={apps} updates={[]} view="apps" />;
}
