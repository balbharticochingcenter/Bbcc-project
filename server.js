const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
// Limit badha di gayi hai kyunki Base64 images badi hoti hain
app.use(bodyParser.json({ limit: '15mb' })); 
app.use(express.static('public')); 

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://balbharticochingcenter_db_user:6mPWwKglys8ii8O2@cluster0.g0w0fgn.mongodb.net/BBCC_Portal?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.log("DB Connection Error:", err));

// --- DATABASE SCHEMAS ---

// 1. System Settings Schema
const SystemSchema = new mongoose.Schema({
    logo: String, title: String, sub_title: String, contact: String,
    help: String, gmail: String, youtube_link: String, facebook: String,
    instagram: String, twitter: String, add_more: String, admin_name: String
});
const SystemConfig = mongoose.model('SystemConfig', SystemSchema);

// 2. Teacher Schema
const TeacherSchema = new mongoose.Schema({
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
});
const Teacher = mongoose.model('Teacher', TeacherSchema);

// --- API ROUTES ---

// Settings APIs (Get & Update)
app.get('/api/get-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOne();
        res.json(data || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ message: "Settings Updated!", data });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Teacher Registration
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

// Get All Teachers
app.get('/api/get-teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find().sort({ _id: -1 });
        res.json(teachers);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Teacher Full Data
// Full Profile Update API
app.post('/api/update-teacher-data', async (req, res) => {
    try {
        const { teacher_id, ...updateData } = req.body;
        // findOneAndUpdate pura data replace kar dega
        await Teacher.findOneAndUpdate({ teacher_id: teacher_id }, updateData);
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete API
app.delete('/api/delete-teacher', async (req, res) => {
    try {
        await Teacher.findOneAndDelete({ teacher_id: req.body.teacher_id });
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Salary Status Update
app.post('/api/update-salary-status', async (req, res) => {
    try {
        const { teacher_id, month, status } = req.body;
        const teacher = await Teacher.findOne({ teacher_id });
        if (status) {
            if (!teacher.paid_months.includes(month)) teacher.paid_months.push(month);
        } else {
            teacher.paid_months = teacher.paid_months.filter(m => m !== month);
        }
        await teacher.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
