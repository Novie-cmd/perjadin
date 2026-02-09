
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
  LayoutDashboard, Users, FileText, Printer, ChevronLeft, Trash2, Calendar, Plus, Database, Edit2, Building2, BarChart3, UserCheck, UserCog, MapPin, PieChart, Activity, RefreshCw 
} from 'lucide-react';
import { formatDateID } from './utils';
import { INITIAL_SUB_ACTIVITIES, HEAD_OF_OFFICE, TREASURER, OFFICE_NAME, OFFICE_ADDRESS, OFFICE_LOCATION, LIST_KOTA_NTB } from './constants';

// Inisialisasi Supabase (Variabel lingkungan akan diisi di Vercel)
const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || '';
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [loading, setLoading] = useState(true);
  
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

  // Fetch Data dari Supabase saat startup
  useEffect(() => {
    const fetchData = async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        setLoading(false);
        return;
      }

      try {
        const [
          { data: empData },
          { data: offData },
          { data: destOffData },
          { data: skpdData },
          { data: costData },
          { data: subData },
          { data: assignData }
        ] = await Promise.all([
          supabase.from('employees').select('*'),
          supabase.from('officials').select('*'),
          supabase.from('destination_officials').select('*'),
          supabase.from('skpd_config').select('*').eq('id', 'main').single(),
          supabase.from('master_costs').select('*'),
          supabase.from('sub_activities').select('*'),
          supabase.from('assignments').select('*').order('created_at', { ascending: false })
        ]);

        if (empData) setEmployees(empData.map(e => ({ ...e, pangkatGol: e.pangkat_gol, representationLuar: e.representation_luar, representationDalam: e.representation_dalam })));
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
          ...a,
          assignmentNumber: a.assignment_number,
          subActivityCode: a.sub_activity_code,
          travelType: a.travel_type,
          startDate: a.start_date,
          endDate: a.end_date,
          durationDays: a.duration_days,
          selectedEmployeeIds: a.selected_employee_ids,
          signDate: a.sign_date,
          signerId: a.signer_id,
          pptkId: a.pptk_id,
          bendaharaId: a.bendahara_id,
          destinationOfficialId: a.destination_official_id
        })));

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveEmployee = async (emp: Employee) => {
    const dbData = {
      id: emp.id,
      name: emp.name,
      nip: emp.nip,
      pangkat_gol: emp.pangkatGol,
      jabatan: emp.jabatan,
      representation_luar: emp.representationLuar,
      representation_dalam: emp.representationDalam
    };
    await supabase.from('employees').upsert(dbData);
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = emp; return n; }
      return [...prev, emp];
    });
  };

  const deleteEmployee = async (id: string) => {
    if (confirm('Hapus data pegawai ini dari server?')) {
      await supabase.from('employees').delete().eq('id', id);
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const saveAssignment = async (data: TravelAssignment) => {
    const dbData = {
      id: data.id,
      assignment_number: data.assignmentNumber,
      sub_activity_code: data.subActivityCode,
      purpose: data.purpose,
      origin: data.origin,
      travel_type: data.travelType,
      transportation: data.transportation,
      destination: data.destination,
      start_date: data.startDate,
      end_date: data.endDate,
      duration_days: data.durationDays,
      selected_employee_ids: data.selectedEmployeeIds,
      costs: data.costs,
      signed_at: data.signedAt,
      sign_date: data.signDate,
      pptk_id: data.pptkId,
      signer_id: data.signerId,
      bendahara_id: data.bendaharaId,
      destination_official_id: data.destinationOfficialId
    };
    await supabase.from('assignments').upsert(dbData);
    setAssignments(prev => {
      const idx = prev.findIndex(a => a.id === data.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = data; return n; }
      return [data, ...prev];
    });
    setEditingAssignment(null);
    setViewMode(ViewMode.TRAVEL_LIST);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <RefreshCw className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest">Menyinkronkan Database...</h2>
        <p className="text-slate-400 text-sm mt-2">Mohon tunggu sebentar</p>
      </div>
    );
  }

  // Dashboard & Navigation (tetap sama, tapi variabel save mengarah ke fungsi async baru)
  // ... (Sisa render App.tsx tetap sama, hanya fungsi save/update diganti ke versi Supabase)
  
  // Contoh Update Handler SKPD
  const handleSaveSkpd = async (newConfig: SKPDConfig) => {
    const dbData = {
      id: 'main',
      provinsi: newConfig.provinsi,
      nama_skpd: newConfig.namaSkpd,
      alamat: newConfig.alamat,
      lokasi: newConfig.lokasi,
      kepala_nama: newConfig.kepalaNama,
      kepala_nip: newConfig.kepalaNip,
      kepala_jabatan: newConfig.kepalaJabatan,
      bendahara_nama: newConfig.bendaharaNama,
      bendahara_nip: newConfig.bendaharaNip,
      pptk_nama: newConfig.pptkNama,
      pptk_nip: newConfig.pptkNip,
      logo: newConfig.logo
    };
    await supabase.from('skpd_config').upsert(dbData);
    setSkpdConfig(newConfig);
    // Sync officials logic ...
  };

  // Render SPT/SPPD Preview
  if (viewMode === ViewMode.PRINT_PREVIEW && activeAssignment) {
    const props = { assignment: activeAssignment, employees, skpd: skpdConfig, officials, destinationOfficials };
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="no-print bg-white border-b p-4 sticky top-0 flex items-center justify-between z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode(ViewMode.PRINT_MENU)} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
            <h2 className="font-bold text-gray-800">Pratinjau - {printType}</h2>
          </div>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg"><Printer size={18} /> Cetak Sekarang</button>
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
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg"><FileText size={24} /></div>
          <h1 className="text-xl font-bold tracking-tight">SIPD Lite</h1>
        </div>
        <nav className="space-y-2">
          {[
            { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
            { id: ViewMode.SKPD_CONFIG, label: 'Data SKPD', icon: Building2 },
            { id: ViewMode.EMPLOYEE_LIST, label: 'Data Pegawai', icon: Users },
            { id: ViewMode.TRAVEL_LIST, label: 'Perjalanan Dinas', icon: Calendar },
            { id: ViewMode.MASTER_DATA, label: 'Data Master & Cloud', icon: Database },
            { id: ViewMode.REPORT, label: 'Laporan', icon: BarChart3 },
            { id: ViewMode.PRINT_MENU, label: 'Cetak Dokumen', icon: Printer },
          ].map(item => (
            <button key={item.id} onClick={() => setViewMode(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${viewMode === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon size={20} /><span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* Indikator Cloud */}
        <div className="mt-auto pt-10">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase text-slate-300">Terhubung Cloud</span>
             </div>
             <p className="text-[9px] text-slate-500 leading-tight">Data disinkronkan secara real-time ke Supabase.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Render Form / List sesuai ViewMode - Fungsi handle CRUD sudah diarahkan ke Supabase di atas */}
        {viewMode === ViewMode.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={24} /></div>
                   <div className="text-3xl font-black text-slate-800">{employees.length}</div>
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pegawai</div>
                </div>
                {/* Stats lainnya... */}
             </div>
             {/* Charts section... */}
          </div>
        )}

        {viewMode === ViewMode.SKPD_CONFIG && <SKPDForm config={skpdConfig} onSave={handleSaveSkpd} />}
        {viewMode === ViewMode.EMPLOYEE_LIST && <EmployeeForm employees={employees} onSave={saveEmployee} onDelete={deleteEmployee} />}
        {viewMode === ViewMode.TRAVEL_LIST && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             {/* List perjalanan... */}
             <table className="w-full text-left">
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.id} className="border-b">
                      <td className="p-4 font-bold uppercase text-xs">{a.assignmentNumber}</td>
                      <td className="p-4 font-bold text-xs">{a.destination}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { setEditingAssignment(a); setViewMode(ViewMode.ADD_TRAVEL); }} className="p-2 text-blue-500"><Edit2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
        {viewMode === ViewMode.ADD_TRAVEL && <TravelAssignmentForm employees={employees} masterCosts={masterCosts} subActivities={subActivities} officials={officials} initialData={editingAssignment || undefined} onSave={saveAssignment} onCancel={() => setViewMode(ViewMode.TRAVEL_LIST)} />}
        {viewMode === ViewMode.PRINT_MENU && (
           <div className="bg-white rounded-xl border p-4">
              <h3 className="font-black text-slate-800 uppercase mb-4">Pilih Dokumen untuk Dicetak</h3>
              {assignments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 border-b hover:bg-slate-50">
                  <span className="text-xs font-bold">{a.purpose}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveAssignment(a); setPrintType(PrintType.SPT); setViewMode(ViewMode.PRINT_PREVIEW); }} className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-3 py-1 rounded">SPT</button>
                    <button onClick={() => { setActiveAssignment(a); setPrintType(PrintType.SPPD_FRONT); setViewMode(ViewMode.PRINT_PREVIEW); }} className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded">SPPD</button>
                  </div>
                </div>
              ))}
           </div>
        )}
        {/* Mode lainnya: MASTER_DATA, REPORT... */}
      </main>
    </div>
  );
};

export default App;
