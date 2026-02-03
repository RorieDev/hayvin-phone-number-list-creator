# Hayvin CRM Development Guide

## Build & Test Commands
- **Dev**: `npm run dev` (concurrently runs client and server)
- **Client Dev**: `npm run dev:client` (Vite)
- **Server Dev**: `npm run dev:server` (Node)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## Architecture Overview

### Real-time Updates (Socket.IO)
- **Server**: `server/socket.js` handles room subscriptions (`leads`, `call-logs`, `campaigns`) and event broadcasting.
- **Client**: `src/lib/socket.js` provides a resilient `SocketService` class that handles connection queuing and event listeners.
- **Listeners**: Active on `Dashboard.jsx`, `Leads.jsx` (with Ref tracking for stale closures), and `CallLogs.jsx`.

### Lead Management
- **Scoring**: Logic resides in `src/lib/leadScoring.js`.
- **Filtering**: Backend logic in `server/routes/leads.js` handles status-based filtering (e.g., `new` status and `last_called_at` null for fresh leads).
- **Persistence**: Side panel scripts are saved to `localStorage`.

### Database Schema
- Managed via Supabase migrations in `supabase/migrations/`.
- Key tables: `leads`, `call_logs`, `campaigns`.

## Coding standards
- **React**: Use functional components, hooks, and `useRef` for stale socket closure management.
- **CSS**: Vanilla CSS variables for theming (`--primary-400`, `--bg-secondary`, etc.).
- **API**: Use client-side wrappers in `src/lib/api.js`.

## Deployment
- Automated via Render.
- Deployment trigger: `curl -X POST "https://api.render.com/deploy/srv-d5v1tmggjchc7390j920?key=ySCnfTKuKpg"`
