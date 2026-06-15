
import React, { useState, useEffect, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ViewMode, Employee, TravelAssignment, PrintType, 
  MasterCost, SubActivity, SKPDConfig, Official, TravelCost, DestinationOfficial 
} from './types';
import { EmployeeForm } from './components/EmployeeForm';
import { OfficialForm } from './components/OfficialForm';
import { TravelAssignmentForm } from './components/TravelAssignmentForm';
import { MasterDataForm } from './components/MasterDataForm';
import { SKPDForm } from './components/SKPDForm';
import { ReportView } from './components/ReportView';
import { DatabaseSetup } from './components/DatabaseSetup';
import { DestinationOfficialManager } from './components/DestinationOfficialManager';
import { DestinationOfficialForm } from './components/DestinationOfficialForm';
import { 
  SPTTemplate, 
  SPPDFrontTemplate,
  SPPDBackTemplate,
  LampiranIIITemplate,
  KuitansiTemplate, 
  DaftarPenerimaanTemplate,
  PejabatTujuanTemplate
} from './components/PrintDocuments';
import { 
  LayoutDashboard, Users, FileText, Printer, ChevronLeft, 
  Trash2, Calendar, Plus, Database, Edit2, Building2, 
  BarChart3, RefreshCw, LogOut, ShieldCheck, 
  Landmark, TrendingUp, AlertCircle, Coins, Wallet, UserSearch, AlertTriangle, UserPlus, Layers, MapPin, PlusCircle,
  Copy, Check, ExternalLink, HelpCircle
} from 'lucide-react';
// Import formatDateID to fix "Cannot find name 'formatDateID'" error
import { formatNumber, formatDateID } from './utils';
import { OFFICE_NAME, OFFICE_ADDRESS, HEAD_OF_OFFICE, TREASURER } from './constants';
import { 
  initAuth, 
  logoutGoogle, 
  pullAllDataFromGoogleSheets, 
  pushAllDataToGoogleSheets 
} from './googleSheetsService';

const SQL_SETUP_SCRIPT = `-- ==========================================
-- SCRIPT SETUP DATABASE SUPABASE (FULL SCHEMA)
-- SIPD LITE - PERJALANAN DINAS
-- ==========================================

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

CREATE TABLE IF NOT EXISTS officials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nip TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS destination_officials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nip TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    instansi TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    assignment_number TEXT NOT NULL,
    sub_activity_code TEXT NOT NULL,
    purpose TEXT NOT NULL,
    origin TEXT NOT NULL,
    travel_type TEXT NOT NULL,
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

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS destination_official_ids TEXT[];
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS ppk_id TEXT;

ALTER TABLE skpd_config ADD COLUMN IF NOT EXISTS ppk_nama TEXT;
ALTER TABLE skpd_config ADD COLUMN IF NOT EXISTS ppk_nip TEXT;

ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE officials DISABLE ROW LEVEL SECURITY;
ALTER TABLE destination_officials DISABLE ROW LEVEL SECURITY;
ALTER TABLE skpd_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';`;

