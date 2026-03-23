// ============================================
// STUDENT DUE LIST MANAGEMENT
// Due Fees Tracking + WhatsApp/SMS Messaging
// ============================================

let allStudentsData = [];
let currentDueStudents = [];
let selectedStudentForMessage = null;

// ============================================
// INITIALIZE STUDENT DUE LIST TAB
// ============================================
async function initStudentDueListTab() {
    showLoader(true);
    await loadAllStudentsForDueList();
    await loadBoardsAndClasses();
    setupDueListEventListeners();
    showLoader(false);
}

// ============================================
// 1. LOAD ALL STUDENTS FROM SERVER
// ============================================
async function loadAllStudentsForDueList() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login first', 'error');
            return;
        }
        
        const res = await fetch('/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (data.success) {
            allStudentsData = data.data;
            calculateDueForAllStudents();
        } else {
            showToast(data.message || 'Failed to load students', 'error');
        }
    } catch (err) {
        console.error('Error loading students:', err);
        showToast('Error loading students', 'error');
    }
}

// ============================================
// 2. CALCULATE DUE FOR EACH STUDENT
// ============================================
function calculateDueForAllStudents() {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
    const currentYear = currentDate.getFullYear();
    const currentMonthKey = `${currentMonth} ${currentYear}`;
    
    currentDueStudents = allStudentsData.map(student => {
        let totalDue = 0;
        let dueMonths = [];
        
        // Calculate due from feesHistory
        if (student.feesHistory && student.feesHistory.length > 0) {
            student.feesHistory.forEach(fee => {
                if (fee.status === 'unpaid' || fee.status === 'partial') {
                    totalDue += fee.dueAmount || 0;
                    dueMonths.push({
                        month: fee.month,
                        dueAmount: fee.dueAmount || 0,
                        status: fee.status
                    });
                }
            });
        }
        
        // Calculate current month due if not paid
        const currentMonthFee = student.feesHistory?.find(f => f.month === currentMonthKey);
        if (!currentMonthFee || currentMonthFee.status !== 'paid') {
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
            studentId: student.studentId,
            name: `${student.studentName.first} ${student.studentName.middle ? student.studentName.middle + ' ' : ''}${student.studentName.last}`,
            photo: student.photo,
            joiningDate: student.joiningDate,
            classMonthlyFees: student.classMonthlyFees,
            totalDue: totalDue,
            dueMonths: dueMonths,
            board: student.education?.board || 'N/A',
            class: student.education?.class || 'N/A',
            studentMobile: student.mobile,
            fatherName: `${student.fatherName.first} ${student.fatherName.last}`,
            fatherMobile: student.fatherMobile,
            motherName: student.motherName.first ? `${student.motherName.first} ${student.motherName.last}` : '',
            motherMobile: student.motherMobile || '',
            email: student.email || '',
            address: student.address?.current || ''
        };
    }).filter(student => student.totalDue > 0); // Only show students with due
    
    renderDueStudentsList();
    updateDueStats();
}

