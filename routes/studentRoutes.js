const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const OldStudent = require('../models/OldStudent');
const { verifyToken, checkStudentBlocked } = require('../middleware/auth');
const { getSessionEndDate, getSessionName, generateFeesHistory, shouldAutoBlock } = require('../utils/helpers');

// ========== STUDENT REGISTRATION ==========
router.post('/student-register', async (req, res) => {
    console.log("📝 Student registration request received");
    try {
        const data = req.body;
        
        // Validate required fields
        if (!data.studentId || !data.studentMobile || !data.aadharNumber) {
            return res.status(400).json({ success: false, message: "Student ID, Mobile and Aadhar are required" });
        }
        
        if (!data.studentName?.first || !data.studentName?.last) {
            return res.status(400).json({ success: false, message: "Student first and last name required" });
        }
        
        // Check existing
        const existing = await Student.findOne({ 
            $or: [{ studentId: data.studentId }, { aadharNumber: data.aadharNumber }] 
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Student ID or Aadhar already exists" });
        }
        
        // Calculate session dates
        const joiningDate = new Date(data.joiningDate || new Date());
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = getSessionName(joiningDate, sessionEndDate);
        
        // Prepare parent data
        let parentData = {};
        if (data.parentType === 'Father') {
            parentData.fatherName = data.fatherName || { first: '', last: '' };
            parentData.fatherMobile = data.fatherMobile;
        } else if (data.parentType === 'Mother') {
            parentData.motherName = data.motherName || { first: '', last: '' };
            parentData.motherMobile = data.motherMobile;
        } else if (data.parentType === 'Guardian') {
            parentData.guardianName = data.guardianName || { first: '', last: '' };
            parentData.guardianMobile = data.guardianMobile;
            parentData.guardianRelation = data.guardianRelation;
        }
        
        // Create student
        const student = new Student({
            studentId: data.studentId,
            password: data.password || Math.random().toString(36).substring(2, 10),
            photo: data.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23667eea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40"%3E📷%3C/text%3E%3C/svg%3E',
            studentName: data.studentName,
            parentType: data.parentType || 'Father',
            ...parentData,
            studentMobile: data.studentMobile,
            aadharNumber: data.aadharNumber,
            aadharDocument: data.aadharDocument || data.photo,
            education: { board: data.board || 'CBSE', class: data.class || '9th' },
            monthlyFees: parseInt(data.monthlyFees) || 1000,
            currentSession: { sessionName, startDate: joiningDate, endDate: sessionEndDate },
            joiningDate: joiningDate,
            address: { current: data.currentAddress || '', permanent: data.permanentAddress || '' }
        });
        
        // Generate fees history
        student.feesHistory = generateFeesHistory(joiningDate, student.monthlyFees, sessionEndDate);
        
        await student.save();
        
        console.log(`✅ Student registered: ${student.studentId} - ${student.studentName.first} ${student.studentName.last}`);
        
        res.json({ 
            success: true, 
            message: "Registration successful",
            studentId: student.studentId,
            password: student.password
        });
        
    } catch (err) {
        console.error("Registration Error:", err);
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const updateData = req.body;
        if (updateData.studentName) student.studentName = updateData.studentName;
        if (updateData.studentMobile) student.studentMobile = updateData.studentMobile;
        if (updateData.photo) student.photo = updateData.photo;
        if (updateData.monthlyFees) student.monthlyFees = updateData.monthlyFees;
        if (updateData.education) student.education = updateData.education;
        if (updateData.address) student.address = updateData.address;
        
        await student.save();
        res.json({ success: true, message: "Student updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== DELETE STUDENT ==========
router.delete('/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const student = await Student.findOneAndDelete({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, message: "Student deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== STUDENT LOGIN ==========
router.post('/student-login', async (req, res) => {
    const { studentId, password } = req.body;
    try {
        const student = await Student.findOne({ studentId: studentId });
        if (!student) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        if (student.accountStatus.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: `Account is BLOCKED. Reason: ${student.accountStatus.blockReason}`,
                isBlocked: true
            });
        }
        
        if (student.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { studentId: student.studentId, role: 'student', name: `${student.studentName.first} ${student.studentName.last}` },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '15d' }
        );
        
        const studentData = student.toObject();
        delete studentData.password;
        delete studentData.aadharNumber;
        
        res.json({ success: true, message: "Login successful", token, data: studentData });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== UPDATE FEES ==========
router.post('/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { month, year, paidAmount, sessionName } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const feeEntry = student.feesHistory.find(f => 
            f.month === month && f.year === year && f.sessionName === sessionName
        );
        
        if (feeEntry) {
            const newPaidAmount = (feeEntry.paidAmount || 0) + paidAmount;
            feeEntry.paidAmount = newPaidAmount;
            feeEntry.dueAmount = feeEntry.amount - newPaidAmount;
            feeEntry.status = newPaidAmount >= feeEntry.amount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
            feeEntry.paymentDate = new Date();
            feeEntry.updatedBy = req.user.adminID;
            
            await student.save();
            
            // Check auto-block
            const autoBlockCheck = shouldAutoBlock(student);
            if (autoBlockCheck.shouldBlock && !student.accountStatus.isBlocked) {
                student.accountStatus = {
                    isBlocked: true,
                    blockedFrom: new Date(),
                    blockReason: autoBlockCheck.reason,
                    blockedBy: 'system'
                };
                student.blockHistory.push({
                    blockedFrom: new Date(),
                    reason: autoBlockCheck.reason,
                    blockedBy: 'system'
                });
                await student.save();
                console.log(`🔴 Auto-blocked: ${student.studentId} - ${autoBlockCheck.reason}`);
            }
        }
        
        res.json({ success: true, message: "Fees updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== MARK ATTENDANCE ==========
router.post('/students/:studentId/attendance', verifyToken, checkStudentBlocked, async (req, res) => {
    try {
        const { date, status, checkInTime, checkOutTime, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const existingIndex = student.attendance.findIndex(a => a.date === date);
        const record = {
            date, sessionName: student.currentSession.sessionName, status,
            checkInTime: checkInTime || '', checkOutTime: checkOutTime || '',
            remarks: remarks || '', markedBy: req.user.role === 'teacher' ? req.user.teacherId : req.user.adminID,
            markedAt: new Date()
        };
        
        if (existingIndex >= 0) student.attendance[existingIndex] = record;
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { reason, blockUntil } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        student.accountStatus = {
            isBlocked: true,
            blockedFrom: new Date(),
            blockedUntil: blockUntil || null,
            blockReason: reason,
            blockedBy: req.user.adminID
        };
        
        student.blockHistory.push({
            blockedFrom: new Date(),
            blockedUntil: blockUntil || null,
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const lastBlock = student.blockHistory[student.blockHistory.length - 1];
        if (lastBlock && !lastBlock.unblockedAt) {
            lastBlock.unblockedAt = new Date();
            lastBlock.unblockedBy = req.user.adminID;
        }
        
        student.accountStatus = { isBlocked: false };
        await student.save();
        res.json({ success: true, message: "Student unblocked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== PROMOTE STUDENT ==========
router.post('/students/:studentId/promote', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { newBoard, newClass, newMonthlyFees, newJoiningDate } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        // Move current to old
        const oldStudent = new OldStudent({
            ...student.toObject(),
            completedSession: student.currentSession,
            sessionCompletedAt: new Date(),
            movedBy: req.user.adminID,
            reason: 'promoted'
        });
        await oldStudent.save();
        
        // Update for new session
        const newJoinDate = newJoiningDate ? new Date(newJoiningDate) : new Date();
        const newSessionEndDate = getSessionEndDate(newJoinDate);
        const newSessionName = getSessionName(newJoinDate, newSessionEndDate);
        
        student.education = { board: newBoard, class: newClass };
        student.monthlyFees = newMonthlyFees;
        student.currentSession = { sessionName: newSessionName, startDate: newJoinDate, endDate: newSessionEndDate };
        student.joiningDate = newJoinDate;
        student.sessionCompleted = false;
        student.accountStatus = { isBlocked: false };
        student.feesHistory = generateFeesHistory(newJoinDate, newMonthlyFees, newSessionEndDate);
        student.attendance = [];
        
        await student.save();
        res.json({ success: true, message: "Student promoted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== GET OLD STUDENTS ==========
router.get('/old-students', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const oldStudents = await OldStudent.find().sort({ sessionCompletedAt: -1 });
        res.json({ success: true, data: oldStudents });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
