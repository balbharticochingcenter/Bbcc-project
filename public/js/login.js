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
    const footerWhatsapp = document.getElementById('footer-whatsapp');
    const footerHelp = document.getElementById('footer-help');

    // Login Elements
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const closeLogin = document.getElementById('closeLogin');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    // Result Elements
    const studentResultBtn = document.getElementById('studentResultBtn');
    const mobileResultBtn = document.getElementById('mobileResultBtn');
    const resultModal = document.getElementById('resultModal');
    const closeResult = document.getElementById('closeResult'); // ✅ नया जोड़ा
    const searchStudentBtn = document.getElementById('searchStudentBtn');
    const searchStudentIdInput = document.getElementById('searchStudentId');
    const searchMobileInput = document.getElementById('searchMobile');
    const searchMessage = document.getElementById('searchMessage');
    const studentResultDisplay = document.getElementById('studentResultDisplay');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadJpgBtn = document.getElementById('downloadJpgBtn');

    // Registration Elements
    const regModal = document.getElementById('regModal');
    const regBtn = document.getElementById('studentRegBtn');
    const mobileRegBtn = document.getElementById('mobileRegBtn');
    const closeReg = document.getElementById('closeReg');
    const studentRegForm = document.getElementById('studentRegForm');
    const regPhotoInput = document.getElementById('regPhoto');

    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    // Search Tabs
    const searchTabs = document.querySelectorAll('.search-tab');
    const mobileInputGroup = document.getElementById('mobileInputGroup');

    // Variables
    let currentSlide = 0;
    let totalSlides = 0;
    let compressedPhotoBase64 = "";
    let currentSearchMode = 'id';

    // --- Initialize ---
    showLoader();

    // --- 1. Load System Settings ---
    async function loadSystemSettings() {
        try {
            const response = await fetch('/api/get-settings');
            const settings = await response.json();
            if (settings) {
                // Header Settings
                if (settings.logo) { 
                    headerLogo.src = settings.logo; 
                    headerLogo.style.display = 'block'; 
                }
                headerTitle.textContent = settings.title || 'BBCC Portal';
                headerSubtitle.textContent = settings.sub_title || 'Education for All';
                
                // Footer Settings
                footerContact.textContent = settings.contact || 'Chakdah Chowk, Madhubani';
                footerCall.textContent = settings.call_no || '+91 9971095964';
                footerGmail.textContent = settings.gmail || 'balbharticoaching.center@gmail.com';
                footerHelp.textContent = settings.help || '24/7 Support Available';
                
                // Social Links
                footerFacebook.href = settings.facebook || '#';
                footerYoutube.href = settings.youtube_link || '#';
                footerInstagram.href = settings.instagram || '#';
                footerTwitter.href = settings.twitter || '#';
                footerWhatsapp.href = `https://wa.me/${settings.call_no?.replace(/\D/g, '')}` || '#';
            }
        } catch (error) { 
            console.error('Settings load error:', error); 
        } finally { 
            hideLoader(); 
        }
    }

    // --- 2. Mobile Menu ---
    if (mobileMenuBtn) {
        mobileMenuBtn.onclick = () => {
            mobileMenu.classList.toggle('active');
            mobileMenuBtn.innerHTML = mobileMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        };
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });

    // --- 3. Modal Controls ---
    function openLoginModal() {
        loginModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('userId').focus();
    }

    function openRegistrationModal() {
        regModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setDefaultDate();
    }

    function openResultModal() {
        resultModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setSearchMode('id');
        // Reset form
        document.getElementById('searchStudentId').value = '';
        document.getElementById('searchMobile').value = '';
        document.getElementById('searchMessage').textContent = '';
        studentResultDisplay.style.display = 'none';
    }

    // Button Event Listeners
    if (loginBtn) loginBtn.onclick = openLoginModal;
    if (regBtn) regBtn.onclick = openRegistrationModal;
    if (studentResultBtn) studentResultBtn.onclick = openResultModal;

    // Mobile menu buttons
    if (mobileLoginBtn) mobileLoginBtn.onclick = () => {
        openLoginModal();
        mobileMenu.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    };
    
    if (mobileRegBtn) mobileRegBtn.onclick = () => {
        openRegistrationModal();
        mobileMenu.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    };
    
    if (mobileResultBtn) mobileResultBtn.onclick = () => {
        openResultModal();
        mobileMenu.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    };

    // Close buttons
    if (closeLogin) closeLogin.onclick = () => {
        loginModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    if (closeReg) closeReg.onclick = () => {
        regModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    if (closeResult) closeResult.onclick = () => {
        resultModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // Outside click to close modals
    window.onclick = (event) => {
        if (event.target == regModal) {
            regModal.style.display = "none";
            document.body.style.overflow = 'auto';
        }
        if (event.target == resultModal) {
            resultModal.style.display = "none";
            document.body.style.overflow = 'auto';
        }
        if (event.target == loginModal) {
            loginModal.style.display = "none";
            document.body.style.overflow = 'auto';
        }
        document.querySelectorAll('.vip-popup').forEach(popup => {
            if (event.target == popup) {
                popup.style.display = "none";
                document.body.style.overflow = 'auto';
            }
        });
    };

    // --- 4. Login Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();

            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;
            let loginType = '';
            let userData = null;

            try {
                // Check Admin
                const adminRes = await fetch('/api/get-admin-profile');
                const admin = await adminRes.json();
                if (admin && admin.admin_userid === userId && admin.admin_pass === password) {
                    loginType = 'admin';
                    userData = admin;
                }

                // Check Teacher/Student if not admin
                if (!loginType) {
                    const [tRes, sRes] = await Promise.all([
                        fetch('/api/get-teachers'),
                        fetch('/api/get-students')
                    ]);

                    const teachers = await tRes.json();
                    const students = await sRes.json();

                    // Check Teacher
                    const teacher = teachers.find(t => t.teacher_id === userId && t.pass === password);
                    if (teacher) {
                        loginType = 'teacher';
                        userData = teacher;
                    } 
                    // Check Student
                    else {
                        const student = students.find(
                            s => s.student_id === userId && s.pass === password
                        );

                        if (student) {
                            // Fee Approval Check
                            if (!student.fees || student.fees === "0" || student.fees === "pending") {
                                hideLoader();
                                showSmoothAlert(
                                    "⚠️ Admission Approval Pending\nPlease complete fee payment or contact administration.",
                                    'warning'
                                );
                                localStorage.removeItem("studentId");
                                setTimeout(() => {
                                    loginModal.style.display = 'none';
                                }, 3000);
                                return;
                            }

                            loginType = 'student';
                            userData = student;
                            localStorage.setItem("studentId", student.student_id);
                        }
                    }
                }

                // Redirect based on login type
                hideLoader();
                
                if (loginType === 'admin') {
                    localStorage.setItem("isAdminLoggedIn", "true");
                    localStorage.setItem("adminData", JSON.stringify(userData));
                    window.location.replace('/admin');
                    return;
                }

                if (loginType === 'teacher') {
                    localStorage.setItem("teacherId", userData.teacher_id);
                    localStorage.setItem("teacherData", JSON.stringify(userData));
                    window.location.replace('/teacher');
                    return;
                }

                if (loginType === 'student') {
                    localStorage.setItem("studentData", JSON.stringify(userData));
                    window.location.replace('/student.html');
                    return;
                }

                // Invalid credentials
                loginMessage.textContent = "❌ Invalid User ID or Password";
                loginMessage.style.color = "var(--danger)";
                shakeElement(loginForm);

            } catch (err) {
                hideLoader();
                loginMessage.textContent = "⚠️ Server Error. Please try again.";
                loginMessage.style.color = "var(--warning)";
                console.error('Login error:', err);
            }
        });
    }

    // Password visibility toggle
    function togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.toggle-password i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    // Attach toggle function to eye icon
    document.querySelector('.toggle-password')?.addEventListener('click', togglePassword);

    // --- 5. Result Search Logic ---
    function setSearchMode(mode) {
        currentSearchMode = mode;
        
        // Update active tab
        searchTabs.forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.search-tab[onclick*="${mode}"]`).classList.add('active');
        
        // Update label and placeholder
        const label = document.querySelector('#searchLabel');
        const input = document.getElementById('searchStudentId');
        
        switch(mode) {
            case 'id':
                label.textContent = 'Student ID';
                input.placeholder = 'Enter Student ID (e.g., STU24001)';
                mobileInputGroup.style.display = 'none';
                break;
            case 'name':
                label.textContent = 'Student Name';
                input.placeholder = 'Enter Full Name';
                mobileInputGroup.style.display = 'none';
                break;
            case 'mobile':
                label.textContent = 'Student/Parent Mobile';
                input.placeholder = 'Enter Mobile Number';
                mobileInputGroup.style.display = 'block';
                break;
        }
    }

    // Initialize search mode
    setSearchMode('id');

    if (searchStudentBtn) {
        searchStudentBtn.onclick = async () => {
            const searchTerm = document.getElementById('searchStudentId').value.trim();
            const mobileNum = document.getElementById('searchMobile').value.trim();
            
            // Validation
            if (!searchTerm) {
                showSearchError("Please enter search term!");
                return;
            }
            
            if (currentSearchMode === 'mobile' && !mobileNum) {
                showSearchError("Mobile number is required!");
                return;
            }

            showLoader();
            searchMessage.textContent = "🔍 Searching...";
            searchMessage.style.color = "var(--primary)";

            try {
                const searchData = {
                    searchMode: currentSearchMode,
                    searchTerm: searchTerm
                };
                
                if (currentSearchMode === 'mobile') {
                    searchData.mobileNumber = mobileNum;
                }

                const res = await fetch('/api/search-student-result', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(searchData)
                });
                
                const data = await res.json();

                hideLoader();
                
                if (data.success) {
                    displayStudentResult(data.student);
                    searchMessage.textContent = "✅ Result found!";
                    searchMessage.style.color = "var(--success)";
                } else {
                    showSearchError(data.message || "Student not found!");
                    studentResultDisplay.style.display = 'none';
                }
            } catch (err) {
                hideLoader();
                showSearchError("❌ Connection Error! Please try again.");
                console.error('Search error:', err);
            }
        };
    }

    function displayStudentResult(student) {
        studentResultDisplay.style.display = 'block';
        
        // Fill student details
        document.getElementById('result-student-name').textContent = student.student_name;
        document.getElementById('result-student-id').textContent = student.student_id;
        document.getElementById('result-parent-name').textContent = student.parent_name;
        document.getElementById('result-student-class').textContent = student.student_class;
        
        // Fill exam details
        document.getElementById('result-exam-date').textContent = formatDate(student.exam_date);
        document.getElementById('result-exam-subject').textContent = student.exam_subject || "All Subjects";
        document.getElementById('result-total-marks').textContent = student.total_marks;
        document.getElementById('result-obtained-marks').textContent = student.obtained_marks;
        
        // Calculate percentage
        const obtained = parseFloat(student.obtained_marks) || 0;
        const total = parseFloat(student.total_marks) || 0;
        const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : "0";
        document.getElementById('result-percentage').textContent = percentage;
        
        // Set photo
        const photoSrc = student.photo || 'https://via.placeholder.com/120x140/4a6fff/ffffff?text=No+Photo';
        document.getElementById('result-student-photo').src = photoSrc;
        
        // Setup download buttons
        setupDownloadEvents(student.student_id);
        
        // Scroll to result
        studentResultDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function setupDownloadEvents(studentId) {
        const element = studentResultDisplay;
        const downloadBtns = element.querySelector('.download-buttons');

        // PDF Download
        if (document.getElementById('downloadPdfBtn')) {
            document.getElementById('downloadPdfBtn').onclick = async () => {
                downloadBtns.style.display = 'none';
                
                try {
                    const { jsPDF } = window.jspdf;
                    
                    html2canvas(element, { 
                        scale: 2, 
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    }).then(canvas => {
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                        
                        // Add background color
                        pdf.setFillColor(255, 255, 255);
                        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
                        
                        // Add image
                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 10, pdfWidth, pdfHeight);
                        
                        // Add watermark
                        pdf.setFontSize(10);
                        pdf.setTextColor(200, 200, 200);
                        pdf.text('BBCC Madhubani', pdfWidth/2, pdfHeight - 10, { align: 'center' });
                        
                        pdf.save(`BBCC_Result_${studentId}.pdf`);
                        showSmoothAlert("✅ PDF Downloaded Successfully!", 'success');
                    });
                } catch (error) {
                    console.error('PDF generation error:', error);
                    showSmoothAlert("❌ PDF download failed!", 'error');
                } finally {
                    downloadBtns.style.display = 'flex';
                }
            };
        }

        // JPG Download
        if (document.getElementById('downloadJpgBtn')) {
            document.getElementById('downloadJpgBtn').onclick = async () => {
                downloadBtns.style.display = 'none';
                
                try {
                    html2canvas(element, { 
                        scale: 2,
                        backgroundColor: '#ffffff'
                    }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `BBCC_Result_${studentId}.jpg`;
                        link.href = canvas.toDataURL("image/jpeg", 0.9);
                        link.click();
                        showSmoothAlert("✅ Image Downloaded Successfully!", 'success');
                    });
                } catch (error) {
                    console.error('Image generation error:', error);
                    showSmoothAlert("❌ Image download failed!", 'error');
                } finally {
                    downloadBtns.style.display = 'flex';
                }
            };
        }
    }

    // --- 6. Registration Logic ---
    function setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('regDate').value = today;
        document.getElementById('regDate').min = today;
    }

    // Image compression
    async function handleImageCompression(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.match('image.*')) {
                showSmoothAlert("Please select an image file!", 'warning');
                reject('Not an image');
                return;
            }

            if (file.size > 1024 * 1024) { // 1MB limit
                showSmoothAlert("Image too large! Max 1MB allowed.", 'warning');
                reject('File too large');
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG with quality 0.7
                    compressedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    
                    // Show preview
                    document.getElementById('photoPreview').src = compressedPhotoBase64;
                    document.getElementById('photoPreviewContainer').style.display = 'block';
                    
                    // Show size
                    const size = Math.round((compressedPhotoBase64.length * 3/4) / 1024);
                    document.getElementById('photoSizeLabel').innerText = `Size: ${size}KB (Compressed)`;
                    
                    resolve();
                };
                
                img.onerror = () => {
                    reject('Image load error');
                };
            };
            
            reader.onerror = () => {
                reject('File read error');
            };
        });
    }

    // Photo input change
    if (regPhotoInput) {
        regPhotoInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                try {
                    await handleImageCompression(e.target.files[0]);
                } catch (error) {
                    console.error('Image compression error:', error);
                    regPhotoInput.value = '';
                    document.getElementById('photoPreviewContainer').style.display = 'none';
                }
            }
        };
    }

    // Registration form submission
    if (studentRegForm) {
        studentRegForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Generate unique ID
            const date = new Date();
            const datePart = date.getFullYear().toString().slice(2) + 
                            (date.getMonth() + 1).toString().padStart(2, '0');
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            const generatedId = "STU" + datePart + randomPart;

            // Get form values
            const formData = {
                student_name: document.getElementById('regName').value.trim(),
                parent_name: document.getElementById('regParent').value.trim(),
                mobile: document.getElementById('regMobile').value.trim(),
                parent_mobile: document.getElementById('regParentMobile').value.trim(),
                student_class: document.getElementById('regClassSelect').value,
                joining_date: document.getElementById('regDate').value,
                student_id: document.getElementById('regId').value.trim() || generatedId,
                pass: document.getElementById('regPass').value || "123456",
                photo: compressedPhotoBase64 || "",
                fees: "0",
                status: "pending"
            };

            // Validation
            if (!formData.student_class) {
                showSmoothAlert("Please select a class!", 'warning');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
                showSmoothAlert("Invalid mobile number! Must be 10 digits.", 'warning');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            try {
                showLoader();
                const response = await fetch('/api/student-reg', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                hideLoader();
                
                if (result.success) {
                    showSmoothAlert(
                        `✅ Registration Successful!\nStudent ID: ${result.student_id}\nPassword: ${formData.pass}`,
                        'success'
                    );
                    
                    // Reset form
                    studentRegForm.reset();
                    compressedPhotoBase64 = "";
                    document.getElementById('photoPreviewContainer').style.display = 'none';
                    regModal.style.display = "none";
                    
                    // Auto-open admission popup
                    setTimeout(() => {
                        openVip('vipAdmission');
                    }, 1000);
                } else {
                    showSmoothAlert(`❌ Registration Failed: ${result.error}`, 'error');
                }
            } catch (err) {
                hideLoader();
                showSmoothAlert("❌ Server Error! Please try again.", 'error');
                console.error('Registration error:', err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // --- 7. Slider Functions ---
    async function fetchSliderPhotos() {
        try {
            const response = await fetch('/api/get-sliders');
            const photos = await response.json();
            const wrapper = document.getElementById('dynamic-slider');
            const dotsContainer = document.getElementById('sliderDots');
            
            if (photos.length > 0) {
                totalSlides = photos.length;
                wrapper.innerHTML = photos.map(p => 
                    `<img src="${p.photo}" alt="BBCC Slider" loading="lazy">`
                ).join('');
                
                // Create dots
                dotsContainer.innerHTML = '';
                for (let i = 0; i < totalSlides; i++) {
                    const dot = document.createElement('span');
                    dot.onclick = () => goToSlide(i);
                    dotsContainer.appendChild(dot);
                }
                updateDots();
                
                // Auto slide
                setInterval(() => moveSlider(1), 5000);
            } else {
                wrapper.innerHTML = `
                    <div class="slide-placeholder">
                        <i class="fas fa-school"></i>
                        <p>Welcome to BBCC Portal</p>
                    </div>
                `;
            }
        } catch (err) { 
            console.error("Slider Load Error:", err); 
        }
    }

    function moveSlider(direction) {
        currentSlide += direction;
        if (currentSlide >= totalSlides) currentSlide = 0;
        if (currentSlide < 0) currentSlide = totalSlides - 1;
        
        const wrapper = document.getElementById('dynamic-slider');
        wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        updateDots();
    }

    function goToSlide(index) {
        currentSlide = index;
        const wrapper = document.getElementById('dynamic-slider');
        wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        updateDots();
    }

    function updateDots() {
        const dots = document.querySelectorAll('#sliderDots span');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // --- 8. Teacher Ring ---
    async function loadTeacherRing() {
        try {
            const response = await fetch('/api/get-teachers');
            const teachers = await response.json();
            const ringContainer = document.getElementById('teacher-ring');
            
            if (teachers.length > 0) {
                ringContainer.innerHTML = teachers.map(teacher => `
                    <div class="teacher-card" onclick="viewTeacher('${teacher.teacher_id}')">
                        <div class="ring-wrapper">
                            <img src="${teacher.photo || 'https://via.placeholder.com/150/4a6fff/ffffff?text=Teacher'}" 
                                 alt="${teacher.teacher_name}" 
                                 loading="lazy">
                        </div>
                        <p>${teacher.teacher_name}</p>
                        <small>${teacher.subject || 'Expert Teacher'}</small>
                    </div>
                `).join('');
                
                // Duplicate for infinite scroll effect
                ringContainer.innerHTML += ringContainer.innerHTML;
            } else {
                ringContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-chalkboard-teacher fa-3x"></i>
                        <p>Teachers information coming soon</p>
                    </div>
                `;
            }
        } catch (err) { 
            console.error("Teacher Ring Error:", err); 
        }
    }

    // Teacher ring scroll control
    function scrollRing(direction) {
        const ring = document.getElementById('teacher-ring');
        const scrollAmount = 250;
        ring.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }

    // --- 9. Utility Functions ---
    function showLoader() {
        if (loader) loader.style.display = 'flex';
    }

    function hideLoader() {
        if (loader) loader.style.display = 'none';
    }

    function showSmoothAlert(message, type = 'info') {
        const alertBox = document.getElementById('alertBox');
        
        // Set type-based styling
        alertBox.style.borderLeftColor = 
            type === 'success' ? 'var(--success)' :
            type === 'warning' ? 'var(--warning)' :
            type === 'error' ? 'var(--danger)' : 'var(--primary)';
        
        alertBox.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                               type === 'warning' ? 'exclamation-triangle' : 
                               type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        alertBox.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 5000);
    }

    function showSearchError(message) {
        searchMessage.textContent = message;
        searchMessage.style.color = "var(--danger)";
        shakeElement(searchMessage);
    }

    function shakeElement(element) {
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'shake 0.5s';
        }, 10);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // --- 10. Initialize Everything ---
    await loadSystemSettings();
    await fetchSliderPhotos();
    await loadTeacherRing();
    
    // Auto-open admission popup after 3 seconds
    setTimeout(() => {
        if (!localStorage.getItem('admissionPopupShown')) {
            openVip('vipAdmission');
            localStorage.setItem('admissionPopupShown', 'true');
        }
    }, 3000);
    
    // Add shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
});

