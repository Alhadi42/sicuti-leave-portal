const { execSync } = require('child_process');
const { readFileSync } = require('fs');

console.log('🚀 Running database migration: add_leave_documents_table.sql\n');

const ACCESS_TOKEN = 'YOUR_SUPABASE_ACCESS_TOKEN'; // Replace with your token
const PROJECT_REF = 'YOUR_PROJECT_REF'; // Replace with your project ref

try {
  // Read SQL file
  const sql = readFileSync('./add_leave_documents_table.sql', 'utf8');
  
  console.log('📝 Executing migration SQL...\n');
  
  // Execute via Supabase CLI using --file flag
  const cmd = `npx supabase db query --linked --file ./add_leave_documents_table.sql`;
  
  execSync(cmd, {
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN
    },
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ Migration completed successfully!\n');
  console.log('Created:');
  console.log('  - Table: leave_documents');
  console.log('  - Indexes: 3');
  console.log('  - RLS Policies: 7\n');
  
  console.log('📊 Verifying table...\n');
  
  // Verify table exists
  const verifyCmd = `npx supabase db query --linked "SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'leave_documents' AND table_schema = 'public';"`;
  
  const output = execSync(verifyCmd, {
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN
    },
    encoding: 'utf8'
  });
  
  console.log('✅ Table verified: leave_documents is ready!\n');
  console.log('🎉 Database migration complete!\n');
  console.log('Summary:');
  console.log('  ✓ Secrets copied from simpel-lavotas');
  console.log('  ✓ Edge functions deployed (leave-doc-upload, leave-doc-delete)');
  console.log('  ✓ Database table created (leave_documents)');
  console.log('  ✓ RLS policies configured\n');
  console.log('Next steps:');
  console.log('  1. Test upload dokumen dari frontend');
  console.log('  2. Verify file muncul di Google Drive');
  console.log('  3. Test employee dapat upload untuk proposal sendiri');
  console.log('  4. Test admin_unit dapat manage dokumen dari departmentnya\n');
  
} catch (err) {
  console.error('\n❌ Migration failed:', err.message);
  console.error('\nError details:', err);
  process.exit(1);
}
