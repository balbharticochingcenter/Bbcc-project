const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet'); // Security Headers
const rateLimit = require('express-rate-limit'); // Stop Spamming

// ============================================
// 📦 NEW PACKAGES ADDED FOR SECURITY
// ============================================
const bcrypt = require('bcrypt'); // Password hashing ke liye
const jwt = require('jsonwebtoken'); // Token based authentication ke liye
const Joi = require('joi'); // Input validation ke liye

dotenv.config();
const app = express();

// --- SECURITY MIDDLEWARES ---
app.use(helmet()); // XSS aur baaki attacks se bachata hai
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate Limiter: Ek IP se 15 minute mein sirf 100 requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 
});
app.use('/api/', limiter);

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Secure Connection Established"))
  .catch(err => console.log("❌ DB Error"));

// ============================================
// 🆕 CREATE DEFAULT ADMIN (SIRF EK BAAR CHALEGA)
// ============================================
async function createDefaultAdmin() {
    try {
        const Admin = mongoose.model('Admin'); // Model load karo
        const adminExists = await Admin.findOne({ adminID: 'admin' });
        
        if (!adminExists) {
            // Password hash karo plain text store karne se better hai
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const newAdmin = new Admin({
                adminID: 'admin',
                pws: hashedPassword // Hashed password store karo
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
        required: true, // Ab ye field mandatory hai
        trim: true // Extra spaces remove kar deta hai
    },
    title: { 
        type: String, 
        required: true 
    },
    subTitle: String,
    aboutText: String,
    slides: [{
        type: String,
        validate: {
            validator: function(v) {
                // Basic URL validation
                return !v || /^https?:\/\//.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    }],  // Photo URLs ki array
    whatsapp: String, 
    insta: String, 
    fb: String, 
    twitter: String
}, { 
    timestamps: true // Automatically add createdAt and updatedAt fields
});

const WebConfig = mongoose.model('WebConfig', WebConfigSchema);

app.get('/api/config', async (req, res) => {
    try {
        const config = await WebConfig.findOne().lean(); // lean() performance badhata hai
        res.json(config);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

/////////////////////////////////////////// Admin page /////////////////////

// 1. Admin Schema - IMPROVED WITH VALIDATION
const AdminSchema = new mongoose.Schema({
    adminID: { 
        type: String, 
        required: true, 
        unique: true, // Duplicate IDs allow nahi honge
        trim: true 
    },
    pws: { 
        type: String, 
        required: true 
    }
}, {
    timestamps: true // Pata chalega ki admin kab banaya gaya
});

const Admin = mongoose.model('Admin', AdminSchema);

// ============================================
// 🆕 CALL DEFAULT ADMIN CREATION FUNCTION
// ============================================
// Wait for connection to be established then create admin
mongoose.connection.once('open', () => {
    createDefaultAdmin();
});

// ============================================
// 🆕 LOGIN RATE LIMITER - BRUTE FORCE ATTACKS SE BACHATA HAI
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Sirf 5 attempts allowed
    skipSuccessfulRequests: true, // Successful login count nahi hoga
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
                    process.env.JWT_SECRET || 'fallback_secret_change_this', // .env se lena chahiye
                    { expiresIn: '1h' } // Token 1 ghante mein expire ho jayega
                );
                
                res.json({ 
                    success: true, 
                    message: "Login Successful",
                    token: token // Frontend ko token bhejo
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
    // Token usually Authorization header mein aata hai
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" se sirf TOKEN nikalna
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Access denied. No token provided." 
        });
    }
    
    // Token verify karo
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_this', (err, decoded) => {
        if (err) {
            // Token expired ya invalid hai
            return res.status(403).json({ 
                success: false, 
                message: "Invalid or expired token. Please login again." 
            });
        }
        
        // Token valid hai, user info request mein add karo
        req.user = decoded;
        next(); // Agle middleware ya route pe chale jao
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
        // 🔒 TOKEN CHECK - Ab ye secure ho gaya
        // verifyToken middleware automatically check kar lega
        
        // 📝 INPUT VALIDATION - Pehle data validate karo
        const { error, value } = configUpdateSchema.validate(req.body);
        
        if (error) {
            // Validation failed
            return res.status(400).json({ 
                success: false, 
                message: "Validation Error: " + error.details[0].message 
            });
        }
        
        // ✅ VALIDATION PASS - Ab database update karo
        const updatedData = value; // Validated data use karo
        
        const config = await WebConfig.findOneAndUpdate(
            {}, // Empty filter = pehli document
            updatedData, 
            { 
                upsert: true, // Agar nahi hai toh create karo
                new: true, // Updated document return karo
                runValidators: true // Schema validators bhi run karo
            }
        );
        
        // Log for tracking
        console.log(`✅ Website updated by admin: ${req.user.adminID} at ${new Date().toLocaleString()}`);
        
        res.json({ 
            success: true, 
            message: "Website Updated Successfully!",
            data: config // Updated data bhejo confirmation ke liye
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
// 🆕 VERIFY TOKEN API (OPTIONAL - DEBUGGING KE LIYE)
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
// 🆕 CHANGE PASSWORD API (RECOMMENDED)
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
// 🆕 GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error("Global Error:", err.stack);
    res.status(500).json({ 
        success: false, 
        message: "Something went wrong! Please try again later." 
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔐 Secure Server running on port ${PORT}`));
