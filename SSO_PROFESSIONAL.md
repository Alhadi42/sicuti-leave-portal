# SSO Profesional — SiCuti × SIPANDAI

Arsitektur SSO mengikuti pola **OAuth 2.0 Authorization Code** dengan validasi server-side.

## Diagram Alur

```
┌─────────────┐     1. Login      ┌──────────────┐
│   Browser   │ ───────────────►  │  SIPANDAI    │  (Identity Provider)
│             │                   │  sipandai.site│
└──────┬──────┘                   └──────┬───────┘
       │                                 │
       │  2. sso-create-code             │ Supabase Auth
       │     (one-time code, 60s)        │
       │ ◄───────────────────────────────┘
       │
       │  3. redirect ?code=xxx
       ▼
┌─────────────┐   4. auth-sso     ┌──────────────┐
│   SiCuti    │ ───────────────►  │ Edge Function│  Validasi JWT SIMPEL
│ cuti.sipandai│  redeem code     │  auth-sso    │  Provision user SiCuti
└──────┬──────┘                   └──────┬───────┘
       │                                 │
       │  5. setSession (SiCuti JWT)     │
       │  6. Query DB via anon + RLS     ▼
       │                          ┌──────────────┐
       └────────────────────────► │ Supabase     │
                                  │ SiCuti DB    │
                                  └──────────────┘
```

## Komponen

| Komponen | Lokasi | Fungsi |
|----------|--------|--------|
| `sso-create-code` | SIMPEL Edge Function | Buat authorization code one-time |
| `sso-redeem-code` | SIMPEL Edge Function | Tukar code → tokens (server-to-server) |
| `auth-sso` | SiCuti Edge Function | Validasi token, provision user, buat session SiCuti |
| `simpel-proxy` | SiCuti Edge Function | Proxy read/write SIMPEL (service_role server-only) |
| RLS policies | SiCuti migration | Authorization berbasis JWT `user_metadata` |

## Keamanan

| Aspek | Implementasi |
|-------|-------------|
| Validasi JWT | Server-side via Supabase Auth API (signature verified) |
| Token di URL | Authorization code (bukan raw JWT); fallback hash fragment |
| Service role | Hanya di Edge Functions (secrets), tidak di browser |
| Database access | Anon key + RLS + session JWT SiCuti |
| Role otoritatif | Diambil dari `user_roles` SIMPEL, bukan JWT metadata saja |
| Shared secret | `SSO_SHARED_SECRET` untuk komunikasi server-to-server |

## Deploy Checklist

### 1. SIMPEL (sipandai.site)

```bash
cd lavotas-employee-hub
supabase db push                    # migration sso_exchange_codes
supabase secrets set SSO_SHARED_SECRET=<random-64-char>
supabase functions deploy sso-create-code
supabase functions deploy sso-redeem-code
```

### 2. SiCuti (cuti.sipandai.site)

```bash
cd sicuti-leave-portal
supabase db push                    # migration SSO RLS policies
supabase secrets set \
  SIMPEL_URL=https://mauyygrbdopmpdpnwzra.supabase.co \
  SIMPEL_ANON_KEY=<simpel_anon_key> \
  SIMPEL_SERVICE_ROLE_KEY=<simpel_service_role_key> \
  SSO_SHARED_SECRET=<same-as-simpel> \
  SUPABASE_SERVICE_ROLE_KEY=<sicuti_service_role_key> \
  SUPABASE_ANON_KEY=<sicuti_anon_key>
supabase functions deploy auth-sso
supabase functions deploy simpel-proxy
```

### 3. Vercel Environment (SiCuti frontend)

Hanya variabel `VITE_*` yang aman:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SIMPEL_APP_URL
```

**Hapus dari Vercel:**
- `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SIMPEL_SERVICE_ROLE_KEY`
- `VITE_SIMPEL_URL`

### 4. Rotasi Key

Setelah deploy, rotate service role keys di kedua Supabase dashboard karena keys lama pernah exposed di browser bundle.

## Backward Compatibility

`AuthCallback` masih menerima:
- `?code=` — preferred (OAuth code flow)
- `?access_token=&refresh_token=` — legacy query params
- `#access_token=&refresh_token=` — hash fallback (tidak masuk server logs)

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `Gagal menukar authorization code` | Pastikan `SSO_SHARED_SECRET` sama di kedua project |
| `Token SIMPEL tidak valid` | Cek `SIMPEL_ANON_KEY` di secrets SiCuti |
| RLS policy violation | Pastikan user sudah di-provision via `auth-sso`; cek `user_metadata.role` |
| `Sesi tidak aktif` pada query SIMPEL | Login ulang; pastikan `setSession` berhasil |
