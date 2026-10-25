import { supabase } from './supabase.js'
import { initPage, ringkasPeserta, ikonKategori, rupiah, tanggal, esc, notify } from './common.js'

const id = new URLSearchParams(location.search).get('id')
const form = document.getElementById('peserta-form')
const submitBtn = document.getElementById('peserta-submit')
const batalBtn = document.getElementById('peserta-batal')
const tbody = document.getElementById('peserta-body')
const pesertaEmpty = document.getElementById('peserta-empty')
const pills = document.querySelectorAll('.table-filter-pills .pill')

let kegiatan = null
let peserta = []
let filter = 'semua'
let editId = null

const $ = (elId) => document.getElementById(elId)

function renderHeader() {
  const r = ringkasPeserta(kegiatan, peserta)
  const belumCount = peserta.filter((p) => !p.status_lunas).length

  document.title = `PatunganTrack - ${kegiatan.nama_kegiatan}`
  $('kategori').textContent = `${ikonKategori(kegiatan.kategori)} ${kegiatan.kategori || 'Tanpa kategori'}`
  $('judul').textContent = kegiatan.nama_kegiatan
  $('meta').textContent = `📅 Dibuat ${tanggal(kegiatan.created_at)} • ${r.jumlah} Peserta • Tenggat ${tanggal(kegiatan.tenggat)}`
  $('deskripsi').textContent = kegiatan.deskripsi ?? ''
  $('btn-edit').href = `create-group.html?id=${kegiatan.id}`

  $('stat-total').textContent = rupiah(r.total)
  $('stat-total-sub').textContent = `${r.jumlah} orang patungan`
  $('stat-per-orang').textContent = r.jumlah ? rupiah(r.perOrang) : '-'
  $('stat-terkumpul').textContent = rupiah(r.terkumpul)
  $('stat-terkumpul-sub').textContent = `${r.jumlah - belumCount} peserta lunas`
  $('stat-persen').textContent = `${r.persen}%`
  $('stat-belum').textContent = rupiah(r.belum)
  $('stat-belum-count').textContent = `${belumCount} orang`

  $('legend-terkumpul').textContent = `(${r.persen}%)`
  $('legend-belum').textContent = `(${100 - r.persen}%)`
  $('bar-terkumpul').style.width = `${r.persen}%`
}

function baris(p) {
  const status = p.status_lunas
    ? '<span class="status-pill green-pill">✓ Lunas</span>'
    : '<span class="status-pill red-pill">✕ Belum Lunas</span>'
  return `
    <tr>
      <td><strong>${esc(p.nama_peserta)}</strong></td>
      <td><strong>${rupiah(p.nominal_tagihan)}</strong></td>
      <td>${status}</td>
      <td>
        <div class="action-btn-group">
          <button type="button" class="${p.status_lunas ? 'btn-table-edit' : 'btn-table-confirm'}" data-aksi="lunas" data-id="${p.id}">
            ${p.status_lunas ? 'Batalkan Lunas' : 'Set Lunas'}
          </button>
          <button type="button" class="btn-table-edit" data-aksi="edit" data-id="${p.id}">Edit</button>
          <button type="button" class="btn-table-reject" data-aksi="hapus" data-id="${p.id}">Hapus</button>
        </div>
      </td>
    </tr>`
}

function renderPeserta() {
  const tampil = peserta.filter((p) => {
    if (filter === 'lunas') return p.status_lunas
    if (filter === 'belum') return !p.status_lunas
    return true
  })
  tbody.innerHTML = tampil.map(baris).join('')
  pesertaEmpty.hidden = tampil.length > 0
  pesertaEmpty.textContent = peserta.length
    ? 'Tidak ada peserta dengan status ini.'
    : 'Belum ada peserta. Tambahkan lewat form di atas.'
}

function render() {
  renderHeader()
  renderPeserta()
}

