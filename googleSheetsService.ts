import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json';
import { Employee, Official, DestinationOfficial, SKPDConfig, MasterCost, SubActivity, TravelAssignment } from './types';

// Reuse existing Firebase App or initialize a new one for OAuth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory cache for the OAuth access token to ensure compliance
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Creates a formatted spreadsheet of 7 tabs to act as database tables
 */
export const createDatabaseSpreadsheet = async (token: string, title: string = "SIPD Lite Database"): Promise<string> => {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [
        { properties: { title: 'Employees' } },
        { properties: { title: 'Officials' } },
        { properties: { title: 'DestinationOfficials' } },
        { properties: { title: 'SKPDConfig' } },
        { properties: { title: 'MasterCosts' } },
        { properties: { title: 'SubActivities' } },
        { properties: { title: 'Assignments' } }
      ]
    })
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Gagal membuat Google Sheet');
  }

  const result = await res.json();
  const spreadsheetId = result.spreadsheetId;

  // Initialize headers
  await initSpreadsheetHeaders(token, spreadsheetId);
  return spreadsheetId;
};

const initSpreadsheetHeaders = async (token: string, spreadsheetId: string) => {
  const data = [
    {
      range: 'Employees!A1:G1',
      values: [['id', 'name', 'nip', 'pangkat_gol', 'jabatan', 'representation_luar', 'representation_dalam']]
    },
    {
      range: 'Officials!A1:E1',
      values: [['id', 'name', 'nip', 'jabatan', 'role']]
    },
    {
      range: 'DestinationOfficials!A1:E1',
      values: [['id', 'name', 'nip', 'jabatan', 'instansi']]
    },
    {
      range: 'SKPDConfig!A1:N1',
      values: [['provinsi', 'nama_skpd', 'alamat', 'lokasi', 'kepala_nama', 'kepala_nip', 'kepala_jabatan', 'bendahara_nama', 'bendahara_nip', 'pptk_nama', 'pptk_nip', 'ppk_nama', 'ppk_nip', 'logo']]
    },
    {
      range: 'MasterCosts!A1:G1',
      values: [['destination', 'daily_allowance', 'lodging', 'transport_bbm', 'sea_transport', 'air_transport', 'taxi']]
    },
    {
      range: 'SubActivities!A1:I1',
      values: [['code', 'name', 'budget_code', 'anggaran', 'spd', 'triwulan1', 'triwulan2', 'triwulan3', 'triwulan4']]
    },
    {
      range: 'Assignments!A1:U1',
      values: [['id', 'assignment_number', 'sub_activity_code', 'purpose', 'origin', 'travel_type', 'transportation', 'destination', 'start_date', 'end_date', 'duration_days', 'selected_employee_ids', 'costs', 'signed_at', 'sign_date', 'pptk_id', 'signer_id', 'bendahara_id', 'ppk_id', 'destination_official_ids', 'created_at']]
    }
  ];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: data
    })
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Gagal inisialisasi header spreadsheet');
  }
};

/**
 * Pushes all application data to Google Sheet
 */
