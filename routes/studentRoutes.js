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

// ========== OPTIONAL VERIFY (For public endpoints if any) ==========
const optionalVerify = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        } catch(e) { req.user = null; }
    } else { req.user = null; }
    next();
};

// ========== HELPER FUNCTIONS ==========

// Get session end date (March 31st of next year)
function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setMonth(2); // March
    endDate.setDate(31);
    return endDate;
}

// Generate fees history for a session
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

// Move student to old students collection
async function moveToOldStudents(student) {
    try {
        // Calculate total fees paid
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

// Validate student data before save
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

// ========== 1. STUDENT REGISTRATION (FIXED ENDPOINT) ==========
// Endpoint: POST /api/students/register
router.post('/register', async (req, res) => {
    try {
        const data = req.body;
        
        // Validation
        const validationErrors = validateStudentData(data, false);
        if (validationErrors.length > 0) {
            return res.status(400).json({ success: false, message: validationErrors.join(', ') });
        }
        
        // Check if student already exists
        const existing = await Student.findOne({ studentId: data.studentId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Student with this Aadhar number already exists" });
        }
        
        // Check by mobile number (optional warning)
        const existingMobile = await Student.findOne({ studentMobile: data.studentMobile });
        if (existingMobile) {
            // Just warning, not error - multiple students can have same mobile? Usually not
            console.log('Warning: Mobile number already registered with another student');
        }
        
        // Setup session dates
        const joiningDate = new Date(data.joiningDate || new Date());
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = `${joiningDate.getFullYear()}-${sessionEndDate.getFullYear()}`;
        
        // Generate password if not provided (use last 6 digits of Aadhar)
        const password = data.password || data.studentId.slice(-6);
        
        // Create student object
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
        
        // Generate fees history
        student.feesHistory = generateFeesHistory(joiningDate, student.monthlyFees, sessionEndDate);
        
        await student.save();
        
        // Return success with student ID and password
        res.json({ 
            success: true, 
            message: "Student registered successfully",
            studentId: student.studentId,
            password: password
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        // Handle duplicate key error specifically
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate entry - Student ID already exists" });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 2. GET ALL STUDENTS (WITH FILTERS) ==========
// Endpoint: GET /api/students
router.get('/students', verifyToken, async (req, res) => {
    try {
        const { board, class: className, session, search, page = 1, limit = 50 } = req.query;
        
        let query = {};
        
        // Apply filters
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
        
        // Only active students (not moved to old)
        query.isActive = true;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const students = await Student.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Student.countDocuments(query);
        
        // Remove passwords from response
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

// ========== 3. GET STUDENT BY ID (WITH AGGREGATED DATA) ==========
// Endpoint: GET /api/students/:id
router.get('/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const data = student.toObject();
        delete data.password;
        
        // Add aggregated statistics
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

// ========== 4. UPDATE STUDENT (FIXED - ONLY ALLOWED FIELDS) ==========
// Endpoint: PUT /api/students/:id
router.put('/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const updates = req.body;
        
        // ALLOWED FIELDS FOR UPDATE (Security - don't allow all fields)
        const allowedUpdates = [
            'studentName', 'studentMobile', 'email', 'parentType',
            'fatherName', 'fatherMobile', 'motherName', 'motherMobile',
            'guardianName', 'guardianMobile', 'guardianRelation',
            'education', 'monthlyFees', 'address', 'photo', 'aadharDocument'
        ];
        
        // Apply only allowed updates
        for (const field of allowedUpdates) {
            if (updates[field] !== undefined) {
                if (field === 'monthlyFees') {
                    // If monthly fees changes, update future fees history
                    const oldFees = student.monthlyFees;
                    const newFees = parseInt(updates.monthlyFees);
                    
                    if (oldFees !== newFees && newFees > 0) {
                        // Update future months in fees history
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

// ========== 5. DELETE STUDENT (SOFT DELETE OR MOVE TO OLD) ==========
// Endpoint: DELETE /api/students/:id
router.delete('/students/:id', verifyToken, async (req, res) => {
    try {
        const { permanent } = req.query;
        
        if (permanent === 'true') {
            // Permanent delete
            const student = await Student.findOneAndDelete({ studentId: req.params.id });
            if (!student) {
                return res.status(404).json({ success: false, message: "Student not found" });
            }
            res.json({ success: true, message: "Student permanently deleted" });
        } else {
            // Move to old students (soft delete)
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

// ========== 6. UPDATE FEES ==========
// Endpoint: POST /api/students/:studentId/fees
router.post('/students/:studentId/fees', verifyToken, async (req, res) => {
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

// ========== 7. MARK ATTENDANCE ==========
// Endpoint: POST /api/students/:studentId/attendance
router.post('/students/:studentId/attendance', verifyToken, async (req, res) => {
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

// ========== 8. BLOCK STUDENT ==========
// Endpoint: POST /api/students/:studentId/block
router.post('/students/:studentId/block', verifyToken, async (req, res) => {
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

// ========== 9. UNBLOCK STUDENT ==========
// Endpoint: POST /api/students/:studentId/unblock
router.post('/students/:studentId/unblock', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        // Update last block record
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

// ========== 10. GET OLD STUDENTS ==========
// Endpoint: GET /api/old-students
router.get('/old-students', verifyToken, async (req, res) => {
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

// ========== 11. DASHBOARD STATS (NEW) ==========
// Endpoint: GET /api/dashboard/stats
router.get('/dashboard/stats', verifyToken, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalOldStudents = await OldStudent.countDocuments();
        
        // Fees summary
        const students = await Student.find({ isActive: true });
        let totalFeesCollected = 0;
        let totalFeesDue = 0;
        
        for (const student of students) {
            const feesHistory = student.feesHistory || [];
            totalFeesCollected += feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            totalFeesDue += feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
        }
        
        // Attendance summary (last 30 days)
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
        
        // Blocked students count
        const blockedStudents = await Student.countDocuments({ 'accountStatus.isBlocked': true });
        
        // Monthly fees collection trend (last 6 months)
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

// ========== 12. CHECK AND MOVE COMPLETED SESSIONS (NEW) ==========
// Endpoint: POST /api/admin/check-session-completion
router.post('/admin/check-session-completion', verifyToken, async (req, res) => {
    try {
        const today = new Date();
        const students = await Student.find({ isActive: true });
        
        let movedCount = 0;
        
        for (const student of students) {
            const sessionEndDate = new Date(student.currentSession?.endDate);
            if (sessionEndDate < today) {
                const moved = await moveToOldStudents(student);
                if (moved) movedCount++;
            }
        }
        
        res.json({ 
            success: true, 
            message: `Session check completed. ${movedCount} students moved to old students.`
        });
        
    } catch (err) {
        console.error('Session completion check error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 13. BULK DELETE STUDENTS (NEW) ==========
// Endpoint: POST /api/students/bulk-delete
router.post('/students/bulk-delete', verifyToken, async (req, res) => {
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

// ========== 14. EXPORT STUDENTS DATA (NEW) ==========
// Endpoint: GET /api/students/export/csv
router.get('/students/export/csv', verifyToken, async (req, res) => {
    try {
        const students = await Student.find({ isActive: true });
        
        // Define CSV headers
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
        
        // Create CSV content
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

// ========== 15. CHANGE STUDENT PASSWORD (NEW) ==========
// Endpoint: POST /api/students/:studentId/change-password
router.post('/students/:studentId/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        // If current password provided, verify it
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

// ========== 16. BACKWARD COMPATIBILITY (OLD ENDPOINT) ==========
// Some frontend might still call /student-register
router.post('/student-register', async (req, res) => {
    // Redirect to new endpoint
    req.url = '/register';
    router.handle(req, res);
});

module.exports = router;
