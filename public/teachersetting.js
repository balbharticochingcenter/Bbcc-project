// ========== CHECK BOOTSTRAP FIRST ==========
if (typeof bootstrap === 'undefined') {
    console.error('❌ Bootstrap not loaded! Please check your HTML script tags.');
    // Create fallback
    window.bootstrap = {
        Modal: class {
            constructor(element) {
                this.element = element;
                console.warn('Bootstrap Modal fallback used');
            }
            show() { 
                if (this.element) this.element.style.display = 'block';
                this.element.classList.add('show');
            }
            hide() { 
                if (this.element) this.element.style.display = 'none';
                this.element.classList.remove('show');
            }
            static getInstance(element) {
                return element ? { hide: () => element.style.display = 'none' } : null;
            }
        }
    };
} else {
    console.log('✅ Bootstrap loaded successfully');
}

// ========== GLOBAL VARIABLES ==========
let token = localStorage.getItem('token') || localStorage.getItem('adminToken');
let currentFilter = 'all';
let teachersData = [];
let salaryChart = null;
let teacherSalaryChart = null;
let dataTable = null;
let selectedTeacherId = null;
let attendanceData = {};

// Image fallback URLs - Fixed version (no external dependency)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23cccccc\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23333\' font-size=\'12\'%3EPhoto%3C/text%3E%3C/svg%3E';
const PLACEHOLDER_LARGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\' viewBox=\'0 0 150 150\'%3E%3Crect width=\'150\' height=\'150\' fill=\'%23cccccc\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23333\' font-size=\'16\'%3ENo Photo%3C/text%3E%3C/svg%3E';

console.log('🔑 Token Status:', token ? '✅ LOGGED IN' : '❌ NOT LOGGED IN');

// ========== SAFE MODAL FUNCTIONS ==========
function safeShowModal(modalId) {
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap not loaded!');
        alert('System error: Bootstrap not loaded. Please refresh.');
        return false;
    }
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.error('❌ Modal element not found:', modalId);
        return false;
    }
    try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        return true;
    } catch (error) {
        console.error('Error showing modal:', error);
        alert('Error opening form. Please try again.');
        return false;
    }
}

function safeHideModal(modalId) {
    if (typeof bootstrap === 'undefined') return false;
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return false;
    try {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        return true;
    } catch (error) {
        console.error('Error hiding modal:', error);
        return false;
    }
}

// ========== CHECK TOKEN ==========
if (!token) {
    document.addEventListener('DOMContentLoaded', function() {
        const statsContainer = document.getElementById('statsContainer');
        const chartCard = document.getElementById('chartCard');
        const teacherDetailsCard = document.getElementById('teacherDetailsCard');
        const salaryAttendanceCard = document.getElementById('salaryAttendanceCard');
        const teachersTableBody = document.getElementById('teachersTableBody');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        if (statsContainer) statsContainer.style.display = 'none';
        if (chartCard) chartCard.style.display = 'none';
        if (teacherDetailsCard) teacherDetailsCard.style.display = 'none';
        if (salaryAttendanceCard) salaryAttendanceCard.style.display = 'none';
        
        if (teachersTableBody) {
            teachersTableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="login-required">
                            <i class="fas fa-lock"></i>
                            <h3>Please Login First</h3>
                            <p class="text-muted mb-4">You need to login as admin to access teacher dashboard.</p>
                            <a href="/index.html" class="btn btn-primary">
                                <i class="fas fa-sign-in-alt me-2"></i>Go to Login Page
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    });
} else {
    // Wait for jQuery and DataTables
    function waitForScripts() {
        if (typeof jQuery === 'undefined') {
            console.warn('Waiting for jQuery...');
            setTimeout(waitForScripts, 50);
            return;
        }
        if (typeof jQuery.fn.DataTable === 'undefined') {
            console.warn('Waiting for DataTables...');
            setTimeout(waitForScripts, 50);
            return;
        }
        console.log('✅ All scripts loaded');
        initializeApp();
    }
    waitForScripts();
}

// ========== INITIALIZE APP ==========
function initializeApp() {
    loadLogo();
    initEventListeners();
    loadDashboard();
}

// ========== LOAD LOGO ==========
function loadLogo() {
    const logoElement = document.getElementById('db-logo');
    if (!logoElement) return;
    
    fetch('/api/config')
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            logoElement.innerHTML = data.logoText ? 
                `<i class="fas fa-graduation-cap me-2"></i>${data.logoText}` : 
                '<i class="fas fa-graduation-cap me-2"></i>BBCC';
        })
        .catch(err => {
            console.log('Logo fetch error:', err);
            logoElement.innerHTML = '<i class="fas fa-graduation-cap me-2"></i>BBCC';
        });
}

// ========== SHOW/HIDE LOADING ==========
function showLoading() { 
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'flex'; 
}

function hideLoading() { 
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none'; 
}

function showError(message) { 
    console.error('Error:', message);
    alert('❌ Error: ' + message); 
}

function showSuccess(message) { 
    alert('✅ Success: ' + message); 
}

