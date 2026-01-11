const pg = require('pg');
const { Pool } = pg;
require('dotenv').config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
async function insertAdminCode() {
    try {
        const result = await pool.query(`
            INSERT INTO admin_codes (id, code, description, is_active, created_at, expires_at, used_by)
            VALUES (
                gen_random_uuid(),
                'ADMIN2024',
                'Default administrator access code',
                true,
                NOW(),
                NULL,
                ARRAY[]::text[]
            )
            ON CONFLICT (code) DO NOTHING
            RETURNING *;
        `);
        if (result.rowCount > 0) {
            console.log('✅ Admin code inserted successfully!');
            console.log('📝 Code:', result.rows[0].code);
            console.log('📋 Description:', result.rows[0].description);
        } else {
            console.log('ℹ️  Admin code already exists in database');
        }
    } catch (error) {
        console.error('❌ Error inserting admin code:', error.message);
    } finally {
        await pool.end();
    }
}
insertAdminCode();