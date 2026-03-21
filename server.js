// ============================================
// SERVER.JS - COMPLETE FINAL VERSION
// Bal Bharti Coaching Center Management System
// Includes: Student, Teacher, Attendance, Salary, Fees
// With Teacher Self Dashboard Support & Dynamic Website Config
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

// Load environment variables
dotenv.config();
const app = express();

// ============================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ============================================

// Generate nonce for CSP
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Helmet configuration with CSP - UPDATED for Teacher Dashboard
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
                    "https://cdn.datatables.net"
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
                frameSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true
}));

// JSON parser with increased limit for images
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Rate Limiter - Prevents brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

// ============================================
// DATABASE CONNECTION
// ============================================

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc')
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ DB Connection Error:", err.message));

// ============================================
// SCHEMA DEFINITIONS
// ============================================

// ---------- Web Config Schema ----------
const WebConfigSchema = new mongoose.Schema({
    logoText: {
        type: String,
        required: true,
        trim: true,
        default: 'BBCC'
    },
    title: {
        type: String,
        required: true,
        default: 'Bal Bharti Coaching'
    },
    subTitle: {
        type: String,
        default: 'Excellence in Education'
    },
    aboutText: {
        type: String,
        default: 'Welcome to Bal Bharti Coaching Center. We provide quality education with modern technology and experienced faculty. Join us for excellence in education.'
    },
    slides: [{
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\//.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    }],
    // Social Media Links
    whatsapp: { type: String, default: '#' },
    insta: { type: String, default: '#' },
    fb: { type: String, default: '#' },
    twitter: { type: String, default: '#' },
    // Contact Information
    contactAddress: { type: String, default: '123 Education Street, City' },
    contactPhone: { type: String, default: '+91 98765 43210' },
    contactEmail: { type: String, default: 'info@balbharti.com' },
    // Institute Info
    establishedYear: { type: Number, default: 2010 },
    totalStudentsTrained: { type: Number, default: 5000 },
    totalFaculty: { type: Number, default: 25 }
}, { timestamps: true });

const WebConfig = mongoose.model('WebConfig', WebConfigSchema);

// ---------- Testimonials Schema ----------
const TestimonialSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true,
        enum: ['Student', 'Parent', 'Teacher', 'Alumni']
    },
    text: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 5 
    },
    image: { 
        type: String, 
        default: '' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    order: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

const Testimonial = mongoose.model('Testimonial', TestimonialSchema);

// ---------- Admin Schema ----------
const AdminSchema = new mongoose.Schema({
    adminID: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    pws: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

// ---------- STUDENT SCHEMA with Attendance ----------
const StudentSchema = new mongoose.Schema({
    studentId: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    photo: {
        type: String,
        required: true
    },
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    mobile: { 
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: 'Mobile number must be 10 digits'
        }
    },
    aadharNumber: { 
        type: String, 
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{12}$/.test(v);
            },
            message: 'Aadhar number must be 12 digits'
        }
    },
    aadharDocument: { 
        type: String, 
        required: true 
    },
    registrationDate: { 
        type: Date, 
        required: true,
        default: Date.now 
    },
    joiningDate: { 
        type: Date, 
        required: true 
    },
    classMonthlyFees: { 
        type: Number, 
        default: 0 
    },
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
    fatherMobile: { 
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: 'Father mobile must be 10 digits'
        }
    },
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

StudentSchema.index({ 
    'studentName.first': 'text', 
    'studentName.last': 'text',
    studentId: 'text',
    mobile: 'text',
    aadharNumber: 'text'
});

const Student = mongoose.model('Student', StudentSchema);

// ---------- TEACHER SCHEMA ----------
const TeacherSchema = new mongoose.Schema({
    teacherId: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    photo: { 
        type: String, 
        required: true 
    },
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
    mobile: { 
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: 'Mobile number must be 10 digits'
        }
    },
    altMobile: { 
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^\d{10}$/.test(v);
            },
            message: 'Alternative mobile must be 10 digits'
        }
    },
    dob: { 
        type: Date, 
        required: true 
    },
    lastQualification: { 
        type: String, 
        required: true 
    },
    qualificationDoc: { 
        type: String, 
        required: true 
    },
    aadharNumber: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{12}$/.test(v);
            },
            message: 'Aadhar number must be 12 digits'
        }
    },
    aadharDoc: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: String,
        default: '',
        trim: true
    },
    salary: { 
        type: Number, 
        default: 0,
        min: 0
    },
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
    joiningDate: { 
        type: Date, 
        default: null 
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' 
    },
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
    experience: { 
        type: Number, 
        default: 0 
    },
    previousSchool: { 
        type: String, 
        default: '' 
    },
    resume: { 
        type: String, 
        default: '' 
    },
    experienceCertificate: { 
        type: String, 
        default: '' 
    },
    remarks: { 
        type: String, 
        default: '' 
    },
    rejectionReason: { 
        type: String, 
        default: '' 
    },
    createdBy: { 
        type: String, 
        default: 'self' 
    }
}, { timestamps: true });

