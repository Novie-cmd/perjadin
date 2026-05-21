-- ==========================================
-- SCRIPT SETUP DATABASE SUPABASE (FULL SCHEMA)
-- SIPD LITE - PERJALANAN DINAS
-- ==========================================
-- Jalankan seluruh perintah di bawah ini di SQL Editor Supabase Anda.

-- 1. Tabel Karyawan/Pegawai (employees)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nip TEXT NOT NULL,
    pangkat_gol TEXT,
    jabatan TEXT,
    representation_luar NUMERIC DEFAULT 0,
    representation_dalam NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Pejabat Internal penanda tangan dokumen (officials)
CREATE TABLE IF NOT EXISTS officials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nip TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    role TEXT NOT NULL, -- 'KEPALA' | 'PLH_KEPALA' | 'PPTK' | 'BENDAHARA' | 'PPK'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Pejabat Luar / Instansi Tujuan (destination_officials)
CREATE TABLE IF NOT EXISTS destination_officials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nip TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    instansi TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Konfigurasi SKPD (skpd_config)
CREATE TABLE IF NOT EXISTS skpd_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    provinsi TEXT,
    nama_skpd TEXT NOT NULL,
    alamat TEXT NOT NULL,
    lokasi TEXT NOT NULL,
    kepala_nama TEXT NOT NULL,
    kepala_nip TEXT NOT NULL,
    kepala_jabatan TEXT NOT NULL,
    bendahara_nama TEXT NOT NULL,
    bendahara_nip TEXT NOT NULL,
    pptk_nama TEXT NOT NULL,
    pptk_nip TEXT NOT NULL,
    ppk_nama TEXT,
    ppk_nip TEXT,
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Daftar Biaya Master / Wilayah Tujuan (master_costs)
CREATE TABLE IF NOT EXISTS master_costs (
    destination TEXT PRIMARY KEY,
    daily_allowance NUMERIC DEFAULT 0,
    lodging NUMERIC DEFAULT 0,
    transport_bbm NUMERIC DEFAULT 0,
    sea_transport NUMERIC DEFAULT 0,
    air_transport NUMERIC DEFAULT 0,
    taxi NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Sub Kegiatan Anggaran (sub_activities)
CREATE TABLE IF NOT EXISTS sub_activities (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    budget_code TEXT,
    anggaran NUMERIC DEFAULT 0,
    spd TEXT DEFAULT '0',
    triwulan1 NUMERIC DEFAULT 0,
    triwulan2 NUMERIC DEFAULT 0,
    triwulan3 NUMERIC DEFAULT 0,
    triwulan4 NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Riwayat SPT (assignments)
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    assignment_number TEXT NOT NULL,
    sub_activity_code TEXT NOT NULL,
    purpose TEXT NOT NULL,
    origin TEXT NOT NULL,
    travel_type TEXT NOT NULL, -- 'DALAM_DAERAH' | 'LUAR_DAERAH'
    transportation TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    selected_employee_ids TEXT[] NOT NULL,
    costs JSONB NOT NULL,
    signed_at TEXT NOT NULL,
    sign_date TEXT NOT NULL,
    pptk_id TEXT,
    signer_id TEXT,
    bendahara_id TEXT,
    ppk_id TEXT,
    destination_official_ids TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- MIGRASI / PENAMBAHAN KOLOM TAMBAHAN UNTUK DATABASE LAMA
-- ========================================================
-- Memastikan database lama juga mendapatkan update struktur terbaru

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS destination_official_ids TEXT[];
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS ppk_id TEXT;

ALTER TABLE skpd_config ADD COLUMN IF NOT EXISTS ppk_nama TEXT;
ALTER TABLE skpd_config ADD COLUMN IF NOT EXISTS ppk_nip TEXT;

-- ========================================================
-- KONFIGURASI KEAMANAN / ROW LEVEL SECURITY (RLS)
-- ========================================================
-- Menonaktifkan RLS agar aplikasi client-side bisa membaca/menulis data dengan Anon Key
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE officials DISABLE ROW LEVEL SECURITY;
ALTER TABLE destination_officials DISABLE ROW LEVEL SECURITY;
ALTER TABLE skpd_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

-- Reload skema PostgREST agar Supabase langsung mengenali perubahan
NOTIFY pgrst, 'reload schema';
