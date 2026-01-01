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

// --- 1. LOAD SETTINGS (Header & Footer Sync) ---
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        const data = await response.json();
        
        if(data) {
            const dbTitle = document.getElementById('db-title');
            const dbSub = document.getElementById('db-subtitle');
            const dbLogo = document.getElementById('db-logo');

            if(dbTitle) dbTitle.innerText = data.title || "BBCC Portal";
            if(dbSub) dbSub.innerText = data.sub_title || "";
            if(dbLogo && data.logo) dbLogo.src = data.logo;
            
            const formTitle = document.getElementById('form-title');
            if(formTitle) {
                formTitle.value = data.title || "";
                document.getElementById('form-subtitle').value = data.sub_title || "";
                document.getElementById('form-contact').value = data.contact || "";
                document.getElementById('form-call').value = data.call_no || "";
                document.getElementById('form-gmail').value = data.gmail || "";
                document.getElementById('form-facebook').value = data.facebook || "";
                document.getElementById('form-help').value = data.help || "";
            }

            const footHelp = document.getElementById('foot-help');
            if(footHelp) footHelp.innerText = data.help || "";
            
            // Footer social links sync
            if(document.getElementById('foot-whatsapp')) document.getElementById('foot-whatsapp').href = `https://wa.me/${data.contact}`;
            if(document.getElementById('foot-call')) document.getElementById('foot-call').href = `tel:${data.call_no}`;
        }
    } catch (err) { 
        console.error("Database connection failed:", err); 
    }
} // FIXED: Added missing bracket here

// --- 2. MODAL CONTROLS ---
const modals = {
    sys: document.getElementById("systemModal"),
    teacher: document.getElementById("teacherModal"),
    data: document.getElementById("dataModal"),
    update: document.getElementById("updateModal"),
    profile: document.getElementById("profileModal")
};

// Check if buttons exist before adding events (to avoid errors on login page)
if(document.getElementById("openModalBtn")) document.getElementById("openModalBtn").onclick = () => modals.sys.style.display = "block";
if(document.getElementById("openTeacherBtn")) document.getElementById("openTeacherBtn").onclick = () => modals.teacher.style.display = "block";
if(document.getElementById("openTeacherDataBtn")) document.getElementById("openTeacherDataBtn").onclick = () => { modals.data.style.display = "block"; loadTeacherData(); };
if(document.getElementById("openUpdateBtn")) document.getElementById("openUpdateBtn").onclick = () => modals.update.style.display = "block";

window.onclick = (event) => {
    if (event.target.classList.contains('modal') || event.target.classList.contains('modal-3d')) {
        event.target.style.display = "none";
    }
};

document.querySelectorAll(".close, .close-3d").forEach(btn => {
    btn.onclick = () => { 
        const modal = btn.closest('.modal') || btn.closest('.modal-3d');
        if(modal) modal.style.display = "none"; 
    };
});

// --- 3. TEACHER REGISTRATION ---
if(document.getElementById('t_name')) {
    document.getElementById('t_name').oninput = (e) => {
        const name = e.target.value.trim().toUpperCase();
        if(name.length >= 3) {
            const rand = Math.floor(1000 + Math.random() * 9000);
            document.getElementById('t_id').value = name.substring(0, 3) + rand;
            document.getElementById('t_pass').value = name.substring(0, 3) + "@" + rand;
        }
    };
}

if(document.getElementById("teacherForm")) {
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
        if(res.ok) { alert("Teacher Registered! 🎉"); e.target.reset(); modals.teacher.style.display="none"; }
    };
}

