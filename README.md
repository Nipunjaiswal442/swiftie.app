# SWIFTIE

<p align="center">
  <strong>Find your people. Connect · Chat · Belong.</strong><br/>
  A community-discovery social app for India — take an assessment, get matched to a community, start talking.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite%206-61DAFB" alt="React + Vite"/>
  <img src="https://img.shields.io/badge/language-TypeScript%205-3178C6" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/backend-Convex-EE342F" alt="Convex"/>
  <img src="https://img.shields.io/badge/auth-Firebase%20Google%20Sign--In-FFCA28" alt="Firebase Auth"/>
  <img src="https://img.shields.io/badge/AI-NVIDIA%20NIM%20%2B%20Nemotron%203%20Ultra-76B900" alt="NVIDIA NIM"/>
  <img src="https://img.shields.io/badge/deploy-Vercel-000000" alt="Vercel"/>
  <img src="https://img.shields.io/badge/status-Beta-orange" alt="Status"/>
</p>

---

## Table of contents

- [What is Swiftie?](#what-is-swiftie)
- [Features](#features)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Maya — the in-app AI companion](#maya--the-in-app-ai-companion)
- [Data model](#data-model)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Conventions](#conventions)

---

## What is Swiftie?

Swiftie is a web app that helps people find a community they actually fit into. Instead of
following hashtags, you take short assessments (personality, ideology, occupation), get matched to
a community of people with the same result, and are dropped straight into that community's group
chat and discussion board. On top of that there is a personal feed, profiles, follows, private DMs,
and **Maya** — an always-online AI friend who chats with you and explains the app in character.

**Developer:** Nipun Jaiswal · [github.com/Nipunjaiswal442](https://github.com/Nipunjaiswal442)
**Live app:** deployed on Vercel from this repository
**License:** Proprietary / private repository

---

## Features

| Area | What you get |
|------|--------------|
| **Google Sign-In** | One-tap login via Firebase Auth; a Terms & Conditions gate on first login |
| **Onboarding** | Pick a username, bio, age, location, pronouns, current role and interests |
| **Assessments** | 30-question **Personality** (16 MBTI-style types), **Ideology** (progressive / liberal / conservative / libertarian) and **Occupation** (8 paths) quizzes |
| **Auto-matched communities** | Finishing an assessment auto-joins you to the matching community. No manual joining |
| **Discover & Explore** | Browse every community, see recommendations, apply to communities you did not match, or create your own |
| **Community spaces** | Each community has a real-time group chat and a discussion board with posts and likes |
| **Private DMs** | One-to-one conversations started from any profile, with read receipts |
| **Feed & profiles** | Personal posts with photos and captions, likes, threaded comments (reply, like, delete), follow/unfollow with followers/following lists, member rosters |
| **Profile first** | The profile is created right after sign-in, before anything else. Every assessment result is added to it automatically: type badge, score breakdown and matched community |
| **People on Swiftie** | A section on Discover listing everyone who has signed in, online members first, with search, filters and one-tap follow |
| **Settings** | Colour palettes (Tricolour, Cyan Circuit, Magenta Pulse, Amber Terminal, Monochrome, Daylight), text size and font, reduced motion, profile & photo editing, Help & Feedback, delete account |
| **Reports** | A ⚑ button on every post, comment and profile files a report for the admin |
| **Maya** | An AI companion (Maya Bora, a CSE student from Guwahati) powered by NVIDIA NIM. Remembers the conversation, doubles as an in-character help desk, and notes complaints / feature requests users mention in chat |
| **Admin console** | `/admin` — separate ID/password login. Account regulation (view, suspend, unsuspend, delete), report & feedback triage, content removal, audit log, and a daily round-up from Maya of complaints and requests |
| **Real-time everywhere** | Every list in the UI is a reactive Convex query, so chats, feeds and counts update live without polling |

---

## Architecture

The product runs on two managed services plus Vercel for static hosting. There is no server you
have to operate yourself.

```
┌────────────────────────────────────────────────────────────────────────┐
│  BROWSER  ·  React 18 + Vite + React Router  (web/src)                  │
│  Landing · Login · Onboarding · Feed · Chat · Community · Maya · ...    │
└───────────────┬───────────────────────────────┬────────────────────────┘
                │ Firebase ID token             │ Convex React client
                ▼                               ▼
┌───────────────────────────┐   ┌────────────────────────────────────────┐
│  FIREBASE                 │   │  CONVEX  (web/convex)                  │
│  Auth (Google Sign-In)    │──▶│  Validates the Firebase token (OIDC)   │
│  Storage (profile media)  │   │  Queries · Mutations · Actions         │
└───────────────────────────┘   │  Tables: users, posts, messages,       │
                                │  communities, mayaMessages, ...        │
                                └──────────────────┬─────────────────────┘
                                                   │ maya.sendToMaya (action)
                                                   ▼
                                ┌────────────────────────────────────────┐
                                │  NVIDIA NIM  integrate.api.nvidia.com  │
                                │  OpenAI-compatible chat completions    │
                                │  default model: nvidia/nemotron-3-ultra-550b-a55b │
                                └────────────────────────────────────────┘
```

- **Frontend** — React 18, TypeScript (strict), Vite 6, React Router 6, Zustand for auth state.
- **Backend** — [Convex](https://convex.dev): schema, queries, mutations and actions live in
  `web/convex/`. The frontend subscribes with `useQuery`, writes with `useMutation`, and calls
  third-party APIs through `useAction`.
- **Auth** — Firebase Google Sign-In on the client; Convex verifies the Firebase ID token through
  the OIDC provider declared in `web/convex/auth.config.js`.
- **AI** — the Maya action calls NVIDIA's OpenAI-compatible endpoint from the Convex server. The
  API key never reaches the browser.
- **Legacy** — `server/` is the original Express + Socket.IO + MongoDB backend. It is **not used**
  by the current web app and is kept only for reference.

---

## Project structure

```
swiftie.app/
├── README.md
├── package.json                 # Monorepo root scripts (dev / build → web/)
├── vercel.json                  # Vercel build + SPA rewrite
├── web/                         # The app
│   ├── index.html
│   ├── vite.config.ts
│   ├── .env.example             # Client-side variables (Vercel)
│   ├── convex/                  # Backend (deployed to Convex)
│   │   ├── schema.ts            # All tables + indexes
│   │   ├── auth.config.js       # Firebase OIDC provider
│   │   ├── users.ts             # Profiles, follow/unfollow, search
│   │   ├── posts.ts             # Personal feed + likes
│   │   ├── messages.ts          # Private DMs
│   │   ├── communities.ts       # Communities, membership, applications, seeding
│   │   ├── communityPosts.ts    # Community discussion board
│   │   ├── communityMessages.ts # Community group chats
│   │   ├── assessments.ts       # Assessment results + auto-join + public results for profiles
│   │   ├── comments.ts          # Comments + replies + comment likes (feed and community posts)
│   │   ├── feedback.ts          # Complaints, requests, bug reports, ⚑ reports
│   │   ├── maya.ts              # Maya AI companion (NVIDIA NIM action) + complaint capture
│   │   ├── nvidia.ts            # Shared NVIDIA NIM client (model fallback, timeouts)
│   │   ├── admin.ts             # Admin login/sessions, account regulation, triage, notifications
│   │   ├── adminDigest.ts       # Maya's daily round-up for the admin (LLM, with template fallback)
│   │   ├── crons.ts             # Daily digest schedule (09:00 IST)
│   │   ├── helpers.ts           # Shared helpers: auth guards, presence, account purge
│   │   └── _generated/          # Convex codegen (committed)
│   └── src/
│       ├── App.tsx              # Routes + appearance sync + presence
│       ├── appearance.ts        # Palette / text size / font / motion preferences
│       ├── firebase.ts          # Firebase client init
│       ├── useFirebaseAuth.ts   # Auth hook wiring Firebase → Convex
│       ├── store/authStore.ts   # Zustand auth store
│       ├── components/          # Nav, ProtectedRoute, PostCard, CommentsPanel, ProfileForm, ...
│       ├── data/                # Assessment question banks + result labels
│       ├── lib/                 # Formatting, admin session, session flags
│       ├── pages/               # One file per route (Feed, Settings, AdminConsole, ...)
│       └── theme.css            # Global theme: CSS variables, palettes, text settings
└── server/                      # LEGACY Express backend (unused, reference only)
```

---

## Quick start

### Prerequisites

- Node.js 20 LTS
- A [Firebase](https://console.firebase.google.com) project with **Google** sign-in enabled
- A [Convex](https://dashboard.convex.dev) account (free tier is fine)
- An [NVIDIA API key](https://build.nvidia.com) (`nvapi-…`) if you want Maya to reply

### 1. Clone and install

```bash
git clone https://github.com/Nipunjaiswal442/swiftie.app.git
cd swiftie.app/web
npm install
```

### 2. Configure the client

```bash
cp .env.example .env
# fill in the VITE_FIREBASE_* values from Firebase → Project settings → Your apps
```

### 3. Start Convex and the dev server (two terminals)

```bash
# terminal 1 — pushes web/convex/ to your dev deployment and watches for changes
npx convex dev

# terminal 2 — Vite on http://localhost:5173
npm run dev
```

`npx convex dev` prints your deployment URL. Put it in `VITE_CONVEX_URL` in `web/.env`.

### 4. Configure the backend

In the Convex dashboard for the deployment, open **Settings → Environment Variables** and add:

| Variable | Required | Example |
|----------|----------|---------|
| `NVIDIA_API_KEY` | yes, for Maya | `nvapi-xxxxxxxx` |
| `NVIDIA_MODEL` | no | `nvidia/nemotron-3-ultra-550b-a55b` |
| `ADMIN_PASSWORD` | yes, for the admin console | a long random string |
| `ADMIN_ID` | no (defaults to `admin`) | `nipun` |

Update the Firebase project id in `web/convex/auth.config.js` if you are not using the
original Firebase project.

### 5. Seed communities (once per deployment)

Run the `communities:seedCommunities` mutation from the Convex dashboard **Functions** tab.
It creates the built-in personality / ideology / occupation communities that assessments match into.

---

## Environment variables

### Client — `web/.env` locally, Vercel project settings in production

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` | Firebase web SDK config |
| `VITE_CONVEX_URL` | Your Convex deployment URL (`https://<name>.convex.cloud`) |
| `CONVEX_DEPLOY_KEY` | Production deploy key so the Vercel build can push `web/convex/` |

### Backend — Convex dashboard → Settings → Environment Variables

| Variable | Purpose |
|----------|---------|
| `NVIDIA_API_KEY` | Bearer token for `integrate.api.nvidia.com`. Required for Maya and for Maya's daily admin digest |
| `NVIDIA_MODEL` | Model id for Maya. Optional; defaults to `nvidia/nemotron-3-ultra-550b-a55b` |
| `ADMIN_PASSWORD` | Password for the admin console at `/admin`. Admin login is disabled until this is set |
| `ADMIN_ID` | Admin login ID. Optional; defaults to `admin` |

> Never commit `.env` files. The NVIDIA key and admin credentials live only in Convex, so they are never shipped to the browser.

---

## Maya — the in-app AI companion

Maya is implemented as a single Convex action, `sendToMaya` in `web/convex/maya.ts`:

1. Verifies the caller's Firebase identity and ensures a `users` row exists.
2. Loads the last 40 messages of that user's Maya history for context.
3. Saves the user's message so it appears in the UI immediately.
4. Calls NVIDIA NIM with the persona system prompt, the history and the new message.
5. Saves and returns the reply. The UI updates through the reactive `getMayaMessages` query.

### Choosing a model

Set `NVIDIA_MODEL` in the Convex dashboard. Any chat model on
[build.nvidia.com](https://build.nvidia.com) works. NVIDIA ids are `vendor/model`:

| You type | Sent to NVIDIA |
|----------|----------------|
| *(unset)* | `nvidia/nemotron-3-ultra-550b-a55b` |
| `nvidia/nemotron-3-ultra-550b-a55b` | `nvidia/nemotron-3-ultra-550b-a55b` |
| `nemotron-3-ultra-550b-a55b` | `nvidia/nemotron-3-ultra-550b-a55b` |
| `deepseek-v4-flash-0731` | `deepseek-ai/deepseek-v4-flash-0731`, then `deepseek-ai/deepseek-v4-flash`, then the default |
| `gemma-4-31b-it` | `google/gemma-4-31b-it` |

Bare ids get the vendor prefix added automatically. If NVIDIA returns **404** (model not
enabled for the account; dated snapshots such as `-0731` often are not) or **410** (model
reached end of life), the action tries the un-dated id and finally the default model before
giving up, and logs each attempt in the Convex dashboard **Logs** tab.

### Reasoning models (Nemotron 3, DeepSeek)

Nemotron 3 and DeepSeek V3.1 / V4 on NIM expose a "thinking" mode via `chat_template_kwargs`.
Maya sends it switched **off**: replies come back faster, the endpoint does not stall waiting
for a reasoning budget, and reasoning tokens cannot consume the whole `max_tokens` allowance and
leave the answer empty. Any `<think>…</think>` block that still appears in the content is stripped.

Requests time out after 90 seconds so a stalled upstream never leaves the chat spinner running forever.

### Complaints and requests

Maya knows the whole app (profiles, assessments, comments, People, Settings, reports) and answers
in character. When a user complains, reports a bug or asks for a feature while chatting, a keyword
heuristic in `maya.ts` files the message as `feedback` (source `maya`) — no extra model call — so it
reaches the admin console. Users can also file feedback formally from **Settings → Help & Feedback**
or with the ⚑ **Report** button on any post, comment or profile.

### Maya's daily round-up for the admin

`convex/crons.ts` runs `adminDigest.generateDailyDigest` every day at **09:00 IST** (03:30 UTC). It
collects the last 24 hours of complaints, requests, bug reports and ⚑ reports plus activity numbers,
asks NVIDIA NIM to write the summary in Maya's voice (urgent items first, grouped, with user handles
and a "my take"), and stores it as an admin notification. If `NVIDIA_API_KEY` is missing or the call
fails, a templated summary in Maya's voice is stored instead so the digest never goes missing. The
admin can also press **Ask Maya for a round-up now** in the console.

---

## Admin console

Open `/admin` (linked from the landing-page footer) and sign in with the ID/password configured in
the Convex dashboard (`ADMIN_ID`, `ADMIN_PASSWORD`). This is independent of Google sign-in:

- Login issues a random 12-hour session token (`adminSessions`) that every admin function validates.
  Five failed attempts lock the login for 15 minutes; all admin actions are written to `adminAuditLog`.
- **Overview** — accounts, online now, sign-ups, posts, comments, open reports/complaints/requests/bugs, unread Maya notifications, latest round-up.
- **Accounts** — search and filter every account; view details (profile, assessments, communities, recent content, reports against them, feedback they sent); **suspend** with a reason (the user sees an "Access paused" screen and can appeal), **unsuspend**, or **delete** (purges everything the user created).
- **Reports & feedback** — triage complaints, requests, bugs and ⚑ reports (from forms, reports, or things users told Maya): resolve/dismiss with a note the user can see, remove reported content, view or suspend the reported user.
- **Maya** — daily round-ups and instant pings for new reports/feedback, with unread counts and an on-demand round-up button.
- **Audit log** — the last 100 admin actions.

---

## Data model

All tables are declared in `web/convex/schema.ts`. Every document also carries Convex's
`_id` and `_creationTime`.

| Table | Key fields | Purpose |
|-------|-----------|---------|
| `users` | `tokenIdentifier` (Firebase UID), `username`, `displayName`, `bio`, photos, `age`, `location`, `pronouns`, `currentRole`, `interests[]`, cached `personalityResult` / `ideologyResult` / `occupationResult` | Profiles |
| `follows` | `followerId`, `followingId` | Follow graph |
| `posts`, `likes` | `authorId`, `imageUrl`, `caption`, counters | Personal feed |
| `conversations`, `messages` | `participantIds[]`, `senderId`, `content`, `readAt` | Private DMs |
| `assessmentResults` | `userId`, `section`, result | Per-user assessment outcomes |
| `communities` | `slug`, `name`, `section` (`personality` / `ideology` / `occupation` / `custom`), `matchKey`, `memberCount`, `icon`, `isUserCreated` | Built-in and user-created communities |
| `communityMembers` | `communityId`, `userId`, `joinedAt` | Membership |
| `communityPosts`, `communityPostLikes` | `communityId`, `authorId`, `content`, counters | Discussion boards |
| `communityMessages` | `communityId`, `senderId`, `content` | Group chats |
| `communityApplications` | `userId`, `communityId`, `answers`, `status` | Apply-to-join flow for unmatched communities |
| `mayaMessages` | `userId`, `role` (`user` / `assistant`), `content` | Maya conversation history |
| `comments`, `commentLikes` | `postId` (feed or community post), `parentId`, `authorId`, `content`, counters | Threaded comments on both kinds of post |
| `feedback` | `userId`, `type` (`complaint` / `request` / `bug` / `report` / `other`), `source` (`form` / `report` / `maya`), `subject`, `message`, target, `status`, `adminNote` | Complaints, requests and reports |
| `adminSessions`, `adminLoginThrottle` | `token`, `adminId`, `expiresAt` | Admin console sessions and brute-force throttle |
| `adminNotifications` | `kind` (`daily_digest` / `report` / `feedback` / `system`), `title`, `body`, `readAt`, `stats` | Maya's round-ups and instant admin pings |
| `adminAuditLog` | `adminId`, `action`, `targetUserId`, `details` | Every admin action |

`users` also carries `status` (`active` / `suspended`), `suspendedReason`, `prefs` (palette, text size, font, motion) and `profileCompletedAt`.

Access control is enforced inside each Convex function via `ctx.auth.getUserIdentity()`.

---

## Deployment

### Web + backend → Vercel (one build)

`vercel.json` runs `npm run build:ci` inside `web/`, which is:

```
npx convex deploy --cmd 'npm run build' || npm run build
```

With `CONVEX_DEPLOY_KEY` set in Vercel, each production build first pushes `web/convex/` to
the production Convex deployment and injects the matching `VITE_CONVEX_URL`, then builds the
Vite bundle into `web/dist`. If the Convex deploy step fails, the build still produces the
static site so the frontend is never taken down by a backend deploy hiccup.

Steps:

1. Import the GitHub repo in Vercel (framework preset: **Vite**, root: repository root).
2. Add every `VITE_FIREBASE_*` variable plus `VITE_CONVEX_URL` and `CONVEX_DEPLOY_KEY`.
3. Add `NVIDIA_API_KEY` (and optionally `NVIDIA_MODEL`) in the **Convex** dashboard, not Vercel.
4. Push to the default branch. Vercel builds and deploys automatically.

Changing only Convex environment variables does **not** require a redeploy; actions read them
at runtime.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Maya shows the typing dots and then an error `NVIDIA_API_KEY is not set` | Key missing in Convex | Add `NVIDIA_API_KEY` in the Convex dashboard for the **same deployment** the site uses (dev vs prod) |
| `NVIDIA API rejected the key (401)` | Wrong or expired key, or pasted with quotes/spaces | Generate a new key at build.nvidia.com and paste only the `nvapi-…` value |
| `None of the configured NVIDIA models are available for this API key` | `NVIDIA_MODEL` points at a model your account cannot call (404) or one NVIDIA has retired (410) | Use a current id shown on build.nvidia.com, e.g. `nvidia/nemotron-3-ultra-550b-a55b` |
| Maya never answers, no error for a long time | Upstream stall | The action now aborts after 90 s with a visible error. Check the Convex **Logs** tab for the model used and the upstream response |
| `Maya returned an empty response` | Model produced only reasoning or hit the token limit | Retry; if it persists with a custom model, switch to the default model |
| Nothing loads after login | `VITE_CONVEX_URL` points at a different deployment than the one `convex deploy` pushed to | Align the URL and deploy key, then rebuild |
| Communities page is empty | Seed not run | Run `communities:seedCommunities` from the Convex dashboard |
| Admin login says "not configured" | `ADMIN_PASSWORD` missing | Add `ADMIN_PASSWORD` (and optionally `ADMIN_ID`) in the Convex dashboard for the deployment the site uses |
| Maya's daily round-up reads like a plain list | NVIDIA call failed or key missing | The template fallback was used; check `NVIDIA_API_KEY` and the Convex **Logs** tab for `[adminDigest]` |

---

## Roadmap

| Item | Status |
|------|--------|
| Assessments, auto-matched communities, group chats, discussion boards | ✅ Shipped |
| Personal feed, profiles, follows, private DMs | ✅ Shipped |
| Maya AI companion on NVIDIA NIM (Nemotron 3 Ultra) | ✅ Shipped |
| Apply-to-join and user-created communities | ✅ Shipped |
| Comments & replies, People on Discover, follower lists, profile insights | ✅ Shipped |
| Settings: palettes, text size, profile editing, delete account | ✅ Shipped |
| Admin console with Maya's daily complaint/request digest | ✅ Shipped |
| Streaming Maya replies | 🔄 Planned |
| Push notifications | 🔄 Planned |
| End-to-end encrypted DMs | 🔄 Planned |
| Native mobile apps | 🔄 Planned |

---

## Conventions

- TypeScript strict mode everywhere; `tsc -b` must pass before `vite build`.
- Functional React components with hooks only; no class components.
- Every Convex function checks `ctx.auth.getUserIdentity()` before touching data.
- Third-party secrets are read from Convex environment variables inside actions, never bundled.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

---

<p align="center">Made in India · Swiftie © 2026 — All Rights Reserved</p>
