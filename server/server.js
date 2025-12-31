const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// --- DATABASE SETUP ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ VIP Database Connected via MongoDB"))
    .catch(err => console.error("❌ DB Error:", err));

// User Model (Database mein users isi structure mein save honge)
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true } // admin, teacher, student
});
const User = mongoose.model('User', userSchema);

// Admin Control Settings
let siteConfig = {
    showGallery: true,
    showAdmission: true,
    showCourses: true,
    announcement: "Admission Open for 2026 Batch! VIP Coaching starting soon.",
    themeColor: "#fdbb2d"
};

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// --- VIP ROUTES ---

// 1. Unified Login Logic (Database based)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Database mein username dhoondho
        const user = await User.findOne({ username });

        if (!user) {
            return res.json({ success: false, message: "User ID nahi mili!" });
        }

        // Password matching check
        if (user.password === password) {
            // Role ke hisaab se redirection decide karna
            let redirectPath = '/student-dashboard.html';
            if (user.role === 'admin') redirectPath = '/admin-dashboard.html';
            if (user.role === 'teacher') redirectPath = '/teacher-dashboard.html';

            res.json({ success: true, redirect: redirectPath });
        } else {
            res.json({ success: false, message: "Galat Password!" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server mein kuch garbar hai!" });
    }
});

// 2. Admin API: Naya user (Student/Teacher) add karne ke liye
// Iska use aap Admin Dashboard se karenge
app.post('/api/admin/create-user', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const newUser = new User({ username, password, role });
        await newUser.save();
        res.json({ success: true, message: `Naya ${role} successfully add ho gaya!` });
    } catch (err) {
        res.json({ success: false, message: "User ID pehle se maujood hai!" });
    }
});

// Settings & Navigation
app.get('/api/config', (req, res) => res.json(siteConfig));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/html/login.html')));
app.get('/admin-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/html/admin-dashboard.html')));
app.get('/teacher-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/html/teacher-dashboard.html')));
app.get('/student-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/html/student-dashboard.html')));

// Socket.io Real-time Notifications
io.on('connection', (socket) => {
    socket.on('send-notification', (msg) => io.emit('receive-notification', msg));
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 VIP Server Live on Port ${PORT}`));
