# Script to retrieve secrets and add to .env files
# This is for documentation purposes only - secrets are already in Supabase Vault

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Retrieve Secrets for .env Files" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$simpelUrl = "https://mauyygrbdopmpdpnwzra.supabase.co"
$simpelAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ"

# Recreate temporary function to get secrets
Write-Host "Step 1: Creating temporary function in SIMPEL..." -ForegroundColor Yellow
Set-Location "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"

# Ensure function directory exists
New-Item -ItemType Directory -Force -Path "supabase\functions\get-lovable-secrets" | Out-Null

# Create the function
@"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.includes("Bearer")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const googleDriveApiKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");

  return new Response(JSON.stringify({
    LOVABLE_API_KEY: lovableApiKey,
    GOOGLE_DRIVE_API_KEY: googleDriveApiKey
  }), { status: 200, headers: { "Content-Type": "application/json" } });
});
"@ | Out-File -FilePath "supabase\functions\get-lovable-secrets\index.ts" -Encoding UTF8

# Deploy function
$env:SUPABASE_ACCESS_TOKEN = "YOUR_SIMPEL_ACCESS_TOKEN"
Write-Host "  Deploying function..." -ForegroundColor Gray
npx supabase functions deploy get-lovable-secrets --project-ref mauyygrbdopmpdpnwzra 2>&1 | Out-Null
Write-Host "  ✅ Function deployed" -ForegroundColor Green

# Step 2: Fetch secrets
Write-Host ""
Write-Host "Step 2: Fetching secrets..." -ForegroundColor Yellow

Start-Sleep -Seconds 2  # Wait for deployment

$headers = @{
    "Authorization" = "Bearer $simpelAnonKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$simpelUrl/functions/v1/get-lovable-secrets" -Method Post -Headers $headers
    
    $lovableApiKey = $response.LOVABLE_API_KEY
    $googleDriveApiKey = $response.GOOGLE_DRIVE_API_KEY
    
    Write-Host "  ✅ Secrets retrieved" -ForegroundColor Green
    Write-Host ""
    
    # Display secrets for manual addition to .env
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ADD THESE TO YOUR .env FILES" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "# === Google Drive & Lovable (for Edge Functions) ===" -ForegroundColor Yellow
    Write-Host "LOVABLE_API_KEY=`"$lovableApiKey`"" -ForegroundColor Green
    Write-Host "GOOGLE_DRIVE_API_KEY=`"$googleDriveApiKey`"" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copy the lines above and add to:" -ForegroundColor Yellow
    Write-Host "  1. d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas\.env" -ForegroundColor Gray
    Write-Host "  2. d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal\.env" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  NOTE: These are for DOCUMENTATION ONLY" -ForegroundColor Red
    Write-Host "    Edge Functions read from Supabase Vault (already configured)" -ForegroundColor Red
    Write-Host "    .env files are for local development reference" -ForegroundColor Red
    Write-Host ""
    
} catch {
    Write-Host "  ❌ Failed to fetch secrets" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
Write-Host "Step 3: Cleaning up..." -ForegroundColor Yellow
npx supabase functions delete get-lovable-secrets --project-ref mauyygrbdopmpdpnwzra 2>&1 | Out-Null
Remove-Item -Recurse -Force "supabase\functions\get-lovable-secrets" -ErrorAction SilentlyContinue
Write-Host "  ✅ Cleanup complete" -ForegroundColor Green
Write-Host ""
