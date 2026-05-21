
import React, { useState } from 'react';
import { Database, Link, Key, CheckCircle, ShieldAlert, ExternalLink, HelpCircle, ArrowRight, Info, Terminal } from 'lucide-react';

interface Props {
  onConnect: (url: string, key: string) => void;
}

export const DatabaseSetup: React.FC<Props> = ({ onConnect }) => {
  const [url, setUrl] = useState(() => {
    const disconnected = localStorage.getItem('SB_DISCONNECTED') === 'true';
    if (disconnected) return '';
    return localStorage.getItem('SB_URL') || '';
  });
  
  const [key, setKey] = useState(() => {
    const disconnected = localStorage.getItem('SB_DISCONNECTED') === 'true';
    if (disconnected) return '';
    return localStorage.getItem('SB_KEY') || '';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && key) {
      onConnect(url.trim(), key.trim());
    }
  };

  const handleUseDemoCredentials = () => {
    setUrl('https://bligotrxzpisallhqzgt.supabase.co');
    setKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWdvdHJ4enBpc2FsbGhxemd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTc1NjIsImV4cCI6MjA4NzIzMzU2Mn0.3Ny0P-S_HKFG3CXrLuwRfe4dgepzyjyhWVh2Ss_yiL0');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-5xl w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row">
        
        {/* Left Column: Extensive Step-by-Step Guide */}
        <div className="p-6 md:p-10 md:w-3/5 bg-slate-900/40 border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Panduan Database Supabase Baru</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-amber-500">100% Gratis & Sangat Mudah</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Karena project database demo sebelumnya tidak ditemukan atau bermasalah di bawah akun Anda, kami sangat menyarankan Anda untuk **membuat database gratis baru** di Supabase Anda sendiri dengan mengikuti 5 langkah mudah berikut:
            </p>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700 flex-none self-start mt-0.5">
                  1
                </span>
                <div className="text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wide mb-0.5">Daftar & Masuk ke Supabase</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Buka situs resmi dan masuk dengan akun GitHub Anda di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink size={10} /></a>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700 flex-none self-start mt-0.5">
                  2
                </span>
                <div className="text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wide mb-0.5">Buat Project Database Baru</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Klik tombol <strong className="text-white">"+ New Project"</strong>. Pilih Organisasi Anda, masukkan nama project (misal: <code className="text-blue-400 bg-blue-950/40 px-1 rounded">SIPD Lite</code>), buat Password Database baru Anda, dan tentukan pilihan server (misal: <strong className="text-slate-300">Singapore</strong>). Klik tombol <strong className="text-white">"Create new project"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700 flex-none self-start mt-0.5">
                  3
                </span>
                <div className="text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wide mb-0.5">Tunggu Project Aktif (1-2 Menit)</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Tunggu hingga proses pembuatan mesin server selesai. Jika sudah selesai, status panel project Anda akan berubah dari <strong className="text-yellow-500">"Setting up project"</strong> menjadi aktif.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700 flex-none self-start mt-0.5">
                  4
                </span>
                <div className="text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wide mb-0.5">Salin URL & API Keys Anda</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Masuk ke menu <strong className="text-white">Settings</strong> (ikon roda gerigi di kiri paling bawah) lalu pilih menu <strong className="text-white">API</strong>. Salin kolom <strong className="text-blue-300">Project URL</strong> dan kolom <strong className="text-blue-300">anon public key</strong> ke form di sebelah kanan.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700 flex-none self-start mt-0.5">
                  5
                </span>
                <div className="text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wide mb-0.5">Inisialisasi Tabel SQL Otomatis</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Setelah Anda menekan tombol <strong className="text-emerald-400">Hubungkan Sekarang</strong> di samping, aplikasi akan mendeteksi tabel kosong dan menyediakan skrip inisialisasi SQL instan yang tinggal Anda salin-tempel di menu <strong className="text-white">SQL Editor</strong> Supabase Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 bg-slate-950/20 p-4 rounded-2xl flex items-start gap-2.5">
            <Info size={16} className="text-amber-500 flex-none mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-normal">
              <strong>Catatan Keamanan:</strong> Kunci API dan URL disimpan sepenuhnya di dalam penyimpanan lokal browser (LocalStorage) milik Anda secara offline. Tidak ada data rahasia Anda yang dikirim ke server pihak ketiga manapun.
            </p>
          </div>
        </div>

        {/* Right Column: Connection Form Component */}
        <div className="p-6 md:p-10 md:w-2/5 bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="text-center md:text-left mb-8">
              <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5 mx-auto md:mx-0">
                <Database size={24} />
              </div>
              <h1 className="text-xl font-black text-white italic tracking-tighter">SIPD<span className="text-blue-500">LITE</span></h1>
              <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">Koneksi Database Utama</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Link size={12} /> Supabase Project URL
                </label>
                <input 
                  required
                  type="url"
                  placeholder="https://abcidxyz.supabase.co"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-slate-700"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Key size={12} /> Supabase Anon / Public Key
                </label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Masukkan anon public key (diawali eyJ...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono placeholder:text-slate-700 resize-none leading-relaxed"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={!url || !key}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 group mt-4 cursor-pointer disabled:cursor-not-allowed"
              >
                Hubungkan Sekarang <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-850">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-slate-500 text-center md:text-left font-medium">Bermasalah mendaftar? Anda dapat mencoba memuat ulang alamat demo bawaan sebagai rujukan cadangan:</p>
              <button 
                type="button" 
                onClick={handleUseDemoCredentials}
                className="text-slate-400 hover:text-white bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-slate-800 rounded-lg py-2 px-3 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Terminal size={11} className="text-blue-500" /> Gunakan Kredensial Demo Bawaan
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-slate-600 text-[9px] font-bold uppercase mt-6">
              <ShieldAlert size={10} /> Koneksi Langsung Mandiri & Aman
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
