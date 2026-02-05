import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkLead() {
    const phone = '020 8088 1195';
    const cleaned = phone.replace(/\s+/g, '');

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*, call_logs(*)')
        .or(`phone_number.ilike.%${cleaned}%,phone_number.ilike.%${phone}%`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('Lead not found');
        return;
    }

    for (const lead of leads) {
        console.log(`Lead: ${lead.business_name} (ID: ${lead.id})`);
        console.log(`Status in DB: ${lead.status}`);
        console.log(`Last Called At: ${lead.last_called_at}`);
        console.log('Call Logs:');
        lead.call_logs.sort((a, b) => new Date(b.called_at) - new Date(a.called_at)).forEach(log => {
            console.log(` - ${log.called_at}: [${log.call_outcome}] ${log.notes || ''}`);
        });
        console.log('---');
    }
}

checkLead();
