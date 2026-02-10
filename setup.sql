
-- Jalankan script ini di SQL Editor Supabase Anda
-- Perintah ini akan membuat tabel dan memberikan izin akses penuh bagi pemegang API Key Anon

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
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Izin Akses Penuh Pegawai" ON employees;
CREATE POLICY "Izin Akses Penuh Pegawai" ON employees FOR ALL USING (true) WITH CHECK (true);

-- 2. TABEL PEJABAT INTERNAL
CREATE TABLE IF NOT EXISTS officials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  role TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Izin Akses Penuh Pejabat" ON officials;
CREATE POLICY "Izin Akses Penuh Pejabat" ON officials FOR ALL USING (true) WITH CHECK (true);

-- 3. TABEL PEJABAT TUJUAN
CREATE TABLE IF NOT EXISTS destination_officials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  instansi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE destination_officials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Izin Akses Penuh Pejabat Tujuan" ON destination_officials;
CREATE POLICY "Izin Akses Penuh Pejabat Tujuan" ON destination_officials FOR ALL USING (true) WITH CHECK (true);

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
ALTER TABLE skpd_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Izin Akses Penuh SKPD" ON skpd_config;
CREATE POLICY "Izin Akses Penuh SKPD" ON skpd_config FOR ALL USING (true) WITH CHECK (true);

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
ALTER TABLE master_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Izin Akses Penuh Biaya" ON master_costs;
CREATE POLICY "Izin Akses Penuh Biaya" ON master_costs FOR ALL USING (true) WITH CHECK (true);

-- 6. TABEL SUB KEGIATAN
CREATE TABLE IF NOT EXISTS sub_activities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  budget_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sub_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Izin Akses Penuh Sub Kegiatan" ON sub_activities;
CREATE POLICY "Izin Akses Penuh Sub Kegiatan" ON sub_activities FOR ALL USING (true) WITH CHECK (true);

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
  destination_official_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Izin Akses Penuh SPT" ON assignments;
CREATE POLICY "Izin Akses Penuh SPT" ON assignments FOR ALL USING (true) WITH CHECK (true);
