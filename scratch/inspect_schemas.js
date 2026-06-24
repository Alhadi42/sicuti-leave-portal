import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const sicutiSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const simpelSupabase = createClient(
  process.env.VITE_SIMPEL_URL,
  process.env.VITE_SIMPEL_SERVICE_ROLE_KEY
);

async function run() {
  // Inspect SiCuti tables
  console.log("--- SICUTI ---");
  const { data: sicutiTables, error: sicutiErr } = await sicutiSupabase
    .from("employees")
    .select("*")
    .limit(1);
  
  if (sicutiErr) {
    console.error("SiCuti employees error:", sicutiErr);
  } else {
    console.log("SiCuti employees sample fields:", Object.keys(sicutiTables[0] || {}));
  }

  // Inspect SIMPEL tables
  console.log("\n--- SIMPEL ---");
  // Let's guess table name is 'employees' or 'pegawai'
  const { data: simpelTables, error: simpelErr } = await simpelSupabase
    .from("employees")
    .select("*")
    .limit(1);

  if (simpelErr) {
    console.error("SIMPEL employees error:", simpelErr);
    // Try 'pegawai'
    const { data: simpelTables2, error: simpelErr2 } = await simpelSupabase
      .from("pegawai")
      .select("*")
      .limit(1);
    if (simpelErr2) {
      console.error("SIMPEL pegawai error:", simpelErr2);
    } else {
      console.log("SIMPEL pegawai sample fields:", Object.keys(simpelTables2[0] || {}));
    }
  } else {
    console.log("SIMPEL employees sample fields:", Object.keys(simpelTables[0] || {}));
  }
}

run();
