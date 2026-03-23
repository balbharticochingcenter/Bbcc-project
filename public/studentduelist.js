// ============================================
// STUDENT DUE LIST MANAGEMENT - FIXED VERSION
// Due Fees Tracking + WhatsApp/SMS Messaging
// ============================================

let allStudentsData = [];
let currentDueStudents = [];

// ============================================
// CHECK TOKEN FIRST
// ============================================
function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login again', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return false;
    }
    return true;
}

// ============================================
// INITIALIZE STUDENT DUE LIST TAB
// ============================================
async function initStudentDueListTab() {
    if (!isTokenValid()) return;
    
    showLoader(true);
    try {
        await loadAllStudentsForDueList();
        await loadBoardsAndClasses();
        setupDueListEventListeners();
    } catch (err) {
        console.error('Init error:', err);
        showToast('Failed to initialize due list', 'error');
    } finally {
        showLoader(false);
    }
}

// ============================================
// 1. LOAD ALL STUDENTS FROM SERVER - FIXED
// ============================================
async function loadAllStudentsForDueList() {
    const container = document.getElementById('dueStudentsListContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-spinner fa-spin fa-3x text-muted"></i>
                <p class="mt-3">Loading students data...</p>
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        console.log('Fetching students from API...');
        
        const res = await fetch('/api/students', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', res.status);
        
        if (res.status === 401) {
            localStorage.removeItem('token');
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }
        
        if (res.status === 403) {
            showToast('You don\'t have permission to view students', 'error');
            return;
        }
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Students data received:', data.success ? 'Success' : 'Failed');
        
        if (data.success && data.data) {
            allStudentsData = data.data;
            calculateDueForAllStudents();
        } else {
            throw new Error(data.message || 'Failed to load students');
        }
        
    } catch (err) {
        console.error('Error loading students:', err);
        
        const container = document.getElementById('dueStudentsListContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5>Error Loading Students</h5>
                    <p class="text-muted">${err.message}</p>
                    <button class="btn-primary-premium mt-3" onclick="loadAllStudentsForDueList()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
        
        showToast('Error loading students: ' + err.message, 'error');
    }
}

// ============================================
// 2. CALCULATE DUE FOR EACH STUDENT
// ============================================
function calculateDueForAllStudents() {
    if (!allStudentsData || allStudentsData.length === 0) {
        currentDueStudents = [];
        renderDueStudentsList();
        updateDueStats();
        return;
    }
    
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
    const currentYear = currentDate.getFullYear();
    const currentMonthKey = `${currentMonth} ${currentYear}`;
    
    currentDueStudents = allStudentsData.map(student => {
        let totalDue = 0;
        let dueMonths = [];
        
        // Calculate due from feesHistory
        if (student.feesHistory && Array.isArray(student.feesHistory) && student.feesHistory.length > 0) {
            student.feesHistory.forEach(fee => {
                if (fee.status === 'unpaid' || fee.status === 'partial') {
                    const dueAmount = fee.dueAmount || (student.classMonthlyFees - (fee.paidAmount || 0));
                    totalDue += dueAmount;
                    dueMonths.push({
                        month: fee.month,
                        dueAmount: dueAmount,
                        status: fee.status
                    });
                }
            });
        }
        
        // Calculate current month due if not paid
        const currentMonthFee = student.feesHistory?.find(f => f.month === currentMonthKey);
        if ((!currentMonthFee || currentMonthFee.status !== 'paid') && student.classMonthlyFees > 0) {
            const currentDue = (student.classMonthlyFees || 0) - (currentMonthFee?.paidAmount || 0);
            if (currentDue > 0) {
                totalDue += currentDue;
                if (!dueMonths.find(m => m.month === currentMonthKey)) {
                    dueMonths.push({
                        month: currentMonthKey,
                        dueAmount: currentDue,
                        status: currentMonthFee?.status || 'unpaid'
                    });
                }
            }
        }
        
        return {
            _id: student._id,
            studentId: student.studentId || 'N/A',
            name: `${student.studentName?.first || ''} ${student.studentName?.middle ? student.studentName.middle + ' ' : ''}${student.studentName?.last || ''}`.trim() || 'Unknown',
            photo: student.photo || 'https://via.placeholder.com/60',
            joiningDate: student.joiningDate,
            classMonthlyFees: student.classMonthlyFees || 0,
            totalDue: totalDue,
            dueMonths: dueMonths,
            board: student.education?.board || 'N/A',
            class: student.education?.class || 'N/A',
            studentMobile: student.mobile || '',
            fatherName: `${student.fatherName?.first || ''} ${student.fatherName?.last || ''}`.trim() || 'N/A',
            fatherMobile: student.fatherMobile || '',
            motherName: student.motherName?.first ? `${student.motherName.first} ${student.motherName.last || ''}`.trim() : '',
            motherMobile: student.motherMobile || '',
            address: student.address?.current || ''
        };
    }).filter(student => student.totalDue > 0); // Only show students with due
    
    // Sort by total due (highest first)
    currentDueStudents.sort((a, b) => b.totalDue - a.totalDue);
    
    renderDueStudentsList();
    updateDueStats();
}

// ============================================
// 3. RENDER DUE STUDENTS LIST - FIXED
// ============================================
function renderDueStudentsList() {
    const container = document.getElementById('dueStudentsListContainer');
    if (!container) return;
    
    // Get filters
    const boardFilter = document.getElementById('dueBoardFilter')?.value || '';
    const classFilter = document.getElementById('dueClassFilter')?.value || '';
    const searchFilter = document.getElementById('dueSearchInput')?.value.toLowerCase() || '';
    
    let filteredStudents = [...currentDueStudents];
    
    if (boardFilter) {
        filteredStudents = filteredStudents.filter(s => s.board === boardFilter);
    }
    
    if (classFilter) {
        filteredStudents = filteredStudents.filter(s => s.class === classFilter);
    }
    
    if (searchFilter) {
        filteredStudents = filteredStudents.filter(s => 
            s.name.toLowerCase().includes(searchFilter) ||
            s.studentId.toLowerCase().includes(searchFilter) ||
            s.studentMobile.includes(searchFilter) ||
            s.fatherMobile.includes(searchFilter)
        );
    }
    
    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                <h5>No Due Students Found!</h5>
                <p class="text-muted">All students have cleared their fees.</p>
                ${currentDueStudents.length === 0 ? '<p class="text-muted">Total students with due: 0</p>' : '<button class="btn-secondary-premium mt-2" onclick="clearDueFilters()">Clear Filters</button>'}
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredStudents.map(student => `
        <div class="due-student-card mb-3 p-3 border rounded-3" data-student-id="${student.studentId}" style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div class="row align-items-center">
                <div class="col-md-2 col-3 text-center">
                    <img src="${student.photo}" 
                         class="rounded-circle" 
                         style="width: 60px; height: 60px; object-fit: cover; border: 2px solid #dc2626;"
                         onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
                </div>
                <div class="col-md-4 col-9">
                    <h6 class="mb-1 fw-bold">${escapeHtml(student.name)}</h6>
                    <small class="text-muted">ID: ${student.studentId}</small><br>
                    <small class="text-muted">Joining: ${student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : 'N/A'}</small><br>
                    <small class="text-muted">${escapeHtml(student.board)} | ${escapeHtml(student.class)}</small>
                </div>
                <div class="col-md-3 col-6">
                    <div class="mb-2">
                        <span class="badge bg-danger fs-6 p-2">Due: ₹${(student.totalDue || 0).toLocaleString()}</span>
                    </div>
                    <small class="text-muted">Monthly Fees: ₹${(student.classMonthlyFees || 0).toLocaleString()}</small>
                    ${student.dueMonths && student.dueMonths.length > 0 ? `
                        <div class="mt-1">
                            <small class="text-warning">Due Months:</small>
                            <small>${student.dueMonths.map(m => `${m.month} (₹${m.dueAmount})`).join(', ')}</small>
                        </div>
                    ` : ''}
                </div>
                <div class="col-md-3 col-6">
                    <div class="d-flex flex-column gap-2">
                        <button class="btn btn-sm btn-outline-primary send-message-btn" 
                                data-student='${JSON.stringify(student).replace(/'/g, "&#39;").replace(/"/g, '&quot;')}'>
                            <i class="fas fa-envelope"></i> Send Message
                        </button>
                        <div class="btn-group">
                            ${student.studentMobile ? `<a href="tel:${student.studentMobile}" class="btn btn-sm btn-success"><i class="fas fa-phone"></i> Call</a>` : ''}
                            ${student.studentMobile ? `<a href="https://wa.me/91${student.studentMobile}?text=${encodeURIComponent(getDefaultMessage(student))}" target="_blank" class="btn btn-sm btn-success"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ''}
                        </div>
                        ${student.fatherMobile ? `<small class="text-muted mt-1">Parent: ${student.fatherMobile}</small>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for message buttons
    document.querySelectorAll('.send-message-btn').forEach(btn => {
        btn.removeEventListener('click', btn._listener);
        btn._listener = () => {
            try {
                const studentData = JSON.parse(btn.getAttribute('data-student'));
                openMessageModal(studentData);
            } catch (e) {
                console.error('Parse error:', e);
                showToast('Error loading student data', 'error');
            }
        };
        btn.addEventListener('click', btn._listener);
    });
}

// ============================================
// 4. UPDATE DUE STATISTICS
// ============================================
function updateDueStats() {
    const totalDueStudents = currentDueStudents.length;
    const totalDueAmount = currentDueStudents.reduce((sum, s) => sum + (s.totalDue || 0), 0);
    const avgDue = totalDueStudents > 0 ? Math.round(totalDueAmount / totalDueStudents) : 0;
    
    const statsContainer = document.getElementById('dueStatsContainer');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="stat-card text-center p-3" style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; border-radius: 16px;">
                    <h2 class="mb-0">${totalDueStudents}</h2>
                    <small>Students with Due</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card text-center p-3" style="background: linear-gradient(135deg, #f59e0b, #fb5607); color: white; border-radius: 16px;">
                    <h2 class="mb-0">₹${totalDueAmount.toLocaleString()}</h2>
                    <small>Total Due Amount</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card text-center p-3" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border-radius: 16px;">
                    <h2 class="mb-0">₹${avgDue.toLocaleString()}</h2>
                    <small>Average Due per Student</small>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// 5. LOAD BOARDS AND CLASSES FOR FILTER - FIXED
// ============================================
async function loadBoardsAndClasses() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch('/api/boards', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            console.warn('Failed to load boards/classes:', res.status);
            return;
        }
        
        const data = await res.json();
        
        if (data.success && data.data) {
            const boardSelect = document.getElementById('dueBoardFilter');
            const classSelect = document.getElementById('dueClassFilter');
            
            if (boardSelect && data.data.boards) {
                boardSelect.innerHTML = '<option value="">All Boards</option>' + 
                    data.data.boards.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
            }
            
            if (classSelect && data.data.classes) {
                classSelect.innerHTML = '<option value="">All Classes</option>' + 
                    data.data.classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Error loading boards/classes:', err);
    }
}

// ============================================
// 6. CLEAR FILTERS
// ============================================
function clearDueFilters() {
    const boardFilter = document.getElementById('dueBoardFilter');
    const classFilter = document.getElementById('dueClassFilter');
    const searchInput = document.getElementById('dueSearchInput');
    
    if (boardFilter) boardFilter.value = '';
    if (classFilter) classFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    renderDueStudentsList();
}

// ============================================
// 7. DEFAULT MESSAGE TEMPLATES
// ============================================
function getDefaultMessage(student) {
    const dueMonthsText = student.dueMonths && student.dueMonths.length > 0 
        ? student.dueMonths.map(m => m.month).join(', ') 
        : 'previous months';
    
    return `Dear ${student.name || 'Student'},\n\nThis is a gentle reminder that your fees of ₹${(student.totalDue || 0).toLocaleString()} is pending for ${dueMonthsText}.\n\nPlease clear the dues at the earliest to avoid any inconvenience.\n\nTotal Due: ₹${(student.totalDue || 0).toLocaleString()}\nMonthly Fees: ₹${(student.classMonthlyFees || 0).toLocaleString()}\n\nThank you,\nBal Bharti Coaching Center\n${new Date().toLocaleDateString()}`;
}

function getParentMessage(student) {
    const dueMonthsText = student.dueMonths && student.dueMonths.length > 0 
        ? student.dueMonths.map(m => m.month).join(', ') 
        : 'previous months';
    
    return `Respected Parent of ${student.name},\n\nThis is to inform you that fees of ₹${(student.totalDue || 0).toLocaleString()} is pending for ${dueMonthsText}.\n\nStudent ID: ${student.studentId}\nTotal Due: ₹${(student.totalDue || 0).toLocaleString()}\n\nPlease clear the dues at the earliest.\n\nRegards,\nBal Bharti Coaching Center`;
}

function getShortMessage(student) {
    return `Reminder: Fees due for ${student.name} (${student.studentId}) - ₹${(student.totalDue || 0).toLocaleString()}. Please clear at earliest.`;
}

// ============================================
// 8. OPEN MESSAGE MODAL
// ============================================
function openMessageModal(student) {
    if (!student) {
        showToast('Invalid student data', 'error');
        return;
    }
    
    const modalHtml = `
        <div class="modal-custom" id="messageModal">
            <div class="modal-content-custom" style="max-width: 600px;">
                <div class="modal-header-custom" style="background: linear-gradient(135deg, #10b981, #059669);">
                    <h4><i class="fas fa-envelope"></i> Send Message to ${escapeHtml(student.name)}</h4>
                    <button class="modal-close" id="closeMessageModal">&times;</button>
                </div>
                <div class="modal-body-custom">
                    <div class="d-flex align-items-center gap-3 mb-3 p-2 bg-light rounded-3">
                        <img src="${student.photo || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/50'">
                        <div>
                            <h6 class="mb-0">${escapeHtml(student.name)}</h6>
                            <small>ID: ${student.studentId} | Due: ₹${(student.totalDue || 0).toLocaleString()}</small>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="fw-bold mb-2">Send To:</label>
                        <div class="d-flex gap-3">
                            ${student.studentMobile ? `<button type="button" class="btn-secondary-premium message-recipient active" data-recipient="student" data-phone="${student.studentMobile}"><i class="fas fa-user-graduate"></i> Student (${student.studentMobile})</button>` : ''}
                            ${student.fatherMobile ? `<button type="button" class="btn-secondary-premium message-recipient" data-recipient="parent" data-phone="${student.fatherMobile}"><i class="fas fa-user-friends"></i> Parent (${student.fatherMobile})</button>` : ''}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="fw-bold mb-2">Message Template:</label>
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="full">Full Detailed</button>
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="parent">Parent Message</button>
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="short">Short Reminder</button>
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="custom">Custom Message</button>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="fw-bold mb-2">Message:</label>
                        <textarea id="messageText" class="form-control" rows="8" style="font-family: monospace;">${escapeHtml(getDefaultMessage(student))}</textarea>
                    </div>
                    
                    ${student.dueMonths && student.dueMonths.length > 0 ? `
                        <div class="mb-3">
                            <label class="small fw-bold">Due Months:</label>
                            <div class="d-flex flex-wrap gap-1 mt-1">
                                ${student.dueMonths.map(m => `<span class="badge bg-warning">${m.month}: ₹${m.dueAmount}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer-custom">
                    <button class="btn-secondary-premium" id="copyMessageBtn"><i class="fas fa-copy"></i> Copy</button>
                    <a href="#" id="whatsappLink" target="_blank" class="btn-success" style="padding: 10px 20px; border-radius: 40px; text-decoration: none; background: #25D366; color: white; display: inline-flex; align-items: center; gap: 8px;"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                    <a href="#" id="smsLink" class="btn-primary-premium" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-sms"></i> SMS</a>
                    <button class="btn-secondary-premium" id="closeMessageModalBtn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('messageModal');
    modal.style.display = 'block';
    
    const messageText = document.getElementById('messageText');
    const whatsappLink = document.getElementById('whatsappLink');
    const smsLink = document.getElementById('smsLink');
    let currentPhone = student.studentMobile || student.fatherMobile;
    
    const updateLinks = (phone, message) => {
        if (phone) {
            const encodedMsg = encodeURIComponent(message);
            whatsappLink.href = `https://wa.me/91${phone}?text=${encodedMsg}`;
            smsLink.href = `sms:${phone}?body=${encodedMsg}`;
        }
    };
    
    // Recipient buttons
    document.querySelectorAll('.message-recipient').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.message-recipient').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPhone = btn.dataset.phone;
            updateLinks(currentPhone, messageText.value);
        });
    });
    
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            let newMessage = '';
            switch(btn.dataset.template) {
                case 'full': newMessage = getDefaultMessage(student); break;
                case 'parent': newMessage = getParentMessage(student); break;
                case 'short': newMessage = getShortMessage(student); break;
                default: return;
            }
            messageText.value = newMessage;
            updateLinks(currentPhone, newMessage);
        });
    });
    
    // Live update
    messageText.addEventListener('input', () => {
        updateLinks(currentPhone, messageText.value);
    });
    
    // Copy button
    document.getElementById('copyMessageBtn').onclick = () => {
        messageText.select();
        document.execCommand('copy');
        showToast('Message copied!', 'success');
    };
    
    // Close modal
    const closeModal = () => modal.remove();
    document.getElementById('closeMessageModal').onclick = closeModal;
    document.getElementById('closeMessageModalBtn').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    
    // Initial update
    updateLinks(currentPhone, messageText.value);
}

