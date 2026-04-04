const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const OldStudent = require('../models/OldStudent');
const jwt = require('jsonwebtoken');

// ========== JWT VERIFY MIDDLEWARE (LOCAL) ==========
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied" });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: "Invalid token" });
    }
};

// ========== HELPER FUNCTIONS ==========
function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setMonth(2);
    endDate.setDate(7);
    return endDate;
}

function generateFeesHistory(joiningDate, monthlyFees, sessionEndDate) {
    const feesHistory = [];
    const sessionName = `${joiningDate.getFullYear()}-${sessionEndDate.getFullYear()}`;
    let currentDate = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    
    while (currentDate <= sessionEndDate) {
        const monthName = currentDate.toLocaleString('default', { month: 'short' });
        const year = currentDate.getFullYear();
        const monthIndex = currentDate.getMonth();
        
        feesHistory.push({
            sessionName, month: monthName, year, monthIndex,
            amount: monthlyFees, paidAmount: 0, dueAmount: monthlyFees,
            status: 'unpaid', remarks: ''
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return feesHistory;
}

// ========== STUDENT REGISTRATION ==========
router.post('/student-register', async (req, res) => {
    try {
        const data = req.body;
        
        if (!data.studentId || data.studentId.length !== 12) {
            return res.status(400).json({ success: false, message: "Valid 12-digit Aadhar required" });
        }
        
        const existing = await Student.findOne({ studentId: data.studentId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Student already exists" });
        }
        
        const joiningDate = new Date(data.joiningDate || new Date());
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = `${joiningDate.getFullYear()}-${sessionEndDate.getFullYear()}`;
        
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
            email: data.email,
            aadharNumber: data.studentId,
            aadharDocument: data.aadharDocument || '',
            education: data.education || { board: 'CBSE', class: '9th' },
            monthlyFees: parseInt(data.monthlyFees) || 1000,
            currentSession: { sessionName, startDate: joiningDate, endDate: sessionEndDate },
            joiningDate: joiningDate,
            address: data.address || { current: '', permanent: '' }
        });
        
        student.feesHistory = generateFeesHistory(joiningDate, student.monthlyFees, sessionEndDate);
        await student.save();
        
        res.json({ success: true, message: "Registration successful", studentId: student.studentId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        const data = student.toObject();
        delete data.password;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE STUDENT ==========
router.put('/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        Object.assign(student, req.body);
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
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, message: "Student deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE FEES ==========
router.post('/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
        const { month, year, paidAmount } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const fee = student.feesHistory.find(f => f.month === month && f.year === year);
        if (fee) {
            fee.paidAmount = (fee.paidAmount || 0) + paidAmount;
            fee.dueAmount = fee.amount - fee.paidAmount;
            fee.status = fee.paidAmount >= fee.amount ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'unpaid';
            fee.paymentDate = new Date();
            await student.save();
        }
        res.json({ success: true, message: "Fees updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== MARK ATTENDANCE ==========
router.post('/students/:studentId/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, checkInTime, checkOutTime, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const existing = student.attendance.findIndex(a => a.date === date);
        const record = { date, status, checkInTime, checkOutTime, remarks, markedAt: new Date() };
        
        if (existing >= 0) student.attendance[existing] = record;
        else student.attendance.push(record);
        
        await student.save();
        res.json({ success: true, message: "Attendance marked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== BLOCK STUDENT ==========
router.post('/students/:studentId/block', verifyToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        student.accountStatus = { isBlocked: true, blockedFrom: new Date(), blockReason: reason };
        student.blockHistory.push({ blockedFrom: new Date(), reason });
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
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const lastBlock = student.blockHistory[student.blockHistory.length - 1];
        if (lastBlock) lastBlock.unblockedAt = new Date();
        
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
