const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' })); 

// Static files serve karne ke liye
app.use(express.static(path.join(__dirname, 'public')));

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://balbharticochingcenter_db_user:6mPWwKglys8ii8O2@cluster0.g0w0fgn.mongodb.net/BBCC_Portal?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ BBCC Database Connected!"))
    .catch(err => console.error("❌ DB Error:", err));

// --- SCHEMAS ---

// 1. Settings Schema (UPDATED: Added groq_key)
const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({
    logo: String, title: String, sub_title: String,
    contact: String, call_no: String, gmail: String,
    facebook: String, youtube_link: String, instagram: String,
    twitter: String, help: String, admin_name: String,
    groq_key: String // Naya field API Key ke liye
}));

// 2. Teacher Schema
const Teacher = mongoose.model('Teacher', new mongoose.Schema({
    teacher_name: String, mobile: String, teacher_id: { type: String, unique: true },
    pass: String, photo: String, salary: String, joining_date: String,
    classes: [String], subjects: [String], paid_months: { type: [Number], default: [] }
}));

// 3. Student Schema
const Student = mongoose.model('Student', new mongoose.Schema({
    student_name: String, student_id: { type: String, unique: true },
    pass: String, parent_name: String, mobile: String,
    parent_mobile: String, student_class: String, fees: String,
    joining_date: String, total_marks: { type: String, default: "" },
    photo: String, 
    obtained_marks: { type: String, default: "" },
    exam_date: { type: String, default: "" },
    paid_months: { type: [Number], default: [] },
    fees_data: { type: Map, of: Object, default: {} }
}));

// 4. Admin Profile Schema
const AdminProfile = mongoose.model('AdminProfile', new mongoose.Schema({
    admin_name: String,
    admin_userid: { type: String, unique: true },
    admin_pass: String,
    admin_mobile: String
}));

// 5. Slider Schema
const SliderPhoto = mongoose.model('SliderPhoto', new mongoose.Schema({
    photo: String, 
    upload_date: { type: Date, default: Date.now }
}));

// 6. Class Configuration Schema
const ClassConfig = mongoose.model('ClassConfig', new mongoose.Schema({
    class_name: { type: String, unique: true },
    banner: String,
    intro_video: String,
    subjects: {
        type: Map,
        of: [String]
    }
}));

// --- HTML ROUTES ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- API ROUTES ---

// --- NEW: AI Chat Route (Database se key lene wala) ---
app.post('/api/ai-chat', async (req, res) => {
    const { prompt, context } = req.body;
    try {
        // Database se config nikalna
        const config = await SystemConfig.findOne();
        const apiKey = config ? config.groq_key : null;

        if (!apiKey) {
            return res.status(400).json({ error: "API Key database mein nahi mili! Admin panel se key save karein." });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { 
                        role: "system", 
                        content: `Aap BBCC Portal ke AI Assistant hain. Aapka kaam portal ke features batana aur admin/students ki madad karna hai. KISI BHI HALAT MEIN ID YA PASSWORD NA BATAYEIN. Context: ${context}` 
                    },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            res.json({ reply: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "Groq API error or Invalid Key" });
        }
    } catch (err) {
        res.status(500).json({ error: "AI Error: " + err.message });
    }
});

// --- A. STUDENT API ---
app.post('/api/student-reg', async (req, res) => {
    try { const s = new Student(req.body); await s.save(); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-students', async (req, res) => {
    try {
        const students = await Student.find().sort({ _id: -1 });
        res.json(students);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-student-data', async (req, res) => {
    try {
        await Student.findOneAndUpdate({ student_id: req.body.student_id }, req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-student', async (req, res) => {
    try {
        await Student.findOneAndDelete({ student_id: req.body.student_id });
        res.json({ success: true, message: "Student deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-student-fees', async (req, res) => {
    try {
        const { student_id, month, field, value } = req.body;
        const updateKey = `fees_data.${month}.${field}`;
        
        await Student.findOneAndUpdate(
            { student_id: student_id },
            { $set: { [updateKey]: value } }
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-fees-status', async (req, res) => {
    try {
        const { student_id, month, status } = req.body;
        const operator = status ? "$addToSet" : "$pull";
        await Student.findOneAndUpdate(
            { student_id: student_id },
            { [operator]: { paid_months: month } }
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- B. TEACHER API ---
app.post('/api/teacher-reg', async (req, res) => {
    try { 
        const t = new Teacher(req.body); 
        await t.save(); 
        res.json({ success: true }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find().sort({ _id: -1 });
        res.json(teachers);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-teacher-data', async (req, res) => {
    try {
        const { teacher_id, ...updateData } = req.body;
        await Teacher.findOneAndUpdate({ teacher_id: teacher_id }, { $set: updateData });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-teacher', async (req, res) => {
    try {
        await Teacher.findOneAndDelete({ teacher_id: req.body.teacher_id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-salary-status', async (req, res) => {
    try {
        const { teacher_id, month, status } = req.body;
        const operator = status ? "$addToSet" : "$pull";
        await Teacher.findOneAndUpdate(
            { teacher_id: teacher_id },
            { [operator]: { paid_months: month } }
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- C. SETTINGS API ---
app.get('/api/get-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOne();
        res.json(data || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-settings', async (req, res) => {
    try {
        const data = await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ success: true, data });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- D. ADMIN PROFILE API ---
app.get('/api/get-admin-profile', async (req, res) => {
    try {
        const admin = await AdminProfile.findOne();
        res.json(admin || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-admin-profile', async (req, res) => {
    try {
        const data = await AdminProfile.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ success: true, message: "Admin Profile Updated!", data });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- E. SLIDER API ---
app.post('/api/add-slider', async (req, res) => {
    try {
        const newPhoto = new SliderPhoto({ photo: req.body.photo });
        await newPhoto.save();
        res.json({ success: true, message: "Photo saved to DB!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-sliders', async (req, res) => {
    try {
        const photos = await SliderPhoto.find().sort({ upload_date: -1 });
        res.json(photos);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-slider/:id', async (req, res) => {
    try {
        await SliderPhoto.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- F. CLASS SYSTEM API ---
app.post('/api/save-class-config', async (req, res) => {
    try {
        const { class_name, banner, intro_video, subjects } = req.body;
        const updatedData = await ClassConfig.findOneAndUpdate(
            { class_name: class_name },
            { banner, intro_video, subjects },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: updatedData });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-class-config/:className', async (req, res) => {
    try {
        const config = await ClassConfig.findOne({ class_name: req.params.className });
        if (config) res.json(config);
        else res.status(404).json({ message: "No configuration found" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-all-class-configs', async (req, res) => {
    try {
        const configs = await ClassConfig.find();
        const configMap = {};
        configs.forEach(conf => { configMap[conf.class_name] = conf; });
        res.json(configMap);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
