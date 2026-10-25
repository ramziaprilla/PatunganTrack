import { supabase } from './supabase.js'
import { initPage, ambilKegiatan, notify } from './common.js'

const $ = (id) => document.getElementById(id)
const form = $('profil-form')
const field = form.elements
const sandiForm = $('sandi-form')
const toggleSandi = $('btn-ubah-sandi')

let user = null

const bulanTahun = (value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

function namaTampil(u) {
  return u.user_metadata?.full_name || u.email.split('@')[0]
}

function renderProfil() {
  const meta = user.user_metadata ?? {}
  const nama = namaTampil(user)

  $('profil-avatar').textContent = nama.slice(0, 2).toUpperCase()
  $('profil-nama').textContent = nama
  $('profil-email').textContent = `✉️ ${user.email}`
  $('profil-hp').hidden = !meta.phone
  $('profil-hp').textContent = meta.phone ? `📞 ${meta.phone}` : ''
  $('stat-bergabung').textContent = bulanTahun(user.created_at)
  $('status-email').innerHTML = user.email_confirmed_at
    ? '<span class="green-dot">●</span> Terverifikasi'
    : '<span class="orange-dot">●</span> Belum diverifikasi'

  document.querySelectorAll('.user-name').forEach((el) => { el.textContent = nama })
  document.querySelectorAll('.avatar-circle').forEach((el) => { el.textContent = nama.slice(0, 2).toUpperCase() })
}

function isiForm() {
  const meta = user.user_metadata ?? {}
  field.full_name.value = namaTampil(user)
  field.username.value = meta.username ?? ''
  field.email.value = user.email
  field.phone.value = meta.phone ?? ''
  field.bio.value = meta.bio ?? ''
}

async function simpanProfil(e) {
  e.preventDefault()
  const btn = $('profil-simpan')
  btn.disabled = true
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: field.full_name.value.trim(),
      username: field.username.value.trim().toLowerCase(),
      phone: field.phone.value.trim(),
      bio: field.bio.value.trim(),
    },
  })
  btn.disabled = false

  if (error) return notify('Gagal menyimpan profil: ' + error.message, true)
  user = data.user
  renderProfil()
  isiForm()
  notify('Profil disimpan.')
}

async function simpanSandi(e) {
  e.preventDefault()
  const { sandi, ulang } = sandiForm.elements
  if (sandi.value !== ulang.value) return notify('Kedua kata sandi tidak sama.', true)

  const btn = $('sandi-simpan')
  btn.disabled = true
  const { error } = await supabase.auth.updateUser({ password: sandi.value })
  btn.disabled = false

  if (error) return notify('Gagal mengubah kata sandi: ' + error.message, true)
  sandiForm.reset()
  sandiForm.hidden = true
  toggleSandi.setAttribute('aria-expanded', 'false')
  notify('Kata sandi diperbarui.')
}

async function keluarSemua() {
  if (!confirm('Keluar dari semua perangkat? Kamu perlu login ulang di setiap perangkat.')) return
  await supabase.auth.signOut({ scope: 'global' })
  location.replace('auth.html')
}

async function renderStatistik() {
  const kegiatan = await ambilKegiatan()
  if (!kegiatan) return
  $('stat-dibuat').textContent = `${kegiatan.length} Grup`
  $('stat-lunas').textContent = `${kegiatan.filter((k) => k.ringkasan.lunas).length} Grup`
}

async function main() {
  user = await initPage()
  if (!user) return

  renderProfil()
  isiForm()

  form.addEventListener('submit', simpanProfil)
  $('profil-reset').addEventListener('click', isiForm)
  toggleSandi.addEventListener('click', () => {
    sandiForm.hidden = !sandiForm.hidden
    toggleSandi.setAttribute('aria-expanded', String(!sandiForm.hidden))
    if (!sandiForm.hidden) sandiForm.elements.sandi.focus()
  })
  sandiForm.addEventListener('submit', simpanSandi)
  $('btn-keluar-semua').addEventListener('click', keluarSemua)

  await renderStatistik()
}

main()
