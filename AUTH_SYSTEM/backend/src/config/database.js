// Database configuration and user management
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Database connected');
    }
});

// Create users table if not exists
export async function initDatabase() {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      picture TEXT,
      auth_provider VARCHAR(50) DEFAULT 'google',
      created_at TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP DEFAULT NOW()
    );
  `;

    try {
        await pool.query(createTableQuery);
        console.log('✅ Users table ready');
    } catch (error) {
        console.error('❌ Error creating users table:', error);
    }
}

// Get user by Google ID
export async function getUserByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await pool.query(query, [googleId]);
    return result.rows[0] || null;
}

// Get user by ID
export async function getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
}

// Create or update user
export async function createOrUpdateUser(googleId, email, name, picture) {
    const existingUser = await getUserByGoogleId(googleId);

    if (existingUser) {
        // Update existing user
        const query = `
      UPDATE users 
      SET name = $1, picture = $2, last_login = NOW()
      WHERE google_id = $3
      RETURNING *
    `;
        const result = await pool.query(query, [name, picture, googleId]);
        return result.rows[0];
    } else {
        // Create new user
        const query = `
      INSERT INTO users (google_id, email, name, picture)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const result = await pool.query(query, [googleId, email, name, picture]);
        return result.rows[0];
    }
}

export default pool;
