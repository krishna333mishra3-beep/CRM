const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function findDemoLead() {
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', '00000000-0000-0000-0000-000000000001');

  if (leads) {
    const demoLeads = leads.filter(l => l.status === 'DEMO' || l.status === 'DEMO_SCHEDULED' || l.status === 'demo');
    console.log('Demo leads found in DB:', demoLeads);
  }
}

findDemoLead();
