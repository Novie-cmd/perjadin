
import React, { useState, useEffect, useMemo } from 'react';
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
  LayoutDashboard, 
  Users, 
  FileText, 
  Printer, 
  ChevronLeft,
  Trash2,
  Calendar,
  Plus,
  ArrowRight,
  Database,
  Edit2,
  Building2,
  BarChart3,
  UserCheck,
  UserCog,
  MapPin,
  PieChart,
  Activity
} from 'lucide-react';
import { formatDateID } from './utils';
import { INITIAL_SUB_ACTIVITIES, HEAD_OF_OFFICE, TREASURER, OFFICE_NAME, OFFICE_ADDRESS, OFFICE_LOCATION, LIST_KOTA_NTB } from './constants';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('sipd_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [officials, setOfficials] = useState<Official[]>(() => {
    const saved = localStorage.getItem('sipd_officials');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: HEAD_OF_OFFICE.name, nip: HEAD_OF_OFFICE.nip, jabatan: `KEPALA ${OFFICE_NAME}`, role: 'KEPALA' },
      { id: '2', name: TREASURER.name, nip: TREASURER.nip, jabatan: 'Bendahara Pengeluaran', role: 'BENDAHARA' },
      { id: '3', name: 'Novi Haryanto, S.Adm', nip: '197111201991031003', jabatan: 'Pejabat Pelaksana Teknis Kegiatan', role: 'PPTK' }
    ];
  });

  const [destinationOfficials, setDestinationOfficials] = useState<DestinationOfficial[]>(() => {
    const saved = localStorage.getItem('sipd_destination_officials');
    return saved ? JSON.parse(saved) : [];
  });

  const [skpdConfig, setSkpdConfig] = useState<SKPDConfig>(() => {
    const saved = localStorage.getItem('sipd_skpd_config');
    return saved ? JSON.parse(saved) : {
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
    };
  });
  
  const [masterCosts, setMasterCosts] = useState<MasterCost[]>(() => {
    const saved = localStorage.getItem('sipd_master_costs');
    return saved ? JSON.parse(saved) : [];
  });

  const [subActivities, setSubActivities] = useState<SubActivity[]>(() => {
    const saved = localStorage.getItem('sipd_sub_activities');
    return saved ? JSON.parse(saved) : INITIAL_SUB_ACTIVITIES;
  });

  const [assignments, setAssignments] = useState<TravelAssignment[]>(() => {
    const saved = localStorage.getItem('sipd_assignments');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeAssignment, setActiveAssignment] = useState<TravelAssignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<TravelAssignment | null>(null);
  const [printType, setPrintType] = useState<PrintType>(PrintType.SPT);
  const [showDestManager, setShowDestManager] = useState<string | null>(null); // assignmentId

  // Dashboard Analytics Calculations
  const dashboardStats = useMemo(() => {
    const total = assignments.length;
    const dalamDaerah = assignments.filter(a => a.travelType === 'DALAM_DAERAH').length;
    const luarDaerah = assignments.filter(a => a.travelType === 'LUAR_DAERAH').length;
    
    // NTB Distribution
    const ntbCounts = LIST_KOTA_NTB.map(city => {
      return {
        name: city,
        count: assignments.filter(a => a.travelType === 'DALAM_DAERAH' && a.destination === city).length
      };
    }).sort((a, b) => b.count - a.count);

    return {
      total,
      dalamDaerah,
      luarDaerah,
      ntbCounts,
      dalamDaerahPct: total ? Math.round((dalamDaerah / total) * 100) : 0,
      luarDaerahPct: total ? Math.round((luarDaerah / total) * 100) : 0
    };
  }, [assignments]);

  useEffect(() => localStorage.setItem('sipd_employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('sipd_officials', JSON.stringify(officials)), [officials]);
  useEffect(() => localStorage.setItem('sipd_destination_officials', JSON.stringify(destinationOfficials)), [destinationOfficials]);
  useEffect(() => localStorage.setItem('sipd_skpd_config', JSON.stringify(skpdConfig)), [skpdConfig]);
  useEffect(() => localStorage.setItem('sipd_master_costs', JSON.stringify(masterCosts)), [masterCosts]);
  useEffect(() => localStorage.setItem('sipd_sub_activities', JSON.stringify(subActivities)), [subActivities]);
  useEffect(() => localStorage.setItem('sipd_assignments', JSON.stringify(assignments)), [assignments]);

  const saveEmployee = (emp: Employee) => {
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = emp;
        return next;
      }
      return [...prev, emp];
    });
  };

  const deleteEmployee = (id: string) => {
    if (confirm('Hapus data pegawai ini?')) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const saveAssignment = (data: TravelAssignment) => {
    setAssignments(prev => {
      const idx = prev.findIndex(a => a.id === data.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = data;
        return next;
      }
      return [data, ...prev];
    });
    setEditingAssignment(null);
    setViewMode(ViewMode.TRAVEL_LIST);
  };

  const openPrint = (assignment: TravelAssignment, type: PrintType) => {
    setActiveAssignment(assignment);
    setPrintType(type);
    setViewMode(ViewMode.PRINT_PREVIEW);
  };

  const updateAssignmentDestOfficial = (assignmentId: string, destOfficialId: string) => {
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, destinationOfficialId: destOfficialId } : a));
  };

  const saveDestinationOfficial = (off: DestinationOfficial) => {
    setDestinationOfficials(prev => [...prev, off]);
  };

  const deleteDestinationOfficial = (id: string) => {
    if (confirm('Hapus data pejabat tujuan ini?')) {
      setDestinationOfficials(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleSaveSkpd = (newConfig: SKPDConfig) => {
    setSkpdConfig(newConfig);
    
    // Auto-sync Officials based on SKPD Config
    setOfficials(prev => prev.map(off => {
      if (off.role === 'KEPALA') {
        const prefix = newConfig.kepalaJabatan.toUpperCase(); // e.g. "KEPALA DINAS"
        const name = newConfig.namaSkpd.toUpperCase();
        const typeOnly = prefix.replace('KEPALA ', ''); // e.g. "DINAS"
        
        // If organization name already starts with DINAS/BADAN/BIRO, avoid duplication
        const fullJabatan = name.startsWith(typeOnly) 
          ? `KEPALA ${name}`
          : `${prefix} ${name}`;

        return { 
          ...off, 
          name: newConfig.kepalaNama, 
          nip: newConfig.kepalaNip, 
          jabatan: fullJabatan
        };
      }
      if (off.role === 'BENDAHARA') {
        return { 
          ...off, 
          name: newConfig.bendaharaNama, 
          nip: newConfig.bendaharaNip 
        };
      }
      if (off.role === 'PPTK') {
        return { 
          ...off, 
          name: newConfig.pptkNama, 
          nip: newConfig.pptkNip 
        };
      }
      return off;
    }));
  };

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
            { id: ViewMode.MASTER_DATA, label: 'Data Master', icon: Database },
            { id: ViewMode.REPORT, label: 'Laporan', icon: BarChart3 },
            { id: ViewMode.PRINT_MENU, label: 'Cetak Dokumen', icon: Printer },
          ].map(item => (
            <button key={item.id} onClick={() => { setViewMode(item.id); setEditingAssignment(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${viewMode === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon size={20} /><span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
            {viewMode === ViewMode.DASHBOARD ? 'Ringkasan Sistem' : 
             viewMode === ViewMode.SKPD_CONFIG ? 'Profil SKPD' : 
             viewMode === ViewMode.EMPLOYEE_LIST ? 'Manajemen Pegawai' : 
             viewMode === ViewMode.MASTER_DATA ? 'Data Master Biaya & Kegiatan' :
             viewMode === ViewMode.PRINT_MENU ? 'Cetak Dokumen' :
             viewMode === ViewMode.TRAVEL_LIST ? 'Administrasi Perjalanan' :
             viewMode === ViewMode.ADD_TRAVEL ? 'Form Perjalanan Dinas' :
             viewMode === ViewMode.REPORT ? 'Laporan Riwayat Pegawai' :
             'Sistem SIPD'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">Sistem Informasi Perjalanan Dinas - {skpdConfig.namaSkpd}</p>
        </header>

        {viewMode === ViewMode.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{employees.length}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pegawai Terdaftar</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4"><Calendar size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{assignments.length}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Surat Tugas</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Database size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{masterCosts.length}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Master Biaya</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><FileText size={24} /></div>
                <div className="text-3xl font-black text-slate-800">{subActivities.length}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Master Sub Kegiatan</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Regional Comparison Chart */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <PieChart className="text-blue-600" size={24} />
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Perbandingan Wilayah Perjalanan</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-black text-slate-600 uppercase">Dalam Daerah</span>
                      <span className="text-lg font-black text-blue-600">{dashboardStats.dalamDaerahPct}% <span className="text-[10px] text-slate-400 font-bold">({dashboardStats.dalamDaerah})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${dashboardStats.dalamDaerahPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-black text-slate-600 uppercase">Luar Daerah</span>
                      <span className="text-lg font-black text-emerald-600">{dashboardStats.luarDaerahPct}% <span className="text-[10px] text-slate-400 font-bold">({dashboardStats.luarDaerah})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${dashboardStats.luarDaerahPct}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <Activity size={18} className="text-blue-600 mt-0.5" />
                  <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase tracking-wide">
                    {dashboardStats.dalamDaerah >= dashboardStats.luarDaerah 
                      ? "Aktivitas dinas didominasi oleh perjalanan dalam daerah (NTB)."
                      : "Aktivitas dinas didominasi oleh perjalanan luar daerah."}
                  </p>
                </div>
              </div>

              {/* NTB Destination Distribution */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <MapPin className="text-red-500" size={24} />
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Distribusi Tujuan (Kab/Kota di NTB)</h3>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                  {dashboardStats.ntbCounts.map((city, idx) => {
                    const maxCount = Math.max(...dashboardStats.ntbCounts.map(c => c.count)) || 1;
                    const widthPct = (city.count / maxCount) * 100;
                    
                    return (
                      <div key={city.name} className="group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{city.name}</span>
                          <span className="text-xs font-black text-slate-800">{city.count} <span className="text-[9px] text-slate-400">kali</span></span>
                        </div>
                        <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden group-hover:bg-slate-100 transition">
                          <div 
                            className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-red-500' : 'bg-slate-300'}`} 
                            style={{ width: `${widthPct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {assignments.filter(a => a.travelType === 'DALAM_DAERAH').length === 0 && (
                    <div className="py-20 text-center text-slate-300 italic text-xs uppercase font-bold tracking-widest">
                      Belum ada data perjalanan dalam daerah
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === ViewMode.SKPD_CONFIG && <SKPDForm config={skpdConfig} onSave={handleSaveSkpd} />}
        {viewMode === ViewMode.EMPLOYEE_LIST && <EmployeeForm employees={employees} onSave={saveEmployee} onDelete={deleteEmployee} />}
        {viewMode === ViewMode.MASTER_DATA && <MasterDataForm masterCosts={masterCosts} onSaveCosts={setMasterCosts} subActivities={subActivities} onSaveSubs={setSubActivities} />}
        {viewMode === ViewMode.REPORT && <ReportView employees={employees} assignments={assignments} />}
        
        {viewMode === ViewMode.TRAVEL_LIST && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Riwayat Perjalanan Dinas</h3>
              <button onClick={() => { setEditingAssignment(null); setViewMode(ViewMode.ADD_TRAVEL); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase shadow-lg shadow-blue-100 transition hover:bg-blue-700">
                <Plus size={16} /> Tambah Data
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
                  <tr><th className="px-6 py-4">SPT</th><th className="px-6 py-4">Tujuan</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4"><div className="text-[10px] font-black text-blue-600">{item.assignmentNumber}</div><div className="text-xs font-bold text-slate-800 uppercase">{item.purpose}</div></td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.destination}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => {setEditingAssignment(item); setViewMode(ViewMode.ADD_TRAVEL);}} className="text-blue-400 p-2"><Edit2 size={18}/></button>
                          <button onClick={() => setAssignments(prev => prev.filter(a => a.id !== item.id))} className="text-red-400 p-2"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === ViewMode.PRINT_MENU && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 text-lg uppercase">Cetak Dokumen Administrasi</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Silakan lengkapi TTD Tujuan sebelum mencetak SPPD (B)</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Informasi Surat Tugas</th>
                    <th className="px-6 py-4">Pejabat Tujuan</th>
                    <th className="px-6 py-4">Pilih Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(item => {
                    const destOff = destinationOfficials.find(o => o.id === item.destinationOfficialId);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 w-1/4">
                          <div className="font-bold text-xs uppercase text-slate-800">{item.purpose}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{item.assignmentNumber}</div>
                        </td>
                        <td className="px-6 py-4 w-1/4">
                          {destOff ? (
                            <div className="flex items-center gap-2 group">
                              <div>
                                <div className="text-[10px] font-black text-slate-700 uppercase">{destOff.name}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase leading-tight">{destOff.jabatan}</div>
                              </div>
                              <button onClick={() => setShowDestManager(item.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                                <UserCog size={14}/>
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setShowDestManager(item.id)}
                              className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200 hover:bg-amber-100 transition"
                            >
                              <Plus size={14}/> Set TTD Tujuan
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => openPrint(item, PrintType.SPT)} className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition">SPT</button>
                            <button onClick={() => openPrint(item, PrintType.SPPD_FRONT)} className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition">SPPD (D)</button>
                            <button onClick={() => openPrint(item, PrintType.SPPD_BACK)} className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition">SPPD (B)</button>
                            <button onClick={() => openPrint(item, PrintType.KUITANSI)} className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition">Kuitansi</button>
                            <button onClick={() => openPrint(item, PrintType.LAMPIRAN_III)} className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition">Rincian Biaya</button>
                            <button onClick={() => openPrint(item, PrintType.DAFTAR_PENERIMAAN)} className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition">Daftar Penerima</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === ViewMode.ADD_TRAVEL && <TravelAssignmentForm employees={employees} masterCosts={masterCosts} subActivities={subActivities} officials={officials} initialData={editingAssignment || undefined} onSave={saveAssignment} onCancel={() => setViewMode(ViewMode.TRAVEL_LIST)} />}
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
