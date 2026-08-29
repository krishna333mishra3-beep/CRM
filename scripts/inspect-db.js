const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function inspectData() {
  console.log('--- Organizations ---');
  const { data: orgs, error: orgsErr } = await supabase.from('organizations').select('*');
  console.log('Orgs error:', orgsErr);
  console.log('Orgs data:', orgs);

  console.log('--- Leads count ---');
  const { count, error: countErr } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  console.log('Leads count error:', countErr);
  console.log('Leads count total:', count);

  console.log('--- Leads sample ---');
  const { data: leads, error: leadsErr } = await supabase.from('leads').select('id, organization_id, full_name, first_name, last_name, email, status').limit(5);
  console.log('Leads sample error:', leadsErr);
  console.log('Leads sample data:', leads);

  if (leads && leads.length > 0) {
    console.log('First lead org_id:', leads[0].organization_id);
  }

  // Check unique organization_ids in leads if possible
  const { data: orgIds, error: distErr } = await supabase.from('leads').select('organization_id').limit(100);
  if (orgIds) {
    const unique = Array.from(new Set(orgIds.map(x => x.organization_id)));
    console.log('Unique org_ids in leads sample:', unique);
  }
}

inspectData();
