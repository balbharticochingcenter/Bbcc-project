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
// ============================================
// ⭐⭐⭐ COMPLETE STUDENT SCHEMA ⭐⭐⭐
// ============================================
// LOCATION: Add this after Admin Schema, before Teacher Schema
// ============================================

const StudentSchema = new mongoose.Schema({
    // ========== BASIC INFORMATION ==========
    studentId: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    
    // Student Name
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    
    // ========== PARENT INFORMATION (Dynamic based on selection) ==========
    parentType: { 
        type: String, 
        enum: ['Father', 'Mother', 'Guardian'], 
        required: true 
    },
    
    // Father (only if parentType = 'Father')
    fatherName: {
        first: { type: String, default: '' },
        middle: { type: String, default: '' },
        last: { type: String, default: '' }
    },
    fatherMobile: { type: String, default: '' },
    
    // Mother (only if parentType = 'Mother')
    motherName: {
        first: { type: String, default: '' },
        middle: { type: String, default: '' },
        last: { type: String, default: '' }
    },
    motherMobile: { type: String, default: '' },
    
    // Guardian (only if parentType = 'Guardian')
    guardianName: {
        first: { type: String, default: '' },
        middle: { type: String, default: '' },
        last: { type: String, default: '' }
    },
    guardianMobile: { type: String, default: '' },
    guardianRelation: { type: String, default: '' }, // Uncle, Aunt, Brother, etc.
    
    // ========== CONTACT INFORMATION ==========
    studentMobile: { type: String, required: true },
    alternateMobile: { type: String, default: '' },
    email: { type: String, default: '' },
    
    // ========== DOCUMENTS ==========
    aadharNumber: { type: String, required: true, unique: true },
    aadharDocument: { type: String, required: true },
    
    // ========== EDUCATION INFORMATION ==========
    education: {
        board: { type: String, required: true },
        class: { type: String, required: true }
    },
    
    // ========== SESSION INFORMATION (Registration Date से March 7 तक) ==========
    currentSession: {
        sessionName: { type: String, required: true },  // "2026-2027" format
        startDate: { type: Date, required: true },      // Registration Date
        endDate: { type: Date, required: true }         // Next Year March 7
    },
    
    // ========== FEES STRUCTURE ==========
    monthlyFees: { type: Number, required: true, default: 0 },
    
    // Session-wise fees history (पूरा इतिहास)
    feesHistory: [{
        sessionName: { type: String, required: true },   // "2026-2027"
        month: { type: String, required: true },         // "November", "December", etc.
        year: { type: Number, required: true },
        monthIndex: { type: Number, required: true },    // 0-11
        amount: { type: Number, required: true },        // Pro-rated amount for this month
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        status: { 
            type: String, 
            enum: ['paid', 'partial', 'unpaid', 'exempted'], 
            default: 'unpaid' 
        },
        paymentDate: { type: Date },
        lateFee: { type: Number, default: 0 },
        remarks: { type: String, default: '' },
        updatedBy: { type: String }
    }],
    
    // ========== ATTENDANCE ==========
    attendance: [{
        date: { type: String, required: true },          // "2026-11-15"
        sessionName: { type: String, required: true },   // "2026-2027"
        status: { 
            type: String, 
            enum: ['present', 'absent', 'late', 'half-day', 'holiday'], 
            default: 'absent' 
        },
        checkInTime: { type: String, default: '' },
        checkOutTime: { type: String, default: '' },
        remarks: { type: String, default: '' },
        markedBy: { type: String },
        markedAt: { type: Date, default: Date.now }
    }],
    
    // ========== ACCOUNT STATUS (BLOCK/UNBLOCK) ==========
    accountStatus: {
        isBlocked: { type: Boolean, default: false },
        blockedFrom: { type: Date },
        blockedUntil: { type: Date },
        blockReason: { type: String, default: '' },
        blockedBy: { type: String },
        unblockedAt: { type: Date },
        unblockedBy: { type: String }
    },
    
    // ========== BLOCK HISTORY ==========
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
    
    // ========== SESSION COMPLETION ==========
    sessionCompleted: { type: Boolean, default: false },
    sessionCompletedAt: { type: Date },
    movedToOldOn: { type: Date },
    
    // ========== DATES ==========
    registrationDate: { type: Date, default: Date.now },
    joiningDate: { type: Date, required: true },
    leavingDate: { type: Date },
    
    // ========== ADDRESS ==========
    address: {
        current: { type: String, required: true },
        permanent: { type: String, required: true },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },
    
    // ========== ADDITIONAL INFO ==========
    previousSchool: { type: String, default: '' },
    remarks: { type: String, default: '' },
    createdBy: { type: String, default: 'admin' }
    
}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

// ============================================
// OLD STUDENTS SCHEMA (For Session Complete Students)
// ============================================
// LOCATION: Add this after Student Schema
// ============================================

const OldStudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, index: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    parentType: { type: String, required: true },
    fatherName: { first: String, middle: String, last: String },
    fatherMobile: String,
    motherName: { first: String, middle: String, last: String },
    motherMobile: String,
    guardianName: { first: String, middle: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    studentMobile: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    aadharDocument: { type: String, required: true },
    education: {
        board: { type: String, required: true },
        class: { type: String, required: true }
    },
    completedSession: {
        sessionName: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    monthlyFees: { type: Number, default: 0 },
    feesHistory: [{
        sessionName: String, month: String, year: Number,
        amount: Number, paidAmount: Number, dueAmount: Number,
        status: String, paymentDate: Date
    }],
    attendance: [{
        date: String, sessionName: String, status: String,
        checkInTime: String, checkOutTime: String, remarks: String
    }],
    address: { current: String, permanent: String, city: String, state: String, pincode: String },
    totalFeesPaid: { type: Number, default: 0 },
    totalFeesDue: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    sessionCompletedAt: { type: Date, default: Date.now },
    movedBy: { type: String, default: '' },
    reason: { type: String, default: 'session_completed' }
}, { timestamps: true });

const OldStudent = mongoose.model('OldStudent', OldStudentSchema);

// ============================================
// Teacher Schema
// ============================================
// LOCATION: Add after OldStudent Schema
// ============================================

const TeacherSchema = new mongoose.Schema({
    teacherId: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    teacherName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    fatherName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    mobile: { type: String, required: true },
    altMobile: { type: String, default: '' },
    dob: { type: Date, required: true },
    lastQualification: { type: String, required: true },
    qualificationDoc: { type: String, required: true },
    aadharNumber: { type: String, required: true, unique: true },
    aadharDoc: { type: String, required: true },
    subject: { type: String, default: '', trim: true },
    salary: { type: Number, default: 0, min: 0 },
    salaryHistory: [{
        month: { type: String, required: true },
        year: { type: Number, required: true },
        monthIndex: { type: Number, required: true },
        salary: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
        paymentDate: { type: Date },
        updatedBy: { type: String },
        remarks: { type: String, default: '' }
    }],
    attendance: [{
        date: { type: String, required: true },
        status: { type: String, enum: ['present', 'absent', 'late', 'half-day', 'leave'], default: 'present' },
        remarks: { type: String, default: '' },
        photo: { type: String, default: '' },
        markedBy: { type: String },
        markedAt: { type: Date, default: Date.now }
    }],
    joiningDate: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    address: {
        current: { type: String, default: '' },
        permanent: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },
    bankDetails: {
        accountHolder: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' }
    },
    emergencyContact: {
        name: { type: String, default: '' },
        relation: { type: String, default: '' },
        phone: { type: String, default: '' }
    },
    experience: { type: Number, default: 0 },
    previousSchool: { type: String, default: '' },
    resume: { type: String, default: '' },
    experienceCertificate: { type: String, default: '' },
    remarks: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    createdBy: { type: String, default: 'self' }
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', TeacherSchema);

console.log("✅ All Schemas loaded successfully");

// ============================================
// HELPER FUNCTIONS
// ============================================
// LOCATION: Add after all schemas, before initialization
// ============================================

/**
 * Calculate session end date (March 7 of next year)
 * @param {Date} startDate - Registration/Joining date
 * @returns {Date} - March 7 of next year
 */
function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    const year = endDate.getFullYear();
    // March 7 of next year
    endDate.setFullYear(year + 1);
    endDate.setMonth(2); // March (0-indexed: 0=Jan, 2=Mar)
    endDate.setDate(7);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
}

/**
 * Get session name from dates
 * @param {Date} startDate - Session start date
 * @param {Date} endDate - Session end date
 * @returns {string} - "2026-2027" format
 */
function getSessionName(startDate, endDate) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    return `${startYear}-${endYear}`;
}

/**
 * Calculate pro-rated fees for a month based on joining date
 * @param {number} monthlyFees - Full monthly fees
 * @param {Date} monthDate - First day of the month
 * @param {Date} joinDate - Student's joining date
 * @param {Date} sessionEndDate - Session end date
 * @returns {number} - Pro-rated fees for that month
 */
function calculateProRatedFees(monthlyFees, monthDate, joinDate, sessionEndDate) {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    // If this month is before joining date → No fees
    if (monthEnd < joinDate) return 0;
    
    // If this month is after session end → No fees
    if (monthStart > sessionEndDate) return 0;
    
    // Calculate effective date range for this month
    const effectiveStart = monthStart < joinDate ? joinDate : monthStart;
    const effectiveEnd = monthEnd > sessionEndDate ? sessionEndDate : monthEnd;
    
    // Calculate days
    const daysInMonth = monthEnd.getDate();
    const effectiveDays = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
    
    // Pro-rated fees
    const proRatedFees = (monthlyFees / daysInMonth) * effectiveDays;
    
    return Math.round(proRatedFees * 100) / 100; // Round to 2 decimals
}

/**
 * Generate fees history for a student based on joining date and session end date
 * @param {Object} studentData - Student data with joiningDate, monthlyFees, sessionEndDate
 * @returns {Array} - Fees history array
 */
function generateFeesHistory(studentData) {
    const feesHistory = [];
    const joinDate = new Date(studentData.joiningDate);
    const sessionEndDate = studentData.sessionEndDate || getSessionEndDate(joinDate);
    const monthlyFees = studentData.monthlyFees;
    const sessionName = getSessionName(joinDate, sessionEndDate);
    
    // Start from join month
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
        
        // Move to next month
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
                name: 'Super Admin',
                photo: '',
                aadharNumber: '',
                aadharDoc: ''
            });
            await newAdmin.save();
            console.log("✅ Default Admin Created: Username = admin, Password = admin123");
        } else {
            console.log("✅ Admin already exists");
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
                logoType: 'text',
                logoImage: '',
                title: 'Bal Bharti Coaching',
                subTitle: 'Excellence in Education',
                aboutText: 'Welcome to Bal Bharti Coaching Center. We provide quality education with modern technology and experienced faculty.',
                slides: [
                    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
                    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
                    'https://images.unsplash.com/photo-1503676260728-5177806628cb?w=800'
                ],
                whatsapp: '#', insta: '#', fb: '#',
                contactAddress: '123 Education Street, City',
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
            const defaultTestimonials = [
                { name: "Priya Sharma", role: "Parent", text: "Bal Bharti Coaching has transformed my child's academic performance.", rating: 5, image: "https://images.unsplash.com/photo-1494790108777-466d853dd23d?w=100", order: 1, isActive: true },
                { name: "Rajesh Kumar", role: "Teacher", text: "As a teacher, I love the dashboard. Marking attendance with photo has become so easy.", rating: 5, image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", order: 2, isActive: true },
                { name: "Amit Patel", role: "Student", text: "The attendance system is very efficient. I can check my history anytime.", rating: 5, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", order: 3, isActive: true }
            ];
            await Testimonial.insertMany(defaultTestimonials);
            console.log("✅ Default testimonials created");
        }
    } catch (err) {
        console.log("❌ Testimonials initialization error:", err.message);
    }
}

