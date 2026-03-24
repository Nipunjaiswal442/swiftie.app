import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { admin } from './firebase';
import { chatHandler } from '../socket/chatHandler';
import User from '../models/User';

let io: Server;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = user._id.toString();
      socket.data.firebaseUid = decoded.uid;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    io.emit('user:status', { userId, online: true });

    chatHandler(io, socket);

    socket.on('disconnect', () => {
      io.emit('user:status', { userId, online: false });
    });
  });

  return io;
};

export const getIO = (): Server => io;