// ============================================
// 3. RENDER DUE STUDENTS LIST
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
    
    // Sort by total due (highest first)
    filteredStudents.sort((a, b) => b.totalDue - a.totalDue);
    
    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                <h5>No Due Students Found!</h5>
                <p class="text-muted">All students have cleared their fees.</p>
            </div>
        `;
        document.getElementById('totalDueCount').textContent = '0';
        document.getElementById('totalDueAmount').textContent = '₹0';
        return;
    }
    
    const totalDueSum = filteredStudents.reduce((sum, s) => sum + s.totalDue, 0);
    document.getElementById('totalDueCount').textContent = filteredStudents.length;
    document.getElementById('totalDueAmount').textContent = `₹${totalDueSum.toLocaleString()}`;
    
    container.innerHTML = filteredStudents.map(student => `
        <div class="due-student-card mb-3 p-3 border rounded-3" data-student-id="${student.studentId}" style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div class="row align-items-center">
                <div class="col-md-2 col-3 text-center">
                    <img src="${student.photo || 'https://via.placeholder.com/70'}" 
                         class="rounded-circle" 
                         style="width: 60px; height: 60px; object-fit: cover; border: 2px solid var(--danger);"
                         onerror="this.src='https://via.placeholder.com/60'">
                </div>
                <div class="col-md-4 col-9">
                    <h6 class="mb-1 fw-bold">${escapeHtml(student.name)}</h6>
                    <small class="text-muted">ID: ${student.studentId}</small><br>
                    <small class="text-muted">Joining: ${new Date(student.joiningDate).toLocaleDateString()}</small><br>
                    <small class="text-muted">${student.board} | ${student.class}</small>
                </div>
                <div class="col-md-3 col-6">
                    <div class="mb-2">
                        <span class="badge bg-danger fs-6 p-2">Due: ₹${student.totalDue.toLocaleString()}</span>
                    </div>
                    <small class="text-muted">Monthly Fees: ₹${student.classMonthlyFees}</small>
                    ${student.dueMonths.length > 0 ? `
                        <div class="mt-1">
                            <small class="text-warning">Due Months:</small>
                            <small>${student.dueMonths.map(m => `${m.month} (₹${m.dueAmount})`).join(', ')}</small>
                        </div>
                    ` : ''}
                </div>
                <div class="col-md-3 col-6">
                    <div class="d-flex flex-column gap-2">
                        <button class="btn btn-sm btn-outline-primary send-message-btn" 
                                data-student='${JSON.stringify(student).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-envelope"></i> Send Message
                        </button>
                        <div class="btn-group">
                            <a href="tel:${student.studentMobile}" class="btn btn-sm btn-success">
                                <i class="fas fa-phone"></i> Call
                            </a>
                            <a href="https://wa.me/91${student.studentMobile}?text=${encodeURIComponent(getDefaultMessage(student))}" 
                               target="_blank" class="btn btn-sm btn-success">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for message buttons
    document.querySelectorAll('.send-message-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentData = JSON.parse(btn.getAttribute('data-student'));
            openMessageModal(studentData);
        });
    });
}

// ============================================
// 4. UPDATE DUE STATISTICS
// ============================================
function updateDueStats() {
    const totalDueStudents = currentDueStudents.length;
    const totalDueAmount = currentDueStudents.reduce((sum, s) => sum + s.totalDue, 0);
    const avgDue = totalDueStudents > 0 ? Math.round(totalDueAmount / totalDueStudents) : 0;
    
    const statsHtml = `
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="stat-card text-center p-3" style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white;">
                    <h2 class="mb-0">${totalDueStudents}</h2>
                    <small>Students with Due</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card text-center p-3" style="background: linear-gradient(135deg, #f59e0b, #fb5607); color: white;">
                    <h2 class="mb-0">₹${totalDueAmount.toLocaleString()}</h2>
                    <small>Total Due Amount</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card text-center p-3" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white;">
                    <h2 class="mb-0">₹${avgDue.toLocaleString()}</h2>
                    <small>Average Due per Student</small>
                </div>
            </div>
        </div>
    `;
    
    const statsContainer = document.getElementById('dueStatsContainer');
    if (statsContainer) {
        statsContainer.innerHTML = statsHtml;
    }
}

// ============================================
// 5. LOAD BOARDS AND CLASSES FOR FILTER
// ============================================
async function loadBoardsAndClasses() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/boards', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const boardSelect = document.getElementById('dueBoardFilter');
            const classSelect = document.getElementById('dueClassFilter');
            
            if (boardSelect) {
                boardSelect.innerHTML = '<option value="">All Boards</option>' + 
                    data.data.boards.map(b => `<option value="${b}">${b}</option>`).join('');
            }
            
            if (classSelect) {
                classSelect.innerHTML = '<option value="">All Classes</option>' + 
                    data.data.classes.map(c => `<option value="${c}">${c}</option>`).join('');
            }
        }
    } catch (err) {
        console.error('Error loading boards/classes:', err);
    }
}

// ============================================
// 6. DEFAULT MESSAGE TEMPLATE
// ============================================
function getDefaultMessage(student) {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    return `Dear ${student.name},\n\nThis is a gentle reminder that your fees of ₹${student.totalDue.toLocaleString()} is pending for ${student.dueMonths.map(m => m.month).join(', ')}.\n\nPlease clear the dues at the earliest to avoid any inconvenience.\n\nTotal Due: ₹${student.totalDue.toLocaleString()}\nMonthly Fees: ₹${student.classMonthlyFees}\n\nThank you,\nBal Bharti Coaching Center\n${new Date().toLocaleDateString()}`;
}

function getParentMessage(student) {
    return `Respected Parent of ${student.name},\n\nThis is to inform you that fees of ₹${student.totalDue.toLocaleString()} is pending for ${student.dueMonths.map(m => m.month).join(', ')}.\n\nStudent ID: ${student.studentId}\nTotal Due: ₹${student.totalDue.toLocaleString()}\n\nPlease clear the dues at the earliest.\n\nRegards,\nBal Bharti Coaching Center`;
}

