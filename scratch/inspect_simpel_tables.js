import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const simpelSupabase = createClient(
  process.env.VITE_SIMPEL_URL,
  process.env.VITE_SIMPEL_SERVICE_ROLE_KEY
);

async function run() {
  console.log("--- SIMPEL TABEL LIST ---");
  // Query to get all tables in public schema
  const { data, error } = await simpelSupabase.rpc("get_tables"); // If RPC exists, otherwise we can inspect other common tables
  
  if (error) {
    console.error("RPC get_tables error:", error);
    
    // Let's try direct queries to common tables
    const commonTables = ["user_roles", "profiles", "users", "pegawai", "admin_roles"];
    for (const table of commonTables) {
      const { data: tblData, error: tblErr } = await simpelSupabase
        .from(table)
        .select("*")
        .limit(1);
      if (tblErr) {
        console.log(`Table ${table} not found or error: ${tblErr.message}`);
      } else {
        console.log(`Table ${table} EXISTS. Fields:`, Object.keys(tblData[0] || {}));
        console.log(`Sample from ${table}:`, tblData[0]);
      }
    }
  } else {
    console.log("Tables list:", data);
  }
}

run();
