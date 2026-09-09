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
  <img src="https://img.shields.io/badge/AI-NVIDIA%20NIM%20%2B%20DeepSeek%20V4-76B900" alt="NVIDIA NIM"/>
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
| **Feed & profiles** | Personal posts with photos and captions, likes, follow/unfollow, member rosters |
| **Maya** | An AI companion (Maya Bora, a CSE student from Guwahati) powered by NVIDIA NIM. Remembers the conversation and doubles as an in-character help desk |
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
                                │  default model: deepseek-ai/deepseek-v4-flash │
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
│   │   ├── assessments.ts       # Assessment results + auto-join
│   │   ├── maya.ts              # Maya AI companion (NVIDIA NIM action)
│   │   └── _generated/          # Convex codegen (committed)
│   └── src/
│       ├── App.tsx              # Routes
│       ├── firebase.ts          # Firebase client init
│       ├── useFirebaseAuth.ts   # Auth hook wiring Firebase → Convex
│       ├── store/authStore.ts   # Zustand auth store
│       ├── components/          # Nav, ProtectedRoute, UserAvatar
│       ├── data/                # Assessment question banks
│       ├── pages/               # One file per route (Feed, Chat, MayaChat, ...)
│       └── theme.css            # Global neon/terminal theme
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
| `NVIDIA_MODEL` | no | `deepseek-ai/deepseek-v4-flash` |

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
| `NVIDIA_API_KEY` | Bearer token for `integrate.api.nvidia.com`. Required for Maya |
| `NVIDIA_MODEL` | Model id for Maya. Optional; defaults to `deepseek-ai/deepseek-v4-flash` |

> Never commit `.env` files. The NVIDIA key lives only in Convex, so it is never shipped to the browser.

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
| *(unset)* | `deepseek-ai/deepseek-v4-flash` |
| `deepseek-ai/deepseek-v4-flash` | `deepseek-ai/deepseek-v4-flash` |
| `deepseek-v4-flash-0731` | `deepseek-ai/deepseek-v4-flash-0731`, then `deepseek-ai/deepseek-v4-flash` if NVIDIA answers 404 |
| `gemma-4-31b-it` | `google/gemma-4-31b-it` |

Bare ids get the vendor prefix added automatically. If NVIDIA returns **404** for a model
(dated snapshots such as `-0731` are only enabled for some accounts), the action tries the
un-dated id and finally the default model before giving up, and logs each attempt in the
Convex dashboard **Logs** tab.

### DeepSeek specifics

DeepSeek V3.1 / V4 on NIM expose a "thinking" mode via `chat_template_kwargs`. Maya sends it
switched **off**: replies come back faster, the endpoint does not stall waiting for a reasoning
budget, and reasoning tokens cannot consume the whole `max_tokens` allowance and leave the
answer empty. Any `<think>…</think>` block that still appears in the content is stripped.

Requests time out after 90 seconds so a stalled upstream never leaves the chat spinner running forever.

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
| `None of the configured NVIDIA models are enabled for this API key` | `NVIDIA_MODEL` points at a model your account cannot call | Use an id shown on build.nvidia.com, e.g. `deepseek-ai/deepseek-v4-flash` |
| Maya never answers, no error for a long time | Upstream stall | The action now aborts after 90 s with a visible error. Check the Convex **Logs** tab for the model used and the upstream response |
| `Maya returned an empty response` | Model produced only reasoning or hit the token limit | Retry; if it persists with a custom model, switch to the default model |
| Nothing loads after login | `VITE_CONVEX_URL` points at a different deployment than the one `convex deploy` pushed to | Align the URL and deploy key, then rebuild |
| Communities page is empty | Seed not run | Run `communities:seedCommunities` from the Convex dashboard |

---

## Roadmap

| Item | Status |
|------|--------|
| Assessments, auto-matched communities, group chats, discussion boards | ✅ Shipped |
| Personal feed, profiles, follows, private DMs | ✅ Shipped |
| Maya AI companion on NVIDIA NIM (DeepSeek V4 Flash) | ✅ Shipped |
| Apply-to-join and user-created communities | ✅ Shipped |
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
