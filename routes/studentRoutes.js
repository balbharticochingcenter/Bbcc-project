const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const OldStudent = require('../models/OldStudent');
const Admin = require('../models/Admin');
const { verifyToken } = require('../middleware/auth');
const { getSessionEndDate, getSessionName, generateFeesHistory, shouldAutoBlock } = require('../utils/helpers');
const bcrypt = require('bcrypt');

// ========== ADMIN LOGIN ==========
router.post('/admin-login', async (req, res) => {
    const { adminID, password } = req.body;
    
    try {
        const admin = await Admin.findOne({ adminID: adminID });
        
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const isValid = await bcrypt.compare(password, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const token = jwt.sign(
            { id: admin._id, adminID: admin.adminID, role: 'admin' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        res.json({ success: true, message: "Login successful", token });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== CREATE DEFAULT ADMIN (Run once) ==========
router.post('/setup-admin', async (req, res) => {
    try {
        const existing = await Admin.findOne({ adminID: 'admin' });
        if (!existing) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new Admin({ adminID: 'admin', pws: hashedPassword });
            await admin.save();
            res.json({ success: true, message: "Admin created: admin/admin123" });
        } else {
            res.json({ success: true, message: "Admin already exists" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== STUDENT REGISTRATION ==========
router.post('/student-register', async (req, res) => {
    console.log("📝 Registration request received");
    
    try {
        const data = req.body;
        
        // Validate
        if (!data.studentId || data.studentId.length !== 12) {
            return res.status(400).json({ success: false, message: "Valid 12-digit Aadhar number required" });
        }
        
        if (!data.studentMobile || data.studentMobile.length !== 10) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number required" });
        }
        
        if (!data.studentName?.first || !data.studentName?.last) {
            return res.status(400).json({ success: false, message: "First and last name required" });
        }
        
        // Check existing
        const existing = await Student.findOne({ 
            $or: [{ studentId: data.studentId }, { aadharNumber: data.studentId }] 
        });
        
        if (existing) {
            return res.status(400).json({ success: false, message: "Student already exists with this Aadhar" });
        }
        
        // Calculate session
        const joiningDate = new Date(data.joiningDate || new Date());
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = getSessionName(joiningDate, sessionEndDate);
        
        // Create student
        const student = new Student({
            studentId: data.studentId,
            password: data.password || Math.random().toString(36).substring(2, 10),
            photo: data.photo || '',
            studentName: data.studentName,
            parentType: data.parentType || 'Father',
            fatherName: data.fatherName,
            fatherMobile: data.fatherMobile,
            motherName: data.motherName,
            motherMobile: data.motherMobile,
            guardianName: data.guardianName,
            guardianMobile: data.guardianMobile,
            guardianRelation: data.guardianRelation,
            studentMobile: data.studentMobile,
            email: data.email || '',
            aadharNumber: data.studentId,
            aadharDocument: data.aadharDocument || '',
            education: { board: data.education?.board || 'CBSE', class: data.education?.class || '9th' },
            monthlyFees: parseInt(data.monthlyFees) || 1000,
            currentSession: { sessionName, startDate: joiningDate, endDate: sessionEndDate },
            joiningDate: joiningDate,
            address: { current: data.address?.current || '', permanent: data.address?.permanent || '' }
        });
        
        // Generate fees
        student.feesHistory = generateFeesHistory(joiningDate, student.monthlyFees, sessionEndDate);
        
        await student.save();
        
        console.log(`✅ Student registered: ${student.studentId}`);
        
        res.json({ 
            success: true, 
            message: "Registration successful",
            studentId: student.studentId,
            password: student.password
        });
        
    } catch (err) {
        console.error("Registration Error:", err);
        if (err.code === 11000) {
            res.status(400).json({ success: false, message: "Duplicate entry - Student already exists" });
        } else {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

// ========== GET ALL STUDENTS ==========
router.get('/students', verifyToken, async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== GET STUDENT BY ID ==========
router.get('/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        const studentData = student.toObject();
        delete studentData.password;
        res.json({ success: true, data: studentData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE STUDENT ==========
router.put('/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const { studentName, studentMobile, photo, monthlyFees, education, address } = req.body;
        
        if (studentName) student.studentName = studentName;
        if (studentMobile) student.studentMobile = studentMobile;
        if (photo) student.photo = photo;
        if (monthlyFees) student.monthlyFees = monthlyFees;
        if (education) student.education = education;
        if (address) student.address = address;
        
        await student.save();
        res.json({ success: true, message: "Student updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== DELETE STUDENT ==========
router.delete('/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({ studentId: req.params.id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        res.json({ success: true, message: "Student deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE FEES ==========
router.post('/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
        const { month, year, paidAmount, sessionName } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const feeEntry = student.feesHistory.find(f => 
            f.month === month && f.year === year && f.sessionName === sessionName
        );
        
        if (feeEntry) {
            feeEntry.paidAmount = (feeEntry.paidAmount || 0) + paidAmount;
            feeEntry.dueAmount = feeEntry.amount - feeEntry.paidAmount;
            feeEntry.status = feeEntry.paidAmount >= feeEntry.amount ? 'paid' : feeEntry.paidAmount > 0 ? 'partial' : 'unpaid';
            feeEntry.paymentDate = new Date();
            
            await student.save();
            
            // Auto block check
            const autoBlock = shouldAutoBlock(student);
            if (autoBlock.shouldBlock && !student.accountStatus.isBlocked) {
                student.accountStatus = {
                    isBlocked: true,
                    blockedFrom: new Date(),
                    blockReason: autoBlock.reason,
                    blockedBy: 'system'
                };
                await student.save();
            }
        }
        
        res.json({ success: true, message: "Fees updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== BLOCK STUDENT ==========
router.post('/students/:studentId/block', verifyToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        student.accountStatus = {
            isBlocked: true,
            blockedFrom: new Date(),
            blockReason: reason,
            blockedBy: req.user.adminID
        };
        
        student.blockHistory.push({
            blockedFrom: new Date(),
            reason: reason,
            blockedBy: req.user.adminID
        });
        
        await student.save();
        res.json({ success: true, message: "Student blocked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UNBLOCK STUDENT ==========
router.post('/students/:studentId/unblock', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const lastBlock = student.blockHistory[student.blockHistory.length - 1];
        if (lastBlock) {
            lastBlock.unblockedAt = new Date();
        }
        
        student.accountStatus = { isBlocked: false };
        await student.save();
        
        res.json({ success: true, message: "Student unblocked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== GET OLD STUDENTS ==========
router.get('/old-students', verifyToken, async (req, res) => {
    try {
        const oldStudents = await OldStudent.find().sort({ sessionCompletedAt: -1 });
        res.json({ success: true, data: oldStudents });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
