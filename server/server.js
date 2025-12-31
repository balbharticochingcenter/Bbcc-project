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

// --- MIDDLEWARES ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Photo upload ke liye limit badha di hai

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// --- API ROUTES ---

// 1. Login
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

// 2. Create User
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ success: true, message: "User registered!" });
    } catch (err) { res.json({ success: false, message: "ID exists!" }); }
});

// 3. Get All Users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } });
        res.json(users);
    } catch (err) { res.status(500).json({ success: false }); }
});

// 4. Update User Detail (ID ke basis par)
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

// 5. Communications History
app.get('/api/admin/comms-history', async (req, res) => {
    try {
        const history = await Comms.find().sort({ date: -1 }).limit(30);
        res.json(history);
    } catch (err) { res.status(500).json({ success: false }); }
});

// 6. Delete Communication Message
app.delete('/api/admin/comms/:id', async (req, res) => {
    try {
        await Comms.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted!" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 7. Send & Broadcast Message
app.post('/api/admin/send-comms', async (req, res) => {
    try {
        const { message, target, type } = req.body;
        const newComm = new Comms({ message, target, type });
        await newComm.save();
        io.emit('new_announcement', { message, target, type });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- HTML ROUTES ---
app.get('/', (req, res) => { res.sendFile(path.join(publicPath, 'html/login.html')); });
app.get('/html/:page', (req, res) => { res.sendFile(path.join(publicPath, 'html', req.params.page)); });

// --- SERVER START ---
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server Live: ${PORT}`));

// Result Logic
function loadStudentsForResult() {
    const selectedClass = document.getElementById('resClassSelect').value;
    const globalTotal = document.getElementById('globalTotalMarks').value;
    const tbody = document.getElementById('resultTableBody');
    tbody.innerHTML = "";

    // Filter students only
    const students = mainData.filter(u => u.role === 'student');

    students.forEach(u => {
        // Masking Mobile: 98******21
        const mob = u.mobile || "0000000000";
        const maskedMob = mob.substring(0, 2) + "******" + mob.substring(mob.length - 2);

        tbody.innerHTML += `
            <tr data-id="${u.username}">
                <td><img src="${u.profilePhoto}" class="table-img"></td>
                <td><b>${u.username}</b></td>
                <td>${u.fname} ${u.lname}</td>
                <td class="masked-mobile">${maskedMob}</td>
                <td>
                    <input type="number" class="obtained-marks" value="${u.marksObtained || 0}" 
                    oninput="calculateSingleDivision(this)">
                </td>
                <td class="total-marks-cell">${globalTotal}</td>
                <td class="division-cell">-</td>
            </tr>
        `;
    });
    updateAllDivisions();
}

function calculateSingleDivision(input) {
    const row = input.closest('tr');
    const obtained = parseFloat(input.value) || 0;
    const total = parseFloat(document.getElementById('globalTotalMarks').value) || 1;
    const cell = row.querySelector('.division-cell');
    
    const percentage = (obtained / total) * 100;
    
    if (percentage >= 60) cell.innerHTML = '<span class="division-badge div-first">1st Div</span>';
    else if (percentage >= 45) cell.innerHTML = '<span class="division-badge div-second">2nd Div</span>';
    else if (percentage >= 33) cell.innerHTML = '<span class="division-badge div-third">3rd Div</span>';
    else cell.innerHTML = '<span class="division-badge div-fail">Fail</span>';
}

function updateAllDivisions() {
    const total = document.getElementById('globalTotalMarks').value;
    document.querySelectorAll('.total-marks-cell').forEach(td => td.innerText = total);
    document.querySelectorAll('.obtained-marks').forEach(input => calculateSingleDivision(input));
}

async function saveAllResults() {
    const rows = document.querySelectorAll('#resultTableBody tr');
    const results = [];

    rows.forEach(row => {
        results.push({
            username: row.getAttribute('data-id'),
            marksObtained: row.querySelector('.obtained-marks').value,
            totalMarks: document.getElementById('globalTotalMarks').value
        });
    });

    try {
        const res = await fetch('/api/admin/update-batch-results', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ results })
        });
        if(res.ok) alert("All results updated successfully!");
    } catch (err) {
        alert("Error saving results to server");
    }
}
