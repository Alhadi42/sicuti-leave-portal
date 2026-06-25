import { createClient } from "@supabase/supabase-js";

function permissionsForRole(role) {
  if (role === "admin_pusat") return ["all"];
  if (role === "admin_pimpinan") return ["all_readonly"];
  if (role === "admin_unit") {
    return [
      "dashboard",
      "employees_unit",
      "leave_requests_unit",
      "leave_history_unit",
      "surat_keterangan_unit",
    ];
  }
  return ["leave_requests_self", "leave_history_self"];
}

function extractNip(email, profileNip) {
  if (profileNip) return profileNip;
  const match = email.match(/^(.+)@sipandai\.local$/i);
  return match ? match[1] : null;
}

async function redeemCode(code) {
  const simpelUrl = process.env.SIMPEL_URL;
  const sharedSecret = process.env.SSO_SHARED_SECRET;

  if (!simpelUrl || !sharedSecret) {
    throw new Error("SIMPEL_URL dan SSO_SHARED_SECRET wajib di environment server");
  }

  const res = await fetch(`${simpelUrl}/functions/v1/sso-redeem-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SSO-Secret": sharedSecret,
    },
    body: JSON.stringify({ code }),
  });

  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || "Gagal menukar authorization code");
  return payload; // { access_token, refresh_token, user_id }
}

async function getSimpelUser(accessToken) {
  const simpelUrl = process.env.SIMPEL_URL;
  const simpelAnonKey = process.env.SIMPEL_ANON_KEY;

  if (!simpelUrl || !simpelAnonKey) {
    throw new Error("SIMPEL_URL dan SIMPEL_ANON_KEY wajib di environment server");
  }

  const client = createClient(simpelUrl, simpelAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Token SIMPEL tidak valid atau kadaluarsa");
  return data.user;
}

async function enrichUserFromSimpel(userId, email) {
  const simpelUrl = process.env.SIMPEL_URL;
  const simpelServiceKey = process.env.SIMPEL_SERVICE_ROLE_KEY;

  if (!simpelServiceKey) return { profile: null, role: "employee", nip: extractNip(email, null), employeeId: null };

  const admin = createClient(simpelUrl, simpelServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);

  const nip = extractNip(email, profile?.nip);
  let employeeId = null;

  if (nip) {
    const { data: emp } = await admin.from("employees").select("id").eq("nip", nip).maybeSingle();
    employeeId = emp?.id ?? null;
  }
  if (!employeeId) {
    const { data: emp } = await admin.from("employees").select("id").eq("id", userId).maybeSingle();
    employeeId = emp?.id ?? null;
  }

  return {
    profile,
    role: roleRow?.role || "employee",
    nip,
    employeeId,
  };
}

/**
 * SSO exchange — kembalikan data user + token SIMPEL langsung.
 * SiCuti menggunakan AuthManager (localStorage), bukan Supabase Auth SiCuti.
 * Tidak perlu provision/create user di Supabase SiCuti.
 */
export async function exchangeSsoCredentials(body) {
  const { code, access_token, refresh_token } = body ?? {};

  let simpelAccessToken = access_token;
  let simpelRefreshToken = refresh_token || "";

  if (code) {
    const redeemed = await redeemCode(code);
    simpelAccessToken = redeemed.access_token;
    simpelRefreshToken = redeemed.refresh_token || "";
  }

  if (!simpelAccessToken) {
    throw new Error("Authorization code atau access_token wajib");
  }

  const simpelUser = await getSimpelUser(simpelAccessToken);
  const { profile, role, nip, employeeId } = await enrichUserFromSimpel(
    simpelUser.id,
    simpelUser.email,
  );

  const meta = simpelUser.user_metadata || {};

  return {
    user: {
      id:          simpelUser.id,
      email:       simpelUser.email,
      name:        profile?.full_name || meta.full_name || simpelUser.email,
      role,
      department:  profile?.department || meta.department || "Belum Ditetapkan",
      nip,
      employee_id: employeeId,
      permissions: permissionsForRole(role),
    },
    // Kembalikan token SIMPEL — AuthCallback di SiCuti akan simpan ke AuthManager
    session: {
      access_token:  simpelAccessToken,
      refresh_token: simpelRefreshToken,
      expires_at:    0,
    },
    provider: "simpel",
  };
}
