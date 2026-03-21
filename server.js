// ============================================
// SERVER.JS - COMPLETE FIXED VERSION
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

// Helmet configuration with CSP
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

// Rate Limiter
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
    logoText: { type: String, required: true, trim: true, default: 'BBCC' },
    title: { type: String, required: true, default: 'Bal Bharti Coaching' },
    subTitle: { type: String, default: 'Excellence in Education' },
    aboutText: { type: String, default: 'Welcome to Bal Bharti Coaching Center. We provide quality education with modern technology and experienced faculty. Join us for excellence in education.' },
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

// ---------- Testimonials Schema ----------
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

// ---------- Admin Schema ----------
const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true, trim: true },
    pws: { type: String, required: true }
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

// ---------- STUDENT SCHEMA ----------
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

// ---------- TEACHER SCHEMA ----------
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
            const newAdmin = new Admin({ adminID: 'admin', pws: hashedPassword });
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
// HEALTH CHECK & CONFIG APIs (NO TOKEN NEEDED)
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "Server is running", timestamp: new Date().toISOString() });
});

app.get('/api/config', async (req, res) => {
    try {
        let config = await WebConfig.findOne().lean();
        if (!config) {
            config = {
                logoText: 'BBCC', title: 'Bal Bharti Coaching', subTitle: 'Excellence in Education',
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
// LOGIN APIs (NO TOKEN NEEDED)
// ============================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." }
});

app.post('/api/admin-login', loginLimiter, async (req, res) => {
    const { userid, password } = req.body;
    if (!userid || !password) return res.status(400).json({ success: false, message: "User ID and Password are required!" });
    try {
        const admin = await Admin.findOne({ adminID: userid });
        if (admin && await bcrypt.compare(password, admin.pws)) {
            const token = jwt.sign({ id: admin._id, adminID: admin.adminID, role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
            res.json({ success: true, message: "Login Successful", token });
        } else {
            res.status(401).json({ success: false, message: "Wrong ID or Password!" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.post('/api/teacher-login', loginLimiter, async (req, res) => {
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

// ============================================
// ✅ TOKEN VERIFICATION MIDDLEWARE (DEFINED HERE - BEFORE ITS USAGE)
// ============================================

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid or expired token." });
        req.user = decoded;
        next();
    });
};

// ============================================
// TOKEN VERIFY ENDPOINT (USES verifyToken)
// ============================================

app.get('/api/verify-token', verifyToken, (req, res) => {
    res.json({ success: true, message: "Token is valid", user: { id: req.user.id, username: req.user.adminID || req.user.teacherId, role: req.user.role } });
});

// ============================================
// WEBSITE CONFIG UPDATE (USES verifyToken)
// ============================================

const configUpdateSchema = Joi.object({
    logoText: Joi.string().required(),
    title: Joi.string().required(),
    subTitle: Joi.string().allow('').optional(),
    aboutText: Joi.string().allow('').optional(),
    whatsapp: Joi.string().uri().allow('').optional(),
    insta: Joi.string().uri().allow('').optional(),
    fb: Joi.string().uri().allow('').optional(),
    slides: Joi.array().items(Joi.string().uri()).optional(),
    contactAddress: Joi.string().allow('').optional(),
    contactPhone: Joi.string().allow('').optional(),
    contactEmail: Joi.string().email().allow('').optional()
});

app.post('/api/update-config', verifyToken, async (req, res) => {
    try {
        const { error, value } = configUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });
        const config = await WebConfig.findOneAndUpdate({}, value, { upsert: true, new: true });
        console.log(`✅ Website updated by admin: ${req.user.adminID}`);
        res.json({ success: true, message: "Website Updated Successfully!", data: config });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update Failed" });
    }
});

// ============================================
// CHANGE PASSWORD (USES verifyToken)
// ============================================

app.post('/api/change-password', verifyToken, async (req, res) => {
    try {
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

// ============================================
// STUDENT APIs (verifyToken वाले)
// ============================================

app.post('/api/student-register', async (req, res) => {
    try {
        const data = req.body;
        if (!data.studentId || !data.password) return res.status(400).json({ success: false, message: "Student ID and password required" });
        const existing = await Student.findOne({ $or: [{ studentId: data.studentId }, { aadharNumber: data.aadhar }] });
        if (existing) return res.status(400).json({ success: false, message: "Student already exists" });
        const student = new Student({
            studentId: data.studentId, password: data.password, photo: data.photo, classMonthlyFees: data.classMonthlyFees || 0,
            studentName: data.student, mobile: data.student.mobile, aadharNumber: data.aadhar, aadharDocument: data.aadharDocument,
            registrationDate: new Date(data.dates.reg), joiningDate: new Date(data.dates.join),
            fatherName: data.father, fatherMobile: data.father.mobile, motherName: data.mother,
            address: data.address, education: data.education, attendance: []
        });
        await student.save();
        res.json({ success: true, message: "Registration successful", studentId: data.studentId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/students', verifyToken, async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate({ studentId: req.params.id }, req.body, { new: true });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, message: "Student updated", data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/students/:id', verifyToken, async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, message: "Student deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/update-fees/:studentId', verifyToken, async (req, res) => {
    try {
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
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, data: student.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/students/:id/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, remarks } = req.body;
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });
        if (!student.attendance) student.attendance = [];
        const existingIndex = student.attendance.findIndex(a => a.date === date);
        const record = { date, status, remarks: remarks || '', markedBy: req.user.adminID, markedAt: new Date() };
        if (existingIndex >= 0) student.attendance[existingIndex] = record;
        else student.attendance.push(record);
        await student.save();
        res.json({ success: true, message: "Attendance marked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// TEACHER APIs (verifyToken वाले)
// ============================================

app.post('/api/teacher-register', async (req, res) => {
    try {
        const data = req.body;
        if (await Teacher.findOne({ aadharNumber: data.aadharNumber })) return res.status(400).json({ success: false, message: "Aadhar already registered" });
        if (await Teacher.findOne({ teacherId: data.teacherId })) return res.status(400).json({ success: false, message: "Teacher ID exists" });
        const newTeacher = new Teacher({ ...data, status: 'pending', attendance: [] });
        await newTeacher.save();
        res.json({ success: true, message: "Registration Successful! Pending approval." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers', verifyToken, async (req, res) => {
    try {
        const teachers = await Teacher.find().sort({ createdAt: -1 });
        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ teacherId: req.params.id }).select('-password');
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, data: teacher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/teachers/:id/status', verifyToken, async (req, res) => {
    try {
        const { status, subject, salary, joiningDate } = req.body;
        const updateData = { status };
        if (status === 'approved') {
            updateData.joiningDate = joiningDate ? new Date(joiningDate) : new Date();
            if (subject) updateData.subject = subject;
            if (salary) updateData.salary = parseInt(salary);
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
        }
        await teacher.save();
        res.json({ success: true, message: "Salary updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOneAndDelete({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, message: "Teacher deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers/stats/summary', verifyToken, async (req, res) => {
    try {
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
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        res.json({ success: true, data: teacher.attendance || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        const { date, status, remarks, photo } = req.body;
        const teacher = await Teacher.findOne({ teacherId: req.params.id });
        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        if (!teacher.attendance) teacher.attendance = [];
        const existingIndex = teacher.attendance.findIndex(a => a.date === date);
        const record = { date, status, remarks: remarks || '', photo: photo || '', markedBy: req.user.role === 'teacher' ? 'self' : req.user.adminID, markedAt: new Date() };
        if (existingIndex >= 0) teacher.attendance[existingIndex] = record;
        else teacher.attendance.push(record);
        await teacher.save();
        res.json({ success: true, message: "Attendance marked" });
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
    console.log("✅ Server ready to accept connections");
});

app.listen(PORT, () => {
    console.log(`🔐 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
