
document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const regPhotoInput = document.getElementById('regPhoto'); // Naya add karein
    const loader = document.getElementById('loader');
    const headerLogo = document.getElementById('header-logo');
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const footerContact = document.getElementById('footer-contact');
    const footerCall = document.getElementById('footer-call');
    const footerGmail = document.getElementById('footer-gmail');
    const footerFacebook = document.getElementById('footer-facebook');
    const footerYoutube = document.getElementById('footer-youtube');
    const footerInstagram = document.getElementById('footer-instagram');
    const footerTwitter = document.getElementById('footer-twitter');
    const footerHelp = document.getElementById('footer-help');

    // Login Elements (Naya Add Kiya Gaya)
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeLogin = document.getElementById('closeLogin');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    const studentResultBtn = document.getElementById('studentResultBtn');
    const resultModal = document.getElementById('resultModal');
    const searchStudentBtn = document.getElementById('searchStudentBtn');
    const searchStudentIdInput = document.getElementById('searchStudentId');
    const searchMessage = document.getElementById('searchMessage');
    const studentResultDisplay = document.getElementById('studentResultDisplay');
    const detailedResultContent = document.getElementById('detailedResultContent');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadJpgBtn = document.getElementById('downloadJpgBtn');

    // Registration Elements
    const regModal = document.getElementById('regModal');
    const regBtn = document.getElementById('studentRegBtn');
    const closeReg = document.getElementById('closeReg');
    const studentRegForm = document.getElementById('studentRegForm');

    // Show loader initially
    loader.style.display = 'flex';

    // --- 1. Load System Settings ---
    async function loadSystemSettings() {
        try {
            const response = await fetch('/api/get-settings');
            const settings = await response.json();
            if (settings) {
                if (settings.logo) { headerLogo.src = settings.logo; headerLogo.style.display = 'block'; }
                headerTitle.textContent = settings.title || 'BBCC Portal';
                headerSubtitle.textContent = settings.sub_title || 'Education for All';
                footerContact.textContent = settings.contact || 'N/A';
                footerCall.textContent = settings.call_no || 'N/A';
                footerGmail.textContent = settings.gmail || 'N/A';
                footerHelp.textContent = settings.help || '';
                footerFacebook.href = settings.facebook || '#';
                footerYoutube.href = settings.youtube_link || '#';
                footerInstagram.href = settings.instagram || '#';
                footerTwitter.href = settings.twitter || '#';
            }
        } catch (error) { console.error('Settings load error:', error); }
        finally { loader.style.display = 'none'; }
    }

// --- 2. Login Logic (Updated for Popup) ---
if(loginBtn) {
    loginBtn.onclick = () => {
        loginModal.style.display = 'flex';
    };
}



loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loader.style.display = 'flex';

    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    let loginType = '';

    try {
        // ===== ADMIN CHECK =====
        const adminRes = await fetch('/api/get-admin-profile');
        const admin = await adminRes.json();
        if (admin && admin.admin_userid === userId && admin.admin_pass === password) {
            loginType = 'admin';
        }

        // ===== TEACHER / STUDENT CHECK =====
        if (!loginType) {
            const [tRes, sRes] = await Promise.all([
                fetch('/api/get-teachers'),
                fetch('/api/get-students')
            ]);

            const teachers = await tRes.json();
            const students = await sRes.json();

            if (teachers.find(t => t.teacher_id === userId && t.pass === password)) {
                loginType = 'teacher';
            } 
            else {
                const student = students.find(
                    s => s.student_id === userId && s.pass === password
                );

                if (student) {

                    // 🔴 APPROVAL / FEES CHECK (YAHI ADD KIYA GAYA HAI)
                    const notApproved =
                        !student.fees ||
                      student.fees === "0";

                    if (notApproved) {
                        loader.style.display = 'none';

                        showSmoothAlert(
                            "⚠️ आप अभी अप्रूव नहीं हुए हैं।\nफीस सत्यापन लंबित है।"
                        );

                        // safety
                        localStorage.removeItem("studentId");

                        setTimeout(() => {
                            loginModal.style.display = 'none';
                        }, 3000);

                        return; // ⛔ login stop
                    }

                    // ✅ APPROVED STUDENT
                    loginType = 'student';
                    localStorage.setItem("studentId", student.student_id);
                }
            }
        }

        // ===== REDIRECTION (FIXED) =====
loader.style.display = 'none';

if (loginType === 'admin') {
    localStorage.setItem("isAdminLoggedIn", "true");
    window.location.replace('/admin');
    return; // ✅ yahin ruk jao
}

if (loginType === 'teacher') {
    window.location.replace('/teacher');
    return;
}

if (loginType === 'student') {
    window.location.replace('/student.html');
    return;
}

loginMessage.textContent = "❌ गलत User ID या Password";

        

    } catch (err) {
        loader.style.display = 'none';
        loginMessage.textContent = "⚠️ Server Error";
    }
});


     

