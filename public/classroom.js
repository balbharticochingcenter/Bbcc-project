// classroom.js में सबसे पहले ये code add करें:
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('auth');
    
    // Check if coming from login
    if (!authToken || !sessionStorage.getItem('classroom_auth')) {
        alert('Access denied! Please login first.');
        window.location.href = '/classroom-login.html';
        return;
    }
    
    // Verify user ID
    const userId = urlParams.get('userId');
    const storedUserId = sessionStorage.getItem('user_id');
    
    if (userId !== storedUserId) {
        alert('Session mismatch! Please login again.');
        sessionStorage.clear();
        window.location.href = '/classroom-login.html';
        return;
    }
    
    // Clear session on page unload (optional)
    window.addEventListener('beforeunload', function() {
        sessionStorage.removeItem('classroom_auth');
    });
});

// Configuration
let socket;
let localStream;
let peerConnections = {};
let currentRoomId;
let currentUser = {};
let isMuted = false;
let isVideoOff = false;
let isDND = false;

// DOM Elements
const localVideo = document.getElementById('localVideo');
const videoGrid = document.getElementById('videoGrid');
const toggleMicBtn = document.getElementById('toggleMic');
const toggleVideoBtn = document.getElementById('toggleVideo');
const toggleDndBtn = document.getElementById('toggleDnd');
const endCallBtn = document.getElementById('endCall');
const shareScreenBtn = document.getElementById('shareScreen');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');
const participantsList = document.getElementById('participantsList');

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const userType = urlParams.get('userType');
const userName = urlParams.get('name');
const roomId = urlParams.get('roomId') || 'default_class';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUser();
    initializeSocket();
    initializeMedia();
    setupEventListeners();
});

function initializeUser() {
    currentUser = { userId, userType, userName, roomId };
    
    // Update UI
    document.getElementById('userName').textContent = userName;
    document.getElementById('roomIdDisplay').textContent = roomId;
    document.getElementById('localUserName').textContent = userName;
    
    // Set user badge color
    const userBadge = document.getElementById('userBadge');
    const userRole = document.getElementById('userRole');
    
    if (userType === 'teacher') {
        userBadge.classList.add('teacher');
        userRole.textContent = 'Mentor';
    } else if (userType === 'admin') {
        userBadge.classList.add('admin');
        userRole.textContent = 'Admin';
    } else {
        userRole.textContent = 'Student';
    }
}

function initializeSocket() {
    // Connect to Socket.IO server
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        
        // Join classroom
        socket.emit('join-classroom', {
            roomId: currentUser.roomId,
            userId: currentUser.userId,
            userName: currentUser.userName,
            userType: currentUser.userType
        });
    });
    
    // Listen for other users joining
    socket.on('user-joined', (data) => {
        console.log('User joined:', data.userName);
        addParticipant(data);
        createPeerConnection(data.socketId, data.userName);
        sendOffer(data.socketId);
    });
    
    // Listen for WebRTC offers
    socket.on('offer', async (data) => {
        await handleOffer(data);
    });
    
    // Listen for WebRTC answers
    socket.on('answer', async (data) => {
        await handleAnswer(data);
    });
    
    // Listen for ICE candidates
    socket.on('ice-candidate', async (data) => {
        await handleIceCandidate(data);
    });
    
    // Listen for mute/unmute events
    socket.on('user-muted', (data) => {
        updateUserStatus(data.socketId, 'muted', data.muted);
    });
    
    // Listen for video on/off events
    socket.on('user-video-off', (data) => {
        updateUserStatus(data.socketId, 'videoOff', data.videoOff);
    });
    
    // Listen for chat messages
    socket.on('new-message', (data) => {
        addMessage(data);
    });
    
    // Listen for user leaving
    socket.on('user-left', (data) => {
        removeUser(data.socketId);
    });
}

async function initializeMedia() {
    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Display local video
        localVideo.srcObject = localStream;
        
        // Set initial states
        updateControlButtons();
        
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Camera/microphone access required for classroom.');
    }
}

