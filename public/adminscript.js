// --- UTILITY: Image Compressor (New) ---
// Ye function photo ko resize karega aur quality kam karke size 200KB se niche layega
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Resolution ko control karne ke liye
                const MAX_WIDTH = 1000; 
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // JPG format aur 0.7 (70%) quality se size optimize ho jata hai
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
                resolve(dataUrl);
            };
        };
    });
}

// --- UTILITY: Image to Base64 (General purpose) ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- HELPER: Mahine ka naam nikalne ke liye (Jan-24 format) ---
function getMonthLabel(joiningDateStr, index) {
    const date = joiningDateStr ? new Date(joiningDateStr) : new Date();
    date.setMonth(date.getMonth() + (index - 1));
    const options = { month: 'short', year: '2-digit' };
    return date.toLocaleString('en-US', options).replace(' ', '-');
}

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
            document.getElementById('db-title').innerText = data.title;
            document.getElementById('db-subtitle').innerText = data.sub_title || "";
            if(data.logo) document.getElementById('db-logo').src = data.logo;
            
            document.getElementById('form-title').value = data.title;
            document.getElementById('form-subtitle').value = data.sub_title;
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

// --- 3. TEACHER REGISTRATION (With Compression) ---
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
    
    // Photo ko compress karke base64 banayein
    if (photo) {
        data.photo = await compressImage(photo);
    }

    const res = await fetch('/api/teacher-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Teacher Registered! 🎉"); e.target.reset(); modals.teacher.style.display="none"; }
};

// --- 4. LOAD TEACHER CARDS ---
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
            const monthName = getMonthLabel(t.joining_date, i); 
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
        document.querySelectorAll('#updateForm input[type="checkbox"]').forEach(cb => cb.checked = false);
        t.classes?.forEach(c => {
            const cb = document.querySelector(`#up_classes_div input[value="${c}"]`);
            if(cb) cb.checked = true;
        });
        t.subjects?.forEach(s => {
            const cb = document.querySelector(`#up_subjects_div input[value="${s}"]`);
            if(cb) cb.checked = true;
        });
        alert("Teacher data mil gaya! ✅");
    } else { 
        alert("Teacher ID '" + id + "' nahi mili!"); 
    }
}

document.getElementById("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.teacher_id = document.getElementById('up_id').value; 
    data.classes = formData.getAll('classes');
    data.subjects = formData.getAll('subjects');
    try {
        const res = await fetch('/api/update-teacher-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(res.ok) { alert("Updated Successfully! ✅"); modals.update.style.display = "none"; loadTeacherData(); }
    } catch (err) { alert("Error!"); }
};

// --- 8. DELETE TEACHER ---
async function deleteTeacher() {
    const id = document.getElementById('up_id').value;
    if(!id) return alert("Search Teacher first!");
    if(!confirm("Account delete karein?")) return;
    try {
        const res = await fetch('/api/delete-teacher', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: id })
        });
        if(res.ok) { alert("Deleted! 🗑️"); modals.update.style.display="none"; loadTeacherData(); }
    } catch (err) { alert("Error!"); }
}

// --- 9. SAVE SYSTEM SETTINGS (With Compression) ---
document.getElementById("adminForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const logo = document.getElementById('logoInput').files[0];
    
    // Logo ko compress karein
    if (logo) {
        data.logo = await compressImage(logo);
    }

    await fetch('/api/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    alert("Settings Saved!"); loadSettings(); modals.sys.style.display="none";
};

// --- STUDENT REGISTRATION & DATA ---
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

async function loadStudentData() {
    const res = await fetch('/api/get-students');
    const students = await res.json();
    const container = document.getElementById("studentTableBody");
    if (students.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>Koi student nahi mila!</p>";
        return;
    }
    container.innerHTML = ""; 
    students.forEach(s => {
        const joinDate = s.joining_date ? new Date(s.joining_date) : new Date();
        const diff = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
        const totalMonths = diff < 0 ? 1 : diff + 1;
        let checks = "";
        for(let i = 1; i <= totalMonths; i++) {
            const isPaid = s.paid_months?.includes(i) ? "checked" : "";
            const monthName = getMonthLabel(s.joining_date, i); 
            checks += `
                <label class="fee-chip" style="min-width:65px; display:inline-flex; align-items:center; background:#f1f2f6; padding:3px; border-radius:5px; font-size:11px;">
                    <input type="checkbox" ${isPaid} onchange="updateFeesStatus('${s.student_id}', ${i}, this.checked)">
                    <span>${monthName}</span>
                </label>`;
        }
        container.innerHTML += `<div class="diary-card"><h4>${s.student_name}</h4><small>ID: ${s.student_id}</small><div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">${checks}</div></div>`;
    });
}

async function updateFeesStatus(stuId, month, status) {
    await fetch('/api/update-fees-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: stuId, month, status })
    });
}

document.getElementById("studentForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const res = await fetch('/api/student-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) { alert("Student Registered!"); e.target.reset(); document.getElementById("studentModal").style.display = "none"; }
};

