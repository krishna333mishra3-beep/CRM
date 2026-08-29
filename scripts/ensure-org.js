const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function ensureOrg() {
  // 1. Check if First Click Softwares org exists by slug or name
  let { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'firstclick-crm')
    .maybeSingle();

  console.log('Existing org check:', { org, error });

  if (!org) {
    // Upsert or insert with fixed UUID
    const newOrg = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'First Click Softwares',
      slug: 'firstclick-crm',
      email: 'admin@firstclick.com',
      phone: '+91 98765 43210',
      website: 'https://firstclicksoftwares.com',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      currency_symbol: '₹',
    };
    const { data: inserted, error: insertErr } = await supabase
      .from('organizations')
      .upsert(newOrg)
      .select()
      .single();
    console.log('Inserted org:', { inserted, insertErr });
    org = inserted;
  }

  return org;
}

ensureOrg();
