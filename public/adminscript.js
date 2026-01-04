

// 1. Security Guard: Check if Admin is logged in
(function checkAuth() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isAdminLoggedIn !== 'true') {
        // Agar login nahi hai toh seedha login page (index.html) par bhej dega
        window.location.href = 'login.html'; 
    }
})();

// 2. Logout Function
function logoutAdmin() {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('isAdminLoggedIn'); // Login status delete karein
        window.location.href = 'login.html'; // First page par bhejein
    }
}

// --- UTILITY: Image to Base64 ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- HELPER: Mahine ka naam nikalne ke liye (Jan-24 format) ---
function getMonthLabel(joiningDateStr, index) {
    const date = joiningDateStr ? new Date(joiningDateStr) : new Date();
    // Index 1 matlab joining month, isliye (index - 1)
    date.setMonth(date.getMonth() + (index - 1));
    const options = { month: 'short', year: '2-digit' };
    return date.toLocaleString('en-US', options).replace(' ', '-');
}

// --- INITIALIZE DASHBOARD ---
function initDashboard() {
    loadSettings();
}

// --- 1. LOAD SETTINGS (Header & Footer Sync) ---


// Fir isse fetch body mein bhej dein
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();

        if (data) {
            // Helper function: Taaki bar-bar document.getElementById na likhna pade
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || "";
            };
            const setTxt = (id, txt) => {
                const el = document.getElementById(id);
                if (el) el.innerText = txt || "";
            };

            // UI Branding Update
            setTxt('db-title', data.title);
            setTxt('db-subtitle', data.sub_title);
            
            const logoEl = document.getElementById('db-logo');
            if (logoEl && data.logo) logoEl.src = data.logo;

            // Form Fields Update
            setVal('form-title', data.title);
            setVal('form-subtitle', data.sub_title);
            setVal('form-contact', data.contact);
            setVal('form-call', data.call_no);
            setVal('form-gmail', data.gmail);
            setVal('form-facebook', data.facebook);
            setVal('form-help', data.help);

            // Agar API se groq_key aa rahi hai toh:
            setVal('set-groq-key', data.groq_key); 
        }
    } catch (err) { 
        console.error("Error loading settings:", err); 
    }
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

    container.innerHTML = ""; 

    teachers.forEach(t => {
        const joinDate = t.joining_date ? new Date(t.joining_date) : new Date();
        const diff = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        let checks = "";
        for(let i=1; i<=totalMonths; i++) {
            const checked = t.paid_months?.includes(i) ? "checked" : "";
            const monthName = getMonthLabel(t.joining_date, i); // Updated Label
            checks += `
                <label style="background:#eee; padding:2px 5px; border-radius:4px; font-size:11px; cursor:pointer; min-width:55px; display:inline-block; text-align:center;">
                    <input type="checkbox" ${checked} onchange="updatePaidStatus('${t.teacher_id}', ${i}, this.checked)"> ${monthName}
                </label>`;
        }

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

// --- 7. SEARCH & UPDATE LOGIC ---
async function searchTeacher() {
    const id = document.getElementById('search_tid').value.trim().toUpperCase();
    if(!id) return alert("Pehle Teacher ID likhein!");
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const t = teachers.find(x => x.teacher_id === id);

    if(t) {
        document.getElementById('up_id').value = t.teacher_id;
        document.getElementById('up_name').value = t.teacher_name || "";
        document.getElementById('up_mobile').value = t.mobile || "";
        document.getElementById('up_pass').value = t.pass || "";
        document.getElementById('up_salary').value = t.salary || "";
        document.getElementById('up_tview_photo').src = t.photo || "https://via.placeholder.com/80";
        document.querySelectorAll('#updateForm input[type="checkbox"]').forEach(cb => cb.checked = false);
        t.classes?.forEach(c => {
            const cb = document.querySelector(`#up_classes_div input[value="${c}"]`);
            if(cb) cb.checked = true;
        });
        t.subjects?.forEach(s => {
            const cb = document.querySelector(`#up_subjects_div input[value="${s}"]`);
            if(cb) cb.checked = true;
        });
        alert("Teacher data mil gaya aur load ho gaya! ✅");
    } else { 
        alert("Teacher ID '" + id + "' nahi mili!"); 
    }
}

// --- UPDATED TEACHER UPDATE WITH PHOTO HANDLING ---
document.getElementById("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // 1. Teacher ID confirm karein
    data.teacher_id = document.getElementById('up_id').value; 
    if(!data.teacher_id) return alert("Pehle kisi teacher ko search karke load karein!");

    // 2. Photo Handling Logic (Add kiya gaya)
    const updatePhotoFile = document.getElementById('up_tphoto').files[0];
    if(updatePhotoFile) {
        // Agar nayi file select ki hai to use Base64 mein badlein
        data.photo = await convertToBase64(updatePhotoFile); 
    } else {
        // Agar nayi file select nahi ki, to purani photo (jo preview mein dikh rahi hai) wahi rehne dein
        data.photo = document.getElementById('up_tview_photo').src;
    }

    // 3. Classes aur Subjects checkboxes ka data (Purana logic)
    data.classes = formData.getAll('classes');
    data.subjects = formData.getAll('subjects');

    try {
        const res = await fetch('/api/update-teacher-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if(res.ok) { 
            alert("Teacher Data Updated Successfully! ✅"); 
            // Modal band karne ke liye (aapke variable ke hisab se)
            document.getElementById("updateModal").style.display = "none"; 
            loadTeacherData(); 
        }
    } catch (err) { 
        console.error(err);
        alert("Server connection error!"); 
    }
};

// --- 8. DELETE TEACHER (Waisa hi rahega) ---
async function deleteTeacher() {
    const id = document.getElementById('up_id').value;
    if(!id) return alert("Pehle kisi Teacher ko Search karein!");
    if(!confirm("Kya aap sach mein is account ko delete karna chahte hain?")) return;
    try {
        const res = await fetch('/api/delete-teacher', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: id })
        });
        if(res.ok) { 
            alert("Teacher Account Deleted! 🗑️"); 
            document.getElementById("updateModal").style.display="none"; 
            loadTeacherData(); 
        }
    } catch (err) { alert("Delete error!"); }
}
// --- 9. SAVE SYSTEM SETTINGS ---
document.getElementById("adminForm").onsubmit = async (e) => {
    e.preventDefault();
    
    // Loading indicator ya button disable kar sakte hain yahan
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.innerText = "Saving...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // --- NAYA BADLAV: API Key ko manually add karein ---
    const groqKeyInput = document.getElementById('set-groq-key');
    if (groqKeyInput) {
        data.groq_key = groqKeyInput.value; 
    }
    
    const logo = document.getElementById('logoInput').files[0];
    if (logo) {
        data.logo = await toBase64(logo);
    }
    
    try {
        const response = await fetch('/api/update-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert("✅ Settings saved successfully!");
            loadSettings(); 
            modals.sys.style.display = "none";
        } else {
            alert("❌ Error: " + (result.error || "Unknown error occurred"));
        }
    } catch (err) {
        console.error("Save Settings Error:", err);
        alert("❌ Network Error: Server se connection nahi ho paya.");
    } finally {
        if(submitBtn) submitBtn.innerText = "Save Settings";
    }
};
//===============================================================================================================
// --- HELPER FUNCTION: Convert Image to Base64 ---
// Ise photo processing ke liye use karenge
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Student ID Auto Generation
document.getElementById('s_name').oninput = (e) => {
    const name = e.target.value.trim().toUpperCase();
    if(name.length >= 3) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('s_id').value = "STU" + rand;
        document.getElementById('s_pass').value = name.substring(0, 3) + "@" + rand;
    }
};

