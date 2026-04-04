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
app.use(express.json());
app.use(express.static('public'));

// ========== DATABASE ==========
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err.message));

// ========== ========== ========== ==========
// ========== ADMIN MODEL (SERVER MEIN) ==========
// ========== ========== ========== ==========
const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true },
    pws: { type: String, required: true },
    name: { type: String, default: 'Admin' }
});
const Admin = mongoose.model('Admin', AdminSchema);

// ========== ========== ========== ==========
// ========== ADMIN APIs (SERVER MEIN) ==========
// ========== ========== ========== ==========

// Admin Login
app.post('/api/admin-login', async (req, res) => {
    const { userid, password } = req.body;
    try {
        const admin = await Admin.findOne({ adminID: userid });
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const isValid = await bcrypt.compare(password, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const token = jwt.sign(
            { id: admin._id, adminID: admin.adminID, role: 'admin' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );
        res.json({ success: true, token, admin: { name: admin.name, adminID: admin.adminID } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Verify Token
app.get('/api/verify-token', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false });
    try {
        jwt.verify(token, process.env.JWT_SECRET || 'secret');
        res.json({ success: true });
    } catch (err) {
        res.status(401).json({ success: false });
    }
});

// Setup Admin (one time)
app.get('/api/setup-admin', async (req, res) => {
    try {
        const existing = await Admin.findOne({ adminID: 'admin' });
        if (existing) {
            return res.send('Admin already exists! Login with admin/admin123');
        }
        const hash = await bcrypt.hash('admin123', 10);
        await Admin.create({ adminID: 'admin', pws: hash, name: 'Super Admin' });
        res.send('✅ Admin created! Login: admin / admin123');
    } catch (err) {
        res.send('Error: ' + err.message);
    }
});

// ========== AUTO CREATE ADMIN ON START ==========
mongoose.connection.once('open', async () => {
    const existing = await Admin.findOne({ adminID: 'admin' });
    if (!existing) {
        const hash = await bcrypt.hash('admin123', 10);
        await Admin.create({ adminID: 'admin', pws: hash, name: 'Super Admin' });
        console.log('✅ Admin created: admin / admin123');
    }
});

// ========== ========== ========== ==========
// ========== STUDENT ROUTES IMPORT ==========
// ========== ========== ========== ==========
const studentRoutes = require('./routes/studentRoutes');
app.use('/api', studentRoutes);

// ========== ========== ========== ==========
// ========== HTML FILES ==========
// ========== ========== ========== ==========
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'management.html')); });

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`🔗 https://balbharticoachingcenter.onrender.com/login.html`);
    console.log(`🔑 admin / admin123\n`);
});
