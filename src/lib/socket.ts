// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Optional: you can define your event types to get type safety
// interface ServerToClientEvents { … }
// interface ClientToServerEvents { … }
// then use: Socket<ServerToClientEvents, ClientToServerEvents>

export function getSocket(): Socket {
  // Only run in browser (no window on server)
  if (typeof window === 'undefined') {
    return {} as Socket;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!SOCKET_URL) {
    console.error('❌ Missing NEXT_PUBLIC_SOCKET_URL in .env');
    return {} as Socket;
  }

  // If socket already exists and is connected, reuse it
  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but not connected (maybe disconnected), disconnect it before making a new
  if (socket) {
    socket.disconnect();
    console.log('🔁 Disconnected existing socket');
  }

  // Create a new socket
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 30,  
    reconnectionDelay: 2000,         
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🟢 Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔴 Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('⚠️ Socket connection error:', err.message);
  });

  // Optional: heartbeat / ping-check every 10s
  setInterval(() => {
    if (socket && socket.connected) {
      // you can emit a custom “ping-check” event to your server,
      // or rely on Socket.IO’s internal ping mechanism
      socket.emit('ping-check');
    }
  }, 10000);

  return socket;
}
