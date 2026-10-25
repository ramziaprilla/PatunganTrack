import { initPage, ambilKegiatan, hapusKegiatan, kartuKegiatan, rupiah, tanggal } from './common.js'

const grid = document.getElementById('kegiatan-grid')
const empty = document.getElementById('kegiatan-empty')
const search = document.getElementById('search')
const sort = document.getElementById('sort')
const perPageSelect = document.getElementById('per-page')
const pills = document.querySelectorAll('.filter-pills .pill')
const controls = document.getElementById('pagination-controls')

let semuaKegiatan = []
let filter = 'semua'
let halaman = 1

const URUTAN = {
  terbaru: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  nama: (a, b) => a.nama_kegiatan.localeCompare(b.nama_kegiatan, 'id'),
  total: (a, b) => b.ringkasan.total - a.ringkasan.total,
}

function renderStatistik() {
  const sum = (key) => semuaKegiatan.reduce((s, k) => s + k.ringkasan[key], 0)
  const hitung = (key) => semuaKegiatan.filter((k) => k.status.key === key).length
  const total = sum('total')
  const terkumpul = sum('terkumpul')
  const belumLunas = semuaKegiatan.flatMap((k) => k.peserta).filter((p) => !p.status_lunas).length

  document.getElementById('stat-grup').textContent = `${semuaKegiatan.length} Grup`
  document.getElementById('stat-grup-sub').textContent = `✓ ${hitung('berjalan')} Berjalan • ${hitung('lunas')} Lunas`
  document.getElementById('stat-terkumpul').textContent = rupiah(terkumpul)
  document.getElementById('stat-total').textContent = rupiah(total)
  document.getElementById('stat-persen').textContent = `${total ? Math.round((terkumpul / total) * 100) : 0}%`
  document.getElementById('stat-belum').textContent = rupiah(sum('belum'))
  document.getElementById('stat-belum-sub').textContent = `● ${belumLunas} peserta belum lunas`

  const terdekat = semuaKegiatan
    .filter((k) => k.tenggat && !k.ringkasan.lunas)
    .sort((a, b) => new Date(a.tenggat) - new Date(b.tenggat))[0]
  document.getElementById('stat-tenggat').textContent = terdekat ? tanggal(terdekat.tenggat) : '-'
  document.getElementById('stat-tenggat-sub').textContent = terdekat ? `⏰ ${terdekat.nama_kegiatan}` : 'Tidak ada tenggat'

  document.querySelector('[data-count="semua"]').textContent = semuaKegiatan.length
  for (const key of ['berjalan', 'kosong', 'lunas']) {
    document.querySelector(`[data-count="${key}"]`).textContent = hitung(key)
  }
}

function renderPagination(jumlah, perPage) {
  const totalHalaman = Math.max(1, Math.ceil(jumlah / perPage))
  const awal = jumlah ? (halaman - 1) * perPage + 1 : 0
  const akhir = Math.min(halaman * perPage, jumlah)
  document.getElementById('pagination-info').innerHTML =
    `Menampilkan <strong>${awal} - ${akhir}</strong> dari <strong>${jumlah}</strong> grup`

  const tombol = (label, page, { active = false, disabled = false } = {}) =>
    `<button type="button" class="btn-page${active ? ' active' : ''}${disabled ? ' disabled' : ''}"
      data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`

  controls.innerHTML = [
    tombol('‹ Kembali', halaman - 1, { disabled: halaman === 1 }),
    ...Array.from({ length: totalHalaman }, (_, i) => tombol(i + 1, i + 1, { active: i + 1 === halaman })),
    tombol('Selanjutnya ›', halaman + 1, { disabled: halaman === totalHalaman }),
  ].join('')
}

function render() {
  const kata = search.value.trim().toLowerCase()
  const hasil = semuaKegiatan
    .filter((k) => filter === 'semua' || k.status.key === filter)
    .filter((k) => `${k.nama_kegiatan} ${k.kategori ?? ''}`.toLowerCase().includes(kata))
    .sort(URUTAN[sort.value])

  const perPage = Number(perPageSelect.value)
  halaman = Math.min(halaman, Math.max(1, Math.ceil(hasil.length / perPage)))
  const tampil = hasil.slice((halaman - 1) * perPage, halaman * perPage)

  grid.innerHTML = tampil.map(kartuKegiatan).join('')
  document.getElementById('tampil-count').textContent = `${tampil.length} Grup Tampil`
  empty.hidden = hasil.length > 0
  empty.textContent = semuaKegiatan.length
    ? 'Tidak ada grup yang cocok dengan pencarian atau filter.'
    : 'Belum ada grup patungan. Klik "+ Buat Grup Baru" untuk memulai.'
  renderPagination(hasil.length, perPage)
}

async function muat() {
  const data = await ambilKegiatan()
  if (!data) return
  semuaKegiatan = data
  renderStatistik()
  render()
}

function keHalamanPertama() {
  halaman = 1
  render()
}

async function main() {
  const user = await initPage()
  if (!user) return

  search.addEventListener('input', keHalamanPertama)
  sort.addEventListener('change', keHalamanPertama)
  perPageSelect.addEventListener('change', keHalamanPertama)
  pills.forEach((pill) => pill.addEventListener('click', () => {
    pills.forEach((p) => p.classList.toggle('active', p === pill))
    filter = pill.dataset.filter
    keHalamanPertama()
  }))
  controls.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]')
    if (!btn || btn.disabled) return
    halaman = Number(btn.dataset.page)
    render()
  })
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-hapus]')
    if (!btn) return
    const k = semuaKegiatan.find((x) => String(x.id) === btn.dataset.hapus)
    if (await hapusKegiatan(k)) await muat()
  })

  await muat()
}

main()
