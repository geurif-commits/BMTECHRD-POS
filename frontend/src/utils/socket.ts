import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export const getSocket = (token: string) => {
    return io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'], // Try polling first for better stability
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
    });
};
