import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { postsRouter } from './routes/posts';
import { messagesRouter } from './routes/messages';
import { keysRouter } from './routes/keys';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { initSocketHandler } from './socket/socketHandler';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// ── Routes ──────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/posts`, postsRouter);
app.use(`${API}/messages`, messagesRouter);
app.use(`${API}/conversations`, messagesRouter);
app.use(`${API}/keys`, keysRouter);

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', env: process.env.NODE_ENV } });
});

// ── Error handler (must be last) ────────────────────────────
app.use(errorHandler);

// ── Socket.IO ───────────────────────────────────────────────
initSocketHandler(io);

// ── Start ───────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[swiftie] server running on port ${PORT}`);
  });
});
