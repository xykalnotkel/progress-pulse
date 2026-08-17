import type { Metadata } from "next";
import PulseDashboard from "@/components/pulse-dashboard";
import { getPublicFeed } from "@/lib/feed";
import { getPublicOwnerProfile } from "@/lib/public-profile";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "XySpace Blog — Building in public",
  description: "Catatan progres aplikasi, eksperimen, dan produk yang sedang dibangun di XySpace.",
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
};

export default async function Home() {
  const [{ apps, updates, isDemo }, ownerProfile] = await Promise.all([getPublicFeed(), getPublicOwnerProfile()]);
  return <PulseDashboard apps={apps} updates={updates} isDemo={isDemo} view="home" ownerProfile={ownerProfile} />;
}
