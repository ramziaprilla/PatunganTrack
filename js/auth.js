// js/auth.js
// Fungsi autentikasi yang dipakai seluruh tim.
import { supabase } from './supabase.js'

const ERROR_ID = {
  'Invalid login credentials': 'Email atau kata sandi salah.',
  'User already registered': 'Email ini sudah terdaftar. Silakan masuk.',
  'Email not confirmed': 'Email belum dikonfirmasi. Cek kotak masuk Anda.',
}

function toMessage(error) {
  if (/at least 6 characters/i.test(error.message)) return 'Kata sandi minimal 6 karakter.'
  return ERROR_ID[error.message] ?? error.message
}

export async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw new Error(toMessage(error))
  // Jika "Confirm email" aktif, session bernilai null sampai user klik link di email.
  return { user: data.user, needsConfirmation: !data.session }
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(toMessage(error))
  return data.user
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

// Panggil callback setiap status login berubah (login, logout, refresh token).
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