// ============================================
// ENHANCED TOKEN VERIFICATION MIDDLEWARE
// ============================================

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: "Token expired. Please login again." });
            }
            return res.status(403).json({ success: false, message: "Invalid token." });
        }
        req.user = decoded;
        next();
    });
};

// ============================================
// MIDDLEWARE: CHECK IF STUDENT IS BLOCKED
// ============================================
// LOCATION: Add after verifyToken
// ============================================

const checkStudentBlocked = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || req.body.studentId;
        const student = await Student.findOne({ studentId: studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (student.accountStatus.isBlocked) {
            const blockDate = student.accountStatus.blockedFrom;
            const blockReason = student.accountStatus.blockReason;
            
            return res.status(403).json({ 
                success: false, 
                message: `Account is BLOCKED since ${blockDate.toLocaleDateString()}. Reason: ${blockReason}. Please contact admin.`,
                isBlocked: true,
                blockedFrom: blockDate,
                reason: blockReason
            });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================
// TWILIO SETUP FOR CALL REMINDER
// ============================================

const twilio = require('twilio');

const twilioClient = new twilio(
    process.env.TWILIO_ACCOUNT_SID || 'your_account_sid_here',
    process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here'
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+13613211017';

// API Endpoint: Make a call reminder (Admin only)
app.post('/api/twilio-call', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        const { to, message, studentId, studentName, dueAmount, type } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({ success: false, message: 'Phone number and message required' });
        }
        
        console.log(`📞 Making call to: ${to} for student: ${studentName}`);
        
        const call = await twilioClient.calls.create({
            url: `http://twimlets.com/message?Message=${encodeURIComponent(message)}`,
            to: to,
            from: TWILIO_PHONE
        });
        
        console.log(`✅ Call initiated: ${call.sid}`);
        
        res.json({ 
            success: true, 
            message: 'Call initiated', 
            callSid: call.sid 
        });
        
    } catch (error) {
        console.error('Call error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// SMS Incoming Webhook
app.post('/api/sms-incoming', (req, res) => {
    const from = req.body.From;
    const body = req.body.Body;
    console.log(`📱 Incoming SMS from ${from}: ${body}`);
    
    const reply = `धन्यवाद! आपकी फीस जमा करने के लिए centre से संपर्क करें। - बाल भारती कोचिंग`;
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Message>${reply}</Message>
    </Response>`;
    
    res.set('Content-Type', 'text/xml');
    res.send(twiml);
});

// Send SMS API
app.post('/api/send-sms', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        const { to, message, studentId, studentName, dueAmount, type } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({ success: false, message: 'Phone number and message required' });
        }
        
        console.log(`📱 Sending SMS to: ${to} for student: ${studentName}`);
        
        let formattedNumber = to;
        if (!formattedNumber.startsWith('+')) {
            if (formattedNumber.startsWith('0')) {
                formattedNumber = '+91' + formattedNumber.substring(1);
            } else if (formattedNumber.length === 10) {
                formattedNumber = '+91' + formattedNumber;
            }
        }
        
        const sms = await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE,
            to: formattedNumber
        });
        
        console.log(`✅ SMS sent: ${sms.sid}`);
        
        res.json({ success: true, message: 'SMS sent', sid: sms.sid });
        
    } catch (error) {
        console.error('SMS error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/call-status', async (req, res) => {
    console.log('Call status update:', req.body);
    res.send('<Response></Response>');
});

app.post('/api/twilio-voice', (req, res) => {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const response = new VoiceResponse();
    
    const message = req.body.message || 'Namaste, yah Bal Bharti Coaching Center se baat ho rahi hai. Kripya apni fees jama kar den. Dhanyavaad.';
    
    response.say({ voice: 'Polly.Aditi' }, message);
    
    res.set('Content-Type', 'text/xml');
    res.send(response.toString());
});

// ============================================
// PUBLIC APIs (No token needed)
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "Server is running", timestamp: new Date().toISOString() });
});

app.get('/api/config', async (req, res) => {
    try {
        let config = await WebConfig.findOne().lean();
        if (!config) {
            config = {
                logoText: 'BBCC', logoType: 'text', logoImage: '',
                title: 'Bal Bharti Coaching', subTitle: 'Excellence in Education',
                aboutText: 'Welcome to Bal Bharti Coaching Center.',
                slides: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'],
                whatsapp: '#', insta: '#', fb: '#',
                contactAddress: '123 Education Street, City',
                contactPhone: '+91 98765 43210',
                contactEmail: 'info@balbharti.com'
            };
        }
        res.json(config);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalTeachers = await Teacher.countDocuments({ status: 'approved' });
        const pendingTeachers = await Teacher.countDocuments({ status: 'pending' });
        res.json({ success: true, data: { totalStudents, totalTeachers, pendingTeachers, totalCourses: 12, successRate: 96 } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/testimonials', async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// PUBLIC APIs - NO TOKEN NEEDED (Website Visitors)
// ============================================

app.get('/api/public/teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find({ status: 'approved' })
            .select('photo teacherName')
            .limit(8);
        
        const publicTeachers = teachers.map(t => ({
            photo: t.photo || 'https://via.placeholder.com/100',
            name: `${t.teacherName.first} ${t.teacherName.last}`
        }));
        
        res.json({ success: true, data: publicTeachers });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

app.get('/api/public/students', async (req, res) => {
    try {
        const students = await Student.find()
            .select('photo studentName')
            .limit(8);
        
        const publicStudents = students.map(s => ({
            photo: s.photo || 'https://via.placeholder.com/100',
            name: `${s.studentName.first} ${s.studentName.last}`
        }));
        
        res.json({ success: true, data: publicStudents });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

// ============================================
// ============================================
// ⭐⭐⭐ COMPLETE STUDENT APIs ⭐⭐⭐
// ============================================
// LOCATION: Add all student APIs here (after public APIs, before teacher APIs)
// ============================================

// ========== 1. STUDENT REGISTRATION API ==========
app.post('/api/student-register', async (req, res) => {
    console.log("📝 Student registration request received");
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
        
        // Validate parent mobile based on parentType
        if (data.parentType === 'Father' && !data.fatherMobile) {
            return res.status(400).json({ success: false, message: "Father's mobile is required" });
        }
        if (data.parentType === 'Mother' && !data.motherMobile) {
            return res.status(400).json({ success: false, message: "Mother's mobile is required" });
        }
        if (data.parentType === 'Guardian' && !data.guardianMobile) {
            return res.status(400).json({ success: false, message: "Guardian's mobile is required" });
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
        
        // Prepare parent data based on parentType
        let fatherName = { first: '', middle: '', last: '' };
        let fatherMobile = '';
        let motherName = { first: '', middle: '', last: '' };
        let motherMobile = '';
        let guardianName = { first: '', middle: '', last: '' };
        let guardianMobile = '';
        let guardianRelation = '';
        
        if (data.parentType === 'Father') {
            fatherName = {
                first: data.fatherName?.first || '',
                middle: data.fatherName?.middle || '',
                last: data.fatherName?.last || ''
            };
            fatherMobile = data.fatherMobile;
        } else if (data.parentType === 'Mother') {
            motherName = {
                first: data.motherName?.first || '',
                middle: data.motherName?.middle || '',
                last: data.motherName?.last || ''
            };
            motherMobile = data.motherMobile;
        } else if (data.parentType === 'Guardian') {
            guardianName = {
                first: data.guardianName?.first || '',
                middle: data.guardianName?.middle || '',
                last: data.guardianName?.last || ''
            };
            guardianMobile = data.guardianMobile;
            guardianRelation = data.guardianRelation || '';
        }
        
        // Create student object
        const student = new Student({
            studentId: data.studentId,
            password: data.password,
            photo: data.photo,
            studentName: {
                first: data.studentName?.first || '',
                middle: data.studentName?.middle || '',
                last: data.studentName?.last || ''
            },
            parentType: data.parentType,
            fatherName: fatherName,
            fatherMobile: fatherMobile,
            motherName: motherName,
            motherMobile: motherMobile,
            guardianName: guardianName,
            guardianMobile: guardianMobile,
            guardianRelation: guardianRelation,
            studentMobile: data.studentMobile,
            alternateMobile: data.alternateMobile || '',
            email: data.email || '',
            aadharNumber: data.aadharNumber,
            aadharDocument: data.aadharDocument,
            education: {
                board: data.education?.board || '',
                class: data.education?.class || ''
            },
            monthlyFees: data.monthlyFees,
            currentSession: {
                sessionName: sessionName,
                startDate: joiningDate,
                endDate: sessionEndDate
            },
            joiningDate: joiningDate,
            registrationDate: new Date(),
            address: {
                current: data.address?.current || '',
                permanent: data.address?.permanent || '',
                city: data.address?.city || '',
                state: data.address?.state || '',
                pincode: data.address?.pincode || ''
            },
            previousSchool: data.previousSchool || '',
            remarks: data.remarks || '',
            createdBy: 'admin'
        });
        
        // Generate fees history
        const feesHistory = generateFeesHistory({
            joiningDate: joiningDate,
            monthlyFees: data.monthlyFees,
            sessionEndDate: sessionEndDate
        });
        student.feesHistory = feesHistory;
        
        await student.save();
        
        console.log(`✅ New student registered: ${student.studentName.first} ${student.studentName.last} (ID: ${student.studentId})`);
        console.log(`   Session: ${sessionName} (${joiningDate.toLocaleDateString()} to ${sessionEndDate.toLocaleDateString()})`);
        console.log(`   Total months fees generated: ${feesHistory.length}`);
        
        res.json({ 
            success: true, 
            message: "Registration successful",
            studentId: student.studentId,
            password: student.password,
            session: {
                sessionName: sessionName,
                startDate: joiningDate,
                endDate: sessionEndDate,
                totalMonths: feesHistory.length,
                totalFees: feesHistory.reduce((sum, f) => sum + f.amount, 0)
            }
        });
        
    } catch (err) {
        console.error("❌ Registration Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate entry: Student with this Aadhar or ID already exists" });
        }
        res.status(500).json({ success: false, message: "Registration failed: " + err.message });
    }
});

// ========== 2. GET ALL STUDENTS ==========
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

// ========== 3. GET STUDENT BY ID ==========
app.get('/api/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        // Remove sensitive data
        const studentData = student.toObject();
        delete studentData.password;
        
        res.json({ success: true, data: studentData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 4. UPDATE STUDENT ==========
app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const updateData = req.body;
        
        // Update basic fields
        if (updateData.studentName) student.studentName = updateData.studentName;
        if (updateData.studentMobile) student.studentMobile = updateData.studentMobile;
        if (updateData.alternateMobile) student.alternateMobile = updateData.alternateMobile;
        if (updateData.email) student.email = updateData.email;
        if (updateData.photo) student.photo = updateData.photo;
        if (updateData.monthlyFees) student.monthlyFees = updateData.monthlyFees;
        if (updateData.education) student.education = updateData.education;
        if (updateData.address) student.address = updateData.address;
        if (updateData.previousSchool) student.previousSchool = updateData.previousSchool;
        if (updateData.remarks) student.remarks = updateData.remarks;
        
        // Update parent info based on parentType
        if (updateData.parentType) {
            student.parentType = updateData.parentType;
            
            if (updateData.parentType === 'Father') {
                if (updateData.fatherName) student.fatherName = updateData.fatherName;
                if (updateData.fatherMobile) student.fatherMobile = updateData.fatherMobile;
            } else if (updateData.parentType === 'Mother') {
                if (updateData.motherName) student.motherName = updateData.motherName;
                if (updateData.motherMobile) student.motherMobile = updateData.motherMobile;
            } else if (updateData.parentType === 'Guardian') {
                if (updateData.guardianName) student.guardianName = updateData.guardianName;
                if (updateData.guardianMobile) student.guardianMobile = updateData.guardianMobile;
                if (updateData.guardianRelation) student.guardianRelation = updateData.guardianRelation;
            }
        }
        
        await student.save();
        
        res.json({ success: true, message: "Student updated", data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 5. DELETE STUDENT ==========
app.delete('/api/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const student = await Student.findOneAndDelete({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, message: "Student deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 6. STUDENT LOGIN API ==========
app.post('/api/student-login', authLimiter, async (req, res) => {
    const { studentId, password } = req.body;
    
    try {
        const student = await Student.findOne({ studentId: studentId });
        
        if (!student) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        // Check if account is blocked
        if (student.accountStatus.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: `Account is BLOCKED. Reason: ${student.accountStatus.blockReason}. Contact admin.`,
                isBlocked: true
            });
        }
        
        // Verify password
        if (student.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        // Check if session is completed (March 7 passed)
        const today = new Date();
        const sessionEnd = student.currentSession.endDate;
        
        if (today > sessionEnd && !student.sessionCompleted) {
            student.sessionCompleted = true;
            student.sessionCompletedAt = today;
            await student.save();
        }
        
        const token = jwt.sign(
            { 
                id: student._id, 
                studentId: student.studentId, 
                role: 'student',
                name: `${student.studentName.first} ${student.studentName.last}`
            }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '15d' }
        );
        
        const studentData = student.toObject();
        delete studentData.password;
        delete studentData.aadharNumber;
        delete studentData.aadharDocument;
        
        res.json({ 
            success: true, 
            message: "Login successful", 
            token,
            data: studentData
        });
        
    } catch (err) {
        console.error('Student login error:', err);
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

// ========== 7. GET STUDENT SELF DATA ==========
app.get('/api/students/self', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const student = await Student.findOne({ studentId: req.user.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const studentData = student.toObject();
        delete studentData.password;
        delete studentData.aadharNumber;
        delete studentData.aadharDocument;
        
        res.json({ success: true, data: studentData });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 8. UPDATE FEES ==========
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
            const newPaidAmount = feeEntry.paidAmount + paidAmount;
            feeEntry.paidAmount = newPaidAmount;
            feeEntry.dueAmount = feeEntry.amount - newPaidAmount;
            feeEntry.status = newPaidAmount >= feeEntry.amount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
            feeEntry.paymentDate = new Date();
            feeEntry.updatedBy = req.user.adminID;
            
            await student.save();
            
            // Check for auto-block (2 months due)
            const unpaidMonths = student.feesHistory.filter(f => 
                f.status === 'unpaid' && f.sessionName === student.currentSession.sessionName
            );
            
            if (unpaidMonths.length >= 2 && !student.accountStatus.isBlocked) {
                // Auto block student
                student.accountStatus = {
                    isBlocked: true,
                    blockedFrom: new Date(),
                    blockReason: 'auto_non_payment',
                    blockedBy: 'system'
                };
                student.blockHistory.push({
                    blockedFrom: new Date(),
                    reason: 'auto_non_payment',
                    blockedBy: 'system',
                    attendanceFrozen: true,
                    feesFrozen: true
                });
                
                // Freeze future fees
                const currentMonthIndex = new Date().getMonth();
                student.feesHistory.forEach(fee => {
                    if (fee.monthIndex >= currentMonthIndex && fee.status === 'unpaid') {
                        fee.status = 'exempted';
                        fee.remarks = `Auto-blocked due to non-payment on ${new Date().toLocaleDateString()}`;
                    }
                });
                
                await student.save();
                console.log(`🔴 Auto-blocked student: ${student.studentId} due to 2+ months fees due`);
            }
        }
        
        res.json({ success: true, message: "Fees updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 9. MARK ATTENDANCE (With Block Check) ==========
app.post('/api/students/:studentId/attendance', verifyToken, checkStudentBlocked, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const { date, status, checkInTime, checkOutTime, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const attendanceDate = new Date(date);
        const sessionName = student.currentSession.sessionName;
        
        // Check if date is within session
        if (attendanceDate < student.currentSession.startDate || attendanceDate > student.currentSession.endDate) {
            return res.status(400).json({ 
                success: false, 
                message: `Attendance can only be marked within session (${student.currentSession.startDate.toLocaleDateString()} to ${student.currentSession.endDate.toLocaleDateString()})` 
            });
        }
        
        if (!student.attendance) student.attendance = [];
        
        const existingIndex = student.attendance.findIndex(a => a.date === date);
        const record = { 
            date, 
            sessionName,
            status, 
            checkInTime: checkInTime || '',
            checkOutTime: checkOutTime || '',
            remarks: remarks || '', 
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

// ========== 10. GET STUDENT ATTENDANCE ==========
app.get('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        if (req.user.role === 'student' && req.user.studentId !== req.params.id) {
            return res.status(403).json({ success: false, message: "You can only view your own attendance" });
        }
        
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        res.json({ success: true, data: student.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 11. BLOCK STUDENT API ==========
app.post('/api/students/:studentId/block', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { reason, blockUntil } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const blockFromDate = new Date();
        
        student.accountStatus = {
            isBlocked: true,
            blockedFrom: blockFromDate,
            blockedUntil: blockUntil || null,
            blockReason: reason,
            blockedBy: req.user.adminID
        };
        
        student.blockHistory.push({
            blockedFrom: blockFromDate,
            blockedUntil: blockUntil || null,
            reason: reason,
            blockedBy: req.user.adminID,
            attendanceFrozen: true,
            feesFrozen: true
        });
        
        // Freeze future fees
        const currentMonthIndex = new Date().getMonth();
        student.feesHistory.forEach(fee => {
            if (fee.monthIndex >= currentMonthIndex && fee.status === 'unpaid') {
                fee.status = 'exempted';
                fee.remarks = `Blocked on ${blockFromDate.toLocaleDateString()}. Reason: ${reason}`;
            }
        });
        
        await student.save();
        
        console.log(`🔴 Student ${student.studentId} (${student.studentName.first}) BLOCKED`);
        console.log(`   Reason: ${reason}`);
        
        res.json({ 
            success: true, 
            message: `Student ${student.studentName.first} has been blocked`,
            data: { blockedFrom: blockFromDate, reason: reason }
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 12. UNBLOCK STUDENT API ==========
app.post('/api/students/:studentId/unblock', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const unblockDate = new Date();
        
        const lastBlock = student.blockHistory[student.blockHistory.length - 1];
        if (lastBlock && !lastBlock.unblockedAt) {
            lastBlock.unblockedAt = unblockDate;
            lastBlock.unblockedBy = req.user.adminID;
        }
        
        student.accountStatus = {
            isBlocked: false,
            blockedFrom: null,
            blockedUntil: null,
            blockReason: '',
            blockedBy: '',
            unblockedAt: unblockDate,
            unblockedBy: req.user.adminID
        };
        
        // Resume fees from current month
        const currentMonthIndex = new Date().getMonth();
        student.feesHistory.forEach(fee => {
            if (fee.monthIndex >= currentMonthIndex && fee.status === 'exempted') {
                fee.status = 'unpaid';
                fee.dueAmount = fee.amount;
                fee.remarks = `Unblocked on ${unblockDate.toLocaleDateString()}. Fees resumed.`;
            }
        });
        
        await student.save();
        
        console.log(`🟢 Student ${student.studentId} (${student.studentName.first}) UNBLOCKED`);
        
        res.json({ 
            success: true, 
            message: `Student ${student.studentName.first} has been unblocked`
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 13. MOVE TO OLD STUDENTS (Session Complete / Manual) ==========
app.post('/api/move-to-old-student', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { studentId, reason } = req.body;
        
        const student = await Student.findOne({ studentId: studentId });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        // Calculate totals
        const totalFeesPaid = student.feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const totalFeesDue = student.feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
        
        // Calculate attendance percentage
        const totalDays = student.attendance.length;
        const presentDays = student.attendance.filter(a => a.status === 'present').length;
        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        
        const oldStudent = new OldStudent({
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
            attendancePercentage: attendancePercentage,
            sessionCompletedAt: new Date(),
            movedBy: req.user.adminID,
            reason: reason || 'session_completed'
        });
        
        await oldStudent.save();
        await Student.deleteOne({ studentId: studentId });
        
        console.log(`📦 Student ${studentId} moved to old records. Reason: ${reason || 'session_completed'}`);
        
        res.json({ 
            success: true, 
            message: "Student moved to old records",
            data: {
                oldStudentId: oldStudent._id,
                totalFeesPaid: totalFeesPaid,
                totalFeesDue: totalFeesDue,
                attendancePercentage: attendancePercentage
            }
        });
        
    } catch (err) {
        console.error('Move to old error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 14. GET ALL OLD STUDENTS ==========
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

// ========== 15. PROMOTE STUDENT TO NEXT CLASS ==========
app.post('/api/students/:studentId/promote', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { newBoard, newClass, newMonthlyFees, newJoiningDate } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        // First move current session to old students
        const totalFeesPaid = student.feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const totalFeesDue = student.feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
        const totalDays = student.attendance.length;
        const presentDays = student.attendance.filter(a => a.status === 'present').length;
        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        
        const oldStudent = new OldStudent({
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
            attendancePercentage: attendancePercentage,
            sessionCompletedAt: new Date(),
            movedBy: req.user.adminID,
            reason: 'promoted'
        });
        
        await oldStudent.save();
        
        // Update student for new session
        const newJoinDate = newJoiningDate ? new Date(newJoiningDate) : new Date();
        const newSessionEndDate = getSessionEndDate(newJoinDate);
        const newSessionName = getSessionName(newJoinDate, newSessionEndDate);
        
        student.education = {
            board: newBoard,
            class: newClass
        };
        
        student.monthlyFees = newMonthlyFees;
        student.currentSession = {
            sessionName: newSessionName,
            startDate: newJoinDate,
            endDate: newSessionEndDate
        };
        
        student.joiningDate = newJoinDate;
        student.sessionCompleted = false;
        student.sessionCompletedAt = null;
        
        // Reset account status
        student.accountStatus = {
            isBlocked: false,
            blockedFrom: null,
            blockedUntil: null,
            blockReason: '',
            blockedBy: ''
        };
        
        // Generate new fees history
        const newFeesHistory = generateFeesHistory({
            joiningDate: newJoinDate,
            monthlyFees: newMonthlyFees,
            sessionEndDate: newSessionEndDate
        });
        student.feesHistory = newFeesHistory;
        
        // Reset attendance for new session
        student.attendance = [];
        
        await student.save();
        
        console.log(`📈 Student ${student.studentId} promoted to ${newBoard} - ${newClass} for session ${newSessionName}`);
        
        res.json({ 
            success: true, 
            message: `Student promoted to ${newBoard} - ${newClass}`,
            data: {
                newSession: newSessionName,
                startDate: newJoinDate,
                endDate: newSessionEndDate,
                monthlyFees: newMonthlyFees,
                totalSessionFees: newFeesHistory.reduce((sum, f) => sum + f.amount, 0)
            }
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 16. AUTO CHECK SESSION COMPLETION (Run daily or on login) ==========
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
                
                console.log(`📅 Session completed for student: ${student.studentId} (${student.studentName.first})`);
            }
        }
        
        res.json({ 
            success: true, 
            message: `Checked ${students.length} students. ${completedCount} sessions completed.`,
            completedCount: completedCount
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 17. GET STUDENT TIMELINE / GRAPH DATA ==========
app.get('/api/students/:studentId/timeline', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (req.user.role === 'student' && req.user.studentId !== req.params.studentId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const timelineData = {
            attendance: [],
            fees: [],
            blocks: []
        };
        
        // Get last 12 months data
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const monthIndex = date.getMonth();
            
            // Attendance for this month
            const monthAttendance = student.attendance.filter(a => {
                const aDate = new Date(a.date);
                return aDate.getMonth() === monthIndex && aDate.getFullYear() === year;
            });
            
            const presentCount = monthAttendance.filter(a => a.status === 'present').length;
            const totalDays = monthAttendance.length;
            const attendancePercent = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;
            
            // Fees for this month
            const feeRecord = student.feesHistory.find(f => 
                f.monthIndex === monthIndex && f.year === year && f.sessionName === student.currentSession.sessionName
            );
            
            // Check if blocked during this month
            const wasBlocked = student.blockHistory.some(block => {
                const blockStart = new Date(block.blockedFrom);
                const blockEnd = block.blockedUntil || new Date();
                return date >= blockStart && date <= blockEnd;
            });
            
            timelineData.attendance.push({
                month: `${monthName} ${year}`,
                percentage: Math.round(attendancePercent),
                wasBlocked: wasBlocked
            });
            
            timelineData.fees.push({
                month: `${monthName} ${year}`,
                status: feeRecord?.status || 'unpaid',
                amount: feeRecord?.amount || 0,
                paid: feeRecord?.paidAmount || 0,
                due: feeRecord?.dueAmount || 0
            });
        }
        
        // Block history
        timelineData.blocks = student.blockHistory.map(block => ({
            from: block.blockedFrom,
            until: block.blockedUntil,
            reason: block.reason,
            unblockedAt: block.unblockedAt
        }));
        
        res.json({ success: true, data: timelineData });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 18. GET STUDENT DASHBOARD SUMMARY ==========
app.get('/api/students/:studentId/summary', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (req.user.role === 'student' && req.user.studentId !== req.params.studentId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const totalFees = student.feesHistory.reduce((sum, f) => sum + f.amount, 0);
        const paidFees = student.feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const dueFees = totalFees - paidFees;
        
        const totalDays = student.attendance.length;
        const presentDays = student.attendance.filter(a => a.status === 'present').length;
        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        
        const sessionDaysRemaining = Math.ceil((student.currentSession.endDate - new Date()) / (1000 * 60 * 60 * 24));
        
        res.json({
            success: true,
            data: {
                studentName: `${student.studentName.first} ${student.studentName.last}`,
                studentId: student.studentId,
                class: `${student.education.board} - ${student.education.class}`,
                currentSession: student.currentSession.sessionName,
                sessionStart: student.currentSession.startDate,
                sessionEnd: student.currentSession.endDate,
                sessionDaysRemaining: sessionDaysRemaining > 0 ? sessionDaysRemaining : 0,
                sessionCompleted: student.sessionCompleted,
                isBlocked: student.accountStatus.isBlocked,
                blockReason: student.accountStatus.blockReason,
                feesSummary: {
                    total: totalFees,
                    paid: paidFees,
                    due: dueFees,
                    percentage: totalFees > 0 ? (paidFees / totalFees) * 100 : 0
                },
                attendanceSummary: {
                    total: totalDays,
                    present: presentDays,
                    percentage: Math.round(attendancePercentage)
                }
            }
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TEACHER APIs
// ============================================
// LOCATION: Add teacher APIs here (same as before)
// ============================================

app.post('/api/teacher-register', async (req, res) => {
    try {
        const data = req.body;
        
        const requiredFields = ['teacherId', 'password', 'photo', 'aadharNumber', 'aadharDoc', 'mobile', 'dob', 'lastQualification', 'qualificationDoc'];
        for (const field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({ success: false, message: `${field} is required` });
            }
        }
        
        if (await Teacher.findOne({ aadharNumber: data.aadharNumber })) {
            return res.status(400).json({ success: false, message: "Aadhar already registered" });
        }
        if (await Teacher.findOne({ teacherId: data.teacherId })) {
            return res.status(400).json({ success: false, message: "Teacher ID exists" });
        }
        
        const newTeacher = new Teacher({ ...data, status: 'pending', attendance: [] });
        await newTeacher.save();
        res.json({ success: true, message: "Registration Successful! Pending approval." });
    } catch (err) {
        console.error('Teacher registration error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const teachers = await Teacher.find().sort({ createdAt: -1 });
        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher' && req.user.teacherId !== req.params.id) {
            return res.status(403).json({ success: false, message: "You can only view your own profile" });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const teacher = await Teacher.findOne({ teacherId: req.params.id }).select('-password');
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, data: teacher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher' && req.user.teacherId !== req.params.id) {
            return res.status(403).json({ success: false, message: "You can only update your own profile" });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        
        const updateData = req.body;
        if (req.user.role === 'teacher') {
            delete updateData.status;
            delete updateData.salary;
            delete updateData.salaryHistory;
        }
        
        Object.assign(teacher, updateData);
        await teacher.save();
        
        const teacherData = teacher.toObject();
        delete teacherData.password;
        
        res.json({ success: true, message: "Profile updated", data: teacherData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/teachers/:id/status', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const { status, subject, salary, joiningDate } = req.body;
        const updateData = { status };
        
        if (status === 'approved') {
            updateData.joiningDate = joiningDate ? new Date(joiningDate) : new Date();
            if (subject) updateData.subject = subject;
            if (salary) updateData.salary = parseInt(salary);
        } else if (status === 'rejected' && req.body.rejectionReason) {
            updateData.rejectionReason = req.body.rejectionReason;
        }
        
        const teacher = await Teacher.findOneAndUpdate({ teacherId: req.params.id }, updateData, { new: true });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, message: `Teacher ${status} successfully` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/salary', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
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
            existing.updatedBy = req.user.adminID;
            await teacher.save();
        }
        res.json({ success: true, message: "Salary updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const teacher = await Teacher.findOneAndDelete({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, message: "Teacher deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers/stats/summary', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const total = await Teacher.countDocuments();
        const pending = await Teacher.countDocuments({ status: 'pending' });
        const approved = await Teacher.countDocuments({ status: 'approved' });
        const rejected = await Teacher.countDocuments({ status: 'rejected' });
        res.json({ success: true, data: { total, pending, approved, rejected } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher' && req.user.teacherId !== req.params.id) {
            return res.status(403).json({ success: false, message: "You can only view your own attendance" });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, data: teacher.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher' && req.user.teacherId !== req.params.id) {
            return res.status(403).json({ success: false, message: "You can only mark your own attendance" });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const { date, status, remarks, photo } = req.body;
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        if (!teacher.attendance) teacher.attendance = [];
        
        const existingIndex = teacher.attendance.findIndex(a => a.date === date);
        const record = { 
            date, 
            status, 
            remarks: remarks || '', 
            photo: photo || '', 
            markedBy: req.user.role === 'teacher' ? 'self' : req.user.adminID, 
            markedAt: new Date() 
        };
        
        if (existingIndex >= 0) teacher.attendance[existingIndex] = record;
        else teacher.attendance.push(record);
        
        await teacher.save();
        res.json({ success: true, message: "Attendance marked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const { date } = req.body;
        if (!date) return res.status(400).json({ success: false, message: "Date is required" });
        
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        
        if (!teacher.attendance) teacher.attendance = [];
        const initialLength = teacher.attendance.length;
        teacher.attendance = teacher.attendance.filter(a => a.date !== date);
        
        if (teacher.attendance.length === initialLength) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }
        
        await teacher.save();
        res.json({ success: true, message: "Attendance record deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// SALARY DUE REMINDER SCHEMA & APIs
// ============================================

const SalaryDueReminderSchema = new mongoose.Schema({
    teacherId: { type: String, required: true, index: true },
    teacherName: { type: String, required: true },
    mobile: { type: String, required: true },
    totalDue: { type: Number, required: true },
    dueCount: { type: Number, default: 0 },
    dueMonths: [{
        month: String,
        year: Number,
        dueAmount: Number
    }],
    message: String,
    reminderDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'sent', 'resolved'], default: 'pending' },
    resolvedDate: Date,
    resolvedBy: String,
    notes: String
});

const SalaryDueReminder = mongoose.model('SalaryDueReminder', SalaryDueReminderSchema);

app.post('/api/salary-due-reminder', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const { teacherId, teacherName, mobile, totalDue, dueMonths, dueCount, message } = req.body;
        
        if (req.user.role === 'teacher' && req.user.teacherId !== teacherId) {
            return res.status(403).json({ success: false, message: "You can only send reminder for yourself" });
        }
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const existingReminder = await SalaryDueReminder.findOne({
            teacherId: teacherId,
            reminderDate: { $gte: todayStart },
            status: 'pending'
        });
        
        if (existingReminder) {
            return res.json({ 
                success: false, 
                message: "Reminder already sent today. Admin will contact you soon." 
            });
        }
        
        const reminder = new SalaryDueReminder({
            teacherId, teacherName, mobile, totalDue, dueCount, dueMonths, message, status: 'pending'
        });
        
        await reminder.save();
        
        console.log(`📢 Salary Due Reminder #${reminder._id}`);
        console.log(`👨‍🏫 Teacher: ${teacherName} (${teacherId})`);
        console.log(`💰 Total Due: ₹${totalDue}`);
        
        res.json({ 
            success: true, 
            message: "Reminder sent successfully! Admin has been notified.",
            reminderId: reminder._id
        });
        
    } catch (err) {
        console.error('Salary reminder error:', err);
        res.status(500).json({ success: false, message: "Failed to send reminder" });
    }
});

app.get('/api/admin/due-reminders', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const reminders = await SalaryDueReminder.find({ status: 'pending' }).sort({ reminderDate: -1 });
        res.json({ success: true, data: reminders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/due-reminders/:id/resolve', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const { notes } = req.body;
        const reminder = await SalaryDueReminder.findByIdAndUpdate(
            req.params.id,
            { status: 'resolved', resolvedDate: new Date(), resolvedBy: req.user.adminID, notes },
            { new: true }
        );
        if (!reminder) return res.status(404).json({ success: false, message: "Reminder not found" });
        res.json({ success: true, message: "Reminder marked as resolved", data: reminder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/teachers-with-due', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const teachers = await Teacher.find({
            'salaryHistory.status': { $in: ['unpaid', 'partial'] }
        }).select('teacherId teacherName mobile salary salaryHistory');
        
        const dueTeachers = teachers.map(teacher => {
            const dueMonths = teacher.salaryHistory.filter(r => r.status !== 'paid');
            const totalDue = dueMonths.reduce((sum, r) => sum + (r.dueAmount || 0), 0);
            return {
                teacherId: teacher.teacherId,
                teacherName: `${teacher.teacherName.first} ${teacher.teacherName.last}`,
                mobile: teacher.mobile,
                monthlySalary: teacher.salary,
                totalDue: totalDue,
                dueCount: dueMonths.length,
                dueMonths: dueMonths.map(m => ({ month: m.month, year: m.year, dueAmount: m.dueAmount }))
            };
        }).filter(t => t.totalDue > 0);
        
        res.json({ success: true, data: dueTeachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ENHANCED ENQUIRY FORM SCHEMA & APIs
// ============================================

const EnquirySchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    alternateMobile: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    parentName: { type: String, default: '', trim: true },
    parentMobile: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    board: { type: String, default: '', trim: true },
    class: { type: String, default: '', trim: true },
    applicantType: { 
        type: String, 
        enum: ['self', 'father', 'mother', 'friend', 'relative', 'other'], 
        default: 'self' 
    },
    applicantRelation: { type: String, default: '', trim: true },
    course: { type: String, default: '', trim: true },
    preferredTime: { type: String, default: '', trim: true },
    message: { type: String, default: '', trim: true },
    source: { type: String, default: 'website', trim: true },
    status: { 
        type: String, 
        enum: ['pending', 'contacted', 'followup', 'admitted', 'not_interested', 'spam'], 
        default: 'pending' 
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'], 
        default: 'medium' 
    },
    notes: { type: String, default: '' },
    followupDate: { type: Date },
    respondedBy: { type: String, default: '' },
    respondedAt: { type: Date },
    assignedTo: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    callReminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date }
}, { timestamps: true });

EnquirySchema.index({ fullName: 'text', mobile: 'text', parentName: 'text' });
EnquirySchema.index({ status: 1, priority: 1 });
EnquirySchema.index({ createdAt: -1 });

const Enquiry = mongoose.model('Enquiry', EnquirySchema);

// ============================================
// UNIVERSAL DEMO VIDEO SCHEMA (All Formats)
// ============================================

const DemoVideoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    videoSource: { 
        type: String, 
        enum: [
            'youtube', 'vimeo', 'dailymotion', 'facebook',
            'instagram', 'drive', 'dropbox', 'mp4',
            'm3u8', 'embed', 'upload'
        ], 
        default: 'youtube' 
    },
    videoUrl: { type: String, required: true, trim: true },
    videoFile: { type: String, default: '' },
    videoFileType: { type: String, default: '' },
    videoSize: { type: Number, default: 0 },
    embedCode: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    thumbnailType: { type: String, enum: ['auto', 'custom', 'upload'], default: 'auto' },
    duration: { type: String, default: '' },
    quality: { type: [String], default: ['720p'] },
    language: { type: String, default: 'en' },
    category: { type: String, default: 'demo', trim: true },
    subCategory: { type: String, default: '', trim: true },
    tags: [{ type: String }],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    uploadedBy: { type: String, default: '' },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date },
    publishDate: { type: Date, default: Date.now },
    expiryDate: { type: Date }
}, { timestamps: true });

DemoVideoSchema.index({ title: 'text', tags: 'text' });
DemoVideoSchema.index({ category: 1, isActive: 1, featured: -1 });
DemoVideoSchema.index({ publishDate: -1 });

const DemoVideo = mongoose.model('DemoVideo', DemoVideoSchema);

// ============================================
// ENQUIRY APIs (Public & Admin)
// ============================================

app.post('/api/enquiry', async (req, res) => {
    try {
        const {
            fullName, mobile, alternateMobile, email,
            parentName, parentMobile,
            location, city, pincode, board, class: studentClass,
            applicantType, applicantRelation,
            course, preferredTime, message, source
        } = req.body;
        
        if (!fullName || !mobile) {
            return res.status(400).json({ 
                success: false, 
                message: "Full Name and Mobile Number are required!" 
            });
        }
        
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ 
                success: false, 
                message: "Mobile number must be 10 digits!" 
            });
        }
        
        if (alternateMobile && !mobileRegex.test(alternateMobile)) {
            return res.status(400).json({ 
                success: false, 
                message: "Alternate mobile number must be 10 digits!" 
            });
        }
        
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid email format!" 
                });
            }
        }
        
        const ipAddress = req.ip || req.connection.remoteAddress;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentEnquiry = await Enquiry.findOne({
            $or: [
                { mobile: mobile },
                { ipAddress: ipAddress }
            ],
            createdAt: { $gte: fiveMinutesAgo }
        });
        
        if (recentEnquiry) {
            return res.status(429).json({ 
                success: false, 
                message: "Please wait 5 minutes before submitting another enquiry." 
            });
        }
        
        const enquiry = new Enquiry({
            fullName, mobile, alternateMobile: alternateMobile || '', email: email || '',
            parentName: parentName || '', parentMobile: parentMobile || '',
            location: location || '', city: city || '', pincode: pincode || '',
            board: board || '', class: studentClass || '',
            applicantType: applicantType || 'self', applicantRelation: applicantRelation || '',
            course: course || '', preferredTime: preferredTime || '', message: message || '',
            source: source || 'website', status: 'pending', priority: 'medium',
            ipAddress: ipAddress, userAgent: req.headers['user-agent'] || ''
        });
        
        await enquiry.save();
        
        console.log(`📧 New Enquiry #${enquiry._id}: ${fullName} | ${mobile}`);
        
        res.json({ 
            success: true, 
            message: "Enquiry submitted successfully! We'll contact you soon.",
            enquiryId: enquiry._id
        });
        
    } catch (err) {
        console.error('Enquiry submission error:', err);
        res.status(500).json({ 
            success: false, 
            message: "Failed to submit enquiry. Please try again." 
        });
    }
});

