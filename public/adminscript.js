

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
    if (photo) data.photo = await compressImageTo5KB(photo);

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
        data.photo = await compressImageTo5KB(updatePhotoFile);
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
        data.logo = await compressImageTo5KB(logo);
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
async function uploadSliderPhoto(event) {
    const fileInput = document.getElementById('sliderInput');
    const file = fileInput.files[0];

    if (!file) return alert("Please select a photo first!");

    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = "Uploading...";
    btn.disabled = true;

    try {
        const base64Photo = await compressImageTo5KB(file);

        const response = await fetch('/api/add-slider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: base64Photo })
        });

        const result = await response.json();
        if (result.success) {
            alert("✅ Photo saved to MongoDB!");
            fileInput.value = "";
            loadSliderPhotos();
        } else {
            alert("❌ Upload failed!");
        }
    } catch (err) {
        console.error(err);
        alert("Server error!");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
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
        bannerBase64 = await compressImageTo5KB(bannerFile);
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////boat///////////////

// ================= BHARTI AI CONTROL STATE =================
let bhartiPendingAction = null;

function bhartiAskConfirm(type, payload) {
    bhartiPendingAction = { type, payload };
    return "⚠️ Confirm karein: YES ya NO likhiye.";
}

function bhartiHandleConfirm(userText) {
    if (!bhartiPendingAction) return null;

    const txt = userText.toLowerCase();
    if (!txt.includes("yes") && !txt.includes("no")) return null;

    if (txt.includes("no")) {
        bhartiPendingAction = null;
        return "❌ Action cancel kar diya gaya.";
    }

    const { type, payload } = bhartiPendingAction;
    bhartiPendingAction = null;

    if (type === "OPEN_MODAL") {
        const allowed = [
            "systemModal",
    "teacherModal",
    "updateModal",
    "studentModal",
    "studentUpdateModal",
    "classSystemModal",
    "adminProfileModal",
    "sliderModal",
    "resultModal",
    "studentDataModal",
    "dataModal",
    "profileModal",
    "classConfigModal"
        ];
        if (allowed.includes(payload)) {
            const el = document.getElementById(payload);
            if (el) el.style.display = "block";
            return "✅ Requested form open kar diya gaya.";
        }
        return "❌ Ye form allowed nahi hai.";
    }

    return null;
}

// ================= BHARTI AI SYSTEM =================

function toggleBhartiChat() {
    document.getElementById('bharti-chat-window')
        .classList.toggle('bharti-hidden');
}

// ---------- VOICE ----------
function bhartiSpeak(text) {
    if (!text) return;

    // Same line dobara mat bolna
    if (text === lastBhartiSpoken) return;

    // Confirm / cancel wale message ko mat bolna
    if (
        text.includes("Confirm") ||
        text.includes("YES") ||
        text.includes("NO") ||
        text.includes("cancel")
    ) return;

    lastBhartiSpoken = text;

    if (window.responsiveVoice && responsiveVoice.isPlaying()) {
        responsiveVoice.cancel();
    }
    window.speechSynthesis.cancel();

    if (window.responsiveVoice) {
        responsiveVoice.speak(text, "Hindi Female");
    } else {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'hi-IN';
        window.speechSynthesis.speak(u);
    }
}


function fallbackToSystemVoice(text) {
    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find(v =>
        v.name.includes('Heera') ||
        v.name.includes('Kalpana') ||
        v.name.includes('Google Hindi')
    );
    if (female) speech.voice = female;
    speech.lang = 'hi-IN';
    speech.rate = 0.9;
    speech.pitch = 1.1;
    window.speechSynthesis.speak(speech);
}

window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

// ================= CHAT LOGIC =================
// ================= CHAT LOGIC =================
async function sendBhartiMessage() {
    const inputField = document.getElementById('bharti-input');
    const container = document.getElementById('bharti-messages');
    const prompt = inputField.value.trim();
    if (!prompt) return;

    // 🔐 CONFIRM CHECK
    const confirmReply = bhartiHandleConfirm(prompt);
    if (confirmReply) {
        container.innerHTML += `<div class="bharti-msg ai">${confirmReply}</div>`;
        bhartiSpeak(confirmReply);
        inputField.value = '';
        return;
    }

    // USER MESSAGE
    container.innerHTML += `<div class="bharti-msg user">${prompt}</div>`;
    inputField.value = '';
    container.scrollTop = container.scrollHeight;

    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        let reply = data.reply || "मैं समझ नहीं पाई।";

        // MODAL COMMAND → CONFIRM
        if (reply.includes("[OPEN_MODAL:")) {
            const match = reply.match(/\[OPEN_MODAL:\s*(\w+)\]/);
            if (match) {
                const el = document.getElementById(match[1]);
if (el) {
    el.style.display = "block";
    reply = "✅ खोल दिया गया।";
}
            }
        }

        container.innerHTML += `<div class="bharti-msg ai">${reply}</div>`;
        bhartiSpeak(reply);

    } catch (err) {
        console.error("AI Chat Error:", err);
        const msg = "माफ़ कीजिए, सर्वर से जवाब नहीं मिल पाया।";
        container.innerHTML += `<div class="bharti-msg ai">${msg}</div>`;
        bhartiSpeak(msg);
    }
}


