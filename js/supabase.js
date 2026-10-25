import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm'

const SUPABASE_URL = 'https://ejprwkdipuedujuqzhjf.supabase.co'
// Hanya publishable/anon key. service_role key tidak boleh ada di frontend.
const SUPABASE_ANON_KEY = 'sb_publishable_RKS8e_wBB8hHEqBlRqlIxw_diRV1cdb'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
