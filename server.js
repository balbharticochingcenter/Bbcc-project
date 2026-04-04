// ============================================
// SERVER.JS - COMPLETE ENHANCED VERSION
// Bal Bharti Coaching Center Management System
// WITH COMPLETE STUDENT SYSTEM
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const path = require('path');
const xss = require('xss-clean');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

// Load environment variables
dotenv.config();
const app = express();

// ============================================
// ENHANCED SECURITY CONFIGURATION
// ============================================

// Generate nonce for CSP
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Trust proxy for Render
app.set('trust proxy', 1);

// Enhanced Helmet configuration
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://code.jquery.com",
                    "https://cdn.datatables.net",
                    "https://cdn.jsdelivr.net"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com",
                    "https://cdn.datatables.net"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://images.unsplash.com",
                    "https://*.unsplash.com",
                    "https://*.cloudinary.com",
                    "https:",
                    "http:"
                ],
                fontSrc: [
                    "'self'",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com",
                    "https://fonts.gstatic.com",
                    "data:"
                ],
                connectSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net",
                    "https://api.github.com",
                    "https://*.mongodb.net"
                ],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'", "blob:", "data:"],
                frameSrc: ["'self'", "blob:", "data:", "https:"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    })
);

// CORS with specific origin
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Data sanitization against XSS
app.use(xss());

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Compression
app.use(compression());

// JSON parser with limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Enhanced rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." }
});

// ============================================
// DATABASE CONNECTION
// ============================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch(err => console.log("❌ DB Connection Error:", err.message));

// ============================================
// SCHEMA DEFINITIONS
// ============================================

// Web Config Schema
const WebConfigSchema = new mongoose.Schema({
    logoText: { type: String, required: true, trim: true, default: 'BBCC' },
    logoType: { type: String, enum: ['text', 'image', 'url'], default: 'text' },
    logoImage: { type: String, default: '' },
    title: { type: String, required: true, default: 'Bal Bharti Coaching' },
    subTitle: { type: String, default: 'Excellence in Education' },
    aboutText: { type: String, default: 'Welcome to Bal Bharti Coaching Center.' },
    slides: [{ type: String }],
    whatsapp: { type: String, default: '#' },
    insta: { type: String, default: '#' },
    fb: { type: String, default: '#' },
    twitter: { type: String, default: '#' },
    contactAddress: { type: String, default: '123 Education Street, City' },
    contactPhone: { type: String, default: '+91 98765 43210' },
    contactEmail: { type: String, default: 'info@balbharti.com' },
    establishedYear: { type: Number, default: 2010 },
    totalStudentsTrained: { type: Number, default: 5000 },
    totalFaculty: { type: Number, default: 25 }
}, { timestamps: true });

const WebConfig = mongoose.model('WebConfig', WebConfigSchema);

// Testimonial Schema
const TestimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['Student', 'Parent', 'Teacher', 'Alumni'] },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

const Testimonial = mongoose.model('Testimonial', TestimonialSchema);

// Admin Schema
const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true, trim: true },
    pws: { type: String, required: true },
    photo: { type: String, default: '' },
    aadharNumber: { type: String, default: '' },
    aadharDoc: { type: String, default: '' },
    name: { type: String, default: 'Admin' },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

// ============================================
// COMPLETE STUDENT SCHEMA
// ============================================

const StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    
    parentType: { 
        type: String, 
        enum: ['Father', 'Mother', 'Guardian'], 
        required: true 
    },
    
    fatherName: { first: { type: String, default: '' }, middle: { type: String, default: '' }, last: { type: String, default: '' } },
    fatherMobile: { type: String, default: '' },
    motherName: { first: { type: String, default: '' }, middle: { type: String, default: '' }, last: { type: String, default: '' } },
    motherMobile: { type: String, default: '' },
    guardianName: { first: { type: String, default: '' }, middle: { type: String, default: '' }, last: { type: String, default: '' } },
    guardianMobile: { type: String, default: '' },
    guardianRelation: { type: String, default: '' },
    
    studentMobile: { type: String, required: true },
    alternateMobile: { type: String, default: '' },
    email: { type: String, default: '' },
    
    aadharNumber: { type: String, required: true, unique: true },
    aadharDocument: { type: String, required: true },
    
    education: {
        board: { type: String, required: true },
        class: { type: String, required: true }
    },
    
    currentSession: {
        sessionName: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    
    monthlyFees: { type: Number, required: true, default: 0 },
    
    feesHistory: [{
        sessionName: { type: String, required: true },
        month: { type: String, required: true },
        year: { type: Number, required: true },
        monthIndex: { type: Number, required: true },
        amount: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['paid', 'partial', 'unpaid', 'exempted'], default: 'unpaid' },
        paymentDate: { type: Date },
        lateFee: { type: Number, default: 0 },
        remarks: { type: String, default: '' },
        updatedBy: { type: String }
    }],
    
    attendance: [{
        date: { type: String, required: true },
        sessionName: { type: String, required: true },
        status: { type: String, enum: ['present', 'absent', 'late', 'half-day', 'holiday'], default: 'absent' },
        checkInTime: { type: String, default: '' },
        checkOutTime: { type: String, default: '' },
        remarks: { type: String, default: '' },
        markedBy: { type: String },
        markedAt: { type: Date, default: Date.now }
    }],
    
    accountStatus: {
        isBlocked: { type: Boolean, default: false },
        blockedFrom: { type: Date },
        blockedUntil: { type: Date },
        blockReason: { type: String, default: '' },
        blockedBy: { type: String },
        unblockedAt: { type: Date },
        unblockedBy: { type: String }
    },
    
    blockHistory: [{
        blockedFrom: { type: Date, required: true },
        blockedUntil: { type: Date },
        reason: { type: String, required: true },
        blockedBy: { type: String, required: true },
        unblockedAt: { type: Date },
        unblockedBy: { type: String },
        attendanceFrozen: { type: Boolean, default: true },
        feesFrozen: { type: Boolean, default: true }
    }],
    
    sessionCompleted: { type: Boolean, default: false },
    sessionCompletedAt: { type: Date },
    movedToOldOn: { type: Date },
    
    registrationDate: { type: Date, default: Date.now },
    joiningDate: { type: Date, required: true },
    leavingDate: { type: Date },
    
    address: {
        current: { type: String, required: true },
        permanent: { type: String, required: true },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },
    
    previousSchool: { type: String, default: '' },
    remarks: { type: String, default: '' },
    createdBy: { type: String, default: 'admin' }
    
}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

// Old Students Schema
const OldStudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, index: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    studentName: { first: String, middle: String, last: String },
    parentType: String,
    fatherName: { first: String, middle: String, last: String },
    fatherMobile: String,
    motherName: { first: String, middle: String, last: String },
    motherMobile: String,
    guardianName: { first: String, middle: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    studentMobile: String,
    aadharNumber: String,
    aadharDocument: String,
    education: { board: String, class: String },
    completedSession: { sessionName: String, startDate: Date, endDate: Date },
    monthlyFees: Number,
    feesHistory: Array,
    attendance: Array,
    address: { current: String, permanent: String, city: String, state: String, pincode: String },
    totalFeesPaid: { type: Number, default: 0 },
    totalFeesDue: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    sessionCompletedAt: { type: Date, default: Date.now },
    movedBy: String,
    reason: { type: String, default: 'session_completed' }
}, { timestamps: true });

const OldStudent = mongoose.model('OldStudent', OldStudentSchema);

