// --- UTILITY: Image ko text (Base64) mein badalne ke liye ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- 1. SETTINGS LOAD KARNA (Header/Logo etc.) ---
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

            // Form fill up for editing
            document.getElementById('form-title').value = data.title || "";
            document.getElementById('form-subtitle').value = data.sub_title || "";
            document.getElementById('form-contact').value = data.contact || "";
            document.getElementById('form-adminname').value = data.admin_name || "";
        }
    } catch (err) { console.error("Load Error:", err); }
}

// --- 2. MODAL CONTROLS (Open/Close System) ---
const sysModal = document.getElementById("systemModal");
const tModal = document.getElementById("teacherModal");
const dModal = document.getElementById("dataModal");   // Teacher Data Modal
const pModal = document.getElementById("profileModal"); // Teacher Profile Popup

// Buttons Click Events
document.getElementById("openModalBtn").onclick = () => { loadSettings(); sysModal.style.display = "block"; };
document.getElementById("openTeacherBtn").onclick = () => { tModal.style.display = "block"; };

// Teacher Data Button (Isse Table Load Hogi)
document.getElementById("openTeacherDataBtn").onclick = () => {
    dModal.style.display = "block";
    loadTeacherData(); 
};

// Sabhi Close Buttons (X) ko handle karna
document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => {
        sysModal.style.display = "none";
        tModal.style.display = "none";
        dModal.style.display = "none";
        pModal.style.display = "none";
    };
});

// Modal ke bahar click karne par band hona
window.onclick = (event) => {
    if (event.target == sysModal) sysModal.style.display = "none";
    if (event.target == tModal) tModal.style.display = "none";
    if (event.target == dModal) dModal.style.display = "none";
    if (event.target == pModal) pModal.style.display = "none";
};

// --- 3. SYSTEM SETTINGS SUBMIT ---
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

// --- 4. TEACHER REGISTRATION LOGIC ---
// Auto ID aur Password Generate karna
document.getElementById('t_name').oninput = (e) => {
    const name = e.target.value.trim().toUpperCase();
    if(name.length >= 3) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('t_id').value = name.substring(0, 3) + rand;
        document.getElementById('t_pass').value = name.substring(0, 3) + "@" + rand;
    }
};

// Teacher Form Submit
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

