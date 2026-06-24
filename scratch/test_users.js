import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Users in SiCuti:");
  console.dir(data, { depth: null });
}

run();
