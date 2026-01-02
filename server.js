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

// 1. Settings Schema
const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({
    logo: String, title: String, sub_title: String,
    contact: String, call_no: String, gmail: String,
    facebook: String, youtube_link: String, instagram: String,
    twitter: String, help: String, admin_name: String
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
    obtained_marks: { type: String, default: "" },
    exam_date: { type: String, default: "" },
    paid_months: { type: [Number], default: [] }
}));
// 4. Admin Profile Schema (New)
const AdminProfile = mongoose.model('AdminProfile', new mongoose.Schema({
    admin_name: String,
    admin_userid: { type: String, unique: true },
    admin_pass: String,
    admin_mobile: String
}));
// --- HTML ROUTES ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- 5. Slider Schema (Naya Schema) ---
const SliderPhoto = mongoose.model('SliderPhoto', new mongoose.Schema({
    photo: String, // Base64 image data yahan save hoga
    upload_date: { type: Date, default: Date.now }
}));
// --- 6. Class Configuration Schema (Naya) ---
const ClassConfig = mongoose.model('ClassConfig', new mongoose.Schema({
    class_name: { type: String, unique: true }, // e.g., "10th", "I.Sc."
    banner: String,
    intro_video: String,
    subjects: {
        type: Map,
        of: [String] // Subject name key hogi aur array mein links honge
    }
}));
// --- E. SLIDER API (Naya Routes) ---

// Photo Save karne ke liye
app.post('/api/add-slider', async (req, res) => {
    try {
        const newPhoto = new SliderPhoto({ photo: req.body.photo });
        await newPhoto.save();
        res.json({ success: true, message: "Photo saved to DB!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Saari Photos Get karne ke liye
app.get('/api/get-sliders', async (req, res) => {
    try {
        const photos = await SliderPhoto.find().sort({ upload_date: -1 });
        res.json(photos);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Photo Delete karne ke liye
app.delete('/api/delete-slider/:id', async (req, res) => {
    try {
        await SliderPhoto.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// --- API ROUTES ---

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
// ✅ ADDED: Student Delete Code
app.delete('/api/delete-student', async (req, res) => {
    try {
        await Student.findOneAndDelete({ student_id: req.body.student_id });
        res.json({ success: true, message: "Student deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// Naya logic: Student fees checkbox ke liye (Agar front-end use kar raha hai)
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

// --- B. TEACHER API (Fixed & Merged) ---
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
// --- F. CLASS SYSTEM API (Naya) ---

// 1. Class ka configuration save ya update karne ke liye
app.post('/api/save-class-config', async (req, res) => {
    try {
        const { class_name, banner, intro_video, subjects } = req.body;
        // upsert: true se agar class nahi hai to ban jayegi, hai to update ho jayegi
        const updatedData = await ClassConfig.findOneAndUpdate(
            { class_name: class_name },
            { banner, intro_video, subjects },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: updatedData });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2. Specific class ka data fetch karne ke liye
app.get('/api/get-class-config/:className', async (req, res) => {
    try {
        const config = await ClassConfig.findOne({ class_name: req.params.className });
        if (config) {
            res.json(config);
        } else {
            res.status(404).json({ message: "No configuration found for this class" });
        }
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
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
// --- D. ADMIN PROFILE API (NEW) ---

// Admin Data Get Karne ke liye
app.get('/api/get-admin-profile', async (req, res) => {
    try {
        const admin = await AdminProfile.findOne(); // Ek hi admin record fetch karega
        res.json(admin || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Data Save/Update Karne ke liye
app.post('/api/update-admin-profile', async (req, res) => {
    try {
        // upsert: true ka matlab hai agar record nahi hai to naya bana do, hai to update kar do
        const data = await AdminProfile.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json({ success: true, message: "Admin Profile Updated!", data });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
