import EnvironmentValidator from "./environmentValidator";
import { getSupabaseSingleton } from "./supabase/singleton";

const config = EnvironmentValidator.getConfig();

/**
 * Client utama SiCuti — satu instance, anon key + Supabase Auth session (RLS aktif).
 */
export const supabase = getSupabaseSingleton(
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
);

export const supabaseAdmin = supabase;
