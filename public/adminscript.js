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
        if(data.title) {
            // Header Branding
            document.getElementById('db-title').innerText = data.title;
            document.getElementById('db-subtitle').innerText = data.sub_title || "";
            if(data.logo) document.getElementById('db-logo').src = data.logo;
            
            // Fill Form Fields (Header)
            document.getElementById('form-title').value = data.title;
            document.getElementById('form-subtitle').value = data.sub_title;
            
            // Fill Form Fields (Footer)
            document.getElementById('form-contact').value = data.contact || "";
            document.getElementById('form-call').value = data.call_no || "";
            document.getElementById('form-gmail').value = data.gmail || "";
            document.getElementById('form-facebook').value = data.facebook || "";
            document.getElementById('form-help').value = data.help || "";
        }
    } catch (err) { console.error("Error loading settings:", err); }
}

// --- 2. MODAL CONTROLS ---
const modals = {
    sys: document.getElementById("systemModal"),
    teacher: document.getElementById("teacherModal"),
    data: document.getElementById("dataModal"),
    update: document.getElementById("updateModal"),
    profile: document.getElementById("profileModal")
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
    if(res.ok) { alert("Teacher Registered! 🎉"); e.target.reset(); modals.teacher.style.display="none"; }
};

// --- 4. LOAD TEACHER CARDS (Salary, Call, SMS, Profile) ---
async function loadTeacherData() {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const container = document.getElementById("teacherTableBody");
    
    if (teachers.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>Koi teacher nahi mila!</p>";
        return;
    }

    container.innerHTML = ""; // Purana data saaf karein

    teachers.forEach(t => {
        // Salary Months Calculation
        const joinDate = t.joining_date ? new Date(t.joining_date) : new Date();
        const diff = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        let checks = "";
        for(let i=1; i<=totalMonths; i++) {
            const checked = t.paid_months?.includes(i) ? "checked" : "";
            checks += `
                <label style="background:#eee; padding:2px 5px; border-radius:4px; font-size:11px; cursor:pointer;">
                    <input type="checkbox" ${checked} onchange="updatePaidStatus('${t.teacher_id}', ${i}, this.checked)"> M${i}
                </label>`;
        }

        // Card Design Injecting
        container.innerHTML += `
            <div class="teacher-card" style="background:white; padding:15px; border-radius:15px; color:#333; display:flex; flex-direction:column; gap:10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${t.photo || 'https://via.placeholder.com/80'}" onclick="showFullProfile('${t.teacher_id}')" style="width:60px; height:60px; border-radius:50%; border:2px solid var(--primary-glow); cursor:pointer;">
                    <div>
                        <h4 style="margin:0;">${t.teacher_name}</h4>
                        <small style="color:#6c5ce7; font-weight:bold;">ID: ${t.teacher_id}</small>
                    </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8f9fa; padding:8px; border-radius:10px;">
                    <span style="font-weight:bold; color:#2ecc71;">Salary: ₹${t.salary || '0'}</span>
                    <div style="display:flex; gap:10px;">
                        <a href="tel:${t.mobile}" style="color:#0984e3;"><i class="fas fa-phone-alt"></i></a>
                        <a href="sms:${t.mobile}" style="color:#e84393;"><i class="fas fa-comment-dots"></i></a>
                        <a href="https://wa.me/${t.mobile}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i></a>
                    </div>
                </div>

                <div style="font-size:12px;">
                    <p style="margin-bottom:5px; font-weight:bold;">Salary Tracker (Months):</p>
                    <div style="display:flex; flex-wrap:wrap; gap:5px;">${checks}</div>
                </div>
            </div>`;
    });
}
//--------------------------------------------------------//
// --- 5. SHOW FULL PROFILE POPUP ---
async function showFullProfile(tId) {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const t = teachers.find(x => x.teacher_id === tId);

    if(t) {
        const profileDiv = document.getElementById('profileData');
        profileDiv.innerHTML = `
            <img src="${t.photo || 'https://via.placeholder.com/150'}" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid #6c5ce7; margin-bottom: 15px;">
            <h3>${t.teacher_name}</h3>
            <p><b>Teacher ID:</b> ${t.teacher_id}</p>
            <p><b>Mobile:</b> ${t.mobile}</p>
            <p><b>Password:</b> ${t.pass}</p>
            <p><b>Salary:</b> ₹${t.salary}</p>
            <p><b>Joining Date:</b> ${t.joining_date}</p>
            <p><b>Classes:</b> ${t.classes?.join(", ") || "None"}</p>
            <p><b>Subjects:</b> ${t.subjects?.join(", ") || "None"}</p>
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

// --- 7. SEARCH & UPDATE LOGIC (Updated Classes/Subjects) ---
async function searchTeacher() {
    const id = document.getElementById('search_tid').value.trim();
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const t = teachers.find(x => x.teacher_id === id);

    if(t) {
        document.getElementById('up_id').value = t.teacher_id;
        document.getElementById('up_name').value = t.teacher_name || "";
        document.getElementById('up_mobile').value = t.mobile || "";
        document.getElementById('up_pass').value = t.pass || "";
        document.getElementById('up_salary').value = t.salary || "";
        
        // Reset and Check Checkboxes
        document.querySelectorAll('#updateForm input[type="checkbox"]').forEach(cb => cb.checked = false);
        t.classes?.forEach(c => {
            const cb = document.querySelector(`#up_classes_div input[value="${c}"]`);
            if(cb) cb.checked = true;
        });
        t.subjects?.forEach(s => {
            const cb = document.querySelector(`#up_subjects_div input[value="${s}"]`);
            if(cb) cb.checked = true;
        });
        alert("Teacher data loaded!");
    } else { alert("Not found!"); }
}

