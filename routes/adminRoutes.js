const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const WebConfig = require('../models/WebConfig');
const Testimonial = require('../models/Testimonial');
const Enquiry = require('../models/Enquiry');
const { verifyToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many login attempts. Try again after 15 minutes." }
});

// ========== ADMIN LOGIN ==========
router.post('/admin-login', authLimiter, async (req, res) => {
    const { userid, password } = req.body;
    
    try {
        const admin = await Admin.findOne({ adminID: userid });
        
        if (admin && admin.lockUntil && admin.lockUntil > new Date()) {
            const remainingMinutes = Math.ceil((admin.lockUntil - new Date()) / 60000);
            return res.status(401).json({ success: false, message: `Account locked. Try after ${remainingMinutes} minutes.` });
        }
        
        if (admin && await bcrypt.compare(password, admin.pws)) {
            admin.loginAttempts = 0;
            admin.lockUntil = null;
            admin.lastLogin = new Date();
            await admin.save();
            
            const token = jwt.sign(
                { id: admin._id, adminID: admin.adminID, role: 'admin' },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '2h' }
            );
            
            res.json({ success: true, message: "Login Successful", token, admin: { name: admin.name, adminID: admin.adminID } });
        } else {
            if (admin) {
                admin.loginAttempts += 1;
                if (admin.loginAttempts >= 5) admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                await admin.save();
            }
            res.status(401).json({ success: false, message: "Wrong ID or Password!" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== GET ADMIN PROFILE ==========
router.get('/admin/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const admin = await Admin.findById(req.user.id).select('-pws');
        res.json({ success: true, data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE CONFIG ==========
router.post('/update-config', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const config = await WebConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ success: true, message: "Config updated", data: config });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== GET CONFIG ==========
router.get('/config', async (req, res) => {
    try {
        let config = await WebConfig.findOne();
        if (!config) {
            config = { logoText: 'BBCC', title: 'Bal Bharti Coaching' };
        }
        res.json(config);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== TESTIMONIALS CRUD ==========
router.get('/admin/testimonials', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const testimonials = await Testimonial.find().sort({ order: 1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/testimonials', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const testimonial = new Testimonial(req.body);
        await testimonial.save();
        res.json({ success: true, message: "Testimonial added", data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/testimonials/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, message: "Testimonial updated", data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/testimonials/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        await Testimonial.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Testimonial deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== ENQUIRIES ==========
router.get('/admin/enquiries', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const enquiries = await Enquiry.find().sort({ createdAt: -1 });
        const stats = {
            total: await Enquiry.countDocuments(),
            pending: await Enquiry.countDocuments({ status: 'pending' }),
            contacted: await Enquiry.countDocuments({ status: 'contacted' })
        };
        res.json({ success: true, data: enquiries, stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/enquiry', async (req, res) => {
    try {
        const enquiry = new Enquiry(req.body);
        await enquiry.save();
        res.json({ success: true, message: "Enquiry submitted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/admin/enquiries/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, message: "Enquiry updated", data: enquiry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
