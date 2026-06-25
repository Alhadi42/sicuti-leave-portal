import { supabase } from '@/lib/supabaseClient';

const CHUNK_SIZE = 50;

/**
 * Upsert pegawai SIMPEL ke tabel employees SiCuti (key: NIP).
 * Mengembalikan Map nip → id lokal SiCuti.
 */
export async function resolveSicutiEmployeeIds(simpelEmployees) {
  if (!simpelEmployees?.length) {
    return new Map();
  }

  const nipMap = new Map();
  for (const emp of simpelEmployees) {
    const nip = emp.nip ? String(emp.nip).trim() : null;
    if (!nip || nip === 'null') continue;
    nipMap.set(nip, emp);
  }

  if (nipMap.size === 0) {
    return new Map();
  }

  const formattedEmployees = Array.from(nipMap.entries()).map(([nip, emp]) => ({
    nip,
    name: emp.name,
    old_position: emp.old_position || null,
    department: emp.department || null,
    join_date: emp.join_date || null,
    position_type: emp.position_type || null,
    position_name: emp.position_name || null,
    asn_status: emp.asn_status || null,
    rank_group: emp.rank_group || null,
    updated_at: new Date().toISOString(),
  }));

  for (let i = 0; i < formattedEmployees.length; i += CHUNK_SIZE) {
    const chunk = formattedEmployees.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('employees')
      .upsert(chunk, { onConflict: 'nip', ignoreDuplicates: false });

    if (error) {
      console.warn('[sicutiEmployeeResolver] Upsert chunk error:', error.message);
    }
  }

  const nips = Array.from(nipMap.keys());
  const nipToLocalId = new Map();

  for (let i = 0; i < nips.length; i += CHUNK_SIZE) {
    const chunk = nips.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from('employees')
      .select('id, nip')
      .in('nip', chunk);

    if (error) {
      console.warn('[sicutiEmployeeResolver] Lookup error:', error.message);
      continue;
    }

    for (const row of data || []) {
      if (row.nip && row.id) {
        nipToLocalId.set(String(row.nip).trim(), row.id);
      }
    }
  }

  return nipToLocalId;
}

/**
 * Gabungkan data tampilan SIMPEL dengan employee_id lokal SiCuti untuk operasi DB.
 */
export function attachSicutiEmployeeIds(simpelEmployees, nipToLocalId) {
  return (simpelEmployees || [])
    .map((emp) => {
      const nip = emp.nip ? String(emp.nip).trim() : null;
      const sicutiEmployeeId = nip ? nipToLocalId.get(nip) : null;
      if (!sicutiEmployeeId) return null;

      return {
        ...emp,
        simpelId: emp.id,
        sicutiEmployeeId,
        id: sicutiEmployeeId,
      };
    })
    .filter(Boolean);
}

/**
 * Resolve satu pegawai SIMPEL → record dengan id lokal SiCuti.
 */
export async function resolveSingleSicutiEmployee(simpelEmployee) {
  if (!simpelEmployee) return null;
  const nipToLocalId = await resolveSicutiEmployeeIds([simpelEmployee]);
  const [resolved] = attachSicutiEmployeeIds([simpelEmployee], nipToLocalId);
  return resolved || null;
}

/**
 * Resolve banyak pegawai SIMPEL → array ID lokal SiCuti (untuk filter query).
 */
export async function resolveSicutiIdList(simpelEmployees) {
  if (!simpelEmployees?.length) return [];
  const nipToLocalId = await resolveSicutiEmployeeIds(simpelEmployees);
  return attachSicutiEmployeeIds(simpelEmployees, nipToLocalId).map((e) => e.id);
}
