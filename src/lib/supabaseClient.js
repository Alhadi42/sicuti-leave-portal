import { createClient } from "@supabase/supabase-js";
import EnvironmentValidator from "./environmentValidator";
import { getOrCreateClient } from "./supabaseAuthOptions";

const config = EnvironmentValidator.getConfig();

/**
 * Client utama SiCuti — anon key + Supabase Auth session (RLS aktif).
 *
 * Session dibuat via Edge Function auth-sso setelah validasi token SIMPEL.
 * Service role TIDAK digunakan di browser.
 */
export const supabase = getOrCreateClient("sicuti-data", () =>
  createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        storageKey: "sb-sicuti-auth",
        persistSession: true,
        autoRefreshToken: true,
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
  ),
);

export const supabaseAdmin = supabase;
