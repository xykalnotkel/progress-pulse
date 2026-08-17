import type { Comment, ProgressUpdate, Project } from "@/lib/types";

export const demoApps: Project[] = [
  {
    id: "app-orbit",
    slug: "orbit",
    name: "Orbit",
    tagline: "Personal finance, in perfect motion.",
    description: "A calm, intelligent way to see where your money is going.",
    cover_url: null,
    links: [{ label: "Open app", url: "https://example.com/orbit" }],
    is_published: true,
    created_at: "2026-08-02T09:00:00.000Z",
  },
  {
    id: "app-frame",
    slug: "frame",
    name: "Frame",
    tagline: "A private home for your ideas.",
    description: "Capture, organise and revisit the work that matters.",
    cover_url: null,
    links: [{ label: "View project", url: "https://example.com/frame" }],
    is_published: true,
    created_at: "2026-08-07T09:00:00.000Z",
  },
  {
    id: "app-signal",
    slug: "signal",
    name: "Signal",
    tagline: "Teams, kept in sync.",
    description: "Focused project signal without the noise.",
    cover_url: null,
    links: [{ label: "See website", url: "https://example.com/signal" }],
    is_published: true,
    created_at: "2026-08-10T09:00:00.000Z",
  },
];

const orbitComments: Comment[] = [
  { id: "cm-1", update_id: "update-01", author_name: "Nadia", body: "The hierarchy here feels incredibly clear. Can’t wait to try the category drill-down.", status: "approved", created_at: "2026-08-16T10:00:00.000Z" },
  { id: "cm-2", update_id: "update-01", author_name: "Dimas", body: "Love the direction. The calm detail is a really nice touch.", status: "approved", created_at: "2026-08-16T13:20:00.000Z" },
];

const frameComments: Comment[] = [
  { id: "cm-3", update_id: "update-02", author_name: "Sari", body: "Search speed is what I was waiting for. Nice work.", status: "approved", created_at: "2026-08-15T09:05:00.000Z" },
];

export const demoUpdates: ProgressUpdate[] = [
  {
    id: "update-01",
    app_id: "app-orbit",
    title: "The new spending cockpit is ready for testing",
    description: "A more focused first glance at your month. Categories now flow into a single, interactive view, with the important changes pulled forward.",
    status: "testing",
    version: "v0.8.0",
    media: [],
    is_published: true,
    created_at: "2026-08-16T09:35:00.000Z",
    app: { id: "app-orbit", name: "Orbit", slug: "orbit" },
    comment_count: orbitComments.length,
    likes_count: 47,
    comments: orbitComments,
  },
  {
    id: "update-02",
    app_id: "app-frame",
    title: "Saved views, now with a little more magic",
    description: "We rebuilt the collection experience from the ground up. Boards can now hold richer context, cleaner previews and a much faster search flow.",
    status: "building",
    version: "v0.4.2",
    media: [],
    is_published: true,
    created_at: "2026-08-14T14:10:00.000Z",
    app: { id: "app-frame", name: "Frame", slug: "frame" },
    comment_count: frameComments.length,
    likes_count: 31,
    comments: frameComments,
  },
  {
    id: "update-03",
    app_id: "app-signal",
    title: "Notifications that know when to be quiet",
    description: "First pass on a deliberate notification layer: grouped by intent, with room for each workspace to decide how loud it should be.",
    status: "planning",
    version: "v0.1.0",
    media: [],
    is_published: true,
    created_at: "2026-08-12T04:20:00.000Z",
    app: { id: "app-signal", name: "Signal", slug: "signal" },
    comment_count: 0,
    likes_count: 18,
    comments: [],
  },
];

export const demoComments = orbitComments;
