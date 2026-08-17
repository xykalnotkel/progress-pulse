# XySpace Blog — Progress Log

[![CI](https://github.com/xykalnotkel/xyspaceblog/actions/workflows/ci.yml/badge.svg)](https://github.com/xykalnotkel/xyspaceblog/actions/workflows/ci.yml)
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
- Searchable public timeline with app/status filters, Cloudinary media, real likes, and threaded comments
- Comment threads: visitors can reply, and react with "Membantu / Setuju / Terima kasih"
- Owner and team replies carry badges: **XyDev** (owner) and **XyTeam** (collaborators)
- Public comments appear instantly with invisible Turnstile verification, durable rate limits, and an owner-only hide/show panel
- Real like counters persisted in the database with server-side anonymous deduplication
- Google login protected admin control room
- Owner workflow for create/edit apps and create/edit/draft/publish/delete updates with server-controlled timestamps
- RSS 2.0 feed at `/feed.xml` for release readers and aggregators
- Privacy-documented Vercel Analytics and Speed Insights for production observability
- Server-validated Cloudinary uploads with file-signature checks for admin and automation
- An AI ingestion API that can create apps, make progress posts, upload media, attach contributor emails, and (optionally) generate a title/description draft, documented on the [AI docs page](/docs/ai)
- Cloudinary media delivered optimized automatically: compression (`q_auto`) and WebP/AVIF (`f_auto`) baked into stored URLs
- Contributors per update rendered as overlapping avatar stack; resolves in real time from the profiles table
- Human-readable AI docs at [/docs/ai](/docs/ai), share bar (X, Facebook, WhatsApp, Telegram, TikTok) on every update
- Custom error / 404 / loading pages with branded skeleton loaders and shimmer image fade-in
- Admin route middleware: no-store, noindex, X-Robots-Tag for the protected control room
- Legal pages: [Terms](/terms), [Privacy](/privacy), [Cookies](/cookies), [Disclaimer](/disclaimer)
- Security headers, invisible Turnstile, byte-signature media validation, durable database rate limits, secret scanning, unit tests, and Playwright browser E2E

## Security model

Public reads and writes are mediated by validated server routes. Sensitive Supabase tables are closed to browser roles, admin capabilities are role-checked, media is verified from its byte signature, and CI scans every change for accidental secret exposure. Runtime configuration stays outside the repository.

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

The admin sends media to the authenticated `/api/media/upload` route. The server checks the real file signature, size, purpose, and role before forwarding it to Cloudinary. The browser never receives the Cloudinary API secret.

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

- Public visitors can submit a name and comment. **Comments appear instantly** after invisible Turnstile verification; spam filtering and a durable database limiter provide additional controls.
- Anyone can reply to a comment and react with **Membantu**, **Setuju**, or **Terima kasih**; duplicate reactions are blocked server-side.
- Comment threads are served with the public feed, shown inline on the Updates page, the detail pages, and the shareable update URLs.
- Owner replies (badge **XyDev**) and collaborator replies (badge **XyTeam**) appear instantly; configure collaborators with `TEAM_EMAILS`.
- Owner and team can customize their profile (display name, title, avatar) from the control room; the profile is shown on their replies.
- The owner (top admin) can hide/show any comment from the control room — the safety valve after a comment has appeared publicly.
- Likes and reactions are written only through server routes. Browser roles cannot query their internal hashes, and database constraints reject duplicate visitor interactions.
- Public write limits are stored atomically in Supabase, so they remain effective across serverless instances. Like and reaction duplicates are rejected by database constraints; provider-level WAF rules remain an additional defense layer.

> Existing projects: apply migrations 001 through 006 in order via the Supabase SQL Editor. Migration 005 and 006 harden private data and public write endpoints. Fresh setups get everything from `supabase/schema.sql`.

## Deploying to Vercel

1. Push this folder to your GitHub repository (after ensuring no `.env.local` is tracked).
2. Import it into Vercel.
3. Add every required value from `.env.example` as environment variables in Vercel, including `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ABUSE_HASH_SECRET`, and the Turnstile site/secret keys.
4. Set `NEXT_PUBLIC_DEMO_MODE=false`.
5. Add the final Vercel domain to Supabase Google redirect URLs.
6. Test: Google login, a Cloudinary media upload, a public comment through moderation, a like, an AI upload, and an AI post creation.

## Main routes

| Route | Use |
| --- | --- |
| `/` | Public progress log |
| `/updates/[id]` | Shareable update page with comments |
| `/feed.xml` | RSS 2.0 feed for published updates |
| `/login` | Google owner login |
| `/admin` | Create/edit drafts and published updates, manage media, team, and comments |
| `/docs/ai` | Human-readable AI integration docs |
| `/api/likes` | Public like endpoint |
| `/api/comments` | Public comment / reply submission (goes to moderation) |
| `/api/comment-reactions` | Public comment reaction endpoint |
| `/api/admin/comments` | Owner-only list of pending/approved comments |
| `/api/admin/comments/[id]/reply` | Owner/team reply with badge |
| `/api/ingest/schema` | AI API guide |
| `/api/ingest` | Secure AI action endpoint |
| `/api/ingest/upload` | Secure AI media upload endpoint |
| `/api/media/upload` | Authenticated owner/team media upload with byte-signature validation |

