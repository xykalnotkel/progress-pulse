"use client";

const STORAGE_KEY = "xyspace-visitor-id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let memoryId: string | null = null;

export function getVisitorId() {
  if (memoryId) return memoryId;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && UUID_PATTERN.test(stored)) {
      memoryId = stored;
      return stored;
    }
  } catch {
    // Storage can be blocked by strict browser privacy settings.
  }

  memoryId = window.crypto.randomUUID();
  try {
    window.localStorage.setItem(STORAGE_KEY, memoryId);
  } catch {
    // The in-memory identifier still deduplicates for this page session.
  }
  return memoryId;
}
