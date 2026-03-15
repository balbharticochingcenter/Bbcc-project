const fs = require('fs');
require('dotenv').config();
const { AccessToken } = require("livekit-server-sdk");

const fetch = require('node-fetch');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- MONGODB ----------------
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Database Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// ---------------- SCHEMAS ----------------
const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({
    logo: String, title: String, sub_title: String,
    contact: String, call_no: String, gmail: String,
    facebook: String, youtube_link: String, instagram: String,
    twitter: String, help: String, admin_name: String,
    groq_key: String
}));
const ClassFee = mongoose.model('ClassFee', new mongoose.Schema({
    class_name: { type: String, unique: true },
    monthly_fees: String
}));



const Teacher = mongoose.model('Teacher', new mongoose.Schema({
    teacher_name: String,
    mobile: String,
    teacher_id: { type: String, unique: true },
    pass: String,
    photo: String,
    salary: String,
    joining_date: String,
    classes: [String],
    subjects: [String],
    paid_months: { type: [Number], default: [] }
}));
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// ==================== SCHEMAS ====================

// 1. Student Schema
const studentSchema = new mongoose.Schema({
    student_name: { type: String, required: true },
    student_id: { type: String, unique: true },
    pass: String,
    parent_name: String,
    mobile: String,
    parent_mobile: String,
    student_class: String,
    fees: { type: String, default: "0" },
    joining_date: String,
    total_marks: { type: String, default: "" },
    obtained_marks: { type: String, default: "" },
    exam_date: { type: String, default: "" },
    exam_subject: { type: String, default: "" },
    photo: String, // Base64 string from frontend
    paid_months: { type: [Number], default: [] },
    fees_data: { type: Map, of: Object, default: {} },
    
    // Naye Fields
    roll_number: { type: String, unique: true },
    batch_year: { type: String, default: "2024" },
    doj: { type: Date, default: Date.now },
    promoted_from: { type: String, default: "" },
    current_status: { type: String, default: "Active" },
    address: String,
    last_payment_date: Date,
    total_paid: { type: Number, default: 0 },
    due_amount: { type: Number, default: 0 },
    payment_history: [
        {
            month: Number,
            year: Number,
            amount: Number,
            payment_date: { type: Date, default: Date.now },
            mode: { type: String, default: "Cash" },
            receipt_no: String
        }
    ]
});

const Student = mongoose.model('Student', studentSchema);

// 2. StudentBatch Schema (Inventory of Classes/Batches)
const StudentBatch = mongoose.model('StudentBatch', new mongoose.Schema({
    class_name: { type: String, required: true },
    batch_year: { type: String, required: true },
    class_fee: { type: Number, required: true },
    start_date: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
    students_count: { type: Number, default: 0 }
}));

// ==================== APIS ====================

