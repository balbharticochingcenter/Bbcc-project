// ============================================
// COMPLETE FIXED SERVER CODE - WITH INDEX FIX
// ============================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc_portal';

// ============================================
// SCHEMA DEFINITIONS
// ============================================

const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true },
    pws: { type: String, required: true },
    name: { type: String, default: 'Admin' },
    role: { type: String, default: 'admin' },
    permissions: [String],
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// IMPORTANT: Schema with proper index definitions
const StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true, index: true },
    aadharNumber: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    photo: { type: String, default: '' },
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other', null], default: null },
    parentType: { type: String, enum: ['Father', 'Mother', 'Guardian'], default: 'Father' },
    fatherName: { first: String, last: String },
    fatherMobile: String,
    motherName: { first: String, last: String },
    motherMobile: String,
    guardianName: { first: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    studentMobile: { type: String, required: true },
    email: String,
    emergencyContact: { type: String },
    alternateMobile: { type: String },
    aadharDocument: { type: String, default: '' },
    education: {
        board: { type: String, required: true },
        class: { type: String, required: true },
        section: { type: String },
        rollNumber: { type: String }
    },
    currentSession: {
        sessionName: String,
        startDate: Date,
        endDate: Date
    },
    monthlyFees: { type: Number, default: 0 },
    feesConcession: { type: Number, default: 0 },
    lateFeePenalty: { type: Number, default: 0 },
    feesHistory: [{
        sessionName: String,
        month: String,
        year: Number,
        monthIndex: Number,
        amount: Number,
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
        paymentDate: Date,
        paymentMode: { type: String, enum: ['cash', 'cheque', 'online', 'card'] },
        transactionId: { type: String },
        chequeNumber: { type: String },
        remarks: String,
        collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
    }],
    attendance: [{
        date: { type: Date },
        status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'absent' },
        checkInTime: String,
        checkOutTime: String,
        lateMinutes: { type: Number },
        subject: { type: String },
        remarks: String,
        markedAt: { type: Date, default: Date.now },
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
    }],
    accountStatus: {
        isBlocked: { type: Boolean, default: false },
        blockedFrom: Date,
        blockedUntil: Date,
        blockReason: String,
        blockedBy: String
    },
    blockHistory: [{
        blockedFrom: Date,
        blockedUntil: Date,
        reason: String,
        blockedBy: String,
        unblockedAt: Date,
        unblockedBy: String
    }],
    joiningDate: { type: Date, default: Date.now },
    address: {
        current: String,
        permanent: String,
        city: String,
        state: String,
        pincode: String
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { 
    // Disable auto-index creation to avoid conflicts
    autoIndex: false 
});

