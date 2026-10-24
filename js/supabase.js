// js/supabase.js
// Satu-satunya tempat client Supabase dibuat. File lain cukup:
//   import { supabase } from './supabase.js'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm'

// Ambil dari Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://ejprwkdipuedujuqzhjf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_RKS8e_wBB8hHEqBlRqlIxw_diRV1cdb'

// Hanya anon/publishable key yang boleh ada di sini.
// JANGAN PERNAH memakai service_role key di frontend.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
