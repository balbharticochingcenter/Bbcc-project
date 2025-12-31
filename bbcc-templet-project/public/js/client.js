// Yeh file Socket.io client logic ke liye hai for real-time popups.

const socket = io();  // Yeh Socket.io connection establish karta hai with server.

// Yeh event listener notification receive karta hai aur popup show karta hai.
socket.on('notification', (message) => {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.textContent = `Notification: ${message}`;  // Yeh message display karta hai.
    document.getElementById('popupContainer').appendChild(popup);  // Yeh popup add karta hai to page.
    // Yeh popup ko auto-remove karta hai after 5 seconds.
    setTimeout(() => {
        popup.remove();
    }, 5000);
});

// Yeh console log connection confirm karta hai.
socket.on('connect', () => {
    console.log('Connected to server for real-time updates');  // Yeh debug ke liye hai.
});