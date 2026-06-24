import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const newUser = {
    name: "Ali Admin Pusat",
    username: "ali_admin",
    password: "dummy_sso_password_hashed_by_simpel", // Karena autentikasi sebenarnya diurus oleh SIMPEL
    email: "ali.coolz30@gmail.com",
    role: "master_admin",
    unit_kerja: "Pusat",
    status: "active",
    permissions: ["all"],
    last_login: null
  };

  const { data, error } = await supabase.from("users").insert([newUser]).select();
  if (error) {
    console.error("Gagal memasukkan user:", error);
    return;
  }
  console.log("Berhasil mendaftarkan user uji SSO:");
  console.dir(data, { depth: null });
}

run();
