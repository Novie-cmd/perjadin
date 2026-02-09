
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ViewMode, Employee, TravelAssignment, PrintType, MasterCost, SubActivity, SKPDConfig, Official, DestinationOfficial } from './types';
import { EmployeeForm } from './components/EmployeeForm';
import { TravelAssignmentForm } from './components/TravelAssignmentForm';
import { MasterDataForm } from './components/MasterDataForm';
import { SKPDForm } from './components/SKPDForm';
import { ReportView } from './components/ReportView';
import { DestinationOfficialManager } from './components/DestinationOfficialManager';
import { OfficialForm } from './components/OfficialForm';
import { 
  SPTTemplate, 
  SPPDFrontTemplate,
  SPPDBackTemplate,
  LampiranIIITemplate,
  KuitansiTemplate, 
  DaftarPenerimaanTemplate 
} from './components/PrintDocuments';
import { 
  LayoutDashboard, Users, FileText, Printer, ChevronLeft, Trash2, Calendar, Plus, Database, Edit2, Building2, BarChart3, RefreshCw, AlertCircle, Cloud, UserCheck, MapPin, Search, PieChart as PieIcon, Map, Settings2
} from 'lucide-react';
import { OFFICE_NAME, OFFICE_ADDRESS, HEAD_OF_OFFICE, TREASURER, LIST_KOTA_NTB } from './constants';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList 
} from 'recharts';

