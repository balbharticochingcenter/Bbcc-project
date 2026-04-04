// ============================================
// STUDENT ROUTES - COMPLETE FIXED VERSION
// FILE: routes/studentRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const OldStudent = require('../models/OldStudent');
const jwt = require('jsonwebtoken');

// ========== JWT VERIFY MIDDLEWARE ==========
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
    } catch (err) {
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
};

// ========== HELPER FUNCTIONS ==========

function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setMonth(2);
    endDate.setDate(31);
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
            sessionName,
            month: monthName,
            year: year,
            monthIndex: monthIndex,
            amount: monthlyFees,
            paidAmount: 0,
            dueAmount: monthlyFees,
            status: 'unpaid',
            remarks: '',
            paymentDate: null
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return feesHistory;
}

async function moveToOldStudents(student) {
    try {
        const totalFeesPaid = student.feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        
        const oldStudentData = {
            originalId: student._id,
            studentId: student.studentId,
            password: student.password,
            photo: student.photo,
            studentName: student.studentName,
            parentType: student.parentType,
            fatherName: student.fatherName,
            fatherMobile: student.fatherMobile,
            motherName: student.motherName,
            motherMobile: student.motherMobile,
            guardianName: student.guardianName,
            guardianMobile: student.guardianMobile,
            guardianRelation: student.guardianRelation,
            studentMobile: student.studentMobile,
            email: student.email,
            aadharNumber: student.aadharNumber,
            aadharDocument: student.aadharDocument,
            education: student.education,
            monthlyFees: student.monthlyFees,
            completedSession: student.currentSession,
            joiningDate: student.joiningDate,
            sessionCompletedAt: new Date(),
            address: student.address,
            feesHistory: student.feesHistory,
            attendance: student.attendance,
            totalFeesPaid: totalFeesPaid,
            totalAttendance: student.attendance.length,
            presentDays: student.attendance.filter(a => a.status === 'present').length
        };
        
        const oldStudent = new OldStudent(oldStudentData);
        await oldStudent.save();
        await Student.deleteOne({ _id: student._id });
        return true;
    } catch (err) {
        console.error('Error moving to old students:', err);
        return false;
    }
}

function validateStudentData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate) {
        if (!data.studentId || data.studentId.length !== 12) {
            errors.push('Valid 12-digit Aadhar number (Student ID) is required');
        }
        if (!data.studentMobile || data.studentMobile.length !== 10) {
            errors.push('Valid 10-digit mobile number is required');
        }
        if (!data.studentName?.first || !data.studentName?.last) {
            errors.push('First name and last name are required');
        }
    }
    
    if (data.monthlyFees && (data.monthlyFees < 0 || isNaN(data.monthlyFees))) {
        errors.push('Monthly fees must be a positive number');
    }
    
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
        errors.push('Invalid email format');
    }
    
    return errors;
}

