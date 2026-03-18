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
const path = require('path'); // Add this for serving HTML

dotenv.config();
const app = express();

// Generate nonce for CSP
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Helmet configuration - FIXED VERSION
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
                    "https://via.placeholder.com",
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
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for images
app.use(express.static('public'));

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc')
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err.message));

// ============================================
// SCHEMAS
// ============================================

// Web Config Schema
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
        default: 'Welcome to Bal Bharti Coaching Center. We provide quality education to students.'
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
    whatsapp: String,
    insta: String,
    fb: String,
    twitter: String
}, {
    timestamps: true
});

const WebConfig = mongoose.model('WebConfig', WebConfigSchema);

// Admin Schema
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
}, {
    timestamps: true
});

const Admin = mongoose.model('Admin', AdminSchema);

// ============================================
// STUDENT SCHEMA WITH COMPLETE FEATURES
// ============================================
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
    // Fees History Array
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
}, { 
    timestamps: true 
});

const Student = mongoose.model('Student', StudentSchema);

// ============================================
// TEACHER SCHEMA WITH COMPLETE FIELDS
// ============================================
const TeacherSchema = new mongoose.Schema({
    // Basic Information
    teacherId: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    }, // Aadhar Number as ID
    
    password: { 
        type: String, 
        required: true 
    }, // Name(4) + YYYY format
    
    photo: { 
        type: String, 
        required: true 
    }, // Base64 photo
    
    // Teacher Name
    teacherName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    
    // Father's Name
    fatherName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    
    // Contact Information
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
    
    // Personal Details
    dob: { 
        type: Date, 
        required: true 
    },
    
    // Qualification
    lastQualification: { 
        type: String, 
        required: true 
    },
    
    qualificationDoc: { 
        type: String, 
        required: true 
    }, // Base64 String
    
    // Aadhar Details
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
    }, // Base64 String
    
    // Teacher Dashboard Fields
    subject: { 
        type: String,
        default: '',
        trim: true
    }, // Subject teacher teaches
    
    salary: { 
        type: Number, 
        default: 0,
        min: 0
    }, // Monthly salary
    
    salaryHistory: [{
        month: { 
            type: String, 
            required: true 
        }, // "January 2024"
        year: { 
            type: Number, 
            required: true 
        },
        monthIndex: { 
            type: Number, 
            required: true 
        }, // 0-11
        salary: { 
            type: Number, 
            default: 0 
        },
        paidAmount: { 
            type: Number, 
            default: 0 
        },
        dueAmount: { 
            type: Number, 
            default: 0 
        },
        status: { 
            type: String, 
            enum: ['paid', 'partial', 'unpaid'], 
            default: 'unpaid' 
        },
        paymentDate: { 
            type: Date 
        },
        updatedBy: { 
            type: String 
        }, // Admin ID who updated
        remarks: { 
            type: String,
            default: ''
        }
    }],
    
    // Status Management
    joiningDate: { 
        type: Date, 
        default: null 
    }, // Set when approved
    
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' 
    },
    
    // Address (Optional but recommended)
    address: {
        current: { type: String, default: '' },
        permanent: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },
    
    // Bank Details (For salary transfer)
    bankDetails: {
        accountHolder: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' }
    },
    
    // Emergency Contact
    emergencyContact: {
        name: { type: String, default: '' },
        relation: { type: String, default: '' },
        phone: { type: String, default: '' }
    },
    
    // Experience
    experience: { 
        type: Number, 
        default: 0 
    }, // Years of experience
    
    previousSchool: { 
        type: String, 
        default: '' 
    },
    
    // Documents (Additional)
    resume: { 
        type: String, 
        default: '' 
    }, // Base64 resume
    
    experienceCertificate: { 
        type: String, 
        default: '' 
    }, // Base64 certificate
    
    // Remarks/Notes
    remarks: { 
        type: String, 
        default: '' 
    },
    
    // Rejection Reason (if rejected)
    rejectionReason: { 
        type: String, 
        default: '' 
    },
    
    // Created by (Admin who registered)
    createdBy: { 
        type: String, 
        default: 'self' 
    } // 'self' for self-registration, 'admin' for admin added

}, { 
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Create index for better search performance
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

async function initializeDefaultConfig() {
    try {
        const configExists = await WebConfig.findOne();
        if (!configExists) {
            const defaultConfig = new WebConfig({
                logoText: 'BBCC',
                title: 'Bal Bharti Coaching',
                subTitle: 'Excellence in Education',
                aboutText: 'Welcome to Bal Bharti Coaching Center. We provide quality education to students.',
                slides: [
                    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500',
                    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500',
                    'https://images.unsplash.com/photo-1503676260728-5177806628cb?w=500'
                ]
            });
            await defaultConfig.save();
            console.log("✅ Default website config created");
        }
    } catch (err) {
            console.log("❌ Config initialization error:", err.message);
    }
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        endpoints: {
            register: "/api/student-register",
            config: "/api/config",
            login: "/api/admin-login"
        }
    });
});

