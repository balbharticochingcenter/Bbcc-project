// 1. Socket.io Connection Setup
const socket = io(); 

socket.on('connect', () => {
    console.log('✅ VIP Portal Connected! Socket ID:', socket.id);
});

// --- LOGIN LOGIC ---
function login() {
    const role = document.getElementById('role').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showPopup("Opps! Username aur Password likhna zaroori hai.", "warning");
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Sahi login par dashboard par bhej dega
            window.location.href = data.redirect;
        } else {
            // Galat hone par popup dikhayega
            showPopup(data.message, "error");
        }
    })
    .catch(err => {
        console.error("Login Error:", err);
        showPopup("Server se connection nahi ho raha!", "error");
    });
}

// --- REAL-TIME NOTIFICATIONS ---
socket.on('receive-notification', (data) => {
    // Agar data sirf string hai toh object mein convert karein
    const msg = typeof data === 'string' ? data : data.message;
    showPopup(msg, data.type || 'info');
});

// Admin ya Teacher se notification bhejne ke liye
function sendAlert(msg) {
    if(!msg) return;
    socket.emit('send-notification', msg);
}

// --- POPUP UI FUNCTION ---
function showPopup(message, type) {
    let container = document.getElementById('popupContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'popupContainer';
        container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999;";
        document.body.appendChild(container);
    }

    const popup = document.createElement('div');
    
    // Type ke hisaab se color badalna
    let bgColor = "rgba(56, 189, 248, 0.2)"; // Info (Blue)
    if(type === 'error') bgColor = "rgba(239, 68, 68, 0.2)"; // Red
    if(type === 'warning') bgColor = "rgba(245, 158, 11, 0.2)"; // Yellow

    popup.style.cssText = `
        background: ${bgColor};
        backdrop-filter: blur(15px);
        padding: 15px 25px;
        margin-bottom: 15px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        min-width: 250px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        font-family: 'Segoe UI', sans-serif;
    `;
    
    popup.innerHTML = `<strong>🔔 VIP Alert:</strong><br>${message}`;
    container.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transition = '0.5s';
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}
