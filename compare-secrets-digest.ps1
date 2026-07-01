#!/usr/bin/env pwsh
# Script untuk membandingkan digest secrets antara SIMPEL dan SICUTI
# Membantu verify apakah secrets sudah sama

Write-Host "`n🔐 Compare Secrets Digest: SIMPEL vs SICUTI`n" -ForegroundColor Cyan

# Paths
$simpelPath = "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
$sicutiPath = "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

# Function to get secrets from a project
function Get-ProjectSecrets {
    param (
        [string]$ProjectPath,
        [string]$ProjectRef,
        [string]$AccessToken,
        [string]$ProjectName
    )
    
    Write-Host "📋 Getting secrets from $ProjectName..." -ForegroundColor Yellow
    
    Push-Location $ProjectPath
    $env:SUPABASE_ACCESS_TOKEN = $AccessToken
    
    $output = npx supabase secrets list --project-ref $ProjectRef 2>&1 | Out-String
    
    Pop-Location
    
    # Parse output untuk extract digest
    $secrets = @{}
    $lines = $output -split "`n"
    foreach ($line in $lines) {
        if ($line -match "^\s*(LOVABLE_API_KEY|GOOGLE_DRIVE_API_KEY)\s*\|\s*([a-f0-9]{64})") {
            $secretName = $matches[1].Trim()
            $digest = $matches[2].Trim()
            $secrets[$secretName] = $digest
        }
    }
    
    return $secrets
}

# Get secrets dari SIMPEL
Write-Host ""
$simpelSecrets = Get-ProjectSecrets `
    -ProjectPath $simpelPath `
    -ProjectRef "mauyygrbdopmpdpnwzra" `
    -AccessToken "YOUR_SIMPEL_ACCESS_TOKEN" `
    -ProjectName "SIMPEL (mauyygrbdopmpdpnwzra)"

# Get secrets dari SICUTI
Write-Host ""
$sicutiSecrets = Get-ProjectSecrets `
    -ProjectPath $sicutiPath `
    -ProjectRef "ociedycfgkqvcqwdxprt" `
    -AccessToken "YOUR_SICUTI_ACCESS_TOKEN" `
    -ProjectName "SICUTI (ociedycfgkqvcqwdxprt)"

# Compare secrets
Write-Host "`n" + ("="*80) -ForegroundColor Cyan
Write-Host "📊 COMPARISON RESULTS" -ForegroundColor Cyan
Write-Host ("="*80) -ForegroundColor Cyan

$allMatch = $true

foreach ($secretName in @("LOVABLE_API_KEY", "GOOGLE_DRIVE_API_KEY")) {
    $simpelDigest = $simpelSecrets[$secretName]
    $sicutiDigest = $sicutiSecrets[$secretName]
    
    Write-Host "`n🔑 $secretName" -ForegroundColor Yellow
    Write-Host ("-"*80) -ForegroundColor DarkGray
    
    if (-not $simpelDigest) {
        Write-Host "   SIMPEL: ❌ NOT FOUND" -ForegroundColor Red
        $allMatch = $false
    } else {
        Write-Host "   SIMPEL: $simpelDigest" -ForegroundColor Gray
    }
    
    if (-not $sicutiDigest) {
        Write-Host "   SICUTI: ❌ NOT FOUND" -ForegroundColor Red
        $allMatch = $false
    } else {
        Write-Host "   SICUTI: $sicutiDigest" -ForegroundColor Gray
    }
    
    if ($simpelDigest -and $sicutiDigest) {
        if ($simpelDigest -eq $sicutiDigest) {
            Write-Host "   STATUS: ✅ MATCH" -ForegroundColor Green
        } else {
            Write-Host "   STATUS: ❌ DIFFERENT" -ForegroundColor Red
            $allMatch = $false
        }
    } else {
        Write-Host "   STATUS: ❌ MISSING" -ForegroundColor Red
        $allMatch = $false
    }
}

Write-Host ""
Write-Host ("="*80) -ForegroundColor Cyan

if ($allMatch) {
    Write-Host "✅ SUCCESS: All secrets match!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Deploy edge functions:" -ForegroundColor Gray
    Write-Host "   npx supabase functions deploy leave-doc-upload --project-ref ociedycfgkqvcqwdxprt" -ForegroundColor Gray
    Write-Host "   npx supabase functions deploy leave-doc-delete --project-ref ociedycfgkqvcqwdxprt" -ForegroundColor Gray
    Write-Host "2. Test upload dari frontend" -ForegroundColor Gray
} else {
    Write-Host "❌ FAILED: Secrets do not match!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Action required:" -ForegroundColor Yellow
    Write-Host "1. Get keys from Lovable Dashboard (https://lovable.dev)" -ForegroundColor Gray
    Write-Host "2. Set secrets to SiCuti:" -ForegroundColor Gray
    Write-Host "   cd `"$sicutiPath`"" -ForegroundColor Gray
    Write-Host "   `$env:SUPABASE_ACCESS_TOKEN=`"YOUR_SICUTI_ACCESS_TOKEN`"" -ForegroundColor Gray
    Write-Host "   npx supabase secrets set LOVABLE_API_KEY=`"lova_xxxx`" --project-ref ociedycfgkqvcqwdxprt" -ForegroundColor Gray
    Write-Host "   npx supabase secrets set GOOGLE_DRIVE_API_KEY=`"gdk_xxxx`" --project-ref ociedycfgkqvcqwdxprt" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 Read GET_SECRETS_MANUAL_STEPS.md for detailed instructions" -ForegroundColor Cyan
}

Write-Host ""