document.getElementById("openStudentBtn").onclick = () => document.getElementById("studentModal").style.display = "block";
document.getElementById("openStudentDataBtn").onclick = () => { 
    document.getElementById("studentDataModal").style.display = "block"; 
    loadStudentData(); 
};

// // --- UPDATED: Load Student Data with Class Filter, Photo, and Pay/Due Logic ---
// // --- UPDATED: Load Student Data with Class Filter, Photo, and Detailed Month Breakdown ---
async function loadStudentData() {
    // 1. Class Filter ki value lena
    const filterElem = document.getElementById('fee_class_filter');
    const selectedClass = filterElem ? filterElem.value : "ALL";

    const res = await fetch('/api/get-students');
    let students = await res.json();
    
    // 2. Filter by Class logic
    if(selectedClass !== "ALL") {
        students = students.filter(s => s.student_class === selectedClass);
    }

    const container = document.getElementById("studentTableBody");
    if (students.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666; grid-column: 1/-1;'>Is class mein koi student nahi mila!</p>";
        return;
    }

    container.innerHTML = ""; 

    students.forEach(s => {
        // --- Date & Month Calculation ---
        const joinDate = s.joining_date ? new Date(s.joining_date) : new Date();
        const today = new Date();
        const diff = (today.getFullYear() - joinDate.getFullYear()) * 12 + (today.getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;

        let feeRows = "";
        let totalPaid = 0;
        let totalDue = 0;
        let dueBreakdown = ""; // Message mein month-wise detail ke liye

        // --- Fees Row Generation (Paid/Due Inputs) ---
        for(let i = 1; i <= totalMonths; i++) {
            const monthName = typeof getMonthLabel === 'function' ? getMonthLabel(s.joining_date, i) : "Month " + i;
            const monthData = s.fees_data?.[i] || { status: false, paid: 0, due: s.fees };
            
            if(monthData.status) {
                totalPaid += Number(monthData.paid || 0);
            }
            
            let mDue = Number(monthData.due || 0);
            totalDue += mDue;

            // Agar kisi mahine mein paisa baki hai (>0), toh use message list mein jodo
            if(mDue > 0) {
                dueBreakdown += `${monthName} ₹${mDue}, `;
            }

            feeRows += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px; background:#f9f9f9; padding:5px; border-radius:5px; border:1px solid #eee;">
                    <input type="checkbox" class="status-chk-${s.student_id}" ${monthData.status ? "checked" : ""} onchange="saveFeeDetail('${s.student_id}', ${i}, 'status', this.checked)">
                    <span style="width:65px; font-size:11px; font-weight:bold; color:#2d3436;">${monthName}</span>
                    
                    <input type="number" id="paid-box-${s.student_id}-${i}" class="paid-in-${s.student_id}" placeholder="Paid" value="${monthData.paid || ''}" 
                        style="width:55px; padding:2px; font-size:11px; border:1px solid #ccc; border-radius:3px;" 
                        oninput="calculateLiveDue('${s.student_id}', ${i}, ${s.fees})"
                        onchange="saveFeeDetail('${s.student_id}', ${i}, 'paid', this.value)">
                    
                    <input type="number" id="due-box-${s.student_id}-${i}" class="due-in-${s.student_id}" placeholder="Due" value="${monthData.due || ''}" 
                        style="width:55px; padding:2px; font-size:11px; border:1px solid #ccc; border-radius:3px;" 
                        onchange="saveFeeDetail('${s.student_id}', ${i}, 'due', this.value)">
                </div>`;
        }

        // --- Message Cleaning ---
        if(dueBreakdown.endsWith(", ")) dueBreakdown = dueBreakdown.slice(0, -2); // Aakhri comma hatane ke liye
        
        // Final Message Format
        const commonMsg = `Dear Parent/Student,  ${s.student_name}. Total Due: ₹${totalDue}. Details: ${dueBreakdown ? dueBreakdown : 'Nil'}. Please pay soon. REGARD: Bal Bharti Coching Center more info click https://balbharticoachingcenter.onrender.com , call 9971095964 `;
        
        container.innerHTML += `
            <div class="diary-card" style="border-left: 5px solid #6c5ce7; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:start; border-bottom:1px dashed #ddd; padding-bottom:10px;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <img src="${s.photo || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid #6c5ce7;">
                        <div>
                            <h4 style="margin:0; color:#2d3436; font-size:15px;">${s.student_name}</h4>
                            <small style="color:#6c5ce7; font-weight:bold;">ID: ${s.student_id} | Class: ${s.student_class}</small>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span style="display:block; font-size:10px; color:#777;">DOJ: ${s.joining_date}</span>
                        <span style="font-weight:bold; color:#2ecc71; font-size:14px;">₹${s.fees}/mo</span>
                    </div>
                </div>

                <div style="margin:10px 0; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:11px; background:#fffaf0; padding:5px; border-radius:5px;">
                    <div>
                        <p style="margin:2px 0;"><b>Parent:</b> ${s.parent_name}</p>
                        <p style="margin:2px 0;"><b>P. Mob:</b> ${s.parent_mobile}</p>
                    </div>
                    <div style="border-left:1px solid #ddd; padding-left:10px;">
                        <p style="margin:2px 0;"><b>Stu. Mob:</b> ${s.mobile}</p>
                        <p style="margin:2px 0;"><b>Pass:</b> <span style="color:#e84393;">${s.pass}</span></p>
                    </div>
                </div>

                <div style="margin:10px 0; max-height:180px; overflow-y:auto; padding-right:5px;">
                    <p style="font-size:10px; font-weight:bold; color:#747d8c; margin-bottom:5px;">MONTHLY TRACKER (Month | Paid | Due)</p>
                    ${feeRows}
                </div>

                <div style="background:#f1f2f6; padding:8px; border-radius:5px; font-size:12px; display:flex; justify-content:space-between; border:1px solid #dfe4ea;">
                    <b style="color:#27ae60;">Paid: ₹<span id="total-paid-${s.student_id}">${totalPaid}</span></b>
                    <b style="color:#eb4d4b;">Total Due: ₹<span id="total-due-${s.student_id}">${totalDue}</span></b>
                </div>

                <div class="diary-actions" style="margin-top:10px;">
                    <div style="text-align:center;">
                        <small style="display:block; font-size:9px; color:#999;">PARENT</small>
                        <div style="display:flex; gap:12px;">
                            <a href="sms:${s.parent_mobile}?body=${encodeURIComponent(commonMsg)}" style="color:#e84393;"><i class="fas fa-comment"></i></a>
                            <a href="https://wa.me/${s.parent_mobile}?text=${encodeURIComponent(commonMsg)}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i></a>
                            <a href="tel:${s.parent_mobile}" style="color:#0984e3;"><i class="fas fa-phone-alt"></i></a>
                        </div>
                    </div>
                    <div style="width:1px; background:#eee;"></div>
                    <div style="text-align:center;">
                        <small style="display:block; font-size:9px; color:#999;">STUDENT</small>
                        <div style="display:flex; gap:12px;">
                            <a href="sms:${s.mobile}?body=${encodeURIComponent(commonMsg)}" style="color:#6c5ce7;"><i class="fas fa-comment"></i></a>
                            <a href="https://wa.me/${s.mobile}?text=${encodeURIComponent(commonMsg)}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i></a>
                            <a href="tel:${s.mobile}" style="color:#0984e3;"><i class="fas fa-phone-alt"></i></a>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

// --- UPDATED: Calculate Monthly Due + Save automatically ---
function calculateLiveDue(sId, monthIndex, monthlyFees) {
    const paidInput = document.getElementById(`paid-box-${sId}-${monthIndex}`);
    const dueBox = document.getElementById(`due-box-${sId}-${monthIndex}`);
    
    if (paidInput && dueBox) {
        const paidValue = Number(paidInput.value) || 0;
        const remainingDue = monthlyFees - paidValue;
        dueBox.value = Math.max(0, remainingDue); 
        saveFeeDetail(sId, monthIndex, 'due', dueBox.value);
    }
}

// --- UPDATED: Save Fee Details with Local UI Updates ---
async function saveFeeDetail(sId, monthIndex, field, value) {
    try {
        await fetch('/api/update-student-fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: sId, month: monthIndex, field: field, value: value })
        });

        // UI calculation update bina refresh kiye
        let newTotalPaid = 0;
        let newTotalDue = 0;

        const paidInputs = document.querySelectorAll(`.paid-in-${sId}`);
        const dueInputs = document.querySelectorAll(`.due-in-${sId}`);
        const statusChecks = document.querySelectorAll(`.status-chk-${sId}`);

        statusChecks.forEach((chk, index) => {
            const pVal = Number(paidInputs[index].value) || 0;
            const dVal = Number(dueInputs[index].value) || 0;
            if(chk.checked) newTotalPaid += pVal;
            newTotalDue += dVal;
        });

        const paidLabel = document.getElementById(`total-paid-${sId}`);
        const dueLabel = document.getElementById(`total-due-${sId}`);
        
        if(paidLabel) paidLabel.innerText = newTotalPaid;
        if(dueLabel) dueLabel.innerText = newTotalDue;

    } catch (err) { 
        console.error("Fee update error:", err); 
    }
}
////////////////////////////////////////////////////////////////////////----------------------------------------------
// --- UPDATED STUDENT REGISTRATION WITH PHOTO ---
document.getElementById("studentForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Photo processing
    const photoFile = document.getElementById('s_photo').files[0];
    if(photoFile) {
        data.photo = await convertToBase64(photoFile);
    }

    try {
        const res = await fetch('/api/student-reg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) { 
            alert("Student Registered! 🎉"); 
            e.target.reset(); 
            document.getElementById("studentModal").style.display = "none"; 
        }
    } catch (err) { alert("Error!"); }
};

document.getElementById("openStudentUpdateBtn").onclick = () => {
    document.getElementById("studentUpdateModal").style.display = "block";
};

// --- UPDATED SEARCH WITH PHOTO PREVIEW ---
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
        document.getElementById('up_sdoj').value = s.joining_date || ""; 
        
        // Photo Preview in Update Modal
        if(s.photo) {
            document.getElementById('up_sview_photo').src = s.photo;
        } else {
            document.getElementById('up_sview_photo').src = "https://via.placeholder.com/80";
        }
        
        alert("Student data loaded!");
    } else { alert("Not found!"); }
}

// --- UPDATED UPDATE WITH PHOTO HANDLING ---
document.getElementById("studentUpdateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.joining_date = document.getElementById('up_sdoj').value;

    // Nayi photo check karein
    const updatePhotoFile = document.getElementById('up_sphoto').files[0];
    if(updatePhotoFile) {
        data.photo = await convertToBase64(updatePhotoFile);
    } else {
        // Agar nayi photo select nahi ki, to purani hi rehne dein
        data.photo = document.getElementById('up_sview_photo').src;
    }

    const res = await fetch('/api/update-student-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { 
        alert("Updated! ✅"); 
        document.getElementById("studentUpdateModal").style.display="none"; 
        loadStudentData(); 
    }
};

async function deleteStudent() {
    const id = document.getElementById('up_sid').value;
    if(!id) return alert("Search student!");
    if(!confirm("Delete everything?")) return;
    const res = await fetch('/api/delete-student', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id })
    });
    if(res.ok) { alert("Deleted!"); document.getElementById("studentUpdateModal").style.display="none"; loadStudentData(); }
}

document.getElementById("openResultBtn").onclick = () => {
    document.getElementById("resultModal").style.display = "block";
};
//==========================================================================================================
async function filterClassForResults() {
    const selectedClass = document.getElementById('res_class_filter').value;
    const res = await fetch('/api/get-students');
    const students = await res.json();
    const classStudents = students.filter(s => s.student_class === selectedClass);
    const container = document.getElementById("resultTableBody");
    container.innerHTML = "";
    if(classStudents.length === 0) {
        container.innerHTML = "<tr><td colspan='5' style='color:red;'>No students!</td></tr>";
        return;
    }
    classStudents.forEach(s => {
        const obt = s.obtained_marks || "";
        const tot = s.total_marks || "";
        container.innerHTML += `
            <tr style="border-bottom:1px solid #ddd; text-align:center;">
                <td style="padding:12px;"><b>${s.student_id}</b></td>
                <td>${s.student_name}</td>
                <td><input type="number" id="obt_${s.student_id}" value="${obt}" style="width:70px;"></td>
                <td id="div_${s.student_id}">${calculateDivision(obt, tot)}</td>
                <td><button onclick="saveIndividualResult('${s.student_id}')">Save</button></td>
            </tr>`;
    });
}

function calculateDivision(obt, total) {
    if(!obt || !total || total == 0) return "---";
    const per = (parseInt(obt) / parseInt(total)) * 100;
    if(per >= 60) return "<span style='color:green;'>1st Div</span>";
    if(per >= 45) return "<span style='color:blue;'>2nd Div</span>";
    if(per >= 33) return "<span style='color:orange;'>3rd Div</span>";
    return "<span style='color:red;'>Fail</span>";
}

async function saveIndividualResult(sid) {
    const obt = document.getElementById(`obt_${sid}`).value;
    const total = document.getElementById('bulk_total_marks').value;
    const exDate = document.getElementById('bulk_exam_date').value;
    if(!total || !exDate) return alert("Total Marks & Date required!");
    const res = await fetch('/api/update-student-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: sid, obtained_marks: obt, total_marks: total, exam_date: exDate })
    });
    if(res.ok) document.getElementById(`div_${sid}`).innerHTML = calculateDivision(obt, total);
}

const adminProfileModal = document.getElementById('adminProfileModal');
document.getElementById('openAdminProfileBtn').onclick = async () => {
    adminProfileModal.style.display = "block";
    const response = await fetch('/api/get-admin-profile');
    const data = await response.json();
    if(data.admin_userid) {
        document.getElementById('adm_name').value = data.admin_name || "";
        document.getElementById('adm_userid').value = data.admin_userid || "";
        document.getElementById('adm_pass').value = data.admin_pass || "";
        document.getElementById('adm_mobile').value = data.admin_mobile || "";
    }
};

document.getElementById('adminProfileForm').onsubmit = async (e) => {
    e.preventDefault();
    const formData = {
        admin_name: document.getElementById('adm_name').value,
        admin_userid: document.getElementById('adm_userid').value,
        admin_pass: document.getElementById('adm_pass').value,
        admin_mobile: document.getElementById('adm_mobile').value
    };
    const response = await fetch('/api/update-admin-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    const result = await response.json();
    if(result.success) { alert("Profile Updated!"); adminProfileModal.style.display = "none"; }
};
// ==========================================
// HOME SLIDER MANAGEMENT (MONGODB VERSION)
// ==========================================

// 1. Modal Control
const sliderModal = document.getElementById('sliderModal');
const openSliderBtn = document.getElementById('openSliderBtn');

// Slider Button Click hone par modal khulega aur photos load hongi
if (openSliderBtn) {
    openSliderBtn.onclick = () => {
        sliderModal.style.display = "block";
        loadSliderPhotos(); // Database se photos fetch karega
    }
}

// 2. Photo Upload aur Database mein Save karna
async function uploadSliderPhoto() {
    const fileInput = document.getElementById('sliderInput');
    const file = fileInput.files[0];
    
    if (!file) return alert("Please select a photo first!");

    // Loading indicator (optional)
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Photo = e.target.result;

        try {
            const response = await fetch('/api/add-slider', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo: base64Photo })
            });

            const result = await response.json();
            if(result.success) {
                alert("✅ Photo saved to MongoDB!");
                fileInput.value = ""; // Input clear karein
                loadSliderPhotos(); // List refresh karein
            } else {
                alert("❌ Upload failed: " + result.error);
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Server connection error!");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// 3. Database se Photos load karke Dashboard par dikhana
async function loadSliderPhotos() {
    const container = document.getElementById('sliderPreviewContainer');
    
    try {
        container.innerHTML = '<p style="color: #6c5ce7;"><i class="fas fa-sync fa-spin"></i> Loading photos...</p>';
        
        const response = await fetch('/api/get-sliders');
        const photos = await response.json();

        if (!photos || photos.length === 0) {
            container.innerHTML = "<p style='color:#888;'>No photos added to slider yet.</p>";
            return;
        }

        // Photos ko grid layout mein dikhana
        container.innerHTML = photos.map(p => `
            <div style="position: relative; border: 2px solid #6c5ce7; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <img src="${p.photo}" style="width: 100%; height: 100px; object-fit: cover; display: block;">
                <button onclick="deleteSliderPhoto('${p._id}')" 
                        style="position: absolute; top: 5px; right: 5px; background: rgba(231, 76, 60, 0.9); color: white; border: none; border-radius: 4px; cursor: pointer; padding: 5px 8px; font-size: 12px; transition: 0.3s;"
                        onmouseover="this.style.background='#c0392b'" 
                        onmouseout="this.style.background='rgba(231, 76, 60, 0.9)'">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error loading photos:", err);
        container.innerHTML = "<p style='color:red;'>Error loading data from server.</p>";
    }
}

// 4. Database se Photo delete karna
async function deleteSliderPhoto(id) {
    if(!confirm("Are you sure? This photo will be removed from the Home Slider.")) return;

    try {
        const response = await fetch(`/api/delete-slider/${id}`, { 
            method: 'DELETE' 
        });
        const result = await response.json();
        
        if(result.success) {
            loadSliderPhotos(); // List refresh karein
        } else {
            alert("Delete failed!");
        }
    } catch (err) {
        console.error("Delete error:", err);
        alert("Server error while deleting.");
    }
}

// --- CLASS SYSTEM CONFIGURATION ---

const classList = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "I.A.", "I.Sc.", "I.Com.", "B.A.", "B.Sc.", "B.Com."];
const subjectsArray = ["Hindi", "English", "Maths", "Sanskrit", "Science", "Social Science", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Accountancy", "Business Studies", "Philosophy"];

// 1. Open Main Class Selection Modal
document.getElementById('openClassSystemBtn').onclick = () => {
    const grid = document.getElementById('class_button_grid');
    grid.innerHTML = classList.map(cls => `
        <button onclick="openClassForm('${cls}')" class="btn-primary" style="margin:0; background:#34495e; font-size:14px;">${cls}</button>
    `).join('');
    document.getElementById('classSystemModal').style.display = "block";
};

// 2. Open Form for Specific Class
async function openClassForm(cls) {
    document.getElementById('config_target_class').value = cls;
    document.getElementById('current_editing_class').innerText = "Managing Class: " + cls;
    
    // Banner Input aur Previous Preview reset karein
    const bannerInput = document.getElementById('cls_banner');
    if(bannerInput) bannerInput.value = ""; 
    const oldPreview = document.getElementById('banner-preview');
    if(oldPreview) oldPreview.remove();

    // Fetch Teachers to auto-detect names
    const tRes = await fetch('/api/get-teachers');
    const teachers = await tRes.json();
    
    const container = document.getElementById('subject_config_container');
    container.innerHTML = "";

    subjectsArray.forEach(sub => {
        // Find teacher who teaches this class AND this subject
        const assignedTeacher = teachers.find(t => t.classes?.includes(cls) && t.subjects?.includes(sub));
        const teacherName = assignedTeacher ? assignedTeacher.teacher_name : "Not Assigned";

        const row = document.createElement('div');
        row.style = "background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:10px; border-left:4px solid #ddd;";
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <label style="font-weight:bold; cursor:pointer;">
                    <input type="checkbox" id="check_${sub}" onchange="toggleSubjectInputs('${sub}', this.checked)"> ${sub}
                </label>
                <span style="font-size:11px; color:#2980b9;"><b>Teacher:</b> ${teacherName}</span>
            </div>
            <div id="link_box_${sub}" style="display:none; margin-top:10px; padding-left:20px;">
                <div id="inputs_container_${sub}">
                    <input type="text" name="${sub}_links[]" placeholder="YouTube Link" style="width:80%; margin-bottom:5px;">
                </div>
                <button type="button" onclick="addLinkInput('${sub}')" style="font-size:10px; background:#6c5ce7; color:white; border:none; padding:4px 8px; border-radius:4px;">+ Add More Link</button>
            </div>
        `;
        container.appendChild(row);
    });

    document.getElementById('classConfigModal').style.display = "block";
    loadExistingClassData(cls); // Puraana data load karne ke liye
}

// 3. UI Helpers
function toggleSubjectInputs(sub, isChecked) {
    const box = document.getElementById(`link_box_${sub}`);
    if(box) box.style.display = isChecked ? "block" : "none";
}

function addLinkInput(sub) {
    const cont = document.getElementById(`inputs_container_${sub}`);
    const input = document.createElement('input');
    input.type = "text";
    input.name = `${sub}_links[]`;
    input.placeholder = "YouTube Link";
    input.style = "width:80%; margin-bottom:5px; display:block;";
    cont.appendChild(input);
}

// 4. Save Logic (Integrated with Photo/Base64)
document.getElementById('classDetailsForm').onsubmit = async (e) => {
    e.preventDefault();
    const cls = document.getElementById('config_target_class').value;
    const intro = document.getElementById('cls_intro').value;
    const bannerFile = document.getElementById('cls_banner').files[0];
    
    let bannerBase64 = "";

    // Agar nayi photo select ki hai to use Base64 mein badlein
    if (bannerFile) {
        bannerBase64 = await toBase64(bannerFile);
    } else {
        // Agar nayi photo nahi hai, to preview wali purani photo hi rehne dein
        const preview = document.getElementById('banner-preview');
        bannerBase64 = preview ? preview.src : "";
    }

    let subjectData = {};
    subjectsArray.forEach(sub => {
        const checkbox = document.getElementById(`check_${sub}`);
        if(checkbox && checkbox.checked) {
            const links = Array.from(document.getElementsByName(`${sub}_links[]`))
                               .map(i => i.value)
                               .filter(v => v.trim() !== "");
            subjectData[sub] = links;
        }
    });

    const finalData = { 
        class_name: cls, 
        banner: bannerBase64, 
        intro_video: intro, 
        subjects: subjectData 
    };

    const res = await fetch('/api/save-class-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
    });

    if(res.ok) {
        alert("Class Content Saved Successfully! ✅");
        document.getElementById('classConfigModal').style.display = "none";
    } else {
        alert("Error saving data! ❌");
    }
};

// 5. Load Previous Data (Full Implementation)
async function loadExistingClassData(cls) {
    try {
        const res = await fetch(`/api/get-class-config/${cls}`);
        const data = await res.json();
        
        if(data) {
            // Intro Video fill karein
            document.getElementById('cls_intro').value = data.intro_video || "";

            // Banner Preview logic
            if(data.banner) {
                const bannerInput = document.getElementById('cls_banner');
                let preview = document.getElementById('banner-preview');
                if(!preview) {
                    preview = document.createElement('img');
                    preview.id = 'banner-preview';
                    preview.style = "width:100px; height:60px; object-fit:cover; margin-top:10px; display:block; border-radius:5px; border:1px solid #ddd;";
                    bannerInput.after(preview);
                }
                preview.src = data.banner;
            }

            // Subjects aur Links fill karein
            if(data.subjects) {
                for (const sub in data.subjects) {
                    const cb = document.getElementById(`check_${sub}`);
                    if(cb) {
                        cb.checked = true;
                        toggleSubjectInputs(sub, true); // Link box kholne ke liye
                        
                        const cont = document.getElementById(`inputs_container_${sub}`);
                        if(cont) {
                            cont.innerHTML = ""; // Purane empty inputs saaf karein
                            data.subjects[sub].forEach(link => {
                                const input = document.createElement('input');
                                input.type = "text";
                                input.name = `${sub}_links[]`;
                                input.value = link;
                                input.style = "width:80%; margin-bottom:5px; display:block;";
                                cont.appendChild(input);
                            });
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error loading existing class data:", err);
    }
}

function processImage() {
    const fileInput = document.getElementById('compInput');
    const type = document.getElementById('compType').value;
    const status = document.getElementById('compStatus');
    const canvas = document.getElementById('compCanvas');
    const ctx = canvas.getContext('2d');

    if (!fileInput.files[0]) {
        alert("Pehle image select karein!");
        return;
    }

    status.innerText = "Processing...";
    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);

    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;

        img.onload = function() {
            let targetWidth, targetHeight;

            if (type === 'logo') {
                // Square Crop for Logo
                targetWidth = 200;
                targetHeight = 200;
            } else if (type === 'banner') {
                // Wide Crop for Banner
                targetWidth = 1200;
                targetHeight = 400;
            } else {
                // No crop for Photo, just standard size
                targetWidth = img.width;
                targetHeight = img.height;
                // Scale down if too large to keep under 100kb
                if(targetWidth > 1500) {
                    targetHeight = (1500 / targetWidth) * targetHeight;
                    targetWidth = 1500;
                }
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Logic to Crop from Center
            let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
            
            if (type !== 'photo') {
                const aspect = targetWidth / targetHeight;
                if (img.width / img.height > aspect) {
                    sourceWidth = img.height * aspect;
                    sourceX = (img.width - sourceWidth) / 2;
                } else {
                    sourceHeight = img.width / aspect;
                    sourceY = (img.height - sourceHeight) / 2;
                }
            }

            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

            // 0.7 quality ensures it stays around/under 100KB
            const processedData = canvas.toDataURL('image/jpeg', 0.7);
            
            const downloadLink = document.createElement('a');
            downloadLink.download = `BBCC_${type}_${Date.now()}.jpg`;
            downloadLink.href = processedData;
            downloadLink.click();

            status.innerText = "Done! Image Downloaded.";
            status.style.color = "#27ae60";
        };
    };
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////boat///////////////
