import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Check .env or .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
    console.log('Starting lead status backfill...');

    // 1. Get all leads that have been called at least once
    const { data: dialledLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, status, last_called_at')
        .not('last_called_at', 'is', null);

    if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        return;
    }

    console.log(`Found ${dialledLeads.length} dialled leads.`);

    let updatedCount = 0;
    for (const lead of dialledLeads) {
        // If it's still marked as 'new' but has been called, move it to 'contacted'
        if (lead.status === 'new') {
            const { error: updateError } = await supabase
                .from('leads')
                .update({ status: 'contacted' })
                .eq('id', lead.id);

            if (!updateError) {
                updatedCount++;
            }
        }
    }

    console.log(`Updated ${updatedCount} leads from 'new' to 'contacted'.`);

    // 2. Double check call logs to ensure last_called_at is synced
    const { data: logs, error: logsError } = await supabase
        .from('call_logs')
        .select('lead_id, called_at')
        .order('called_at', { ascending: false });

    if (logsError) {
        console.error('Error fetching logs:', logsError);
        return;
    }

    const latestCalls = new Map();
    for (const log of logs) {
        if (!latestCalls.has(log.lead_id)) {
            latestCalls.set(log.lead_id, log.called_at);
        }
    }

    let syncedCount = 0;
    for (const [leadId, calledAt] of latestCalls.entries()) {
        const { error: syncError } = await supabase
            .from('leads')
            .update({ last_called_at: calledAt })
            .eq('id', leadId)
            .is('last_called_at', null);

        if (!syncError) {
            syncedCount++;
        }
    }

    if (syncedCount > 0) {
        console.log(`Synced last_called_at for ${syncedCount} leads.`);
    }

    console.log('Backfill complete.');
}

backfill();
