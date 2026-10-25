import { initPage, ambilKegiatan, rupiah, tanggal, esc } from './common.js'

const $ = (id) => document.getElementById(id)
const list = $('notif-list')
const empty = $('notif-empty')
const pills = document.querySelectorAll('.filter-pills .pill')

const HARI_MENDESAK = 3
const LABEL_JENIS = { tagihan: 'Tagihan & Pembayaran', grup: 'Aktivitas Grup', sistem: 'Sistem' }

let notifikasi = []
let dibaca = new Set()
let storageKey = ''
let filter = 'semua'

// Status "sudah dibaca" hanya disimpan di browser ini.
function muatDibaca() {
  try { dibaca = new Set(JSON.parse(localStorage.getItem(storageKey)) ?? []) } catch { dibaca = new Set() }
}

function simpanDibaca() {
  try { localStorage.setItem(storageKey, JSON.stringify([...dibaca])) } catch { /* mode privat */ }
}

function selisihHari(tgl) {
  const hariIni = new Date()
  hariIni.setHours(0, 0, 0, 0)
  return Math.round((new Date(`${tgl}T00:00:00`) - hariIni) / 86400000)
}

function dariKegiatan(k) {
  const r = k.ringkasan
  const nama = `<strong>${esc(k.nama_kegiatan)}</strong>`
  const detail = `group-detail-admin.html?id=${k.id}`

  if (r.jumlah === 0) {
    return {
      id: `kosong-${k.id}`, jenis: 'grup', ikon: '👥', warna: 'blue', judul: 'Belum Ada Peserta',
      isi: `Grup ${nama} belum punya peserta. Tambahkan peserta agar tagihan bisa dibagi.`,
      waktu: `Dibuat ${tanggal(k.created_at)}`, aksi: { label: 'Tambah Peserta', href: detail },
    }
  }

  if (r.lunas) {
    return {
      id: `lunas-${k.id}`, jenis: 'grup', ikon: '✅', warna: 'green', judul: 'Patungan Lunas 100%',
      isi: `Semua ${r.jumlah} peserta ${nama} sudah lunas. Total terkumpul <strong>${rupiah(r.terkumpul)}</strong>.`,
      waktu: `Dibuat ${tanggal(k.created_at)}`, aksi: { label: 'Buka Grup', href: detail },
    }
  }

  const belum = k.peserta.filter((p) => !p.status_lunas).length
  const sisa = `<strong>${belum} peserta</strong> belum melunasi ${nama} (sisa <strong>${rupiah(r.belum)}</strong>)`
  const hari = k.tenggat ? selisihHari(k.tenggat) : null

  if (hari !== null && hari < 0) {
    return {
      id: `telat-${k.id}-${k.tenggat}-${belum}`, jenis: 'tagihan', ikon: '⏰', warna: 'orange', urgent: 'TERLAMBAT',
      judul: 'Lewat Tenggat', isi: `${sisa}. Tenggat sudah lewat ${-hari} hari.`,
      waktu: `Tenggat ${tanggal(k.tenggat)}`, aksi: { label: 'Tagih Sekarang', href: detail, utama: true },
    }
  }

  if (hari !== null && hari <= HARI_MENDESAK) {
    return {
      id: `dekat-${k.id}-${k.tenggat}-${belum}`, jenis: 'tagihan', ikon: '⏰', warna: 'orange', urgent: 'MENDESAK',
      judul: 'Tenggat Sebentar Lagi', isi: `${sisa}. Jatuh tempo ${hari === 0 ? 'hari ini' : `dalam ${hari} hari`}.`,
      waktu: `Tenggat ${tanggal(k.tenggat)}`, aksi: { label: 'Tagih Sekarang', href: detail, utama: true },
    }
  }

  return {
    id: `tunggu-${k.id}-${belum}`, jenis: 'tagihan', ikon: '💵', warna: '', judul: 'Menunggu Pembayaran',
    isi: `${sisa}.`, waktu: k.tenggat ? `Tenggat ${tanggal(k.tenggat)}` : 'Tanpa tenggat',
    aksi: { label: 'Lihat Rincian', href: detail },
  }
}

