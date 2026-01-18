const fs = require('fs');
require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// ---------------- ENVIRONMENT VALIDATION ----------------
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI environment variable missing!");
    process.exit(1);
}

// ---------------- MIDDLEWARE ----------------
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] // Production domain
        : '*', // Development
    credentials: true
}));

app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ---------------- MONGODB CONNECTION ----------------
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log("✅ Database Connected Successfully"))
.catch(err => {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// ---------------- SCHEMA DEFINITIONS ----------------
const systemConfigSchema = new mongoose.Schema({
    logo: String,
    title: { type: String, required: true },
    sub_title: String,
    contact: String,
    call_no: String,
    gmail: String,
    facebook: String,
    youtube_link: String,
    instagram: String,
    twitter: String,
    help: String,
    admin_name: String,
    groq_key: { type: String, select: false } // Hidden by default for security
});

const classFeeSchema = new mongoose.Schema({
    class_name: { 
        type: String, 
        unique: true,
        required: true 
    },
    monthly_fees: { 
        type: String, 
        required: true 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
});

const teacherSchema = new mongoose.Schema({
    teacher_name: { 
        type: String, 
        required: true 
    },
    mobile: { 
        type: String, 
        required: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    teacher_id: { 
        type: String, 
        unique: true,
        required: true 
    },
    pass: { 
        type: String, 
        required: true 
    },
    photo: String,
    salary: { 
        type: String, 
        required: true 
    },
    joining_date: { 
        type: String, 
        required: true 
    },
    classes: [String],
    subjects: [String],
    paid_months: { 
        type: [Number], 
        default: [] 
    },
    is_active: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
    student_name: { 
        type: String, 
        required: true 
    },
    student_id: { 
        type: String, 
        unique: true,
        required: true 
    },
    pass: { 
        type: String, 
        required: true 
    },
    parent_name: String,
    mobile: { 
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    parent_mobile: { 
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    student_class: { 
        type: String, 
        required: true 
    },
    fees: String,
    joining_date: String,
    total_marks: { 
        type: String, 
        default: "" 
    },
    obtained_marks: { 
        type: String, 
        default: "" 
    },
    exam_date: { 
        type: String, 
        default: "" 
    },
    exam_subject: { 
        type: String, 
        default: "" 
    },
    photo: String,
    paid_months: { 
        type: [Number], 
        default: [] 
    },
    fees_data: { 
        type: Map, 
        of: Object, 
        default: {} 
    },
    is_active: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

const adminProfileSchema = new mongoose.Schema({
    admin_name: { 
        type: String, 
        required: true 
    },
    admin_photo: String,
    admin_userid: { 
        type: String, 
        unique: true,
        required: true 
    },
    admin_pass: { 
        type: String, 
        required: true 
    },
    admin_mobile: { 
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    }
}, { timestamps: true });

const sliderPhotoSchema = new mongoose.Schema({
    photo: { 
        type: String, 
        required: true 
    },
    upload_date: { 
        type: Date, 
        default: Date.now 
    },
    is_active: { 
        type: Boolean, 
        default: true 
    }
});

const classConfigSchema = new mongoose.Schema({
    class_name: { 
        type: String, 
        unique: true,
        required: true 
    },
    banner: String,
    intro_video: String,
    subjects: {
        type: Map,
        of: {
            notes: [String],
            videos: [String]
        },
        default: {}
    },
    is_active: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// ---------------- MODELS ----------------
const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
const ClassFee = mongoose.model('ClassFee', classFeeSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const Student = mongoose.model('Student', studentSchema);
const AdminProfile = mongoose.model('AdminProfile', adminProfileSchema);
const SliderPhoto = mongoose.model('SliderPhoto', sliderPhotoSchema);
const ClassConfig = mongoose.model('ClassConfig', classConfigSchema);

// ---------------- HELPER FUNCTIONS ----------------
const validateRequestBody = (requiredFields) => {
    return (req, res, next) => {
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ 
                    success: false, 
                    error: `${field} is required` 
                });
            }
        }
        next();
    };
};

const generateUniqueId = (prefix) => {
    return prefix + Math.floor(100000 + Math.random() * 900000);
};

// ---------------- HTML ROUTES ----------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ---------------- CONSTANTS ----------------
const ALL_CLASSES = [
    "1st", "2nd", "3rd", "4th", "5th",
    "6th", "7th", "8th", "9th", "10th",
    "I.A.", "I.Sc", "I.Com",
    "B.A.", "B.Sc", "B.Com"
];

const ALL_SUBJECTS = [
    "Hindi", "English", "Math", "Science", "Social Science",
    "Physics", "Chemistry", "Biology",
    "History", "Geography", "Civics", "Economics",
    "Computer", "IT", "GK", "Sanskrit", "Urdu",
    "Accounts", "Business Studies",
    "Political Science", "Psychology",
    "Philosophy", "Sociology",
    "Botany", "Zoology",
    "Statistics", "Reasoning"
];

const AI_MODELS = [
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b"
];

let chatHistory = {};

// ---------------- AI CHAT API ----------------
app.post('/api/ai-chat', async (req, res) => {
    try {
        const { prompt, userId } = req.body;
        
        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                reply: "Prompt is required." 
            });
        }
        
        const id = userId || "default";

        const config = await SystemConfig.findOne().select('+groq_key');
        const apiKey = config?.groq_key;

        if (!apiKey) {
            return res.json({ 
                success: false, 
                reply: "AI service is currently unavailable. Please contact administrator." 
            });
        }

        if (!chatHistory[id]) chatHistory[id] = [];

        // System instruction remains the same
        const systemInstruction = {
            role: "system",
            content: `
            AI ASSISTANT NAME: Bharti
            // ... (your existing system instruction)
            `
        };

        const messages = [
            systemInstruction,
            ...chatHistory[id],
            { role: "user", content: prompt.trim() }
        ];

        let reply = null;

        for (const model of AI_MODELS) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model,
                            messages,
                            temperature: 0.6,
                            max_tokens: 500,
                            top_p: 0.9
                        }),
                        signal: controller.signal
                    }
                );

                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`API responded with status: ${response.status}`);
                }

                const data = await response.json();

                if (!data?.choices?.[0]?.message?.content) {
                    throw new Error("Empty AI response");
                }

                reply = data.choices[0].message.content;
                break;

            } catch (err) {
                console.error(`AI Model ${model} failed:`, err.message);
                continue;
            }
        }

        if (!reply) {
            reply = "AI service is currently busy. Please try again in a few moments.";
        }

        // Clean the response
        reply = reply.replace(/[#*_~`>]/g, "").trim();

        // Maintain chat history
        chatHistory[id].push({ role: "user", content: prompt });
        chatHistory[id].push({ role: "assistant", content: reply });

        if (chatHistory[id].length > 12) {
            chatHistory[id] = chatHistory[id].slice(-12);
        }

        res.json({ 
            success: true, 
            reply 
        });

    } catch (err) {
        console.error("AI Chat Error:", err);
        res.status(500).json({ 
            success: false, 
            reply: "An error occurred while processing your request." 
        });
    }
});

