import Image from "next/image";
import type { AuthorBadge, UpdateStatus } from "@/lib/types";

const roleAsset: Record<AuthorBadge, string> = { XyDev: "/badges/xydev.webp", XyTeam: "/badges/xyteam.webp" };
const statusAsset: Record<UpdateStatus, string> = { planning: "/badges/planning.webp", building: "/badges/building.webp", testing: "/badges/testing.webp", shipped: "/badges/shipped.webp" };

export function RoleBadge({ badge }: { badge?: AuthorBadge | null }) {
  if (!badge) return null;
  return <Image className="badge-asset badge-role" src={roleAsset[badge]} alt={badge} width={140} height={56}/>;
}

export function StatusBadge({ status }: { status: UpdateStatus }) {
  return <Image className="badge-asset badge-status" src={statusAsset[status]} alt={status} width={180} height={60}/>;
}