function getShortMessage(student) {
    return `Reminder: Fees due for ${student.name} (${student.studentId}) - ₹${student.totalDue.toLocaleString()}. Please clear at earliest.`;
}

// ============================================
// 7. OPEN MESSAGE MODAL
// ============================================
function openMessageModal(student) {
    selectedStudentForMessage = student;
    
    const modalHtml = `
        <div class="modal-custom" id="messageModal">
            <div class="modal-content-custom" style="max-width: 600px;">
                <div class="modal-header-custom" style="background: linear-gradient(135deg, #10b981, #059669);">
                    <h4><i class="fas fa-envelope"></i> Send Message to ${escapeHtml(student.name)}</h4>
                    <button class="modal-close" id="closeMessageModal">&times;</button>
                </div>
                <div class="modal-body-custom">
                    <!-- Student Info -->
                    <div class="d-flex align-items-center gap-3 mb-3 p-2 bg-light rounded-3">
                        <img src="${student.photo || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <h6 class="mb-0">${escapeHtml(student.name)}</h6>
                            <small>ID: ${student.studentId} | Due: ₹${student.totalDue.toLocaleString()}</small>
                        </div>
                    </div>
                    
                    <!-- Message Type Selector -->
                    <div class="mb-3">
                        <label class="fw-bold mb-2">Send To:</label>
                        <div class="d-flex gap-3">
                            <button type="button" class="btn-secondary-premium message-recipient active" data-recipient="student">
                                <i class="fas fa-user-graduate"></i> Student (${student.studentMobile})
                            </button>
                            <button type="button" class="btn-secondary-premium message-recipient" data-recipient="parent">
                                <i class="fas fa-user-friends"></i> Parent (${student.fatherMobile})
                            </button>
                        </div>
                    </div>
                    
                    <!-- Message Template Selector -->
                    <div class="mb-3">
                        <label class="fw-bold mb-2">Message Template:</label>
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="full">Full Detailed</button>
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="parent">Parent Message</button>
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="short">Short Reminder</button>
                            <button type="button" class="btn-sm btn-outline-primary template-btn" data-template="custom">Custom Message</button>
                        </div>
                    </div>
                    
                    <!-- Message Editor -->
                    <div class="mb-3">
                        <label class="fw-bold mb-2">Message:</label>
                        <textarea id="messageText" class="form-control" rows="8" style="font-family: monospace;">${getDefaultMessage(student)}</textarea>
                    </div>
                    
                    <!-- Additional Options -->
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <label class="small">Include Due Details:</label>
                            <select id="includeDueDetails" class="form-select form-select-sm">
                                <option value="all">All Due Months</option>
                                <option value="total">Total Only</option>
                                <option value="current">Current Month Only</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="small">Message Language:</label>
                            <select id="messageLanguage" class="form-select form-select-sm">
                                <option value="english">English</option>
                                <option value="hindi">Hindi (Roman)</option>
                                <option value="bilingual">Bilingual</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Due Months List -->
                    <div class="mb-3">
                        <label class="small fw-bold">Due Months:</label>
                        <div class="d-flex flex-wrap gap-1 mt-1">
                            ${student.dueMonths.map(m => `
                                <span class="badge bg-warning">${m.month}: ₹${m.dueAmount}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer-custom">
                    <button class="btn-secondary-premium" id="copyMessageBtn">
                        <i class="fas fa-copy"></i> Copy Message
                    </button>
                    <a href="https://wa.me/91${student.studentMobile}?text=${encodeURIComponent(document.getElementById('messageText')?.value || getDefaultMessage(student))}" 
                       id="whatsappLink" target="_blank" class="btn-success" style="padding: 10px 20px; border-radius: 40px; text-decoration: none; background: #25D366; color: white; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fab fa-whatsapp"></i> Send WhatsApp
                    </a>
                    <a href="#" id="smsLink" class="btn-primary-premium" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-sms"></i> Send SMS
                    </a>
                    <button class="btn-secondary-premium" id="closeMessageModalBtn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('messageModal');
    modal.style.display = 'block';
    
    let currentRecipient = 'student';
    const messageText = document.getElementById('messageText');
    const whatsappLink = document.getElementById('whatsappLink');
    const smsLink = document.getElementById('smsLink');
    
    // Update message based on template
    const updateMessage = (template, recipient) => {
        let newMessage = '';
        const phone = recipient === 'student' ? student.studentMobile : student.fatherMobile;
        const name = recipient === 'student' ? student.name : `Parent of ${student.name}`;
        
        switch(template) {
            case 'full':
                newMessage = getDefaultMessage({...student, name});
                break;
            case 'parent':
                newMessage = getParentMessage(student);
                break;
            case 'short':
                newMessage = getShortMessage(student);
                break;
            case 'custom':
                newMessage = messageText.value;
                return;
            default:
                newMessage = getDefaultMessage({...student, name});
        }
        
        messageText.value = newMessage;
        updateLinks(phone, newMessage);
    };
    
    const updateLinks = (phone, message) => {
        const encodedMsg = encodeURIComponent(message);
        whatsappLink.href = `https://wa.me/91${phone}?text=${encodedMsg}`;
        smsLink.href = `sms:${phone}?body=${encodedMsg}`;
    };
    
    // Recipient buttons
    document.querySelectorAll('.message-recipient').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.message-recipient').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRecipient = btn.dataset.recipient;
            const phone = currentRecipient === 'student' ? student.studentMobile : student.fatherMobile;
            updateLinks(phone, messageText.value);
        });
    });
    
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = btn.dataset.template;
            updateMessage(template, currentRecipient);
        });
    });
    
    // Include due details change
    const includeDueSelect = document.getElementById('includeDueDetails');
    if (includeDueSelect) {
        includeDueSelect.addEventListener('change', () => {
            let currentMsg = messageText.value;
            const dueMonthsText = student.dueMonths.map(m => `${m.month}: ₹${m.dueAmount}`).join(', ');
            const totalDueText = `Total Due: ₹${student.totalDue.toLocaleString()}`;
            
            switch(includeDueSelect.value) {
                case 'all':
                    if (!currentMsg.includes(dueMonthsText)) {
                        currentMsg = currentMsg.replace(/Total Due:.*\n/, `Due Months: ${dueMonthsText}\nTotal Due: ₹${student.totalDue.toLocaleString()}\n`);
                        messageText.value = currentMsg;
                    }
                    break;
                case 'total':
                    currentMsg = currentMsg.replace(/Due Months:.*\n/, '');
                    messageText.value = currentMsg;
                    break;
                case 'current':
                    const currentMonthDue = student.dueMonths[student.dueMonths.length - 1];
                    if (currentMonthDue) {
                        currentMsg = currentMsg.replace(/Total Due:.*\n/, `Current Month Due: ${currentMonthDue.month} - ₹${currentMonthDue.dueAmount}\nTotal Due: ₹${student.totalDue.toLocaleString()}\n`);
                        messageText.value = currentMsg;
                    }
                    break;
            }
            const phone = currentRecipient === 'student' ? student.studentMobile : student.fatherMobile;
            updateLinks(phone, messageText.value);
        });
    }
    
    // Language change
    const languageSelect = document.getElementById('messageLanguage');
    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            let currentMsg = messageText.value;
            if (languageSelect.value === 'hindi') {
                currentMsg = currentMsg
                    .replace(/Dear/g, 'प्रिय')
                    .replace(/This is a gentle reminder/g, 'यह एक विनम्र स्मरण है')
                    .replace(/pending/g, 'बकाया')
                    .replace(/Please clear the dues/g, 'कृपया बकाया राशि जमा करें')
                    .replace(/Thank you/g, 'धन्यवाद')
                    .replace(/Regards/g, 'सादर');
                messageText.value = currentMsg;
            } else if (languageSelect.value === 'bilingual') {
                currentMsg = currentMsg + '\n\n(कृपया बकाया राशि जल्द से जल्द जमा करें)';
                messageText.value = currentMsg;
            }
            const phone = currentRecipient === 'student' ? student.studentMobile : student.fatherMobile;
            updateLinks(phone, messageText.value);
        });
    }
    
    // Live update links on message change
    messageText.addEventListener('input', () => {
        const phone = currentRecipient === 'student' ? student.studentMobile : student.fatherMobile;
        updateLinks(phone, messageText.value);
    });
    
    // Copy message button
    document.getElementById('copyMessageBtn').onclick = () => {
        messageText.select();
        document.execCommand('copy');
        showToast('Message copied to clipboard!', 'success');
    };
    
    // Close modal
    const closeModal = () => modal.remove();
    document.getElementById('closeMessageModal').onclick = closeModal;
    document.getElementById('closeMessageModalBtn').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    
    // Initial link update
    updateLinks(student.studentMobile, messageText.value);
}