TeacherSchema.index({ 
    'teacherName.first': 'text', 
    'teacherName.last': 'text',
    teacherId: 'text',
    mobile: 'text',
    aadharNumber: 'text',
    subject: 'text'
});

const Teacher = mongoose.model('Teacher', TeacherSchema);

console.log("✅ All Schemas loaded successfully");

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

// Create default admin if not exists
async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ adminID: 'admin' });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const newAdmin = new Admin({
                adminID: 'admin',
                pws: hashedPassword
            });
            
            await newAdmin.save();
            console.log("✅ Default Admin Created: Username = admin, Password = admin123");
            console.log("⚠️ PLEASE CHANGE PASSWORD AFTER FIRST LOGIN!");
        } else {
            console.log("✅ Admin already exists");
        }
    } catch (err) {
        console.log("❌ Admin creation error:", err.message);
    }
}

// Initialize default website config
async function initializeDefaultConfig() {
    try {
        const configExists = await WebConfig.findOne();
        if (!configExists) {
            const defaultConfig = new WebConfig({
                logoText: 'BBCC',
                title: 'Bal Bharti Coaching',
                subTitle: 'Excellence in Education',
                aboutText: 'Welcome to Bal Bharti Coaching Center. We provide quality education with modern technology and experienced faculty. Join us for excellence in education.',
                slides: [
                    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
                    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
                    'https://images.unsplash.com/photo-1503676260728-5177806628cb?w=800'
                ],
                whatsapp: '#',
                insta: '#',
                fb: '#',
                contactAddress: '123 Education Street, City',
                contactPhone: '+91 98765 43210',
                contactEmail: 'info@balbharti.com',
                establishedYear: 2010,
                totalStudentsTrained: 5000,
                totalFaculty: 25
            });
            await defaultConfig.save();
            console.log("✅ Default website config created");
        }
    } catch (err) {
        console.log("❌ Config initialization error:", err.message);
    }
}

// Initialize default testimonials
async function initializeDefaultTestimonials() {
    try {
        const testimonialsCount = await Testimonial.countDocuments();
        if (testimonialsCount === 0) {
            const defaultTestimonials = [
                {
                    name: "Priya Sharma",
                    role: "Parent",
                    text: "Bal Bharti Coaching has transformed my child's academic performance. The teachers are dedicated and use modern teaching methods. I highly recommend this institute.",
                    rating: 5,
                    image: "https://images.unsplash.com/photo-1494790108777-466d853dd23d?w=100",
                    order: 1,
                    isActive: true
                },
                {
                    name: "Rajesh Kumar",
                    role: "Teacher",
                    text: "As a teacher, I love the dashboard. Marking attendance with photo has become so easy. The salary tracking system is excellent and very transparent.",
                    rating: 5,
                    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
                    order: 2,
                    isActive: true
                },
                {
                    name: "Amit Patel",
                    role: "Student",
                    text: "The attendance system is very efficient. I can check my history anytime. The teaching quality is outstanding and the faculty is very supportive.",
                    rating: 5,
                    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
                    order: 3,
                    isActive: true
                },
                {
                    name: "Neha Gupta",
                    role: "Alumni",
                    text: "I completed my coaching from Bal Bharti and got admission in top engineering college. The study material and test series are excellent.",
                    rating: 5,
                    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
                    order: 4,
                    isActive: true
                }
            ];
            
            await Testimonial.insertMany(defaultTestimonials);
            console.log("✅ Default testimonials created");
        }
    } catch (err) {
        console.log("❌ Testimonials initialization error:", err.message);
    }
}

