// ============================================
// STUDENT PROMOTION SYSTEM
// Move to Old Students & Create New Record
// ============================================

(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPromotionSystem);
    } else {
        initPromotionSystem();
    }
    
    async function initPromotionSystem() {
        // Check if promotion tab already exists
        if (document.getElementById('promotionPane')) return;
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;
        
        // Add Promotion Tab Button
        const tabContainer = document.querySelector('.tabs-container');
        if (tabContainer) {
            const promotionTabBtn = document.createElement('button');
            promotionTabBtn.className = 'tab-btn';
            promotionTabBtn.setAttribute('data-tab', 'promotion');
            promotionTabBtn.innerHTML = '<i class="fas fa-arrow-up"></i> Promotion';
            tabContainer.appendChild(promotionTabBtn);
        }
        
        // Add to bottom navigation
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            const promotionNavItem = document.createElement('div');
            promotionNavItem.className = 'bottom-nav-item';
            promotionNavItem.setAttribute('data-tab', 'promotion');
            promotionNavItem.innerHTML = '<i class="fas fa-arrow-up"></i><span>Promotion</span>';
            bottomNav.appendChild(promotionNavItem);
        }
        
        // Create Promotion Pane
        const tabContents = document.getElementById('tabContents');
        if (!tabContents) return;
        
        const promotionPaneHTML = `
            <div class="tab-pane" id="promotionPane" style="display:none">
                <div class="premium-card">
                    <div class="card-header" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
                        <h3><i class="fas fa-arrow-up"></i> Student Promotion</h3>
                        <span class="badge bg-white text-success">Promote students to next class</span>
                    </div>
                    <div class="card-body">
                        <!-- Search Student Section -->
                        <div class="form-section">
                            <div class="form-section-title"><i class="fas fa-search"></i> Find Student to Promote</div>
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label>Student ID</label>
                                    <input type="text" id="promotionStudentId" class="form-control" placeholder="Enter Student ID">
                                </div>
                                <div class="col-md-4">
                                    <label>OR Aadhar Number</label>
                                    <input type="text" id="promotionAadhar" class="form-control" placeholder="Enter Aadhar Number">
                                </div>
                                <div class="col-md-4 d-flex align-items-end">
                                    <button class="btn-primary-premium w-100" id="searchStudentBtn">
                                        <i class="fas fa-search"></i> Search Student
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Student Details Display -->
                        <div id="promotionStudentDetails" style="display:none;">
                            <div class="alert alert-success">
                                <i class="fas fa-user-check"></i> Student Found! Fill promotion details below.
                            </div>
                            
                            <!-- Current Student Info -->
                            <div class="form-section" style="background: #f0fdf4;">
                                <div class="form-section-title"><i class="fas fa-graduation-cap"></i> Current Student Information</div>
                                <div id="currentStudentInfo" class="row g-3"></div>
                            </div>
                            
                            <!-- Promotion Form -->
                            <div class="form-section">
                                <div class="form-section-title"><i class="fas fa-arrow-up"></i> Promotion Details</div>
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label>New Board *</label>
                                        <select id="promoteNewBoard" class="form-select" required>
                                            <option value="">Select Board</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="State Board">State Board</option>
                                            <option value="UP Board">UP Board</option>
                                            <option value="Bihar Board">Bihar Board</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label>New Class *</label>
                                        <select id="promoteNewClass" class="form-select" required>
                                            <option value="">Select Class</option>
                                            <option value="Class 1">Class 1</option>
                                            <option value="Class 2">Class 2</option>
                                            <option value="Class 3">Class 3</option>
                                            <option value="Class 4">Class 4</option>
                                            <option value="Class 5">Class 5</option>
                                            <option value="Class 6">Class 6</option>
                                            <option value="Class 7">Class 7</option>
                                            <option value="Class 8">Class 8</option>
                                            <option value="Class 9">Class 9</option>
                                            <option value="Class 10">Class 10</option>
                                            <option value="Class 11">Class 11</option>
                                            <option value="Class 12">Class 12</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label>New Monthly Fees (₹) *</label>
                                        <input type="number" id="promoteNewFees" class="form-control" placeholder="Enter new fees" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label>New Joining Date *</label>
                                        <input type="date" id="promoteJoiningDate" class="form-control" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label>Promotion Reason</label>
                                        <input type="text" id="promoteReason" class="form-control" placeholder="e.g., Class promotion, Board change">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="d-flex gap-3 justify-content-end mt-4">
                                <button class="btn-secondary-premium" id="cancelPromoteBtn">Cancel</button>
                                <button class="btn-primary-premium" id="confirmPromoteBtn" style="background: linear-gradient(135deg, #10b981, #059669);">
                                    <i class="fas fa-arrow-up"></i> Promote Student
                                </button>
                            </div>
                        </div>
                        
                        <!-- Old Students Section -->
                        <div class="mt-5">
                            <div class="form-section-title"><i class="fas fa-history"></i> Promoted Students History</div>
                            <div class="table-responsive-custom mt-3">
                                <table class="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Name</th>
                                            <th>Old Board/Class</th>
                                            <th>New Board/Class</th>
                                            <th>Promoted Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="promotedHistoryList">
                                        <tr><td colspan="6" class="text-center py-5">Loading promoted students...<td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert promotion pane
        const adminPane = document.getElementById('adminPane');
        if (adminPane) {
            adminPane.insertAdjacentHTML('afterend', promotionPaneHTML);
        } else {
            tabContents.insertAdjacentHTML('beforeend', promotionPaneHTML);
        }
        
        // Initialize promotion functions
        initPromotionEventListeners(token);
        loadPromotedHistory(token);
        
        // Update switchTab function
        if (window.switchTab) {
            const originalSwitchTab = window.switchTab;
            window.switchTab = function(tabId) {
                document.querySelectorAll('.tab-pane').forEach(pane => pane.style.display = 'none');
                const selectedPane = document.getElementById(tabId + 'Pane');
                if (selectedPane) selectedPane.style.display = 'block';
                
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    if (btn.getAttribute('data-tab') === tabId) btn.classList.add('active');
                    else btn.classList.remove('active');
                });
                
                document.querySelectorAll('.bottom-nav-item').forEach(item => {
                    if (item.getAttribute('data-tab') === tabId) item.classList.add('active');
                    else item.classList.remove('active');
                });
                
                if (tabId === 'promotion') {
                    loadPromotedHistory(token);
                }
                
                if (originalSwitchTab && tabId !== 'promotion') {
                    originalSwitchTab(tabId);
                }
            };
        }
        
        // Add click handlers to new tab buttons
        document.querySelectorAll('.tab-btn, .bottom-nav-item').forEach(btn => {
            btn.removeEventListener('click', handleTabClick);
            btn.addEventListener('click', handleTabClick);
        });
        
        function handleTabClick(e) {
            const tabId = e.currentTarget.getAttribute('data-tab');
            if (tabId && window.switchTab) window.switchTab(tabId);
        }
    }
    
    function initPromotionEventListeners(token) {
        // Search Student
        const searchBtn = document.getElementById('searchStudentBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => searchStudent(token));
        }
        
        // Enter key search
        const studentIdInput = document.getElementById('promotionStudentId');
        const aadharInput = document.getElementById('promotionAadhar');
        
        if (studentIdInput) {
            studentIdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchStudent(token);
            });
        }
        if (aadharInput) {
            aadharInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchStudent(token);
            });
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelPromoteBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('promotionStudentDetails').style.display = 'none';
                document.getElementById('promotionStudentId').value = '';
                document.getElementById('promotionAadhar').value = '';
            });
        }
        
        // Confirm Promotion
        const confirmBtn = document.getElementById('confirmPromoteBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => promoteStudent(token));
        }
        
        // Set default joining date
        const joinDateInput = document.getElementById('promoteJoiningDate');
        if (joinDateInput) {
            joinDateInput.value = new Date().toISOString().split('T')[0];
        }
    }
    
    async function searchStudent(token) {
        const studentId = document.getElementById('promotionStudentId').value.trim();
        const aadhar = document.getElementById('promotionAadhar').value.trim();
        
        if (!studentId && !aadhar) {
            showToast('Please enter Student ID or Aadhar Number', 'warning');
            return;
        }
        
        showLoader(true);
        
        try {
            let url = '';
            if (studentId) {
                url = `/api/students/${studentId}`;
            } else {
                url = `/api/students/by-aadhar/${aadhar}`;
            }
            
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            
            if (data.success && data.data) {
                displayStudentForPromotion(data.data);
            } else {
                showToast('Student not found!', 'error');
                document.getElementById('promotionStudentDetails').style.display = 'none';
            }
        } catch (err) {
            showToast('Error searching student', 'error');
            console.error(err);
        }
        
        showLoader(false);
    }
    
    function displayStudentForPromotion(student) {
        const detailsDiv = document.getElementById('promotionStudentDetails');
        const currentInfoDiv = document.getElementById('currentStudentInfo');
        
        currentInfoDiv.innerHTML = `
            <div class="col-md-3">
                <strong>Student ID:</strong><br>
                ${escapeHtml(student.studentId)}
            </div>
            <div class="col-md-3">
                <strong>Name:</strong><br>
                ${escapeHtml(student.studentName.first)} ${escapeHtml(student.studentName.last)}
            </div>
            <div class="col-md-3">
                <strong>Current Board:</strong><br>
                ${escapeHtml(student.education?.board || '-')}
            </div>
            <div class="col-md-3">
                <strong>Current Class:</strong><br>
                ${escapeHtml(student.education?.class || '-')}
            </div>
            <div class="col-md-3">
                <strong>Mobile:</strong><br>
                ${escapeHtml(student.mobile || '-')}
            </div>
            <div class="col-md-3">
                <strong>Father's Name:</strong><br>
                ${escapeHtml(student.fatherName?.first || '')} ${escapeHtml(student.fatherName?.last || '')}
            </div>
            <div class="col-md-3">
                <strong>Current Fees:</strong><br>
                ₹${student.classMonthlyFees || 0}
            </div>
            <div class="col-md-3">
                <strong>Joining Date:</strong><br>
                ${new Date(student.joiningDate).toLocaleDateString()}
            </div>
        `;
        
        // Store student data for promotion
        window.currentStudentForPromotion = student;
        detailsDiv.style.display = 'block';
        
        // Auto-fill promotion form with suggested values
        const currentClass = student.education?.class || '';
        const currentBoard = student.education?.board || '';
        
        // Suggest next class
        const classMatch = currentClass.match(/\d+/);
        if (classMatch) {
            const currentClassNum = parseInt(classMatch[0]);
            const nextClassNum = currentClassNum + 1;
            if (nextClassNum <= 12) {
                const nextClassSelect = document.getElementById('promoteNewClass');
                if (nextClassSelect) {
                    nextClassSelect.value = `Class ${nextClassNum}`;
                }
            }
        }
        
        // Suggest same board if available
        const boardSelect = document.getElementById('promoteNewBoard');
        if (boardSelect && currentBoard) {
            for (let i = 0; i < boardSelect.options.length; i++) {
                if (boardSelect.options[i].value === currentBoard) {
                    boardSelect.value = currentBoard;
                    break;
                }
            }
        }
        
        // Suggest same fees or slightly higher
        const feesInput = document.getElementById('promoteNewFees');
        if (feesInput && student.classMonthlyFees) {
            feesInput.value = student.classMonthlyFees + 500;
        }
    }
    
    async function promoteStudent(token) {
        const student = window.currentStudentForPromotion;
        if (!student) {
            showToast('No student selected', 'error');
            return;
        }
        
        const newBoard = document.getElementById('promoteNewBoard').value;
        const newClass = document.getElementById('promoteNewClass').value;
        const newFees = document.getElementById('promoteNewFees').value;
        const newJoiningDate = document.getElementById('promoteJoiningDate').value;
        const reason = document.getElementById('promoteReason').value || 'Class promotion';
        
        if (!newBoard || !newClass || !newFees || !newJoiningDate) {
            showToast('Please fill all promotion details', 'warning');
            return;
        }
        
        if (!confirm(`⚠️ PROMOTE STUDENT\n\nStudent: ${student.studentName.first} ${student.studentName.last}\nID: ${student.studentId}\n\nCurrent: ${student.education?.board} - ${student.education?.class}\nNew: ${newBoard} - ${newClass}\n\nThis will:\n1. Move current record to OLD STUDENTS\n2. Create new record with same ID\n3. Keep old data for history\n\nContinue?`)) {
            return;
        }
        
        showLoader(true);
        
        try {
            // Step 1: Move current student to old students
            const moveRes = await fetch('/api/move-to-old-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentId: student.studentId,
                    reason: reason,
                    promotedTo: { board: newBoard, class: newClass, fees: newFees, joiningDate: newJoiningDate }
                })
            });
            
            const moveData = await moveRes.json();
            if (!moveData.success) {
                showToast(moveData.message || 'Failed to move old record', 'error');
                showLoader(false);
                return;
            }
            
            // Step 2: Create new student record with same ID
            const newStudentData = {
                studentId: student.studentId,
                password: student.password,
                photo: student.photo,
                student: {
                    firstName: student.studentName.first,
                    middleName: student.studentName.middle || '',
                    lastName: student.studentName.last
                },
                mobile: student.mobile,
                aadhar: student.aadharNumber,
                aadharDocument: student.aadharDocument,
                classMonthlyFees: parseInt(newFees),
                dates: {
                    reg: newJoiningDate,
                    join: newJoiningDate
                },
                father: {
                    firstName: student.fatherName.first,
                    middleName: student.fatherName.middle || '',
                    lastName: student.fatherName.last,
                    mobile: student.fatherMobile
                },
                mother: {
                    firstName: student.motherName?.first || '',
                    lastName: student.motherName?.last || ''
                },
                address: {
                    current: student.address.current,
                    permanent: student.address.permanent
                },
                education: {
                    board: newBoard,
                    class: newClass
                }
            };
            
            const createRes = await fetch('/api/student-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudentData)
            });
            
            const createData = await createRes.json();
            if (!createData.success) {
                showToast(createData.message || 'Failed to create new record', 'error');
                showLoader(false);
                return;
            }
            
            showToast(`✅ Student promoted successfully!\n${student.studentName.first} ${student.studentName.last} is now in ${newClass}`, 'success');
            
            // Reset form
            document.getElementById('promotionStudentDetails').style.display = 'none';
            document.getElementById('promotionStudentId').value = '';
            document.getElementById('promotionAadhar').value = '';
            document.getElementById('promoteNewBoard').value = '';
            document.getElementById('promoteNewClass').value = '';
            document.getElementById('promoteNewFees').value = '';
            document.getElementById('promoteReason').value = '';
            document.getElementById('promoteJoiningDate').value = new Date().toISOString().split('T')[0];
            
            // Refresh lists
            loadPromotedHistory(token);
            if (typeof window.loadStudents === 'function') window.loadStudents();
            
        } catch (err) {
            console.error('Promotion error:', err);
            showToast('Promotion failed', 'error');
        }
        
        showLoader(false);
    }
    
    async function loadPromotedHistory(token) {
        try {
            const res = await fetch('/api/old-students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            const tbody = document.getElementById('promotedHistoryList');
            if (!tbody) return;
            
            if (data.success && data.data.length > 0) {
                tbody.innerHTML = data.data.slice(0, 20).map(s => `
                    <tr>
                        <td><strong>${escapeHtml(s.studentId)}</strong></td>
                        <td>${escapeHtml(s.studentName.first)} ${escapeHtml(s.studentName.last)}</td>
                        <td>${escapeHtml(s.oldEducation?.board || '-')} - ${escapeHtml(s.oldEducation?.class || '-')}</td>
                        <td>${escapeHtml(s.newEducation?.board || '-')} - ${escapeHtml(s.newEducation?.class || '-')}</td>
                        <td>${new Date(s.promotedAt).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn btn-view view-old" data-id="${s._id}" style="background:#4361ee;">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
                
                // Add view handlers
                document.querySelectorAll('.view-old').forEach(btn => {
                    btn.addEventListener('click', () => viewOldStudent(btn.dataset.id, token));
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><i class="fas fa-history"></i> No promoted students found</td></tr>';
            }
        } catch (err) {
            console.error('Error loading promoted history:', err);
        }
    }
    
    async function viewOldStudent(id, token) {
        try {
            const res = await fetch(`/api/old-students/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const s = data.data;
                showModal(`
                    <div class="text-center mb-3">
                        <img src="${s.photo}" style="width:80px; height:80px; border-radius:50%; object-fit:cover;">
                        <h5 class="mt-2">${s.studentName.first} ${s.studentName.last}</h5>
                        <p class="text-muted">ID: ${s.studentId}</p>
                    </div>
                    <div class="row g-2">
                        <div class="col-6"><strong>Old Board:</strong> ${s.oldEducation?.board}</div>
                        <div class="col-6"><strong>Old Class:</strong> ${s.oldEducation?.class}</div>
                        <div class="col-6"><strong>New Board:</strong> ${s.newEducation?.board}</div>
                        <div class="col-6"><strong>New Class:</strong> ${s.newEducation?.class}</div>
                        <div class="col-12"><strong>Promoted Date:</strong> ${new Date(s.promotedAt).toLocaleString()}</div>
                        <div class="col-12"><strong>Reason:</strong> ${s.promotionReason || '-'}</div>
                        <div class="col-12"><hr><strong>Mobile:</strong> ${s.mobile}</div>
                        <div class="col-12"><strong>Father:</strong> ${s.fatherName.first} ${s.fatherName.last}</div>
                    </div>
                `, 'Promoted Student Details');
            }
        } catch (err) {
            showToast('Error loading details', 'error');
        }
    }
    
    function showModal(content, title) {
        const modal = document.createElement('div');
        modal.className = 'modal-custom';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content-custom" style="max-width:500px;">
                <div class="modal-header-custom">
                    <h4>${title}</h4>
                    <button class="modal-close" id="closeModalBtn">&times;</button>
                </div>
                <div class="modal-body-custom">${content}</div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeModalBtn').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    function showToast(msg, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast-premium ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${msg}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    function showLoader(show) {
        const loader = document.getElementById('loaderOverlay');
        if (loader) loader.style.display = show ? 'flex' : 'none';
    }
})();
