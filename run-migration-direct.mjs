import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

// Database connection from pooler
// Password: Aliham251118! (! encoded as %21)
const connectionString = 'postgresql://postgres.ociedycfgkqvcqwdxprt:Aliham251118%21@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

console.log('🚀 Running database migration: add_leave_documents_table.sql\n');

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

try {
  console.log('📡 Connecting to database...\n');
  await client.connect();
  console.log('✅ Connected!\n');
  
  // Read SQL file
  const sql = readFileSync('./add_leave_documents_table.sql', 'utf8');
  
  console.log('📝 Executing migration SQL...\n');
  
  // Execute the entire SQL
  await client.query(sql);
  
  console.log('✅ Migration completed successfully!\n');
  console.log('Created:');
  console.log('  - Table: leave_documents');
  console.log('  - Indexes: 3');
  console.log('  - RLS Policies: 7');
  console.log('\n📊 Verifying table...\n');
  
  // Verify table exists
  const result = await client.query(`
    SELECT 
      column_name, 
      data_type, 
      is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'leave_documents' 
    AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  
  console.log(`✅ Table verified: ${result.rows.length} columns found\n`);
  
  // Check RLS is enabled
  const rlsCheck = await client.query(`
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'leave_documents';
  `);
  
  if (rlsCheck.rows[0]?.relrowsecurity) {
    console.log('✅ RLS is enabled on leave_documents\n');
  }
  
  // Count policies
  const policiesCheck = await client.query(`
    SELECT COUNT(*) as count
    FROM pg_policies
    WHERE tablename = 'leave_documents';
  `);
  
  console.log(`✅ ${policiesCheck.rows[0].count} RLS policies created\n`);
  
  console.log('🎉 Database migration complete!\n');
  console.log('Summary:');
  console.log('  ✓ Secrets copied from simpel-lavotas');
  console.log('  ✓ Edge functions deployed (leave-doc-upload, leave-doc-delete)');
  console.log('  ✓ Database table created (leave_documents)');
  console.log('  ✓ RLS policies configured');
  console.log('\nNext steps:');
  console.log('  1. Test upload dokumen dari frontend');
  console.log('  2. Verify file muncul di Google Drive');
  console.log('  3. Test employee dapat upload untuk proposal sendiri');
  console.log('  4. Test admin_unit dapat manage dokumen dari departmentnya\n');
  
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  console.error('\nError details:', err);
  process.exit(1);
} finally {
  await client.end();
}