// ---------------- CLASS & FEE MANAGEMENT ----------------
app.get('/api/get-all-classes', (req, res) => {
    res.json({ 
        success: true, 
        classes: ALL_CLASSES 
    });
});

app.get('/api/get-all-subjects', (req, res) => {
    res.json({ 
        success: true, 
        subjects: ALL_SUBJECTS 
    });
});

app.post('/api/update-class-fees', 
    validateRequestBody(['class_name', 'monthly_fees']),
    async (req, res) => {
        try {
            const { class_name, monthly_fees } = req.body;
            
            if (!ALL_CLASSES.includes(class_name)) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Invalid class name" 
                });
            }

            await ClassFee.findOneAndUpdate(
                { class_name },
                { 
                    class_name, 
                    monthly_fees,
                    updated_at: Date.now()
                },
                { upsert: true, new: true }
            );
            
            res.json({ 
                success: true, 
                message: "Fees updated successfully" 
            });
        } catch (err) {
            console.error("Update Class Fees Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to update fees" 
            });
        }
    }
);

app.get('/api/get-class-fees', async (req, res) => {
    try {
        const fees = await ClassFee.find().sort({ class_name: 1 });
        res.json({ 
            success: true, 
            data: fees 
        });
    } catch (err) {
        console.error("Get Class Fees Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch fees data" 
        });
    }
});