// Teacher Schema
const TeacherSchema = new mongoose.Schema({
    teacherId: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    teacherName: { first: String, middle: String, last: String },
    fatherName: { first: String, middle: String, last: String },
    mobile: String,
    altMobile: String,
    dob: Date,
    lastQualification: String,
    qualificationDoc: String,
    aadharNumber: { type: String, required: true, unique: true },
    aadharDoc: String,
    subject: String,
    salary: Number,
    salaryHistory: Array,
    attendance: Array,
    joiningDate: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    address: { current: String, permanent: String, city: String, state: String, pincode: String },
    bankDetails: { accountHolder: String, accountNumber: String, ifscCode: String, bankName: String },
    emergencyContact: { name: String, relation: String, phone: String },
    experience: Number,
    previousSchool: String,
    resume: String,
    experienceCertificate: String,
    remarks: String,
    rejectionReason: String,
    createdBy: String
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', TeacherSchema);

console.log("✅ All Schemas loaded successfully");

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setMonth(2);
    endDate.setDate(7);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
}

function getSessionName(startDate, endDate) {
    return `${startDate.getFullYear()}-${endDate.getFullYear()}`;
}

function calculateProRatedFees(monthlyFees, monthDate, joinDate, sessionEndDate) {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    if (monthEnd < joinDate) return 0;
    if (monthStart > sessionEndDate) return 0;
    
    const effectiveStart = monthStart < joinDate ? joinDate : monthStart;
    const effectiveEnd = monthEnd > sessionEndDate ? sessionEndDate : monthEnd;
    
    const daysInMonth = monthEnd.getDate();
    const effectiveDays = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.round((monthlyFees / daysInMonth) * effectiveDays * 100) / 100;
}

function generateFeesHistory(studentData) {
    const feesHistory = [];
    const joinDate = new Date(studentData.joiningDate);
    const sessionEndDate = studentData.sessionEndDate || getSessionEndDate(joinDate);
    const monthlyFees = studentData.monthlyFees;
    const sessionName = getSessionName(joinDate, sessionEndDate);
    
    let currentDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    
    while (currentDate <= sessionEndDate) {
        const monthName = currentDate.toLocaleString('default', { month: 'short' });
        const year = currentDate.getFullYear();
        const monthIndex = currentDate.getMonth();
        
        const amount = calculateProRatedFees(monthlyFees, currentDate, joinDate, sessionEndDate);
        
        if (amount > 0) {
            feesHistory.push({
                sessionName: sessionName,
                month: monthName,
                year: year,
                monthIndex: monthIndex,
                amount: amount,
                paidAmount: 0,
                dueAmount: amount,
                status: 'unpaid',
                remarks: amount < monthlyFees ? `Pro-rated fees (joined on ${joinDate.toLocaleDateString()})` : ''
            });
        }
        
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return feesHistory;
}

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ adminID: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = new Admin({ 
                adminID: 'admin', 
                pws: hashedPassword,
                name: 'Super Admin'
            });
            await newAdmin.save();
            console.log("✅ Default Admin Created: Username = admin, Password = admin123");
        }
    } catch (err) {
        console.log("❌ Admin creation error:", err.message);
    }
}

async function initializeDefaultConfig() {
    try {
        const configExists = await WebConfig.findOne();
        if (!configExists) {
            const defaultConfig = new WebConfig({
                logoText: 'BBCC',
                title: 'Bal Bharti Coaching',
                subTitle: 'Excellence in Education',
                aboutText: 'Welcome to Bal Bharti Coaching Center.',
                slides: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'],
                contactPhone: '+91 98765 43210',
                contactEmail: 'info@balbharti.com'
            });
            await defaultConfig.save();
            console.log("✅ Default website config created");
        }
    } catch (err) {
        console.log("❌ Config initialization error:", err.message);
    }
}

async function initializeDefaultTestimonials() {
    try {
        const testimonialsCount = await Testimonial.countDocuments();
        if (testimonialsCount === 0) {
            await Testimonial.insertMany([
                { name: "Priya Sharma", role: "Parent", text: "Great coaching center!", rating: 5, order: 1, isActive: true }
            ]);
            console.log("✅ Default testimonials created");
        }
    } catch (err) {
        console.log("❌ Testimonials initialization error:", err.message);
    }
}

// ============================================
// TOKEN VERIFICATION MIDDLEWARE
// ============================================

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid token." });
        }
        req.user = decoded;
        next();
    });
};

// ============================================
// CHECK STUDENT BLOCKED MIDDLEWARE
// ============================================

