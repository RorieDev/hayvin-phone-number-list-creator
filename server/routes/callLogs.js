import express from 'express';
import { supabase } from '../lib/supabase.js';
import { emitCallLogUpdate, emitLeadUpdate } from '../socket.js';

const router = express.Router();

// Get all call logs with optional filters
router.get('/', async (req, res) => {
    try {
        const { lead_id, campaign_id, date, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('call_logs')
            .select('*, leads(business_name, phone_number)', { count: 'exact' })
            .order('called_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (lead_id) {
            query = query.eq('lead_id', lead_id);
        }

        if (campaign_id) {
            query = query.eq('campaign_id', campaign_id);
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query = query
                .gte('called_at', startOfDay.toISOString())
                .lte('called_at', endOfDay.toISOString());
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({ callLogs: data, total: count });
    } catch (error) {
        console.error('Get call logs error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Log a call
router.post('/', async (req, res) => {
    try {
        const {
            lead_id,
            campaign_id,
            call_outcome,
            notes,
            duration_seconds,
            scheduled_callback
        } = req.body;
        const io = req.app.get('io');

        if (!lead_id || !call_outcome) {
            return res.status(400).json({ error: 'lead_id and call_outcome are required' });
        }

        // Create call log
        const { data: callLog, error } = await supabase
            .from('call_logs')
            .insert({
                lead_id,
                campaign_id,
                call_outcome,
                notes,
                duration_seconds,
                scheduled_callback,
                called_at: new Date().toISOString()
            })
            .select('*, leads(business_name, phone_number)')
            .single();

        if (error) throw error;

        // Update lead status based on call outcome
        let newStatus;
        switch (call_outcome) {
            case 'answered':
            case 'voicemail':
            case 'no_answer':
            case 'busy':
                newStatus = 'contacted';
                break;
            case 'callback_scheduled':
                newStatus = 'callback';
                break;
            case 'need_closing':
                newStatus = 'need_closing';
                break;
            case 'closed_won':
                newStatus = 'closed_won';
                break;
            case 'closed_lost':
                newStatus = 'closed_lost';
                break;
            case 'not_interested':
            case 'wrong_number':
            case 'do_not_call':
                newStatus = 'not_interested';
                break;
            default:
                newStatus = 'contacted'; // Default to contacted if any log is created
        }

        // Always update last_called_at, regardless of outcome
        const updateData = {
            updated_at: new Date().toISOString(),
            last_called_at: new Date().toISOString()
        };

        // Only update status if there's a status change
        if (newStatus) {
            updateData.status = newStatus;
        }

        const { data: updatedLead, error: leadError } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead_id)
            .select()
            .single();

        if (!leadError && updatedLead) {
            emitLeadUpdate(io, 'updated', updatedLead);
        }

        // Emit real-time update
        emitCallLogUpdate(io, 'created', callLog);

        res.status(201).json(callLog);
    } catch (error) {
        console.error('Create call log error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get today's call stats
router.get('/stats/today', async (req, res) => {
    try {
        const { campaign_id } = req.query;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count total calls made today
        let totalCallsQuery = supabase
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .gte('called_at', today.toISOString());

        if (campaign_id) {
            totalCallsQuery = totalCallsQuery.eq('campaign_id', campaign_id);
        }

        const { count, error } = await totalCallsQuery;

        if (error) throw error;

        // Count by outcome
        const outcomes = {};
        const outcomeTypes = ['answered', 'voicemail', 'no_answer', 'busy', 'callback_scheduled', 'need_closing', 'closed_won', 'closed_lost', 'not_interested', 'wrong_number', 'do_not_call'];

        for (const outcome of outcomeTypes) {
            let outcomeQuery = supabase
                .from('call_logs')
                .select('*', { count: 'exact', head: true })
                .eq('call_outcome', outcome)
                .gte('called_at', today.toISOString());

            if (campaign_id) {
                outcomeQuery = outcomeQuery.eq('campaign_id', campaign_id);
            }

            const { count: outcomeCount } = await outcomeQuery;
            outcomes[outcome] = outcomeCount || 0;
        }

        res.json({
            total_calls: count || 0,
            outcomes,
            date: today.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Get call stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get callbacks due
router.get('/callbacks', async (req, res) => {
    try {
        const { campaign_id } = req.query;
        const now = new Date();

        let query = supabase
            .from('call_logs')
            .select('*, leads(business_name, phone_number, address)')
            .not('scheduled_callback', 'is', null)
            .lte('scheduled_callback', now.toISOString())
            .order('scheduled_callback', { ascending: true });

        if (campaign_id) {
            query = query.eq('campaign_id', campaign_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Get callbacks error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
