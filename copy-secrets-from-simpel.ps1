# Script to copy Lovable secrets from SIMPEL to SICUTI
# Uses temporary edge function to retrieve secrets

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Copy Lovable Secrets: SIMPEL → SICUTI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$simpelUrl = "https://mauyygrbdopmpdpnwzra.supabase.co"
$simpelAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ"
$sicutiProjectRef = "ociedycfgkqvcqwdxprt"
$sicutiAccessToken = "YOUR_SICUTI_ACCESS_TOKEN"

# Step 1: Get secrets from SIMPEL edge function
Write-Host "Step 1: Fetching secrets from SIMPEL..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $simpelAnonKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$simpelUrl/functions/v1/get-lovable-secrets" -Method Post -Headers $headers
    
    $lovableApiKey = $response.LOVABLE_API_KEY
    $googleDriveApiKey = $response.GOOGLE_DRIVE_API_KEY
    
    if (-not $lovableApiKey -or -not $googleDriveApiKey) {
        Write-Host "  ❌ Failed to retrieve secrets" -ForegroundColor Red
        Write-Host "  Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "  ✅ Secrets retrieved successfully" -ForegroundColor Green
    Write-Host "     LOVABLE_API_KEY: $($lovableApiKey.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "     GOOGLE_DRIVE_API_KEY: $($googleDriveApiKey.Substring(0, 20))..." -ForegroundColor Gray
    
} catch {
    Write-Host "  ❌ Failed to fetch secrets from SIMPEL" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Set secrets to SICUTI
Write-Host ""
Write-Host "Step 2: Setting secrets to SICUTI..." -ForegroundColor Yellow

$env:SUPABASE_ACCESS_TOKEN = $sicutiAccessToken
Set-Location "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

try {
    # Set LOVABLE_API_KEY
    Write-Host "  Setting LOVABLE_API_KEY..." -ForegroundColor Gray
    $output1 = npx supabase secrets set "LOVABLE_API_KEY=$lovableApiKey" --project-ref $sicutiProjectRef 2>&1
    
    # Set GOOGLE_DRIVE_API_KEY
    Write-Host "  Setting GOOGLE_DRIVE_API_KEY..." -ForegroundColor Gray
    $output2 = npx supabase secrets set "GOOGLE_DRIVE_API_KEY=$googleDriveApiKey" --project-ref $sicutiProjectRef 2>&1
    
    Write-Host "  ✅ Secrets set successfully" -ForegroundColor Green
    
} catch {
    Write-Host "  ❌ Failed to set secrets to SICUTI" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Verify secrets match
Write-Host ""
Write-Host "Step 3: Verifying secrets..." -ForegroundColor Yellow

$output = npx supabase secrets list --project-ref $sicutiProjectRef 2>&1 | Out-String

if ($output -match "GOOGLE_DRIVE_API_KEY\s*\|\s*670ba8c22b1a6b249f75c406e65cca5b6405d861a50309fd1e8de4fe9fb9f65d" -and
    $output -match "LOVABLE_API_KEY\s*\|\s*917e56f1114a99280038c39d423f7564ca552460d6a6361b59e6f58ac5e02f99") {
    Write-Host "  ✅ Secrets verified - digests match SIMPEL!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Could not verify digests automatically" -ForegroundColor Yellow
    Write-Host "  Run '.\check-secrets.ps1' to verify manually" -ForegroundColor Gray
}

# Step 4: Deploy edge functions
Write-Host ""
Write-Host "Step 4: Deploying edge functions..." -ForegroundColor Yellow

Write-Host "  Deploying leave-doc-upload..." -ForegroundColor Gray
npx supabase functions deploy leave-doc-upload --project-ref $sicutiProjectRef 2>&1 | Out-Null

Write-Host "  Deploying leave-doc-delete..." -ForegroundColor Gray
npx supabase functions deploy leave-doc-delete --project-ref $sicutiProjectRef 2>&1 | Out-Null

Write-Host "  ✅ Edge functions deployed" -ForegroundColor Green

# Success!
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ SUCCESS! Secrets copied" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test document upload in the app" -ForegroundColor Gray
Write-Host "  2. Delete the temporary function from SIMPEL:" -ForegroundColor Gray
Write-Host "     cd 'd:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas'" -ForegroundColor Gray
Write-Host "     npx supabase functions delete get-lovable-secrets --project-ref mauyygrbdopmpdpnwzra" -ForegroundColor Gray
Write-Host ""
