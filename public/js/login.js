document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const regPhotoInput = document.getElementById('regPhoto');
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

    // Login Elements
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

    // --- Show loader initially ---
    loader.style.display = 'flex';

    // --- 1. Load System Settings ---
    async function loadSystemSettings() {
        try {
            const response = await fetch('/api/get-settings');
            const settings = await response.json();
            
            if (settings) {
                // Set logo and text
                if (settings.logo) {
                    headerLogo.src = settings.logo;
                    headerLogo.style.display = 'block';
                    headerLogo.onerror = () => {
                        headerLogo.src = 'https://via.placeholder.com/80x80/4a90e2/ffffff?text=BBCC';
                    };
                }
                
                headerTitle.textContent = settings.title || 'BBCC Portal';
                headerSubtitle.textContent = settings.sub_title || 'Education for All';
                
                // Set footer info
                footerContact.textContent = settings.contact || 'Chakdah Chowk, Madhubani';
                footerCall.textContent = settings.call_no || '+91 9971095964';
                footerGmail.textContent = settings.gmail || 'balbharticoaching.center@gmail.com';
                footerHelp.textContent = settings.help || 'For any query, feel free to contact us';
                
                // Set social links
                if (settings.facebook) footerFacebook.href = settings.facebook;
                if (settings.youtube_link) footerYoutube.href = settings.youtube_link;
                if (settings.instagram) footerInstagram.href = settings.instagram;
                if (settings.twitter) footerTwitter.href = settings.twitter;
                
                // Hide social links if not available
                if (!settings.facebook) footerFacebook.style.display = 'none';
                if (!settings.youtube_link) footerYoutube.style.display = 'none';
                if (!settings.instagram) footerInstagram.style.display = 'none';
                if (!settings.twitter) footerTwitter.style.display = 'none';
            }
        } catch (error) {
            console.error('Settings load error:', error);
            showSmoothAlert('⚠️ Settings loading failed. Using default values.');
            
            // Set default values
            headerTitle.textContent = 'BBCC Portal';
            headerSubtitle.textContent = 'Bal Bharti Coaching Center';
            footerContact.textContent = 'Chakdah Chowk, Madhubani';
            footerCall.textContent = '+91 9971095964';
            footerGmail.textContent = 'balbharticoaching.center@gmail.com';
        } finally {
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }

    // --- 2. Login Logic ---
    if (loginBtn) {
        loginBtn.onclick = () => {
            loginModal.style.display = 'flex';
            document.getElementById('userId').focus();
        };
    }

    if (closeLogin) {
        closeLogin.onclick = () => {
            loginModal.style.display = 'none';
            loginForm.reset();
            loginMessage.textContent = '';
        };
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        const userId = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value;
        let loginType = '';

        try {
            // === ADMIN CHECK ===
            const adminRes = await fetch('/api/get-admin-profile');
            if (adminRes.ok) {
                const admin = await adminRes.json();
                if (admin && admin.admin_userid === userId && admin.admin_pass === password) {
                    loginType = 'admin';
                }
            }

            // === TEACHER / STUDENT CHECK ===
            if (!loginType) {
                const [tRes, sRes] = await Promise.all([
                    fetch('/api/get-teachers'),
                    fetch('/api/get-students')
                ]);

                const teachers = await tRes.json();
                const students = await sRes.json();

                // Teacher check
                const teacher = teachers.find(t => t.teacher_id === userId && t.pass === password);
                if (teacher) {
                    loginType = 'teacher';
                } else {
                    // Student check
                    const student = students.find(
                        s => s.student_id === userId && s.pass === password
                    );

                    if (student) {
                        // 🔴 APPROVAL / FEES CHECK
                        const notApproved = !student.fees || student.fees === "0";

                        if (notApproved) {
                            showSmoothAlert(
                                "⚠️ आप अभी अप्रूव नहीं हुए हैं।\nफीस सत्यापन लंबित है।"
                            );
                            localStorage.removeItem("studentId");
                            
                            setTimeout(() => {
                                loginModal.style.display = 'none';
                            }, 3000);
                            
                            submitBtn.innerHTML = originalText;
                            submitBtn.disabled = false;
                            return;
                        }

                        // ✅ APPROVED STUDENT
                        loginType = 'student';
                        localStorage.setItem("studentId", student.student_id);
                    }
                }
            }

            // === REDIRECTION ===
            if (loginType === 'admin') {
                localStorage.setItem("isAdminLoggedIn", "true");
                showSmoothAlert("✅ Admin login successful! Redirecting...");
                setTimeout(() => {
                    window.location.replace('/admin');
                }, 1000);
            } else if (loginType === 'teacher') {
                showSmoothAlert("✅ Teacher login successful! Redirecting...");
                setTimeout(() => {
                    window.location.replace('/teacher');
                }, 1000);
            } else if (loginType === 'student') {
                showSmoothAlert("✅ Student login successful! Redirecting...");
                setTimeout(() => {
                    window.location.replace('/student.html');
                }, 1000);
            } else {
                loginMessage.textContent = "❌ गलत User ID या Password";
                document.getElementById('password').value = '';
                document.getElementById('userId').focus();
            }

        } catch (err) {
            console.error('Login error:', err);
            loginMessage.textContent = "⚠️ Server Error. Please try again.";
            showSmoothAlert("⚠️ Connection error. Please check your internet.");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // --- 3. Result Modal & Search Logic ---
    if (studentResultBtn) {
        studentResultBtn.onclick = () => {
            resultModal.style.display = 'flex';
            searchStudentIdInput.focus();
        };
    }
    
    // Close buttons for all modals
    document.querySelectorAll('.close-button').forEach(btn => {
        if (!btn.id) { // Skip the ones with specific IDs
            btn.onclick = (e) => {
                e.target.closest('.modal').style.display = 'none';
            };
        }
    });

    // Smart Search Logic
    searchStudentBtn.onclick = async () => {
        const nameOrId = searchStudentIdInput.value.trim();
        const mobileNum = document.getElementById('searchMobile').value.trim();
        
        if (!nameOrId) {
            searchMessage.textContent = "❌ ID ya Name bharna zaroori hai!";
            searchMessage.style.color = "var(--danger-color)";
            searchStudentIdInput.focus();
            return;
        }
        
        const originalText = searchStudentBtn.innerHTML;
        searchStudentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        searchStudentBtn.disabled = true;
        searchMessage.textContent = "🔍 Searching...";
        searchMessage.style.color = "var(--warning-color)";
        
        try {
            const res = await fetch('/api/search-student-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    searchTerm: nameOrId,
                    mobileSearch: mobileNum
                })
            });
            
            if (!res.ok) throw new Error('Network response was not ok');
            
            const data = await res.json();

            if (data.success) {
                const s = data.student;
                searchMessage.textContent = "✅ Result found!";
                searchMessage.style.color = "var(--success-color)";
                studentResultDisplay.style.display = 'block';

                // Fill Data
                document.getElementById('result-student-name').textContent = s.student_name || 'N/A';
                document.getElementById('result-student-id').textContent = s.student_id || 'N/A';
                document.getElementById('result-parent-name').textContent = s.parent_name || 'N/A';
                document.getElementById('result-student-class').textContent = s.student_class || 'N/A';
                document.getElementById('result-exam-date').textContent = s.exam_date || 'N/A';
                document.getElementById('result-exam-subject').textContent = s.exam_subject || "General";
                document.getElementById('result-total-marks').textContent = s.total_marks || '0';
                document.getElementById('result-obtained-marks').textContent = s.obtained_marks || '0';

                const obtained = parseFloat(s.obtained_marks) || 0;
                const total = parseFloat(s.total_marks) || 0;
                const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : "0";
                document.getElementById('result-percentage').textContent = percentage;

                const photoUrl = s.photo || 'https://via.placeholder.com/120x140/4a90e2/ffffff?text=Student';
                document.getElementById('result-student-photo').src = photoUrl;
                
                // Setup download events
                setupDownloadEvents(s.student_id || 'unknown');
                
                // Scroll to result
                studentResultDisplay.scrollIntoView({ behavior: 'smooth' });
            } else {
                searchMessage.textContent = data.message || "❌ Student not found!";
                searchMessage.style.color = "var(--danger-color)";
                studentResultDisplay.style.display = 'none';
            }
        } catch (err) {
            console.error('Search error:', err);
            searchMessage.textContent = "❌ Connection Error! Please try again.";
            searchMessage.style.color = "var(--danger-color)";
            studentResultDisplay.style.display = 'none';
        } finally {
            searchStudentBtn.innerHTML = originalText;
            searchStudentBtn.disabled = false;
        }
    };

    function setupDownloadEvents(stuId) {
        const element = studentResultDisplay;
        const btns = element.querySelector('.download-buttons');

        if (downloadPdfBtn) {
            downloadPdfBtn.onclick = async () => {
                const originalText = downloadPdfBtn.innerHTML;
                downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
                downloadPdfBtn.disabled = true;
                btns.style.display = 'none';
                
                try {
                    await html2canvasPromise(element);
                    
                    const { jsPDF } = window.jspdf;
                    html2canvas(element, { 
                        scale: 2, 
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    }).then(canvas => {
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                        
                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 10, pdfWidth, pdfHeight);
                        pdf.save(`BBCC_Result_${stuId}.pdf`);
                        
                        showSmoothAlert("✅ PDF downloaded successfully!");
                    });
                } catch (err) {
                    console.error('PDF generation error:', err);
                    showSmoothAlert("❌ PDF download failed!");
                } finally {
                    btns.style.display = 'flex';
                    downloadPdfBtn.innerHTML = originalText;
                    downloadPdfBtn.disabled = false;
                }
            };
        }

        if (downloadJpgBtn) {
            downloadJpgBtn.onclick = async () => {
                const originalText = downloadJpgBtn.innerHTML;
                downloadJpgBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
                downloadJpgBtn.disabled = true;
                btns.style.display = 'none';
                
                try {
                    await html2canvasPromise(element);
                    
                    html2canvas(element, { 
                        scale: 2,
                        backgroundColor: '#ffffff'
                    }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `BBCC_Result_${stuId}.jpg`;
                        link.href = canvas.toDataURL("image/jpeg", 0.9);
                        link.click();
                        
                        showSmoothAlert("✅ Image downloaded successfully!");
                    });
                } catch (err) {
                    console.error('Image generation error:', err);
                    showSmoothAlert("❌ Image download failed!");
                } finally {
                    btns.style.display = 'flex';
                    downloadJpgBtn.innerHTML = originalText;
                    downloadJpgBtn.disabled = false;
                }
            };
        }
    }

    // Promise wrapper for html2canvas
    function html2canvasPromise(element) {
        return new Promise((resolve, reject) => {
            try {
                html2canvas(element, { 
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                }).then(resolve).catch(reject);
            } catch (err) {
                reject(err);
            }
        });
    }

    // --- 4. Registration Logic ---
    if (regBtn) {
        regBtn.onclick = () => {
            regModal.style.display = "block";
            document.getElementById('regName').focus();
            
            // Set today's date as default
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('regDate').value = today;
        };
    }
    
    if (closeReg) {
        closeReg.onclick = () => {
            regModal.style.display = "none";
            studentRegForm.reset();
            document.getElementById('photoPreviewContainer').style.display = 'none';
        };
    }

    let compressedPhotoBase64 = "";

    // Image compression function
    async function handleImageCompression(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.match('image.*')) {
                showSmoothAlert("❌ Please select an image file");
                reject("Not an image file");
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showSmoothAlert("❌ Image size should be less than 5MB");
                reject("File too large");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxDimension = 300;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxDimension) {
                            height = (height * maxDimension) / width;
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width = (width * maxDimension) / height;
                            height = maxDimension;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    compressedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    
                    // Show preview
                    document.getElementById('photoPreview').src = compressedPhotoBase64;
                    document.getElementById('photoPreviewContainer').style.display = 'block';
                    
                    const size = Math.round((compressedPhotoBase64.length * 3/4) / 1024);
                    document.getElementById('photoSizeLabel').innerText = `Size: ~${size} KB`;
                    document.getElementById('photoSizeLabel').style.color = size > 100 ? 'var(--danger-color)' : 'var(--success-color)';
                    
                    resolve();
                };
                img.onerror = () => {
                    showSmoothAlert("❌ Error loading image");
                    reject("Image load error");
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                showSmoothAlert("❌ Error reading file");
                reject("File read error");
            };
            reader.readAsDataURL(file);
        });
    }

    // Photo input change event
    if (regPhotoInput) {
        regPhotoInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                try {
                    await handleImageCompression(e.target.files[0]);
                } catch (err) {
                    console.error("Image compression error:", err);
                }
            }
        };
    }

    // Registration form submission
    studentRegForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = studentRegForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        // Generate Unique ID
        const date = new Date();
        const datePart = `${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const generatedId = `STU${datePart}${randomPart}`;

        const selectedClass = document.getElementById('regClassSelect').value;
        if (!selectedClass) {
            showSmoothAlert("❌ Please select a class");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Validate mobile numbers
        const mobile = document.getElementById('regMobile').value.trim();
        const parentMobile = document.getElementById('regParentMobile').value.trim();
        
        if (mobile && !/^\d{10}$/.test(mobile)) {
            showSmoothAlert("❌ Please enter a valid 10-digit mobile number");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        const formData = {
            student_name: document.getElementById('regName').value.trim(),
            parent_name: document.getElementById('regParent').value.trim(),
            mobile: mobile,
            parent_mobile: parentMobile,
            student_class: selectedClass,
            joining_date: document.getElementById('regDate').value,
            student_id: generatedId,
            pass: document.getElementById('regPass').value || "123456",
            photo: compressedPhotoBase64 || "",
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
                showSmoothAlert(`✅ Registration successful! Student ID: ${result.student_id}`);
                regModal.style.display = "none";
                studentRegForm.reset();
                compressedPhotoBase64 = "";
                document.getElementById('photoPreviewContainer').style.display = 'none';
            } else {
                showSmoothAlert(`❌ Error: ${result.error || 'Registration failed'}`);
            }
        } catch (err) {
            console.error('Registration error:', err);
            showSmoothAlert("❌ Server connection failed! Please try again.");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Close modals on outside click
    window.onclick = (event) => {
        if (event.target == regModal) regModal.style.display = "none";
        if (event.target == resultModal) resultModal.style.display = "none";
        if (event.target == loginModal) loginModal.style.display = "none";
        
        const classDetailModal = document.getElementById('classDetailModal');
        if (classDetailModal && event.target == classDetailModal) {
            classDetailModal.style.display = "none";
        }
    };

    // --- 5. Slider Functions ---
    let currentSlide = 0;
    let totalSlides = 0;
    let sliderInterval;

    async function fetchSliderPhotos() {
        try {
            const response = await fetch('/api/get-sliders');
            const photos = await response.json();
            const wrapper = document.getElementById('dynamic-slider');
            const indicators = document.getElementById('sliderIndicators');
            
            if (photos && photos.length > 0) {
                totalSlides = photos.length;
                
                // Create slides
                wrapper.innerHTML = photos.map(p => 
                    `<img src="${p.photo}" alt="Slider" loading="lazy" onerror="this.src='https://via.placeholder.com/1200x400/1a1a2e/4a90e2?text=BBCC+Slide'">`
                ).join('');
                
                // Create indicators
                indicators.innerHTML = Array.from({length: totalSlides}, (_, i) => 
                    `<span class="${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`
                ).join('');
                
                // Start auto-slide
                clearInterval(sliderInterval);
                sliderInterval = setInterval(() => moveSlider(1), 5000);
            } else {
                wrapper.innerHTML = `
                    <div class="slide-placeholder">
                        <i class="fas fa-images"></i>
                        <p>Welcome to BBCC Portal</p>
                    </div>
                `;
                indicators.innerHTML = '';
            }
        } catch (err) {
            console.error("Slider Load Error:", err);
            const wrapper = document.getElementById('dynamic-slider');
            wrapper.innerHTML = `
                <div class="slide-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Slider loading failed</p>
                </div>
            `;
        }
    }

    function moveSlider(direction) {
        if (totalSlides === 0) return;
        
        currentSlide += direction;
        if (currentSlide >= totalSlides) currentSlide = 0;
        if (currentSlide < 0) currentSlide = totalSlides - 1;
        
        updateSlider();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
    }

    function updateSlider() {
        const wrapper = document.getElementById('dynamic-slider');
        const indicators = document.querySelectorAll('#sliderIndicators span');
        
        if (wrapper) {
            wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
        
        // Reset auto-slide timer
        clearInterval(sliderInterval);
        sliderInterval = setInterval(() => moveSlider(1), 5000);
    }

    // --- 6. Teacher Ring ---
    async function loadTeacherRing() {
        try {
            const response = await fetch('/api/get-teachers');
            const teachers = await response.json();
            const ringContainer = document.getElementById('teacher-ring');
            
            if (teachers && teachers.length > 0) {
                // Create teacher cards
                const teacherCards = teachers.map(t => `
                    <div class="teacher-card" title="${t.teacher_name || 'Teacher'}">
                        <div class="ring-wrapper">
                            <img src="${t.photo || 'https://via.placeholder.com/150/1a1a2e/4a90e2?text=Teacher'}" 
                                 alt="${t.teacher_name || 'Teacher'}"
                                 loading="lazy"
                                 onerror="this.src='https://via.placeholder.com/150/1a1a2e/4a90e2?text=Teacher'">
                        </div>
                        <p>${t.teacher_name || 'Teacher'}</p>
                        ${t.subject ? `<small style="color: var(--secondary-color);">${t.subject}</small>` : ''}
                    </div>
                `).join('');
                
                // Duplicate for seamless loop
                ringContainer.innerHTML = teacherCards + teacherCards;
            } else {
                ringContainer.innerHTML = `
                    <div style="text-align: center; color: var(--text-color); padding: 50px;">
                        <i class="fas fa-users fa-3x" style="margin-bottom: 20px;"></i>
                        <p>Teacher information coming soon</p>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Teacher Ring Error:", err);
            const ringContainer = document.getElementById('teacher-ring');
            ringContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-color); padding: 50px;">
                    <i class="fas fa-exclamation-triangle fa-3x" style="margin-bottom: 20px;"></i>
                    <p>Failed to load teachers</p>
                </div>
            `;
        }
    }

    // --- 7. Alert Function ---
    function showSmoothAlert(msg) {
        const box = document.getElementById("alertBox");
        if (!box) return;
        
        box.innerText = msg;
        box.classList.add("show");
        
        // Different colors for different message types
        if (msg.includes("✅") || msg.includes("success")) {
            box.style.background = "linear-gradient(135deg, var(--success-color), #218838)";
        } else if (msg.includes("⚠️") || msg.includes("warning")) {
            box.style.background = "linear-gradient(135deg, var(--warning-color), #e0a800)";
        } else if (msg.includes("❌") || msg.includes("error")) {
            box.style.background = "linear-gradient(135deg, var(--danger-color), #c82333)";
        } else {
            box.style.background = "linear-gradient(135deg, var(--primary-color), #3a7bd5)";
        }
        
        setTimeout(() => {
            box.classList.remove("show");
        }, 3000);
    }

    // --- 8. VIP Functions ---
    window.openVip = function(id) {
        const popup = document.getElementById(id);
        if (popup) {
            popup.style.display = "block";
            document.body.style.overflow = "hidden";
        }
    };
    
    window.closeVip = function(id) {
        const popup = document.getElementById(id);
        if (popup) {
            popup.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };
    
    window.showLang = function(pid, lang) {
        // Hide all content for this popup
        document.querySelectorAll(`#${pid} .lang-content`).forEach(e => {
            e.classList.remove("active");
        });
        
        // Remove active class from all buttons
        document.querySelectorAll(`#${pid} .lang-tabs button`).forEach(b => {
            b.classList.remove("active");
        });
        
        // Show selected content
        const content = document.getElementById(`${pid}-${lang}`);
        const button = document.getElementById(`${pid}-btn-${lang}`);
        
        if (content) content.classList.add("active");
        if (button) button.classList.add("active");
    };
    
    // Auto-open admission popup after 3 seconds
   // setTimeout(() => {
 //       openVip('vipAdmission');
  //  }, 3000);

    // --- 9. Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Escape closes modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal, .vip-popup');
            modals.forEach(modal => {
                if (modal.style.display === 'flex' || modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
            document.body.style.overflow = "auto";
        }
        
        // Ctrl + R for registration
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (regBtn) regBtn.click();
        }
        
        // Ctrl + L for login
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            if (loginBtn) loginBtn.click();
        }
    });

    // --- 10. Initial Load ---
    await loadSystemSettings();
    await fetchSliderPhotos();
    await loadTeacherRing();
    
    // Show welcome message
    setTimeout(() => {
        showSmoothAlert("👋 Welcome to Bal Bharti Coaching Center Portal!");
    }, 1000);
});
