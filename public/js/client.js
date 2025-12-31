// 1. Socket.io Connection Setup
const socket = io(); 

socket.on('connect', () => {
    console.log('✅ VIP Portal Connected! ID:', socket.id);
});

// --- LOGIN LOGIC ---
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showPopup("Opps! ID aur Password likhna zaroori hai.", "warning");
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Login hote hi User ka data browser ki memory (localStorage) mein save karlo
            localStorage.setItem('vipUser', JSON.stringify(data.user));
            window.location.href = data.redirect;
        } else {
            showPopup(data.message, "error");
        }
    })
    .catch(err => {
        showPopup("Server se connection nahi ho raha!", "error");
    });
}

// --- SMART REAL-TIME NOTIFICATIONS ---
socket.on('receive-notification', (data) => {
    // Browser memory se check karo ki main (User) kaun hoon
    const currentUser = JSON.parse(localStorage.getItem('vipUser'));
    
    if (!currentUser) return; // Agar login nahi hai toh kuch mat dikhao

    // Logic: Agar message 'all' ke liye hai, ya phir mere role ke liye hai
    if (data.target === 'all' || data.target === currentUser.role) {
        const title = data.type === 'notice' ? "📢 Notice Board" : "🔔 VIP Notification";
        showPopup(`${data.message}`, data.type === 'notice' ? 'info' : 'warning', title);
        
        // Agar dashboard par koi Notice Board list hai toh wahan update karo
        const noticeList = document.getElementById('liveNoticeList');
        if (noticeList) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${new Date().toLocaleTimeString()}:</strong> ${data.message}`;
            noticeList.prepend(li);
        }
    }
});

// --- POPUP UI FUNCTION ---
function showPopup(message, type, customTitle = "🔔 VIP Alert") {
    let container = document.getElementById('popupContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'popupContainer';
        container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;";
        document.body.appendChild(container);
    }

    const popup = document.createElement('div');
    
    let bgColor = "rgba(56, 189, 248, 0.9)"; // Info (Blue)
    if(type === 'error') bgColor = "rgba(239, 68, 68, 0.9)"; // Red
    if(type === 'warning') bgColor = "rgba(245, 158, 11, 0.9)"; // Yellow

    popup.style.cssText = `
        background: ${bgColor};
        backdrop-filter: blur(15px);
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 12px;
        color: white;
        box-shadow: 0 10px 15px rgba(0,0,0,0.3);
        font-family: sans-serif;
        animation: slideIn 0.5s ease-out;
    `;
    
    popup.innerHTML = `<strong>${customTitle}:</strong><br>${message}`;
    container.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transition = '0.5s';
        setTimeout(() => popup.remove(), 500);
    }, 6000);
}

// CSS Animation for Popup
const style = document.createElement('style');
style.innerHTML = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}`;
document.head.appendChild(style);

// Logout Function
function logout() {
    localStorage.removeItem('vipUser');
    window.location.href = '/';
}
