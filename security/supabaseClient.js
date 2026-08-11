import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://uaizieqqjsonoxuwjtlz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kKmCvV8ryC7juvS6p6fNoA_ipW6v168';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
