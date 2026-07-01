-- Query untuk mencoba mencari LOVABLE_API_KEY dan GOOGLE_DRIVE_API_KEY di database SIMPEL
-- CATATAN: Secret keys biasanya TIDAK disimpan di database, tapi di Supabase Vault/Secrets
-- Query ini hanya mencari jika ada tabel/kolom yang menyimpan config/settings

-- 1. Check apakah ada tabel 'secrets' atau 'settings'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%secret%' OR table_name LIKE '%setting%' OR table_name LIKE '%config%');

-- 2. Check semua tabel di public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Jika ada tabel settings/config, query isinya
-- SELECT * FROM settings WHERE key LIKE '%LOVABLE%' OR key LIKE '%GOOGLE_DRIVE%';
-- SELECT * FROM config WHERE name LIKE '%API_KEY%';

-- ⚠️ PENTING: 
-- Supabase menyimpan secrets di "Vault" (encrypted storage terpisah dari database)
-- Secrets TIDAK bisa di-query via SQL
-- Hanya bisa diakses via:
-- 1. Supabase CLI: supabase secrets list (hanya digest)
-- 2. Supabase Dashboard: Edge Functions → Manage secrets (plaintext)
-- 3. Edge Function code: Deno.env.get("SECRET_NAME")
