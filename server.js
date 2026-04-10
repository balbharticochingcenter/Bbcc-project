// ============================================
// COMPLETE SERVER CODE - WITH DATABASE PHOTO STORAGE
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
app.use(express.json({ limit: '50mb' }));  // Increased for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bbcc_portal';

// ============================================
// SCHEMA DEFINITIONS
// ============================================

// Admin Schema with Photo
const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true },
    pws: { type: String, required: true },
    name: { type: String, default: 'Admin' },
    photo: { type: String, default: '' },  // Base64 photo
    role: { type: String, default: 'admin' },
    permissions: [String],
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Student Schema
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
}, { autoIndex: false });

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

// ============================================
// SCREEN MANAGEMENT SCHEMA (Base64 Storage - No file upload needed)
// ============================================
const ScreenSchema = new mongoose.Schema({
    // Header Section
    logo: { type: String, default: '' },           // Base64 string
    title: { type: String, default: 'BBCC Portal' },
    subTitle: { type: String, default: 'Best Coaching Center' },
    
    // Sidebar Section
    sidebarPhotos: [{ type: String, default: '' }], // Array of Base64 strings
    zoomMeetingLink: { type: String, default: '' },
    
    // Gallery Section (Photos and Videos)
    gallery: [{
        type: { type: String, enum: ['photo', 'video'] },
        data: { type: String, default: '' },       // Base64 for photos
        url: { type: String, default: '' },        // For video links
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Footer Section
    whatsappNumber: { type: String, default: '' },
    whatsappChannelLink: { type: String, default: '' },
    youtubeChannelLink: { type: String, default: '' },
    facebookLink: { type: String, default: '' },
    instagramLink: { type: String, default: '' },
    telegramLink: { type: String, default: '' },
    twitterLink: { type: String, default: '' },
    linkedinLink: { type: String, default: '' },
    
    updatedAt: { type: Date, default: Date.now }
});

// ============================================
// TEACHER SCHEMA
// ============================================
const TeacherSchema = new mongoose.Schema({
    teacherId: { type: String, required: true, unique: true, index: true },
    aadharNumber: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    
    personal: {
        photo: { type: String, default: '' },
        name: { type: String, required: true },
        dob: { type: Date, required: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
        mobile: { type: String, required: true },
        email: { type: String, required: true },
        currentAddress: { type: String, required: true },
        permanentAddress: { type: String, default: '' }
    },
    
    documents: {
        aadharCopy: { type: String, default: '' },
        qualificationDoc: { type: String, default: '' },
        qualificationName: { type: String, required: true }
    },
    
    professional: {
        joiningDate: { type: Date, required: true },
        experience: { type: Number, default: 0 },
        subjects: [{ type: String }],
        classes: [{ type: String }],
        boards: [{ type: String }],
        branches: [{ type: String }],
        assignmentHistory: [{
            date: { type: Date, default: Date.now },
            changes: { type: Object },
            reason: { type: String }
        }]
    },
    
    salary: {
        defaultSalary: { type: Number, default: 0 },
        monthlySalaryHistory: [{
            month: String,
            year: Number,
            amount: Number
        }]
    },
    
    bankDetails: {
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifsc: { type: String, default: '' },
        upiId: { type: String, default: '' }
    },
    
    workingDays: {
        startDay: { type: String, default: 'Monday' },
        endDay: { type: String, default: 'Saturday' },
        isHoliday: [{ type: Date }]
    },
    
    attendance: [{
        date: { type: Date, required: true },
        status: { type: String, enum: ['present', 'absent', 'holiday', 'leave'], default: 'absent' },
        checkIn: { type: String },
        checkOut: { type: String },
        photo: { type: String, default: '' },
        remarks: { type: String },
        markedAt: { type: Date, default: Date.now },
        markedBy: { type: String }
    }],
    
    salaryPayments: [{
        month: String,
        year: Number,
        baseSalary: Number,
        workingDays: Number,
        presentDays: Number,
        calculatedAmount: Number,
        paidAmount: Number,
        dueAmount: Number,
        status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
        paymentDate: Date,
        paymentMode: { type: String, enum: ['cash', 'bank', 'upi'] },
        remarks: String
    }],
    
    notices: [{
        id: { type: String, required: true },
        from: { type: String, enum: ['admin', 'teacher'], required: true },
        to: { type: String, enum: ['admin', 'teacher'], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
        readAt: Date,
        reply: { type: String, default: null },
        replyAt: Date
    }],
    
    status: {
        isActive: { type: Boolean, default: true },
        isBlocked: { type: Boolean, default: false },
        blockedReason: { type: String },
        blockedAt: Date,
        unblockedAt: Date,
        leavingDate: Date,
        leavingReason: String
    },
    
    login: {
        lastLogin: Date,
        loginAttempts: { type: Number, default: 0 }
    }
    
}, { timestamps: true });

// Create Models
const Admin = mongoose.model('Admin', AdminSchema);
const Student = mongoose.model('Student', StudentSchema);
const OldStudent = mongoose.model('OldStudent', OldStudentSchema);
const Screen = mongoose.model('Screen', ScreenSchema);
const Teacher = mongoose.model('Teacher', TeacherSchema);

// ============================================
// DATABASE CONNECTION WITH INDEX FIX
// ============================================
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        
        console.log('🔄 Fixing database indexes...');
        
        try {
            const collections = await mongoose.connection.db.listCollections({ name: 'students' }).toArray();
            
            if (collections.length > 0) {
                const indexes = await Student.collection.getIndexes();
                console.log('Existing indexes:', Object.keys(indexes));
                
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
            
            await Student.collection.createIndex({ studentId: 1 }, { unique: true });
            console.log('✅ Created index: studentId');
            
            await Student.collection.createIndex({ aadharNumber: 1 }, { unique: true });
            console.log('✅ Created index: aadharNumber');
            
            console.log('✅ Database indexes fixed successfully!');
            
            await Teacher.collection.createIndex({ teacherId: 1 }, { unique: true });
            console.log('✅ Created index: teacherId');
            
            await Teacher.collection.createIndex({ aadharNumber: 1 }, { unique: true });
            console.log('✅ Created index: aadharNumber');
        } catch (indexErr) {
            console.log('⚠️ Index fix warning:', indexErr.message);
            try {
                await Student.syncIndexes();
                console.log('✅ Synced indexes via syncIndexes');
            } catch (syncErr) {
                console.log('⚠️ Sync indexes failed:', syncErr.message);
            }
        }
        
        // Create default admin with photo
        try {
            const existing = await Admin.findOne({ adminID: 'admin' });
            if (!existing) {
                const hash = await bcrypt.hash('admin123', 10);
                await Admin.create({ 
                    adminID: 'admin', 
                    pws: hash, 
                    name: 'Super Admin',
                    photo: '',  // No default photo
                    role: 'super_admin',
                    permissions: ['all']
                });
                console.log('\n✅ DEFAULT ADMIN CREATED!');
                console.log('   👤 Admin ID: admin');
                console.log('   🔑 Password: admin123');
                console.log('   📸 Admin Photo: Upload from settings\n');
            } else {
                console.log('✅ Admin already exists');
            }
        } catch (adminErr) {
            console.log('Admin creation error:', adminErr.message);
        }
        
        // Create default screen settings
        try {
            const existingScreen = await Screen.findOne();
            if (!existingScreen) {
                await Screen.create({
                    logo: '',
                    title: 'BBCC Portal',
                    subTitle: 'Best Coaching Center',
                    sidebarPhotos: [],
                    zoomMeetingLink: '',
                    gallery: [],
                    whatsappNumber: '',
                    whatsappChannelLink: '',
                    youtubeChannelLink: '',
                    facebookLink: '',
                    instagramLink: '',
                    telegramLink: '',
                    twitterLink: '',
                    linkedinLink: ''
                });
                console.log('✅ Default screen settings created!');
            }
        } catch (screenErr) {
            console.log('Screen creation error:', screenErr.message);
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
// SCREEN MANAGEMENT APIs (Base64 Storage)
// ============================================

// GET Screen Data
app.get('/api/screen', async (req, res) => {
    try {
        let screen = await Screen.findOne();
        if (!screen) {
            screen = await Screen.create({
                logo: '',
                title: 'BBCC Portal',
                subTitle: 'Best Coaching Center',
                sidebarPhotos: [],
                zoomMeetingLink: '',
                gallery: [],
                whatsappNumber: '',
                whatsappChannelLink: '',
                youtubeChannelLink: '',
                facebookLink: '',
                instagramLink: '',
                telegramLink: '',
                twitterLink: '',
                linkedinLink: ''
            });
        }
        res.json({ success: true, data: screen });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// UPDATE Screen Data (Base64 - No file upload needed)
app.put('/api/screen', verifyToken, async (req, res) => {
    try {
        let screen = await Screen.findOne();
        if (!screen) {
            screen = new Screen();
        }
        
        // 1. Update Header Fields
        if (req.body.title !== undefined) screen.title = req.body.title;
        if (req.body.subTitle !== undefined) screen.subTitle = req.body.subTitle;
        
        // 2. Update Logo (Base64)
        if (req.body.logo !== undefined && req.body.logo !== '') {
            screen.logo = req.body.logo;
        }
        
        // 3. Update Sidebar Fields
        if (req.body.zoomMeetingLink !== undefined) screen.zoomMeetingLink = req.body.zoomMeetingLink;
        
        // 4. Update Sidebar Photos (Array of Base64)
        if (req.body.sidebarPhotos !== undefined) {
            const newPhotos = JSON.parse(req.body.sidebarPhotos);
            screen.sidebarPhotos = [...screen.sidebarPhotos, ...newPhotos];
        }
        
        // 5. Delete sidebar photos by index
        if (req.body.deleteSidebarPhotoIndex !== undefined) {
            const index = parseInt(req.body.deleteSidebarPhotoIndex);
            screen.sidebarPhotos.splice(index, 1);
        }
        
        // 6. Update Gallery - Add new photos (Base64)
        if (req.body.galleryPhotos !== undefined) {
            const newPhotos = JSON.parse(req.body.galleryPhotos);
            for (const photoData of newPhotos) {
                screen.gallery.push({
                    type: 'photo',
                    data: photoData,
                    createdAt: new Date()
                });
            }
        }
        
        // 7. Add video links
        if (req.body.videoLinks !== undefined) {
            const videoLinks = JSON.parse(req.body.videoLinks);
            for (const link of videoLinks) {
                screen.gallery.push({
                    type: 'video',
                    url: link.url,
                    createdAt: new Date()
                });
            }
        }
        
        // 8. Delete gallery items
        if (req.body.deleteGalleryIds !== undefined) {
            const deleteIds = JSON.parse(req.body.deleteGalleryIds);
            screen.gallery = screen.gallery.filter(item => !deleteIds.includes(item._id.toString()));
        }
        
        // 9. Update Footer Fields
        const footerFields = ['whatsappNumber', 'whatsappChannelLink', 'youtubeChannelLink', 
                              'facebookLink', 'instagramLink', 'telegramLink', 'twitterLink', 'linkedinLink'];
        for (const field of footerFields) {
            if (req.body[field] !== undefined) screen[field] = req.body[field];
        }
        
        screen.updatedAt = new Date();
        await screen.save();
        
        res.json({ success: true, message: "Screen updated successfully!", data: screen });
        
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE single gallery item
app.delete('/api/screen/gallery/:id', verifyToken, async (req, res) => {
    try {
        const screen = await Screen.findOne();
        if (!screen) {
            return res.status(404).json({ success: false, message: "Screen not found" });
        }
        
        screen.gallery = screen.gallery.filter(item => item._id.toString() !== req.params.id);
        await screen.save();
        
        res.json({ success: true, message: "Gallery item deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ADMIN PHOTO APIs
// ============================================

// Update Admin Photo
app.post('/api/admin/photo', verifyToken, async (req, res) => {
    try {
        const { photoBase64 } = req.body;
        const admin = await Admin.findOne({ adminID: req.user.adminID });
        
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        admin.photo = photoBase64 || '';
        await admin.save();
        
        res.json({ success: true, message: "Admin photo updated successfully", photo: admin.photo });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Admin Photo
app.get('/api/admin/photo', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ adminID: req.user.adminID });
        res.json({ success: true, photo: admin?.photo || '' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Admin Profile (Complete)
app.get('/api/admin/profile', verifyToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ adminID: req.user.adminID }).select('-pws');
        res.json({ success: true, data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

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
            admin: { 
                name: admin.name, 
                adminID: admin.adminID, 
                role: admin.role,
                photo: admin.photo 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ADMIN CHANGE PASSWORD API
// ============================================
app.post('/api/admin/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const admin = await Admin.findOne({ adminID: req.user.adminID });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const isValid = await bcrypt.compare(currentPassword, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }
        
        if (newPassword.length < 4) {
            return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.pws = hashedPassword;
        await admin.save();
        
        res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ADMIN CHANGE ID API
// ============================================
app.post('/api/admin/change-id', verifyToken, async (req, res) => {
    try {
        const { newAdminId, password } = req.body;
        
        if (!newAdminId || newAdminId.length < 3) {
            return res.status(400).json({ success: false, message: "Admin ID must be at least 3 characters" });
        }
        
        const admin = await Admin.findOne({ adminID: req.user.adminID });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const isValid = await bcrypt.compare(password, admin.pws);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Password is incorrect" });
        }
        
        const existing = await Admin.findOne({ adminID: newAdminId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Admin ID already exists" });
        }
        
        admin.adminID = newAdminId;
        await admin.save();
        
        res.json({ success: true, message: "Admin ID changed successfully. Please login again." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// STUDENT REGISTRATION
// ============================================
app.post('/api/students/register', async (req, res) => {
    try {
        const data = req.body;
        
        const originalStudentId = data.studentId;
        const modifiedStudentId = `BBCC${originalStudentId}`;
        const aadharNumber = originalStudentId;
        
        console.log('📝 Registration:', { original: originalStudentId, modified: modifiedStudentId, aadhar: aadharNumber });
        
        if (!originalStudentId || !isValidAadhar(originalStudentId)) {
            return res.status(400).json({ success: false, message: "Valid 12-digit Student ID is required" });
        }
        
        if (!data.studentMobile || !isValidMobile(data.studentMobile)) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required" });
        }
        
        if (!data.studentName?.first || !data.studentName?.last) {
            return res.status(400).json({ success: false, message: "First name and last name are required" });
        }
        
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
// TEACHER APIs (Keeping existing ones)
// ============================================

function formatDOBToPassword(dob) {
    const d = new Date(dob);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}${month}${year}`;
}

function canMarkAttendance() {
    const now = new Date();
    const hour = now.getHours();
    return hour < 22;
}

function calculateSalary(baseSalary, workingDays, presentDays) {
    if (workingDays === 0) return 0;
    return Math.round((baseSalary / workingDays) * presentDays);
}

app.post('/api/teachers/register', verifyToken, async (req, res) => {
    try {
        const data = req.body;
        const aadharNumber = data.aadharNumber;
        
        if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
            return res.status(400).json({ success: false, message: "Valid 12-digit Aadhar number required" });
        }
        
        if (!data.personal?.mobile || !/^\d{10}$/.test(data.personal.mobile)) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number required" });
        }
        
        const existing = await Teacher.findOne({ $or: [{ teacherId: aadharNumber }, { aadharNumber: aadharNumber }] });
        if (existing) {
            return res.status(400).json({ success: false, message: "Teacher already registered with this Aadhar" });
        }
        
        const password = formatDOBToPassword(data.personal.dob);
        
        const teacher = new Teacher({
            teacherId: aadharNumber,
            aadharNumber: aadharNumber,
            password: password,
            personal: {
                photo: data.personal.photo || '',
                name: data.personal.name,
                dob: new Date(data.personal.dob),
                gender: data.personal.gender,
                mobile: data.personal.mobile,
                email: data.personal.email,
                currentAddress: data.personal.currentAddress,
                permanentAddress: data.personal.permanentAddress || ''
            },
            documents: {
                aadharCopy: data.documents?.aadharCopy || '',
                qualificationDoc: data.documents?.qualificationDoc || '',
                qualificationName: data.documents?.qualificationName
            },
            professional: {
                joiningDate: new Date(data.professional.joiningDate),
                experience: data.professional.experience || 0,
                subjects: data.professional.subjects || [],
                classes: data.professional.classes || [],
                boards: data.professional.boards || [],
                branches: data.professional.branches || [],
                assignmentHistory: [{
                    date: new Date(),
                    changes: {
                        subjects: data.professional.subjects || [],
                        classes: data.professional.classes || [],
                        boards: data.professional.boards || []
                    },
                    reason: "Initial joining"
                }]
            },
            salary: {
                defaultSalary: data.salary?.defaultSalary || 0,
                monthlySalaryHistory: []
            },
            bankDetails: {
                bankName: data.bankDetails?.bankName || '',
                accountNumber: data.bankDetails?.accountNumber || '',
                ifsc: data.bankDetails?.ifsc || '',
                upiId: data.bankDetails?.upiId || ''
            },
            status: {
                isActive: true,
                isBlocked: false
            }
        });
        
        await teacher.save();
        
        console.log('✅ Teacher registered:', teacher.teacherId);
        res.json({ 
            success: true, 
            message: "Teacher registered successfully!",
            teacherId: aadharNumber,
            password: password
        });
        
    } catch (err) {
        console.error('Teacher registration error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Teacher already exists!" });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers', verifyToken, async (req, res) => {
    try {
        const teachers = await Teacher.find({ 'status.isActive': true }).sort({ createdAt: -1 });
        const safeTeachers = teachers.map(t => {
            const obj = t.toObject();
            delete obj.password;
            return obj;
        });
        res.json({ success: true, data: safeTeachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const data = teacher.toObject();
        delete data.password;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/teachers/:id', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const updates = req.body;
        
        if (updates.personal) {
            Object.assign(teacher.personal, updates.personal);
        }
        if (updates.documents) {
            Object.assign(teacher.documents, updates.documents);
        }
        if (updates.professional) {
            const changes = {};
            if (updates.professional.subjects) changes.subjects = updates.professional.subjects;
            if (updates.professional.classes) changes.classes = updates.professional.classes;
            if (updates.professional.boards) changes.boards = updates.professional.boards;
            
            if (Object.keys(changes).length > 0) {
                teacher.professional.assignmentHistory.push({
                    date: new Date(),
                    changes: changes,
                    reason: updates.professional.changeReason || "Manual update"
                });
            }
            
            Object.assign(teacher.professional, updates.professional);
        }
        if (updates.salary) {
            Object.assign(teacher.salary, updates.salary);
        }
        if (updates.bankDetails) {
            Object.assign(teacher.bankDetails, updates.bankDetails);
        }
        
        teacher.updatedAt = new Date();
        await teacher.save();
        
        res.json({ success: true, message: "Teacher updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/attendance', verifyToken, async (req, res) => {
    try {
        if (!canMarkAttendance()) {
            return res.status(400).json({ success: false, message: "Attendance can only be marked before 10 PM" });
        }
        
        const teacherId = req.params.id;
        const { date, status, checkIn, checkOut, photo, remarks } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        
        const existingIndex = teacher.attendance.findIndex(a => {
            const aDate = new Date(a.date);
            aDate.setHours(0, 0, 0, 0);
            return aDate.getTime() === attendanceDate.getTime();
        });
        
        const record = {
            date: attendanceDate,
            status: status,
            checkIn: checkIn || new Date().toLocaleTimeString(),
            checkOut: checkOut || '',
            photo: photo || '',
            remarks: remarks || '',
            markedAt: new Date(),
            markedBy: req.user?.adminID || 'Admin'
        };
        
        if (existingIndex >= 0) {
            teacher.attendance[existingIndex] = record;
        } else {
            teacher.attendance.push(record);
        }
        
        await teacher.save();
        res.json({ success: true, message: "Attendance marked successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/teachers/:id/attendance/:date', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const dateParam = req.params.date;
        const { status, checkIn, checkOut, remarks } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const attendanceDate = new Date(dateParam);
        attendanceDate.setHours(0, 0, 0, 0);
        
        const attendanceIndex = teacher.attendance.findIndex(a => {
            const aDate = new Date(a.date);
            aDate.setHours(0, 0, 0, 0);
            return aDate.getTime() === attendanceDate.getTime();
        });
        
        if (attendanceIndex === -1) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }
        
        if (status) teacher.attendance[attendanceIndex].status = status;
        if (checkIn) teacher.attendance[attendanceIndex].checkIn = checkIn;
        if (checkOut) teacher.attendance[attendanceIndex].checkOut = checkOut;
        if (remarks) teacher.attendance[attendanceIndex].remarks = remarks;
        
        await teacher.save();
        res.json({ success: true, message: "Attendance updated successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/salary/generate', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { month, year, customSalary } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const startDate = new Date(year, new Date(Date.parse(month + " 1, " + year)).getMonth(), 1);
        const endDate = new Date(year, startDate.getMonth() + 1, 0);
        
        const monthAttendance = teacher.attendance.filter(a => {
            const aDate = new Date(a.date);
            return aDate.getMonth() === startDate.getMonth() && aDate.getFullYear() === year;
        });
        
        let workingDays = 0;
        let presentDays = 0;
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 6) {
                workingDays++;
                const attendanceRecord = monthAttendance.find(a => {
                    const aDate = new Date(a.date);
                    return aDate.getDate() === d.getDate();
                });
                if (attendanceRecord && (attendanceRecord.status === 'present' || attendanceRecord.status === 'holiday')) {
                    presentDays++;
                }
            }
        }
        
        const monthlySalaryRecord = teacher.salary.monthlySalaryHistory.find(
            s => s.month === month && s.year === year
        );
        const baseSalary = customSalary || monthlySalaryRecord?.amount || teacher.salary.defaultSalary;
        
        const calculatedAmount = calculateSalary(baseSalary, workingDays, presentDays);
        
        const existingIndex = teacher.salaryPayments.findIndex(
            s => s.month === month && s.year === year
        );
        
        const salaryRecord = {
            month: month,
            year: year,
            baseSalary: baseSalary,
            workingDays: workingDays,
            presentDays: presentDays,
            calculatedAmount: calculatedAmount,
            paidAmount: 0,
            dueAmount: calculatedAmount,
            status: 'unpaid'
        };
        
        if (existingIndex >= 0) {
            teacher.salaryPayments[existingIndex] = { ...teacher.salaryPayments[existingIndex], ...salaryRecord };
        } else {
            teacher.salaryPayments.push(salaryRecord);
        }
        
        await teacher.save();
        res.json({ success: true, message: "Salary generated successfully", data: salaryRecord });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/salary/pay', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { month, year, paidAmount, paymentMode, remarks } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const salaryIndex = teacher.salaryPayments.findIndex(
            s => s.month === month && s.year === year
        );
        
        if (salaryIndex === -1) {
            return res.status(404).json({ success: false, message: "Salary record not found. Generate first." });
        }
        
        const salary = teacher.salaryPayments[salaryIndex];
        const newPaidAmount = (salary.paidAmount || 0) + paidAmount;
        
        salary.paidAmount = newPaidAmount;
        salary.dueAmount = salary.calculatedAmount - newPaidAmount;
        salary.status = newPaidAmount >= salary.calculatedAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
        salary.paymentDate = new Date();
        salary.paymentMode = paymentMode;
        if (remarks) salary.remarks = remarks;
        
        await teacher.save();
        res.json({ success: true, message: "Salary paid successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/salary/monthly-update', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { month, year, amount } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const existingIndex = teacher.salary.monthlySalaryHistory.findIndex(
            s => s.month === month && s.year === year
        );
        
        if (existingIndex >= 0) {
            teacher.salary.monthlySalaryHistory[existingIndex].amount = amount;
        } else {
            teacher.salary.monthlySalaryHistory.push({ month, year, amount });
        }
        
        await teacher.save();
        res.json({ success: true, message: "Monthly salary updated successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/block', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { reason } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        teacher.status.isBlocked = true;
        teacher.status.blockedReason = reason || "No reason provided";
        teacher.status.blockedAt = new Date();
        
        await teacher.save();
        res.json({ success: true, message: "Teacher blocked successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/unblock', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        teacher.status.isBlocked = false;
        teacher.status.unblockedAt = new Date();
        
        await teacher.save();
        res.json({ success: true, message: "Teacher unblocked successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/notice', verifyToken, async (req, res) => {
    try {
        const { teacherId, title, message, from } = req.body;
        const noticeId = Date.now().toString();
        
        const notice = {
            id: noticeId,
            from: from,
            to: teacherId ? 'teacher' : 'admin',
            title: title,
            message: message,
            sentAt: new Date(),
            isRead: false
        };
        
        if (teacherId) {
            const teacher = await Teacher.findOne({ teacherId: teacherId });
            if (teacher) {
                teacher.notices.push(notice);
                await teacher.save();
            }
        } else {
            const teachers = await Teacher.find({ 'status.isActive': true });
            for (const teacher of teachers) {
                teacher.notices.push(notice);
                await teacher.save();
            }
        }
        
        res.json({ success: true, message: "Notice sent successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/notices', verifyToken, async (req, res) => {
    try {
        const teachers = await Teacher.find({ 'status.isActive': true });
        let allNotices = [];
        
        for (const teacher of teachers) {
            for (const notice of teacher.notices) {
                allNotices.push({
                    ...notice.toObject(),
                    teacherName: teacher.personal.name,
                    teacherId: teacher.teacherId
                });
            }
        }
        
        allNotices.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        res.json({ success: true, data: allNotices });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teacher-login', async (req, res) => {
    try {
        const { teacherId, password } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        
        if (!teacher) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        if (teacher.status.isBlocked) {
            return res.status(401).json({ success: false, message: "Your account is blocked. Contact admin." });
        }
        
        if (teacher.password !== password) {
            teacher.login.loginAttempts += 1;
            await teacher.save();
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        teacher.login.lastLogin = new Date();
        teacher.login.loginAttempts = 0;
        await teacher.save();
        
        const token = jwt.sign(
            { id: teacher._id, teacherId: teacher.teacherId, role: 'teacher' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: "Login successful",
            token,
            teacher: {
                name: teacher.personal.name,
                teacherId: teacher.teacherId
            }
        });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teacher/my-data', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        
        const teacher = await Teacher.findOne({ teacherId: req.user.teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        const data = teacher.toObject();
        delete data.password;
        res.json({ success: true, data });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/teachers/left', verifyToken, async (req, res) => {
    try {
        const teachers = await Teacher.find({ 'status.isActive': false }).sort({ updatedAt: -1 });
        const safeTeachers = teachers.map(t => {
            const obj = t.toObject();
            delete obj.password;
            return obj;
        });
        res.json({ success: true, data: safeTeachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/move-to-left', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { leavingReason, lastWorkingDay } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        teacher.status.isActive = false;
        teacher.status.leavingDate = lastWorkingDay ? new Date(lastWorkingDay) : new Date();
        teacher.status.leavingReason = leavingReason || "No reason provided";
        
        await teacher.save();
        res.json({ success: true, message: "Teacher moved to left list" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/settings/working-days', verifyToken, async (req, res) => {
    try {
        const { startDay, endDay, holidays } = req.body;
        
        await Teacher.updateMany({}, {
            $set: {
                'workingDays.startDay': startDay,
                'workingDays.endDay': endDay,
                'workingDays.isHoliday': holidays || []
            }
        });
        
        res.json({ success: true, message: "Working days updated for all teachers" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/reports/teacher/:id/:type', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const type = req.params.type;
        const { month, year } = req.query;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        let reportData = {};
        
        switch(type) {
            case 'salary':
                const salaryData = teacher.salaryPayments.find(s => s.month === month && s.year === parseInt(year));
                reportData = {
                    teacherName: teacher.personal.name,
                    teacherId: teacher.teacherId,
                    month: month,
                    year: year,
                    ...salaryData
                };
                break;
                
            case 'attendance':
                const startDate = new Date(year, new Date(Date.parse(month + " 1, " + year)).getMonth(), 1);
                const monthAttendance = teacher.attendance.filter(a => {
                    const aDate = new Date(a.date);
                    return aDate.getMonth() === startDate.getMonth() && aDate.getFullYear() === parseInt(year);
                });
                reportData = {
                    teacherName: teacher.personal.name,
                    teacherId: teacher.teacherId,
                    month: month,
                    year: year,
                    attendance: monthAttendance,
                    totalPresent: monthAttendance.filter(a => a.status === 'present').length,
                    totalAbsent: monthAttendance.filter(a => a.status === 'absent').length,
                    totalHolidays: monthAttendance.filter(a => a.status === 'holiday').length,
                    totalLeaves: monthAttendance.filter(a => a.status === 'leave').length
                };
                break;
                
            case 'performance':
                const totalSalaryPaid = teacher.salaryPayments.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
                const totalAttendance = teacher.attendance.length;
                const totalPresent = teacher.attendance.filter(a => a.status === 'present').length;
                reportData = {
                    teacherName: teacher.personal.name,
                    teacherId: teacher.teacherId,
                    joiningDate: teacher.professional.joiningDate,
                    subjects: teacher.professional.subjects,
                    classes: teacher.professional.classes,
                    totalSalaryPaid: totalSalaryPaid,
                    attendancePercentage: totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0,
                    totalStudentsAssigned: 0,
                    performanceRemarks: "Good"
                };
                break;
        }
        
        res.json({ success: true, data: reportData });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/teachers/:id/rejoin', verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { rejoinedAt } = req.body;
        
        const teacher = await Teacher.findOne({ teacherId: teacherId });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        
        teacher.status.isActive = true;
        teacher.status.leavingDate = null;
        teacher.status.leavingReason = null;
        teacher.status.rejoinedAt = rejoinedAt ? new Date(rejoinedAt) : new Date();
        
        await teacher.save();
        res.json({ success: true, message: "Teacher rejoined successfully" });
        
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

console.log('✅ Teacher APIs loaded successfully');

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
    console.log(`\n📱 Screen Management APIs (Base64 Storage):`);
    console.log(`   GET  /api/screen              - Get all screen data`);
    console.log(`   PUT  /api/screen              - Update screen data (Base64)`);
    console.log(`   DELETE /api/screen/gallery/:id - Delete gallery item`);
    console.log(`\n👤 Admin Photo APIs:`);
    console.log(`   GET  /api/admin/profile       - Get admin profile`);
    console.log(`   POST /api/admin/photo         - Update admin photo`);
    console.log(`   GET  /api/admin/photo         - Get admin photo`);
});
