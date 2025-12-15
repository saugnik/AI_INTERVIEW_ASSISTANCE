// Admin Code Verification Utility
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=public'
});

/**
 * Verify if an admin code is valid
 * @param {string} code - The admin code to verify
 * @param {string} userEmail - The email of the user trying to use the code
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export async function verifyAdminCode(code, userEmail) {
    try {
        console.log(`🔍 Verifying admin code for ${userEmail}, code: ${code}`);

        const result = await pool.query(
            `SELECT * FROM public.admin_codes 
             WHERE code = $1 AND is_active = true 
             AND (expires_at IS NULL OR expires_at > NOW())`,
            [code]
        );

        console.log(`📊 Query result: ${result.rows.length} rows found`);

        if (result.rows.length === 0) {
            console.log('❌ No matching admin code found');
            return { valid: false, message: 'Invalid or expired admin code' };
        }

        const adminCode = result.rows[0];
        console.log('✅ Admin code found:', adminCode.code);

        // Track usage
        await pool.query(
            `UPDATE public.admin_codes 
             SET used_by = array_append(used_by, $1)
             WHERE code = $2 AND NOT ($1 = ANY(used_by))`,
            [userEmail, code]
        );

        console.log('✅ Admin code verified and usage tracked');
        return { valid: true, message: 'Admin code verified successfully' };
    } catch (error) {
        console.error('❌ Error verifying admin code:', error.message);
        console.error('Stack:', error.stack);
        return { valid: false, message: 'Error verifying admin code' };
    }
}

/**
 * Update user role to admin
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
export async function assignAdminRole(email) {
    try {
        await pool.query(
            `UPDATE public.auth_users SET role = 'admin' WHERE email = $1`,
            [email]
        );
        return true;
    } catch (error) {
        console.error('Error assigning admin role:', error);
        return false;
    }
}
