import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const simpelSupabase = createClient(
  process.env.VITE_SIMPEL_URL,
  process.env.VITE_SIMPEL_SERVICE_ROLE_KEY
);

const sicutiSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("--- SIMPEL USERS ---");
  const { data: simpelUsers, error: simpelErr } = await simpelSupabase
    .from("users")
    .select("*")
    .limit(1);

  if (simpelErr) {
    console.error("SIMPEL users error:", simpelErr);
  } else {
    console.log("SIMPEL users sample fields:", Object.keys(simpelUsers[0] || {}));
    console.log("SIMPEL user sample:", simpelUsers[0]);
  }

  console.log("\n--- SICUTI USERS ---");
  const { data: sicutiUsers, error: sicutiErr } = await sicutiSupabase
    .from("users")
    .select("*")
    .limit(1);

  if (sicutiErr) {
    console.error("SiCuti users error:", sicutiErr);
  } else {
    console.log("SiCuti users sample fields:", Object.keys(sicutiUsers[0] || {}));
    console.log("SiCuti user sample:", sicutiUsers[0]);
  }
}

run();
