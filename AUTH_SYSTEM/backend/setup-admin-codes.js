// Setup admin_codes table in the database
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=public'
});

async function setupAdminCodes() {
    try {
        console.log('🔧 Setting up admin_codes table...');

        // Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.admin_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                used_by TEXT[] DEFAULT ARRAY[]::TEXT[]
            )
        `);

        console.log('✅ Table created successfully');

        // Insert default admin code
        await pool.query(`
            INSERT INTO public.admin_codes (code, is_active, expires_at)
            VALUES ('ADMIN2024', true, NULL)
            ON CONFLICT (code) DO NOTHING
        `);

        console.log('✅ Default admin code inserted');

        // Verify
        const result = await pool.query('SELECT * FROM public.admin_codes');
        console.log('📊 Current admin codes:');
        console.table(result.rows);

        await pool.end();
        console.log('✅ Setup complete!');
    } catch (error) {
        console.error('❌ Error setting up admin codes:', error);
        await pool.end();
        process.exit(1);
    }
}

setupAdminCodes();
