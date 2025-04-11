import { createClient } from '@supabase/supabase-js';

// Admin client that bypasses RLS
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Log when it initializes
console.log('Admin Supabase client initialized with service role key');