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
// Local testing ke liye: 'mongodb://127.0.0.1:27017/BBCC_DB'
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BBCC_DB'; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ BBCC MongoDB Database Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'teacher', 'student'] }, // Role fixed kar diye
    fname: String,
    lname: String,
    mobile: String,
    email: String,
    joinDate: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Public folder setup

// --- API ROUTES ---

// 1. Logic to Redirect based on MongoDB Role
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });

        if (user && user.password === password) {
            let redirectPath = '';

            // Role check logic
            switch(user.role) {
                case 'admin':
                    redirectPath = '/html/admin-dashboard.html';
                    break;
                case 'teacher':
                    redirectPath = '/html/teacher-dashboard.html';
                    break;
                case 'student':
                    redirectPath = '/html/student-dashboard.html';
                    break;
                default:
                    redirectPath = '/html/login.html';
            }

            res.json({ 
                success: true, 
                redirect: redirectPath, 
                role: user.role,
                message: `Welcome ${user.fname || user.username}` 
            });
        } else {
            res.json({ success: false, message: "ID or Password Galat Hai!" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// 2. Admin Route: Create User (Role-wise)
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "Naya User Register Ho Gaya!" });
    } catch (err) {
        res.json({ success: false, message: "ID Pehle se exist karti hai!" });
    }
});

// HTML Serving
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/html/login.html')));

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server Live on http://localhost:${PORT}`));