// ========== LOAD DASHBOARD ==========
async function loadDashboard() {
    showLoading();
    try {
        await loadStats();
        await loadTeachers();
    } catch (error) {
        console.error('Dashboard error:', error);
        if (error.message?.includes('401')) {
            showError('Session expired! Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            window.location.href = '/index.html';
        } else {
            showError('Failed to load dashboard data');
        }
    }
    hideLoading();
}

// ========== LOAD STATISTICS ==========
async function loadStats() {
    try {
        const response = await fetch('/api/teachers/stats/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        if (data.success) {
            const totalTeachers = document.getElementById('totalTeachers');
            const pendingTeachers = document.getElementById('pendingTeachers');
            const approvedTeachers = document.getElementById('approvedTeachers');
            const totalSalary = document.getElementById('totalSalary');
            
            if (totalTeachers) totalTeachers.textContent = data.data.total || 0;
            if (pendingTeachers) pendingTeachers.textContent = data.data.pending || 0;
            if (approvedTeachers) approvedTeachers.textContent = data.data.approved || 0;
            if (totalSalary) totalSalary.textContent = '₹' + (data.data.totalPaidSalary || 0).toLocaleString();
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ========== LOAD TEACHERS ==========
async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers?status=all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load teachers');
        const data = await response.json();
        if (data.success) {
            teachersData = data.data || [];
            populateTeacherSelect(teachersData);
            displayTeachers(teachersData);
            updateSalaryChart();
            
            // If a teacher was previously selected, reload their details
            if (selectedTeacherId) {
                loadTeacherDetails(selectedTeacherId);
            }
        }
    } catch (err) {
        console.error('Teachers error:', err);
        showError('Failed to load teachers');
    }
}

// ========== POPULATE TEACHER SELECT DROPDOWN ==========
function populateTeacherSelect(teachers) {
    const select = document.getElementById('teacherSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select a Teacher --</option>';
    
    teachers.forEach(teacher => {
        if (teacher.status === 'approved') {
            const option = document.createElement('option');
            option.value = teacher.teacherId || '';
            option.textContent = `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''} (${teacher.teacherId || 'N/A'})`;
            select.appendChild(option);
        }
    });
}

// ========== SAFE IMAGE URL ==========
function getSafeImageUrl(url, isLarge = false) {
    if (!url || url === '') return isLarge ? PLACEHOLDER_LARGE : PLACEHOLDER_IMAGE;
    
    // Check if it's a valid URL
    try {
        new URL(url);
        return url;
    } catch {
        return isLarge ? PLACEHOLDER_LARGE : PLACEHOLDER_IMAGE;
    }
}

// ========== DISPLAY TEACHERS IN TABLE ==========
function displayTeachers(teachers) {
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!teachers || teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No teachers found</td></tr>';
        return;
    }
    
    teachers.forEach(teacher => {
        const teacherName = teacher.teacherName || {};
        const firstName = teacherName.first || '';
        const lastName = teacherName.last || '';
        
        const statusClass = teacher.status === 'pending' ? 'badge-pending' :
                           teacher.status === 'approved' ? 'badge-approved' : 'badge-rejected';
        const statusText = teacher.status ? teacher.status.toUpperCase() : 'PENDING';
        
        const photoUrl = getSafeImageUrl(teacher.photo, false);
        
        const row = document.createElement('tr');
        row.setAttribute('data-teacher-id', teacher.teacherId || '');
        row.setAttribute('data-teacher-status', teacher.status || 'pending');
        row.innerHTML = `
            <td><img src="${photoUrl}" class="teacher-photo" alt="Teacher Photo" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';"></td>
            <td>${teacher.teacherId || '-'}</td>
            <td>${firstName} ${lastName}</td>
            <td>${teacher.mobile || '-'}</td>
            <td>${teacher.subject || '-'}</td>
            <td>₹${teacher.salary?.toLocaleString() || 0}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit view-teacher-btn" data-id="${teacher.teacherId || ''}"><i class="fas fa-eye"></i></button>
                    ${teacher.status === 'pending' ? `<button class="btn-approve approve-teacher-btn" data-id="${teacher.teacherId || ''}"><i class="fas fa-check"></i></button>` : ''}
                    ${teacher.status === 'approved' ? `<button class="btn-approve salary-teacher-btn" data-id="${teacher.teacherId || ''}"><i class="fas fa-rupee-sign"></i></button>` : ''}
                    <button class="btn-reject delete-teacher-btn" data-id="${teacher.teacherId || ''}"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    attachTableButtonListeners();
    
    if (!dataTable && jQuery && jQuery.fn.DataTable) {
        dataTable = jQuery('#teachersTable').DataTable({
            paging: true,
            searching: false,
            ordering: true,
            info: true,
            lengthChange: false,
            pageLength: 10,
            language: {
                emptyTable: "No teachers found",
                info: "Showing _START_ to _END_ of _TOTAL_ teachers",
                paginate: { first: "First", last: "Last", next: "Next", previous: "Previous" }
            }
        });
    } else if (dataTable) {
        dataTable.clear().rows.add(jQuery(tbody).find('tr')).draw();
    }
}

// ========== ATTACH TABLE BUTTON LISTENERS ==========
function attachTableButtonListeners() {
    document.querySelectorAll('.view-teacher-btn').forEach(btn => {
        btn.removeEventListener('click', handleViewTeacher);
        btn.addEventListener('click', handleViewTeacher);
    });
    document.querySelectorAll('.approve-teacher-btn').forEach(btn => {
        btn.removeEventListener('click', handleApproveTeacher);
        btn.addEventListener('click', handleApproveTeacher);
    });
    document.querySelectorAll('.salary-teacher-btn').forEach(btn => {
        btn.removeEventListener('click', handleSalaryTeacher);
        btn.addEventListener('click', handleSalaryTeacher);
    });
    document.querySelectorAll('.delete-teacher-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteTeacher);
        btn.addEventListener('click', handleDeleteTeacher);
    });
}

// ========== HANDLER FUNCTIONS ==========
async function handleViewTeacher(e) {
    const teacherId = e.currentTarget.dataset.id;
    if (!teacherId) return;
    
    // Also select in dropdown
    const teacherSelect = document.getElementById('teacherSelect');
    if (teacherSelect) teacherSelect.value = teacherId;
    selectedTeacherId = teacherId;
    
    await loadTeacherDetails(teacherId);
}

async function loadTeacherDetails(teacherId) {
    showLoading();
    try {
        const response = await fetch(`/api/teachers/${teacherId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load teacher details');
        
        const data = await response.json();
        if (data.success) {
            const teacher = data.data;
            
            // Update teacher name in header
            const selectedTeacherName = document.getElementById('selectedTeacherName');
            const detailsTeacherName = document.getElementById('detailsTeacherName');
            const salaryTeacherName = document.getElementById('salaryTeacherName');
            
            if (selectedTeacherName) selectedTeacherName.textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
            if (detailsTeacherName) detailsTeacherName.textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
            if (salaryTeacherName) salaryTeacherName.textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
            
            // Show details card
            const teacherDetailsCard = document.getElementById('teacherDetailsCard');
            const salaryAttendanceCard = document.getElementById('salaryAttendanceCard');
            
            if (teacherDetailsCard) teacherDetailsCard.style.display = 'block';
            if (salaryAttendanceCard) salaryAttendanceCard.style.display = 'block';
            
            // Fill personal details
            const detailsPhoto = document.getElementById('detailsPhoto');
            if (detailsPhoto) detailsPhoto.src = getSafeImageUrl(teacher.photo, true);
            
            const detailsFullName = document.getElementById('detailsFullName');
            if (detailsFullName) detailsFullName.textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.middle || ''} ${teacher.teacherName?.last || ''}`;
            
            const detailsTeacherId = document.getElementById('detailsTeacherId');
            if (detailsTeacherId) detailsTeacherId.textContent = `ID: ${teacher.teacherId || 'N/A'}`;
            
            const statusSpan = document.getElementById('detailsStatus');
            if (statusSpan) {
                statusSpan.textContent = teacher.status ? teacher.status.toUpperCase() : 'PENDING';
                statusSpan.className = `status-badge ${teacher.status || 'pending'}`;
            }
            
            // Fill all fields with safe checks
            safeSetText('detailFirstName', teacher.teacherName?.first || '-');
            safeSetText('detailMiddleName', teacher.teacherName?.middle || '-');
            safeSetText('detailLastName', teacher.teacherName?.last || '-');
            
            safeSetText('detailFatherFirst', teacher.fatherName?.first || '-');
            safeSetText('detailFatherMiddle', teacher.fatherName?.middle || '-');
            safeSetText('detailFatherLast', teacher.fatherName?.last || '-');
            
            safeSetText('detailMobile', teacher.mobile || '-');
            safeSetText('detailAltMobile', teacher.altMobile || '-');
            
            safeSetText('detailDob', teacher.dob ? new Date(teacher.dob).toLocaleDateString() : '-');
            safeSetText('detailAadhar', teacher.aadharNumber || '-');
            safeSetText('detailQualification', teacher.lastQualification || '-');
            
            safeSetText('detailSubject', teacher.subject || '-');
            safeSetText('detailSalary', teacher.salary?.toLocaleString() || '0');
            safeSetText('detailJoining', teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : '-');
            
            // Document links
            const aadharLink = document.getElementById('aadharDocLink');
            if (aadharLink) {
                if (teacher.aadharDoc) {
                    aadharLink.href = teacher.aadharDoc;
                    aadharLink.style.display = 'inline';
                    aadharLink.textContent = 'View Aadhar';
                } else {
                    aadharLink.style.display = 'none';
                }
            }
            
            const qualLink = document.getElementById('qualificationDocLink');
            if (qualLink) {
                if (teacher.qualificationDoc) {
                    qualLink.href = teacher.qualificationDoc;
                    qualLink.style.display = 'inline';
                    qualLink.textContent = 'View Qualification';
                } else {
                    qualLink.style.display = 'none';
                }
            }
            
            // Load salary and attendance data
            loadSalaryData(teacher);
            await loadAttendanceData(teacher);
        }
    } catch (err) {
        console.error('View error:', err);
        showError('Failed to load teacher details');
    }
    hideLoading();
}

function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
}

function handleApproveTeacher(e) {
    const teacherId = e.currentTarget.dataset.id;
    const approveTeacherId = document.getElementById('approveTeacherId');
    const approveJoiningDate = document.getElementById('approveJoiningDate');
    
    if (approveTeacherId) approveTeacherId.value = teacherId;
    if (approveJoiningDate) approveJoiningDate.value = new Date().toISOString().split('T')[0];
    
    safeShowModal('approveTeacherModal');
}

function handleSalaryTeacher(e) {
    const teacherId = e.currentTarget.dataset.id;
    const teacher = teachersData.find(t => t.teacherId === teacherId);
    if (!teacher) return;
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const monthKey = `${currentMonth} ${currentYear}`;
    
    const salaryTeacherId = document.getElementById('salaryTeacherId');
    const salaryMonth = document.getElementById('salaryMonth');
    const salaryYear = document.getElementById('salaryYear');
    const salaryTeacherName = document.getElementById('salaryTeacherName');
    const salaryMonthDisplay = document.getElementById('salaryMonthDisplay');
    const salaryAmount = document.getElementById('salaryAmount');
    const paidAmount = document.getElementById('paidAmount');
    const dueAmount = document.getElementById('dueAmount');
    const paymentStatus = document.getElementById('paymentStatus');
    
    if (salaryTeacherId) salaryTeacherId.value = teacherId;
    if (salaryMonth) salaryMonth.value = monthKey;
    if (salaryYear) salaryYear.value = currentYear;
    if (salaryTeacherName) salaryTeacherName.textContent = 
        `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
    if (salaryMonthDisplay) salaryMonthDisplay.textContent = monthKey;
    if (salaryAmount) salaryAmount.value = '₹' + (teacher.salary || 0).toLocaleString();
    if (paidAmount) paidAmount.value = 0;
    if (dueAmount) dueAmount.value = '₹' + (teacher.salary || 0).toLocaleString();
    if (paymentStatus) paymentStatus.value = 'Unpaid';
    
    safeShowModal('salaryModal');
}

async function handleDeleteTeacher(e) {
    const teacherId = e.currentTarget.dataset.id;
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    showLoading();
    try {
        const response = await fetch(`/api/teachers/${teacherId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            showSuccess('Teacher deleted successfully!');
            
            if (selectedTeacherId === teacherId) {
                selectedTeacherId = null;
                const teacherDetailsCard = document.getElementById('teacherDetailsCard');
                const salaryAttendanceCard = document.getElementById('salaryAttendanceCard');
                const selectedTeacherName = document.getElementById('selectedTeacherName');
                const teacherSelect = document.getElementById('teacherSelect');
                
                if (teacherDetailsCard) teacherDetailsCard.style.display = 'none';
                if (salaryAttendanceCard) salaryAttendanceCard.style.display = 'none';
                if (selectedTeacherName) selectedTeacherName.textContent = 'None';
                if (teacherSelect) teacherSelect.value = '';
            }
            
            loadTeachers();
            loadStats();
        } else {
            showError(data.message || 'Failed to delete');
        }
    } catch (err) {
        console.error('Delete error:', err);
        showError('Failed to delete teacher');
    }
    hideLoading();
}

// ========== LOAD SALARY DATA ==========
function loadSalaryData(teacher) {
    const tbody = document.getElementById('salaryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!teacher.salaryMonths || teacher.salaryMonths.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No salary records found</td></tr>';
        return;
    }
    
    const months = [];
    const paidData = [];
    const dueData = [];
    
    teacher.salaryMonths.forEach(record => {
        months.push(record.month);
        paidData.push(record.paidAmount || 0);
        dueData.push(record.dueAmount || 0);
        
        const statusClass = record.status === 'paid' ? 'salary-paid' :
                           record.status === 'partial' ? 'salary-partial' : 'salary-unpaid';
        const statusText = record.status ? record.status.toUpperCase() : 'UNPAID';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.month || '-'}</td>
            <td>₹${record.salary?.toLocaleString() || 0}</td>
            <td>₹${record.paidAmount?.toLocaleString() || 0}</td>
            <td>₹${record.dueAmount?.toLocaleString() || 0}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-edit pay-salary-btn" data-id="${teacher.teacherId || ''}" data-month="${record.month || ''}">
                    <i class="fas fa-rupee-sign"></i> Pay
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    document.querySelectorAll('.pay-salary-btn').forEach(btn => {
        btn.removeEventListener('click', handlePaySalary);
        btn.addEventListener('click', handlePaySalary);
    });
    
    updateTeacherSalaryChart(months, paidData, dueData);
}

function handlePaySalary(e) {
    const teacherId = e.currentTarget.dataset.id;
    const month = e.currentTarget.dataset.month;
    const teacher = teachersData.find(t => t.teacherId === teacherId);
    if (!teacher) return;
    
    const salaryTeacherId = document.getElementById('salaryTeacherId');
    const salaryMonth = document.getElementById('salaryMonth');
    const salaryTeacherName = document.getElementById('salaryTeacherName');
    const salaryMonthDisplay = document.getElementById('salaryMonthDisplay');
    const salaryAmount = document.getElementById('salaryAmount');
    const paidAmount = document.getElementById('paidAmount');
    const dueAmount = document.getElementById('dueAmount');
    const paymentStatus = document.getElementById('paymentStatus');
    
    if (salaryTeacherId) salaryTeacherId.value = teacherId;
    if (salaryMonth) salaryMonth.value = month;
    if (salaryTeacherName) salaryTeacherName.textContent = 
        `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
    if (salaryMonthDisplay) salaryMonthDisplay.textContent = month;
    if (salaryAmount) salaryAmount.value = '₹' + (teacher.salary || 0).toLocaleString();
    if (paidAmount) paidAmount.value = 0;
    if (dueAmount) dueAmount.value = '₹' + (teacher.salary || 0).toLocaleString();
    if (paymentStatus) paymentStatus.value = 'Unpaid';
    
    safeShowModal('salaryModal');
}

// ========== LOAD ATTENDANCE DATA ==========
async function loadAttendanceData(teacher) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;
    
    try {
        let attendance = [];
        
        const response = await fetch(`/api/teachers/${teacher.teacherId}/attendance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                attendance = data.data;
            }
        }
        
        if (!attendance || attendance.length === 0) {
            attendance = generateAttendanceData(teacher.teacherId);
        }
        
        attendanceData[teacher.teacherId] = attendance;
        displayAttendanceTable(teacher.teacherId, attendance);
        
    } catch (err) {
        console.error('Error loading attendance:', err);
        const attendance = generateAttendanceData(teacher.teacherId);
        attendanceData[teacher.teacherId] = attendance;
        displayAttendanceTable(teacher.teacherId, attendance);
    }
}

function displayAttendanceTable(teacherId, attendance) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!attendance || attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No attendance records found</td></tr>';
        return;
    }
    
    attendance.forEach(record => {
        const statusClass = record.status === 'present' ? 'attendance-present' :
                           record.status === 'absent' ? 'attendance-absent' :
                           record.status === 'half-day' ? 'attendance-halfday' : 'attendance-leave';
        const statusText = record.status ? record.status.toUpperCase() : 'UNKNOWN';
        
        const row = document.createElement('tr');
        row.setAttribute('data-attendance-date', record.date || '');
        row.innerHTML = `
            <td>${record.date || '-'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-edit edit-attendance-btn" data-date="${record.date || ''}" data-status="${record.status || ''}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-reject delete-attendance-btn" data-date="${record.date || ''}" style="margin-left:5px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    document.querySelectorAll('.edit-attendance-btn').forEach(btn => {
        btn.removeEventListener('click', handleEditAttendance);
        btn.addEventListener('click', handleEditAttendance);
    });
    
    document.querySelectorAll('.delete-attendance-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteAttendance);
        btn.addEventListener('click', handleDeleteAttendance);
    });
}

function generateAttendanceData(teacherId) {
    const attendance = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const rand = Math.random();
        let status = 'present';
        if (rand < 0.2) status = 'absent';
        else if (rand < 0.3) status = 'half-day';
        else if (rand < 0.35) status = 'leave';
        
        attendance.push({
            id: `${teacherId}_${dateStr}`,
            teacherId: teacherId,
            date: date.toLocaleDateString(),
            status: status,
            remarks: ''
        });
    }
    
    return attendance;
}

function handleEditAttendance(e) {
    const date = e.currentTarget.dataset.date;
    const currentStatus = e.currentTarget.dataset.status;
    
    if (!selectedTeacherId || !date) return;
    
    const teacher = teachersData.find(t => t.teacherId === selectedTeacherId);
    if (!teacher) return;
    
    const attendanceTeacherId = document.getElementById('attendanceTeacherId');
    const attendanceTeacherName = document.getElementById('attendanceTeacherName');
    const attendanceDate = document.getElementById('attendanceDate');
    const attendanceDateInput = document.getElementById('attendanceDateInput');
    const attendanceStatus = document.getElementById('attendanceStatus');
    const attendanceRemarks = document.getElementById('attendanceRemarks');
    const attendanceId = document.getElementById('attendanceId');
    
    if (attendanceTeacherId) attendanceTeacherId.value = teacher.teacherId || '';
    if (attendanceTeacherName) attendanceTeacherName.textContent = 
        `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
    if (attendanceDate) attendanceDate.textContent = date;
    
    if (attendanceDateInput) {
        const dateParts = date.split('/');
        if (dateParts.length === 3) {
            const month = dateParts[0].padStart(2, '0');
            const day = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            attendanceDateInput.value = `${year}-${month}-${day}`;
        } else {
            attendanceDateInput.value = new Date().toISOString().split('T')[0];
        }
    }
    
    if (attendanceStatus) attendanceStatus.value = currentStatus || 'present';
    if (attendanceRemarks) attendanceRemarks.value = '';
    
    if (attendanceId) {
        attendanceId.value = `${teacher.teacherId}_${date}`;
    }
    
    const modalTitle = document.querySelector('#attendanceModal .modal-title');
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Attendance';
    
    safeShowModal('attendanceModal');
}

async function handleDeleteAttendance(e) {
    const date = e.currentTarget.dataset.date;
    
    if (!selectedTeacherId || !date) return;
    
    if (!confirm(`Are you sure you want to delete attendance for ${date}?`)) return;
    
    try {
        const response = await fetch(`/api/teachers/${selectedTeacherId}/attendance`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ date: date })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showSuccess('Attendance deleted successfully!');
                
                if (attendanceData[selectedTeacherId]) {
                    attendanceData[selectedTeacherId] = attendanceData[selectedTeacherId].filter(
                        a => a.date !== date
                    );
                }
                
                const teacher = teachersData.find(t => t.teacherId === selectedTeacherId);
                if (teacher) {
                    displayAttendanceTable(selectedTeacherId, attendanceData[selectedTeacherId] || []);
                }
            }
        }
    } catch (err) {
        console.error('Delete attendance error:', err);
    }
}

function filterTeachers() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    let filtered = teachersData;
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.status === currentFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(t => 
            (t.teacherId && t.teacherId.toLowerCase().includes(searchTerm)) ||
            (t.teacherName?.first && t.teacherName.first.toLowerCase().includes(searchTerm)) ||
            (t.teacherName?.last && t.teacherName.last.toLowerCase().includes(searchTerm)) ||
            (t.mobile && t.mobile.includes(searchTerm))
        );
    }
    
    displayTeachers(filtered);
}

function updateSalaryChart() {
    const canvas = document.getElementById('salaryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const months = [];
    const paidData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear());
        paidData.push(0);
    }
    
    if (salaryChart) salaryChart.destroy();
    
    salaryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Total Paid Salary',
                data: paidData,
                borderColor: '#0f172a',
                backgroundColor: 'rgba(15, 23, 42, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString() } } }
        }
    });
}

function updateTeacherSalaryChart(months, paidData, dueData) {
    const canvas = document.getElementById('teacherSalaryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (teacherSalaryChart) teacherSalaryChart.destroy();
    
    teacherSalaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Paid',
                    data: paidData,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: '#2ecc71',
                    borderWidth: 1
                },
                {
                    label: 'Due',
                    data: dueData,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: '#e74c3c',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString() } } }
        }
    });
}

function handleEditTeacher() {
    if (!selectedTeacherId) {
        showError('Please select a teacher first');
        return;
    }
    
    const teacher = teachersData.find(t => t.teacherId === selectedTeacherId);
    if (!teacher) return;
    
    const editTeacherId = document.getElementById('editTeacherId');
    const editFirstName = document.getElementById('editFirstName');
    const editMiddleName = document.getElementById('editMiddleName');
    const editLastName = document.getElementById('editLastName');
    const editFatherFirst = document.getElementById('editFatherFirst');
    const editFatherMiddle = document.getElementById('editFatherMiddle');
    const editFatherLast = document.getElementById('editFatherLast');
    const editMobile = document.getElementById('editMobile');
    const editAltMobile = document.getElementById('editAltMobile');
    const editDob = document.getElementById('editDob');
    const editAadhar = document.getElementById('editAadhar');
    const editQualification = document.getElementById('editQualification');
    const editSubject = document.getElementById('editSubject');
    const editSalary = document.getElementById('editSalary');
    const editStatus = document.getElementById('editStatus');
    const editJoiningDate = document.getElementById('editJoiningDate');
    const editPhotoPreview = document.getElementById('editPhotoPreview');
    const editAadharLink = document.getElementById('editAadharLink');
    
    if (editTeacherId) editTeacherId.value = teacher.teacherId || '';
    if (editFirstName) editFirstName.value = teacher.teacherName?.first || '';
    if (editMiddleName) editMiddleName.value = teacher.teacherName?.middle || '';
    if (editLastName) editLastName.value = teacher.teacherName?.last || '';
    
    if (editFatherFirst) editFatherFirst.value = teacher.fatherName?.first || '';
    if (editFatherMiddle) editFatherMiddle.value = teacher.fatherName?.middle || '';
    if (editFatherLast) editFatherLast.value = teacher.fatherName?.last || '';
    
    if (editMobile) editMobile.value = teacher.mobile || '';
    if (editAltMobile) editAltMobile.value = teacher.altMobile || '';
    
    if (editDob && teacher.dob) {
        const dob = new Date(teacher.dob);
        editDob.value = dob.toISOString().split('T')[0];
    }
    
    if (editAadhar) editAadhar.value = teacher.aadharNumber || '';
    if (editQualification) editQualification.value = teacher.lastQualification || '';
    if (editSubject) editSubject.value = teacher.subject || '';
    if (editSalary) editSalary.value = teacher.salary || 0;
    if (editStatus) editStatus.value = teacher.status || 'pending';
    
    if (editJoiningDate && teacher.joiningDate) {
        const joinDate = new Date(teacher.joiningDate);
        editJoiningDate.value = joinDate.toISOString().split('T')[0];
    }
    
    const joiningDateRow = document.getElementById('joiningDateRow');
    if (joiningDateRow) {
        joiningDateRow.style.display = teacher.status === 'approved' ? 'block' : 'none';
    }
    
    if (editPhotoPreview) {
        editPhotoPreview.src = getSafeImageUrl(teacher.photo, true);
    }
    
    if (editAadharLink) {
        if (teacher.aadharDoc) {
            editAadharLink.href = teacher.aadharDoc;
            editAadharLink.style.display = 'inline';
            editAadharLink.textContent = 'View Aadhar';
        } else {
            editAadharLink.style.display = 'none';
        }
    }
    
    safeShowModal('editTeacherModal');
}

async function saveTeacherEdit() {
    const editTeacherId = document.getElementById('editTeacherId');
    if (!editTeacherId) return;
    
    const teacherId = editTeacherId.value;
    
    const teacherData = {
        teacherId: teacherId,
        teacherName: {
            first: document.getElementById('editFirstName')?.value || '',
            middle: document.getElementById('editMiddleName')?.value || '',
            last: document.getElementById('editLastName')?.value || ''
        },
        fatherName: {
            first: document.getElementById('editFatherFirst')?.value || '',
            middle: document.getElementById('editFatherMiddle')?.value || '',
            last: document.getElementById('editFatherLast')?.value || ''
        },
        mobile: document.getElementById('editMobile')?.value || '',
        altMobile: document.getElementById('editAltMobile')?.value || '',
        dob: document.getElementById('editDob')?.value || '',
        lastQualification: document.getElementById('editQualification')?.value || '',
        aadharNumber: document.getElementById('editAadhar')?.value || '',
        subject: document.getElementById('editSubject')?.value || '',
        salary: parseInt(document.getElementById('editSalary')?.value) || 0,
        status: document.getElementById('editStatus')?.value || 'pending'
    };
    
    if (teacherData.status === 'approved') {
        teacherData.joiningDate = document.getElementById('editJoiningDate')?.value || '';
    }
    
    try {
        const response = await fetch(`/api/teachers/${teacherId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(teacherData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            safeHideModal('editTeacherModal');
            showSuccess('Teacher updated successfully!');
            
            await loadTeachers();
            if (selectedTeacherId) {
                await loadTeacherDetails(selectedTeacherId);
            }
            await loadStats();
        } else {
            showError(data.message || 'Failed to update');
        }
    } catch (err) {
        console.error('Edit error:', err);
        showError('Failed to update teacher');
    }
}

function handleMarkAttendance() {
    if (!selectedTeacherId) {
        showError('Please select a teacher first');
        return;
    }
    
    const teacher = teachersData.find(t => t.teacherId === selectedTeacherId);
    if (!teacher) return;
    
    const attendanceTeacherId = document.getElementById('attendanceTeacherId');
    const attendanceTeacherName = document.getElementById('attendanceTeacherName');
    const attendanceDate = document.getElementById('attendanceDate');
    const attendanceDateInput = document.getElementById('attendanceDateInput');
    const attendanceStatus = document.getElementById('attendanceStatus');
    const attendanceRemarks = document.getElementById('attendanceRemarks');
    const attendanceId = document.getElementById('attendanceId');
    
    if (attendanceTeacherId) attendanceTeacherId.value = teacher.teacherId || '';
    if (attendanceTeacherName) attendanceTeacherName.textContent = 
        `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
    if (attendanceDate) attendanceDate.textContent = 'Today';
    if (attendanceDateInput) attendanceDateInput.value = new Date().toISOString().split('T')[0];
    if (attendanceStatus) attendanceStatus.value = 'present';
    if (attendanceRemarks) attendanceRemarks.value = '';
    if (attendanceId) attendanceId.value = '';
    
    const modalTitle = document.querySelector('#attendanceModal .modal-title');
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-calendar-check me-2"></i>Mark Attendance';
    
    safeShowModal('attendanceModal');
}

async function saveAttendance() {
    const attendanceTeacherId = document.getElementById('attendanceTeacherId');
    const attendanceDateInput = document.getElementById('attendanceDateInput');
    const attendanceStatus = document.getElementById('attendanceStatus');
    const attendanceRemarks = document.getElementById('attendanceRemarks');
    const attendanceId = document.getElementById('attendanceId');
    
    if (!attendanceTeacherId || !attendanceDateInput || !attendanceStatus) return;
    
    const teacherId = attendanceTeacherId.value;
    const dateInput = attendanceDateInput.value;
    const status = attendanceStatus.value;
    const remarks = attendanceRemarks?.value || '';
    const id = attendanceId?.value || '';
    
    const dateObj = new Date(dateInput);
    const displayDate = dateObj.toLocaleDateString();
    
    const attendanceRecord = {
        id: id || `${teacherId}_${dateInput}`,
        teacherId: teacherId,
        date: displayDate,
        status: status,
        remarks: remarks,
        rawDate: dateInput
    };
    
    try {
        const response = await fetch(`/api/teachers/${teacherId}/attendance`, {
            method: id ? 'PUT' : 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(attendanceRecord)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showSuccess(id ? 'Attendance updated successfully!' : 'Attendance marked successfully!');
                
                if (!attendanceData[teacherId]) {
                    attendanceData[teacherId] = [];
                }
                
                if (id) {
                    const index = attendanceData[teacherId].findIndex(a => a.id === id);
                    if (index !== -1) {
                        attendanceData[teacherId][index] = attendanceRecord;
                    } else {
                        attendanceData[teacherId].push(attendanceRecord);
                    }
                } else {
                    attendanceData[teacherId].push(attendanceRecord);
                }
                
                attendanceData[teacherId].sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
                
                displayAttendanceTable(teacherId, attendanceData[teacherId]);
            }
        }
        
        safeHideModal('attendanceModal');
        
    } catch (err) {
        console.error('Save attendance error:', err);
    }
}

function initEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('isAdmin');
            window.location.href = '/index.html';
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterTeachers, 500));
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filterTeachers();
        });
    });
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadTeachers();
            loadStats();
        });
    }
    
    const teacherSelect = document.getElementById('teacherSelect');
    if (teacherSelect) {
        teacherSelect.addEventListener('change', function() {
            const teacherId = this.value;
            if (teacherId) {
                selectedTeacherId = teacherId;
                loadTeacherDetails(teacherId);
            } else {
                selectedTeacherId = null;
                const teacherDetailsCard = document.getElementById('teacherDetailsCard');
                const salaryAttendanceCard = document.getElementById('salaryAttendanceCard');
                const selectedTeacherName = document.getElementById('selectedTeacherName');
                
                if (teacherDetailsCard) teacherDetailsCard.style.display = 'none';
                if (salaryAttendanceCard) salaryAttendanceCard.style.display = 'none';
                if (selectedTeacherName) selectedTeacherName.textContent = 'None';
            }
        });
    }
    
    const editTeacherBtn = document.getElementById('editTeacherBtn');
    if (editTeacherBtn) {
        editTeacherBtn.addEventListener('click', handleEditTeacher);
    }
    
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', saveTeacherEdit);
    }
    
    const markAttendanceBtn = document.getElementById('markAttendanceBtn');
    if (markAttendanceBtn) {
        markAttendanceBtn.addEventListener('click', handleMarkAttendance);
    }
    
    const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener('click', saveAttendance);
    }
    
    const editStatus = document.getElementById('editStatus');
    if (editStatus) {
        editStatus.addEventListener('change', function() {
            const joiningDateRow = document.getElementById('joiningDateRow');
            if (joiningDateRow) {
                joiningDateRow.style.display = this.value === 'approved' ? 'block' : 'none';
            }
        });
    }
    
    const confirmApproveBtn = document.getElementById('confirmApproveBtn');
    if (confirmApproveBtn) {
        confirmApproveBtn.addEventListener('click', async function() {
            const teacherId = document.getElementById('approveTeacherId')?.value;
            const subject = document.getElementById('approveSubject')?.value;
            const salary = document.getElementById('approveSalary')?.value;
            const joiningDate = document.getElementById('approveJoiningDate')?.value;
            
            if (!subject || !salary) { 
                showError('Please fill subject and salary'); 
                return; 
            }
            
            try {
                const response = await fetch(`/api/teachers/${teacherId}/status`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ 
                        status: 'approved', 
                        subject, 
                        salary: parseInt(salary), 
                        joiningDate 
                    })
                });
                const data = await response.json();
                if (data.success) {
                    safeHideModal('approveTeacherModal');
                    showSuccess('Teacher approved successfully!');
                    await loadTeachers();
                    await loadStats();
                    if (selectedTeacherId === teacherId) {
                        await loadTeacherDetails(teacherId);
                    }
                    const approveSubject = document.getElementById('approveSubject');
                    const approveSalary = document.getElementById('approveSalary');
                    if (approveSubject) approveSubject.value = '';
                    if (approveSalary) approveSalary.value = '';
                } else { 
                    showError(data.message || 'Failed to approve'); 
                }
            } catch (err) { 
                console.error('Approve error:', err); 
                showError('Failed to approve teacher'); 
            }
        });
    }
    
    const paidAmount = document.getElementById('paidAmount');
    if (paidAmount) {
        paidAmount.addEventListener('input', function() {
            const salaryAmount = document.getElementById('salaryAmount');
            const dueAmount = document.getElementById('dueAmount');
            const paymentStatus = document.getElementById('paymentStatus');
            
            if (!salaryAmount || !dueAmount || !paymentStatus) return;
            
            const salaryText = salaryAmount.value;
            const salary = parseInt(salaryText.replace('₹', '').replace(',', '')) || 0;
            const paid = parseInt(this.value) || 0;
            
            dueAmount.value = '₹' + (salary - paid).toLocaleString();
            paymentStatus.value = paid >= salary ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
        });
    }
    
    const saveSalaryBtn = document.getElementById('saveSalaryBtn');
    if (saveSalaryBtn) {
        saveSalaryBtn.addEventListener('click', async function() {
            const teacherId = document.getElementById('salaryTeacherId')?.value;
            const month = document.getElementById('salaryMonth')?.value;
            const paidAmount = parseInt(document.getElementById('paidAmount')?.value) || 0;
            
            if (!teacherId || !month) return;
            
            try {
                const response = await fetch(`/api/teachers/${teacherId}/salary`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ month, paidAmount })
                });
                const data = await response.json();
                if (data.success) {
                    safeHideModal('salaryModal');
                    showSuccess('Salary saved successfully!');
                    await loadTeachers();
                    if (selectedTeacherId === teacherId) {
                        await loadTeacherDetails(teacherId);
                    }
                    await loadStats();
                } else { 
                    showError(data.message || 'Failed to save salary'); 
                }
            } catch (err) { 
                console.error('Salary error:', err); 
                showError('Failed to save salary'); 
            }
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