// ---------------- STUDENT MANAGEMENT ----------------
app.post('/api/student-reg', 
    validateRequestBody(['student_name', 'student_class']),
    async (req, res) => {
        try {
            const data = req.body;
            
            // Validate class
            if (!ALL_CLASSES.includes(data.student_class)) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Invalid class" 
                });
            }

            // Generate unique ID with retry logic
            let isUnique = false;
            let finalId = data.student_id || generateUniqueId("STU");
            let attempts = 0;
            const maxAttempts = 5;

            while (!isUnique && attempts < maxAttempts) {
                const check = await Student.findOne({ student_id: finalId });
                if (!check) {
                    isUnique = true;
                } else {
                    finalId = generateUniqueId("STU");
                    attempts++;
                }
            }

            if (!isUnique) {
                return res.status(500).json({ 
                    success: false, 
                    error: "Failed to generate unique student ID" 
                });
            }

            data.student_id = finalId;
            
            // Set default password if not provided
            if (!data.pass) {
                data.pass = "student123"; // Default password, should be changed
            }

            const newStudent = new Student(data);
            await newStudent.save();
            
            res.json({ 
                success: true, 
                student_id: finalId,
                message: "Student registered successfully" 
            });
        } catch (err) {
            console.error("Student Registration Error:", err);
            
            if (err.code === 11000) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Student ID already exists" 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                error: "Failed to register student" 
            });
        }
    }
);

app.get('/api/get-students', async (req, res) => {
    try {
        const { class: studentClass, active } = req.query;
        let query = { is_active: true };
        
        if (studentClass) {
            query.student_class = studentClass;
        }
        
        if (active === 'false') {
            query.is_active = false;
        } else if (active === 'all') {
            delete query.is_active;
        }
        
        const students = await Student.find(query)
            .sort({ student_class: 1, student_name: 1 })
            .select('-pass -__v'); // Exclude sensitive data
        
        res.json({ 
            success: true, 
            count: students.length,
            data: students 
        });
    } catch (err) {
        console.error("Get Students Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch students" 
        });
    }
});

app.post('/api/search-student-result', async (req, res) => {
    try {
        const { searchTerm, mobileSearch } = req.body;
        
        if (!searchTerm) {
            return res.status(400).json({ 
                success: false, 
                message: "Search term is required" 
            });
        }

        let query = { is_active: true };

        // Search by ID only (no mobile required)
        if (searchTerm.startsWith('STU') || /^\d+$/.test(searchTerm)) {
            query.student_id = searchTerm;
            query.exam_date = { $ne: "" };
            
            const student = await Student.findOne(query);
            
            if (student) {
                return res.json({ 
                    success: true, 
                    student: student 
                });
            }
        }

        // Search by name and mobile
        if (searchTerm && mobileSearch) {
            query.$and = [
                { exam_date: { $ne: "" } },
                { student_name: { $regex: new RegExp(searchTerm, 'i') } },
                {
                    $or: [
                        { mobile: mobileSearch },
                        { parent_mobile: mobileSearch }
                    ]
                }
            ];

            const student = await Student.findOne(query);
            
            if (student) {
                return res.json({ 
                    success: true, 
                    student: student 
                });
            }
        } else if (searchTerm) {
            // If only name provided without mobile
            return res.json({ 
                success: false, 
                message: "Please provide mobile number for name search" 
            });
        }

        res.json({ 
            success: false, 
            message: "No matching student found with exam results" 
        });

    } catch (err) {
        console.error("Search Student Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Search failed" 
        });
    }
});