function setupEventListeners() {
    // Toggle microphone
    toggleMicBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
        updateControlButtons();
        socket.emit('toggle-mute', { muted: isMuted });
    });
    
    // Toggle camera
    toggleVideoBtn.addEventListener('click', () => {
        isVideoOff = !isVideoOff;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !isVideoOff;
        });
        updateControlButtons();
        socket.emit('toggle-video', { videoOff: isVideoOff });
    });
    
    // Toggle DND
    toggleDndBtn.addEventListener('click', () => {
        isDND = !isDND;
        updateControlButtons();
        
        if (isDND) {
            // Mute all remote audio
            Object.values(peerConnections).forEach(pc => {
                if (pc.remoteStream) {
                    pc.remoteStream.getAudioTracks().forEach(track => {
                        track.enabled = false;
                    });
                }
            });
        } else {
            // Unmute all remote audio
            Object.values(peerConnections).forEach(pc => {
                if (pc.remoteStream) {
                    pc.remoteStream.getAudioTracks().forEach(track => {
                        track.enabled = true;
                    });
                }
            });
        }
    });
    
    // Share screen
    shareScreenBtn.addEventListener('click', async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            // Replace video track in all peer connections
            const videoTrack = screenStream.getVideoTracks()[0];
            Object.values(peerConnections).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(videoTrack);
            });
            
            // Update local video
            localStream.getVideoTracks()[0].stop();
            localStream.removeTrack(localStream.getVideoTracks()[0]);
            localStream.addTrack(videoTrack);
            
            // Handle when user stops sharing
            videoTrack.onended = () => {
                initializeMedia();
            };
            
        } catch (error) {
            console.error('Screen sharing failed:', error);
        }
    });
    
    // End call
    endCallBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the classroom?')) {
            window.location.href = '/classroom-login.html';
        }
    });
    
    // Send message
    sendMessageBtn.addEventListener('click', sendChatMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

function updateControlButtons() {
    toggleMicBtn.classList.toggle('active', isMuted);
    toggleMicBtn.innerHTML = isMuted ? '<i class="fas fa-microphone-slash"></i>' : '<i class="fas fa-microphone"></i>';
    
    toggleVideoBtn.classList.toggle('active', isVideoOff);
    toggleVideoBtn.innerHTML = isVideoOff ? '<i class="fas fa-video-slash"></i>' : '<i class="fas fa-video"></i>';
    
    toggleDndBtn.classList.toggle('active', isDND);
    toggleDndBtn.innerHTML = isDND ? '<i class="fas fa-bell"></i>' : '<i class="fas fa-bell-slash"></i>';
}

// WebRTC Functions
function createPeerConnection(socketId, userName) {
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });
    
    // Add local stream to connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        displayRemoteVideo(socketId, userName, remoteStream);
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: socketId,
                candidate: event.candidate
            });
        }
    };
    
    // Store connection
    peerConnections[socketId] = {
        pc: peerConnection,
        userName: userName
    };
    
    return peerConnection;
}

