import { supabase } from './supabase.js'

export const KATEGORI = {
  'Wisata & Liburan': '✈️',
  'Hunian & Sewa': '🏠',
  'Kuliner': '🍽️',
  'Langganan': '🔄',
  'Olahraga': '⚽',
  'Acara / Kado': '🎁',
}

export const ikonKategori = (kategori) => KATEGORI[kategori] ?? '💸'

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(Number(n) || 0)

export const tanggal = (value) =>
  value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function ringkasPeserta(kegiatan, peserta) {
  const total = Number(kegiatan.total_biaya) || 0
  const jumlah = peserta.length
  const terkumpul = peserta.filter((p) => p.status_lunas).reduce((s, p) => s + Number(p.nominal_tagihan), 0)
  const belum = peserta.filter((p) => !p.status_lunas).reduce((s, p) => s + Number(p.nominal_tagihan), 0)
  const lunas = jumlah > 0 && peserta.every((p) => p.status_lunas)
  const persen = total > 0 ? Math.min(100, Math.round((terkumpul / total) * 100)) : 0
  const perOrang = jumlah > 0 ? total / jumlah : 0
  return { total, jumlah, terkumpul, belum, lunas, persen, perOrang }
}

export function notify(text, isError = false) {
  let el = document.querySelector('.toast')
  if (!el) {
    el = document.createElement('div')
    el.className = 'toast'
    el.setAttribute('role', 'status')
    document.body.append(el)
  }
  el.textContent = text
  el.classList.toggle('toast-error', isError)
  el.classList.add('show')
  clearTimeout(el.timer)
  el.timer = setTimeout(() => el.classList.remove('show'), 3500)
}

// Dipanggil di awal setiap halaman yang wajib login.
// Mengembalikan user, atau null kalau sedang diarahkan ke halaman login.
export async function initPage() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    location.replace('auth.html')
    return null
  }

  const user = session.user
  const nama = user.user_metadata?.full_name || user.email.split('@')[0]
  document.querySelectorAll('.user-name').forEach((el) => { el.textContent = nama })
  document.querySelectorAll('.avatar-circle').forEach((el) => { el.textContent = nama.slice(0, 2).toUpperCase() })

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut()
    location.replace('auth.html')
  })

  return { ...user, nama }
}
