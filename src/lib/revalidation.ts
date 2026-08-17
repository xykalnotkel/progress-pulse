import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export function revalidatePublicContent(updateId?: string) {
  revalidateTag("public-content", "max");
  revalidatePath("/");
  revalidatePath("/apps");
  revalidatePath("/updates");
  revalidatePath("/about");
  revalidatePath("/profile");
  revalidatePath("/sitemap.xml");
  if (updateId) revalidatePath(`/updates/${updateId}`);
}