// --- 3. Result Modal & Search Logic (Merged & Improved) ---
    if (studentResultBtn) {
    studentResultBtn.onclick = () => resultModal.style.display = 'flex';
}
    
   document.querySelectorAll('.close-button').forEach(btn => {
    btn.onclick = (e) => {
        e.target.closest('.modal').style.display = 'none';
    }
});

    // Smart Search Logic: ID, Name, or Mobile
// --- 3. Result Modal & Smart Search Logic ---

searchStudentBtn.onclick = async () => {
    const nameOrId = document.getElementById('searchStudentId').value.trim();
    const mobileNum = document.getElementById('searchMobile').value.trim();
    const searchMsg = document.getElementById('searchMessage');
    const display = document.getElementById('studentResultDisplay');

    if (!nameOrId) {
        searchMsg.textContent = "ID ya Name bharna zaroori hai!";
        return;
    }
    
    searchMsg.textContent = "Searching...";
    if(document.getElementById('loader')) document.getElementById('loader').style.display = 'flex';
    
    try {
       const res = await fetch('/api/search-student-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        searchTerm: nameOrId, // Yahan ID ya Name jayega
        mobileSearch: mobileNum // Yahan Mobile Number jayega
    })
});
        
        const data = await res.json();

        if (data.success) {
            const s = data.student;
            searchMsg.textContent = "";
            display.style.display = 'block';

            // Fill Data
            document.getElementById('result-student-name').textContent = s.student_name;
            document.getElementById('result-student-id').textContent = s.student_id;
            document.getElementById('result-parent-name').textContent = s.parent_name;
            document.getElementById('result-student-class').textContent = s.student_class;
            document.getElementById('result-exam-date').textContent = s.exam_date;
            document.getElementById('result-exam-subject').textContent = s.exam_subject || "General";
            document.getElementById('result-total-marks').textContent = s.total_marks;
            document.getElementById('result-obtained-marks').textContent = s.obtained_marks;

            const obtained = parseFloat(s.obtained_marks) || 0;
            const total = parseFloat(s.total_marks) || 0;
            const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : "0";
            document.getElementById('result-percentage').textContent = percentage;

            document.getElementById('result-student-photo').src = s.photo || 'https://via.placeholder.com/120x140?text=No+Photo';
            
            // Re-setup download events
            setupDownloadEvents(s.student_id);
        } else {
            searchMsg.textContent = data.message;
            display.style.display = 'none';
        }
    } catch (err) {
        searchMsg.textContent = "❌ Connection Error!";
    } finally {
        if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
    }
};

function setupDownloadEvents(stuId) {
    const element = document.getElementById('studentResultDisplay');
    const btns = element.querySelector('.download-buttons');

    document.getElementById('downloadPdfBtn').onclick = async () => {
        const { jsPDF } = window.jspdf;
        btns.style.display = 'none';
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`Result_${stuId}.pdf`);
            btns.style.display = 'flex';
        });
    };

    document.getElementById('downloadJpgBtn').onclick = async () => {
        btns.style.display = 'none';
        html2canvas(element, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Result_${stuId}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", 0.9);
            link.click();
            btns.style.display = 'flex';
        });
    };
}
    // --- 4. Registration Logic ---
    if(regBtn) regBtn.onclick = () => regModal.style.display = "block";
    if(closeReg) closeReg.onclick = () => regModal.style.display = "none";
let compressedPhotoBase64 = "";

// Image ko compress karne ka function
async function handleImageCompression(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Size chhota rakhein taaki 10kb achieve ho sake
                canvas.width = 150; 
                canvas.height = 150;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 150, 150);
                
                // Sabse kam quality (0.1 se 0.3) 10kb ke liye best hai
                compressedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.3);
                
                // Preview dikhayein
                document.getElementById('photoPreview').src = compressedPhotoBase64;
                document.getElementById('photoPreviewContainer').style.display = 'block';
                const size = Math.round((compressedPhotoBase64.length * 3/4) / 1024);
                document.getElementById('photoSizeLabel').innerText = "Size: ~" + size + " KB";
                resolve();
            };
        };
    });
}

