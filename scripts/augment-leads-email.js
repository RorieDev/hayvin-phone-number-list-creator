import { supabase } from '../server/lib/supabase.js';
import { findEmailOnWebsite } from '../server/lib/googlePlaces.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to augment existing leads with email addresses
 * 1. Fetches all leads that don't have an email
 * 2. Tries to find email on their website
 * 3. Updates the lead record
 */
async function augmentLeads() {
    console.log('🚀 Starting lead augmentation...');

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Check your credentials.');
        return;
    }

    // Fetch leads without email that have a website
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, business_name, website')
        .is('email', null)
        .not('website', 'is', null);

    if (error) {
        console.error('❌ Error fetching leads:', error.message);
        return;
    }

    console.log(`🔍 Found ${leads.length} leads to process.`);

    let updatedCount = 0;
    let failCount = 0;

    for (const lead of leads) {
        console.log(`Processing: ${lead.business_name} (${lead.website})`);

        try {
            const email = await findEmailOnWebsite(lead.website);

            if (email) {
                console.log(`✅ Found email: ${email}`);
                const { error: updateError } = await supabase
                    .from('leads')
                    .update({ email })
                    .eq('id', lead.id);

                if (updateError) {
                    console.error(`❌ Failed to update lead ${lead.id}:`, updateError.message);
                } else {
                    updatedCount++;
                }
            } else {
                console.log(`ℹ️ No email found for ${lead.business_name}`);
                failCount++;
            }
        } catch (err) {
            console.error(`❌ Error processing ${lead.business_name}:`, err.message);
            failCount++;
        }

        // Brief delay to be polite to websites
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n--- Augmentation Complete ---');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`❌ No email found: ${failCount}`);
    console.log('-----------------------------');
}

augmentLeads().catch(console.error);
