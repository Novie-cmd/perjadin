
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ViewMode, Employee, TravelAssignment, PrintType, MasterCost, SubActivity, SKPDConfig, Official, DestinationOfficial } from './types';
import { EmployeeForm } from './components/EmployeeForm';
import { TravelAssignmentForm } from './components/TravelAssignmentForm';
import { MasterDataForm } from './components/MasterDataForm';
import { SKPDForm } from './components/SKPDForm';
import { ReportView } from './components/ReportView';
import { DestinationOfficialManager } from './components/DestinationOfficialManager';
import { 
  SPTTemplate, 
  SPPDFrontTemplate,
  SPPDBackTemplate,
  LampiranIIITemplate,
  KuitansiTemplate, 
  DaftarPenerimaanTemplate 
} from './components/PrintDocuments';
import { 
  LayoutDashboard, Users, FileText, Printer, ChevronLeft, Trash2, Calendar, Plus, Database, Edit2, Building2, BarChart3, UserCheck, UserCog, MapPin, PieChart, Activity, RefreshCw, Cloud, AlertCircle, HardDrive
} from 'lucide-react';
import { formatDateID } from './utils';
import { INITIAL_SUB_ACTIVITIES, HEAD_OF_OFFICE, TREASURER, OFFICE_NAME, OFFICE_ADDRESS, OFFICE_LOCATION, LIST_KOTA_NTB } from './constants';

