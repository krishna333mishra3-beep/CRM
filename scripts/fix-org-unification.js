const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

const MAIN_ORG_ID = '00000000-0000-0000-0000-000000000001';

async function unifyOrgs() {
  console.log('--- Unifying Organization ID across all Admins ---');

  // 1. Ensure main org exists
  await supabase.from('organizations').upsert({
    id: MAIN_ORG_ID,
    name: 'First Click Softwares',
    slug: 'firstclick-crm',
    email: 'admin@firstclick.com',
  });

  // 2. Get all organization_members and update organization_id to MAIN_ORG_ID
  const { data: members } = await supabase.from('organization_members').select('*');
  if (members) {
    for (const m of members) {
      await supabase
        .from('organization_members')
        .update({ organization_id: MAIN_ORG_ID })
        .eq('id', m.id);
    }
  }

  // 3. Update all leads in DB to MAIN_ORG_ID
  const { data: leads } = await supabase.from('leads').select('id');
  if (leads && leads.length > 0) {
    await supabase
      .from('leads')
      .update({ organization_id: MAIN_ORG_ID })
      .neq('id', '00000000-0000-0000-0000-000000000000');
  }

  console.log('--- Verification ---');
  const { data: updatedMembers } = await supabase.from('organization_members').select('user_id, organization_id');
  console.log('Updated Members:', updatedMembers);

  const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', MAIN_ORG_ID);
  console.log(`Leads under main org (${MAIN_ORG_ID}):`, leadCount);
}

unifyOrgs();
