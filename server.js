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

// ========== EXTRA ADMIN APIs (Change ID/Password) ==========
// Get all admins (for super admin)
app.get('/api/admins', async (req, res) => {
    try {
        const Admin = require('./models/Admin');
        const admins = await Admin.find().select('-pws');
        res.json({ success: true, data: admins });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create new admin (for super admin)
app.post('/api/admins', async (req, res) => {
    try {
        const Admin = require('./models/Admin');
        const { adminID, password, name } = req.body;
        
        const existing = await Admin.findOne({ adminID });
        if (existing) {
            return res.status(400).json({ success: false, message: "Admin ID already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({
            adminID,
            pws: hashedPassword,
            name: name || 'Admin'
        });
        await admin.save();
        
        res.json({ success: true, message: "Admin created successfully", data: { adminID, name } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Change admin password (logged in admin can change their own password)
app.post('/api/change-password', async (req, res) => {
    try {
        const Admin = require('./models/Admin');
        const { adminID, oldPassword, newPassword } = req.body;
        
        const admin = await Admin.findOne({ adminID });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const isValid = await bcrypt.compare(oldPassword, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Old password is incorrect" });
        }
        
        admin.pws = await bcrypt.hash(newPassword, 10);
        await admin.save();
        
        res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Change admin ID (logged in admin can change their own ID)
app.post('/api/change-admin-id', async (req, res) => {
    try {
        const Admin = require('./models/Admin');
        const { oldAdminID, newAdminID, password } = req.body;
        
        const admin = await Admin.findOne({ adminID: oldAdminID });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const isValid = await bcrypt.compare(password, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Password is incorrect" });
        }
        
        // Check if new ID already exists
        const existing = await Admin.findOne({ adminID: newAdminID });
        if (existing && existing._id.toString() !== admin._id.toString()) {
            return res.status(400).json({ success: false, message: "Admin ID already taken" });
        }
        
        admin.adminID = newAdminID;
        await admin.save();
        
        res.json({ success: true, message: "Admin ID changed successfully", newAdminID });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Setup admin route (for first time setup)
app.get('/api/setup-admin', async (req, res) => {
    try {
        const Admin = require('./models/Admin');
        
        const existing = await Admin.findOne({ adminID: 'admin' });
        if (existing) {
            return res.json({ success: true, message: "Admin already exists! Use admin/admin123" });
        }
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Admin({
            adminID: 'admin',
            pws: hashedPassword,
            name: 'Super Admin',
            loginAttempts: 0,
            lockUntil: null
        });
        await admin.save();
        
        res.json({ success: true, message: "Admin created! Use admin/admin123" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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
    console.log(`📌 Default Credentials: admin / admin123`);
    console.log(`\n📌 Admin APIs:`);
    console.log(`   GET  /api/admins - List all admins`);
    console.log(`   POST /api/admins - Create new admin`);
    console.log(`   POST /api/change-password - Change password`);
    console.log(`   POST /api/change-admin-id - Change admin ID`);
    console.log(`   GET  /api/setup-admin - Setup default admin\n`);
});
