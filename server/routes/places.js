import express from 'express';
import { searchPlaces, searchAndGetDetails } from '../lib/googlePlaces.js';
import { supabase } from '../lib/supabase.js';
import { emitScrapingProgress, emitScrapingComplete, emitLeadUpdate } from '../socket.js';

const router = express.Router();

// Search places without saving
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const results = await searchPlaces(query);
        res.json(results);
    } catch (error) {
        console.error('Places search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Scrape places and save to database
router.post('/scrape', async (req, res) => {
    try {
        const { query, maxResults = 20, campaignId } = req.body;
        const io = req.app.get('io');

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Start scraping with progress updates
        const results = await searchAndGetDetails(query, maxResults, (progress) => {
            emitScrapingProgress(io, progress);
        });

        // Filter out results without phone numbers
        const validResults = results.filter(r => r.phone_number);

        if (validResults.length === 0) {
            return res.json({
                message: 'No businesses with phone numbers found',
                scraped: 0,
                saved: 0
            });
        }

        // Prepare leads for insertion
        const leads = validResults.map(place => ({
            place_id: place.place_id,
            business_name: place.business_name,
            phone_number: place.phone_number,
            address: place.address,
            website: place.website,
            rating: place.rating,
            total_ratings: place.total_ratings,
            category: place.category,
            business_status: place.business_status,
            google_maps_url: place.google_maps_url,
            source_query: query,
            campaign_id: campaignId || null,
            status: 'new',
            email: place.email || null
        }));

        // Upsert leads (update if place_id exists)
        const { data, error } = await supabase
            .from('leads')
            .upsert(leads, {
                onConflict: 'place_id',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            throw error;
        }

        // Emit completion event
        emitScrapingComplete(io, {
            query,
            scraped: results.length,
            saved: data.length,
            leads: data
        });

        // Notify about new leads
        emitLeadUpdate(io, 'bulk-created', data);

        res.json({
            message: 'Scraping complete',
            scraped: results.length,
            withPhone: validResults.length,
            saved: data.length,
            leads: data
        });
    } catch (error) {
        console.error('Places scrape error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
