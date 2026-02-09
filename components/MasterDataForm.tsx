
import React, { useState, useRef } from 'react';
import { MasterCost, SubActivity } from '../types';
import { Plus, Trash2, Upload, Save, X, Edit2, CreditCard, ListTree, AlertTriangle, Download, RefreshCw, Share2 } from 'lucide-react';
import { formatCurrency, formatNumber, parseNumber } from '../utils';
import * as XLSX from 'xlsx';

interface Props {
  masterCosts: MasterCost[];
  onSaveCost: (cost: MasterCost) => void;
  onDeleteCost: (destination: string) => void;
  onClearCosts: () => void;
  subActivities: SubActivity[];
  onSaveSub: (sub: SubActivity) => void;
  onDeleteSub: (code: string) => void;
  onClearSubs: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  onReset?: () => void;
}

type Tab = 'COSTS' | 'SUBS' | 'SYNC';

export const MasterDataForm: React.FC<Props> = ({ 
  masterCosts, onSaveCost, onDeleteCost, onClearCosts,
  subActivities, onSaveSub, onDeleteSub, onClearSubs,
  onExport, onImport, onReset 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('COSTS');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCost, setEditingCost] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const dbInputRef = useRef<HTMLInputElement>(null);
  
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

      let count = 0;
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 7) continue;
        
        onSaveCost({
          destination: String(row[0] || '').trim(),
          dailyAllowance: Number(row[1]) || 0,
          lodging: Number(row[2]) || 0,
          transportBbm: Number(row[3]) || 0,
          seaTransport: Number(row[4]) || 0,
          airTransport: Number(row[5]) || 0,
          taxi: Number(row[6]) || 0
        });
        count++;
      }
      
      if (count > 0) {
        alert(`Berhasil mengimpor ${count} data biaya dari Excel.`);
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

      let count = 0;
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 2) continue;
        
        onSaveSub({
          code: String(row[0] || '').trim(),
          name: String(row[1] || '').trim()
        });
        count++;
      }
      
      if (count > 0) {
        alert(`Berhasil mengimpor ${count} data sub kegiatan dari Excel.`);
      } else {
        alert("Format data Excel tidak sesuai. Pastikan ada kolom Kode Rekening dan Nama Sub Kegiatan.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCost(costForm);
    resetCostForm();
  };

  const resetCostForm = () => {
    setCostForm({ destination: '', dailyAllowance: 0, lodging: 0, transportBbm: 0, seaTransport: 0, airTransport: 0, taxi: 0 });
    setIsAdding(false);
    setEditingCost(null);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSub(subForm);
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

  const handleClearAll = () => {
    const targetName = activeTab === 'COSTS' ? 'SELURUH data Master Biaya' : 'SELURUH data Sub Kegiatan';
    if (confirm(`PERHATIAN: Apakah Anda yakin ingin menghapus ${targetName}? Tindakan ini akan menghapus data secara permanen dari database.`)) {
      if (activeTab === 'COSTS') {
        onClearCosts();
      } else {
        onClearSubs();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          <button 
            onClick={() => { setActiveTab('COSTS'); resetCostForm(); }}
            className={`flex-1 min-w-[150px] py-4 text-xs font-black uppercase flex items-center justify-center gap-2 transition tracking-wider ${activeTab === 'COSTS' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <CreditCard size={18} /> Master Biaya
          </button>
          <button 
            onClick={() => { setActiveTab('SUBS'); resetSubForm(); }}
            className={`flex-1 min-w-[150px] py-4 text-xs font-black uppercase flex items-center justify-center gap-2 transition tracking-wider ${activeTab === 'SUBS' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <ListTree size={18} /> Sub Kegiatan
          </button>
          <button 
            onClick={() => { setActiveTab('SYNC'); setIsAdding(false); }}
            className={`flex-1 min-w-[150px] py-4 text-xs font-black uppercase flex items-center justify-center gap-2 transition tracking-wider ${activeTab === 'SYNC' ? 'text-emerald-600 bg-emerald-50 border-b-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Share2 size={18} /> Berbagi Database
          </button>
        </div>

        {activeTab !== 'SYNC' && (
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
        )}

        {/* Sync Tab UI - Keep existing sync logic */}
        {activeTab === 'SYNC' && (
          <div className="p-8 space-y-8 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl group hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Download size={28} />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Cadangkan (Ekspor) Database</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Simpan seluruh data ke dalam file .json untuk cadangan atau berbagi.</p>
                <button onClick={onExport} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100">Unduh File Database (.json)</button>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl group hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Upload size={28} />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Sinkronkan (Impor) Database</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Unggah file .json untuk menyalin data ke aplikasi ini.</p>
                <button onClick={() => dbInputRef.current?.click()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">Unggah File & Sinkronisasi</button>
                <input type="file" ref={dbInputRef} accept=".json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onImport) onImport(file);
                  e.target.value = '';
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Form Add/Edit Cost */}
        {isAdding && activeTab === 'COSTS' && (
          <form onSubmit={handleAddCost} className="p-6 bg-blue-50 border-b grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-in slide-in-from-top-2 duration-200">
            <div className="md:col-span-1 lg:col-span-1">
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Tujuan</label>
              <input 
                required 
                className={`w-full p-2 border rounded text-sm font-medium ${editingCost ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
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
                className={`w-full p-2 border rounded text-sm font-mono font-bold ${editingSub ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
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
        {activeTab !== 'SYNC' && (
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
                            <button onClick={() => { if(confirm('Hapus?')) onDeleteCost(item.destination); }} className="text-red-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition" title="Hapus Data"><Trash2 size={16}/></button>
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
                            <button onClick={() => { if(confirm('Hapus?')) onDeleteSub(item.code); }} className="text-red-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition" title="Hapus Data"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
