require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
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

const Student = mongoose.model('Student', new mongoose.Schema({
    student_name: String,
    student_id: { type: String, unique: true },
    pass: String,
    parent_name: String,
    mobile: String,
    parent_mobile: String,
    student_class: String,
    fees: String,
    joining_date: String,
    total_marks: { type: String, default: "" },
    obtained_marks: { type: String, default: "" },
    exam_date: { type: String, default: "" },
    exam_subject: { type: String, default: "" }, 
    photo: String,                               
    paid_months: { type: [Number], default: [] },
    fees_data: { type: Map, of: Object, default: {} }
}));
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
    subjects: { type: Map, of: [String] }
}));

// --- HTML ROUTES ---
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
);
app.get('/admin', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'admin.html'))
);

// --- AI CONFIG ---
const AI_MODELS = [
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b"
];
app.post('/api/ai-chat', async (req, res) => {
    const { prompt } = req.body;

    try {
        const config = await SystemConfig.findOne();
        const apiKey = config?.groq_key;

        if (!apiKey) return res.json({ reply: "System error: Bharti ki yaadassht (API Key) nahi mil rahi hai." });

        // Database se live info nikalna taki Bharti update rahe
        const [students, teachers, classConfigs] = await Promise.all([
            Student.find().limit(10).select('student_name student_class'),
            Teacher.find().limit(10).select('teacher_name specialty'),
            ClassConfig.find().select('class_name subjects description')
        ]);

        // Bharti ko training dena (System Instructions)
        const systemInstruction = `
Aapka Naam: "Bharti" (Digital Sahayak, Bal Bharti Coaching Center).
Aapka Vyaktitv: Aap hamesha "Aap" kehkar respect se baat karti hain. Aap soft-spoken, intelligent aur helpful hain.

Aapka Kaam:
1. Coaching ke har feature ko samjhana (Admission, Results, Fees, Teachers).
2. Jitna pucha jaye utna hi point-to-point samjhana. Agar user ko samajh na aaye, toh naye aur asaan tarike se samjhana.
3. Agar koi sawal coaching se bahar ka ho (Jaise General Knowledge, Maths, ya Science), toh uska jawab ek expert teacher ki tarah dena.
4. Admin Dashboard ki baatein (Passwords, Keys, Delete options) bilkul nahi batani.

LIVE DATA (Aapke coaching ki jaankari):
- Classes: ${classConfigs.map(c => `${c.class_name} (Subjects: ${c.subjects})`).join(" | ")}
- Teachers: ${teachers.map(t => t.teacher_name).join(", ")}
- Top Students: ${students.map(s => s.student_name).join(", ")}
- Website Features: 3D Slider, Login Modal, Student Registration Form, Searchable Results (ID/Mobile), Teachers Ring Section, Video Lectures.

KHYAL RAKHEIN:
- Sirf HINDI mein baat karein.
- User ko "Aap" kahein.
- Agar koi system change mangne ki koshish kare, toh kahein "Maaf kijiye, main sirf ek sahayak hoon, changes ke liye aap office ya dashboard ka istemal karein."
`;

        // Groq AI se response lena
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${apiKey}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Powerful model for better understanding
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7, // Creativity balance
                max_tokens: 500
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            res.json({ reply: data.choices[0].message.content });
        } else {
            res.json({ reply: "Maaf kijiye, main abhi kuch samajh nahi pa rahi hoon. Phir se puchiye?" });
        }

    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ reply: "Maaf kijiye, abhi mera server thoda thak gaya hai. Ek minute baad baat karte hain?" });
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