// Input change event listener
if(regPhotoInput) {
    regPhotoInput.onchange = (e) => handleImageCompression(e.target.files[0]);
}
studentRegForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerText = "Saving...";
    btn.disabled = true;

    // --- Automatic Unique ID ---
    const datePart = new Date().toISOString().slice(2,7).replace('-', ''); 
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const generatedId = "STU" + datePart + randomPart;

  
    const selectedClass = document.getElementById('regClassSelect').value;

    if (!selectedClass) { // <-- validation add
        alert("Class select karna zaroori hai");
        btn.innerText = "Register Now";
        btn.disabled = false;
        return;
    }

    const formData = {
        student_name: document.getElementById('regName').value,
        parent_name: document.getElementById('regParent').value,
        mobile: document.getElementById('regMobile').value,
        parent_mobile: document.getElementById('regParentMobile').value,

        student_class: selectedClass, // <-- UPDATE (ab single class sahi jayegi)

        joining_date: document.getElementById('regDate').value,
        student_id: generatedId,
        pass: document.getElementById('regPass').value || "123456",
        photo: (typeof compressedPhotoBase64 !== 'undefined') ? compressedPhotoBase64 : "",
        fees: "0"
    };

    try {
        const response = await fetch('/api/student-reg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.success) {
            alert('✅ Success! Student ID: ' + result.student_id);
            regModal.style.display = "none";
            studentRegForm.reset();
            compressedPhotoBase64 = "";
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (err) {
        alert('❌ Server connect nahi ho raha!');
    } finally {
        btn.innerText = "Register Now";
        btn.disabled = false;
    }
});
    // Outside click (Updated to include loginModal)
    window.onclick = (event) => {
        if (event.target == regModal) regModal.style.display = "none";
        if (event.target == resultModal) resultModal.style.display = "none";
        if (event.target == loginModal) loginModal.style.display = "none";
        if (event.target == document.getElementById('classDetailModal')) {
            document.getElementById('classDetailModal').style.display = "none";
        }
    };

    
    // --- Initial Load Functions ---
    loadSystemSettings();
    fetchSliderPhotos();
    loadTeacherRing();
    
});

// --- GLOBAL FUNCTIONS --- (Inmein koi badlav nahi kiya gaya)

let currentSlide = 0;
let totalSlides = 0;

async function fetchSliderPhotos() {
    try {
        const response = await fetch('/api/get-sliders');
        const photos = await response.json();
        const wrapper = document.getElementById('dynamic-slider');
        if (photos.length > 0) {
            totalSlides = photos.length;
            wrapper.innerHTML = photos.map(p => `<img src="${p.photo}" alt="Slider">`).join('');
            setInterval(() => moveSlider(1), 4000);
        } else {
            wrapper.innerHTML = '<div class="slide-placeholder">Welcome to BBCC Portal</div>';
        }
    } catch (err) { console.error("Slider Load Error:", err); }
}

function moveSlider(direction) {
    const wrapper = document.getElementById('dynamic-slider');
    if (!wrapper || totalSlides === 0) return;
    currentSlide += direction;
    if (currentSlide >= totalSlides) currentSlide = 0;
    if (currentSlide < 0) currentSlide = totalSlides - 1;
    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
}

async function loadTeacherRing() {
    try {
        const response = await fetch('/api/get-teachers');
        const teachers = await response.json();
        const ringContainer = document.getElementById('teacher-ring');
        if (teachers.length > 0) {
            ringContainer.innerHTML = teachers.map(t => `
                <div class="teacher-card">
                    <div class="ring-wrapper">
                        <img src="${t.photo || 'default-teacher.png'}" alt="${t.teacher_name}">
                    </div>
                    <p>${t.teacher_name}</p>
                </div>
            `).join('');
            ringContainer.innerHTML += ringContainer.innerHTML;
        } else {
            ringContainer.parentElement.style.display = 'none';
        }
    } catch (err) { console.error("Teacher Ring Error:", err); }
}


function showSmoothAlert(msg) {
    const box = document.getElementById("alertBox");
    box.innerText = msg;
    box.classList.add("show");

    setTimeout(() => {
        box.classList.remove("show");
    }, 2500);
}
/////////////////////////////
function openVip(id){document.getElementById(id).style.display='block'}
function closeVip(id){document.getElementById(id).style.display='none'}
