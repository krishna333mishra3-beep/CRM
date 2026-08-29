const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function findOrgs() {
  console.log('Querying organizations table...');
  const { data, error } = await supabase.from('organizations').select('*');
  console.log('Orgs error:', error);
  console.log('Orgs data:', data);

  console.log('Querying organization_members table...');
  const { data: mems, error: memsErr } = await supabase.from('organization_members').select('*');
  console.log('Members error:', memsErr);
  console.log('Members data:', mems);
}

findOrgs();
