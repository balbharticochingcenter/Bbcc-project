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

    // --- 2. Login Logic ---
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

            if (loginType === 'admin') window.location.href = '/admin';
            else if (loginType) alert(`Login Successful as ${loginType.toUpperCase()}!`);
            else loginMessage.textContent = "❌ Invalid ID or Password!";
        } catch (err) { loginMessage.textContent = "❌ Server Error!"; }
        finally { loader.style.display = 'none'; }
    });

    // --- 3. Result Modal & Search Logic ---
    studentResultBtn.onclick = () => resultModal.style.display = 'flex';
    
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.onclick = () => {
            resultModal.style.display = 'none';
            regModal.style.display = 'none';
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

    // --- 4. Registration Logic (Optimized) ---
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
        } catch (err) {
            console.error("Reg Error:", err);
            alert('❌ Network Error!');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Close on outside click
    window.onclick = (event) => {
        if (event.target == regModal) regModal.style.display = "none";
        if (event.target == resultModal) resultModal.style.display = "none";
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

    loadSystemSettings();
});
