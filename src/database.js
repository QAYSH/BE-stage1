const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, '../profiles.db'));

// Initialize database table
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        gender TEXT NOT NULL,
        gender_probability REAL NOT NULL,
        sample_size INTEGER NOT NULL,
        age INTEGER NOT NULL,
        age_group TEXT NOT NULL,
        country_id TEXT NOT NULL,
        country_probability REAL NOT NULL,
        created_at TEXT NOT NULL
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Save profile to database
async function saveProfile(profile) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO profiles (
        id, name, gender, gender_probability, sample_size,
        age, age_group, country_id, country_probability, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
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
    ], function(err) {
      if (err) reject(err);
      else resolve(profile);
    });
  });
}

// Find profile by name
async function findProfileByName(name) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM profiles WHERE name = ?', [name.toLowerCase()], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Find profile by ID
async function findProfileById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM profiles WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Get all profiles with filters
async function getAllProfiles(filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM profiles WHERE 1=1';
    const params = [];
    
    // Apply filters (case-insensitive)
    if (filters.gender) {
      sql += ' AND LOWER(gender) = LOWER(?)';
      params.push(filters.gender);
    }
    
    if (filters.country_id) {
      sql += ' AND LOWER(country_id) = LOWER(?)';
      params.push(filters.country_id);
    }
    
    if (filters.age_group) {
      sql += ' AND LOWER(age_group) = LOWER(?)';
      params.push(filters.age_group);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Delete profile by ID
async function deleteProfileById(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM profiles WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this.changes); // Returns number of deleted rows
    });
  });
}

module.exports = {
  initDatabase,
  saveProfile,
  findProfileByName,
  findProfileById,
  getAllProfiles,
  deleteProfileById,
  db
};