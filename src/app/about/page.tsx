import type { Metadata } from "next";
import PulseDashboard from "@/components/pulse-dashboard";
import { getPublicFeed } from "@/lib/feed";

export const revalidate = 300;
export const metadata: Metadata = { title: "About", description: "Tentang XySpace Blog dan cara kami membagikan proses pembangunan produk.", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const { apps, updates, isDemo } = await getPublicFeed();
  return <PulseDashboard apps={apps} updates={updates} isDemo={isDemo} view="about" />;
}
