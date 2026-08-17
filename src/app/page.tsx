import PulseDashboard from "@/components/pulse-dashboard";
import { demoApps, demoUpdates } from "@/lib/demo-data";
import { getSupabasePublic } from "@/lib/supabase";
import type { ProgressUpdate, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getFeed() {
  const supabase = getSupabasePublic();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabase;
  if (demoMode) return { apps: demoApps, updates: demoUpdates, isDemo: true };

  const [{ data: appRows }, { data: updateRows }] = await Promise.all([
    supabase.from("apps").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("progress_updates").select("*, app:apps(id,name,slug)").eq("is_published", true).order("created_at", { ascending: false }),
  ]);

  return {
    apps: (appRows ?? []) as Project[],
    updates: (updateRows ?? []) as unknown as ProgressUpdate[],
    isDemo: false,
  };
}

export default async function Home() {
  const { apps, updates, isDemo } = await getFeed();
  return <PulseDashboard apps={apps} updates={updates} isDemo={isDemo} />;
}
