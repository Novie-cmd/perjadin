
-- Jalankan ini di SQL Editor Supabase Anda
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS destination_official_ids TEXT[];

-- Refresh schema cache agar kolom terdeteksi oleh API
NOTIFY pgrst, 'reload schema';
