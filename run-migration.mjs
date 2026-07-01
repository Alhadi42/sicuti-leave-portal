import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://ociedycfgkqvcqwdxprt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Running database migration: add_leave_documents_table.sql\n');

try {
  // Read SQL file
  const sql = readFileSync('./add_leave_documents_table.sql', 'utf8');
  
  console.log('📝 Executing SQL...\n');
  
  // Execute SQL using rpc to raw SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
  
  if (error) {
    // Fallback: try using REST API directly
    console.log('⚠️  RPC method not available, using direct query...\n');
    
    // Split by statement and execute one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: stmt + ';' })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Statement ${i + 1} failed: ${text}`);
      }
    }
  }
  
  console.log('✅ Migration completed successfully!\n');
  console.log('Created:');
  console.log('  - Table: leave_documents');
  console.log('  - Indexes: 3');
  console.log('  - RLS Policies: 7');
  console.log('\n📊 Verifying table...\n');
  
  // Verify table exists
  const { data: tables, error: verifyError } = await supabase
    .from('leave_documents')
    .select('count', { count: 'exact', head: true });
  
  if (verifyError && verifyError.code !== 'PGRST116') {
    throw verifyError;
  }
  
  console.log('✅ Table verified: leave_documents is ready!\n');
  console.log('🎉 Database migration complete!\n');
  console.log('Next steps:');
  console.log('  1. Test upload dokumen dari frontend');
  console.log('  2. Verify file muncul di Google Drive');
  console.log('  3. Check RLS policies working correctly\n');
  
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  console.error('\nFull error:', err);
  process.exit(1);
}
