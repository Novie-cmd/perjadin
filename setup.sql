
-- Tambahkan kolom baru ke tabel assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS destination_official_ids TEXT[];
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS ppk_id TEXT;

-- Tambahkan kolom baru ke tabel skpd_config
ALTER TABLE skpd_config ADD COLUMN IF NOT EXISTS ppk_nama TEXT;
ALTER TABLE skpd_config ADD COLUMN IF NOT EXISTS ppk_nip TEXT;

-- Update policy agar kolom baru bisa diakses (opsional karena policy ALL biasanya mencakup kolom baru)
NOTIFY pgrst, 'reload schema';
