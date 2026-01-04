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

const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({
    logo: String, title: String, sub_title: String,
    contact: String, call_no: String, gmail: String,
    facebook: String, youtube_link: String, instagram: String,
    twitter: String, help: String, admin_name: String,
    groq_key: String 
}));

const Teacher = mongoose.model('Teacher', new mongoose.Schema({
    teacher_name: String, mobile: String, teacher_id: { type: String, unique: true },
    pass: String, photo: String, salary: String, joining_date: String,
    classes: [String], subjects: [String], paid_months: { type: [Number], default: [] }
}));

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

const AdminProfile = mongoose.model('AdminProfile', new mongoose.Schema({
    admin_name: String,
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
    subjects: { type: Map, of: [String] }
}));

// --- HTML ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// --- API ROUTES ---

// 1. FIXED & MOOD-AWARE AI CHAT ROUTE
app.post('/api/ai-chat', async (req, res) => {
    const { prompt } = req.body;

    try {
        const config = await SystemConfig.findOne();
        const apiKey = config ? config.groq_key : null;

        if (!apiKey || apiKey.trim() === "") {
            return res.status(400).json({ error: "API Key missing! Settings mein save karein." });
        }

        const [allStudents, allTeachers, allClasses, adminProfile] = await Promise.all([
            Student.find({}, 'student_name student_id fees paid_months student_class parent_name'),
            Teacher.find({}, 'teacher_name teacher_id salary paid_months classes subjects'),
            ClassConfig.find({}, 'class_name subjects'),
            AdminProfile.findOne({}, 'admin_name admin_mobile')
        ]);

        const studentSummary = allStudents.map(s => `- ${s.student_name}: ID ${s.student_id}, Class ${s.student_class}, Paid Months: ${s.paid_months.length}`).join("\n");
        const teacherSummary = allTeachers.map(t => `- ${t.teacher_name}: Salary ₹${t.salary}, Subjects: ${t.subjects.join(", ")}`).join("\n");

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `Aapka naam "Bharti" hai. Aap "Bal Bharti Coaching Center" ki official FEMALE AI Assistant hain. 
                        
                        PERSONALITY & MOOD:
                        - Aap ek female assistant hain.
                        - Aapka tone aapke Admin (${adminProfile?.admin_name || "Sir"}) ke mood ke hisab se badlega.
                        - Agar Admin gusse mein baat kare, toh aap extra polite aur calm rahein.
                        - Agar Admin mazaak kare, toh aap thoda friendly aur cheerful ho jayein.
                        - Jaise Admin aap se baat kare, waise hi unka mood catch karke reply dein.

                        DATA ACCESS:
                        STUDENTS: ${studentSummary}
                        TEACHERS: ${teacherSummary}

                        RULES:
                        1. Hinglish mein baat karein. 
                        2. Fees/Salary status 'Paid Months' ke count se check karein (12 se kam matlab pending).
                        3. Hamesha respectful aur helpful rahein.` 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1200
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            res.json({ reply: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "AI response failed." });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
});

// --- A. STUDENT API ---
app.post('/api/student-reg', async (req, res) => {
    try { const s = new Student(req.body); await s.save(); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/get-students', async (req, res) => {
    try { res.json(await Student.find().sort({ _id: -1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-student-data', async (req, res) => {
    try { await Student.findOneAndUpdate({ student_id: req.body.student_id }, req.body); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-student', async (req, res) => {
    try { await Student.findOneAndDelete({ student_id: req.body.student_id }); res.json({ success: true }); }
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

app.post('/api/save-class-config', async (req, res) => {
    try { await ClassConfig.findOneAndUpdate({ class_name: req.body.class_name }, req.body, { upsert: true }); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
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
