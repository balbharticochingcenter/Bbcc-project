require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const bcrypt = require('bcrypt');

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
const connectDB = require('./models');
connectDB();

// ========== IMPORT ROUTES ==========
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const publicRoutes = require('./routes/publicRoutes');

// ========== USE ROUTES ==========
app.use('/api', publicRoutes);
app.use('/api', studentRoutes);
app.use('/api', adminRoutes);
app.use('/api', teacherRoutes);

// ========== SERVE HTML FILES ==========
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'management.html')); });
app.get('/student-management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'student-management.html')); });

// ========== AUTO CREATE DEFAULT ADMIN ==========
mongoose.connection.once('open', async () => {
    try {
        const Admin = require('./models/Admin');
        
        // Check if admin exists
        const existingAdmin = await Admin.findOne({ adminID: 'admin' });
        
        if (!existingAdmin) {
            // Create default admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const defaultAdmin = new Admin({
                adminID: 'admin',
                pws: hashedPassword,
                name: 'Super Admin',
                loginAttempts: 0,
                lockUntil: null
            });
            await defaultAdmin.save();
            console.log('\n✅ =====================================');
            console.log('✅ DEFAULT ADMIN CREATED SUCCESSFULLY!');
            console.log('✅ =====================================');
            console.log('   👤 Admin ID: admin');
            console.log('   🔑 Password: admin123');
            console.log('✅ =====================================\n');
        } else {
            console.log('✅ Admin already exists in database');
        }
    } catch (err) {
        console.log('❌ Admin creation error:', err.message);
    }
});

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
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`📌 Login Page: http://localhost:${PORT}/login.html`);
    console.log(`📌 Default Credentials: admin / admin123\n`);
});