app.post('/api/update-student-data', 
    validateRequestBody(['student_id']),
    async (req, res) => {
        try {
            const { student_id, ...updateData } = req.body;
            
            // Prevent updating sensitive fields
            delete updateData._id;
            delete updateData.createdAt;
            delete updateData.updatedAt;
            
            const updatedStudent = await Student.findOneAndUpdate(
                { student_id },
                updateData,
                { new: true, runValidators: true }
            );
            
            if (!updatedStudent) {
                return res.status(404).json({ 
                    success: false, 
                    error: "Student not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Student updated successfully",
                data: updatedStudent 
            });
        } catch (err) {
            console.error("Update Student Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to update student" 
            });
        }
    }
);

app.post('/api/delete-student', 
    validateRequestBody(['student_id']),
    async (req, res) => {
        try {
            const { student_id } = req.body;
            
            // Soft delete (mark as inactive)
            const deletedStudent = await Student.findOneAndUpdate(
                { student_id },
                { is_active: false },
                { new: true }
            );
            
            if (!deletedStudent) {
                return res.status(404).json({ 
                    success: false, 
                    error: "Student not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Student deactivated successfully" 
            });
        } catch (err) {
            console.error("Delete Student Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to delete student" 
            });
        }
    }
);

app.post('/api/update-student-fees', 
    validateRequestBody(['student_id', 'month', 'field']),
    async (req, res) => {
        try {
            const { student_id, month, field, value } = req.body;
            
            if (!month.match(/^(0?[1-9]|1[0-2])-20\d{2}$/)) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Invalid month format. Use MM-YYYY" 
                });
            }
            
            const updateKey = `fees_data.${month}.${field}`;
            const updatedStudent = await Student.findOneAndUpdate(
                { student_id },
                { $set: { [updateKey]: value } },
                { new: true }
            );
            
            if (!updatedStudent) {
                return res.status(404).json({ 
                    success: false, 
                    error: "Student not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Fees updated successfully" 
            });
        } catch (err) {
            console.error("Update Student Fees Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to update fees" 
            });
        }
    }
);

app.post('/api/update-fees-status', 
    validateRequestBody(['student_id', 'month']),
    async (req, res) => {
        try {
            const { student_id, month, status } = req.body;
            
            const monthNumber = parseInt(month.split('-')[0]);
            const operator = status ? "$addToSet" : "$pull";
            
            const updatedStudent = await Student.findOneAndUpdate(
                { student_id },
                { [operator]: { paid_months: monthNumber } },
                { new: true }
            );
            
            if (!updatedStudent) {
                return res.status(404).json({ 
                    success: false, 
                    error: "Student not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: `Fees status updated for ${month}` 
            });
        } catch (err) {
            console.error("Update Fees Status Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to update fees status" 
            });
        }
    }
);

app.delete('/api/delete-class/:className', async (req, res) => {
    try {
        const { className } = req.params;
        
        if (!ALL_CLASSES.includes(className)) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid class name" 
            });
        }
        
        // Mark all students of this class as inactive
        const result = await Student.updateMany(
            { student_class: className },
            { is_active: false }
        );
        
        res.json({ 
            success: true, 
            message: `All students from class ${className} have been deactivated.`,
            deactivatedCount: result.modifiedCount 
        });
    } catch (err) {
        console.error("Delete Class Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to deactivate class students" 
        });
    }
});

// ---------------- TEACHER MANAGEMENT ----------------
app.post('/api/teacher-reg', 
    validateRequestBody(['teacher_name', 'mobile', 'teacher_id', 'pass', 'salary']),
    async (req, res) => {
        try {
            const teacherData = req.body;
            
            // Generate teacher ID if not provided
            if (!teacherData.teacher_id) {
                teacherData.teacher_id = generateUniqueId("TCH");
            }
            
            const newTeacher = new Teacher(teacherData);
            await newTeacher.save();
            
            res.json({ 
                success: true, 
                teacher_id: teacherData.teacher_id,
                message: "Teacher registered successfully" 
            });
        } catch (err) {
            console.error("Teacher Registration Error:", err);
            
            if (err.code === 11000) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Teacher ID already exists" 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                error: "Failed to register teacher" 
            });
        }
    }
);

