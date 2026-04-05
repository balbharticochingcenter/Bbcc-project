// ============================================
// SERVER CONFIGURATION
// FILE: server.js (Complete Single File)
// ============================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// ============================================
// DATABASE CONNECTION
// ============================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc_portal';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err.message));

// ============================================
// SCHEMA DEFINITIONS
// ============================================

// ------------------- ADMIN SCHEMA -------------------
const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true },
    pws: { type: String, required: true },
    name: { type: String, default: 'Admin' },
    role: { type: String, default: 'admin' }, // For future: 'super_admin', 'teacher', 'accountant'
    permissions: [String], // For future: ['add_student', 'edit_fees', 'mark_attendance']
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ------------------- STUDENT SCHEMA -------------------
const StudentSchema = new mongoose.Schema({
    // IMPORTANT: studentId and aadharNumber are SEPARATE fields
    // Both can have SAME value or DIFFERENT values
    // Both are UNIQUE individually
    studentId: { type: String, required: true, unique: true },  // Unique Student ID (can be same as Aadhar)
    aadharNumber: { type: String, required: true, unique: true }, // Unique Aadhar Number (can be same as Student ID)
    password: { type: String, required: true },
    photo: { type: String, default: '' },
    
    // Personal Information
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    dateOfBirth: { type: Date }, // FOR FUTURE: Add DOB field
    gender: { type: String, enum: ['Male', 'Female', 'Other'] }, // FOR FUTURE
    
    // Parent Information
    parentType: { type: String, enum: ['Father', 'Mother', 'Guardian'], default: 'Father' },
    fatherName: { first: String, last: String },
    fatherMobile: String,
    motherName: { first: String, last: String },
    motherMobile: String,
    guardianName: { first: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    
    // Contact Information
    studentMobile: { type: String, required: true },
    email: String,
    emergencyContact: { type: String }, // FOR FUTURE: Emergency contact number
    alternateMobile: { type: String }, // FOR FUTURE: Alternate mobile number
    
    // Documents
    aadharDocument: { type: String, default: '' }, // File path or base64
    // FOR FUTURE: Add more documents
    // birthCertificate: { type: String },
    // previousMarksheet: { type: String },
    // transferCertificate: { type: String },
    
    // Academic Information
    education: {
        board: { type: String, required: true }, // CBSE, ICSE, UP Board, etc.
        class: { type: String, required: true }, // 1st to 12th
        section: { type: String }, // FOR FUTURE: A, B, C sections
        rollNumber: { type: String }, // FOR FUTURE: Class roll number
        previousClassPercentage: { type: Number } // FOR FUTURE: Previous class percentage
    },
    
    // Session Information
    currentSession: {
        sessionName: String,
        startDate: Date,
        endDate: Date
    },
    
    // Fees Management
    monthlyFees: { type: Number, default: 0 },
    feesConcession: { type: Number, default: 0 }, // FOR FUTURE: Scholarship or concession
    lateFeePenalty: { type: Number, default: 0 }, // FOR FUTURE: Late fee penalty amount
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
        paymentMode: { type: String, enum: ['cash', 'cheque', 'online', 'card'] }, // FOR FUTURE
        transactionId: { type: String }, // FOR FUTURE: For online payments
        chequeNumber: { type: String }, // FOR FUTURE: For cheque payments
        remarks: String,
        collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' } // FOR FUTURE: Which admin collected
    }],
    
    // Attendance Management
    attendance: [{
        date: { type: Date },
        status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'absent' },
        checkInTime: String,
        checkOutTime: String,
        lateMinutes: { type: Number }, // FOR FUTURE: Calculate late minutes
        subject: { type: String }, // FOR FUTURE: Subject wise attendance
        remarks: String,
        markedAt: { type: Date, default: Date.now },
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' } // FOR FUTURE: Who marked attendance
    }],
    
    // Account Status
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
        unblockedBy: String // FOR FUTURE: Who unblocked
    }],
    
    // Additional Information
    joiningDate: { type: Date, default: Date.now },
    address: {
        current: String,
        permanent: String,
        // FOR FUTURE: More address details
        city: String,
        state: String,
        pincode: String
    },
    transportDetails: { // FOR FUTURE: Bus/transport information
        availingTransport: { type: Boolean, default: false },
    busRoute: String,
    busStop: String
},
    hostelDetails: { // FOR FUTURE: Hostel information
        isHosteller: { type: Boolean, default: false },
        roomNumber: String
    },
    medicalInfo: { // FOR FUTURE: Medical information
        bloodGroup: String,
        allergies: String,
        medicalConditions: String
    },
    
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Create compound index for better search performance
StudentSchema.index({ studentId: 1, aadharNumber: 1 });
StudentSchema.index({ 'studentName.first': 1, 'studentName.last': 1 });
StudentSchema.index({ 'education.class': 1, 'education.board': 1 });

