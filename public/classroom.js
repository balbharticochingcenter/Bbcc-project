// 🔐 SECURITY CHECK - सबसे पहले
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    if (!userId) {
        alert('❌ Access denied! Please login first.');
        window.location.href = '/classroom-login.html';
        return;
    }
    
    console.log('✅ Security check passed for:', userId);
});

// 🔧 CONFIGURATION
let socket;
let localStream;
let peerConnections = {};
let currentUser = {};
let isMuted = false;
let isVideoOff = false;
let isDND = false;

// 📺 DOM Elements
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
    setupEventListeners();
    startConnectionCheck();
});

function initializeUser() {
    currentUser = { userId, userType, userName, roomId };
    
    console.log('👤 User:', currentUser);
    
    // Update UI
    document.getElementById('userName').textContent = userName;
    document.getElementById('roomIdDisplay').textContent = roomId.substring(0, 10) + '...';
    document.getElementById('localUserName').textContent = userName;
    
    // User badge
    const userBadge = document.getElementById('userBadge');
    const userRole = document.getElementById('userRole');
    
    if (userType === 'teacher') {
        userBadge.classList.add('teacher');
        userRole.textContent = '👨‍🏫 Mentor';
    } else if (userType === 'admin') {
        userBadge.classList.add('admin');
        userRole.textContent = '👑 Admin';
    } else {
        userRole.textContent = '🎓 Student';
    }
    
    console.log(`✅ ${userName} (${userType}) joined room: ${roomId}`);
}

// 🌐 SOCKET.IO
function initializeSocket() {
    console.log('🔌 Connecting to server...');
    
    // Connect to Socket.IO server
    socket = io();
    
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        
        // Join classroom
        socket.emit('join-classroom', {
            roomId: currentUser.roomId,
            userId: currentUser.userId,
            userName: currentUser.userName,
            userType: currentUser.userType
        });
        
        console.log('📨 Sent join request for room:', currentUser.roomId);
    });
    
    // 🆕 Existing users in room
    socket.on('existing-users', (users) => {
        console.log('👥 Existing users:', users.length);
        
        if (users.length === 0) {
            console.log('😊 You are the first one in this room!');
            return;
        }
        
        // Connect to all existing users
        users.forEach(user => {
            console.log(`🔗 Connecting to: ${user.userName} (${user.socketId})`);
            connectToUser(user.socketId, user.userName);
        });
    });
    
    // ➕ New user joined
    socket.on('user-joined', (data) => {
        console.log('➕ New user joined:', data.userName);
        
        // Add to participants list
        addParticipant(data);
        
        // Connect to new user
        connectToUser(data.socketId, data.userName);
    });
    
    // 📞 WebRTC Offers
    socket.on('offer', async (data) => {
        console.log('📩 Received offer from:', data.senderName);
        await handleOffer(data);
    });
    
    // 📞 WebRTC Answers
    socket.on('answer', async (data) => {
        console.log('📨 Received answer from:', data.sender);
        await handleAnswer(data);
    });
    
    // 🧊 ICE Candidates
    socket.on('ice-candidate', async (data) => {
        await handleIceCandidate(data);
    });
    
    // 🔇 Mute events
    socket.on('user-muted', (data) => {
        updateUserStatus(data.socketId, 'muted', data.muted);
    });
    
    // 📹 Video events
    socket.on('user-video-off', (data) => {
        updateUserStatus(data.socketId, 'videoOff', data.videoOff);
    });
    
    // 💬 Chat messages
    socket.on('new-message', (data) => {
        addMessage(data);
    });
    
    // 🚪 User left
    socket.on('user-left', (data) => {
        console.log('👋 User left:', data.socketId);
        removeUser(data.socketId);
    });
    
    // ❌ Connection error
    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        alert('Connection error. Please refresh the page.');
    });
    
    // ✅ Get room users
    socket.on('get-room-users', (users) => {
        console.log('📋 Users in room:', users);
    });
}

