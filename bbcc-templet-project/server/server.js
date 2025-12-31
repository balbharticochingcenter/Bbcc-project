const express = require('express');  // Yeh Express framework import karta hai for server.
const mongoose = require('mongoose');  // Yeh MongoDB connection ke liye hai.
const bodyParser = require('body-parser');  // Yeh request bodies parse karta hai.
const cors = require('cors');  // Yeh cross-origin requests allow karta hai.
const { Server } = require('socket.io');  // Yeh Socket.io for real-time notifications.
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);  // Yeh Socket.io server initialize karta hai.

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));  // Yeh public folder serve karta hai.

// MongoDB connection (simulate karo ya real connect karo)
mongoose.connect('mongodb://localhost:27017/bbcc-templet', { useNewUrlParser: true });  // Yeh MongoDB se connect karta hai. Agar local nahi hai, Atlas use karo.

// Simulated data (real mein database use karo)
let toggles = { gallery: true, courses: true, admission: true };  // Yeh admin toggles store karta hai.
let students = [{ id: 1, name: 'Student A', feeStatus: 'Paid', attendance: '95%' }];  // Yeh student data simulate karta hai.

// Routes
app.post('/login', (req, res) => {  // Yeh login route handle karta hai.
    const { role, username, password } = req.body;
    // Simulated auth (real mein hash check karo)
    if (username === 'admin' && password === 'pass' && role === 'admin') res.json({ success: true });
    else if (username === 'teacher' && password === 'pass' && role === 'teacher') res.json({ success: true });
    else if (username === 'student' && password === 'pass' && role === 'student') res.json({ success: true });
    else res.json({ success: false });
});

app.get('/admin/toggles', (req, res) => {  // Yeh admin toggles get karta hai.
    res.json(toggles);
});

app.post('/admin/toggles', (req, res) => {  // Yeh admin toggles update karta hai.
    toggles = req.body;
    res.json({ success: true });
});

app.get('/teacher/students', (req, res) => {  // Yeh teacher ke liye student list bhejta hai.
    res.json(students);
});

app.post('/teacher/notify', (req, res) => {  // Yeh teacher notification bhejta hai via Socket.io.
    const { message } = req.body;
    io.emit('notification', message);  // Yeh real-time popup bhejta hai.
    res.json({ success: true });
});

app.get('/student/data', (req, res) => {  // Yeh student data bhejta hai.
    res.json(students[0]);  // Simulated for one student.
});

// Automated reminders (simulate karo)
setInterval(() => {  // Yeh har 10 seconds mein fee reminder check karta hai.
    students.forEach(student => {
        if (student.feeStatus === 'Unpaid') {
            console.log(`Reminder: ${student.name} ka fee due hai.`);  // Yeh WhatsApp/SMS simulate karta hai.
            // Yahan apni API Key dalein, e.g., Twilio for SMS: const twilio = require('twilio'); twilio.sendMessage();
        }
    });
}, 10000);

// Socket.io for real-time
io.on('connection', (socket) => {  // Yeh client connection handle karta hai.
    console.log('User connected');
});

server.listen(3000, () => console.log('Server running on port 3000'));  // Yeh server start karta hai.