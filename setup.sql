
-- 1. Tambahkan kolom destination_official_ids jika belum ada
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS destination_official_ids TEXT[] DEFAULT '{}';

-- 2. Pastikan kolom pendukung lainnya ada (untuk jaga-jaga)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS transportation TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS selected_employee_ids TEXT[];

-- 3. SEGARKAN CACHE SKEMA (WAJIB)
-- Ini memberitahu Supabase untuk mendeteksi perubahan kolom baru
NOTIFY pgrst, 'reload schema';