export const pushAllDataToGoogleSheets = async (
  token: string, 
  spreadsheetId: string, 
  data: {
    employees: Employee[];
    officials: Official[];
    destinationOfficials: DestinationOfficial[];
    skpdConfig: SKPDConfig;
    masterCosts: MasterCost[];
    subActivities: SubActivity[];
    assignments: TravelAssignment[];
  }
) => {
  const employeesRows = data.employees.map(e => [
    e.id, e.name, e.nip, e.pangkatGol || '', e.jabatan || '', e.representationLuar || 0, e.representationDalam || 0
  ]);
  const officialsRows = data.officials.map(o => [
    o.id, o.name, o.nip, o.jabatan, o.role
  ]);
  const destOfficialsRows = data.destinationOfficials.map(o => [
    o.id, o.name, o.nip, o.jabatan, o.instansi
  ]);
  const skpdRows = [[
    data.skpdConfig.provinsi || '', data.skpdConfig.namaSkpd || '', data.skpdConfig.alamat || '', data.skpdConfig.lokasi || '',
    data.skpdConfig.kepalaNama || '', data.skpdConfig.kepalaNip || '', data.skpdConfig.kepalaJabatan || '',
    data.skpdConfig.bendaharaNama || '', data.skpdConfig.bendaharaNip || '', data.skpdConfig.pptkNama || '', data.skpdConfig.pptkNip || '',
    data.skpdConfig.ppkNama || '', data.skpdConfig.ppkNip || '', data.skpdConfig.logo || ''
  ]];
  const costRows = data.masterCosts.map(c => [
    c.destination, c.dailyAllowance || 0, c.lodging || 0, c.transportBbm || 0, c.seaTransport || 0, c.airTransport || 0, c.taxi || 0
  ]);
  const subRows = data.subActivities.map(s => [
    s.code, s.name, s.budgetCode || '', s.anggaran || 0, s.spd || '0', s.triwulan1 || 0, s.triwulan2 || 0, s.triwulan3 || 0, s.triwulan4 || 0
  ]);
  const assignmentsRows = data.assignments.map(a => [
    a.id, a.assignmentNumber, a.subActivityCode, a.purpose, a.origin, a.travelType, a.transportation, a.destination,
    a.startDate, a.endDate, a.durationDays, JSON.stringify(a.selectedEmployeeIds), JSON.stringify(a.costs),
    a.signedAt, a.signDate, a.pptkId || '', a.signerId || '', a.bendaharaId || '', a.ppkId || '',
    JSON.stringify(a.destinationOfficialIds || []), new Date().toISOString()
  ]);

  // Clean rows explicitly
  const safeBody = {
    valueInputOption: 'RAW',
    data: [
      {
        range: 'Employees!A1:G1000',
        values: [['id', 'name', 'nip', 'pangkat_gol', 'jabatan', 'representation_luar', 'representation_dalam'], ...employeesRows]
      },
      {
        range: 'Officials!A1:E1000',
        values: [['id', 'name', 'nip', 'jabatan', 'role'], ...officialsRows]
      },
      {
        range: 'DestinationOfficials!A1:E1000',
        values: [['id', 'name', 'nip', 'jabatan', 'instansi'], ...destOfficialsRows]
      },
      {
        range: 'SKPDConfig!A1:N10',
        values: [
          ['provinsi', 'nama_skpd', 'alamat', 'lokasi', 'kepala_nama', 'kepala_nip', 'kepala_jabatan', 'bendahara_nama', 'bendahara_nip', 'pptk_nama', 'pptk_nip', 'ppk_nama', 'ppk_nip', 'logo'],
          ...skpdRows
        ]
      },
      {
        range: 'MasterCosts!A1:G1000',
        values: [['destination', 'daily_allowance', 'lodging', 'transport_bbm', 'sea_transport', 'air_transport', 'taxi'], ...costRows]
      },
      {
        range: 'SubActivities!A1:I1000',
        values: [['code', 'name', 'budget_code', 'anggaran', 'spd', 'triwulan1', 'triwulan2', 'triwulan3', 'triwulan4'], ...subRows]
      },
      {
        range: 'Assignments!A1:U1000',
        values: [
          ['id', 'assignment_number', 'sub_activity_code', 'purpose', 'origin', 'travel_type', 'transportation', 'destination', 'start_date', 'end_date', 'duration_days', 'selected_employee_ids', 'costs', 'signed_at', 'sign_date', 'pptk_id', 'signer_id', 'bendahara_id', 'ppk_id', 'destination_official_ids', 'created_at'],
          ...assignmentsRows
        ]
      }
    ]
  };

  // We must clear the values first to handle deleting row count
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ranges: ['Employees!A1:G1000', 'Officials!A1:E1000', 'DestinationOfficials!A1:E1000', 'SKPDConfig!A1:N10', 'MasterCosts!A1:G1000', 'SubActivities!A1:I1000', 'Assignments!A1:U1000']
    })
  });

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(safeBody)
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Gagal menyinkronkan data ke Google Sheet.');
  }
};

/**
 * Pulls all application data from Google Sheet
 */
