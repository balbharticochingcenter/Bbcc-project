const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// --- DATABASE CONNECTION ---
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ VIP Database Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// --- SCHEMAS ---

// 1. User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, 
    fname: String,
    mname: String,
    lname: String,
    mobile: String,
    email: String,
    studentClass: { type: String }, 
    marksObtained: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 500 },
    division: { type: String, default: "-" },
    financeAmount: Number,
    paymentStatus: { type: String, default: "Unpaid" },
    joinDate: { type: Date, default: Date.now },
    profilePhoto: { type: String, default: "/assets/default-user.png" }
});
const User = mongoose.model('User', userSchema);

// 2. Comms Schema
const commsSchema = new mongoose.Schema({
    message: String,
    type: String, 
    target: String, 
    date: { type: Date, default: Date.now }
});
const Comms = mongoose.model('Comms', commsSchema);

// 3. Settings Schema
const settingsSchema = new mongoose.Schema({
    header: {
        title: { type: String, default: "BBCC Portal" },
        subTitle: { type: String, default: "Education Excellence" },
        logo: { type: String, default: "/assets/logo.png" }
    },
    footer: {
        about: { type: String, default: "Short about your academy..." },
        facebook: String,
        instagram: String,
        youtube: String,
        whatsapp: String
    }
});
const Settings = mongoose.model('Settings', settingsSchema);

// 4. Class Setup Schema
const classSetSchema = new mongoose.Schema({
    className: { type: String, unique: true, required: true },
    banner: { type: String, default: "" },
    classTeacher: { type: String, default: "" },
    classYT: { type: String, default: "" },
    subjects: [{
        name: String,
        teacher: String,
        videos: [String] 
    }]
});
const ClassSet = mongoose.model('ClassSet', classSetSchema);

// --- MIDDLEWARES ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// --- API ROUTES ---

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && user.password === password) {
            let redirectPath = '/html/student-dashboard.html';
            if (user.role === 'admin') redirectPath = '/html/admin-dashboard.html';
            if (user.role === 'teacher') redirectPath = '/html/teacher-dashboard.html';
            
            const { password: _, ...userData } = user._doc;
            res.json({ success: true, redirect: redirectPath, user: userData });
        } else {
            res.json({ success: false, message: "Invalid ID or Password!" });
        }
    } catch (err) { res.status(500).json({ success: false }); }
});

// Create User
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "User registered!" });
    } catch (err) { 
        res.json({ success: false, message: "ID exists or Error!" }); 
    }
});

// Get All Users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } });
        res.json(users);
    } catch (err) { res.status(500).json({ success: false }); }
});

// Update User Detail
app.put('/api/admin/users/:username', async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
            { username: req.params.username }, 
            req.body, 
            { new: true }
        );
        if (updatedUser) res.json({ success: true, message: "Profile Updated!" });
        else res.status(404).json({ success: false, message: "User not found" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// Batch Update Results
app.post('/api/admin/update-batch-results', async (req, res) => {
    try {
        const { results } = req.body;
        const promises = results.map(resObj => {
            return User.findOneAndUpdate(
                { username: resObj.username },
                { 
                    marksObtained: resObj.marksObtained,
                    totalMarks: resObj.totalMarks,
                    division: resObj.division
                }
            );
        });
        await Promise.all(promises);
        res.json({ success: true, message: "Results Updated!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- HP SETTINGS ROUTES ---

app.get('/api/admin/hp-settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({});
            await settings.save();
        }
        res.json(settings);
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/update-header', async (req, res) => {
    try {
        await Settings.findOneAndUpdate({}, { header: req.body }, { upsert: true });
        res.json({ success: true, message: "Header Updated!" });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/update-footer', async (req, res) => {
    try {
        await Settings.findOneAndUpdate({}, { footer: req.body }, { upsert: true });
        res.json({ success: true, message: "Footer Updated!" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- CLASS MANAGEMENT ROUTES ---

// A. Save or Update Class Data
app.post('/api/admin/save-class', async (req, res) => {
    try {
        const { className } = req.body;
        const updatedClass = await ClassSet.findOneAndUpdate(
            { className: className }, 
            req.body, 
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json({ success: true, message: "Class settings updated!", data: updatedClass });
    } catch (err) { 
        res.status(500).json({ success: false, message: "Server error while saving class" }); 
    }
});

// B. NEW: Get Single Class Info (Used by View All / class-details.html)
app.get('/api/admin/class-info', async (req, res) => {
    try {
        const { name } = req.query;
        const classData = await ClassSet.findOne({ className: name });
        if (classData) {
            res.json(classData);
        } else {
            res.status(404).json({ message: "Class not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// C. Get Class Data by Name (Search function)
app.get('/api/admin/get-class/:className', async (req, res) => {
    try {
        const classData = await ClassSet.findOne({ className: req.params.className });
        if (classData) res.json(classData);
        else res.status(404).json({ message: "No data found" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// D. Get All Classes
app.get('/api/admin/all-classes', async (req, res) => {
    try {
        const classes = await ClassSet.find({});
        res.json(classes);
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- COMMS & SERVER ---

app.get('/api/admin/comms-history', async (req, res) => {
    try {
        const history = await Comms.find().sort({ date: -1 }).limit(30);
        res.json(history);
    } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/comms/:id', async (req, res) => {
    try {
        await Comms.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted!" });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/send-comms', async (req, res) => {
    try {
        const { message, target, type } = req.body;
        const newComm = new Comms({ message, target, type });
        await newComm.save();
        io.emit('new_announcement', { message, target, type });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// HTML Routes
app.get('/', (req, res) => { res.sendFile(path.join(publicPath, 'html/login.html')); });
app.get('/html/:page', (req, res) => { res.sendFile(path.join(publicPath, 'html', req.params.page)); });

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server Live: ${PORT}`));
