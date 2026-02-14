
-- Tambahkan kolom baru ke tabel assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS destination_official_ids TEXT[];

-- Update policy agar kolom baru bisa diakses (opsional karena policy ALL biasanya mencakup kolom baru)
NOTIFY pgrst, 'reload schema';
