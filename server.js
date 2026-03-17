const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet'); // Security Headers
const rateLimit = require('express-rate-limit'); // Stop Spamming
const crypto = require('crypto'); // For generating nonces

// ============================================
// 📦 NEW PACKAGES ADDED FOR SECURITY
// ============================================
const bcrypt = require('bcrypt'); // Password hashing ke liye
const jwt = require('jsonwebtoken'); // Token based authentication ke liye
const Joi = require('joi'); // Input validation ke liye

dotenv.config();
const app = express();

// ============================================
// 🆕 GENERATE NONCE FOR CSP
// ============================================
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// ============================================
// ✅ FIXED HELMET CONFIGURATION - CSP ISSUE SOLVED
// ============================================
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",  // For inline scripts
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
    origin: '*', // Allow all origins (for development)
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Rate Limiter: Ek IP se 15 minute mein sirf 100 requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Secure Connection Established"))
    .catch(err => console.log("❌ DB Error:", err.message));

// ============================================
// 🆕 CREATE DEFAULT ADMIN (SIRF EK BAAR CHALEGA)
// ============================================
async function createDefaultAdmin() {
    try {
        // Check if Admin model exists
        if (!mongoose.models.Admin) {
            console.log("⏳ Admin model not ready yet...");
            return;
        }
        
        const Admin = mongoose.model('Admin');
        const adminExists = await Admin.findOne({ adminID: 'admin' });
        
        if (!adminExists) {
            // Password hash karo
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const newAdmin = new Admin({
                adminID: 'admin',
                pws: hashedPassword
            });
            
            await newAdmin.save();
            console.log("✅ Default Admin Created: Username = admin, Password = admin123");
            console.log("⚠️ PLEASE CHANGE PASSWORD AFTER FIRST LOGIN!");
        } else {
            console.log("✅ Admin already exists, skipping creation");
        }
    } catch (err) {
        console.log("❌ Admin creation error:", err.message);
    }
}

/////////////////////////////////////////// index page /////////////////////
// Schema (Same as before) - IMPROVED WITH VALIDATION
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

// Initialize default config if none exists
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

app.get('/api/config', async (req, res) => {
    try {
        let config = await WebConfig.findOne().lean();
        
        // Agar config nahi hai toh default bana do
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

/////////////////////////////////////////// Admin page /////////////////////

// 1. Admin Schema - IMPROVED WITH VALIDATION
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
// 🆕 CALL DEFAULT ADMIN CREATION FUNCTION
// ============================================
mongoose.connection.once('open', async () => {
    console.log("🔄 MongoDB connected, initializing data...");
    await createDefaultAdmin();
    await initializeDefaultConfig();
});

// ============================================
// 🆕 LOGIN RATE LIMITER
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

// 2. Login API Route - UPDATED WITH BCRYPT + JWT
app.post('/api/admin-login', loginLimiter, async (req, res) => {
    const { userid, password } = req.body;
    
    // Input validation
    if (!userid || !password) {
        return res.status(400).json({
            success: false,
            message: "User ID and Password are required!"
        });
    }
    
    try {
        // Pehle admin find karo sirf ID se
        const admin = await Admin.findOne({ adminID: userid });
        
        // Agar admin mil gaya toh password check karo
        if (admin) {
            // Compare password with hashed password
            const isPasswordValid = await bcrypt.compare(password, admin.pws);
            
            if (isPasswordValid) {
                // Generate JWT token
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
                // Wrong password
                res.status(401).json({
                    success: false,
                    message: "Wrong ID or Password!"
                });
            }
        } else {
            // Admin not found
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

// ============================================
// 🆕 TOKEN VERIFICATION MIDDLEWARE
// ============================================
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

// ============================================
// 🆕 CONFIG UPDATE VALIDATION SCHEMA
// ============================================
const configUpdateSchema = Joi.object({
    logoText: Joi.string().required().messages({
        'string.empty': 'Logo text cannot be empty',
        'any.required': 'Logo text is required'
    }),
    title: Joi.string().required(),
    subTitle: Joi.string().allow('').optional(),
    aboutText: Joi.string().allow('').optional(),
    whatsapp: Joi.string().uri().allow('').optional(),
    insta: Joi.string().uri().allow('').optional(),
    fb: Joi.string().uri().allow('').optional(),
    twitter: Joi.string().uri().allow('').optional(),
    slides: Joi.array().items(Joi.string().uri()).optional()
});

///////////////////////////////////////////////////////////////////////////////////admin page for edit hedar and footer////////////////////
// Data Update karne ki Secure API - UPDATED WITH TOKEN AUTH + VALIDATION
app.post('/api/update-config', verifyToken, async (req, res) => {
    try {
        // 📝 INPUT VALIDATION
        const { error, value } = configUpdateSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: " + error.details[0].message
            });
        }
        
        // ✅ VALIDATION PASS - Ab database update karo
        const config = await WebConfig.findOneAndUpdate(
            {},
            value,
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );
        
        console.log(`✅ Website updated by admin: ${req.user.adminID} at ${new Date().toLocaleString()}`);
        
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
// 🆕 VERIFY TOKEN API
// ============================================
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
// 🆕 CHANGE PASSWORD API
// ============================================
app.post('/api/change-password', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        // Validation
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
        
        // Admin find karo
        const admin = await Admin.findById(req.user.id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
        
        // Old password verify karo
        const isPasswordValid = await bcrypt.compare(oldPassword, admin.pws);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect"
            });
        }
        
        // New password hash karo
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
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
// 🆕 HEALTH CHECK API
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 🆕 GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error("Global Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong! Please try again later."
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});
////////////////////register student ///////////////////////////////////////////////////////////////

const StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    photo: String,
    studentName: {
        first: String,
        middle: String,
        last: String
    },
    mobile: String,
    aadharNumber: String,
    aadharDocument: String,
    registrationDate: { type: Date, required: true },
    joiningDate: { type: Date, required: true },
    fees: { type: Number, default: 0 }, // ✅ Default 0
    fatherName: {
        first: String,
        middle: String,
        last: String
    },
    fatherMobile: String,
    motherName: {
        first: String,
        middle: String,
        last: String
    },
    address: {
        current: String,
        permanent: String
    },
    education: {
        board: String,
        class: String
    }
}, { timestamps: true });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🔐 Secure Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
