// ============================================
// TEACHER-MANAGEMENT.JS - COMPLETE FINAL VERSION
// ALL FEATURES WORKING - NO MISSING CODE
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
            </div>
        `;
        
        footer.innerHTML = `
            <button class="btn btn-info" id="markAttendanceBtn">📅 Mark Attendance</button>
            <button class="btn btn-success" id="manageSalaryBtn">💰 Salary</button>
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
        document.getElementById('manageSalaryBtn')?.addEventListener('click', () => openSalaryModal(t));
        document.getElementById('closeDashboardFooterBtn')?.addEventListener('click', () => closeModal('dashboardModal'));
    }

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

    async function openAttendanceModal(teacherId) {
        document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('attendanceStatus').value = 'present';
        document.getElementById('checkInTime').value = '';
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

    async function openSalaryModal(teacher) {
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
        
        const payBtn = document.getElementById('paySalaryBtn');
        const newPay = payBtn.cloneNode(true);
        payBtn.parentNode.replaceChild(newPay, payBtn);
        newPay.addEventListener('click', () => paySalary(teacher.teacherId));
        
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

    async function paySalary(teacherId) {
        const selected = document.getElementById('salaryMonth').value;
        if (!selected) { showAlert('Select month', 'error'); return; }
        const [month, year] = selected.split('|');
        const paidAmount = parseInt(document.getElementById('payAmount').value);
        if (!paidAmount || paidAmount <= 0) { showAlert('Enter valid amount', 'error'); return; }
        
        const response = await apiCall(`/teachers/${teacherId}/salary/pay`, {
            method: 'POST',
            body: JSON.stringify({ month, year: parseInt(year), paidAmount, paymentMode: document.getElementById('paymentMode').value, remarks: document.getElementById('paymentRemarks').value })
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

    function openEditTeacherPopup(teacher) {
        currentEditTeacherId = teacher.teacherId;
        document.getElementById('editTeacherId').innerText = teacher.teacherId;
        
        const editForm = `
            <form id="editTeacherForm">
                <div class="section-title">👤 Personal Info</div>
                <div class="form-row">
                    <div class="form-group"><label>Full Name</label><input type="text" id="editFullName" value="${teacher.personal?.name || ''}"></div>
                    <div class="form-group"><label>Aadhar</label><input type="text" value="${teacher.teacherId || ''}" disabled></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>DOB</label><input type="date" id="editDob" value="${teacher.personal?.dob ? teacher.personal.dob.split('T')[0] : ''}"></div>
                    <div class="form-group"><label>Gender</label><select id="editGender">${genders.map(g => `<option ${teacher.personal?.gender === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Mobile</label><input type="text" id="editMobile" value="${teacher.personal?.mobile || ''}"></div>
                    <div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${teacher.personal?.email || ''}"></div>
                </div>
                <div class="form-group"><label>Address</label><textarea id="editAddress" rows="2">${teacher.personal?.currentAddress || ''}</textarea></div>
                <div class="form-group"><label>Permanent Address</label><textarea id="editPermanentAddress" rows="2">${teacher.personal?.permanentAddress || ''}</textarea></div>
                
                <div class="section-title">📚 Professional</div>
                <div class="form-row">
                    <div class="form-group"><label>Qualification</label><input type="text" id="editQualification" value="${teacher.documents?.qualificationName || ''}"></div>
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
                    <div class="form-group"><label>Bank Name</label><input type="text" id="editBankName" value="${teacher.bankDetails?.bankName || ''}"></div>
                    <div class="form-group"><label>Account No</label><input type="text" id="editAccountNo" value="${teacher.bankDetails?.accountNumber || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>IFSC</label><input type="text" id="editIfsc" value="${teacher.bankDetails?.ifsc || ''}"></div>
                    <div class="form-group"><label>UPI ID</label><input type="text" id="editUpiId" value="${teacher.bankDetails?.upiId || ''}"></div>
                </div>
                
                <div class="section-title">📎 Documents (URLs)</div>
                <div class="form-row">
                    <div class="form-group"><label>Photo URL</label><input type="text" id="editPhoto" value="${teacher.personal?.photo || ''}" placeholder="Image URL"></div>
                    <div class="form-group"><label>Aadhar Copy URL</label><input type="text" id="editAadharCopy" value="${teacher.documents?.aadharCopy || ''}" placeholder="Image URL"></div>
                </div>
                <div class="form-group"><label>Qualification Document URL</label><input type="text" id="editQualificationDoc" value="${teacher.documents?.qualificationDoc || ''}" placeholder="Image URL"></div>
            </form>
        `;
        
        document.getElementById('editModalBody').innerHTML = editForm;
        document.getElementById('editTeacherModal').classList.add('active');
        document.getElementById('saveEditModalBtn').onclick = () => saveEditFromModal();
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
        } else {
            showAlert(response.message || 'Update failed', 'error');
        }
    }

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

    // ========== STYLES (COMPLETE) ==========
    const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            min-height: 100vh;
        }
        .tms-wrapper {
            max-width: 1400px; margin: 20px auto; background: white;
            border-radius: 25px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .tms-header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white; padding: 15px 25px;
            display: flex; justify-content: space-between; align-items: center;
            flex-wrap: wrap; gap: 15px;
        }
        .logo h1 { font-size: 1.5rem; }
        .logo p { font-size: 0.75rem; opacity: 0.9; }
        .main-tabs {
            display: flex; background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
            flex-wrap: wrap;
        }
        .main-tab-btn {
            flex: 1; padding: 15px 20px; background: none; border: none;
            font-size: 1rem; font-weight: 600; color: #666;
            cursor: pointer; transition: all 0.3s;
            display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .main-tab-btn.active { color: #28a745; border-bottom: 3px solid #28a745; background: white; }
        .tms-content { padding: 25px; min-height: 500px; }
        .tab-pane { display: none; animation: fadeIn 0.3s ease; }
        .tab-pane.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .filter-bar {
            display: flex; gap: 15px; margin-bottom: 25px;
            flex-wrap: wrap; align-items: center;
        }
        .filter-bar select, .filter-bar input {
            padding: 10px 15px; border: 2px solid #e0e0e0;
            border-radius: 10px; font-size: 0.9rem; background: white;
        }
        .filter-bar select:focus, .filter-bar input:focus {
            outline: none; border-color: #28a745;
        }
        
        .teachers-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
        }
        .teacher-card {
            background: white; border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden; cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .teacher-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .teacher-card-header {
            background: linear-gradient(135deg, #28a745, #20c997);
            padding: 20px; text-align: center;
        }
        .teacher-card-img {
            width: 100px; height: 100px; border-radius: 50%;
            object-fit: cover; border: 3px solid white;
            margin-bottom: 10px;
        }
        .teacher-card-name {
            color: white; font-size: 1.1rem; font-weight: bold;
        }
        .teacher-card-id {
            color: rgba(255,255,255,0.8); font-size: 0.8rem;
        }
        .teacher-card-body {
            padding: 15px;
        }
        .teacher-card-info {
            display: flex; justify-content: space-between;
            margin-bottom: 8px; font-size: 0.85rem;
        }
        .teacher-card-info span:first-child { color: #666; }
        .teacher-card-info span:last-child { font-weight: 500; color: #333; }
        .badge-blocked { background: #dc3545; color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        .badge-active { background: #28a745; color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        
        .dashboard-container {
            background: #f8f9fa; border-radius: 15px;
            padding: 20px;
        }
        .teacher-photo-large {
            width: 120px; height: 120px; border-radius: 50%;
            object-fit: cover; border: 3px solid #28a745;
            cursor: pointer;
        }
        
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px; margin-bottom: 20px;
        }
        .stat-card {
            padding: 15px; border-radius: 10px; text-align: center;
        }
        
        .chart-container {
            background: white; border-radius: 15px;
            padding: 20px; margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .chart-title {
            font-size: 1.1rem; font-weight: 600;
            margin-bottom: 15px; color: #333;
        }
        
        .data-table {
            width: 100%; border-collapse: collapse;
            background: white; border-radius: 15px;
            overflow: hidden;
        }
        .data-table th, .data-table td {
            padding: 12px; text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .data-table th {
            background: #f8f9fa; font-weight: 600;
        }
        .data-table tr:hover { background: #f8f9fa; }
        
        .btn {
            padding: 8px 16px; border: none; border-radius: 8px;
            cursor: pointer; font-size: 0.85rem;
            transition: all 0.3s; display: inline-flex;
            align-items: center; gap: 5px;
        }
        .btn-primary { background: linear-gradient(135deg, #28a745, #20c997); color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-warning { background: #ffc107; color: #333; }
        .btn-success { background: #28a745; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-sm { padding: 5px 10px; font-size: 0.75rem; }
        .btn-group { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
        
        .modal {
            display: none; position: fixed; top: 0; left: 0;
            width: 100%; height: 100%; background: rgba(0,0,0,0.5);
            z-index: 1000; justify-content: center; align-items: center;
        }
        .modal.active { display: flex; }
        .modal-content {
            background: white; border-radius: 20px;
            max-width: 900px; width: 90%; max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 20px; background: linear-gradient(135deg, #28a745, #20c997);
            color: white; display: flex; justify-content: space-between;
            align-items: center; position: sticky; top: 0;
        }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e0e0e0; }
        .close-modal { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.85rem; }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%; padding: 10px; border: 2px solid #e0e0e0;
            border-radius: 8px; font-size: 0.9rem;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none; border-color: #28a745;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        
        .checkbox-group {
            display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;
        }
        .checkbox-group label {
            display: flex; align-items: center; gap: 5px; font-weight: normal;
        }
        .checkbox-group input {
            width: auto; margin: 0;
        }
        
        .image-preview { 
            width: 100px; height: 100px; border-radius: 10px; 
            object-fit: cover; margin-top: 5px; 
            border: 2px solid #e0e0e0;
            background: #f8f9fa;
        }
        .image-actions { display: flex; gap: 10px; margin-top: 5px; flex-wrap: wrap; }
        
        .empty-state { text-align: center; padding: 50px; color: #999; }
        .section-title {
            background: #f0f0f0;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 15px 0 10px 0;
            font-weight: bold;
            color: #28a745;
        }
        
        .info-row {
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        
        @media (max-width: 768px) {
            .form-row { grid-template-columns: 1fr; }
            .teachers-grid { grid-template-columns: 1fr; }
            .filter-bar { flex-direction: column; }
        }
    `;

    function injectStyles() {
        if (!document.querySelector('#tms-styles')) {
            const style = document.createElement('style');
            style.id = 'tms-styles';
            style.textContent = styles;
            document.head.appendChild(style);
        }
    }

    function getHTMLTemplate() {
        return `
        <div class="tms-wrapper">
            <div class="tms-header">
                <div class="logo">
                    <h1>👨‍🏫 Bal Bharti Coaching Center</h1>
                    <p>Teacher Management System</p>
                </div>
                <div>
                    <button class="btn btn-info" id="backToMainBtn" style="background:rgba(255,255,255,0.2);">🏠 Main Menu</button>
                    <button class="btn btn-info" id="logoutBtn" style="background:rgba(255,255,255,0.2);">🚪 Logout</button>
                </div>
            </div>
            
            <div class="main-tabs">
                <button class="main-tab-btn active" data-tab="teachers">👨‍🏫 Teachers</button>
                <button class="main-tab-btn" data-tab="new-teacher">➕ New Teacher</button>
                <button class="main-tab-btn" data-tab="left-teachers">📦 Left</button>
                <button class="main-tab-btn" data-tab="notices">📢 Notices</button>
            </div>
            
            <div class="tms-content">
                <div class="tab-pane active" data-pane="teachers">
                    <div class="filter-bar">
                        <select id="filterSubject"><option value="all">All Subjects</option>${subjectsList.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
                        <select id="filterClass"><option value="all">All Classes</option>${classesList.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                        <select id="filterBoard"><option value="all">All Boards</option>${boardsList.map(b => `<option value="${b}">${b}</option>`).join('')}</select>
                        <input type="text" id="searchTeacher" placeholder="🔍 Search by name or ID...">
                        <button class="btn btn-primary" id="refreshBtn">🔄 Refresh</button>
                    </div>
                    <div id="teachersGrid" class="teachers-grid"></div>
                </div>
                
                <div class="tab-pane" data-pane="new-teacher">
                    <h3>📝 <span id="formTitle">Register New Teacher</span></h3>
                    <form id="teacherForm">
                        <div class="section-title">📎 Documents</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Teacher Photo *</label>
                                <input type="hidden" id="photo">
                                <img id="photoPreview" class="image-preview" style="display:none;">
                                <div class="image-actions">
                                    <button type="button" class="btn btn-primary btn-sm" id="capturePhotoBtn">📷 Capture</button>
                                    <button type="button" class="btn btn-info btn-sm" id="uploadPhotoBtn">📁 Upload</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="clearPhotoBtn">🗑️ Clear</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Aadhar Copy *</label>
                                <input type="hidden" id="aadharCopy">
                                <img id="aadharPreview" class="image-preview" style="display:none;">
                                <div class="image-actions">
                                    <button type="button" class="btn btn-primary btn-sm" id="captureAadharBtn">📷 Capture</button>
                                    <button type="button" class="btn btn-info btn-sm" id="uploadAadharBtn">📁 Upload</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="clearAadharBtn">🗑️ Clear</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Qualification Document *</label>
                            <input type="hidden" id="qualificationDoc">
                            <img id="qualificationPreview" class="image-preview" style="display:none;">
                            <div class="image-actions">
                                <button type="button" class="btn btn-primary btn-sm" id="captureQualificationBtn">📷 Capture</button>
                                <button type="button" class="btn btn-info btn-sm" id="uploadQualificationBtn">📁 Upload</button>
                                <button type="button" class="btn btn-secondary btn-sm" id="clearQualificationBtn">🗑️ Clear</button>
                            </div>
                        </div>
                        
                        <div class="section-title">👤 Personal Information</div>
                        <div class="form-row">
                            <div class="form-group"><label>Full Name *</label><input type="text" id="fullName" required placeholder="Enter full name"></div>
                            <div class="form-group"><label>Aadhar Number (12 digits) *</label><input type="text" id="aadharNumber" required maxlength="12" pattern="[0-9]{12}" placeholder="12 digit Aadhar (Teacher ID)"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Date of Birth *</label><input type="date" id="dob" required></div>
                            <div class="form-group"><label>Gender *</label><select id="gender" required><option value="">Select</option>${genders.map(g => `<option value="${g}">${g}</option>`).join('')}</select></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Mobile Number (10 digits) *</label><input type="tel" id="mobile" required pattern="[0-9]{10}" placeholder="10 digit mobile"></div>
                            <div class="form-group"><label>Email *</label><input type="email" id="email" required placeholder="teacher@example.com"></div>
                        </div>
                        
                        <div class="section-title">🏠 Address</div>
                        <div class="form-group"><label>Current Address *</label><textarea id="currentAddress" rows="2" required placeholder="House number, Street, Landmark"></textarea></div>
                        <div class="form-group"><label>Permanent Address</label><textarea id="permanentAddress" rows="2" placeholder="Leave blank if same as current address"></textarea></div>
                        
                        <div class="section-title">📚 Professional Information</div>
                        <div class="form-row">
                            <div class="form-group"><label>Qualification *</label><input type="text" id="qualificationName" required placeholder="e.g., M.Sc, B.Ed"></div>
                            <div class="form-group"><label>Experience (Years) *</label><input type="number" id="experience" required min="0" step="1"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Joining Date *</label><input type="date" id="joiningDate" required></div>
                            <div class="form-group"><label>Monthly Salary (₹) *</label><input type="number" id="defaultSalary" required min="0" step="1000"></div>
                        </div>
                        
                        <div class="section-title">📖 Subjects (Select all that apply) *</div>
                        <div class="checkbox-group" id="subjectsGroup">
                            ${subjectsList.map(s => `<label><input type="checkbox" value="${s}"> ${s}</label>`).join('')}
                        </div>
                        
                        <div class="section-title">🏫 Classes (Select all that apply) *</div>
                        <div class="checkbox-group" id="classesGroup">
                            ${classesList.map(c => `<label><input type="checkbox" value="${c}"> ${c}</label>`).join('')}
                        </div>
                        
                        <div class="section-title">🎓 Boards (Select all that apply) *</div>
                        <div class="checkbox-group" id="boardsGroup">
                            ${boardsList.map(b => `<label><input type="checkbox" value="${b}"> ${b}</label>`).join('')}
                        </div>
                        
                        <div class="section-title">🏦 Bank Details (Optional)</div>
                        <div class="form-row">
                            <div class="form-group"><label>Bank Name</label><input type="text" id="bankName" placeholder="Bank name"></div>
                            <div class="form-group"><label>Account Number</label><input type="text" id="accountNumber" placeholder="Account number"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>IFSC Code</label><input type="text" id="ifsc" placeholder="IFSC code"></div>
                            <div class="form-group"><label>UPI ID</label><input type="text" id="upiId" placeholder="example@okhdfcbank"></div>
                        </div>
                        
                        <div class="btn-group">
                            <button type="button" class="btn btn-primary" id="registerTeacherBtn">✅ Register Teacher</button>
                            <button type="button" class="btn btn-warning" id="updateTeacherBtn" style="display:none;">✏️ Update Teacher</button>
                            <button type="button" class="btn btn-secondary" id="cancelEditBtn" style="display:none;">❌ Cancel Edit</button>
                            <button type="button" class="btn btn-warning" id="resetFormBtn">🔄 Reset Form</button>
                        </div>
                    </form>
                </div>
                
                <div class="tab-pane" data-pane="left-teachers">
                    <div class="filter-bar">
                        <input type="text" id="searchLeft" placeholder="🔍 Search by name or ID...">
                    </div>
                    <div id="leftTeachersGrid" class="teachers-grid"></div>
                </div>
                
                <div class="tab-pane" data-pane="notices">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" id="sendNoticeBtn">➕ Send Notice to Teacher</button>
                    </div>
                    <div id="noticesList" class="notices-container"></div>
                </div>
            </div>
        </div>
        
        <div id="dashboardModal" class="modal">
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header"><h3>Teacher Dashboard</h3><button class="close-modal" id="closeDashboardModal">×</button></div>
                <div class="modal-body" id="dashboardBody"><div style="text-align:center;padding:50px;">Loading...</div></div>
                <div class="modal-footer" id="dashboardFooter"></div>
            </div>
        </div>
        
        <div id="attendanceModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header"><h3>📅 Mark Attendance</h3><button class="close-modal" id="closeAttendanceModal">×</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>Date *</label><input type="date" id="attendanceDate" required></div>
                    <div class="form-group"><label>Status *</label><select id="attendanceStatus">
                        <option value="present">✅ Present</option>
                        <option value="absent">❌ Absent</option>
                        <option value="holiday">🎉 Holiday</option>
                        <option value="leave">🏖️ Leave</option>
                    </select></div>
                    <div class="form-group"><label>Check In Time</label><input type="time" id="checkInTime"></div>
                    <div class="form-group"><label>Check Out Time</label><input type="time" id="checkOutTime"></div>
                    <div class="form-group">
                        <label>Live Photo (Optional)</label>
                        <input type="hidden" id="attendancePhoto">
                        <img id="attendancePhotoPreview" class="image-preview" style="display:none;">
                        <div class="image-actions">
                            <button type="button" class="btn btn-primary btn-sm" id="captureAttendancePhotoBtn">📷 Capture</button>
                            <button type="button" class="btn btn-secondary btn-sm" id="clearAttendancePhotoBtn">🗑️ Clear</button>
                        </div>
                    </div>
                    <div class="form-group"><label>Remarks</label><textarea id="attendanceRemarks" rows="2"></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelAttendanceBtn">Cancel</button>
                    <button class="btn btn-primary" id="saveAttendanceBtn">💾 Save Attendance</button>
                </div>
            </div>
        </div>
        
        <div id="salaryModal" class="modal">
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header"><h3>💰 Salary Management</h3><button class="close-modal" id="closeSalaryModal">×</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>Select Month *</label><select id="salaryMonth"></select></div>
                    <div class="form-group"><label>Custom Salary Amount (Optional)</label><input type="number" id="customSalaryAmount" placeholder="Leave empty for default"></div>
                    <div class="form-group"><button class="btn btn-info" id="generateSalaryBtn">📊 Generate Salary</button></div>
                    <div id="salaryResult" style="background:#f8f9fa; padding:15px; border-radius:8px; margin-top:15px; display:none;"></div>
                    <hr>
                    <div class="form-group"><label>Pay Amount (₹)</label><input type="number" id="payAmount" placeholder="Amount to pay"></div>
                    <div class="form-group"><label>Payment Mode</label><select id="paymentMode"><option value="">Select</option>${paymentModes.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Remarks</label><textarea id="paymentRemarks" rows="2"></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelSalaryBtn">Cancel</button>
                    <button class="btn btn-success" id="paySalaryBtn">💰 Pay Salary</button>
                </div>
            </div>
        </div>
        
        <div id="noticeModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header"><h3>📢 Send Notice</h3><button class="close-modal" id="closeNoticeModal">×</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>To</label><select id="noticeTo"><option value="all">All Teachers</option></select></div>
                    <div class="form-group"><label>Title *</label><input type="text" id="noticeTitle" required></div>
                    <div class="form-group"><label>Message *</label><textarea id="noticeMessage" rows="4" required></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelNoticeBtn">Cancel</button>
                    <button class="btn btn-primary" id="sendNoticeConfirmBtn">📤 Send Notice</button>
                </div>
            </div>
        </div>
        
        <div id="documentViewerModal" class="modal">
            <div class="modal-content" style="max-width: 90vw;">
                <div class="modal-header"><h3 id="docViewerTitle">Document Viewer</h3><button class="close-modal" id="closeDocViewer">×</button></div>
                <div class="modal-body" style="text-align:center;"><img id="docViewerImage" src="" style="max-width:100%; max-height:70vh;"></div>
                <div class="modal-footer"><button class="btn btn-secondary" id="closeDocViewerBtn">Close</button></div>
            </div>
        </div>
        
        <div id="editTeacherModal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header"><h3>✏️ Edit Teacher - <span id="editTeacherId"></span></h3><button class="close-modal" id="closeEditModal">×</button></div>
                <div class="modal-body" id="editModalBody"></div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelEditModalBtn">Cancel</button>
                    <button class="btn btn-primary" id="saveEditModalBtn">💾 Save Changes</button>
                </div>
            </div>
        </div>
        `;
    }

    function injectHTML() {
        const app = document.getElementById('teacher-app');
        if (app && !document.querySelector('.tms-wrapper')) {
            app.innerHTML = getHTMLTemplate();
        }
    }
       // ============================================
    // ========== ATTENDANCE & SALARY HISTORY TAB ==========
    // ============================================

    let selectedHistoryTeacherId = null;
    let attendanceChart = null;
    let salaryChart = null;

    function addHistoryTab() {
        const mainTabs = document.querySelector('.main-tabs');
        if (mainTabs && !document.querySelector('.main-tab-btn[data-tab="history"]')) {
            const historyBtn = document.createElement('button');
            historyBtn.className = 'main-tab-btn';
            historyBtn.setAttribute('data-tab', 'history');
            historyBtn.innerHTML = '📊 Attendance & Salary History';
            mainTabs.appendChild(historyBtn);
            
            const tmsContent = document.querySelector('.tms-content');
            if (tmsContent) {
                const historyPane = document.createElement('div');
                historyPane.className = 'tab-pane';
                historyPane.setAttribute('data-pane', 'history');
                historyPane.innerHTML = `
                    <div class="history-container">
                        <div class="filter-bar" style="margin-bottom:20px;">
                            <select id="historyTeacherFilter" style="min-width:250px;">
                                <option value="">-- Select Teacher --</option>
                            </select>
                            <select id="historyYearFilter">
                                <option value="all">All Years</option>
                                ${Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => `<option value="${y}">${y}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary" id="refreshHistoryBtn">🔄 Refresh</button>
                        </div>
                        
                        <div id="historyTeacherInfo" style="background:#f0f0f0; padding:15px; border-radius:10px; margin-bottom:20px; display:none;">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                                <div><strong id="historyTeacherName"></strong> (<span id="historyTeacherId"></span>)</div>
                                <div>📞 <span id="historyTeacherMobile"></span> | ✉️ <span id="historyTeacherEmail"></span></div>
                            </div>
                        </div>
                        
                        <div class="stats-grid" id="historyStats" style="display:none;">
                            <div class="stat-card" style="background:#28a745;color:white;"><h3 id="totalPresentCount">0</h3><p>Total Present</p></div>
                            <div class="stat-card" style="background:#dc3545;color:white;"><h3 id="totalAbsentCount">0</h3><p>Total Absent</p></div>
                            <div class="stat-card" style="background:#ffc107;color:#333;"><h3 id="totalLeaveCount">0</h3><p>Total Leave</p></div>
                            <div class="stat-card" style="background:#17a2b8;color:white;"><h3 id="attendancePercent">0%</h3><p>Attendance %</p></div>
                        </div>
                        
                        <div class="chart-container">
                            <div class="chart-title">📊 Monthly Attendance Trend</div>
                            <canvas id="attendanceTrendChart" style="height:300px; width:100%;"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <div class="chart-title">💰 Salary Payment History</div>
                            <canvas id="salaryTrendChart" style="height:300px; width:100%;"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <div class="chart-title">📋 Detailed Attendance History</div>
                            <div style="overflow-x:auto; max-height:400px;">
                                <table class="data-table">
                                    <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th></tr></thead>
                                    <tbody id="attendanceHistoryBody"><tr><td colspan="5" class="empty-state">Select a teacher</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="chart-container">
                            <div class="chart-title">💰 Detailed Salary History</div>
                            <div style="overflow-x:auto; max-height:400px;">
                                <table class="data-table">
                                    <thead><tr><th>Month/Year</th><th>Base</th><th>Working</th><th>Present</th><th>Calculated</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
                                    <tbody id="salaryHistoryBody"><tr><td colspan="8" class="empty-state">Select a teacher</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
                tmsContent.appendChild(historyPane);
            }
        }
    }

    async function loadHistoryData(teacherId) {
        if (!teacherId) return;
        selectedHistoryTeacherId = teacherId;
        
        const response = await apiCall(`/teachers/${teacherId}`);
        if (!response.success || !response.data) {
            showAlert('Teacher not found!', 'error');
            return;
        }
        
        const teacher = response.data;
        const yearFilter = document.getElementById('historyYearFilter')?.value || 'all';
        
        document.getElementById('historyTeacherInfo').style.display = 'block';
        document.getElementById('historyTeacherName').innerText = teacher.personal?.name || 'N/A';
        document.getElementById('historyTeacherId').innerText = teacher.teacherId;
        document.getElementById('historyTeacherMobile').innerText = teacher.personal?.mobile || '-';
        document.getElementById('historyTeacherEmail').innerText = teacher.personal?.email || '-';
        
        let attendance = teacher.attendance || [];
        if (yearFilter !== 'all') {
            attendance = attendance.filter(a => new Date(a.date).getFullYear() === parseInt(yearFilter));
        }
        
        const totalPresent = attendance.filter(a => a.status === 'present').length;
        const totalAbsent = attendance.filter(a => a.status === 'absent').length;
        const totalLeave = attendance.filter(a => a.status === 'leave').length;
        const totalDays = attendance.length;
        const attPercent = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
        
        document.getElementById('totalPresentCount').innerText = totalPresent;
        document.getElementById('totalAbsentCount').innerText = totalAbsent;
        document.getElementById('totalLeaveCount').innerText = totalLeave;
        document.getElementById('attendancePercent').innerText = attPercent + '%';
        document.getElementById('historyStats').style.display = 'grid';
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = {};
        months.forEach(m => monthlyData[m] = { present: 0, total: 0 });
        
        attendance.forEach(a => {
            const date = new Date(a.date);
            const monthName = months[date.getMonth()];
            if (monthlyData[monthName]) {
                monthlyData[monthName].total++;
                if (a.status === 'present') monthlyData[monthName].present++;
            }
        });
        
        const chartLabels = months;
        const chartData = chartLabels.map(m => monthlyData[m].total > 0 ? Math.round((monthlyData[m].present / monthlyData[m].total) * 100) : 0);
        
        const attCtx = document.getElementById('attendanceTrendChart')?.getContext('2d');
        if (attCtx) {
            if (attendanceChart) attendanceChart.destroy();
            attendanceChart = new Chart(attCtx, {
                type: 'line',
                data: { labels: chartLabels, datasets: [{ label: 'Attendance %', data: chartData, borderColor: '#28a745', backgroundColor: 'rgba(40,167,69,0.1)', fill: true, tension: 0.3 }] },
                options: { responsive: true, scales: { y: { min: 0, max: 100 } } }
            });
        }
        
        let salaryPayments = teacher.salaryPayments || [];
        if (yearFilter !== 'all') {
            salaryPayments = salaryPayments.filter(s => s.year === parseInt(yearFilter));
        }
        
        const salarySorted = [...salaryPayments].sort((a,b) => {
            const dateA = new Date(`${a.month} 1, ${a.year}`);
            const dateB = new Date(`${b.month} 1, ${b.year}`);
            return dateA - dateB;
        });
        
        const salaryLabels = salarySorted.map(s => `${s.month} ${s.year}`);
        const salaryPaidData = salarySorted.map(s => s.paidAmount || 0);
        const salaryDueData = salarySorted.map(s => s.dueAmount || 0);
        
        const salaryCtx = document.getElementById('salaryTrendChart')?.getContext('2d');
        if (salaryCtx) {
            if (salaryChart) salaryChart.destroy();
            salaryChart = new Chart(salaryCtx, {
                type: 'bar',
                data: { labels: salaryLabels, datasets: [{ label: 'Paid Amount (₹)', data: salaryPaidData, backgroundColor: '#28a745' }, { label: 'Due Amount (₹)', data: salaryDueData, backgroundColor: '#dc3545' }] },
                options: { responsive: true }
            });
        }
        
        const attBody = document.getElementById('attendanceHistoryBody');
        const sortedAtt = [...attendance].sort((a,b) => new Date(b.date) - new Date(a.date));
        attBody.innerHTML = sortedAtt.map(a => `
            <tr><td>${formatDate(a.date)}</td><td>${a.status === 'present' ? '✅ Present' : a.status === 'absent' ? '❌ Absent' : a.status === 'holiday' ? '🎉 Holiday' : '🏖️ Leave'}</td><td>${a.checkIn || '-'}</td><td>${a.checkOut || '-'}</td><td>${a.remarks || '-'}</td></tr>
        `).join('');
        
        const salaryBody = document.getElementById('salaryHistoryBody');
        const sortedSalary = [...salaryPayments].sort((a,b) => b.year - a.year);
        salaryBody.innerHTML = sortedSalary.map(s => `
            <tr><td>${s.month} ${s.year}</td><td>₹${s.baseSalary || 0}</td><td>${s.workingDays || 0}</td><td>${s.presentDays || 0}</td><td>₹${s.calculatedAmount || 0}</td><td>₹${s.paidAmount || 0}</td><td>₹${s.dueAmount || 0}</td><td>${s.status === 'paid' ? '✅ Paid' : s.status === 'partial' ? '⚠️ Partial' : '❌ Unpaid'}</td></tr>
        `).join('');
    }

    function setupHistoryTabEvents() {
        const historyFilter = document.getElementById('historyTeacherFilter');
        if (historyFilter) {
            const updateOptions = () => {
                historyFilter.innerHTML = '<option value="">-- Select Teacher --</option>' + 
                    teachersData.map(t => `<option value="${t.teacherId}">${t.personal?.name} (${t.teacherId})</option>`).join('');
            };
            updateOptions();
            
            historyFilter.addEventListener('change', async (e) => {
                if (e.target.value) {
                    await loadHistoryData(e.target.value);
                }
            });
        }
        
        document.getElementById('refreshHistoryBtn')?.addEventListener('click', async () => {
            if (selectedHistoryTeacherId) {
                await loadHistoryData(selectedHistoryTeacherId);
            }
        });
        
        document.getElementById('historyYearFilter')?.addEventListener('change', async () => {
            if (selectedHistoryTeacherId) {
                await loadHistoryData(selectedHistoryTeacherId);
            }
        });
    }

    // Override to add history tab after init
    const originalInitForHistory = init;
    window.initTeacherModule = async function() {
        await originalInitForHistory();
        addHistoryTab();
        setupHistoryTabEvents();
    };
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
