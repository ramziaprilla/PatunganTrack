-- Kolom tambahan untuk form "Buat Patungan". Jalankan setelah 0001.
-- Aman dijalankan ulang.

alter table public.kegiatan
  add column if not exists kategori text,
  add column if not exists deskripsi text,
  add column if not exists tenggat date;
