const { Pool, types } = require('pg');

// Force DECIMAL (OID 1700) to be returned as float instead of string
types.setTypeParser(1700, (val) => parseFloat(val));


// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
  max: 10, // Reduced for serverless concurrency
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000, // Increased to 10s for Vercel cold starts
});

// Log pool errors to catch silent connection drops
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database table
async function initDatabase() {
  const query = `
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      gender TEXT NOT NULL,
      gender_probability DECIMAL(10, 2) NOT NULL,
      sample_size INTEGER NOT NULL,
      age INTEGER NOT NULL,
      age_group TEXT NOT NULL,
      country_id TEXT NOT NULL,
      country_probability DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `;
  
  try {
    await pool.query(query);
    console.log('✅ Database table initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }
}

// Save profile to database
async function saveProfile(profile) {
  const query = `
    INSERT INTO profiles (
      id, name, gender, gender_probability, sample_size,
      age, age_group, country_id, country_probability, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const values = [
    profile.id,
    profile.name,
    profile.gender,
    profile.gender_probability,
    profile.sample_size,
    profile.age,
    profile.age_group,
    profile.country_id,
    profile.country_probability,
    profile.created_at
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      return null;
    }
    throw error;
  }
}

// Find profile by name
async function findProfileByName(name) {
  const query = 'SELECT * FROM profiles WHERE name = $1';
  try {
    const result = await pool.query(query, [name.toLowerCase()]);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding profile by name:', error);
    return null;
  }
}

// Find profile by ID
async function findProfileById(id) {
  const query = 'SELECT * FROM profiles WHERE id = $1';
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding profile by ID:', error);
    return null;
  }
}

// Get all profiles with filters
async function getAllProfiles(filters = {}) {
  let query = 'SELECT * FROM profiles WHERE 1=1';
  const values = [];
  let paramCount = 1;
  
  if (filters.gender) {
    query += ` AND LOWER(gender) = LOWER($${paramCount})`;
    values.push(filters.gender);
    paramCount++;
  }
  
  if (filters.country_id) {
    query += ` AND LOWER(country_id) = LOWER($${paramCount})`;
    values.push(filters.country_id);
    paramCount++;
  }
  
  if (filters.age_group) {
    query += ` AND LOWER(age_group) = LOWER($${paramCount})`;
    values.push(filters.age_group);
    paramCount++;
  }
  
  query += ' ORDER BY created_at DESC';
  
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting all profiles:', error);
    return [];
  }
}

// Delete profile by ID
async function deleteProfileById(id) {
  const query = 'DELETE FROM profiles WHERE id = $1 RETURNING id';
  try {
    const result = await pool.query(query, [id]);
    return result.rowCount;
  } catch (error) {
    console.error('Error deleting profile:', error);
    return 0;
  }
}

// Close database connection
async function closeDatabase() {
  await pool.end();
  console.log('Database connection closed');
}

module.exports = {
  testConnection,
  initDatabase,
  saveProfile,
  findProfileByName,
  findProfileById,
  getAllProfiles,
  deleteProfileById,
  closeDatabase
};