// Get website config
app.get('/api/config', async (req, res) => {
    try {
        let config = await WebConfig.findOne().lean();
        
        if (!config) {
            const defaultConfig = new WebConfig({
                logoText: 'BBCC',
                title: 'Bal Bharti Coaching',
                subTitle: 'Excellence in Education',
                aboutText: 'Welcome to Bal Bharti Coaching Center.',
                slides: [
                    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500',
                    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500',
                    'https://images.unsplash.com/photo-1503676260728-5177806628cb?w=500'
                ]
            });
            await defaultConfig.save();
            config = defaultConfig.toObject();
        }
        
        res.json(config);
    } catch (err) {
        console.error("Config fetch error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Admin login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

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

// Verify token
app.get('/api/verify-token', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "Token is valid",
        user: {
            id: req.user.id,
            adminID: req.user.adminID,
            role: req.user.role
        }
    });
});

// ============================================
// STUDENT REGISTRATION API
// ============================================
app.post('/api/student-register', async (req, res) => {
    console.log("📝 Registration request received");
    
    try {
        const studentData = req.body;
        
        // Validate required fields
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
        
        // Check if student already exists
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
        
        // Create new student
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
            }
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

// ============================================
// STUDENT MANAGEMENT APIs (Admin only)
// ============================================

// Get all students
app.get('/api/students', verifyToken, async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get single student by ID
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

// Update student fees
app.put('/api/students/:id/fees', verifyToken, async (req, res) => {
    try {
        const { classMonthlyFees } = req.body;
        const student = await Student.findOneAndUpdate(
            { studentId: req.params.id },
            { classMonthlyFees: classMonthlyFees },
            { new: true }
        );
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        res.json({ 
            success: true, 
            message: "Class monthly fees updated successfully",
            data: student 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete student
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

// Update student by ID
app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const studentData = req.body;
        
        const student = await Student.findOneAndUpdate(
            { studentId: req.params.id },
            {
                password: studentData.password,
                classMonthlyFees: studentData.classMonthlyFees,
                photo: studentData.photo,
                studentName: studentData.student,
                mobile: studentData.student.mobile,
                aadharNumber: studentData.aadhar,
                aadharDocument: studentData.aadharDocument,
                registrationDate: studentData.dates.reg,
                joiningDate: studentData.dates.join,
                fatherName: studentData.father,
                fatherMobile: studentData.father.mobile,
                motherName: studentData.mother,
                address: studentData.address,
                education: studentData.education
            },
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

// ============================================
// STUDENT DASHBOARD APIs
// ============================================

// Get all boards
app.get('/api/boards', verifyToken, async (req, res) => {
    try {
        const boards = await Student.distinct('education.board');
        res.json({ success: true, data: boards });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get classes by board
app.get('/api/classes/:board', verifyToken, async (req, res) => {
    try {
        const classes = await Student.distinct('education.class', { 
            'education.board': req.params.board 
        });
        res.json({ success: true, data: classes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get students by board and class
app.get('/api/students/:board/:class', verifyToken, async (req, res) => {
    try {
        const students = await Student.find({
            'education.board': req.params.board,
            'education.class': req.params.class
        }).select('studentId studentName photo classMonthlyFees');
        
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get complete student data for dashboard
app.get('/api/student-dashboard/:studentId', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ 
            studentId: req.params.studentId 
        });
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: "Student not found" 
            });
        }

        // Generate fees history if not exists
        if (!student.feesHistory || student.feesHistory.length === 0) {
            const joiningDate = new Date(student.joiningDate);
            const currentDate = new Date();
            const feesHistory = [];

            let currentMonth = new Date(joiningDate);
            
            while (currentMonth <= currentDate) {
                const monthName = currentMonth.toLocaleString('default', { month: 'long' });
                const year = currentMonth.getFullYear();
                
                feesHistory.push({
                    month: `${monthName} ${year}`,
                    year: year,
                    monthIndex: currentMonth.getMonth(),
                    paidAmount: 0,
                    dueAmount: student.classMonthlyFees,
                    status: 'unpaid'
                });

                currentMonth.setMonth(currentMonth.getMonth() + 1);
            }

            student.feesHistory = feesHistory;
            await student.save();
        }

        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update fees payment
app.post('/api/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
        const { month, paidAmount } = req.body;
        const student = await Student.findOne({ studentId: req.params.studentId });
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: "Student not found" 
            });
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

        await student.save({ validateBeforeSave: false });

        const months = student.feesHistory.map(f => f.month);
        const paidAmounts = student.feesHistory.map(f => f.paidAmount);
        const dueAmounts = student.feesHistory.map(f => f.dueAmount);
        
        const chartData = {
            months: months,
            paid: paidAmounts,
            due: dueAmounts,
            totalPaid: paidAmounts.reduce((a, b) => a + b, 0),
            totalDue: dueAmounts.reduce((a, b) => a + b, 0)
        };

        res.json({ 
            success: true, 
            message: "Fees updated successfully",
            data: {
                feesHistory: student.feesHistory,
                chartData: chartData
            }
        });
    } catch (err) {
        console.error("Update fees error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TEACHER REGISTRATION API
// ============================================
app.post('/api/teacher-register', async (req, res) => {
    try {
        const data = req.body;
        
        // Validate required fields
        const requiredFields = [
            'teacherId', 'password', 'photo', 
            'teacherName.first', 'teacherName.last',
            'fatherName.first', 'fatherName.last',
            'mobile', 'dob', 'lastQualification',
            'qualificationDoc', 'aadharNumber', 'aadharDoc'
        ];
        
        for (const field of requiredFields) {
            const keys = field.split('.');
            let value = data;
            for (const key of keys) {
                value = value?.[key];
                if (!value) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `${field} is required` 
                    });
                }
            }
        }
        
        // Validate mobile number
        if (!/^\d{10}$/.test(data.mobile)) {
            return res.status(400).json({ 
                success: false, 
                message: "Mobile number must be 10 digits" 
            });
        }
        
        // Validate Aadhar number
        if (!/^\d{12}$/.test(data.aadharNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: "Aadhar number must be 12 digits" 
            });
        }
        
        // Check for existing teacher by Aadhar
        const existingAadhar = await Teacher.findOne({ aadharNumber: data.aadharNumber });
        if (existingAadhar) {
            return res.status(400).json({ 
                success: false, 
                message: "Aadhar number already registered!" 
            });
        }
        
        // Check for existing teacher by Teacher ID
        const existingId = await Teacher.findOne({ teacherId: data.teacherId });
        if (existingId) {
            return res.status(400).json({ 
                success: false, 
                message: "Teacher ID already exists!" 
            });
        }
        
        // Check for existing teacher by Mobile
        const existingMobile = await Teacher.findOne({ mobile: data.mobile });
        if (existingMobile) {
            return res.status(400).json({ 
                success: false, 
                message: "Mobile number already registered!" 
            });
        }
        
        // Create new teacher
        const newTeacher = new Teacher({
            teacherId: data.teacherId,
            password: data.password,
            photo: data.photo,
            teacherName: {
                first: data.teacherName.first,
                middle: data.teacherName.middle || '',
                last: data.teacherName.last
            },
            fatherName: {
                first: data.fatherName.first,
                middle: data.fatherName.middle || '',
                last: data.fatherName.last
            },
            mobile: data.mobile,
            altMobile: data.altMobile || '',
            dob: new Date(data.dob),
            lastQualification: data.lastQualification,
            qualificationDoc: data.qualificationDoc,
            aadharNumber: data.aadharNumber,
            aadharDoc: data.aadharDoc,
            
            // Optional fields
            subject: data.subject || '',
            salary: data.salary || 0,
            address: data.address || {
                current: '',
                permanent: '',
                city: '',
                state: '',
                pincode: ''
            },
            bankDetails: data.bankDetails || {
                accountHolder: '',
                accountNumber: '',
                ifscCode: '',
                bankName: ''
            },
            emergencyContact: data.emergencyContact || {
                name: '',
                relation: '',
                phone: ''
            },
            experience: data.experience || 0,
            previousSchool: data.previousSchool || '',
            resume: data.resume || '',
            experienceCertificate: data.experienceCertificate || '',
            remarks: data.remarks || '',
            
            // Status
            status: 'pending',
            joiningDate: null,
            createdBy: 'self'
        });

        await newTeacher.save();

        console.log(`✅ New teacher registered: ${data.teacherName.first} ${data.teacherName.last} (ID: ${data.teacherId})`);

        res.json({ 
            success: true, 
            message: "Registration Successful! Your application is pending approval.",
            id: data.teacherId,
            name: `${data.teacherName.first} ${data.teacherName.last}`,
            status: 'pending'
        });

    } catch (err) {
        console.error("❌ Teacher Registration Error:", err);
        
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ 
                success: false, 
                message: `${field} already exists. Please use different value.` 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Registration failed: " + err.message 
        });
    }
});

// ============================================
// BULK TEACHER REGISTRATION (For admin)
// ============================================
app.post('/api/teachers/bulk-register', verifyToken, async (req, res) => {
    try {
        const teachers = req.body.teachers;
        
        if (!Array.isArray(teachers) || teachers.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide an array of teachers" 
            });
        }
        
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        
        for (const teacherData of teachers) {
            try {
                const existing = await Teacher.findOne({ 
                    $or: [
                        { aadharNumber: teacherData.aadharNumber },
                        { teacherId: teacherData.teacherId }
                    ]
                });
                
                if (existing) {
                    results.failed++;
                    results.errors.push({
                        teacher: teacherData.teacherId,
                        error: "Duplicate Aadhar or ID"
                    });
                    continue;
                }
                
                const newTeacher = new Teacher({
                    ...teacherData,
                    createdBy: req.user.adminID,
                    status: 'pending'
                });
                
                await newTeacher.save();
                results.success++;
                
            } catch (err) {
                results.failed++;
                results.errors.push({
                    teacher: teacherData.teacherId,
                    error: err.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `Bulk registration completed: ${results.success} success, ${results.failed} failed`,
            data: results
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// CHECK TEACHER AVAILABILITY
// ============================================
app.post('/api/teacher-check', async (req, res) => {
    try {
        const { aadharNumber, mobile, teacherId } = req.body;
        
        const checks = {};
        
        if (aadharNumber) {
            checks.aadharExists = await Teacher.exists({ aadharNumber });
        }
        
        if (mobile) {
            checks.mobileExists = await Teacher.exists({ mobile });
        }
        
        if (teacherId) {
            checks.idExists = await Teacher.exists({ teacherId });
        }
        
        res.json({
            success: true,
            data: checks
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TEACHER MANAGEMENT APIs
// ============================================

// GET: All teachers with filters
app.get('/api/teachers', verifyToken, async (req, res) => {
    try {
        const { status, search, subject, page = 1, limit = 50 } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (subject && subject !== 'all') {
            query.subject = subject;
        }
        
        if (search) {
            query.$or = [
                { 'teacherName.first': { $regex: search, $options: 'i' } },
                { 'teacherName.last': { $regex: search, $options: 'i' } },
                { teacherId: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { aadharNumber: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const teachers = await Teacher.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Teacher.countDocuments(query);
        
        // Add salary calculation for each teacher
        const teachersWithSalary = teachers.map(teacher => {
            const teacherObj = teacher.toObject();
            
            if (teacher.joiningDate) {
                const joiningDate = new Date(teacher.joiningDate);
                const currentDate = new Date();
                const months = [];
                
                let currentMonth = new Date(joiningDate);
                currentMonth.setDate(1);
                
                while (currentMonth <= currentDate) {
                    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
                    const year = currentMonth.getFullYear();
                    const monthKey = `${monthName} ${year}`;
                    
                    const existingSalary = teacher.salaryHistory?.find(
                        s => s.month === monthKey
                    ) || {
                        month: monthKey,
                        year: year,
                        monthIndex: currentMonth.getMonth(),
                        salary: teacher.salary || 0,
                        paidAmount: 0,
                        dueAmount: teacher.salary || 0,
                        status: 'unpaid'
                    };
                    
                    months.push(existingSalary);
                    
                    currentMonth.setMonth(currentMonth.getMonth() + 1);
                }
                
                teacherObj.salaryMonths = months;
            } else {
                teacherObj.salaryMonths = [];
            }
            
            return teacherObj;
        });
        
        res.json({ 
            success: true, 
            data: teachersWithSalary,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Single teacher by ID
app.get('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        if (teacher.status === 'approved' && teacher.joiningDate) {
            const teacherObj = teacher.toObject();
            const joiningDate = new Date(teacher.joiningDate);
            const currentDate = new Date();
            const months = [];
            
            let currentMonth = new Date(joiningDate);
            currentMonth.setDate(1);
            
            while (currentMonth <= currentDate) {
                const monthName = currentMonth.toLocaleString('default', { month: 'long' });
                const year = currentMonth.getFullYear();
                const monthKey = `${monthName} ${year}`;
                
                const existingSalary = teacher.salaryHistory?.find(
                    s => s.month === monthKey
                ) || {
                    month: monthKey,
                    year: year,
                    monthIndex: currentMonth.getMonth(),
                    salary: teacher.salary || 0,
                    paidAmount: 0,
                    dueAmount: teacher.salary || 0,
                    status: 'unpaid'
                };
                
                months.push(existingSalary);
                currentMonth.setMonth(currentMonth.getMonth() + 1);
            }
            
            teacherObj.salaryMonths = months;
            return res.json({ success: true, data: teacherObj });
        }
        
        res.json({ success: true, data: teacher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST: Update teacher status (Approve/Reject)
app.put('/api/teachers/:id/status', verifyToken, async (req, res) => {
    try {
        const { status, subject, salary, joiningDate, rejectionReason } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid status" 
            });
        }
        
        const updateData = { status };
        
        if (status === 'approved') {
            updateData.joiningDate = joiningDate ? new Date(joiningDate) : new Date();
            if (subject) updateData.subject = subject;
            if (salary) updateData.salary = parseInt(salary);
            
            const teacher = await Teacher.findOne({ teacherId: req.params.id });
            if (teacher && !teacher.salaryHistory) {
                updateData.salaryHistory = [];
            }
        } else if (status === 'rejected') {
            updateData.rejectionReason = rejectionReason || 'Not specified';
            updateData.joiningDate = null;
        }
        
        const teacher = await Teacher.findOneAndUpdate(
            { teacherId: req.params.id },
            updateData,
            { new: true }
        );
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        console.log(`✅ Teacher ${req.params.id} status updated to ${status} by ${req.user.adminID}`);
        
        res.json({ 
            success: true, 
            message: `Teacher ${status} successfully`,
            data: teacher 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT: Update teacher complete details
app.put('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacherData = req.body;
        
        delete teacherData._id;
        delete teacherData.__v;
        delete teacherData.createdAt;
        delete teacherData.updatedAt;
        delete teacherData.password;
        
        const teacher = await Teacher.findOneAndUpdate(
            { teacherId: req.params.id },
            teacherData,
            { new: true, runValidators: true }
        );
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        console.log(`✅ Teacher ${req.params.id} updated by ${req.user.adminID}`);
        
        res.json({ 
            success: true, 
            message: "Teacher updated successfully",
            data: teacher 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST: Update teacher salary
app.post('/api/teachers/:id/salary', verifyToken, async (req, res) => {
    try {
        const { month, paidAmount, remarks } = req.body;
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        if (teacher.status !== 'approved') {
            return res.status(400).json({ 
                success: false, 
                message: "Can only pay salary to approved teachers" 
            });
        }

        if (!teacher.salaryHistory) {
            teacher.salaryHistory = [];
        }

        const salaryEntry = teacher.salaryHistory.find(s => s.month === month);
        const monthlySalary = teacher.salary || 0;
        
        if (salaryEntry) {
            salaryEntry.paidAmount = paidAmount;
            salaryEntry.dueAmount = monthlySalary - paidAmount;
            salaryEntry.status = paidAmount >= monthlySalary ? 'paid' : 
                                paidAmount > 0 ? 'partial' : 'unpaid';
            salaryEntry.paymentDate = new Date();
            salaryEntry.updatedBy = req.user.adminID;
            if (remarks) salaryEntry.remarks = remarks;
        } else {
            teacher.salaryHistory.push({
                month: month,
                year: new Date().getFullYear(),
                monthIndex: new Date().getMonth(),
                salary: monthlySalary,
                paidAmount: paidAmount,
                dueAmount: monthlySalary - paidAmount,
                status: paidAmount >= monthlySalary ? 'paid' : 
                       paidAmount > 0 ? 'partial' : 'unpaid',
                paymentDate: new Date(),
                updatedBy: req.user.adminID,
                remarks: remarks || ''
            });
        }

        await teacher.save({ validateBeforeSave: false });

        const totalPaid = teacher.salaryHistory.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        const totalDue = teacher.salaryHistory.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
        
        const months = teacher.salaryHistory.map(s => s.month);
        const paidAmounts = teacher.salaryHistory.map(s => s.paidAmount);
        const dueAmounts = teacher.salaryHistory.map(s => s.dueAmount);
        
        const chartData = {
            months: months,
            paid: paidAmounts,
            due: dueAmounts,
            totalPaid: totalPaid,
            totalDue: totalDue
        };

        console.log(`💰 Salary updated for ${req.params.id} - Month: ${month}, Paid: ₹${paidAmount}`);

        res.json({ 
            success: true, 
            message: "Salary updated successfully",
            data: {
                salaryHistory: teacher.salaryHistory,
                chartData: chartData,
                totalPaid,
                totalDue
            }
        });
    } catch (err) {
        console.error("Update salary error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE: Delete teacher
app.delete('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOneAndDelete({ teacherId: req.params.id });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        console.log(`🗑️ Teacher ${req.params.id} deleted by ${req.user.adminID}`);
        
        res.json({ 
            success: true, 
            message: "Teacher deleted successfully" 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Teacher statistics for dashboard
app.get('/api/teachers/stats/summary', verifyToken, async (req, res) => {
    try {
        const totalTeachers = await Teacher.countDocuments();
        const pendingTeachers = await Teacher.countDocuments({ status: 'pending' });
        const approvedTeachers = await Teacher.countDocuments({ status: 'approved' });
        const rejectedTeachers = await Teacher.countDocuments({ status: 'rejected' });
        
        const subjectStats = await Teacher.aggregate([
            { $match: { status: 'approved', subject: { $ne: '' } } },
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        const teachers = await Teacher.find({ status: 'approved' });
        let totalPaidSalary = 0;
        let totalDueSalary = 0;
        let totalMonthlySalary = 0;
        
        teachers.forEach(teacher => {
            totalMonthlySalary += teacher.salary || 0;
            if (teacher.salaryHistory) {
                teacher.salaryHistory.forEach(s => {
                    totalPaidSalary += s.paidAmount || 0;
                    totalDueSalary += s.dueAmount || 0;
                });
            }
        });
        
        const months = [];
        const paidTrend = [];
        const dueTrend = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const monthKey = `${monthName} ${year}`;
            months.push(monthKey);
            
            let monthPaid = 0;
            let monthDue = 0;
            
            teachers.forEach(teacher => {
                if (teacher.salaryHistory) {
                    const salaryMonth = teacher.salaryHistory.find(s => s.month === monthKey);
                    if (salaryMonth) {
                        monthPaid += salaryMonth.paidAmount || 0;
                        monthDue += salaryMonth.dueAmount || 0;
                    }
                }
            });
            
            paidTrend.push(monthPaid);
            dueTrend.push(monthDue);
        }
        
        res.json({
            success: true,
            data: {
                total: totalTeachers,
                pending: pendingTeachers,
                approved: approvedTeachers,
                rejected: rejectedTeachers,
                totalPaidSalary,
                totalDueSalary,
                totalMonthlySalary,
                subjectStats,
                salaryTrend: {
                    months,
                    paid: paidTrend,
                    due: dueTrend
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Export teachers data
app.get('/api/teachers/export/:format', verifyToken, async (req, res) => {
    try {
        const { format } = req.params;
        const { status } = req.query;
        
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const teachers = await Teacher.find(query).sort({ createdAt: -1 });
        
        if (format === 'json') {
            return res.json({ success: true, data: teachers });
        } 
        else if (format === 'csv') {
            const fields = [
                'teacherId', 'teacherName.first', 'teacherName.last',
                'mobile', 'subject', 'salary', 'status', 'joiningDate'
            ];
            
            let csv = fields.join(',') + '\n';
            
            teachers.forEach(t => {
                const row = fields.map(f => {
                    const val = f.split('.').reduce((obj, key) => obj?.[key], t) || '';
                    return `"${val}"`;
                }).join(',');
                csv += row + '\n';
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=teachers.csv');
            return res.send(csv);
        }
        
        res.status(400).json({ success: false, message: "Invalid format" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// UPDATE CONFIG API
// ============================================
const configUpdateSchema = Joi.object({
    logoText: Joi.string().required(),
    title: Joi.string().required(),
    subTitle: Joi.string().allow('').optional(),
    aboutText: Joi.string().allow('').optional(),
    whatsapp: Joi.string().uri().allow('').optional(),
    insta: Joi.string().uri().allow('').optional(),
    fb: Joi.string().uri().allow('').optional(),
    twitter: Joi.string().uri().allow('').optional(),
    slides: Joi.array().items(Joi.string().uri()).optional()
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
            message: "Update Fail Ho Gaya. Please try again."
        });
    }
});

// ============================================
// CHANGE PASSWORD API
// ============================================
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

// ============================================
// ERROR HANDLERS
// ============================================

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong! Please try again later."
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        path: req.path
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', async () => {
    console.log("🔄 Initializing data...");
    await createDefaultAdmin();
    await initializeDefaultConfig();
});

app.listen(PORT, () => {
    console.log(`🔐 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📌 API Endpoints:`);
    console.log(`   - POST /api/student-register - Student Registration`);
    console.log(`   - POST /api/teacher-register - Teacher Registration`);
    console.log(`   - POST /api/admin-login - Admin Login`);
    console.log(`   - GET /api/config - Website Config`);
    console.log(`   - GET /api/students - Get All Students`);
    console.log(`   - GET /api/teachers - Get All Teachers`);
    console.log(`   - GET /api/teachers/stats/summary - Teacher Statistics`);
    console.log(`   - GET /api/health - Health Check`);
    console.log(`   - GET /student-dashboard.html - Student Dashboard`);
    console.log(`   - GET /teacher-dashboard.html - Teacher Dashboard`);
});
