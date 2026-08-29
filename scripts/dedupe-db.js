const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function dedupe() {
  console.log('--- Fetching all leads from Supabase Cloud DB ---');
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, full_name, phone, email, created_at')
    .order('created_at', { ascending: true });

  if (error || !leads) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Total leads in DB: ${leads.length}`);

  const seenKeys = new Set();
  const idsToDelete = [];

  for (const lead of leads) {
    const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : null;
    const cleanEmail = lead.email ? lead.email.toLowerCase().trim() : null;
    const cleanName = lead.full_name ? lead.full_name.toLowerCase().trim() : null;

    const key = cleanPhone || cleanEmail || cleanName;

    if (key && seenKeys.has(key)) {
      idsToDelete.push(lead.id);
    } else if (key) {
      seenKeys.add(key);
    }
  }

  console.log(`Unique leads count: ${seenKeys.size}`);
  console.log(`Duplicates to delete: ${idsToDelete.length}`);

  if (idsToDelete.length > 0) {
    // Delete in chunks of 100
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const chunk = idsToDelete.slice(i, i + 100);
      const { error: delErr } = await supabase.from('leads').delete().in('id', chunk);
      if (delErr) {
        console.error('Delete chunk error:', delErr);
      }
    }
    console.log('Deduplication finished successfully!');
  }

  const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  console.log(`Final clean leads count in Supabase Cloud DB: ${count}`);
}

dedupe();
