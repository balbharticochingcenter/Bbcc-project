// 🔐 SECURITY CHECK
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    if (!userId) {
        alert('❌ Please login first.');
        window.location.href = '/classroom-login.html';
        return;
    }
});

// 🔧 CONFIGURATION
let socket;
let localStream;
let peerConnections = {};
let currentUser = {};

// 📺 DOM Elements
const localVideo = document.getElementById('localVideo');
const videoGrid = document.getElementById('videoGrid');

// 📍 URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const userType = urlParams.get('userType') || 'student';
const userName = urlParams.get('name') || 'User';
const roomId = urlParams.get('roomId') || `room_${Date.now()}`;

// 🚀 INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Classroom starting...');
    initializeUser();
    initializeSocket();
    initializeMedia();
});

function initializeUser() {
    currentUser = { userId, userType, userName, roomId };
    console.log('👤 User:', currentUser);
    
    // Update UI
    document.getElementById('userName').textContent = userName;
    document.getElementById('roomIdDisplay').textContent = roomId.substring(0, 10) + '...';
}

// 🌐 SOCKET.IO - SIMPLE VERSION
function initializeSocket() {
    console.log('🔌 Connecting to server...');
    
    socket = io();
    
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        
        socket.emit('join-classroom', {
            roomId: currentUser.roomId,
            userId: currentUser.userId,
            userName: currentUser.userName,
            userType: currentUser.userType
        });
    });
    
    socket.on('existing-users', (users) => {
        console.log('👥 Existing users:', users.length);
        
        users.forEach(user => {
            console.log(`🔗 Connecting to: ${user.userName}`);
            createPeerConnection(user.socketId, user.userName);
            setTimeout(() => sendOffer(user.socketId, user.userName), 500);
        });
    });
    
    socket.on('user-joined', (data) => {
        console.log('➕ New user:', data.userName);
        createPeerConnection(data.socketId, data.userName);
        setTimeout(() => sendOffer(data.socketId, data.userName), 500);
    });
    
    socket.on('offer', async (data) => {
        console.log('📩 Received offer from:', data.senderName);
        await handleOffer(data);
    });
    
    socket.on('answer', async (data) => {
        console.log('📨 Received answer from:', data.sender);
        await handleAnswer(data);
    });
    
    socket.on('ice-candidate', async (data) => {
        await handleIceCandidate(data);
    });
    
    socket.on('user-left', (data) => {
        console.log('👋 User left:', data.socketId);
        removeUser(data.socketId);
    });
}

// 🎥 MEDIA SETUP
async function initializeMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ Media access granted');
        localVideo.srcObject = localStream;
        localVideo.muted = true;
        
    } catch (error) {
        console.error('❌ Media error:', error);
        alert('Please allow camera/microphone access.');
    }
}

// 🌐 WEBRTC - SIMPLE VERSION
function createPeerConnection(socketId, userName) {
    console.log(`🤝 Creating connection for ${userName}`);
    
    if (peerConnections[socketId]) {
        console.log(`⚠️ Already connected to ${userName}`);
        return peerConnections[socketId].pc;
    }
    
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });
    
    // Add local tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    }
    
    // Handle remote stream
    pc.ontrack = (event) => {
        console.log(`📺 Received stream from ${userName}`);
        displayRemoteVideo(socketId, userName, event.streams[0]);
    };
    
    // ICE Candidate
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: socketId,
                candidate: event.candidate
            });
        }
    };
    
    // Store connection
    peerConnections[socketId] = { pc, userName };
    
    return pc;
}

async function sendOffer(targetSocketId, targetUserName) {
    const pc = peerConnections[targetSocketId]?.pc;
    if (!pc) return;
    
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('offer', {
            target: targetSocketId,
            offer: offer,
            senderName: currentUser.userName,
            senderId: socket.id
        });
        
        console.log(`📤 Offer sent to ${targetUserName}`);
        
    } catch (error) {
        console.error('❌ Error sending offer:', error);
    }
}

