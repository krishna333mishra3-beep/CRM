import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://myqegsydtpbkiarqobkp.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_E-Zs6nRgjeyz1tG2YqdhtA_395XH09q';

  return createBrowserClient(supabaseUrl, supabaseKey);
}
