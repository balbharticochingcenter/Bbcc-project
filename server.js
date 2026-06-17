// ============================================
// BBCC SKILL HUB SERVER
// ============================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc_portal';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

// Serve Index Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Test Route
app.get('/api/status', (req, res) => {
    res.json({ 
        success: true,
        message: 'BBCC Skill Hub API is running!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ BBCC Skill Hub Server Running!`);
    console.log(`🔗 http://localhost:${PORT}`);
    console.log(`📊 Database: ${MONGO_URI}`);
    console.log(`\n✨ Welcome to BBCC Skill Hub!\n`);
});