app.get('/api/get-teachers', async (req, res) => {
    try {
        const { active } = req.query;
        let query = { is_active: true };
        
        if (active === 'false') {
            query.is_active = false;
        } else if (active === 'all') {
            delete query.is_active;
        }
        
        const teachers = await Teacher.find(query)
            .sort({ teacher_name: 1 })
            .select('-pass -__v'); // Exclude sensitive data
        
        res.json({ 
            success: true, 
            count: teachers.length,
            data: teachers 
        });
    } catch (err) {
        console.error("Get Teachers Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch teachers" 
        });
    }
});

app.post('/api/update-teacher-data', 
    validateRequestBody(['teacher_id']),
    async (req, res) => {
        try {
            const { teacher_id, ...updateData } = req.body;
            
            // Prevent updating sensitive fields
            delete updateData._id;
            delete updateData.createdAt;
            delete updateData.updatedAt;
            
            const updatedTeacher = await Teacher.findOneAndUpdate(
                { teacher_id },
                { $set: updateData },
                { new: true, runValidators: true }
            );
            
            if (!updatedTeacher) {
                return res.status(404).json({ 
                    success: false, 
                    error: "Teacher not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Teacher updated successfully",
                data: updatedTeacher 
            });
        } catch (err) {
            console.error("Update Teacher Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to update teacher" 
            });
        }
    }
);

app.delete('/api/delete-teacher', 
    validateRequestBody(['teacher_id']),
    async (req, res) => {
        try {
            const { teacher_id } = req.body;
            
            // Soft delete
            const deletedTeacher = await Teacher.findOneAndUpdate(
                { teacher_id },
                { is_active: false },
                { new: true }
            );
            
            if (!deletedTeacher) {
                return res.status(404).json({ 
                    success: false, 
                    error: "Teacher not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Teacher deactivated successfully" 
            });
        } catch (err) {
            console.error("Delete Teacher Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to delete teacher" 
            });
        }
    }
);

app.post('/api/update-salary-status', 
    validateRequestBody(['teacher_id', 'month']),
    async (req, res) => {
        try {
            const { teacher_id, month, status } = req.body;
            const operator = status ? "$addToSet" : "$pull";
            
            const updatedTeacher = await Teacher.findOneAndUpdate(
                { teacher_id },
                { [operator]: { paid_months: month } },
                { new: true }
            );
            
            if (!updatedTeacher) {
                return res.status(404).json({ 
                    success: false, 
                    error: "Teacher not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: `Salary status updated for month ${month}` 
            });
        } catch (err) {
            console.error("Update Salary Status Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to update salary status" 
            });
        }
    }
);

// ---------------- SYSTEM CONFIGURATION ----------------
app.get('/api/get-settings', async (req, res) => {
    try {
        const settings = await SystemConfig.findOne().select('-groq_key -__v');
        
        res.json({ 
            success: true, 
            data: settings || {} 
        });
    } catch (err) {
        console.error("Get Settings Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch settings" 
        });
    }
});

app.post('/api/update-settings', async (req, res) => {
    try {
        const settings = req.body;
        
        const updatedSettings = await SystemConfig.findOneAndUpdate(
            {},
            settings,
            { 
                upsert: true, 
                new: true,
                setDefaultsOnInsert: true 
            }
        );
        
        res.json({ 
            success: true, 
            message: "Settings updated successfully",
            data: updatedSettings 
        });
    } catch (err) {
        console.error("Update Settings Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to update settings" 
        });
    }
});

