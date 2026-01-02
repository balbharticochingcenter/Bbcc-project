// --- UTILITY: Image to Base64 ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- 1. LOAD SETTINGS (Header, Footer & Social Links) ---
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        const data = await response.json();
        
        if(data) {
            // Branding Sync
            const elements = {
                'db-title': data.title || "BBCC Portal",
                'db-subtitle': data.sub_title || "",
                'foot-help': data.help || "",
                'db-admin': data.admin_name || "Admin"
            };

            for (let id in elements) {
                const el = document.getElementById(id);
                if(el) el.innerText = elements[id];
            }

            const dbLogo = document.getElementById('db-logo');
            if(dbLogo && data.logo) dbLogo.src = data.logo;
            
            // Social Links Sync
            if(document.getElementById('foot-whatsapp')) document.getElementById('foot-whatsapp').href = `https://wa.me/${data.contact}`;
            if(document.getElementById('foot-facebook')) document.getElementById('foot-facebook').href = data.facebook || "#";
            if(document.getElementById('foot-gmail')) document.getElementById('foot-gmail').href = `mailto:${data.gmail}`;
            if(document.getElementById('foot-call')) document.getElementById('foot-call').href = `tel:${data.call_no}`;

            // Admin Form Pre-fill (if on admin page)
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
        }
    } catch (err) { 
        console.error("Settings load failed:", err); 
    }
}

// --- 2. UNIVERSAL LOGIN LOGIC ---
async function universalLogin() {
    const userId = document.getElementById('login_id').value.trim().toUpperCase();
    const userPass = document.getElementById('login_pass').value;

    if (!userId || !userPass) return alert("Please fill ID and Password!");

    // A. Admin Check
    if (userId === "ADMIN" && userPass === "7543") {
        alert("Welcome Admin!");
        window.location.href = 'admin.html';
        return;
    }

    try {
        // B. Teacher Check
        const tRes = await fetch('/api/get-teachers');
        const teachers = await tRes.json();
        const teacher = teachers.find(t => t.teacher_id === userId);

        if (teacher && teacher.pass === userPass) {
            alert("Teacher Login Successful!");
            // window.location.href = 'teacher_dashboard.html';
            return;
        }

        // C. Student Check
        const sRes = await fetch('/api/get-students');
        const students = await sRes.json();
        const student = students.find(s => s.student_id === userId);

        if (student && student.pass === userPass) {
            alert("Student Login Successful!");
            // window.location.href = 'student_profile.html';
            return;
        }

        alert("Invalid ID or Password!");
    } catch (e) {
        alert("Server error during login.");
    }
}

// --- 3. CHECK RESULT LOGIC (For Students) ---
async function checkResult() {
    const rollId = document.getElementById('stu_roll_id').value.trim().toUpperCase();
    const display = document.getElementById('resultDisplayArea');
    
    if(!rollId) return alert("Please enter Student ID");

    display.innerHTML = "<p style='color:blue;'>Searching...</p>";

    try {
        const res = await fetch('/api/get-students');
        const students = await res.json();
        const s = students.find(x => x.student_id === rollId);

        if(s && s.obtained_marks) {
            const per = ((s.obtained_marks / s.total_marks) * 100).toFixed(2);
            let divText = s.obtained_marks >= (s.total_marks * 0.6) ? "1st Division" : 
                          s.obtained_marks >= (s.total_marks * 0.45) ? "2nd Division" : "3rd Division";

            display.innerHTML = `
                <div style="background:#f1f2f6; padding:15px; border-radius:10px; border-left:5px solid #6c5ce7;">
                    <h4 style="margin:0; color:#2d3436;">${s.student_name}</h4>
                    <p style="margin:5px 0;">Class: ${s.student_class}</p>
                    <hr>
                    <p><b>Marks:</b> ${s.obtained_marks} / ${s.total_marks}</p>
                    <p><b>Percentage:</b> ${per}%</p>
                    <p><b>Result:</b> <span style="color:#27ae60; font-weight:bold;">${divText}</span></p>
                    <small style="color:#7f8c8d;">Exam Date: ${s.exam_date || 'N/A'}</small>
                </div>`;
        } else {
            display.innerHTML = "<p style='color:red;'>Result not found or not yet uploaded.</p>";
        }
    } catch (err) {
        display.innerHTML = "<p style='color:red;'>Error fetching result.</p>";
    }
}

// --- 4. ADMIN: TEACHER & STUDENT REGISTRATION ---
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

// --- 5. ADMIN: DATA LOADING (Teachers & Students) ---
async function loadTeacherData() {
    const res = await fetch('/api/get-teachers');
    const teachers = await res.json();
    const container = document.getElementById("teacherTableBody");
    if(!container) return;
    container.innerHTML = "";

    teachers.forEach(t => {
        container.innerHTML += `
            <div class="teacher-card" style="background:white; padding:10px; margin-bottom:10px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                <b>${t.teacher_name}</b> (ID: ${t.teacher_id})<br>
                Salary: ₹${t.salary} | Mob: ${t.mobile}
            </div>`;
    });
}

async function loadStudentData() {
    const res = await fetch('/api/get-students');
    const students = await res.json();
    const container = document.getElementById("studentTableBody");
    if(!container) return;
    container.innerHTML = "";

    students.forEach(s => {
        container.innerHTML += `
            <div class="diary-card" style="background:white; padding:10px; margin-bottom:10px; border-radius:10px;">
                <b>${s.student_name}</b> - Class ${s.student_class}<br>
                Fees: ₹${s.fees}/mo | ID: ${s.student_id}
            </div>`;
    });
}

// --- 6. ADMIN: FORM SUBMISSIONS ---
const handleForm = async (e, url, msg) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Handle specific fields (logo/photo)
    const fileInput = e.target.querySelector('input[type="file"]');
    if(fileInput && fileInput.files[0]) data[fileInput.name] = await toBase64(fileInput.files[0]);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert(msg); e.target.reset(); loadSettings(); }
};

if(document.getElementById('adminForm')) document.getElementById('adminForm').onsubmit = (e) => handleForm(e, '/api/update-settings', "Settings Saved!");
if(document.getElementById('teacherForm')) document.getElementById('teacherForm').onsubmit = (e) => handleForm(e, '/api/teacher-reg', "Teacher Registered!");
if(document.getElementById('studentForm')) document.getElementById('studentForm').onsubmit = (e) => handleForm(e, '/api/student-reg', "Student Registered!");

// Initialize Dashboard if function exists
if(typeof initDashboard === 'function') initDashboard();
