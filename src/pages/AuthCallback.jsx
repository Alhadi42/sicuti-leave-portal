import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthManager } from "@/lib/auth";
import { exchangeSsoCredentials } from "@/lib/supabaseSSO";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * AuthCallback — OAuth 2.0 Authorization Code Flow
 *
 * Preferred: ?code=<one-time-code>  (token tidak di URL)
 * Legacy:    ?access_token=...&refresh_token=...  (backward compat)
 * Hash:      #access_token=...  (interim, tidak masuk server logs)
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [statusMsg, setStatusMsg] = useState("Memverifikasi kredensial SSO...");
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );

      const code = params.get("code");
      const access_token =
        params.get("access_token") || hashParams.get("access_token");
      const refresh_token =
        params.get("refresh_token") || hashParams.get("refresh_token");

      if (!code && !access_token) {
        console.warn("[SSO] Kredensial tidak ditemukan, redirect ke SIPANDAI");
        window.location.replace(
          `${import.meta.env.VITE_SIMPEL_APP_URL || "https://sipandai.site"}/auth?redirect=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`,
        );
        return;
      }

      // Bersihkan URL dari token/code (security)
      window.history.replaceState({}, document.title, "/auth/callback");

      try {
        setStatusMsg("Memvalidasi token dengan server...");

        const result = await exchangeSsoCredentials({
          code: code ?? undefined,
          access_token: access_token ?? undefined,
          refresh_token: refresh_token ?? undefined,
        });

        setStatusMsg("Menyimpan sesi...");
        await AuthManager.setSession(result.session);
        await AuthManager.refreshUserSession();

        const user = result.user;
        console.log("[SSO] Login berhasil:", user.email, "| Role:", user.role);

        setStatusMsg("Berhasil! Mengalihkan...");

        if (user.role === "employee") {
          navigate("/leave-requests", { replace: true });
        } else {
          navigate("/employees", { replace: true });
        }
      } catch (err) {
        console.error("[SSO] Exchange gagal:", err);
        setErrorMsg(
          err.message ||
            "Autentikasi SSO gagal. Silakan login ulang melalui SIPANDAI.",
        );
      }
    };

    handleCallback();
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-lg">Login SSO Gagal</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
          <a
            href={`${import.meta.env.VITE_SIMPEL_APP_URL || "https://sipandai.site"}/auth?redirect=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`}
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Kembali ke Portal SIPANDAI
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
        <p className="text-white text-lg font-medium">{statusMsg}</p>
        <p className="text-slate-400 text-sm">Menghubungkan sesi dari SIPANDAI</p>
      </div>
    </div>
  );
};

export default AuthCallback;
