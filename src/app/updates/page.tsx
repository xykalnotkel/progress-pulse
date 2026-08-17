import type { Metadata } from "next";
import PulseDashboard from "@/components/pulse-dashboard";
import { getPublicFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Updates", description: "Timeline update, preview, dan catatan pengembangan aplikasi XySpace.", alternates: { canonical: "/updates" } };

export default async function UpdatesPage() {
  const { apps, updates, isDemo } = await getPublicFeed();
  return <PulseDashboard apps={apps} updates={updates} isDemo={isDemo} view="updates" />;
}
