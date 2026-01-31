# Hayvin Phone Number List Creator

A lightweight, high-performance CRM for managing outbound calling campaigns with Google Places integration. Built for speed and ease of use on both desktop and mobile.

## Project Structure

```
├── server/                  # Express.js backend (Express 5)
│   ├── index.js            # Server entry point with Socket.IO
│   ├── socket.js           # Real-time event handlers
│   ├── lib/
│   │   ├── supabase.js     # Supabase client
│   │   └── googlePlaces.js # Google Places API (New) integration
│   └── routes/
│       ├── places.js       # Scraping endpoints
│       ├── leads.js        # Lead CRUD operations
│       ├── campaigns.js    # Campaign management
│       └── callLogs.js     # Call logging
│
├── src/                     # React frontend (Vite)
│   ├── App.jsx             # Main app with routing
│   ├── index.css           # Design system (dark theme)
│   ├── lib/
│   │   ├── api.js          # API client
│   │   ├── socket.js       # Socket.IO client service
│   │   ├── supabase.js     # Frontend Supabase client
│   │   └── leadScoring.js  # Lead scoring algorithm (0-100)
│   ├── hooks/
│   │   └── useResizableColumns.jsx  # Draggable table column widths
│   ├── components/
│   │   ├── Layout.jsx      # Global layout with mobile hamburger menu
│   │   ├── LogCallModal.jsx # Call logging modal
│   │   ├── LeadInsightPanel.jsx # Right-side lead detail panel (Score on left)
│   │   └── LeadScoreBadge.jsx   # Score display component
│   └── pages/
│       ├── Dashboard.jsx   # Stats overview
│       ├── Scraper.jsx     # Google Places scraper (UK defaults)
│       ├── Leads.jsx       # Lead management with scoring
│       ├── Campaigns.jsx   # Campaign CRUD
│       └── CallLogs.jsx    # Call history
│
├── public/                  # Static assets & PWA
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── offline.html        # Offline fallback
│
└── supabase/migrations/    # Database schema
    └── 001_initial_schema.sql
```

## Tech Stack

- **Frontend**: Vite + React 19
- **Backend**: Express.js 5 + Socket.IO (Note: Express 5 requires named wildcards)
- **Database**: Supabase (PostgreSQL)
- **APIs**: Google Places API (New)
- **PWA**: Installable web app with service worker
- **Deployment**: Render (Node 22+)

## Key Commands

```bash
# Development (runs both client and server)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Trigger Render Deployment (Run after git push)
curl -X POST "https://api.render.com/deploy/srv-d5v1tmggjchc7390j920?key=ySCnfTKuKpg"
```

## Lead Scoring System

Leads are scored 0-100 to prioritize calling.
- **Deterministic**: Pure function based on metadata.
- **Explainable**: Visual breakdown of positive/negative signals.
- **Fast**: Computed locally in frontend.
- **Default Order**: Leads table is sorted by Score descending by default.

### Logic Summary
- Base: 50
- Mobile: +15
- High Rating: +10
- Small Business indicators: +10
- Freephone: -15
- Corporate/Chain: -10

## PWA Support

The app is an installable PWA designed for field sales.
- **Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js` (Network-first with `v2` cache busting)
- **Mobile Menu**: Hamburger menu toggle with animated slide-over sidebar.
- **Mobile Action**: `tel:` links open native dialer on Android/iOS.
- **Touch Targets**: Large, finger-friendly buttons for calling and logging.
- **Theme**: Teal (#14b8a6) with Slate dark mode.

## Core Dependencies (Render Fix)

Vite and related plugins are in `dependencies` (not `devDependencies`) to ensure the build succeeds on Render's production environment where `NODE_ENV=production` inhibits devDependency installation.

## Express 5 Wildecard Note

Express 5 uses `path-to-regexp` v8. The traditional `*` wildcard is now literal.
Catch-all routes must use named parameters with the splat prefix, e.g., `/*splat`.

## Production Networking

- **CORS**: Allows all origins in production for multi-device reliability.
- **API Paths**: Frontend uses relative paths (`/api`) to ensure compatibility across local and Render environments without URL hardcoding.
- **Sockets**: Socket.IO connects via the current origin with fallback polling enabled.

## Table Preferences

- **Column Order**: Optimized for calling: Phone (1st), Score (2nd), Business (3rd).
- **Persistence**: Column widths are saved to `localStorage`.

## Deployment Protocol

Automatic deployments are currently unreliable on Render for this service. **Always** trigger the deploy hook manually after pushing to the `main` branch:

1. `git push origin main`
2. `curl -X POST "https://api.render.com/deploy/srv-d5v1tmggjchc7390j920?key=ySCnfTKuKpg"`

## GitHub Repo

**https://github.com/RorieDev/hayvin-phone-number-list-creator** (Private)