// ============================================
// AUTHENTICATION & MIDDLEWARE
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        endpoints: {
            register: "/api/student-register",
            config: "/api/config",
            login: "/api/admin-login",
            teacherLogin: "/api/teacher-login",
            stats: "/api/stats",
            testimonials: "/api/testimonials"
        }
    });
});

// ============================================
// WEBSITE CONFIG APIs
// ============================================

// Get website config
app.get('/api/config', async (req, res) => {
    try {
        let config = await WebConfig.findOne().lean();
        
        if (!config) {
            config = {
                logoText: 'BBCC',
                title: 'Bal Bharti Coaching',
                subTitle: 'Excellence in Education',
                aboutText: 'Welcome to Bal Bharti Coaching Center. We provide quality education with modern technology and experienced faculty. Join us for excellence in education.',
                slides: [
                    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
                    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
                    'https://images.unsplash.com/photo-1503676260728-5177806628cb?w=800'
                ],
                whatsapp: '#',
                insta: '#',
                fb: '#',
                contactAddress: '123 Education Street, City',
                contactPhone: '+91 98765 43210',
                contactEmail: 'info@balbharti.com',
                establishedYear: 2010,
                totalStudentsTrained: 5000,
                totalFaculty: 25
            };
        }
        
        res.json(config);
    } catch (err) {
        console.error("Config fetch error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Update website configuration
const configUpdateSchema = Joi.object({
    logoText: Joi.string().required(),
    title: Joi.string().required(),
    subTitle: Joi.string().allow('').optional(),
    aboutText: Joi.string().allow('').optional(),
    whatsapp: Joi.string().uri().allow('').optional(),
    insta: Joi.string().uri().allow('').optional(),
    fb: Joi.string().uri().allow('').optional(),
    twitter: Joi.string().uri().allow('').optional(),
    slides: Joi.array().items(Joi.string().uri()).optional(),
    contactAddress: Joi.string().allow('').optional(),
    contactPhone: Joi.string().allow('').optional(),
    contactEmail: Joi.string().email().allow('').optional(),
    establishedYear: Joi.number().optional(),
    totalStudentsTrained: Joi.number().optional(),
    totalFaculty: Joi.number().optional()
});

app.post('/api/update-config', verifyToken, async (req, res) => {
    try {
        const { error, value } = configUpdateSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: " + error.details[0].message
            });
        }
        
        const config = await WebConfig.findOneAndUpdate(
            {},
            value,
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );
        
        console.log(`✅ Website updated by admin: ${req.user.adminID}`);
        
        res.json({
            success: true,
            message: "Website Updated Successfully!",
            data: config
        });
        
    } catch (err) {
        console.error("Update Config Error:", err);
        res.status(500).json({
            success: false,
            message: "Update Failed. Please try again."
        });
    }
});

// ============================================
// STATS APIs
// ============================================

// Get all statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalTeachers = await Teacher.countDocuments({ status: 'approved' });
        const pendingTeachers = await Teacher.countDocuments({ status: 'pending' });
        const totalBatches = 15; // You can make this dynamic if needed
        
        // Calculate total fees collected
        const students = await Student.find();
        let totalFeesCollected = 0;
        students.forEach(student => {
            if (student.feesHistory) {
                student.feesHistory.forEach(fee => {
                    totalFeesCollected += fee.paidAmount || 0;
                });
            }
        });
        
        // Calculate total salary paid
        const teachers = await Teacher.find({ status: 'approved' });
        let totalSalaryPaid = 0;
        teachers.forEach(teacher => {
            if (teacher.salaryHistory) {
                teacher.salaryHistory.forEach(salary => {
                    totalSalaryPaid += salary.paidAmount || 0;
                });
            }
        });
        
        // Get config for custom stats
        const config = await WebConfig.findOne();
        
        res.json({
            success: true,
            data: {
                totalStudents: totalStudents || 0,
                totalTeachers: totalTeachers || 0,
                pendingTeachers: pendingTeachers || 0,
                totalBatches: totalBatches,
                totalCourses: 12,
                successRate: 96,
                totalSubjects: 8,
                totalFeesCollected: totalFeesCollected,
                totalSalaryPaid: totalSalaryPaid,
                establishedYear: config?.establishedYear || 2010,
                totalStudentsTrained: config?.totalStudentsTrained || 5000,
                totalFaculty: config?.totalFaculty || 25
            }
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TESTIMONIALS APIs
// ============================================

// Get all testimonials
app.get('/api/testimonials', async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        
        res.json({
            success: true,
            data: testimonials
        });
    } catch (err) {
        console.error('Testimonials fetch error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin: Get all testimonials (including inactive)
app.get('/api/admin/testimonials', verifyToken, async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin: Add testimonial
app.post('/api/testimonials', verifyToken, async (req, res) => {
    try {
        const { name, role, text, rating, image, order } = req.body;
        
        const testimonial = new Testimonial({
            name,
            role,
            text,
            rating: rating || 5,
            image: image || '',
            order: order || 0,
            isActive: true
        });
        
        await testimonial.save();
        console.log(`✅ New testimonial added by ${req.user.adminID}`);
        
        res.json({ 
            success: true, 
            message: "Testimonial added successfully",
            data: testimonial 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin: Update testimonial
app.put('/api/testimonials/:id', verifyToken, async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!testimonial) {
            return res.status(404).json({ success: false, message: "Testimonial not found" });
        }
        
        console.log(`✅ Testimonial updated by ${req.user.adminID}`);
        res.json({ success: true, message: "Testimonial updated", data: testimonial });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin: Delete testimonial
app.delete('/api/testimonials/:id', verifyToken, async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        
        if (!testimonial) {
            return res.status(404).json({ success: false, message: "Testimonial not found" });
        }
        
        console.log(`🗑️ Testimonial deleted by ${req.user.adminID}`);
        res.json({ success: true, message: "Testimonial deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// AUTHENTICATION APIs
// ============================================

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

// Admin login
app.post('/api/admin-login', loginLimiter, async (req, res) => {
    const { userid, password } = req.body;
    
    if (!userid || !password) {
        return res.status(400).json({
            success: false,
            message: "User ID and Password are required!"
        });
    }
    
    try {
        const admin = await Admin.findOne({ adminID: userid });
        
        if (admin) {
            const isPasswordValid = await bcrypt.compare(password, admin.pws);
            
            if (isPasswordValid) {
                const token = jwt.sign(
                    {
                        id: admin._id,
                        adminID: admin.adminID,
                        role: 'admin'
                    },
                    process.env.JWT_SECRET || 'fallback_secret_change_this',
                    { expiresIn: '1h' }
                );
                
                console.log(`✅ Admin logged in: ${userid}`);
                
                res.json({
                    success: true,
                    message: "Login Successful",
                    token: token
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: "Wrong ID or Password!"
                });
            }
        } else {
            res.status(401).json({
                success: false,
                message: "Wrong ID or Password!"
            });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            success: false,
            message: "Server Error. Please try again later."
        });
    }
});

// Teacher Login
app.post('/api/teacher-login', loginLimiter, async (req, res) => {
    const { teacherId, password, aadharNumber, dob } = req.body;
    
    try {
        let teacher;
        let loginMethod = '';
        
        if (teacherId && password) {
            loginMethod = 'password';
            teacher = await Teacher.findOne({ teacherId });
            
            if (!teacher) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Teacher ID not found" 
                });
            }
            
            if (teacher.password !== password) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Invalid password" 
                });
            }
        }
        else if (aadharNumber && dob) {
            loginMethod = 'aadhar';
            teacher = await Teacher.findOne({ aadharNumber });
            
            if (!teacher) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Aadhar number not found" 
                });
            }
            
            const teacherDob = new Date(teacher.dob).toISOString().split('T')[0];
            if (teacherDob !== dob) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Invalid date of birth" 
                });
            }
        }
        else {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide either (Teacher ID + Password) OR (Aadhar + DOB)" 
            });
        }
        
        if (teacher.status !== 'approved') {
            return res.status(403).json({ 
                success: false, 
                message: `Your account is ${teacher.status}. Please contact admin.` 
            });
        }
        
        const token = jwt.sign(
            {
                id: teacher._id,
                teacherId: teacher.teacherId,
                role: 'teacher',
                name: `${teacher.teacherName.first} ${teacher.teacherName.last}`
            },
            process.env.JWT_SECRET || 'fallback_secret_change_this',
            { expiresIn: '8h' }
        );
        
        const teacherData = teacher.toObject();
        delete teacherData.password;
        
        console.log(`✅ Teacher logged in: ${teacher.teacherId} (${loginMethod} login)`);
        
        res.json({
            success: true,
            message: "Login successful",
            token: token,
            data: teacherData
        });
        
    } catch (err) {
        console.error("❌ Teacher login error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Login failed. Please try again." 
        });
    }
});

