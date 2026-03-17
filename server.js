const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// 1. Config setup
dotenv.config();
const app = express();

// 2. Middlewares
app.use(express.json()); // JSON data read karne ke liye
app.use(cors());         // Frontend se connect karne mein problem na ho isliye

// 3. MongoDB Connection
// Yaad rahe: .env file mein MONGO_URI zaroor hona chahiye
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connect Ho Gaya!"))
    .catch((err) => console.error("❌ Connection Error:", err));

// 4. Basic Routes
app.get('/', (req, res) => {
    res.send("Server successfully chal raha hai! 🚀");
});

// Test Route: Check karne ke liye ki API sahi kaam kar rahi hai
app.get('/status', (req, res) => {
    res.json({ message: "API active hai", database: "Connected" });
});

// 5. Port Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});
