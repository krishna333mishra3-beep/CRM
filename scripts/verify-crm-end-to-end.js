const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

const MAIN_ORG_ID = '00000000-0000-0000-0000-000000000001';

async function verifyEndToEnd() {
  console.log('--- 1. Check Main Organization ---');
  const { data: org, error: orgErr } = await supabase.from('organizations').select('*').eq('id', MAIN_ORG_ID).single();
  console.log('Org status:', org ? `FOUND (${org.name})` : 'NOT FOUND', orgErr);

  console.log('--- 2. Check Organization Members ---');
  const { data: members, error: memErr } = await supabase.from('organization_members').select('*, user:profiles(email, full_name)');
  console.log('Members count:', members ? members.length : 0, memErr);
  if (members) {
    members.forEach(m => console.log(` - Admin: ${m.user?.email || m.user_id} -> Org: ${m.organization_id}`));
  }

  console.log('--- 3. Check Leads Query (Simulating getLeads for Ekansh, Kuldeep & Shreyash) ---');
  const { data: leads, count, error: leadsErr } = await supabase
    .from('leads')
    .select('*, owner:profiles(*)', { count: 'exact' })
    .eq('organization_id', MAIN_ORG_ID)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  console.log('Leads error:', leadsErr);
  console.log('Total Leads returned by Supabase Cloud DB for ALL Admins:', count || (leads ? leads.length : 0));
  if (leads && leads.length > 0) {
    console.log('First lead sample:', { id: leads[0].id, name: leads[0].full_name, phone: leads[0].phone, org: leads[0].organization_id });
  }
}

verifyEndToEnd();