// Token verification middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_this', (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired token. Please login again."
            });
        }
        
        req.user = decoded;
        next();
    });
};

// Verify token endpoint
app.get('/api/verify-token', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "Token is valid",
        user: {
            id: req.user.id,
            username: req.user.adminID || req.user.teacherId,
            role: req.user.role || 'admin'
        }
    });
});

// Change admin password
app.post('/api/change-password', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Old password and new password are required"
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }
        
        const admin = await Admin.findById(req.user.id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
        
        const isPasswordValid = await bcrypt.compare(oldPassword, admin.pws);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect"
            });
        }
        
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        admin.pws = hashedNewPassword;
        await admin.save();
        
        console.log(`✅ Password changed for admin: ${req.user.adminID}`);
        
        res.json({
            success: true,
            message: "Password changed successfully!"
        });
        
    } catch (err) {
        console.error("Change Password Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
});

// ============================================
// STUDENT APIs
// ============================================

// Student Registration
app.post('/api/student-register', async (req, res) => {
    console.log("📝 Student registration request received");
    
    try {
        const studentData = req.body;
        
        if (!studentData.studentId || !studentData.password) {
            return res.status(400).json({ 
                success: false, 
                message: "Student ID and password are required" 
            });
        }
        
        if (!studentData.photo) {
            return res.status(400).json({ 
                success: false, 
                message: "Photo is required" 
            });
        }
        
        if (!studentData.aadharDocument) {
            return res.status(400).json({ 
                success: false, 
                message: "Aadhar document is required" 
            });
        }
        
        const existingStudent = await Student.findOne({ 
            $or: [
                { studentId: studentData.studentId },
                { aadharNumber: studentData.aadhar }
            ]
        });
        
        if (existingStudent) {
            return res.status(400).json({ 
                success: false, 
                message: "Student already registered with this Aadhar number or ID" 
            });
        }
        
        const student = new Student({
            studentId: studentData.studentId,
            password: studentData.password,
            classMonthlyFees: studentData.classMonthlyFees || 0,
            photo: studentData.photo,
            studentName: {
                first: studentData.student.firstName,
                middle: studentData.student.middleName || '',
                last: studentData.student.lastName
            },
            mobile: studentData.student.mobile,
            aadharNumber: studentData.aadhar,
            aadharDocument: studentData.aadharDocument,
            registrationDate: new Date(studentData.dates.reg),
            joiningDate: new Date(studentData.dates.join),
            fatherName: {
                first: studentData.father.firstName,
                middle: studentData.father.middleName || '',
                last: studentData.father.lastName
            },
            fatherMobile: studentData.father.mobile,
            motherName: {
                first: studentData.mother.firstName || '',
                middle: studentData.mother.middleName || '',
                last: studentData.mother.lastName || ''
            },
            address: {
                current: studentData.address.current,
                permanent: studentData.address.permanent
            },
            education: {
                board: studentData.education.board,
                class: studentData.education.class
            },
            attendance: []
        });
        
        await student.save();
        
        console.log(`✅ New student registered: ${studentData.student.firstName} ${studentData.student.lastName} (ID: ${studentData.studentId})`);
        
        res.json({ 
            success: true, 
            message: "Registration successful",
            studentId: studentData.studentId,
            password: studentData.password
        });
        
    } catch (err) {
        console.error("❌ Registration Error:", err);
        
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Duplicate entry: Student with this Aadhar or ID already exists" 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Registration failed: " + err.message 
        });
    }
});

