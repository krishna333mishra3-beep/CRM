const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function seedCloudDb() {
  console.log('--- Seeding Default Organization ---');
  const orgPayload = {
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

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .upsert(orgPayload, { onConflict: 'id' })
    .select()
    .single();

  console.log('Org result:', { org, orgErr });

  console.log('--- Seeding Default Pipeline ---');
  const pipePayload = {
    id: '00000000-0000-0000-0000-000000000010',
    organization_id: '00000000-0000-0000-0000-000000000001',
    name: 'Standard Sales Pipeline',
    is_default: true,
  };

  const { data: pipe, error: pipeErr } = await supabase
    .from('pipelines')
    .upsert(pipePayload, { onConflict: 'id' })
    .select()
    .single();

  console.log('Pipe result:', { pipe, pipeErr });
}

seedCloudDb();
