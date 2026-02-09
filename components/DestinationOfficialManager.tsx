
import React, { useState } from 'react';
import { DestinationOfficial } from '../types';
import { Plus, Trash2, Save, X, UserSearch, Building } from 'lucide-react';

interface Props {
  officials: DestinationOfficial[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onSave: (official: DestinationOfficial) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const DestinationOfficialManager: React.FC<Props> = ({ 
  officials, 
  selectedId, 
  onSelect, 
  onSave, 
  onDelete, 
  onClose 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<DestinationOfficial>({
    id: '',
    name: '',
    nip: '',
    jabatan: '',
    instansi: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: Date.now().toString() });
    setIsAdding(false);
    setFormData({ id: '', name: '', nip: '', jabatan: '', instansi: '' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <UserSearch className="text-blue-600" size={20} /> Pejabat Tujuan SPPD
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Pilih atau Tambah Pejabat Kantor Tujuan</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400"><X size={20}/></button>
        </div>

        <div className="p-6">
          {!isAdding ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Daftar Pejabat Tersimpan ({officials.length})</span>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition"
                >
                  <Plus size={14}/> Tambah Baru
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar p-1">
                {officials.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">
                    Belum ada data pejabat tujuan yang disimpan.
                  </div>
                ) : (
                  officials.map(off => (
                    <div 
                      key={off.id}
                      className={`p-4 border rounded-xl flex items-center justify-between group transition ${
                        selectedId === off.id ? 'bg-blue-50 border-blue-400 ring-4 ring-blue-50' : 'hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="cursor-pointer flex-1" onClick={() => onSelect(off.id)}>
                        <div className="text-xs font-black text-slate-800 uppercase">{off.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{off.jabatan} - {off.instansi}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">NIP. {off.nip}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedId === off.id && <span className="text-[9px] font-black text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded-full uppercase">Terpilih</span>}
                        <button 
                          onClick={() => onDelete(off.id)}
                          className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Nama Lengkap & Gelar</label>
                  <input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">NIP</label>
                  <input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Jabatan</label>
                  <input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Dinas / Instansi / Kabupaten</label>
                  <input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-slate-500 font-bold text-xs uppercase">Batal</button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-green-100">
                  <Save size={16}/> Simpan Pejabat
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-800 text-white px-10 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition hover:bg-slate-900"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
