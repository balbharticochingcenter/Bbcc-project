// ================= GLOBAL VARIABLES & CONSTANTS =================
const API = location.origin; // Base API URL
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
let bannerBase64 = "";
let allSMSStudents = [];
let classData = { subjects: {} };
let feeMap = {};
let ALL_SUBJECTS = [];
let classDB = {};
let currentClass = "";
let currentStudentId = "";
let selectedClass = "";
let stream = null;
let capturedPhoto = null;
let currentCamera = 'user';
let tempSliderBase64 = "";

// DOM Elements
const dash_class = document.getElementById("dash_class");
const dash_year = document.getElementById("dash_year");
const dashTotal = document.getElementById("dashTotal");
const dashboardBody = document.getElementById("dashboardBody");
const feesExcelModal = document.getElementById("feesExcelModal");
const feesStudentInfo = document.getElementById("feesStudentInfo");
const feesExcelBody = document.getElementById("feesExcelBody");
const studentEditModal = document.getElementById("studentEditModal");
const classCards = document.getElementById("classCards");

// ================= SECURITY & AUTHENTICATION =================
(function checkAuth(){
    // ✅ Check if user is on admin page and logged in
    if (!location.pathname.startsWith('/admin')) return;

    if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
        location.replace('login.html');
    }
})();

/**
 * Logout Admin User
 */
function logoutAdmin(){
    if(confirm("Are you sure you want to logout?")){
        localStorage.removeItem('isAdminLoggedIn');
        location.href='login.html';
    }
}

// ================= INITIALIZATION =================
/**
 * Initialize Dashboard
 */
async function initDashboard(){
    try {
        await loadSystemSettings();
        await loadClassList();
        await loadPendingRegistrations();
        await loadStats();
        
        const btn = document.getElementById("openStudentDashboardBtn");
        if(btn) btn.style.display = "block";
        
        // Load all classes for dropdowns
        await fetch('/api/get-all-classes')
            .then(r => r.json())
            .then(CLASSES => {
                window.ALL_CLASSES = CLASSES;
                loadClasses();
            });
            
        await fetch('/api/get-all-subjects')
            .then(r => r.json())
            .then(subs => ALL_SUBJECTS = subs);
            
    } catch (error) {
        console.error("Initialization error:", error);
        showNotification("Error loading dashboard", "error");
    }
}

/**
 * Load System Statistics
 */
