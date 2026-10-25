-- =========================================================
-- PatunganTrack - SETUP DATABASE (jalankan di Supabase > SQL Editor)
-- Isi: tabel, RLS, GRANT, dan view ringkasan.
-- Aman dijalankan ulang (idempotent) dan TIDAK menghapus data.
-- =========================================================


-- =========================================================
-- 1. TABEL
-- =========================================================

-- ---------- Tabel kegiatan (induk) ----------
create table if not exists public.kegiatan (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nama_kegiatan text not null check (char_length(trim(nama_kegiatan)) > 0),
  total_biaya numeric(14,2) not null default 0 check (total_biaya >= 0),
  -- Otomatis terisi UUID pengguna yang sedang login lewat API
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade
);

create index if not exists idx_kegiatan_user_id on public.kegiatan (user_id);

-- ---------- Tabel peserta (anak) ----------
create table if not exists public.peserta (
  id bigint generated always as identity primary key,
  kegiatan_id bigint not null references public.kegiatan (id) on delete cascade,
  nama_peserta text not null check (char_length(trim(nama_peserta)) > 0),
  nominal_tagihan numeric(14,2) not null default 0 check (nominal_tagihan >= 0),
  status_lunas boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_peserta_kegiatan_id on public.peserta (kegiatan_id);


-- =========================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =========================================================

alter table public.kegiatan enable row level security;
alter table public.peserta enable row level security;

-- ---------- Policy kegiatan ----------
drop policy if exists "kegiatan: pemilik kelola data sendiri" on public.kegiatan;
create policy "kegiatan: pemilik kelola data sendiri"
  on public.kegiatan for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- Policy peserta ----------
drop policy if exists "peserta: pemilik kegiatan kelola peserta" on public.peserta;
create policy "peserta: pemilik kegiatan kelola peserta"
  on public.peserta for all
  to authenticated
  using (
    kegiatan_id in (
      select id from public.kegiatan where user_id = (select auth.uid())
    )
  )
  with check (
    kegiatan_id in (
      select id from public.kegiatan where user_id = (select auth.uid())
    )
  );


-- =========================================================
-- 3. GRANT (wajib sejak kebijakan baru Data API Supabase)
-- Tanpa GRANT, frontend kena error "permission denied" (42501)
-- walaupun RLS sudah benar.
-- =========================================================

-- Role anon (belum login) tidak boleh mengakses apa pun
revoke all on public.kegiatan from anon;
revoke all on public.peserta from anon;

-- Pengguna yang sudah login boleh CRUD (barisnya dibatasi oleh RLS)
grant select, insert, update, delete on public.kegiatan to authenticated;
grant select, insert, update, delete on public.peserta to authenticated;

-- Kolom id memakai identity, jadi tidak perlu grant sequence terpisah.


-- =========================================================
-- 4. VIEW RINGKASAN (opsional, untuk dashboard)
-- security_invoker = true agar RLS tetap berlaku pada view.
-- Tanpa itu, view berjalan dengan hak pemilik dan bisa
-- membocorkan data semua pengguna.
-- =========================================================

create or replace view public.v_kegiatan_ringkasan
with (security_invoker = true) as
select
  k.id,
  k.nama_kegiatan,
  k.total_biaya,
  k.created_at,
  count(p.id) as jumlah_peserta,
  coalesce(sum(p.nominal_tagihan), 0) as total_tagihan,
  coalesce(sum(p.nominal_tagihan) filter (where p.status_lunas), 0) as total_terbayar,
  k.total_biaya - coalesce(sum(p.nominal_tagihan) filter (where p.status_lunas), 0) as sisa_belum_terbayar
from public.kegiatan k
left join public.peserta p on p.kegiatan_id = k.id
group by k.id;

revoke all on public.v_kegiatan_ringkasan from anon;
grant select on public.v_kegiatan_ringkasan to authenticated;
