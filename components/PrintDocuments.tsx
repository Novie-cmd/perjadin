
import React from 'react';
import { TravelAssignment, Employee, PrintType, SKPDConfig, Official, DestinationOfficial } from '../types';
import { formatCurrency, numberToWords, formatDateID, formatNumber } from '../utils';

interface Props {
  assignment: TravelAssignment;
  employees: Employee[];
  skpd: SKPDConfig;
  officials: Official[];
  destinationOfficials: DestinationOfficial[];
}

const DEFAULT_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Logo_Provinsi_Nusa_Tenggara_Barat.png/300px-Logo_Provinsi_Nusa_Tenggara_Barat.png";

const Header: React.FC<{ skpd: SKPDConfig }> = ({ skpd }) => (
  <div className="text-center mb-4 font-['Tahoma']">
    <div className="flex items-center justify-between gap-6 pb-2">
      <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
        <img src={skpd.logo || DEFAULT_LOGO} alt="Logo" className="max-w-full max-h-full object-contain" />
      </div>
      <div className="flex-1">
        <h3 className="text-[12pt] font-bold uppercase leading-tight">Pemerintah {skpd.provinsi}</h3>
        <h2 className="text-[14pt] font-extrabold uppercase leading-tight my-1">{skpd.namaSkpd}</h2>
        <p className="text-[10pt] leading-tight mt-1">{skpd.alamat}</p>
        <p className="text-[10pt] font-bold uppercase tracking-tight">MATARAM</p>
      </div>
      <div className="w-24 h-24 flex-shrink-0 opacity-0">Logo</div>
    </div>
    <div className="border-b-[2.5pt] border-black mt-1"></div>
    <div className="border-b-[0.5pt] border-black mt-[1.5pt]"></div>
  </div>
);

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

