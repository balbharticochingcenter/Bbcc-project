const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

// ========== ADMIN LOGIN ==========
router.post('/admin-login', async (req, res) => {
    const { adminID, password } = req.body;
    
    try {
        console.log('Login attempt:', adminID);
        
        const admin = await Admin.findOne({ adminID: adminID });
        
        if (!admin) {
            console.log('Admin not found');
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const isValid = await bcrypt.compare(password, admin.pws);
        
        if (!isValid) {
            console.log('Invalid password');
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const token = jwt.sign(
            { id: admin._id, adminID: admin.adminID, role: 'admin' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        console.log('Login successful:', adminID);
        res.json({ success: true, message: "Login successful", token });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== SETUP ADMIN (RUN ONCE) ==========
router.get('/setup-admin', async (req, res) => {
    try {
        const existing = await Admin.findOne({ adminID: 'admin' });
        
        if (existing) {
            return res.json({ success: true, message: "Admin already exists! Use admin/admin123" });
        }
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Admin({
            adminID: 'admin',
            pws: hashedPassword,
            name: 'Super Admin'
        });
        
        await admin.save();
        
        res.json({ success: true, message: "Admin created! Use admin/admin123" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== TEST API (No auth needed) ==========
router.get('/test', (req, res) => {
    res.json({ success: true, message: "Server is working!" });
});

module.exports = router;
