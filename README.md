# XySpace Blog — Progress Log

[![CI](https://github.com/xykalnotkel/progress-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/xykalnotkel/progress-pulse/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

A public, multi-app progress dashboard. Built with **Next.js**, **Supabase**, **Cloudinary**, and an optional AI publishing API.

## What is included

- Glossy purple / black / white visual system with dark and light modes
- Multiple apps, each with its own external link and slug
- Public timeline with progress status, real Cloudinary media, real likes, and threaded comments
- Comment threads: visitors can reply, and react with "Membantu / Setuju / Terima kasih"
- Owner and team replies carry badges: **XyDev** (owner) and **XyTeam** (collaborators)
- Public comments appear instantly (no manual approval), with an owner-only hide/show panel and team replies inside the admin control room
- Real like counters persisted in the database (additive only, one per browser)
- Google login protected admin control room
- Server-controlled `created_at` timestamps
- Cloudinary signed client upload for admin and server upload route for automation
- An AI ingestion API that can create apps, make progress posts, upload media, and (optionally) generate a title/description draft, documented on the [AI docs page](/docs/ai)
- Cloudinary media delivered optimized automatically: compression (`q_auto`) and WebP/AVIF (`f_auto`) baked into stored URLs
- Legal pages: [Terms](/terms), [Privacy](/privacy), [Cookies](/cookies), [Disclaimer](/disclaimer)
- Security headers, MIME allowlist on uploads, and a secret-scan CI job

## Security first

Do **not** commit `.env.local`, tokens, or cloud secrets. Never copy credentials that were shared in a chat or temporary note into the project.

If a real credential has ever been shared as plain text, rotate/revoke it in its provider dashboard before launch. This especially applies to source-control, deployment, Cloudflare, email, and Cloudinary secrets.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Demo mode is active when `NEXT_PUBLIC_DEMO_MODE=true` (or Supabase variables are absent). It lets you view the public design without any credentials.

## Production configuration

### 1. Supabase database

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql` in full.
3. In Authentication > Providers, enable **Google**.
4. In Authentication > URL Configuration, set:
   - Site URL: your deployed URL
   - Redirect URL: `https://YOUR-DOMAIN/auth/callback`
   - Local redirect: `http://localhost:3000/auth/callback`
5. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` / Vercel Environment Variables.
6. Set `ADMIN_EMAIL` to the Google email that owns the dashboard (comments get the **XyDev** badge). Optionally set `TEAM_EMAILS` (comma separated) to let collaborators reply with the **XyTeam** badge. API write actions refuse every other Google account.

> Google OAuth needs both a client ID **and a client secret** configured in Supabase. A client ID alone is not enough for login.

### 2. Cloudinary

Add the cloud name, API key, and API secret as server environment variables. Never prefix the API secret with `NEXT_PUBLIC_`.

The admin upload flow obtains a short-lived signed payload from `/api/media/signature`, then uploads the file directly to Cloudinary. The browser never sees your API secret.

### 3. AI / automation token

Generate a long random token:

```bash
openssl rand -hex 32
```

Store it as `AI_INGEST_TOKEN`. Give this value only to the AI agent / automation service that should be allowed to publish. Never put it in browser JavaScript or a public prompt.

You may optionally set `OPENAI_API_KEY` and `OPENAI_MODEL` to enable the `draft_copy` action. The app does not require an AI provider just to publish a post: any agent can supply `title` and `description` itself.

## AI API

Full documentation lives on the **[/docs/ai](/docs/ai)** page (payload schemas, curl examples, error codes). The machine-readable guide is available at:

```text
GET /api/ingest/schema
```

All AI write routes require:

```http
Authorization: Bearer YOUR_AI_INGEST_TOKEN
```

### Create an app

```bash
curl -X POST https://YOUR-DOMAIN/api/ingest \
  -H 'Authorization: Bearer YOUR_AI_INGEST_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "action":"create_app",
    "name":"Orbit",
    "slug":"orbit",
    "tagline":"Personal finance, in perfect motion.",
    "links":[{"label":"Open app","url":"https://example.com"}]
  }'
```

### Upload media from an AI agent

```bash
curl -X POST https://YOUR-DOMAIN/api/ingest/upload \
  -H 'Authorization: Bearer YOUR_AI_INGEST_TOKEN' \
  -F 'appSlug=orbit' \
  -F 'file=@./preview.png'
```

The response contains a Cloudinary `url`. Supply it in `media` when creating the update.

### Create a progress post

```bash
curl -X POST https://YOUR-DOMAIN/api/ingest \
  -H 'Authorization: Bearer YOUR_AI_INGEST_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "action":"create_update",
    "appSlug":"orbit",
    "title":"Dashboard baru siap diuji",
    "description":"Filter kategori dan ringkasan pengeluaran sudah masuk tahap testing.",
    "status":"testing",
    "version":"v0.8.0",
    "media":["https://res.cloudinary.com/YOUR_CLOUD/image/upload/.../preview.png"],
    "isPublished":true
  }'