// 🎥 MEDIA SETUP
async function initializeMedia() {
    try {
        console.log('🎥 Getting camera and microphone...');
        
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        console.log('✅ Media access granted');
        
        // Display local video
        localVideo.srcObject = localStream;
        
        // Set initial states
        updateControlButtons();
        
        showNotification('Camera and microphone connected successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Media access error:', error);
        
        if (error.name === 'NotAllowedError') {
            alert('⚠️ Camera/microphone access was denied. Please allow access to join the classroom.');
        } else if (error.name === 'NotFoundError') {
            alert('⚠️ No camera/microphone found. Please connect a device.');
        } else {
            alert('⚠️ Error accessing media devices: ' + error.message);
        }
    }
}

// 🎮 EVENT LISTENERS
function setupEventListeners() {
    // 🎤 Toggle microphone
    toggleMicBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
        updateControlButtons();
        socket.emit('toggle-mute', { muted: isMuted });
        
        showNotification(isMuted ? 'Microphone muted' : 'Microphone unmuted', 'info');
    });
    
    // 📹 Toggle camera
    toggleVideoBtn.addEventListener('click', () => {
        isVideoOff = !isVideoOff;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !isVideoOff;
        });
        updateControlButtons();
        socket.emit('toggle-video', { videoOff: isVideoOff });
        
        showNotification(isVideoOff ? 'Camera turned off' : 'Camera turned on', 'info');
    });
    
    // 🔕 Toggle Do Not Disturb
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
            showNotification('🔕 Do Not Disturb mode ON', 'warning');
        } else {
            // Unmute all remote audio
            Object.values(peerConnections).forEach(pc => {
                if (pc.remoteStream) {
                    pc.remoteStream.getAudioTracks().forEach(track => {
                        track.enabled = true;
                    });
                }
            });
            showNotification('🔔 Do Not Disturb mode OFF', 'success');
        }
    });
    
    // 🖥️ Share screen
    shareScreenBtn.addEventListener('click', async () => {
        try {
            console.log('🖥️ Starting screen share...');
            
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            const videoTrack = screenStream.getVideoTracks()[0];
            
            // Replace video track in all peer connections
            Object.values(peerConnections).forEach(pcData => {
                const sender = pcData.pc.getSenders().find(s => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
            
            // Update local video
            if (localStream.getVideoTracks()[0]) {
                localStream.getVideoTracks()[0].stop();
                localStream.removeTrack(localStream.getVideoTracks()[0]);
            }
            localStream.addTrack(videoTrack);
            
            showNotification('Screen sharing started', 'success');
            
            // Handle when user stops sharing
            videoTrack.onended = () => {
                console.log('🖥️ Screen sharing stopped');
                showNotification('Screen sharing stopped', 'info');
                initializeMedia(); // Restore camera
            };
            
        } catch (error) {
            console.error('❌ Screen share error:', error);
            showNotification('Screen sharing cancelled', 'error');
        }
    });
    
    // 🚪 End call
    endCallBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the classroom?')) {
            leaveClassroom();
        }
    });
    
    // 💬 Send message
    sendMessageBtn.addEventListener('click', sendChatMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Auto-focus message input
    messageInput.addEventListener('focus', () => {
        messageInput.placeholder = 'Type your message and press Enter...';
    });
    
    messageInput.addEventListener('blur', () => {
        messageInput.placeholder = 'Type your message...';
    });
}

// 🔄 UPDATE CONTROL BUTTONS
function updateControlButtons() {
    toggleMicBtn.classList.toggle('active', isMuted);
    toggleMicBtn.innerHTML = isMuted ? 
        '<i class="fas fa-microphone-slash"></i>' : 
        '<i class="fas fa-microphone"></i>';
    
    toggleVideoBtn.classList.toggle('active', isVideoOff);
    toggleVideoBtn.innerHTML = isVideoOff ? 
        '<i class="fas fa-video-slash"></i>' : 
        '<i class="fas fa-video"></i>';
    
    toggleDndBtn.classList.toggle('active', isDND);
    toggleDndBtn.innerHTML = isDND ? 
        '<i class="fas fa-bell"></i>' : 
        '<i class="fas fa-bell-slash"></i>';
}

// 🌐 WEBRTC FUNCTIONS

// Connect to a specific user
function connectToUser(socketId, userName) {
    console.log(`🔗 Connecting to ${userName}...`);
    
    if (peerConnections[socketId]) {
        console.log(`⚠️ Already connected to ${userName}`);
        return;
    }
    
    createPeerConnection(socketId, userName);
    
    // Send offer after a short delay
    setTimeout(() => {
        sendOffer(socketId);
    }, 1000);
}

