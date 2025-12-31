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

// Port setup for Render
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Sahi path static files ke liye
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Atlas connection
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlas Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/login.html'));
});

app.post('/login', (req, res) => {
    const { role, username, password } = req.body;
    if (username === 'admin' && password === 'pass' && role === 'admin') res.json({ success: true });
    else if (username === 'teacher' && password === 'pass' && role === 'teacher') res.json({ success: true });
    else if (username === 'student' && password === 'pass' && role === 'student') res.json({ success: true });
    else res.json({ success: false });
});

// Real-time notifications
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => console.log('User disconnected'));
});

// Server ko '0.0.0.0' par bind karna Render ke liye zaroori hai
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
