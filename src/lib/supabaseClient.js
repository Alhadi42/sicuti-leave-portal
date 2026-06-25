import { createClient } from "@supabase/supabase-js";
import EnvironmentValidator from "./environmentValidator";

// Re-export useAuth hook for backward compatibility
export { useAuth } from "@/hooks/useAuth";

const config = EnvironmentValidator.getConfig();

/**
 * Client utama SiCuti — SATU-SATUNYA GoTrueClient di aplikasi.
 *
 * Menggunakan service_role key agar bisa bypass RLS karena aplikasi ini
 * menggunakan custom SSO (JWT SIMPEL decode via AuthManager),
 * bukan Supabase Auth session. Tanpa service_role, semua query
 * akan gagal karena RLS menolak anon key tanpa auth.session.
 *
 * Auth dinonaktifkan karena tidak ada Supabase Auth yang dipakai —
 * autentikasi sepenuhnya lewat JWT SIMPEL + localStorage AuthManager.
 */
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: { schema: "public" },
    global: {
      headers: {
        "x-application-name": "sistem-cuti",
        "x-client-version": config.app.version,
      },
    },
  },
);

/**
 * Alias — sama persis dengan supabase di atas.
 * Dipertahankan untuk backward-compat dengan kode yang import supabaseAdmin.
 */
export const supabaseAdmin = supabase;
