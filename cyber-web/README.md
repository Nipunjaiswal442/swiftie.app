# Swiftie Web Frontend

React + Vite frontend for Swiftie social platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (already created with default values):
```bash
# Uses environment variables or defaults to configured Firebase project
```

3. Update `.env` for production:
```bash
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://your-backend.onrender.com
```

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Create `.env.production`:
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

3. Deploy:
```bash
vercel --prod
```

4. **IMPORTANT**: Add your Vercel domain to Firebase Console:
   - Go to Firebase Console → Authentication → Settings
   - Add your domain (e.g., `your-app.vercel.app`) to Authorized domains

## Deployment to Firebase Hosting

1. Install Firebase CLI:
```bash
npm i -g firebase-tools
```

2. Login and initialize:
```bash
firebase login
firebase init hosting
```

3. Configure:
   - Select project: `swiftie-d0ea0`
   - Public directory: `dist`
   - SPA support: Yes

4. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

## Features

- 🔐 Firebase Google Authentication
- 📱 Responsive mobile-first design
- 💬 Real-time chat with Socket.IO
- 🔒 E2E encrypted messages (Signal protocol)
- 📸 Photo sharing with Cloudinary
- 👥 User profiles and following system
- 🎨 Cyberpunk/Neo-Tokyo theme

## Pages

- `/` - Landing page with login
- `/feed` - Main feed with posts
- `/explore` - Discover new content
- `/drop` - Create new post
- `/activity` - Notifications
- `/profile` - User profile
- `/messages` - Chat list
- `/chat/:id` - Individual chat

## Tech Stack

- React 18
- Vite
- React Router
- Zustand (state management)
- Axios
- Socket.IO Client
- Firebase SDK
- Lucide Icons
- Crypto-js (encryption)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Configured |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Configured |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Configured |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Configured |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Configured |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Configured |

## Troubleshooting

### "Access blocked: Authorization Error"

**Solution**: Add your domain to Firebase authorized domains:
1. Go to Firebase Console → Authentication → Settings
2. Add your domain under "Authorized domains"
3. Wait 5 minutes for propagation

### "auth/unauthorized-domain" Error

Same as above - domain not authorized in Firebase.

### CORS Errors

Update `VITE_API_BASE_URL` to match your backend URL exactly.

### Socket.IO Connection Failed

Ensure `VITE_SOCKET_URL` matches your backend URL and CORS is enabled.
