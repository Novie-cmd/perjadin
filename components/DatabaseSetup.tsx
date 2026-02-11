
import React, { useState } from 'react';
import { Database, Link, Key, CheckCircle, ExternalLink, Info } from 'lucide-react';

interface Props {
  onConnect: (url: string, key: string) => void;
}

export const DatabaseSetup: React.FC<Props> = ({ onConnect }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && key) {
      onConnect(url.trim(), key.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter">SIPD<span className="text-blue-500">LITE</span></h1>
          <p className="text-slate-400 text-xs mt-2 font-medium">Hubungkan ke database Supabase Anda untuk mulai mengelola Perjalanan Dinas secara pribadi.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Link size={12} /> Supabase URL
            </label>
            <input 
              required
              type="url"
              placeholder="https://xyz.supabase.co"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Key size={12} /> Anon Key (Public)
            </label>
            <input 
              required
              type="password"
              placeholder="eyJhbGciOiJIUzI1Ni..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
              value={key}
              onChange={e => setKey(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} /> Hubungkan Sekarang
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-600 mt-8 font-bold uppercase tracking-tighter">
          Data kredensial disimpan secara lokal di browser Anda.
        </p>
      </div>
    </div>
  );
};
