// ========== GLOBAL VARIABLES ==========
let token = localStorage.getItem('token') || localStorage.getItem('adminToken');
let currentFilter = 'all';
let teachersData = [];
let salaryChart = null;
let teacherSalaryChart = null;
let dataTable = null;
let selectedTeacherId = null;
let attendanceData = {};

console.log('🔑 Token Status:', token ? '✅ LOGGED IN' : '❌ NOT LOGGED IN');

// ========== CHECK TOKEN ==========
if (!token) {
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('statsContainer').style.display = 'none';
        document.getElementById('chartCard').style.display = 'none';
        document.getElementById('teacherDetailsCard').style.display = 'none';
        document.getElementById('salaryAttendanceCard').style.display = 'none';
        document.getElementById('teachersTableBody').innerHTML = `
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
        document.getElementById('loadingSpinner').style.display = 'none';
    });
} else {
    // Wait for jQuery and DataTables
    function waitForScripts() {
        if (typeof jQuery === 'undefined' || typeof jQuery.fn.DataTable === 'undefined') {
            setTimeout(waitForScripts, 50);
            return;
        }
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
    fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            document.getElementById('db-logo').innerHTML = data.logoText ? 
                `<i class="fas fa-graduation-cap me-2"></i>${data.logoText}` : 
                '<i class="fas fa-graduation-cap me-2"></i>BBCC';
        })
        .catch(() => {
            document.getElementById('db-logo').innerHTML = '<i class="fas fa-graduation-cap me-2"></i>BBCC';
        });
}

// ========== SHOW/HIDE LOADING ==========
function showLoading() { document.getElementById('loadingSpinner').style.display = 'flex'; }
function hideLoading() { document.getElementById('loadingSpinner').style.display = 'none'; }
function showError(m) { alert('❌ Error: ' + m); }
function showSuccess(m) { alert('✅ Success: ' + m); }

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
            document.getElementById('totalTeachers').textContent = data.data.total || 0;
            document.getElementById('pendingTeachers').textContent = data.data.pending || 0;
            document.getElementById('approvedTeachers').textContent = data.data.approved || 0;
            document.getElementById('totalSalary').textContent = '₹' + (data.data.totalPaidSalary || 0).toLocaleString();
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
    select.innerHTML = '<option value="">-- Select a Teacher --</option>';
    
    teachers.forEach(teacher => {
        if (teacher.status === 'approved') {
            const option = document.createElement('option');
            option.value = teacher.teacherId;
            option.textContent = `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''} (${teacher.teacherId})`;
            select.appendChild(option);
        }
    });
}

// ========== DISPLAY TEACHERS IN TABLE ==========
function displayTeachers(teachers) {
    const tbody = document.getElementById('teachersTableBody');
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
        
        const row = document.createElement('tr');
        row.setAttribute('data-teacher-id', teacher.teacherId || '');
        row.setAttribute('data-teacher-status', teacher.status || 'pending');
        row.innerHTML = `
            <td><img src="${teacher.photo || 'https://via.placeholder.com/40'}" class="teacher-photo" onerror="this.src='https://via.placeholder.com/40'"></td>
            <td>${teacher.teacherId || '-'}</td>
            <td>${firstName} ${lastName}</td>
            <td>${teacher.mobile || '-'}</td>
            <td>${teacher.subject || '-'}</td>
            <td>₹${teacher.salary?.toLocaleString() || 0}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit view-teacher-btn" data-id="${teacher.teacherId}"><i class="fas fa-eye"></i></button>
                    ${teacher.status === 'pending' ? `<button class="btn-approve approve-teacher-btn" data-id="${teacher.teacherId}"><i class="fas fa-check"></i></button>` : ''}
                    ${teacher.status === 'approved' ? `<button class="btn-approve salary-teacher-btn" data-id="${teacher.teacherId}"><i class="fas fa-rupee-sign"></i></button>` : ''}
                    <button class="btn-reject delete-teacher-btn" data-id="${teacher.teacherId}"><i class="fas fa-trash"></i></button>
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
    document.getElementById('teacherSelect').value = teacherId;
    selectedTeacherId = teacherId;
    
    await loadTeacherDetails(teacherId);
}