// ============================================
// 9. SETUP EVENT LISTENERS
// ============================================
function setupDueListEventListeners() {
    const boardFilter = document.getElementById('dueBoardFilter');
    const classFilter = document.getElementById('dueClassFilter');
    const searchInput = document.getElementById('dueSearchInput');
    
    if (boardFilter) boardFilter.addEventListener('change', renderDueStudentsList);
    if (classFilter) classFilter.addEventListener('change', renderDueStudentsList);
    if (searchInput) searchInput.addEventListener('input', renderDueStudentsList);
    
    const exportBtn = document.getElementById('exportDueListBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportDueListToCSV);
    
    const refreshBtn = document.getElementById('refreshDueListBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        showLoader(true);
        loadAllStudentsForDueList().finally(() => showLoader(false));
    });
}

// ============================================
// 10. EXPORT DUE LIST TO CSV
// ============================================
function exportDueListToCSV() {
    if (!currentDueStudents.length) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = ['Student ID', 'Name', 'Board', 'Class', 'Joining Date', 'Monthly Fees', 'Total Due', 'Due Months', 'Student Mobile', 'Father Name', 'Father Mobile'];
    
    const rows = currentDueStudents.map(s => [
        s.studentId,
        s.name,
        s.board,
        s.class,
        s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '',
        s.classMonthlyFees || 0,
        s.totalDue || 0,
        (s.dueMonths || []).map(m => m.month).join('; '),
        s.studentMobile || '',
        s.fatherName || '',
        s.fatherMobile || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_due_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Due list exported!', 'success');
}

// ============================================
// 11. RENDER STUDENT DUE LIST TAB HTML
// ============================================
function renderStudentDueListTab() {
    return `
        <div class="premium-card">
            <div class="card-header">
                <h3><i class="fas fa-rupee-sign text-danger"></i> Student Due List</h3>
                <div class="d-flex gap-2">
                    <button class="btn-secondary-premium" id="refreshDueListBtn">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn-primary-premium" id="exportDueListBtn">
                        <i class="fas fa-file-excel"></i> Export CSV
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div id="dueStatsContainer"></div>
                
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <label class="small fw-bold">Board</label>
                        <select id="dueBoardFilter" class="form-select">
                            <option value="">All Boards</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Class</label>
                        <select id="dueClassFilter" class="form-select">
                            <option value="">All Classes</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">Search</label>
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="dueSearchInput" class="form-control" placeholder="Name, ID, or mobile...">
                        </div>
                    </div>
                </div>
                
                <div id="dueStudentsListContainer">
                    <div class="text-center py-5">
                        <i class="fas fa-spinner fa-spin fa-3x text-muted"></i>
                        <p class="mt-3">Loading students...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// 12. INTEGRATION WITH MAIN DASHBOARD
// ============================================
function integrateStudentDueListTab() {
    const checkElements = setInterval(() => {
        const desktopTabs = document.querySelector('.tabs-container.d-none.d-md-flex');
        const bottomNav = document.querySelector('.bottom-nav.d-md-none');
        const tabContents = document.getElementById('tabContents');
        
        if (desktopTabs && bottomNav && tabContents) {
            clearInterval(checkElements);
            
            if (document.querySelector('.tab-btn[data-tab="studentdue"]')) return;
            
            // Desktop tab
            const dueTabBtn = document.createElement('button');
            dueTabBtn.className = 'tab-btn';
            dueTabBtn.setAttribute('data-tab', 'studentdue');
            dueTabBtn.innerHTML = '<i class="fas fa-rupee-sign text-danger"></i> Due List';
            desktopTabs.appendChild(dueTabBtn);
            
            // Mobile tab
            const dueMobileBtn = document.createElement('div');
            dueMobileBtn.className = 'bottom-nav-item';
            dueMobileBtn.setAttribute('data-tab', 'studentdue');
            dueMobileBtn.innerHTML = '<i class="fas fa-rupee-sign"></i><span>Due</span>';
            bottomNav.appendChild(dueMobileBtn);
            
            // Pane
            const duePane = document.createElement('div');
            duePane.id = 'studentduePane';
            duePane.className = 'tab-pane';
            duePane.style.display = 'none';
            duePane.innerHTML = renderStudentDueListTab();
            tabContents.appendChild(duePane);
            
            // Click handlers
            document.querySelectorAll('.tab-btn, .bottom-nav-item').forEach(el => {
                if (el.getAttribute('data-tab') === 'studentdue') {
                    el.addEventListener('click', () => {
                        if (typeof window.switchTab === 'function') {
                            window.switchTab('studentdue');
                        } else {
                            document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
                            document.getElementById('studentduePane').style.display = 'block';
                            document.querySelectorAll('.tab-btn').forEach(btn => {
                                btn.classList.toggle('active', btn.getAttribute('data-tab') === 'studentdue');
                            });
                            document.querySelectorAll('.bottom-nav-item').forEach(item => {
                                item.classList.toggle('active', item.getAttribute('data-tab') === 'studentdue');
                            });
                            setTimeout(() => initStudentDueListTab(), 100);
                        }
                    });
                }
            });
            
            if (typeof window.switchTab === 'function') {
                const originalSwitchTab = window.switchTab;
                window.switchTab = function(tabId) {
                    originalSwitchTab(tabId);
                    if (tabId === 'studentdue') setTimeout(() => initStudentDueListTab(), 100);
                };
            }
            
            console.log('✅ Student Due List Tab integrated');
        }
    }, 100);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.initStudentDueListTab = initStudentDueListTab;
window.integrateStudentDueListTab = integrateStudentDueListTab;
window.clearDueFilters = clearDueFilters;

// Auto-integrate
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrateStudentDueListTab);
} else {
    integrateStudentDueListTab();
}