// --- 4. LOAD TEACHER DATA ---
async function loadTeacherData() {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const container = document.getElementById("teacherTableBody");
    if (!container) return;
    
    if (teachers.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>Koi teacher nahi mila!</p>";
        return;
    }

    container.innerHTML = ""; 
    teachers.forEach(t => {
        const joinDate = t.joining_date ? new Date(t.joining_date) : new Date();
        const diff = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        let checks = "";
        for(let i=1; i<=totalMonths; i++) {
            const checked = t.paid_months?.includes(i) ? "checked" : "";
            checks += `<label style="background:#eee; padding:2px 5px; border-radius:4px; font-size:11px; cursor:pointer;">
                        <input type="checkbox" ${checked} onchange="updatePaidStatus('${t.teacher_id}', ${i}, this.checked)"> M${i}
                      </label>`;
        }

        container.innerHTML += `
            <div class="teacher-card" style="background:white; padding:15px; border-radius:15px; color:#333; display:flex; flex-direction:column; gap:10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${t.photo || 'https://via.placeholder.com/80'}" onclick="showFullProfile('${t.teacher_id}')" style="width:60px; height:60px; border-radius:50%; border:2px solid #6c5ce7; cursor:pointer;">
                    <div>
                        <h4 style="margin:0;">${t.teacher_name}</h4>
                        <small style="color:#6c5ce7; font-weight:bold;">ID: ${t.teacher_id}</small>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8f9fa; padding:8px; border-radius:10px;">
                    <span style="font-weight:bold; color:#2ecc71;">Salary: ₹${t.salary || '0'}</span>
                    <div style="display:flex; gap:10px;">
                        <a href="tel:${t.mobile}" style="color:#0984e3;"><i class="fas fa-phone-alt"></i></a>
                        <a href="https://wa.me/${t.mobile}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i></a>
                    </div>
                </div>
                <div style="font-size:12px;">
                    <p style="margin-bottom:5px; font-weight:bold;">Salary Tracker:</p>
                    <div style="display:flex; flex-wrap:wrap; gap:5px;">${checks}</div>
                </div>
            </div>`;
    });
}

// --- 5. SHOW FULL PROFILE ---
async function showFullProfile(tId) {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const t = teachers.find(x => x.teacher_id === tId);
    if(t) {
        document.getElementById('profileData').innerHTML = `
            <img src="${t.photo || 'https://via.placeholder.com/150'}" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid #6c5ce7; margin-bottom: 15px;">
            <h3>${t.teacher_name}</h3>
            <p><b>Teacher ID:</b> ${t.teacher_id}</p>
            <p><b>Mobile:</b> ${t.mobile}</p>
            <p><b>Classes:</b> ${t.classes?.join(", ") || "None"}</p>
        `;
        modals.profile.style.display = "block";
    }
}

// --- 6. UPDATE PAID STATUS ---
async function updatePaidStatus(tId, month, status) {
    await fetch('/api/update-salary-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: tId, month, status })
    });
}

// --- 7. STUDENT FUNCTIONS ---
if(document.getElementById('s_name')) {
    document.getElementById('s_name').oninput = (e) => {
        const name = e.target.value.trim().toUpperCase();
        if(name.length >= 3) {
            const rand = Math.floor(1000 + Math.random() * 9000);
            document.getElementById('s_id').value = "STU" + rand;
            document.getElementById('s_pass').value = name.substring(0, 3) + "@" + rand;
        }
    };
}

async function loadStudentData() {
    const res = await fetch('/api/get-students');
    const students = await res.json();
    const container = document.getElementById("studentTableBody");
    if(!container) return;
    
    container.innerHTML = students.length === 0 ? "<p>No Students Found</p>" : "";

    students.forEach(s => {
        const joinDate = s.joining_date ? new Date(s.joining_date) : new Date();
        const diff = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        let checks = "";
        for(let i = 1; i <= totalMonths; i++) {
            const isPaid = s.paid_months?.includes(i) ? "checked" : "";
            checks += `<label class="fee-chip"><input type="checkbox" ${isPaid} onchange="updateFeesStatus('${s.student_id}', ${i}, this.checked)"><span>M${i}</span></label>`;
        }

        const p_msg = encodeURIComponent(`Dear Parent, your child ${s.student_name} fees is due. BBCC MADHUBANI`);

        container.innerHTML += `
            <div class="diary-card">
                <h4>${s.student_name} (ID: ${s.student_id})</h4>
                <p>Class: ${s.student_class} | Fees: ₹${s.fees}</p>
                <div class="diary-actions">
                    <a href="sms:${s.parent_mobile}?body=${p_msg}"><i class="fas fa-comment"></i></a>
                    <a href="https://wa.me/${s.parent_mobile}?text=${p_msg}"><i class="fab fa-whatsapp"></i></a>
                    <a href="tel:${s.parent_mobile}"><i class="fas fa-phone-alt"></i></a>
                </div>
                <div style="margin-top:10px;">${checks}</div>
            </div>`;
    });
}

