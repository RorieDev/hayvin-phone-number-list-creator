import express from 'express';
import { supabase } from '../lib/supabase.js';
import { emitCampaignUpdate } from '../socket.js';

const router = express.Router();

// Get all campaigns
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a single campaign with stats
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        // Get lead counts for this campaign
        const { count: totalLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id);

        // Get today's call count
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todaysCalls } = await supabase
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id)
            .gte('called_at', today.toISOString());

        res.json({
            ...campaign,
            total_leads: totalLeads || 0,
            todays_calls: todaysCalls || 0
        });
    } catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a campaign
router.post('/', async (req, res) => {
    try {
        const { name, description, daily_dial_target = 100, start_date, end_date } = req.body;
        const io = req.app.get('io');

        if (!name) {
            return res.status(400).json({ error: 'Campaign name is required' });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                name,
                description,
                daily_dial_target,
                start_date,
                end_date,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;

        // Emit real-time update
        emitCampaignUpdate(io, 'created', data);

        res.status(201).json(data);
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a campaign
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const io = req.app.get('io');

        const { data, error } = await supabase
            .from('campaigns')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Campaign not found' });

        // Emit real-time update
        emitCampaignUpdate(io, 'updated', data);

        res.json(data);
    } catch (error) {
        console.error('Update campaign error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const io = req.app.get('io');

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Emit real-time update
        emitCampaignUpdate(io, 'deleted', { id });

        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
