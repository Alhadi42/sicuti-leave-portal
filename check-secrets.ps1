# Simple script to check and compare secrets between SIMPEL and SICUTI

Write-Host ""
Write-Host "=== Checking SIMPEL Secrets ===" -ForegroundColor Cyan
Write-Host ""

$env:SUPABASE_ACCESS_TOKEN = "YOUR_SIMPEL_ACCESS_TOKEN"
Set-Location "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
npx supabase secrets list --project-ref mauyygrbdopmpdpnwzra

Write-Host ""
Write-Host "=== Checking SICUTI Secrets ===" -ForegroundColor Cyan
Write-Host ""

$env:SUPABASE_ACCESS_TOKEN = "YOUR_SICUTI_ACCESS_TOKEN"
Set-Location "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"
npx supabase secrets list --project-ref ociedycfgkqvcqwdxprt

Write-Host ""
Write-Host "=== MANUAL COMPARISON ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Compare the LOVABLE_API_KEY and GOOGLE_DRIVE_API_KEY digests above."
Write-Host "They should be EXACTLY THE SAME."
Write-Host ""
Write-Host "SIMPEL Expected:" -ForegroundColor Green
Write-Host "  GOOGLE_DRIVE_API_KEY: 670ba8c22b1a6b249f75c406e65cca5b6405d861a50309fd1e8de4fe9fb9f65d"
Write-Host "  LOVABLE_API_KEY:      917e56f1114a99280038c39d423f7564ca552460d6a6361b59e6f58ac5e02f99"
Write-Host ""
Write-Host "If SICUTI digests are DIFFERENT, follow GET_SECRETS_MANUAL_STEPS.md" -ForegroundColor Red
Write-Host ""