// --- 8. RESULTS LOGIC ---
async function filterClassForResults() {
    const selectedClass = document.getElementById('res_class_filter').value;
    const res = await fetch('/api/get-students');
    const students = await res.json();
    const classStudents = students.filter(s => s.student_class === selectedClass);
    const container = document.getElementById("resultTableBody");
    if(!container) return;
    container.innerHTML = "";

    classStudents.forEach(s => {
        container.innerHTML += `
            <tr>
                <td>${s.student_name}</td>
                <td><input type="number" id="obt_${s.student_id}" value="${s.obtained_marks || ''}" style="width:60px;"></td>
                <td id="div_${s.student_id}">${calculateDivision(s.obtained_marks, s.total_marks)}</td>
                <td><button onclick="saveIndividualResult('${s.student_id}')">Save</button></td>
            </tr>`;
    });
}

function calculateDivision(obt, total) {
    if(!obt || !total || total == 0) return "---";
    const per = (parseInt(obt) / parseInt(total)) * 100;
    if(per >= 60) return "1st Div";
    if(per >= 45) return "2nd Div";
    if(per >= 33) return "3rd Div";
    return "Fail";
}

async function saveIndividualResult(sid) {
    const obt = document.getElementById(`obt_${sid}`).value;
    const total = document.getElementById('bulk_total_marks').value;
    const exDate = document.getElementById('bulk_exam_date').value;

    if(!total || !exDate) return alert("Enter Total Marks & Date!");

    const res = await fetch('/api/update-student-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: sid, obtained_marks: obt, total_marks: total, exam_date: exDate })
    });
    if(res.ok) alert("Result Saved!");
}

// --- 9. LOGIN LOGIC (FIXED) ---
async function universalLogin() {
    const userId = document.getElementById('login_id').value.trim().toUpperCase();
    const userPass = document.getElementById('login_pass').value;

    if (!userId || !userPass) return alert("Please fill ID and Password!");

    // Admin Check
    if (userId === "ADMIN" && userPass === "7543") {
        alert("Welcome Admin!");
        window.location.href = 'admin.html';
        return;
    }

    try {
        const tRes = await fetch('/api/get-teachers');
        const teachers = await tRes.json();
        const teacher = teachers.find(t => t.teacher_id === userId);

        if (teacher) {
            if (teacher.pass === userPass) {
                alert("Teacher Login Success!");
                // window.location.href = 'teacher_dashboard.html';
                return;
            }
        }

        const sRes = await fetch('/api/get-students');
        const students = await sRes.json();
        const student = students.find(s => s.student_id === userId);

        if (student) {
            if (student.pass === userPass) {
                alert("Student Login Success!");
                // window.location.href = 'student_profile.html';
                return;
            }
        }
        alert("Invalid ID or Password!");
    } catch (e) {
        alert("Database connection error!");
    }
}

// System settings save
if(document.getElementById("adminForm")) {
    document.getElementById("adminForm").onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const logo = document.getElementById('logoInput').files[0];
        if (logo) data.logo = await toBase64(logo);

        await fetch('/api/update-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        alert("Settings Saved!"); loadSettings();
    };
}
