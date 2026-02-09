
import React, { useState } from 'react';
import { MasterCost, SubActivity } from '../types';
import { Plus, Trash2, Upload, Save, X, Edit2, CreditCard, ListTree, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber, parseNumber } from '../utils';
import * as XLSX from 'xlsx';

interface Props {
  masterCosts: MasterCost[];
  onSaveCosts: (costs: MasterCost[]) => void;
  subActivities: SubActivity[];
  onSaveSubs: (subs: SubActivity[]) => void;
}

type Tab = 'COSTS' | 'SUBS';

export const MasterDataForm: React.FC<Props> = ({ masterCosts, onSaveCosts, subActivities, onSaveSubs }) => {
  const [activeTab, setActiveTab] = useState<Tab>('COSTS');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCost, setEditingCost] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  
  // Form states
  const [costForm, setCostForm] = useState<MasterCost>({
    destination: '',
    dailyAllowance: 0,
    lodging: 0,
    transportBbm: 0,
    seaTransport: 0,
    airTransport: 0,
    taxi: 0
  });

  const [subForm, setSubForm] = useState<SubActivity>({
    code: '',
    name: ''
  });

  const handleCostImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const newCosts: MasterCost[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        if (row.length >= 7) {
          newCosts.push({
            destination: String(row[0] || '').trim(),
            dailyAllowance: Number(row[1]) || 0,
            lodging: Number(row[2]) || 0,
            transportBbm: Number(row[3]) || 0,
            seaTransport: Number(row[4]) || 0,
            airTransport: Number(row[5]) || 0,
            taxi: Number(row[6]) || 0
          });
        }
      }
      
      if (newCosts.length > 0) {
        onSaveCosts([...masterCosts, ...newCosts]);
        alert(`Berhasil mengimpor ${newCosts.length} data biaya dari Excel.`);
      } else {
        alert("Format data Excel tidak sesuai. Pastikan minimal ada 7 kolom data.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const handleSubImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const newSubs: SubActivity[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        if (row.length >= 2) {
          newSubs.push({
            code: String(row[0] || '').trim(),
            name: String(row[1] || '').trim()
          });
        }
      }
      
      if (newSubs.length > 0) {
        onSaveSubs([...subActivities, ...newSubs]);
        alert(`Berhasil mengimpor ${newSubs.length} data sub kegiatan dari Excel.`);
      } else {
        alert("Format data Excel tidak sesuai. Pastikan ada kolom Kode Rekening dan Nama Sub Kegiatan.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCost) {
      onSaveCosts(masterCosts.map(c => c.destination === editingCost ? costForm : c));
    } else {
      onSaveCosts([...masterCosts, costForm]);
    }
    resetCostForm();
  };

  const resetCostForm = () => {
    setCostForm({ destination: '', dailyAllowance: 0, lodging: 0, transportBbm: 0, seaTransport: 0, airTransport: 0, taxi: 0 });
    setIsAdding(false);
    setEditingCost(null);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSub) {
      onSaveSubs(subActivities.map(s => s.code === editingSub ? subForm : s));
    } else {
      onSaveSubs([...subActivities, subForm]);
    }
    resetSubForm();
  };

  const resetSubForm = () => {
    setSubForm({ code: '', name: '' });
    setIsAdding(false);
    setEditingSub(null);
  };

  const handleEditCost = (item: MasterCost) => {
    setCostForm(item);
    setEditingCost(item.destination);
    setIsAdding(true);
    setActiveTab('COSTS');
  };

  const handleEditSub = (item: SubActivity) => {
    setSubForm(item);
    setEditingSub(item.code);
    setIsAdding(true);
    setActiveTab('SUBS');
  };

  const handleDeleteCost = (destination: string) => {
    if (confirm(`Hapus data biaya untuk tujuan ${destination}?`)) {
      onSaveCosts(masterCosts.filter(c => c.destination !== destination));
    }
  };

  const handleDeleteSub = (code: string) => {
    if (confirm(`Hapus data sub kegiatan dengan kode ${code}?`)) {
      onSaveSubs(subActivities.filter(s => s.code !== code));
    }
  };

  const handleClearAll = () => {
    const targetName = activeTab === 'COSTS' ? 'seluruh data Master Biaya' : 'seluruh data Sub Kegiatan';
    if (confirm(`PERHATIAN: Apakah Anda yakin ingin menghapus ${targetName}? Tindakan ini tidak dapat dibatalkan.`)) {
      if (activeTab === 'COSTS') {
        onSaveCosts([]);
      } else {
        onSaveSubs([]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          <button 
            onClick={() => { setActiveTab('COSTS'); resetCostForm(); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'COSTS' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <CreditCard size={18} /> Master Biaya Perjalanan
          </button>
          <button 
            onClick={() => { setActiveTab('SUBS'); resetSubForm(); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'SUBS' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <ListTree size={18} /> Master Sub Kegiatan
          </button>
        </div>

        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">
            {activeTab === 'COSTS' ? 'Manajemen Biaya Regional' : 'Manajemen Sub Kegiatan'}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
            {(activeTab === 'COSTS' ? masterCosts.length > 0 : subActivities.length > 0) && (
              <button 
                onClick={handleClearAll}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg transition text-[10px] font-black uppercase tracking-wider"
              >
                <Trash2 size={14} /> Hapus Semua
              </button>
            )}
            <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg cursor-pointer transition text-[10px] font-black uppercase tracking-wider shadow-sm">
              <Upload size={14} /> Impor Excel
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={activeTab === 'COSTS' ? handleCostImport : handleSubImport} 
              />
            </label>
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-[10px] font-black uppercase tracking-wider shadow-sm"
              >
                <Plus size={14} /> Tambah Manual
              </button>
            )}
          </div>
        </div>

        {/* Form Add/Edit Cost */}
        {isAdding && activeTab === 'COSTS' && (
          <form onSubmit={handleAddCost} className="p-6 bg-blue-50 border-b grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-in slide-in-from-top-2 duration-200">
            <div className="md:col-span-1 lg:col-span-1">
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Tujuan</label>
              <input 
                required 
                className={`w-full p-2 border rounded text-sm font-medium ${editingCost ? 'bg-gray-100' : ''}`} 
                value={costForm.destination} 
                onChange={e => setCostForm({...costForm, destination: e.target.value})}
                readOnly={!!editingCost}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Harian</label>
              <input type="text" className="w-full p-2 border rounded text-sm font-bold" value={formatNumber(costForm.dailyAllowance)} onChange={e => setCostForm({...costForm, dailyAllowance: parseNumber(e.target.value)})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Akomodasi</label>
              <input type="text" className="w-full p-2 border rounded text-sm font-bold" value={formatNumber(costForm.lodging)} onChange={e => setCostForm({...costForm, lodging: parseNumber(e.target.value)})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">BBM</label>
              <input type="text" className="w-full p-2 border rounded text-sm font-bold" value={formatNumber(costForm.transportBbm)} onChange={e => setCostForm({...costForm, transportBbm: parseNumber(e.target.value)})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Kapal Laut</label>
              <input type="text" className="w-full p-2 border rounded text-sm font-bold" value={formatNumber(costForm.seaTransport)} onChange={e => setCostForm({...costForm, seaTransport: parseNumber(e.target.value)})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Pesawat</label>
              <input type="text" className="w-full p-2 border rounded text-sm font-bold" value={formatNumber(costForm.airTransport)} onChange={e => setCostForm({...costForm, airTransport: parseNumber(e.target.value)})} />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Taksi</label>
                <input type="text" className="w-full p-2 border rounded text-sm font-bold" value={formatNumber(costForm.taxi)} onChange={e => setCostForm({...costForm, taxi: parseNumber(e.target.value)})} />
              </div>
              <button type="submit" className="bg-green-600 p-2 rounded text-white shadow-sm hover:bg-green-700 transition"><Save size={18}/></button>
              <button type="button" onClick={resetCostForm} className="bg-gray-400 p-2 rounded text-white shadow-sm hover:bg-gray-500 transition"><X size={18}/></button>
            </div>
          </form>
        )}

        {/* Form Add/Edit Sub */}
        {isAdding && activeTab === 'SUBS' && (
          <form onSubmit={handleAddSub} className="p-6 bg-blue-50 border-b grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Kode Rekening</label>
              <input 
                required 
                className={`w-full p-2 border rounded text-sm font-mono font-bold ${editingSub ? 'bg-gray-100' : ''}`} 
                value={subForm.code} 
                onChange={e => setSubForm({...subForm, code: e.target.value})} 
                readOnly={!!editingSub}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nama Sub Kegiatan</label>
              <input required className="w-full p-2 border rounded text-sm font-medium" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="flex-1 bg-green-600 py-2 rounded text-white font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-700 transition">
                <Save size={16}/> {editingSub ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={resetSubForm} className="px-4 py-2 bg-gray-400 rounded text-white font-bold text-xs uppercase hover:bg-gray-500 transition">
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Tables */}
        <div className="overflow-x-auto">
          {activeTab === 'COSTS' ? (
            <table className="w-full text-left text-[10px]">
              <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Provinsi/Kab/Kota</th>
                  <th className="px-4 py-4">Harian</th>
                  <th className="px-4 py-4">Akomodasi</th>
                  <th className="px-4 py-4">BBM</th>
                  <th className="px-4 py-4">Kapal</th>
                  <th className="px-4 py-4">Pesawat</th>
                  <th className="px-4 py-4">Taksi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {masterCosts.length === 0 ? (
                  <tr><td colSpan={8} className="p-16 text-center text-gray-400 italic font-medium">Belum ada data master biaya. Silakan impor file Excel (.xlsx) atau tambah secara manual.</td></tr>
                ) : (
                  masterCosts.map(item => (
                    <tr key={item.destination} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-4 font-bold text-slate-800">{item.destination}</td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(item.dailyAllowance)}</td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(item.lodging)}</td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(item.transportBbm)}</td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(item.seaTransport)}</td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(item.airTransport)}</td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(item.taxi)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEditCost(item)} className="text-blue-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition" title="Edit Data"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteCost(item.destination)} className="text-red-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition" title="Hapus Data"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-[10px]">
              <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-1/4">Kode Rekening</th>
                  <th className="px-6 py-4">Nama Sub Kegiatan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subActivities.length === 0 ? (
                  <tr><td colSpan={3} className="p-16 text-center text-gray-400 italic font-medium">Belum ada data sub kegiatan. Silakan impor file Excel (.xlsx) atau tambah secara manual.</td></tr>
                ) : (
                  subActivities.map(item => (
                    <tr key={item.code} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">{item.code}</td>
                      <td className="px-6 py-4 text-slate-800 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEditSub(item)} className="text-blue-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition" title="Edit Data"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteSub(item.code)} className="text-red-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition" title="Hapus Data"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {(activeTab === 'COSTS' ? masterCosts.length > 0 : subActivities.length > 0) && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white p-4 rounded-xl border border-slate-100 italic">
          <AlertTriangle size={14} className="text-amber-500" />
          Tips: Data Master akan digunakan secara otomatis sebagai referensi default saat membuat Perjalanan Dinas baru berdasarkan Tujuan atau Sub Kegiatan.
        </div>
      )}
    </div>
  );
};
