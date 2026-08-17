import type { CommentReaction } from "@/lib/types";

export const REACTIONS: CommentReaction[] = ["membantu", "setuju", "terima kasih"];

export const REACTION_LABELS: Record<CommentReaction, string> = {
  membantu: "Membantu",
  setuju: "Setuju",
  "terima kasih": "Terima kasih",
};
