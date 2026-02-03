import { supabase } from '../server/lib/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to update a lead's status by phone number
 * Usage: node scripts/update-lead-status.js "PHONE_NUMBER" "STATUS"
 */
async function updateLeadStatus() {
    const args = process.argv.slice(2);
    const phoneNumber = args[0] || '07400 938971';
    const newStatus = args[1] || 'wants_callback';

    console.log(`🚀 Updating lead with phone number "${phoneNumber}" to status "${newStatus}"...`);

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Check your credentials.');
        return;
    }

    // 1. Find the lead
    const { data: leads, error: fetchError } = await supabase
        .from('leads')
        .select('id, business_name, phone_number, status')
        .eq('phone_number', phoneNumber);

    if (fetchError) {
        console.error('❌ Error fetching lead:', fetchError.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log(`ℹ️ No lead found with phone number "${phoneNumber}"`);
        return;
    }

    if (leads.length > 1) {
        console.warn(`⚠️ Found ${leads.length} leads with the same phone number. Updating all of them.`);
    }

    // 2. Update the lead(s)
    for (const lead of leads) {
        console.log(`Updating lead: ${lead.business_name} (ID: ${lead.id})`);

        // Update lead status
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                status: newStatus,
                last_called_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`❌ Failed to update lead ${lead.id}:`, updateError.message);
        } else {
            console.log(`✅ Successfully updated lead status to "${newStatus}"`);

            // Add call log entry
            // Check if status is one of the valid outcomes
            const { error: logError } = await supabase
                .from('call_logs')
                .insert({
                    lead_id: lead.id,
                    call_outcome: newStatus,
                    notes: `Status manually updated to ${newStatus} via script`,
                    called_at: new Date().toISOString()
                });

            if (logError) {
                console.error(`❌ Failed to create call log:`, logError.message);
            } else {
                console.log(`✅ Successfully created call log entry`);
            }
        }
    }

    console.log('\n--- Update Complete ---');
}

updateLeadStatus().catch(console.error);