// --- HOME SLIDER (With Compression) ---
const sliderModal = document.getElementById('sliderModal');
const openSliderBtn = document.getElementById('openSliderBtn');
if (openSliderBtn) {
    openSliderBtn.onclick = () => { sliderModal.style.display = "block"; loadSliderPhotos(); }
}

async function uploadSliderPhoto() {
    const fileInput = document.getElementById('sliderInput');
    const file = fileInput.files[0];
    if (!file) return alert("Select photo!");

    const btn = event.target;
    btn.innerHTML = 'Uploading...';
    btn.disabled = true;

    try {
        // Slider Photo ko compress karein
        const compressedBase64 = await compressImage(file);

        const response = await fetch('/api/add-slider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: compressedBase64 })
        });
        if((await response.json()).success) { alert("Saved!"); loadSliderPhotos(); }
    } catch (err) { alert("Error!"); } finally { btn.innerHTML = "Upload Photo"; btn.disabled = false; }
}

async function loadSliderPhotos() {
    const container = document.getElementById('sliderPreviewContainer');
    const response = await fetch('/api/get-sliders');
    const photos = await response.json();
    container.innerHTML = photos.map(p => `
        <div style="position: relative;">
            <img src="${p.photo}" style="width: 100px; height: 60px; object-fit: cover; border-radius:5px;">
            <button onclick="deleteSliderPhoto('${p._id}')" style="position:absolute; top:0; right:0; background:red; color:white;">X</button>
        </div>
    `).join('');
}

async function deleteSliderPhoto(id) {
    if(!confirm("Delete?")) return;
    await fetch(`/api/delete-slider/${id}`, { method: 'DELETE' });
    loadSliderPhotos();
}

// --- CLASS SYSTEM CONFIGURATION (With Compression) ---
const classList = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "I.A.", "I.Sc.", "I.Com.", "B.A.", "B.Sc.", "B.Com."];
const subjectsArray = ["Hindi", "English", "Maths", "Sanskrit", "Science", "Social Science", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Accountancy", "Business Studies", "Philosophy"];

document.getElementById('openClassSystemBtn').onclick = () => {
    const grid = document.getElementById('class_button_grid');
    grid.innerHTML = classList.map(cls => `<button onclick="openClassForm('${cls}')" class="btn-primary" style="background:#34495e;">${cls}</button>`).join('');
    document.getElementById('classSystemModal').style.display = "block";
};

async function openClassForm(cls) {
    document.getElementById('config_target_class').value = cls;
    document.getElementById('current_editing_class').innerText = "Managing: " + cls;
    const container = document.getElementById('subject_config_container');
    container.innerHTML = subjectsArray.map(sub => `
        <div style="margin-bottom:10px;">
            <label><input type="checkbox" id="check_${sub}" onchange="toggleSubjectInputs('${sub}', this.checked)"> ${sub}</label>
            <div id="link_box_${sub}" style="display:none; margin-left:20px;">
                <div id="inputs_container_${sub}"><input type="text" name="${sub}_links[]" placeholder="YT Link"></div>
                <button type="button" onclick="addLinkInput('${sub}')">+ Add Link</button>
            </div>
        </div>
    `).join('');
    document.getElementById('classConfigModal').style.display = "block";
    loadExistingClassData(cls);
}

function toggleSubjectInputs(sub, isChecked) {
    document.getElementById(`link_box_${sub}`).style.display = isChecked ? "block" : "none";
}
function addLinkInput(sub) {
    const cont = document.getElementById(`inputs_container_${sub}`);
    const input = document.createElement('input');
    input.name = `${sub}_links[]`; input.placeholder = "YT Link";
    cont.appendChild(input);
}

document.getElementById('classDetailsForm').onsubmit = async (e) => {
    e.preventDefault();
    const cls = document.getElementById('config_target_class').value;
    const intro = document.getElementById('cls_intro').value;
    const bannerFile = document.getElementById('cls_banner').files[0];
    let bannerBase64 = "";

    // Class Banner ko compress karein
    if (bannerFile) {
        bannerBase64 = await compressImage(bannerFile);
    } else {
        const preview = document.getElementById('banner-preview');
        bannerBase64 = preview ? preview.src : "";
    }

    let subjectData = {};
    subjectsArray.forEach(sub => {
        const cb = document.getElementById(`check_${sub}`);
        if(cb && cb.checked) {
            subjectData[sub] = Array.from(document.getElementsByName(`${sub}_links[]`)).map(i => i.value).filter(v => v.trim() !== "");
        }
    });

    const res = await fetch('/api/save-class-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_name: cls, banner: bannerBase64, intro_video: intro, subjects: subjectData })
    });
    if(res.ok) { alert("Saved!"); document.getElementById('classConfigModal').style.display = "none"; }
};

async function loadExistingClassData(cls) {
    const res = await fetch(`/api/get-class-config/${cls}`);
    const data = await res.json();
    if(data) {
        document.getElementById('cls_intro').value = data.intro_video || "";
        if(data.banner) {
            let preview = document.getElementById('banner-preview');
            if(!preview) {
                preview = document.createElement('img'); preview.id = 'banner-preview';
                preview.style = "width:100px; display:block; margin-top:10px;";
                document.getElementById('cls_banner').after(preview);
            }
            preview.src = data.banner;
        }
    }
}
