# Swiftie Backend

Express.js + Socket.IO + MongoDB backend for Swiftie social platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Random 256-bit secret (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `FIREBASE_SERVICE_ACCOUNT_JSON`: Paste your Firebase service account JSON here (from Firebase Console → Project Settings → Service Accounts)
- `CORS_ORIGIN`: Your frontend URL (e.g., `http://localhost:5173` or production URL)

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/firebase` - Exchange Firebase ID token for JWT

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/search?q=query` - Search users
- `POST /api/v1/users/:id/follow` - Follow a user
- `DELETE /api/v1/users/:id/follow` - Unfollow a user

### Posts
- `GET /api/v1/feed?page=1` - Get feed posts
- `POST /api/v1/posts` - Create a post
- `GET /api/v1/posts/:id` - Get a single post
- `DELETE /api/v1/posts/:id` - Delete a post
- `POST /api/v1/posts/:id/like` - Like a post
- `DELETE /api/v1/posts/:id/like` - Unlike a post
- `POST /api/v1/posts/:id/comments` - Add comment

### Messages & Conversations
- `GET /api/v1/conversations` - Get all conversations
- `GET /api/v1/conversations/:id` - Get single conversation
- `GET /api/v1/conversations/:id/messages?page=1` - Get messages
- `POST /api/v1/messages` - Send message (REST fallback)
- `PUT /api/v1/messages/:id/read` - Mark message as read

### Keys (E2E Encryption)
- `GET /api/v1/keys/:userId` - Get user's public encryption keys
- `POST /api/v1/keys/prekeys` - Upload pre-keys

## Deployment

### Environment Variables for Production

```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/swiftie
JWT_SECRET=your_generated_secret_here
JWT_EXPIRY=7d
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
CORS_ORIGIN=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Deploy to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Root Directory: `server`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add all environment variables
7. Deploy!

### Deploy to Railway

1. Connect GitHub repository
2. Set root directory to `server`
3. Add environment variables
4. Auto-deploys on push

## Socket.IO Events

The server uses Socket.IO for real-time messaging:

- `join` - User joins their room
- `send_message` - Send encrypted message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `disconnect` - User disconnected

## Security Features

- JWT-based authentication
- Firebase token verification
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- E2E encryption for messages (Signal protocol)