// ===== GLOBAL FUNCTIONS =====
function openVip(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeVip(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showLang(pid, lang) {
    // Hide all language contents
    document.querySelectorAll(`#${pid} .lang-content`).forEach(e => {
        e.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll(`#${pid} .lang-tabs button`).forEach(b => {
        b.classList.remove('active');
    });
    
    // Show selected language content
    document.getElementById(`${pid}-${lang}`).classList.add('active');
    
    // Activate selected button
    document.getElementById(`${pid}-btn-${lang}`).classList.add('active');
}

function viewTeacher(teacherId) {
    showSmoothAlert(`Viewing teacher profile: ${teacherId}`, 'info');
    // You can implement detailed teacher view here
}

function showForgotPassword() {
    const email = prompt("Enter your registered email ID:");
    if (email) {
        showSmoothAlert(`Password reset link sent to ${email}`, 'info');
    }
}

// Close VIP popups with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.vip-popup, .modal').forEach(el => {
            el.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});

// Additional global functions
function openRegistration() {
    const regModal = document.getElementById('regModal');
    if (regModal) {
        regModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('regDate').value = today;
    }
}

// Add missing global functions for slider and ring
function moveSlider(direction) {
    const wrapper = document.getElementById('dynamic-slider');
    if (!wrapper) return;
    
    const slides = wrapper.querySelectorAll('img');
    if (slides.length === 0) return;
    
    let currentSlide = parseInt(wrapper.dataset.currentSlide || 0);
    currentSlide += direction;
    
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    
    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    wrapper.dataset.currentSlide = currentSlide;
}

function scrollRing(direction) {
    const ring = document.getElementById('teacher-ring');
    if (!ring) return;
    
    const scrollAmount = 250;
    ring.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}
