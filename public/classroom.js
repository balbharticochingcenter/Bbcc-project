// 🔐 SECURITY CHECK
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('userId')) {
        alert('❌ Access denied');
        window.location.href = '/classroom-login.html';
    }
});

// ================= CONFIG =================
let socket;
let room; // LiveKit room
let currentUser = {};
let isMuted = false;
let isVideoOff = false;

// ================= DOM =================
const videoGrid = document.getElementById('videoGrid');
const toggleMicBtn = document.getElementById('toggleMic');
const toggleVideoBtn = document.getElementById('toggleVideo');
const endCallBtn = document.getElementById('endCall');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');
const participantsList = document.getElementById('participantsList');

// ================= URL PARAMS =================
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const userType = urlParams.get('userType') || 'student';
const userName = urlParams.get('name') || 'User';
const roomId = urlParams.get('roomId') || `room_${Date.now()}`;

// ================= INIT =================
document.addEventListener('DOMContentLoaded', async () => {
    initUser();
    initSocket();
    setupUI();
    await joinLiveKitRoom();
});

// ================= USER =================
function initUser() {
    currentUser = { userId, userType, userName, roomId };

    document.getElementById('userName').textContent = userName;
    document.getElementById('roomIdDisplay').textContent = roomId;

    const role = document.getElementById('userRole');
    role.textContent =
        userType === 'teacher' ? '👨‍🏫 Mentor' :
        userType === 'admin' ? '👑 Admin' : '🎓 Student';
}

// ================= SOCKET.IO (CHAT + PRESENCE) =================
function initSocket() {
    socket = io();

    socket.on('connect', () => {
        socket.emit('join-classroom', currentUser);
    });

    socket.on('new-message', addMessage);

    socket.on('room-users-list', users => {
        participantsList.innerHTML = '';
        users.forEach(addParticipant);
        updateParticipantCount();
    });
}

// ================= LIVEKIT =================
async function joinLiveKitRoom() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const res = await fetch(`/api/live-token?room=${roomId}&name=${userName}`);
        const { token, url } = await res.json();

        room = new LiveKit.Room();
        await room.connect(url, token);

        const tracks = await LiveKit.createLocalTracks({ audio: true, video: true });
        tracks.forEach(t => room.localParticipant.publishTrack(t));

        // LOCAL VIDEO
        tracks.forEach(track => {
            if (track.kind === 'video') {
                const el = track.attach();
                el.muted = true;
                el.autoplay = true;
                el.playsInline = true;
                el.className = 'video-box';
                videoGrid.appendChild(el);
            }
        });

        // REMOTE TRACKS
        room.on(LiveKit.RoomEvent.TrackSubscribed, (track, pub, participant) => {
            const el = track.attach();
            el.autoplay = true;
            el.playsInline = true;
            el.className = 'video-box';
            videoGrid.appendChild(el);
        });

        room.on(LiveKit.RoomEvent.TrackUnsubscribed, track => {
            track.detach().forEach(el => el.remove());
        });

        showNotification('Live class connected', 'success');

    } catch (e) {
        console.error(e);
        alert('Live class connect nahi ho paaya');
    }
}

// ================= UI =================
function setupUI() {
    toggleMicBtn.onclick = async () => {
        isMuted = !isMuted;
        room.localParticipant.audioTracks.forEach(p => {
            p.track.enabled = !isMuted;
        });
        toggleMicBtn.innerHTML = isMuted
            ? '<i class="fas fa-microphone-slash"></i>'
            : '<i class="fas fa-microphone"></i>';
    };

    toggleVideoBtn.onclick = async () => {
        isVideoOff = !isVideoOff;
        room.localParticipant.videoTracks.forEach(p => {
            p.track.enabled = !isVideoOff;
        });
        toggleVideoBtn.innerHTML = isVideoOff
            ? '<i class="fas fa-video-slash"></i>'
            : '<i class="fas fa-video"></i>';
    };

    endCallBtn.onclick = leaveClassroom;

    sendMessageBtn.onclick = sendChat;
    messageInput.onkeypress = e => e.key === 'Enter' && sendChat();
}

// ================= CHAT =================
function sendChat() {
    const msg = messageInput.value.trim();
    if (!msg) return;

    socket.emit('send-message', {
        userName,
        userType,
        message: msg,
        timestamp: new Date()
    });

    addMessage({
        userName,
        userType,
        message: msg,
        timestamp: new Date()
    }, true);

    messageInput.value = '';
}

function addMessage(data, self = false) {
    const div = document.createElement('div');
    div.className = `message ${self ? 'self' : ''}`;
    div.innerHTML = `
        <strong>${data.userName}</strong>
        <p>${data.message}</p>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ================= PARTICIPANTS =================
function addParticipant(u) {
    const div = document.createElement('div');
    div.className = 'participant';
    div.innerHTML = `<span>${u.userName}</span>`;
    participantsList.appendChild(div);
}

function updateParticipantCount() {
    document.getElementById('participantCount').textContent =
        participantsList.children.length;
}

// ================= NOTIFICATION =================
function showNotification(msg, type) {
    console.log(`[${type}] ${msg}`);
}

// ================= LEAVE =================
function leaveClassroom() {
    if (room) room.disconnect();
    if (socket) socket.disconnect();
    window.location.href = '/classroom-login.html';
}

console.log('✅ classroom.js (LiveKit version) loaded');
