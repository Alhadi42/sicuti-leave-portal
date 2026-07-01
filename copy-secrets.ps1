# Script untuk copy secrets dari simpel-lavotas ke sicuti-leave-portal
# Usage: .\copy-secrets.ps1

Write-Host "[INFO] Copy Secrets: Simpel-Lavotas -> SiCuti" -ForegroundColor Cyan
Write-Host ""

$simpelPath = "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
$sicutiPath = "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

try {
    Write-Host "[1/3] Reading secrets from simpel-lavotas..." -ForegroundColor Yellow
    
    # Get secrets dari simpel-lavotas
    Push-Location $simpelPath
    $secretsList = supabase secrets list 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to read secrets from simpel-lavotas. Error: $secretsList"
    }
    
    # Parse secrets
    $lovableKey = ($secretsList | Select-String "LOVABLE_API_KEY").ToString().Split('|')[1].Trim()
    $driveKey = ($secretsList | Select-String "GOOGLE_DRIVE_API_KEY").ToString().Split('|')[1].Trim()
    Pop-Location
    
    if (-not $lovableKey -or $lovableKey -eq "" -or $lovableKey -eq "null") {
        throw "LOVABLE_API_KEY not found in simpel-lavotas"
    }
    
    if (-not $driveKey -or $driveKey -eq "" -or $driveKey -eq "null") {
        throw "GOOGLE_DRIVE_API_KEY not found in simpel-lavotas"
    }
    
    Write-Host "  [OK] Secrets found" -ForegroundColor Green
    Write-Host "       LOVABLE_API_KEY: $($lovableKey.Substring(0, [Math]::Min(20, $lovableKey.Length)))..." -ForegroundColor Gray
    Write-Host "       GOOGLE_DRIVE_API_KEY: $($driveKey.Substring(0, [Math]::Min(20, $driveKey.Length)))..." -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "[2/3] Setting secrets in sicuti-leave-portal..." -ForegroundColor Yellow
    
    # Set secrets ke sicuti-leave-portal
    Push-Location $sicutiPath
    
    $result1 = supabase secrets set "LOVABLE_API_KEY=$lovableKey" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to set LOVABLE_API_KEY. Error: $result1"
    }
    
    $result2 = supabase secrets set "GOOGLE_DRIVE_API_KEY=$driveKey" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to set GOOGLE_DRIVE_API_KEY. Error: $result2"
    }
    
    Pop-Location
    
    Write-Host "  [OK] Secrets successfully set" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[3/3] Verifying secrets..." -ForegroundColor Yellow
    Push-Location $sicutiPath
    $verifyList = supabase secrets list 2>&1
    Pop-Location
    
    if ($verifyList -match "LOVABLE_API_KEY" -and $verifyList -match "GOOGLE_DRIVE_API_KEY") {
        Write-Host "  [OK] Verification passed" -ForegroundColor Green
        Write-Host ""
        Write-Host "[SUCCESS] Secrets copied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Deploy edge functions:" -ForegroundColor White
        Write-Host "     supabase functions deploy leave-doc-upload" -ForegroundColor Gray
        Write-Host "     supabase functions deploy leave-doc-delete" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Run database migration (in Supabase SQL Editor):" -ForegroundColor White
        Write-Host "     add_leave_documents_table.sql" -ForegroundColor Gray
        Write-Host ""
    } else {
        throw "Verification failed. Secrets not found in sicuti-leave-portal"
    }
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure Supabase CLI is installed:" -ForegroundColor White
    Write-Host "     npm install -g supabase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Make sure you're logged in:" -ForegroundColor White
    Write-Host "     supabase login" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Link projects:" -ForegroundColor White
    Write-Host "     cd simpel-lavotas && supabase link" -ForegroundColor Gray
    Write-Host "     cd sicuti-leave-portal && supabase link" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
