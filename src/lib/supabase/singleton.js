import { createClient } from "@supabase/supabase-js";

/** Satu-satunya GoTrueClient di seluruh aplikasi browser */
const GLOBAL_KEY = "__SICUTI_SUPABASE_SINGLETON__";

/**
 * Buat atau kembalikan Supabase client tunggal.
 * Menggunakan globalThis agar aman dari duplikasi chunk Vite/HMR.
 */
export function getSupabaseSingleton(url, anonKey, options) {
  if (typeof globalThis !== "undefined" && globalThis[GLOBAL_KEY]) {
    return globalThis[GLOBAL_KEY];
  }

  const client = createClient(url, anonKey, options);

  if (typeof globalThis !== "undefined") {
    globalThis[GLOBAL_KEY] = client;
  }

  return client;
}
