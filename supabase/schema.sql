-- supabase/schema.sql
-- Jalankan di Supabase Dashboard -> SQL Editor -> New query -> Run.

-- ========== TABEL ==========
create table if not exists groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id  uuid references auth.users(id) on delete cascade,
  primary key (group_id, user_id)
);

create table if not exists expenses (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  paid_by    uuid not null default auth.uid() references auth.users(id),
  title      text not null,
  amount     numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- ========== AKTIFKAN RLS ==========
-- Setelah ini, tanpa policy SEMUA akses ditolak.
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table expenses      enable row level security;

-- ========== FUNGSI BANTU ==========
-- "Apakah user yang sedang login anggota grup ini?"
-- security definer: dijalankan dengan hak pemilik fungsi sehingga tidak
-- memicu RLS di group_members lagi (mencegah rekursi tak berujung).
create or replace function is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- ========== POLICY: groups ==========
create policy "lihat grup sendiri" on groups for select
  using (is_group_member(id) or created_by = auth.uid());

create policy "buat grup" on groups for insert
  with check (created_by = auth.uid());

-- ========== POLICY: group_members ==========
create policy "lihat anggota grup sendiri" on group_members for select
  using (is_group_member(group_id));

-- Versi sederhana: user hanya bisa menambahkan DIRINYA SENDIRI.
-- (Pengembangan lanjutan: kode undangan.)
create policy "gabung sebagai diri sendiri" on group_members for insert
  with check (user_id = auth.uid());

-- ========== POLICY: expenses ==========
create policy "lihat pengeluaran grup sendiri" on expenses for select
  using (is_group_member(group_id));

create policy "tambah pengeluaran di grup sendiri" on expenses for insert
  with check (is_group_member(group_id) and paid_by = auth.uid());
