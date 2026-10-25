import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