app.get('/api/get-admin-profile', async (req, res) => {
    try {
        const profile = await AdminProfile.findOne().select('-admin_pass -__v');
        
        res.json({ 
            success: true, 
            data: profile || {} 
        });
    } catch (err) {
        console.error("Get Admin Profile Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch admin profile" 
        });
    }
});

app.post('/api/update-admin-profile', 
    validateRequestBody(['admin_name', 'admin_userid']),
    async (req, res) => {
        try {
            const profile = req.body;
            
            const updatedProfile = await AdminProfile.findOneAndUpdate(
                {},
                profile,
                { 
                    upsert: true, 
                    new: true,
                    runValidators: true 
                }
            );
            
            res.json({ 
                success: true, 
                message: "Admin profile updated successfully",
                data: updatedProfile 
            });
        } catch (err) {
            console.error("Update Admin Profile Error:", err);
            
            if (err.code === 11000) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Admin user ID already exists" 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                error: "Failed to update admin profile" 
            });
        }
    }
);

// ---------------- SLIDER MANAGEMENT ----------------
app.post('/api/add-slider', 
    validateRequestBody(['photo']),
    async (req, res) => {
        try {
            const { photo } = req.body;
            
            const newSlider = new SliderPhoto({ photo });
            await newSlider.save();
            
            res.json({ 
                success: true, 
                message: "Slider photo added successfully",
                id: newSlider._id 
            });
        } catch (err) {
            console.error("Add Slider Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to add slider photo" 
            });
        }
    }
);

app.get('/api/get-sliders', async (req, res) => {
    try {
        const { limit } = req.query;
        let query = SliderPhoto.find({ is_active: true });
        
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        
        const sliders = await query.sort({ upload_date: -1 });
        
        res.json({ 
            success: true, 
            count: sliders.length,
            data: sliders 
        });
    } catch (err) {
        console.error("Get Sliders Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch sliders" 
        });
    }
});

app.delete('/api/delete-slider/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Soft delete
        const deletedSlider = await SliderPhoto.findByIdAndUpdate(
            id,
            { is_active: false },
            { new: true }
        );
        
        if (!deletedSlider) {
            return res.status(404).json({ 
                success: false, 
                error: "Slider not found" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Slider photo removed successfully" 
        });
    } catch (err) {
        console.error("Delete Slider Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to delete slider" 
        });
    }
});

// ---------------- CLASS CONFIGURATION ----------------
app.post('/api/save-class-config', 
    validateRequestBody(['class_name']),
    async (req, res) => {
        try {
            const config = req.body;
            
            if (!ALL_CLASSES.includes(config.class_name)) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Invalid class name" 
                });
            }
            
            const updatedConfig = await ClassConfig.findOneAndUpdate(
                { class_name: config.class_name },
                config,
                { 
                    upsert: true, 
                    new: true,
                    runValidators: true 
                }
            );
            
            res.json({ 
                success: true, 
                message: "Class configuration saved successfully",
                data: updatedConfig 
            });
        } catch (err) {
            console.error("Save Class Config Error:", err);
            res.status(500).json({ 
                success: false, 
                error: "Failed to save class configuration" 
            });
        }
    }
);

app.get('/api/get-all-class-configs', async (req, res) => {
    try {
        const configs = await ClassConfig.find({ is_active: true });
        const configMap = {};
        
        configs.forEach(c => {
            configMap[c.class_name] = c;
        });
        
        res.json({ 
            success: true, 
            count: configs.length,
            data: configMap 
        });
    } catch (err) {
        console.error("Get Class Configs Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch class configurations" 
        });
    }
});

// ---------------- HEALTH CHECK ----------------
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const memoryUsage = process.memoryUsage();
        
        res.json({
            success: true,
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            status: 'ERROR',
            error: err.message
        });
    }
});

// ---------------- ERROR HANDLING ----------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found"
    });
});

app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ---------------- SERVER START ----------------
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server gracefully...');
    server.close(() => {
        console.log('HTTP server closed.');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Closing server gracefully...');
    server.close(() => {
        console.log('HTTP server closed.');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
});