async function muatPeserta() {
  const { data, error } = await supabase
    .from('peserta')
    .select('*')
    .eq('kegiatan_id', id)
    .order('created_at')
  if (error) return notify('Gagal memuat peserta: ' + error.message, true)
  peserta = data
  render()
}

function resetForm() {
  editId = null
  form.reset()
  submitBtn.textContent = '+ Tambah Peserta'
  batalBtn.hidden = true
}

function mulaiEdit(p) {
  editId = p.id
  form.nama.value = p.nama_peserta
  form.nominal.value = Number(p.nominal_tagihan)
  submitBtn.textContent = 'Simpan'
  batalBtn.hidden = false
  form.nama.focus()
}

async function simpanPeserta(e) {
  e.preventDefault()
  const payload = {
    nama_peserta: form.nama.value.trim(),
    nominal_tagihan: Number(form.nominal.value) || 0,
  }

  submitBtn.disabled = true
  const { error } = editId
    ? await supabase.from('peserta').update(payload).eq('id', editId)
    : await supabase.from('peserta').insert({ ...payload, kegiatan_id: kegiatan.id })
  submitBtn.disabled = false

  if (error) return notify('Gagal menyimpan peserta: ' + error.message, true)
  notify(editId ? 'Peserta diperbarui.' : 'Peserta ditambahkan.')
  resetForm()
  await muatPeserta()
}

async function aksiPeserta(e) {
  const btn = e.target.closest('[data-aksi]')
  if (!btn) return
  const p = peserta.find((x) => String(x.id) === btn.dataset.id)

  if (btn.dataset.aksi === 'edit') return mulaiEdit(p)

  if (btn.dataset.aksi === 'hapus') {
    if (!confirm(`Hapus peserta "${p.nama_peserta}"?`)) return
    const { error } = await supabase.from('peserta').delete().eq('id', p.id)
    if (error) return notify('Gagal menghapus: ' + error.message, true)
    if (editId === p.id) resetForm()
  }

  if (btn.dataset.aksi === 'lunas') {
    const { error } = await supabase.from('peserta').update({ status_lunas: !p.status_lunas }).eq('id', p.id)
    if (error) return notify('Gagal mengubah status: ' + error.message, true)
  }

  await muatPeserta()
}

async function bagiRata() {
  if (!peserta.length) return notify('Tambahkan peserta dulu sebelum membagi rata.', true)
  const bagian = Math.ceil(Number(kegiatan.total_biaya) / peserta.length)
  if (!confirm(`Set tagihan semua ${peserta.length} peserta menjadi ${rupiah(bagian)}?`)) return

  const { error } = await supabase
    .from('peserta')
    .update({ nominal_tagihan: bagian })
    .eq('kegiatan_id', kegiatan.id)
  if (error) return notify('Gagal membagi rata: ' + error.message, true)

  notify('Tagihan dibagi rata.')
  await muatPeserta()
}

async function hapusKegiatan() {
  if (!confirm(`Hapus "${kegiatan.nama_kegiatan}" beserta semua pesertanya?`)) return
  const { error } = await supabase.from('kegiatan').delete().eq('id', kegiatan.id)
  if (error) return notify('Gagal menghapus: ' + error.message, true)
  location.replace('index.html')
}

async function main() {
  const user = await initPage()
  if (!user) return

  const { data, error } = id
    ? await supabase.from('kegiatan').select('*').eq('id', id).maybeSingle()
    : { data: null }
  if (error || !data) {
    $('not-found').hidden = false
    return
  }

  kegiatan = data
  $('detail').hidden = false

  form.addEventListener('submit', simpanPeserta)
  batalBtn.addEventListener('click', resetForm)
  tbody.addEventListener('click', aksiPeserta)
  $('btn-bagi-rata').addEventListener('click', bagiRata)
  $('btn-hapus').addEventListener('click', hapusKegiatan)
  pills.forEach((pill) => pill.addEventListener('click', () => {
    pills.forEach((x) => x.classList.toggle('active', x === pill))
    filter = pill.dataset.filter
    renderPeserta()
  }))

  await muatPeserta()
}

main()
