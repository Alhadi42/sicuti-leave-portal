/**
 * integrations/supabase/client.ts
 *
 * Re-export supabase dari lib/supabaseClient untuk menghindari
 * Multiple GoTrueClient instances. File ini dulunya auto-generated
 * oleh Lovable tapi sekarang di-override.
 *
 * JANGAN import createClient di sini — gunakan instance tunggal dari supabaseClient.js
 */
import { supabase } from "@/lib/supabaseClient";

export { supabase };
export default supabase;

