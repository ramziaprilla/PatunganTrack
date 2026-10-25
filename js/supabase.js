import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm'

const SUPABASE_URL = 'https://oigamitkgprjszxhsjmh.supabase.co'
// Hanya publishable/anon key. service_role key tidak boleh ada di frontend.
const SUPABASE_ANON_KEY = 'sb_publishable_zDEdyk3EiHJac2WveAkHOA_9ro5Y76Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