// Create peer connection
function createPeerConnection(socketId, userName) {
    console.log(`🤝 Creating peer connection for ${userName}`);
    
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
        ]
    });
    
    // Add local stream tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
    
    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
        console.log(`📺 Received stream from ${userName}`);
        const remoteStream = event.streams[0];
        displayRemoteVideo(socketId, userName, remoteStream);
        
        // Store remote stream
        if (peerConnections[socketId]) {
            peerConnections[socketId].remoteStream = remoteStream;
        }
        
        updateConnectionStats();
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
    
    // Connection state changes
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`❄️ ICE state for ${userName}: ${peerConnection.iceConnectionState}`);
        
        if (peerConnection.iceConnectionState === 'connected' || 
            peerConnection.iceConnectionState === 'completed') {
            console.log(`✅ Connected to ${userName}`);
            showNotification(`Connected to ${userName}`, 'success');
        }
        
        if (peerConnection.iceConnectionState === 'disconnected' || 
            peerConnection.iceConnectionState === 'failed') {
            console.log(`❌ Lost connection to ${userName}`);
            showNotification(`Lost connection to ${userName}`, 'error');
        }
    };
    
    // Store connection
    peerConnections[socketId] = {
        pc: peerConnection,
        userName: userName,
        connected: false
    };
    
    return peerConnection;
}

// Send WebRTC offer
async function sendOffer(targetSocketId) {
    const peerConnection = peerConnections[targetSocketId]?.pc;
    
    if (!peerConnection) {
        console.error(`❌ No peer connection for ${targetSocketId}`);
        return;
    }
    
    try {
        console.log(`📤 Sending offer to ${peerConnections[targetSocketId].userName}`);
        
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('offer', {
            target: targetSocketId,
            offer: offer,
            senderName: currentUser.userName
        });
        
    } catch (error) {
        console.error('❌ Error creating offer:', error);
    }
}

// Handle incoming offer
async function handleOffer(data) {
    const { sender, offer, senderName } = data;
    
    console.log(`📥 Handling offer from ${senderName}`);
    
    if (!peerConnections[sender]) {
        console.log(`🆕 Creating new connection for ${senderName}`);
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
        
        console.log(`📤 Sent answer to ${senderName}`);
        
    } catch (error) {
        console.error('❌ Error handling offer:', error);
    }
}

// Handle incoming answer
async function handleAnswer(data) {
    const { sender, answer } = data;
    
    console.log(`📥 Handling answer from ${sender}`);
    
    if (peerConnections[sender]) {
        const peerConnection = peerConnections[sender].pc;
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`✅ Answer processed for ${peerConnections[sender].userName}`);
        } catch (error) {
            console.error('❌ Error handling answer:', error);
        }
    }
}