function dariAkun(user) {
  const meta = user.user_metadata ?? {}
  const hasil = []
  if (!user.email_confirmed_at) {
    hasil.push({
      id: 'verifikasi-email', jenis: 'sistem', ikon: '✉️', warna: '', judul: 'Verifikasi Email',
      isi: `Email <strong>${esc(user.email)}</strong> belum diverifikasi. Cek kotak masuk kamu.`,
      waktu: 'Akun', aksi: { label: 'Buka Akun', href: 'account.html' },
    })
  }
  if (!meta.username || !meta.phone) {
    hasil.push({
      id: 'lengkapi-profil', jenis: 'sistem', ikon: '⚙️', warna: '', judul: 'Lengkapi Profil',
      isi: 'Tambahkan ID pengguna dan nomor HP agar teman patungan mudah menghubungi kamu.',
      waktu: 'Akun', aksi: { label: 'Lengkapi', href: 'account.html' },
    })
  }
  return hasil
}

function kartu(n) {
  const baru = !dibaca.has(n.id)
  return `
    <article class="notif-card${n.warna ? ` border-${n.warna}` : ''}${baru ? '' : ' notif-read'}">
      <div class="notif-card-body">
        <div class="notif-icon-box box-${n.warna || 'gray'}">${n.ikon}</div>
        <div class="notif-main-text">
          <div class="notif-headline">
            <h3>${n.judul}</h3>
            ${baru ? '<span class="badge-dot-orange" aria-label="Belum dibaca">●</span>' : ''}
            ${n.urgent ? `<span class="tag-urgent">${n.urgent}</span>` : ''}
          </div>
          <p class="notif-desc">${n.isi}</p>
          <div class="notif-meta">${n.waktu} • ${LABEL_JENIS[n.jenis]}</div>
        </div>
        <div class="notif-action-area">
          <a class="${n.aksi.utama ? 'btn-orange-primary' : 'btn-gray-secondary'}" href="${n.aksi.href}" data-baca="${n.id}">${n.aksi.label}</a>
          ${baru ? `<button type="button" class="btn-more" data-baca="${n.id}" aria-label="Tandai dibaca" title="Tandai dibaca">✓</button>` : ''}
        </div>
      </div>
    </article>`
}

function render() {
  const tampil = notifikasi.filter((n) => filter === 'semua' || n.jenis === filter)
  const jumlahBaru = notifikasi.filter((n) => !dibaca.has(n.id)).length

  list.innerHTML = tampil.map(kartu).join('')
  empty.hidden = tampil.length > 0
  empty.textContent = notifikasi.length ? 'Tidak ada notifikasi di kategori ini.' : 'Belum ada notifikasi. Semua aman! 🎉'

  $('notif-baru').hidden = jumlahBaru === 0
  $('notif-baru').textContent = `${jumlahBaru} Baru`
  $('btn-baca-semua').disabled = jumlahBaru === 0
  $('notif-info').textContent = `Menampilkan ${tampil.length} notifikasi`

  document.querySelector('[data-count="semua"]').textContent = notifikasi.length
  for (const jenis of Object.keys(LABEL_JENIS)) {
    document.querySelector(`[data-count="${jenis}"]`).textContent = notifikasi.filter((n) => n.jenis === jenis).length
  }
}

function tandaiDibaca(ids) {
  ids.forEach((id) => dibaca.add(id))
  simpanDibaca()
  render()
}

async function main() {
  const user = await initPage()
  if (!user) return

  storageKey = `patungantrack:notif-dibaca:${user.id}`
  muatDibaca()

  pills.forEach((pill) => pill.addEventListener('click', () => {
    pills.forEach((p) => p.classList.toggle('active', p === pill))
    filter = pill.dataset.filter
    render()
  }))
  $('btn-baca-semua').addEventListener('click', () => tandaiDibaca(notifikasi.map((n) => n.id)))
  list.addEventListener('click', (e) => {
    const el = e.target.closest('[data-baca]')
    if (el) tandaiDibaca([el.dataset.baca])
  })

  const kegiatan = await ambilKegiatan()
  if (!kegiatan) return

  const urgensi = (n) => (n.urgent === 'TERLAMBAT' ? 0 : n.urgent ? 1 : 2)
  notifikasi = [...kegiatan.map(dariKegiatan), ...dariAkun(user)]
    .sort((a, b) => urgensi(a) - urgensi(b))
  render()
}

main()
