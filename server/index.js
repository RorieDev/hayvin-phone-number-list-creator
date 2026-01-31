import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import placesRouter from './routes/places.js';
import leadsRouter from './routes/leads.js';
import campaignsRouter from './routes/campaigns.js';
import callLogsRouter from './routes/callLogs.js';
import { initializeSocket } from './socket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize socket handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// API Routes
app.use('/api/places', placesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/call-logs', callLogsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time updates`);
});

export { io };