// ------------------- TEACHER SCHEMA (FOR FUTURE) -------------------
// WHEN YOU NEED TO ADD TEACHERS, UNCOMMENT AND USE THIS:
/*
const TeacherSchema = new mongoose.Schema({
    teacherId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: {
        first: { type: String, required: true },
        middle: String,
        last: { type: String, required: true }
    },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    photo: String,
    qualification: String,
    subjects: [String], // Subjects they teach
    assignedClasses: [String], // Which classes they teach
    joiningDate: { type: Date, default: Date.now },
    salary: Number,
    address: String,
    isActive: { type: Boolean, default: true },
    permissions: [String], // What teacher can do: ['mark_attendance', 'add_marks', etc.]
    lastLogin: Date
}, { timestamps: true });
*/

// ------------------- CLASS SCHEMA (FOR FUTURE) -------------------
/*
const ClassSchema = new mongoose.Schema({
    className: { type: String, required: true }, // 1st, 2nd, etc.
    section: String,
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    subjects: [{
        name: String,
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
    }],
    totalStudents: { type: Number, default: 0 },
    academicYear: String,
    isActive: { type: Boolean, default: true }
});
*/

// ------------------- EXAM SCHEMA (FOR FUTURE) -------------------
/*
const ExamSchema = new mongoose.Schema({
    examName: { type: String, required: true }, // Mid-term, Final, etc.
    examDate: Date,
    class: { type: String, required: true },
    subject: String,
    maxMarks: Number,
    passingMarks: Number,
    results: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        marksObtained: Number,
        percentage: Number,
        grade: String,
        remarks: String
    }]
});
*/

// ------------------- OLD STUDENT SCHEMA (Archive) -------------------
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
    leavingReason: String, // FOR FUTURE: Why student left
    leavingCertificate: String // FOR FUTURE: TC document
}, { timestamps: true });

// ------------------- FEES SETTINGS SCHEMA (FOR FUTURE) -------------------
/*
const FeesSettingsSchema = new mongoose.Schema({
    sessionName: String,
    class: String,
    monthlyFees: Number,
    admissionFees: Number,
    annualCharges: Number,
    transportFees: Number,
    hostelFees: Number,
    lateFeePerDay: Number,
    discountForSiblings: Number,
    effectiveFrom: Date,
    effectiveTo: Date
});
*/

// Create Models
const Admin = mongoose.model('Admin', AdminSchema);
const Student = mongoose.model('Student', StudentSchema);
const OldStudent = mongoose.model('OldStudent', OldStudentSchema);

// FOR FUTURE: Uncomment when needed
// const Teacher = mongoose.model('Teacher', TeacherSchema);
// const Class = mongoose.model('Class', ClassSchema);
// const Exam = mongoose.model('Exam', ExamSchema);
// const FeesSettings = mongoose.model('FeesSettings', FeesSettingsSchema);

// ============================================
// JWT VERIFICATION MIDDLEWARE
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

// Calculate session end date (March 31st of next year)
function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setMonth(2); // March
    endDate.setDate(31);
    return endDate;
}

// Generate fees history for a student
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

// Move student to old students archive
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

// Validate Aadhar number (12 digits)
function isValidAadhar(aadhar) {
    return /^\d{12}$/.test(aadhar);
}

// Validate mobile number (10 digits)
function isValidMobile(mobile) {
    return /^\d{10}$/.test(mobile);
}

// Validate email
function isValidEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email);
}

// ============================================
// ADMIN APIs
// ============================================

// Admin Login
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

// Verify Token
app.get('/api/verify-token', verifyToken, async (req, res) => {
    res.json({ success: true, user: req.user });
});