document.getElementById("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.classes = formData.getAll('classes');
    data.subjects = formData.getAll('subjects');

    const res = await fetch('/api/update-teacher-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Updated!"); modals.update.style.display="none"; loadTeacherData(); }
};

// --- 8. DELETE TEACHER ---
async function deleteTeacher() {
    const id = document.getElementById('up_id').value;
    if(!confirm("Are you sure?")) return;
    await fetch('/api/delete-teacher', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: id })
    });
    alert("Deleted!"); modals.update.style.display="none"; loadTeacherData();
}

// --- 9. SAVE SYSTEM SETTINGS ---
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
    alert("Settings Saved!"); loadSettings(); modals.sys.style.display="none";
};
// Student ID Auto Generation
document.getElementById('s_name').oninput = (e) => {
    const name = e.target.value.trim().toUpperCase();
    if(name.length >= 3) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('s_id').value = "STU" + rand;
        document.getElementById('s_pass').value = name.substring(0, 3) + "@" + rand;
    }
};

// Open/Close Modals for Students
document.getElementById("openStudentBtn").onclick = () => document.getElementById("studentModal").style.display = "block";
document.getElementById("openStudentDataBtn").onclick = () => { 
    document.getElementById("studentDataModal").style.display = "block"; 
    loadStudentData(); 
};

// Load Student Cards with Parent SMS Option
// --- LOAD STUDENT CARDS WITH DYNAMIC SMS & WHATSAPP ---
// --- LOAD STUDENT CARDS WITH MONTHLY FEES TRACKER ---
async function loadStudentData() {
    const res = await fetch('/api/get-students');
    const students = await res.json();
    const container = document.getElementById("studentTableBody");
    
    if (students.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>Koi student nahi mila!</p>";
        return;
    }

    container.innerHTML = ""; 

    students.forEach(s => {
        // --- MONTH CALCULATION LOGIC ---
        const joinDate = s.joining_date ? new Date(s.joining_date) : new Date();
        const today = new Date();
        const diff = (today.getFullYear() - joinDate.getFullYear()) * 12 + (today.getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1; // Kam se kam 1 mahina dikhayega

        // --- CHECKBOX GENERATION ---
        let checks = "";
        for(let i = 1; i <= totalMonths; i++) {
            const isPaid = s.paid_months?.includes(i) ? "checked" : "";
            checks += `
                <label style="background:#e1f5fe; padding:2px 6px; border-radius:5px; font-size:11px; cursor:pointer; border:1px solid #b3e5fc; display:flex; align-items:center; gap:3px;">
                    <input type="checkbox" ${isPaid} onchange="updateFeesStatus('${s.student_id}', ${i}, this.checked)"> M${i}
                </label>`;
        }

        // --- MESSAGE TEMPLATES ---
        const p_msg = `Dear Parent, your child ${s.student_name} CLASS ${s.student_class} fees is due. CALL FOR MORE INFORMATION: 7543952488 REGARD: BBCC MADHUBANI`;
        const s_msg = `Dear STUDENT, your CLASS ${s.student_class} fees is due. CALL FOR MORE INFORMATION: 7543952488 REGARD: BBCC MADHUBANI`;

        container.innerHTML += `
            <div class="teacher-card" style="background:white; padding:18px; border-radius:15px; color:#333; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px;">
                    <h4 style="margin:0; color:#6c5ce7;">${s.student_name} <span style="font-size:11px; color:#777;">ID: ${s.student_id}</span></h4>
                    <p style="font-size:11px; color:#555; margin:0;"><b>Joined:</b> ${s.joining_date} | <b>Class:</b> ${s.student_class}</p>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="font-size:13px;"><b>Fees:</b> <span style="color:green; font-weight:bold;">₹${s.fees}</span></span>
                    <div style="display:flex; gap:8px;">
                        <a href="sms:${s.parent_mobile}?body=${encodeURIComponent(p_msg)}" title="SMS Parent" style="color:#e84393; font-size:14px;"><i class="fas fa-comment-alt"></i> P</a>
                        <a href="https://wa.me/${s.parent_mobile}?text=${encodeURIComponent(p_msg)}" target="_blank" style="color:#25D366; font-size:14px;"><i class="fab fa-whatsapp"></i> P</a>
                        <span style="border-left:1px solid #ccc; margin:0 2px;"></span>
                        <a href="sms:${s.mobile}?body=${encodeURIComponent(s_msg)}" title="SMS Student" style="color:#6c5ce7; font-size:14px;"><i class="fas fa-comment-alt"></i> S</a>
                    </div>
                </div>

                <div style="background:#f1f2f6; padding:8px; border-radius:10px;">
                    <p style="font-size:10px; font-weight:bold; margin-bottom:5px; color:#2d3436; text-transform:uppercase;">Fees Tracker (Months):</p>
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">${checks}</div>
                </div>
            </div>`;
    });
}

// --- UPDATE FEES STATUS IN DATABASE ---
async function updateFeesStatus(stuId, month, status) {
    try {
        await fetch('/api/update-fees-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: stuId, month, status })
        });
        console.log(`Fees updated for ${stuId} - Month ${month}`);
    } catch (err) {
        console.error("Fees update failed:", err);
    }
}
//---------------------------------------------------------------------------
// --- STUDENT FORM SUBMISSION ---
document.getElementById("studentForm").onsubmit = async (e) => {
    e.preventDefault();
    
    // Form se saara data nikalna
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/student-reg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("Student Registered in Database! 🎉");
            e.target.reset(); // Form khali karein
            document.getElementById("studentModal").style.display = "none"; // Modal band karein
        } else {
            alert("Database Error: Data save nahi hua.");
        }
    } catch (err) {
        console.error("Connection Error:", err);
        alert("Server se connection nahi ho pa raha hai.");
    }
};
