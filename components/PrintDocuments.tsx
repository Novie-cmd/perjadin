
import React from 'react';
import { TravelAssignment, Employee, SKPDConfig, Official, DestinationOfficial } from '../types';
import { numberToWords, formatDateID, formatNumber } from '../utils';

interface Props {
  assignment: TravelAssignment;
  employees: Employee[];
  skpd: SKPDConfig;
  officials: Official[];
  destinationOfficials: DestinationOfficial[];
}

const DEFAULT_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Logo_Provinsi_Nusa_Tenggara_Barat.png/300px-Logo_Provinsi_Nusa_Tenggara_Barat.png";

const Header: React.FC<{ skpd: SKPDConfig }> = ({ skpd }) => {
  const provinsiValue = skpd.provinsi?.trim() || '';
  const displayProvinsiBaris1 = provinsiValue || "PROVINSI NUSA TENGGARA BARAT";
  const isProvInName = provinsiValue && (
    skpd.namaSkpd.toUpperCase().includes(provinsiValue.toUpperCase()) ||
    skpd.namaSkpd.toUpperCase().includes(provinsiValue.toUpperCase().replace('PROVINSI ', 'PROV. '))
  );
  
  const nameLen = skpd.namaSkpd.length;
  let skpdFontSize = 'text-[20pt]';
  if (nameLen > 55) skpdFontSize = 'text-[14pt]';
  else if (nameLen > 40) skpdFontSize = 'text-[17pt]';

  return (
    <div className="text-center mb-4 font-['Tahoma']">
      <div className="flex items-center justify-between gap-6 pb-2">
        <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
          <img src={skpd.logo || DEFAULT_LOGO} alt="Logo" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 px-2">
          <h3 className="text-[14pt] font-normal uppercase whitespace-nowrap leading-tight">Pemerintah {displayProvinsiBaris1}</h3>
          <h2 className={`${skpdFontSize} font-bold uppercase whitespace-nowrap leading-tight mt-1 mb-0.5`}>{skpd.namaSkpd}</h2>
          {provinsiValue && !isProvInName && (
            <h2 className={`${skpdFontSize} font-bold uppercase whitespace-nowrap leading-tight mb-1`}>{provinsiValue.toUpperCase()}</h2>
          )}
          <p className="text-[10pt] font-normal leading-tight mt-1">{skpd.alamat}</p>
          {skpd.lokasi && <p className="text-[10pt] font-bold uppercase tracking-tight mt-0.5">{skpd.lokasi}</p>}
        </div>
        <div className="w-24 h-24 flex-shrink-0 opacity-0">Logo</div>
      </div>
      <div className="border-b-[2.5pt] border-black mt-1"></div>
      <div className="border-b-[0.5pt] border-black mt-[1.5pt]"></div>
    </div>
  );
};

const getSignatories = (assignment: TravelAssignment, officials: Official[], skpd: SKPDConfig) => {
  const formatFallbackJabatan = () => {
    const prefix = skpd.kepalaJabatan.toUpperCase();
    const name = skpd.namaSkpd.toUpperCase();
    const typeOnly = prefix.replace('KEPALA ', '');
    return name.startsWith(typeOnly) ? `KEPALA ${name}` : `${prefix} ${name}`;
  };

  const kepala = officials.find(o => o.id === assignment.signerId) || { 
    name: skpd.kepalaNama, 
    nip: skpd.kepalaNip, 
    jabatan: formatFallbackJabatan()
  };
  const pptk = officials.find(o => o.id === assignment.pptkId) || { 
    name: skpd.pptkNama, 
    nip: skpd.pptkNip, 
    jabatan: 'Pejabat Pelaksana Teknis Kegiatan' 
  };
  const bendahara = officials.find(o => o.id === assignment.bendaharaId) || { 
    name: skpd.bendaharaNama, 
    nip: skpd.bendaharaNip, 
    jabatan: 'Bendahara Pengeluaran' 
  };
  return { kepala, pptk, bendahara };
};

