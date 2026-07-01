# Script untuk copy secrets dari simpel-lavotas ke sicuti-leave-portal
# Menggunakan Supabase Management API dengan access tokens

Write-Host "[INFO] Copy Secrets: Simpel-Lavotas -> SiCuti" -ForegroundColor Cyan
Write-Host ""

# Access tokens (REPLACE WITH YOUR ACTUAL TOKENS)
$SIMPEL_TOKEN = "YOUR_SIMPEL_ACCESS_TOKEN"
$SICUTI_TOKEN = "YOUR_SICUTI_ACCESS_TOKEN"

# Project refs
$SIMPEL_PROJECT_REF = "YOUR_SIMPEL_PROJECT_REF"
$SICUTI_PROJECT_REF = "YOUR_SICUTI_PROJECT_REF"

# Supabase Management API
$API_BASE = "https://api.supabase.com/v1"

try {
    Write-Host "[1/3] Reading secrets from simpel-lavotas..." -ForegroundColor Yellow
    
    # Get secrets dari simpel-lavotas
    $headers = @{
        "Authorization" = "Bearer $SIMPEL_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_BASE/projects/$SIMPEL_PROJECT_REF/secrets" `
        -Method Get -Headers $headers -ErrorAction Stop
    
    $lovableKey = ($response | Where-Object { $_.name -eq "LOVABLE_API_KEY" }).value
    $driveKey = ($response | Where-Object { $_.name -eq "GOOGLE_DRIVE_API_KEY" }).value
    
    if (-not $lovableKey) {
        throw "LOVABLE_API_KEY not found in simpel-lavotas"
    }
    
    if (-not $driveKey) {
        throw "GOOGLE_DRIVE_API_KEY not found in simpel-lavotas"
    }
    
    Write-Host "  [OK] Secrets found" -ForegroundColor Green
    Write-Host "       LOVABLE_API_KEY: $($lovableKey.Substring(0, [Math]::Min(20, $lovableKey.Length)))..." -ForegroundColor Gray
    Write-Host "       GOOGLE_DRIVE_API_KEY: $($driveKey.Substring(0, [Math]::Min(20, $driveKey.Length)))..." -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "[2/3] Setting secrets in sicuti-leave-portal..." -ForegroundColor Yellow
    
    # Set secrets ke sicuti-leave-portal
    $sicutiHeaders = @{
        "Authorization" = "Bearer $SICUTI_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $secretsToSet = @(
        @{
            name = "LOVABLE_API_KEY"
            value = $lovableKey
        },
        @{
            name = "GOOGLE_DRIVE_API_KEY"
            value = $driveKey
        }
    )
    
    $body = @($secretsToSet) | ConvertTo-Json -Depth 10
    
    $setResponse = Invoke-RestMethod -Uri "$API_BASE/projects/$SICUTI_PROJECT_REF/secrets" `
        -Method Post -Headers $sicutiHeaders -Body $body -ErrorAction Stop
    
    Write-Host "  [OK] Secrets successfully set" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[3/3] Verifying secrets..." -ForegroundColor Yellow
    
    # Verify secrets di sicuti
    $verifyResponse = Invoke-RestMethod -Uri "$API_BASE/projects/$SICUTI_PROJECT_REF/secrets" `
        -Method Get -Headers $sicutiHeaders -ErrorAction Stop
    
    $hasLovable = $verifyResponse | Where-Object { $_.name -eq "LOVABLE_API_KEY" }
    $hasDrive = $verifyResponse | Where-Object { $_.name -eq "GOOGLE_DRIVE_API_KEY" }
    
    if ($hasLovable -and $hasDrive) {
        Write-Host "  [OK] Verification passed" -ForegroundColor Green
        Write-Host ""
        Write-Host "[SUCCESS] Secrets copied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Secrets in sicuti-leave-portal:" -ForegroundColor Cyan
        Write-Host "  - LOVABLE_API_KEY: ****" -ForegroundColor White
        Write-Host "  - GOOGLE_DRIVE_API_KEY: ****" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Deploy edge functions:" -ForegroundColor White
        Write-Host "     supabase functions deploy leave-doc-upload --project-ref $SICUTI_PROJECT_REF" -ForegroundColor Gray
        Write-Host "     supabase functions deploy leave-doc-delete --project-ref $SICUTI_PROJECT_REF" -ForegroundColor Gray
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
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $errorBody = $reader.ReadToEnd()
        Write-Host "API Error: $errorBody" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check if access tokens are still valid" -ForegroundColor White
    Write-Host "  2. Verify project refs are correct" -ForegroundColor White
    Write-Host "  3. Make sure you have permission to manage secrets" -ForegroundColor White
    Write-Host ""
    exit 1
}
