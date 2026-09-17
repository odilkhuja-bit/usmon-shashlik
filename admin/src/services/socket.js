// ============================================
// USMON SHASHLIK — Admin Socket.IO Service
// ============================================

import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.origin
    : 'http://localhost:5000');

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Admin connected to Socket.IO');
      this.socket.emit('join-admin');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Admin disconnected from Socket.IO');
    });

    // Re-attach existing listeners
    for (const [event, callbacks] of this.listeners.entries()) {
      this.socket.on(event, (data) => {
        callbacks.forEach((cb) => cb(data));
      });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
      if (this.socket) {
        this.socket.on(event, (data) => {
          const callbacks = this.listeners.get(event);
          if (callbacks) callbacks.forEach((cb) => cb(data));
        });
      }
    }
    this.listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const adminSocket = new SocketService();