const checkStudentBlocked = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || req.body.studentId;
        const student = await Student.findOne({ studentId: studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (student.accountStatus.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: `Account is BLOCKED. Reason: ${student.accountStatus.blockReason}`,
                isBlocked: true
            });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================
// PUBLIC APIs
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "Server is running" });
});

app.get('/api/config', async (req, res) => {
    try {
        const config = await WebConfig.findOne();
        res.json(config || {});
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalTeachers = await Teacher.countDocuments({ status: 'approved' });
        res.json({ success: true, data: { totalStudents, totalTeachers } });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get('/api/testimonials', async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ isActive: true });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// ============================================
// ADMIN LOGIN
// ============================================

app.post('/api/admin-login', authLimiter, async (req, res) => {
    const { userid, password } = req.body;
    
    try {
        const admin = await Admin.findOne({ adminID: userid });
        
        if (admin && await bcrypt.compare(password, admin.pws)) {
            const token = jwt.sign(
                { id: admin._id, adminID: admin.adminID, role: 'admin' },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '2h' }
            );
            res.json({ success: true, token, admin: { name: admin.name, adminID: admin.adminID } });
        } else {
            res.status(401).json({ success: false, message: "Wrong credentials!" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ============================================
// STUDENT APIs
// ============================================

// 1. Student Registration
app.post('/api/student-register', async (req, res) => {
    try {
        const data = req.body;
        
        // Validate required fields
        const requiredFields = ['studentId', 'password', 'photo', 'aadharNumber', 'aadharDocument', 
                                'studentMobile', 'monthlyFees', 'parentType', 'joiningDate'];
        for (const field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({ success: false, message: `${field} is required` });
            }
        }
        
        // Check for existing student
        const existing = await Student.findOne({ 
            $or: [{ studentId: data.studentId }, { aadharNumber: data.aadharNumber }] 
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Student ID or Aadhar already exists" });
        }
        
        // Calculate session dates
        const joiningDate = new Date(data.joiningDate);
        const sessionEndDate = getSessionEndDate(joiningDate);
        const sessionName = getSessionName(joiningDate, sessionEndDate);
        
        // Prepare parent data
        let fatherName = { first: '', middle: '', last: '' };
        let fatherMobile = '';
        let motherName = { first: '', middle: '', last: '' };
        let motherMobile = '';
        let guardianName = { first: '', middle: '', last: '' };
        let guardianMobile = '';
        let guardianRelation = '';
        
        if (data.parentType === 'Father') {
            fatherName = data.fatherName || fatherName;
            fatherMobile = data.fatherMobile || '';
        } else if (data.parentType === 'Mother') {
            motherName = data.motherName || motherName;
            motherMobile = data.motherMobile || '';
        } else if (data.parentType === 'Guardian') {
            guardianName = data.guardianName || guardianName;
            guardianMobile = data.guardianMobile || '';
            guardianRelation = data.guardianRelation || '';
        }
        
        // Create student
        const student = new Student({
            studentId: data.studentId,
            password: data.password,
            photo: data.photo,
            studentName: data.studentName || { first: '', last: '' },
            parentType: data.parentType,
            fatherName, fatherMobile, motherName, motherMobile, guardianName, guardianMobile, guardianRelation,
            studentMobile: data.studentMobile,
            alternateMobile: data.alternateMobile || '',
            email: data.email || '',
            aadharNumber: data.aadharNumber,
            aadharDocument: data.aadharDocument,
            education: data.education || { board: '', class: '' },
            monthlyFees: data.monthlyFees,
            currentSession: { sessionName, startDate: joiningDate, endDate: sessionEndDate },
            joiningDate: joiningDate,
            address: data.address || { current: '', permanent: '' },
            createdBy: 'admin'
        });
        
        // Generate fees history
        student.feesHistory = generateFeesHistory({
            joiningDate: joiningDate,
            monthlyFees: data.monthlyFees,
            sessionEndDate: sessionEndDate
        });
        
        await student.save();
        
        res.json({ 
            success: true, 
            message: "Registration successful",
            studentId: student.studentId,
            session: { sessionName, startDate: joiningDate, endDate: sessionEndDate }
        });
        
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Get all students
app.get('/api/students', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. Get student by ID
app.get('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const studentData = student.toObject();
        delete studentData.password;
        delete studentData.aadharNumber;
        delete studentData.aadharDocument;
        
        res.json({ success: true, data: studentData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Update student
app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const updateData = req.body;
        if (updateData.studentName) student.studentName = updateData.studentName;
        if (updateData.studentMobile) student.studentMobile = updateData.studentMobile;
        if (updateData.monthlyFees) student.monthlyFees = updateData.monthlyFees;
        if (updateData.education) student.education = updateData.education;
        if (updateData.address) student.address = updateData.address;
        
        await student.save();
        res.json({ success: true, message: "Student updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. Delete student
app.delete('/api/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        await Student.findOneAndDelete({ studentId: req.params.id });
        res.json({ success: true, message: "Student deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. Student Login
app.post('/api/student-login', authLimiter, async (req, res) => {
    const { studentId, password } = req.body;
    
    try {
        const student = await Student.findOne({ studentId: studentId });
        
        if (!student || student.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        if (student.accountStatus.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: `Account is BLOCKED. Reason: ${student.accountStatus.blockReason}`
            });
        }
        
        const token = jwt.sign(
            { id: student._id, studentId: student.studentId, role: 'student' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '15d' }
        );
        
        const studentData = student.toObject();
        delete studentData.password;
        delete studentData.aadharNumber;
        delete studentData.aadharDocument;
        
        res.json({ success: true, token, data: studentData });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

// 7. Get student self data
app.get('/api/students/self', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const student = await Student.findOne({ studentId: req.user.studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const studentData = student.toObject();
        delete studentData.password;
        
        res.json({ success: true, data: studentData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 8. Update fees
app.post('/api/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const { month, year, paidAmount, sessionName } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const feeEntry = student.feesHistory.find(f => 
            f.month === month && f.year === year && f.sessionName === sessionName
        );
        
        if (feeEntry) {
            feeEntry.paidAmount += paidAmount;
            feeEntry.dueAmount = feeEntry.amount - feeEntry.paidAmount;
            feeEntry.status = feeEntry.paidAmount >= feeEntry.amount ? 'paid' : feeEntry.paidAmount > 0 ? 'partial' : 'unpaid';
            feeEntry.paymentDate = new Date();
            feeEntry.updatedBy = req.user.adminID;
            
            await student.save();
            
            // Auto-block if 2+ months due
            const unpaidMonths = student.feesHistory.filter(f => f.status === 'unpaid');
            if (unpaidMonths.length >= 2 && !student.accountStatus.isBlocked) {
                student.accountStatus = {
                    isBlocked: true,
                    blockedFrom: new Date(),
                    blockReason: 'auto_non_payment',
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

// 9. Mark attendance
app.post('/api/students/:studentId/attendance', verifyToken, checkStudentBlocked, async (req, res) => {
    try {
        const { date, status } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        if (!student.attendance) student.attendance = [];
        
        const existingIndex = student.attendance.findIndex(a => a.date === date);
        const record = { 
            date, 
            sessionName: student.currentSession.sessionName,
            status, 
            markedBy: req.user.role === 'teacher' ? req.user.teacherId : req.user.adminID,
            markedAt: new Date()
        };
        
        if (existingIndex >= 0) {
            student.attendance[existingIndex] = record;
        } else {
            student.attendance.push(record);
        }
        
        await student.save();
        res.json({ success: true, message: "Attendance marked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 10. Get attendance
app.get('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        res.json({ success: true, data: student.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 11. Block student
app.post('/api/students/:studentId/block', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { reason } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        student.accountStatus = {
            isBlocked: true,
            blockedFrom: new Date(),
            blockReason: reason,
            blockedBy: req.user.adminID
        };
        
        await student.save();
        res.json({ success: true, message: "Student blocked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 12. Unblock student
app.post('/api/students/:studentId/unblock', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        student.accountStatus = {
            isBlocked: false,
            blockedFrom: null,
            blockReason: '',
            blockedBy: '',
            unblockedAt: new Date(),
            unblockedBy: req.user.adminID
        };
        
        await student.save();
        res.json({ success: true, message: "Student unblocked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 13. Move to old students
app.post('/api/move-to-old-student', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { studentId, reason } = req.body;
        const student = await Student.findOne({ studentId: studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const totalFeesPaid = student.feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const totalFeesDue = student.feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
        
        const oldStudent = new OldStudent({
            studentId: student.studentId,
            password: student.password,
            photo: student.photo,
            studentName: student.studentName,
            parentType: student.parentType,
            studentMobile: student.studentMobile,
            aadharNumber: student.aadharNumber,
            aadharDocument: student.aadharDocument,
            education: student.education,
            completedSession: student.currentSession,
            monthlyFees: student.monthlyFees,
            feesHistory: student.feesHistory,
            attendance: student.attendance,
            address: student.address,
            totalFeesPaid: totalFeesPaid,
            totalFeesDue: totalFeesDue,
            movedBy: req.user.adminID,
            reason: reason || 'session_completed'
        });
        
        await oldStudent.save();
        await Student.deleteOne({ studentId: studentId });
        
        res.json({ success: true, message: "Student moved to old records" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 14. Get all old students
app.get('/api/old-students', verifyToken, async (req, res) => {
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

// 15. Promote student to next class
app.post('/api/students/:studentId/promote', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { newBoard, newClass, newMonthlyFees, newJoiningDate } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        // Move current session to old students
        const totalFeesPaid = student.feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const totalFeesDue = student.feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
        
        const oldStudent = new OldStudent({
            studentId: student.studentId,
            password: student.password,
            photo: student.photo,
            studentName: student.studentName,
            parentType: student.parentType,
            studentMobile: student.studentMobile,
            aadharNumber: student.aadharNumber,
            aadharDocument: student.aadharDocument,
            education: student.education,
            completedSession: student.currentSession,
            monthlyFees: student.monthlyFees,
            feesHistory: student.feesHistory,
            attendance: student.attendance,
            address: student.address,
            totalFeesPaid: totalFeesPaid,
            totalFeesDue: totalFeesDue,
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
        student.currentSession = {
            sessionName: newSessionName,
            startDate: newJoinDate,
            endDate: newSessionEndDate
        };
        student.joiningDate = newJoinDate;
        student.sessionCompleted = false;
        student.accountStatus = { isBlocked: false };
        student.feesHistory = generateFeesHistory({
            joiningDate: newJoinDate,
            monthlyFees: newMonthlyFees,
            sessionEndDate: newSessionEndDate
        });
        student.attendance = [];
        
        await student.save();
        
        res.json({ success: true, message: `Student promoted to ${newBoard} - ${newClass}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 16. Auto check session completion
app.post('/api/check-session-completion', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const today = new Date();
        const students = await Student.find({ sessionCompleted: false });
        
        let completedCount = 0;
        
        for (const student of students) {
            if (today > student.currentSession.endDate) {
                student.sessionCompleted = true;
                student.sessionCompletedAt = today;
                await student.save();
                completedCount++;
            }
        }
        
        res.json({ 
            success: true, 
            message: `Checked ${students.length} students. ${completedCount} session(s) completed.`,
            completedCount: completedCount
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TEACHER APIs (Basic)
// ============================================

app.post('/api/teacher-register', async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        await teacher.save();
        res.json({ success: true, message: "Registration pending approval" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teacher-login', authLimiter, async (req, res) => {
    const { teacherId, password } = req.body;
    
    try {
        const teacher = await Teacher.findOne({ teacherId });
        
        if (!teacher || teacher.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        if (teacher.status !== 'approved') {
            return res.status(403).json({ success: false, message: `Account is ${teacher.status}` });
        }
        
        const token = jwt.sign(
            { id: teacher._id, teacherId: teacher.teacherId, role: 'teacher' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );
        
        res.json({ success: true, token, data: teacher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const teachers = await Teacher.find();
        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await createDefaultAdmin();
        await initializeDefaultConfig();
        await initializeDefaultTestimonials();
        
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Server startup error:", err);
    }
}

startServer();