export const PejabatTujuanTemplate: React.FC<Props> = ({ assignment, destinationOfficials }) => {
  const destId = (assignment.destinationOfficialIds || [])[0];
  const destOff = destinationOfficials.find(o => o.id === destId);

  if (!destOff) {
    return (
      <div className="print-page bg-white p-12 text-center text-slate-400 font-bold">
        Pilih Pejabat Tujuan terlebih dahulu pada menu Pencetakan.
      </div>
    );
  }

  return (
    <div className="print-page bg-white font-['Tahoma'] text-black p-[20mm] flex items-center justify-center">
      {/* Layout kotak kecil persis ukuran satu blok di SPD BELAKANG */}
      <div className="w-[100mm] border border-black p-4 space-y-0 text-[11pt]">
        <div className="grid grid-cols-[100px_10px_1fr] leading-normal">
          <span>Tiba di</span><span>:</span><span className="font-bold">{assignment.destination}</span>
          <span>Pada tanggal</span><span>:</span><span className="font-bold">{formatDateID(assignment.startDate)}</span>
          <span className="align-top">Kepala</span><span className="align-top">:</span>
          <div className="flex flex-col">
            <span className="uppercase font-bold">{destOff.jabatan}</span>
            <span className="font-bold uppercase leading-tight">{destOff.instansi}</span>
          </div>
        </div>
        <div className="h-16"></div>
        <div className="text-center pl-10">
          <p className="font-bold underline uppercase text-[12pt]">{destOff.name}</p>
          <p className="text-[11pt]">NIP. {destOff.nip}</p>
        </div>
      </div>
    </div>
  );
};

