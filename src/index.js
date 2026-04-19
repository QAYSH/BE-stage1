require('dotenv').config();

// Global error handlers for debugging silent crashes in Serverless environments
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
const { v7: uuidv7 } = require('uuid');
const database = require('./database');
const { fetchAllAPIData } = require('./apiHelpers');
const { validateName } = require('./validators');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await database.testConnection();
  res.status(200).json({ 
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Diagnostic endpoint
app.get('/api/debug', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  const dbStatus = await database.testConnection();
  
  res.status(200).json({
    status: 'debug_info',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_PRESENT: !!dbUrl,
      DATABASE_URL_LENGTH: dbUrl ? dbUrl.length : 0,
      DATABASE_URL_START: dbUrl ? dbUrl.substring(0, 15) + '...' : 'none'
    },
    database: {
      connected: dbStatus
    },
    uuid_test: {
      working: typeof uuidv7 === 'function',
      sample: typeof uuidv7 === 'function' ? uuidv7() : 'failed'
    },
    timestamp: new Date().toISOString()
  });
});


// Initialize database
let dbInitialized = false;

async function initializeDatabase() {
  if (!dbInitialized) {
    await database.initDatabase();
    dbInitialized = true;
  }
}

// ========== ENDPOINT 1: Create Profile ==========
app.post('/api/profiles', async (req, res) => {
  try {
    await initializeDatabase();
    
    const { name } = req.body;
    
    // Validate name
    const validation = validateName(name);
    if (!validation.valid) {
      return res.status(validation.status).json({
        status: 'error',
        message: validation.message
      });
    }
    
    const normalizedName = name.toLowerCase().trim();
    
    // Check if profile already exists
    const existingProfile = await database.findProfileByName(normalizedName);
    
    if (existingProfile) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile already exists',
        data: existingProfile
      });
    }
    
    // Fetch data from all three APIs
    let apiData;
    try {
      apiData = await fetchAllAPIData(normalizedName);
    } catch (error) {
      return res.status(502).json({
        status: 'error',
        message: error.message
      });
    }
    
    // Create new profile
    const newProfile = {
      id: uuidv7(),
      name: normalizedName,
      ...apiData,
      created_at: new Date().toISOString()
    };
    
    // Save to database
    await database.saveProfile(newProfile);
    
    // Return success response
    res.status(201).json({
      status: 'success',
      data: newProfile
    });
    
  } catch (error) {
    console.error('Error in POST /api/profiles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// ========== ENDPOINT 2: Get Single Profile ==========
app.get('/api/profiles/:id', async (req, res) => {
  try {
    await initializeDatabase();
    
    const { id } = req.params;
    
    const profile = await database.findProfileById(id);
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: profile
    });
    
  } catch (error) {
    console.error('Error in GET /api/profiles/:id:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// ========== ENDPOINT 3: Get All Profiles ==========
app.get('/api/profiles', async (req, res) => {
  try {
    await initializeDatabase();
    
    const { gender, country_id, age_group } = req.query;
    
    const filters = {};
    if (gender) filters.gender = gender;
    if (country_id) filters.country_id = country_id;
    if (age_group) filters.age_group = age_group;
    
    const profiles = await database.getAllProfiles(filters);
    
    // Return only specified fields for list view
    const simplifiedProfiles = profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      age_group: profile.age_group,
      country_id: profile.country_id
    }));
    
    res.status(200).json({
      status: 'success',
      count: simplifiedProfiles.length,
      data: simplifiedProfiles
    });
    
  } catch (error) {
    console.error('Error in GET /api/profiles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// ========== ENDPOINT 4: Delete Profile ==========
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    await initializeDatabase();
    
    const { id } = req.params;
    
    const deleted = await database.deleteProfileById(id);
    
    if (deleted === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }
    
    res.status(204).send();
    
  } catch (error) {
    console.error('Error in DELETE /api/profiles/:id:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Only start server locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST   /api/profiles');
    console.log('  GET    /api/profiles');
    console.log('  GET    /api/profiles/:id');
    console.log('  DELETE /api/profiles/:id');
  });
}

// Export for Vercel
module.exports = app;