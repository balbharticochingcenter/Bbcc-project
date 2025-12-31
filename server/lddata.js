const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Naya add kiya hai cross-origin request ke liye
const path = require('path');

const app = express();

// Render.com ke liye PORT setting: process.env.PORT Render khud deta hai
const PORT = process.env.PORT || 3000;

// --- DATABASE CONNECTION ---
// Render ke dashboard mein "MONGO_URI" variable set karein
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BBCC_Portal'; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ BBCC VIP Database Linked Successfully (Atlas/Render)"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // admin, teacher, student
    fname: String,
    lname: String,
    mobile: String,
    email: String,
    joinDate: { type: Date, default: Date.now },
    profilePhoto: { type: String, default: "/assets/default-user.png" }
});

const User = mongoose.model('User', userSchema);

// --- MIDDLEWARES ---
app.use(cors()); // Isse login button backend se connect ho payega
app.use(bodyParser.json());
// Render par static files serve karne ke liye sahi path setup
app.use(express.static(path.join(__dirname, 'public'))); 

// --- ROLE-BASED LOGIN API ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && user.password === password) {
            let redirectPath = '';

            // Role check logic
            if (user.role === 'admin') {
                redirectPath = '/html/admin-dashboard.html';
            } else if (user.role === 'teacher') {
                redirectPath = '/html/teacher-dashboard.html';
            } else {
                redirectPath = '/html/student-dashboard.html';
            }

            const { password, ...userData } = user._doc;

            res.json({ 
                success: true, 
                redirect: redirectPath, 
                user: userData 
            });

        } else {
            res.json({ success: false, message: "Invalid ID or Password!" });
        }
    } catch (err) {
        console.error("Login API Error:", err);
        res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// --- ADMIN API: CREATE NEW USER ---
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "User added successfully!" });
    } catch (err) {
        res.json({ success: false, message: "Error: ID already exists!" });
    }
});

// Default Route (Homepage)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

// --- SERVER START ---
// Render ke liye '0.0.0.0' par bind karna zaroori hai
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Live on Port: ${PORT}`);
});
