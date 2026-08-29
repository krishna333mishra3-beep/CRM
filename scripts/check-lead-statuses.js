const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function checkStatuses() {
  const { data: leads } = await supabase.from('leads').select('id, full_name, status');
  console.log('Total leads count:', leads ? leads.length : 0);
  if (leads) {
    const statusCounts = {};
    leads.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });
    console.log('Status distribution in DB:', statusCounts);
  }
}

checkStatuses();
