import { io } from 'socket.io-client';

const getSocketUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (import.meta.env.PROD) {
        return (!envUrl || envUrl.includes('localhost')) ? '/' : envUrl;
    }
    return envUrl || 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    constructor() {
        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        this.listeners = new Map();

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket.id);
            // Re-subscribe to rooms on reconnect
            this.subscribe('leads');
            this.subscribe('campaigns');
            this.subscribe('call-logs');
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    connect() {
        if (this.socket.connected) return;
        this.socket.connect();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    subscribe(room) {
        if (!this.socket.connected) {
            // Wait for connect
            const onConnect = () => {
                this.socket.emit(`subscribe:${room}`);
                this.socket.off('connect', onConnect);
            };
            this.socket.on('connect', onConnect);
            return;
        }
        this.socket.emit(`subscribe:${room}`);
    }

    on(event, callback) {
        this.socket.on(event, callback);

        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (callback) {
            this.socket.off(event, callback);
        } else {
            this.socket.off(event);
        }
    }

    // Lead events
    onLeadCreated(callback) {
        this.on('lead:created', callback);
    }

    onLeadUpdated(callback) {
        this.on('lead:updated', callback);
    }

    onLeadDeleted(callback) {
        this.on('lead:deleted', callback);
    }

    onLeadBulkCreated(callback) {
        this.on('lead:bulk-created', callback);
    }

    // Scraping events
    onScrapingProgress(callback) {
        this.on('scraping:progress', callback);
    }

    onScrapingComplete(callback) {
        this.on('scraping:complete', callback);
    }

    // Campaign events
    onCampaignCreated(callback) {
        this.on('campaign:created', callback);
    }

    onCampaignUpdated(callback) {
        this.on('campaign:updated', callback);
    }

    onCampaignDeleted(callback) {
        this.on('campaign:deleted', callback);
    }

    // Call log events
    onCallLogCreated(callback) {
        this.on('callLog:created', callback);
    }

    onCallLogDeleted(callback) {
        this.on('callLog:deleted', callback);
    }
}

export const socketService = new SocketService();
