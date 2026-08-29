const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function checkUuidError() {
  console.log('Testing query with org_firstclick:');
  const res1 = await supabase.from('leads').select('*').eq('organization_id', 'org_firstclick');
  console.log('Error 1:', res1.error);

  console.log('\nTesting query with a valid UUID:');
  const res2 = await supabase.from('leads').select('*').eq('organization_id', '00000000-0000-0000-0000-000000000000');
  console.log('Error 2:', res2.error);

  console.log('\nTesting query without org filter:');
  const res3 = await supabase.from('leads').select('*');
  console.log('Error 3:', res3.error);
  console.log('Data length:', res3.data ? res3.data.length : 0);
}

checkUuidError();