// --- 5. TEACHER DATA TABLE & SALARY LOGIC ---
async function loadTeacherData() {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const tbody = document.getElementById("teacherTableBody");
    tbody.innerHTML = "";

    teachers.forEach(t => {
        // Joining Date check aur Month calculation
        const joinDate = t.joining_date ? new Date(t.joining_date) : new Date();
        const now = new Date();
        const diff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        // Checkboxes for Paid/Unpaid Status
        let checks = "";
        for(let i=1; i<=totalMonths; i++) {
            const isChecked = t.paid_months && t.paid_months.includes(i) ? "checked" : "";
            checks += `
                <label style="font-size:10px; margin-right:5px; background:#f1f1f1; padding:2px; border-radius:3px; display:inline-block; margin-bottom:2px;">
                    <input type="checkbox" ${isChecked} onchange="updatePaidStatus('${t.teacher_id}', ${i}, this.checked)"> M${i}
                </label>`;
        }

        const msg = `Hello ${t.teacher_name}, your salary for ${totalMonths} months is pending.`;

        tbody.innerHTML += `
            <tr>
                <td><img src="${t.photo || ''}" width="40" height="40" style="border-radius:50%; object-fit:cover;"></td>
                <td><b style="color:#e84393; cursor:pointer;" onclick='showProfile(${JSON.stringify(t)})'>${t.teacher_name}</b></td>
                <td>${t.joining_date || 'N/A'}</td>
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

// Database mein Paid/Unpaid Status update karna
async function updatePaidStatus(tId, monthNum, isChecked) {
    try {
        await fetch('/api/update-salary-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: tId, month: monthNum, status: isChecked })
        });
    } catch (err) { console.error("Update Error:", err); }
}

// Teacher Profile Popup Dikhaana
function showProfile(t) {
    document.getElementById("profileDetails").innerHTML = `
        <img src="${t.photo || ''}" style="width:100px; height:100px; border-radius:50%; border:3px solid #6c5ce7; margin-bottom:10px; object-fit:cover;">
        <h2 style="margin:0;">${t.teacher_name}</h2>
        <p style="font-size:12px; color:#666;">ID: ${t.teacher_id} | Pass: ${t.pass}</p>
        <hr>
        <div style="text-align:left; padding:10px; line-height:1.6; font-size:14px;">
            <p><b><i class="fas fa-phone"></i> Mobile:</b> ${t.mobile}</p>
            <p><b><i class="fas fa-wallet"></i> Salary:</b> ₹${t.salary}</p>
            <p><b><i class="fas fa-school"></i> Classes:</b> ${t.classes ? t.classes.join(", ") : 'None'}</p>
            <p><b><i class="fas fa-book"></i> Subjects:</b> ${t.subjects ? t.subjects.join(", ") : 'None'}</p>
        </div>
    `;
    pModal.style.display = "block";
}
// --- UPDATE FEATURE LOGIC ---
const uModal = document.getElementById("updateModal");
document.getElementById("openUpdateBtn").onclick = () => uModal.style.display = "block";

// Teacher Search Function
async function searchTeacher() {
    const id = document.getElementById('search_tid').value.trim();
    if(!id) return alert("Please enter ID");

    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const teacher = teachers.find(t => t.teacher_id === id);

    if(teacher) {
        document.getElementById('up_id').value = teacher.teacher_id;
        document.getElementById('up_name').value = teacher.teacher_name;
        document.getElementById('up_mobile').value = teacher.mobile;
        document.getElementById('up_salary').value = teacher.salary;
        document.getElementById('up_joining').value = teacher.joining_date;
        alert("Teacher Found! Edit and Save.");
    } else {
        alert("Teacher Not Found!");
    }
}

// Update Form Submit
document.getElementById("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch('/api/update-teacher-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if(res.ok) {
        alert("Teacher Updated Successfully! ✨");
        uModal.style.display = "none";
        if(dModal.style.display === "block") loadTeacherData(); // Refresh table if open
    } else {
        alert("Update Failed!");
    }
};
// --- ADVANCED UPDATE & DELETE LOGIC ---
const uModal = document.getElementById("updateModal");
document.getElementById("openUpdateBtn").onclick = () => uModal.style.display = "block";

// 1. Search Teacher and Fill All Data
async function searchTeacher() {
    const id = document.getElementById('search_tid').value.trim();
    if(!id) return alert("Please enter ID");

    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const t = teachers.find(teacher => teacher.teacher_id === id);

    if(t) {
        document.getElementById('up_id').value = t.teacher_id;
        document.getElementById('up_name').value = t.teacher_name;
        document.getElementById('up_mobile').value = t.mobile;
        document.getElementById('up_salary').value = t.salary;
        document.getElementById('up_joining').value = t.joining_date;

        // Checkboxes reset aur fill karna
        document.querySelectorAll('#updateForm input[type="checkbox"]').forEach(cb => cb.checked = false);
        if(t.classes) t.classes.forEach(c => {
            const cb = document.querySelector(`#up_classes_div input[value="${c}"]`);
            if(cb) cb.checked = true;
        });
        if(t.subjects) t.subjects.forEach(s => {
            const cb = document.querySelector(`#up_subjects_div input[value="${s}"]`);
            if(cb) cb.checked = true;
        });

        alert("Data Loaded! Now you can edit photo and other details.");
    } else { alert("Teacher Not Found!"); }
}

// 2. Update Submit (with Photo & Arrays)
document.getElementById("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Arrays handle karein
    data.classes = formData.getAll('classes');
    data.subjects = formData.getAll('subjects');

    // Photo handle karein
    const photoInput = document.getElementById('up_photo');
    if (photoInput.files[0]) {
        data.photo = await toBase64(photoInput.files[0]);
    }

    const res = await fetch('/api/update-teacher-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if(res.ok) {
        alert("Teacher Updated! ✨");
        uModal.style.display = "none";
        loadTeacherData(); 
    }
};

// 3. Delete Teacher Function
async function deleteTeacher() {
    const id = document.getElementById('up_id').value;
    if(!id) return alert("Search a teacher first!");

    if(confirm("Are you sure? This teacher will be deleted permanently!")) {
        const res = await fetch('/api/delete-teacher', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: id })
        });
        if(res.ok) {
            alert("Teacher Deleted!");
            uModal.style.display = "none";
            loadTeacherData();
        }
    }
}
// --- NAYE FEATURES YA CODE YAHAN ADD KAREIN (Future Use) ---
// Yahan aap Search bar ya Delete function ka code add kar sakte hain.