async function sendOffer(targetSocketId) {
    const peerConnection = peerConnections[targetSocketId].pc;
    
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('offer', {
            target: targetSocketId,
            offer: offer,
            senderName: currentUser.userName
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

async function handleOffer(data) {
    const { sender, offer, senderName } = data;
    
    if (!peerConnections[sender]) {
        createPeerConnection(sender, senderName);
    }
    
    const peerConnection = peerConnections[sender].pc;
    
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answer', {
            target: sender,
            answer: answer
        });
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

async function handleAnswer(data) {
    const { sender, answer } = data;
    
    if (peerConnections[sender]) {
        const peerConnection = peerConnections[sender].pc;
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }
}

async function handleIceCandidate(data) {
    const { sender, candidate } = data;
    
    if (peerConnections[sender]) {
        const peerConnection = peerConnections[sender].pc;
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }
}

// UI Functions
function displayRemoteVideo(socketId, userName, stream) {
    // Remove existing video if present
    const existingVideo = document.getElementById(`video-${socketId}`);
    if (existingVideo) {
        existingVideo.remove();
    }
    
    // Create video element
    const videoBox = document.createElement('div');
    videoBox.className = 'video-box';
    videoBox.id = `video-box-${socketId}`;
    
    const video = document.createElement('video');
    video.id = `video-${socketId}`;
    video.autoplay = true;
    video.srcObject = stream;
    
    const videoInfo = document.createElement('div');
    videoInfo.className = 'video-info';
    videoInfo.innerHTML = `<span>${userName}</span>`;
    
    const videoStatus = document.createElement('div');
    videoStatus.className = 'video-status';
    videoStatus.innerHTML = `
        <div class="status-icon mic-status" id="mic-status-${socketId}">
            <i class="fas fa-microphone"></i>
        </div>
        <div class="status-icon video-status" id="video-status-${socketId}">
            <i class="fas fa-video"></i>
        </div>
    `;
    
    videoBox.appendChild(video);
    videoBox.appendChild(videoInfo);
    videoBox.appendChild(videoStatus);
    
    videoGrid.appendChild(videoBox);
    
    // Store remote stream
    if (peerConnections[socketId]) {
        peerConnections[socketId].remoteStream = stream;
    }
}

function updateUserStatus(socketId, type, value) {
    const micIcon = document.getElementById(`mic-status-${socketId}`);
    const videoIcon = document.getElementById(`video-status-${socketId}`);
    
    if (micIcon) {
        micIcon.innerHTML = value ? 
            '<i class="fas fa-microphone-slash"></i>' : 
            '<i class="fas fa-microphone"></i>';
    }
    
    if (videoIcon) {
        videoIcon.innerHTML = value ? 
            '<i class="fas fa-video-slash"></i>' : 
            '<i class="fas fa-video"></i>';
    }
}

function removeUser(socketId) {
    // Remove video element
    const videoBox = document.getElementById(`video-box-${socketId}`);
    if (videoBox) {
        videoBox.remove();
    }
    
    // Close peer connection
    if (peerConnections[socketId]) {
        peerConnections[socketId].pc.close();
        delete peerConnections[socketId];
    }
    
    // Remove from participants list
    const participant = document.getElementById(`participant-${socketId}`);
    if (participant) {
        participant.remove();
    }
    
    updateParticipantCount();
}

// Chat Functions
function sendChatMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    socket.emit('send-message', {
        message: message
    });
    
    // Add to own chat
    addMessage({
        userId: currentUser.userId,
        userName: currentUser.userName,
        message: message,
        timestamp: new Date().toISOString(),
        userType: currentUser.userType
    }, true);
    
    messageInput.value = '';
}

function addMessage(data, isSelf = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.userType} ${isSelf ? 'self' : ''}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <strong>${data.userName}</strong>
            <span>${time}</span>
        </div>
        <div class="message-body">${data.message}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Participants Functions
function addParticipant(data) {
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    participantDiv.id = `participant-${data.socketId}`;
    
    const iconColor = data.userType === 'teacher' ? '#059669' : 
                     data.userType === 'admin' ? '#dc2626' : '#4f46e5';
    
    participantDiv.innerHTML = `
        <div class="participant-icon" style="background:${iconColor};">
            <i class="fas fa-user"></i>
        </div>
        <div>
            <div style="font-weight:bold;">${data.userName}</div>
            <div style="font-size:12px;color:#94a3b8;">
                ${data.userType === 'teacher' ? 'Mentor' : 
                  data.userType === 'admin' ? 'Admin' : 'Student'}
            </div>
        </div>
    `;
    
    participantsList.appendChild(participantDiv);
    updateParticipantCount();
}

function updateParticipantCount() {
    const count = document.querySelectorAll('.participant').length + 1; // +1 for self
    document.getElementById('participantCount').textContent = count;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
    
    // Stop all media tracks
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => {
        pc.pc.close();
    });
});