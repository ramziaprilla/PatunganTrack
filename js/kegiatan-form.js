import { supabase } from './supabase.js'
import { initPage, ikonKategori, rupiah, tanggal, notify } from './common.js'

const form = document.getElementById('kegiatan-form')
const field = form.elements
const pills = document.querySelectorAll('#kategori-pills .cat-pill')
const submitBtn = document.getElementById('btn-submit')
const id = new URLSearchParams(location.search).get('id')

let kategori = 'Wisata & Liburan'

function setKategori(value) {
  kategori = value
  pills.forEach((p) => p.classList.toggle('active', p.dataset.kategori === value))
  perbaruiPratinjau()
}

function perbaruiPratinjau() {
  const ikon = ikonKategori(kategori)
  document.getElementById('cover-icon').textContent = ikon
  document.getElementById('prev-emoji').textContent = ikon
  document.getElementById('prev-kategori').textContent = `${ikon} ${kategori}`
  document.getElementById('prev-nama').textContent = field.nama.value.trim() || 'Nama patungan'
  document.getElementById('prev-total').textContent = rupiah(field.total.value)
  document.getElementById('prev-tenggat').textContent = tanggal(field.tenggat.value)
}

async function muatUntukEdit() {
  const { data, error } = await supabase.from('kegiatan').select('*').eq('id', id).maybeSingle()
  if (error || !data) {
    notify('Patungan tidak ditemukan.', true)
    form.hidden = true
    return
  }

  document.title = 'PatunganTrack - Edit Patungan'
  document.getElementById('breadcrumb').textContent = 'Edit Patungan'
  document.getElementById('form-title').textContent = 'Edit Patungan ✏️'
  document.getElementById('prev-status').textContent = 'Diedit'
  document.getElementById('btn-batal').href = `group-detail-admin.html?id=${id}`
  submitBtn.textContent = 'Simpan Perubahan'

  field.nama.value = data.nama_kegiatan
  field.deskripsi.value = data.deskripsi ?? ''
  field.total.value = Number(data.total_biaya)
  field.tenggat.value = data.tenggat ?? ''
  setKategori(data.kategori || kategori)
}

async function simpan(e) {
  e.preventDefault()
  const payload = {
    nama_kegiatan: field.nama.value.trim(),
    kategori,
    deskripsi: field.deskripsi.value.trim() || null,
    total_biaya: Number(field.total.value),
    tenggat: field.tenggat.value || null,
  }

  submitBtn.disabled = true
  const query = id
    ? supabase.from('kegiatan').update(payload).eq('id', id).select('id').single()
    : supabase.from('kegiatan').insert(payload).select('id').single()
  const { data, error } = await query
  submitBtn.disabled = false

  if (error) return notify('Gagal menyimpan: ' + error.message, true)
  location.href = `group-detail-admin.html?id=${data.id}`
}

async function main() {
  // Interaksi form dipasang sebelum cek login supaya tidak menunggu jaringan.
  pills.forEach((p) => p.addEventListener('click', () => setKategori(p.dataset.kategori)))
  form.addEventListener('input', perbaruiPratinjau)
  form.addEventListener('submit', simpan)
  perbaruiPratinjau()

  const user = await initPage()
  if (!user) return
  if (id) await muatUntukEdit()
}

main()
