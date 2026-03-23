// ============================================
// SERVER.JS - COMPLETE ENHANCED VERSION
// Bal Bharti Coaching Center Management System
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

// Student Schema
const StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    mobile: { type: String, required: true },
    aadharNumber: { type: String, required: true, unique: true },
    aadharDocument: { type: String, required: true },
    registrationDate: { type: Date, required: true, default: Date.now },
    joiningDate: { type: Date, required: true },
    classMonthlyFees: { type: Number, default: 0 },
    feesHistory: [{
        month: { type: String, required: true },
        year: { type: Number, required: true },
        monthIndex: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, required: true },
        status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
        paymentDate: { type: Date },
        updatedBy: { type: String }
    }],
    attendance: [{
        date: { type: String, required: true },
        status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'present' },
        remarks: { type: String, default: '' },
        markedBy: { type: String },
        markedAt: { type: Date, default: Date.now }
    }],
    fatherName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    fatherMobile: { type: String, required: true },
    motherName: {
        first: { type: String, default: '' },
        middle: { type: String, default: '' },
        last: { type: String, default: '' }
    },
    address: {
        current: { type: String, required: true },
        permanent: { type: String, required: true }
    },
    education: {
        board: { type: String, required: true },
        class: { type: String, required: true }
    }
}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

// Teacher Schema
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

// Website ke liye Teachers ki photos (bina login ke)
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

// Website ke liye Students ki photos (bina login ke)
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
// ENHANCED LOGIN APIs with account locking
// ============================================

