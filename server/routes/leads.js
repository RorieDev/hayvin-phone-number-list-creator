import express from 'express';
import { supabase } from '../lib/supabase.js';
import { emitLeadUpdate } from '../socket.js';

const router = express.Router();

// Get all leads with optional filters
router.get('/', async (req, res) => {
    try {
        const { status, campaign_id, search, limit = 100, offset = 0 } = req.query;

        let query = supabase
            .from('leads')
            // include call outcome and called_at so frontend can show latest outcome without extra fetch
            .select('*, call_logs(call_outcome, called_at)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            if (status === 'open_pipeline') {
                // 'Open' in UI - all active leads NOT (Not Interested, Need Closing, Closed Won, Closed Lost)
                query = query.not('status', 'in', '("not_interested","need_closing","closed_won","closed_lost","wrong_number","do_not_call")');
            } else if (status === 'new') {
                // 'Fresh' in UI - leads never called
                query = query.is('last_called_at', null);
            } else if (status === 'contacted') {
                // 'Contacted' in UI - all dialled leads
                query = query.not('last_called_at', 'is', null);
            } else {
                query = query.eq('status', status);
            }
        }

        if (campaign_id) {
            query = query.eq('campaign_id', campaign_id);
        }

        if (search) {
            query = query.or(`business_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({ leads: data, total: count });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a single lead
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('leads')
            .select('*, call_logs(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Lead not found' });

        res.json(data);
    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a lead
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const io = req.app.get('io');

        const { data, error } = await supabase
            .from('leads')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, call_logs(id)')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Lead not found' });

        // Emit real-time update
        emitLeadUpdate(io, 'updated', data);

        res.json(data);
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a lead
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const io = req.app.get('io');

        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Emit real-time update
        emitLeadUpdate(io, 'deleted', { id });

        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get lead statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const { campaign_id } = req.query;

        // 1. Get total
        let totalQuery = supabase.from('leads').select('*', { count: 'exact', head: true });
        if (campaign_id) totalQuery = totalQuery.eq('campaign_id', campaign_id);
        const { count: total } = await totalQuery;

        // 2. Get dialled (last_called_at is not null)
        let dialledQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).not('last_called_at', 'is', null);
        if (campaign_id) dialledQuery = dialledQuery.eq('campaign_id', campaign_id);
        const { count: dialled } = await dialledQuery;

        // 3. Get total Closed (Not Interested + Need Closing + Closed Won + Closed Lost)
        let closedQuery = supabase.from('leads').select('*', { count: 'exact', head: true })
            .in('status', ['not_interested', 'need_closing', 'closed_won', 'closed_lost', 'wrong_number', 'do_not_call']);
        if (campaign_id) closedQuery = closedQuery.eq('campaign_id', campaign_id);
        const { count: closed } = await closedQuery;

        // 4. Get Open (Total - Closed)
        const open = (total || 0) - (closed || 0);

        // 5. Get counts for all specific statuses
        const statuses = ['new', 'contacted', 'callback', 'need_closing', 'closed_won', 'closed_lost', 'not_interested'];
        const counts = {};
        for (const status of statuses) {
            let sQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', status);
            if (campaign_id) sQuery = sQuery.eq('campaign_id', campaign_id);
            const { count } = await sQuery;
            counts[status] = count || 0;
        }

        res.json({
            total: total || 0,
            closed: closed || 0,
            dialled: dialled || 0,
            open: open || 0,
            ...counts,
            // Override 'new' to be the Open Pipeline count for the dashboard breakdown
            new: open || 0,
            contacted: dialled || 0
        });
    } catch (error) {
        console.error('Get lead stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