export const SPTTemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const selectedEmps = assignment.selectedEmployeeIds.map(id => employees.find(e => e.id === id)).filter((e): e is Employee => !!e);
  const { kepala } = getSignatories(assignment, officials, skpd);

  return (
    <div className="print-page bg-white font-['Tahoma'] text-black leading-tight text-[11pt]">
      <Header skpd={skpd} />
      <div className="text-center mb-6">
        <h2 className="text-[12pt] font-bold underline uppercase decoration-1 underline-offset-2">Surat Perintah Tugas</h2>
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
          <p>Ditetapkan di Mataram</p>
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
          <div className="grid grid-cols-[80px_10px_1fr]">
            <span>Lembar Ke</span><span>:</span><span></span>
          </div>
          <div className="grid grid-cols-[80px_10px_1fr]">
            <span>Kode No</span><span>:</span><span></span>
          </div>
          <div className="grid grid-cols-[80px_10px_1fr]">
            <span>Nomor</span><span>:</span><span>{assignment.assignmentNumber}</span>
          </div>
        </div>
      </div>
      <div className="text-center mb-4">
        <h2 className="text-[13pt] font-bold underline uppercase">SURAT PERJALANAN DINAS (SPD)</h2>
      </div>

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
            <td className="border border-black p-1 align-top">
              a. Pangkat dan Golongan<br/>
              b. Jabatan / Instansi<br/>
              c. Tingkat Biaya Perjalanan Dinas
            </td>
            <td className="border border-black p-1 align-top">
              a. {firstEmp?.pangkatGol}<br/>
              b. {firstEmp?.jabatan}<br/>
              c. 
            </td>
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
            <td className="border border-black p-1 align-top">
              a. Tempat berangkat<br/>
              b. Tempat tujuan
            </td>
            <td className="border border-black p-1 align-top">
              a. {assignment.origin}<br/>
              b. {assignment.destination}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">7.</td>
            <td className="border border-black p-1 align-top">
              a. Lamanya Perjalanan Dinas<br/>
              b. Tanggal berangkat<br/>
              c. Tanggal harus kembali/tiba di tempat baru
            </td>
            <td className="border border-black p-1 align-top">
              a. {assignment.durationDays} ( {numberToWords(assignment.durationDays)} ) Hari<br/>
              b. {formatDateID(assignment.startDate)}<br/>
              c. {formatDateID(assignment.endDate)}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">8.</td>
            <td className="border border-black p-1 align-top">Pengikut : Nama</td>
            <td className="border border-black p-1 align-top">
              {assignment.selectedEmployeeIds.slice(1).map((id, idx) => (
                <div key={id}>{idx + 1}. {employees.find(e => e.id === id)?.name}</div>
              ))}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center align-top">9.</td>
            <td className="border border-black p-1 align-top">
              Pembebanan Anggaran<br/>
              a. Instansi<br/>
              b. Akun
            </td>
            <td className="border border-black p-1 align-top">
              <br/>
              a. {skpd.namaSkpd}<br/>
              b. {assignment.subActivityCode}
            </td>
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
          <p>Dikeluarkan di : Mataram</p>
          <p className="mb-4">Pada Tanggal : {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p>
          <div className="min-h-[50px]">
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

export const SPPDBackTemplate: React.FC<{ 
  assignment: TravelAssignment; 
  skpd: SKPDConfig; 
  officials: Official[];
  destinationOfficials: DestinationOfficial[];
}> = ({ assignment, skpd, officials, destinationOfficials }) => {
  const { kepala, pptk } = getSignatories(assignment, officials, skpd);
  const destOff = destinationOfficials.find(o => o.id === assignment.destinationOfficialId);

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
        {['II', 'III', 'IV'].map((id) => (
          <div key={id} className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-2 min-h-[140px]">
              <div className="grid grid-cols-[20px_90px_10px_1fr] gap-x-0.5">
                <span className="font-bold">{id}.</span>
                <span>Tiba di</span>
                <span>:</span>
                <span>{id === 'II' ? assignment.destination : ''}</span>
                
                <span></span>
                <span>Pada tanggal</span>
                <span>:</span>
                <span>{id === 'II' ? formatDateID(assignment.startDate) : ''}</span>
                
                <span></span>
                <span>Kepala</span>
                <span>:</span>
                <span>{id === 'II' ? (destOff?.jabatan || '') : ''}</span>
              </div>
              <div className="mt-8 text-center">
                <div className="h-10"></div>
                <p className="font-bold underline uppercase">{id === 'II' ? (destOff?.name || '') : ''}</p>
                <p>{id === 'II' && destOff ? `NIP. ${destOff.nip}` : ''}</p>
              </div>
            </div>
            <div className="p-2 min-h-[140px]">
              <div className="grid grid-cols-[90px_10px_1fr] gap-x-0.5">
                <span>Berangkat dari</span>
                <span>:</span>
                <span>{id === 'II' ? assignment.destination : ''}</span>
                
                <span>Ke</span>
                <span>:</span>
                <span>{id === 'II' ? 'Mataram' : ''}</span>
                
                <span>Pada tanggal</span>
                <span>:</span>
                <span>{id === 'II' ? formatDateID(assignment.endDate) : ''}</span>
                
                <span>Kepala</span>
                <span>:</span>
                <span>{id === 'II' ? (destOff?.jabatan || '') : ''}</span>
              </div>
              <div className="mt-8 text-center">
                <div className="h-10"></div>
                <p className="font-bold underline uppercase">{id === 'II' ? (destOff?.name || '') : ''}</p>
                <p>{id === 'II' && destOff ? `NIP. ${destOff.nip}` : ''}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-justify leading-relaxed">V. Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.</p>
        <div className="grid grid-cols-2 mt-4">
          <div></div>
          <div className="text-center">
            <div className="min-h-[50px]">
              <p className="font-bold uppercase leading-tight">{kepala.jabatan}</p>
            </div>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{kepala.name}</p>
            <p>NIP. {kepala.nip}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t border-black text-[10pt]">
        <p className="font-bold uppercase">VI. CATATAN LAIN-LAIN</p>
        <div className="h-4"></div>
        <p className="font-bold uppercase leading-tight">VII. Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba serta Bendaharawan bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara mendapat rugi akibat kesalahan, kealpaannya.</p>
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
        const subTotalDaily = cost.dailyAllowance * cost.dailyDays;
        const subTotalLodging = cost.lodging * cost.lodgingDays;
        const subTotalTransport = cost.transportBbm + cost.seaTransport + cost.airTransport + cost.taxi;
        const subTotalRepres = cost.representation * cost.representationDays;
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
                  <tr>
                    <th className="border border-black p-1 w-10">No.</th>
                    <th className="border border-black p-1">Perincian Biaya</th>
                    <th className="border border-black p-1 w-36">Jumlah</th>
                    <th className="border border-black p-1 w-36">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-center align-top">1</td>
                    <td className="border border-black p-1">Transportasi<br/>- Transport BBM / Umum (PP)<br/>- Transport Lokal / Taksi</td>
                    <td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalTransport)}</td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center align-top">2</td>
                    <td className="border border-black p-1">Biaya penginapan</td>
                    <td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalLodging)}</td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center align-top">3</td>
                    <td className="border border-black p-1">Uang Harian Golongan {emp.pangkatGol.split('(')[1]?.replace(')', '') || ''}<br/>- Uang Harian ({cost.dailyDays} Hari x Rp. {formatNumber(cost.dailyAllowance)})</td>
                    <td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalDaily)}</td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center align-top">4</td>
                    <td className="border border-black p-1">Uang Representasi ({cost.representationDays} Hari x Rp. {formatNumber(cost.representation)})</td>
                    <td className="border border-black p-1 text-right align-top">Rp. {formatNumber(subTotalRepres)}</td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  <tr className="font-bold">
                    <td colSpan={2} className="border border-black p-1 text-center">Jumlah</td>
                    <td className="border border-black p-1 text-right">Rp. {formatNumber(grandTotal)}</td>
                    <td className="border border-black p-1"></td>
                  </tr>
                </tbody>
             </table>
             <div className="italic mb-8 uppercase font-bold text-[10pt]">//// {numberToWords(grandTotal)} Rupiah ////</div>
             
             <div className="grid grid-cols-2 gap-4 text-center mb-8">
               <div>
                  <p>Telah dibayar sejumlah :</p>
                  <p className="mb-1">Rp. {formatNumber(grandTotal)}</p>
                  <div className="min-h-[40px]">
                    <p className="font-bold">{bendahara.jabatan},</p>
                  </div>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{bendahara.name}</p>
                  <p>NIP. {bendahara.nip}</p>
               </div>
               <div>
                  <p>Mataram, {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p>
                  <p>Telah menerima jumlah uang sebesar :</p>
                  <p className="mb-1">Rp. {formatNumber(grandTotal)}</p>
                  <div className="min-h-[40px]">
                    <p className="font-bold">Yang menerima,</p>
                  </div>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{emp.name}</p>
                  <p>NIP. {emp.nip}</p>
               </div>
             </div>

             <div className="border-t border-black pt-4">
                <p className="text-center font-bold mb-4 uppercase">PERHITUNGAN SPD RAMPUNG</p>
                <div className="flex justify-center">
                   <div className="w-1/2 space-y-1">
                      <div className="grid grid-cols-[180px_10px_1fr]"><span>Ditetapkan sejumlah</span><span>:</span><span>Rp. {formatNumber(grandTotal)}</span></div>
                      <div className="grid grid-cols-[180px_10px_1fr]"><span>Yang telah dibayar semula</span><span>:</span><span>Rp. {formatNumber(grandTotal)}</span></div>
                      <div className="grid grid-cols-[180px_10px_1fr] border-t border-black"><span>Sisa kurang/lebih</span><span>:</span><span>Rp. -</span></div>
                   </div>
                </div>
                <div className="mt-4 text-center pl-48">
                   <p className="font-bold">Mengetahui/Menyetujui :</p>
                   <div className="min-h-[50px]">
                     <p className="font-bold uppercase leading-tight">{kepala.jabatan}</p>
                   </div>
                   <div className="h-16"></div>
                   <p className="font-bold underline uppercase">{kepala.name}</p>
                   <p>NIP. {kepala.nip}</p>
                </div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

export const KuitansiTemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const { kepala, bendahara, pptk } = getSignatories(assignment, officials, skpd);
  const totalAll = assignment.costs.reduce((sum, cost) => sum + (cost.dailyAllowance * cost.dailyDays) + (cost.lodging * cost.lodgingDays) + cost.transportBbm + cost.seaTransport + cost.airTransport + cost.taxi + (cost.representation * cost.representationDays), 0);
  const firstEmp = employees.find(e => e.id === assignment.selectedEmployeeIds[0]);

  return (
    <div className="print-page bg-white font-['Tahoma'] text-[11pt] border border-black p-[15mm] leading-tight">
      <Header skpd={skpd} />
      <div className="flex justify-end mb-4">
        <div className="border border-black p-2 w-[280px] space-y-1 text-[10pt]">
           <div className="grid grid-cols-[100px_10px_1fr]"><span>Kode Kegiatan</span><span>:</span><span>{assignment.subActivityCode}</span></div>
           <div className="grid grid-cols-[100px_10px_1fr]"><span>Dibukukan Tgl.</span><span>:</span><span></span></div>
           <div className="grid grid-cols-[100px_10px_1fr]"><span>Nomor Buku</span><span>:</span><span></span></div>
           <div className="grid grid-cols-[100px_10px_1fr]"><span>Sumber Dana</span><span>:</span><span></span></div>
        </div>
      </div>
      <div className="text-center mb-8"><h1 className="text-xl font-bold underline uppercase tracking-[0.2em]">KUITANSI</h1></div>
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-[160px_10px_1fr]"><span>Terima dari</span><span>:</span><span className="font-bold uppercase leading-tight">{kepala.jabatan}</span></div>
        <div className="grid grid-cols-[160px_10px_1fr] italic"><span>Banyaknya</span><span>:</span><span className="font-bold">//// {numberToWords(totalAll)} Rupiah ////</span></div>
        <div className="grid grid-cols-[160px_10px_1fr]"><span>Untuk Pembayaran</span><span>:</span><span className="text-justify leading-relaxed">Belanja Perjalanan Dinas Dalam Daerah ke {assignment.destination} selama {assignment.durationDays} hari dalam rangka {assignment.purpose} sesuai Surat Perintah Tugas {kepala.jabatan} Nomor : {assignment.assignmentNumber} tanggal {formatDateID(assignment.signDate)} a.n. {firstEmp?.name}</span></div>
      </div>
      <div className="border-t-2 border-b-2 border-black py-2 mb-8 flex items-center px-4 gap-4">
        <span className="font-bold">Terbilang :</span>
        <span className="font-bold text-lg">Rp. {formatNumber(totalAll)}</span>
      </div>
      
      {/* Container TTD - Dibuat flex untuk menyejajarkan nama di bawah */}
      <div className="grid grid-cols-3 gap-2 text-center text-[10pt] mb-8">
        <div className="flex flex-col">
          <p>Menyetujui :</p>
          <div className="h-[85px] flex items-start justify-center overflow-hidden">
            <p className="font-bold uppercase leading-tight">{kepala.jabatan}</p>
          </div>
          <div className="h-10"></div>
          <div className="mt-auto">
            <p className="font-bold underline uppercase">{kepala.name}</p>
            <p>NIP. {kepala.nip}</p>
          </div>
        </div>
        <div className="flex flex-col">
          <p>Lunas dibayar :</p>
          <div className="h-[85px] flex items-start justify-center overflow-hidden">
            <p className="font-bold uppercase">{bendahara.jabatan}</p>
          </div>
          <div className="h-10"></div>
          <div className="mt-auto">
            <p className="font-bold underline uppercase">{bendahara.name}</p>
            <p>NIP. {bendahara.nip}</p>
          </div>
        </div>
        <div className="flex flex-col">
          <p>Mataram, {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p>
          <div className="h-[85px] flex items-start justify-center overflow-hidden">
            <p className="font-bold uppercase">Yang menerima uang,</p>
          </div>
          <div className="h-10"></div>
          <div className="mt-auto">
            <p className="font-bold underline uppercase">{firstEmp?.name}</p>
            <p>NIP. {firstEmp?.nip}</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 flex flex-col items-center">
        <p>Mengetahui,</p>
        <div className="h-[50px] flex items-start justify-center">
          <p className="font-bold uppercase leading-tight">{pptk.jabatan}</p>
        </div>
        <div className="h-16"></div>
        <p className="font-bold underline uppercase">{pptk.name}</p>
        <p>NIP. {pptk.nip}</p>
      </div>
    </div>
  );
};

export const DaftarPenerimaanTemplate: React.FC<Props> = ({ assignment, employees, skpd, officials }) => {
  const { kepala, bendahara } = getSignatories(assignment, officials, skpd);
  const totalAll = assignment.costs.reduce((sum, cost) => {
    return sum + (cost.dailyAllowance * cost.dailyDays) + 
           (cost.lodging * cost.lodgingDays) + 
           cost.transportBbm + cost.seaTransport + cost.airTransport + cost.taxi + 
           (cost.representation * cost.representationDays);
  }, 0);

  return (
    <div className="landscape-page bg-white font-['Tahoma'] text-[11pt] leading-tight">
       <div className="text-center mb-6">
          <p className="font-bold uppercase">Daftar Penerimaan Uang Perjalanan Dinas Ke {assignment.destination} Dalam Rangka {assignment.purpose}</p>
          <p className="font-bold">Nomor : {assignment.assignmentNumber} Tanggal {formatDateID(assignment.signDate)}</p>
       </div>
       <table className="w-full border-collapse border border-black mb-2 text-[10pt]">
          <thead className="text-center font-bold bg-slate-50">
            <tr>
              <th className="border border-black p-1 w-8">No</th>
              <th className="border border-black p-1 w-64">Nama</th>
              <th className="border border-black p-1 w-16">Gol</th>
              <th className="border border-black p-1">Lumpsum</th>
              <th className="border border-black p-1">Akomodasi</th>
              <th className="border border-black p-1">Transportasi</th>
              <th className="border border-black p-1">Representasi</th>
              <th className="border border-black p-1 w-32">Jumlah</th>
              <th className="border border-black p-1 w-40">Tanda Tangan</th>
            </tr>
          </thead>
          <tbody>
            {assignment.costs.map((cost, i) => {
              const emp = employees.find(e => e.id === cost.employeeId);
              const total = (cost.dailyAllowance * cost.dailyDays) + (cost.lodging * cost.lodgingDays) + cost.transportBbm + cost.seaTransport + cost.airTransport + cost.taxi + (cost.representation * cost.representationDays);
              return (
                <tr key={cost.employeeId}>
                  <td className="border border-black p-1 text-center">{i + 1}</td>
                  <td className="border border-black p-1">{emp?.name}</td>
                  <td className="border border-black p-1 text-center">{emp?.pangkatGol.split('(')[1]?.replace(')', '') || ''}</td>
                  <td className="border border-black p-1 text-center">{cost.dailyDays} hr x Rp {formatNumber(cost.dailyAllowance)}</td>
                  <td className="border border-black p-1 text-center">{cost.lodgingDays} hr x Rp {formatNumber(cost.lodging)}</td>
                  <td className="border border-black p-1 text-center">Rp {formatNumber(cost.transportBbm + cost.seaTransport + cost.airTransport + cost.taxi)}</td>
                  <td className="border border-black p-1 text-center">Rp {formatNumber(cost.representation * cost.representationDays)}</td>
                  <td className="border border-black p-1 text-right font-bold">Rp {formatNumber(total)}</td>
                  <td className="border border-black p-1 relative min-h-[30px]">
                    <span className={`absolute ${i % 2 === 0 ? 'left-1' : 'right-4'} top-1 font-bold`}>{i + 1}.</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="font-bold">
            <tr>
              <td colSpan={7} className="border border-black p-1 text-center uppercase">Jumlah Total</td>
              <td className="border border-black p-1 text-right">Rp {formatNumber(totalAll)}</td>
              <td className="border border-black p-1"></td>
            </tr>
          </tfoot>
       </table>
       
       <div className="mb-8 mt-2 pl-1">
          <p className="font-bold italic text-[10pt]">Terbilang : Rp. {formatNumber(totalAll)} ( {numberToWords(totalAll)} Rupiah )</p>
       </div>

       <div className="grid grid-cols-2 text-center mt-4 text-[11pt]">
          <div className="pl-12">
            <p>Mengetahui/Menyetujui :</p>
            <div className="min-h-[50px]">
              <p className="font-bold uppercase leading-tight">{kepala.jabatan}</p>
            </div>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{kepala.name}</p>
            <p>NIP. {kepala.nip}</p>
          </div>
          <div className="pr-12">
            <p>Mataram, {formatDateID(assignment.signDate).split(' ').slice(1).join(' ')}</p>
            <div className="min-h-[50px]">
              <p className="font-bold uppercase mb-4">{bendahara.jabatan}</p>
            </div>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{bendahara.name}</p>
            <p>NIP. {bendahara.nip}</p>
          </div>
       </div>
    </div>
  );
};