// ============================================
// 8. EXPORT DUE LIST (CSV)
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
        new Date(s.joiningDate).toLocaleDateString(),
        s.classMonthlyFees,
        s.totalDue,
        s.dueMonths.map(m => m.month).join('; '),
        s.studentMobile,
        s.fatherName,
        s.fatherMobile
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_due_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Due list exported successfully!', 'success');
}

// ============================================
// 9. SETUP EVENT LISTENERS
// ============================================
function setupDueListEventListeners() {
    // Filter change events
    const boardFilter = document.getElementById('dueBoardFilter');
    const classFilter = document.getElementById('dueClassFilter');
    const searchInput = document.getElementById('dueSearchInput');
    
    if (boardFilter) boardFilter.addEventListener('change', renderDueStudentsList);
    if (classFilter) classFilter.addEventListener('change', renderDueStudentsList);
    if (searchInput) searchInput.addEventListener('input', renderDueStudentsList);
    
    // Export button
    const exportBtn = document.getElementById('exportDueListBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportDueListToCSV);
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshDueListBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        showLoader(true);
        loadAllStudentsForDueList().then(() => showLoader(false));
    });
}

// ============================================
// 10. RENDER STUDENT DUE LIST TAB HTML
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
                <!-- Stats Container -->
                <div id="dueStatsContainer"></div>
                
                <!-- Filters -->
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <label class="small fw-bold">Filter by Board</label>
                        <select id="dueBoardFilter" class="form-select">
                            <option value="">All Boards</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Filter by Class</label>
                        <select id="dueClassFilter" class="form-select">
                            <option value="">All Classes</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">Search</label>
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="dueSearchInput" class="form-control" placeholder="Search by name, ID, or mobile...">
                        </div>
                    </div>
                </div>
                
                <!-- Due Students List -->
                <div id="dueStudentsListContainer">
                    <div class="text-center py-5">
                        <i class="fas fa-spinner fa-spin fa-3x text-muted"></i>
                        <p class="mt-3">Loading due students...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// 11. INTEGRATION WITH MAIN DASHBOARD
