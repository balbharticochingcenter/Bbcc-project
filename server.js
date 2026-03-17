const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet'); // Security Headers
const rateLimit = require('express-rate-limit'); // Stop Spamming

dotenv.config();
const app = express();

// --- SECURITY MIDDLEWARES ---
app.use(helmet()); // XSS aur baaki attacks se bachata hai
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate Limiter: Ek IP se 15 minute mein sirf 100 requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 
});
app.use('/api/', limiter);

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Secure Connection Established"))
  .catch(err => console.log("❌ DB Error"));

// Schema (Same as before)
const WebConfig = mongoose.model('WebConfig', new mongoose.Schema({
    logoText: String, title: String, subTitle: String,
    whatsapp: String, insta: String, fb: String, twitter: String
}));

app.get('/api/config', async (req, res) => {
    try {
        const config = await WebConfig.findOne().lean(); // lean() performance badhata hai
        res.json(config);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure Server on ${PORT}`));