// ==============================================
// ========== 1. STUDENT REGISTRATION ==========
// ==============================================
// Frontend calls: POST /api/students/register
router.post('/register', async (req, res) => {
    try {
        const data = req.body;
        
        const validationErrors = validateStudentData(data, false);
        if (validationErrors.length > 0) {
            return res.status(400).json({ success: false, message: validationErrors.join(', ') });
        }
        
        const existing = await Student.findOne({ studentId: data.studentId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Student with this Aadhar number already exists" });
        }
        
        const joiningDate = new Date(data.joiningDate || new Date());
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = `${joiningDate.getFullYear()}-${sessionEndDate.getFullYear()}`;
        const password = data.password || data.studentId.slice(-6);
        
        const student = new Student({
            studentId: data.studentId,
            password: password,
            photo: data.photo || '',
            studentName: {
                first: data.studentName?.first || '',
                middle: data.studentName?.middle || '',
                last: data.studentName?.last || ''
            },
            parentType: data.parentType || 'Father',
            fatherName: data.fatherName || { first: '', last: '' },
            fatherMobile: data.fatherMobile || '',
            motherName: data.motherName || { first: '', last: '' },
            motherMobile: data.motherMobile || '',
            guardianName: data.guardianName || { first: '', last: '' },
            guardianMobile: data.guardianMobile || '',
            guardianRelation: data.guardianRelation || '',
            studentMobile: data.studentMobile,
            email: data.email || '',
            aadharNumber: data.studentId,
            aadharDocument: data.aadharDocument || '',
            education: {
                board: data.education?.board || 'CBSE',
                class: data.education?.class || '9th'
            },
            monthlyFees: parseInt(data.monthlyFees) || 1000,
            currentSession: {
                sessionName: sessionName,
                startDate: joiningDate,
                endDate: sessionEndDate
            },
            joiningDate: joiningDate,
            address: {
                current: data.address?.current || '',
                permanent: data.address?.permanent || data.address?.current || ''
            },
            isActive: true,
            accountStatus: {
                isBlocked: false,
                blockedFrom: null,
                blockReason: null
            },
            feesHistory: [],
            attendance: [],
            blockHistory: []
        });
        
        student.feesHistory = generateFeesHistory(joiningDate, student.monthlyFees, sessionEndDate);
        await student.save();
        
        res.json({ 
            success: true, 
            message: "Student registered successfully",
            studentId: student.studentId,
            password: password
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate entry - Student ID already exists" });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 2. GET ALL STUDENTS ==========
// ==============================================
// Frontend calls: GET /api/students
router.get('/', verifyToken, async (req, res) => {
    try {
        const { board, class: className, session, search, page = 1, limit = 50 } = req.query;
        
        let query = { isActive: true };
        
        if (board && board !== 'all') {
            query['education.board'] = board;
        }
        if (className && className !== 'all') {
            query['education.class'] = className;
        }
        if (session && session !== 'all') {
            query['currentSession.sessionName'] = session;
        }
        if (search) {
            query.$or = [
                { studentId: { $regex: search, $options: 'i' } },
                { 'studentName.first': { $regex: search, $options: 'i' } },
                { 'studentName.last': { $regex: search, $options: 'i' } },
                { studentMobile: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const students = await Student.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Student.countDocuments(query);
        
        const safeStudents = students.map(s => {
            const obj = s.toObject();
            delete obj.password;
            return obj;
        });
        
        res.json({ 
            success: true, 
            data: safeStudents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 3. GET STUDENT BY ID ==========
// ==============================================
// Frontend calls: GET /api/students/:id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const data = student.toObject();
        delete data.password;
        
        const feesHistory = data.feesHistory || [];
        const totalFees = feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
        const paidFees = feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const dueFees = totalFees - paidFees;
        
        const attendance = data.attendance || [];
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        data.stats = {
            totalFees,
            paidFees,
            dueFees,
            totalAttendanceDays: totalDays,
            presentDays,
            attendancePercentage
        };
        
        res.json({ success: true, data });
    } catch (err) {
        console.error('Get student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 4. UPDATE STUDENT ==========
// ==============================================
// Frontend calls: PUT /api/students/:id
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const updates = req.body;
        
        const allowedUpdates = [
            'studentName', 'studentMobile', 'email', 'parentType',
            'fatherName', 'fatherMobile', 'motherName', 'motherMobile',
            'guardianName', 'guardianMobile', 'guardianRelation',
            'education', 'monthlyFees', 'address', 'photo', 'aadharDocument'
        ];
        
        for (const field of allowedUpdates) {
            if (updates[field] !== undefined) {
                if (field === 'monthlyFees') {
                    const oldFees = student.monthlyFees;
                    const newFees = parseInt(updates.monthlyFees);
                    
                    if (oldFees !== newFees && newFees > 0) {
                        const currentDate = new Date();
                        student.feesHistory = student.feesHistory.map(fee => {
                            const feeDate = new Date(fee.year, fee.monthIndex);
                            if (feeDate >= currentDate) {
                                fee.amount = newFees;
                                fee.dueAmount = newFees - fee.paidAmount;
                            }
                            return fee;
                        });
                        student.monthlyFees = newFees;
                    }
                } else if (field === 'studentName') {
                    student.studentName = { ...student.studentName, ...updates.studentName };
                } else if (field === 'address') {
                    student.address = { ...student.address, ...updates.address };
                } else if (field === 'education') {
                    student.education = { ...student.education, ...updates.education };
                } else {
                    student[field] = updates[field];
                }
            }
        }
        
        student.updatedAt = new Date();
        await student.save();
        
        const responseData = student.toObject();
        delete responseData.password;
        
        res.json({ success: true, message: "Student updated successfully", data: responseData });
        
    } catch (err) {
        console.error('Update student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 5. DELETE STUDENT ==========
// ==============================================
// Frontend calls: DELETE /api/students/:id
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { permanent } = req.query;
        
        if (permanent === 'true') {
            const student = await Student.findOneAndDelete({ studentId: req.params.id });
            if (!student) {
                return res.status(404).json({ success: false, message: "Student not found" });
            }
            res.json({ success: true, message: "Student permanently deleted" });
        } else {
            const student = await Student.findOne({ studentId: req.params.id });
            if (!student) {
                return res.status(404).json({ success: false, message: "Student not found" });
            }
            
            const moved = await moveToOldStudents(student);
            if (moved) {
                res.json({ success: true, message: "Student moved to old students archive" });
            } else {
                res.status(500).json({ success: false, message: "Failed to move student to archive" });
            }
        }
    } catch (err) {
        console.error('Delete student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 6. UPDATE FEES ==========
// ==============================================
// Frontend calls: POST /api/students/:studentId/fees
router.post('/:studentId/fees', verifyToken, async (req, res) => {
    try {
        const { month, year, paidAmount, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const feeIndex = student.feesHistory.findIndex(f => f.month === month && f.year === year);
        
        if (feeIndex === -1) {
            return res.status(404).json({ success: false, message: "Fee record not found for this month" });
        }
        
        const fee = student.feesHistory[feeIndex];
        const newPaidAmount = (fee.paidAmount || 0) + paidAmount;
        
        fee.paidAmount = newPaidAmount;
        fee.dueAmount = fee.amount - newPaidAmount;
        fee.status = newPaidAmount >= fee.amount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
        fee.paymentDate = new Date();
        
        if (remarks) fee.remarks = remarks;
        
        await student.save();
        
        res.json({ 
            success: true, 
            message: "Fees updated successfully",
            data: {
                month, year,
                paidAmount: fee.paidAmount,
                dueAmount: fee.dueAmount,
                status: fee.status
            }
        });
        
    } catch (err) {
        console.error('Update fees error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 7. MARK ATTENDANCE ==========
// ==============================================
// Frontend calls: POST /api/students/:studentId/attendance
router.post('/:studentId/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, checkInTime, checkOutTime, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        
        const existingIndex = student.attendance.findIndex(a => {
            const aDate = new Date(a.date);
            aDate.setHours(0, 0, 0, 0);
            return aDate.getTime() === attendanceDate.getTime();
        });
        
        const record = {
            date: attendanceDate,
            status: status || 'absent',
            checkInTime: checkInTime || null,
            checkOutTime: checkOutTime || null,
            remarks: remarks || '',
            markedAt: new Date()
        };
        
        if (existingIndex >= 0) {
            student.attendance[existingIndex] = record;
        } else {
            student.attendance.push(record);
        }
        
        await student.save();
        
        res.json({ success: true, message: "Attendance marked successfully" });
        
    } catch (err) {
        console.error('Mark attendance error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 8. BLOCK STUDENT ==========
// ==============================================
// Frontend calls: POST /api/students/:studentId/block
router.post('/:studentId/block', verifyToken, async (req, res) => {
    try {
        const { reason, blockedUntil } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        student.accountStatus = {
            isBlocked: true,
            blockedFrom: new Date(),
            blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
            blockReason: reason || 'No reason provided'
        };
        
        student.blockHistory.push({
            blockedFrom: new Date(),
            blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
            reason: reason || 'No reason provided'
        });
        
        await student.save();
        
        res.json({ success: true, message: "Student blocked successfully" });
        
    } catch (err) {
        console.error('Block student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 9. UNBLOCK STUDENT ==========
// ==============================================
// Frontend calls: POST /api/students/:studentId/unblock
router.post('/:studentId/unblock', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const lastBlock = student.blockHistory[student.blockHistory.length - 1];
        if (lastBlock && !lastBlock.unblockedAt) {
            lastBlock.unblockedAt = new Date();
        }
        
        student.accountStatus = {
            isBlocked: false,
            blockedFrom: null,
            blockedUntil: null,
            blockReason: null
        };
        
        await student.save();
        
        res.json({ success: true, message: "Student unblocked successfully" });
        
    } catch (err) {
        console.error('Unblock student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 10. GET OLD STUDENTS ==========
// ==============================================
// Frontend calls: GET /api/students/old
router.get('/old', verifyToken, async (req, res) => {
    try {
        const { board, class: className, session, search, page = 1, limit = 50 } = req.query;
        
        let query = {};
        
        if (board && board !== 'all') {
            query['education.board'] = board;
        }
        if (className && className !== 'all') {
            query['education.class'] = className;
        }
        if (session && session !== 'all') {
            query['completedSession.sessionName'] = session;
        }
        if (search) {
            query.$or = [
                { studentId: { $regex: search, $options: 'i' } },
                { 'studentName.first': { $regex: search, $options: 'i' } },
                { 'studentName.last': { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const oldStudents = await OldStudent.find(query)
            .sort({ sessionCompletedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await OldStudent.countDocuments(query);
        
        res.json({ 
            success: true, 
            data: oldStudents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (err) {
        console.error('Get old students error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 11. DASHBOARD STATS ==========
// ==============================================
router.get('/dashboard/stats', verifyToken, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalOldStudents = await OldStudent.countDocuments();
        
        const students = await Student.find({ isActive: true });
        let totalFeesCollected = 0;
        let totalFeesDue = 0;
        
        for (const student of students) {
            const feesHistory = student.feesHistory || [];
            totalFeesCollected += feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            totalFeesDue += feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
        }
        
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        
        let totalPresent = 0;
        let totalAttendanceDays = 0;
        
        for (const student of students) {
            const recentAttendance = (student.attendance || []).filter(a => new Date(a.date) >= last30Days);
            totalPresent += recentAttendance.filter(a => a.status === 'present').length;
            totalAttendanceDays += recentAttendance.length;
        }
        
        const attendancePercentage = totalAttendanceDays > 0 
            ? Math.round((totalPresent / totalAttendanceDays) * 100) 
            : 0;
        
        const blockedStudents = await Student.countDocuments({ 'accountStatus.isBlocked': true });
        
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const year = d.getFullYear();
            
            let collected = 0;
            for (const student of students) {
                const feeRecord = (student.feesHistory || []).find(f => f.month === monthName && f.year === year);
                if (feeRecord) {
                    collected += feeRecord.paidAmount || 0;
                }
            }
            monthlyTrend.push({ month: `${monthName} ${year}`, collected });
        }
        
        res.json({
            success: true,
            data: {
                totalStudents,
                totalOldStudents,
                totalFeesCollected,
                totalFeesDue,
                attendancePercentage,
                blockedStudents,
                monthlyTrend
            }
        });
        
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 12. BULK DELETE ==========
// ==============================================
router.post('/bulk-delete', verifyToken, async (req, res) => {
    try {
        const { studentIds, permanent } = req.body;
        
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: "Student IDs array is required" });
        }
        
        let deletedCount = 0;
        let movedCount = 0;
        
        for (const studentId of studentIds) {
            const student = await Student.findOne({ studentId });
            if (student) {
                if (permanent === true) {
                    await Student.deleteOne({ studentId });
                    deletedCount++;
                } else {
                    const moved = await moveToOldStudents(student);
                    if (moved) movedCount++;
                }
            }
        }
        
        res.json({
            success: true,
            message: permanent ? `${deletedCount} students permanently deleted` : `${movedCount} students moved to archive`,
            deletedCount,
            movedCount
        });
        
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 13. EXPORT CSV ==========
// ==============================================
router.get('/export/csv', verifyToken, async (req, res) => {
    try {
        const students = await Student.find({ isActive: true });
        
        const headers = [
            'Student ID', 'First Name', 'Last Name', 'Mobile', 'Email',
            'Board', 'Class', 'Session', 'Monthly Fees', 'Total Paid',
            'Total Due', 'Attendance %', 'Status', 'Joining Date'
        ];
        
        const rows = students.map(s => {
            const feesHistory = s.feesHistory || [];
            const totalPaid = feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            const totalDue = feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
            const attendance = s.attendance || [];
            const presentDays = attendance.filter(a => a.status === 'present').length;
            const attendancePercent = attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : 0;
            
            return [
                s.studentId,
                s.studentName?.first || '',
                s.studentName?.last || '',
                s.studentMobile || '',
                s.email || '',
                s.education?.board || '',
                s.education?.class || '',
                s.currentSession?.sessionName || '',
                s.monthlyFees || 0,
                totalPaid,
                totalDue,
                attendancePercent,
                s.accountStatus?.isBlocked ? 'Blocked' : 'Active',
                s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : ''
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
        res.send(csvContent);
        
    } catch (err) {
        console.error('Export CSV error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 14. CHANGE PASSWORD ==========
// ==============================================
router.post('/:studentId/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (currentPassword && student.password !== currentPassword) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }
        
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ success: false, message: "New password must be at least 4 characters" });
        }
        
        student.password = newPassword;
        await student.save();
        
        res.json({ success: true, message: "Password changed successfully" });
        
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================
// ========== 15. BACKWARD COMPATIBILITY ==========
// ==============================================
// For frontend that calls /student-register (old endpoint)
router.post('/student-register', async (req, res) => {
    req.url = '/register';
    router.handle(req, res);
});

module.exports = router;
