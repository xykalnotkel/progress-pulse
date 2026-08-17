# XySpace Blog — Progress Log

A public, multi-app progress dashboard. Built with **Next.js**, **Supabase**, **Cloudinary**, and an optional AI publishing API.

## What is included

- Glossy purple / black / white visual system with dark and light modes
- Multiple apps, each with its own external link and slug
- Public timeline with progress status, real Cloudinary media, likes, and comments
- Public comments are placed in a **pending** moderation state before appearing
- Google login protected admin control room
- Server-controlled `created_at` timestamps
- Cloudinary signed client upload for admin and server upload route for automation
- An AI ingestion API that can create apps, make progress posts, upload media, and (optionally) generate a title/description draft

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
6. Set `ADMIN_EMAIL` to the Google email that owns the dashboard. API write actions refuse every other Google account.

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

The machine-readable guide is available at:

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

## Public comment moderation

- Public visitors can submit a name and comment.
- The API saves it as `pending`; it is not publicly visible yet.
- Approve/reject a comment with `PATCH /api/admin/comments/:id` from an authenticated owner session.
- The included rate limiter is a lightweight in-memory guard for development. Before a high-traffic public launch, add Cloudflare Turnstile and provider-level rate limiting / WAF rules.

## Deploying to Vercel

1. Push this folder to a new **private** GitHub repository (after ensuring no `.env.local` is tracked).
2. Import it into Vercel.
3. Add every value from `.env.example` as environment variables in Vercel.
4. Set `NEXT_PUBLIC_DEMO_MODE=false`.
5. Add the final Vercel domain to Supabase Google redirect URLs.
6. Test: Google login, a Cloudinary media upload, public comment, AI upload, and AI post creation.

## Main routes

| Route | Use |
| --- | --- |
| `/` | Public progress log |
| `/login` | Google owner login |
| `/admin` | Add apps, Cloudinary media, and updates |
| `/api/ingest/schema` | AI API guide |
| `/api/ingest` | Secure AI action endpoint |
| `/api/ingest/upload` | Secure AI media upload endpoint |

