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

// Helmet configuration
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
                    "https://code.jquery.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com"
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
// ✅ CORRECTED STUDENT SCHEMA WITH FEES HISTORY
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
    // ✅ CHANGED: fees → classMonthlyFees
    classMonthlyFees: { 
        type: Number, 
        default: 0 
    },
    // ✅ NEW: feesHistory array for tracking monthly payments
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
// ✅ CORRECTED STUDENT REGISTRATION API
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
        
        // Create new student with classMonthlyFees
        const student = new Student({
            studentId: studentData.studentId,
            password: studentData.password,
            classMonthlyFees: studentData.classMonthlyFees || 0,  // ✅ CORRECTED
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
        
        // Handle duplicate key error
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

// ✅ CORRECTED: Update student fees (now using classMonthlyFees)
app.put('/api/students/:id/fees', verifyToken, async (req, res) => {
    try {
        const { classMonthlyFees } = req.body;  // ✅ CORRECTED
        const student = await Student.findOneAndUpdate(
            { studentId: req.params.id },
            { classMonthlyFees: classMonthlyFees },  // ✅ CORRECTED
            { new: true }
        );
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        res.json({ 
            success: true, 
            message: "Class monthly fees updated successfully",  // ✅ CORRECTED
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

// Update config
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

// Change password
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
// 🌟 NEW API ENDPOINTS FOR STUDENT DASHBOARD
// ============================================

// GET: Get all boards
app.get('/api/boards', verifyToken, async (req, res) => {
    try {
        const boards = await Student.distinct('education.board');
        res.json({ success: true, data: boards });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Get classes by board
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

// GET: Get students by board and class
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

// GET: Get complete student data for dashboard
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

// POST: Update fees payment
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

        // Find and update the specific month
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

        // Calculate chart data
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
        res.status(500).json({ success: false, message: err.message });
    }
});
// ============================================
//END POINT PUT ADD 
// ============================================
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
// TECHAR SCEEM AND API 
// ============================================
const TeacherSchema = new mongoose.Schema({
    teacherId: { type: String, required: true, unique: true }, // Aadhar Number
    password: { type: String, required: true }, // Name(4) + YYYY
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
    altMobile: { type: String },
    dob: { type: Date, required: true },
    lastQualification: { type: String, required: true },
    qualificationDoc: { type: String, required: true }, // Base64 String
    aadharNumber: { type: String, required: true, unique: true },
    aadharDoc: { type: String, required: true }, // Base64 String
    joiningDate: { type: Date, default: null }, // Blank/Null initially
    status: { type: String, default: 'pending' } // Initial Status
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', TeacherSchema);
app.post('/api/teacher-register', async (req, res) => {
    try {
        const data = req.body;
        
        // Check duplicate
        const existing = await Teacher.findOne({ aadharNumber: data.aadharNumber });
        if (existing) return res.status(400).json({ success: false, message: "Aadhar already registered!" });

        const newTeacher = new Teacher(data);
        await newTeacher.save();

        res.json({ 
            success: true, 
            message: "Registration Successful!",
            id: data.teacherId,
            pws: data.password
        });
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
    console.log(`   - POST /api/admin-login - Admin Login`);
    console.log(`   - GET /api/config - Website Config`);
    console.log(`   - GET /api/health - Health Check`);
    console.log(`   - GET /student-dashboard.html - Student Dashboard`);
});
