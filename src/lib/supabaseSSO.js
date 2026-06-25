/**
 * supabaseSSO.js — SSO helpers (tanpa service_role di browser)
 */
import { supabase } from "./supabaseClient";
import { supabaseSimpelAdmin } from "./simpelClient";

export { supabaseSimpelAdmin };
export const supabaseAuth = supabaseSimpelAdmin;

const validateEnv = () => {
  const required = {
    VITE_SIMPEL_APP_URL: import.meta.env.VITE_SIMPEL_APP_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error("[SSO Config] Environment variables yang hilang:", missing);
  } else if (import.meta.env.DEV) {
    console.log("[SSO Config] Konfigurasi SSO valid (anon key + edge functions)");
  }

  return missing.length === 0;
};

validateEnv();

/**
 * Redirect ke SIPANDAI dengan OAuth-style redirect_uri
 */
export const redirectToSimpelLogin = () => {
  const portalUrl = import.meta.env.VITE_SIMPEL_APP_URL || "https://sipandai.site";
  const callbackUrl = `${window.location.origin}/auth/callback`;
  window.location.href = `${portalUrl}/auth?redirect=${encodeURIComponent(callbackUrl)}`;
};

/**
 * Tukar authorization code / token via Edge Function auth-sso
 */
export const exchangeSsoCredentials = async ({ code, access_token, refresh_token }) => {
  const { data, error } = await supabase.functions.invoke("auth-sso", {
    body: { code, access_token, refresh_token },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Ambil session aktif dari Supabase Auth
 */
export const getAuthSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const isSSOConfigured = () => {
  return !!(
    import.meta.env.VITE_SIMPEL_APP_URL &&
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
};

export const getConfigStatus = () => ({
  VITE_SIMPEL_APP_URL: !!import.meta.env.VITE_SIMPEL_APP_URL,
  VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_SUPABASE_SERVICE_ROLE_KEY: false,
  VITE_SIMPEL_SERVICE_ROLE_KEY: false,
});