// Get All Students
app.get('/api/students', verifyToken, async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Single Student
app.get('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Student
app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { studentId: req.params.id },
            req.body,
            { new: true }
        );
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        res.json({ success: true, message: "Student updated successfully", data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Student
app.delete('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        res.json({ success: true, message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Student Dashboard
app.get('/api/student-dashboard/:studentId', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Student Fees
app.post('/api/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
        const { month, paidAmount } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        const feeEntry = student.feesHistory.find(f => f.month === month);
        
        if (feeEntry) {
            feeEntry.paidAmount = paidAmount;
            feeEntry.dueAmount = student.classMonthlyFees - paidAmount;
            feeEntry.status = paidAmount >= student.classMonthlyFees ? 'paid' : 
                             paidAmount > 0 ? 'partial' : 'unpaid';
            feeEntry.paymentDate = new Date();
            feeEntry.updatedBy = req.user.adminID;
        }
        
        await student.save();
        
        res.json({ success: true, message: "Fees updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Student Attendance
app.get('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        res.json({ success: true, data: student.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.id });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (!student.attendance) student.attendance = [];
        
        const existingIndex = student.attendance.findIndex(a => a.date === date);
        const attendanceRecord = { date, status, remarks: remarks || '', markedBy: req.user.adminID, markedAt: new Date() };
        
        if (existingIndex >= 0) {
            student.attendance[existingIndex] = attendanceRecord;
        } else {
            student.attendance.push(attendanceRecord);
        }
        
        await student.save();
        
        res.json({ success: true, message: "Attendance marked successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TEACHER APIs
// ============================================

// Teacher Registration
app.post('/api/teacher-register', async (req, res) => {
    try {
        const data = req.body;
        
        const existingAadhar = await Teacher.findOne({ aadharNumber: data.aadharNumber });
        if (existingAadhar) {
            return res.status(400).json({ success: false, message: "Aadhar number already registered!" });
        }
        
        const existingId = await Teacher.findOne({ teacherId: data.teacherId });
        if (existingId) {
            return res.status(400).json({ success: false, message: "Teacher ID already exists!" });
        }
        
        const existingMobile = await Teacher.findOne({ mobile: data.mobile });
        if (existingMobile) {
            return res.status(400).json({ success: false, message: "Mobile number already registered!" });
        }
        
        const newTeacher = new Teacher({
            teacherId: data.teacherId,
            password: data.password,
            photo: data.photo,
            teacherName: data.teacherName,
            fatherName: data.fatherName,
            mobile: data.mobile,
            altMobile: data.altMobile || '',
            dob: new Date(data.dob),
            lastQualification: data.lastQualification,
            qualificationDoc: data.qualificationDoc,
            aadharNumber: data.aadharNumber,
            aadharDoc: data.aadharDoc,
            subject: data.subject || '',
            salary: data.salary || 0,
            address: data.address || {},
            bankDetails: data.bankDetails || {},
            emergencyContact: data.emergencyContact || {},
            experience: data.experience || 0,
            previousSchool: data.previousSchool || '',
            status: 'pending',
            createdBy: 'self',
            attendance: []
        });
        
        await newTeacher.save();
        
        console.log(`✅ New teacher registered: ${data.teacherName.first} ${data.teacherName.last}`);
        
        res.json({ success: true, message: "Registration Successful! Pending approval." });
        
    } catch (err) {
        console.error("❌ Teacher Registration Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get All Teachers
app.get('/api/teachers', verifyToken, async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;
        let query = {};
        
        if (status && status !== 'all') query.status = status;
        if (search) {
            query.$or = [
                { 'teacherName.first': { $regex: search, $options: 'i' } },
                { 'teacherName.last': { $regex: search, $options: 'i' } },
                { teacherId: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const teachers = await Teacher.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Teacher.countDocuments(query);
        
        res.json({ 
            success: true, 
            data: teachers,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Single Teacher
app.get('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ teacherId: req.params.id }).select('-password');
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        res.json({ success: true, data: teacher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Teacher Status
app.put('/api/teachers/:id/status', verifyToken, async (req, res) => {
    try {
        const { status, subject, salary, joiningDate, rejectionReason } = req.body;
        const updateData = { status };
        
        if (status === 'approved') {
            updateData.joiningDate = joiningDate ? new Date(joiningDate) : new Date();
            if (subject) updateData.subject = subject;
            if (salary) updateData.salary = parseInt(salary);
        } else if (status === 'rejected') {
            updateData.rejectionReason = rejectionReason || 'Not specified';
        }
        
        const teacher = await Teacher.findOneAndUpdate(
            { teacherId: req.params.id },
            updateData,
            { new: true }
        );
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        res.json({ success: true, message: `Teacher ${status} successfully` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Teacher Salary
app.post('/api/teachers/:id/salary', verifyToken, async (req, res) => {
    try {
        const { month, paidAmount, remarks } = req.body;
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        if (!teacher.salaryHistory) teacher.salaryHistory = [];
        
        const salaryEntry = teacher.salaryHistory.find(s => s.month === month);
        const monthlySalary = teacher.salary || 0;
        
        if (salaryEntry) {
            salaryEntry.paidAmount = paidAmount;
            salaryEntry.dueAmount = monthlySalary - paidAmount;
            salaryEntry.status = paidAmount >= monthlySalary ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
            salaryEntry.paymentDate = new Date();
            salaryEntry.updatedBy = req.user.adminID;
            if (remarks) salaryEntry.remarks = remarks;
        } else {
            teacher.salaryHistory.push({
                month, year: new Date().getFullYear(), monthIndex: new Date().getMonth(),
                salary: monthlySalary, paidAmount, dueAmount: monthlySalary - paidAmount,
                status: paidAmount >= monthlySalary ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
                paymentDate: new Date(), updatedBy: req.user.adminID, remarks: remarks || ''
            });
        }
        
        await teacher.save();
        
        res.json({ success: true, message: "Salary updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Teacher
app.delete('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOneAndDelete({ teacherId: req.params.id });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        res.json({ success: true, message: "Teacher deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Teacher Statistics
app.get('/api/teachers/stats/summary', verifyToken, async (req, res) => {
    try {
        const totalTeachers = await Teacher.countDocuments();
        const pendingTeachers = await Teacher.countDocuments({ status: 'pending' });
        const approvedTeachers = await Teacher.countDocuments({ status: 'approved' });
        const rejectedTeachers = await Teacher.countDocuments({ status: 'rejected' });
        
        res.json({
            success: true,
            data: { total: totalTeachers, pending: pendingTeachers, approved: approvedTeachers, rejected: rejectedTeachers }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Teacher Attendance
app.get('/api/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        res.json({ success: true, data: teacher.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, remarks, photo } = req.body;
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        if (!teacher.attendance) teacher.attendance = [];
        
        const existingIndex = teacher.attendance.findIndex(a => a.date === date);
        const attendanceRecord = { date, status, remarks: remarks || '', photo: photo || '', markedBy: req.user.role === 'teacher' ? 'self' : req.user.adminID, markedAt: new Date() };
        
        if (existingIndex >= 0) {
            teacher.attendance[existingIndex] = attendanceRecord;
        } else {
            teacher.attendance.push(attendanceRecord);
        }
        
        await teacher.save();
        
        res.json({ success: true, message: "Attendance marked successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// SERVE HTML FILES
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/student-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

app.get('/teacher-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html'));
});

app.get('/teacher-self-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher-self-dashboard.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/teacher-reg.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher-reg.html'));
});

app.get('/studentats.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'studentats.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ============================================
// ERROR HANDLERS
// ============================================

app.use((err, req, res, next) => {
    console.error("Global Error:", err.stack);
    res.status(500).json({ success: false, message: "Something went wrong!" });
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
});

app.listen(PORT, () => {
    console.log(`🔐 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`\n📌 API Endpoints:`);
    console.log(`   GET  /api/config           - Website Configuration`);
    console.log(`   GET  /api/stats            - Statistics Data`);
    console.log(`   GET  /api/testimonials     - Testimonials`);
    console.log(`   POST /api/admin-login      - Admin Login`);
    console.log(`   POST /api/teacher-login    - Teacher Login`);
    console.log(`   POST /api/student-register - Student Registration`);
    console.log(`   POST /api/teacher-register - Teacher Registration`);
    console.log(`   GET  /api/students         - All Students`);
    console.log(`   GET  /api/teachers         - All Teachers`);
});