const App: React.FC = () => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [dbMode, setDbMode] = useState<'supabase' | 'sheets'>('supabase');
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [googleToken, setGoogleToken] = useState<string>('');
  const [dbConfigured, setDbConfigured] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [destinationOfficials, setDestinationOfficials] = useState<DestinationOfficial[]>([]);
  const [skpdConfig, setSkpdConfig] = useState<SKPDConfig>({
    provinsi: 'Provinsi Nusa Tenggara Barat',
    namaSkpd: OFFICE_NAME,
    alamat: OFFICE_ADDRESS,
    lokasi: 'MATARAM',
    kepalaNama: HEAD_OF_OFFICE.name,
    kepalaNip: HEAD_OF_OFFICE.nip,
    kepalaJabatan: 'KEPALA DINAS',
    bendaharaNama: TREASURER.name,
    bendaharaNip: TREASURER.nip,
    pptkNama: 'Novi Haryanto, S.Adm',
    pptkNip: '197111201991031003',
    ppkNama: '',
    ppkNip: '',
    logo: undefined
  });
  const [masterCosts, setMasterCosts] = useState<MasterCost[]>([]);
  const [subActivities, setSubActivities] = useState<SubActivity[]>([]);
  const [assignments, setAssignments] = useState<TravelAssignment[]>([]);

  const [activeAssignment, setActiveAssignment] = useState<TravelAssignment | null>(null);
  const [activeDestOfficial, setActiveDestOfficial] = useState<DestinationOfficial | null>(null);
  const [targetBlockIndex, setTargetBlockIndex] = useState<number>(0); // 0:II, 1:III, 2:IV
  const [editingAssignment, setEditingAssignment] = useState<TravelAssignment | null>(null);
  const [printType, setPrintType] = useState<PrintType>(PrintType.SPT);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const [isDestManagerOpen, setIsDestManagerOpen] = useState(false);
  const [currentAssignForDest, setCurrentAssignForDest] = useState<TravelAssignment | null>(null);

  const financialStats = useMemo(() => {
    const realizationMap = (assignments || []).reduce((acc: Record<string, number>, curr: TravelAssignment) => {
      const code = curr.subActivityCode;
      const totalAssignmentCost = (curr.costs || []).reduce((sum: number, cost: TravelCost) => {
        const daily = (Number(cost.dailyAllowance) || 0) * (Number(cost.dailyDays) || 0);
        const lodging = (Number(cost.lodging) || 0) * (Number(cost.lodgingDays) || 0);
        const transport = (Number(cost.transportBbm) || 0) + (Number(cost.seaTransport) || 0) + (Number(cost.airTransport) || 0) + (Number(cost.taxi) || 0);
        const repres = (Number(cost.representation) || 0) * (Number(cost.representationDays) || 0);
        return sum + daily + lodging + transport + repres;
      }, 0);
      acc[code] = (Number(acc[code]) || 0) + Number(totalAssignmentCost);
      return acc;
    }, {} as Record<string, number>);

    // Ambil daftar tujuan unik per sub kegiatan
    const destinationMap = (assignments || []).reduce((acc: Record<string, Set<string>>, curr: TravelAssignment) => {
      const code = curr.subActivityCode;
      if (!acc[code]) acc[code] = new Set();
      acc[code].add(curr.destination);
      return acc;
    }, {} as Record<string, Set<string>>);

    const totalAnggaran = (subActivities || []).reduce((sum: number, s: SubActivity) => sum + (Number(s.anggaran) || 0), 0);
    const totalSpd = (subActivities || []).reduce((sum: number, s: SubActivity) => sum + (Number(s.spd) || 0), 0);
    const totalRealisasi = Object.values(realizationMap).reduce((sum: number, v: number) => sum + (Number(v) || 0), 0);

    const detailedStats = subActivities.map(sub => {
      const realisasi = realizationMap[sub.code] || 0;
      const spdVal = Number(sub.spd) || 0;
      const anggaranVal = Number(sub.anggaran) || 0;
      return {
        ...sub,
        realisasi,
        sisaSpd: spdVal - realisasi,
        sisaAnggaran: anggaranVal - realisasi,
        destinations: Array.from(destinationMap[sub.code] || [])
      };
    });

    return {
      totals: {
        anggaran: totalAnggaran,
        spd: totalSpd,
        realisasi: totalRealisasi,
        sisaSpd: Number(totalSpd) - Number(totalRealisasi),
        sisaAnggaran: Number(totalAnggaran) - Number(totalRealisasi)
      },
      details: detailedStats
    };
  }, [subActivities, assignments]);

  useEffect(() => {
    const savedMode = localStorage.getItem('DB_MODE') as 'supabase' | 'sheets' | null;
    const savedSheetId = localStorage.getItem('GS_SPREADSHEET_ID');

    if (savedMode === 'sheets' && savedSheetId) {
      setDbMode('sheets');
      setSpreadsheetId(savedSheetId);
      
      const unsubscribe = initAuth((user, token) => {
        setGoogleToken(token);
        setDbConfigured(true);
      }, () => {
        setLoading(false);
        setDbConfigured(false);
      });
      return () => unsubscribe();
    } else {
      setDbMode('supabase');
      let savedUrl = localStorage.getItem('SB_URL');
      let savedKey = localStorage.getItem('SB_KEY');
      const wasDisconnected = localStorage.getItem('SB_DISCONNECTED') === 'true';
      
      if (!savedUrl || !savedKey) {
        if (wasDisconnected) {
          setLoading(false);
          setDbConfigured(false);
          return;
        } else {
          savedUrl = "https://bligotrxzpisallhqzgt.supabase.co";
          savedKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWdvdHJ4enBpc2FsbGhxemd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTc1NjIsImV4cCI6MjA4NzIzMzU2Mn0.3Ny0P-S_HKFG3CXrLuwRfe4dgepzyjyhWVh2Ss_yiL0";
          localStorage.setItem('SB_URL', savedUrl);
          localStorage.setItem('SB_KEY', savedKey);
          localStorage.setItem('DB_MODE', 'supabase');
        }
      }

      if (savedUrl && savedKey) {
        const client = createClient(savedUrl, savedKey);
        setSupabase(client);
        setDbConfigured(true);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const handleConnectDb = (url: string, key: string) => {
    localStorage.setItem('SB_URL', url);
    localStorage.setItem('SB_KEY', key);
    localStorage.setItem('DB_MODE', 'supabase');
    localStorage.removeItem('SB_DISCONNECTED');
    setDbMode('supabase');
    const client = createClient(url, key);
    setSupabase(client);
    setDbConfigured(true);
    setError(null);
  };

  const handleConnectSheets = (sheetId: string, token: string) => {
    localStorage.setItem('DB_MODE', 'sheets');
    localStorage.setItem('GS_SPREADSHEET_ID', sheetId);
    localStorage.removeItem('SB_DISCONNECTED');
    setDbMode('sheets');
    setSpreadsheetId(sheetId);
    setGoogleToken(token);
    setDbConfigured(true);
    setError(null);
  };

  const handleDisconnectDb = () => {
    localStorage.removeItem('SB_URL');
    localStorage.removeItem('SB_KEY');
    localStorage.removeItem('DB_MODE');
    localStorage.removeItem('GS_SPREADSHEET_ID');
    localStorage.setItem('SB_DISCONNECTED', 'true');
    logoutGoogle().then(() => {
      window.location.reload();
    }).catch(() => {
      window.location.reload();
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    setIsInvalidApiKey(false);
    
    if (dbMode === 'sheets') {
      if (!googleToken || !spreadsheetId) {
        setLoading(false);
        return;
      }
      try {
        const data = await pullAllDataFromGoogleSheets(googleToken, spreadsheetId);
        if (data.employees) setEmployees(data.employees);
        if (data.officials) setOfficials(data.officials);
        if (data.destinationOfficials) setDestinationOfficials(data.destinationOfficials);
        if (data.skpdConfig) {
          setSkpdConfig(data.skpdConfig);
        } else {
          await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
            employees: data.employees,
            officials: data.officials,
            destinationOfficials: data.destinationOfficials,
            skpdConfig: skpdConfig,
            masterCosts: data.masterCosts,
            subActivities: data.subActivities,
            assignments: data.assignments
          });
        }
        if (data.masterCosts) setMasterCosts(data.masterCosts);
        if (data.subActivities) setSubActivities(data.subActivities);
        if (data.assignments) setAssignments(data.assignments);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Gagal memuat data dari Google Sheets. Pastikan token login Anda masih aktif.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!supabase) return;
    
    try {
      const [
        { data: empData, error: empErr }, 
        { data: offData, error: offErr }, 
        { data: destOffData, error: destErr },
        { data: skpdData, error: skpdErr }, 
        { data: costData, error: costErr }, 
        { data: subData, error: subErr }, 
        { data: assignData, error: assignErr }
      ] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('officials').select('*').order('name'),
        supabase.from('destination_officials').select('*').order('name'),
        supabase.from('skpd_config').select('*').eq('id', 'main').maybeSingle(),
        supabase.from('master_costs').select('*').order('destination'),
        supabase.from('sub_activities').select('*').order('code'),
        supabase.from('assignments').select('*').order('created_at', { ascending: false })
      ]);

      const anyErr = empErr || offErr || destErr || (skpdErr && skpdErr.code !== 'PGRST116') || costErr || subErr || assignErr;
      
      if (anyErr) {
        if (anyErr.message.toLowerCase().includes('apikey') || anyErr.message.toLowerCase().includes('invalid api key')) {
          setIsInvalidApiKey(true);
        }
        throw anyErr;
      }

      if (empData) setEmployees(empData.map(e => ({ 
        id: e.id, name: e.name, nip: e.nip, pangkatGol: e.pangkat_gol, 
        jabatan: e.jabatan, representationLuar: e.representation_luar, 
        representationDalam: e.representation_dalam 
      })));
      if (offData) setOfficials(offData);
      if (destOffData) setDestinationOfficials(destOffData);
      if (skpdData) setSkpdConfig({ 
        provinsi: skpdData.provinsi, namaSkpd: skpdData.nama_skpd, 
        alamat: skpdData.alamat, lokasi: skpdData.lokasi, 
        kepalaNama: skpdData.kepala_nama, kepalaNip: skpdData.kepala_nip, 
        kepalaJabatan: skpdData.kepala_jabatan, bendaharaNama: skpdData.bendahara_nama, 
        bendaharaNip: skpdData.bendahara_nip, pptkNama: skpdData.pptk_nama, 
        pptkNip: skpdData.pptk_nip, 
        ppkNama: skpdData.ppk_nama,
        ppkNip: skpdData.ppk_nip,
        logo: skpdData.logo 
      });
      if (costData) setMasterCosts(costData.map(c => ({ 
        destination: c.destination, dailyAllowance: Number(c.daily_allowance), 
        lodging: Number(c.lodging), transportBbm: Number(c.transport_bbm), 
        seaTransport: Number(c.sea_transport), airTransport: Number(c.air_transport), 
        taxi: Number(c.taxi) 
      })));
      if (subData) setSubActivities(subData.map(s => ({
        code: s.code,
        name: s.name,
        budgetCode: s.budget_code,
        anggaran: Number(s.anggaran || 0),
        spd: s.spd || '',
        triwulan1: Number(s.triwulan1 || 0),
        triwulan2: Number(s.triwulan2 || 0),
        triwulan3: Number(s.triwulan3 || 0),
        triwulan4: Number(s.triwulan4 || 0)
      })));
      if (assignData) setAssignments(assignData.map(a => ({ 
        ...a, selectedEmployeeIds: a.selected_employee_ids, travelType: a.travel_type, 
        assignmentNumber: a.assignment_number, subActivityCode: a.sub_activity_code, 
        startDate: a.start_date, endDate: a.end_date, durationDays: a.duration_days, 
        signerId: a.signer_id, pptkId: a.pptk_id, bendaharaId: a.bendahara_id, 
        ppkId: a.ppk_id,
        signDate: a.sign_date, signedAt: a.signed_at,
        destinationOfficialIds: a.destination_official_ids || []
      })));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data dari database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (dbConfigured) refreshData(); }, [dbConfigured, dbMode, googleToken]);

  const handleSaveAssignment = async (data: TravelAssignment) => {
    if (dbMode === 'sheets') {
      const updated = assignments.some(a => a.id === data.id)
        ? assignments.map(a => a.id === data.id ? data : a)
        : [data, ...assignments];
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments: updated
        });
        setAssignments(updated);
        setViewMode(ViewMode.TRAVEL_LIST);
      } catch (err: any) {
        alert(`Gagal menyimpan ke Google Sheets: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!supabase) return;
    // Fix: access destinationOfficialIds from data (camelCase) to save to DB (snake_case)
    const { error } = await supabase.from('assignments').upsert({
      id: data.id, assignment_number: data.assignmentNumber, sub_activity_code: data.subActivityCode, 
      purpose: data.purpose, origin: data.origin, travel_type: data.travelType, 
      transportation: data.transportation, destination: data.destination, 
      start_date: data.startDate, end_date: data.endDate, duration_days: data.durationDays, 
      selected_employee_ids: data.selectedEmployeeIds, costs: data.costs, 
      signed_at: data.signedAt, sign_date: data.signDate, pptk_id: data.pptkId, 
      signer_id: data.signerId, bendahara_id: data.bendaharaId, ppk_id: data.ppkId,
      destination_official_ids: data.destinationOfficialIds || []
    });
    if (error) alert(`Gagal menyimpan: ${error.message}`);
    else { await refreshData(); setViewMode(ViewMode.TRAVEL_LIST); }
  };

  const handleUpdateDestOfficials = async (assignId: string, destIds: string[]) => {
    if (dbMode === 'sheets') {
      const updated = assignments.map(a => a.id === assignId ? { ...a, destinationOfficialIds: destIds } : a);
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments: updated
        });
        setAssignments(updated);
      } catch (err: any) {
        alert(`Gagal menyimpan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!supabase) return;
    // Fix: Use 'destIds' parameter instead of undefined 'ids' variable
    const { error } = await supabase.from('assignments').update({ 
      destination_official_ids: destIds 
    }).eq('id', assignId);
    if (error) alert(error.message);
    else await refreshData();
  };

  const handleSaveSkpdConfig = async (cfg: SKPDConfig) => {
    if (dbMode === 'sheets') {
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig: cfg, masterCosts, subActivities, assignments
        });
        setSkpdConfig(cfg);
        alert('Berhasil menyimpan konfigurasi SKPD');
      } catch (err: any) {
        alert(`Gagal menyimpan ke Google Sheets: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('skpd_config').upsert({
        id: 'main', 
        provinsi: cfg.provinsi, 
        nama_skpd: cfg.namaSkpd, 
        alamat: cfg.alamat, 
        lokasi: cfg.lokasi, 
        kepala_nama: cfg.kepalaNama, 
        kepala_nip: cfg.kepalaNip, 
        kepala_jabatan: cfg.kepalaJabatan, 
        bendahara_nama: cfg.bendaharaNama, 
        bendahara_nip: cfg.bendaharaNip, 
        pptk_nama: cfg.pptkNama, 
        pptk_nip: cfg.pptkNip, 
        ppk_nama: cfg.ppkNama, 
        ppk_nip: cfg.ppkNip, 
        logo: cfg.logo
      });
      if (error) alert(error.message);
      else await refreshData();
    }
  };

  const handleSaveOfficial = async (o: Official) => {
    const oId = o.id || Date.now().toString();
    const target: Official = { ...o, id: oId };
    if (dbMode === 'sheets') {
      const updated = officials.some(item => item.id === oId)
        ? officials.map(item => item.id === oId ? target : item)
        : [...officials, target];
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials: updated, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments
        });
        setOfficials(updated);
      } catch (err: any) {
        alert(`Gagal menyimpan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('officials').upsert(target);
      if (error) alert(error.message);
      else await refreshData();
    }
  };

  const handleDeleteOfficial = async (id: string) => {
    if (!confirm('Hapus pejabat ini?')) return;
    if (dbMode === 'sheets') {
      const updated = officials.filter(item => item.id !== id);
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials: updated, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments
        });
        setOfficials(updated);
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('officials').delete().eq('id', id);
      if (error) alert(error.message);
      else await refreshData();
    }
  };

  const handleSaveEmployee = async (e: Employee) => {
    if (dbMode === 'sheets') {
      const updated = employees.some(item => item.id === e.id)
        ? employees.map(item => item.id === e.id ? e : item)
        : [...employees, e];
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees: updated, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments
        });
        setEmployees(updated);
      } catch (err: any) {
        alert(`Gagal menyimpan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('employees').upsert({
        id: e.id,
        name: e.name,
        nip: e.nip,
        pangkat_gol: e.pangkatGol,
        jabatan: e.jabatan,
        representation_luar: e.representationLuar,
        representation_dalam: e.representationDalam
      });
      if (error) alert(error.message);
      else await refreshData();
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Hapus pegawai ini?')) return;
    if (dbMode === 'sheets') {
      const updated = employees.filter(item => item.id !== id);
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees: updated, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments
        });
        setEmployees(updated);
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) alert(error.message);
      else await refreshData();
    }
  };

  const handleSaveDestinationOfficial = async (o: DestinationOfficial) => {
    const oId = o.id || Date.now().toString();
    const target: DestinationOfficial = { ...o, id: oId };
    if (dbMode === 'sheets') {
      const updated = destinationOfficials.some(item => item.id === oId)
        ? destinationOfficials.map(item => item.id === oId ? target : item)
        : [...destinationOfficials, target];
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials: updated, skpdConfig, masterCosts, subActivities, assignments
        });
        setDestinationOfficials(updated);
      } catch (err: any) {
        alert(`Gagal menyimpan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('destination_officials').upsert(target);
      if (error) alert(error.message); else await refreshData();
    }
  };

  const handleDeleteDestinationOfficial = async (id: string) => {
    if (!confirm('Hapus data pejabat ini?')) return;
    if (dbMode === 'sheets') {
      const updated = destinationOfficials.filter(item => item.id !== id);
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials: updated, skpdConfig, masterCosts, subActivities, assignments
        });
        setDestinationOfficials(updated);
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('destination_officials').delete().eq('id', id);
      if (error) alert(error.message); else await refreshData();
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Anda yakin ingin menghapus data ini?')) return;
    if (dbMode === 'sheets') {
      const updated = assignments.filter(item => item.id !== id);
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments: updated
        });
        setAssignments(updated);
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      await supabase.from('assignments').delete().eq('id', id);
      await refreshData();
    }
  };

  const handleSaveMasterCost = async (c: MasterCost) => {
    if (dbMode === 'sheets') {
      const updated = masterCosts.some(item => item.destination === c.destination)
        ? masterCosts.map(item => item.destination === c.destination ? c : item)
        : [...masterCosts, c];
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts: updated, subActivities, assignments
        });
        setMasterCosts(updated);
      } catch (err: any) {
        alert(`Gagal menyimpan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      await supabase.from('master_costs').upsert({
        destination: c.destination,
        daily_allowance: c.dailyAllowance,
        lodging: c.lodging,
        transport_bbm: c.transportBbm,
        sea_transport: c.seaTransport,
        air_transport: c.airTransport,
        taxi: c.taxi
      });
      await refreshData();
    }
  };

  const handleDeleteMasterCost = async (dest: string) => {
    if (dbMode === 'sheets') {
      const updated = masterCosts.filter(item => item.destination !== dest);
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts: updated, subActivities, assignments
        });
        setMasterCosts(updated);
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      await supabase.from('master_costs').delete().eq('destination', dest);
      await refreshData();
    }
  };

  const handleClearMasterCosts = async () => {
    if (!confirm('Hapus semua rincian biaya master?')) return;
    if (dbMode === 'sheets') {
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts: [], subActivities, assignments
        });
        setMasterCosts([]);
      } catch (err: any) {
        alert(`Gagal mengosongkan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      await supabase.from('master_costs').delete().neq('destination', '___');
      await refreshData();
    }
  };

  const handleSaveSubActivity = async (s: SubActivity) => {
    if (dbMode === 'sheets') {
      const updated = subActivities.some(item => item.code === s.code)
        ? subActivities.map(item => item.code === s.code ? s : item)
        : [...subActivities, s];
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities: updated, assignments
        });
        setSubActivities(updated);
      } catch (err: any) {
        alert(`Gagal menyimpan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('sub_activities').upsert({
        code: s.code,
        name: s.name,
        budget_code: s.budgetCode || '',
        anggaran: s.anggaran || 0,
        spd: s.spd || '0',
        triwulan1: s.triwulan1 || 0,
        triwulan2: s.triwulan2 || 0,
        triwulan3: s.triwulan3 || 0,
        triwulan4: s.triwulan4 || 0
      });
      if (error) alert(`Gagal Simpan: ${error.message}`);
      else await refreshData();
    }
  };

  const handleDeleteSubActivity = async (code: string) => {
    const hasAssignments = assignments.some(a => a.subActivityCode === code);
    if (hasAssignments) {
      alert('Gagal Hapus: Sub Kegiatan ini sedang digunakan dalam riwayat SPT. Hapus SPT terkait terlebih dahulu.');
      return;
    }
    if (dbMode === 'sheets') {
      const updated = subActivities.filter(item => item.code !== code);
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities: updated, assignments
        });
        setSubActivities(updated);
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('sub_activities').delete().eq('code', code);
      if (error) alert(`Gagal Hapus: ${error.message}`);
      else await refreshData();
    }
  };

  const handleClearSubActivities = async () => {
    if (!confirm('Hapus semua sub kegiatan?')) return;
    if (dbMode === 'sheets') {
      try {
        setLoading(true);
        await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
          employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities: [], assignments
        });
        setSubActivities([]);
      } catch (err: any) {
        alert(`Gagal mengosongkan: ${err.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (supabase) {
      await supabase.from('sub_activities').delete().neq('code', '___');
      await refreshData();
    }
  };

  if (!dbConfigured && !loading) return <DatabaseSetup onConnect={handleConnectDb} onConnectSheets={handleConnectSheets} />;
  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col"><RefreshCw className="animate-spin text-blue-400 mb-4" size={48} /><h2 className="font-black text-xl tracking-widest italic">MENGHUBUNGKAN...</h2></div>;
  
  if (error) {
    const handleCopySql = () => {
      navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    };

    const isRelationErr = error.toLowerCase().includes('relation') || error.toLowerCase().includes('does not exist') || error.toLowerCase().includes('42p01');
    const isFetchErr = error.toLowerCase().includes('failed to fetch') || error.toLowerCase().includes('networkerror') || error.toLowerCase().includes('fetch failed');

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 font-sans">
        <div className="max-w-3xl w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-6 md:p-10 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/5">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Koneksi Database Gagal</h2>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1">
                  Status: <span className="text-red-500">{isFetchErr ? 'Koneksi Offline / Database Paused' : 'Koneksi Bermasalah'}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-2.5 w-full md:w-auto justify-center">
              <button onClick={refreshData} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition shadow-lg shadow-blue-900/30">
                <RefreshCw size={14} /> Hubungkan Ulang
              </button>
              <button onClick={handleDisconnectDb} className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl font-bold uppercase text-xs border border-slate-700 transition">
                Ganti Kunci / URL
              </button>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-900/30 rounded-2xl p-4 mb-8">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-red-950/20">
              <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Pesan Kesalahan Asli (Raw Error):</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(error);
                  alert('Pesan kesalahan berhasil disalin!');
                }}
                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-2 py-1 rounded transition flex items-center gap-1"
              >
                <Copy size={10} /> Salin Error
              </button>
            </div>
            <p className="font-mono text-xs text-red-300/90 break-all leading-relaxed bg-black/30 p-3 rounded-xl border border-red-950/50">
              {error}
            </p>
            {isFetchErr && (
              <div className="mt-3 text-xs text-amber-400 font-bold bg-amber-505/10 border border-amber-900/20 p-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle size={14} className="flex-none" />
                <span>Mendeteksi masalah koneksi browser! Layanan Supabase Anda tidak dapat dihubungi. Ikuti panduan di bawah ini.</span>
              </div>
            )}
          </div>

          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <HelpCircle size={16} className="text-blue-500" /> Panduan Penyelesaian Masalah (Troubleshooting):
          </h3>

          <div className="space-y-4">
            {/* Penyebab 1: Database Ditangguhkan */}
            <div className={`p-4 rounded-2xl border transition-all ${isFetchErr ? 'bg-amber-950/20 border-amber-900/40 shadow-lg shadow-amber-950/10' : 'bg-slate-800/60 border-slate-700'}`}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-xs font-black">1</span>
                  Project Supabase Anda Ditangguhkan (Paused) - <span className="text-red-400">KEMUNGKINAN BESAR</span>
                </h4>
                {isFetchErr && (
                  <span className="bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded inline-flex items-center gap-1 text-[10px] font-black tracking-widest uppercase">
                    <AlertCircle size={10} /> Terdeteksi!
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs leading-relaxed pl-7 mt-2">
                Project Supabase gratisan (Free Tier) otomatis ditangguhkan setelah 7 hari tidak aktif. Jika ini terjadi, browser Anda akan menghasilkan error <code className="text-amber-400 bg-amber-950/30 px-1 rounded font-mono">Failed to fetch</code>.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed pl-7 mt-1 font-bold text-slate-300">
                Cara mengaktifkan kembali:
              </p>
              <ul className="list-disc pl-12 text-slate-400 text-xs space-y-1 mt-1">
                <li>Buka dashboard Supabase.</li>
                <li>Temukan proyek Anda yang bernama <span className="text-teal-400 font-mono">bligotrxzpisallhqzgt</span>.</li>
                <li>Klik tombol <strong className="text-emerald-400">Restore Project</strong> atau <strong className="text-emerald-400">Restore</strong> pada proyek tersebut.</li>
                <li>Tunggu 1-2 menit hingga status proyek kembali aktif (Active), kemudian klik tombol <strong className="text-blue-400">Hubungkan Ulang</strong> di atas.</li>
              </ul>
              <div className="mt-3 pl-7">
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition"
                >
                  Buka Dashboard Supabase <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Penyebab 3: Adblocker memblokir Supabase */}
            <div className={`p-4 rounded-2xl border transition-all ${isFetchErr ? 'bg-amber-950/10 border-amber-900/20' : 'bg-slate-800/60 border-slate-700'}`}>
              <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
                <span className="w-5 h-5 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-xs font-black">2</span>
                Koneksi Diblokir oleh Ekstensi Browser / Adblocker / Ekstensi VPN
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed pl-7">
                Beberapa ekstensi Adblocker (seperti uBlock Origin, Adblock Plus), beberapa DNS pribadi, atau VPN, memblokir request ke domain <code className="text-blue-400 bg-blue-950/30 px-1 rounded font-mono">*.supabase.co</code> karena dianggap sebagai pelacak. Coba matikan Adblocker Anda pada tab ini atau jalankan di tab mode Incognito (Penyamaran), lalu coba hubungkan ulang.
              </p>
            </div>

            {/* Penyebab 4: URL / Key Salah */}
            <div className="p-4 bg-slate-800/60 border border-slate-750 rounded-2xl">
              <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
                <span className="w-5 h-5 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-xs font-black">3</span>
                URL Supabase atau Anon Key Tidak Sesuai
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed pl-7">
                Pastikan Anda menggunakan <strong>Project URL</strong> yang benar (diawali dengan <code className="text-indigo-400 bg-indigo-950/30 px-1 rounded font-mono">https://...</code>) dan menyalin <strong>anon public key</strong> (bukan service_role key). Jika ragu, klik tombol <code className="text-red-400 font-bold bg-red-950/30 px-1 rounded text-[11px]">Ganti Kunci / URL</code> di atas untuk memasukkan ulang kredensial baru.
              </p>
            </div>

            {/* Penyebab 2: Tabel SQL Belum Dibuat */}
            <div className={`p-4 rounded-2xl border transition-all ${isRelationErr ? 'bg-amber-950/20 border-amber-900/40 shadow-lg shadow-amber-950/10' : 'bg-slate-800/30 border-slate-800'}`}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="w-5 h-5 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-xs font-black">4</span>
                  Tabel Database Belum Dibuat / Kosong (Hanya dijalankan setelah koneksi sukses)
                </h4>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed pl-7 mt-2">
                Jika koneksi sudah sukses namun tabel masih kosong, salin script SQL penuh di bawah ini dan jalankan di menu <strong>SQL Editor</strong> database Anda.
              </p>
              
              <div className="mt-4 pl-7 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={handleCopySql} 
                    className={`font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md ${
                      copiedSql 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                    {copiedSql ? 'Berhasil Disalin!' : 'Salin Script SQL Lengkap'}
                  </button>
                </div>
                
                <div className="bg-black/40 border border-slate-850 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-slate-500">
                  <pre>{SQL_SETUP_SCRIPT}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === ViewMode.PRINT_PREVIEW && (activeAssignment || activeDestOfficial)) {
    // Logic khusus Pejabat Luar dari Master Data
    const dummyAssignment: TravelAssignment | null = activeDestOfficial ? {
      id: 'dummy',
      assignmentNumber: '..................',
      destination: '..................',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      destinationOfficialIds: Array(3).fill('').map((_, i) => i === targetBlockIndex ? activeDestOfficial.id : ''),
      selectedEmployeeIds: [],
      costs: [],
      origin: '',
      purpose: '',
      subActivityCode: '',
      transportation: '',
      travelType: 'DALAM_DAERAH',
      durationDays: 0,
      signDate: new Date().toISOString().split('T')[0],
      signedAt: ''
    } : null;

    const props = { 
      assignment: activeAssignment || dummyAssignment!, 
      employees, 
      skpd: skpdConfig, 
      officials, 
      destinationOfficials: activeDestOfficial ? [activeDestOfficial] : destinationOfficials,
      subActivities
    };

    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="no-print bg-white border-b p-4 sticky top-0 flex items-center justify-between z-50 shadow-sm">
          <button onClick={() => setViewMode(activeDestOfficial ? ViewMode.DESTINATION_OFFICIAL_LIST : ViewMode.PRINT_MENU)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-blue-600 transition"><ChevronLeft size={20} /> Kembali</button>
          
          <div className="flex items-center gap-6">
            {activeDestOfficial && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-1"><Layers size={14}/> Pilih Posisi:</span>
                {[0, 1, 2].map((idx) => (
                  <button 
                    key={idx}
                    onClick={() => setTargetBlockIndex(idx)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${targetBlockIndex === idx ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-white hover:text-blue-600'}`}
                  >
                    Bagian {idx === 0 ? 'II' : idx === 1 ? 'III' : 'IV'}
                  </button>
                ))}
              </div>
            )}
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-black uppercase text-slate-400">Preview: {printType}</span>
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition"><Printer size={18} /> Cetak</button>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-12 flex justify-center">
          {printType === PrintType.SPT && <SPTTemplate {...props} />}
          {printType === PrintType.SPPD_FRONT && <SPPDFrontTemplate {...props} />}
          {printType === PrintType.SPPD_BACK && <SPPDBackTemplate {...props} />}
          {printType === PrintType.LAMPIRAN_III && <LampiranIIITemplate {...props} />}
          {printType === PrintType.KUITANSI && <KuitansiTemplate {...props} />}
          {printType === PrintType.DAFTAR_PENERIMAAN && <DaftarPenerimaanTemplate {...props} />}
          {printType === PrintType.PEJABAT_TUJUAN && <PejabatTujuanTemplate {...props} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-800 pb-6"><div className="bg-blue-600 p-2.5 rounded-xl"><FileText size={24} /></div><div><h1 className="text-xl font-black italic">SIPD<span className="text-blue-500">LITE</span></h1><p className="text-[10px] font-bold text-slate-500 uppercase">Perjalanan Dinas</p></div></div>
        <nav className="space-y-1">
          {[
            { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
            { id: ViewMode.SKPD_CONFIG, label: 'Profil SKPD', icon: Building2 },
            { id: ViewMode.EMPLOYEE_LIST, label: 'Data Pegawai', icon: Users },
            { id: ViewMode.OFFICIAL_LIST, label: 'Pejabat Internal', icon: ShieldCheck },
            { id: ViewMode.DESTINATION_OFFICIAL_LIST, label: 'Pejabat Luar', icon: UserPlus },
            { id: ViewMode.TRAVEL_LIST, label: 'Riwayat SPT', icon: Calendar },
            { id: ViewMode.MASTER_DATA, label: 'Data Master', icon: Database },
            { id: ViewMode.REPORT, label: 'Laporan', icon: BarChart3 },
            { id: ViewMode.PRINT_MENU, label: 'Pencetakan', icon: Printer },
          ].map(item => (<button key={item.id} onClick={() => setViewMode(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${viewMode === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800'}`}><item.icon size={18} /> {item.label}</button>))}
          <div className="pt-8 mt-8 border-t border-slate-800"><button onClick={() => { if(confirm('Putus koneksi database?')) handleDisconnectDb(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/10"><LogOut size={16} /> Putus Database</button></div>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{viewMode.replace('_', ' ')}</h2><p className="text-slate-500 text-[10px] font-bold uppercase mt-1 flex items-center gap-1"><Building2 size={12} /> {skpdConfig.namaSkpd}</p></div>
          <div className="flex flex-wrap items-center gap-3">
            {dbMode === 'sheets' ? (
              <div className="flex flex-wrap items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Spreadsheet Terhubung</span>
                </div>
                
                <div className="h-4 w-px bg-emerald-200 mx-1"></div>

                <button 
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await refreshData();
                      setSyncStatus({ type: 'success', message: 'Berhasil menarik data terbaru dari Google Sheets!' });
                      setTimeout(() => setSyncStatus({ type: null, message: '' }), 5000);
                    } catch (err: any) {
                      setSyncStatus({ type: 'error', message: err.message || 'Gagal menarik data' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  title="Tarik seluruh data dari Google Spreadsheet Anda untuk menyamakan data di aplikasi"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  Tarik Data Sheets
                </button>

                <button 
                  onClick={async () => {
                    if (!confirm('Apakah Anda yakin ingin mengirim semua data lokal saat ini ke Google Sheets? Ini akan menggantikan isi spreadsheet.')) return;
                    try {
                      setLoading(true);
                      await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
                        employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments
                      });
                      setSyncStatus({ type: 'success', message: 'Berhasil mengirim dan memperbarui data di Google Sheets!' });
                      setTimeout(() => setSyncStatus({ type: null, message: '' }), 5000);
                    } catch (err: any) {
                      setSyncStatus({ type: 'error', message: err.message || 'Gagal mengirim data' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="bg-white hover:bg-slate-100 text-emerald-750 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  title="Kirim dan perbarui data aplikasi saat ini ke Google Spreadsheet"
                >
                  <Database size={12} />
                  Kirim Data ke Sheets
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Supabase Terhubung</span>
                </div>
                <div className="h-4 w-px bg-blue-205 mx-1"></div>
                <button 
                  onClick={refreshData}
                  disabled={loading}
                  className="text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  Segarkan
                </button>
              </div>
            )}
          </div>
        </header>

        {syncStatus.type && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-top-4 duration-300 ${
            syncStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                syncStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-650'
              }`}>
                {syncStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              </span>
              <p className="text-xs font-bold">{syncStatus.message}</p>
            </div>
            <button 
              onClick={() => setSyncStatus({ type: null, message: '' })}
              className="text-[10px] font-black uppercase tracking-wider hover:opacity-80 px-2 py-1 rounded"
            >
              Tutup
            </button>
          </div>
        )}

        {viewMode === ViewMode.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"><Landmark className="text-blue-600 mb-3" size={20} /><div className="text-lg font-black text-slate-800 leading-tight">Rp {formatNumber(financialStats.totals.anggaran)}</div><div className="text-slate-400 text-[9px] font-black uppercase mt-1 tracking-wider">Total Anggaran</div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"><TrendingUp className="text-emerald-600 mb-3" size={20} /><div className="text-lg font-black text-slate-800 leading-tight">Rp {formatNumber(financialStats.totals.spd)}</div><div className="text-slate-400 text-[9px] font-black uppercase mt-1 tracking-wider">SPD Akumulasi</div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"><Coins className="text-indigo-600 mb-3" size={20} /><div className="text-lg font-black text-indigo-700 leading-tight">Rp {formatNumber(financialStats.totals.realisasi)}</div><div className="text-slate-400 text-[9px] font-black uppercase mt-1 tracking-wider">Total Realisasi</div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"><Wallet className="text-amber-600 mb-3" size={20} /><div className="text-lg font-black text-amber-600 leading-tight">Rp {formatNumber(financialStats.totals.sisaSpd)}</div><div className="text-slate-400 text-[9px] font-black uppercase mt-1 tracking-wider">Sisa SPD</div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"><AlertCircle className="text-rose-600 mb-3" size={20} /><div className="text-lg font-black text-rose-600 leading-tight">Rp {formatNumber(financialStats.totals.sisaAnggaran)}</div><div className="text-slate-400 text-[9px] font-black uppercase mt-1 tracking-wider">Sisa Anggaran</div></div>
            </div>

            {/* Tabel Realisasi Per Sub Kegiatan */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-blue-600" size={20} />
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Informasi Realisasi Per Sub Kegiatan</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 w-12">No</th>
                      <th className="px-6 py-4">Sub Kegiatan</th>
                      <th className="px-6 py-4 text-right">Anggaran</th>
                      <th className="px-6 py-4 text-right">SPD</th>
                      <th className="px-6 py-4 text-right">Realisasi</th>
                      <th className="px-6 py-4 text-right">Sisa SPD</th>
                      <th className="px-6 py-4 text-right">Sisa Anggaran</th>
                      <th className="px-6 py-4">Daerah Tujuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financialStats.details.map((sub, idx) => (
                      <tr key={sub.code} className="hover:bg-slate-50 transition group">
                        <td className="px-6 py-5 text-[10px] font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-5">
                          <div className="text-[10px] font-mono font-black text-blue-600">{sub.code}</div>
                          <div className="text-xs font-bold text-slate-800 uppercase tracking-tight line-clamp-1">{sub.name}</div>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-slate-700 text-xs">Rp {formatNumber(sub.anggaran)}</td>
                        <td className="px-6 py-5 text-right font-bold text-emerald-600 text-xs">Rp {formatNumber(Number(sub.spd) || 0)}</td>
                        <td className="px-6 py-5 text-right font-black text-indigo-600 text-xs">Rp {formatNumber(sub.realisasi)}</td>
                        <td className="px-6 py-5 text-right font-bold text-amber-600 text-xs">Rp {formatNumber(sub.sisaSpd)}</td>
                        <td className="px-6 py-5 text-right font-bold text-rose-600 text-xs">Rp {formatNumber(sub.sisaAnggaran)}</td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-1">
                            {sub.destinations.length > 0 ? (
                              sub.destinations.map(dest => (
                                <span key={dest} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-tighter">
                                  <MapPin size={8} /> {dest}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-300 italic">Belum ada perjalanan</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {financialStats.details.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic text-sm">Belum ada data sub kegiatan tersedia.</td>
                      </tr>
                    )}
                  </tbody>
                  {financialStats.details.length > 0 && (
                    <tfoot className="bg-slate-50/80 font-black border-t-2 border-slate-100">
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-xs uppercase text-slate-500">Total Akumulasi</td>
                        <td className="px-6 py-4 text-right text-xs text-slate-800">Rp {formatNumber(financialStats.totals.anggaran)}</td>
                        <td className="px-6 py-4 text-right text-xs text-emerald-700">Rp {formatNumber(financialStats.totals.spd)}</td>
                        <td className="px-6 py-4 text-right text-xs text-indigo-700">Rp {formatNumber(financialStats.totals.realisasi)}</td>
                        <td className="px-6 py-4 text-right text-xs text-amber-700">Rp {formatNumber(financialStats.totals.sisaSpd)}</td>
                        <td className="px-6 py-4 text-right text-xs text-rose-700">Rp {formatNumber(financialStats.totals.sisaAnggaran)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        { viewMode === ViewMode.SKPD_CONFIG && <SKPDForm config={skpdConfig} onSave={handleSaveSkpdConfig} /> }
        {viewMode === ViewMode.OFFICIAL_LIST && <OfficialForm officials={officials} onSave={handleSaveOfficial} onDelete={handleDeleteOfficial} />}
        {viewMode === ViewMode.EMPLOYEE_LIST && <EmployeeForm employees={employees} onSave={handleSaveEmployee} onDelete={handleDeleteEmployee} />}
        
        {viewMode === ViewMode.DESTINATION_OFFICIAL_LIST && (
          <DestinationOfficialForm 
            officials={destinationOfficials} 
            onSave={handleSaveDestinationOfficial} 
            onDelete={handleDeleteDestinationOfficial}
            onPrint={(off) => {
              setActiveDestOfficial(off);
              setTargetBlockIndex(0); // Reset ke Bagian II
              setActiveAssignment(null);
              setPrintType(PrintType.PEJABAT_TUJUAN);
              setViewMode(ViewMode.PRINT_PREVIEW);
            }}
          />
        )}

        {viewMode === ViewMode.TRAVEL_LIST && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600" size={24} />
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Daftar Riwayat SPT</h3>
              </div>
              <button 
                onClick={() => { setEditingAssignment(null); setViewMode(ViewMode.ADD_TRAVEL); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                <PlusCircle size={18} /> Tambah SPT Baru
              </button>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5">Nomor & Tanggal</th>
                    <th className="px-6 py-5">Tujuan</th>
                    <th className="px-6 py-5">Maksud Perjalanan</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-5">
                        <div className="font-black text-sm text-slate-800">{a.assignmentNumber}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{formatDateID(a.startDate)}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-tight">
                          {a.destination}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs text-slate-600 font-medium line-clamp-1 italic">{a.purpose}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setCurrentAssignForDest(a); setIsDestManagerOpen(true); }}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                            title="Atur Pejabat Tujuan"
                          >
                            <UserSearch size={16}/>
                          </button>
                          <button 
                            onClick={() => { setEditingAssignment(a); setViewMode(ViewMode.ADD_TRAVEL); }} 
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Edit SPT"
                          >
                            <Edit2 size={16}/>
                          </button>
                          <button 
                            onClick={() => handleDeleteAssignment(a.id)} 
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"
                            title="Hapus SPT"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">Belum ada riwayat SPT. Klik tombol di atas untuk membuat.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isDestManagerOpen && currentAssignForDest && (
          <DestinationOfficialManager 
            officials={destinationOfficials}
            selectedIds={currentAssignForDest.destinationOfficialIds || []}
            onSaveSelection={(ids) => {
              handleUpdateDestOfficials(currentAssignForDest.id, ids);
              setIsDestManagerOpen(false);
            }}
            onSaveMaster={handleSaveDestinationOfficial}
            onDeleteMaster={handleDeleteDestinationOfficial}
            onClose={() => setIsDestManagerOpen(false)}
          />
        )}

        {viewMode === ViewMode.ADD_TRAVEL && <TravelAssignmentForm employees={employees} masterCosts={masterCosts} subActivities={subActivities} officials={officials} initialData={editingAssignment || undefined} onSave={handleSaveAssignment} onCancel={() => setViewMode(ViewMode.TRAVEL_LIST)} />}
        {viewMode === ViewMode.MASTER_DATA && (
          <MasterDataForm 
            masterCosts={masterCosts} 
            subActivities={subActivities} 
            onSaveCost={handleSaveMasterCost} 
            onDeleteCost={handleDeleteMasterCost} 
            onClearCosts={handleClearMasterCosts} 
            onSaveSub={handleSaveSubActivity} 
            onDeleteSub={handleDeleteSubActivity} 
            onClearSubs={handleClearSubActivities} 
            dbMode={dbMode}
            onPullSheets={refreshData}
            onPushSheets={async () => {
              await pushAllDataToGoogleSheets(googleToken, spreadsheetId, {
                employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments
              });
            }}
            spreadsheetId={spreadsheetId}
          />
        )}
        
        {viewMode === ViewMode.REPORT && (
          <ReportView 
            employees={employees} 
            assignments={assignments} 
            onOpenDestManager={(a) => {
              setCurrentAssignForDest(a);
              setIsDestManagerOpen(true);
            }}
          />
        )}

        {viewMode === ViewMode.PRINT_MENU && (
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b flex items-center bg-slate-50/50"><Printer size={20} className="text-blue-600 mr-2" /><h3 className="font-black text-slate-800 text-xs uppercase">Daftar SPT Siap Cetak</h3></div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black border-b border-slate-100"><tr><th className="px-6 py-4">Nomor & Tujuan</th><th className="px-6 py-4 text-right">Opsi Cetak</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {assignments.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50 transition">
                       <td className="px-6 py-5"><div className="font-bold text-slate-800 text-xs">{item.assignmentNumber}</div><div className="text-[10px] text-slate-400 font-medium italic">{item.destination}</div></td>
                       <td className="px-6 py-5 text-right">
                         <div className="flex gap-2 flex-wrap justify-end">
                           {[
                             { label: 'SPT', type: PrintType.SPT, color: 'blue' },
                             { label: 'SPD DPN', type: PrintType.SPPD_FRONT, color: 'emerald' },
                             { label: 'SPD BLK', type: PrintType.SPPD_BACK, color: 'emerald' },
                             { label: 'KUITANSI', type: PrintType.KUITANSI, color: 'amber' },
                             { label: 'RINCIAN', type: PrintType.LAMPIRAN_III, color: 'purple' },
                             { label: 'TERIMA', type: PrintType.DAFTAR_PENERIMAAN, color: 'rose' }
                           ].map(btn => (<button key={btn.type} onClick={() => { setActiveDestOfficial(null); setActiveAssignment(item); setPrintType(btn.type as PrintType); setViewMode(ViewMode.PRINT_PREVIEW); }} className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${btn.color === 'blue' ? 'text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white' : btn.color === 'emerald' ? 'text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-600 hover:text-white' : btn.color === 'amber' ? 'text-amber-600 border-amber-100 bg-amber-50 hover:bg-amber-600 hover:text-white' : btn.color === 'purple' ? 'text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-600 hover:text-white' : btn.color === 'rose' ? 'text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white' : 'text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-600 hover:text-white'}`}>{btn.label}</button>))}
                         </div>
                       </td>
                     </tr>
                   ))}
                   {assignments.length === 0 && (<tr><td colSpan={2} className="px-6 py-12 text-center text-slate-400 italic">Belum ada SPT untuk dicetak.</td></tr>)}
                 </tbody>
               </table>
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