// ============================================
function integrateStudentDueListTab() {
    const checkElements = setInterval(() => {
        const desktopTabs = document.querySelector('.tabs-container.d-none.d-md-flex');
        const bottomNav = document.querySelector('.bottom-nav.d-md-none');
        const tabContents = document.getElementById('tabContents');
        
        if (desktopTabs && bottomNav && tabContents) {
            clearInterval(checkElements);
            
            // Check if tab already exists
            if (document.querySelector('.tab-btn[data-tab="studentdue"]')) return;
            
            // Add tab to desktop
            const dueTabBtn = document.createElement('button');
            dueTabBtn.className = 'tab-btn';
            dueTabBtn.setAttribute('data-tab', 'studentdue');
            dueTabBtn.innerHTML = '<i class="fas fa-rupee-sign text-danger"></i> Due List';
            desktopTabs.appendChild(dueTabBtn);
            
            // Add to mobile bottom nav
            const dueMobileBtn = document.createElement('div');
            dueMobileBtn.className = 'bottom-nav-item';
            dueMobileBtn.setAttribute('data-tab', 'studentdue');
            dueMobileBtn.innerHTML = '<i class="fas fa-rupee-sign"></i><span>Due List</span>';
            bottomNav.appendChild(dueMobileBtn);
            
            // Create pane
            const duePane = document.createElement('div');
            duePane.id = 'studentduePane';
            duePane.className = 'tab-pane';
            duePane.style.display = 'none';
            duePane.innerHTML = renderStudentDueListTab();
            tabContents.appendChild(duePane);
            
            // Add click handlers
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
            
            // Override switchTab
            if (typeof window.switchTab === 'function') {
                const originalSwitchTab = window.switchTab;
                window.switchTab = function(tabId) {
                    originalSwitchTab(tabId);
                    if (tabId === 'studentdue') {
                        setTimeout(() => initStudentDueListTab(), 100);
                    }
                };
            }
            
            console.log('✅ Student Due List Tab integrated successfully!');
        }
    }, 100);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.initStudentDueListTab = initStudentDueListTab;
window.integrateStudentDueListTab = integrateStudentDueListTab;
window.renderStudentDueListTab = renderStudentDueListTab;
window.exportDueListToCSV = exportDueListToCSV;

// Auto-integrate when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrateStudentDueListTab);
} else {
    integrateStudentDueListTab();
}
