# 🚀 Quick Start Guide - Fix "Access Blocked" Error

## Immediate Fix for "Access blocked: Authorization Error"

This error happens because your domain is not registered in Firebase. Follow these steps:

### Step 1: Add Your Domain to Firebase (REQUIRED)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **swiftie-d0ea0**
3. Click **Authentication** in left sidebar
4. Click **Settings** tab
5. Scroll to **Authorized domains** section
6. Click **Add domain**
7. Add these domains:
   - `localhost` (for local development)
   - `your-app.vercel.app` (if deploying to Vercel)
   - `your-app.web.app` (if using Firebase Hosting)
   - Any custom domain you're using
8. Click **Save**
9. Wait 5-10 minutes for changes to propagate

### Step 2: Clear Browser Cache

1. Open browser DevTools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or try incognito/private mode

### Step 3: Test Login

1. Go to your app URL
2. Click "Jack In with Google"
3. Login should work now!

---

## Local Development Setup

### Backend

```bash
cd /workspace/server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values:
# - MONGODB_URI: Your MongoDB Atlas connection string
# - JWT_SECRET: Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# - FIREBASE_SERVICE_ACCOUNT_JSON: Paste Firebase service account JSON here

# Run server
npm run dev
```

### Frontend

```bash
cd /workspace/cyber-web

# Install dependencies
npm install

# .env file already created with defaults

# Run dev server
npm run dev
```

Open http://localhost:5173

---

## Deploy to Production

### Option A: Vercel (Frontend) + Render (Backend)

#### 1. Deploy Backend to Render

1. Push code to GitHub
2. Go to [Render](https://render.com) → New Web Service
3. Connect your repo
4. Settings:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add Environment Variables:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/swiftie
   JWT_SECRET=<generate-random-secret>
   JWT_EXPIRY=7d
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   CORS_ORIGIN=https://your-app.vercel.app
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```
6. Deploy!
7. Copy your Render URL (e.g., `https://swiftie-api.onrender.com`)

#### 2. Deploy Frontend to Vercel

1. Update `.env.production`:
   ```bash
   VITE_API_BASE_URL=https://your-render-url.onrender.com/api/v1
   VITE_SOCKET_URL=https://your-render-url.onrender.com
   ```
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy: `vercel --prod`
4. Copy your Vercel URL
5. **CRITICAL**: Add this Vercel URL to Firebase Authorized Domains (see Step 1 above)

---

### Option B: Firebase Hosting (Frontend) + Render (Backend)

#### 1. Deploy Backend (same as above)

#### 2. Deploy Frontend to Firebase

```bash
cd /workspace/cyber-web

# Install Firebase CLI
npm i -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Configure:
# - Project: swiftie-d0ea0
# - Public directory: dist
# - SPA: Yes

# Build and deploy
npm run build
firebase deploy --only hosting
```

Add your Firebase URL to Authorized Domains.

---

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free cluster
3. Database Access → Add user (username/password)
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Connect → Drivers → Copy connection string
6. Replace in MONGODB_URI:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/swiftie
   ```

---

## Get Firebase Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Copy entire content
5. Paste into `FIREBASE_SERVICE_ACCOUNT_JSON` env variable (no spaces/newlines)

Example format:
```json
{"type":"service_account","project_id":"swiftie-d0ea0","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Access blocked: Authorization Error" | Add domain to Firebase Authorized Domains |
| "auth/unauthorized-domain" | Same as above |
| "Invalid Firebase token" | Check FIREBASE_SERVICE_ACCOUNT_JSON in backend |
| CORS errors | Update CORS_ORIGIN to match frontend URL exactly |
| Database connection failed | Check MongoDB URI and IP whitelist |
| Socket.IO connection failed | Ensure VITE_SOCKET_URL matches backend URL |

---

## Checklist Before Going Live

- [ ] Firebase Authorized Domains includes production URL
- [ ] Backend has valid FIREBASE_SERVICE_ACCOUNT_JSON
- [ ] MongoDB Atlas allows connections from backend
- [ ] CORS_ORIGIN matches frontend URL
- [ ] JWT_SECRET is strong and random
- [ ] Tested login flow end-to-end
- [ ] Tested chat functionality
- [ ] All environment variables set correctly

---

## Need Help?

Check the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.
