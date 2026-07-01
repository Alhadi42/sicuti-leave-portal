# Script sederhana untuk copy secrets menggunakan Supabase CLI
# Cara pakai: ./copy-secrets-simple.ps1

Write-Host "🔐 Copy Secrets: Simpel-Lavotas → SiCuti" -ForegroundColor Cyan
Write-Host ""

$simpelPath = "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
$sicutiPath = "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

try {
    Write-Host "1️⃣ Get secrets dari simpel-lavotas..." -ForegroundColor Yellow
    
    Push-Location $simpelPath
    $lovableKey = (supabase secrets list | Select-String "LOVABLE_API_KEY").ToString().Split()[1]
    $driveKey = (supabase secrets list | Select-String "GOOGLE_DRIVE_API_KEY").ToString().Split()[1]
    Pop-Location
    
    if (-not $lovableKey -or -not $driveKey) {
        throw "Secrets tidak ditemukan. Pastikan sudah ada di simpel-lavotas."
    }
    
    Write-Host "   ✓ Secrets ditemukan" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "2️⃣ Set secrets ke sicuti..." -ForegroundColor Yellow
    
    Push-Location $sicutiPath
    supabase secrets set "LOVABLE_API_KEY=$lovableKey" | Out-Null
    supabase secrets set "GOOGLE_DRIVE_API_KEY=$driveKey" | Out-Null
    Pop-Location
    
    Write-Host "   ✓ Secrets berhasil di-set" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Done! Sekarang deploy edge functions:" -ForegroundColor Green
    Write-Host "   supabase functions deploy leave-doc-upload" -ForegroundColor White
    Write-Host "   supabase functions deploy leave-doc-delete" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Pastikan Supabase CLI sudah terinstall" -ForegroundColor White
    Write-Host "  2. Pastikan sudah login: supabase login" -ForegroundColor White
    Write-Host "  3. Link projects:" -ForegroundColor White
    Write-Host "     cd simpel-lavotas && supabase link" -ForegroundColor Gray
    Write-Host "     cd sicuti-leave-portal && supabase link" -ForegroundColor Gray
}
