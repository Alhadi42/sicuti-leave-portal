/**
 * Konfigurasi auth untuk client Supabase yang tidak memakai Supabase Auth.
 * SSO sepenuhnya lewat JWT SIMPEL + AuthManager (localStorage).
 *
 * Mencegah konflik GoTrueClient dengan storageKey unik per project
 * dan storage no-op agar tidak bentrok dengan session SIMPEL di browser yang sama.
 */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export function createDisabledAuthOptions(storageKey) {
  return {
    auth: {
      storage: noopStorage,
      storageKey,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
}

/**
 * Singleton helper — pastikan hanya satu SupabaseClient per storageKey
 * meskipun modul dievaluasi lebih dari sekali (HMR / chunk duplikat).
 */
export function getOrCreateClient(globalKey, factory) {
  if (typeof window !== "undefined") {
    if (!window.__sicutiSupabaseClients) {
      window.__sicutiSupabaseClients = {};
    }
    if (!window.__sicutiSupabaseClients[globalKey]) {
      window.__sicutiSupabaseClients[globalKey] = factory();
    }
    return window.__sicutiSupabaseClients[globalKey];
  }
  return factory();
}
