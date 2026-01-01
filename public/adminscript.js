// --- UTILITY: Image ko Base64 text mein badalne ke liye ---
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
const dModal = document.getElementById("dataModal");
const pModal = document.getElementById("profileModal");
const uModal = document.getElementById("updateModal"); // Sirf ek baar declare kiya

// Buttons Click Events
document.getElementById("openModalBtn").onclick = () => { loadSettings(); sysModal.style.display = "block"; };
document.getElementById("openTeacherBtn").onclick = () => { tModal.style.display = "block"; };
document.getElementById("openTeacherDataBtn").onclick = () => { dModal.style.display = "block"; loadTeacherData(); };
document.getElementById("openUpdateBtn").onclick = () => { uModal.style.display = "block"; };

// Sabhi Close Buttons (X) handle karna
document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => {
        sysModal.style.display = "none";
        tModal.style.display = "none";
        dModal.style.display = "none";
        pModal.style.display = "none";
        uModal.style.display = "none";
    };
});

window.onclick = (event) => {
    if (event.target == sysModal) sysModal.style.display = "none";
    if (event.target == tModal) tModal.style.display = "none";
    if (event.target == dModal) dModal.style.display = "none";
    if (event.target == pModal) pModal.style.display = "none";
    if (event.target == uModal) uModal.style.display = "none";
};

// --- 3. TEACHER REGISTRATION LOGIC ---
document.getElementById('t_name').oninput = (e) => {
    const name = e.target.value.trim().toUpperCase();
    if(name.length >= 3) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('t_id').value = name.substring(0, 3) + rand;
        document.getElementById('t_pass').value = name.substring(0, 3) + "@" + rand;
    }
};

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
};

// --- 4. TEACHER DATA TABLE & SALARY LOGIC ---
async function loadTeacherData() {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const tbody = document.getElementById("teacherTableBody");
    tbody.innerHTML = "";

    teachers.forEach(t => {
        const joinDate = t.joining_date ? new Date(t.joining_date) : new Date();
        const now = new Date();
        const diff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        let checks = "";
        for(let i=1; i<=totalMonths; i++) {
            const isChecked = t.paid_months && t.paid_months.includes(i) ? "checked" : "";
            checks += `<label style="font-size:10px; margin-right:5px; background:#f1f1f1; padding:2px; border-radius:3px;">
                <input type="checkbox" ${isChecked} onchange="updatePaidStatus('${t.teacher_id}', ${i}, this.checked)"> M${i}
            </label>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><img src="${t.photo || ''}" width="40" height="40" style="border-radius:50%; object-fit:cover;"></td>
                <td><b style="color:#e84393; cursor:pointer;" onclick='showProfile(${JSON.stringify(t)})'>${t.teacher_name}</b></td>
                <td>${t.joining_date || 'N/A'}</td>
                <td>${totalMonths} Months</td>
                <td><div style="display:flex; flex-wrap:wrap;">${checks}</div></td>
                <td><a href="https://wa.me/${t.mobile}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i></a></td>
            </tr>`;
    });
}

// Salary status update
async function updatePaidStatus(tId, monthNum, isChecked) {
    await fetch('/api/update-salary-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: tId, month: monthNum, status: isChecked })
    });
}

// Profile popup
function showProfile(t) {
    document.getElementById("profileDetails").innerHTML = `
        <img src="${t.photo || ''}" style="width:100px; height:100px; border-radius:50%; object-fit:cover;">
        <h2>${t.teacher_name}</h2>
        <p>ID: ${t.teacher_id} | Mobile: ${t.mobile}</p>
        <p>Classes: ${t.classes ? t.classes.join(", ") : 'None'}</p>
    `;
    pModal.style.display = "block";
}

// --- 5. ADVANCED UPDATE & DELETE LOGIC ---

// 1. Search & Load ALL Data
async function searchTeacher() {
    const id = document.getElementById('search_tid').value.trim();
    if(!id) return alert("Pehle ID enter karein!");

    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const t = teachers.find(teacher => teacher.teacher_id === id);

    if(t) {
        // Text Fields Fill
        document.getElementById('up_id').value = t.teacher_id || "";
        document.getElementById('up_name').value = t.teacher_name || "";
        document.getElementById('up_mobile').value = t.mobile || "";
        document.getElementById('up_pass').value = t.pass || "";
        document.getElementById('up_salary').value = t.salary || "";
        document.getElementById('up_joining').value = t.joining_date || "";

        // Checkboxes Reset
        document.querySelectorAll('#updateForm input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Classes Fill
        if(t.classes) t.classes.forEach(c => {
            const cb = document.querySelector(`#up_classes_div input[value="${c}"]`);
            if(cb) cb.checked = true;
        });
        
        // Subjects Fill
        if(t.subjects) t.subjects.forEach(s => {
            const cb = document.querySelector(`#up_subjects_div input[value="${s}"]`);
            if(cb) cb.checked = true;
        });

        alert("Database se saara data load ho gaya hai!");
    } else { alert("Is ID ka koi teacher nahi mila!"); }
}

// 2. Update & Clear Fields
document.getElementById("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    data.classes = formData.getAll('classes');
    data.subjects = formData.getAll('subjects');

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
        alert("Success! Teacher data database mein update ho gaya.");
        e.target.reset(); // Saari fields clear ho jayengi
        document.getElementById('search_tid').value = ""; // Search box clear
        uModal.style.display = "none"; 
        loadTeacherData(); // Main table refresh
    }
};

// 3. Delete & Clear
async function deleteTeacher() {
    const id = document.getElementById('up_id').value;
    if(!id) return alert("Pehle teacher search karein!");

    if(confirm("Kya aap sach mein is teacher ka saara data delete karna chahte hain?")) {
        const res = await fetch('/api/delete-teacher', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: id })
        });
        if(res.ok) {
            alert("Teacher delete ho gaya!");
            document.getElementById("updateForm").reset();
            document.getElementById('search_tid').value = "";
            uModal.style.display = "none";
            loadTeacherData();
        }
    }
}

// --- NAYE FEATURES YAHAN ADD KAREIN ---
