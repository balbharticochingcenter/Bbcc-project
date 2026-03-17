// ============================================
// COMPLETE STUDENT MANAGEMENT SYSTEM - WITH DATABASE SYNC
// ============================================

(function() {
    console.log("📚 Student Management Loading...");
    
    // Check if we're on admin page
    const isAdminPage = document.getElementById('myTab') !== null;
    if (!isAdminPage) {
        console.log("❌ Not admin page, exiting");
        return;
    }
    
    // Check token
    const token = localStorage.getItem('token');
    if (!token) {
        console.log("❌ No token found");
        return;
    }
    
    // ============================================
    // GLOBAL VARIABLES
    // ============================================
    let allStudents = [];
    let filteredStudents = [];
    let currentBoard = '';
    let currentClass = '';
    let currentStudentId = null;
    let currentStudentData = null;
    let monthlyFeeChart = null;
    
    // ============================================
    // CONSTANTS
    // ============================================
    const MONTHLY_BASE_FEE = 1000;
    const BOARDS = ['CBSE', 'ICSE', 'State Board', 'NIOS'];
    const CLASSES = [
        'Nursery', 'LKG', 'UKG',
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11', 'Class 12',
        'BA', 'BSc', 'BCom', 'BTech'
    ];
    
    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            alert(message);
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ============================================
    // ADD STUDENT TAB TO NAVIGATION
    // ============================================
    function addStudentTab() {
        console.log("Adding student tab...");
        
        const tabList = document.getElementById('myTab');
        if (!tabList) {
            console.log("❌ Tab list not found");
            return false;
        }
        
        // Check if tab already exists
        if (document.getElementById('students-tab')) {
            console.log("✅ Student tab already exists");
            return true;
        }
        
        const studentTab = document.createElement('li');
        studentTab.className = 'nav-item';
        studentTab.setAttribute('role', 'presentation');
        studentTab.innerHTML = `
            <button class="nav-link" id="students-tab" data-bs-toggle="tab" data-bs-target="#students" type="button" role="tab">
                <i class="fas fa-users me-2"></i>Student Management
            </button>
        `;
        
        tabList.appendChild(studentTab);
        console.log("✅ Student tab added");
        return true;
    }
    
    // ============================================
    // CREATE STUDENT TAB CONTENT
    // ============================================
    function createStudentTabContent() {
        console.log("Creating tab content...");
        
        if (document.getElementById('students')) {
            console.log("✅ Student content already exists");
            return true;
        }
        
        const tabContent = document.querySelector('.tab-content');
        if (!tabContent) {
            console.log("❌ Tab content not found");
            return false;
        }
        
        const studentPane = document.createElement('div');
        studentPane.className = 'tab-pane fade';
        studentPane.id = 'students';
        studentPane.setAttribute('role', 'tabpanel');
        
        studentPane.innerHTML = `
            <!-- Board and Class Selection -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Select Board & Class</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-5 mb-2">
                                    <label class="form-label">Select Board</label>
                                    <select class="form-select" id="studentBoardSelect">
                                        <option value="">-- Choose Board --</option>
                                        ${BOARDS.map(board => `<option value="${board}">${board}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-5 mb-2">
                                    <label class="form-label">Select Class</label>
                                    <select class="form-select" id="studentClassSelect" disabled>
                                        <option value="">-- First Select Board --</option>
                                    </select>
                                </div>
                                <div class="col-md-2 mb-2 d-flex align-items-end">
                                    <button class="btn btn-primary w-100" id="loadStudentsBtn" disabled>
                                        <i class="fas fa-search me-2"></i>Load Students
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Summary Cards -->
            <div class="row mb-4" id="summaryCards" style="display: none;">
                <div class="col-md-3 mb-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6>Total Students</h6>
                            <h2 id="totalStudents">0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6>Total Collected</h6>
                            <h2 id="totalCollected">₹0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h6>Total Due</h6>
                            <h2 id="totalDue">₹0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6>Monthly Fee</h6>
                            <h2 id="monthlyFeeDisplay">₹1000</h2>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Search Bar -->
            <div class="row mb-3" id="searchBar" style="display: none;">
                <div class="col-md-12">
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                        <input type="text" class="form-control" id="searchStudentInput" placeholder="Search by Name, ID, Mobile or Aadhar...">
                        <button class="btn btn-outline-secondary" type="button" id="refreshStudentsBtn">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="btn btn-outline-success" type="button" id="exportCSVBtn">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Students Table -->
            <div class="row" id="studentsTableContainer" style="display: none;">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="fas fa-list me-2"></i>Students List - <span id="selectedBoardClass"></span></h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover table-bordered">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Photo</th>
                                            <th>Student ID</th>
                                            <th>Student Name</th>
                                            <th>Mobile</th>
                                            <th>Aadhar</th>
                                            <th>Father's Mobile</th>
                                            <th>Joining Date</th>
                                            <th>Total Fee</th>
                                            <th>Paid</th>
                                            <th>Due</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="studentTableBody">
                                        <tr>
                                            <td colspan="11" class="text-center py-4">
                                                <i class="fas fa-spinner fa-spin fa-2x"></i>
                                                <p class="mt-2">Loading students...</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Fee Tracker Container (Hidden by Default) -->
            <div class="row mt-4" id="feeTrackerContainer" style="display: none;">
                <div class="col-md-12">
                    <div class="card border-warning">
                        <div class="card-header bg-warning text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>Fee Tracker: <span id="trackerStudentName"></span></h5>
                            <button class="btn btn-sm btn-light" id="closeFeeTracker">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="card-body">
                            <!-- Student Quick Info -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <img id="trackerStudentPhoto" src="" class="img-fluid rounded" style="max-height: 80px;">
                                </div>
                                <div class="col-md-9">
                                    <div class="row">
                                        <div class="col-md-3">
                                            <strong>ID:</strong> <span id="trackerStudentId"></span>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>Board:</strong> <span id="trackerBoard"></span>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>Class:</strong> <span id="trackerClass"></span>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>Joining:</strong> <span id="trackerJoiningDate"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Fee Summary -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <div class="card bg-info text-white p-2">
                                        <h6>Monthly Fee</h6>
                                        <h5 id="trackerMonthlyFee">₹1000</h5>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card bg-primary text-white p-2">
                                        <h6>Total Months</h6>
                                        <h5 id="trackerTotalMonths">0</h5>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card bg-success text-white p-2">
                                        <h6>Total Fee</h6>
                                        <h5 id="trackerTotalFee">₹0</h5>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card bg-danger text-white p-2">
                                        <h6>Due Amount</h6>
                                        <h5 id="trackerDueFee">₹0</h5>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Chart -->
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <canvas id="monthlyFeeChart" height="100"></canvas>
                                </div>
                            </div>
                            
                            <!-- Month-wise Fee Table -->
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <h6 class="mb-2">Month-wise Fee Status (Joining till Current Date)</h6>
                                    <div class="table-responsive" style="max-height: 300px;">
                                        <table class="table table-sm table-bordered">
                                            <thead class="table-secondary">
                                                <tr>
                                                    <th>Month</th>
                                                    <th>Fee Amount</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody id="monthlyFeeTableBody"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Bulk Update -->
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-info">
                                        <div class="row">
                                            <div class="col-md-4">
                                                <label>Update Paid Amount</label>
                                                <input type="number" class="form-control" id="bulkFeeAmount" placeholder="Enter total paid amount">
                                            </div>
                                            <div class="col-md-4 d-flex align-items-end">
                                                <button class="btn btn-primary w-100" id="updateBulkFeeBtn">
                                                    <i class="fas fa-save me-2"></i>Update All Months
                                                </button>
                                            </div>
                                            <div class="col-md-4 d-flex align-items-end">
                                                <small class="text-muted">
                                                    <i class="fas fa-info-circle"></i>
                                                    Months will be automatically marked paid from start
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        tabContent.appendChild(studentPane);
        console.log("✅ Student content created");
        return true;
    }
    
    // ============================================
    // CREATE EDIT STUDENT MODAL
    // ============================================
    function createEditStudentModal() {
        if (document.getElementById('editStudentModal')) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'editStudentModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>Edit Student Details
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="editStudentId">
                        
                        <!-- Photo -->
                        <div class="row mb-3">
                            <div class="col-md-12 text-center">
                                <img id="editStudentPhoto" src="" class="img-thumbnail" style="max-height: 150px;">
                            </div>
                        </div>
                        
                        <!-- Student Basic Info -->
                        <h6 class="border-bottom pb-2">Student Information</h6>
                        <div class="row mb-3">
                            <div class="col-md-4 mb-2">
                                <label>First Name *</label>
                                <input type="text" class="form-control" id="editFirstName" required>
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Middle Name</label>
                                <input type="text" class="form-control" id="editMiddleName">
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Last Name *</label>
                                <input type="text" class="form-control" id="editLastName" required>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-4 mb-2">
                                <label>Student ID *</label>
                                <input type="text" class="form-control" id="editStudentIdField" readonly>
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Mobile *</label>
                                <input type="text" class="form-control" id="editMobile" maxlength="10" required>
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Aadhar Number *</label>
                                <input type="text" class="form-control" id="editAadhar" maxlength="12" readonly>
                            </div>
                        </div>
                        
                        <!-- Father Info -->
                        <h6 class="border-bottom pb-2">Father's Information</h6>
                        <div class="row mb-3">
                            <div class="col-md-4 mb-2">
                                <label>Father First Name *</label>
                                <input type="text" class="form-control" id="editFatherFirstName" required>
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Father Middle Name</label>
                                <input type="text" class="form-control" id="editFatherMiddleName">
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Father Last Name *</label>
                                <input type="text" class="form-control" id="editFatherLastName" required>
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Father Mobile *</label>
                                <input type="text" class="form-control" id="editFatherMobile" maxlength="10" required>
                            </div>
                        </div>
                        
                        <!-- Mother Info -->
                        <h6 class="border-bottom pb-2">Mother's Information</h6>
                        <div class="row mb-3">
                            <div class="col-md-4 mb-2">
                                <label>Mother First Name</label>
                                <input type="text" class="form-control" id="editMotherFirstName">
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Mother Middle Name</label>
                                <input type="text" class="form-control" id="editMotherMiddleName">
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Mother Last Name</label>
                                <input type="text" class="form-control" id="editMotherLastName">
                            </div>
                        </div>
                        
                        <!-- Address -->
                        <h6 class="border-bottom pb-2">Address</h6>
                        <div class="row mb-3">
                            <div class="col-md-6 mb-2">
                                <label>Current Address *</label>
                                <textarea class="form-control" id="editCurrentAddress" rows="2" required></textarea>
                            </div>
                            <div class="col-md-6 mb-2">
                                <label>Permanent Address *</label>
                                <textarea class="form-control" id="editPermanentAddress" rows="2" required></textarea>
                            </div>
                        </div>
                        
                        <!-- Education -->
                        <h6 class="border-bottom pb-2">Education</h6>
                        <div class="row mb-3">
                            <div class="col-md-4 mb-2">
                                <label>Board *</label>
                                <select class="form-select" id="editBoard" required>
                                    ${BOARDS.map(board => `<option value="${board}">${board}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Class *</label>
                                <select class="form-select" id="editClass" required>
                                    ${CLASSES.map(cls => `<option value="${cls}">${cls}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-4 mb-2">
                                <label>Joining Date *</label>
                                <input type="date" class="form-control" id="editJoiningDate" required>
                            </div>
                        </div>
                        
                        <!-- Fee -->
                        <h6 class="border-bottom pb-2">Fee Information</h6>
                        <div class="row mb-3">
                            <div class="col-md-4 mb-2">
                                <label>Total Fees Paid</label>
                                <input type="number" class="form-control" id="editFees" value="0">
                                <small class="text-muted">Total amount paid so far</small>
                            </div>
                        </div>
                        
                        <!-- Aadhar Document -->
                        <h6 class="border-bottom pb-2">Documents</h6>
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <label>Aadhar Document</label>
                                <div>
                                    <img id="editAadharDocument" src="" class="img-thumbnail" style="max-height: 100px;">
                                    <p class="text-muted small mt-1">Document cannot be changed here</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="deleteFromEditBtn">
                            <i class="fas fa-trash me-2"></i>Delete Student
                        </button>
                        <button type="button" class="btn btn-warning" id="saveEditBtn">
                            <i class="fas fa-save me-2"></i>Save Changes to Database
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ============================================
    // POPULATE CLASS DROPDOWN
    // ============================================
    function populateClassDropdown(board) {
        const classSelect = document.getElementById('studentClassSelect');
        if (!classSelect) return;
        
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';
        classSelect.disabled = !board;
        
        if (board) {
            CLASSES.forEach(cls => {
                classSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
            });
        }
    }
    
    // ============================================
    // FEE CALCULATION (Joining till Current Date)
    // ============================================
    function calculateMonthsUntilNow(joiningDate) {
        const join = new Date(joiningDate);
        const today = new Date();
        
        // Reset to first of month for calculation
        const joinMonth = new Date(join.getFullYear(), join.getMonth(), 1);
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Calculate months between
        let months = 0;
        let tempDate = new Date(joinMonth);
        
        while (tempDate <= currentMonth) {
            months++;
            tempDate.setMonth(tempDate.getMonth() + 1);
        }
        
        return months;
    }
    
    function calculateMonthlyFee(classname) {
        const baseFee = MONTHLY_BASE_FEE;
        if (!classname) return baseFee;
        
        if (classname.includes('11') || classname.includes('12')) {
            return baseFee + 500;
        }
        if (classname.includes('BA') || classname.includes('BSc') || 
            classname.includes('BCom') || classname.includes('BTech')) {
            return baseFee + 1000;
        }
        return baseFee;
    }
    
    function calculateFeeDetails(student) {
        if (!student || !student.joiningDate) {
            return { 
                totalMonths: 0, 
                monthlyFee: MONTHLY_BASE_FEE, 
                totalFee: 0, 
                paidFee: 0, 
                dueFee: 0, 
                months: [] 
            };
        }
        
        const totalMonths = calculateMonthsUntilNow(student.joiningDate);
        const monthlyFee = calculateMonthlyFee(student.education?.class);
        const totalFee = totalMonths * monthlyFee;
        const paidFee = student.fees || 0;
        const dueFee = Math.max(0, totalFee - paidFee);
        
        const months = [];
        const joinDate = new Date(student.joiningDate);
        const today = new Date();
        
        for (let i = 0; i < totalMonths; i++) {
            const monthDate = new Date(joinDate);
            monthDate.setMonth(joinDate.getMonth() + i);
            
            // Stop if month is after current date
            if (monthDate > today) break;
            
            const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            // Determine if this month is paid
            const monthPaid = paidFee >= (i + 1) * monthlyFee;
            
            months.push({
                name: monthName,
                fee: monthlyFee,
                paid: monthPaid,
                monthIndex: i
            });
        }
        
        return { totalMonths, monthlyFee, totalFee, paidFee, dueFee, months };
    }
    
    // ============================================
    // FETCH STUDENTS BY BOARD AND CLASS
    // ============================================
    async function fetchStudentsByBoardAndClass(board, className) {
        console.log(`Fetching students for ${board} - ${className}...`);
        
        try {
            const response = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            allStudents = result.data || [];
            
            // Filter by board and class
            filteredStudents = allStudents.filter(student => 
                student.education?.board === board && 
                student.education?.class === className
            );
            
            // Show containers
            document.getElementById('summaryCards').style.display = 'flex';
            document.getElementById('searchBar').style.display = 'block';
            document.getElementById('studentsTableContainer').style.display = 'block';
            document.getElementById('selectedBoardClass').textContent = `${board} - ${className}`;
            
            // Update display
            renderStudentTable();
            updateSummaryCards();
            
            showToast(`Loaded ${filteredStudents.length} students`, 'success');
            
        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Failed to load students', 'error');
        }
    }
    
    // ============================================
    // RENDER STUDENT TABLE
    // ============================================
    function renderStudentTable() {
        const tbody = document.getElementById('studentTableBody');
        if (!tbody) return;
        
        if (filteredStudents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-4">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No students found in this class</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = filteredStudents.map(student => {
            const feeDetails = calculateFeeDetails(student);
            const photoHtml = student.photo ? 
                `<img src="${student.photo}" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">` : 
                `<i class="fas fa-user-circle fa-2x text-muted"></i>`;
            
            return `
                <tr>
                    <td>${photoHtml}</td>
                    <td><span class="badge bg-info">${student.studentId || ''}</span></td>
                    <td>
                        <strong>${student.studentName?.first || ''} ${student.studentName?.middle || ''} ${student.studentName?.last || ''}</strong>
                    </td>
                    <td>${student.mobile || ''}</td>
                    <td>${student.aadharNumber ? student.aadharNumber.substring(0, 4) + '...' : ''}</td>
                    <td>${student.fatherMobile || ''}</td>
                    <td>${student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : ''}</td>
                    <td>₹${feeDetails.totalFee}</td>
                    <td>₹${feeDetails.paidFee}</td>
                    <td>
                        <span class="badge ${feeDetails.dueFee > 0 ? 'bg-danger' : 'bg-success'}">
                            ₹${feeDetails.dueFee}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info text-white mb-1" onclick="window.trackFee('${student.studentId}')">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="btn btn-sm btn-warning mb-1" onclick="window.editStudent('${student.studentId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger mb-1" onclick="window.deleteStudent('${student.studentId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // ============================================
    // UPDATE SUMMARY CARDS
    // ============================================
    function updateSummaryCards() {
        const totalFees = filteredStudents.reduce((sum, s) => sum + (s.fees || 0), 0);
        const totalDue = filteredStudents.reduce((sum, s) => {
            const feeDetails = calculateFeeDetails(s);
            return sum + feeDetails.dueFee;
        }, 0);
        
        document.getElementById('totalStudents').textContent = filteredStudents.length;
        document.getElementById('totalCollected').textContent = `₹${totalFees}`;
        document.getElementById('totalDue').textContent = `₹${totalDue}`;
        document.getElementById('monthlyFeeDisplay').textContent = `₹${MONTHLY_BASE_FEE}`;
    }
    
    // ============================================
    // FILTER STUDENTS BY SEARCH
    // ============================================
    function filterStudentsBySearch(searchText) {
        if (!searchText) {
            filteredStudents = allStudents.filter(student => 
                student.education?.board === currentBoard && 
                student.education?.class === currentClass
            );
        } else {
            const lowerSearch = searchText.toLowerCase();
            filteredStudents = allStudents.filter(student => {
                // Check if student belongs to current board/class
                if (student.education?.board !== currentBoard || 
                    student.education?.class !== currentClass) {
                    return false;
                }
                
                // Search in fields
                const fullName = `${student.studentName?.first || ''} ${student.studentName?.middle || ''} ${student.studentName?.last || ''}`.toLowerCase();
                return fullName.includes(lowerSearch) || 
                       (student.studentId || '').toLowerCase().includes(lowerSearch) ||
                       (student.mobile || '').includes(lowerSearch) ||
                       (student.aadharNumber || '').includes(lowerSearch);
            });
        }
        
        renderStudentTable();
        updateSummaryCards();
    }
    
    // ============================================
    // TRACK FEE FOR STUDENT
    // ============================================
    window.trackFee = async function(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            const student = result.data;
            currentStudentId = studentId;
            currentStudentData = student;
            
            const feeDetails = calculateFeeDetails(student);
            
            // Display fee tracker
            document.getElementById('feeTrackerContainer').style.display = 'block';
            
            // Set student info
            document.getElementById('trackerStudentName').textContent = 
                `${student.studentName?.first || ''} ${student.studentName?.last || ''}`;
            
            if (student.photo) {
                document.getElementById('trackerStudentPhoto').src = student.photo;
            }
            
            document.getElementById('trackerStudentId').textContent = student.studentId || '';
            document.getElementById('trackerBoard').textContent = student.education?.board || '';
            document.getElementById('trackerClass').textContent = student.education?.class || '';
            document.getElementById('trackerJoiningDate').textContent = 
                student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : '';
            
            // Set fee details
            document.getElementById('trackerMonthlyFee').textContent = `₹${feeDetails.monthlyFee}`;
            document.getElementById('trackerTotalMonths').textContent = feeDetails.totalMonths;
            document.getElementById('trackerTotalFee').textContent = `₹${feeDetails.totalFee}`;
            document.getElementById('trackerDueFee').textContent = `₹${feeDetails.dueFee}`;
            
            // Set bulk fee amount
            document.getElementById('bulkFeeAmount').value = feeDetails.paidFee;
            
            // Render month-wise table
            renderMonthlyFeeTable(feeDetails.months, feeDetails.monthlyFee, student.fees || 0);
            
            // Render chart
            renderMonthlyFeeChart(feeDetails.months, feeDetails.monthlyFee);
            
            // Scroll to fee tracker
            document.getElementById('feeTrackerContainer').scrollIntoView({ behavior: 'smooth' });
            
        } catch (err) {
            console.error(err);
            showToast('Failed to load fee details', 'error');
        }
    };
    
    // ============================================
    // RENDER MONTHLY FEE TABLE
    // ============================================
    function renderMonthlyFeeTable(months, monthlyFee, totalPaid) {
        const tbody = document.getElementById('monthlyFeeTableBody');
        if (!tbody) return;
        
        if (months.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No months to display</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = months.map((month, index) => {
            // Calculate cumulative paid amount up to this month
            const cumulativeAmount = (index + 1) * monthlyFee;
            const isPaid = totalPaid >= cumulativeAmount;
            
            return `
                <tr>
                    <td>${month.name}</td>
                    <td>₹${month.fee}</td>
                    <td>
                        <span class="badge ${isPaid ? 'bg-success' : 'bg-danger'}">
                            ${isPaid ? 'Paid' : 'Due'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm ${isPaid ? 'btn-warning' : 'btn-success'}" 
                                onclick="window.toggleMonthPayment(${index}, ${monthlyFee})">
                            ${isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // ============================================
    // RENDER MONTHLY FEE CHART
    // ============================================
    function renderMonthlyFeeChart(months, monthlyFee) {
        const canvas = document.getElementById('monthlyFeeChart');
        if (!canvas) return;
        
        if (typeof Chart === 'undefined') {
            console.log("Chart.js not loaded");
            return;
        }
        
        if (monthlyFeeChart) monthlyFeeChart.destroy();
        
        const labels = months.map(m => m.name);
        const paidData = months.map((m, index) => {
            return (index + 1) <= (currentStudentData?.fees || 0) / monthlyFee ? monthlyFee : 0;
        });
        const dueData = months.map((m, index) => {
            return (index + 1) > (currentStudentData?.fees || 0) / monthlyFee ? monthlyFee : 0;
        });
        
        monthlyFeeChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Paid',
                        data: paidData,
                        backgroundColor: '#10b981',
                        stack: 'fee'
                    },
                    {
                        label: 'Due',
                        data: dueData,
                        backgroundColor: '#ef4444',
                        stack: 'fee'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { 
                        stacked: true,
                        beginAtZero: true,
                        title: { display: true, text: 'Amount (₹)' }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // ============================================
    // TOGGLE MONTH PAYMENT
    // ============================================
    window.toggleMonthPayment = async function(monthIndex, monthlyFee) {
        if (!currentStudentId || !currentStudentData) return;
        
        const currentPaid = currentStudentData.fees || 0;
        const targetAmount = (monthIndex + 1) * monthlyFee;
        
        let newPaid;
        
        if (currentPaid >= targetAmount) {
            // Mark as unpaid - reduce to previous month's total
            newPaid = monthIndex * monthlyFee;
        } else {
            // Mark as paid - increase to this month's total
            newPaid = targetAmount;
        }
        
        await updateStudentFeeInDatabase(currentStudentId, newPaid);
    };
    
    // ============================================
    // UPDATE BULK FEE
    // ============================================
    window.updateBulkFee = async function() {
        if (!currentStudentId) return;
        
        const newPaid = parseInt(document.getElementById('bulkFeeAmount').value) || 0;
        
        if (newPaid < 0) {
            showToast('Please enter a valid amount', 'warning');
            return;
        }
        
        await updateStudentFeeInDatabase(currentStudentId, newPaid);
    };
    
    // ============================================
    // UPDATE STUDENT FEE IN DATABASE
    // ============================================
    async function updateStudentFeeInDatabase(studentId, newFee) {
        const btn = document.getElementById('updateBulkFeeBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        }
        
        try {
            const response = await fetch(`/api/students/${studentId}/fees`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fees: newFee })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Fee updated in database successfully');
                
                // Update local data
                const student = allStudents.find(s => s.studentId === studentId);
                if (student) student.fees = newFee;
                
                // Update current student data
                currentStudentData.fees = newFee;
                
                // Refresh displays
                renderStudentTable();
                updateSummaryCards();
                
                // Refresh fee tracker
                const feeDetails = calculateFeeDetails(currentStudentData);
                document.getElementById('trackerTotalFee').textContent = `₹${feeDetails.totalFee}`;
                document.getElementById('trackerDueFee').textContent = `₹${feeDetails.dueFee}`;
                document.getElementById('bulkFeeAmount').value = newFee;
                
                renderMonthlyFeeTable(feeDetails.months, feeDetails.monthlyFee, newFee);
                renderMonthlyFeeChart(feeDetails.months, feeDetails.monthlyFee);
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Failed to update fee in database', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save me-2"></i>Update All Months';
            }
        }
    }
    
    // ============================================
    // EDIT STUDENT - LOAD DATA
    // ============================================
    window.editStudent = async function(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            const student = result.data;
            
            // Store current student ID
            currentStudentId = studentId;
            
            // Fill edit form
            document.getElementById('editStudentId').value = student.studentId;
            document.getElementById('editStudentIdField').value = student.studentId;
            
            if (student.photo) {
                document.getElementById('editStudentPhoto').src = student.photo;
            }
            
            // Student info
            document.getElementById('editFirstName').value = student.studentName?.first || '';
            document.getElementById('editMiddleName').value = student.studentName?.middle || '';
            document.getElementById('editLastName').value = student.studentName?.last || '';
            document.getElementById('editMobile').value = student.mobile || '';
            document.getElementById('editAadhar').value = student.aadharNumber || '';
            
            // Father info
            document.getElementById('editFatherFirstName').value = student.fatherName?.first || '';
            document.getElementById('editFatherMiddleName').value = student.fatherName?.middle || '';
            document.getElementById('editFatherLastName').value = student.fatherName?.last || '';
            document.getElementById('editFatherMobile').value = student.fatherMobile || '';
            
            // Mother info
            document.getElementById('editMotherFirstName').value = student.motherName?.first || '';
            document.getElementById('editMotherMiddleName').value = student.motherName?.middle || '';
            document.getElementById('editMotherLastName').value = student.motherName?.last || '';
            
            // Address
            document.getElementById('editCurrentAddress').value = student.address?.current || '';
            document.getElementById('editPermanentAddress').value = student.address?.permanent || '';
            
            // Education
            document.getElementById('editBoard').value = student.education?.board || 'CBSE';
            document.getElementById('editClass').value = student.education?.class || '';
            document.getElementById('editJoiningDate').value = student.joiningDate ? 
                new Date(student.joiningDate).toISOString().split('T')[0] : '';
            
            // Fee
            document.getElementById('editFees').value = student.fees || 0;
            
            // Aadhar document
            if (student.aadharDocument) {
                document.getElementById('editAadharDocument').src = student.aadharDocument;
            }
            
            // Open modal
            const editModal = new bootstrap.Modal(document.getElementById('editStudentModal'));
            editModal.show();
            
        } catch (err) {
            showToast('Failed to load student data', 'error');
        }
    };
    
    // ============================================
    // SAVE EDITED STUDENT TO DATABASE
    // ============================================
    window.saveEditedStudent = async function() {
        const studentId = document.getElementById('editStudentId').value;
        
        // Validate required fields
        if (!document.getElementById('editFirstName').value ||
            !document.getElementById('editLastName').value ||
            !document.getElementById('editMobile').value ||
            !document.getElementById('editFatherFirstName').value ||
            !document.getElementById('editFatherLastName').value ||
            !document.getElementById('editFatherMobile').value ||
            !document.getElementById('editCurrentAddress').value ||
            !document.getElementById('editPermanentAddress').value ||
            !document.getElementById('editBoard').value ||
            !document.getElementById('editClass').value ||
            !document.getElementById('editJoiningDate').value) {
            showToast('Please fill all required fields', 'warning');
            return;
        }
        
        // Validate mobile numbers
        const mobile = document.getElementById('editMobile').value;
        const fatherMobile = document.getElementById('editFatherMobile').value;
        
        if (!/^\d{10}$/.test(mobile)) {
            showToast('Student mobile must be 10 digits', 'warning');
            return;
        }
        
        if (!/^\d{10}$/.test(fatherMobile)) {
            showToast('Father mobile must be 10 digits', 'warning');
            return;
        }
        
        const updatedData = {
            studentName: {
                first: document.getElementById('editFirstName').value,
                middle: document.getElementById('editMiddleName').value,
                last: document.getElementById('editLastName').value
            },
            mobile: mobile,
            fatherName: {
                first: document.getElementById('editFatherFirstName').value,
                middle: document.getElementById('editFatherMiddleName').value,
                last: document.getElementById('editFatherLastName').value
            },
            fatherMobile: fatherMobile,
            motherName: {
                first: document.getElementById('editMotherFirstName').value,
                middle: document.getElementById('editMotherMiddleName').value,
                last: document.getElementById('editMotherLastName').value
            },
            address: {
                current: document.getElementById('editCurrentAddress').value,
                permanent: document.getElementById('editPermanentAddress').value
            },
            education: {
                board: document.getElementById('editBoard').value,
                class: document.getElementById('editClass').value
            },
            joiningDate: document.getElementById('editJoiningDate').value,
            fees: parseInt(document.getElementById('editFees').value) || 0
        };
        
        const btn = document.getElementById('saveEditBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Student updated in database successfully');
                
                // Refresh data
                await fetchStudentsByBoardAndClass(currentBoard, currentClass);
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('editStudentModal')).hide();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Failed to update student in database', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-2"></i>Save Changes to Database';
        }
    };
    
    // ============================================
    // DELETE STUDENT FROM DATABASE
    // ============================================
    window.deleteStudent = async function(studentId) {
        if (!confirm(`Delete student ${studentId} from database? This cannot be undone!`)) return;
        
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Student deleted from database');
                
                // Remove from arrays
                allStudents = allStudents.filter(s => s.studentId !== studentId);
                
                // Refresh current view
                if (currentBoard && currentClass) {
                    filteredStudents = allStudents.filter(s => 
                        s.education?.board === currentBoard && 
                        s.education?.class === currentClass
                    );
                    renderStudentTable();
                    updateSummaryCards();
                }
                
                // Hide fee tracker if open
                if (currentStudentId === studentId) {
                    document.getElementById('feeTrackerContainer').style.display = 'none';
                    currentStudentId = null;
                    currentStudentData = null;
                }
            } else {
                showToast(result.message || 'Delete failed', 'error');
            }
        } catch (err) {
            showToast('Failed to delete student from database', 'error');
        }
    };
    
    // ============================================
    // DELETE FROM EDIT MODAL
    // ============================================
    window.deleteFromEditModal = function() {
        const studentId = document.getElementById('editStudentId').value;
        bootstrap.Modal.getInstance(document.getElementById('editStudentModal')).hide();
        setTimeout(() => {
            window.deleteStudent(studentId);
        }, 500);
    };
    
    // ============================================
    // EXPORT TO CSV
    // ============================================
    window.exportToCSV = function() {
        if (filteredStudents.length === 0) {
            showToast('No students to export', 'warning');
            return;
        }
        
        const headers = [
            'Student ID', 'First Name', 'Middle Name', 'Last Name',
            'Mobile', 'Aadhar Number', 'Registration Date', 'Joining Date',
            'Father First', 'Father Middle', 'Father Last', 'Father Mobile',
            'Mother First', 'Mother Middle', 'Mother Last',
            'Current Address', 'Permanent Address',
            'Board', 'Class', 'Total Fee Paid'
        ];
        
        const rows = [headers];
        
        filteredStudents.forEach(s => {
            const feeDetails = calculateFeeDetails(s);
            rows.push([
                s.studentId || '',
                s.studentName?.first || '',
                s.studentName?.middle || '',
                s.studentName?.last || '',
                s.mobile || '',
                s.aadharNumber || '',
                s.registrationDate ? new Date(s.registrationDate).toLocaleDateString() : '',
                s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '',
                s.fatherName?.first || '',
                s.fatherName?.middle || '',
                s.fatherName?.last || '',
                s.fatherMobile || '',
                s.motherName?.first || '',
                s.motherName?.middle || '',
                s.motherName?.last || '',
                s.address?.current || '',
                s.address?.permanent || '',
                s.education?.board || '',
                s.education?.class || '',
                s.fees || 0
            ]);
        });
        
        const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentBoard}_${currentClass}_students.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast('Data exported successfully');
    };
    
    // ============================================
    // CLOSE FEE TRACKER
    // ============================================
    window.closeFeeTracker = function() {
        document.getElementById('feeTrackerContainer').style.display = 'none';
        currentStudentId = null;
        currentStudentData = null;
    };
    
    // ============================================
    // INITIALIZE EVENT LISTENERS
    // ============================================
    function initEventListeners() {
        // Board select change
        document.getElementById('studentBoardSelect')?.addEventListener('change', function(e) {
            currentBoard = e.target.value;
            populateClassDropdown(currentBoard);
            
            const loadBtn = document.getElementById('loadStudentsBtn');
            const classSelect = document.getElementById('studentClassSelect');
            
            if (currentBoard) {
                classSelect.disabled = false;
            } else {
                classSelect.disabled = true;
                loadBtn.disabled = true;
            }
        });
        
        // Class select change
        document.getElementById('studentClassSelect')?.addEventListener('change', function(e) {
            currentClass = e.target.value;
            document.getElementById('loadStudentsBtn').disabled = !currentClass;
        });
        
        // Load students button
        document.getElementById('loadStudentsBtn')?.addEventListener('click', function() {
            if (currentBoard && currentClass) {
                fetchStudentsByBoardAndClass(currentBoard, currentClass);
            }
        });
        
        // Search input
        document.getElementById('searchStudentInput')?.addEventListener('input', function(e) {
            filterStudentsBySearch(e.target.value);
        });
        
        // Refresh button
        document.getElementById('refreshStudentsBtn')?.addEventListener('click', function() {
            if (currentBoard && currentClass) {
                fetchStudentsByBoardAndClass(currentBoard, currentClass);
            }
        });
        
        // Export button
        document.getElementById('exportCSVBtn')?.addEventListener('click', window.exportToCSV);
        
        // Fee tracker close
        document.getElementById('closeFeeTracker')?.addEventListener('click', window.closeFeeTracker);
        
        // Bulk fee update
        document.getElementById('updateBulkFeeBtn')?.addEventListener('click', window.updateBulkFee);
        
        // Edit modal save
        document.getElementById('saveEditBtn')?.addEventListener('click', window.saveEditedStudent);
        
        // Delete from edit modal
        document.getElementById('deleteFromEditBtn')?.addEventListener('click', window.deleteFromEditModal);
    }
    
    // ============================================
    // INITIALIZE EVERYTHING
    // ============================================
    function init() {
        console.log("🚀 Initializing Student Management System...");
        
        addStudentTab();
        createStudentTabContent();
        createEditStudentModal();
        
        setTimeout(() => {
            initEventListeners();
        }, 100);
    }
    
    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
