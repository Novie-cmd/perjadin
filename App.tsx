import React, { useState, useEffect, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ViewMode, Employee, TravelAssignment, PrintType, 
  MasterCost, SubActivity, SKPDConfig, Official, DestinationOfficial 
} from './types';
import { EmployeeForm } from './components/EmployeeForm';
import { OfficialForm } from './components/OfficialForm';
import { TravelAssignmentForm } from './components/TravelAssignmentForm';
import { MasterDataForm } from './components/MasterDataForm';
import { SKPDForm } from './components/SKPDForm';
import { ReportView } from './components/ReportView';
import { DestinationOfficialManager } from './components/DestinationOfficialManager';
import { DatabaseSetup } from './components/DatabaseSetup';
import { 
  SPTTemplate, 
  SPPDFrontTemplate,
  SPPDBackTemplate,
  LampiranIIITemplate,
  KuitansiTemplate, 
  DaftarPenerimaanTemplate 
} from './components/PrintDocuments';
import { 
  LayoutDashboard, Users, FileText, Printer, ChevronLeft, 
  Trash2, Calendar, Plus, Database, Edit2, Building2, 
  BarChart3, RefreshCw, LogOut, Settings2, ShieldCheck, Map,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { OFFICE_NAME, OFFICE_ADDRESS, HEAD_OF_OFFICE, TREASURER, LIST_KOTA_NTB } from './constants';

const App: React.FC = () => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [dbConfigured, setDbConfigured] = useState(false);
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

  // Computed Chart Data
  const chartData = useMemo(() => {
    const typeCounts = assignments.reduce((acc, curr) => {
      acc[curr.travelType] = (acc[curr.travelType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = [
      { name: 'Dalam Daerah', value: typeCounts['DALAM_DAERAH'] || 0, color: '#4f46e5' },
      { name: 'Luar Daerah', value: typeCounts['LUAR_DAERAH'] || 0, color: '#10b981' }
    ];

    const ntbDestStats = LIST_KOTA_NTB.map(city => {
      const count = assignments.filter(a => a.destination === city).length;
      return { name: city, count };
    }).sort((a, b) => b.count - a.count);

    return { pieData, ntbDestStats };
  }, [assignments]);

  useEffect(() => {
    const savedUrl = localStorage.getItem('SB_URL');
    const savedKey = localStorage.getItem('SB_KEY');
    if (savedUrl && savedKey) {
      const client = createClient(savedUrl, savedKey);
      setSupabase(client);
      setDbConfigured(true);
    } else {
      setLoading(false);
    }
  }, []);

  const handleConnectDb = (url: string, key: string) => {
    localStorage.setItem('SB_URL', url);
    localStorage.setItem('SB_KEY', key);
    const client = createClient(url, key);
    setSupabase(client);
    setDbConfigured(true);
  };

  const handleDisconnectDb = () => {
    if (confirm('Putus koneksi database?')) {
      localStorage.removeItem('SB_URL');
      localStorage.removeItem('SB_KEY');
      window.location.reload();
    }
  };

  const refreshData = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const [
        { data: empData, error: empErr }, 
        { data: offData, error: offErr }, 
        { data: destOffData, error: destOffErr }, 
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

      if (skpdErr && skpdErr.code !== 'PGRST116') throw skpdErr; 

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
        pptkNip: skpdData.pptk_nip, logo: skpdData.logo 
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
        destinationOfficialId: a.destination_official_id, signDate: a.sign_date, signedAt: a.signed_at 
      })));
    } catch (err: any) {
      console.error(err);
      setError(`Database Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (dbConfigured) refreshData(); }, [dbConfigured]);

  const handleSaveAssignment = async (data: TravelAssignment) => {
    if (!supabase) return;
    const { error } = await supabase.from('assignments').upsert({
      id: data.id, assignment_number: data.assignmentNumber, sub_activity_code: data.subActivityCode, 
      purpose: data.purpose, origin: data.origin, travel_type: data.travelType, 
      transportation: data.transportation, destination: data.destination, 
      start_date: data.startDate, end_date: data.endDate, duration_days: data.durationDays, 
      selected_employee_ids: data.selectedEmployeeIds, costs: data.costs, 
      signed_at: data.signedAt, sign_date: data.signDate, pptk_id: data.pptkId, 
      signer_id: data.signerId, bendahara_id: data.bendaharaId, 
      destination_official_id: data.destinationOfficialId
    });
    if (error) alert(`Gagal menyimpan: ${error.message}`);
    else { await refreshData(); setViewMode(ViewMode.TRAVEL_LIST); }
  };

  const handleUpdateDestinationOfficial = async (assignmentId: string, officialId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('assignments').update({ destination_official_id: officialId }).eq('id', assignmentId);
    if (error) alert(`Gagal update: ${error.message}`);
    else await refreshData();
  };

  if (!dbConfigured && !loading) return <DatabaseSetup onConnect={handleConnectDb} />;
  
  if (loading) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col">
      <RefreshCw className="animate-spin text-blue-400 mb-4" size={48} />
      <h2 className="font-black text-xl tracking-widest italic">MENGHUBUNGKAN...</h2>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-red-100">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase">Koneksi Bermasalah</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
        <div className="flex flex-col gap-2">
           <button onClick={refreshData} className="bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2">
             <RefreshCw size={14} /> Coba Lagi
           </button>
           <button onClick={handleDisconnectDb} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest py-2">
             Reset Koneksi
           </button>
        </div>
      </div>
    </div>
  );

  if (viewMode === ViewMode.PRINT_PREVIEW && activeAssignment) {
    const props = { assignment: activeAssignment, employees, skpd: skpdConfig, officials, destinationOfficials };
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="no-print bg-white border-b p-4 sticky top-0 flex items-center justify-between z-50 shadow-sm">
          <button onClick={() => setViewMode(ViewMode.PRINT_MENU)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-blue-600 transition"><ChevronLeft size={20} /> Kembali</button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase text-slate-400">Preview: {printType}</span>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition"><Printer size={18} /> Cetak</button>
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
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-800 pb-6">
          <div className="bg-blue-600 p-2.5 rounded-xl"><FileText size={24} /></div>
          <div>
            <h1 className="text-xl font-black italic">SIPD<span className="text-blue-500">LITE</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Perjalanan Dinas</p>
          </div>
        </div>
        <nav className="space-y-1">
          {[
            { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
            { id: ViewMode.SKPD_CONFIG, label: 'Profil SKPD', icon: Building2 },
            { id: ViewMode.EMPLOYEE_LIST, label: 'Data Pegawai', icon: Users },
            { id: ViewMode.OFFICIAL_LIST, label: 'Pejabat Internal', icon: ShieldCheck },
            { id: ViewMode.TRAVEL_LIST, label: 'Riwayat SPT', icon: Calendar },
            { id: ViewMode.MASTER_DATA, label: 'Data Master', icon: Database },
            { id: ViewMode.REPORT, label: 'Laporan', icon: BarChart3 },
            { id: ViewMode.PRINT_MENU, label: 'Pencetakan', icon: Printer },
          ].map(item => (
            <button key={item.id} onClick={() => setViewMode(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${viewMode === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
          <div className="pt-8 mt-8 border-t border-slate-800">
            <button onClick={handleDisconnectDb} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/10">
              <LogOut size={16} /> Putus Database
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{viewMode.replace('_', ' ')}</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 flex items-center gap-1"><Building2 size={12} /> {skpdConfig.namaSkpd}</p>
          </div>
          {viewMode === ViewMode.TRAVEL_LIST && (
            <button onClick={() => { setEditingAssignment(null); setViewMode(ViewMode.ADD_TRAVEL); }} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl transition hover:bg-blue-700 flex items-center gap-2">
              <Plus size={18} /> Buat SPT Baru
            </button>
          )}
        </header>

        {viewMode === ViewMode.DASHBOARD && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="text-3xl font-black text-blue-600">{employees.length}</div>
                 <div className="text-slate-400 text-[10px] font-black uppercase mt-1">Total Pegawai</div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="text-3xl font-black text-emerald-600">{assignments.length}</div>
                 <div className="text-slate-400 text-[10px] font-black uppercase mt-1">SPT Terbit</div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="text-3xl font-black text-amber-600">{officials.length}</div>
                 <div className="text-slate-400 text-[10px] font-black uppercase mt-1">Pejabat Internal</div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="text-3xl font-black text-slate-800 italic">Cloud</div>
                 <div className="text-slate-400 text-[10px] font-black uppercase mt-1">Status Sinkron</div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                  <PieChartIcon size={16} className="text-indigo-600"/> Perbandingan Wilayah
                </h3>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={chartData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Map size={16} className="text-indigo-600"/> Statistik Tujuan NTB
                </h3>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      layout="vertical"
                      data={chartData.ntbDestStats}
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" name="Kunjungan" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === ViewMode.SKPD_CONFIG && <SKPDForm config={skpdConfig} onSave={async (cfg) => {
          if (supabase) {
            const { error } = await supabase.from('skpd_config').upsert({ 
              id: 'main', provinsi: cfg.provinsi, nama_skpd: cfg.namaSkpd, alamat: cfg.alamat, 
              lokasi: cfg.lokasi, kepala_nama: cfg.kepalaNama, kepala_nip: cfg.kepalaNip, 
              kepala_jabatan: cfg.kepalaJabatan, bendahara_nama: cfg.bendaharaNama, 
              bendahara_nip: cfg.bendaharaNip, pptk_nama: cfg.pptkNama, pptk_nip: cfg.pptkNip, logo: cfg.logo 
            });
            if (error) alert(`Gagal: ${error.message}`);
            else await refreshData();
          }
        }} />}

        {viewMode === ViewMode.OFFICIAL_LIST && <OfficialForm officials={officials} onSave={async (o) => {
          if (supabase) {
            const { error } = await supabase.from('officials').upsert({
              id: o.id || Date.now().toString(),
              name: o.name,
              nip: o.nip,
              jabatan: o.jabatan,
              role: o.role
            });
            if (error) alert(`Gagal: ${error.message}`);
            else await refreshData();
          }
        }} onDelete={async (id) => {
          if (supabase && confirm('Hapus pejabat internal?')) {
            const { error } = await supabase.from('officials').delete().eq('id', id);
            if (error) alert(`Gagal: ${error.message}`);
            else await refreshData();
          }
        }} />}

        {viewMode === ViewMode.EMPLOYEE_LIST && <EmployeeForm employees={employees} onSave={async (e) => {
          if (supabase) { 
            const { error } = await supabase.from('employees').upsert({ 
              id: e.id, name: e.name, nip: e.nip, pangkat_gol: e.pangkatGol, 
              jabatan: e.jabatan, representation_luar: e.representationLuar, 
              representation_dalam: e.representationDalam 
            });
            if (error) alert(`Gagal: ${error.message}`);
            else await refreshData(); 
          }
        }} onDelete={async (id) => {
          if (supabase && confirm('Hapus pegawai?')) { 
            const { error } = await supabase.from('employees').delete().eq('id', id); 
            if (error) alert(`Gagal: ${error.message}`);
            else await refreshData(); 
          }
        }} />}

        {viewMode === ViewMode.TRAVEL_LIST && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5">Nomor & Tanggal</th>
                    <th className="px-6 py-5">Tujuan</th>
                    <th className="px-6 py-5">Maksud</th>
                    <th className="px-6 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-5">
                        <div className="font-black text-slate-800 text-sm">{a.assignmentNumber}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{a.startDate}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black border border-blue-100">{a.destination}</span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-medium text-slate-600 line-clamp-1 max-w-xs">{a.purpose}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingAssignment(a); setViewMode(ViewMode.ADD_TRAVEL); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16}/></button>
                          <button onClick={async () => { if(supabase && confirm('Hapus SPT ini?')) { const { error } = await supabase.from('assignments').delete().eq('id', a.id); if (error) alert(`Gagal: ${error.message}`); else await refreshData(); } }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Belum ada data perjalanan dinas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === ViewMode.ADD_TRAVEL && <TravelAssignmentForm employees={employees} masterCosts={masterCosts} subActivities={subActivities} officials={officials} destinationOfficials={destinationOfficials} initialData={editingAssignment || undefined} onSave={handleSaveAssignment} onCancel={() => setViewMode(ViewMode.TRAVEL_LIST)} />}

        {viewMode === ViewMode.MASTER_DATA && (
          <MasterDataForm masterCosts={masterCosts} subActivities={subActivities} onSaveCost={async (cost) => {
            if (supabase) {
              const { error } = await supabase.from('master_costs').upsert({ destination: cost.destination, daily_allowance: cost.dailyAllowance, lodging: cost.lodging, transport_bbm: cost.transportBbm, sea_transport: cost.seaTransport, air_transport: cost.airTransport, taxi: cost.taxi });
              if (error) alert(`Gagal: ${error.message}`);
              else await refreshData();
            }
          }} onDeleteCost={async (destination) => {
            if (supabase) {
              const { error } = await supabase.from('master_costs').delete().eq('destination', destination);
              if (error) alert(`Gagal: ${error.message}`);
              else await refreshData();
            }
          }} onClearCosts={async () => {
            if (supabase) {
              const { error } = await supabase.from('master_costs').delete().neq('destination', '___X___');
              if (error) alert(`Gagal: ${error.message}`);
              else await refreshData();
            }
          }} onSaveSub={async (sub) => {
            if (!supabase) return;
            // PERBAIKAN: Mapping budgetCode (camelCase) ke budget_code (snake_case) di database
            const { error } = await supabase.from('sub_activities').upsert({ 
              code: sub.code, 
              name: sub.name,
              budget_code: sub.budgetCode || '',
              anggaran: sub.anggaran,
              spd: sub.spd,
              triwulan1: sub.triwulan1,
              triwulan2: sub.triwulan2,
              triwulan3: sub.triwulan3,
              triwulan4: sub.triwulan4
            });
            if (error) {
              alert(`Gagal menyimpan ke database: ${error.message}`);
              throw error; 
            } else {
              await refreshData();
              alert('Data Sub Kegiatan berhasil disimpan!');
            }
          }} onDeleteSub={async (code) => {
            if (supabase) {
              const { error } = await supabase.from('sub_activities').delete().eq('code', code);
              if (error) alert(`Gagal: ${error.message}`);
              else await refreshData();
            }
          }} onClearSubs={async () => {
            if (supabase) {
              const { error } = await supabase.from('sub_activities').delete().neq('code', '___X___');
              if (error) alert(`Gagal: ${error.message}`);
              else await refreshData();
            }
          }} />
        )}

        {viewMode === ViewMode.REPORT && <ReportView employees={employees} assignments={assignments} />}

        {viewMode === ViewMode.PRINT_MENU && (
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                 <Printer size={20} className="text-blue-600" />
                 <h3 className="font-black text-slate-800 text-xs uppercase">Daftar SPT Siap Cetak</h3>
               </div>
               <button onClick={() => setShowDestManager(true)} className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:bg-slate-300">
                 <Settings2 size={14}/> Kelola Pejabat Tujuan
               </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black border-b border-slate-100">
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
                         <select className="w-full max-w-[220px] p-2 border border-slate-200 rounded-lg text-[10px] font-bold bg-white text-slate-700" value={item.destinationOfficialId || ''} onChange={(e) => handleUpdateDestinationOfficial(item.id, e.target.value)}>
                           <option value="">-- Pilih Pejabat Tujuan --</option>
                           {destinationOfficials.map(doff => (<option key={doff.id} value={doff.id}>{doff.name} ({doff.jabatan})</option>))}
                         </select>
                       </td>
                       <td className="px-6 py-5 text-right">
                         <div className="flex gap-2 flex-wrap justify-end">
                           {[
                             { label: 'SPT', type: PrintType.SPT, color: 'blue' },
                             { label: 'SPD Dpn', type: PrintType.SPPD_FRONT, color: 'emerald' },
                             { label: 'SPD Blk', type: PrintType.SPPD_BACK, color: 'emerald' },
                             { label: 'Kuitansi', type: PrintType.KUITANSI, color: 'amber' },
                             { label: 'Rincian', type: PrintType.LAMPIRAN_III, color: 'purple' },
                             { label: 'Terima', type: PrintType.DAFTAR_PENERIMAAN, color: 'rose' }
                           ].map(btn => (
                             <button key={btn.type} onClick={() => { setActiveAssignment(item); setPrintType(btn.type); setViewMode(ViewMode.PRINT_PREVIEW); }} className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                               btn.color === 'blue' ? 'text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white' : 
                               btn.color === 'emerald' ? 'text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-600 hover:text-white' : 
                               btn.color === 'amber' ? 'text-amber-600 border-amber-100 bg-amber-50 hover:bg-amber-600 hover:text-white' : 
                               btn.color === 'purple' ? 'text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-600 hover:text-white' : 
                               'text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white'}`}>
                               {btn.label}
                             </button>
                           ))}
                         </div>
                       </td>
                     </tr>
                   ))}
                   {assignments.length === 0 && (
                     <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">Belum ada SPT untuk dicetak.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {showDestManager && <DestinationOfficialManager officials={destinationOfficials} selectedId={undefined} onClose={() => setShowDestManager(false)} onSelect={(id) => setShowDestManager(false)} onSave={async (off) => { if(supabase) { const { error } = await supabase.from('destination_officials').upsert(off); if (error) alert(`Gagal: ${error.message}`); else await refreshData(); } }} onDelete={async (id) => { if(supabase && confirm('Hapus?')) { const { error } = await supabase.from('destination_officials').delete().eq('id', id); if (error) alert(`Gagal: ${error.message}`); else await refreshData(); } }} />}
      </main>
    </div>
  );
};

export default App;