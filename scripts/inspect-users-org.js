const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function inspectUsers() {
  console.log('--- Profiles ---');
  const { data: profs } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profs);

  console.log('--- Organization Members ---');
  const { data: members } = await supabase.from('organization_members').select('*');
  console.log('Members:', members);

  console.log('--- Leads count ---');
  const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  console.log('Leads count total in DB:', count);

  console.log('--- Sample leads ---');
  const { data: sampleLeads } = await supabase.from('leads').select('id, organization_id, full_name, email, status').limit(5);
  console.log('Sample leads:', sampleLeads);
}

inspectUsers();
