const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const { verifyToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many attempts" }
});

// ========== TEACHER REGISTRATION ==========
router.post('/teacher-register', async (req, res) => {
    try {
        const existing = await Teacher.findOne({ 
            $or: [{ teacherId: req.body.teacherId }, { aadharNumber: req.body.aadharNumber }] 
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Teacher ID or Aadhar exists" });
        }
        
        const teacher = new Teacher({ ...req.body, status: 'pending' });
        await teacher.save();
        res.json({ success: true, message: "Registration successful! Pending approval." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== TEACHER LOGIN ==========
router.post('/teacher-login', authLimiter, async (req, res) => {
    const { teacherId, password, aadharNumber, dob } = req.body;
    
    try {
        let teacher;
        if (teacherId && password) {
            teacher = await Teacher.findOne({ teacherId });
            if (!teacher || teacher.password !== password) {
                return res.status(401).json({ success: false, message: "Invalid credentials" });
            }
        } else if (aadharNumber && dob) {
            teacher = await Teacher.findOne({ aadharNumber });
            if (!teacher) return res.status(404).json({ success: false, message: "Aadhar not found" });
            const teacherDob = new Date(teacher.dob).toISOString().split('T')[0];
            if (teacherDob !== dob) return res.status(401).json({ success: false, message: "Invalid DOB" });
        } else {
            return res.status(400).json({ success: false, message: "Provide (ID+Password) OR (Aadhar+DOB)" });
        }
        
        if (teacher.status !== 'approved') {
            return res.status(403).json({ success: false, message: `Account is ${teacher.status}` });
        }
        
        const token = jwt.sign(
            { id: teacher._id, teacherId: teacher.teacherId, role: 'teacher', name: `${teacher.teacherName.first} ${teacher.teacherName.last}` },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );
        
        const teacherData = teacher.toObject();
        delete teacherData.password;
        
        res.json({ success: true, message: "Login successful", token, data: teacherData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== GET ALL TEACHERS ==========
router.get('/teachers', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const teachers = await Teacher.find().sort({ createdAt: -1 });
        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== GET TEACHER BY ID ==========
router.get('/teachers/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher' && req.user.teacherId !== req.params.id) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const teacher = await Teacher.findOne({ teacherId: req.params.id }).select('-password');
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, data: teacher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE TEACHER STATUS ==========
router.put('/teachers/:id/status', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const { status, subject, salary, joiningDate } = req.body;
        const updateData = { status };
        if (status === 'approved') {
            if (subject) updateData.subject = subject;
            if (salary) updateData.salary = parseInt(salary);
            if (joiningDate) updateData.joiningDate = new Date(joiningDate);
        }
        const teacher = await Teacher.findOneAndUpdate({ teacherId: req.params.id }, updateData, { new: true });
        res.json({ success: true, message: `Teacher ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE SALARY ==========
router.post('/teachers/:id/salary', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const { month, paidAmount } = req.body;
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        
        if (!teacher.salaryHistory) teacher.salaryHistory = [];
        const existing = teacher.salaryHistory.find(s => s.month === month);
        
        if (existing) {
            existing.paidAmount = paidAmount;
            existing.dueAmount = (teacher.salary || 0) - paidAmount;
            existing.status = paidAmount >= (teacher.salary || 0) ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
            existing.paymentDate = new Date();
            await teacher.save();
        }
        res.json({ success: true, message: "Salary updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== MARK TEACHER ATTENDANCE ==========
router.post('/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, remarks, photo } = req.body;
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        
        if (!teacher.attendance) teacher.attendance = [];
        const existingIndex = teacher.attendance.findIndex(a => a.date === date);
        const record = { date, status, remarks: remarks || '', photo: photo || '', markedBy: req.user.role === 'teacher' ? 'self' : req.user.adminID, markedAt: new Date() };
        
        if (existingIndex >= 0) teacher.attendance[existingIndex] = record;
        else teacher.attendance.push(record);
        
        await teacher.save();
        res.json({ success: true, message: "Attendance marked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
