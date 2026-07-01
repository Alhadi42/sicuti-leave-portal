# PowerShell script untuk copy secrets dari simpel-lavotas ke sicuti-leave-portal
# Prerequisites: Supabase CLI harus sudah terinstall dan login

Write-Host "🔐 Copy Secrets dari Simpel-Lavotas ke SiCuti" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Path ke project simpel-lavotas
$simpelPath = "d:\DATA PC ALI\CLONE APLIKASI\simpelv3\simpel-lavotas"
$sicutiPath = "d:\DATA PC ALI\CLONE APLIKASI\SICUTI\SicutiSSO\sicuti-leave-portal"

# Check apakah supabase CLI tersedia
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "❌ Error: Supabase CLI tidak ditemukan!" -ForegroundColor Red
    Write-Host "Install dulu dengan: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase CLI ditemukan" -ForegroundColor Green
Write-Host ""

# Function untuk get secret dari project
function Get-SupabaseSecret {
    param (
        [string]$ProjectPath,
        [string]$SecretName
    )
    
    Push-Location $ProjectPath
    $output = supabase secrets list --format json 2>&1
    Pop-Location
    
    if ($LASTEXITCODE -ne 0) {
        return $null
    }
    
    try {
        $secrets = $output | ConvertFrom-Json
        $secret = $secrets | Where-Object { $_.name -eq $SecretName }
        return $secret.value
    } catch {
        return $null
    }
}

# Function untuk set secret ke project
function Set-SupabaseSecret {
    param (
        [string]$ProjectPath,
        [string]$SecretName,
        [string]$SecretValue
    )
    
    Push-Location $ProjectPath
    $result = supabase secrets set "$SecretName=$SecretValue" 2>&1
    $success = $LASTEXITCODE -eq 0
    Pop-Location
    
    return $success
}

Write-Host "📖 Membaca secrets dari simpel-lavotas..." -ForegroundColor Yellow

# Get secrets dari simpel-lavotas
$lovableKey = Get-SupabaseSecret -ProjectPath $simpelPath -SecretName "LOVABLE_API_KEY"
$driveKey = Get-SupabaseSecret -ProjectPath $simpelPath -SecretName "GOOGLE_DRIVE_API_KEY"

if (-not $lovableKey) {
    Write-Host "❌ LOVABLE_API_KEY tidak ditemukan di simpel-lavotas" -ForegroundColor Red
    Write-Host "   Pastikan project simpel-lavotas sudah di-link dengan Supabase CLI" -ForegroundColor Yellow
    Write-Host "   Run: cd simpel-lavotas && supabase link" -ForegroundColor Yellow
    exit 1
}

if (-not $driveKey) {
    Write-Host "❌ GOOGLE_DRIVE_API_KEY tidak ditemukan di simpel-lavotas" -ForegroundColor Red
    exit 1
}

Write-Host "✓ LOVABLE_API_KEY ditemukan: $($lovableKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host "✓ GOOGLE_DRIVE_API_KEY ditemukan: $($driveKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

Write-Host "📝 Menulis secrets ke sicuti-leave-portal..." -ForegroundColor Yellow

# Set secrets ke sicuti-leave-portal
$success1 = Set-SupabaseSecret -ProjectPath $sicutiPath -SecretName "LOVABLE_API_KEY" -SecretValue $lovableKey
$success2 = Set-SupabaseSecret -ProjectPath $sicutiPath -SecretName "GOOGLE_DRIVE_API_KEY" -SecretValue $driveKey

if ($success1 -and $success2) {
    Write-Host "✅ Secrets berhasil di-copy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Secrets yang di-set:" -ForegroundColor Cyan
    Write-Host "  • LOVABLE_API_KEY" -ForegroundColor White
    Write-Host "  • GOOGLE_DRIVE_API_KEY" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Langkah selanjutnya:" -ForegroundColor Cyan
    Write-Host "  1. Deploy edge functions:" -ForegroundColor White
    Write-Host "     cd sicuti-leave-portal" -ForegroundColor Gray
    Write-Host "     supabase functions deploy leave-doc-upload" -ForegroundColor Gray
    Write-Host "     supabase functions deploy leave-doc-delete" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Test upload dokumen dari frontend" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Gagal set secrets ke sicuti-leave-portal" -ForegroundColor Red
    Write-Host "   Pastikan project sicuti sudah di-link dengan Supabase CLI" -ForegroundColor Yellow
    Write-Host "   Run: cd sicuti-leave-portal && supabase link" -ForegroundColor Yellow
    exit 1
}
