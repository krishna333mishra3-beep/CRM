const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function findLeadsAndOrgs() {
  // Let's select leads without organization_id filter, maybe select count or first few
  console.log('Querying public.leads directly:');
  const res1 = await supabase.from('leads').select('*', { count: 'exact' });
  console.log('Error:', res1.error);
  console.log('Count:', res1.count);
  console.log('Data length:', res1.data ? res1.data.length : 0);
  if (res1.data && res1.data.length > 0) {
    console.log('Sample lead row:', res1.data[0]);
  }

  console.log('\nQuerying public.organizations directly:');
  const res2 = await supabase.from('organizations').select('*');
  console.log('Error:', res2.error);
  console.log('Data:', res2.data);

  console.log('\nQuerying public.profiles directly:');
  const res3 = await supabase.from('profiles').select('*');
  console.log('Error:', res3.error);
  console.log('Data:', res3.data);
}

findLeadsAndOrgs();