// ================= MIC / VOICE INPUT =================
let recognition;
let isListening = false;

function bhartiListen() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert("Speech Recognition supported nahi hai. Chrome use karo.");
        return;
    }

    if (!recognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            console.log("🎤 Mic started");
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            console.log("🎙️ Bola gaya:", text);
            document.getElementById("bharti-input").value = text;
            sendBhartiMessage();
        };

        recognition.onerror = (e) => {
            console.error("Mic error:", e);
            isListening = false;
        };

        recognition.onend = () => {
            isListening = false;
            console.log("🎤 Mic stopped");
        };
    }

    recognition.onend = function() {
        isListening = false;
    };
} 
////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO NEW BOTON STU DAS BORD  OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO

document.getElementById("openStudentDashboardBtn").onclick = () => {
    document.getElementById("studentDashboardModal").style.display = "block";
    prepareDashboardFilters();
};

/////--------------------------------------------------------------------------
    function prepareDashboardFilters() {
    const clsSel = document.getElementById('dash_class');
    const yearSel = document.getElementById('dash_year');

    clsSel.innerHTML = `<option value="">Select Class</option>` +
        classList.map(c => `<option value="${c}">${c}</option>`).join('');

    const currentYear = new Date().getFullYear();
    yearSel.innerHTML = `<option value="">Select Year</option>`;
    for(let y=currentYear; y>=2018; y--) {
        yearSel.innerHTML += `<option value="${y}">${y}</option>`;
    }
}
////--------------------------------------------------------------------
    async function loadDashboardStudents() {
    const cls = document.getElementById('dash_class').value;
    const year = document.getElementById('dash_year').value;
    if(!cls || !year) return alert("Class & Year dono select karo");

    const res = await fetch('/api/get-students');
    let students = await res.json();

    students = students.filter(s =>
        s.student_class === cls &&
        new Date(s.joining_date).getFullYear() == year
    );

    const body = document.getElementById('dashboardBody');
    body.innerHTML = "";

    students.forEach(s => {
    body.innerHTML += `
<tr>
<td>
  <img src="${s.photo}" width="40"
   onclick="openFeesExcelPopup('${s.student_id}')">
</td>

<td>${s.student_id}</td>

<td><input value="${s.student_name||''}"></td>

<td><input value="${s.pass||''}"></td>

<td>${s.student_class}</td>

<td>
  <input type="date" value="${s.joining_date||''}">
</td>

<td><input value="${s.fees||''}" style="width:70px"></td>

<td>
  <input type="date" value="${s.exam_date||''}">
  <button onclick="this.previousElementSibling.value=''">❌</button>
</td>

<td><input value="${s.total_marks||''}" style="width:60px"></td>

<td><input value="${s.obtained_marks||''}" style="width:60px"></td>

<td>${calculateDivision(s.obtained_marks, s.total_marks)}</td>

<td>
  <button onclick="saveDashStudent('${s.student_id}',this)">💾</button>
</td>

<td>
  <button onclick="deleteDashStudent('${s.student_id}')">🗑</button>
</td>
</tr>`;

    });
}
////--------------------------------------------------
async function saveDashStudent(id, btn){
  const row = btn.closest('tr');
  const inputs = row.querySelectorAll('input');

  await fetch('/api/update-student-data',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id: id,
      student_name: inputs[0].value,
      pass: inputs[1].value,
      joining_date: inputs[2].value,
      fees: inputs[3].value,
      exam_date: inputs[4].value || "",
      total_marks: inputs[5].value,
      obtained_marks: inputs[6].value
    })
  });

  alert("Saved");
}

