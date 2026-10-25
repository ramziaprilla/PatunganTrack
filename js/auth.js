import { supabase } from './supabase.js'

const PESAN_ERROR = {
  'Invalid login credentials': 'Email atau kata sandi salah.',
  'User already registered': 'Email ini sudah terdaftar. Silakan masuk.',
  'Email not confirmed': 'Email belum dikonfirmasi. Cek kotak masuk kamu.',
}

function pesanError(error) {
  if (/at least 6 characters/i.test(error.message)) return 'Kata sandi minimal 6 karakter.'
  return PESAN_ERROR[error.message] ?? error.message
}

supabase.auth.getSession().then(({ data }) => {
  if (data.session) location.replace('index.html')
})

const form = document.getElementById('login-form')
const field = form.elements
const tabMasuk = document.getElementById('tab-masuk')
const tabDaftar = document.getElementById('tab-daftar')
const submitBtn = form.querySelector('.btn-submit-orange')
const passwordInput = document.getElementById('password')
const message = document.getElementById('auth-message')

let mode = 'masuk'

function tampilkan(text, isError = false) {
  message.textContent = text
  message.classList.toggle('error', isError)
}

function setMode(next) {
  mode = next
  tabMasuk.classList.toggle('active', mode === 'masuk')
  tabDaftar.classList.toggle('active', mode === 'daftar')
  submitBtn.firstChild.textContent = mode === 'masuk' ? 'Masuk ke PatunganTrack ' : 'Daftar Akun Baru '
  passwordInput.autocomplete = mode === 'masuk' ? 'current-password' : 'new-password'
  tampilkan('')
}

tabMasuk.addEventListener('click', () => setMode('masuk'))
tabDaftar.addEventListener('click', () => setMode('daftar'))

document.querySelector('.toggle-password-icon').addEventListener('click', () => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password'
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = field.email.value.trim()
  const password = field.password.value

  submitBtn.disabled = true
  tampilkan('Memproses...')

  try {
    if (mode === 'daftar') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: email.split('@')[0] } },
      })
      if (error) throw error
      if (!data.session) {
        setMode('masuk')
        tampilkan('Pendaftaran berhasil. Cek email kamu untuk konfirmasi, lalu masuk.')
        return
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    }
    location.replace('index.html')
  } catch (error) {
    tampilkan(pesanError(error), true)
  } finally {
    submitBtn.disabled = false
  }
})
