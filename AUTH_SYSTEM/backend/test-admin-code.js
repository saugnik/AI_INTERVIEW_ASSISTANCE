// Test admin code query
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=public'
});
async function testAdminCode() {
    try {
        console.log('🔍 Testing admin code query...');
        console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'Configured' : 'NOT CONFIGURED');
        const result = await pool.query(
            `SELECT * FROM public.admin_codes 
             WHERE code = $1 AND is_active = true 
             AND (expires_at IS NULL OR expires_at > NOW())`,
            ['ADMIN2024']
        );
        console.log(`✅ Query result: ${result.rows.length} rows found`);
        console.log('📋 Rows:', JSON.stringify(result.rows, null, 2));
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}
testAdminCode();