// Handle ICE candidate
async function handleIceCandidate(data) {
    const { sender, candidate } = data;
    
    if (peerConnections[sender]) {
        const peerConnection = peerConnections[sender].pc;
        try {
            if (candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('❌ Error adding ICE candidate:', error);
        }
    }
}

// 🎬 VIDEO DISPLAY FUNCTIONS

// Display remote video
function displayRemoteVideo(socketId, userName, stream) {
    console.log(`🎬 Displaying video for ${userName}`);
    
    // Remove existing video if present
    const existingVideoBox = document.getElementById(`video-box-${socketId}`);
    if (existingVideoBox) {
        existingVideoBox.remove();
    }
    
    // Create video container
    const videoBox = document.createElement('div');
    videoBox.className = 'video-box';
    videoBox.id = `video-box-${socketId}`;
    
    // Create video element
    const video = document.createElement('video');
    video.id = `video-${socketId}`;
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    
    // Video info overlay
    const videoInfo = document.createElement('div');
    videoInfo.className = 'video-info';
    videoInfo.innerHTML = `
        <i class="fas fa-user"></i>
        <span>${userName}</span>
        ${currentUser.userType === 'teacher' ? '<span class="teacher-tag">👨‍🏫</span>' : ''}
        ${currentUser.userType === 'admin' ? '<span class="admin-tag">👑</span>' : ''}
    `;
    
    // Status icons
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
    
    // Assemble video box
    videoBox.appendChild(video);
    videoBox.appendChild(videoInfo);
    videoBox.appendChild(videoStatus);
    
    // Add to video grid
    videoGrid.appendChild(videoBox);
    
    // Update stats
    updateConnectionStats();
    
    console.log(`✅ Video displayed for ${userName}`);
}

// Update user status icons
function updateUserStatus(socketId, type, value) {
    const micIcon = document.getElementById(`mic-status-${socketId}`);
    const videoIcon = document.getElementById(`video-status-${socketId}`);
    
    if (micIcon) {
        micIcon.innerHTML = value ? 
            '<i class="fas fa-microphone-slash" style="color:#ef4444;"></i>' : 
            '<i class="fas fa-microphone" style="color:#10b981;"></i>';
    }
    
    if (videoIcon) {
        videoIcon.innerHTML = value ? 
            '<i class="fas fa-video-slash" style="color:#ef4444;"></i>' : 
            '<i class="fas fa-video" style="color:#10b981;"></i>';
    }
}

// Remove user
function removeUser(socketId) {
    console.log(`🗑️ Removing user: ${socketId}`);
    
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
    
    // Update counts
    updateParticipantCount();
    updateConnectionStats();
    
    showNotification('A participant left the classroom', 'info');
}

// 💬 CHAT FUNCTIONS

function sendChatMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    console.log(`💬 Sending message: ${message.substring(0, 20)}...`);
    
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
    
    // Clear input
    messageInput.value = '';
    messageInput.focus();
}

function addMessage(data, isSelf = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.userType} ${isSelf ? 'self' : ''}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // User icon based on type
    let userIcon = '👤';
    if (data.userType === 'teacher') userIcon = '👨‍🏫';
    if (data.userType === 'admin') userIcon = '👑';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="user-icon">${userIcon}</span>
            <strong>${data.userName}</strong>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-body">${data.message}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Notification sound for new message (not from self)
    if (!isSelf) {
        playNotificationSound();
    }
}

// 👥 PARTICIPANTS FUNCTIONS

function addParticipant(data) {
    console.log(`👥 Adding participant: ${data.userName}`);
    
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    participantDiv.id = `participant-${data.socketId}`;
    
    // Icon color based on user type
    let iconColor = '#4f46e5'; // Student - blue
    let userIcon = '<i class="fas fa-user-graduate"></i>';
    
    if (data.userType === 'teacher') {
        iconColor = '#059669'; // Teacher - green
        userIcon = '<i class="fas fa-chalkboard-teacher"></i>';
    } else if (data.userType === 'admin') {
        iconColor = '#dc2626'; // Admin - red
        userIcon = '<i class="fas fa-user-shield"></i>';
    }
    
    participantDiv.innerHTML = `
        <div class="participant-icon" style="background:${iconColor};">
            ${userIcon}
        </div>
        <div class="participant-info">
            <div class="participant-name">${data.userName}</div>
            <div class="participant-role">
                ${data.userType === 'teacher' ? 'Mentor' : 
                  data.userType === 'admin' ? 'Admin' : 'Student'}
            </div>
        </div>
        <div class="participant-status">
            <div class="status-dot online"></div>
        </div>
    `;
    
    participantsList.appendChild(participantDiv);
    updateParticipantCount();
    
    // Notification for new participant
    if (data.userName !== currentUser.userName) {
        showNotification(`${data.userName} joined the classroom`, 'success');
    }
}

function updateParticipantCount() {
    const count = document.querySelectorAll('.participant').length + 1; // +1 for self
    document.getElementById('participantCount').textContent = count;
}

// 📊 STATISTICS & MONITORING

function updateConnectionStats() {
    const connectedCount = Object.keys(peerConnections).length;
    const videoCount = document.querySelectorAll('.video-box').length;
    
    // Update debug panel if exists
    const debugConnected = document.getElementById('debugConnected');
    const debugVideos = document.getElementById('debugVideos');
    
    if (debugConnected) debugConnected.textContent = connectedCount;
    if (debugVideos) debugVideos.textContent = videoCount;
    
    console.log(`📊 Stats: ${connectedCount} connections, ${videoCount} videos`);
}

