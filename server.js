const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
// Base64 images aur heavy data ke liye limit 20mb rakhi gayi hai
app.use(bodyParser.json({ limit: '20mb' })); 
app.use(express.static('public')); 

// --- MONGODB CONNECTION ---
// Yahan maine aapka connection string daal diya hai
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://balbharticochingcenter_db_user:6mPWwKglys8ii8O2@cluster0.g0w0fgn.mongodb.net/BBCC_Portal?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ BBCC Database Connected Successfully!"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// --- DATABASE SCHEMAS ---

// 1. System Settings Schema (Merge of both versions)
const SystemSchema = new mongoose.Schema({
    logo: String,           // Header
    title: String,          // Header
    sub_title: String,      // Header
    contact: String,        // Footer (WhatsApp)
    call_no: String,        // Footer (Calling)
    gmail: String,          // Footer
    facebook: String,       // Social
    youtube_link: String,   // Social
    instagram: String,      // Social
    twitter: String,        // Social
    help: String,           // Footer (Address/Line)
    admin_name: String      // Optional
});
const SystemConfig = mongoose.model('SystemConfig', SystemSchema);

// 2. Teacher Schema (Advanced Version)
const TeacherSchema = new mongoose.Schema({
    teacher_name: String,
    mobile: String,
    teacher_id: { type: String, unique: true },
    pass: String,
    photo: String,
    salary: String,
    joining_date: String,
    classes: [String],      // Multiple classes support
    subjects: [String],     // Multiple subjects support
    paid_months: { type: [Number], default: [] } 
});
const Teacher = mongoose.model('Teacher', TeacherSchema);

// --- API ROUTES ---

// 1. Settings APIs (Header/Footer/Social)
app.get('/api/get-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOne();
        res.json(data || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ message: "Settings Saved Successfully!", data });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Teacher Registration
app.post('/api/teacher-reg', async (req, res) => {
    try {
        const newTeacher = new Teacher(req.body);
        await newTeacher.save();
        res.status(200).json({ success: true, message: "Teacher Registered!" });
    } catch (err) {
        const errorMsg = err.code === 11000 ? "ID already exists!" : err.message;
        res.status(500).json({ success: false, error: errorMsg });
    }
});

// 3. Get All Teachers (Sorted by Newest)
app.get('/api/get-teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find().sort({ _id: -1 });
        res.json(teachers);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Update Teacher Full Profile (Edit Mode)
app.post('/api/update-teacher-data', async (req, res) => {
    try {
        const { teacher_id, ...updateData } = req.body;
        const result = await Teacher.findOneAndUpdate({ teacher_id }, updateData, { new: true });
        if (result) {
            res.status(200).json({ success: true, message: "Profile Updated!" });
        } else {
            res.status(404).json({ success: false, message: "Teacher not found" });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Delete Teacher
app.delete('/api/delete-teacher', async (req, res) => {
    try {
        const { teacher_id } = req.body;
        await Teacher.findOneAndDelete({ teacher_id });
        res.status(200).json({ success: true, message: "Teacher Removed" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Salary Status Toggle (Check/Uncheck M1, M2...)
app.post('/api/update-salary-status', async (req, res) => {
    try {
        const { teacher_id, month, status } = req.body;
        const teacher = await Teacher.findOne({ teacher_id });
        if (!teacher) return res.status(404).json({ error: "Teacher not found" });

        if (status) {
            if (!teacher.paid_months.includes(month)) teacher.paid_months.push(month);
        } else {
            teacher.paid_months = teacher.paid_months.filter(m => m !== month);
        }
        await teacher.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying on http://localhost:${PORT}`);
});
