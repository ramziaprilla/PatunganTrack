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

export function statusKegiatan(r) {
  if (r.jumlah === 0) return { key: 'kosong', label: 'Belum ada peserta', cls: 'pending' }
  if (r.lunas) return { key: 'lunas', label: 'Lunas', cls: 'success' }
  return { key: 'berjalan', label: 'Berjalan', cls: 'running' }
}

export async function ambilKegiatan() {
  const { data, error } = await supabase
    .from('kegiatan')
    .select('*, peserta(nominal_tagihan, status_lunas)')
    .order('created_at', { ascending: false })
  if (error) {
    notify('Gagal memuat data: ' + error.message, true)
    return null
  }
  return data.map((k) => {
    const ringkasan = ringkasPeserta(k, k.peserta)
    return { ...k, ringkasan, status: statusKegiatan(ringkasan) }
  })
}

export async function hapusKegiatan(k) {
  if (!confirm(`Hapus "${k.nama_kegiatan}" beserta semua pesertanya?`)) return false
  const { error } = await supabase.from('kegiatan').delete().eq('id', k.id)
  if (error) {
    notify('Gagal menghapus: ' + error.message, true)
    return false
  }
  notify('Patungan dihapus.')
  return true
}

export function kartuKegiatan(k) {
  const r = k.ringkasan
  return `
    <article class="card group-card group-item-card">
      <div class="group-card-header">
        <div class="group-info">
          <div class="group-avatar-img">${ikonKategori(k.kategori)}</div>
          <div>
            <h3 class="group-title">${esc(k.nama_kegiatan)}</h3>
            <p class="group-meta">${esc(k.kategori || 'Tanpa kategori')} • ${r.jumlah} Peserta</p>
          </div>
        </div>
        <span class="status-badge ${k.status.cls}">${k.status.label}</span>
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
