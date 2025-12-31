// Socket.io connection establish karna
const socket = io(); 

// Server se connection check karna
socket.on('connect', () => {
    console.log('✅ Connected to server! ID:', socket.id);
});

// Real-time Notification receive karna
socket.on('receive-notification', (data) => {
    showPopup(data.message, data.type || 'info');
});

// Popup dikhane ka function
function showPopup(message, type) {
    const container = document.getElementById('popupContainer');
    
    // Agar container nahi hai toh body mein create karein
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'popupContainer';
        document.body.appendChild(newContainer);
    }

    const popup = document.createElement('div');
    popup.className = `popup ${type}`; // type: 'info', 'warning', ya 'success'
    popup.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        padding: 15px 25px;
        margin-bottom: 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        animation: slideIn 0.5s ease-out;
    `;
    
    popup.innerHTML = `<strong>🔔 Notification:</strong> ${message}`;
    
    document.getElementById('popupContainer').appendChild(popup);

    // 5 seconds baad remove karna
    setTimeout(() => {
        popup.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}

// Teacher/Admin dashboard se notification bhejne ka function
function sendAlert(msg) {
    socket.emit('send-notification', {
        message: msg,
        type: 'info'
    });
}
