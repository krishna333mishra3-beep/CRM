const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function testInsert() {
  const testLead = {
    organization_id: '00000000-0000-0000-0000-000000000001',
    first_name: 'TestSync',
    last_name: 'Lead',
    full_name: 'TestSync Lead',
    email: 'testsync@example.com',
    phone: '+91 99999 88888',
    company_name: 'Test Company',
    source: 'MANUAL',
    status: 'NEW',
    priority: 'MEDIUM',
    estimated_value: 50000,
  };

  const { data, error } = await supabase.from('leads').insert(testLead).select();
  console.log('Test insert result:', { data, error });

  const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  console.log('Total leads now in Supabase Cloud DB:', count);
}

testInsert();