async function handleOffer(data) {
    const { sender, offer, senderName } = data;
    
    if (!peerConnections[sender]) {
        createPeerConnection(sender, senderName);
    }
    
    const pc = peerConnections[sender].pc;
    
    try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', {
            target: sender,
            answer: answer
        });
        
        console.log(`📤 Answer sent to ${senderName}`);
        
    } catch (error) {
        console.error('❌ Error handling offer:', error);
    }
}

async function handleAnswer(data) {
    const { sender, answer } = data;
    
    if (peerConnections[sender]) {
        const pc = peerConnections[sender].pc;
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`✅ Answer processed for ${peerConnections[sender].userName}`);
        } catch (error) {
            console.error('❌ Error handling answer:', error);
        }
    }
}

async function handleIceCandidate(data) {
    const { sender, candidate } = data;
    
    if (peerConnections[sender]) {
        const pc = peerConnections[sender].pc;
        try {
            if (candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`✅ ICE candidate added for ${peerConnections[sender].userName}`);
            }
        } catch (error) {
            console.error('❌ Error adding ICE candidate:', error);
        }
    }
}

// 🎬 VIDEO DISPLAY
function displayRemoteVideo(socketId, userName, stream) {
    console.log(`🎬 Displaying video for ${userName}`);
    
    // Remove existing
    const existing = document.getElementById(`video-box-${socketId}`);
    if (existing) existing.remove();
    
    // Create video box
    const videoBox = document.createElement('div');
    videoBox.className = 'video-box';
    videoBox.id = `video-box-${socketId}`;
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    
    const videoInfo = document.createElement('div');
    videoInfo.className = 'video-info';
    videoInfo.innerHTML = `<i class="fas fa-user"></i> <span>${userName}</span>`;
    
    videoBox.appendChild(video);
    videoBox.appendChild(videoInfo);
    videoGrid.appendChild(videoBox);
    
    console.log(`✅ Video displayed for ${userName}`);
}

function removeUser(socketId) {
    const videoBox = document.getElementById(`video-box-${socketId}`);
    if (videoBox) videoBox.remove();
    
    if (peerConnections[socketId]) {
        peerConnections[socketId].pc.close();
        delete peerConnections[socketId];
    }
    
    console.log(`🗑️ Removed user: ${socketId}`);
}

// 📱 BASIC CONTROLS
document.getElementById('toggleMic').addEventListener('click', () => {
    if (localStream) {
        localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
    }
});

document.getElementById('toggleVideo').addEventListener('click', () => {
    if (localStream) {
        localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
    }
});

document.getElementById('shareScreen').addEventListener('click', async () => {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        const videoTrack = localStream.getVideoTracks()[0];
        
        if (videoTrack) {
            localStream.removeTrack(videoTrack);
            videoTrack.stop();
        }
        
        localStream.addTrack(screenTrack);
        localVideo.srcObject = localStream;
        
        // Replace in all connections
        Object.values(peerConnections).forEach(pcData => {
            const sender = pcData.pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
        });
        
        console.log('🖥️ Screen sharing started');
        
    } catch (error) {
        console.error('❌ Screen share error:', error);
    }
});

// 🚪 LEAVE
document.getElementById('endCall').addEventListener('click', () => {
    if (confirm('Leave classroom?')) {
        window.location.href = '/classroom-login.html';
    }
});

// 💬 CHAT SIMPLE
document.getElementById('sendMessage').addEventListener('click', () => {
    const message = document.getElementById('messageInput').value.trim();
    if (!message) return;
    
    socket.emit('send-message', { message: message });
    
    const chatDiv = document.createElement('div');
    chatDiv.className = 'message self';
    chatDiv.textContent = `${userName}: ${message}`;
    document.getElementById('chatMessages').appendChild(chatDiv);
    
    document.getElementById('messageInput').value = '';
});

socket.on('new-message', (data) => {
    const chatDiv = document.createElement('div');
    chatDiv.className = 'message';
    chatDiv.textContent = `${data.userName}: ${data.message}`;
    document.getElementById('chatMessages').appendChild(chatDiv);
});

console.log('✅ Classroom.js loaded!');
console.log('👤 User:', userName);
console.log('🏠 Room:', roomId);
