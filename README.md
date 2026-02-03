# Hayvin CRM

A powerful, real-time CRM for managing lead pipelines and call operations.

## Features

- **Smart Lead Scoring**: Automatically groups leads based on reviews, ratings, and business profile.
- **Real-time Synchronization**: Powered by Socket.IO for instant updates across the dashboard and leads table.
- **Editable Sales Script**: Persistent opening script in the sidebar with automatic business name highlighting.
- **Advanced Filtering**: Separate views for "Fresh (Uncalled)" leads and "Open Pipeline".
- **Compact Call Logger**: Optimized interface for quick call logging with outcome tracking and notes.
- **Resizable Leads Table**: Custom columns with persistent width adjustments.

## Tech Stack

- **Frontend**: React, Vite, Lucide-React
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Render

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env.local`:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_API_KEY`
   - `VITE_API_URL`
3. Run the development server (client + server):
   ```bash
   npm run dev
   ```

## Key Commands

- `npm run dev`: Start development environment.
- `npm run build`: Build for production.
- `npm start`: Start production server.
