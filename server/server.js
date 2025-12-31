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

// Render.com compatibility
const PORT = process.env.PORT || 3000;

// --- DATABASE CONNECTION ---
// Render ke dashboard mein Environment Variable "MONGO_URI" zaroor set karein
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BBCC_Portal'; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ VIP Database Connected via Atlas/Render"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- SCHEMAS ---

// 1. User Schema (Detailed)
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // admin, teacher, student
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

// 2. Communication Schema (Notice Board)
const commsSchema = new mongoose.Schema({
    message: String,
    type: String, 
    target: String, 
    date: { type: Date, default: Date.now }
});
const Comms = mongoose.model('Comms', commsSchema);

// --- MIDDLEWARES ---
app.use(cors());
app.use(bodyParser.json());
// Static files setup
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// 1. Login Logic
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && user.password === password) {
            let redirectPath = '/html/student-dashboard.html';
            if (user.role === 'admin') redirectPath = '/html/admin-dashboard.html';
            if (user.role === 'teacher') redirectPath = '/html/teacher-dashboard.html';
            
            const { password, ...userData } = user._doc;
            res.json({ success: true, redirect: redirectPath, user: userData });
        } else {
            res.json({ success: false, message: "Invalid ID or Password!" });
        }
    } catch (err) { 
        res.status(500).json({ success: false, message: "Server Error" }); 
    }
});

// 2. Register New User (Admin function)
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "User registered in VIP Database!" });
    } catch (err) {
        res.json({ success: false, message: "ID already exists or Data Error!" });
    }
});

// 3. Get All Users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (err) { res.status(500).send(err); }
});

// 4. Socket.io Notification Trigger
app.post('/api/admin/send-comms', async (req, res) => {
    try {
        const newMsg = new Comms(req.body);
        await newMsg.save();
        io.emit('receive-notification', req.body); 
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// 5. Notification History
app.get('/api/comms/history', async (req, res) => {
    const history = await Comms.find().sort({ date: -1 }).limit(10);
    res.json(history);
});

// --- HTML ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/html/login.html')));
app.get('/admin-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public/html/admin-dashboard.html')));

// --- SERVER START ---
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server Live on Port: ${PORT}`));