export const pullAllDataFromGoogleSheets = async (token: string, spreadsheetId: string) => {
  const ranges = [
    'Employees!A2:G1000',
    'Officials!A2:E1000',
    'DestinationOfficials!A2:E1000',
    'SKPDConfig!A2:N2',
    'MasterCosts!A2:G1000',
    'SubActivities!A2:I1000',
    'Assignments!A2:U1000'
  ];

  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Gagal membaca data dari Google Sheet.');
  }

  const result = await res.json();
  const valueRanges = result.valueRanges || [];

  const employees: Employee[] = (valueRanges[0]?.values || []).map((row: any) => ({
    id: row[0] || '',
    name: row[1] || '',
    nip: row[2] || '',
    pangkatGol: row[3] || '',
    jabatan: row[4] || '',
    representationLuar: Number(row[5]) || 0,
    representationDalam: Number(row[6]) || 0
  }));

  const officials: Official[] = (valueRanges[1]?.values || []).map((row: any) => ({
    id: row[0] || '',
    name: row[1] || '',
    nip: row[2] || '',
    jabatan: row[3] || '',
    role: row[4] || 'KEPALA'
  }));

  const destinationOfficials: DestinationOfficial[] = (valueRanges[2]?.values || []).map((row: any) => ({
    id: row[0] || '',
    name: row[1] || '',
    nip: row[2] || '',
    jabatan: row[3] || '',
    instansi: row[4] || ''
  }));

  let skpdConfig: SKPDConfig | null = null;
  const configRow = valueRanges[3]?.values?.[0];
  if (configRow) {
    skpdConfig = {
      provinsi: configRow[0] || '',
      namaSkpd: configRow[1] || '',
      alamat: configRow[2] || '',
      lokasi: configRow[3] || '',
      kepalaNama: configRow[4] || '',
      kepalaNip: configRow[5] || '',
      kepalaJabatan: configRow[6] || '',
      bendaharaNama: configRow[7] || '',
      bendaharaNip: configRow[8] || '',
      pptkNama: configRow[9] || '',
      pptkNip: configRow[10] || '',
      ppkNama: configRow[11] || '',
      ppkNip: configRow[12] || '',
      logo: configRow[13] || ''
    };
  }

  const masterCosts: MasterCost[] = (valueRanges[4]?.values || []).map((row: any) => ({
    destination: row[0] || '',
    dailyAllowance: Number(row[1]) || 0,
    lodging: Number(row[2]) || 0,
    transportBbm: Number(row[3]) || 0,
    seaTransport: Number(row[4]) || 0,
    airTransport: Number(row[5]) || 0,
    taxi: Number(row[6]) || 0
  }));

  const subActivities: SubActivity[] = (valueRanges[5]?.values || []).map((row: any) => ({
    code: row[0] || '',
    name: row[1] || '',
    budgetCode: row[2] || '',
    anggaran: Number(row[3]) || 0,
    spd: row[4] || '0',
    triwulan1: Number(row[5]) || 0,
    triwulan2: Number(row[6]) || 0,
    triwulan3: Number(row[7]) || 0,
    triwulan4: Number(row[8]) || 0
  }));

  const assignments: TravelAssignment[] = (valueRanges[6]?.values || []).map((row: any) => {
    let parsedEmployees: any = [];
    try {
      parsedEmployees = JSON.parse(row[11] || '[]');
    } catch {
      parsedEmployees = (row[11] || '').split('|').filter(Boolean);
    }

    let parsedCosts: any = [];
    try {
      parsedCosts = JSON.parse(row[12] || '[]');
    } catch {
      parsedCosts = [];
    }

    let parsedDestOfficials: any = [];
    try {
      parsedDestOfficials = JSON.parse(row[19] || '[]');
    } catch {
      parsedDestOfficials = (row[19] || '').split('|').filter(Boolean);
    }

    return {
      id: row[0] || '',
      assignmentNumber: row[1] || '',
      subActivityCode: row[2] || '',
      purpose: row[3] || '',
      origin: row[4] || '',
      travelType: (row[5] || 'DALAM_DAERAH') as any,
      transportation: row[6] || '',
      destination: row[7] || '',
      startDate: row[8] || '',
      endDate: row[9] || '',
      durationDays: Number(row[10]) || 0,
      selectedEmployeeIds: parsedEmployees,
      costs: parsedCosts,
      signedAt: row[13] || '',
      signDate: row[14] || '',
      pptkId: row[15] || '',
      signerId: row[16] || '',
      bendaharaId: row[17] || '',
      ppkId: row[18] || '',
      destinationOfficialIds: parsedDestOfficials
    };
  });

  return {
    employees,
    officials,
    destinationOfficials,
    skpdConfig,
    masterCosts,
    subActivities,
    assignments
  };
};

/**
 * Searches user's Google Drive for existing spreadsheet
 */
export const searchDatabaseSpreadsheet = async (token: string): Promise<{ id: string; name: string }[]> => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27+and+trashed%3Dfalse&fields=files(id%2Cname)', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
};
