const socket = io(); // Socket.io connection

// 1. Page Load hote hi Data Fetch karna
document.addEventListener('DOMContentLoaded', () => {
    fetchUserData();
    fetchCommsHistory();
});

// 2. Database se Users ka Data mangwana aur Tables mein bharna
async function fetchUserData() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();

        const studentBody = document.getElementById('studentTableBody');
        const teacherBody = document.getElementById('teacherTableBody');

        // Tables ko khali karna
        studentBody.innerHTML = '';
        teacherBody.innerHTML = '';

        users.forEach(user => {
            if (user.role === 'admin') return; // Admin ko table mein nahi dikhana

            const row = `
                <tr>
                    <td>${new Date(user.joinDate).toLocaleDateString()}</td>
                    <td>${user.fname} ${user.lname}</td>
                    <td>${user.username}</td>
                    <td>${user.financeAmount || 0}</td>
                    <td><span class="status-${user.paymentStatus.toLowerCase()}">${user.paymentStatus}</span></td>
                    <td class="action-icons">
                        <a href="tel:${user.mobile}" title="Call"><i class="fa fa-phone"></i></a>
                        <a href="https://wa.me/91${user.mobile}" target="_blank" title="WhatsApp"><i class="fa fa-whatsapp"></i></a>
                        <a href="sms:${user.mobile}" title="SMS"><i class="fa fa-comment-dots"></i></a>
                    </td>
                </tr>
            `;

            if (user.role === 'student') {
                studentBody.innerHTML += row;
            } else if (user.role === 'teacher') {
                teacherBody.innerHTML += row;
            }
        });
    } catch (err) {
        console.error("Data fetch karne mein error:", err);
    }
}

// 3. Naya User Register karna (Form Submission)
async function handleRegistration(e) {
    e.preventDefault();

    const userData = {
        fname: document.getElementById('fname').value,
        mname: document.getElementById('mname').value,
        lname: document.getElementById('lname').value,
        mobile: document.getElementById('regMobile').value,
        email: document.getElementById('regEmail').value,
        role: document.getElementById('regRole').value,
        financeAmount: document.getElementById('financeAmount').value,
        joinDate: document.getElementById('joinDate').value,
        username: document.getElementById('regID').value,
        password: document.getElementById('regPass').value
    };

    try {
        const response = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (result.success) {
            alert(result.message);
            document.getElementById('regForm').reset();
            fetchUserData(); // Table refresh karein
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        alert("Server se connection nahi ho paya!");
    }
}

// 4. Notice aur Notification bhejna aur save karna
async function sendBroadcast(target) {
    const msg = document.getElementById('notifMsg').value;
    const type = (target === 'all') ? 'notice' : 'notification';

    if (!msg) return alert("Kuch toh likho!");

    const payload = {
        message: msg,
        type: type,
        target: target
    };

    try {
        const response = await fetch('/api/admin/send-comms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`Sent to ${target} successfully!`);
            document.getElementById('notifMsg').value = '';
            fetchCommsHistory(); // History refresh karein
        }
    } catch (err) {
        console.error("Communication error:", err);
    }
}

// 5. History Load karna
async function fetchCommsHistory() {
    try {
        const res = await fetch('/api/comms/history');
        const history = await res.json();

        const noticeList = document.getElementById('noticeHistory');
        const notifList = document.getElementById('notifHistory');

        noticeList.innerHTML = '';
        notifList.innerHTML = '';

        history.forEach(item => {
            const li = `<li><strong>${new Date(item.date).toLocaleDateString()}:</strong> ${item.message}</li>`;
            if (item.type === 'notice') noticeList.innerHTML += li;
            else notifList.innerHTML += li;
        });
    } catch (err) {
        console.log("History load nahi ho saki.");
    }
}

// 6. Excel Export Logic
function exportToExcel(tableID) {
    const table = document.getElementById(tableID);
    // ID aur Password ko download se bachane ke liye (Agar table mein ho toh)
    const wb = XLSX.utils.table_to_book(table, { sheet: "BBCC_Records" });
    XLSX.writeFile(wb, `${tableID}_${new Date().toLocaleDateString()}.xlsx`);
}

// Credentials generate karne ka function (Already in HTML, but backup here)
function generateCredentials() {
    const id = "BBCC" + Math.floor(1000 + Math.random() * 9000);
    const pass = Math.random().toString(36).slice(-6);
    document.getElementById('regID').value = id;
    document.getElementById('regPass').value = pass;
}