// Get all admins
app.get('/api/admins', verifyToken, async (req, res) => {
    try {
        const admins = await Admin.find().select('-pws');
        res.json({ success: true, data: admins });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create new admin
app.post('/api/admins', verifyToken, async (req, res) => {
    try {
        const { adminID, password, name, role, permissions } = req.body;
        
        const existing = await Admin.findOne({ adminID });
        if (existing) {
            return res.status(400).json({ success: false, message: "Admin ID already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ 
            adminID, 
            pws: hashedPassword, 
            name: name || 'Admin',
            role: role || 'admin',
            permissions: permissions || []
        });
        await admin.save();
        
        res.json({ success: true, message: "Admin created", data: { adminID, name, role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Change password
app.post('/api/change-password', verifyToken, async (req, res) => {
    try {
        const { adminID, oldPassword, newPassword } = req.body;
        
        const admin = await Admin.findOne({ adminID });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const isValid = await bcrypt.compare(oldPassword, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Old password is incorrect" });
        }
        
        admin.pws = await bcrypt.hash(newPassword, 10);
        await admin.save();
        
        res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Setup default admin (one time)
app.get('/api/setup-admin', async (req, res) => {
    try {
        const existing = await Admin.findOne({ adminID: 'admin' });
        if (existing) {
            return res.json({ success: true, message: "Admin already exists! Use admin/admin123" });
        }
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Admin({ 
            adminID: 'admin', 
            pws: hashedPassword, 
            name: 'Super Admin',
            role: 'super_admin',
            permissions: ['all']
        });
        await admin.save();
        
        res.json({ success: true, message: "Admin created! Use admin/admin123" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// STUDENT APIs
// ============================================

// 1. STUDENT REGISTRATION
// IMPORTANT: studentId and aadharNumber are separate fields
// Both are checked individually for duplicates
app.post('/api/students/register', async (req, res) => {
    try {
        const data = req.body;
        
        console.log('📝 New Registration:', {
            studentId: data.studentId,
            aadharNumber: data.aadharNumber,
            name: `${data.studentName?.first} ${data.studentName?.last}`
        });
        
        // ========== VALIDATION ==========
        
        // Validate Student ID (12 digits)
        if (!data.studentId) {
            return res.status(400).json({ 
                success: false, 
                message: "Student ID is required" 
            });
        }
        
        if (!isValidAadhar(data.studentId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Student ID must be 12 digits" 
            });
        }
        
        // Validate Aadhar Number (12 digits)
        if (!data.aadharNumber) {
            return res.status(400).json({ 
                success: false, 
                message: "Aadhar Number is required" 
            });
        }
        
        if (!isValidAadhar(data.aadharNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: "Aadhar Number must be 12 digits" 
            });
        }
        
        // Validate Mobile Number
        if (!data.studentMobile) {
            return res.status(400).json({ 
                success: false, 
                message: "Mobile number is required" 
            });
        }
        
        if (!isValidMobile(data.studentMobile)) {
            return res.status(400).json({ 
                success: false, 
                message: "Mobile number must be 10 digits" 
            });
        }
        
        // Validate Email (if provided)
        if (data.email && !isValidEmail(data.email)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email format" 
            });
        }
        
        // Validate Name
        if (!data.studentName?.first || !data.studentName?.last) {
            return res.status(400).json({ 
                success: false, 
                message: "First name and last name are required" 
            });
        }
        
        // ========== DUPLICATE CHECK ==========
        // IMPORTANT: Check Student ID separately (NOT using $or)
        const existingByStudentId = await Student.findOne({ studentId: data.studentId });
        if (existingByStudentId) {
            console.log('❌ Duplicate Student ID:', data.studentId);
            return res.status(400).json({ 
                success: false, 
                message: `❌ Student ID ${data.studentId} is already registered!`,
                duplicateField: 'Student ID',
                existingStudent: {
                    studentId: existingByStudentId.studentId,
                    name: `${existingByStudentId.studentName.first} ${existingByStudentId.studentName.last}`
                }
            });
        }
        
        // IMPORTANT: Check Aadhar Number separately (NOT using $or)
        const existingByAadhar = await Student.findOne({ aadharNumber: data.aadharNumber });
        if (existingByAadhar) {
            console.log('❌ Duplicate Aadhar Number:', data.aadharNumber);
            return res.status(400).json({ 
                success: false, 
                message: `❌ Aadhar Number ${data.aadharNumber} is already registered!`,
                duplicateField: 'Aadhar Number',
                existingStudent: {
                    studentId: existingByAadhar.studentId,
                    name: `${existingByAadhar.studentName.first} ${existingByAadhar.studentName.last}`
                }
            });
        }
        
        console.log('✅ No duplicates found, creating student...');
        
        // ========== CREATE STUDENT ==========
        
        const joiningDate = new Date(data.joiningDate || new Date());
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = `${joiningDate.getFullYear()}-${sessionEndDate.getFullYear()}`;
        
        // Password = last 6 digits of Student ID (or custom password)
        const password = data.password || data.studentId.slice(-6);
        
        const student = new Student({
            // IMPORTANT: Both fields are set separately
            studentId: data.studentId,
            aadharNumber: data.aadharNumber,
            password: password,
            photo: data.photo || '',
            
            // Personal Information
            studentName: {
                first: data.studentName.first,
                middle: data.studentName.middle || '',
                last: data.studentName.last
            },
            dateOfBirth: data.dateOfBirth || null,
            gender: data.gender || null,
            
            // Parent Information
            parentType: data.parentType || 'Father',
            fatherName: data.fatherName || { first: '', last: '' },
            fatherMobile: data.fatherMobile || '',
            motherName: data.motherName || { first: '', last: '' },
            motherMobile: data.motherMobile || '',
            guardianName: data.guardianName || { first: '', last: '' },
            guardianMobile: data.guardianMobile || '',
            guardianRelation: data.guardianRelation || '',
            
            // Contact Information
            studentMobile: data.studentMobile,
            email: data.email || '',
            emergencyContact: data.emergencyContact || '',
            alternateMobile: data.alternateMobile || '',
            
            // Documents
            aadharDocument: data.aadharDocument || '',
            
            // Academic Information
            education: {
                board: data.education?.board || 'CBSE',
                class: data.education?.class || '9th',
                section: data.education?.section || '',
                rollNumber: data.education?.rollNumber || ''
            },
            
            // Fees
            monthlyFees: parseInt(data.monthlyFees) || 1000,
            feesConcession: parseInt(data.feesConcession) || 0,
            lateFeePenalty: parseInt(data.lateFeePenalty) || 0,
            
            // Session
            currentSession: {
                sessionName: sessionName,
                startDate: joiningDate,
                endDate: sessionEndDate
            },
            
            joiningDate: joiningDate,
            
            // Address
            address: {
                current: data.address?.current || '',
                permanent: data.address?.permanent || data.address?.current || '',
                city: data.address?.city || '',
                state: data.address?.state || '',
                pincode: data.address?.pincode || ''
            },
            
            // Status
            isActive: true,
            accountStatus: {
                isBlocked: false,
                blockedFrom: null,
                blockReason: null
            },
            
            // Initialize empty arrays
            feesHistory: [],
            attendance: [],
            blockHistory: []
        });
        
        // Generate fees history
        student.feesHistory = generateFeesHistory(joiningDate, student.monthlyFees, sessionEndDate);
        
        // Save to database
        await student.save();
        
        console.log('✅ Student registered successfully:', student.studentId);
        
        res.json({ 
            success: true, 
            message: `✅ Student registered successfully!`,
            studentId: student.studentId,
            aadharNumber: student.aadharNumber,
            password: password,
            student: {
                id: student.studentId,
                name: `${student.studentName.first} ${student.studentName.last}`,
                class: student.education.class
            }
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle MongoDB duplicate key error (fallback)
        if (err.code === 11000) {
            let duplicateField = 'Student ID or Aadhar Number';
            if (err.keyPattern?.studentId) {
                duplicateField = 'Student ID';
            } else if (err.keyPattern?.aadharNumber) {
                duplicateField = 'Aadhar Number';
            }
            
            return res.status(400).json({ 
                success: false, 
                message: `❌ ${duplicateField} is already registered!`,
                duplicateField: duplicateField
            });
        }
        
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. GET ALL STUDENTS (with filters)
app.get('/api/students', verifyToken, async (req, res) => {
    try {
        const { 
            board, 
            class: className, 
            section,
            session, 
            search, 
            page = 1, 
            limit = 50,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        let query = { isActive: true };
        
        // Apply status filter
        if (status === 'blocked') {
            query['accountStatus.isBlocked'] = true;
        } else if (status === 'active') {
            query['accountStatus.isBlocked'] = false;
        }
        
        // Apply filters
        if (board && board !== 'all') {
            query['education.board'] = board;
        }
        if (className && className !== 'all') {
            query['education.class'] = className;
        }
        if (section && section !== 'all') {
            query['education.section'] = section;
        }
        if (session && session !== 'all') {
            query['currentSession.sessionName'] = session;
        }
        
        // Apply search
        if (search) {
            query.$or = [
                { studentId: { $regex: search, $options: 'i' } },
                { aadharNumber: { $regex: search, $options: 'i' } },
                { 'studentName.first': { $regex: search, $options: 'i' } },
                { 'studentName.last': { $regex: search, $options: 'i' } },
                { studentMobile: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const students = await Student.find(query)
            .sort(sortOptions)
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
                pages: Math.ceil(total / limit),
                hasNext: skip + parseInt(limit) < total,
                hasPrev: page > 1
            },
            filters: { board, class: className, section, session, search, status }
        });
        
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. GET SINGLE STUDENT (by Student ID or Aadhar Number)
app.get('/api/students/:id', verifyToken, async (req, res) => {
    try {
        // Search by either Student ID OR Aadhar Number
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.id },
                { aadharNumber: req.params.id }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const data = student.toObject();
        delete data.password;
        
        // Calculate statistics
        const feesHistory = data.feesHistory || [];
        const totalFees = feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
        const paidFees = feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const dueFees = totalFees - paidFees;
        
        const attendance = data.attendance || [];
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const lateDays = attendance.filter(a => a.status === 'late').length;
        const halfDays = attendance.filter(a => a.status === 'half-day').length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        data.stats = {
            totalFees,
            paidFees,
            dueFees,
            paymentProgress: totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0,
            totalAttendanceDays: totalDays,
            presentDays,
            lateDays,
            halfDays,
            absentDays,
            attendancePercentage
        };
        
        // Get recent attendance (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        data.recentAttendance = attendance.filter(a => new Date(a.date) >= thirtyDaysAgo);
        
        // Get pending fees
        data.pendingFees = feesHistory.filter(f => f.status !== 'paid');
        
        res.json({ success: true, data });
        
    } catch (err) {
        console.error('Get student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. UPDATE STUDENT
app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.id },
                { aadharNumber: req.params.id }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const updates = req.body;
        
        // Allowed fields to update
        const allowedUpdates = [
            'studentName', 'studentMobile', 'email', 'parentType',
            'fatherName', 'fatherMobile', 'motherName', 'motherMobile',
            'guardianName', 'guardianMobile', 'guardianRelation',
            'education', 'monthlyFees', 'address', 'photo', 'aadharDocument',
            'dateOfBirth', 'gender', 'emergencyContact', 'alternateMobile',
            'feesConcession', 'lateFeePenalty'
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

// 5. DELETE / MOVE TO ARCHIVE
app.delete('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const { permanent, reason } = req.query;
        
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.id },
                { aadharNumber: req.params.id }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (permanent === 'true') {
            await Student.deleteOne({ _id: student._id });
            res.json({ success: true, message: "Student permanently deleted" });
        } else {
            const moved = await moveToOldStudents(student, reason || 'Session completed');
            if (moved) {
                res.json({ success: true, message: "Student moved to archive" });
            } else {
                res.status(500).json({ success: false, message: "Failed to archive student" });
            }
        }
        
    } catch (err) {
        console.error('Delete student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. UPDATE FEES
app.post('/api/students/:studentId/fees', verifyToken, async (req, res) => {
    try {
        const { month, year, paidAmount, remarks, paymentMode, transactionId } = req.body;
        
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.studentId },
                { aadharNumber: req.params.studentId }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const feeIndex = student.feesHistory.findIndex(f => f.month === month && f.year === parseInt(year));
        
        if (feeIndex === -1) {
            return res.status(404).json({ success: false, message: "Fee record not found for this month" });
        }
        
        const fee = student.feesHistory[feeIndex];
        const newPaidAmount = (fee.paidAmount || 0) + parseFloat(paidAmount);
        
        fee.paidAmount = newPaidAmount;
        fee.dueAmount = fee.amount - newPaidAmount;
        fee.status = newPaidAmount >= fee.amount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
        fee.paymentDate = new Date();
        fee.paymentMode = paymentMode || fee.paymentMode;
        fee.transactionId = transactionId || fee.transactionId;
        
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

// 7. MARK ATTENDANCE
app.post('/api/students/:studentId/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, checkInTime, checkOutTime, remarks, subject } = req.body;
        
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.studentId },
                { aadharNumber: req.params.studentId }
            ]
        });
        
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
        
        // Calculate late minutes if status is 'late'
        let lateMinutes = null;
        if (status === 'late' && checkInTime) {
            const [hours, minutes] = checkInTime.split(':');
            const checkInHour = parseInt(hours);
            if (checkInHour > 9) { // Assuming 9 AM is school start time
                lateMinutes = (checkInHour - 9) * 60 + parseInt(minutes);
            }
        }
        
        const record = {
            date: attendanceDate,
            status: status || 'absent',
            checkInTime: checkInTime || null,
            checkOutTime: checkOutTime || null,
            lateMinutes: lateMinutes,
            subject: subject || null,
            remarks: remarks || '',
            markedAt: new Date(),
            markedBy: req.user?.id
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

// 8. BLOCK STUDENT
app.post('/api/students/:studentId/block', verifyToken, async (req, res) => {
    try {
        const { reason, blockedUntil } = req.body;
        
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.studentId },
                { aadharNumber: req.params.studentId }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        student.accountStatus = {
            isBlocked: true,
            blockedFrom: new Date(),
            blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
            blockReason: reason || 'No reason provided',
            blockedBy: req.user?.adminID || 'Admin'
        };
        
        student.blockHistory.push({
            blockedFrom: new Date(),
            blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
            reason: reason || 'No reason provided',
            blockedBy: req.user?.adminID || 'Admin'
        });
        
        await student.save();
        
        res.json({ success: true, message: "Student blocked successfully" });
        
    } catch (err) {
        console.error('Block student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 9. UNBLOCK STUDENT
app.post('/api/students/:studentId/unblock', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.studentId },
                { aadharNumber: req.params.studentId }
            ]
        });
        
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
            blockedUntil: null,
            blockReason: null,
            blockedBy: null
        };
        
        await student.save();
        
        res.json({ success: true, message: "Student unblocked successfully" });
        
    } catch (err) {
        console.error('Unblock student error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 10. GET ARCHIVED STUDENTS
app.get('/api/students/old', verifyToken, async (req, res) => {
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
                { aadharNumber: { $regex: search, $options: 'i' } },
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

// 11. DASHBOARD STATISTICS
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
    try {
        // Student counts
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalOldStudents = await OldStudent.countDocuments();
        const blockedStudents = await Student.countDocuments({ 'accountStatus.isBlocked': true });
        
        // Gender distribution
        const maleStudents = await Student.countDocuments({ gender: 'Male', isActive: true });
        const femaleStudents = await Student.countDocuments({ gender: 'Female', isActive: true });
        
        // Class wise distribution
        const classWise = await Student.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$education.class', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        // Fees collection
        const students = await Student.find({ isActive: true });
        let totalFeesCollected = 0;
        let totalFeesDue = 0;
        let totalFeesAmount = 0;
        
        for (const student of students) {
            const feesHistory = student.feesHistory || [];
            totalFeesAmount += feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            totalFeesCollected += feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            totalFeesDue += feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
        }
        
        // Attendance (last 30 days)
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
        
        // Monthly fees trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const year = d.getFullYear();
            
            let collected = 0;
            let expected = 0;
            
            for (const student of students) {
                const feeRecord = (student.feesHistory || []).find(f => f.month === monthName && f.year === year);
                if (feeRecord) {
                    collected += feeRecord.paidAmount || 0;
                    expected += feeRecord.amount || 0;
                }
            }
            monthlyTrend.push({ 
                month: `${monthName} ${year}`, 
                collected,
                expected,
                percentage: expected > 0 ? Math.round((collected / expected) * 100) : 0
            });
        }
        
        // Recent registrations (last 30 days)
        const recentRegistrations = await Student.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('studentId studentName createdAt education.class');
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalStudents,
                    totalOldStudents,
                    blockedStudents,
                    maleStudents,
                    femaleStudents,
                    attendancePercentage
                },
                fees: {
                    totalAmount: totalFeesAmount,
                    collected: totalFeesCollected,
                    due: totalFeesDue,
                    collectionRate: totalFeesAmount > 0 ? Math.round((totalFeesCollected / totalFeesAmount) * 100) : 0
                },
                classWise,
                monthlyTrend,
                recentRegistrations
            }
        });
        
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 12. BULK DELETE
app.post('/api/students/bulk-delete', verifyToken, async (req, res) => {
    try {
        const { studentIds, permanent, reason } = req.body;
        
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: "Student IDs array is required" });
        }
        
        let deletedCount = 0;
        let movedCount = 0;
        let notFoundCount = 0;
        
        for (const studentId of studentIds) {
            const student = await Student.findOne({ 
                $or: [
                    { studentId: studentId },
                    { aadharNumber: studentId }
                ]
            });
            
            if (student) {
                if (permanent === true) {
                    await Student.deleteOne({ _id: student._id });
                    deletedCount++;
                } else {
                    const moved = await moveToOldStudents(student, reason || 'Bulk archive');
                    if (moved) movedCount++;
                }
            } else {
                notFoundCount++;
            }
        }
        
        res.json({
            success: true,
            message: permanent ? `${deletedCount} students permanently deleted` : `${movedCount} students moved to archive`,
            deletedCount,
            movedCount,
            notFoundCount
        });
        
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 13. EXPORT STUDENTS (CSV)
app.get('/api/students/export/csv', verifyToken, async (req, res) => {
    try {
        const { board, class: className, section, status } = req.query;
        
        let query = {};
        
        if (board && board !== 'all') query['education.board'] = board;
        if (className && className !== 'all') query['education.class'] = className;
        if (section && section !== 'all') query['education.section'] = section;
        if (status === 'active') query['accountStatus.isBlocked'] = false;
        if (status === 'blocked') query['accountStatus.isBlocked'] = true;
        
        const students = await Student.find(query);
        
        const headers = [
            'Student ID', 'Aadhar Number', 'First Name', 'Last Name', 
            'Mobile', 'Email', 'Board', 'Class', 'Section',
            'Session', 'Monthly Fees', 'Total Paid', 'Total Due',
            'Attendance %', 'Status', 'Joining Date', 'Gender', 'DOB'
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
                s.aadharNumber,
                s.studentName?.first || '',
                s.studentName?.last || '',
                s.studentMobile || '',
                s.email || '',
                s.education?.board || '',
                s.education?.class || '',
                s.education?.section || '',
                s.currentSession?.sessionName || '',
                s.monthlyFees || 0,
                totalPaid,
                totalDue,
                attendancePercent,
                s.accountStatus?.isBlocked ? 'Blocked' : 'Active',
                s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '',
                s.gender || '',
                s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : ''
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=students_${Date.now()}.csv`);
        res.send(csvContent);
        
    } catch (err) {
        console.error('Export CSV error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 14. CHANGE STUDENT PASSWORD
app.post('/api/students/:studentId/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.studentId },
                { aadharNumber: req.params.studentId }
            ]
        });
        
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

// 15. CHECK DUPLICATE (Separate checks for Student ID and Aadhar Number)
app.post('/api/students/check-duplicate', async (req, res) => {
    try {
        const { studentId, aadharNumber } = req.body;
        
        let duplicateField = null;
        let existingStudent = null;
        
        // Check Student ID separately
        if (studentId && isValidAadhar(studentId)) {
            existingStudent = await Student.findOne({ studentId: studentId });
            if (existingStudent) {
                duplicateField = 'Student ID';
            }
        }
        
        // Check Aadhar Number separately (only if no duplicate found yet)
        if (!duplicateField && aadharNumber && isValidAadhar(aadharNumber)) {
            existingStudent = await Student.findOne({ aadharNumber: aadharNumber });
            if (existingStudent) {
                duplicateField = 'Aadhar Number';
            }
        }
        
        if (duplicateField && existingStudent) {
            return res.json({
                success: true,
                isDuplicate: true,
                duplicateField: duplicateField,
                message: `This ${duplicateField} is already registered`,
                student: {
                    studentId: existingStudent.studentId,
                    aadharNumber: existingStudent.aadharNumber,
                    name: `${existingStudent.studentName.first} ${existingStudent.studentName.last}`,
                    class: existingStudent.education?.class
                }
            });
        } else {
            return res.json({
                success: true,
                isDuplicate: false,
                message: "Both Student ID and Aadhar Number are available"
            });
        }
        
    } catch (err) {
        console.error('Check duplicate error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 16. GET STUDENTS BY CLASS
app.get('/api/students/class/:className', verifyToken, async (req, res) => {
    try {
        const { className } = req.params;
        const { section, board } = req.query;
        
        let query = { 
            isActive: true,
            'education.class': className 
        };
        
        if (section) query['education.section'] = section;
        if (board && board !== 'all') query['education.board'] = board;
        
        const students = await Student.find(query)
            .sort({ 'studentName.first': 1 })
            .select('-password');
        
        res.json({ 
            success: true, 
            count: students.length,
            data: students 
        });
        
    } catch (err) {
        console.error('Get students by class error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 17. GET ATTENDANCE REPORT
app.get('/api/students/:studentId/attendance-report', verifyToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.studentId },
                { aadharNumber: req.params.studentId }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        let attendance = student.attendance || [];
        
        // Filter by month/year if provided
        if (month && year) {
            attendance = attendance.filter(a => {
                const date = new Date(a.date);
                return date.getMonth() === parseInt(month) - 1 && date.getFullYear() === parseInt(year);
            });
        }
        
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const lateDays = attendance.filter(a => a.status === 'late').length;
        const halfDays = attendance.filter(a => a.status === 'half-day').length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;
        
        res.json({
            success: true,
            data: {
                attendance,
                summary: {
                    totalDays,
                    presentDays,
                    lateDays,
                    halfDays,
                    absentDays,
                    percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
                }
            }
        });
        
    } catch (err) {
        console.error('Attendance report error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 18. GET FEES REPORT
app.get('/api/students/:studentId/fees-report', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ 
            $or: [
                { studentId: req.params.studentId },
                { aadharNumber: req.params.studentId }
            ]
        });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const feesHistory = student.feesHistory || [];
        
        const summary = {
            totalAmount: feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0),
            totalPaid: feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0),
            totalDue: feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0),
            paidMonths: feesHistory.filter(f => f.status === 'paid').length,
            partialMonths: feesHistory.filter(f => f.status === 'partial').length,
            unpaidMonths: feesHistory.filter(f => f.status === 'unpaid').length
        };
        
        summary.percentage = summary.totalAmount > 0 
            ? Math.round((summary.totalPaid / summary.totalAmount) * 100) 
            : 0;
        
        res.json({
            success: true,
            data: {
                feesHistory,
                summary,
                student: {
                    id: student.studentId,
                    name: `${student.studentName.first} ${student.studentName.last}`,
                    class: student.education?.class,
                    monthlyFees: student.monthlyFees
                }
            }
        });
        
    } catch (err) {
        console.error('Fees report error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ========== FUTURE TEACHER APIs ==========
// ============================================
// 
// जब आपको TEACHER functionality add करनी हो तो यहाँ पर APIs add करें:
//
// 1. Teacher Registration: POST /api/teachers/register
// 2. Get All Teachers: GET /api/teachers
// 3. Get Single Teacher: GET /api/teachers/:id
// 4. Update Teacher: PUT /api/teachers/:id
// 5. Delete Teacher: DELETE /api/teachers/:id
// 6. Teacher Login: POST /api/teacher-login
// 7. Assign Class to Teacher: POST /api/teachers/assign-class
// 8. Get Teacher's Students: GET /api/teachers/:teacherId/students
//
// Teacher ke liye alag se JWT middleware bhi banana hoga:
// const verifyTeacherToken = (req, res, next) => { ... }
//
// ========== FUTURE CLASS APIs ==========
// 
// 1. Create Class: POST /api/classes
// 2. Get All Classes: GET /api/classes
// 3. Update Class: PUT /api/classes/:id
// 4. Delete Class: DELETE /api/classes/:id
// 5. Assign Teacher to Class: POST /api/classes/assign-teacher
// 6. Get Class Students: GET /api/classes/:classId/students
//
// ========== FUTURE EXAM APIs ==========
//
// 1. Create Exam: POST /api/exams
// 2. Get All Exams: GET /api/exams
// 3. Add Marks: POST /api/exams/:examId/marks
// 4. Get Result: GET /api/exams/:examId/result
// 5. Generate Report Card: GET /api/students/:studentId/report-card
//
// ========== FUTURE NOTICE APIs ==========
//
// 1. Create Notice: POST /api/notices
// 2. Get All Notices: GET /api/notices
// 3. Delete Notice: DELETE /api/notices/:id
// 4. Send Notification: POST /api/notifications/send
//
// ============================================

// ============================================
// SERVE HTML FILES
// ============================================
app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'login.html')); 
});
app.get('/login.html', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'login.html')); 
});
app.get('/management.html', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'management.html')); 
});
app.get('/student-management.html', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'student-management.html')); 
});

// ============================================
// ERROR HANDLERS
// ============================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: "API not found" });
});

app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).json({ success: false, message: "Something went wrong!" });
});

// ============================================
// AUTO CREATE DEFAULT ADMIN ON STARTUP
// ============================================
mongoose.connection.once('open', async () => {
    try {
        // Create default admin if not exists
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
            console.log('\n✅ =====================================');
            console.log('✅ DEFAULT ADMIN CREATED!');
            console.log('✅ =====================================');
            console.log('   👤 Admin ID: admin');
            console.log('   🔑 Password: admin123');
            console.log('✅ =====================================\n');
        } else {
            console.log('✅ Admin already exists');
        }
        
        // Ensure indexes are created
        await Student.createIndexes();
        console.log('✅ Database indexes verified');
        
    } catch (err) {
        console.log('Admin creation error:', err.message);
    }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`🔗 Login: http://localhost:${PORT}/login.html`);
    console.log(`🔑 Credentials: admin / admin123`);
    console.log(`\n📌 API Endpoints:`);
    console.log(`   POST   /api/students/register - Register student`);
    console.log(`   GET    /api/students - Get all students`);
    console.log(`   GET    /api/students/:id - Get student by ID/Aadhar`);
    console.log(`   PUT    /api/students/:id - Update student`);
    console.log(`   DELETE /api/students/:id - Delete/Archive student`);
    console.log(`   POST   /api/students/:studentId/fees - Update fees`);
    console.log(`   POST   /api/students/:studentId/attendance - Mark attendance`);
    console.log(`   POST   /api/students/check-duplicate - Check duplicate\n`);
});
