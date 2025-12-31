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

// Admin Control Settings (Customization)
let siteConfig = {
    showGallery: true,
    showAdmission: true,
    showCourses: true,
    announcement: "Admission Open for 2026 Batch! VIP Coaching starting soon.",
    themeColor: "#fdbb2d"
};

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ VIP Database Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// --- VIP ROUTES ---

// Config API (Frontend isi se feature on/off karega)
app.get('/api/config', (req, res) => res.json(siteConfig));

// Admin Update API
app.post('/api/admin/update-site', (req, res) => {
    siteConfig = { ...siteConfig, ...req.body };
    io.emit('config-updated', siteConfig); // Sabko live update milega
    res.json({ success: true, message: "Settings Updated!" });
});

// Navigation Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/html/login.html')));
app.get('/admin-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/html/admin-dashboard.html')));
app.get('/teacher-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/html/teacher-dashboard.html')));
app.get('/student-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/html/student-dashboard.html')));

app.post('/login', (req, res) => {
    const { role, username, password } = req.body;
    // VIP Credentials
    if (username === 'admin' && password === 'admin123' && role === 'admin') {
        res.json({ success: true, redirect: '/admin-dashboard.html' });
    } else if (username === 'teacher' && password === 'pass' && role === 'teacher') {
        res.json({ success: true, redirect: '/teacher-dashboard.html' });
    } else if (username === 'student' && password === 'pass' && role === 'student') {
        res.json({ success: true, redirect: '/student-dashboard.html' });
    } else {
        res.json({ success: false, message: "Aapka ID ya Password galat hai!" });
    }
});

io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);
    socket.on('send-notification', (msg) => io.emit('receive-notification', msg));
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 VIP Server on ${PORT}`));
