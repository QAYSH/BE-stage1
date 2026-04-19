require('dotenv').config();
const { initDatabase, testConnection, closeDatabase } = require('../src/database');


async function setup() {
  console.log('--- Database Setup Start ---');
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to the database. Please check your DATABASE_URL and network.');
    process.exit(1);
  }

  try {
    await initDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error during database initialization:', error.message);
  } finally {
    await closeDatabase();
    console.log('--- Database Setup End ---');
  }
}

setup();
