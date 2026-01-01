const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for Base64 Logo strings
app.use(express.static('public')); // Serve frontend files from public folder

// MongoDB Connection (Replace with your actual MongoDB Atlas URI)
const MONGO_URI = "YOUR_MONGODB_ATLAS_CONNECTION_STRING";
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.log("DB Connection Error:", err));

// Database Schema
const SystemSchema = new mongoose.Schema({
    logo: String,
    title: String,
    sub_title: String,
    contact: String,
    help: String,
    gmail: String,
    youtube_link: String,
    facebook: String,
    instagram: String,
    twitter: String,
    add_more: String,
    admin_name: String
});

const SystemConfig = mongoose.model('SystemConfig', SystemSchema);

// API to Get Data (For Header/Footer loading)
app.get('/api/get-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOne(); // Fetch the first config record
        res.json(data || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API to Update/Save Data
app.post('/api/update-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ message: "Settings Updated Successfully!", data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
