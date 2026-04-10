import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../config/socket';
import { useAuth } from './AuthContext';
import { signalManager } from '../crypto/SignalManager';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = (): SocketContextType => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const s = getSocket();
      setSocket(s);

      if (s) {
        s.on('keys:low', async (data: { remaining: number }) => {
          console.log(`Pre-keys low: ${data.remaining} remaining. Replenishing...`);
          const startId = 100 + Math.floor(Math.random() * 10000);
          await signalManager.generateAndUploadPreKeys(startId, 50);
        });
      }

      return () => {
        s?.off('keys:low');
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