const OldStudentSchema = new mongoose.Schema({
    originalId: { type: mongoose.Schema.Types.ObjectId },
    studentId: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    password: String,
    photo: String,
    studentName: { first: String, last: String, middle: String },
    parentType: String,
    fatherName: { first: String, last: String },
    fatherMobile: String,
    motherName: { first: String, last: String },
    motherMobile: String,
    guardianName: { first: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    studentMobile: String,
    email: String,
    aadharDocument: String,
    education: { board: String, class: String },
    monthlyFees: Number,
    completedSession: { sessionName: String, startDate: Date, endDate: Date },
    joiningDate: Date,
    sessionCompletedAt: { type: Date, default: Date.now },
    address: { current: String, permanent: String },
    feesHistory: Array,
    attendance: Array,
    totalFeesPaid: { type: Number, default: 0 },
    totalAttendance: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    leavingReason: String
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
const Student = mongoose.model('Student', StudentSchema);
const OldStudent = mongoose.model('OldStudent', OldStudentSchema);

// ============================================
// DATABASE CONNECTION WITH INDEX FIX
// ============================================
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        
        // 🔥 CRITICAL FIX: Drop and recreate indexes properly
        console.log('🔄 Fixing database indexes...');
        
        try {
            // Drop existing collection if empty or problematic
            const collections = await mongoose.connection.db.listCollections({ name: 'students' }).toArray();
            
            if (collections.length > 0) {
                // Get all indexes
                const indexes = await Student.collection.getIndexes();
                console.log('Existing indexes:', Object.keys(indexes));
                
                // Drop all indexes except _id
                for (const indexName of Object.keys(indexes)) {
                    if (indexName !== '_id_') {
                        try {
                            await Student.collection.dropIndex(indexName);
                            console.log(`✅ Dropped index: ${indexName}`);
                        } catch (e) {
                            console.log(`⚠️ Could not drop index ${indexName}:`, e.message);
                        }
                    }
                }
            }
            
            // Ensure indexes are created correctly
            await Student.collection.createIndex({ studentId: 1 }, { unique: true });
            console.log('✅ Created index: studentId');
            
            await Student.collection.createIndex({ aadharNumber: 1 }, { unique: true });
            console.log('✅ Created index: aadharNumber');
            
            console.log('✅ Database indexes fixed successfully!');
            
        } catch (indexErr) {
            console.log('⚠️ Index fix warning:', indexErr.message);
            // Try alternative approach
            try {
                await Student.syncIndexes();
                console.log('✅ Synced indexes via syncIndexes');
            } catch (syncErr) {
                console.log('⚠️ Sync indexes failed:', syncErr.message);
            }
        }
        
        // Create default admin
        try {
            const existing = await Admin.findOne({ adminID: 'admin' });
            if (!existing) {
                const hash = await bcrypt.hash('admin123', 10);
                await Admin.create({ 
                    adminID: 'admin', 
                    pws: hash, 
                    name: 'Super Admin',
                    role: 'super_admin',
                    permissions: ['all']
                });
                console.log('\n✅ DEFAULT ADMIN CREATED!');
                console.log('   👤 Admin ID: admin');
                console.log('   🔑 Password: admin123\n');
            } else {
                console.log('✅ Admin already exists');
            }
        } catch (adminErr) {
            console.log('Admin creation error:', adminErr.message);
        }
    })
    .catch(err => console.log('❌ DB Error:', err.message));

// ============================================
// JWT MIDDLEWARE
// ============================================
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

// ============================================
// HELPER FUNCTIONS
// ============================================
function isValidAadhar(aadhar) {
    return /^\d{12}$/.test(aadhar);
}

function isValidMobile(mobile) {
    return /^\d{10}$/.test(mobile);
}

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

async function moveToOldStudents(student, reason = 'Session completed') {
    try {
        const totalFeesPaid = student.feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        
        const oldStudentData = {
            originalId: student._id,
            studentId: student.studentId,
            aadharNumber: student.aadharNumber,
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
            presentDays: student.attendance.filter(a => a.status === 'present').length,
            leavingReason: reason
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

// ============================================
// ADMIN LOGIN
// ============================================
app.post('/api/admin-login', async (req, res) => {
    const { userid, password } = req.body;
    console.log(`📌 Login attempt: ${userid}`);
    
    try {
        const admin = await Admin.findOne({ adminID: userid, isActive: true });
        
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
        admin.loginAttempts = 0;
        await admin.save();
        
        const token = jwt.sign(
            { id: admin._id, adminID: admin.adminID, role: admin.role || 'admin' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful:', userid);
        res.json({ 
            success: true, 
            message: "Login Successful", 
            token, 
            admin: { name: admin.name, adminID: admin.adminID, role: admin.role } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// STUDENT REGISTRATION - FIXED
// ============================================
app.post('/api/students/register', async (req, res) => {
    try {
        const data = req.body;
        
        const originalStudentId = data.studentId;
        const modifiedStudentId = `BBCC${originalStudentId}`;
        const aadharNumber = originalStudentId;
        
        console.log('📝 Registration:', { original: originalStudentId, modified: modifiedStudentId, aadhar: aadharNumber });
        
        // Validations
        if (!originalStudentId || !isValidAadhar(originalStudentId)) {
            return res.status(400).json({ success: false, message: "Valid 12-digit Student ID is required" });
        }
        
        if (!data.studentMobile || !isValidMobile(data.studentMobile)) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required" });
        }
        
        if (!data.studentName?.first || !data.studentName?.last) {
            return res.status(400).json({ success: false, message: "First name and last name are required" });
        }
        
        // Duplicate checks
        const existingByStudentId = await Student.findOne({ studentId: modifiedStudentId });
        if (existingByStudentId) {
            return res.status(400).json({ success: false, message: `Student ID ${originalStudentId} is already registered!` });
        }
        
        const existingByAadhar = await Student.findOne({ aadharNumber: aadharNumber });
        if (existingByAadhar) {
            return res.status(400).json({ success: false, message: `Aadhar Number ${aadharNumber} is already registered!` });
        }
        
        const joiningDate = new Date(data.joiningDate || new Date());
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = `${joiningDate.getFullYear()}-${sessionEndDate.getFullYear()}`;
        const password = data.password || originalStudentId.slice(-6);
        
        const student = new Student({
            studentId: modifiedStudentId,
            aadharNumber: aadharNumber,
            password: password,
            photo: data.photo || '',
            studentName: {
                first: data.studentName.first,
                middle: data.studentName.middle || '',
                last: data.studentName.last
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
            feesHistory: [],
            attendance: [],
            blockHistory: []
        });
        
        student.feesHistory = generateFeesHistory(joiningDate, student.monthlyFees, sessionEndDate);
        await student.save();
        
        console.log('✅ Student registered successfully:', student.studentId);
        
        res.json({ 
            success: true, 
            message: `✅ Student registered successfully!`,
            studentId: modifiedStudentId,
            originalId: originalStudentId,
            password: password
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "This student is already registered! Please check Student ID or Aadhar Number."
            });
        }
        
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// GET ALL STUDENTS
// ============================================
app.get('/api/students', verifyToken, async (req, res) => {
    try {
        const students = await Student.find({ isActive: true }).sort({ createdAt: -1 });
        const safeStudents = students.map(s => {
            const obj = s.toObject();
            delete obj.password;
            return obj;
        });
        res.json({ success: true, data: safeStudents });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// GET SINGLE STUDENT
// ============================================
app.get('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        let searchStudentId = requestId;
        let searchAadharNumber = requestId;
        
        if (!requestId.startsWith('BBCC')) {
            searchStudentId = `BBCC${requestId}`;
            searchAadharNumber = requestId;
        } else {
            searchAadharNumber = requestId.replace('BBCC', '');
        }
        
        const student = await Student.findOne({ 
            $or: [{ studentId: searchStudentId }, { aadharNumber: searchAadharNumber }]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const data = student.toObject();
        delete data.password;
        data.originalId = data.aadharNumber;
        
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// UPDATE STUDENT
// ============================================
app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        let searchStudentId = requestId;
        
        if (!requestId.startsWith('BBCC')) {
            searchStudentId = `BBCC${requestId}`;
        }
        
        const student = await Student.findOne({ studentId: searchStudentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const updates = req.body;
        delete updates.studentId;
        delete updates.aadharNumber;
        
        const allowedUpdates = ['studentName', 'studentMobile', 'email', 'parentType', 'fatherName', 'fatherMobile', 'motherName', 'motherMobile', 'guardianName', 'guardianMobile', 'guardianRelation', 'education', 'monthlyFees', 'address', 'photo', 'aadharDocument'];
        
        for (const field of allowedUpdates) {
            if (updates[field] !== undefined) {
                if (field === 'monthlyFees') {
                    student.monthlyFees = parseInt(updates.monthlyFees);
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
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// DELETE STUDENT
// ============================================
app.delete('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        let searchStudentId = requestId;
        
        if (!requestId.startsWith('BBCC')) {
            searchStudentId = `BBCC${requestId}`;
        }
        
        const student = await Student.findOne({ studentId: searchStudentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        await Student.deleteOne({ _id: student._id });
        res.json({ success: true, message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// MARK ATTENDANCE
// ============================================
app.post('/api/students/:studentId/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, checkInTime, checkOutTime, remarks } = req.body;
        const requestId = req.params.studentId;
        let searchStudentId = requestId;
        
        if (!requestId.startsWith('BBCC')) {
            searchStudentId = `BBCC${requestId}`;
        }
        
        const student = await Student.findOne({ studentId: searchStudentId });
        
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
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// UPDATE FEES
// ============================================
app.post('/api/students/:studentId/fees', verifyToken, async (req, res) => {
    try {
        const { month, year, paidAmount, remarks } = req.body;
        const requestId = req.params.studentId;
        let searchStudentId = requestId;
        
        if (!requestId.startsWith('BBCC')) {
            searchStudentId = `BBCC${requestId}`;
        }
        
        const student = await Student.findOne({ studentId: searchStudentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const feeIndex = student.feesHistory.findIndex(f => f.month === month && f.year === year);
        
        if (feeIndex === -1) {
            return res.status(404).json({ success: false, message: "Fee record not found" });
        }
        
        const fee = student.feesHistory[feeIndex];
        const newPaidAmount = (fee.paidAmount || 0) + paidAmount;
        
        fee.paidAmount = newPaidAmount;
        fee.dueAmount = fee.amount - newPaidAmount;
        fee.status = newPaidAmount >= fee.amount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
        fee.paymentDate = new Date();
        if (remarks) fee.remarks = remarks;
        
        await student.save();
        res.json({ success: true, message: "Fees updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// BLOCK/UNBLOCK STUDENT
// ============================================
app.post('/api/students/:studentId/block', verifyToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const requestId = req.params.studentId;
        let searchStudentId = requestId;
        
        if (!requestId.startsWith('BBCC')) {
            searchStudentId = `BBCC${requestId}`;
        }
        
        const student = await Student.findOne({ studentId: searchStudentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        student.accountStatus = {
            isBlocked: true,
            blockedFrom: new Date(),
            blockReason: reason || 'No reason provided',
            blockedBy: req.user?.adminID || 'Admin'
        };
        
        student.blockHistory.push({
            blockedFrom: new Date(),
            reason: reason || 'No reason provided',
            blockedBy: req.user?.adminID || 'Admin'
        });
        
        await student.save();
        res.json({ success: true, message: "Student blocked successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/students/:studentId/unblock', verifyToken, async (req, res) => {
    try {
        const requestId = req.params.studentId;
        let searchStudentId = requestId;
        
        if (!requestId.startsWith('BBCC')) {
            searchStudentId = `BBCC${requestId}`;
        }
        
        const student = await Student.findOne({ studentId: searchStudentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const lastBlock = student.blockHistory[student.blockHistory.length - 1];
        if (lastBlock && !lastBlock.unblockedAt) {
            lastBlock.unblockedAt = new Date();
            lastBlock.unblockedBy = req.user?.adminID || 'Admin';
        }
        
        student.accountStatus = {
            isBlocked: false,
            blockedFrom: null,
            blockReason: null,
            blockedBy: null
        };
        
        await student.save();
        res.json({ success: true, message: "Student unblocked successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// GET OLD STUDENTS
// ============================================
app.get('/api/old-students', verifyToken, async (req, res) => {
    try {
        const oldStudents = await OldStudent.find().sort({ sessionCompletedAt: -1 });
        res.json({ success: true, data: oldStudents });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// DASHBOARD STATS
// ============================================
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalOldStudents = await OldStudent.countDocuments();
        const blockedStudents = await Student.countDocuments({ 'accountStatus.isBlocked': true });
        
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
        
        const attendancePercentage = totalAttendanceDays > 0 ? Math.round((totalPresent / totalAttendanceDays) * 100) : 0;
        
        res.json({
            success: true,
            data: {
                totalStudents,
                totalOldStudents,
                totalFeesCollected,
                totalFeesDue,
                attendancePercentage,
                blockedStudents
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// SERVE HTML FILES
// ============================================
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'management.html')); });
app.get('/student-management.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'student-management.html')); });

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`🔗 Login: http://localhost:${PORT}/login.html`);
    console.log(`🔑 Credentials: admin / admin123`);
});
