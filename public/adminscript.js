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
// --- LOAD STUDENT CARDS (DIARY DESIGN WITH ALL DATA) ---
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
        const totalMonths = diff < 0 ? 1 : diff + 1;

        // --- CHECKBOX GENERATION ---
        let checks = "";
        for(let i = 1; i <= totalMonths; i++) {
            const isPaid = s.paid_months?.includes(i) ? "checked" : "";
            checks += `
                <label class="fee-chip">
                    <input type="checkbox" ${isPaid} onchange="updateFeesStatus('${s.student_id}', ${i}, this.checked)">
                    <span>M${i}</span>
                </label>`;
        }

        // --- DYNAMIC MESSAGE TEMPLATES ---
        const p_msg = `Dear Parent, your child ${s.student_name} CLASS ${s.student_class} fees is due. CALL FOR MORE INFORMATION: 7543952488 REGARD: BBCC MADHUBANI`;
        const s_msg = `Dear STUDENT, your CLASS ${s.student_class} fees is due. CALL FOR MORE INFORMATION: 7543952488 REGARD: BBCC MADHUBANI`;

        // --- UPDATED DIARY CARD HTML (All Data Included) ---
        container.innerHTML += `
            <div class="diary-card">
                <div style="display:flex; justify-content:space-between; align-items:start; border-bottom:1px dashed #ddd; padding-bottom:10px;">
                    <div>
                        <h4 style="margin:0; color:#2d3436; font-size:16px;">${s.student_name}</h4>
                        <small style="color:#6c5ce7; font-weight:bold;">ID: ${s.student_id} | Class: ${s.student_class}</small>
                    </div>
                    <div style="text-align:right;">
                        <span style="display:block; font-size:10px; color:#777;">DOJ: ${s.joining_date}</span>
                        <span style="font-weight:bold; color:#2ecc71; font-size:15px;">₹${s.fees}/mo</span>
                    </div>
                </div>

                <div style="margin:12px 0; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:12px;">
                    <div>
                        <p style="margin:2px 0;"><b>Parent:</b> ${s.parent_name}</p>
                        <p style="margin:2px 0;"><b>P. Mob:</b> ${s.parent_mobile}</p>
                    </div>
                    <div style="border-left:1px solid #eee; padding-left:10px;">
                        <p style="margin:2px 0;"><b>Stu. Mob:</b> ${s.mobile}</p>
                        <p style="margin:2px 0;"><b>Password:</b> <span style="color:#e84393;">${s.pass}</span></p>
                    </div>
                </div>
                
                <div class="diary-actions">
                    <div style="text-align:center;">
                        <small style="display:block; font-size:9px; margin-bottom:3px; color:#999;">PARENT CONTACT</small>
                        <div style="display:flex; gap:10px;">
                            <a href="sms:${s.parent_mobile}?body=${encodeURIComponent(p_msg)}" style="color:#e84393;" title="SMS Parent"><i class="fas fa-comment"></i></a>
                            <a href="https://wa.me/${s.parent_mobile}?text=${encodeURIComponent(p_msg)}" target="_blank" style="color:#25D366;" title="WA Parent"><i class="fab fa-whatsapp"></i></a>
                            <a href="tel:${s.parent_mobile}" style="color:#0984e3;" title="Call Parent"><i class="fas fa-phone-alt"></i></a>
                        </div>
                    </div>
                    
                    <div style="width:1px; background:#eee;"></div>

                    <div style="text-align:center;">
                        <small style="display:block; font-size:9px; margin-bottom:3px; color:#999;">STUDENT CONTACT</small>
                        <div style="display:flex; gap:10px;">
                            <a href="sms:${s.mobile}?body=${encodeURIComponent(s_msg)}" style="color:#6c5ce7;" title="SMS Student"><i class="fas fa-comment"></i></a>
                            <a href="https://wa.me/${s.mobile}?text=${encodeURIComponent(s_msg)}" target="_blank" style="color:#25D366;" title="WA Student"><i class="fab fa-whatsapp"></i></a>
                            <a href="tel:${s.mobile}" style="color:#0984e3;" title="Call Student"><i class="fas fa-phone-alt"></i></a>
                        </div>
                    </div>
                </div>

                <div style="margin-top:15px;">
                    <p style="font-size:10px; font-weight:bold; color:#747d8c; margin-bottom:8px; display:flex; justify-content:space-between;">
                        <span>FEES TRACKER (UNPAID/PAID)</span>
                        <span style="color:#6c5ce7;">${totalMonths} Months Total</span>
                    </p>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">${checks}</div>
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
// --- 1. OPEN STUDENT UPDATE MODAL ---
document.getElementById("openStudentUpdateBtn").onclick = () => {
    document.getElementById("studentUpdateModal").style.display = "block";
};

// --- 2. SEARCH STUDENT BY ID (FIXED FOR DATE) ---
async function searchStudent() {
    const id = document.getElementById('search_sid').value.trim().toUpperCase();
    const res = await fetch('/api/get-students');
    const students = await res.json();
    const s = students.find(x => x.student_id === id);

    if(s) {
        document.getElementById('up_sid').value = s.student_id;
        document.getElementById('up_sname').value = s.student_name || "";
        document.getElementById('up_spass').value = s.pass || "";
        document.getElementById('up_smobile').value = s.mobile || "";
        document.getElementById('up_pname').value = s.parent_name || "";
        document.getElementById('up_pmobile').value = s.parent_mobile || "";
        document.getElementById('up_sfees').value = s.fees || "";
        document.getElementById('up_sclass').value = s.student_class || "";
        
        // --- DATE LOAD FIX ---
        document.getElementById('up_sdoj').value = s.joining_date || ""; 
        
        alert("Student data loaded!");
    } else { 
        alert("Student ID not found!"); 
    }
}

// --- 3. UPDATE STUDENT DATA (FIXED FOR DATE) ---
document.getElementById("studentUpdateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // --- MANUAL DATE INJECTION ---
    // Ye line ensure karegi ki Joining Date database mein jaye
    data.joining_date = document.getElementById('up_sdoj').value;

    const res = await fetch('/api/update-student-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if(res.ok) { 
        alert("Student Data Updated Successfully! ✅"); 
        document.getElementById("studentUpdateModal").style.display="none"; 
        loadStudentData(); // Refresh diary cards
    } else {
        alert("Update failed! Server error.");
    }
};
// --- 4. DELETE STUDENT ACCOUNT ---
async function deleteStudent() {
    const id = document.getElementById('up_sid').value;
    if(!id) return alert("Search a student first!");
    
    if(!confirm("Are you sure? This will delete all student records!")) return;
    
    const res = await fetch('/api/delete-student', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id })
    });
    
    if(res.ok) {
        alert("Student Account Deleted!"); 
        document.getElementById("studentUpdateModal").style.display="none"; 
        loadStudentData(); 
    }
}
//---------------------------------------------------------------------------------------
// --- 1. RESULT MODAL CONTROL ---
document.getElementById("openResultBtn").onclick = () => {
    document.getElementById("resultModal").style.display = "block";
};

// --- 2. CLASS FILTER & SEARCH LOGIC ---
async function filterClassForResults() {
    const selectedClass = document.getElementById('res_class_filter').value;
    const res = await fetch('/api/get-students');
    const students = await res.json();
    
    // Sirf wahi students dikhayega jo selected class ke hain
    const classStudents = students.filter(s => s.student_class === selectedClass);
    const container = document.getElementById("resultTableBody");
    container.innerHTML = "";

    if(classStudents.length === 0) {
        container.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px; color:red;'>Is class mein koi student nahi mila!</td></tr>";
        return;
    }

    classStudents.forEach(s => {
        // Marks aur Division ka calculation
        const obt = s.obtained_marks || "";
        const tot = s.total_marks || "";
        
        container.innerHTML += `
            <tr style="border-bottom:1px solid #ddd; text-align:center;">
                <td style="padding:12px;"><b>${s.student_id}</b></td>
                <td>${s.student_name}</td>
                <td>
                    <input type="number" id="obt_${s.student_id}" value="${obt}" placeholder="Marks" style="width:70px; padding:5px; border:1px solid #ccc; border-radius:4px;">
                </td>
                <td id="div_${s.student_id}" style="font-weight:bold;">
                    ${calculateDivision(obt, tot)}
                </td>
                <td>
                    <button onclick="saveIndividualResult('${s.student_id}')" style="background:#6c5ce7; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">
                        <i class="fas fa-save"></i> Save
                    </button>
                </td>
            </tr>`;
    });
}

// --- 3. DIVISION CALCULATION ---
function calculateDivision(obt, total) {
    if(!obt || !total || total == 0) return "---";
    const per = (parseInt(obt) / parseInt(total)) * 100;
    if(per >= 60) return "<span style='color:green;'>1st Div</span>";
    if(per >= 45) return "<span style='color:blue;'>2nd Div</span>";
    if(per >= 33) return "<span style='color:orange;'>3rd Div</span>";
    return "<span style='color:red;'>Fail</span>";
}

// --- 4. INDIVIDUAL SAVE LOGIC ---
async function saveIndividualResult(sid) {
    const obt = document.getElementById(`obt_${sid}`).value;
    const total = document.getElementById('bulk_total_marks').value;
    const exDate = document.getElementById('bulk_exam_date').value;

    if(!total || !exDate) {
        alert("Please enter Total Marks and Exam Date first!");
        return;
    }

    const res = await fetch('/api/update-student-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_id: sid,
            obtained_marks: obt,
            total_marks: total,
            exam_date: exDate
        })
    });

    if(res.ok) {
        // Live update division on the screen
        document.getElementById(`div_${sid}`).innerHTML = calculateDivision(obt, total);
        console.log("Result updated for: " + sid);
    }
}
