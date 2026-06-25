import React, { useEffect, useState } from "react";
import { redirectToSimpelLogin } from "@/lib/supabaseSSO";
import { AuthManager } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

/**
 * ProtectedRoute — cek Supabase Auth session (RLS-aware)
 *
 * Sumber kebenaran: supabase.auth.getSession()
 * localStorage hanya cache tambahan, bukan penentu autentikasi.
 */
const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      // Cek Supabase Auth session sebagai sumber kebenaran
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session?.user) {
        // Sinkronkan localStorage cache dari session
        const user = AuthManager.mapUserFromSession(session);
        if (user) {
          localStorage.setItem("user_data", JSON.stringify(user));
        }
        setStatus("authenticated");
      } else {
        setStatus("redirecting");
        redirectToSimpelLogin();
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading" || status === "redirecting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">
            {status === "redirecting"
              ? "Mengalihkan ke SIPANDAI..."
              : "Memverifikasi sesi..."}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
