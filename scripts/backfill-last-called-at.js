import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function backfillLastCalledAt() {
    console.log('Starting backfill of last_called_at...');

    // Get all leads that have call logs but no last_called_at
    const { data: leadsWithCallLogs, error: selectError } = await supabase
        .from('call_logs')
        .select('lead_id, called_at')
        .order('called_at', { ascending: false });

    if (selectError) {
        console.error('Error fetching call logs:', selectError);
        return;
    }

    console.log(`Found ${leadsWithCallLogs.length} call logs`);

    // Group by lead_id and get the most recent called_at for each
    const leadCallMap = {};
    for (const log of leadsWithCallLogs) {
        if (!leadCallMap[log.lead_id] || new Date(log.called_at) > new Date(leadCallMap[log.lead_id])) {
            leadCallMap[log.lead_id] = log.called_at;
        }
    }

    console.log(`Found ${Object.keys(leadCallMap).length} unique leads with call logs`);

    // Update each lead with their most recent call time
    let updated = 0;
    let skipped = 0;

    for (const [leadId, calledAt] of Object.entries(leadCallMap)) {
        // Check if lead already has last_called_at
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('last_called_at')
            .eq('id', leadId)
            .single();

        if (leadError) {
            console.error(`Error checking lead ${leadId}:`, leadError);
            continue;
        }

        if (lead.last_called_at) {
            skipped++;
            continue;
        }

        // Update the lead
        const { error: updateError } = await supabase
            .from('leads')
            .update({ last_called_at: calledAt })
            .eq('id', leadId);

        if (updateError) {
            console.error(`Error updating lead ${leadId}:`, updateError);
        } else {
            updated++;
            console.log(`Updated lead ${leadId} with last_called_at: ${calledAt}`);
        }
    }

    console.log(`\nBackfill complete!`);
    console.log(`Updated: ${updated} leads`);
    console.log(`Skipped: ${skipped} leads (already had last_called_at)`);
}

backfillLastCalledAt().catch(console.error);
