// Socket.IO event handlers for real-time updates

export function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Join rooms for specific data subscriptions
        socket.on('subscribe:leads', () => {
            socket.join('leads');
            console.log(`📋 Client ${socket.id} subscribed to leads`);
        });

        socket.on('subscribe:campaigns', () => {
            socket.join('campaigns');
            console.log(`📢 Client ${socket.id} subscribed to campaigns`);
        });

        socket.on('subscribe:call-logs', () => {
            socket.join('call-logs');
            console.log(`📞 Client ${socket.id} subscribed to call-logs`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
}

// Emit functions for broadcasting updates
export function emitLeadUpdate(io, event, data) {
    io.to('leads').emit(`lead:${event}`, data);
}

export function emitCampaignUpdate(io, event, data) {
    io.to('campaigns').emit(`campaign:${event}`, data);
}

export function emitCallLogUpdate(io, event, data) {
    io.to('call-logs').emit(`callLog:${event}`, data);
}

export function emitScrapingProgress(io, data) {
    io.to('leads').emit('scraping:progress', data);
}

export function emitScrapingComplete(io, data) {
    io.to('leads').emit('scraping:complete', data);
}
