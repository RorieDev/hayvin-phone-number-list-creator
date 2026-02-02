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
            .select('*, call_logs(id)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
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

        let query = supabase.from('leads').select('status', { count: 'exact' });

        if (campaign_id) {
            query = query.eq('campaign_id', campaign_id);
        }

        // Get counts by status
        const statuses = ['new', 'contacted', 'callback', 'qualified', 'not_interested'];
        const stats = {};

        for (const status of statuses) {
            let statusQuery = supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('status', status);

            if (campaign_id) {
                statusQuery = statusQuery.eq('campaign_id', campaign_id);
            }

            const { count } = await statusQuery;
            stats[status] = count || 0;
        }

        // Get total
        let totalQuery = supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (campaign_id) {
            totalQuery = totalQuery.eq('campaign_id', campaign_id);
        }

        const { count: total } = await totalQuery;
        stats.total = total || 0;

        res.json(stats);
    } catch (error) {
        console.error('Get lead stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
