document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
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
    // Login Modal Open karne ke liye
    if(loginBtn) {
        loginBtn.onclick = () => {
            loginModal.style.display = 'flex';
        };
    }

    // Login Modal Close karne ke liye
    if(closeLogin) {
        closeLogin.onclick = () => {
            loginModal.style.display = 'none';
            loginMessage.textContent = ""; // Purana error message saaf karne ke liye
        };
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.style.display = 'flex';
        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;
        let loginType = '';

        try {
            const adminRes = await fetch('/api/get-admin-profile');
            const admin = await adminRes.json();
            if (admin && admin.admin_userid === userId && admin.admin_pass === password) {
                loginType = 'admin';
            }
            if (!loginType) {
                const [tRes, sRes] = await Promise.all([fetch('/api/get-teachers'), fetch('/api/get-students')]);
                const teachers = await tRes.json();
                const students = await sRes.json();
                if (teachers.find(t => t.teacher_id === userId && t.pass === password)) loginType = 'teacher';
                else if (students.find(s => s.student_id === userId && s.pass === password)) loginType = 'student';
            }

            if (loginType === 'admin') {
                localStorage.setItem('isAdminLoggedIn', 'true');
                window.location.href = 'admin';
            } else if (loginType) {
                alert(`✅ Login Successful as ${loginType.toUpperCase()}!`);
                loginModal.style.display = 'none'; // Login ke baad modal band karein
            } else {
                loginMessage.textContent = "❌ Invalid ID or Password!";
            }
        } catch (err) { loginMessage.textContent = "❌ Server Error!"; }
        finally { loader.style.display = 'none'; }
    });

    // --- 3. Result Modal & Search Logic ---
    studentResultBtn.onclick = () => resultModal.style.display = 'flex';
    
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.onclick = () => {
            resultModal.style.display = 'none';
            regModal.style.display = 'none';
            // Agar class modal ya login modal button isi class ko use kar rahe hain
            if(loginModal) loginModal.style.display = 'none';
        }
    });

    searchStudentBtn.onclick = async () => {
        const id = searchStudentIdInput.value;
        if (!id) return;
        searchMessage.textContent = "Searching...";
        try {
            const res = await fetch('/api/get-students');
            const students = await res.json();
            const s = students.find(item => item.student_id === id);
            if (s && s.exam_date) {
                searchMessage.textContent = "";
                studentResultDisplay.style.display = 'block';
                document.getElementById('result-student-name').textContent = s.student_name;
                document.getElementById('result-student-id').textContent = s.student_id;
                document.getElementById('result-parent-name').textContent = s.parent_name;
                document.getElementById('result-student-mobile').textContent = s.mobile;
                document.getElementById('result-student-class').textContent = s.student_class;
                document.getElementById('result-exam-date').textContent = s.exam_date;
                document.getElementById('result-total-marks').textContent = s.total_marks;
                document.getElementById('result-obtained-marks').textContent = s.obtained_marks;
                if(s.photo) {
                    const img = document.getElementById('result-student-photo');
                    img.src = s.photo; img.style.display = 'block';
                }
            } else {
                searchMessage.textContent = "❌ Result not found!";
                studentResultDisplay.style.display = 'none';
            }
        } catch (err) { searchMessage.textContent = "❌ Search failed!"; }
    };

    // --- 4. Registration Logic ---
    if(regBtn) regBtn.onclick = () => regModal.style.display = "block";
    if(closeReg) closeReg.onclick = () => regModal.style.display = "none";

    studentRegForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Processing..."; 
        submitBtn.disabled = true;

        const selectedClasses = Array.from(document.querySelectorAll('input[name="regClass"]:checked')).map(cb => cb.value);
        const studentId = document.getElementById('regId').value.trim() || "STU" + Math.floor(1000 + Math.random() * 9000);

        const formData = {
            student_name: document.getElementById('regName').value,
            parent_name: document.getElementById('regParent').value,
            mobile: document.getElementById('regMobile').value,
            parent_mobile: document.getElementById('regParentMobile').value,
            student_class: selectedClasses.join(', '),
            joining_date: document.getElementById('regDate').value,
            student_id: studentId,
            pass: document.getElementById('regPass').value,
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
                alert('✅ Success! Student ID: ' + studentId);
                regModal.style.display = "none";
                studentRegForm.reset();
            } else {
                alert('❌ Error: ' + (result.error || "Registration failed"));
            }
        } catch (err) { alert('❌ Network Error!'); }
        finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
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

    // --- 5. Download Logic ---
    async function getCaptureElement() {
        const clone = studentResultDisplay.cloneNode(true);
        clone.style.padding = "20px"; clone.style.background = "white"; clone.style.color = "black";
        clone.querySelector('.download-buttons').remove();
        detailedResultContent.innerHTML = "";
        detailedResultContent.appendChild(clone);
        return detailedResultContent;
    }

    downloadJpgBtn.onclick = async () => {
        const el = await getCaptureElement();
        html2canvas(el).then(canvas => {
            const link = document.createElement('a');
            link.download = `Result_${document.getElementById('result-student-id').innerText}.jpg`;
            link.href = canvas.toDataURL("image/jpeg");
            link.click();
        });
    };

    downloadPdfBtn.onclick = async () => {
        const { jsPDF } = window.jspdf;
        const el = await getCaptureElement();
        html2canvas(el).then(canvas => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 0);
            pdf.save(`Result_${document.getElementById('result-student-id').innerText}.pdf`);
        });
    };

    // --- Initial Load Functions ---
    loadSystemSettings();
    fetchSliderPhotos();
    loadTeacherRing();
    loadClasses(); 
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

