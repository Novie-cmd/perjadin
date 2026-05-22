
import React, { useState } from 'react';
import { 
  Database, Link, Key, CheckCircle, ShieldAlert, ExternalLink, 
  HelpCircle, ArrowRight, Info, Terminal, Settings, Code, Copy, Eye, LayoutDashboard, FileSpreadsheet
} from 'lucide-react';

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

  const [guideTab, setGuideTab] = useState<'visual' | 'text'>('visual');
  const [simulatedCopied, setSimulatedCopied] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && key) {
      onConnect(url.trim(), key.trim());
    }
  };

  const handleUseDemoCredentials = () => {
    setUrl('https://vedbbnmdwnlvpwbsptiz.supabase.co');
    setKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZGJibm1kd25sdnB3YnNwdGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzA1OTIsImV4cCI6MjA5NDk0NjU5Mn0.gmX1XwA5wmT7WhmAivcowmuoBGXnm5O-Sf2vSLOfJMY');
  };

  const triggerSimulateCopy = (field: string, val: string) => {
    navigator.clipboard.writeText(val);
    setSimulatedCopied(field);
    setTimeout(() => setSimulatedCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-5xl w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row">
        
        {/* Left Column: Extensive Step-by-Step Guide with Tabs */}
        <div className="p-6 md:p-8 md:w-3/5 bg-slate-900/40 border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Panduan Mencari URL Supabase</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-amber-500">Sangat Mudah &amp; Cepat</p>
                </div>
              </div>

              {/* Guide Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button 
                  onClick={() => setGuideTab('visual')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${guideTab === 'visual' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white'}`}
                >
                  📍 Panduan Visual (Peta Screen)
                </button>
                <button 
                  onClick={() => setGuideTab('text')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${guideTab === 'text' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'text-slate-400 hover:text-white'}`}
                >
                  📝 Per Rute Menu
                </button>
              </div>
            </div>

            {guideTab === 'visual' ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Berikut adalah **simulasi gambar/panel** dashboard aslinya milik Supabase. Silakan ikuti petunjuk merah berkedip di bawah ini pada halaman Supabase milik Anda:
                </p>

                {/* Simulated Supabase Dashboard Screen Layout */}
                <div className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden text-[11px] text-slate-300 font-sans shadow-inner">
                  {/* Dashboard Header Bar */}
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>Supabase Dashboard</span>
                      <span className="text-slate-500 font-normal px-1">/</span>
                      <span className="text-slate-400 text-[10px] bg-slate-850 px-1.5 py-0.5 rounded border border-slate-750">your-project-id</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">https://supabase.com/dashboard/project/...</div>
                  </div>

                  {/* Dashboard Body Container */}
                  <div className="flex min-h-[290px]">
                    {/* Left Sidebar (Narrow icon strip) */}
                    <div className="w-11 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between items-center py-3 flex-none">
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="text-slate-600 hover:text-slate-400 transition cursor-default relative group" title="Home">
                          <LayoutDashboard size={14} />
                        </div>
                        <div className="text-slate-600 hover:text-slate-400 transition cursor-default" title="Table Editor">
                          <FileSpreadsheet size={14} />
                        </div>
                        <div className="text-slate-600 hover:text-slate-400 transition cursor-default" title="SQL Editor">
                          <Code size={14} />
                        </div>
                      </div>

                      {/* Settings Gear - CLICKABLE OR HIGHLIGHTED */}
                      <div className="relative group flex items-center justify-center">
                        {/* Outer Glow Ring pulsating to attract user attention */}
                        <span className="absolute inline-flex h-8 w-8 rounded-lg bg-red-500/20 animate-ping"></span>
                        <div className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center border border-dashed border-red-500/50 shadow-md cursor-help relative" title="LANGKAH 1: Klik ikon Gear ini!">
                          <Settings size={14} className="animate-spin duration-3000" />
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[7px] w-3.5 h-3.5 font-black flex items-center justify-center border border-slate-950 shadow">1</span>
                        </div>
                      </div>
                    </div>

                    {/* Left Settings Submenu Pane */}
                    <div className="w-32 bg-slate-900/40 border-r border-slate-800/80 p-2.5 flex-none flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-2 px-1">Settings</span>
                        <div className="space-y-1">
                          <div className="px-1.5 py-1 text-slate-500 hover:text-slate-400 rounded cursor-default font-medium text-[10px]">General</div>
                          <div className="px-1.5 py-1 text-slate-500 hover:text-slate-400 rounded cursor-default font-medium text-[10px]">Database</div>
                          
                          {/* API Menu Item HIGHLIGHTED */}
                          <div className="relative">
                            <div className="px-1.5 py-1 text-emerald-400 bg-emerald-500/10 border-l-2 border-emerald-500 font-bold rounded-r cursor-help text-[10px] flex items-center justify-between" title="LANGKAH 2: Pilih tab API">
                              <span>Plug API 🔌</span>
                              <span className="bg-red-600 text-white rounded-full text-[7px] w-3 h-3 font-bold flex items-center justify-center shadow">2</span>
                            </div>
                          </div>

                          <div className="px-1.5 py-1 text-slate-500 hover:text-slate-400 rounded cursor-default font-medium text-[10px]">Auth</div>
                          <div className="px-1.5 py-1 text-slate-500 hover:text-slate-400 rounded cursor-default font-medium text-[10px]">Storage</div>
                        </div>
                      </div>
                      <div className="text-[8px] text-slate-600 block px-1 text-center font-bold">API &amp; Keamanan</div>
                    </div>

                    {/* Main Settings Display Area (Simulated contents of Settings > API) */}
                    <div className="flex-1 p-4 bg-slate-950 overflow-y-auto space-y-4">
                      {/* Section 1: Project URL Box */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 relative group">
                        {/* Highlighter frame to attract visual interest */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl opacity-10 group-hover:opacity-20 transition blur"></div>
                        
                        <div className="relative">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 mb-1.5">
                            <span className="font-bold text-slate-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Project URL
                            </span>
                            <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md shadow-red-950/20">
                              3. SALIN KOLOM INI!
                            </span>
                          </div>
                          
                          <p className="text-[9px] text-slate-500 leading-tight mb-2">RESTful endpoint untuk tersambung ke aplikasi ini.</p>
                          
                          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2 overflow-hidden">
                            <code className="text-[10px] text-emerald-400 font-mono select-all truncate">https://your-project-id.supabase.co</code>
                            <button 
                              type="button"
                              onClick={() => triggerSimulateCopy('url', 'https://[ganti-dengan-id-project-anda].supabase.co')}
                              className="bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-750 font-bold text-[9px] flex items-center gap-1 transition-all"
                            >
                              <Copy size={10} /> {simulatedCopied === 'url' ? 'Salin!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Project API Keys Box */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-10 group-hover:opacity-15 transition blur"></div>
                        
                        <div className="relative">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 mb-1.5">
                            <span className="font-bold text-slate-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Project API Keys
                            </span>
                            <span className="text-[8px] bg-purple-500/20 text-purple-400 font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
                              Tipe: anon public
                            </span>
                          </div>
                          
                          <p className="text-[9px] text-slate-500 leading-tight mb-2">Digunakan untuk akses klien aman pada browser.</p>
                          
                          {/* Inner Table Key row */}
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-600 tracking-wider">
                              <span>Nama / Tipe</span>
                              <span className="text-red-400 flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-red-400 animate-pulse"></span> 4. SALIN KUNCI INI!</span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2 bg-slate-900/50 p-1.5 rounded-md border border-slate-850">
                              <div className="flex flex-col">
                                <span className="font-bold text-purple-400 text-[9px] font-mono">anon public</span>
                                <span className="text-[8px] text-slate-500">Aman untuk client-side</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <code className="text-[9px] text-slate-500 font-mono truncate max-w-[80px]">eyJhbGciOiJIUz...</code>
                                <button 
                                  type="button"
                                  onClick={() => triggerSimulateCopy('key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...contoh-key...')}
                                  className="bg-slate-850 hover:bg-slate-850/80 text-purple-400 hover:text-purple-300 px-2 py-0.5 rounded border border-slate-750 text-[9px] font-bold transition flex items-center gap-1"
                                >
                                  <Copy size={9} /> Copy
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-900/30 rounded-2xl p-3.5 flex gap-2.5">
                  <Info size={16} className="text-amber-500 flex-none mt-0.5 animate-bounce-slow" />
                  <p className="text-xs text-slate-300 leading-normal">
                    <strong>PENTING:</strong> Di halaman Supabase Anda, jika baru saja membuat project, harap tunggu 1-2 menit agar setup backend Supabase selesai, baru rute menu <strong>Settings (Ikon Gear)</strong> akan muncul lengkap di bagian kiri paling bawah!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 py-2">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Jika Anda lebih menyukai panduan bimbingan teks, silakan ikuti petunjuk rute menu berikut selangkah demi selangkah:
                </p>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700 flex-none self-start mt-0.5">
                      1
                    </span>
                    <div className="text-xs">
                      <h4 className="font-bold text-white uppercase tracking-wide mb-0.5">Daftar &amp; Masuk ke Supabase</h4>
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
                        Klik tombol <strong className="text-white animate-pulse">"+ New Project"</strong>. Tulis nama proyek Anda (contoh: <code className="text-blue-400 bg-blue-950/40 px-1 rounded">SIPD</code>) dan buat Kata Sandi Database baru yang aman. Tentukan wilayah regional server (misal: Singapore) untuk latency yang super cepat, lalu klik tombol <strong className="text-white">"Create new project"</strong>.
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
                        Tunggu hingga proses perakitan mesin server virtual selesai. Status indikasi kuning bertuliskan <strong className="text-yellow-500">"Setting up project"</strong> akan beralih menjadi hijau (Active/Selesai).
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center border border-slate-700 flex-none self-start mt-0.5">
                      4
                    </span>
                    <div className="text-xs">
                      <h4 className="font-bold text-white uppercase tracking-wide mb-0.5">Turuti Jalur Menu Settings di Pojok Kiri</h4>
                      <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 my-2 space-y-2">
                        <p className="font-bold text-amber-400 uppercase text-[9px] tracking-wider flex items-center gap-1">
                          📍 Rute Menu di Supabase:
                        </p>
                        <div className="font-mono text-[10px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-slate-850 px-1.5 py-0.5 rounded border border-slate-750">⚙️ Project Settings</span>
                          <span>➔</span>
                          <span className="bg-slate-855 px-1.5 py-0.5 rounded border border-slate-750 text-emerald-400">🔌 API</span>
                        </div>
                        <ul className="list-disc pl-4 text-slate-400 text-[11px] space-y-1 mt-1 leading-normal">
                          <li>Salin teks di kolom <strong className="text-blue-300">Project URL</strong> (contoh: <code className="text-[10px] text-emerald-400">https://xxxx.supabase.co</code>)</li>
                          <li>Salin teks di bawah <strong className="text-blue-300">Project API Keys</strong> yang bernama <span className="text-purple-400 font-bold">anon / public</span> (diawali <code className="text-[10px]">eyJ...</code>)</li>
                        </ul>
                      </div>
                      <p className="text-slate-400 leading-relaxed font-semibold mt-2 text-slate-300">
                        Tempelkan kedua nilai tersebut ke kotak input formulir di sebelah kanan layar ini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 bg-slate-950/20 p-4 rounded-2xl flex items-start gap-2.5">
            <Info size={16} className="text-amber-500 flex-none mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-normal">
              <strong>Catatan Keamanan:</strong> Kunci API dan URL disimpan sepenuhnya di dalam penyimpanan lokal browser (LocalStorage) milik Anda secara offline. Tidak ada data rahasia Anda yang dikirim ke server pihak ketiga manapun.
            </p>
          </div>
        </div>

        {/* Right Column: Connection Form Component */}
        <div className="p-6 md:p-8 md:w-2/5 bg-slate-900 flex flex-col justify-between">
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
              <ShieldAlert size={10} /> Koneksi Langsung Mandiri &amp; Aman
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
