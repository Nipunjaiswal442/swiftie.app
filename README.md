# SWIFTIE

<p align="center">
  <strong>India's privacy-first social media & messaging platform</strong><br/>
  Connect · Chat · Encrypt
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue" alt="Platform"/>
  <img src="https://img.shields.io/badge/language-TypeScript-3178C6" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/framework-React%20Native%200.74%2B-61DAFB" alt="React Native"/>
  <img src="https://img.shields.io/badge/backend-Node.js%2020%20LTS-339933" alt="Node.js"/>
  <img src="https://img.shields.io/badge/database-MongoDB-47A248" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/encryption-Signal%20Protocol-6C4AB6" alt="Signal Protocol"/>
  <img src="https://img.shields.io/badge/status-In%20Development-orange" alt="Status"/>
</p>

---

## Overview

Swiftie is an Indian social media and messaging platform combining social networking (profiles, photo sharing, social feed) with a secure end-to-end encrypted messaging system powered by the Signal Protocol. Built with React Native (TypeScript) for a single cross-platform codebase covering iOS, Android, and Web.

**Developer:** Nipun Jaiswal
**GitHub:** [github.com/Nipunjaiswal442/swiftie.app](https://github.com/Nipunjaiswal442/swiftie.app)
**Target Platforms:** iOS 14+, Android API 24+, Web
**License:** Proprietary / Private Repository

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile UI | React Native | 0.74+ |
| Web UI | React Native Web (Expo) | SDK 52 |
| Language | TypeScript | 5.x (strict) |
| Navigation | React Navigation | 6.x |
| Backend | Node.js + Express.js | 20 LTS / 4.x |
| Database | MongoDB (Mongoose ODM) | Atlas / Render |
| Authentication | Firebase Auth (Google Sign-In) | 20.x |
| Media Storage | Firebase Storage | 20.x |
| Real-time | Socket.IO | 4.x |
| Encryption | Signal Protocol (libsignal-client) | latest |
| Deployment | Render (backend), Vercel (web), App Store + Play Store | — |

---

## System Architecture

```
+─────────────────────────────────────────────────────────────+
│           MOBILE CLIENT (React Native + TypeScript)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Auth    │ │ Profile  │ │   Chat   │ │   Feed   │       │
│  │  Screen  │ │  Screen  │ │  Screen  │ │  Screen  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
+─────────────────────────────────────────────────────────────+
               │              │              │
               ▼              ▼              ▼
+─────────────────────────────────────────────────────────────+
│                        API LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  REST API    │  │  Socket.IO   │  │ Firebase SDK │      │
│  │ (Express.js) │  │ (Real-time)  │  │(Auth+Store)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
+─────────────────────────────────────────────────────────────+
               │              │              │
               ▼              ▼              ▼
+─────────────────────────────────────────────────────────────+
│                       DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │   Firebase   │  │   Firebase   │      │
│  │  (Render)    │  │    Auth      │  │   Storage    │      │
│  │ Users, Msgs  │  │ Google SSO   │  │ Photos/Media │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
+─────────────────────────────────────────────────────────────+
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Google Sign-In** | One-tap authentication via Firebase Auth |
| **User Profiles** | Display name, @username, bio, profile + cover photos |
| **Social Feed** | Posts from followed users, infinite scroll, pull-to-refresh |
| **Photo Sharing** | Camera/gallery upload, smart compression (~500KB), 100MB/user |
| **Like & Comment** | Full post interaction system |
| **Follow System** | Follow/unfollow with real-time follower counts |
| **E2E Encrypted Chat** | Signal Protocol: X3DH key exchange + Double Ratchet |
| **Real-time Messaging** | Socket.IO WebSocket delivery, typing indicators, read receipts |
| **User Search** | Debounced search by name or @username |
| **Push Notifications** | Firebase Cloud Messaging for offline delivery |
| **Cross-platform** | Single RN codebase for iOS + Android + Web |

---

## E2E Encryption Protocol

Swiftie implements the **Signal Protocol** — the same standard used by Signal and WhatsApp.

```
SENDER DEVICE                    SERVER                    RECEIVER DEVICE
     │                              │                              │
     │── X3DH Key Agreement ───────►│── Key Bundle Lookup ────────►│
     │                              │                              │
     │── Encrypted Message ────────►│── Store Ciphertext ─────────►│
     │   (AES-256 via Double Ratchet)│  (Server sees ONLY bytes)    │
     │                              │                              │
     │                              │◄─ Decrypt locally ──────────│
```

- **Identity Key Pair** — Long-term Ed25519 key, stored in device Keychain/Keystore
- **X3DH** — Initial key agreement; derives shared secret without server involvement
- **Double Ratchet** — Per-message key evolution; forward secrecy + break-in recovery
- **AES-256-CBC** — Symmetric encryption of each message payload
- **Server Role** — Relays ciphertext only. Zero plaintext ever reaches the server.

---

## Database Schema (MongoDB)

### `users`
```ts
{ firebaseUid, email, username, displayName, bio, profilePhotoUrl, coverPhotoUrl,
  followers[], following[], postsCount, storageUsed, storageLimit (100MB),
  signalIdentityKey, signalSignedPreKey, signalPreKeys[], isOnline, lastSeen }
```

### `posts`
```ts
{ author, imageUrl, caption, likes[], likesCount, comments[], commentsCount, createdAt }
```

### `messages`
```ts
{ conversationId, sender, recipient, ciphertext, messageType,
  senderRatchetKey, messageNumber, timestamp, deliveredAt, readAt }
```

### `conversations`
```ts
{ participants[2], conversationId, lastMessage, unreadCount{}, createdAt, updatedAt }
```

---

## API Endpoints

Base URL: `https://swiftie-api.onrender.com/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/firebase` | Exchange Firebase token → JWT |
| GET | `/users/me` | Current user profile |
| PUT | `/users/me` | Update profile |
| GET | `/users/:id` | Get user by ID |
| POST | `/users/:id/follow` | Follow a user |
| DELETE | `/users/:id/follow` | Unfollow a user |
| GET | `/users/search?q=` | Search users |
| GET | `/feed` | Paginated feed |
| POST | `/posts` | Create post |
| GET | `/posts/:id` | Get post |
| DELETE | `/posts/:id` | Delete own post |
| POST | `/posts/:id/like` | Like post |
| DELETE | `/posts/:id/like` | Unlike post |
| POST | `/posts/:id/comments` | Add comment |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/messages` | Send message |
| PUT | `/messages/:id/read` | Mark as read |
| GET | `/keys/:userId` | Get Signal public keys |
| POST | `/keys/prekeys` | Upload pre-key bundle |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client→Server | Authenticate with JWT |
| `message:send` | Client→Server | Send encrypted message |
| `message:receive` | Server→Client | Deliver encrypted message |
| `message:delivered` | Server→Client | Delivery confirmation |
| `message:read` | Client→Server | Mark as read |
| `typing:start` | Client→Server | Typing indicator on |
| `typing:stop` | Client→Server | Typing indicator off |
| `user:online` | Server→Client | User came online |
| `user:offline` | Server→Client | User went offline |

---

## Project Structure

```
swiftie.app/
├── README.md
├── package.json              # Monorepo root
├── vercel.json               # Vercel deployment config
├── landing/
│   └── index.html            # Marketing landing page (static)
├── mobile/                   # Swiftie app (Expo + React Native + Web)
│   ├── app/                  # Expo Router screens (welcome, feed, chat, profile...)
│   ├── components/           # Reusable UI (cards, landing sections, effects)
│   ├── services/             # API, socket, encryption, Firebase integrations
│   └── package.json
└── server/                   # Express backend (TypeScript)
    ├── src/
    │   ├── index.ts          # Express + Socket.IO entry
    │   ├── config/
    │   │   ├── db.ts         # MongoDB connection
    │   │   └── firebase-admin.ts
    │   ├── models/
    │   │   ├── User.ts, Post.ts, Message.ts, Conversation.ts
    │   ├── routes/
    │   │   ├── auth.ts, users.ts, posts.ts, messages.ts, keys.ts
    │   ├── middleware/
    │   │   ├── authMiddleware.ts, rateLimiter.ts, errorHandler.ts
    │   ├── socket/
    │   │   └── socketHandler.ts
    │   └── utils/
    │       ├── jwt.ts, storageTracker.ts
    └── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 20 LTS
- MongoDB Atlas account (or local MongoDB)
- Firebase project with Google Auth enabled

### 1. Clone
```bash
git clone https://github.com/Nipunjaiswal442/swiftie.app.git
cd swiftie.app
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env   # Fill in your secrets
npm run dev            # Starts on http://localhost:5000
```

### 3. Web App (React Native Web via Expo)
```bash
cd mobile
npm install
npm run web            # Starts Expo web dev server
```

### 4. Mobile (React Native)
```bash
npm install
npx react-native start          # Metro bundler
npx react-native run-android    # Android
npx react-native run-ios        # iOS (macOS only)
```

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/swiftie
JWT_SECRET=your_256_bit_random_secret
JWT_EXPIRY=7d
FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Web Client (`mobile/.env`)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

> **NEVER commit `.env` files or `firebase-service-account.json` to Git.**

---

## Deployment

### Backend → Render
1. Create Web Service on [render.com](https://render.com), connect repo
2. Root directory: `server/`
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Add all env vars in Render dashboard
6. Upload `firebase-service-account.json` as a secret file

### Web App → Vercel
```bash
vercel --prod  # or connect GitHub repo in Vercel dashboard
```

### Mobile → App Stores
- **iOS:** Xcode → Archive → App Store Connect → TestFlight
- **Android:** `cd android && ./gradlew assembleRelease` → Google Play Console
- **EAS Build:** `eas build --platform all`

---

## Development Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Project setup, navigation, Firebase Auth | ✅ In Progress |
| 2 | User profiles (CRUD), Firebase Storage | 🔄 Pending |
| 3 | Post creation, feed, likes, comments | 🔄 Pending |
| 4 | Real-time chat with Socket.IO | 🔄 Pending |
| 5 | Signal Protocol E2E encryption | 🔄 Pending |
| 6 | Push notifications (FCM), polish | 🔄 Pending |
| 7 | Testing, performance optimization | 🔄 Planned |
| 8 | Beta launch (TestFlight + Play Console) | 🔄 Planned |

---

## Coding Conventions

- TypeScript strict mode (`strict: true`)
- Functional components with React Hooks only
- `async/await` everywhere — no raw `.then()` chains
- All API responses: `{ success: boolean, data?: any, error?: string }`
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Never** log, store, or transmit plaintext message content on the server

---

## Security Rules

1. Messages are E2E encrypted — server never sees plaintext
2. All JWT verification happens in `authMiddleware.ts`
3. Image uploads compressed client-side before Firebase Storage upload
4. Storage quota enforced: `storageUsed + fileSize ≤ storageLimit (100MB)`
5. Socket.IO connections verified with JWT on handshake
6. All secrets via environment variables — never hardcoded

---

## Firebase Storage Budget (per user)

| Category | Limit | Notes |
|----------|-------|-------|
| Profile Photo | 5 MB | Compressed JPEG |
| Cover Photo | 5 MB | Compressed JPEG |
| Post Images | 70 MB | ~14 posts |
| Chat Media | 20 MB | Encrypted attachments |
| **Total** | **100 MB** | Tracked in `users.storageUsed` |

---

## Made in India

Designed for the Indian digital ecosystem. Privacy-first approach aligned with India's data sovereignty vision.

**Developer:** Nipun Jaiswal
**Contact:** [github.com/Nipunjaiswal442](https://github.com/Nipunjaiswal442)

---

*Swiftie © 2026 — All Rights Reserved*
