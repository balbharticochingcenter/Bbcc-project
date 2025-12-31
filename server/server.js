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

// Port setup for Render
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Static Files Serve karna (public folder ke liye)
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Atlas connection (Using Environment Variable)
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- ROUTES ---

// 1. Home/Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/login.html'));
});

// 2. Dashboards Routes (Redirects fix karne ke liye)
app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/admin-dashboard.html'));
});

app.get('/teacher-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/teacher-dashboard.html'));
});

app.get('/student-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/student-dashboard.html'));
});

// 3. Login API Logic
app.post('/login', (req, res) => {
    const { role, username, password } = req.body;
    
    // Simple authentication (Aap ise baad mein database se connect kar sakte hain)
    if (username === 'admin' && password === 'pass' && role === 'admin') {
        res.json({ success: true, redirect: '/admin-dashboard.html' });
    } else if (username === 'teacher' && password === 'pass' && role === 'teacher') {
        res.json({ success: true, redirect: '/teacher-dashboard.html' });
    } else if (username === 'student' && password === 'pass' && role === 'student') {
        res.json({ success: true, redirect: '/student-dashboard.html' });
    } else {
        res.json({ success: false, message: "Invalid Credentials" });
    }
});

// --- REAL-TIME NOTIFICATIONS (Socket.io) ---
io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Jab teacher ya admin koi popup bhejta hai
    socket.on('send-notification', (data) => {
        // Sabhi connected users (students) ko notification bhej dena
        io.emit('receive-notification', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Server Start
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
