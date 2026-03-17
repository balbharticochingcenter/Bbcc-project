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
    let feeChart = null;
    let boardFilter = '';
    let classFilter = '';
    let promotionDate = '';
    let promotionClass = '';
    let currentStudentId = null;
    
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
                <i class="fas fa-users me-2"></i>Students
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
            <!-- Dashboard Cards -->
            <div class="row mb-4">
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
                            <h2 id="monthFee">₹1000</h2>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Chart -->
            <div class="row mb-4">
                <div class="col-md-6 mx-auto">
                    <div class="card p-3">
                        <canvas id="feeChart" height="200"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Filters and Promotion Button -->
            <div class="row mb-4">
                <div class="col-md-3 mb-2">
                    <select class="form-select" id="filterBoard">
                        <option value="">All Boards</option>
                    </select>
                </div>
                <div class="col-md-3 mb-2">
                    <select class="form-select" id="filterClass" disabled>
                        <option value="">Select Board First</option>
                    </select>
                </div>
                <div class="col-md-4 mb-2">
                    <input type="text" class="form-control" id="searchStudent" placeholder="Search by name or ID...">
                </div>
                <div class="col-md-2 mb-2">
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" id="refreshStudents" title="Refresh">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="btn btn-success" id="exportCSV" title="Export to CSV">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-warning" id="promoteBtn" title="Promote All Students">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Student Table -->
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Student</th>
                            <th>Board/Class</th>
                            <th>Mobile</th>
                            <th>Parent Mobile</th>
                            <th>Joining Date</th>
                            <th>Fee Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentTableBody">
                        <tr>
                            <td colspan="8" class="text-center py-5">
                                <i class="fas fa-spinner fa-spin fa-3x"></i>
                                <p class="mt-2">Loading students...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        tabContent.appendChild(studentPane);
        console.log("✅ Student content created");
        return true;
    }
    
    // ============================================
    // CREATE PROMOTION MODAL
    // ============================================
    function createPromotionModal() {
        if (document.getElementById('promotionModal')) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'promotionModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">
                            <i class="fas fa-arrow-up me-2"></i>Promote All Students
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Select Promotion Date</label>
                            <input type="date" class="form-control" id="promotionDate" required>
                            <small class="text-muted">Students joining before this date will be promoted</small>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Select New Class</label>
                            <select class="form-select" id="promotionClass" required>
                                <option value="">Select Class</option>
                                <option value="Nursery">Nursery</option>
                                <option value="LKG">LKG</option>
                                <option value="UKG">UKG</option>
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
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <span id="promotionCount">0 students</span> will be promoted
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-warning" id="confirmPromotionBtn">
                            <i class="fas fa-arrow-up me-2"></i>Promote Students
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ============================================
    // CREATE STUDENT DETAILS MODAL
    // ============================================
    function createStudentDetailsModal() {
        if (document.getElementById('studentDetailsModal')) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'studentDetailsModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-graduate me-2"></i>Student Details
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4 text-center mb-3">
                                <div class="border p-2 rounded">
                                    <img id="detailStudentPhoto" src="" class="img-fluid rounded" style="max-height: 150px;">
                                </div>
                            </div>
                            <div class="col-md-8">
                                <table class="table table-sm">
                                    <tr><th>Name:</th><td id="detailStudentName"></td></tr>
                                    <tr><th>Student ID:</th><td id="detailStudentId"></td></tr>
                                    <tr><th>Board:</th><td id="detailBoard"></td></tr>
                                    <tr><th>Class:</th><td id="detailClass"></td></tr>
                                    <tr><th>Mobile:</th><td id="detailMobile"></td></tr>
                                    <tr><th>Father's Mobile:</th><td id="detailFatherMobile"></td></tr>
                                    <tr><th>Joining Date:</th><td id="detailJoiningDate"></td></tr>
                                </table>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h6 class="mb-3">Fee Details (From Joining till March 2026)</h6>
                        
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <div class="card bg-info text-white p-2">
                                    <h6>Monthly</h6>
                                    <h5 id="detailMonthlyFee">₹1000</h5>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card bg-success text-white p-2">
                                    <h6>Total</h6>
                                    <h5 id="detailTotalFee">₹0</h5>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card bg-primary text-white p-2">
                                    <h6>Paid</h6>
                                    <h5 id="detailPaidFee">₹0</h5>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card bg-danger text-white p-2">
                                    <h6>Due</h6>
                                    <h5 id="detailDueFee">₹0</h5>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card bg-warning p-2">
                                    <h6>Total Months</h6>
                                    <h5 id="detailTotalMonths">0</h5>
                                </div>
                            </div>
                        </div>
                        
                        <h6 class="mt-3">Month-wise Fee Status</h6>
                        <div class="table-responsive" style="max-height: 300px;">
                            <table class="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Fee</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="monthlyFeeTable"></tbody>
                            </table>
                        </div>
                        
                        <hr>
                        
                        <h6>Update Fees</h6>
                        <div class="row">
                            <div class="col-md-8">
                                <input type="number" class="form-control" id="updateFeeAmount" placeholder="Enter new paid amount">
                            </div>
                            <div class="col-md-4">
                                <button class="btn btn-primary w-100" id="saveFeeUpdateBtn">
                                    <i class="fas fa-save me-2"></i>Save to Database
                                </button>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h6>Edit Student Details</h6>
                        <button class="btn btn-warning w-100" id="editStudentBtn">
                            <i class="fas fa-edit me-2"></i>Edit Student Details
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
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
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>Edit Student Details
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="editStudentId">
                        
                        <div class="row">
                            <div class="col-md-4 text-center mb-3">
                                <div class="border p-2 rounded">
                                    <img id="editStudentPhoto" src="" class="img-fluid rounded" style="max-height: 100px;">
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label>First Name</label>
                                <input type="text" class="form-control" id="editFirstName">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label>Middle Name</label>
                                <input type="text" class="form-control" id="editMiddleName">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label>Last Name</label>
                                <input type="text" class="form-control" id="editLastName">
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label>Mobile</label>
                                <input type="text" class="form-control" id="editMobile" maxlength="10">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label>Father's Mobile</label>
                                <input type="text" class="form-control" id="editFatherMobile" maxlength="10">
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label>Board</label>
                                <select class="form-select" id="editBoard">
                                    <option value="cbse">CBSE</option>
                                    <option value="icse">ICSE</option>
                                    <option value="state">State Board</option>
                                    <option value="nios">NIOS</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label>Class</label>
                                <input type="text" class="form-control" id="editClass">
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label>Current Address</label>
                            <textarea class="form-control" id="editCurrentAddress" rows="2"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label>Permanent Address</label>
                            <textarea class="form-control" id="editPermanentAddress" rows="2"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
    // FEE CALCULATION (Only till March 2026)
    // ============================================
    function calculateMonthsUntilMarch2026(joiningDate) {
        const join = new Date(joiningDate);
        const endDate = new Date(2026, 2, 31); // March 2026
        
        // If joining after March 2026, no months
        if (join > endDate) return 0;
        
        const years = endDate.getFullYear() - join.getFullYear();
        const months = endDate.getMonth() - join.getMonth();
        let totalMonths = (years * 12) + months + 1; // +1 to include current month
        
        return Math.max(0, totalMonths);
    }
    
    function calculateMonthlyFee(student) {
        const baseFee = 1000;
        if (!student || !student.education) return baseFee;
        
        const className = student.education.class || '';
        if (className.includes('11') || className.includes('12')) {
            return baseFee + 500;
        }
        if (className.includes('BA') || className.includes('BSc') || 
            className.includes('BCom') || className.includes('BTech')) {
            return baseFee + 1000;
        }
        return baseFee;
    }
    
    function calculateFeeDetails(student) {
        if (!student) return { totalMonths: 0, monthlyFee: 0, totalFee: 0, paidFee: 0, dueFee: 0, months: [] };
        
        const totalMonths = calculateMonthsUntilMarch2026(student.joiningDate);
        const monthlyFee = calculateMonthlyFee(student);
        const totalFee = totalMonths * monthlyFee;
        const paidFee = student.fees || 0;
        const dueFee = Math.max(0, totalFee - paidFee);
        
        const months = [];
        const joinDate = new Date(student.joiningDate);
        const endDate = new Date(2026, 2, 31);
        
        for (let i = 0; i < totalMonths; i++) {
            const monthDate = new Date(joinDate);
            monthDate.setMonth(joinDate.getMonth() + i);
            
            // Stop if month is after March 2026
            if (monthDate > endDate) break;
            
            const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            const isPaid = paidFee >= (i + 1) * monthlyFee;
            
            months.push({
                name: monthName,
                fee: monthlyFee,
                paid: isPaid
            });
        }
        
        return { totalMonths, monthlyFee, totalFee, paidFee, dueFee, months };
    }
    
    // ============================================
    // FETCH ALL STUDENTS FROM DATABASE
    // ============================================
    async function fetchAllStudents() {
        console.log("Fetching students from database...");
        
        try {
            const response = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            allStudents = result.data || [];
            filteredStudents = [...allStudents];
            
            populateBoardFilter();
            renderStudentTable();
            updateDashboard();
            renderFeeChart();
            
            showToast(`Loaded ${allStudents.length} students from database`, 'success');
            
        } catch (err) {
            console.error('Fetch error:', err);
            const tbody = document.getElementById('studentTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr><td colspan="8" class="text-center py-5 text-danger">
                        <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                        <p>Error: ${err.message}</p>
                        <button class="btn btn-sm btn-primary" onclick="location.reload()">Refresh</button>
                    </td></tr>
                `;
            }
        }
    }
    
    // ============================================
    // POPULATE BOARD FILTER
    // ============================================
    function populateBoardFilter() {
        const boards = [...new Set(allStudents.map(s => s.education?.board).filter(b => b))];
        const boardSelect = document.getElementById('filterBoard');
        if (!boardSelect) return;
        
        boardSelect.innerHTML = '<option value="">All Boards</option>';
        boards.forEach(board => {
            boardSelect.innerHTML += `<option value="${board}">${board.toUpperCase()}</option>`;
        });
    }
    
    // ============================================
    // POPULATE CLASS FILTER
    // ============================================
    function populateClassFilter(board) {
        const classSelect = document.getElementById('filterClass');
        if (!classSelect) return;
        
        classSelect.innerHTML = '<option value="">All Classes</option>';
        classSelect.disabled = !board;
        
        if (!board) return;
        
        const classes = [...new Set(allStudents
            .filter(s => s.education?.board === board)
            .map(s => s.education?.class)
            .filter(c => c)
        )].sort();
        
        classes.forEach(cls => {
            classSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
        });
    }
    
    // ============================================
    // FILTER STUDENTS
    // ============================================
    function filterStudents() {
        const board = document.getElementById('filterBoard')?.value || '';
        const classVal = document.getElementById('filterClass')?.value || '';
        const searchText = document.getElementById('searchStudent')?.value.toLowerCase() || '';
        
        filteredStudents = allStudents.filter(student => {
            if (board && student.education?.board !== board) return false;
            if (classVal && student.education?.class !== classVal) return false;
            
            if (searchText) {
                const fullName = `${student.studentName?.first || ''} ${student.studentName?.middle || ''} ${student.studentName?.last || ''}`.toLowerCase();
                return fullName.includes(searchText) || 
                       (student.studentId || '').includes(searchText) ||
                       (student.mobile || '').includes(searchText);
            }
            return true;
        });
        
        renderStudentTable();
        updateDashboard();
        renderFeeChart();
    }
    
    // ============================================
    // RENDER STUDENT TABLE
    // ============================================
    function renderStudentTable() {
        const tbody = document.getElementById('studentTableBody');
        if (!tbody) return;
        
        if (filteredStudents.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="8" class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No students found</p>
                </td></tr>
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
                    <td>
                        <strong>${student.studentName?.first || ''} ${student.studentName?.last || ''}</strong>
                        <br><small class="text-muted">ID: ${student.studentId || ''}</small>
                    </td>
                    <td>
                        ${(student.education?.board || '').toUpperCase()}<br>
                        <small>${student.education?.class || ''}</small>
                    </td>
                    <td>${student.mobile || ''}</td>
                    <td>${student.fatherMobile || ''}</td>
                    <td>${student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : ''}</td>
                    <td>
                        <span class="badge bg-info">Total: ₹${feeDetails.totalFee}</span><br>
                        <span class="badge bg-success">Paid: ₹${feeDetails.paidFee}</span><br>
                        <span class="badge bg-danger">Due: ₹${feeDetails.dueFee}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info text-white mb-1" onclick="window.viewStudent('${student.studentId}')">
                            <i class="fas fa-eye"></i>
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
    // UPDATE DASHBOARD
    // ============================================
    function updateDashboard() {
        const totalFees = filteredStudents.reduce((sum, s) => sum + (s.fees || 0), 0);
        const totalDue = filteredStudents.reduce((sum, s) => {
            const feeDetails = calculateFeeDetails(s);
            return sum + feeDetails.dueFee;
        }, 0);
        
        document.getElementById('totalStudents').textContent = filteredStudents.length;
        document.getElementById('totalCollected').textContent = `₹${totalFees}`;
        document.getElementById('totalDue').textContent = `₹${totalDue}`;
        document.getElementById('monthFee').textContent = `₹1000`;
    }
    
    // ============================================
    // RENDER FEE CHART
    // ============================================
    function renderFeeChart() {
        const canvas = document.getElementById('feeChart');
        if (!canvas) return;
        
        if (typeof Chart === 'undefined') {
            console.log("Chart.js not loaded");
            return;
        }
        
        const paidFees = filteredStudents.reduce((sum, s) => sum + (s.fees || 0), 0);
        const dueFees = filteredStudents.reduce((sum, s) => {
            const feeDetails = calculateFeeDetails(s);
            return sum + feeDetails.dueFee;
        }, 0);
        
        if (feeChart) feeChart.destroy();
        
        feeChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Paid Fees', 'Due Fees'],
                datasets: [{
                    data: [paidFees, dueFees],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
    
    // ============================================
    // VIEW STUDENT DETAILS
    // ============================================
    window.viewStudent = async function(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            const student = result.data;
            const feeDetails = calculateFeeDetails(student);
            
            currentStudentId = studentId;
            
            // Set photo
            const photoEl = document.getElementById('detailStudentPhoto');
            if (student.photo) {
                photoEl.src = student.photo;
                photoEl.style.display = 'block';
            } else {
                photoEl.src = '';
                photoEl.style.display = 'none';
            }
            
            // Set basic details
            document.getElementById('detailStudentName').textContent = 
                `${student.studentName?.first || ''} ${student.studentName?.middle || ''} ${student.studentName?.last || ''}`;
            document.getElementById('detailStudentId').textContent = student.studentId || '';
            document.getElementById('detailBoard').textContent = (student.education?.board || '').toUpperCase();
            document.getElementById('detailClass').textContent = student.education?.class || '';
            document.getElementById('detailMobile').textContent = student.mobile || '';
            document.getElementById('detailFatherMobile').textContent = student.fatherMobile || '';
            document.getElementById('detailJoiningDate').textContent = student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : '';
            
            // Set fee details
            document.getElementById('detailMonthlyFee').textContent = `₹${feeDetails.monthlyFee}`;
            document.getElementById('detailTotalFee').textContent = `₹${feeDetails.totalFee}`;
            document.getElementById('detailPaidFee').textContent = `₹${feeDetails.paidFee}`;
            document.getElementById('detailDueFee').textContent = `₹${feeDetails.dueFee}`;
            document.getElementById('detailTotalMonths').textContent = feeDetails.totalMonths;
            
            // Set month-wise table
            const monthTable = document.getElementById('monthlyFeeTable');
            monthTable.innerHTML = feeDetails.months.map(month => `
                <tr>
                    <td>${month.name}</td>
                    <td>₹${month.fee}</td>
                    <td><span class="badge ${month.paid ? 'bg-success' : 'bg-danger'}">${month.paid ? 'Paid' : 'Due'}</span></td>
                </tr>
            `).join('');
            
            // Set fee update field
            document.getElementById('updateFeeAmount').value = feeDetails.paidFee;
            
            const modal = new bootstrap.Modal(document.getElementById('studentDetailsModal'));
            modal.show();
            
        } catch (err) {
            console.error(err);
            showToast('Failed to load student details', 'error');
        }
    };
    
    // ============================================
    // UPDATE FEE IN DATABASE
    // ============================================
    window.updateStudentFee = async function() {
        if (!currentStudentId) return;
        
        const newFee = parseInt(document.getElementById('updateFeeAmount').value) || 0;
        
        if (newFee < 0) {
            showToast('Enter valid amount', 'warning');
            return;
        }
        
        const btn = document.getElementById('saveFeeUpdateBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        
        try {
            const response = await fetch(`/api/students/${currentStudentId}/fees`, {
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
                const student = allStudents.find(s => s.studentId === currentStudentId);
                if (student) student.fees = newFee;
                
                // Refresh views
                filterStudents();
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('studentDetailsModal')).hide();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Failed to update fee in database', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-2"></i>Save to Database';
        }
    };
    
    // ============================================
    // EDIT STUDENT - LOAD DATA
    // ============================================
    window.editStudent = async function() {
        if (!currentStudentId) return;
        
        try {
            const response = await fetch(`/api/students/${currentStudentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            const student = result.data;
            
            // Fill edit form
            document.getElementById('editStudentId').value = student.studentId;
            
            if (student.photo) {
                document.getElementById('editStudentPhoto').src = student.photo;
            }
            
            document.getElementById('editFirstName').value = student.studentName?.first || '';
            document.getElementById('editMiddleName').value = student.studentName?.middle || '';
            document.getElementById('editLastName').value = student.studentName?.last || '';
            document.getElementById('editMobile').value = student.mobile || '';
            document.getElementById('editFatherMobile').value = student.fatherMobile || '';
            document.getElementById('editBoard').value = student.education?.board || 'cbse';
            document.getElementById('editClass').value = student.education?.class || '';
            document.getElementById('editCurrentAddress').value = student.address?.current || '';
            document.getElementById('editPermanentAddress').value = student.address?.permanent || '';
            
            // Close details modal
            bootstrap.Modal.getInstance(document.getElementById('studentDetailsModal')).hide();
            
            // Open edit modal
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
        
        const updatedData = {
            studentName: {
                first: document.getElementById('editFirstName').value,
                middle: document.getElementById('editMiddleName').value,
                last: document.getElementById('editLastName').value
            },
            mobile: document.getElementById('editMobile').value,
            fatherMobile: document.getElementById('editFatherMobile').value,
            education: {
                board: document.getElementById('editBoard').value,
                class: document.getElementById('editClass').value
            },
            address: {
                current: document.getElementById('editCurrentAddress').value,
                permanent: document.getElementById('editPermanentAddress').value
            }
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
                await fetchAllStudents();
                
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
        if (!confirm('Delete this student from database? This cannot be undone!')) return;
        
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Student deleted from database');
                allStudents = allStudents.filter(s => s.studentId !== studentId);
                filterStudents();
                updateDashboard();
                renderFeeChart();
            } else {
                showToast(result.message || 'Delete failed', 'error');
            }
        } catch (err) {
            showToast('Failed to delete student from database', 'error');
        }
    };
    
    // ============================================
    // EXPORT TO CSV
    // ============================================
    window.exportToCSV = function() {
        const headers = ['ID', 'Name', 'Mobile', 'Board', 'Class', 'Joining Date', 'Total Fee', 'Paid', 'Due'];
        const rows = [headers];
        
        filteredStudents.forEach(s => {
            const fee = calculateFeeDetails(s);
            rows.push([
                s.studentId || '',
                `${s.studentName?.first || ''} ${s.studentName?.last || ''}`,
                s.mobile || '',
                (s.education?.board || '').toUpperCase(),
                s.education?.class || '',
                s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '',
                fee.totalFee,
                fee.paidFee,
                fee.dueFee
            ]);
        });
        
        const csv = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast('Data exported');
    };
    
    // ============================================
    // PROMOTE ALL STUDENTS
    // ============================================
    function showPromotionModal() {
        promotionDate = document.getElementById('promotionDate')?.value || '';
        promotionClass = document.getElementById('promotionClass')?.value || '';
        
        const eligibleStudents = allStudents.filter(s => {
            if (!s.joiningDate) return false;
            const joinDate = new Date(s.joiningDate);
            const selectedDate = new Date(promotionDate);
            return joinDate < selectedDate;
        });
        
        document.getElementById('promotionCount').textContent = `${eligibleStudents.length} students`;
    }
    
    window.promoteStudents = async function() {
        const date = document.getElementById('promotionDate').value;
        const newClass = document.getElementById('promotionClass').value;
        
        if (!date || !newClass) {
            showToast('Please select date and class', 'warning');
            return;
        }
        
        const eligibleStudents = allStudents.filter(s => {
            if (!s.joiningDate) return false;
            const joinDate = new Date(s.joiningDate);
            const selectedDate = new Date(date);
            return joinDate < selectedDate;
        });
        
        if (eligibleStudents.length === 0) {
            showToast('No students eligible for promotion', 'warning');
            return;
        }
        
        if (!confirm(`Promote ${eligibleStudents.length} students to ${newClass}?`)) return;
        
        const btn = document.getElementById('confirmPromotionBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        
        try {
            let successCount = 0;
            
            for (const student of eligibleStudents) {
                // Update to new class in database
                const response = await fetch(`/api/students/${student.studentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        education: {
                            board: student.education.board,
                            class: newClass
                        }
                    })
                });
                
                if (response.ok) successCount++;
            }
            
            showToast(`${successCount} students promoted successfully in database`);
            
            // Refresh data
            await fetchAllStudents();
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('promotionModal')).hide();
            
        } catch (err) {
            showToast('Promotion failed in database', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-arrow-up me-2"></i>Promote Students';
        }
    };
    
    // ============================================
    // INITIALIZE EVENT LISTENERS
    // ============================================
    function initEventListeners() {
        // Filter listeners
        document.getElementById('filterBoard')?.addEventListener('change', function(e) {
            boardFilter = e.target.value;
            populateClassFilter(boardFilter);
            filterStudents();
        });
        
        document.getElementById('filterClass')?.addEventListener('change', function(e) {
            classFilter = e.target.value;
            filterStudents();
        });
        
        document.getElementById('searchStudent')?.addEventListener('input', filterStudents);
        
        // Button listeners
        document.getElementById('refreshStudents')?.addEventListener('click', fetchAllStudents);
        document.getElementById('exportCSV')?.addEventListener('click', window.exportToCSV);
        
        // Promotion button
        document.getElementById('promoteBtn')?.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('promotionModal'));
            modal.show();
        });
        
        // Promotion modal listeners
        document.getElementById('promotionDate')?.addEventListener('change', showPromotionModal);
        document.getElementById('promotionClass')?.addEventListener('change', showPromotionModal);
        document.getElementById('confirmPromotionBtn')?.addEventListener('click', window.promoteStudents);
        
        // Fee update listener
        document.getElementById('saveFeeUpdateBtn')?.addEventListener('click', window.updateStudentFee);
        
        // Edit student listener
        document.getElementById('editStudentBtn')?.addEventListener('click', window.editStudent);
        
        // Save edit listener
        document.getElementById('saveEditBtn')?.addEventListener('click', window.saveEditedStudent);
    }
    
    // ============================================
    // INITIALIZE EVERYTHING
    // ============================================
    function init() {
        console.log("🚀 Initializing Student Management with Database Sync...");
        
        addStudentTab();
        createStudentTabContent();
        createStudentDetailsModal();
        createEditStudentModal();
        createPromotionModal();
        
        setTimeout(() => {
            initEventListeners();
            fetchAllStudents();
        }, 100);
    }
    
    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