const getEnv = (key: string) => {
  try {
    const win = window as any;
    return win.process?.env?.[key] || (import.meta as any).env?.[`VITE_${key}`] || (import.meta as any).env?.[key] || "";
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
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
    lokasi: 'MATARAM',
    kepalaNama: HEAD_OF_OFFICE.name,
    kepalaNip: HEAD_OF_OFFICE.nip,
    kepalaJabatan: 'KEPALA DINAS',
    bendaharaNama: TREASURER.name,
    bendaharaNip: TREASURER.nip,
    pptkNama: 'Novi Haryanto, S.Adm',
    pptkNip: '197111201991031003',
    logo: undefined
  });
  const [masterCosts, setMasterCosts] = useState<MasterCost[]>([]);
  const [subActivities, setSubActivities] = useState<SubActivity[]>([]);
  const [assignments, setAssignments] = useState<TravelAssignment[]>([]);

  const [activeAssignment, setActiveAssignment] = useState<TravelAssignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<TravelAssignment | null>(null);
  const [printType, setPrintType] = useState<PrintType>(PrintType.SPT);
  const [showDestManager, setShowDestManager] = useState(false);

  // Data Calculations for Dashboard
  const dashboardStats = useMemo(() => {
    const travelTypeData = [
      { name: 'Dalam Daerah', value: assignments.filter(a => a.travelType === 'DALAM_DAERAH').length, color: '#3b82f6' },
      { name: 'Luar Daerah', value: assignments.filter(a => a.travelType === 'LUAR_DAERAH').length, color: '#f59e0b' }
    ];

    const ntbDestData = LIST_KOTA_NTB.map(city => ({
      name: city,
      jumlah: assignments.filter(a => a.travelType === 'DALAM_DAERAH' && a.destination === city).length
    })).filter(d => d.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah);

    return { travelTypeData, ntbDestData };
  }, [assignments]);

  const refreshData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
        supabase.from('employees').select('*').order('name'),
        supabase.from('officials').select('*'),
        supabase.from('destination_officials').select('*'),
        supabase.from('skpd_config').select('*').eq('id', 'main').maybeSingle(),
        supabase.from('master_costs').select('*').order('destination'),
        supabase.from('sub_activities').select('*').order('code'),
        supabase.from('assignments').select('*').order('created_at', { ascending: false })
      ]);

      if (empData) setEmployees(empData.map(e => ({
        id: e.id, name: e.name, nip: e.nip, pangkatGol: e.pangkat_gol, jabatan: e.jabatan,
        representationLuar: e.representation_luar, representationDalam: e.representation_dalam
      })));
      
      if (offData) setOfficials(offData);
      if (destOffData) setDestinationOfficials(destOffData);
      
      if (skpdData) {
        setSkpdConfig({
          provinsi: skpdData.provinsi || 'Provinsi Nusa Tenggara Barat',
          namaSkpd: skpdData.nama_skpd || OFFICE_NAME,
          alamat: skpdData.alamat || OFFICE_ADDRESS,
          lokasi: skpdData.lokasi || 'MATARAM',
          kepalaNama: skpdData.kepala_nama || HEAD_OF_OFFICE.name,
          kepalaNip: skpdData.kepala_nip || HEAD_OF_OFFICE.nip,
          kepalaJabatan: skpdData.kepala_jabatan || 'KEPALA DINAS',
          bendaharaNama: skpdData.bendahara_nama || TREASURER.name,
          bendaharaNip: skpdData.bendahara_nip || TREASURER.nip,
          pptkNama: skpdData.pptk_nama || 'Novi Haryanto, S.Adm',
          pptkNip: skpdData.pptk_nip || '197111201991031003',
          logo: skpdData.logo
        });
      }
      
      if (costData) setMasterCosts(costData.map(c => ({
        destination: c.destination, dailyAllowance: c.daily_allowance, lodging: c.lodging,
        transportBbm: c.transport_bbm, seaTransport: c.sea_transport, airTransport: c.air_transport, taxi: c.taxi
      })));

      if (subData) setSubActivities(subData);
      if (assignData) setAssignments(assignData.map(a => ({ 
        ...a, 
        selectedEmployeeIds: a.selected_employee_ids,
        travelType: a.travel_type,
        assignmentNumber: a.assignment_number,
        subActivityCode: a.sub_activity_code,
        startDate: a.start_date,
        endDate: a.end_date,
        durationDays: a.duration_days,
        signerId: a.signer_id,
        pptkId: a.pptk_id,
        bendaharaId: a.bendahara_id,
        destinationOfficialId: a.destination_official_id,
        signDate: a.sign_date,
        signedAt: a.signed_at
      })));

      setError(null);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  // Handlers
  const handleSaveAssignment = async (data: TravelAssignment) => {
    if (!supabase) return;
    const payload = {
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
      destination_official_id: data.destinationOfficialId,
      created_at: new Date().toISOString()
    };
    await supabase.from('assignments').upsert(payload);
    await refreshData();
    setEditingAssignment(null);
    setViewMode(ViewMode.TRAVEL_LIST);
  };

  const handleUpdateDestinationOfficial = async (assignmentId: string, officialId: string) => {
    if (!supabase) return;
    await supabase.from('assignments').update({ destination_official_id: officialId }).eq('id', assignmentId);
    await refreshData();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <RefreshCw className="animate-spin mb-4 text-blue-400" size={48} />
      <h2 className="text-xl font-bold uppercase tracking-widest">Sinkronisasi Database...</h2>
    </div>
  );

  // Print Preview View
  if (viewMode === ViewMode.PRINT_PREVIEW && activeAssignment) {
    const props = { assignment: activeAssignment, employees, skpd: skpdConfig, officials, destinationOfficials };
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="no-print bg-white border-b p-4 sticky top-0 flex items-center justify-between z-50 shadow-sm">
          <button onClick={() => setViewMode(ViewMode.PRINT_MENU)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-blue-600 transition">
            <ChevronLeft size={20} /> Kembali
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase text-slate-400">Preview: {printType}</span>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
              <Printer size={18} /> Cetak Sekarang
            </button>
          </div>
        </div>
        <div className="p-4 md:p-12 flex justify-center">
          {printType === PrintType.SPT && <SPTTemplate {...props} />}
          {printType === PrintType.SPPD_FRONT && <SPPDFrontTemplate {...props} />}
          {printType === PrintType.SPPD_BACK && <SPPDBackTemplate {...props} />}
          {printType === PrintType.LAMPIRAN_III && <LampiranIIITemplate {...props} />}
          {printType === PrintType.KUITANSI && <KuitansiTemplate {...props} />}
          {printType === PrintType.DAFTAR_PENERIMAAN && <DaftarPenerimaanTemplate {...props} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex-shrink-0 z-20 shadow-2xl">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-800 pb-6">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/40"><FileText size={24} /></div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter">SIPD<span className="text-blue-500">LITE</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Travel Management</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          {[
            { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
            { id: ViewMode.SKPD_CONFIG, label: 'Profil Kantor', icon: Building2 },
            { id: ViewMode.EMPLOYEE_LIST, label: 'Data Pegawai', icon: Users },
            { id: ViewMode.TRAVEL_LIST, label: 'Riwayat SPT', icon: Calendar },
            { id: ViewMode.MASTER_DATA, label: 'Data Master', icon: Database },
            { id: ViewMode.REPORT, label: 'Laporan', icon: BarChart3 },
            { id: ViewMode.PRINT_MENU, label: 'Pencetakan', icon: Printer },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => { setViewMode(item.id); setEditingAssignment(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                viewMode === item.id || (item.id === ViewMode.TRAVEL_LIST && viewMode === ViewMode.ADD_TRAVEL)
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{viewMode.replace('_', ' ')}</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
              <Building2 size={12} /> {skpdConfig.namaSkpd}
            </p>
          </div>
          {viewMode === ViewMode.TRAVEL_LIST && (
            <button 
              onClick={() => setViewMode(ViewMode.ADD_TRAVEL)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-200 transition"
            >
              <Plus size={18} /> Buat SPT Baru
            </button>
          )}
        </header>

        {/* Views Mapping */}
        {viewMode === ViewMode.DASHBOARD && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <Users className="text-blue-600" size={24}/>
                    <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Personel</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black">{employees.length}</div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Pegawai</div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <Calendar className="text-emerald-600" size={24}/>
                    <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Penugasan</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black">{assignments.length}</div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">SPT Terbit</div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <Database className="text-amber-600" size={24}/>
                    <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Regional</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black">{masterCosts.length}</div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Titik Biaya</div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <Cloud className="text-purple-600" size={24}/>
                    <span className="text-purple-500 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Database</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black">Connected</div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Status Sinkronisasi</div>
                  </div>
               </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                    <PieIcon size={16} className="text-blue-600"/> Perbandingan Wilayah Perjalanan
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardStats.travelTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {dashboardStats.travelTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                    <Map size={16} className="text-emerald-600"/> Distribusi Tujuan Kab/Kota di NTB
                  </h3>
                  <div className="h-[300px]">
                    {dashboardStats.ntbDestData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={dashboardStats.ntbDestData}
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                            width={100}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="jumlah" fill="#10b981" radius={[0, 4, 4, 0]}>
                            <LabelList dataKey="jumlah" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#10b981' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <MapPin size={48} className="opacity-20 mb-4"/>
                        <p className="text-xs font-bold uppercase tracking-widest">Belum ada data perjalanan dalam daerah</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {viewMode === ViewMode.SKPD_CONFIG && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <SKPDForm config={skpdConfig} onSave={async (cfg) => {
              if (supabase) {
                await supabase.from('skpd_config').upsert({ 
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
                  logo: cfg.logo
                });
                await refreshData();
              }
            }} />
            <OfficialForm officials={officials} onSave={async (off) => {
               if (supabase) { await supabase.from('officials').upsert(off); await refreshData(); }
            }} onDelete={async (id) => {
               if (supabase && confirm('Hapus pejabat?')) { await supabase.from('officials').delete().eq('id', id); await refreshData(); }
            }} />
          </div>
        )}

        {viewMode === ViewMode.EMPLOYEE_LIST && (
          <EmployeeForm employees={employees} onSave={async (e) => {
            if (supabase) { 
              await supabase.from('employees').upsert({
                id: e.id, name: e.name, nip: e.nip, pangkat_gol: e.pangkatGol, jabatan: e.jabatan,
                representation_luar: e.representationLuar, representation_dalam: e.representationDalam
              }); 
              await refreshData(); 
            }
          }} onDelete={async (id) => {
            if (supabase && confirm('Hapus pegawai?')) { await supabase.from('employees').delete().eq('id', id); await refreshData(); }
          }} />
        )}

        {viewMode === ViewMode.TRAVEL_LIST && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                      <tr><th className="px-6 py-5">Nomor & Tanggal</th><th className="px-6 py-5">Tujuan</th><th className="px-6 py-5">Maksud</th><th className="px-6 py-5 text-right">Aksi</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {assignments.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50 transition group">
                           <td className="px-6 py-5"><div className="font-black text-slate-800 text-sm">{a.assignmentNumber}</div><div className="text-[10px] text-slate-400 font-bold">{a.startDate}</div></td>
                           <td className="px-6 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black border border-blue-100">{a.destination}</span></td>
                           <td className="px-6 py-5"><p className="text-xs font-medium text-slate-600 line-clamp-1 max-w-xs">{a.purpose}</p></td>
                           <td className="px-6 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => { setEditingAssignment(a); setViewMode(ViewMode.ADD_TRAVEL); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button><button onClick={async () => { if(supabase && confirm('Hapus?')) { await supabase.from('assignments').delete().eq('id', a.id); await refreshData(); } }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></div></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {viewMode === ViewMode.ADD_TRAVEL && (
          <div className="space-y-4">
             <TravelAssignmentForm 
               employees={employees} 
               masterCosts={masterCosts} 
               subActivities={subActivities} 
               officials={officials}
               destinationOfficials={destinationOfficials}
               initialData={editingAssignment || undefined}
               onSave={handleSaveAssignment}
               onCancel={() => { setViewMode(ViewMode.TRAVEL_LIST); setEditingAssignment(null); }}
             />
          </div>
        )}

        {viewMode === ViewMode.MASTER_DATA && (
          <MasterDataForm 
            masterCosts={masterCosts} 
            subActivities={subActivities}
            onSaveCost={async (cost) => {
              if (supabase) {
                await supabase.from('master_costs').upsert({
                  destination: cost.destination, daily_allowance: cost.dailyAllowance, lodging: cost.lodging,
                  transport_bbm: cost.transportBbm, sea_transport: cost.seaTransport, air_transport: cost.airTransport, taxi: cost.taxi
                });
                await refreshData();
              }
            }}
            onDeleteCost={async (destination) => {
              if (supabase) {
                await supabase.from('master_costs').delete().eq('destination', destination);
                await refreshData();
              }
            }}
            onClearCosts={async () => {
              if (supabase) {
                await supabase.from('master_costs').delete().neq('destination', '___CLEAR_ALL___');
                await refreshData();
              }
            }}
            onSaveSub={async (sub) => {
              if (supabase) {
                await supabase.from('sub_activities').upsert({
                  code: sub.code, name: sub.name, budget_code: sub.budgetCode
                });
                await refreshData();
              }
            }}
            onDeleteSub={async (code) => {
              if (supabase) {
                await supabase.from('sub_activities').delete().eq('code', code);
                await refreshData();
              }
            }}
            onClearSubs={async () => {
              if (supabase) {
                await supabase.from('sub_activities').delete().neq('code', '___CLEAR_ALL___');
                await refreshData();
              }
            }}
            onExport={() => {
              const data = JSON.stringify({ 
                employees, officials, destinationOfficials, skpdConfig, masterCosts, subActivities, assignments 
              }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `backup_sipd_lite_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
          />
        )}

        {viewMode === ViewMode.REPORT && <ReportView employees={employees} assignments={assignments} />}

        {viewMode === ViewMode.PRINT_MENU && (
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Printer size={20} className="text-blue-600" />
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Daftar SPT Siap Cetak</h3>
                </div>
                <button 
                  onClick={() => setShowDestManager(true)}
                  className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 transition"
                >
                  <Settings2 size={14}/> Kelola Pejabat Tujuan
                </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Nomor & Tujuan</th>
                        <th className="px-6 py-4">Pejabat Pengesah (Tujuan)</th>
                        <th className="px-6 py-4 text-right">Opsi Cetak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {assignments.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-5">
                              <div className="font-bold text-slate-800 text-xs">{item.assignmentNumber}</div>
                              <div className="text-[10px] text-slate-400 font-medium italic">{item.destination}</div>
                            </td>
                            <td className="px-6 py-5">
                              <select 
                                className="w-full max-w-[220px] p-2 border border-slate-200 rounded-lg text-[10px] font-bold bg-white text-slate-700"
                                value={item.destinationOfficialId || ''}
                                onChange={(e) => handleUpdateDestinationOfficial(item.id, e.target.value)}
                              >
                                <option value="">-- Pilih Pejabat Tujuan --</option>
                                {destinationOfficials.map(doff => (
                                  <option key={doff.id} value={doff.id}>{doff.name} ({doff.jabatan})</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex gap-2 flex-wrap justify-end">
                               {[
                                 { label: 'SPT', type: PrintType.SPT, color: 'blue' },
                                 { label: 'SPD Depan', type: PrintType.SPPD_FRONT, color: 'emerald' },
                                 { label: 'SPD Belakang', type: PrintType.SPPD_BACK, color: 'emerald' },
                                 { label: 'Kuitansi', type: PrintType.KUITANSI, color: 'amber' },
                                 { label: 'Rincian', type: PrintType.LAMPIRAN_III, color: 'purple' },
                                 { label: 'Daftar Terima', type: PrintType.DAFTAR_PENERIMAAN, color: 'rose' }
                               ].map(btn => (
                                 <button 
                                   key={btn.type} 
                                   onClick={() => { setActiveAssignment(item); setPrintType(btn.type); setViewMode(ViewMode.PRINT_PREVIEW); }} 
                                   className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${btn.color === 'blue' ? 'text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white' : ''} ${btn.color === 'emerald' ? 'text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-600 hover:text-white' : ''} ${btn.color === 'amber' ? 'text-amber-600 border-amber-100 bg-amber-50 hover:bg-amber-600 hover:text-white' : ''} ${btn.color === 'purple' ? 'text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-600 hover:text-white' : ''} ${btn.color === 'rose' ? 'text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white' : ''}`}
                                 >
                                   {btn.label}
                                 </button>
                               ))}
                              </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {showDestManager && (
          <DestinationOfficialManager 
            officials={destinationOfficials}
            onClose={() => setShowDestManager(false)}
            onSelect={(id) => { setShowDestManager(false); }}
            onSave={async (off) => { if(supabase) { await supabase.from('destination_officials').upsert(off); await refreshData(); } }}
            onDelete={async (id) => { if(supabase && confirm('Hapus?')) { await supabase.from('destination_officials').delete().eq('id', id); await refreshData(); } }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
