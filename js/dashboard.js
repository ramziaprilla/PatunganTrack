import { initPage, ambilKegiatan, hapusKegiatan, kartuKegiatan, rupiah } from './common.js'

const grid = document.getElementById('kegiatan-grid')
const empty = document.getElementById('kegiatan-empty')
const search = document.getElementById('search')
const pills = document.querySelectorAll('.filter-pills .pill')

let semuaKegiatan = []
let filter = 'semua'

function render() {
  const kata = search.value.trim().toLowerCase()
  const tampil = semuaKegiatan.filter((k) => {
    const cocok = `${k.nama_kegiatan} ${k.kategori ?? ''}`.toLowerCase().includes(kata)
    if (filter === 'lunas') return cocok && k.ringkasan.lunas
    if (filter === 'belum') return cocok && !k.ringkasan.lunas
    return cocok
  })

  grid.innerHTML = tampil.map(kartuKegiatan).join('')
  empty.hidden = tampil.length > 0
  empty.textContent = semuaKegiatan.length
    ? 'Tidak ada patungan yang cocok dengan pencarian atau filter.'
    : 'Belum ada patungan. Klik "+ Buat Patungan" untuk memulai.'
}

function renderRingkasan() {
  const semuaPeserta = semuaKegiatan.flatMap((k) => k.peserta)
  const lunas = semuaPeserta.filter((p) => p.status_lunas).length
  const sum = (key) => semuaKegiatan.reduce((s, k) => s + k.ringkasan[key], 0)

  document.getElementById('kegiatan-count').textContent = semuaKegiatan.length
  document.getElementById('sum-total').textContent = rupiah(sum('total'))
  document.getElementById('sum-total-sub').textContent = `${semuaKegiatan.length} patungan`
  document.getElementById('sum-terkumpul').textContent = rupiah(sum('terkumpul'))
  document.getElementById('sum-terkumpul-sub').textContent = `${lunas} peserta lunas`
  document.getElementById('sum-belum').textContent = rupiah(sum('belum'))
  document.getElementById('sum-belum-sub').textContent = `${semuaPeserta.length - lunas} peserta belum lunas`
}

async function muat() {
  const data = await ambilKegiatan()
  if (!data) return
  semuaKegiatan = data
  renderRingkasan()
  render()
}

async function main() {
  const user = await initPage()
  if (!user) return

  document.getElementById('greeting').textContent = `Selamat Datang, ${user.nama} 👋`

  search.addEventListener('input', render)
  pills.forEach((pill) => pill.addEventListener('click', () => {
    pills.forEach((p) => p.classList.toggle('active', p === pill))
    filter = pill.dataset.filter
    render()
  }))
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-hapus]')
    if (!btn) return
    const k = semuaKegiatan.find((x) => String(x.id) === btn.dataset.hapus)
    if (await hapusKegiatan(k)) await muat()
  })

  await muat()
}

main()
