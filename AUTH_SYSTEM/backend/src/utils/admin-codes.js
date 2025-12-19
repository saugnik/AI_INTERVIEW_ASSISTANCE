// Admin Code Verification Utility - File-based storage
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store admin codes
const ADMIN_CODES_FILE = path.join(__dirname, '..', 'data', 'admin-codes.json');

// Default admin codes
const DEFAULT_CODES = [
    {
        code: 'ADMIN2024',
        isActive: true,
        expiresAt: null,
        usedBy: []
    }
];

/**
 * Ensure the data directory and file exist
 */
async function ensureDataFile() {
    try {
        const dataDir = path.dirname(ADMIN_CODES_FILE);
        await fs.mkdir(dataDir, { recursive: true });

        try {
            await fs.access(ADMIN_CODES_FILE);
        } catch {
            // File doesn't exist, create it with default codes
            await fs.writeFile(ADMIN_CODES_FILE, JSON.stringify(DEFAULT_CODES, null, 2));
            console.log('✅ Created admin codes file with default codes');
        }
    } catch (error) {
        console.error('Error ensuring data file:', error);
    }
}

/**
 * Read admin codes from file
 */
async function readAdminCodes() {
    await ensureDataFile();
    const data = await fs.readFile(ADMIN_CODES_FILE, 'utf-8');
    return JSON.parse(data);
}

/**
 * Write admin codes to file
 */
async function writeAdminCodes(codes) {
    await fs.writeFile(ADMIN_CODES_FILE, JSON.stringify(codes, null, 2));
}

/**
 * Verify if an admin code is valid
 * @param {string} code - The admin code to verify
 * @param {string} userEmail - The email of the user trying to use the code
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export async function verifyAdminCode(code, userEmail) {
    try {
        console.log(`🔍 Verifying admin code for ${userEmail}, code: ${code}`);

        const codes = await readAdminCodes();
        const adminCode = codes.find(c => c.code === code && c.isActive);

        if (!adminCode) {
            console.log('❌ No matching admin code found');
            return { valid: false, message: 'Invalid or expired admin code' };
        }

        // Check expiration
        if (adminCode.expiresAt && new Date(adminCode.expiresAt) < new Date()) {
            console.log('❌ Admin code has expired');
            return { valid: false, message: 'Admin code has expired' };
        }

        console.log('✅ Admin code found:', adminCode.code);

        // Track usage
        if (!adminCode.usedBy.includes(userEmail)) {
            adminCode.usedBy.push(userEmail);
            await writeAdminCodes(codes);
            console.log('✅ Admin code usage tracked');
        }

        console.log('✅ Admin code verified successfully');
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
        console.log(`🔄 Assigning admin role to ${email}...`);

        // Update role in the main backend database using save-user endpoint
        const response = await fetch('http://localhost:3001/api/auth/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                role: 'admin'
                // name and google_id will be preserved from existing user
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ Admin role assigned to ${email} successfully`);
            return true;
        } else {
            console.error(`❌ Failed to assign admin role: ${result.error || 'Unknown error'}`);
            console.error('Response:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ Error assigning admin role:', error.message);
        return false;
    }
}

