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

// --- DATABASE SETUP ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ VIP Database Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// --- SCHEMAS (Database Structures) ---

// 1. User Schema (Detailed Version)
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // admin, teacher, student
    fname: String,
    mname: String,
    lname: String,
    mobile: String,
    email: String,
    financeAmount: Number, // Fees for students, Salary for teachers
    paymentStatus: { type: String, default: "Unpaid" },
    joinDate: { type: Date, default: Date.now },
    profilePhoto: String
});
const User = mongoose.model('User', userSchema);

// 2. Communication Schema (For Notice Board & History)
const commsSchema = new mongoose.Schema({
    message: String,
    type: String, // 'notice' or 'notification'
    target: String, // 'student', 'teacher', or 'all'
    date: { type: Date, default: Date.now }
});
const Comms = mongoose.model('Comms', commsSchema);

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- API ROUTES ---

// 1. Login Logic
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && user.password === password) {
            let path = '/student-dashboard.html';
            if (user.role === 'admin') path = '/admin-dashboard.html';
            if (user.role === 'teacher') path = '/teacher-dashboard.html';
            res.json({ success: true, redirect: path, user });
        } else {
            res.json({ success: false, message: "Invalid ID or Password!" });
        }
    } catch (err) { res.status(500).json({ success: false }); }
});

// 2. Register New User (From Admin Panel)
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "User registered in VIP Database!" });
    } catch (err) {
        res.json({ success: false, message: "ID already exists or Data Error!" });
    }
});

// 3. Get All Users (To show in Admin Tables)
app.get('/api/admin/users', async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// 4. Send & Store Communication
app.post('/api/admin/send-comms', async (req, res) => {
    try {
        const newMsg = new Comms(req.body);
        await newMsg.save();
        io.emit('receive-notification', req.body); // Real-time broadcast
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// 5. Get History
app.get('/api/comms/history', async (req, res) => {
    const history = await Comms.find().sort({ date: -1 }).limit(10);
    res.json(history);
});

// HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/html/login.html')));
app.get('/admin-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/html/admin-dashboard.html')));

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server Live on ${PORT}`));