async function loadClasses() {
    const classList = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "I.Sc.", "I.A.", "I.Com."];
    const container = document.getElementById('class-cards-container');
    if (!container) return;

    let classConfigs = {};
    try {
        const res = await fetch('/api/get-all-class-configs');
        classConfigs = await res.json();
    } catch (e) { console.log("Class configs not available yet"); }

    container.innerHTML = classList.map(className => {
        const bannerImg = (classConfigs[className] && classConfigs[className].banner) 
                          ? classConfigs[className].banner 
                          : "https://via.placeholder.com/300x150?text=Class+" + className;

        return `
        <div class="class-card" onclick="openClassModal('${className}')">
            <div class="card-inner">
                <img src="${bannerImg}" class="class-banner-img" alt="Class Banner">
                <div class="class-card-icon"><i class="fas fa-university"></i></div>
                <h3 class="class-name-text">Class ${className}</h3>
                <p>Click to explore subjects.</p>
                <button class="view-now-btn">View Now</button>
            </div>
        </div>
    `}).join('');
}

async function openClassModal(className) {
    const modal = document.getElementById('classDetailModal');
    const videoContainer = document.getElementById('video-container');
    const subjectListContainer = document.getElementById('subject-list-container');
    const teacherDisplay = document.getElementById('class-teachers-display');
    const modalTitle = document.getElementById('modal-class-title');

    modalTitle.innerText = "Class: " + className;
    modal.style.display = 'flex';
    videoContainer.innerHTML = "Loading...";
    subjectListContainer.innerHTML = "Loading...";

    try {
        const response = await fetch(`/api/get-class-config/${className}`);
        const config = await response.json();

        if (response.ok && config) {
            if (config.intro_video) {
                let videoUrl = config.intro_video;
                if (videoUrl.includes("watch?v=")) {
                    videoUrl = videoUrl.replace("watch?v=", "embed/");
                } else if (videoUrl.includes("youtu.be/")) {
                    videoUrl = videoUrl.replace("youtu.be/", "www.youtube.com/embed/");
                }
                let separator = videoUrl.includes('?') ? '&' : '?';
                let finalSrc = `${videoUrl}${separator}autoplay=1&mute=1&rel=0&enablejsapi=1`;

                videoContainer.innerHTML = `
                    <iframe width="100%" height="200" src="${finalSrc}" 
                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>`;
            } else {
                videoContainer.innerHTML = `<div class="no-data">No Intro Video Available</div>`;
            }

            if (config.subjects && Object.keys(config.subjects).length > 0) {
                let html = '<ul class="subject-list" style="list-style: none; padding: 0;">';
                for (const subject of Object.keys(config.subjects)) {
                    html += `<li style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; font-size: 16px; font-weight: 500;">
                                <i class="fas fa-check-circle" style="color: #28a745; margin-right: 10px;"></i>
                                ${subject}
                             </li>`;
                }
                html += '</ul>';
                subjectListContainer.innerHTML = html;
            } else {
                subjectListContainer.innerHTML = "<p>No subject info added yet.</p>";
            }
        } else {
            videoContainer.innerHTML = "No configuration found.";
            subjectListContainer.innerHTML = "Admin update pending for " + className;
        }

        const tRes = await fetch('/api/get-teachers');
        const teachers = await tRes.json();
        const filteredTeachers = teachers.filter(t => t.classes && t.classes.includes(className));

        if (filteredTeachers.length > 0) {
            teacherDisplay.innerHTML = filteredTeachers.map(t => `
                <div class="mini-teacher-card">
                    <img src="${t.photo || 'default-teacher.png'}" alt="${t.teacher_name}">
                    <span>${t.teacher_name}</span>
                </div>
            `).join('');
        } else {
            teacherDisplay.innerHTML = "Not assigned";
        }
    } catch (err) {
        subjectListContainer.innerHTML = "Error loading data.";
        videoContainer.innerHTML = "Error loading video.";
    }
}

const closeClassBtn = document.getElementById('closeClassModal');
if(closeClassBtn) {
    closeClassBtn.onclick = () => {
        document.getElementById('classDetailModal').style.display = 'none';
        document.getElementById('video-container').innerHTML = ''; 
    };
}
