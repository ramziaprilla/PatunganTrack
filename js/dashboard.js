import { supabase } from './supabase.js'
import { initPage, ringkasPeserta, ikonKategori, rupiah, tanggal, esc, notify } from './common.js'

const grid = document.getElementById('kegiatan-grid')
const empty = document.getElementById('kegiatan-empty')
const search = document.getElementById('search')
const pills = document.querySelectorAll('.filter-pills .pill')

let semuaKegiatan = []
let filter = 'semua'

function status(r) {
  if (r.jumlah === 0) return { label: 'Belum ada peserta', cls: 'pending' }
  if (r.lunas) return { label: 'Lunas', cls: 'success' }
  return { label: 'Berjalan', cls: 'running' }
}

function kartu(k) {
  const r = k.ringkasan
  const s = status(r)
  return `
    <article class="card group-card">
      <div class="group-card-header">
        <div class="group-info">
          <div class="group-avatar-img">${ikonKategori(k.kategori)}</div>
          <div>
            <h3 class="group-title">${esc(k.nama_kegiatan)}</h3>
            <p class="group-meta">${esc(k.kategori || 'Tanpa kategori')} • ${r.jumlah} Peserta</p>
          </div>
        </div>
        <span class="status-badge ${s.cls}">${s.label}</span>
      </div>

      <div class="progress-container">
        <div class="progress-info">
          <span>Terkumpul: <strong>${rupiah(r.terkumpul)}</strong></span>
          <span>${r.persen}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${r.lunas ? 'green-fill' : 'orange-fill'}" style="width: ${r.persen}%"></div>
        </div>
        <div class="target-info">
          <span>Total Biaya</span>
          <strong>${rupiah(r.total)}</strong>
        </div>
      </div>

      <div class="group-card-footer">
        <div class="members-share">
          <span class="group-meta">Tenggat: ${tanggal(k.tenggat)}</span>
          <div class="user-share">
            <span>Per Orang:</span>
            <strong class="share-amount">${r.jumlah ? rupiah(r.perOrang) : '-'}</strong>
          </div>
        </div>
        <div class="card-actions">
          <a class="btn-card-secondary" href="create-group.html?id=${k.id}">Edit</a>
          <button type="button" class="btn-card-danger" data-hapus="${k.id}">Hapus</button>
          <a class="btn-card-primary" href="group-detail-admin.html?id=${k.id}">Detail</a>
        </div>
      </div>
    </article>`
}

function render() {
  const kata = search.value.trim().toLowerCase()
  const tampil = semuaKegiatan.filter((k) => {
    const cocok = `${k.nama_kegiatan} ${k.kategori ?? ''}`.toLowerCase().includes(kata)
    if (filter === 'lunas') return cocok && k.ringkasan.lunas
    if (filter === 'belum') return cocok && !k.ringkasan.lunas
    return cocok
  })

  grid.innerHTML = tampil.map(kartu).join('')
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
  const { data, error } = await supabase
    .from('kegiatan')
    .select('*, peserta(nominal_tagihan, status_lunas)')
    .order('created_at', { ascending: false })

  if (error) return notify('Gagal memuat data: ' + error.message, true)

  semuaKegiatan = data.map((k) => ({ ...k, ringkasan: ringkasPeserta(k, k.peserta) }))
  renderRingkasan()
  render()
}

async function hapus(id) {
  const k = semuaKegiatan.find((x) => String(x.id) === id)
  if (!confirm(`Hapus "${k.nama_kegiatan}" beserta semua pesertanya?`)) return

  const { error } = await supabase.from('kegiatan').delete().eq('id', id)
  if (error) return notify('Gagal menghapus: ' + error.message, true)

  notify('Patungan dihapus.')
  await muat()
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
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-hapus]')
    if (btn) hapus(btn.dataset.hapus)
  })

  await muat()
}

main()