export const SPTTemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const selectedEmps = assignment.selectedEmployeeIds.map(id => employees.find(e => e.id === id)).filter((e): e is Employee => !!e);
  const { kepala } = getSignatories(assignment, officials, skpd);

  return (
    <div className="print-page bg-white font-['Tahoma'] text-black leading-tight text-[11pt]">
      <Header skpd={skpd} />
      <div className="text-center mb-6">
        <h2 className="text-[12pt] font-bold underline uppercase decoration-1 underline-offset-2">Surat Tugas</h2>
        <p className="font-medium">Nomor : {assignment.assignmentNumber}</p>
      </div>

      <table className="w-full mb-4">
        <tbody className="align-top">
          <tr>
            <td className="w-16 py-1">Dasar</td>
            <td className="w-4 py-1 text-center">:</td>
            <td className="py-1">
              <div className="flex gap-2 mb-1">
                <span>1.</span>
                <span className="text-justify">Keputusan Gubernur Nusa Tenggara Barat Nomor: 34 Tahun 2018 Tentang Perubahan Keempat Atas Peraturan Gubernur Nomor: 1 Tahun 2015 tentang Biaya Perjalanan Dinas di lingkungan Pemerintah Provinsi Nusa Tenggara Barat.</span>
              </div>
              <div className="flex gap-2">
                <span>2.</span>
                <span className="text-justify">Peraturan Gubernur Nusa Tenggara Barat Nomor: 81 Tahun 2020 Tentang Perjalanan Dinas.</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="text-center font-bold mb-4 tracking-widest">MEMERINTAHKAN :</div>

      <table className="w-full mb-4">
        <tbody className="align-top">
          <tr>
            <td className="w-24 py-1 font-bold">Kepada</td>
            <td className="w-4 py-1 text-center">:</td>
            <td className="py-1">
              {selectedEmps.map((emp, i) => (
                <div key={emp.id} className="grid grid-cols-[25px_110px_10px_1fr] mb-3 last:mb-0">
                  <span className="font-bold">{i + 1}.</span>
                  <span>Nama</span><span>:</span><span className="font-bold">{emp.name}</span>
                  <span></span><span>Pangkat / Gol.</span><span>:</span><span>{emp.pangkatGol}</span>
                  <span></span><span>NIP</span><span>:</span><span>{emp.nip}</span>
                  <span></span><span>Jabatan</span><span>:</span><span>{emp.jabatan}</span>
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td className="py-2 font-bold">Untuk</td>
            <td className="text-center">:</td>
            <td className="py-2 text-justify">{assignment.purpose}</td>
          </tr>
          <tr>
            <td className="py-1 font-bold">Tanggal</td>
            <td className="text-center">:</td>
            <td className="py-1">{formatDateID(assignment.startDate)} s.d {formatDateID(assignment.endDate)} ({assignment.durationDays} Hari)</td>
          </tr>
          <tr>
            <td className="py-1 font-bold">Daerah Tujuan</td>
            <td className="text-center">:</td>
            <td className="py-1">{assignment.destination}</td>
          </tr>
          <tr>
            <td className="py-1 font-bold">Biaya</td>
            <td className="text-center">:</td>
            <td className="py-1">Dibebankan pada DPA {skpd.namaSkpd} Nomor: {assignment.subActivityCode}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-12 flex justify-end">
        <div className="w-[320px] text-left pl-4">
          <p>Ditetapkan di {skpd.lokasi || 'Mataram'}</p>
          <p className="mb-4">Pada Tanggal {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p>
          <div className="min-h-[60px]">
            <p className="font-bold uppercase leading-tight">{kepala.jabatan}</p>
          </div>
          <div className="h-16"></div>
          <p className="font-bold underline uppercase">{kepala.name}</p>
          <p>NIP. {kepala.nip}</p>
        </div>
      </div>
    </div>
  );
};

export const SPPDFrontTemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const { kepala } = getSignatories(assignment, officials, skpd);
  const firstEmp = employees.find(e => e.id === assignment.selectedEmployeeIds[0]);

  return (
    <div className="print-page bg-white font-['Tahoma'] text-black leading-tight text-[11pt] p-[15mm] border border-black relative">
      <Header skpd={skpd} />
      <div className="flex justify-end mb-2">
        <div className="w-1/2 text-[10pt]">
          <div className="grid grid-cols-[80px_10px_1fr]"><span>Lembar Ke</span><span>:</span><span></span></div>
          <div className="grid grid-cols-[80px_10px_1fr]"><span>Kode No</span><span>:</span><span></span></div>
          <div className="grid grid-cols-[80px_10px_1fr]"><span>Nomor</span><span>:</span><span>{assignment.assignmentNumber}</span></div>
        </div>
      </div>
      <div className="text-center mb-4"><h2 className="text-[13pt] font-bold underline uppercase">SURAT PERJALANAN DINAS (SPD)</h2></div>
      <table className="w-full border-collapse border border-black text-[11pt]">
        <tbody>
          <tr>
            <td className="border border-black p-1 w-8 text-center align-top">1.</td>
            <td className="border border-black p-1 w-1/2 align-top">Pejabat Pembuat Komitmen</td>
            <td className="border border-black p-1 align-top">{kepala.jabatan}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">2.</td>
            <td className="border border-black p-1 align-top">Nama pegawai yang diperintah</td>
            <td className="border border-black p-1 font-bold align-top">{firstEmp?.name}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">3.</td>
            <td className="border border-black p-1 align-top">a. Pangkat dan Golongan<br/>b. Jabatan / Instansi<br/>c. Tingkat Biaya Perjalanan Dinas</td>
            <td className="border border-black p-1 align-top">a. {firstEmp?.pangkatGol}<br/>b. {firstEmp?.jabatan}<br/>c. </td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">4.</td>
            <td className="border border-black p-1 align-top">Maksud Perjalanan Dinas</td>
            <td className="border border-black p-1 align-top">{assignment.purpose}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">5.</td>
            <td className="border border-black p-1 align-top">Alat angkut yang dipergunakan</td>
            <td className="border border-black p-1 align-top">{assignment.transportation}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">6.</td>
            <td className="border border-black p-1 align-top">a. Tempat berangkat<br/>b. Tempat tujuan</td>
            <td className="border border-black p-1 align-top">a. {assignment.origin}<br/>b. {assignment.destination}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">7.</td>
            <td className="border border-black p-1 align-top">a. Lamanya Perjalanan Dinas<br/>b. Tanggal berangkat<br/>c. Tanggal harus kembali/tiba di tempat baru</td>
            <td className="border border-black p-1 align-top">a. {assignment.durationDays} ( {numberToWords(assignment.durationDays)} ) Hari<br/>b. {formatDateID(assignment.startDate)}<br/>c. {formatDateID(assignment.endDate)}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">8.</td>
            <td className="border border-black p-1 align-top">Pengikut : Nama</td>
            <td className="border border-black p-1 align-top">{assignment.selectedEmployeeIds.slice(1).map((id, idx) => (<div key={id}>{idx + 1}. {employees.find(e => e.id === id)?.name}</div>))}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">9.</td>
            <td className="border border-black p-1 align-top">Pembebanan Anggaran<br/>a. Instansi<br/>b. Akun</td>
            <td className="border border-black p-1 align-top"><br/>a. {skpd.namaSkpd}<br/>b. {assignment.subActivityCode}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">10.</td>
            <td className="border border-black p-1 align-top">Keterangan lain-lain</td>
            <td className="border border-black p-1 align-top"></td>
          </tr>
        </tbody>
      </table>
      <div className="mt-8 grid grid-cols-2 text-[11pt]">
        <div></div>
        <div className="text-left pl-12">
          <p>Dikeluarkan di : {skpd.lokasi || 'Mataram'}</p>
          <p className="mb-4">Pada Tanggal : {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p>
          <div className="min-h-[50px]"><p className="font-bold uppercase leading-tight">{kepala.jabatan}</p></div>
          <div className="h-16"></div>
          <p className="font-bold underline uppercase">{kepala.name}</p>
          <p>NIP. {kepala.nip}</p>
        </div>
      </div>
    </div>
  );
};

export const SPPDBackTemplate: React.FC<{ 
  assignment: TravelAssignment; 
  skpd: SKPDConfig; 
  officials: Official[];
  destinationOfficials: DestinationOfficial[];
}> = ({ assignment, skpd, officials, destinationOfficials }) => {
  const { kepala, pptk } = getSignatories(assignment, officials, skpd);
  const destIds = assignment.destinationOfficialIds || [];
  const getDestOfficial = (index: number) => {
    const id = destIds[index];
    return destinationOfficials.find(o => o.id === id);
  };

  return (
    <div className="print-page bg-white font-['Tahoma'] text-[11pt] border border-black p-[15mm] relative leading-tight">
      <div className="flex justify-end">
        <div className="w-[300px] space-y-0.5 mb-4">
          <div className="grid grid-cols-[100px_10px_1fr]"><span>SPPD No.</span><span>:</span><span>{assignment.assignmentNumber}</span></div>
          <div className="grid grid-cols-[100px_10px_1fr]"><span>Berangkat dari</span><span>:</span><span>{assignment.origin}</span></div>
          <div className="grid grid-cols-[100px_10px_1fr]"><span>Pada tanggal</span><span>:</span><span>{formatDateID(assignment.startDate)}</span></div>
          <div className="grid grid-cols-[100px_10px_1fr]"><span>Ke</span><span>:</span><span>{assignment.destination}</span></div>
          <div className="pt-4 text-center">
            <p className="font-bold">{pptk.jabatan}</p>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{pptk.name}</p>
            <p>NIP. {pptk.nip}</p>
          </div>
        </div>
      </div>

      <div className="space-y-0 border-t border-black">
        {['II', 'III', 'IV'].map((id, idx) => {
          const destOff = getDestOfficial(idx);
          const isFilled = !!destOff;
          return (
            <div key={id} className="grid grid-cols-2 border-b border-black">
              <div className="border-r border-black p-2 min-h-[180px]">
                <div className="grid grid-cols-[20px_90px_10px_1fr] gap-x-0.5">
                  <span className="font-bold">{id}.</span>
                  <span>Tiba di</span><span>:</span><span>{idx === 0 ? assignment.destination : ''}</span>
                  <span></span><span>Pada tanggal</span><span>:</span><span>{idx === 0 ? formatDateID(assignment.startDate) : ''}</span>
                  <span></span><span className="align-top">Kepala</span><span className="align-top">:</span>
                  <div className="flex flex-col">
                    <span className="uppercase">{destOff?.jabatan || ''}</span>
                    <span className="font-bold uppercase leading-tight">{destOff?.instansi || ''}</span>
                  </div>
                </div>
                {isFilled && (<div className="mt-8 text-center pl-10"><div className="h-12"></div><p className="font-bold underline uppercase">{destOff.name}</p><p>NIP. {destOff.nip}</p></div>)}
              </div>
              <div className="p-2 min-h-[180px]">
                <div className="grid grid-cols-[90px_10px_1fr] gap-x-0.5">
                  <span>Berangkat dari</span><span>:</span><span>{idx === 0 ? assignment.destination : ''}</span>
                  <span>Ke</span><span>:</span><span>{idx === 0 ? (skpd.lokasi || 'Mataram') : ''}</span>
                  <span>Pada tanggal</span><span>:</span><span>{idx === 0 ? formatDateID(assignment.endDate) : ''}</span>
                  <span className="align-top">Kepala</span><span className="align-top">:</span>
                  <div className="flex flex-col">
                    <span className="uppercase">{destOff?.jabatan || ''}</span>
                    <span className="font-bold uppercase leading-tight">{destOff?.instansi || ''}</span>
                  </div>
                </div>
                {isFilled && (<div className="mt-8 text-center pl-10"><div className="h-12"></div><p className="font-bold underline uppercase">{destOff.name}</p><p>NIP. {destOff.nip}</p></div>)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <p className="text-justify leading-relaxed">V. Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.</p>
        <div className="grid grid-cols-2 mt-4">
          <div></div>
          <div className="text-center">
            <div className="min-h-[50px]"><p className="font-bold uppercase leading-tight">{kepala.jabatan}</p></div>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{kepala.name}</p>
            <p>NIP. {kepala.nip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LampiranIIITemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const { kepala, bendahara } = getSignatories(assignment, officials, skpd);
  return (
    <div className="space-y-8 font-['Tahoma']">
      {assignment.costs.map((cost) => {
        const emp = employees.find(e => e.id === cost.employeeId);
        if (!emp) return null;
        const subTotalDaily = (cost.dailyAllowance || 0) * (cost.dailyDays || 0);
        const subTotalLodging = (cost.lodging || 0) * (cost.lodgingDays || 0);
        const subTotalTransport = (cost.transportBbm || 0) + (cost.seaTransport || 0) + (cost.airTransport || 0) + (cost.taxi || 0);
        const subTotalRepres = (cost.representation || 0) * (cost.representationDays || 0);
        const grandTotal = subTotalDaily + subTotalLodging + subTotalTransport + subTotalRepres;

        return (
          <div key={cost.employeeId} className="print-page bg-white text-[11pt] p-[15mm] leading-tight">
             <div className="text-center mb-6"><h2 className="text-[12pt] font-bold underline uppercase">RINCIAN BIAYA TRANSPORT</h2></div>
             <div className="mb-4">
                <div className="grid grid-cols-[160px_10px_1fr]"><span>Lampiran SPPD Nomor</span><span>:</span><span>{assignment.assignmentNumber}</span></div>
                <div className="grid grid-cols-[160px_10px_1fr]"><span>Tanggal</span><span>:</span><span>{formatDateID(assignment.signDate)}</span></div>
             </div>
             <table className="w-full border-collapse border border-black mb-2 text-[11pt]">
                <thead className="text-center font-bold">
                  <tr><th className="border border-black p-1 w-10">No.</th><th className="border border-black p-1">Perincian Biaya</th><th className="border border-black p-1 w-36">Jumlah</th><th className="border border-black p-1 w-36">Keterangan</th></tr>
                </thead>
                <tbody>
                  <tr><td className="border border-black p-1 text-center align-top">1</td><td className="border border-black p-1">Transportasi<br/>- Transport BBM / Umum (PP)<br/>- Transport Lokal / Taksi</td><td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalTransport)}</td><td className="border border-black p-1"></td></tr>
                  <tr><td className="border border-black p-1 text-center align-top">2</td><td className="border border-black p-1">Biaya penginapan</td><td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalLodging)}</td><td className="border border-black p-1"></td></tr>
                  <tr><td className="border border-black p-1 text-center align-top">3</td><td className="border border-black p-1">Uang Harian Golongan {emp.pangkatGol.split('(')[1]?.replace(')', '') || ''}<br/>- Uang Harian ({cost.dailyDays || 0} Hari x Rp. {formatNumber(cost.dailyAllowance || 0)})</td><td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalDaily)}</td><td className="border border-black p-1"></td></tr>
                  <tr><td className="border border-black p-1 text-center align-top">4</td><td className="border border-black p-1">Uang Representasi ({cost.representationDays || 0} Hari x Rp. {formatNumber(cost.representation || 0)})</td><td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalRepres)}</td><td className="border border-black p-1"></td></tr>
                  <tr className="font-bold"><td colSpan={2} className="border border-black p-1 text-center">Jumlah</td><td className="border border-black p-1 text-right">Rp. {formatNumber(grandTotal)}</td><td className="border border-black p-1"></td></tr>
                </tbody>
             </table>
             <div className="italic mb-8 uppercase font-bold text-[10pt]">//// {numberToWords(grandTotal)} Rupiah ////</div>
             <div className="grid grid-cols-2 gap-4 text-center mb-8">
               <div>
                  <p>Telah dibayar sejumlah :</p><p className="mb-1">Rp. {formatNumber(grandTotal)}</p>
                  <div className="min-h-[40px]"><p className="font-bold">{bendahara.jabatan},</p></div>
                  <div className="h-16"></div><p className="font-bold underline uppercase">{bendahara.name}</p><p>NIP. {bendahara.nip}</p>
               </div>
               <div>
                  <p>{skpd.lokasi || 'Mataram'}, {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p><p>Telah menerima jumlah uang sebesar :</p><p className="mb-1">Rp. {formatNumber(grandTotal)}</p>
                  <div className="min-h-[40px]"><p className="font-bold">Yang menerima,</p></div>
                  <div className="h-16"></div><p className="font-bold underline uppercase">{emp.name}</p><p>NIP. {emp.nip}</p>
               </div>
             </div>
             <div className="border-t border-black pt-4">
                <p className="text-center font-bold mb-4 uppercase">PERHITUNGAN SPD RAMPUNG</p>
                <div className="flex justify-center"><div className="w-1/2 space-y-1"><div className="grid grid-cols-[180px_10px_1fr]"><span>Ditetapkan sejumlah</span><span>:</span><span>Rp. {formatNumber(grandTotal)}</span></div><div className="grid grid-cols-[180px_10px_1fr]"><span>Yang telah dibayar semula</span><span>:</span><span>Rp. {formatNumber(grandTotal)}</span></div><div className="grid grid-cols-[180px_10px_1fr] border-t border-black"><span>Sisa kurang/lebih</span><span>:</span><span>Rp. -</span></div></div></div>
                <div className="mt-4 text-center pl-48"><p className="font-bold">Mengetahui/Menyetujui :</p><div className="min-h-[50px]"><p className="font-bold uppercase leading-tight">{kepala.jabatan}</p></div><div className="h-16"></div><p className="font-bold underline uppercase">{kepala.name}</p><p>NIP. {kepala.nip}</p></div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

export const KuitansiTemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const { kepala, bendahara, pptk } = getSignatories(assignment, officials, skpd);
  const totalAll = assignment.costs.reduce((sum, cost) => {
    const daily = (cost.dailyAllowance || 0) * (cost.dailyDays || 0);
    const lodging = (cost.lodging || 0) * (cost.lodgingDays || 0);
    const transport = (cost.transportBbm || 0) + (cost.seaTransport || 0) + (cost.airTransport || 0) + (cost.taxi || 0);
    const repres = (cost.representation || 0) * (cost.representationDays || 0);
    return sum + daily + lodging + transport + repres;
  }, 0);
  const firstEmp = employees.find(e => e.id === assignment.selectedEmployeeIds[0]);

  return (
    <div className="print-page bg-white font-['Tahoma'] text-[11pt] border border-black p-[15mm] leading-tight">
      <Header skpd={skpd} />
      <div className="flex justify-end mb-4"><div className="border border-black p-2 w-[280px] space-y-1 text-[10pt]"><div className="grid grid-cols-[100px_10px_1fr]"><span>Kode Kegiatan</span><span>:</span><span>{assignment.subActivityCode}</span></div><div className="grid grid-cols-[100px_10px_1fr]"><span>Dibukukan Tgl.</span><span>:</span><span></span></div><div className="grid grid-cols-[100px_10px_1fr]"><span>Nomor Buku</span><span>:</span><span></span></div><div className="grid grid-cols-[100px_10px_1fr]"><span>Sumber Dana</span><span>:</span><span></span></div></div></div>
      <div className="text-center mb-8"><h1 className="text-xl font-bold underline uppercase tracking-[0.2em]">KUITANSI</h1></div>
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-[160px_10px_1fr]"><span>Terima dari</span><span>:</span><span className="font-bold uppercase leading-tight">{kepala.jabatan}</span></div>
        <div className="grid grid-cols-[160px_10px_1fr] italic"><span>Banyaknya</span><span>:</span><span className="font-bold">//// {numberToWords(totalAll)} Rupiah ////</span></div>
        <div className="grid grid-cols-[160px_10px_1fr]"><span>Untuk Pembayaran</span><span>:</span><span className="text-justify leading-relaxed">Belanja Perjalanan Dinas Dalam Daerah ke {assignment.destination} selama {assignment.durationDays} hari dalam rangka {assignment.purpose} sesuai Surat Perintah Tugas {kepala.jabatan} Nomor : {assignment.assignmentNumber} tanggal {formatDateID(assignment.signDate)} a.n. {firstEmp?.name}</span></div>
      </div>
      <div className="border-t-2 border-b-2 border-black py-2 mb-8 flex items-center px-4 gap-4"><span className="font-bold">Terbilang :</span><span className="font-bold text-lg">Rp. {formatNumber(totalAll)}</span></div>
      <div className="grid grid-cols-3 gap-2 text-center text-[10pt] mb-8">
        <div className="flex flex-col"><p>Menyetujui :</p><div className="h-[85px] flex items-start justify-center overflow-hidden"><p className="font-bold uppercase leading-tight">{kepala.jabatan}</p></div><div className="h-10"></div><div className="mt-auto"><p className="font-bold underline uppercase">{kepala.name}</p><p>NIP. {kepala.nip}</p></div></div>
        <div className="flex flex-col"><p>Lunas dibayar :</p><div className="h-[85px] flex items-start justify-center overflow-hidden"><p className="font-bold uppercase">{bendahara.jabatan}</p></div><div className="h-10"></div><div className="mt-auto"><p className="font-bold underline uppercase">{bendahara.name}</p><p>NIP. {bendahara.nip}</p></div></div>
        <div className="flex flex-col"><p>{skpd.lokasi || 'Mataram'}, {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p><div className="h-[85px] flex items-start justify-center overflow-hidden"><p className="font-bold uppercase">Yang menerima uang,</p></div><div className="h-10"></div><div className="mt-auto"><p className="font-bold underline uppercase">{firstEmp?.name}</p><p>NIP. {firstEmp?.nip}</p></div></div>
      </div>
      <div className="text-center mt-4 flex flex-col items-center"><p>Mengetahui,</p><div className="h-[50px] flex items-start justify-center"><p className="font-bold uppercase leading-tight">{pptk.jabatan}</p></div><div className="h-16"></div><p className="font-bold underline uppercase">{pptk.name}</p><p>NIP. {pptk.nip}</p></div>
    </div>
  );
};

export const DaftarPenerimaanTemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const { kepala, bendahara } = getSignatories(assignment, officials, skpd);
  const totalAll = assignment.costs.reduce((sum, cost) => {
    const daily = (cost.dailyAllowance || 0) * (cost.dailyDays || 0);
    const lodging = (cost.lodging || 0) * (cost.lodgingDays || 0);
    const transport = (cost.transportBbm || 0) + (cost.seaTransport || 0) + (cost.airTransport || 0) + (cost.taxi || 0);
    const repres = (cost.representation || 0) * (cost.representationDays || 0);
    return sum + daily + lodging + transport + repres;
  }, 0);

  return (
    <div className="landscape-page bg-white font-['Tahoma'] text-[11pt] leading-tight">
       <div className="text-center mb-6"><p className="font-bold uppercase">Daftar Penerimaan Uang Perjalanan Dinas Ke {assignment.destination} Dalam Rangka {assignment.purpose}</p><p className="font-bold">Nomor : {assignment.assignmentNumber} Tanggal {formatDateID(assignment.signDate)}</p></div>
       <table className="w-full border-collapse border border-black mb-2 text-[10pt]">
          <thead className="text-center font-bold bg-slate-50"><tr><th className="border border-black p-1 w-8">No</th><th className="border border-black p-1 w-64">Nama</th><th className="border border-black p-1 w-16">Gol</th><th className="border border-black p-1">Lumpsum</th><th className="border border-black p-1">Akomodasi</th><th className="border border-black p-1">Transportasi</th><th className="border border-black p-1">Representasi</th><th className="border border-black p-1 w-32">Jumlah</th><th className="border border-black p-1 w-40">Tanda Tangan</th></tr></thead>
          <tbody>
            {assignment.costs.map((cost, i) => {
              const emp = employees.find(e => e.id === cost.employeeId);
              const daily = (cost.dailyAllowance || 0) * (cost.dailyDays || 0);
              const lodging = (cost.lodging || 0) * (cost.lodgingDays || 0);
              const transport = (cost.transportBbm || 0) + (cost.seaTransport || 0) + (cost.airTransport || 0) + (cost.taxi || 0);
              const repres = (cost.representation || 0) * (cost.representationDays || 0);
              const total = daily + lodging + transport + repres;
              return (<tr key={cost.employeeId}><td className="border border-black p-1 text-center">{i + 1}</td><td className="border border-black p-1">{emp?.name}</td><td className="border border-black p-1 text-center">{emp?.pangkatGol.split('(')[1]?.replace(')', '') || ''}</td><td className="border border-black p-1 text-center">{cost.dailyDays || 0} hr x Rp {formatNumber(cost.dailyAllowance || 0)}</td><td className="border border-black p-1 text-center">{cost.lodgingDays || 0} hr x Rp {formatNumber(cost.lodging || 0)}</td><td className="border border-black p-1 text-center">Rp {formatNumber(transport)}</td><td className="border border-black p-1 text-center">Rp {formatNumber(repres)}</td><td className="border border-black p-1 text-right font-bold">Rp {formatNumber(total)}</td><td className="border border-black p-1 relative min-h-[30px]"><span className={`absolute ${i % 2 === 0 ? 'left-1' : 'right-4'} top-1 font-bold`}>{i + 1}.</span></td></tr>);
            })}
          </tbody>
          <tfoot className="font-bold"><tr><td colSpan={7} className="border border-black p-1 text-center uppercase">Jumlah Total</td><td className="border border-black p-1 text-right">Rp {formatNumber(totalAll)}</td><td className="border border-black p-1"></td></tr></tfoot>
       </table>
       <div className="mb-8 mt-2 pl-1"><p className="font-bold italic text-[10pt]">Terbilang : Rp. {formatNumber(totalAll)} ( {numberToWords(totalAll)} Rupiah )</p></div>
       <div className="grid grid-cols-2 text-center mt-4 text-[11pt]">
          <div className="pl-12"><p>Mengetahui/Menyetujui :</p><div className="min-h-[50px]"><p className="font-bold uppercase leading-tight">{kepala.jabatan}</p></div><div className="h-16"></div><p className="font-bold underline uppercase">{kepala.name}</p><p>NIP. {kepala.nip}</p></div>
          <div className="pr-12"><p>{skpd.lokasi || 'Mataram'}, {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p><div className="min-h-[50px]"><p className="font-bold uppercase mb-4">{bendahara.jabatan}</p></div><div className="h-16"></div><p className="font-bold underline uppercase">{bendahara.name}</p><p>NIP. {bendahara.nip}</p></div>
       </div>
    </div>
  );
};
