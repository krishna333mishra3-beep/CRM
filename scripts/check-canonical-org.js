const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

async function checkCanonicalOrg() {
  // 1. Fetch organization by slug or any row from public.organizations
  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'firstclick-crm')
    .maybeSingle();

  console.log('Org query result:', { data: orgs, error: orgErr });

  if (!orgs) {
    // Check if any organization exists
    const { data: allOrgs } = await supabase.from('organizations').select('*');
    console.log('All orgs:', allOrgs);
  }
}

checkCanonicalOrg();