function startConnectionCheck() {
    // Check connections every 10 seconds
    setInterval(() => {
        const connectedCount = Object.keys(peerConnections).length;
        const expectedCount = document.querySelectorAll('.participant').length;
        
        if (connectedCount < expectedCount) {
            console.log(`⚠️ Missing connections: ${expectedCount - connectedCount}`);
            // Try to reconnect
            socket.emit('get-room-users', { roomId: currentUser.roomId });
        }
    }, 10000);
}

// 🔔 NOTIFICATION FUNCTIONS

function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 
                             type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function playNotificationSound() {
    // Simple beep sound for notifications
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('🔇 Audio notification not supported');
    }
}

// 🚪 LEAVE CLASSROOM

function leaveClassroom() {
    console.log('🚪 Leaving classroom...');
    
    // Notify others
    socket.emit('leave-classroom', {
        roomId: currentUser.roomId,
        userId: currentUser.userId
    });
    
    // Cleanup
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
    
    // Clear session
    sessionStorage.removeItem('classroom_auth');
    
    // Redirect to login
    window.location.href = '/classroom-login.html';
}

// 🆘 EMERGENCY FUNCTIONS

function forceReconnectAll() {
    console.log('🔄 Force reconnecting to all users...');
    
    // Get all users in room
    socket.emit('get-room-users', { roomId: currentUser.roomId }, (users) => {
        users.forEach(user => {
            if (user.socketId !== socket.id) {
                // Close existing connection
                if (peerConnections[user.socketId]) {
                    peerConnections[user.socketId].pc.close();
                    delete peerConnections[user.socketId];
                }
                
                // Create new connection
                setTimeout(() => {
                    connectToUser(user.socketId, user.userName);
                }, 500);
            }
        });
    });
    
    showNotification('Reconnecting to all participants...', 'warning');
}

// 📱 RESPONSIVE HELPERS

function toggleFullscreen() {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// 🎮 KEYBOARD SHORTCUTS

document.addEventListener('keydown', (e) => {
    // Mute/unmute with Ctrl+M
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        toggleMicBtn.click();
    }
    
    // Toggle video with Ctrl+V
    if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        toggleVideoBtn.click();
    }
    
    // Focus chat with Ctrl+Enter
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        messageInput.focus();
    }
    
    // Leave with Ctrl+L
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        endCallBtn.click();
    }
});

// 🌟 INITIALIZATION COMPLETE

console.log('✅ Classroom.js loaded successfully!');
console.log('📋 Current room:', currentUser.roomId);
console.log('👤 Current user:', currentUser.userName);

// Auto-reconnect on visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('🔄 Page became visible, checking connections...');
        updateConnectionStats();
    }
});

// ✅ Auto request room users
setTimeout(() => {
    socket.emit('get-room-users', { roomId: currentUser.roomId });
}, 3000);

// 🔧 DEBUG PANEL (Optional)
setTimeout(() => {
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 9999;
        font-family: monospace;
        max-width: 250px;
    `;
    
    debugPanel.innerHTML = `
        <div style="font-weight:bold; margin-bottom:5px;">🔧 DEBUG PANEL</div>
        <div>Room: <span id="debugRoom">${currentUser.roomId.substring(0, 15)}...</span></div>
        <div>Connections: <span id="debugConnected">0</span></div>
        <div>Videos: <span id="debugVideos">1</span></div>
        <div>Participants: <span id="debugParticipants">1</span></div>
        <button onclick="forceReconnectAll()" style="margin-top:5px; padding:3px 6px; font-size:10px; background:#4f46e5; color:white; border:none; border-radius:3px;">
            🔄 Reconnect All
        </button>
    `;
    
    document.body.appendChild(debugPanel);
    
    // Update debug info
    setInterval(() => {
        document.getElementById('debugConnected').textContent = Object.keys(peerConnections).length;
        document.getElementById('debugVideos').textContent = document.querySelectorAll('.video-box').length;
        document.getElementById('debugParticipants').textContent = document.querySelectorAll('.participant').length + 1;
    }, 2000);
    
}, 3000);
