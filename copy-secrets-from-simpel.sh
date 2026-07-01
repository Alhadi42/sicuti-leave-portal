#!/bin/bash
# Bash script untuk copy secrets dari simpel-lavotas ke sicuti-leave-portal
# Prerequisites: Supabase CLI harus sudah terinstall dan login

set -e

echo "🔐 Copy Secrets dari Simpel-Lavotas ke SiCuti"
echo "=============================================="
echo ""

# Path ke projects
SIMPEL_PATH="d:/DATA PC ALI/CLONE APLIKASI/simpelv3/simpel-lavotas"
SICUTI_PATH="d:/DATA PC ALI/CLONE APLIKASI/SICUTI/SicutiSSO/sicuti-leave-portal"

# Check supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI tidak ditemukan!"
    echo "Install dulu dengan: npm install -g supabase"
    exit 1
fi

echo "✓ Supabase CLI ditemukan"
echo ""

# Function untuk get secret
get_secret() {
    local project_path=$1
    local secret_name=$2
    
    cd "$project_path"
    local value=$(supabase secrets list --format json 2>/dev/null | jq -r ".[] | select(.name == \"$secret_name\") | .value")
    cd - > /dev/null
    
    echo "$value"
}

# Function untuk set secret
set_secret() {
    local project_path=$1
    local secret_name=$2
    local secret_value=$3
    
    cd "$project_path"
    supabase secrets set "$secret_name=$secret_value" > /dev/null 2>&1
    local result=$?
    cd - > /dev/null
    
    return $result
}

echo "📖 Membaca secrets dari simpel-lavotas..."

# Get secrets dari simpel-lavotas
LOVABLE_KEY=$(get_secret "$SIMPEL_PATH" "LOVABLE_API_KEY")
DRIVE_KEY=$(get_secret "$SIMPEL_PATH" "GOOGLE_DRIVE_API_KEY")

if [ -z "$LOVABLE_KEY" ] || [ "$LOVABLE_KEY" == "null" ]; then
    echo "❌ LOVABLE_API_KEY tidak ditemukan di simpel-lavotas"
    echo "   Pastikan project simpel-lavotas sudah di-link dengan Supabase CLI"
    echo "   Run: cd simpel-lavotas && supabase link"
    exit 1
fi

if [ -z "$DRIVE_KEY" ] || [ "$DRIVE_KEY" == "null" ]; then
    echo "❌ GOOGLE_DRIVE_API_KEY tidak ditemukan di simpel-lavotas"
    exit 1
fi

echo "✓ LOVABLE_API_KEY ditemukan: ${LOVABLE_KEY:0:20}..."
echo "✓ GOOGLE_DRIVE_API_KEY ditemukan: ${DRIVE_KEY:0:20}..."
echo ""

echo "📝 Menulis secrets ke sicuti-leave-portal..."

# Set secrets ke sicuti-leave-portal
if set_secret "$SICUTI_PATH" "LOVABLE_API_KEY" "$LOVABLE_KEY" && \
   set_secret "$SICUTI_PATH" "GOOGLE_DRIVE_API_KEY" "$DRIVE_KEY"; then
    
    echo "✅ Secrets berhasil di-copy!"
    echo ""
    echo "Secrets yang di-set:"
    echo "  • LOVABLE_API_KEY"
    echo "  • GOOGLE_DRIVE_API_KEY"
    echo ""
    echo "🚀 Langkah selanjutnya:"
    echo "  1. Deploy edge functions:"
    echo "     cd sicuti-leave-portal"
    echo "     supabase functions deploy leave-doc-upload"
    echo "     supabase functions deploy leave-doc-delete"
    echo ""
    echo "  2. Test upload dokumen dari frontend"
    echo ""
else
    echo "❌ Gagal set secrets ke sicuti-leave-portal"
    echo "   Pastikan project sicuti sudah di-link dengan Supabase CLI"
    echo "   Run: cd sicuti-leave-portal && supabase link"
    exit 1
fi