////----------------------------------------------------------------------
    async function deleteDashStudent(id) {
    if(!confirm("Delete student?")) return;
    await fetch('/api/delete-student', {
        method:'DELETE',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({student_id:id})
    });
    loadDashboardStudents();
}
////----------------------------------------------------------------------
    async function deleteLoadedClass() {
    if(!confirm("DELETE FULL LOADED CLASS DATA?")) return;

    const rows = document.querySelectorAll('#dashboardBody tr');
    for (let r of rows) {
        const id = r.children[2].innerText;
        await fetch('/api/delete-student', {
            method:'DELETE',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({student_id:id})
        });
    }
    alert("All deleted");
    document.getElementById('dashboardBody').innerHTML="";
}
/////------------------------------------------------------------------
    function openFeesPopup(id){
    document.getElementById("studentDataModal").style.display="block";
    loadStudentFeesOnly(id);
}
////--------------------------------------------------------------------
    
let currentFeesStudent = null;

async function openFeesExcelPopup(student_id) {
    currentFeesStudent = student_id;
    document.getElementById("feesExcelModal").style.display = "block";

    const res = await fetch('/api/get-students');
    const students = await res.json();
    const s = students.find(x => x.student_id === student_id);

    document.getElementById("feesStudentInfo").innerHTML = `
        <b>${s.student_name}</b> |
        Parent: ${s.parent_name} |
        📞 ${s.mobile}
        <button onclick="callNow('${s.mobile}')">📞</button>
        <button onclick="sendSMS('${s.mobile}')">💬</button>
    `;

    prepareFeesFilters();
    loadFeesExcel();
}
////--------------------------------------------------------
function prepareFeesFilters(){
    const y = document.getElementById('fees_year');
    const m = document.getElementById('fees_month');

    y.innerHTML = `<option value="all">All Years</option>`;
    m.innerHTML = '<option value="">All Months</option>';

    const cy = new Date().getFullYear();
    for(let i=cy;i>=2018;i--) y.innerHTML += `<option>${i}</option>`;

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];
    months.forEach((mo,i)=>{
        m.innerHTML += `<option value="${i+1}">${mo}</option>`;
    });
}
//----------------------------------------------------------------------
async function loadFeesExcel(){
  const yearSel = document.getElementById('fees_year').value;
  const monthSel = document.getElementById('fees_month').value;

  const res = await fetch('/api/get-students');
  const s = (await res.json())
        .find(x=>x.student_id===currentFeesStudent);

  const body = document.getElementById('feesExcelBody');
  body.innerHTML = "";

  const join = new Date(s.joining_date);
  const now = new Date();

  let yStart = join.getFullYear();
  let yEnd = now.getFullYear();

  for(let y=yStart; y<=yEnd; y++){
    if(yearSel!=="all" && Number(yearSel)!==y) continue;

    let mStart = (y===yStart)? join.getMonth()+1 : 1;
    let mEnd = (y===yEnd)? now.getMonth()+1 : 12;

    for(let m=mStart; m<=mEnd; m++){
      if(monthSel && Number(monthSel)!==m) continue;

      const key = `${y}-${m}`;
      const data = s.fees_data?.[key] || {};
      const paid = Number(data.paid||0);
      const fees = Number(s.fees||0);
      const due = fees - paid;
        const dueText = (due <= 0) ? "PAID" : due;

      body.innerHTML += `
      <tr>
        <td>${key}</td>
        <td>${fees}</td>
        <td>
          <input value="${paid}"
           oninput="autoDue(this,${fees})"
           style="width:70px">
        </td>
        <td class="dueCell">${due}</td>
        <td>${due <= 0 ? "✅ Paid" : "❌ Due"}</td>
        <td>
          <button onclick="saveMonthlyFees('${key}',this)">💾</button>
        </td>
      </tr>`;
    }
  }
}

/////----------------------------------------------------
async function saveMonthlyFees(key, btn){
    const paid = btn.closest('tr').querySelector('input').value;

    await fetch('/api/update-student-fees',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            student_id:currentFeesStudent,
            month:key,
            field:'paid',
            value:paid
        })
    });
    alert("Updated");
    loadFeesExcel();
}

////////-----------------------------------------------
function autoDue(input, fees){
  const paid = Number(input.value||0);
  const due = fees - paid;

  const cell = input.closest('tr').querySelector('.dueCell');
  cell.innerText = (due <= 0) ? "PAID" : due;
}

///-------------------------------------------------------------------
function callNow(num){
    window.location.href = `tel:${num}`;
}
function sendSMS(num){
    window.location.href = `sms:${num}?body=Fees reminder from BBCC`;
}
/////---------------------------------------
function closeFeesExcel(){
    document.getElementById("feesExcelModal").style.display="none";
}
///
