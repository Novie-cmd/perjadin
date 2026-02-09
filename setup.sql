
-- Jalankan script ini di SQL Editor Supabase Anda
-- Perintah ini aman dijalankan berulang kali

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

CREATE TABLE IF NOT EXISTS officials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  role TEXT, -- 'KEPALA', 'PPTK', 'BENDAHARA'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS destination_officials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  instansi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS sub_activities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  budget_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  assignment_number TEXT,
  sub_activity_code TEXT,
  purpose TEXT,
  origin TEXT,
  travel_type TEXT, -- 'DALAM_DAERAH', 'LUAR_DAERAH'
  transportation TEXT,
  destination TEXT,
  start_date TEXT,
  end_date TEXT,
  duration_days INTEGER,
  selected_employee_ids TEXT[], -- Array of strings
  costs JSONB, -- Storing the costs array as JSON
  signed_at TEXT,
  sign_date TEXT,
  pptk_id TEXT,
  signer_id TEXT,
  bendahara_id TEXT,
  destination_official_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) jika diperlukan, atau buat policy sederhana:
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON employees FOR ALL USING (true);