```

`created_at` is not accepted from clients or AI agents. Supabase generates it on the server automatically.

### Ask for a copy draft (optional OpenAI configuration)

```json
{
  "action": "draft_copy",
  "appName": "Orbit",
  "context": "Added category filtering and a monthly overview graph. QA begins today.",
  "tone": "clear, optimistic, concise"
}
```

This returns a JSON draft with `title`, `description`, `status`, and optional `version`; you can review it or send it back using `create_update`.

## Public comments, replies and reactions

- Public visitors can submit a name and comment. **Comments appear instantly** — no manual approval step. Automated guards: spam-word filter and a rate limiter.
- Anyone can reply to a comment and react with **Membantu**, **Setuju**, or **Terima kasih** (additive, one per browser).
- Comment threads are served with the public feed, shown inline on the Updates page, the detail pages, and the shareable update URLs.
- Owner replies (badge **XyDev**) and collaborator replies (badge **XyTeam**) appear instantly; configure collaborators with `TEAM_EMAILS`.
- Owner and team can customize their profile (display name, title, avatar) from the control room; the profile is shown on their replies.
- The owner (top admin) can hide/show any comment from the control room — the safety valve after a comment has appeared publicly.
- Likes are stored in a `likes` table with row level security: anyone may count and add, no one may remove. The UI remembers each browser so one like per visitor.
- The included rate limiter is a lightweight in-memory guard for development. Before a high-traffic public launch, add Cloudflare Turnstile and provider-level rate limiting / WAF rules.

> Existing projects: run `supabase/migrations/001_likes.sql`, `supabase/migrations/002_comment_threads_and_reactions.sql`, and `supabase/migrations/003_profiles_and_avatars.sql` in the Supabase SQL Editor. Fresh setups get everything from `supabase/schema.sql`.

## Deploying to Vercel

1. Push this folder to your GitHub repository (after ensuring no `.env.local` is tracked).
2. Import it into Vercel.
3. Add every value from `.env.example` as environment variables in Vercel, including `NEXT_PUBLIC_SITE_URL` (your final domain) and `ADMIN_EMAIL`.
4. Set `NEXT_PUBLIC_DEMO_MODE=false`.
5. Add the final Vercel domain to Supabase Google redirect URLs.
6. Test: Google login, a Cloudinary media upload, a public comment through moderation, a like, an AI upload, and an AI post creation.

## Main routes

| Route | Use |
| --- | --- |
| `/` | Public progress log |
| `/updates/[id]` | Shareable update page with comments |
| `/login` | Google owner login |
| `/admin` | Add apps, Cloudinary media, updates, and moderate comments |
| `/docs/ai` | Human-readable AI integration docs |
| `/api/likes` | Public like endpoint |
| `/api/comments` | Public comment / reply submission (goes to moderation) |
| `/api/comment-reactions` | Public comment reaction endpoint |
| `/api/admin/comments` | Owner-only list of pending/approved comments |
| `/api/admin/comments/[id]/reply` | Owner/team reply with badge |
| `/api/ingest/schema` | AI API guide |
| `/api/ingest` | Secure AI action endpoint |
| `/api/ingest/upload` | Secure AI media upload endpoint |

