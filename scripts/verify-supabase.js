const { createClient } = require('@supabase/supabase-js');

const url = 'https://myqegsydtpbkiarqobkp.supabase.co';
const anonKey = 'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

const supabase = createClient(url, anonKey);

const TABLES = [
  'organizations',
  'profiles',
  'organization_members',
  'leads',
  'contacts',
  'companies',
  'pipelines',
  'pipeline_stages',
  'deals',
  'payments',
  'activities',
  'tasks',
  'notes',
  'notifications',
  'audit_logs',
  'custom_fields',
  'custom_field_values',
  'attachments',
  'admin_messages'
];

async function verifyAll() {
  console.log('====================================================');
  console.log('SUPABASE REMOTE DATABASE VERIFICATION REPORT');
  console.log('Target Project URL:', url);
  console.log('====================================================\n');

  let passed = 0;
  let missing = 0;

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        console.log(`❌ public.${table.padEnd(22)} : MISSING (Not in remote schema cache)`);
        missing++;
      } else {
        console.log(`⚠️ public.${table.padEnd(22)} : EXISTS (RLS / Auth status: ${error.message})`);
        passed++;
      }
    } else {
      console.log(`✅ public.${table.padEnd(22)} : READY (Live & accessible, rows count: ${data ? data.length : 0})`);
      passed++;
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Summary: ${passed} Ready / Accessible | ${missing} Missing in Remote DB`);
  console.log('----------------------------------------------------');
}

verifyAll();
