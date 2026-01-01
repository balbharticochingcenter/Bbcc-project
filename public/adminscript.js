// --- UTILITY: Image to Base64 ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- INITIALIZE DASHBOARD ---
function initDashboard() {
    loadSettings();
}

// --- 1. LOAD SETTINGS ---
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        const data = await response.json();
        if(data.title) {
            document.getElementById('db-title').innerText = data.title;
            document.getElementById('db-subtitle').innerText = data.sub_title || "";
            if(data.logo) document.getElementById('db-logo').src = data.logo;
            
            document.getElementById('form-title').value = data.title;
            document.getElementById('form-subtitle').value = data.sub_title;
            document.getElementById('form-contact').value = data.contact || "";
        }
    } catch (err) { console.error("Error loading settings:", err); }
}

// --- 2. MODAL CONTROLS ---
const modals = {
    sys: document.getElementById("systemModal"),
    teacher: document.getElementById("teacherModal"),
    data: document.getElementById("dataModal"),
    update: document.getElementById("updateModal")
};

document.getElementById("openModalBtn").onclick = () => modals.sys.style.display = "block";
document.getElementById("openTeacherBtn").onclick = () => modals.teacher.style.display = "block";
document.getElementById("openTeacherDataBtn").onclick = () => { modals.data.style.display = "block"; loadTeacherData(); };
document.getElementById("openUpdateBtn").onclick = () => modals.update.style.display = "block";

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) event.target.style.display = "none";
};

document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => { btn.closest('.modal').style.display = "none"; };
});

// --- 3. TEACHER REGISTRATION ---
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
    const photo = document.getElementById('t_photo').files[0];
    if (photo) data.photo = await toBase64(photo);

    const res = await fetch('/api/teacher-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Teacher Registered!"); e.target.reset(); modals.teacher.style.display="none"; }
};

// --- 4. LOAD TEACHER CARDS (Updated for your CSS) ---
async function loadTeacherData() {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const tbody = document.getElementById("teacherTableBody");
    tbody.innerHTML = "";

    teachers.forEach(t => {
        const joinDate = t.joining_date ? new Date(t.joining_date) : new Date();
        const diff = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        let checks = "";
        for(let i=1; i<=totalMonths; i++) {
            const checked = t.paid_months?.includes(i) ? "checked" : "";
            checks += `<label style="font-size:10px; margin-right:5px;"><input type="checkbox" ${checked} onchange="updatePaidStatus('${t.teacher_id}', ${i}, this.checked)"> M${i}</label> `;
        }

        // Yahan data-label add kiya gaya hai taaki CSS Cards sahi dikhein
        tbody.innerHTML += `
            <tr>
                <td><img src="${t.photo || 'https://via.placeholder.com/100'}" alt="Teacher"></td>
                <td data-label="Name"><b>${t.teacher_name}</b><br><small>ID: ${t.teacher_id}</small></td>
                <td data-label="Joining Date">${t.joining_date}</td>
                <td data-label="Salary Status">
                    <div style="background:#f1f2f6; padding:10px; border-radius:10px; max-height:80px; overflow-y:auto;">
                        ${checks}
                    </div>
                </td>
                <td data-label="Action">
                    <a href="https://wa.me/${t.mobile}" target="_blank" style="color:#25D366; font-size:24px;">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </td>
            </tr>`;
    });
}

async function updatePaidStatus(tId, month, status) {
    await fetch('/api/update-salary-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: tId, month, status })
    });
}

// --- 5. SEARCH, UPDATE & DELETE ---
async function searchTeacher() {
    const id = document.getElementById('search_tid').value.trim();
    if(!id) return alert("Please enter ID");
    
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const t = teachers.find(x => x.teacher_id === id);

    if(t) {
        document.getElementById('up_id').value = t.teacher_id;
        document.getElementById('up_name').value = t.teacher_name;
        document.getElementById('up_mobile').value = t.mobile;
        document.getElementById('up_pass').value = t.pass;
        document.getElementById('up_salary').value = t.salary;
        document.getElementById('up_joining').value = t.joining_date;
        alert("Teacher Data Loaded!");
    } else { alert("Teacher Not Found!"); }
}

document.getElementById("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const photo = document.getElementById('up_photo').files[0];
    if (photo) data.photo = await toBase64(photo);

    const res = await fetch('/api/update-teacher-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Teacher Data Updated!"); modals.update.style.display="none"; }
};

async function deleteTeacher() {
    const id = document.getElementById('up_id').value;
    if(!id || !confirm("Are you sure you want to delete this teacher?")) return;

    const res = await fetch('/api/delete-teacher', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: id })
    });
    if(res.ok) { 
        alert("Teacher Deleted!"); 
        document.getElementById("updateForm").reset();
        modals.update.style.display="none"; 
    }
}

// --- 6. SYSTEM SETTINGS UPDATE ---
document.getElementById("adminForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const logo = document.getElementById('logoInput').files[0];
    if (logo) data.logo = await toBase64(logo);

    const res = await fetch('/api/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("System Settings Saved!"); loadSettings(); modals.sys.style.display="none"; }
};