app.post('/api/admin-login', authLimiter, async (req, res) => {
    const { userid, password } = req.body;
    
    if (!userid || !password) {
        return res.status(400).json({ success: false, message: "User ID and Password are required!" });
    }
    
    try {
        const admin = await Admin.findOne({ adminID: userid });
        
        // Check if account is locked
        if (admin && admin.lockUntil && admin.lockUntil > new Date()) {
            const remainingMinutes = Math.ceil((admin.lockUntil - new Date()) / 60000);
            return res.status(401).json({ 
                success: false, 
                message: `Account locked. Try again after ${remainingMinutes} minutes.` 
            });
        }
        
        if (admin && await bcrypt.compare(password, admin.pws)) {
            // Reset login attempts on successful login
            admin.loginAttempts = 0;
            admin.lockUntil = null;
            admin.lastLogin = new Date();
            await admin.save();
            
            const token = jwt.sign(
                { id: admin._id, adminID: admin.adminID, role: 'admin' }, 
                process.env.JWT_SECRET || 'fallback_secret', 
                { expiresIn: '2h' }
            );
            
            res.json({ 
                success: true, 
                message: "Login Successful", 
                token,
                admin: { name: admin.name, adminID: admin.adminID }
            });
        } else {
            // Increment login attempts
            if (admin) {
                admin.loginAttempts += 1;
                if (admin.loginAttempts >= 5) {
                    admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
                }
                await admin.save();
            }
            res.status(401).json({ success: false, message: "Wrong ID or Password!" });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.post('/api/teacher-login', authLimiter, async (req, res) => {
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
            if (!teacher) {
                return res.status(404).json({ success: false, message: "Aadhar not found" });
            }
            const teacherDob = new Date(teacher.dob).toISOString().split('T')[0];
            if (teacherDob !== dob) {
                return res.status(401).json({ success: false, message: "Invalid DOB" });
            }
        } else {
            return res.status(400).json({ success: false, message: "Please provide (ID+Password) OR (Aadhar+DOB)" });
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
        console.error('Teacher login error:', err);
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

// ============================================
// TOKEN VERIFY ENDPOINT
// ============================================

app.get('/api/verify-token', verifyToken, (req, res) => {
    res.json({ 
        success: true, 
        message: "Token is valid", 
        user: { 
            id: req.user.id, 
            username: req.user.adminID || req.user.teacherId, 
            role: req.user.role 
        } 
    });
});

// ============================================
// ADMIN MANAGEMENT APIs
// ============================================

app.get('/api/admin/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const admin = await Admin.findById(req.user.id).select('-pws');
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        res.json({ success: true, data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
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

// ============================================
// NEW: CHANGE ADMIN ID API
// ============================================

app.post('/api/change-admin-id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const { newAdminId, password } = req.body;
        
        if (!newAdminId || newAdminId.length < 3) {
            return res.status(400).json({ success: false, message: "Admin ID must be at least 3 characters" });
        }
        
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }
        
        const admin = await Admin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const isPasswordValid = await bcrypt.compare(password, admin.pws);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
        
        const existingAdmin = await Admin.findOne({ adminID: newAdminId });
        if (existingAdmin && existingAdmin._id.toString() !== admin._id.toString()) {
            return res.status(400).json({ success: false, message: "Admin ID already taken" });
        }
        
        admin.adminID = newAdminId;
        await admin.save();
        
        console.log(`✅ Admin ID changed from ${req.user.adminID} to ${newAdminId}`);
        
        res.json({ 
            success: true, 
            message: "Admin ID changed successfully! Please login again.",
            newAdminId: newAdminId
        });
        
    } catch (err) {
        console.error('Change Admin ID error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// WEBSITE CONFIG UPDATE
// ============================================

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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const { error, value } = configUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        
        const config = await WebConfig.findOneAndUpdate({}, value, { upsert: true, new: true });
        console.log(`✅ Website updated by admin: ${req.user.adminID}`);
        res.json({ success: true, message: "Website Updated Successfully!", data: config });
    } catch (err) {
        console.error("Update Config Error:", err);
        res.status(500).json({ success: false, message: "Update Failed: " + err.message });
    }
});

// ============================================
// CHANGE PASSWORD
// ============================================

app.post('/api/change-password', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }
        
        const admin = await Admin.findById(req.user.id);
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        
        if (!await bcrypt.compare(oldPassword, admin.pws)) {
            return res.status(401).json({ success: false, message: "Old password is incorrect" });
        }
        
        admin.pws = await bcrypt.hash(newPassword, 10);
        await admin.save();
        
        res.json({ success: true, message: "Password changed successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ============================================
// TESTIMONIAL MANAGEMENT APIs (NEW)
// ============================================

// Get all testimonials (admin - includes inactive)
app.get('/api/admin/testimonials', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get single testimonial
app.get('/api/testimonials/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });
        res.json({ success: true, data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create new testimonial
app.post('/api/testimonials', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { name, role, text, rating, image, order, isActive } = req.body;
        
        if (!name || !text) {
            return res.status(400).json({ success: false, message: "Name and text are required" });
        }
        
        const testimonial = new Testimonial({
            name,
            role: role || 'Student',
            text,
            rating: rating || 5,
            image: image || '',
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true
        });
        
        await testimonial.save();
        res.json({ success: true, message: "Testimonial added", data: testimonial });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update testimonial
app.put('/api/testimonials/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { name, role, text, rating, image, order, isActive } = req.body;
        
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: "Testimonial not found" });
        }
        
        if (name) testimonial.name = name;
        if (role) testimonial.role = role;
        if (text) testimonial.text = text;
        if (rating) testimonial.rating = rating;
        if (image !== undefined) testimonial.image = image;
        if (order !== undefined) testimonial.order = order;
        if (isActive !== undefined) testimonial.isActive = isActive;
        
        await testimonial.save();
        res.json({ success: true, message: "Testimonial updated", data: testimonial });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete testimonial
app.delete('/api/testimonials/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: "Testimonial not found" });
        }
        
        res.json({ success: true, message: "Testimonial deleted" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Bulk update testimonials
app.post('/api/testimonials/bulk', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        
        const { testimonials } = req.body;
        
        if (!Array.isArray(testimonials)) {
            return res.status(400).json({ success: false, message: "Invalid data format" });
        }
        
        const results = [];
        
        for (const t of testimonials) {
            if (t._id) {
                // Update existing
                const updated = await Testimonial.findByIdAndUpdate(t._id, {
                    name: t.name,
                    role: t.role,
                    text: t.text,
                    rating: t.rating,
                    image: t.image,
                    order: t.order,
                    isActive: t.isActive
                }, { new: true });
                if (updated) results.push(updated);
            } else {
                // Create new
                const created = new Testimonial(t);
                await created.save();
                results.push(created);
            }
        }
        
        res.json({ success: true, message: "Testimonials saved", data: results });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// STUDENT APIs
// ============================================

app.post('/api/student-register', async (req, res) => {
    console.log("📝 Student registration request received");
    try {
        const data = req.body;
        
        const requiredFields = ['studentId', 'password', 'photo', 'aadharDocument', 'classMonthlyFees'];
        for (const field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({ success: false, message: `${field} is required` });
            }
        }
        
        const existing = await Student.findOne({ 
            $or: [{ studentId: data.studentId }, { aadharNumber: data.aadhar }] 
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Student already exists" });
        }
        
        const student = new Student({
            studentId: data.studentId,
            password: data.password,
            photo: data.photo,
            classMonthlyFees: data.classMonthlyFees || 0,
            studentName: {
                first: data.student?.firstName || data.student?.first,
                middle: data.student?.middleName || data.student?.middle || '',
                last: data.student?.lastName || data.student?.last
            },
            mobile: data.student?.mobile || data.mobile,
            aadharNumber: data.aadhar,
            aadharDocument: data.aadharDocument,
            registrationDate: new Date(data.dates?.reg || Date.now()),
            joiningDate: new Date(data.dates?.join || Date.now()),
            fatherName: {
                first: data.father?.firstName || data.father?.first,
                middle: data.father?.middleName || data.father?.middle || '',
                last: data.father?.lastName || data.father?.last
            },
            fatherMobile: data.father?.mobile,
            motherName: {
                first: data.mother?.firstName || data.mother?.first || '',
                middle: data.mother?.middleName || data.mother?.middle || '',
                last: data.mother?.lastName || data.mother?.last || ''
            },
            address: {
                current: data.address?.current,
                permanent: data.address?.permanent
            },
            education: {
                board: data.education?.board,
                class: data.education?.class
            },
            attendance: []
        });
        
        await student.save();
        console.log(`✅ New student registered: ${student.studentName.first} ${student.studentName.last} (ID: ${student.studentId})`);
        
        res.json({ 
            success: true, 
            message: "Registration successful",
            studentId: student.studentId,
            password: student.password
        });
        
    } catch (err) {
        console.error("❌ Registration Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate entry: Student with this Aadhar or ID already exists" });
        }
        res.status(500).json({ success: false, message: "Registration failed: " + err.message });
    }
});

app.get('/api/students', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied. Only admin and teachers can view students." });
        }
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const updateData = req.body;
        
        if (updateData.student) {
            student.studentName = {
                first: updateData.student.firstName,
                middle: updateData.student.middleName || '',
                last: updateData.student.lastName
            };
            if (updateData.student.mobile) student.mobile = updateData.student.mobile;
        }
        
        if (updateData.password) student.password = updateData.password;
        if (updateData.photo) student.photo = updateData.photo;
        if (updateData.classMonthlyFees) student.classMonthlyFees = updateData.classMonthlyFees;
        if (updateData.aadhar) student.aadharNumber = updateData.aadhar;
        if (updateData.aadharDocument) student.aadharDocument = updateData.aadharDocument;
        
        if (updateData.father) {
            student.fatherName = {
                first: updateData.father.firstName,
                middle: updateData.father.middleName || '',
                last: updateData.father.lastName
            };
            if (updateData.father.mobile) student.fatherMobile = updateData.father.mobile;
        }
        
        if (updateData.mother) {
            student.motherName = {
                first: updateData.mother.firstName,
                middle: updateData.mother.middleName || '',
                last: updateData.mother.lastName
            };
        }
        
        if (updateData.address) {
            student.address = {
                current: updateData.address.current,
                permanent: updateData.address.permanent
            };
        }
        
        if (updateData.education) {
            student.education = {
                board: updateData.education.board,
                class: updateData.education.class
            };
        }
        
        if (updateData.dates && updateData.dates.join) {
            const newJoiningDate = new Date(updateData.dates.join);
            if (newJoiningDate.toString() !== student.joiningDate.toString()) {
                student.joiningDate = newJoiningDate;
                const currentDate = new Date();
                const newFeesHistory = [];
                let current = new Date(newJoiningDate);
                while (current <= currentDate) {
                    const monthName = current.toLocaleString('default', { month: 'short' });
                    const year = current.getFullYear();
                    const monthKey = `${monthName} ${year}`;
                    const existingFee = student.feesHistory?.find(f => f.month === monthKey);
                    
                    if (existingFee) {
                        newFeesHistory.push(existingFee);
                    } else {
                        newFeesHistory.push({
                            month: monthKey,
                            year: year,
                            monthIndex: current.getMonth(),
                            paidAmount: 0,
                            dueAmount: student.classMonthlyFees,
                            status: 'unpaid'
                        });
                    }
                    current.setMonth(current.getMonth() + 1);
                }
                student.feesHistory = newFeesHistory;
            }
        }
        
        await student.save();
        res.json({ success: true, message: "Student updated", data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

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

app.post('/api/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const { month, paidAmount } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        const feeEntry = student.feesHistory.find(f => f.month === month);
        if (feeEntry) {
            feeEntry.paidAmount = paidAmount;
            feeEntry.dueAmount = student.classMonthlyFees - paidAmount;
            feeEntry.status = paidAmount >= student.classMonthlyFees ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
            feeEntry.paymentDate = new Date();
            feeEntry.updatedBy = req.user.adminID;
            await student.save();
        }
        res.json({ success: true, message: "Fees updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, data: student.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const { date, status, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        if (!student.attendance) student.attendance = [];
        
        const existingIndex = student.attendance.findIndex(a => a.date === date);
        const record = { 
            date, 
            status, 
            remarks: remarks || '', 
            markedBy: req.user.role === 'teacher' ? req.user.teacherId : req.user.adminID, 
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

app.delete('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const { date } = req.body;
        if (!date) return res.status(400).json({ success: false, message: "Date is required" });
        
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        
        if (!student.attendance) student.attendance = [];
        const initialLength = student.attendance.length;
        student.attendance = student.attendance.filter(a => a.date !== date);
        
        if (student.attendance.length === initialLength) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }
        
        await student.save();
        res.json({ success: true, message: "Attendance record deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/boards', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const students = await Student.find();
        const boards = [...new Set(students.map(s => s.education?.board).filter(b => b))];
        const classes = [...new Set(students.map(s => s.education?.class).filter(c => c))];
        res.json({ success: true, data: { boards, classes } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/students/:board/:class', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const students = await Student.find({
            'education.board': req.params.board,
            'education.class': req.params.class
        });
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TEACHER APIs
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
    console.log(`   GET  /api/config           - Website Configuration`);
    console.log(`   GET  /api/stats            - Statistics Data`);
    console.log(`   GET  /api/testimonials     - Testimonials (Public)`);
    console.log(`   GET  /api/admin/testimonials - Testimonials (Admin Full)`);
    console.log(`   POST /api/testimonials     - Create Testimonial`);
    console.log(`   PUT  /api/testimonials/:id - Update Testimonial`);
    console.log(`   DELETE /api/testimonials/:id - Delete Testimonial`);
    console.log(`   POST /api/testimonials/bulk - Bulk Update Testimonials`);
    console.log(`   POST /api/change-admin-id  - Change Admin ID`);
    console.log(`   GET  /api/admin/teachers-with-due - Teachers with Due Salary`);
    console.log(`\n📝 Default Admin: admin / admin123`);
});
