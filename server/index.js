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
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, ''),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://hayvin-phone-number-list-creator.onrender.com'
].filter(Boolean);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize socket handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({ origin: allowedOrigins })); // Allow all origins for simplicity and to avoid CORS issues in production
app.use(express.json());

// API Routes
app.use('/api/places', placesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/call-logs', callLogsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      supabase_key_prefix: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 5) : 'missing',
      node_env: process.env.NODE_ENV
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time updates`);
});

export { io };

