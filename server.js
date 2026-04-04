require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const connectDB = require('./models');

// Import Routes
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(xss());
app.use(mongoSanitize());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// ========== DATABASE CONNECTION ==========
connectDB();

// ========== ROUTES ==========
app.use('/api', publicRoutes);
app.use('/api', studentRoutes);
app.use('/api', adminRoutes);
app.use('/api', teacherRoutes);

// ========== SERVE HTML FILES ==========
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/student-management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'student-management.html')); });
app.get('/student-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html')); });
app.get('/teacher-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html')); });

// ========== ERROR HANDLERS ==========
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).json({ success: false, message: "Something went wrong!" });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "API not found" });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`\n📌 API Endpoints:`);
    console.log(`   POST /api/student-register - Register Student`);
    console.log(`   POST /api/student-login - Student Login`);
    console.log(`   GET  /api/students - Get All Students`);
    console.log(`   POST /api/admin-login - Admin Login`);
    console.log(`   POST /api/teacher-login - Teacher Login`);
});