async function loadStats() {
    try {
        const [studentsRes, teachersRes] = await Promise.all([
            fetch(API + '/api/get-students'),
            fetch(API + '/api/get-teachers')
        ]);
        
        const students = await studentsRes.json();
        const teachers = await teachersRes.json();
        
        // Update stats
        document.getElementById('totalStudents').textContent = students.length;
        document.getElementById('totalTeachers').textContent = teachers.length;
        
        // Calculate total fees
        let totalFees = 0;
        students.forEach(s => {
            const fees = parseFloat(s.fees) || 0;
            totalFees += fees;
        });
        document.getElementById('totalFees').textContent = '₹' + totalFees;
        
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// ================= SYSTEM SETTINGS =================
/**
 * Load System Settings from Database
 */
async function loadSystemSettings(){
    try{
        const res = await fetch(API + '/api/get-settings');
        const s = await res.json();

        // Update header elements
        const db_logo = document.getElementById("db-logo");
        const db_title = document.getElementById("db-title");
        const db_subtitle = document.getElementById("db-subtitle");

        // Update footer elements
        const foot_facebook = document.getElementById("foot-facebook");
        const foot_gmail = document.getElementById("foot-gmail");
        const foot_call = document.getElementById("foot-call");
        const foot_help = document.getElementById("foot-help");

        if(s.logo && db_logo) db_logo.src = s.logo;
        if(s.title && db_title) db_title.innerText = s.title;
        if(s.sub_title && db_subtitle) db_subtitle.innerText = s.sub_title;

        if(s.facebook && foot_facebook) foot_facebook.href = s.facebook;
        if(s.gmail && foot_gmail) foot_gmail.href = "mailto:" + s.gmail;
        if(s.call_no && foot_call) foot_call.href = "tel:" + s.call_no;
        if(s.help && foot_help) foot_help.innerText = s.help;

    } catch(e) {
        console.error("Settings load error:", e);
        showNotification("Error loading settings", "error");
    }
}

// ================= ADMIN PROFILE MANAGEMENT =================
/**
 * Open Admin Profile Modal
 */
async function openAdminProfile() {
    try {
        document.getElementById('adminProfileModal').style.display = 'block';
        const res = await fetch('/api/get-admin-profile');
        const admin = await res.json();
        
        if (admin && admin.admin_userid) {
            document.getElementById('admin_userid').value = admin.admin_userid || '';
            document.getElementById('admin_name').value = admin.admin_name || '';
            document.getElementById('admin_mobile').value = admin.admin_mobile || '';
            document.getElementById('admin_pass').value = admin.admin_pass || '';
        }
    } catch (err) {
        console.error("Profile load error:", err);
        showNotification("Error loading profile", "error");
    }
}

/**
 * Handle Admin Photo Upload and Compression
 */
function handleAdminPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Resize to thumbnail
                canvas.width = 120;
                canvas.height = 120;
                ctx.drawImage(img, 0, 0, 120, 120);
                
                // Compress to 5KB
                let dataUrl = canvas.toDataURL('image/jpeg', 0.1);
                
                // Update preview images
                document.getElementById('admin_preview_img').src = dataUrl;
                document.getElementById('header_admin_photo').src = dataUrl;
                
                showNotification("Photo compressed successfully", "success");
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Update Admin Profile in Database
 */
async function updateAdminProfile() {
    const adminData = {
        admin_userid: document.getElementById('admin_userid').value,
        admin_name: document.getElementById('admin_name').value,
        admin_mobile: document.getElementById('admin_mobile').value,
        admin_pass: document.getElementById('admin_pass').value
    };

    try {
        const res = await fetch('/api/update-admin-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });

        const result = await res.json();
        if (result.success) {
            showNotification("Admin profile updated successfully!", "success");
            closeModal('adminProfileModal');
        } else {
            throw new Error("Update failed");
        }
    } catch (err) {
        console.error("Server Error:", err);
        showNotification("Error updating profile", "error");
    }
}

// ================= CLASS MANAGEMENT =================
/**
 * Load Class List for Dropdowns
 */
async function loadClassList(){
    const res = await fetch(API + '/api/get-all-class-configs');
    const data = await res.json();
    window.classList = Object.keys(data);
}

/**
 * Load Class Cards
 */
function loadClasses(){
    if(!window.ALL_CLASSES) return;
    classCards.innerHTML = "";

    ALL_CLASSES.forEach(cls => {
        const banner = classDB[cls]?.banner || "";
        classCards.innerHTML += `
            <div class="class-card">
                ${banner ? `<img src="${banner}" alt="${cls} Banner">` : 
                  `<div style="height:120px;background:var(--gradient-primary);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-book fa-2x"></i>
                  </div>`}
                <b>${cls}</b>
                <input value="${feeMap[cls]||""}"
                      placeholder="Fees"
                      onblur="saveFees('${cls}',this.value)">
                <button onclick="openClassModal('${cls}')">
                    <i class="fas fa-cog"></i> Manage
                </button>
            </div>`;
    });
}

/**
 * Open Class Management Modal
 */
function openClassModal(cls){
    selectedClass = cls;
    currentClass = cls;

    classData = classDB[cls] || {};
    if(!classData.subjects) classData.subjects = {};

    document.getElementById("modalTitle").innerText = `${cls} - Class Management`;
    document.getElementById("introVideo").value = classData.intro_video || "";
    document.getElementById("feesInput").value = feeMap[cls] || "";

    // Banner Preview
    bannerBase64 = classData.banner || "";
    const preview = document.getElementById("bannerPreview");
    if (bannerBase64) {
        preview.src = bannerBase64;
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }

    // Load Subjects
    document.getElementById("subjectList").innerHTML = "";
    ALL_SUBJECTS.forEach(sub => drawSubject(sub));

    document.getElementById("classModal").style.display = "block";
}

/**
 * Save Class Configuration
 */
function saveAll() {
    const data = {
        class_name: currentClass,
        banner: bannerBase64,
        intro_video: document.getElementById("introVideo").value,
        fees: document.getElementById("feesInput").value,
        subjects: classData.subjects
    };

    fetch('/api/save-class-config', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(() => {
        showNotification("Class saved successfully!", "success");
        closeModal();
    })
    .catch(err => {
        console.error("Save error:", err);
        showNotification("Error saving class", "error");
    });
}

/**
 * Handle Banner Upload
 */
function handleBannerUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 180;
            canvas.getContext("2d").drawImage(img, 0, 0, 400, 180);
            bannerBase64 = canvas.toDataURL("image/jpeg", 0.3);

            const preview = document.getElementById("bannerPreview");
            preview.src = bannerBase64;
            preview.style.display = "block";
            
            showNotification("Banner uploaded successfully", "success");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Draw Subject UI
 */
function drawSubject(sub){
    const sid = safeId(sub);
    const checked = !!classData.subjects[sub];

    const div = document.createElement("div");
    div.innerHTML = `
        <div class="subject-item">
            <label class="subject-checkbox">
                <input type="checkbox" ${checked?"checked":""}
                    onchange="toggleSubject('${sub}',this.checked)">
                <span>${sub}</span>
            </label>
            <div id="box-${sid}" class="subject-details"></div>
        </div>
    `;

    document.getElementById("subjectList").appendChild(div);

    if (checked) renderSubjectBox(sub);
}

/**
 * Toggle Subject Selection
 */
function toggleSubject(sub, on){
    if(on){
        if(!classData.subjects[sub])
            classData.subjects[sub] = {notes:[], videos:[]};
        renderSubjectBox(sub);
    } else {
        delete classData.subjects[sub];
        document.getElementById(`box-${safeId(sub)}`).innerHTML = "";
    }
}

/**
 * Render Subject Details Box
 */
function renderSubjectBox(sub){
    const sid = safeId(sub);
    const box = document.getElementById(`box-${sid}`);
    const notes = classData.subjects[sub]?.notes || [];
    const videos = classData.subjects[sub]?.videos || [];

    box.innerHTML = `
        <div class="subject-content">
            <h4>${sub} Resources</h4>
            
            <div class="notes-section">
                <h5><i class="fas fa-file-pdf"></i> Notes (${notes.length})</h5>
                <div id="n-${sid}" class="notes-list">
                    ${notes.map((n,i)=>`
                        <div class="note-item">
                            <i class="fas fa-file-pdf"></i>
                            <span>Note ${i+1}</span>
                            <a href="${n}" target="_blank" class="btn-view">
                                <i class="fas fa-eye"></i> View
                            </a>
                            <button class="btn-remove" onclick="removeNote('${sub}',${i})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join("")}
                </div>
                <button class="btn-add" onclick="addNote('${sub}')">
                    <i class="fas fa-plus"></i> Add Note
                </button>
            </div>

            <div class="videos-section">
                <h5><i class="fas fa-video"></i> Videos (${videos.length})</h5>
                <div id="v-${sid}" class="videos-list">
                    ${videos.map((v,i)=>`
                        <div class="video-item">
                            <i class="fab fa-youtube"></i>
                            <a href="${v}" target="_blank">${v.substring(0, 40)}...</a>
                            <button class="btn-remove" onclick="removeVideo('${sub}',${i})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join("")}
                </div>
                <button class="btn-add" onclick="addVideo('${sub}')">
                    <i class="fas fa-plus"></i> Add Video
                </button>
            </div>
        </div>
    `;
}

/**
 * Add Note to Subject
 */
function addNote(sub){
    const sid = safeId(sub);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";
    input.style.display = "none";
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                classData.subjects[sub].notes.push(reader.result);
                renderSubjectBox(sub);
                showNotification("Note added successfully", "success");
            };
            reader.readAsDataURL(file);
        }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

/**
 * Add Video to Subject
 */
function addVideo(sub){
    const sid = safeId(sub);
    const url = prompt("Enter YouTube video URL:");
    if (url && url.includes("youtube.com") || url.includes("youtu.be")) {
        classData.subjects[sub].videos.push(url);
        renderSubjectBox(sub);
        showNotification("Video added successfully", "success");
    } else if (url) {
        showNotification("Please enter a valid YouTube URL", "error");
    }
}

/**
 * Remove Note from Subject
 */
function removeNote(sub, index){
    if(confirm("Are you sure you want to remove this note?")){
        classData.subjects[sub].notes.splice(index, 1);
        renderSubjectBox(sub);
        showNotification("Note removed", "info");
    }
}

/**
 * Remove Video from Subject
 */
function removeVideo(sub, index){
    if(confirm("Are you sure you want to remove this video?")){
        classData.subjects[sub].videos.splice(index, 1);
        renderSubjectBox(sub);
        showNotification("Video removed", "info");
    }
}

/**
 * Save Class Fees
 */
function saveFees(cls, val){
    fetch('/api/update-class-fees', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({class_name: cls, monthly_fees: val})
    })
    .then(() => showNotification("Fees updated", "success"))
    .catch(err => {
        console.error("Fees save error:", err);
        showNotification("Error saving fees", "error");
    });
}

// ================= STUDENT DASHBOARD =================
/**
 * Open Student Dashboard Modal
 */
function openStudentDashboard() {
    document.getElementById("studentDashboardModal").style.display = "block";
    prepareDashboardFilters();
}

/**
 * Prepare Dashboard Filters
 */
function prepareDashboardFilters(){
    dash_class.innerHTML = '<option value="">Select Class</option>';
    if (window.classList) {
        classList.forEach(c => dash_class.innerHTML += `<option>${c}</option>`);
    }

    dash_year.innerHTML = '<option value="">Select Year</option>';
    const currentYear = new Date().getFullYear();
    for(let y = currentYear; y >= 2018; y--) {
        dash_year.innerHTML += `<option>${y}</option>`;
    }
}

/**
 * Load Dashboard Students
 */
async function loadDashboardStudents(){
    if(!dash_class.value || !dash_year.value) {
        showNotification("Please select class and year", "warning");
        return;
    }

    try {
        const response = await fetch(API + '/api/get-students');
        const students = await response.json();

        const filteredStudents = students.filter(s =>
            s.student_class === dash_class.value &&
            new Date(s.joining_date).getFullYear() == dash_year.value
        );

        dashTotal.innerText = filteredStudents.length;
        dashboardBody.innerHTML = "";

        if (filteredStudents.length === 0) {
            dashboardBody.innerHTML = `
                <tr>
                    <td colspan="13" class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <p>No students found for selected filters</p>
                    </td>
                </tr>`;
            return;
        }

        filteredStudents.forEach(s => {
            dashboardBody.innerHTML += `
                <tr>
                    <td>
                        <img src="${s.photo || DEFAULT_AVATAR}" 
                             width="40" 
                             onerror="handleImgError(this)" 
                             onclick="openFeesExcelPopup('${s.student_id}')"
                             class="student-photo">
                    </td>
                    <td><strong>${s.student_id}</strong></td>
                    <td><input value="${s.student_name||''}" class="form-input"></td>
                    <td>
                        <div class="password-input">
                            <input type="password" value="${s.pass||''}" class="form-input">
                            <button class="toggle-password" onclick="togglePassword(this)">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                    <td>${s.student_class}</td>
                    <td><input type="date" value="${s.joining_date||''}" class="form-input"></td>
                    <td><input value="${s.fees||''}" class="form-input fees-input"></td>
                    <td>
                        <input type="date" value="${s.exam_date||''}" class="form-input">
                        <button class="btn-clear" onclick="this.previousElementSibling.value=''">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                    <td><input value="${s.total_marks||''}" class="form-input marks-input"></td>
                    <td><input value="${s.obtained_marks||''}" class="form-input marks-input"></td>
                    <td class="division-cell">${calculateDivision(s.obtained_marks, s.total_marks)}</td>
                    <td>
                        <button class="btn-save" onclick="saveDashStudent('${s.student_id}',this)">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </td>
                    <td>
                        <button class="btn-delete" onclick="deleteDashStudent('${s.student_id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error loading students:", error);
        showNotification("Error loading students", "error");
    }
}

/**
 * Save Student Data from Dashboard
 */
async function saveDashStudent(id, btn){
    const row = btn.closest('tr');
    const inputs = row.querySelectorAll('.form-input');
    
    const studentData = {
        student_id: id,
        student_name: inputs[0].value,
        pass: inputs[1].value,
        joining_date: inputs[2].value,
        fees: inputs[3].value,
        exam_date: inputs[4].value,
        total_marks: inputs[5].value,
        obtained_marks: inputs[6].value
    };

    try {
        const response = await fetch(API + '/api/update-student-data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            showNotification("Student data saved successfully!", "success");
            // Update division cell
            const division = calculateDivision(studentData.obtained_marks, studentData.total_marks);
            row.querySelector('.division-cell').textContent = division;
        } else {
            throw new Error('Failed to update student');
        }
    } catch (error) {
        console.error('Save error:', error);
        showNotification("Error saving student data", "error");
    }
}

/**
 * Delete Student
 */
async function deleteDashStudent(id){
    if(!confirm("Are you sure you want to delete this student?")) return;
    
    try {
        const response = await fetch(API + '/api/delete-student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: id })
        });

        if (response.ok) {
            showNotification("Student deleted successfully!", "success");
            loadDashboardStudents();
        } else {
            throw new Error('Failed to delete student');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification("Error deleting student", "error");
    }
}

// ================= FEES MANAGEMENT =================
/**
 * Open Fees Popup for Student
 */
async function openFeesExcelPopup(id){
    currentFeesStudent = id;
    document.getElementById("feesExcelModal").style.display = "block";

    try {
        const response = await fetch(API + '/api/get-students');
        const students = await response.json();
        const student = students.find(x => x.student_id === id);

        if (!student) {
            showNotification("Student not found", "error");
            return;
        }

        feesStudentInfo.innerHTML = `
            <div class="student-info">
                <img src="${student.photo || DEFAULT_AVATAR}" 
                     class="student-photo-large"
                     onerror="handleImgError(this)"
                     onclick="openStudentEditPopup('${id}')">
                <div class="student-details">
                    <h3>${student.student_name}</h3>
                    <p><strong>ID:</strong> ${student.student_id}</p>
                    <p><strong>Class:</strong> ${student.student_class}</p>
                    <p><strong>Student Mobile:</strong> ${student.mobile || 'N/A'}</p>
                    <p><strong>Parent:</strong> ${student.parent_name || 'N/A'}</p>
                    <p><strong>Parent Mobile:</strong> ${student.parent_mobile || 'N/A'}</p>
                </div>
            </div>
        `;

        prepareFeesFilters();
        loadFeesExcel();
    } catch (error) {
        console.error("Error opening fees popup:", error);
        showNotification("Error loading student information", "error");
    }
}

/**
 * Prepare Fees Filters
 */
function prepareFeesFilters(){
    // Year filter
    fees_year.innerHTML = '<option value="">Select Year</option>';
    const currentYear = new Date().getFullYear();
    for(let y = currentYear; y >= 2018; y--){
        fees_year.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // Month filter
    fees_month.innerHTML = '<option value="">Select Month</option>';
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    months.forEach((m, i) => {
        fees_month.innerHTML += `<option value="${i+1}">${m}</option>`;
    });
}

/**
 * Load Fees Excel Data
 */
async function loadFeesExcel(){
    try {
        const response = await fetch(API + '/api/get-students');
        const students = await response.json();
        const student = students.find(x => x.student_id === currentFeesStudent);

        if (!student) return;

        feesExcelBody.innerHTML = "";
        let totalPaid = 0, totalDue = 0;

        const joinDate = new Date(student.joining_date);
        const now = new Date();

        let year = joinDate.getFullYear();
        let month = joinDate.getMonth();

        while(new Date(year, month) <= now){
            const key = `${year}-${String(month + 1).padStart(2, '0')}`;
            const rowData = student.fees_data?.[key] || {};
            const fees = Number(rowData.fees ?? student.fees ?? 0);
            const paid = Number(rowData.paid ?? 0);
            const due = fees - paid;

            totalPaid += paid;
            totalDue += due;

            const statusClass = paid >= fees ? 'status-paid' : 'status-due';
            const statusText = paid >= fees ? 'Paid' : 'Due';

            feesExcelBody.innerHTML += `
                <tr data-key="${key}">
                    <td>${new Date(year, month).toLocaleString('default', {month: 'long'})} ${year}</td>
                    <td>
                        <input type="number" value="${fees}" 
                               class="fees-input"
                               onchange="updateFeesField('${key}', 'fees', this.value)">
                    </td>
                    <td>
                        <input type="number" value="${paid}" 
                               class="paid-input"
                               onchange="updateFeesField('${key}', 'paid', this.value)">
                    </td>
                    <td><span class="due-amount">${due}</span></td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn-save" onclick="saveFeesRow(this)">
                            <i class="fas fa-save"></i>
                        </button>
                    </td>
                </tr>`;

            month++;
            if(month > 11){
                month = 0;
                year++;
            }
        }

        document.getElementById("totalPaid").innerText = totalPaid;
        document.getElementById("totalDue").innerText = totalDue;
    } catch (error) {
        console.error("Error loading fees:", error);
        showNotification("Error loading fees data", "error");
    }
}

/**
 * Update Fees Field
 */
async function updateFeesField(month, field, value) {
    try {
        await fetch(API + '/api/update-student-fees', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                student_id: currentFeesStudent,
                month: month,
                field: field,
                value: value
            })
        });
    } catch (error) {
        console.error("Error updating fees:", error);
        showNotification("Error updating fees", "error");
    }
}

/**
 * Save Fees Row
 */
async function saveFeesRow(btn) {
    const row = btn.closest('tr');
    const key = row.dataset.key;
    const inputs = row.querySelectorAll('input');
    const feesVal = inputs[0].value;
    const paidVal = inputs[1].value;

    try {
        await Promise.all([
            updateFeesField(key, 'fees', feesVal),
            updateFeesField(key, 'paid', paidVal)
        ]);
        
        showNotification("Fees data saved successfully!", "success");
        loadFeesExcel();
    } catch (error) {
        console.error("Error saving fees row:", error);
        showNotification("Error saving fees data", "error");
    }
}

// ================= STUDENT EDIT PROFILE =================
/**
 * Open Student Edit Popup
 */
async function openStudentEditPopup(id) {
    try {
        const response = await fetch(API + '/api/get-students');
        const students = await response.json();
        const student = students.find(x => x.student_id === id);

        if(!student) {
            showNotification("Student not found", "error");
            return;
        }

        document.getElementById("edit_id").value = student.student_id;
        document.getElementById("edit_name").value = student.student_name || "";
        document.getElementById("edit_class").value = student.student_class || "";
        document.getElementById("edit_parent").value = student.parent_name || "";
        document.getElementById("edit_mobile").value = student.mobile || "";
        document.getElementById("edit_parent_mobile").value = student.parent_mobile || "";
        document.getElementById("edit_photo_preview").src = student.photo || DEFAULT_AVATAR;

        document.getElementById("studentEditModal").style.display = "block";
    } catch (error) {
        console.error("Error opening edit popup:", error);
        showNotification("Error loading student data", "error");
    }
}

/**
 * Update Student Profile
 */
async function updateStudentProfile() {
    const studentData = {
        student_id: document.getElementById("edit_id").value,
        student_name: document.getElementById("edit_name").value,
        student_class: document.getElementById("edit_class").value,
        parent_name: document.getElementById("edit_parent").value,
        mobile: document.getElementById("edit_mobile").value,
        parent_mobile: document.getElementById("edit_parent_mobile").value
    };

    const file = document.getElementById("edit_photo_file").files[0];
    
    const sendData = async (finalData) => {
        try {
            const response = await fetch(API + '/api/update-student-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            });

            if (response.ok) {
                showNotification("Student profile updated successfully!", "success");
                closeModal('studentEditModal');
                loadDashboardStudents();
            } else {
                throw new Error('Failed to update student');
            }
        } catch (error) {
            console.error('Update error:', error);
            showNotification("Error updating student profile", "error");
        }
    };

    if (file) {
        compressImage(file, (base64) => {
            studentData.photo = base64;
            sendData(studentData);
        });
    } else {
        sendData(studentData);
    }
}

// ================= EXAM MANAGEMENT =================
/**
 * Open Exam Management Modal
 */
function openClassExamModal() {
    document.getElementById("classExamModal").style.display = "block";
    const clsSelect = document.getElementById("exam_dash_class");
    const yrSelect = document.getElementById("exam_dash_year");

    clsSelect.innerHTML = '<option value="">Select Class</option>';
    if (window.classList) {
        classList.forEach(c => clsSelect.innerHTML += `<option>${c}</option>`);
    }

    yrSelect.innerHTML = '<option value="">Select Year</option>';
    const currentYear = new Date().getFullYear();
    for(let y = currentYear; y >= 2018; y--) {
        yrSelect.innerHTML += `<option>${y}</option>`;
    }
}

/**
 * Load Exam Students
 */
async function loadExamStudents() {
    const cls = document.getElementById("exam_dash_class").value;
    const yr = document.getElementById("exam_dash_year").value;
    
    if (!cls || !yr) {
        showNotification("Please select class and year", "warning");
        return;
    }

    try {
        const response = await fetch(API + '/api/get-students');
        let students = await response.json();

        // Filter students
        students = students.filter(s => 
            s.student_class === cls && 
            new Date(s.joining_date).getFullYear() == yr
        );

        const body = document.getElementById("examDashboardBody");
        body.innerHTML = "";

        if (students.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-user-graduate"></i>
                        <p>No students found for selected filters</p>
                    </td>
                </tr>`;
            return;
        }

        students.forEach(s => {
            body.innerHTML += `
                <tr data-id="${s.student_id}">
                    <td>
                        <img src="${s.photo || DEFAULT_AVATAR}" 
                             width="40" 
                             onerror="handleImgError(this)"
                             class="student-photo">
                    </td>
                    <td>
                        <strong>${s.student_name}</strong><br>
                        <small>${s.student_id}</small>
                    </td>
                    <td>
                        <input type="date" 
                               class="form-control exam-date" 
                               value="${s.exam_date || ''}">
                    </td>
                    <td>
                        <input type="text" 
                               class="form-control exam-subject" 
                               value="${s.exam_subject || ''}" 
                               placeholder="Subject">
                    </td>
                    <td>
                        <input type="number" 
                               class="form-control exam-total" 
                               value="${s.total_marks || ''}">
                    </td>
                    <td>
                        <input type="number" 
                               class="form-control exam-obtained" 
                               value="${s.obtained_marks || ''}"
                               oninput="updateRowDivision(this)">
                    </td>
                    <td class="exam-division">${calculateDivision(s.obtained_marks, s.total_marks)}</td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error loading exam students:", error);
        showNotification("Error loading exam data", "error");
    }
}

/**
 * Apply Bulk Settings to All Students
 */
function applyBulkSettings() {
    const subject = document.getElementById("bulk_subject").value;
    const total = document.getElementById("bulk_total_marks").value;
    const date = document.getElementById("bulk_exam_date").value;

    document.querySelectorAll("#examDashboardBody tr").forEach(row => {
        if (subject) row.querySelector(".exam-subject").value = subject;
        if (total) row.querySelector(".exam-total").value = total;
        if (date) row.querySelector(".exam-date").value = date;
    });
    
    showNotification("Bulk settings applied", "success");
}

/**
 * Update Row Division
 */
function updateRowDivision(input) {
    const row = input.closest('tr');
    const obtained = input.value;
    const total = row.querySelector(".exam-total").value;
    row.querySelector(".exam-division").innerText = calculateDivision(obtained, total);
}

/**
 * Save All Results
 */
async function saveAllResults() {
    if(!confirm("Are you sure you want to publish all results?")) return;
    
    const rows = document.querySelectorAll("#examDashboardBody tr");
    const updatePromises = [];

    rows.forEach(row => {
        const data = {
            student_id: row.dataset.id,
            exam_date: row.querySelector(".exam-date").value,
            total_marks: row.querySelector(".exam-total").value,
            obtained_marks: row.querySelector(".exam-obtained").value,
            exam_subject: row.querySelector(".exam-subject").value
        };
        
        const promise = fetch(API + '/api/update-student-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        updatePromises.push(promise);
    });

    try {
        await Promise.all(updatePromises);
        showNotification("Results published successfully!", "success");
        loadExamStudents();
    } catch (error) {
        console.error("Error saving results:", error);
        showNotification("Error publishing results", "error");
    }
}

/**
 * Cancel All Exams
 */
async function cancelAllExams() {
    if(!confirm("Are you sure you want to clear all exam data?")) return;

    const rows = document.querySelectorAll("#examDashboardBody tr");
    const clearPromises = [];

    rows.forEach(row => {
        const data = {
            student_id: row.dataset.id,
            exam_date: "",
            total_marks: "",
            obtained_marks: "",
            exam_subject: ""
        };
        
        const promise = fetch(API + '/api/update-student-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        clearPromises.push(promise);
    });

    try {
        await Promise.all(clearPromises);
        showNotification("Exam data cleared successfully!", "success");
        loadExamStudents();
    } catch (error) {
        console.error("Error clearing exams:", error);
        showNotification("Error clearing exam data", "error");
    }
}

// ================= SYSTEM CONFIGURATION =================
/**
 * Open System Configuration Modal
 */
async function openSystemConfig() {
    document.getElementById('systemConfigModal').style.display = 'block';
    try {
        const res = await fetch('/api/get-settings');
        const data = await res.json();
        
        if (data) {
            document.getElementById('cfg_title').value = data.title || "";
            document.getElementById('cfg_subtitle').value = data.sub_title || "";
            document.getElementById('cfg_contact').value = data.contact || "";
            document.getElementById('cfg_call_no').value = data.call_no || "";
            document.getElementById('cfg_gmail').value = data.gmail || "";
            document.getElementById('cfg_facebook').value = data.facebook || "";
            document.getElementById('cfg_youtube').value = data.youtube_link || "";
            document.getElementById('cfg_insta').value = data.instagram || "";
        }
    } catch (err) {
        console.error("System config load error:", err);
        showNotification("Error loading system configuration", "error");
    }
}

/**
 * Save System Configuration
 */
async function saveSystemConfig() {
    const config = {
        title: document.getElementById('cfg_title').value,
        sub_title: document.getElementById('cfg_subtitle').value,
        contact: document.getElementById('cfg_contact').value,
        call_no: document.getElementById('cfg_call_no').value,
        gmail: document.getElementById('cfg_gmail').value,
        facebook: document.getElementById('cfg_facebook').value,
        youtube_link: document.getElementById('cfg_youtube').value,
        instagram: document.getElementById('cfg_insta').value
    };

    try {
        const res = await fetch(API + '/api/update-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        const result = await res.json();
        
        if(result.success) {
            showNotification("System settings updated successfully!", "success");
            closeModal('systemConfigModal');
            loadSystemSettings();
        } else {
            throw new Error(result.error || "Update failed");
        }
    } catch (err) {
        console.error("Save config error:", err);
        showNotification("Error saving system configuration", "error");
    }
}

// ================= SLIDER MANAGEMENT =================
/**
 * Open Slider Manager
 */
async function openSliderManager() {
    document.getElementById('sliderModal').style.display = 'block';
    loadSliders();
}

/**
 * Preview and Crop Slider Image
 */
function previewAndCropSlider(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById('cropCanvas');
                const ctx = canvas.getContext('2d');
                
                // Center crop to 200x200
                const size = Math.min(img.width, img.height);
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
                
                // Compress to 5KB
                tempSliderBase64 = canvas.toDataURL('image/jpeg', 0.2);
                document.getElementById('slider_crop_preview').src = tempSliderBase64;
                document.getElementById('sliderPreviewContainer').style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Upload Slider Image
 */
async function uploadSlider() {
    if(!tempSliderBase64) {
        showNotification("Please select an image first", "warning");
        return;
    }

    try {
        const res = await fetch('/api/add-slider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: tempSliderBase64 })
        });
        
        const data = await res.json();
        if(data.success) {
            showNotification("Slider image added successfully!", "success");
            loadSliders();
            document.getElementById('sliderPreviewContainer').style.display = 'none';
            tempSliderBase64 = "";
        } else {
            throw new Error("Upload failed");
        }
    } catch (error) {
        console.error("Slider upload error:", error);
        showNotification("Error uploading slider image", "error");
    }
}

/**
 * Load Sliders
 */
async function loadSliders() {
    try {
        const res = await fetch('/api/get-sliders');
        const sliders = await res.json();
        const container = document.getElementById('existingSliders');
        
        if (sliders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>No sliders uploaded yet</p>
                </div>`;
            return;
        }

        container.innerHTML = sliders.map(s => `
            <div class="slider-item">
                <img src="${s.photo}" class="slider-image">
                <div class="slider-overlay">
                    <button class="btn-delete-slider" onclick="deleteSlider('${s._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <span class="slider-date">${new Date(s.upload_date).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error loading sliders:", error);
        showNotification("Error loading sliders", "error");
    }
}

/**
 * Delete Slider
 */
async function deleteSlider(id) {
    if(!confirm("Are you sure you want to delete this slider?")) return;
    
    try {
        const res = await fetch(`/api/delete-slider/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if(data.success) {
            showNotification("Slider deleted successfully!", "success");
            loadSliders();
        } else {
            throw new Error("Delete failed");
        }
    } catch (error) {
        console.error("Slider delete error:", error);
        showNotification("Error deleting slider", "error");
    }
}

// ================= PENDING REGISTRATIONS =================
/**
 * Load Pending Registrations
 */
async function loadPendingRegistrations() {
    try {
        const res = await fetch('/api/get-students');
        const students = await res.json();

        const box = document.getElementById('pendingList');
        box.innerHTML = '';

        const pending = students.filter(s => !s.fees || s.fees === "" || s.fees === "0");

        if (pending.length === 0) {
            box.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No pending registrations</p>
                </div>`;
            document.getElementById('pendingReg').textContent = "0";
            return;
        }

        document.getElementById('pendingReg').textContent = pending.length;
        
        pending.forEach(s => {
            box.innerHTML += `
                <div class="pending-card">
                    <img src="${s.photo || DEFAULT_AVATAR}" 
                         class="pending-photo"
                         onerror="handleImgError(this)">
                    
                    <div class="pending-details">
                        <div class="form-group">
                            <label>Student Name</label>
                            <input id="student_name_${s.student_id}" 
                                   value="${s.student_name || ''}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Student ID</label>
                                <input value="${s.student_id}" disabled class="form-input">
                            </div>
                            <div class="form-group">
                                <label>Class</label>
                                <input id="class_${s.student_id}" 
                                       value="${s.student_class || ''}"
                                       class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Parent Name</label>
                            <input id="parent_name_${s.student_id}" 
                                   value="${s.parent_name || ''}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Student Mobile</label>
                                <input id="mobile_${s.student_id}" 
                                       value="${s.mobile || ''}"
                                       class="form-input">
                            </div>
                            <div class="form-group">
                                <label>Parent Mobile</label>
                                <input id="parent_mobile_${s.student_id}" 
                                       value="${s.parent_mobile || ''}"
                                       class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Date of Joining</label>
                            <input type="date" 
                                   id="doj_${s.student_id}" 
                                   value="${s.joining_date || ''}"
                                   class="form-input">
                        </div>
                    </div>

                    <div class="pending-actions">
                        <div class="form-group">
                            <label>Monthly Fees</label>
                            <input id="fees_${s.student_id}" 
                                   placeholder="Enter fees"
                                   class="form-input">
                        </div>
                        
                        <button onclick="approveStudent('${s.student_id}')"
                                class="btn-approve">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        
                        <button onclick="rejectStudent('${s.student_id}')"
                                class="btn-reject">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.error("Error loading pending registrations:", error);
        showNotification("Error loading pending registrations", "error");
    }
}

/**
 * Approve Student Registration
 */
async function approveStudent(id) {
    const fees = document.getElementById(`fees_${id}`).value;
    if (!fees) {
        showNotification("Please enter fees amount", "warning");
        return;
    }

    const studentData = {
        student_id: id,
        student_name: document.getElementById(`student_name_${id}`).value,
        pass: document.getElementById(`pass_${id}`).value || "123456",
        student_class: document.getElementById(`class_${id}`).value,
        parent_name: document.getElementById(`parent_name_${id}`).value,
        mobile: document.getElementById(`mobile_${id}`).value,
        parent_mobile: document.getElementById(`parent_mobile_${id}`).value,
        joining_date: document.getElementById(`doj_${id}`).value,
        fees: fees
    };

    try {
        const response = await fetch('/api/update-student-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            showNotification("Student approved successfully!", "success");
            loadPendingRegistrations();
        } else {
            throw new Error('Approval failed');
        }
    } catch (error) {
        console.error("Approve error:", error);
        showNotification("Error approving student", "error");
    }
}

/**
 * Reject Student Registration
 */
async function rejectStudent(id) {
    if (!confirm("Are you sure you want to reject this student? This action cannot be undone.")) return;

    try {
        const response = await fetch('/api/delete-student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: id })
        });

        if (response.ok) {
            showNotification("Student rejected successfully!", "success");
            loadPendingRegistrations();
        } else {
            throw new Error('Rejection failed');
        }
    } catch (error) {
        console.error("Reject error:", error);
        showNotification("Error rejecting student", "error");
    }
}

// ================= SMS REMINDER SYSTEM =================
/**
 * Open SMS Reminder Modal
 */
function openSMSReminderModal() {
    document.getElementById("smsReminderModal").style.display = "block";
    loadSMSReminderData();
}

/**
 * Load SMS Reminder Data
 */
async function loadSMSReminderData() {
    try {
        const response = await fetch(API + "/api/get-students");
        const students = await response.json();
        
        allSMSStudents = students;
        
        const filterSelect = document.getElementById("sms_class_filter");
        filterSelect.innerHTML = '<option value="all">📚 All Classes</option>';
        
        const uniqueClasses = [...new Set(students.map(s => s.student_class).filter(c => c))];
        uniqueClasses.sort().forEach(cls => {
            filterSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
        });
        
        filterSMSByClass();
    } catch (error) {
        console.error("Error loading SMS data:", error);
        showNotification("Error loading SMS reminder data", "error");
    }
}

/**
 * Filter SMS by Class
 */
function filterSMSByClass() {
    const selectedClass = document.getElementById("sms_class_filter").value;
    const body = document.getElementById("smsReminderBody");
    
    let filteredStudents = allSMSStudents;
    if (selectedClass !== "all") {
        filteredStudents = allSMSStudents.filter(s => s.student_class === selectedClass);
    }
    
    renderSMSBody(filteredStudents, body);
}

/**
 * Render SMS Body
 */
function renderSMSBody(students, bodyElement) {
    bodyElement.innerHTML = "";
    const today = new Date();

    if (students.length === 0) {
        bodyElement.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No pending fees found for selected class</p>
                </td>
            </tr>`;
        return;
    }

    students.forEach(s => {
        let dueList = [];
        let total = 0;

        let joinDate = new Date(s.joining_date);
        let year = joinDate.getFullYear();
        let month = joinDate.getMonth();

        while (new Date(year, month) <= today) {
            const key = `${year}-${String(month + 1).padStart(2, '0')}`;
            const fee = Number(s.fees_data?.[key]?.fees ?? s.fees);
            const paid = Number(s.fees_data?.[key]?.paid ?? 0);

            if (paid < fee) {
                let due = fee - paid;
                total += due;
                let label = new Date(year, month).toLocaleString('en-IN', 
                    { month: 'short', year: '2-digit' }).toUpperCase();
                dueList.push(`${label} : ₹${due}`);
            }
            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
        }

        if (dueList.length === 0) return;

        const message = `प्रिय अभिभावक/छात्र,

आपके निम्नलिखित फीस राशि लंबित है:
छात्र आईडी : ${s.student_id} | पासवर्ड : ${s.pass || 'N/A'}
${dueList.join('\n')}

कुल लंबित राशि : ₹${total}

कृपया लंबित फीस शीघ्र अदा करें।

संपर्क: 9971095964
वेबसाइट: https://balbharticoachingcenter.onrender.com

धन्यवाद,
बाल भारती कोचिंग सेंटर`;

        bodyElement.innerHTML += `
            <tr>
                <td>
                    <img src="${s.photo || DEFAULT_AVATAR}" 
                         class="student-photo"
                         onerror="handleImgError(this)">
                </td>
                <td><strong>${s.student_id}</strong></td>
                <td>${s.student_name}</td>
                <td>${s.student_class}</td>
                <td class="due-months">${dueList.join("<br>")}</td>
                <td class="total-due"><strong>₹${total}</strong></td>
                <td>${s.parent_mobile || 'N/A'}</td>
                <td>${s.mobile || 'N/A'}</td>
                <td>
                    <textarea class="sms-textarea" 
                              data-parent="${s.parent_mobile}" 
                              data-student="${s.mobile}">${message}</textarea>
                </td>
                <td class="sms-actions">
                    <div class="action-group">
                        <button class="btn-sms" onclick="sendSMS('${s.parent_mobile}', this)">
                            <i class="fas fa-sms"></i> Parent SMS
                        </button>
                        <button class="btn-whatsapp" onclick="sendWA('${s.parent_mobile}', this)">
                            <i class="fab fa-whatsapp"></i> Parent WA
                        </button>
                    </div>
                    <div class="action-group">
                        <button class="btn-sms" onclick="sendSMS('${s.mobile}', this)">
                            <i class="fas fa-sms"></i> Student SMS
                        </button>
                        <button class="btn-whatsapp" onclick="sendWA('${s.mobile}', this)">
                            <i class="fab fa-whatsapp"></i> Student WA
                        </button>
                    </div>
                </td>
            </tr>`;
    });
}

/**
 * Send SMS
 */
function sendSMS(num, el) {
    if (!num || num === 'N/A') {
        showNotification("Mobile number not available", "warning");
        return;
    }
    
    const message = el.closest("tr").querySelector(".sms-textarea").value;
    window.open(`sms:${num}?body=${encodeURIComponent(message)}`);
}

/**
 * Send WhatsApp Message
 */
function sendWA(num, el) {
    if (!num || num === 'N/A') {
        showNotification("Mobile number not available", "warning");
        return;
    }
    
    const message = el.closest("tr").querySelector(".sms-textarea").value;
    window.open(`https://wa.me/91${num}?text=${encodeURIComponent(message)}`);
}

/**
 * Send SMS to All Parents
 */
function sendToAllParents() {
    const textareas = document.querySelectorAll(".sms-textarea");
    if (textareas.length === 0) {
        showNotification("No students to send messages to", "warning");
        return;
    }
    
    textareas.forEach(ta => {
        const parentMobile = ta.dataset.parent;
        if (parentMobile && parentMobile !== 'N/A') {
            setTimeout(() => {
                window.open(`sms:${parentMobile}?body=${encodeURIComponent(ta.value)}`);
            }, 100);
        }
    });
    
    showNotification("Opening SMS for all parents", "info");
}

/**
 * Send SMS to All Students
 */
function sendToAllStudents() {
    const textareas = document.querySelectorAll(".sms-textarea");
    if (textareas.length === 0) {
        showNotification("No students to send messages to", "warning");
        return;
    }
    
    textareas.forEach(ta => {
        const studentMobile = ta.dataset.student;
        if (studentMobile && studentMobile !== 'N/A') {
            setTimeout(() => {
                window.open(`sms:${studentMobile}?body=${encodeURIComponent(ta.value)}`);
            }, 100);
        }
    });
    
    showNotification("Opening SMS for all students", "info");
}

/**
 * Print Reminder
 */
function printReminder() {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <html>
            <head>
                <title>Fee Reminder Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; color: #e74c3c; }
                </style>
            </head>
            <body>
                <h2>Fee Reminder Report</h2>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                ${document.getElementById("reminderTable").outerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ================= HELPER FUNCTIONS =================
/**
 * Calculate Division Based on Marks
 */
function calculateDivision(obtained, total) {
    if(!obtained || !total) return '-';
    const percentage = (obtained / total) * 100;
    if(percentage >= 60) return '1st';
    if(percentage >= 45) return '2nd';
    if(percentage >= 33) return '3rd';
    return 'Fail';
}

/**
 * Safe ID Generator
 */
function safeId(str) {
    return str.replace(/\s+/g, '_').toLowerCase();
}

/**
 * Compress Image Function
 */
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 150;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 150, 150);
            const compressedData = canvas.toDataURL('image/jpeg', 0.3);
            callback(compressedData);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Handle Image Error
 */
function handleImgError(img) {
    img.onerror = null;
    img.src = DEFAULT_AVATAR;
}

/**
 * Show Notification
 */
function showNotification(message, type = "info") {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease;
            }
            .notification.success { background: #00b894; }
            .notification.error { background: #e74c3c; }
            .notification.warning { background: #f39c12; }
            .notification.info { background: #3498db; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Toggle Password Visibility
 */
function togglePassword(button) {
    const input = button.previousElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

/**
 * Close Modal
 */
function closeModal(modalId) {
    if (modalId) {
        document.getElementById(modalId).style.display = 'none';
    } else {
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

/**
 * Download Student Excel
 */
function downloadStudentExcel() {
    const rows = document.querySelectorAll("#dashboardBody tr");
    if (rows.length === 0) {
        showNotification("No data to export", "warning");
        return;
    }

    let csv = "ID,Name,Pass,Class,Joining Date,Fees,Exam Date,Total,Obtained,Division\n";
    
    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        const inputs = row.querySelectorAll("input");
        
        const id = cols[1].innerText;
        const name = inputs[0]?.value || '';
        const pass = inputs[1]?.value || '';
        const cls = cols[4]?.innerText || '';
        const doj = inputs[2]?.value || '';
        const fees = inputs[3]?.value || '';
        const exam = inputs[4]?.value || '';
        const total = inputs[5]?.value || '';
        const obt = inputs[6]?.value || '';
        const div = cols[10]?.innerText || '';

        csv += `${id},${name},${pass},${cls},${doj},${fees},${exam},${total},${obt},${div}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Students_${dash_class.value}_${dash_year.value}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification("Excel file downloaded", "success");
}

/**
 * Download Fees Excel
 */
function downloadFeesExcel() {
    const rows = document.querySelectorAll("#feesExcelBody tr");
    if (rows.length === 0) {
        showNotification("No fees data to export", "warning");
        return;
    }

    let csv = "Month,Monthly Fees,Paid,Due,Status\n";
    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        const inputs = row.querySelectorAll("input");
        csv += `${cols[0].innerText},${inputs[0]?.value || ''},${inputs[1]?.value || ''},${cols[3]?.innerText || ''},${cols[4]?.innerText || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fees_Report_${currentFeesStudent}.csv`;
    a.click();
    
    showNotification("Fees report downloaded", "success");
}

/**
 * Delete Loaded Class
 */
async function deleteLoadedClass() {
    const className = dash_class.value;
    if (!className) {
        showNotification("Please select a class first", "warning");
        return;
    }

    if (!confirm(`Are you sure you want to delete ALL students from class ${className}? This action cannot be undone.`)) return;

    try {
        const res = await fetch(`${API}/api/delete-class/${className}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (data.success) {
            showNotification(data.message, "success");
            loadDashboardStudents();
        } else {
            throw new Error(data.error || "Delete failed");
        }
    } catch (error) {
        console.error("Delete class error:", error);
        showNotification("Error deleting class", "error");
    }
}

// ================= EVENT LISTENERS =================
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Close modal with escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(el => {
        el.addEventListener('mouseenter', function(e) {
            // Tooltip implementation can be added here
        });
    });

    // Load initial data
    initDashboard();
});

// ================= ADDITIONAL UTILITY FUNCTIONS =================
/**
 * Show Notifications
 */
function showNotifications() {
    // Implementation for notification panel
    showNotification("Notifications feature coming soon", "info");
}

/**
 * Toggle Dark Mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.quick-btn .fa-moon');
    if (icon) {
        icon.className = document.body.classList.contains('dark-mode') ? 
            'fas fa-sun' : 'fas fa-moon';
    }
    showNotification("Theme changed", "success");
}

/**
 * Download Reports
 */
function downloadReports() {
    showNotification("Report generation feature coming soon", "info");
}

/**
 * Show Help
 */
function showHelp() {
    showNotification("Help documentation coming soon", "info");
}

/**
 * Print Dashboard
 */
function printDashboard() {
    window.print();
}

// Initialize when page loads
window.onload = initDashboard;
