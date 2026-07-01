# Get Google Drive API Keys from Lovable Dashboard

## Problem
Cannot retrieve plain text secrets from Supabase (they are encrypted). Need to get fresh API keys from Lovable dashboard.

## Solution: Get Keys from Lovable Dashboard

### Step 1: Login to Lovable

Go to [Lovable Dashboard](https://lovable.dev)

### Step 2: Get LOVABLE_API_KEY

1. Click **Settings** or **Profile**
2. Go to **API Keys** section
3. Copy your **LOVABLE_API_KEY**
   - Format: `lova_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - If no key exists, click "Generate New API Key"

### Step 3: Get GOOGLE_DRIVE_API_KEY

1. Go to **Integrations** section
2. Find **Google Drive** connector
3. Copy the **Connection API Key** or **GOOGLE_DRIVE_API_KEY**
   - Format: `gdk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - If connector not connected:
     - Click "Connect Google Drive"
     - Authorize your Google account
     - Select the Google Drive account to use
     - Copy the generated API key

### Step 4: Set Secrets to SiCuti Supabase

Open PowerShell and run:

```powershell
cd "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

$env:SUPABASE_ACCESS_TOKEN="YOUR_SICUTI_ACCESS_TOKEN"

# Set LOVABLE_API_KEY (paste the value you copied)
npx supabase secrets set LOVABLE_API_KEY="lova_xxxxxxxxxxxx" --project-ref ociedycfgkqvcqwdxprt

# Set GOOGLE_DRIVE_API_KEY (paste the value you copied)
npx supabase secrets set GOOGLE_DRIVE_API_KEY="gdk_xxxxxxxxxxxx" --project-ref ociedycfgkqvcqwdxprt
```

### Step 5: Verify Secrets

```powershell
npx supabase secrets list --project-ref ociedycfgkqvcqwdxprt
```

You should see both secrets listed with digest values.

### Step 6: Test Upload

1. Go to SiCuti application (https://cuti.sipandai.site)
2. Create a new leave request
3. Try uploading a document
4. Should work without "Invalid API key" error! ✅

## Alternative: Use Existing Keys from SIMPEL

If you already have working keys in SIMPEL project:

### Option A: Check Lovable Dashboard

Both SIMPEL and SiCuti projects should use the **SAME** Lovable account and Google Drive connector. So the keys should be the same!

### Option B: Ask Previous Developer

If someone else set up SIMPEL project, ask them for the Lovable API keys.

## Troubleshooting

### Cannot find API keys in Lovable?

- Make sure you're logged in with the correct Lovable account
- Check if the project owner is different
- Contact Lovable support if keys are lost

### Google Drive connector not showing?

- Click "Add Integration" in Lovable dashboard
- Search for "Google Drive"
- Click "Connect" and follow authorization flow

### Keys set but upload still fails?

```powershell
# Restart edge functions
npx supabase functions deploy leave-doc-upload --project-ref ociedycfgkqvcqwdxprt --no-verify-jwt
```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit these API keys to Git
- Never share keys publicly
- Regenerate keys if accidentally exposed
- Use separate keys for dev/staging/production if possible

## Success Criteria

✅ LOVABLE_API_KEY set in Supabase secrets
✅ GOOGLE_DRIVE_API_KEY set in Supabase secrets  
✅ Document upload works without errors
✅ Files appear in Google Drive
✅ Links are accessible

---

**Need Help?** Contact Lovable support or check their documentation at https://docs.lovable.dev
