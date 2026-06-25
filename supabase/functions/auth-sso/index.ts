/**
 * auth-sso — Professional SSO token exchange (SiCuti)
 *
 * Flow:
 * 1. Terima authorization code (preferred) atau legacy access_token
 * 2. Validasi token SIMPEL via Supabase Auth API (signature verified server-side)
 * 3. Ambil role otoritatif dari user_roles + profiles + employees (SIMPEL DB)
 * 4. Provision/update user di SiCuti auth.users (UUID sama dengan SIMPEL)
 * 5. Buat session SiCuti → frontend pakai anon key + RLS
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

type SimpelRole = "admin_pusat" | "admin_pimpinan" | "admin_unit" | "employee";

interface SsoUser {
  id: string;
  email: string;
  name: string;
  role: SimpelRole;
  department: string;
  nip: string | null;
  employee_id: string | null;
  permissions: string[];
}

function extractNip(email: string, profileNip?: string | null): string | null {
  if (profileNip) return profileNip;
  const match = email.match(/^(.+)@sipandai\.local$/i);
  return match ? match[1] : null;
}

function permissionsForRole(role: SimpelRole): string[] {
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

async function redeemCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const simpelUrl = Deno.env.get("SIMPEL_URL")!;
  const sharedSecret = Deno.env.get("SSO_SHARED_SECRET")!;

  const res = await fetch(`${simpelUrl}/functions/v1/sso-redeem-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SSO-Secret": sharedSecret,
    },
    body: JSON.stringify({ code }),
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error || "Gagal menukar authorization code");
  }
  return payload;
}

async function validateSimpelToken(accessToken: string) {
  const simpelUrl = Deno.env.get("SIMPEL_URL")!;
  const simpelAnonKey = Deno.env.get("SIMPEL_ANON_KEY")!;

  const simpelClient = createClient(simpelUrl, simpelAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await simpelClient.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Token SIMPEL tidak valid atau sudah kadaluarsa");
  }
  return data.user;
}

async function enrichUserFromSimpel(userId: string, email: string) {
  const simpelUrl = Deno.env.get("SIMPEL_URL")!;
  const simpelServiceKey = Deno.env.get("SIMPEL_SERVICE_ROLE_KEY")!;

  const simpelAdmin = createClient(simpelUrl, simpelServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    simpelAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    simpelAdmin.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);

  const nip = extractNip(email, profile?.nip);
  let employeeId: string | null = null;

  if (nip) {
    const { data: emp } = await simpelAdmin
      .from("employees")
      .select("id")
      .eq("nip", nip)
      .maybeSingle();
    employeeId = emp?.id ?? null;
  }
  if (!employeeId) {
    const { data: emp } = await simpelAdmin
      .from("employees")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    employeeId = emp?.id ?? null;
  }

  const role = (roleRow?.role as SimpelRole) || "employee";

  return {
    profile,
    role,
    nip,
    employeeId,
  };
}

async function provisionSicutiUser(
  user: SsoUser,
): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
  const sicutiUrl = Deno.env.get("SUPABASE_URL")!;
  const sicutiServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const sicutiAdmin = createClient(sicutiUrl, sicutiServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const metadata = {
    full_name: user.name,
    department: user.department,
    role: user.role,
    nip: user.nip,
    employee_id: user.employee_id,
    sso_provider: "simpel",
    permissions: user.permissions,
  };

  const { data: existing } = await sicutiAdmin.auth.admin.getUserById(user.id);

  if (!existing?.user) {
    const { error: createError } = await sicutiAdmin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: { provider: "sso", providers: ["sso"] },
    });
    if (createError) throw createError;
  } else {
    const { error: updateError } = await sicutiAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: metadata },
    );
    if (updateError) throw updateError;
  }

  // Buat session SiCuti untuk user yang sudah di-provision
  try {
    const { data: sessionData, error: createSessionError } =
      await sicutiAdmin.auth.admin.createSession({ user_id: user.id });

    if (!createSessionError && sessionData.session) {
      return {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at ?? 0,
      };
    }
  } catch {
    // fallback ke magiclink jika createSession tidak tersedia
  }

  const { data: linkData, error: linkError } =
    await sicutiAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error("Gagal membuat session SiCuti");
  }

  const { data: sessionData, error: sessionError } =
    await sicutiAdmin.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "email",
    });

  if (sessionError || !sessionData.session) {
    throw new Error("Gagal verifikasi session SiCuti");
  }

  return {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    expires_at: sessionData.session.expires_at ?? 0,
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = await req.json();
    const { code, access_token, refresh_token } = body ?? {};

    let simpelAccessToken = access_token as string | undefined;
    let simpelRefreshToken = refresh_token as string | undefined;

    // Preferred: OAuth-style authorization code (one-time, tidak di URL log)
    if (code) {
      const redeemed = await redeemCode(code);
      simpelAccessToken = redeemed.access_token;
      simpelRefreshToken = redeemed.refresh_token;
    }

    if (!simpelAccessToken) {
      return new Response(
        JSON.stringify({ error: "Authorization code atau access_token wajib" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const simpelUser = await validateSimpelToken(simpelAccessToken);
    const { profile, role, nip, employeeId } = await enrichUserFromSimpel(
      simpelUser.id,
      simpelUser.email!,
    );

    const ssoUser: SsoUser = {
      id: simpelUser.id,
      email: simpelUser.email!,
      name: profile?.full_name || simpelUser.user_metadata?.full_name || simpelUser.email!,
      role,
      department: profile?.department || "Belum Ditetapkan",
      nip,
      employee_id: employeeId,
      permissions: permissionsForRole(role),
    };

    const session = await provisionSicutiUser(ssoUser);

    return new Response(
      JSON.stringify({
        user: ssoUser,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
        // Simpan refresh token SIMPEL server-side only di masa depan; tidak dikirim ke browser
        provider: "simpel",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "SSO gagal";
    console.error("[auth-sso]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
