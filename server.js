require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// ========== DATABASE CONNECTION ==========
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc_portal';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err.message));

// ========== ========== ========== ==========
// ========== JWT VERIFY MIDDLEWARE ==========
// ========== ========== ========== ==========
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
};

// ========== ========== ========== ==========
// ========== ADMIN MODEL (SERVER MEIN) ==========
// ========== ========== ========== ==========
const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true },
    pws: { type: String, required: true },
    name: { type: String, default: 'Admin' },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date }
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

// ========== ========== ========== ==========
// ========== ADMIN APIs ==========
// ========== ========== ========== ==========

// Admin Login
app.post('/api/admin-login', async (req, res) => {
    const { userid, password } = req.body;
    console.log(`📌 Login attempt: ${userid}`);
    
    try {
        const admin = await Admin.findOne({ adminID: userid });
        
        if (!admin) {
            console.log('❌ Admin not found');
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const isValid = await bcrypt.compare(password, admin.pws);
        if (!isValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        admin.lastLogin = new Date();
        await admin.save();
        
        const token = jwt.sign(
            { id: admin._id, adminID: admin.adminID, role: 'admin' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful:', userid);
        res.json({ 
            success: true, 
            message: "Login Successful", 
            token, 
            admin: { name: admin.name, adminID: admin.adminID } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Verify Token
app.get('/api/verify-token', verifyToken, async (req, res) => {
    res.json({ success: true, user: req.user });
});

// Get all admins
app.get('/api/admins', verifyToken, async (req, res) => {
    try {
        const admins = await Admin.find().select('-pws');
        res.json({ success: true, data: admins });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create new admin
app.post('/api/admins', verifyToken, async (req, res) => {
    try {
        const { adminID, password, name } = req.body;
        
        const existing = await Admin.findOne({ adminID });
        if (existing) {
            return res.status(400).json({ success: false, message: "Admin ID already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ adminID, pws: hashedPassword, name: name || 'Admin' });
        await admin.save();
        
        res.json({ success: true, message: "Admin created", data: { adminID, name } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Change password
app.post('/api/change-password', async (req, res) => {
    try {
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

// Change admin ID
app.post('/api/change-admin-id', async (req, res) => {
    try {
        const { oldAdminID, newAdminID, password } = req.body;
        
        const admin = await Admin.findOne({ adminID: oldAdminID });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const isValid = await bcrypt.compare(password, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Password is incorrect" });
        }
        
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

// Setup default admin (one time)
app.get('/api/setup-admin', async (req, res) => {
    try {
        const existing = await Admin.findOne({ adminID: 'admin' });
        if (existing) {
            return res.json({ success: true, message: "Admin already exists! Use admin/admin123" });
        }
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Admin({ adminID: 'admin', pws: hashedPassword, name: 'Super Admin' });
        await admin.save();
        
        res.json({ success: true, message: "Admin created! Use admin/admin123" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== AUTO CREATE ADMIN ON START ==========
mongoose.connection.once('open', async () => {
    try {
        const existing = await Admin.findOne({ adminID: 'admin' });
        if (!existing) {
            const hash = await bcrypt.hash('admin123', 10);
            await Admin.create({ adminID: 'admin', pws: hash, name: 'Super Admin' });
            console.log('\n✅ =====================================');
            console.log('✅ DEFAULT ADMIN CREATED!');
            console.log('✅ =====================================');
            console.log('   👤 Admin ID: admin');
            console.log('   🔑 Password: admin123');
            console.log('✅ =====================================\n');
        } else {
            console.log('✅ Admin already exists');
        }
    } catch (err) {
        console.log('Admin creation error:', err.message);
    }
});

// ========== ========== ========== ==========
// ========== IMPORT STUDENT ROUTES ==========
// ========== ========== ========== ==========
const studentRoutes = require('./routes/studentRoutes');
app.use('/api', studentRoutes);

// ========== ========== ========== ==========
// ========== SERVE HTML FILES ==========
// ========== ========== ========== ==========
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'management.html')); });
app.get('/student-management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'student-management.html')); });

// ========== ========== ========== ==========
// ========== ERROR HANDLERS ==========
// ========== ========== ========== ==========
app.use((req, res) => {
    res.status(404).json({ success: false, message: "API not found" });
});

app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).json({ success: false, message: "Something went wrong!" });
});

// ========== ========== ========== ==========
// ========== START SERVER ==========
// ========== ========== ========== ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`🔗 Login: https://balbharticoachingcenter.onrender.com/login.html`);
    console.log(`🔑 Credentials: admin / admin123\n`);
});