app.get('/api/admin/enquiries', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { status, priority, board, class: studentClass, fromDate, toDate, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (board) query.board = board;
        if (studentClass) query.class = studentClass;
        
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate + 'T23:59:59');
        }
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { parentName: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        const enquiries = await Enquiry.find(query)
            .sort({ priority: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await Enquiry.countDocuments(query);
        
        const stats = {
            total: await Enquiry.countDocuments(),
            pending: await Enquiry.countDocuments({ status: 'pending' }),
            contacted: await Enquiry.countDocuments({ status: 'contacted' }),
            followup: await Enquiry.countDocuments({ status: 'followup' }),
            admitted: await Enquiry.countDocuments({ status: 'admitted' }),
            notInterested: await Enquiry.countDocuments({ status: 'not_interested' }),
            highPriority: await Enquiry.countDocuments({ priority: 'high' }),
            urgent: await Enquiry.countDocuments({ priority: 'urgent' })
        };
        
        res.json({ 
            success: true, 
            data: enquiries, stats,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/enquiries/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
        res.json({ success: true, data: enquiry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/enquiries/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { status, priority, notes, followupDate, assignedTo, callReminderSent } = req.body;
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
        
        if (status) enquiry.status = status;
        if (priority) enquiry.priority = priority;
        if (notes) enquiry.notes = notes;
        if (followupDate) enquiry.followupDate = new Date(followupDate);
        if (assignedTo !== undefined) enquiry.assignedTo = assignedTo;
        if (callReminderSent !== undefined) {
            enquiry.callReminderSent = callReminderSent;
            if (callReminderSent) enquiry.reminderSentAt = new Date();
        }
        
        if (status && status !== 'pending') {
            enquiry.respondedBy = req.user.adminID;
            enquiry.respondedAt = new Date();
        }
        
        await enquiry.save();
        res.json({ success: true, message: "Enquiry updated successfully", data: enquiry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/enquiries/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
        if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
        res.json({ success: true, message: "Enquiry deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// VIDEO APIs
// ============================================

function getEmbedUrl(url, source) {
    if (!url) return '';
    switch(source) {
        case 'youtube':
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
            if (match) return `https://www.youtube.com/embed/${match[1]}`;
            return url;
        case 'vimeo':
            const vMatch = url.match(/vimeo\.com\/(\d+)/);
            if (vMatch) return `https://player.vimeo.com/video/${vMatch[1]}`;
            return url;
        default: return url;
    }
}

function getThumbnailUrl(video) {
    if (video.thumbnail) return video.thumbnail;
    if (video.videoSource === 'youtube') {
        const match = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        if (match) return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    return 'https://via.placeholder.com/640x360?text=Video+Thumbnail';
}

app.get('/api/videos', async (req, res) => {
    try {
        const { category, featured, limit = 12, page = 1 } = req.query;
        const query = { isActive: true, publishDate: { $lte: new Date() } };
        if (category && category !== 'all') query.category = category;
        if (featured === 'true') query.featured = true;
        
        const videos = await DemoVideo.find(query)
            .sort({ featured: -1, order: 1, publishDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await DemoVideo.countDocuments(query);
        const formattedVideos = videos.map(video => ({
            ...video.toObject(),
            embedUrl: getEmbedUrl(video.videoUrl, video.videoSource),
            thumbnailUrl: getThumbnailUrl(video)
        }));
        
        res.json({ success: true, data: formattedVideos, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/videos/:id', async (req, res) => {
    try {
        const video = await DemoVideo.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: "Video not found" });
        if (!video.isActive) return res.status(403).json({ success: false, message: "Video not available" });
        video.views += 1;
        await video.save();
        res.json({ success: true, data: { ...video.toObject(), embedUrl: getEmbedUrl(video.videoUrl, video.videoSource), thumbnailUrl: getThumbnailUrl(video) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/featured-video', async (req, res) => {
    try {
        const featuredVideo = await DemoVideo.findOne({ featured: true, isActive: true, publishDate: { $lte: new Date() } }).sort({ order: 1 });
        if (featuredVideo) {
            res.json({ success: true, data: { ...featuredVideo.toObject(), embedUrl: getEmbedUrl(featuredVideo.videoUrl, featuredVideo.videoSource), thumbnailUrl: getThumbnailUrl(featuredVideo) } });
        } else {
            res.json({ success: true, data: null });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/videos', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const videos = await DemoVideo.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: videos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/videos', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const { title, description, videoSource, videoUrl, thumbnail, category, order, featured, isActive } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Title is required" });
        if (!videoUrl) return res.status(400).json({ success: false, message: "Video URL is required" });
        
        const video = new DemoVideo({
            title, description: description || '', videoSource: videoSource || 'youtube', videoUrl,
            thumbnail: thumbnail || '', category: category || 'demo', order: order || 0,
            featured: featured || false, isActive: isActive !== undefined ? isActive : true,
            uploadedBy: req.user.adminID, approvedBy: req.user.adminID, approvedAt: new Date()
        });
        await video.save();
        res.json({ success: true, message: "Video added successfully", data: video });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/videos/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const video = await DemoVideo.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: "Video not found" });
        Object.assign(video, req.body);
        await video.save();
        res.json({ success: true, message: "Video updated successfully", data: video });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/videos/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const video = await DemoVideo.findByIdAndDelete(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: "Video not found" });
        res.json({ success: true, message: "Video deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ENQUIRY CALL REMINDER
// ============================================

app.post('/api/enquiry-call/:enquiryId', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const enquiry = await Enquiry.findById(req.params.enquiryId);
        if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
        
        const { message } = req.body;
        const callMessage = message || `नमस्ते ${enquiry.fullName} जी, यह बाल भारती कोचिंग सेंटर से बात हो रही है। आपकी enquiry के संबंध में हम आपसे संपर्क कर रहे हैं। कृपया जल्द से जल्द सेंटर आकर मिलें। धन्यवाद।`;
        
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const call = await twilioClient.calls.create({
                url: `http://twimlets.com/message?Message=${encodeURIComponent(callMessage)}`,
                to: enquiry.mobile,
                from: process.env.TWILIO_PHONE_NUMBER || '+13613211017'
            });
            enquiry.callReminderSent = true;
            enquiry.reminderSentAt = new Date();
            await enquiry.save();
            res.json({ success: true, message: "Call initiated", callSid: call.sid });
        } else {
            enquiry.callReminderSent = true;
            enquiry.reminderSentAt = new Date();
            await enquiry.save();
            res.json({ success: true, message: "Reminder marked (Twilio not configured)" });
        }
    } catch (err) {
        console.error('Enquiry call error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ADMIN APIs
// ============================================

app.post('/api/admin-login', authLimiter, async (req, res) => {
    const { userid, password } = req.body;
    if (!userid || !password) return res.status(400).json({ success: false, message: "User ID and Password are required!" });
    
    try {
        const admin = await Admin.findOne({ adminID: userid });
        if (admin && admin.lockUntil && admin.lockUntil > new Date()) {
            const remainingMinutes = Math.ceil((admin.lockUntil - new Date()) / 60000);
            return res.status(401).json({ success: false, message: `Account locked. Try again after ${remainingMinutes} minutes.` });
        }
        
        if (admin && await bcrypt.compare(password, admin.pws)) {
            admin.loginAttempts = 0;
            admin.lockUntil = null;
            admin.lastLogin = new Date();
            await admin.save();
            
            const token = jwt.sign({ id: admin._id, adminID: admin.adminID, role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '2h' });
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
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.post('/api/teacher-login', authLimiter, async (req, res) => {
    const { teacherId, password, aadharNumber, dob } = req.body;
    try {
        let teacher;
        if (teacherId && password) {
            teacher = await Teacher.findOne({ teacherId });
            if (!teacher || teacher.password !== password) return res.status(401).json({ success: false, message: "Invalid credentials" });
        } else if (aadharNumber && dob) {
            teacher = await Teacher.findOne({ aadharNumber });
            if (!teacher) return res.status(404).json({ success: false, message: "Aadhar not found" });
            const teacherDob = new Date(teacher.dob).toISOString().split('T')[0];
            if (teacherDob !== dob) return res.status(401).json({ success: false, message: "Invalid DOB" });
        } else {
            return res.status(400).json({ success: false, message: "Please provide (ID+Password) OR (Aadhar+DOB)" });
        }
        
        if (teacher.status !== 'approved') return res.status(403).json({ success: false, message: `Account is ${teacher.status}` });
        
        const token = jwt.sign({ id: teacher._id, teacherId: teacher.teacherId, role: 'teacher', name: `${teacher.teacherName.first} ${teacher.teacherName.last}` }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '8h' });
        const teacherData = teacher.toObject();
        delete teacherData.password;
        res.json({ success: true, message: "Login successful", token, data: teacherData });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

app.get('/api/verify-token', verifyToken, (req, res) => {
    res.json({ success: true, message: "Token is valid", user: { id: req.user.id, username: req.user.adminID || req.user.teacherId, role: req.user.role } });
});

app.get('/api/admin/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const admin = await Admin.findById(req.user.id).select('-pws');
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        res.json({ success: true, data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const { name, photo, aadharNumber, aadharDoc } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (photo) updateData.photo = photo;
        if (aadharNumber) updateData.aadharNumber = aadharNumber;
        if (aadharDoc) updateData.aadharDoc = aadharDoc;
        
        const admin = await Admin.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-pws');
        res.json({ success: true, message: "Profile updated", data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/change-admin-id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const { newAdminId, password } = req.body;
        if (!newAdminId || newAdminId.length < 3) return res.status(400).json({ success: false, message: "Admin ID must be at least 3 characters" });
        if (!password) return res.status(400).json({ success: false, message: "Password is required" });
        
        const admin = await Admin.findById(req.user.id);
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        if (!await bcrypt.compare(password, admin.pws)) return res.status(401).json({ success: false, message: "Invalid password" });
        
        const existingAdmin = await Admin.findOne({ adminID: newAdminId });
        if (existingAdmin && existingAdmin._id.toString() !== admin._id.toString()) return res.status(400).json({ success: false, message: "Admin ID already taken" });
        
        admin.adminID = newAdminId;
        await admin.save();
        res.json({ success: true, message: "Admin ID changed successfully! Please login again.", newAdminId: newAdminId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

const configUpdateSchema = Joi.object({
    logoText: Joi.string().required(),
    logoType: Joi.string().valid('text', 'image', 'url').default('text'),
    logoImage: Joi.string().allow('').optional(),
    title: Joi.string().required(),
    subTitle: Joi.string().allow('').optional(),
    aboutText: Joi.string().allow('').optional(),
    whatsapp: Joi.string().allow('').optional(),
    insta: Joi.string().allow('').optional(),
    fb: Joi.string().allow('').optional(),
    slides: Joi.array().items(Joi.string()).optional(),
    contactAddress: Joi.string().allow('').optional(),
    contactPhone: Joi.string().allow('').optional(),
    contactEmail: Joi.string().email().allow('').optional()
});

app.post('/api/update-config', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const { error, value } = configUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        const config = await WebConfig.findOneAndUpdate({}, value, { upsert: true, new: true });
        res.json({ success: true, message: "Website Updated Successfully!", data: config });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update Failed: " + err.message });
    }
});

app.post('/api/change-password', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: "All fields required" });
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        
        const admin = await Admin.findById(req.user.id);
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        if (!await bcrypt.compare(oldPassword, admin.pws)) return res.status(401).json({ success: false, message: "Old password is incorrect" });
        
        admin.pws = await bcrypt.hash(newPassword, 10);
        await admin.save();
        res.json({ success: true, message: "Password changed successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/admin/testimonials', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });
        const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/testimonials', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const { name, role, text, rating, image, order, isActive } = req.body;
        if (!name || !text) return res.status(400).json({ success: false, message: "Name and text are required" });
        const testimonial = new Testimonial({ name, role: role || 'Student', text, rating: rating || 5, image: image || '', order: order || 0, isActive: isActive !== undefined ? isActive : true });
        await testimonial.save();
        res.json({ success: true, message: "Testimonial added", data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/testimonials/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });
        Object.assign(testimonial, req.body);
        await testimonial.save();
        res.json({ success: true, message: "Testimonial updated", data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/testimonials/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Admin access required" });
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });
        res.json({ success: true, message: "Testimonial deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// SERVE HTML FILES
// ============================================

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/index.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/student-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html')); });
app.get('/teacher-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html')); });
app.get('/teacher-self-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'teacher-self-dashboard.html')); });
app.get('/register.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'register.html')); });
app.get('/teacher-reg.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'teacher-reg.html')); });
app.get('/studentats.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'studentats.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/admin-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html')); });
app.get('/reminder.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'reminder.html')); });

// ============================================
// ERROR HANDLERS
// ============================================

app.use((err, req, res, next) => {
    console.error("Global Error:", err.stack);
    res.status(500).json({ success: false, message: "Something went wrong!", error: err.message });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found", path: req.path });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', async () => {
    console.log("🔄 Initializing data...");
    await createDefaultAdmin();
    await initializeDefaultConfig();
    await initializeDefaultTestimonials();
    console.log("✅ Server ready to accept connections");
});

app.listen(PORT, () => {
    console.log(`🔐 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`\n📌 API Endpoints:`);
    console.log(`   ========== PUBLIC APIs ==========`);
    console.log(`   GET  /api/config           - Website Configuration`);
    console.log(`   GET  /api/stats            - Statistics Data`);
    console.log(`   GET  /api/testimonials     - Testimonials (Public)`);
    console.log(`   POST /api/enquiry          - Submit Enquiry (Public)`);
    console.log(`   GET  /api/videos           - Get Videos (Public)`);
    console.log(`\n   ========== STUDENT APIs ==========`);
    console.log(`   POST /api/student-register - Student Registration`);
    console.log(`   POST /api/student-login    - Student Login`);
    console.log(`   GET  /api/students         - Get All Students (Admin/Teacher)`);
    console.log(`   GET  /api/students/self    - Get Own Data (Student)`);
    console.log(`   GET  /api/students/:id     - Get Student by ID`);
    console.log(`   PUT  /api/students/:id     - Update Student (Admin)`);
    console.log(`   DELETE /api/students/:id   - Delete Student (Admin)`);
    console.log(`   POST /api/update-fees/:studentId - Update Fees (Admin)`);
    console.log(`   POST /api/students/:studentId/attendance - Mark Attendance`);
    console.log(`   POST /api/students/:studentId/block - Block Student (Admin)`);
    console.log(`   POST /api/students/:studentId/unblock - Unblock Student (Admin)`);
    console.log(`   POST /api/students/:studentId/promote - Promote Student (Admin)`);
    console.log(`   POST /api/move-to-old-student - Move to Old Records (Admin)`);
    console.log(`   GET  /api/old-students     - Get Old Students (Admin)`);
    console.log(`   GET  /api/students/:studentId/timeline - Timeline Graph Data`);
    console.log(`   GET  /api/students/:studentId/summary - Dashboard Summary`);
    console.log(`\n   ========== TEACHER APIs ==========`);
    console.log(`   POST /api/teacher-register - Teacher Registration`);
    console.log(`   POST /api/teacher-login    - Teacher Login`);
    console.log(`   GET  /api/teachers         - Get All Teachers (Admin)`);
    console.log(`   GET  /api/teachers/:id     - Get Teacher by ID`);
    console.log(`   PUT  /api/teachers/:id     - Update Teacher Profile`);
    console.log(`   PUT  /api/teachers/:id/status - Update Teacher Status (Admin)`);
    console.log(`   POST /api/teachers/:id/salary - Update Salary (Admin)`);
    console.log(`   POST /api/teachers/:id/attendance - Mark Teacher Attendance`);
    console.log(`   POST /api/salary-due-reminder - Send Salary Due Reminder`);
    console.log(`\n   ========== ADMIN APIs ==========`);
    console.log(`   POST /api/admin-login      - Admin Login`);
    console.log(`   GET  /api/admin/profile    - Get Admin Profile`);
    console.log(`   PUT  /api/admin/profile    - Update Admin Profile`);
    console.log(`   POST /api/change-admin-id  - Change Admin ID`);
    console.log(`   POST /api/change-password  - Change Admin Password`);
    console.log(`   POST /api/update-config    - Update Website Config`);
    console.log(`   GET  /api/admin/testimonials - Manage Testimonials`);
    console.log(`   GET  /api/admin/enquiries  - Manage Enquiries`);
    console.log(`   GET  /api/admin/videos     - Manage Videos`);
    console.log(`   POST /api/twilio-call      - Make Reminder Call`);
    console.log(`   POST /api/send-sms         - Send SMS`);
    console.log(`\n📝 Default Admin: admin / admin123`);
    console.log(`\n⭐ STUDENT SYSTEM FEATURES:`);
    console.log(`   ✅ Pro-rated fees from joining date`);
    console.log(`   ✅ Session: Joining Date to March 7 of next year`);
    console.log(`   ✅ Auto-block after 2 months fees due`);
    console.log(`   ✅ Manual block/unblock by admin`);
    console.log(`   ✅ Session completion auto move to old students`);
    console.log(`   ✅ Promotion to next class with new session`);
    console.log(`   ✅ Parent type selection (Father/Mother/Guardian)`);
    console.log(`   ✅ Both student and parent mobile compulsory`);
    console.log(`   ✅ Timeline graph for attendance, fees, blocks`);
});
