# Hayvin Phone Number List Creator

A lightweight CRM for managing outbound calling campaigns with Google Places integration.

## Project Structure

```
├── server/                  # Express.js backend
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
│   │   ├── Layout.jsx      # Sidebar navigation
│   │   ├── LogCallModal.jsx # Call logging modal
│   │   ├── LeadInsightPanel.jsx # Right-side lead detail panel
│   │   └── LeadScoreBadge.jsx   # Score display component
│   └── pages/
│       ├── Dashboard.jsx   # Stats overview
│       ├── Scraper.jsx     # Google Places scraper (UK defaults)
│       ├── Leads.jsx       # Lead management with scoring
│       ├── Campaigns.jsx   # Campaign CRUD
│       └── CallLogs.jsx    # Call history
│
└── supabase/migrations/    # Database schema
    └── 001_initial_schema.sql
```

## Tech Stack

- **Frontend**: Vite + React 19
- **Backend**: Express.js + Socket.IO
- **Database**: Supabase (PostgreSQL)
- **APIs**: Google Places API (New)
- **Deployment**: Render

## Key Commands

```bash
# Development (runs both client and server)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Client only
npm run dev:client

# Server only
npm run dev:server
```

## Environment Variables

### Server (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
GOOGLE_PLACES_API_KEY=xxx
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=http://localhost:3001
```

## Lead Scoring System

Leads are scored 0-100 to prioritize calling. The scoring is:
- **Deterministic** - Same inputs always produce same score
- **Explainable** - Reasons shown in UI
- **Fast** - Pure function, no API calls

### Scoring Logic

| Signal | Points |
|--------|--------|
| Base score | 50 |
| Mobile number (07xxx) | +15 |
| Google rating ≥ 4.5 | +10 |
| Small operator indicators | +10 |
| Extended hours (24/7) | +10 |
| Urban/dense postcode | +5 |
| Freephone number (0800) | -15 |
| Corporate/franchise indicators | -10 |
| Website mentions reception | -10 |
| Low review count (<10) | -5 |

### Score Bands

- **80-100**: "Call first" (green)
- **60-79**: "High potential" (blue)
- **40-59**: "Medium" (amber)
- **<40**: "Low priority" (red)

### Usage

```javascript
import { scoreLead } from './lib/leadScoring';

const result = scoreLead(lead);
// Returns: { score, band, reasons, explanation, breakdown }
```

## Lead Insight Panel

Right-side sliding panel showing:
- Business snapshot (name, location, rating)
- Lead score with band
- Contact intelligence (phone type detection)
- Why this lead was selected
- AI call strategy (opening line, pain points, objections)
- Best time to call
- Notes (auto-save on blur)
- Quick actions (Call Now, Book Demo, Set Callback)

## Database Schema

### Tables

**campaigns**
- id (UUID, PK)
- name, description
- daily_dial_target (default: 100)
- start_date, end_date
- status: 'active' | 'paused' | 'completed' | 'archived'

**leads**
- id (UUID, PK)
- place_id (unique - from Google)
- business_name, phone_number, address, website
- rating, total_ratings, category
- campaign_id (FK → campaigns)
- status: 'new' | 'contacted' | 'callback' | 'qualified' | 'not_interested'
- last_called_at, notes

**call_logs**
- id (UUID, PK)
- lead_id (FK → leads)
- campaign_id (FK → campaigns)
- call_outcome: 'answered' | 'voicemail' | 'no_answer' | 'busy' | 'callback_scheduled' | 'qualified' | 'not_interested' | 'wrong_number' | 'do_not_call'
- notes, duration_seconds
- scheduled_callback
- called_at

## API Endpoints

### Places
- `GET /api/places/search?query=xxx` - Search Google Places
- `POST /api/places/scrape` - Scrape and save to DB
  - Body: `{ query, maxResults, campaignId }`

### Leads
- `GET /api/leads` - List leads (supports ?status, ?campaign_id, ?search)
- `GET /api/leads/:id` - Single lead with call logs
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `GET /api/leads/stats/overview` - Status counts

### Campaigns
- `GET /api/campaigns` - List all
- `GET /api/campaigns/:id` - Single with stats
- `POST /api/campaigns` - Create
- `PUT /api/campaigns/:id` - Update
- `DELETE /api/campaigns/:id` - Delete

### Call Logs
- `GET /api/call-logs` - List (supports ?lead_id, ?campaign_id, ?date)
- `POST /api/call-logs` - Log a call
- `GET /api/call-logs/stats/today` - Today's call counts by outcome
- `GET /api/call-logs/callbacks` - Get pending callbacks

## Socket.IO Events

### Client → Server (Subscribe)
- `subscribe:leads` - Join leads room
- `subscribe:campaigns` - Join campaigns room
- `subscribe:call-logs` - Join call-logs room

### Server → Client (Broadcasts)
- `lead:updated` / `lead:deleted` / `lead:bulk-created`
- `campaign:created` / `campaign:updated` / `campaign:deleted`
- `callLog:created`
- `scraping:progress` - `{ current, total, lastBusiness }`
- `scraping:complete` - `{ scraped, saved, leads }`

## Design System

The UI uses a dark theme with teal accent colors. Key CSS classes:

- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`
- **Cards**: `.card`, `.card-header`, `.card-title`
- **Forms**: `.form-group`, `.form-label`, `.form-input`, `.form-select`
- **Status**: `.badge-new`, `.badge-contacted`, `.badge-callback`, `.badge-qualified`, `.badge-not_interested`
- **Layout**: `.sidebar`, `.main-content`, `.page-header`, `.page-title`
- **Grid**: `.grid`, `.grid-cols-2`, `.grid-cols-3`, `.grid-cols-4`
- **Scores**: `.lead-score`, `.lead-score--call-first`, `.lead-score--high`, `.lead-score--medium`, `.lead-score--low`
- **Tables**: `.table-resizable`, `.resizable-header`, `.resize-handle`

## Deployment (Render)

The `render.yaml` file configures deployment:
- Build: `npm install && npm run build`
- Start: `npm start`
- Set environment variables in Render dashboard

**Note**: Enable "Places API (New)" in Google Cloud Console for scraping to work.

## Core Business Logic

1. **Scraping**: Search Google Places → Get details (phone, rating, etc.) → Save to leads table
2. **Lead Scoring**: Calculate 0-100 score based on phone type, rating, business indicators
3. **100 Dials/Day**: Track daily call count on dashboard
4. **Lead Status Flow**: new → contacted → callback/qualified/not_interested
5. **Real-time**: All CRUD operations emit Socket.IO events for live updates
6. **Resizable Columns**: Table column widths persist to localStorage

