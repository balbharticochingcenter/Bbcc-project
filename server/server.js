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
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, 
    fname: String,
    mname: String,
    lname: String,
    mobile: String,
    email: String,
    financeAmount: Number,
    paymentStatus: { type: String, default: "Unpaid" },
    joinDate: { type: Date, default: Date.now },
    profilePhoto: { type: String, default: "/assets/default-user.png" }
});
const User = mongoose.model('User', userSchema);

const commsSchema = new mongoose.Schema({
    message: String,
    type: String, 
    target: String, 
    date: { type: Date, default: Date.now }
});
const Comms = mongoose.model('Comms', commsSchema);

// --- MIDDLEWARES & STATIC FILES ---
app.use(cors());
app.use(bodyParser.json());

// Kyunki server.js 'server/' folder mein hai, hume ek step bahar nikal kar 'public' mein jaana hoga
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// --- API ROUTES ---

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

app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "User registered!" });
    } catch (err) { res.json({ success: false, message: "ID exists!" }); }
});


// Purana notices aur notifications fetch karne ke liye
app.get('/api/admin/comms-history', async (req, res) => {
    try {
        const history = await Comms.find().sort({ date: -1 }).limit(20); // Latest 20 records
        res.json(history);
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching history" });
    }
});
// Notice ya Notification save aur broadcast karne ke liye
app.post('/api/admin/send-comms', async (req, res) => {
    try {
        const { message, target, type } = req.body;
        
        // 1. Database mein save karein
        const newComm = new Comms({ message, target, type });
        await newComm.save();

        // 2. Socket.io ke zariye live broadcast karein
        io.emit('new_announcement', { message, target, type });

        res.json({ success: true, message: "Communication sent and saved!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error sending message" });
    }
});
// Saare users ko table mein dikhane ke liye
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }); // Admin ko chhod kar baaki sab
        res.json(users);
    } catch (err) {
        res.status(500).json({ success: false });
    }
});
// Base URL (https://balbharticoachingcenter.onrender.com/) pe ye khulega
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'html/login.html'));
});

// Baaki saare pages ke liye
app.get('/html/:page', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', req.params.page));
});


// --- SERVER START ---
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server Live on Port: ${PORT}`));

