# Swiftie Deployment Guide

This guide covers deploying the Swiftie application to Firebase (frontend), Vercel (frontend alternative), and a backend service with MongoDB.

## Architecture Overview

- **Frontend**: React + Vite (deployable to Firebase Hosting or Vercel)
- **Backend**: Node.js + Express + TypeScript (deployable to Render, Railway, or similar)
- **Database**: MongoDB Atlas
- **Authentication**: Firebase Auth + JWT
- **Real-time**: Socket.IO

---

## Part 1: Firebase Configuration

### 1.1 Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `swiftie-d0ea0`
3. Enable Authentication → Sign-in method → Google

### 1.2 Add Authorized Domains

**CRITICAL**: The "Access blocked: Authorization Error" occurs when your domain is not registered in Firebase.

1. Go to Firebase Console → Authentication → Settings
2. Under **Authorized domains**, add:
   - `localhost` (for development)
   - Your production domain (e.g., `yourapp.web.app`, `yourapp.vercel.app`, `yourapp.firebaseapp.com`)
   - Any custom domain you're using

### 1.3 Download Firebase Service Account Key

For the backend to verify Firebase tokens:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json`
4. **Never commit this file to Git!**

### 1.4 Firebase Web App Configuration

The frontend uses these Firebase config values (already configured):

```javascript
{
  apiKey: "AIzaSyACxn6M_3vg1X6NIMypPb8GthqXq6drimw",
  authDomain: "swiftie-d0ea0.firebaseapp.com",
  projectId: "swiftie-d0ea0",
  storageBucket: "swiftie-d0ea0.firebasestorage.app",
  messagingSenderId: "658364785258",
  appId: "1:658364785258:web:7d7d6524e5a4ea729be013"
}
```

---

## Part 2: Backend Deployment (Render/Railway/Heroku)

### 2.1 Environment Variables for Backend

Set these in your hosting platform's environment variables:

```bash
# Server
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/swiftie

# JWT Secret (generate a new one!)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRY=7d

# Firebase Admin SDK
# Option A: Paste the entire firebase-service-account.json content as JSON
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"swiftie-d0ea0",...}

# CORS - Set to your frontend URL
CORS_ORIGIN=https://your-frontend.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 2.2 Deploy to Render

1. Create new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Root Directory: `server`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add all environment variables from above
7. Deploy!

### 2.3 Deploy to Railway

1. Create new project on [Railway](https://railway.app)
2. Deploy from GitHub
3. Set root directory to `server`
4. Add environment variables
5. Railway auto-detects Node.js and deploys

---

## Part 3: Frontend Deployment

### Option A: Deploy to Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd cyber-web`
3. Create `.env.production`:

```bash
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_FIREBASE_API_KEY=AIzaSyACxn6M_3vg1X6NIMypPb8GthqXq6drimw
VITE_FIREBASE_AUTH_DOMAIN=swiftie-d0ea0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=swiftie-d0ea0
VITE_FIREBASE_STORAGE_BUCKET=swiftie-d0ea0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=658364785258
VITE_FIREBASE_APP_ID=1:658364785258:web:7d7d6524e5a4ea729be013
```

4. Deploy: `vercel --prod`
5. Copy the deployed URL
6. **Add this URL to Firebase Console → Authentication → Settings → Authorized domains**

### Option B: Deploy to Firebase Hosting

1. Install Firebase CLI: `npm i -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
   - Select your project: `swiftie-d0ea0`
   - Public directory: `dist`
   - Configure as SPA: Yes
   - Overwrite index.html: No
4. Build: `npm run build`
5. Deploy: `firebase deploy --only hosting`

---

## Part 4: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster (free tier available)
3. Create database user with read/write permissions
4. Whitelist IP addresses (or allow all: `0.0.0.0/0`)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/swiftie
   ```
6. Replace in `MONGODB_URI` environment variable

---

## Part 5: Fixing "Access Blocked: Authorization Error"

This error occurs due to one of these reasons:

### Solution 1: Add Domain to Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Scroll to **Authorized domains**
3. Click "Add domain"
4. Add your domain:
   - For Vercel: `your-app.vercel.app`
   - For Firebase: `your-app.web.app` or `your-app.firebaseapp.com`
   - For custom domain: `yourdomain.com`
5. Save and wait ~5 minutes for propagation

### Solution 2: Check Firebase Config

Ensure your frontend has correct Firebase config:

```javascript
// In /workspace/cyber-web/src/firebase.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "...",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "swiftie-d0ea0.firebaseapp.com",
  // ... rest of config
};
```

### Solution 3: Clear Browser Cache

Sometimes cached credentials cause issues:
1. Clear browser cache and cookies
2. Try incognito mode
3. Try a different browser

### Solution 4: Check OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. APIs & Services → OAuth consent screen
4. Ensure it's configured properly
5. Add your domain to authorized domains there too

---

## Part 6: Testing Locally

### Run Backend

```bash
cd /workspace/server
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

### Run Frontend

```bash
cd /workspace/cyber-web
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

### Test Authentication

1. Open `http://localhost:5173`
2. Click "Jack In with Google"
3. If popup appears and works → Success!
4. If error appears, check browser console for details

---

## Part 7: Production Checklist

- [ ] Firebase authorized domains includes production URL
- [ ] Backend has `FIREBASE_SERVICE_ACCOUNT_JSON` set
- [ ] MongoDB Atlas allows connections from backend IP
- [ ] CORS_ORIGIN matches frontend URL
- [ ] JWT_SECRET is a strong random value
- [ ] Frontend `VITE_API_BASE_URL` points to production backend
- [ ] SSL/TLS is enabled (automatic on Vercel/Render)
- [ ] Test login flow end-to-end
- [ ] Test real-time chat functionality
- [ ] Monitor logs for errors

---

## Troubleshooting

### "auth/unauthorized-domain" Error
**Fix**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### "Invalid Firebase token" Error  
**Fix**: Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is correctly set in backend

### CORS Errors
**Fix**: Update `CORS_ORIGIN` in backend to match your frontend URL exactly

### Database Connection Failed
**Fix**: 
- Check MongoDB Atlas IP whitelist
- Verify connection string
- Ensure network access is allowed

### Socket.IO Connection Failed
**Fix**: 
- Ensure `VITE_SOCKET_URL` matches backend URL
- Check that backend allows CORS for Socket.IO

---

## Support

If you continue to experience issues:
1. Check browser console for detailed error messages
2. Check backend logs for authentication errors
3. Verify all environment variables are set correctly
4. Ensure Firebase project settings match your configuration
