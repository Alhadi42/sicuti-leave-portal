import { createClient } from "@supabase/supabase-js";

/**
 * SSO Integration: SIMPEL sebagai Master Auth, SiCuti sebagai Consumer
 *
 * supabaseAuth  → Supabase SIMPEL (untuk autentikasi/login)
 * supabaseData  → Supabase SiCuti (untuk query data cuti, pakai service_role)
 */

// Client untuk AUTH - terhubung ke project SIMPEL
export const supabaseAuth = createClient(
  import.meta.env.VITE_SIMPEL_URL,
  import.meta.env.VITE_SIMPEL_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "simpel-auth-session", // key unik agar tidak bentrok
    },
  }
);

// Client untuk DATA - terhubung ke project SiCuti (service_role bypass RLS)
export const supabaseData = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Client admin untuk SIMPEL (service_role) untuk sinkronisasi data pegawai & user profiles
export const supabaseSimpelAdmin = createClient(
  import.meta.env.VITE_SIMPEL_URL,
  import.meta.env.VITE_SIMPEL_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Redirect pengguna ke halaman login SIMPEL
 * Setelah login, SIMPEL akan kirim token ke /auth/callback SiCuti
 */
export const redirectToSimpelLogin = () => {
  const simpelAppUrl = import.meta.env.VITE_SIMPEL_APP_URL || "http://localhost:5173";
  const sicutiCallbackUrl = `${window.location.origin}/auth/callback`;
  const redirectUrl = `${simpelAppUrl}/auth?redirect=${encodeURIComponent(sicutiCallbackUrl)}`;
  window.location.href = redirectUrl;
};

/**
 * Cek apakah user sudah login (berdasarkan sesi SIMPEL)
 */
export const getAuthSession = async () => {
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) return null;
  return data.session;
};

/**
 * Ambil data user yang sedang login
 */
export const getAuthUser = async () => {
  const { data, error } = await supabaseAuth.auth.getUser();
  if (error) return null;
  return data.user;
};

/**
 * Logout dari SIMPEL dan redirect kembali ke SiCuti landing page
 */
export const signOut = async () => {
  await supabaseAuth.auth.signOut();
  window.location.href = "/";
};
