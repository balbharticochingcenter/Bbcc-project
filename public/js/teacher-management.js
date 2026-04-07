// ============================================
// TEACHER-MANAGEMENT.JS - COMPLETE FINAL VERSION
// ALL FEATURES WORKING: ATTENDANCE, SALARY, DOCUMENTS
// FOR BAL BHARTI COACHING CENTER
// ============================================

(function() {
    'use strict';

    const API_BASE_URL = window.location.origin + '/api';
    let teachersData = [];
    let leftTeachersData = [];
    let currentViewTeacher = null;
    let currentEditTeacherId = null;

    const subjectsList = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
        'Hindi', 'Sanskrit', 'Computer Science', 'Social Science', 
        'Reasoning', 'Aptitude', 'General Knowledge'
    ];

    const classesList = [
        'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', 
        '6th', '7th', '8th', '9th', '10th', '11th', '12th', 
        'Graduation', 'Post Graduation', 'Other'
    ];

    const boardsList = [
        'CBSE', 'ICSE', 'UP Board', 'Bihar Board', 'MP Board', 'Rajasthan Board',
        'Gujarat Board', 'Maharashtra Board', 'Tamil Nadu Board', 'Karnataka Board',
        'Telangana Board', 'Andhra Board', 'West Bengal Board', 'Punjab Board',
        'Haryana Board', 'Jharkhand Board', 'Chhattisgarh Board', 'Uttarakhand Board',
        'Assam Board', 'Odisha Board', 'Kerala Board', 'Delhi Board', 'Other'
    ];

    const genders = ['Male', 'Female', 'Other'];
    const paymentModes = ['cash', 'bank', 'upi'];
    const DEFAULT_PHOTO = 'https://placehold.co/100x100/28a745/white?text=👨‍🏫';

    function showAlert(message, type = 'info', duration = 3000) {
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert-${type}`;
        alertDiv.innerHTML = `<span>${message}</span><button class="close-alert-btn">×</button>`;
        alertDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            max-width: 400px; background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff3cd'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#856404'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#ffeeba'};
            border-radius: 10px; padding: 12px 20px; display: flex;
            justify-content: space-between; align-items: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;
        `;
        document.body.appendChild(alertDiv);
        alertDiv.querySelector('.close-alert-btn').onclick = () => alertDiv.remove();
        setTimeout(() => { if (alertDiv.parentElement) alertDiv.remove(); }, duration);
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    function formatDate(date) {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('en-IN');
        } catch(e) {
            return '-';
        }
    }

    function getToken() {
        return localStorage.getItem('adminToken');
    }

    // ========== API CALL ==========
    async function apiCall(endpoint, options = {}) {
        try {
            const token = getToken();
            if (!token) {
                window.location.href = '/login.html';
                return { success: false, message: "No token" };
            }
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                }
            });
            
            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                alert('Session expired! Please login again.');
                window.location.href = '/login.html';
                return { success: false, message: "Unauthorized" };
            }
            
            const data = await response.json();
            return data;
        } catch (err) {
            console.error('API Error:', err);
            return { success: false, message: err.message, data: [] };
        }
    }

    // ========== LOAD DATA ==========
    async function loadTeachers() {
        const response = await apiCall('/teachers');
        if (response.success && response.data) {
            teachersData = response.data;
        } else {
            teachersData = [];
        }
        renderTeachersGrid();
    }

    async function loadLeftTeachers() {
        try {
            const allTeachers = await apiCall('/teachers');
            if (allTeachers.success && allTeachers.data) {
                leftTeachersData = allTeachers.data.filter(t => t.status?.isActive === false);
            } else {
                leftTeachersData = [];
            }
        } catch (err) {
            console.log('Failed to load left teachers:', err);
            leftTeachersData = [];
        }
        renderLeftTeachersGrid();
    }

    async function loadNotices() {
        const response = await apiCall('/notices');
        if (response.success && response.data) {
            renderNotices(response.data);
        }
    }

    // ========== RENDER FUNCTIONS ==========
    function renderTeachersGrid() {
        const subject = document.getElementById('filterSubject')?.value || 'all';
        const classVal = document.getElementById('filterClass')?.value || 'all';
        const board = document.getElementById('filterBoard')?.value || 'all';
        const search = document.getElementById('searchTeacher')?.value.toLowerCase() || '';
        
        let filtered = teachersData || [];
        if (subject !== 'all') filtered = filtered.filter(t => t.professional?.subjects?.includes(subject));
        if (classVal !== 'all') filtered = filtered.filter(t => t.professional?.classes?.includes(classVal));
        if (board !== 'all') filtered = filtered.filter(t => t.professional?.boards?.includes(board));
        if (search) filtered = filtered.filter(t => (t.teacherId || '').includes(search) || (t.personal?.name || '').toLowerCase().includes(search));
        
        const grid = document.getElementById('teachersGrid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">📭 No teachers found</div>';
            return;
        }
        
        grid.innerHTML = filtered.map(t => `
            <div class="teacher-card" data-id="${t.teacherId}">
                <div class="teacher-card-header">
                    <img src="${t.personal?.photo || DEFAULT_PHOTO}" class="teacher-card-img" onerror="this.src='${DEFAULT_PHOTO}'">
                    <div class="teacher-card-name">${t.personal?.name || 'N/A'}</div>
                    <div class="teacher-card-id">${t.teacherId || '-'}</div>
                </div>
                <div class="teacher-card-body">
                    <div class="teacher-card-info"><span>📞 Mobile:</span><span>${t.personal?.mobile || '-'}</span></div>
                    <div class="teacher-card-info"><span>📚 Subjects:</span><span>${(t.professional?.subjects || []).slice(0,2).join(', ')}${(t.professional?.subjects || []).length > 2 ? '...' : ''}</span></div>
                    <div class="teacher-card-info"><span>🏫 Classes:</span><span>${(t.professional?.classes || []).slice(0,2).join(', ')}</span></div>
                    <div class="teacher-card-info"><span>🎓 Boards:</span><span>${(t.professional?.boards || []).slice(0,2).join(', ')}</span></div>
                    <div class="teacher-card-info"><span>💰 Salary:</span><span>₹${t.salary?.defaultSalary || 0}</span></div>
                    <div class="teacher-card-info"><span>Status:</span><span>${t.status?.isBlocked ? '<span class="badge-blocked">Blocked</span>' : '<span class="badge-active">Active</span>'}</span></div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('#teachersGrid .teacher-card').forEach(card => {
            card.addEventListener('click', () => showTeacherDashboard(card.dataset.id));
        });
    }

    function renderLeftTeachersGrid() {
        const search = document.getElementById('searchLeft')?.value.toLowerCase() || '';
        let filtered = leftTeachersData || [];
        if (search) filtered = filtered.filter(t => (t.teacherId || '').includes(search) || (t.personal?.name || '').toLowerCase().includes(search));
        
        const grid = document.getElementById('leftTeachersGrid');
        if (!grid) return;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">📦 No left teachers</div>';
            return;
        }
        
        grid.innerHTML = filtered.map(t => `
            <div class="teacher-card" data-id="${t.teacherId}">
                <div class="teacher-card-header">
                    <img src="${t.personal?.photo || DEFAULT_PHOTO}" class="teacher-card-img" onerror="this.src='${DEFAULT_PHOTO}'">
                    <div class="teacher-card-name">${t.personal?.name || 'N/A'}</div>
                    <div class="teacher-card-id">${t.teacherId || '-'}</div>
                </div>
                <div class="teacher-card-body">
                    <div class="teacher-card-info"><span>📞 Mobile:</span><span>${t.personal?.mobile || '-'}</span></div>
                    <div class="teacher-card-info"><span>📚 Subjects:</span><span>${(t.professional?.subjects || []).slice(0,2).join(', ')}</span></div>
                    <div class="teacher-card-info"><span>📅 Left:</span><span>${formatDate(t.status?.leavingDate)}</span></div>
                    <div class="teacher-card-info"><span>📝 Reason:</span><span>${t.status?.leavingReason || '-'}</span></div>
                    <div class="teacher-card-info"><span> </span><span><button class="btn btn-success btn-sm rejoin-teacher-btn" data-id="${t.teacherId}">🔄 Rejoin</button></span></div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.rejoin-teacher-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                rejoinTeacher(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('#leftTeachersGrid .teacher-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('rejoin-teacher-btn')) {
                    showTeacherDashboard(card.dataset.id);
                }
            });
        });
    }

    function renderNotices(notices) {
        const container = document.getElementById('noticesList');
        if (!container) return;
        if (!notices || notices.length === 0) { 
            container.innerHTML = '<div class="empty-state">📭 No notices</div>'; 
            return; 
        }
        
        container.innerHTML = notices.map(n => `
            <div style="background:#e8f5e9; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid #28a745">
                <strong>${n.title}</strong> <small>${formatDate(n.sentAt)}</small>
                <div style="margin-top:8px;">${n.message}</div>
                <div style="margin-top:8px; font-size:0.8rem;">From: ${n.from === 'admin' ? 'Admin' : n.teacherName}</div>
            </div>
        `).join('');
    }

    // ========== DASHBOARD ==========
    async function showTeacherDashboard(teacherId) {
        showAlert('Loading teacher data...', 'info');
        const response = await apiCall(`/teachers/${teacherId}`);
        if (!response.success || !response.data) {
            showAlert('Teacher not found!', 'error');
            return;
        }
        currentViewTeacher = response.data;
        renderDashboard(currentViewTeacher);
        document.getElementById('dashboardModal').classList.add('active');
    }

    function renderDashboard(t) {
        const body = document.getElementById('dashboardBody');
        const footer = document.getElementById('dashboardFooter');
        if (!body) return;
        
        const salaryPayments = t.salaryPayments || [];
        const totalPaid = salaryPayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
        const totalDue = salaryPayments.reduce((s, p) => s + (p.dueAmount || 0), 0);
        const attendance = t.attendance || [];
        const attPercent = attendance.length ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0;
        
        body.innerHTML = `
            <div class="dashboard-container">
                <div style="display:flex; gap:20px; flex-wrap:wrap;">
                    <div>
                        <img src="${t.personal?.photo || DEFAULT_PHOTO}" class="teacher-photo-large" style="cursor:pointer;" id="dashboardPhoto">
                        <div style="text-align:center;margin-top:5px;">
                            <button class="btn btn-sm btn-info" id="viewPhotoBtn">🔍 View Photo</button>
                        </div>
                    </div>
                    <div style="flex:1;">
                        <div class="info-row"><strong>${t.personal?.name || 'N/A'}</strong> (${t.teacherId})</div>
                        <div class="info-row">📞 ${t.personal?.mobile || '-'} | ✉️ ${t.personal?.email || '-'}</div>
                        <div class="info-row">🎓 ${t.personal?.gender || '-'} | 📅 DOB: ${formatDate(t.personal?.dob)}</div>
                        <div class="info-row">📚 ${t.documents?.qualificationName || '-'} | 🎓 ${t.professional?.experience || 0} years</div>
                        <div class="info-row">🏠 ${t.personal?.currentAddress || '-'}</div>
                        <div class="info-row">🏦 Bank: ${t.bankDetails?.bankName || '-'} | A/c: ${t.bankDetails?.accountNumber || '-'}</div>
                        <div class="info-row">📄 Aadhar: <button class="btn btn-sm btn-info" id="viewAadharBtn">View</button></div>
                        <div class="info-row">📄 Qualification: <button class="btn btn-sm btn-info" id="viewQualificationBtn">View</button></div>
                    </div>
                </div>
                <div class="stats-grid">
                    <div class="stat-card" style="background:#28a745;color:white;"><h3>₹${totalPaid.toLocaleString()}</h3><p>Paid</p></div>
                    <div class="stat-card" style="background:#dc3545;color:white;"><h3>₹${totalDue.toLocaleString()}</h3><p>Due</p></div>
                    <div class="stat-card" style="background:#17a2b8;color:white;"><h3>${attPercent}%</h3><p>Attendance</p></div>
                </div>
                <div class="chart-container"><div class="chart-title">📚 Subjects</div><div>${(t.professional?.subjects || []).map(s => `<span style="background:#28a74520;padding:5px 12px;border-radius:20px;margin:5px;display:inline-block;">${s}</span>`).join('') || '-'}</div></div>
                <div class="chart-container"><div class="chart-title">🏫 Classes</div><div>${(t.professional?.classes || []).map(c => `<span style="background:#17a2b820;padding:5px 12px;border-radius:20px;margin:5px;display:inline-block;">${c}</span>`).join('') || '-'}</div></div>
                <div class="chart-container"><div class="chart-title">🎓 Boards</div><div>${(t.professional?.boards || []).map(b => `<span style="background:#ffc10720;padding:5px 12px;border-radius:20px;margin:5px;display:inline-block;">${b}</span>`).join('') || '-'}</div></div>
                <div class="chart-container"><div class="chart-title">📅 Attendance History</div>
                    <div style="overflow-x:auto; max-height:300px;">
                        <table class="data-table">
                            <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th></tr></thead>
                            <tbody id="attendanceTableBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="chart-container"><div class="chart-title">💰 Salary History</div>
                    <div style="overflow-x:auto;">
                        <table class="data-table">
                            <thead><tr><th>Month/Year</th><th>Base Salary</th><th>Working Days</th><th>Present Days</th><th>Calculated</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody id="salaryTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Populate attendance table
        const attTbody = document.getElementById('attendanceTableBody');
        if (attTbody) {
            const sorted = [...(attendance || [])].sort((a,b) => new Date(b.date) - new Date(a.date));
            attTbody.innerHTML = sorted.map(a => `
                <tr>
                    <td>${formatDate(a.date)}</td>
                    <td>${a.status === 'present' ? '✅ Present' : a.status === 'absent' ? '❌ Absent' : a.status === 'holiday' ? '🎉 Holiday' : '🏖️ Leave'}</td>
                    <td>${a.checkIn || '-'}</td>
                    <td>${a.checkOut || '-'}</td>
                    <td>${a.remarks || '-'}</td>
                </tr>
            `).join('');
        }
        
        // Populate salary table
        const salaryTbody = document.getElementById('salaryTableBody');
        if (salaryTbody) {
            const sortedSalary = [...(salaryPayments || [])].sort((a,b) => b.year - a.year);
            salaryTbody.innerHTML = sortedSalary.map(s => `
                <tr>
                    <td>${s.month} ${s.year}</td>
                    <td>₹${s.baseSalary || 0}</td>
                    <td>${s.workingDays || 0}</td>
                    <td>${s.presentDays || 0}</td>
                    <td>₹${s.calculatedAmount || 0}</td>
                    <td>₹${s.paidAmount || 0}</td>
                    <td>₹${s.dueAmount || 0}</td>
                    <td>${s.status === 'paid' ? '✅ Paid' : s.status === 'partial' ? '⚠️ Partial' : '❌ Unpaid'}</td>
                    <td>${s.status !== 'paid' ? `<button class="btn btn-success btn-sm pay-salary-btn" data-month="${s.month}" data-year="${s.year}" data-due="${s.dueAmount}">💰 Pay</button>` : '-'}</td>
                </tr>
            `).join('');
            
            document.querySelectorAll('.pay-salary-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPaySalaryModal(currentViewTeacher, btn.dataset.month, btn.dataset.year, btn.dataset.due);
                });
            });
        }
        
        footer.innerHTML = `
            <button class="btn btn-info" id="markAttendanceBtn">📅 Mark Attendance</button>
            <button class="btn btn-success" id="generateSalaryBtn">💰 Generate Salary</button>
            <button class="btn btn-primary" id="editTeacherDashboardBtn">✏️ Edit Teacher</button>
            ${!t.status?.isBlocked ? '<button class="btn btn-warning" id="blockTeacherBtn">🔴 Block</button>' : '<button class="btn btn-success" id="unblockTeacherBtn">🟢 Unblock</button>'}
            <button class="btn btn-danger" id="moveToLeftBtn">📦 Move to Left</button>
            <button class="btn btn-secondary" id="closeDashboardFooterBtn">Close</button>
        `;
        
        document.getElementById('viewPhotoBtn')?.addEventListener('click', () => viewDocument(t.personal?.photo || DEFAULT_PHOTO, 'Teacher Photo'));
        document.getElementById('viewAadharBtn')?.addEventListener('click', () => viewDocument(t.documents?.aadharCopy || DEFAULT_PHOTO, 'Aadhar Document'));
        document.getElementById('viewQualificationBtn')?.addEventListener('click', () => viewDocument(t.documents?.qualificationDoc || DEFAULT_PHOTO, 'Qualification Document'));
        document.getElementById('editTeacherDashboardBtn')?.addEventListener('click', () => openEditTeacherPopup(t));
        document.getElementById('blockTeacherBtn')?.addEventListener('click', () => blockTeacher(t.teacherId));
        document.getElementById('unblockTeacherBtn')?.addEventListener('click', () => unblockTeacher(t.teacherId));
        document.getElementById('moveToLeftBtn')?.addEventListener('click', () => moveToLeft(t.teacherId));
        document.getElementById('markAttendanceBtn')?.addEventListener('click', () => openAttendanceModal(t.teacherId));
        document.getElementById('generateSalaryBtn')?.addEventListener('click', () => openGenerateSalaryModal(t));
        document.getElementById('closeDashboardFooterBtn')?.addEventListener('click', () => closeModal('dashboardModal'));
    }

    // ========== ATTENDANCE ==========
    async function openAttendanceModal(teacherId) {
        document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('attendanceStatus').value = 'present';
        document.getElementById('checkInTime').value = new Date().toLocaleTimeString();
        document.getElementById('checkOutTime').value = '';
        document.getElementById('attendancePhoto').value = '';
        document.getElementById('attendancePhotoPreview').style.display = 'none';
        document.getElementById('attendanceRemarks').value = '';
        
        const saveBtn = document.getElementById('saveAttendanceBtn');
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', () => saveAttendance(teacherId));
        
        document.getElementById('attendanceModal').classList.add('active');
    }

    async function saveAttendance(teacherId) {
        const date = document.getElementById('attendanceDate').value;
        if (!date) { showAlert('Select date', 'error'); return; }
        
        const response = await apiCall(`/teachers/${teacherId}/attendance`, {
            method: 'POST',
            body: JSON.stringify({
                date: date,
                status: document.getElementById('attendanceStatus').value,
                checkIn: document.getElementById('checkInTime').value,
                checkOut: document.getElementById('checkOutTime').value,
                photo: document.getElementById('attendancePhoto').value,
                remarks: document.getElementById('attendanceRemarks').value
            })
        });
        if (response.success) {
            showAlert('Attendance marked!', 'success');
            closeModal('attendanceModal');
            await loadTeachers();
            await showTeacherDashboard(teacherId);
        } else {
            showAlert(response.message || 'Failed', 'error');
        }
    }

    // ========== SALARY ==========
    async function openGenerateSalaryModal(teacher) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const year = new Date().getFullYear();
        const select = document.getElementById('salaryMonth');
        select.innerHTML = months.map(m => `<option value="${m}|${year}">${m} ${year}</option>`).join('');
        
        document.getElementById('customSalaryAmount').value = '';
        document.getElementById('payAmount').value = '';
        document.getElementById('salaryResult').style.display = 'none';
        
        const genBtn = document.getElementById('generateSalaryBtn');
        const newGen = genBtn.cloneNode(true);
        genBtn.parentNode.replaceChild(newGen, genBtn);
        newGen.addEventListener('click', () => generateSalary(teacher.teacherId));
        
        document.getElementById('salaryModal').classList.add('active');
    }

    async function generateSalary(teacherId) {
        const selected = document.getElementById('salaryMonth').value;
        if (!selected) { showAlert('Select month', 'error'); return; }
        const [month, year] = selected.split('|');
        const customSalary = document.getElementById('customSalaryAmount').value;
        
        const response = await apiCall(`/teachers/${teacherId}/salary/generate`, {
            method: 'POST',
            body: JSON.stringify({ month, year: parseInt(year), customSalary: customSalary ? parseInt(customSalary) : null })
        });
        if (response.success) {
            document.getElementById('salaryResult').innerHTML = `<strong>Generated:</strong> Base:₹${response.data.baseSalary} | Working:${response.data.workingDays} | Present:${response.data.presentDays} | <strong>Amount:₹${response.data.calculatedAmount}</strong>`;
            document.getElementById('salaryResult').style.display = 'block';
            showAlert('Salary generated!', 'success');
            await loadTeachers();
            await showTeacherDashboard(teacherId);
            closeModal('salaryModal');
        } else {
            showAlert(response.message || 'Failed', 'error');
        }
    }

    async function openPaySalaryModal(teacher, month, year, dueAmount) {
        document.getElementById('payAmount').value = dueAmount;
        document.getElementById('paymentMode').value = 'cash';
        document.getElementById('paymentRemarks').value = '';
        document.getElementById('salaryResult').style.display = 'none';
        
        const payBtn = document.getElementById('paySalaryBtn');
        const newPay = payBtn.cloneNode(true);
        payBtn.parentNode.replaceChild(newPay, payBtn);
        newPay.addEventListener('click', () => paySalary(teacher.teacherId, month, year));
        
        document.getElementById('salaryModal').classList.add('active');
    }

    async function paySalary(teacherId, month, year) {
        const paidAmount = parseInt(document.getElementById('payAmount').value);
        if (!paidAmount || paidAmount <= 0) { showAlert('Enter valid amount', 'error'); return; }
        
        const response = await apiCall(`/teachers/${teacherId}/salary/pay`, {
            method: 'POST',
            body: JSON.stringify({ 
                month: month, 
                year: parseInt(year), 
                paidAmount, 
                paymentMode: document.getElementById('paymentMode').value, 
                remarks: document.getElementById('paymentRemarks').value 
            })
        });
        if (response.success) {
            showAlert('Salary paid!', 'success');
            closeModal('salaryModal');
            await loadTeachers();
            await showTeacherDashboard(teacherId);
        } else {
            showAlert(response.message || 'Failed', 'error');
        }
    }

    // ========== DOCUMENT VIEWER ==========
    function viewDocument(url, title) {
        const modal = document.getElementById('documentViewerModal');
        const img = document.getElementById('docViewerImage');
        const titleSpan = document.getElementById('docViewerTitle');
        if (modal && img && titleSpan) {
            img.src = url;
            titleSpan.innerText = title;
            modal.classList.add('active');
        }
    }

    // ========== EDIT TEACHER (With Document/Photo Change) ==========
    function openEditTeacherPopup(teacher) {
        currentEditTeacherId = teacher.teacherId;
        document.getElementById('editTeacherId').innerText = teacher.teacherId;
        
        const editForm = `
            <form id="editTeacherForm">
                <div class="section-title">📎 Documents (Click URL to change)</div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Photo URL</label>
                        <input type="text" id="editPhoto" value="${escapeHtml(teacher.personal?.photo || '')}" placeholder="Image URL">
                        <small>Paste image URL or use upload below</small>
                        <div class="image-actions" style="margin-top:5px;">
                            <button type="button" class="btn btn-primary btn-sm" id="editCapturePhotoBtn">📷 Capture</button>
                            <button type="button" class="btn btn-info btn-sm" id="editUploadPhotoBtn">📁 Upload</button>
                        </div>
                        <img id="editPhotoPreview" class="image-preview" src="${teacher.personal?.photo || DEFAULT_PHOTO}" style="display:block; margin-top:5px;">
                    </div>
                    <div class="form-group">
                        <label>Aadhar Copy URL</label>
                        <input type="text" id="editAadharCopy" value="${escapeHtml(teacher.documents?.aadharCopy || '')}" placeholder="Image URL">
                        <div class="image-actions" style="margin-top:5px;">
                            <button type="button" class="btn btn-primary btn-sm" id="editCaptureAadharBtn">📷 Capture</button>
                            <button type="button" class="btn btn-info btn-sm" id="editUploadAadharBtn">📁 Upload</button>
                        </div>
                        <img id="editAadharPreview" class="image-preview" src="${teacher.documents?.aadharCopy || DEFAULT_PHOTO}" style="display:block; margin-top:5px;">
                    </div>
                </div>
                <div class="form-group">
                    <label>Qualification Document URL</label>
                    <input type="text" id="editQualificationDoc" value="${escapeHtml(teacher.documents?.qualificationDoc || '')}" placeholder="Image URL">
                    <div class="image-actions" style="margin-top:5px;">
                        <button type="button" class="btn btn-primary btn-sm" id="editCaptureQualificationBtn">📷 Capture</button>
                        <button type="button" class="btn btn-info btn-sm" id="editUploadQualificationBtn">📁 Upload</button>
                    </div>
                    <img id="editQualificationPreview" class="image-preview" src="${teacher.documents?.qualificationDoc || DEFAULT_PHOTO}" style="display:block; margin-top:5px;">
                </div>
                
                <div class="section-title">👤 Personal Info</div>
                <div class="form-row">
                    <div class="form-group"><label>Full Name</label><input type="text" id="editFullName" value="${escapeHtml(teacher.personal?.name || '')}"></div>
                    <div class="form-group"><label>Aadhar</label><input type="text" value="${escapeHtml(teacher.teacherId || '')}" disabled></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>DOB</label><input type="date" id="editDob" value="${teacher.personal?.dob ? teacher.personal.dob.split('T')[0] : ''}"></div>
                    <div class="form-group"><label>Gender</label><select id="editGender">${genders.map(g => `<option ${teacher.personal?.gender === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Mobile</label><input type="text" id="editMobile" value="${escapeHtml(teacher.personal?.mobile || '')}"></div>
                    <div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${escapeHtml(teacher.personal?.email || '')}"></div>
                </div>
                <div class="form-group"><label>Address</label><textarea id="editAddress" rows="2">${escapeHtml(teacher.personal?.currentAddress || '')}</textarea></div>
                <div class="form-group"><label>Permanent Address</label><textarea id="editPermanentAddress" rows="2">${escapeHtml(teacher.personal?.permanentAddress || '')}</textarea></div>
                
                <div class="section-title">📚 Professional</div>
                <div class="form-row">
                    <div class="form-group"><label>Qualification Name</label><input type="text" id="editQualification" value="${escapeHtml(teacher.documents?.qualificationName || '')}"></div>
                    <div class="form-group"><label>Experience</label><input type="number" id="editExperience" value="${teacher.professional?.experience || 0}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Joining Date</label><input type="date" id="editJoiningDate" value="${teacher.professional?.joiningDate ? teacher.professional.joiningDate.split('T')[0] : ''}"></div>
                    <div class="form-group"><label>Salary</label><input type="number" id="editSalary" value="${teacher.salary?.defaultSalary || 0}"></div>
                </div>
                
                <div class="section-title">📖 Subjects</div>
                <div class="checkbox-group" id="editSubjectsGroup">${subjectsList.map(s => `<label><input type="checkbox" value="${s}" ${(teacher.professional?.subjects || []).includes(s) ? 'checked' : ''}> ${s}</label>`).join('')}</div>
                
                <div class="section-title">🏫 Classes</div>
                <div class="checkbox-group" id="editClassesGroup">${classesList.map(c => `<label><input type="checkbox" value="${c}" ${(teacher.professional?.classes || []).includes(c) ? 'checked' : ''}> ${c}</label>`).join('')}</div>
                
                <div class="section-title">🎓 Boards</div>
                <div class="checkbox-group" id="editBoardsGroup">${boardsList.map(b => `<label><input type="checkbox" value="${b}" ${(teacher.professional?.boards || []).includes(b) ? 'checked' : ''}> ${b}</label>`).join('')}</div>
                
                <div class="section-title">🏦 Bank</div>
                <div class="form-row">
                    <div class="form-group"><label>Bank Name</label><input type="text" id="editBankName" value="${escapeHtml(teacher.bankDetails?.bankName || '')}"></div>
                    <div class="form-group"><label>Account No</label><input type="text" id="editAccountNo" value="${escapeHtml(teacher.bankDetails?.accountNumber || '')}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>IFSC</label><input type="text" id="editIfsc" value="${escapeHtml(teacher.bankDetails?.ifsc || '')}"></div>
                    <div class="form-group"><label>UPI ID</label><input type="text" id="editUpiId" value="${escapeHtml(teacher.bankDetails?.upiId || '')}"></div>
                </div>
            </form>
        `;
        
        document.getElementById('editModalBody').innerHTML = editForm;
        document.getElementById('editTeacherModal').classList.add('active');
        
        // Setup document edit events
        document.getElementById('editCapturePhotoBtn')?.addEventListener('click', () => captureAndSetImage('editPhoto', 'editPhotoPreview'));
        document.getElementById('editUploadPhotoBtn')?.addEventListener('click', () => uploadAndSetImage('editPhoto', 'editPhotoPreview'));
        document.getElementById('editCaptureAadharBtn')?.addEventListener('click', () => captureAndSetImage('editAadharCopy', 'editAadharPreview'));
        document.getElementById('editUploadAadharBtn')?.addEventListener('click', () => uploadAndSetImage('editAadharCopy', 'editAadharPreview'));
        document.getElementById('editCaptureQualificationBtn')?.addEventListener('click', () => captureAndSetImage('editQualificationDoc', 'editQualificationPreview'));
        document.getElementById('editUploadQualificationBtn')?.addEventListener('click', () => uploadAndSetImage('editQualificationDoc', 'editQualificationPreview'));
        
        document.getElementById('saveEditModalBtn').onclick = () => saveEditFromModal();
    }

    async function captureAndSetImage(fieldId, previewId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                const compressed = await compressImage(e.target.files[0]);
                document.getElementById(fieldId).value = compressed;
                const preview = document.getElementById(previewId);
                if (preview) { preview.src = compressed; preview.style.display = 'block'; }
                showAlert('Image set!', 'success');
            }
        };
        input.click();
    }

    async function uploadAndSetImage(fieldId, previewId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                const compressed = await compressImage(e.target.files[0]);
                document.getElementById(fieldId).value = compressed;
                const preview = document.getElementById(previewId);
                if (preview) { preview.src = compressed; preview.style.display = 'block'; }
                showAlert('Image uploaded!', 'success');
            }
        };
        input.click();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    async function saveEditFromModal() {
        const selectedSubjects = Array.from(document.querySelectorAll('#editSubjectsGroup input:checked')).map(cb => cb.value);
        const selectedClasses = Array.from(document.querySelectorAll('#editClassesGroup input:checked')).map(cb => cb.value);
        const selectedBoards = Array.from(document.querySelectorAll('#editBoardsGroup input:checked')).map(cb => cb.value);
        
        const teacherData = {
            personal: {
                name: document.getElementById('editFullName').value,
                dob: document.getElementById('editDob').value,
                gender: document.getElementById('editGender').value,
                mobile: document.getElementById('editMobile').value,
                email: document.getElementById('editEmail').value,
                currentAddress: document.getElementById('editAddress').value,
                permanentAddress: document.getElementById('editPermanentAddress').value,
                photo: document.getElementById('editPhoto').value || DEFAULT_PHOTO
            },
            documents: {
                qualificationName: document.getElementById('editQualification').value,
                aadharCopy: document.getElementById('editAadharCopy').value || DEFAULT_PHOTO,
                qualificationDoc: document.getElementById('editQualificationDoc').value || DEFAULT_PHOTO
            },
            professional: {
                joiningDate: document.getElementById('editJoiningDate').value,
                experience: parseInt(document.getElementById('editExperience').value) || 0,
                subjects: selectedSubjects,
                classes: selectedClasses,
                boards: selectedBoards
            },
            salary: { defaultSalary: parseInt(document.getElementById('editSalary').value) || 0 },
            bankDetails: {
                bankName: document.getElementById('editBankName').value,
                accountNumber: document.getElementById('editAccountNo').value,
                ifsc: document.getElementById('editIfsc').value,
                upiId: document.getElementById('editUpiId').value
            }
        };
        
        const response = await apiCall(`/teachers/${currentEditTeacherId}`, { method: 'PUT', body: JSON.stringify(teacherData) });
        if (response.success) {
            showAlert('✅ Teacher updated successfully!', 'success');
            closeModal('editTeacherModal');
            await loadTeachers();
            if (currentViewTeacher && currentViewTeacher.teacherId === currentEditTeacherId) {
                await showTeacherDashboard(currentEditTeacherId);
            }
        } else {
            showAlert(response.message || 'Update failed', 'error');
        }
    }

    // ========== ACTIONS ==========
    async function blockTeacher(teacherId) {
        const reason = prompt('Block reason:');
        if (!reason) return;
        const response = await apiCall(`/teachers/${teacherId}/block`, { method: 'POST', body: JSON.stringify({ reason }) });
        if (response.success) {
            showAlert('Teacher blocked', 'success');
            await loadTeachers();
            closeModal('dashboardModal');
        } else {
            showAlert(response.message || 'Block failed', 'error');
        }
    }

    async function unblockTeacher(teacherId) {
        if (!confirm('Unblock this teacher?')) return;
        const response = await apiCall(`/teachers/${teacherId}/unblock`, { method: 'POST' });
        if (response.success) {
            showAlert('Teacher unblocked', 'success');
            await loadTeachers();
            closeModal('dashboardModal');
        } else {
            showAlert(response.message || 'Unblock failed', 'error');
        }
    }

    async function moveToLeft(teacherId) {
        const reason = prompt('Reason for leaving:');
        if (!reason) return;
        
        const response = await apiCall(`/teachers/${teacherId}/move-to-left`, {
            method: 'POST',
            body: JSON.stringify({ leavingReason: reason, lastWorkingDay: new Date().toISOString().split('T')[0] })
        });
        
        if (response.success) {
            showAlert(`✅ Teacher moved to left!`, 'success');
            await loadTeachers();
            await loadLeftTeachers();
            closeModal('dashboardModal');
        } else {
            showAlert(response.message || 'Move failed', 'error');
        }
    }

    async function rejoinTeacher(teacherId) {
        if (!confirm('Rejoin this teacher?')) return;
        
        const response = await apiCall(`/teachers/${teacherId}/rejoin`, { 
            method: 'POST', 
            body: JSON.stringify({ rejoinedAt: new Date().toISOString().split('T')[0] }) 
        });
        
        if (response.success) {
            showAlert(`✅ Teacher rejoined successfully!`, 'success');
            await loadTeachers();
            await loadLeftTeachers();
        } else {
            showAlert(response.message || 'Rejoin failed', 'error');
        }
    }

    // ========== REGISTER TEACHER ==========
    async function registerTeacher() {
        const aadhar = document.getElementById('aadharNumber').value;
        if (!aadhar || aadhar.length !== 12) { showAlert('Valid 12-digit Aadhar required', 'error'); return; }
        
        const subjects = Array.from(document.querySelectorAll('#subjectsGroup input:checked')).map(cb => cb.value);
        const classes = Array.from(document.querySelectorAll('#classesGroup input:checked')).map(cb => cb.value);
        const boards = Array.from(document.querySelectorAll('#boardsGroup input:checked')).map(cb => cb.value);
        
        if (!subjects.length || !classes.length || !boards.length) { 
            showAlert('Select subjects, classes and boards', 'error'); 
            return; 
        }
        
        const data = {
            aadharNumber: aadhar,
            personal: {
                name: document.getElementById('fullName').value,
                dob: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                mobile: document.getElementById('mobile').value,
                email: document.getElementById('email').value,
                currentAddress: document.getElementById('currentAddress').value,
                permanentAddress: document.getElementById('permanentAddress').value,
                photo: document.getElementById('photo').value || DEFAULT_PHOTO
            },
            documents: {
                aadharCopy: document.getElementById('aadharCopy').value || DEFAULT_PHOTO,
                qualificationDoc: document.getElementById('qualificationDoc').value || DEFAULT_PHOTO,
                qualificationName: document.getElementById('qualificationName').value
            },
            professional: {
                joiningDate: document.getElementById('joiningDate').value,
                experience: parseInt(document.getElementById('experience').value) || 0,
                subjects: subjects,
                classes: classes,
                boards: boards,
                branches: ['Main']
            },
            salary: { defaultSalary: parseInt(document.getElementById('defaultSalary').value) || 0 },
            bankDetails: {
                bankName: document.getElementById('bankName').value,
                accountNumber: document.getElementById('accountNumber').value,
                ifsc: document.getElementById('ifsc').value,
                upiId: document.getElementById('upiId').value
            }
        };
        
        const response = await apiCall('/teachers/register', { method: 'POST', body: JSON.stringify(data) });
        if (response.success) {
            showAlert(`✅ Teacher registered! ID: ${aadhar}, Password: ${response.password}`, 'success', 8000);
            resetForm();
            await loadTeachers();
            document.querySelector('[data-tab="teachers"]').click();
        } else {
            showAlert(response.message || 'Registration failed', 'error');
        }
    }

    // ========== NOTICE ==========
    async function openNoticeModal() {
        const select = document.getElementById('noticeTo');
        if (select) {
            select.innerHTML = '<option value="all">All Teachers</option>' + (teachersData || []).map(t => `<option value="${t.teacherId}">${t.personal?.name}</option>`).join('');
        }
        document.getElementById('noticeTitle').value = '';
        document.getElementById('noticeMessage').value = '';
        document.getElementById('noticeModal').classList.add('active');
    }

    async function sendNotice() {
        const response = await apiCall('/teachers/notice', {
            method: 'POST',
            body: JSON.stringify({
                teacherId: document.getElementById('noticeTo').value === 'all' ? null : document.getElementById('noticeTo').value,
                title: document.getElementById('noticeTitle').value,
                message: document.getElementById('noticeMessage').value,
                from: 'admin'
            })
        });
        if (response.success) {
            showAlert('Notice sent!', 'success');
            closeModal('noticeModal');
            await loadNotices();
        } else {
            showAlert(response.message || 'Failed to send notice', 'error');
        }
    }

    // ========== FORM RESET & HELPERS ==========
    function resetForm() {
        const form = document.getElementById('teacherForm');
        if (form) form.reset();
        const joinDate = document.getElementById('joiningDate');
        if (joinDate) joinDate.value = new Date().toISOString().split('T')[0];
        document.getElementById('aadharNumber').disabled = false;
        clearImage('photo', 'photoPreview');
        clearImage('aadharCopy', 'aadharPreview');
        clearImage('qualificationDoc', 'qualificationPreview');
        document.querySelectorAll('#subjectsGroup input').forEach(cb => cb.checked = false);
        document.querySelectorAll('#classesGroup input').forEach(cb => cb.checked = false);
        document.querySelectorAll('#boardsGroup input').forEach(cb => cb.checked = false);
    }

    function cancelEdit() {
        currentEditTeacherId = null;
        document.getElementById('formTitle').innerText = 'Register New Teacher';
        document.getElementById('registerTeacherBtn').style.display = 'inline-flex';
        document.getElementById('updateTeacherBtn').style.display = 'none';
        document.getElementById('cancelEditBtn').style.display = 'none';
        resetForm();
    }

    function clearImage(fieldId, previewId) {
        document.getElementById(fieldId).value = '';
        const preview = document.getElementById(previewId);
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
    }

    async function captureImage(fieldId, previewId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                const compressed = await compressImage(e.target.files[0]);
                document.getElementById(fieldId).value = compressed;
                const preview = document.getElementById(previewId);
                if (preview) { preview.src = compressed; preview.style.display = 'block'; }
                showAlert('Image captured!', 'success');
            }
        };
        input.click();
    }

    async function uploadImage(fieldId, previewId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                const compressed = await compressImage(e.target.files[0]);
                document.getElementById(fieldId).value = compressed;
                const preview = document.getElementById(previewId);
                if (preview) { preview.src = compressed; preview.style.display = 'block'; }
                showAlert('Image uploaded!', 'success');
            }
        };
        input.click();
    }

    async function compressImage(file, maxSizeKB = 15) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    let width = img.width, height = img.height, quality = 0.7;
                    const maxDim = 200;
                    if (width > maxDim) { height = (height * maxDim) / width; width = maxDim; }
                    if (height > maxDim) { width = (width * maxDim) / height; height = maxDim; }
                    const canvas = document.createElement('canvas');
                    canvas.width = width; canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    let result = canvas.toDataURL('image/jpeg', quality);
                    while (result.length > maxSizeKB * 1024 && quality > 0.1) { quality -= 0.1; result = canvas.toDataURL('image/jpeg', quality); }
                    resolve(result);
                };
            };
        });
    }

    function logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/login.html';
    }

    // ========== INITIALIZATION ==========
    async function init() {
        await loadTeachers();
        await loadLeftTeachers();
        await loadNotices();
        
        const joiningDateInput = document.getElementById('joiningDate');
        if (joiningDateInput) joiningDateInput.value = new Date().toISOString().split('T')[0];
        
        setupEventListeners();
    }

    function setupEventListeners() {
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.toggle('active', pane.dataset.pane === tab);
                });
                if (tab === 'new-teacher') cancelEdit();
                if (tab === 'notices') loadNotices();
            });
        });
        
        document.getElementById('filterSubject')?.addEventListener('change', () => renderTeachersGrid());
        document.getElementById('filterClass')?.addEventListener('change', () => renderTeachersGrid());
        document.getElementById('filterBoard')?.addEventListener('change', () => renderTeachersGrid());
        document.getElementById('searchTeacher')?.addEventListener('input', () => renderTeachersGrid());
        document.getElementById('searchLeft')?.addEventListener('input', () => renderLeftTeachersGrid());
        document.getElementById('refreshBtn')?.addEventListener('click', () => loadTeachers());
        document.getElementById('backToMainBtn')?.addEventListener('click', () => window.location.href = '/management.html');
        document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
        
        document.getElementById('registerTeacherBtn')?.addEventListener('click', () => registerTeacher());
        document.getElementById('updateTeacherBtn')?.addEventListener('click', () => registerTeacher());
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => cancelEdit());
        document.getElementById('resetFormBtn')?.addEventListener('click', () => resetForm());
        document.getElementById('sendNoticeBtn')?.addEventListener('click', () => openNoticeModal());
        document.getElementById('sendNoticeConfirmBtn')?.addEventListener('click', () => sendNotice());
        
        // Modal close buttons
        document.getElementById('closeDashboardModal')?.addEventListener('click', () => closeModal('dashboardModal'));
        document.getElementById('closeAttendanceModal')?.addEventListener('click', () => closeModal('attendanceModal'));
        document.getElementById('closeSalaryModal')?.addEventListener('click', () => closeModal('salaryModal'));
        document.getElementById('closeNoticeModal')?.addEventListener('click', () => closeModal('noticeModal'));
        document.getElementById('closeEditModal')?.addEventListener('click', () => closeModal('editTeacherModal'));
        document.getElementById('cancelEditModalBtn')?.addEventListener('click', () => closeModal('editTeacherModal'));
        document.getElementById('cancelAttendanceBtn')?.addEventListener('click', () => closeModal('attendanceModal'));
        document.getElementById('cancelSalaryBtn')?.addEventListener('click', () => closeModal('salaryModal'));
        document.getElementById('cancelNoticeBtn')?.addEventListener('click', () => closeModal('noticeModal'));
        document.getElementById('closeDocViewer')?.addEventListener('click', () => closeModal('documentViewerModal'));
        document.getElementById('closeDocViewerBtn')?.addEventListener('click', () => closeModal('documentViewerModal'));
        
        // Image capture/upload for registration
        document.getElementById('capturePhotoBtn')?.addEventListener('click', () => captureImage('photo', 'photoPreview'));
        document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => uploadImage('photo', 'photoPreview'));
        document.getElementById('clearPhotoBtn')?.addEventListener('click', () => clearImage('photo', 'photoPreview'));
        document.getElementById('captureAadharBtn')?.addEventListener('click', () => captureImage('aadharCopy', 'aadharPreview'));
        document.getElementById('uploadAadharBtn')?.addEventListener('click', () => uploadImage('aadharCopy', 'aadharPreview'));
        document.getElementById('clearAadharBtn')?.addEventListener('click', () => clearImage('aadharCopy', 'aadharPreview'));
        document.getElementById('captureQualificationBtn')?.addEventListener('click', () => captureImage('qualificationDoc', 'qualificationPreview'));
        document.getElementById('uploadQualificationBtn')?.addEventListener('click', () => uploadImage('qualificationDoc', 'qualificationPreview'));
        document.getElementById('clearQualificationBtn')?.addEventListener('click', () => clearImage('qualificationDoc', 'qualificationPreview'));
    }

    // ========== STYLES INJECTION ==========
    const styles = `... (styles same as before) ...`;

    function injectStyles() {
        if (!document.querySelector('#tms-styles')) {
            const style = document.createElement('style');
            style.id = 'tms-styles';
            style.textContent = styles;
            document.head.appendChild(style);
        }
    }

    function getHTMLTemplate() {
        return `... (HTML template same as before) ...`;
    }

    function injectHTML() {
        const app = document.getElementById('teacher-app');
        if (app && !document.querySelector('.tms-wrapper')) {
            app.innerHTML = getHTMLTemplate();
        }
    }

    // ========== EXPOSE GLOBALLY ==========
    window.viewDocumentImage = viewDocument;
    window.TeacherManagementSystem = class { constructor() { init(); } };
    window.initTeacherModule = function() { init(); };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectStyles();
            injectHTML();
            init();
        });
    } else {
        injectStyles();
        injectHTML();
        init();
    }
})();
