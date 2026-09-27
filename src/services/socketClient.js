import { io } from 'socket.io-client';

let socketInstance = null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:5000' : '/');

export const getSocket = (userId) => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      auth: { userId },
      query: { userId },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('🔌 [Socket.io Client] Đã kết nối thành công tới máy chủ');
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 [Socket.io Client] Đã ngắt kết nối khỏi máy chủ');
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