async function loadTeacherDetails(teacherId) {
    showLoading();
    try {
        const response = await fetch(`/api/teachers/${teacherId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            const teacher = data.data;
            
            // Update teacher name in header
            document.getElementById('selectedTeacherName').textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
            document.getElementById('detailsTeacherName').textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
            document.getElementById('salaryTeacherName').textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
            
            // Show details card
            document.getElementById('teacherDetailsCard').style.display = 'block';
            document.getElementById('salaryAttendanceCard').style.display = 'block';
            
            // Fill personal details
            document.getElementById('detailsPhoto').src = teacher.photo || 'https://via.placeholder.com/150';
            document.getElementById('detailsFullName').textContent = 
                `${teacher.teacherName?.first || ''} ${teacher.teacherName?.middle || ''} ${teacher.teacherName?.last || ''}`;
            document.getElementById('detailsTeacherId').textContent = `ID: ${teacher.teacherId}`;
            
            const statusSpan = document.getElementById('detailsStatus');
            statusSpan.textContent = teacher.status ? teacher.status.toUpperCase() : 'PENDING';
            statusSpan.className = `status-badge ${teacher.status || 'pending'}`;
            
            // Fill all fields
            document.getElementById('detailFirstName').textContent = teacher.teacherName?.first || '-';
            document.getElementById('detailMiddleName').textContent = teacher.teacherName?.middle || '-';
            document.getElementById('detailLastName').textContent = teacher.teacherName?.last || '-';
            
            document.getElementById('detailFatherFirst').textContent = teacher.fatherName?.first || '-';
            document.getElementById('detailFatherMiddle').textContent = teacher.fatherName?.middle || '-';
            document.getElementById('detailFatherLast').textContent = teacher.fatherName?.last || '-';
            
            document.getElementById('detailMobile').textContent = teacher.mobile || '-';
            document.getElementById('detailAltMobile').textContent = teacher.altMobile || '-';
            
            document.getElementById('detailDob').textContent = teacher.dob ? new Date(teacher.dob).toLocaleDateString() : '-';
            document.getElementById('detailAadhar').textContent = teacher.aadharNumber || '-';
            document.getElementById('detailQualification').textContent = teacher.lastQualification || '-';
            
            document.getElementById('detailSubject').textContent = teacher.subject || '-';
            document.getElementById('detailSalary').textContent = teacher.salary?.toLocaleString() || '0';
            document.getElementById('detailJoining').textContent = teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : '-';
            
            // Document links
            const aadharLink = document.getElementById('aadharDocLink');
            if (teacher.aadharDoc) {
                aadharLink.href = teacher.aadharDoc;
                aadharLink.style.display = 'inline';
            } else {
                aadharLink.style.display = 'none';
            }
            
            const qualLink = document.getElementById('qualificationDocLink');
            if (teacher.qualificationDoc) {
                qualLink.href = teacher.qualificationDoc;
                qualLink.style.display = 'inline';
            } else {
                qualLink.style.display = 'none';
            }
            
            // Load salary and attendance data
            loadSalaryData(teacher);
            loadAttendanceData(teacher);
        }
    } catch (err) {
        console.error('View error:', err);
        showError('Failed to load teacher details');
    }
    hideLoading();
}

function handleApproveTeacher(e) {
    const teacherId = e.currentTarget.dataset.id;
    document.getElementById('approveTeacherId').value = teacherId;
    document.getElementById('approveJoiningDate').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('approveTeacherModal')).show();
}

function handleSalaryTeacher(e) {
    const teacherId = e.currentTarget.dataset.id;
    const teacher = teachersData.find(t => t.teacherId === teacherId);
    if (!teacher) return;
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const monthKey = `${currentMonth} ${currentYear}`;
    
    document.getElementById('salaryTeacherId').value = teacherId;
    document.getElementById('salaryMonth').value = monthKey;
    document.getElementById('salaryYear').value = currentYear;
    document.getElementById('salaryTeacherName').textContent = 
        `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
    document.getElementById('salaryMonthDisplay').textContent = monthKey;
    document.getElementById('salaryAmount').value = '₹' + (teacher.salary || 0).toLocaleString();
    document.getElementById('paidAmount').value = 0;
    document.getElementById('dueAmount').value = '₹' + (teacher.salary || 0).toLocaleString();
    document.getElementById('paymentStatus').value = 'Unpaid';
    
    new bootstrap.Modal(document.getElementById('salaryModal')).show();
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
            
            // Clear selection if deleted teacher was selected
            if (selectedTeacherId === teacherId) {
                selectedTeacherId = null;
                document.getElementById('teacherDetailsCard').style.display = 'none';
                document.getElementById('salaryAttendanceCard').style.display = 'none';
                document.getElementById('selectedTeacherName').textContent = 'None';
                document.getElementById('teacherSelect').value = '';
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
    tbody.innerHTML = '';
    
    if (!teacher.salaryMonths || teacher.salaryMonths.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No salary records found</td></tr>';
        return;
    }
    
    // Prepare chart data
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
            <td>${record.month}</td>
            <td>₹${record.salary?.toLocaleString() || 0}</td>
            <td>₹${record.paidAmount?.toLocaleString() || 0}</td>
            <td>₹${record.dueAmount?.toLocaleString() || 0}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-edit pay-salary-btn" data-id="${teacher.teacherId}" data-month="${record.month}">
                    <i class="fas fa-rupee-sign"></i> Pay
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners to pay buttons
    document.querySelectorAll('.pay-salary-btn').forEach(btn => {
        btn.removeEventListener('click', handlePaySalary);
        btn.addEventListener('click', handlePaySalary);
    });
    
    // Update teacher-specific chart
    updateTeacherSalaryChart(months, paidData, dueData);
}

function handlePaySalary(e) {
    const teacherId = e.currentTarget.dataset.id;
    const month = e.currentTarget.dataset.month;
    const teacher = teachersData.find(t => t.teacherId === teacherId);
    if (!teacher) return;
    
    document.getElementById('salaryTeacherId').value = teacherId;
    document.getElementById('salaryMonth').value = month;
    document.getElementById('salaryTeacherName').textContent = 
        `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
    document.getElementById('salaryMonthDisplay').textContent = month;
    document.getElementById('salaryAmount').value = '₹' + (teacher.salary || 0).toLocaleString();
    document.getElementById('paidAmount').value = 0;
    document.getElementById('dueAmount').value = '₹' + (teacher.salary || 0).toLocaleString();
    document.getElementById('paymentStatus').value = 'Unpaid';
    
    new bootstrap.Modal(document.getElementById('salaryModal')).show();
}

// ========== LOAD ATTENDANCE DATA ==========
function loadAttendanceData(teacher) {
    const tbody = document.getElementById('attendanceTableBody');
    
    // Generate sample attendance data for last 30 days
    const attendance = generateAttendanceData(teacher.teacherId);
    tbody.innerHTML = '';
    
    if (!attendance || attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No attendance records found</td></tr>';
        return;
    }
    
    attendance.forEach(record => {
        const statusClass = record.status === 'present' ? 'attendance-present' :
                           record.status === 'absent' ? 'attendance-absent' :
                           record.status === 'half-day' ? 'attendance-halfday' : 'attendance-leave';
        const statusText = record.status.toUpperCase();
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-edit edit-attendance-btn" data-date="${record.date}" data-status="${record.status}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function generateAttendanceData(teacherId) {
    // This would normally come from API
    // For now, generate sample data
    const attendance = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Random status
        const rand = Math.random();
        let status = 'present';
        if (rand < 0.2) status = 'absent';
        else if (rand < 0.3) status = 'half-day';
        else if (rand < 0.35) status = 'leave';
        
        attendance.push({
            date: date.toLocaleDateString(),
            status: status
        });
    }
    
    return attendance;
}

// ========== FILTER TEACHERS ==========
function filterTeachers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
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

// ========== UPDATE OVERALL SALARY CHART ==========
function updateSalaryChart() {
    const ctx = document.getElementById('salaryChart')?.getContext('2d');
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

// ========== UPDATE TEACHER-SPECIFIC SALARY CHART ==========
function updateTeacherSalaryChart(months, paidData, dueData) {
    const ctx = document.getElementById('teacherSalaryChart')?.getContext('2d');
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

// ========== EDIT TEACHER ==========
function handleEditTeacher() {
    if (!selectedTeacherId) {
        showError('Please select a teacher first');
        return;
    }
    
    const teacher = teachersData.find(t => t.teacherId === selectedTeacherId);
    if (!teacher) return;
    
    // Populate edit form
    document.getElementById('editTeacherId').value = teacher.teacherId;
    document.getElementById('editFirstName').value = teacher.teacherName?.first || '';
    document.getElementById('editMiddleName').value = teacher.teacherName?.middle || '';
    document.getElementById('editLastName').value = teacher.teacherName?.last || '';
    
    document.getElementById('editFatherFirst').value = teacher.fatherName?.first || '';
    document.getElementById('editFatherMiddle').value = teacher.fatherName?.middle || '';
    document.getElementById('editFatherLast').value = teacher.fatherName?.last || '';
    
    document.getElementById('editMobile').value = teacher.mobile || '';
    document.getElementById('editAltMobile').value = teacher.altMobile || '';
    
    if (teacher.dob) {
        const dob = new Date(teacher.dob);
        document.getElementById('editDob').value = dob.toISOString().split('T')[0];
    }
    
    document.getElementById('editAadhar').value = teacher.aadharNumber || '';
    document.getElementById('editQualification').value = teacher.lastQualification || '';
    document.getElementById('editSubject').value = teacher.subject || '';
    document.getElementById('editSalary').value = teacher.salary || 0;
    document.getElementById('editStatus').value = teacher.status || 'pending';
    
    if (teacher.joiningDate) {
        const joinDate = new Date(teacher.joiningDate);
        document.getElementById('editJoiningDate').value = joinDate.toISOString().split('T')[0];
    }
    
    // Show/hide joining date row based on status
    document.getElementById('joiningDateRow').style.display = 
        teacher.status === 'approved' ? 'block' : 'none';
    
    // Photo preview
    document.getElementById('editPhotoPreview').src = teacher.photo || 'https://via.placeholder.com/100';
    
    // Document links
    const aadharLink = document.getElementById('editAadharLink');
    if (teacher.aadharDoc) {
        aadharLink.href = teacher.aadharDoc;
        aadharLink.style.display = 'inline';
    } else {
        aadharLink.style.display = 'none';
    }
    
    new bootstrap.Modal(document.getElementById('editTeacherModal')).show();
}

async function saveTeacherEdit() {
    const teacherId = document.getElementById('editTeacherId').value;
    
    const teacherData = {
        teacherId: teacherId,
        teacherName: {
            first: document.getElementById('editFirstName').value,
            middle: document.getElementById('editMiddleName').value,
            last: document.getElementById('editLastName').value
        },
        fatherName: {
            first: document.getElementById('editFatherFirst').value,
            middle: document.getElementById('editFatherMiddle').value,
            last: document.getElementById('editFatherLast').value
        },
        mobile: document.getElementById('editMobile').value,
        altMobile: document.getElementById('editAltMobile').value,
        dob: document.getElementById('editDob').value,
        lastQualification: document.getElementById('editQualification').value,
        aadharNumber: document.getElementById('editAadhar').value,
        subject: document.getElementById('editSubject').value,
        salary: parseInt(document.getElementById('editSalary').value) || 0,
        status: document.getElementById('editStatus').value
    };
    
    // Add joining date if status is approved
    if (teacherData.status === 'approved') {
        teacherData.joiningDate = document.getElementById('editJoiningDate').value;
    }
    
    showLoading();
    
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
            bootstrap.Modal.getInstance(document.getElementById('editTeacherModal')).hide();
            showSuccess('Teacher updated successfully!');
            
            // Reload data
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
    
    hideLoading();
}

// ========== MARK ATTENDANCE ==========
function handleMarkAttendance() {
    if (!selectedTeacherId) {
        showError('Please select a teacher first');
        return;
    }
    
    const teacher = teachersData.find(t => t.teacherId === selectedTeacherId);
    if (!teacher) return;
    
    document.getElementById('attendanceTeacherId').value = teacher.teacherId;
    document.getElementById('attendanceTeacherName').textContent = 
        `${teacher.teacherName?.first || ''} ${teacher.teacherName?.last || ''}`;
    document.getElementById('attendanceDate').textContent = new Date().toLocaleDateString();
    document.getElementById('attendanceStatus').value = 'present';
    document.getElementById('attendanceRemarks').value = '';
    
    new bootstrap.Modal(document.getElementById('attendanceModal')).show();
}

async function saveAttendance() {
    const teacherId = document.getElementById('attendanceTeacherId').value;
    const status = document.getElementById('attendanceStatus').value;
    const remarks = document.getElementById('attendanceRemarks').value;
    const date = new Date().toISOString().split('T')[0];
    
    // This would be an API call in production
    console.log('Saving attendance:', { teacherId, date, status, remarks });
    
    showSuccess('Attendance marked successfully!');
    bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
    
    // Reload attendance data
    const teacher = teachersData.find(t => t.teacherId === teacherId);
    if (teacher) {
        loadAttendanceData(teacher);
    }
}

// ========== INITIALIZE EVENT LISTENERS ==========
function initEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        window.location.href = '/index.html';
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', debounce(filterTeachers, 500));
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filterTeachers();
        });
    });
    
    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadTeachers();
        loadStats();
    });
    
    // Teacher select dropdown
    document.getElementById('teacherSelect').addEventListener('change', function() {
        const teacherId = this.value;
        if (teacherId) {
            selectedTeacherId = teacherId;
            loadTeacherDetails(teacherId);
        } else {
            selectedTeacherId = null;
            document.getElementById('teacherDetailsCard').style.display = 'none';
            document.getElementById('salaryAttendanceCard').style.display = 'none';
            document.getElementById('selectedTeacherName').textContent = 'None';
        }
    });
    
    // Edit teacher button
    document.getElementById('editTeacherBtn').addEventListener('click', handleEditTeacher);
    
    // Save edit button
    document.getElementById('saveEditBtn').addEventListener('click', saveTeacherEdit);
    
    // Mark attendance button
    document.getElementById('markAttendanceBtn').addEventListener('click', handleMarkAttendance);
    
    // Save attendance button
    document.getElementById('saveAttendanceBtn').addEventListener('click', saveAttendance);
    
    // Status change in edit form
    document.getElementById('editStatus').addEventListener('change', function() {
        document.getElementById('joiningDateRow').style.display = 
            this.value === 'approved' ? 'block' : 'none';
    });
    
    // Approve teacher
    document.getElementById('confirmApproveBtn').addEventListener('click', async function() {
        const teacherId = document.getElementById('approveTeacherId').value;
        const subject = document.getElementById('approveSubject').value;
        const salary = document.getElementById('approveSalary').value;
        const joiningDate = document.getElementById('approveJoiningDate').value;
        
        if (!subject || !salary) { showError('Please fill subject and salary'); return; }
        
        showLoading();
        try {
            const response = await fetch(`/api/teachers/${teacherId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'approved', subject, salary: parseInt(salary), joiningDate })
            });
            const data = await response.json();
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('approveTeacherModal')).hide();
                showSuccess('Teacher approved successfully!');
                await loadTeachers();
                await loadStats();
                if (selectedTeacherId === teacherId) {
                    await loadTeacherDetails(teacherId);
                }
                document.getElementById('approveSubject').value = '';
                document.getElementById('approveSalary').value = '';
            } else { showError(data.message || 'Failed to approve'); }
        } catch (err) { console.error('Approve error:', err); showError('Failed to approve teacher'); }
        hideLoading();
    });
    
    // Salary calculation
    document.getElementById('paidAmount').addEventListener('input', function() {
        const salaryText = document.getElementById('salaryAmount').value;
        const salary = parseInt(salaryText.replace('₹', '').replace(',', '')) || 0;
        const paid = parseInt(this.value) || 0;
        document.getElementById('dueAmount').value = '₹' + (salary - paid).toLocaleString();
        document.getElementById('paymentStatus').value = paid >= salary ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    });
    
    // Save salary
    document.getElementById('saveSalaryBtn').addEventListener('click', async function() {
        const teacherId = document.getElementById('salaryTeacherId').value;
        const month = document.getElementById('salaryMonth').value;
        const paidAmount = parseInt(document.getElementById('paidAmount').value) || 0;
        
        showLoading();
        try {
            const response = await fetch(`/api/teachers/${teacherId}/salary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ month, paidAmount })
            });
            const data = await response.json();
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('salaryModal')).hide();
                showSuccess('Salary saved successfully!');
                await loadTeachers();
                if (selectedTeacherId === teacherId) {
                    await loadTeacherDetails(teacherId);
                }
                await loadStats();
            } else { showError(data.message || 'Failed to save salary'); }
        } catch (err) { console.error('Salary error:', err); showError('Failed to save salary'); }
        hideLoading();
    });
}

// ========== DEBOUNCE UTILITY ==========
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
