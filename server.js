const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
// --- HOME ROUTE ---
// This tells the server to serve login.html when someone visits the main URL "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- MIDDLEWARE ---
app.use(cors());
// Increased limit to 10mb to handle Base64 Logo strings (images as text)
app.use(bodyParser.json({ limit: '10mb' })); 
// Serving static files (html, css, js) from the 'public' folder
app.use(express.static('public')); 

// --- MONGODB CONNECTION ---
// Using your provided MongoDB Atlas Connection String
// 'process.env.MONGO_URI' allows Render to keep your key secure
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://balbharticochingcenter_db_user:6mPWwKglys8ii8O2@cluster0.g0w0fgn.mongodb.net/BBCC_Portal?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully to BBCC_Portal"))
    .catch(err => console.log("DB Connection Error:", err));

// --- DATABASE SCHEMA ---
// Defining the structure for Header, Footer, and Admin data
const SystemSchema = new mongoose.Schema({
    logo: String,
    title: String,
    sub_title: String,
    contact: String,
    help: String,
    gmail: String,
    youtube_link: String,
    facebook: String,
    instagram: String,
    twitter: String,
    add_more: String,
    admin_name: String
});

const SystemConfig = mongoose.model('SystemConfig', SystemSchema);

// --- API ROUTES ---

// GET: Fetch settings to display on login.html (Header/Footer)
app.get('/api/get-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOne(); // Retrieve the setup data
        res.json(data || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Save or Update settings from the Admin page
app.post('/api/update-settings', async (req, res) => {
    try {
        // 'findOneAndUpdate' with empty {} updates the first document it finds
        // 'upsert: true' creates a new document if none exists
        const data = await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ message: "Settings Updated Successfully!", data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- TEACHER SCHEMA (Updated for Multiple Checkboxes) ---
const TeacherSchema = new mongoose.Schema({
    teacher_name: { type: String, required: true },
    mobile: String,
    teacher_id: { type: String, unique: true }, // ID unique honi chahiye
    pass: String,
    photo: String, // Base64 string for image
    salary: String,
    joining_date: String,
    // [String] ka matlab hai ki ye multiple selections (Array) save karega
    classes: [String], 
    subjects: [String],
    createdAt: { type: Date, default: Date.now }
});

const Teacher = mongoose.model('Teacher', TeacherSchema);

// --- TEACHER REGISTRATION API ---
app.post('/api/teacher-reg', async (req, res) => {
    try {
        console.log("Teacher Data Received:", req.body); // For debugging in Render logs
        
        const newTeacher = new Teacher(req.body);
        await newTeacher.save();
        
        res.status(200).json({ 
            success: true, 
            message: "Teacher Registered Successfully in BBCC Portal!" 
        });
    } catch (err) {
        console.error("Teacher Save Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Database Error: " + err.message 
        });
    }
});

// API to Get All Teachers (Future use ke liye agar list dikhani ho)
app.get('/api/get-teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find().sort({ createdAt: -1 });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- SERVER INITIALIZATION ---
// Render will provide the PORT automatically via environment variables
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
