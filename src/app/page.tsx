import type { Metadata } from "next";
import PulseDashboard from "@/components/pulse-dashboard";
import { getPublicFeed } from "@/lib/feed";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "XySpace Blog — Building in public",
  description: "Catatan progres aplikasi, eksperimen, dan produk yang sedang dibangun di XySpace.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const { apps, updates, isDemo } = await getPublicFeed();
  return <PulseDashboard apps={apps} updates={updates} isDemo={isDemo} view="home" />;
}