// 1. Get all classes with batches
app.get('/api/student-dashboard/classes', async (req, res) => {
    try {
        // Distinct classes find karein
        const classList = await Student.distinct('student_class');
        
        const classesWithBatches = await Promise.all(
            classList.map(async (clsName) => {
                const batches = await Student.find({ student_class: clsName }).distinct('batch_year');
                
                return {
                    class_name: clsName,
                    batches: batches.map(b => ({
                        year: b || "2024",
                        fee: "Check Student Record" 
                    }))
                };
            })
        );
        res.json({ success: true, classes: classesWithBatches });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Fetch Students with Pagination & Filters
app.get('/api/student-dashboard/students', async (req, res) => {
    try {
        const { class_name, batch_year, page = 1, limit = 10 } = req.query;
        const filter = { student_class: class_name };
        if (batch_year) filter.batch_year = batch_year;

        const total = await Student.countDocuments(filter);
        const students = await Student.find(filter)
            .sort({ roll_number: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            students,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Add Student (Auto-ID & Auto-Roll Generation)
app.post('/api/student-dashboard/add-student', async (req, res) => {
    try {
        const data = req.body;

        // Auto ID
        if (!data.student_id) data.student_id = 'STU' + Date.now().toString().slice(-6);

        // Auto Roll Number Logic
        if (!data.roll_number) {
            const lastStudent = await Student.findOne({ 
                student_class: data.student_class, 
                batch_year: data.batch_year 
            }).sort({ roll_number: -1 });

            let nextNum = 1;
            if (lastStudent && lastStudent.roll_number) {
                const match = lastStudent.roll_number.match(/\d+/);
                nextNum = match ? parseInt(match[0]) + 1 : 1;
            }
            data.roll_number = `BB${nextNum.toString().padStart(3, '0')}`;
        }

        data.due_amount = parseFloat(data.fees) || 0;
        
        const newStudent = new Student(data);
        await newStudent.save();
        res.json({ success: true, message: 'Student added!', student_id: data.student_id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Record Payment & Update Balances
app.post('/api/student-dashboard/record-payment', async (req, res) => {
    try {
        const { student_id, month, year, amount, mode } = req.body;
        const student = await Student.findOne({ student_id });

        if (!student) return res.status(404).json({ message: 'Not found' });

        const payment = {
            month: parseInt(month),
            year: parseInt(year),
            amount: parseFloat(amount),
            payment_date: new Date(),
            mode: mode || "Cash",
            receipt_no: "REC" + Date.now().toString().slice(-5)
        };

        student.payment_history.push(payment);
        student.total_paid += payment.amount;
        student.due_amount = Math.max(0, (parseFloat(student.fees) || 0) - student.total_paid);
        student.last_payment_date = new Date();

        if (!student.paid_months.includes(payment.month)) {
            student.paid_months.push(payment.month);
        }

        await student.save();
        res.json({ success: true, message: 'Payment recorded!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Bulk Promote Students
app.post('/api/student-dashboard/bulk-promote', async (req, res) => {
    try {
        const { student_ids, new_class, new_batch, new_fees } = req.body;
        
        for (const id of student_ids) {
            const oldStudent = await Student.findOne({ student_id: id });
            if (!oldStudent) continue;

            // Naya record create karein (History maintain karne ke liye)
            const promotedData = oldStudent.toObject();
            delete promotedData._id;
            
            promotedData.student_class = new_class;
            promotedData.batch_year = new_batch;
            promotedData.fees = new_fees;
            promotedData.total_paid = 0; // Reset for new class
            promotedData.due_amount = parseFloat(new_fees);
            promotedData.payment_history = [];
            promotedData.paid_months = [];
            promotedData.promoted_from = id;
            promotedData.student_id = 'STU' + Math.random().toString(36).substr(2, 9).toUpperCase();

            const newStudent = new Student(promotedData);
            await newStudent.save();
        }

        res.json({ success: true, message: 'Students promoted successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Delete Student
app.delete('/api/student-dashboard/delete-student/:id', async (req, res) => {
    try {
        await Student.findOneAndDelete({ student_id: req.params.id });
        res.json({ success: true, message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7. Get Fees details
app.get('/api/student-dashboard/fees/:id', async (req, res) => {
    try {
        const student = await Student.findOne({ student_id: req.params.id });
        if (!student) return res.status(404).json({ message: 'Not found' });

        res.json({
            success: true,
            student: {
                name: student.student_name,
                class: student.student_class,
                batch: student.batch_year,
                total_fees: student.fees,
                total_paid: student.total_paid,
                due_amount: student.due_amount
            },
            payment_history: student.payment_history,
            fee_summary: {
                total_fees: student.fees,
                total_paid: student.total_paid,
                due_amount: student.due_amount
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/////////////////////////////////////////////////////////////////////////////////
const AdminProfile = mongoose.model('AdminProfile', new mongoose.Schema({
    admin_name: String,
    admin_photo: String,
    admin_userid: { type: String, unique: true },
    admin_pass: String,
    admin_mobile: String
}));

const SliderPhoto = mongoose.model('SliderPhoto', new mongoose.Schema({
    photo: String,
    upload_date: { type: Date, default: Date.now }
}));

const ClassConfig = mongoose.model('ClassConfig', new mongoose.Schema({
    class_name: { type: String, unique: true },

    banner: String,
    intro_video: String,
batch_start_date: Date,
    subjects: {
        type: Map,
        of: {
            notes: [String],   // base64 pdf
            videos: [String]   // youtube links
        }
    }
}));
app.get('/api/get-all-subjects', (req, res) => {
    res.json([
        "Hindi","English","Math","Science","Social Science",
        "Physics","Chemistry","Biology",
        "History","Geography","Civics","Economics",
        "Computer","IT","GK","Sanskrit","Urdu",
        "Accounts","Business Studies",
        "Political Science","Psychology",
        "Philosophy","Sociology",
        "Botany","Zoology",
        "Statistics","Reasoning"
    ]);
});


// ---------------- HTML ROUTES ----------------
// Student के साथ Class का batch_start_date भी fetch करने के लिए API बनाएँ
app.get('/api/get-students-with-batchdate', async (req, res) => {
    try {
        // Sab students fetch karo
        const students = await Student.find().sort({ _id: -1 });
        
        // Sab classes ka config fetch karo
        const classConfigs = await ClassConfig.find();
        const classConfigMap = {};
        
        // Map banayein: class_name -> batch_start_date
        classConfigs.forEach(config => {
            if (config.class_name) {
                classConfigMap[config.class_name] = {
                    batch_start_date: config.batch_start_date || null
                };
            }
        });
        
        // Har student ke saath uska class batch date add karo
        const studentsWithBatchDate = students.map(student => {
            const classInfo = classConfigMap[student.student_class] || {};
            return {
                ...student.toObject(),
                class_batch_start_date: classInfo.batch_start_date
            };
        });
        
        res.json(studentsWithBatchDate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ✅ Students ka batch date update karne ka API
app.post('/api/update-class-batch-date', async (req, res) => {
    try {
        const { class_name, batch_start_date } = req.body;
        
        if (!class_name || !batch_start_date) {
            return res.status(400).json({ error: "Class name aur batch date required hai" });
        }
        
        // Sirf ClassConfig update karo, students ke existing joining_date ko nahi change karo
        await ClassConfig.findOneAndUpdate(
            { class_name },
            { batch_start_date },
            { upsert: true }
        );
        
        res.json({ 
            success: true, 
            message: `Class ${class_name} ka batch date update ho gaya` 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
async function getClassBatchDate(className) {
    try {
        const res = await fetch(API + '/api/get-all-class-configs');
        const classConfigs = await res.json();
        return classConfigs[className]?.batch_start_date || null;
    } catch (error) {
        return null;
    }
}

app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
);

app.get('/admin', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'admin.html'))
);

///////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/api/get-all-classes', (req, res) => {
    res.json([
        "1st","2nd","3rd","4th","5th",
        "6th","7th","8th","9th","10th",
        "I.A.","I.Sc","I.Com",
        "B.A.","B.Sc","B.Com"
    ]);
});
app.post('/api/update-class-fees', async (req, res) => {
    try {
        const { class_name, monthly_fees } = req.body;
        await ClassFee.findOneAndUpdate(
            { class_name },
            { monthly_fees },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/get-class-fees', async (req, res) => {
    res.json(await ClassFee.find());
});


// --- A. STUDENT API ---
app.post('/api/student-reg', async (req, res) => {
    try {
        const data = req.body;

        // Backend pe bhi Unique ID check (Safety ke liye)
        let isUnique = false;
        let finalId = data.student_id;
        
        // Agar ID clash kare toh 1-2 baar retry karega naye random number ke sath
        while (!isUnique) {
            const check = await Student.findOne({ student_id: finalId });
            if (!check) {
                isUnique = true;
            } else {
                finalId = "STU" + Math.floor(100000 + Math.random() * 900000);
            }
        }

        data.student_id = finalId;
        const newStudent = new Student(data);
        await newStudent.save();
        
        res.json({ success: true, student_id: finalId });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/get-students', async (req, res) => {
    try { res.json(await Student.find().sort({ _id: -1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});


// --- Merged & Powerful Search API (ID OR Name + Mobile) ---
app.post('/api/search-student-result', async (req, res) => {
    try {
        const { searchTerm, mobileSearch } = req.body; 
        
        // 1. Agar user ID se search kar raha hai (ID usually numbers mein hoti hai)
        // Hum check kar rahe hain ki kya mobile khali hai aur searchTerm ek ID format hai
        if (searchTerm && !mobileSearch) {
            // Check karein ki kya ye ID hai (example: BBCC101 ya sirf numbers)
            // Agar aap chahte hain ki ID ke liye mobile na maange, toh ye block chalega
            const studentById = await Student.findOne({ 
                student_id: searchTerm, 
                exam_date: { $ne: "" } 
            });
            
            if (studentById) {
                return res.json({ success: true, student: studentById });
            } else {
                // Agar ID match nahi hui, toh ho sakta hai user ne naam dala ho bina mobile ke
                return res.json({ success: false, message: "❌ Agar aap Naam se search kar rahe hain, toh Mobile Number daalna zaroori hai!" });
            }
        }

        // 2. Agar Name aur Mobile dono daale gaye hain (Proper Secure Search)
        if (searchTerm && mobileSearch) {
            const studentByNameMobile = await Student.findOne({
                $and: [
                    { exam_date: { $ne: "" } },
                    { student_name: { $regex: new RegExp(searchTerm, 'i') } },
                    {
                        $or: [
                            { mobile: mobileSearch },
                            { parent_mobile: mobileSearch }
                        ]
                    }
                ]
            });

            if (studentByNameMobile) {
                return res.json({ success: true, student: studentByNameMobile });
            }
        }

        res.json({ success: false, message: "❌ Details match nahi hui. Sahi Name aur Mobile daalein." });

    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

app.post('/api/update-student-data', async (req, res) => {
    try { await Student.findOneAndUpdate({ student_id: req.body.student_id }, req.body); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});


app.post('/api/delete-student', async (req, res) => {
    try { 
        const { student_id } = req.body;
        await Student.findOneAndDelete({ student_id: student_id }); 
        res.json({ success: true }); 
    }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-student-fees', async (req, res) => {
    try {
        const { student_id, month, field, value } = req.body;
        const updateKey = `fees_data.${month}.${field}`;
        await Student.findOneAndUpdate({ student_id }, { $set: { [updateKey]: value } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-fees-status', async (req, res) => {
    try {
        const { student_id, month, status } = req.body;
        const operator = status ? "$addToSet" : "$pull";
        await Student.findOneAndUpdate({ student_id }, { [operator]: { paid_months: month } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-class/:className', async (req, res) => {
    try {
        const { className } = req.params;
        await Student.deleteMany({ student_class: className });
        res.json({ success: true, message: `Class ${className} ke sabhi students delete kar diye gaye hain.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- B. TEACHER API ---
app.post('/api/teacher-reg', async (req, res) => {
    try { const t = new Teacher(req.body); await t.save(); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-teachers', async (req, res) => {
    try { res.json(await Teacher.find().sort({ _id: -1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-teacher-data', async (req, res) => {
    try { await Teacher.findOneAndUpdate({ teacher_id: req.body.teacher_id }, { $set: req.body }); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-teacher', async (req, res) => {
    try { await Teacher.findOneAndDelete({ teacher_id: req.body.teacher_id }); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-salary-status', async (req, res) => {
    try {
        const { teacher_id, month, status } = req.body;
        const operator = status ? "$addToSet" : "$pull";
        await Teacher.findOneAndUpdate({ teacher_id }, { [operator]: { paid_months: month } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- C. SETTINGS & OTHER APIS ---
app.get('/api/get-settings', async (req, res) => {
    try { res.json(await SystemConfig.findOne() || {}); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-settings', async (req, res) => {
    try { const data = await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true }); res.json({ success: true, data }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-admin-profile', async (req, res) => {
    try { res.json(await AdminProfile.findOne() || {}); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-admin-profile', async (req, res) => {
    try { await AdminProfile.findOneAndUpdate({}, req.body, { upsert: true, new: true }); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/add-slider', async (req, res) => {
    try { const n = new SliderPhoto({ photo: req.body.photo }); await n.save(); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-sliders', async (req, res) => {
    try { res.json(await SliderPhoto.find().sort({ upload_date: -1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-slider/:id', async (req, res) => {
    try {
        await SliderPhoto.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Photo deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/save-class-config', async (req, res) => {
    try {
        await ClassConfig.findOneAndUpdate(
            { class_name: req.body.class_name },
            req.body,
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/get-all-class-configs', async (req, res) => {
    const data = await ClassConfig.find();
    const map = {};
    data.forEach(c => map[c.class_name] = c);
    res.json(map);
});
/////////////////////////////////////////dayrector//////////////////////////////////////////////////////////
// Add these routes to your existing server.js file:

// Director Settings Schema (Add to your schemas)
const DirectorSettings = mongoose.model('DirectorSettings', new mongoose.Schema({
    logo: String,
    title: String,
    sub_title: String,
    contact: String,
    call_no: String,
    gmail: String,
    facebook: String,
    youtube_link: String,
    instagram: String,
    twitter: String,
    help: String
}, { collection: 'director_settings' }));

// Director page route
app.get('/director', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'director.html'));
});

// Get director settings
app.get('/api/director/get-settings', async (req, res) => {
    try {
        let settings = await DirectorSettings.findOne();
        
        if (!settings) {
            // Create default settings if not exists
            settings = await DirectorSettings.create({
                title: "not set",
                sub_title: "not set",
                help: "not set",
                contact: "not set",
                call_no: "not set",
                gmail: "not set",
                admin_name: "not set"
            });
        }
        
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update director settings
app.post('/api/director/update-settings', async (req, res) => {
    try {
        const { field, value } = req.body;
        
        if (!field) {
            return res.status(400).json({ error: "Field is required" });
        }
        
        await DirectorSettings.findOneAndUpdate(
            {},
            { [field]: value },
            { upsert: true, new: true }
        );
        
        res.json({ success: true, message: "Settings updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
////////////////////////////////////////dyr end //////////////////////////////////////////////////////////

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