// Akses variabel lingkungan secara aman
const getEnv = (key: string) => {
  try {
    return (window as any).process?.env?.[key] || (import.meta as any).env?.[`VITE_${key}`] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Inisialisasi Supabase hanya jika kunci tersedia
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [destinationOfficials, setDestinationOfficials] = useState<DestinationOfficial[]>([]);
  const [skpdConfig, setSkpdConfig] = useState<SKPDConfig>({
    provinsi: 'Provinsi Nusa Tenggara Barat',
    namaSkpd: OFFICE_NAME,
    alamat: OFFICE_ADDRESS,
    lokasi: 'MATARAM - NUSA TENGGARA BARAT',
    kepalaNama: HEAD_OF_OFFICE.name,
    kepalaNip: HEAD_OF_OFFICE.nip,
    kepalaJabatan: 'KEPALA DINAS',
    bendaharaNama: TREASURER.name,
    bendaharaNip: TREASURER.nip,
    pptkNama: 'Novi Haryanto, S.Adm',
    pptkNip: '197111201991031003'
  });
  const [masterCosts, setMasterCosts] = useState<MasterCost[]>([]);
  const [subActivities, setSubActivities] = useState<SubActivity[]>([]);
  const [assignments, setAssignments] = useState<TravelAssignment[]>([]);

  const [activeAssignment, setActiveAssignment] = useState<TravelAssignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<TravelAssignment | null>(null);
  const [printType, setPrintType] = useState<PrintType>(PrintType.SPT);
  const [showDestManager, setShowDestManager] = useState<string | null>(null);

  const refreshData = async () => {
    if (!supabase) {
      setError("Konfigurasi Database (SUPABASE_URL / KEY) belum diatur di Vercel.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        { data: empData, error: empErr },
        { data: offData },
        { data: destOffData },
        { data: skpdData },
        { data: costData },
        { data: subData },
        { data: assignData }
      ] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('officials').select('*'),
        supabase.from('destination_officials').select('*'),
        supabase.from('skpd_config').select('*').eq('id', 'main').maybeSingle(),
        supabase.from('master_costs').select('*').order('destination'),
        supabase.from('sub_activities').select('*').order('code'),
        supabase.from('assignments').select('*').order('created_at', { ascending: false })
      ]);

      if (empErr) throw empErr;

      if (empData) setEmployees(empData.map(e => ({
        id: e.id, name: e.name, nip: e.nip, pangkatGol: e.pangkat_gol, jabatan: e.jabatan,
        representationLuar: e.representation_luar, representationDalam: e.representation_dalam
      })));
      
      if (offData) setOfficials(offData);
      if (destOffData) setDestinationOfficials(destOffData);
      
      if (skpdData) setSkpdConfig({
        provinsi: skpdData.provinsi,
        namaSkpd: skpdData.nama_skpd,
        alamat: skpdData.alamat,
        lokasi: skpdData.lokasi,
        kepalaNama: skpdData.kepala_nama,
        kepalaNip: skpdData.kepala_nip,
        kepalaJabatan: skpdData.kepala_jabatan,
        bendaharaNama: skpdData.bendahara_nama,
        bendaharaNip: skpdData.bendahara_nip,
        pptkNama: skpdData.pptk_nama,
        pptkNip: skpdData.pptk_nip,
        logo: skpdData.logo
      });

      if (costData) setMasterCosts(costData.map(c => ({
        destination: c.destination,
        dailyAllowance: c.daily_allowance,
        lodging: c.lodging,
        transportBbm: c.transport_bbm,
        seaTransport: c.sea_transport,
        airTransport: c.air_transport,
        taxi: c.taxi
      })));

      if (subData) setSubActivities(subData);

      if (assignData) setAssignments(assignData.map(a => ({
        id: a.id,
        assignmentNumber: a.assignment_number,
        subActivityCode: a.sub_activity_code,
        purpose: a.purpose,
        origin: a.origin,
        travelType: a.travel_type,
        transportation: a.transportation,
        destination: a.destination,
        startDate: a.start_date,
        endDate: a.end_date,
        durationDays: a.duration_days,
        selectedEmployeeIds: a.selected_employee_ids,
        costs: a.costs,
        signedAt: a.signed_at,
        signDate: a.sign_date,
        pptkId: a.pptk_id,
        signerId: a.signer_id,
        bendaharaId: a.bendahara_id,
        destinationOfficialId: a.destination_official_id
      })));

      setError(null);
    } catch (err: any) {
      console.error("Database Error:", err);
      setError("Gagal terhubung ke Tabel Supabase. Pastikan tabel 'employees', 'assignments', dll sudah dibuat di SQL Editor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const saveEmployee = async (emp: Employee) => {
    if (!supabase) return;
    const dbData = {
      id: emp.id, name: emp.name, nip: emp.nip, pangkat_gol: emp.pangkatGol, jabatan: emp.jabatan,
      representation_luar: emp.representationLuar, representation_dalam: emp.representationDalam
    };
    await supabase.from('employees').upsert(dbData);
    await refreshData();
  };

  const deleteEmployee = async (id: string) => {
    if (!supabase) return;
    if (confirm('Hapus pegawai ini secara permanen dari Cloud?')) {
      await supabase.from('employees').delete().eq('id', id);
      await refreshData();
    }
  };

  const saveAssignment = async (data: TravelAssignment) => {
    if (!supabase) return;
    const dbData = {
      id: data.id, assignment_number: data.assignmentNumber, sub_activity_code: data.subActivityCode,
      purpose: data.purpose, origin: data.origin, travel_type: data.travelType, transportation: data.transportation,
      destination: data.destination, start_date: data.startDate, end_date: data.endDate, duration_days: data.durationDays,
      selected_employee_ids: data.selectedEmployeeIds, costs: data.costs, signed_at: data.signedAt, sign_date: data.signDate,
      pptk_id: data.pptkId, signer_id: data.signerId, bendahara_id: data.bendaharaId, destination_official_id: data.destinationOfficialId
    };
    await supabase.from('assignments').upsert(dbData);
    await refreshData();
    setEditingAssignment(null);
    setViewMode(ViewMode.TRAVEL_LIST);
  };

  const deleteAssignment = async (id: string) => {
    if (!supabase) return;
    if (confirm('Hapus riwayat perjalanan ini?')) {
      await supabase.from('assignments').delete().eq('id', id);
      await refreshData();
    }
  };

  const handleSaveSkpd = async (newConfig: SKPDConfig) => {
    if (!supabase) return;
    const dbData = {
      id: 'main', provinsi: newConfig.provinsi, nama_skpd: newConfig.namaSkpd, alamat: newConfig.alamat,
      lokasi: newConfig.lokasi, kepala_nama: newConfig.kepalaNama, kepala_nip: newConfig.kepalaNip,
      kepala_jabatan: newConfig.kepalaJabatan, bendahara_nama: newConfig.bendaharaNama,
      bendahara_nip: newConfig.bendaharaNip, pptk_nama: newConfig.pptkNama, pptk_nip: newConfig.pptkNip, logo: newConfig.logo
    };
    await supabase.from('skpd_config').upsert(dbData);
    await refreshData();
    alert("Profil SKPD Berhasil Disimpan!");
  };

  const updateAssignmentDestOfficial = async (assignmentId: string, destOfficialId: string) => {
    if (!supabase) return;
    await supabase.from('assignments').update({ destination_official_id: destOfficialId }).eq('id', assignmentId);
    await refreshData();
  };

  const saveDestinationOfficial = async (official: DestinationOfficial) => {
    if (!supabase) return;
    await supabase.from('destination_officials').upsert(official);
    await refreshData();
  };

  const deleteDestinationOfficial = async (id: string) => {
    if (!supabase) return;
    await supabase.from('destination_officials').delete().eq('id', id);
    await refreshData();
  };

  const saveMasterCosts = async (costs: MasterCost[]) => {
    if (!supabase) return;
    for (const c of costs) {
      await supabase.from('master_costs').upsert({
        destination: c.destination, daily_allowance: c.dailyAllowance, lodging: c.lodging,
        transport_bbm: c.transportBbm, sea_transport: c.seaTransport, air_transport: c.airTransport, taxi: c.taxi
      });
    }
    await refreshData();
  };

  const saveSubActivities = async (subs: SubActivity[]) => {
    if (!supabase) return;
    for (const s of subs) {
      await supabase.from('sub_activities').upsert({ code: s.code, name: s.name });
    }
    await refreshData();
  };

  const dashboardStats = useMemo(() => {
    const total = assignments.length;
    const dalamDaerah = assignments.filter(a => a.travelType === 'DALAM_DAERAH').length;
    const luarDaerah = assignments.filter(a => a.travelType === 'LUAR_DAERAH').length;
    const ntbCounts = LIST_KOTA_NTB.map(city => ({
      name: city,
      count: assignments.filter(a => a.travelType === 'DALAM_DAERAH' && a.destination === city).length
    })).sort((a, b) => b.count - a.count);
    return {
      total, dalamDaerah, luarDaerah, ntbCounts,
      dalamDaerahPct: total ? Math.round((dalamDaerah / total) * 100) : 0,
      luarDaerahPct: total ? Math.round((luarDaerah / total) * 100) : 0
    };
  }, [assignments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <RefreshCw className="animate-spin mb-4 text-blue-500" size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest text-center">Menghubungkan ke Cloud...</h2>
        <p className="text-slate-400 text-sm mt-2 text-center">Sedang sinkronisasi data {OFFICE_NAME}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-slate-800 uppercase mb-4">Masalah Koneksi Database</h2>
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 text-left max-w-xl mb-8">
           <p className="text-red-600 font-bold mb-4">{error}</p>
           <h3 className="font-black text-slate-800 uppercase text-xs mb-3 flex items-center gap-2"><HardDrive size={16}/> Langkah Perbaikan:</h3>
           <ol className="text-xs text-slate-500 list-decimal pl-4 space-y-3 font-medium uppercase tracking-wider">
              <li>Pastikan Tabel sudah dibuat di **Supabase SQL Editor** menggunakan script yang diberikan.</li>
              <li>Pastikan **SUPABASE_URL** & **SUPABASE_ANON_KEY** sudah benar di Vercel Settings.</li>
              <li>Jika baru saja memasukkan variabel di Vercel, lakukan **Redeploy** atau tunggu 1-2 menit.</li>
           </ol>
        </div>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition active:scale-95">Refresh Aplikasi</button>
      </div>
    );
  }

  if (viewMode === ViewMode.PRINT_PREVIEW && activeAssignment) {
    const props = { assignment: activeAssignment, employees, skpd: skpdConfig, officials, destinationOfficials };
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="no-print bg-white border-b p-4 sticky top-0 flex items-center justify-between z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode(ViewMode.PRINT_MENU)} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
            <h2 className="font-bold text-gray-800 uppercase tracking-tight">Cetak - {printType}</h2>
          </div>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition"><Printer size={18} /> Cetak Sekarang</button>
        </div>
        <div className="p-4 sm:p-8 flex justify-center">
          {printType === PrintType.SPT && <SPTTemplate {...props} />}
          {printType === PrintType.SPPD_FRONT && <SPPDFrontTemplate {...props} />}
          {printType === PrintType.SPPD_BACK && <SPPDBackTemplate assignment={activeAssignment} skpd={skpdConfig} officials={officials} destinationOfficials={destinationOfficials} />}
          {printType === PrintType.LAMPIRAN_III && <LampiranIIITemplate {...props} />}
          {printType === PrintType.KUITANSI && <KuitansiTemplate {...props} />}
          {printType === PrintType.DAFTAR_PENERIMAAN && <DaftarPenerimaanTemplate {...props} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex-shrink-0 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><FileText size={24} /></div>
          <h1 className="text-xl font-black tracking-tight italic">SIPD<span className="text-blue-500">CLOUD</span></h1>
        </div>
        <nav className="space-y-2 flex-1">
          {[
            { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
            { id: ViewMode.SKPD_CONFIG, label: 'Profil SKPD', icon: Building2 },
            { id: ViewMode.EMPLOYEE_LIST, label: 'Data Pegawai', icon: Users },
            { id: ViewMode.TRAVEL_LIST, label: 'Riwayat SPT', icon: Calendar },
            { id: ViewMode.MASTER_DATA, label: 'Data Master', icon: Database },
            { id: ViewMode.REPORT, label: 'Laporan', icon: BarChart3 },
            { id: ViewMode.PRINT_MENU, label: 'Pencetakan', icon: Printer },
          ].map(item => (
            <button key={item.id} onClick={() => setViewMode(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${viewMode === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-black' : 'text-slate-400 hover:bg-slate-800 font-bold'}`}>
              <item.icon size={20} /><span className="text-[11px] uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-8">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-1"><Cloud size={10}/> Cloud Connected</span>
             </div>
             <p className="text-[9px] text-slate-500 leading-tight font-bold uppercase italic">Sistem tersinkronisasi otomatis.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {viewMode === ViewMode.DASHBOARD ? 'Dashboard Analytics' : 
               viewMode === ViewMode.SKPD_CONFIG ? 'Profil Kantor' : 
               viewMode === ViewMode.EMPLOYEE_LIST ? 'Data Pegawai' : 
               viewMode === ViewMode.MASTER_DATA ? 'Konfigurasi Biaya' :
               viewMode === ViewMode.PRINT_MENU ? 'Cetak Dokumen' :
               viewMode === ViewMode.TRAVEL_LIST ? 'Administrasi SPT' :
               viewMode === ViewMode.ADD_TRAVEL ? 'Form Perjalanan' :
               viewMode === ViewMode.REPORT ? 'Rekap Pegawai' :
               'Aplikasi SIPD'}
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
              {skpdConfig.namaSkpd}
            </p>
          </div>
          <button onClick={refreshData} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition shadow-sm" title="Refresh Cloud Data">
            <RefreshCw size={20} />
          </button>
        </header>

        {viewMode === ViewMode.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{employees.length}</div>
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Pegawai Aktif</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Calendar size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{assignments.length}</div>
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Total SPT Dibuat</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><MapPin size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{masterCosts.length}</div>
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Titik Destinasi</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4"><Activity size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{dashboardStats.dalamDaerahPct}%</div>
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Rasio Lokal</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <PieChart className="text-blue-600" size={24} />
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Cakupan Wilayah Dinas</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Dalam Daerah NTB</span>
                      <span className="text-lg font-black text-blue-600">{dashboardStats.dalamDaerahPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${dashboardStats.dalamDaerahPct}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Luar Daerah NTB</span>
                      <span className="text-lg font-black text-emerald-600">{dashboardStats.luarDaerahPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${dashboardStats.luarDaerahPct}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <MapPin className="text-red-500" size={24} />
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Kab/Kota Terpopuler</h3>
                </div>
                <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                  {dashboardStats.ntbCounts.slice(0, 5).map((city, idx) => {
                    const maxCount = Math.max(...dashboardStats.ntbCounts.map(c => c.count)) || 1;
                    if (city.count === 0) return null;
                    return (
                      <div key={city.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{city.name}</span>
                          <span className="text-xs font-black text-slate-800">{city.count}x</span>
                        </div>
                        <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-red-500' : 'bg-slate-300'}`} style={{ width: `${(city.count / maxCount) * 100}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {assignments.length === 0 && <p className="text-center text-[10px] text-slate-300 italic font-black uppercase py-10">Belum ada data perjalanan</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === ViewMode.SKPD_CONFIG && <SKPDForm config={skpdConfig} onSave={handleSaveSkpd} />}
        {viewMode === ViewMode.EMPLOYEE_LIST && <EmployeeForm employees={employees} onSave={saveEmployee} onDelete={deleteEmployee} />}
        {viewMode === ViewMode.TRAVEL_LIST && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Daftar Surat Tugas</h3>
              <button onClick={() => { setEditingAssignment(null); setViewMode(ViewMode.ADD_TRAVEL); }} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95">
                <Plus size={16} /> Buat SPT Baru
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
                  <tr><th className="px-6 py-4">Nomor & Maksud Dinas</th><th className="px-6 py-4">Destinasi</th><th className="px-6 py-4 text-right">Kelola</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.length === 0 ? (
                    <tr><td colSpan={3} className="p-20 text-center text-slate-300 italic font-black uppercase tracking-widest">Database SPT Masih Kosong</td></tr>
                  ) : (
                    assignments.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition group">
                        <td className="px-6 py-4">
                          <div className="text-[10px] font-black text-blue-600 uppercase mb-0.5">{item.assignmentNumber}</div>
                          <div className="text-xs font-bold text-slate-800 uppercase max-w-lg truncate">{item.purpose}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-slate-600 uppercase">{item.destination}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => {setEditingAssignment(item); setViewMode(ViewMode.ADD_TRAVEL);}} className="text-blue-400 p-2 hover:bg-blue-50 rounded-lg transition"><Edit2 size={18}/></button>
                            <button onClick={() => deleteAssignment(item.id)} className="text-red-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === ViewMode.MASTER_DATA && (
          <MasterDataForm 
            masterCosts={masterCosts} 
            onSaveCosts={saveMasterCosts} 
            subActivities={subActivities} 
            onSaveSubs={saveSubActivities}
            onReset={() => { if(confirm("Hapus seluruh data di Cloud?")) supabase?.rpc('truncate_all_tables'); }}
          />
        )}

        {viewMode === ViewMode.PRINT_MENU && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-lg uppercase">Dokumen Siap Cetak</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Pilih dokumen yang ingin dicetak sesuai kebutuhan administrasi</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Maksud Perjalanan</th>
                    <th className="px-6 py-4">Pejabat Tujuan</th>
                    <th className="px-6 py-4">Panel Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(item => {
                    const destOff = destinationOfficials.find(o => o.id === item.destinationOfficialId);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-black text-xs uppercase text-slate-800 max-w-xs truncate">{item.purpose}</div>
                          <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">{item.assignmentNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          {destOff ? (
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-[10px] font-black text-slate-700 uppercase">{destOff.name}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase">{destOff.jabatan}</div>
                              </div>
                              <button onClick={() => setShowDestManager(item.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><UserCog size={16}/></button>
                            </div>
                          ) : (
                            <button onClick={() => setShowDestManager(item.id)} className="text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-200 hover:bg-amber-100 transition">Set TTD Tujuan</button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'SPT', type: PrintType.SPT },
                              { label: 'SPD (D)', type: PrintType.SPPD_FRONT },
                              { label: 'SPD (B)', type: PrintType.SPPD_BACK },
                              { label: 'Kuitansi', type: PrintType.KUITANSI },
                              { label: 'Rincian', type: PrintType.LAMPIRAN_III },
                              { label: 'Daftar', type: PrintType.DAFTAR_PENERIMAAN }
                            ].map(btn => (
                              <button key={btn.type} onClick={() => { setActiveAssignment(item); setPrintType(btn.type); setViewMode(ViewMode.PRINT_PREVIEW); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition shadow-sm bg-white">{btn.label}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {assignments.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-slate-300 italic uppercase font-black text-xs">Belum ada SPT untuk dicetak</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === ViewMode.REPORT && <ReportView employees={employees} assignments={assignments} />}
        {viewMode === ViewMode.ADD_TRAVEL && (
          <TravelAssignmentForm 
            employees={employees} masterCosts={masterCosts} subActivities={subActivities} officials={officials} 
            initialData={editingAssignment || undefined} onSave={saveAssignment} 
            onCancel={() => setViewMode(ViewMode.TRAVEL_LIST)} 
          />
        )}
      </main>

      {showDestManager && (
        <DestinationOfficialManager 
          officials={destinationOfficials}
          selectedId={assignments.find(a => a.id === showDestManager)?.destinationOfficialId}
          onSelect={(id) => updateAssignmentDestOfficial(showDestManager, id)}
          onSave={saveDestinationOfficial}
          onDelete={deleteDestinationOfficial}
          onClose={() => setShowDestManager(null)}
        />
      )}
    </div>
  );
};

export default App;
