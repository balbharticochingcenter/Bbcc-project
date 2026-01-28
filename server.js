/************************************************************
 *  BASIC SETUP & IMPORTS
 ************************************************************/
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const { AccessToken } = require("livekit-server-sdk");

const app = express();

/************************************************************
 *  MIDDLEWARE
 ************************************************************/
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/************************************************************
 *  DATABASE CONNECTION
 ************************************************************/
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ Mongo Error:", err));

/************************************************************
 *  SCHEMAS & MODELS
 ************************************************************/

/* ---------- SYSTEM CONFIG ---------- */
const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({
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
    help: String,
    admin_name: String,
    groq_key: String
}));

/* ---------- CLASS FEES ---------- */
const ClassFee = mongoose.model('ClassFee', new mongoose.Schema({
    class_name: { type: String, unique: true },
    monthly_fees: String
}));

/* ---------- TEACHER ---------- */
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

/* ---------- STUDENT ---------- */
const Student = mongoose.model('Student', new mongoose.Schema({
    student_name: String,
    student_id: { type: String, unique: true },
    pass: String,
    parent_name: String,
    mobile: String,
    parent_mobile: String,
    student_class: String,
    roll_number: { type: String, unique: true },
    batch_year: { type: String, default: "2024" },

    fees: { type: String, default: "0" },
    total_paid: { type: Number, default: 0 },
    due_amount: { type: Number, default: 0 },

    paid_months: { type: [Number], default: [] },
    payment_history: [{
        month: Number,
        year: Number,
        amount: Number,
        payment_date: Date,
        mode: String,
        receipt_no: String
    }],

    exam_date: String,
    exam_subject: String,
    total_marks: String,
    obtained_marks: String,

    photo: String,
    address: String,
    joining_date: String,
    last_payment_date: Date,
    current_status: { type: String, default: "Active" }
}));

/* ---------- ADMIN ---------- */
const AdminProfile = mongoose.model('AdminProfile', new mongoose.Schema({
    admin_name: String,
    admin_photo: String,
    admin_userid: { type: String, unique: true },
    admin_pass: String,
    admin_mobile: String
}));

/* ---------- SLIDER ---------- */
const SliderPhoto = mongoose.model('SliderPhoto', new mongoose.Schema({
    photo: String,
    upload_date: { type: Date, default: Date.now }
}));

/* ---------- CLASS CONFIG ---------- */
const ClassConfig = mongoose.model('ClassConfig', new mongoose.Schema({
    class_name: { type: String, unique: true },
    banner: String,
    intro_video: String,
    batch_start_date: Date,
    subjects: {
        type: Map,
        of: {
            notes: [String],
            videos: [String]
        }
    }
}));

/************************************************************
 *  HTML ROUTES
 ************************************************************/
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
);

app.get('/admin', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'admin.html'))
);

/************************************************************
 *  STUDENT APIs
 ************************************************************/
app.post('/api/student-reg', async (req, res) => {
    try {
        let data = req.body;
        if (!data.student_id) {
            data.student_id = "STU" + Date.now().toString().slice(-6);
        }
        const student = new Student(data);
        await student.save();
        res.json({ success: true, student_id: data.student_id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/get-students', async (req, res) => {
    res.json(await Student.find().sort({ _id: -1 }));
});
app.put('/api/update-student/:id', async (req, res) => {
    await Student.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
});
/************************************************************
 *  FEES & PAYMENT APIs
 ************************************************************/
app.post('/api/record-payment', async (req, res) => {
    const { student_id, month, year, amount } = req.body;
    const student = await Student.findOne({ student_id });

    if (!student) return res.status(404).json({ error: "Student not found" });

    student.payment_history.push({
        month, year, amount,
        payment_date: new Date(),
        receipt_no: "REC" + Date.now().toString().slice(-5)
    });

    student.total_paid += Number(amount);
    student.due_amount = Math.max(0, Number(student.fees) - student.total_paid);
    student.paid_months.addToSet(month);

    await student.save();
    res.json({ success: true });
});

/************************************************************
 *  TEACHER APIs
 ************************************************************/
app.post('/api/teacher-reg', async (req, res) => {
    await new Teacher(req.body).save();
    res.json({ success: true });
});

app.get('/api/get-teachers', async (req, res) => {
    res.json(await Teacher.find());
});

/************************************************************
 *  SETTINGS APIs
 ************************************************************/
app.get('/api/get-settings', async (req, res) => {
    res.json(await SystemConfig.findOne() || {});
});

app.post('/api/update-settings', async (req, res) => {
    await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true });
    res.json({ success: true });
});

/************************************************************
 *  LIVE CLASS (LIVEKIT)
 ************************************************************/
app.get("/api/live-token", (req, res) => {
    const { room, name } = req.query;

    const token = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        { identity: name }
    );

    token.addGrant({ roomJoin: true, room });

    res.json({
        token: token.toJwt(),
        url: process.env.LIVEKIT_URL
    });
});

/************************************************************
 *  SERVER START
 ************************************************************/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
