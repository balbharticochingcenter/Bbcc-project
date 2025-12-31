const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // lddata server ka port

// --- MONGODB CONNECTION ---
// MONGO_URI aapne environment variable mein rakha hai
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BBCC_Portal'; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ BBCC VIP Database Linked Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- USER SCHEMA (Database Structure) ---
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
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public'))); // Aapki frontend files ki location

// --- ROLE-BASED LOGIN API ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Database mein User dhoondhna
        const user = await User.findOne({ username });

        if (user && user.password === password) {
            // User mil gaya aur password sahi hai, ab Role check karenge
            let redirectPath = '';

            if (user.role === 'admin') {
                redirectPath = '/html/admin-dashboard.html';
            } else if (user.role === 'teacher') {
                redirectPath = '/html/teacher-dashboard.html';
            } else {
                redirectPath = '/html/student-dashboard.html';
            }

            // Security ke liye password ko response se hata dena
            const { password, ...userData } = user._doc;

            res.json({ 
                success: true, 
                redirect: redirectPath, 
                user: userData 
            });

        } else {
            // Agar ID ya Password galat hai
            res.json({ success: false, message: "Invalid ID or Password!" });
        }
    } catch (err) {
        console.error("Login API Error:", err);
        res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// --- ADMIN API: CREATE NEW USER ---
// Ise admin dashboard se call kiya jayega naye student/teacher add karne ke liye
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "User added to Database!" });
    } catch (err) {
        res.json({ success: false, message: "Error: User ID might already exist!" });
    }
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`🚀 LD-DATA Backend is running on: http://localhost:${PORT}`);
});
