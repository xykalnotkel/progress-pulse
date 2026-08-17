import "server-only";

import { revalidatePath } from "next/cache";

export function revalidatePublicContent(updateId?: string) {
  revalidatePath("/");
  revalidatePath("/apps");
  revalidatePath("/updates");
  revalidatePath("/about");
  revalidatePath("/profile");
  revalidatePath("/sitemap.xml");
  if (updateId) revalidatePath(`/updates/${updateId}`);
}
