
-- 1. TABEL PEGAWAI
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  pangkat_gol TEXT,
  jabatan TEXT,
  representation_luar NUMERIC DEFAULT 0,
  representation_dalam NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PEJABAT INTERNAL
CREATE TABLE IF NOT EXISTS officials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  role TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PEJABAT TUJUAN
CREATE TABLE IF NOT EXISTS destination_officials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  instansi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL KONFIGURASI SKPD
CREATE TABLE IF NOT EXISTS skpd_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  provinsi TEXT,
  nama_skpd TEXT,
  alamat TEXT,
  lokasi TEXT,
  kepala_nama TEXT,
  kepala_nip TEXT,
  kepala_jabatan TEXT,
  bendahara_nama TEXT,
  bendahara_nip TEXT,
  pptk_nama TEXT,
  pptk_nip TEXT,
  logo TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL MASTER BIAYA
CREATE TABLE IF NOT EXISTS master_costs (
  destination TEXT PRIMARY KEY,
  daily_allowance NUMERIC DEFAULT 0,
  lodging NUMERIC DEFAULT 0,
  transport_bbm NUMERIC DEFAULT 0,
  sea_transport NUMERIC DEFAULT 0,
  air_transport NUMERIC DEFAULT 0,
  taxi NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL SUB KEGIATAN
CREATE TABLE IF NOT EXISTS sub_activities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  budget_code TEXT,
  anggaran NUMERIC DEFAULT 0,
  spd TEXT,
  triwulan1 NUMERIC DEFAULT 0,
  triwulan2 NUMERIC DEFAULT 0,
  triwulan3 NUMERIC DEFAULT 0,
  triwulan4 NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL ASSIGNMENTS (SPT/SPPD)
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  assignment_number TEXT,
  sub_activity_code TEXT,
  purpose TEXT,
  origin TEXT,
  travel_type TEXT,
  transportation TEXT,
  destination TEXT,
  start_date TEXT,
  end_date TEXT,
  duration_days INTEGER,
  selected_employee_ids TEXT[], 
  costs JSONB, 
  signed_at TEXT,
  sign_date TEXT,
  pptk_id TEXT,
  signer_id TEXT,
  bendahara_id TEXT,
  destination_official_ids TEXT[], -- Menggunakan Array TEXT[] untuk mendukung multiple pejabat
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AKTIFKAN RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE skpd_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Migrasi jika kolom lama masih ada
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='destination_official_id') THEN
    ALTER TABLE assignments RENAME COLUMN destination_official_id TO destination_official_ids_old;
  END IF;
END $$;

-- Pastikan kolom destination_official_ids ada dengan tipe array
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS destination_official_ids TEXT[];

-- Sinkronisasi kolom sub_activities
ALTER TABLE sub_activities ADD COLUMN IF NOT EXISTS anggaran NUMERIC DEFAULT 0;
ALTER TABLE sub_activities ADD COLUMN IF NOT EXISTS triwulan1 NUMERIC DEFAULT 0;
ALTER TABLE sub_activities ADD COLUMN IF NOT EXISTS triwulan2 NUMERIC DEFAULT 0;
ALTER TABLE sub_activities ADD COLUMN IF NOT EXISTS triwulan3 NUMERIC DEFAULT 0;
ALTER TABLE sub_activities ADD COLUMN IF NOT EXISTS triwulan4 NUMERIC DEFAULT 0;
ALTER TABLE sub_activities ADD COLUMN IF NOT EXISTS spd TEXT;
ALTER TABLE sub_activities ADD COLUMN IF NOT EXISTS budget_code TEXT;

-- Policy Akses Publik
DROP POLICY IF EXISTS "Akses Publik Pegawai" ON employees;
CREATE POLICY "Akses Publik Pegawai" ON employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik Pejabat" ON officials;
CREATE POLICY "Akses Publik Pejabat" ON officials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik Pejabat Tujuan" ON destination_officials;
CREATE POLICY "Akses Publik Pejabat Tujuan" ON destination_officials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik SKPD" ON skpd_config;
CREATE POLICY "Akses Publik SKPD" ON skpd_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik Biaya" ON master_costs;
CREATE POLICY "Akses Publik Biaya" ON master_costs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik Sub Kegiatan" ON sub_activities;
CREATE POLICY "Akses Publik Sub Kegiatan" ON sub_activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik SPT" ON assignments;
CREATE POLICY "Akses Publik SPT" ON assignments FOR ALL USING (true) WITH CHECK (true);

-- Paksa refresh schema cache
NOTIFY pgrst, 'reload schema';
