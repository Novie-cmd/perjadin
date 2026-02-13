
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, TravelAssignment, SubActivity, TravelCost, TravelType, MasterCost, Official, DestinationOfficial } from '../types';
import { LIST_KOTA_NTB, LIST_PROVINSI_INDONESIA, TRANSPORTATION_MODES } from '../constants';
import { calculateDays, formatCurrency, formatNumber, parseNumber } from '../utils';
import { Save, Plus, X, Users, Wallet, MapPin, Zap, Trash2, Search, UserCheck, Info, Truck, Settings2, RotateCcw } from 'lucide-react';

interface Props {
  employees: Employee[];
  masterCosts: MasterCost[];
  subActivities: SubActivity[];
  officials: Official[];
  destinationOfficials: DestinationOfficial[];
  initialData?: TravelAssignment;
  onSave: (data: TravelAssignment) => void;
  onCancel: () => void;
}

export const TravelAssignmentForm: React.FC<Props> = ({ 
  employees, 
  masterCosts, 
  subActivities, 
  officials, 
  destinationOfficials,
  initialData, 
  onSave, 
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<TravelAssignment>>(() => {
    if (initialData) return initialData;
    const defaultKepala = officials.find(o => o.role === 'KEPALA');
    const defaultPPTK = officials.find(o => o.role === 'PPTK');
    const defaultBendahara = officials.find(o => o.role === 'BENDAHARA');

    return {
      assignmentNumber: '',
      subActivityCode: subActivities[0]?.code || '',
      purpose: '',
      origin: 'Mataram',
      travelType: 'DALAM_DAERAH',
      transportation: TRANSPORTATION_MODES[2],
      destination: '',
      startDate: '',
      endDate: '',
      durationDays: 0,
      selectedEmployeeIds: [],
      costs: [],
      signedAt: 'Mataram',
      signDate: new Date().toISOString().split('T')[0],
      signerId: defaultKepala?.id || '',
      pptkId: defaultPPTK?.id || '',
      bendaharaId: defaultBendahara?.id || '',
      destinationOfficialIds: ['', '', '']
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [lastAutoLookup, setLastAutoLookup] = useState<string>(initialData?.destination || '');

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.nip.includes(searchTerm) ||
      emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const selectedMaster = useMemo(() => {
    return masterCosts.find(c => c.destination === formData.destination);
  }, [formData.destination, masterCosts]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = calculateDays(formData.startDate, formData.endDate);
      setFormData(prev => ({ ...prev, durationDays: days }));
      setFormData(prev => ({
        ...prev,
        costs: (prev.costs || []).map(c => ({
          ...c,
          dailyDays: days,
          lodgingDays: Math.max(0, days - 1),
          representationDays: days
        }))
      }));
    }
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    if (formData.destination && (formData.destination !== lastAutoLookup)) {
      if (selectedMaster) {
        setFormData(prev => ({
          ...prev,
          costs: (prev.costs || []).map(c => ({
            ...c,
            dailyAllowance: selectedMaster.dailyAllowance,
            lodging: selectedMaster.lodging,
            transportBbm: selectedMaster.transportBbm,
            seaTransport: selectedMaster.seaTransport || 0,
            airTransport: selectedMaster.airTransport || 0,
            taxi: selectedMaster.taxi || 0,
            dailyDays: prev.durationDays || 0,
            lodgingDays: Math.max(0, (prev.durationDays || 1) - 1),
            representationDays: prev.durationDays || 0
          }))
        }));
        setLastAutoLookup(formData.destination);
      }
    }
  }, [formData.destination, selectedMaster, formData.durationDays, lastAutoLookup]);

  const handleTravelTypeChange = (type: TravelType) => {
    setFormData(prev => {
      const updatedCosts = (prev.costs || []).map(cost => {
        const emp = employees.find(e => e.id === cost.employeeId);
        if (emp) return { ...cost, representation: type === 'DALAM_DAERAH' ? (emp.representationDalam || 0) : (emp.representationLuar || 0) };
        return cost;
      });
      return { ...prev, travelType: type, destination: '', costs: updatedCosts };
    });
  };

  const handleToggleEmployee = (id: string) => {
    setFormData(prev => {
      const ids = prev.selectedEmployeeIds || [];
      const costs = prev.costs || [];
      if (ids.includes(id)) {
        return { ...prev, selectedEmployeeIds: ids.filter(x => x !== id), costs: costs.filter(c => c.employeeId !== id) };
      } else {
        const emp = employees.find(e => e.id === id);
        const newCost: TravelCost = {
          employeeId: id,
          transportBbm: selectedMaster ? selectedMaster.transportBbm : 0,
          seaTransport: selectedMaster ? (selectedMaster.seaTransport || 0) : 0,
          airTransport: selectedMaster ? (selectedMaster.airTransport || 0) : 0,
          taxi: selectedMaster ? (selectedMaster.taxi || 0) : 0,
          lodging: selectedMaster ? selectedMaster.lodging : 0,
          lodgingDays: Math.max(0, (prev.durationDays || 1) - 1),
          dailyAllowance: selectedMaster ? selectedMaster.dailyAllowance : 0,
          dailyDays: prev.durationDays || 0,
          representation: prev.travelType === 'DALAM_DAERAH' ? (emp?.representationDalam || 0) : (emp?.representationLuar || 0),
          representationDays: prev.durationDays || 0
        };
        return { ...prev, selectedEmployeeIds: [...ids, id], costs: [...costs, newCost] };
      }
    });
  };

  const updateCost = (empId: string, field: keyof TravelCost, value: number) => {
    setFormData(prev => ({
      ...prev,
      costs: (prev.costs || []).map(c => c.employeeId === empId ? { ...c, [field]: value } : c)
    }));
  };

  const handleClearDestinationOfficials = () => {
    if (confirm('Bersihkan semua pilihan pejabat pengesah tujuan (Blok II, III, IV)?')) {
      setFormData(prev => ({ ...prev, destinationOfficialIds: ['', '', ''] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedEmployeeIds?.length) { alert("Pilih minimal satu pegawai"); return; }
    if (!formData.destination) { alert("Pilih tujuan perjalanan"); return; }
    onSave({ ...formData as TravelAssignment, id: formData.id || Date.now().toString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between text-slate-800">
          <div className="flex items-center gap-2"><Save className="text-blue-600" size={20} /> {initialData ? 'Edit Data Perjalanan' : 'Data Umum Perjalanan'}</div>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 font-bold">Sub Kegiatan</label><select required className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 bg-white shadow-sm font-bold text-slate-700" value={formData.subActivityCode} onChange={e => setFormData({...formData, subActivityCode: e.target.value})}><option value="">-- Pilih Sub Kegiatan --</option>{subActivities.map(s => (<option key={s.code} value={s.code}>{s.code} - {s.name}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 font-bold">Nomor SPT</label><input required placeholder="090.1/..." className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 font-bold text-slate-700" value={formData.assignmentNumber} onChange={e => setFormData({...formData, assignmentNumber: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700 font-bold">Maksud Perjalanan</label><input required className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 font-bold text-slate-700" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} /></div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
             <div className="lg:col-span-2"><label className="block text-xs font-black text-slate-500 uppercase mb-2">Kategori Wilayah</label><div className="flex gap-4"><label className="flex-1 flex items-center gap-2 cursor-pointer group bg-white px-3 py-2.5 rounded-lg border border-slate-200"><input type="radio" name="travelType" className="w-4 h-4 text-blue-600" checked={formData.travelType === 'DALAM_DAERAH'} onChange={() => handleTravelTypeChange('DALAM_DAERAH')} /><span className="text-xs font-black group-hover:text-blue-600 uppercase">Dalam Daerah</span></label><label className="flex-1 flex items-center gap-2 cursor-pointer group bg-white px-3 py-2.5 rounded-lg border border-slate-200"><input type="radio" name="travelType" className="w-4 h-4 text-blue-600" checked={formData.travelType === 'LUAR_DAERAH'} onChange={() => handleTravelTypeChange('LUAR_DAERAH')} /><span className="text-xs font-black group-hover:text-blue-600 uppercase">Luar Daerah</span></label></div></div>
             <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Asal</label><input className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-100 font-black text-slate-600" value={formData.origin} readOnly /></div>
             <div><label className="block text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1"><MapPin size={12} className="text-red-500" /> Tujuan</label><select required className="w-full p-2.5 border border-blue-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-100 font-black text-slate-800" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})}><option value="">-- Pilih Tujuan --</option>{formData.travelType === 'DALAM_DAERAH' ? (LIST_KOTA_NTB.map(city => <option key={city} value={city}>{city}</option>)) : (LIST_PROVINSI_INDONESIA.map(prov => <option key={prov} value={prov}>{prov}</option>))}</select></div>
             <div><label className="block text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1"><Truck size={12} className="text-blue-500" /> Transportasi</label><select required className="w-full p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-100 font-black text-slate-800" value={formData.transportation} onChange={e => setFormData({...formData, transportation: e.target.value})}>{TRANSPORTATION_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 font-bold">Tanggal Berangkat</label><input type="date" required className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 font-bold text-slate-700" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700 font-bold">Tanggal Kembali</label><input type="date" required className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 font-bold text-slate-700" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 font-bold">Lama Perjalanan (Hari)</label><div className="flex items-center gap-3 mt-1"><input type="text" readOnly className="w-32 p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-black text-blue-600" value={`${formData.durationDays || 0} Hari`} /><span className="text-[10px] text-slate-400 font-bold uppercase italic">* Dihitung otomatis berdasarkan tanggal</span></div></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 uppercase tracking-tight"><MapPin className="text-red-600" size={20} /> Pejabat Pengesah Tujuan (Blok II, III, IV)</h3>
          {(formData.destinationOfficialIds?.some(id => id !== '')) && (
            <button 
              type="button"
              onClick={handleClearDestinationOfficials}
              className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition shadow-sm"
            >
              <RotateCcw size={14} /> Bersihkan Pengesah
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          {['II', 'III', 'IV'].map((blok, idx) => (
            <div key={blok} className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase">Pejabat Pengesah Blok {blok}</label>
              <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-700" value={(formData.destinationOfficialIds || [])[idx] || ''} onChange={e => {
                const currentIds = [...(formData.destinationOfficialIds || ['', '', ''])];
                currentIds[idx] = e.target.value;
                setFormData({...formData, destinationOfficialIds: currentIds});
              }}>
                <option value="">-- Pilih Pejabat --</option>
                {destinationOfficials.map(off => (<option key={off.id} value={off.id}>{off.name}</option>))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 uppercase tracking-tight"><UserCheck className="text-blue-600" size={20} /> Penanda Tangan Dokumen Internal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1"><label className="block text-xs font-black text-slate-500 uppercase">Kepala SKPD / Pejabat Penandatangan</label><select required className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 bg-white font-bold text-slate-700" value={formData.signerId} onChange={e => setFormData({...formData, signerId: e.target.value})}><option value="">-- Pilih Pejabat --</option>{officials.filter(o => o.role === 'KEPALA').map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}</select></div>
          <div className="space-y-1"><label className="block text-xs font-black text-slate-500 uppercase">Pejabat PPTK</label><select required className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 bg-white font-bold text-slate-700" value={formData.pptkId} onChange={e => setFormData({...formData, pptkId: e.target.value})}><option value="">-- Pilih PPTK --</option>{officials.filter(o => o.role === 'PPTK').map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}</select></div>
          <div className="space-y-1"><label className="block text-xs font-black text-slate-500 uppercase">Bendahara</label><select required className="w-full p-2.5 border border-slate-200 rounded-lg mt-1 bg-white font-bold text-slate-700" value={formData.bendaharaId} onChange={e => setFormData({...formData, bendaharaId: e.target.value})}><option value="">-- Pilih Bendahara --</option>{officials.filter(o => o.role === 'BENDAHARA').map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}</select></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"><h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 uppercase tracking-tight"><Users className="text-blue-600" size={20} /> Pilih Pegawai Terlibat</h3><div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Cari nama pegawai..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{filteredEmployees.map(emp => (<div key={emp.id} onClick={() => handleToggleEmployee(emp.id)} className={`p-3 border rounded-xl cursor-pointer transition flex items-center gap-3 ${formData.selectedEmployeeIds?.includes(emp.id) ? 'bg-blue-50 border-blue-400 ring-4 ring-blue-50 shadow-sm' : 'hover:bg-slate-50 border-slate-200'}`}><div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.selectedEmployeeIds?.includes(emp.id) ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-white border-slate-300'}`}>{formData.selectedEmployeeIds?.includes(emp.id) && <Plus size={14} className="text-white" />}</div><div className="overflow-hidden"><div className="text-sm font-bold text-slate-700 truncate">{emp.name}</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{emp.jabatan}</div></div></div>))}</div>
      </div>

      {formData.costs && formData.costs.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 uppercase tracking-tight"><Wallet className="text-blue-600" size={20} /> Rincian Biaya & Akomodasi</h3><div className="space-y-6">
            {formData.costs.map((cost, idx) => {
              const emp = employees.find(e => e.id === cost.employeeId);
              const totalRow = (cost.dailyAllowance * cost.dailyDays) + (cost.lodging * cost.lodgingDays) + cost.transportBbm + cost.seaTransport + cost.airTransport + cost.taxi + (cost.representation * cost.representationDays);
              return (<div key={cost.employeeId} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50"><div className="flex justify-between items-center bg-slate-100 p-3 border-b border-slate-200"><div className="flex items-center gap-3"><span className="font-black text-white bg-slate-400 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">{idx + 1}</span><div className="font-black text-slate-700 uppercase text-xs tracking-tight">{emp?.name}</div></div><div className="text-xs font-black text-blue-700 px-3 py-1 bg-blue-100 rounded-full border border-blue-200">Rp {formatCurrency(totalRow)}</div></div><div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4"><div className="space-y-1"><label className="block text-[10px] font-black text-slate-400 uppercase">Uang Harian ({cost.dailyDays} Hari)</label><input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formatNumber(cost.dailyAllowance)} onChange={e => updateCost(cost.employeeId, 'dailyAllowance', parseNumber(e.target.value))} /></div><div className="space-y-1"><label className="block text-[10px] font-black text-slate-400 uppercase">Akomodasi ({cost.lodgingDays} Malam)</label><input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formatNumber(cost.lodging)} onChange={e => updateCost(cost.employeeId, 'lodging', parseNumber(e.target.value))} /></div><div className="space-y-1"><label className="block text-[10px] font-black text-slate-400 uppercase">Transport BBM / Umum (PP)</label><input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formatNumber(cost.transportBbm)} onChange={e => updateCost(cost.employeeId, 'transportBbm', parseNumber(e.target.value))} /></div><div className="space-y-1"><label className="block text-[10px] font-black text-slate-400 uppercase">Taksi / Lokal</label><input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formatNumber(cost.taxi)} onChange={e => updateCost(cost.employeeId, 'taxi', parseNumber(e.target.value))} /></div><div className="space-y-1"><label className="block text-[10px] font-black text-slate-400 uppercase">Kapal Laut</label><input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formatNumber(cost.seaTransport)} onChange={e => updateCost(cost.employeeId, 'seaTransport', parseNumber(e.target.value))} /></div><div className="space-y-1"><label className="block text-[10px] font-black text-slate-400 uppercase">Pesawat Udara</label><input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formatNumber(cost.airTransport)} onChange={e => updateCost(cost.employeeId, 'airTransport', parseNumber(e.target.value))} /></div><div className="space-y-1"><label className="block text-[10px] font-black text-slate-400 uppercase">Representasi</label><input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formatNumber(cost.representation)} onChange={e => updateCost(cost.employeeId, 'representation', parseNumber(e.target.value))} /></div></div></div>);
            })}
          </div></div>
      )}

      <div className="flex justify-end gap-3 sticky bottom-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-2xl border border-slate-200 z-10"><button type="button" onClick={onCancel} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition font-black text-xs uppercase tracking-widest border border-slate-200">Batal</button><button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-2xl shadow-blue-300"><Save size={18} /> Simpan Perjalanan</button></div>
    </form>
  );
};
