const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- LOAD SETTINGS (SYSTEM) ---
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        const data = await response.json();
        if(data) {
            document.getElementById('db-title').innerText = data.title || "My Site";
            document.getElementById('db-subtitle').innerText = data.sub_title || "";
            if(data.logo) document.getElementById('db-logo').src = data.logo;

            const socialDiv = document.getElementById('db-socials');
            socialDiv.innerHTML = `
                ${data.facebook ? `<a href="${data.facebook}"><i class="fab fa-facebook"></i></a>` : ''}
                ${data.youtube_link ? `<a href="${data.youtube_link}"><i class="fab fa-youtube"></i></a>` : ''}
                ${data.instagram ? `<a href="${data.instagram}"><i class="fab fa-instagram"></i></a>` : ''}
                ${data.twitter ? `<a href="${data.twitter}"><i class="fab fa-twitter"></i></a>` : ''}
                ${data.gmail ? `<a href="mailto:${data.gmail}"><i class="fas fa-envelope"></i></a>` : ''}
            `;

            // System Form Fill
            document.getElementById('form-title').value = data.title || "";
            document.getElementById('form-subtitle').value = data.sub_title || "";
            document.getElementById('form-contact').value = data.contact || "";
            document.getElementById('form-adminname').value = data.admin_name || "";
        }
    } catch (err) { console.error("Load Error:", err); }
}

// --- MODAL CONTROLS (Open/Close) ---
const sysModal = document.getElementById("systemModal");
const tModal = document.getElementById("teacherModal");

// System Modal Open
document.getElementById("openModalBtn").onclick = () => {
    loadSettings();
    sysModal.style.display = "block";
};

// Teacher Modal Open (Isse popup khulega)
document.getElementById("openTeacherBtn").onclick = () => {
    tModal.style.display = "block";
};

// Close Buttons
document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => {
        sysModal.style.display = "none";
        tModal.style.display = "none";
    };
});

window.onclick = (event) => {
    if (event.target == sysModal) sysModal.style.display = "none";
    if (event.target == tModal) tModal.style.display = "none";
};

// --- SYSTEM FORM SUBMIT ---
document.getElementById("adminForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const logoInput = document.getElementById('logoInput');
    if (logoInput.files[0]) data.logo = await toBase64(logoInput.files[0]);
    else data.logo = document.getElementById('db-logo').src;

    const res = await fetch('/api/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Settings Saved! ✨"); location.reload(); }
};

// --- TEACHER AUTO GEN ID/PASS ---
document.getElementById('t_name').oninput = (e) => {
    const name = e.target.value.trim().toUpperCase();
    if(name.length >= 3) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('t_id').value = name.substring(0, 3) + rand;
        document.getElementById('t_pass').value = name.substring(0, 3) + "@" + rand;
    }
};

// --- TEACHER FORM SUBMIT ---
document.getElementById("teacherForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.classes = formData.getAll('classes');
    data.subjects = formData.getAll('subjects');

    const photoInput = document.getElementById('t_photo');
    if (photoInput.files[0]) data.photo = await toBase64(photoInput.files[0]);

    const res = await fetch('/api/teacher-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Teacher Added! 🎓"); tModal.style.display = "none"; e.target.reset(); }
    else { alert("Error saving teacher!"); }
};
// --- TEACHER DATA & SALARY LOGIC ---
const dModal = document.getElementById("dataModal");
const pModal = document.getElementById("profileModal");

// Open Modal Button
document.getElementById("openTeacherDataBtn").onclick = () => {
    dModal.style.display = "block";
    loadTeacherData();
};

// Load Table and Calculate Months
async function loadTeacherData() {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const tbody = document.getElementById("teacherTableBody");
    tbody.innerHTML = "";

    teachers.forEach(t => {
        const joinDate = new Date(t.joining_date);
        const now = new Date();
        const diff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        // Checkboxes with 'Checked' status from Database
        let checks = "";
        for(let i=1; i<=totalMonths; i++) {
            const isChecked = t.paid_months && t.paid_months.includes(i) ? "checked" : "";
            checks += `
                <label style="font-size:10px; margin-right:5px; background:#f1f1f1; padding:2px; border-radius:3px;">
                    <input type="checkbox" ${isChecked} onchange="updatePaidStatus('${t.teacher_id}', ${i}, this.checked)"> M${i}
                </label>`;
        }

        const msg = `Hello ${t.teacher_name}, your salary for ${totalMonths} months is pending.`;

        tbody.innerHTML += `
            <tr>
                <td><img src="${t.photo || ''}" width="40" height="40" style="border-radius:50%; object-fit:cover;"></td>
                <td><b style="color:#e84393; cursor:pointer;" onclick='showProfile(${JSON.stringify(t)})'>${t.teacher_name}</b></td>
                <td>${t.joining_date}</td>
                <td><span style="background:#6c5ce7; color:white; padding:2px 8px; border-radius:10px;">${totalMonths} Months</span></td>
                <td><div style="display:flex; flex-wrap:wrap; max-width:220px;">${checks}</div></td>
                <td>
                    <a href="https://wa.me/${t.mobile}?text=${encodeURIComponent(msg)}" target="_blank" style="color:#25D366; font-size:20px;"><i class="fab fa-whatsapp"></i></a>
                    <a href="sms:${t.mobile}?body=${encodeURIComponent(msg)}" style="color:#3498db; font-size:20px; margin-left:10px;"><i class="fas fa-sms"></i></a>
                </td>
            </tr>
        `;
    });
}

// Function to Save Paid/Unpaid Status to DB
async function updatePaidStatus(tId, monthNum, isChecked) {
    try {
        await fetch('/api/update-salary-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: tId, month: monthNum, status: isChecked })
        });
    } catch (err) { alert("Status Update Failed!"); }
}

// Function to Show Full Profile Popup
function showProfile(t) {
    document.getElementById("profileDetails").innerHTML = `
        <img src="${t.photo || ''}" style="width:100px; height:100px; border-radius:50%; border:3px solid #6c5ce7; margin-bottom:10px;">
        <h2 style="margin:0;">${t.teacher_name}</h2>
        <p style="font-size:12px; color:#666;">ID: ${t.teacher_id} | Pass: ${t.pass}</p>
        <hr>
        <div style="text-align:left; padding:10px; line-height:1.6;">
            <p><b>Mobile:</b> ${t.mobile}</p>
            <p><b>Salary:</b> ₹${t.salary}</p>
            <p><b>Classes:</b> ${t.classes ? t.classes.join(", ") : 'None'}</p>
            <p><b>Subjects:</b> ${t.subjects ? t.subjects.join(", ") : 'None'}</p>
        </div>
    `;
    pModal.style.display = "block";
}
// MODAL CONTROLS mein ye line jodein
const dModal = document.getElementById("dataModal");
const pModal = document.getElementById("profileModal");

// Button click par table load karne ke liye
document.getElementById("openTeacherDataBtn").onclick = () => {
    dModal.style.display = "block";
    loadTeacherData(); // Ye function table bharega
};
