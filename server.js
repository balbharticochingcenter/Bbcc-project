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



// AI Chat Models Priority List (Auto-Fallback logic ke liye)
const AI_MODELS = [
    "llama-3.1-8b-instant",        // Fast aur High Limit
    "meta-llama/llama-4-scout-17b-16e-instruct", // High Tokens
    "llama-3.3-70b-versatile",    // Smart but Low Limit
    "qwen/qwen3-32b"              // Backup
];

app.post('/api/ai-chat', async (req, res) => {
    const { prompt } = req.body;
    try {
        const config = await SystemConfig.findOne();
        const apiKey = config ? config.groq_key : null;

        if (!apiKey) return res.status(400).json({ reply: "API Key missing hai, please settings mein check karein." });

        // Database se context fetch karna
        const [students, teachers, admin] = await Promise.all([
            mongoose.model('Student').find().limit(15).select('student_name student_class student_id'),
            mongoose.model('Teacher').find().limit(10).select('teacher_name teacher_id'),
            mongoose.model('AdminProfile').findOne({})
        ]);

        const studentSummary = students.map(s => `${s.student_name}(ID:${s.student_id})`).join(", ");
        const teacherSummary = teachers.map(t => `${t.teacher_name}(ID:${t.teacher_id})`).join(", ");

        // Check if the user is trying to perform an action (Delete/Update)
        const actionKeywords = ['delete', 'remove', 'update', 'change', 'hatao', 'badlo', 'mitao'];
        const isActionRequest = actionKeywords.some(word => prompt.toLowerCase().includes(word));

       // --- DATABASE JANKARI FETCH KARNA (Instruction ke liye) ---
const [students, teachers, sliders, settings, admin] = await Promise.all([
    mongoose.model('Student').find().limit(20).select('student_name student_id student_class'),
    mongoose.model('Teacher').find().limit(10).select('teacher_name teacher_id'),
    mongoose.model('SliderPhoto').find().limit(5),
    mongoose.model('SystemConfig').findOne({}),
    mongoose.model('AdminProfile').findOne({})
]);

const studentSummary = students.map(s => `${s.student_name}(ID:${s.student_id})`).join(", ");
const teacherSummary = teachers.map(t => `${t.teacher_name}(ID:${t.teacher_id})`).join(", ");

// --- MERGED BHARTI SYSTEM INSTRUCTION ---
let systemInstruction = `
Aap Bharti ho, Bal Bharti Coaching Center ki smart Assistant aur Expert Manager. 
Aapko Admin Dashboard ke sabhi features aur Database ki poori jankari hai.

DATABASE & CONTEXT:
1. Students: Inka data 'Student' collection mein hai. List: [${studentSummary}]
2. Teachers: Inka data 'Teacher' collection mein hai. List: [${teacherSummary}]
3. Slider: Website ki home photos 'SliderPhoto' collection mein hain.
4. Settings: Coaching ka naam, contact aur API keys 'SystemConfig' mein hain.
5. Admin: Admin ka naam ${admin?.admin_name || "Santosh"} hai.

DASHBOARD FEATURES (Buttons):
- Image Compressor: Photos crop aur compress karne ke liye.
- System Settings: Coaching details/API Key badalne ke liye.
- Slider: Home screen ki photos manage karne ke liye.
- Management: Teacher/Student ka data, salary, aur fees ke liye.
- Results: Class-wise marksheet update karne ke liye.

BHARTI KE KADAK NIYAM (STRICT RULES):
1. LANGUAGE: Sirf HINDI ka upyog karein. English script ya Hinglish bilkul nahi.
2. POINT-TO-POINT: "Aur batao" ya "Kaise ho" jaise shabd na bole. Seedha jawab dein.
3. VOICE COMMANDS (MAHATVAPOORN):
   - Agar user kahe kisi ko UPDATE/SEARCH karna hai, toh jawab ke ant mein likhein: [UPDATE_STUDENT: ID] ya [UPDATE_TEACHER: ID].
   - Agar user koi Modal kholne ko kahe, toh likhein: [OPEN_MODAL: modalID].
   (Modal IDs: studentModal, teacherModal, systemModal, studentDataModal, dataModal, sliderModal, adminProfileModal, classSystemModal).
4. ACTION CLARITY: Slider matlab website photos, Student matlab bacche. Dono ko mix na karein.
5. CONFIRMATION: Kuch bhi badalne se pehle "Kya aap nishchit hain?" zaroor puchein.

Abhi ka context: Admin ${admin?.admin_name} baat kar rahe hain.
`;


        if (isActionRequest) {
            systemInstruction += ` 3. User shayad kuch delete ya update karna chahta hai. Aapko admin se kehna hai: "Theek hai, par kya aap confirm hain? (Yes/No)". Bina confirmation ke action suggest na karein.`;
        }

        // --- Model Fallback Logic (Trying multiple models if one fails) ---
        let aiResponse = null;
        let lastError = null;

        for (const modelName of AI_MODELS) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            { role: "system", content: systemInstruction },
                            { role: "user", content: prompt }
                        ],
                        max_tokens: 250,
                        temperature: 0.7
                    })
                });

                const data = await response.json();

                if (data.choices && data.choices[0]) {
                    aiResponse = data.choices[0].message.content;
                    break; // Success! Loop se bahar nikal jao
                } else if (data.error && data.error.code === 'rate_limit_exceeded') {
                    console.log(`Model ${modelName} limit reached, switching...`);
                    continue; // Agle model par jao
                }
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (aiResponse) {
            res.json({ reply: aiResponse });
        } else {
            res.json({ reply: "Maaf kijiye, abhi saare AI models busy hain. Kripya 5 minute baad koshish karein." });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Technical error! Database ya API connect nahi ho pa raha." });
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
