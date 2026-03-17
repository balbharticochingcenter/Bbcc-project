// ============================================
// COMPLETE STUDENT MANAGEMENT SYSTEM
// ============================================

(function() {
    // Check if we're on admin page
    if (!document.getElementById('students-tab')) return;
    
    // ============================================
    // CREATE ALL HTML ELEMENTS PROGRAMMATICALLY
    // ============================================
    
    // Create Student Tab Content
    function createStudentTabContent() {
        // Check if tab already exists
        if (document.getElementById('students-tab-content')) return;
        
        // Get the tab content container
        const tabContent = document.querySelector('.tab-content');
        if (!tabContent) return;
        
        // Create student tab pane
        const studentPane = document.createElement('div');
        studentPane.className = 'tab-pane fade';
        studentPane.id = 'students';
        studentPane.setAttribute('role', 'tabpanel');
        
        // Add all HTML content
        studentPane.innerHTML = `
            <!-- Dashboard Cards -->
            <div class="row mb-4">
                <div class="col-md-4 mb-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6>Total Students</h6>
                            <h2 id="totalStudents">0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6>Total Collected</h6>
                            <h2 id="totalCollected">₹0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h6>Total Due</h6>
                            <h2 id="totalDue">₹0</h2>
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
            
            <!-- Filters -->
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
                        <button class="btn btn-primary" id="refreshStudents">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="btn btn-success" id="exportCSV">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Student Table -->
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Mobile</th>
                            <th>Board</th>
                            <th>Class</th>
                            <th>Total Fee</th>
                            <th>Paid</th>
                            <th>Status</th>
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
    }
    
    // Create Student Details Modal
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
                        <ul class="nav nav-tabs mb-3" id="detailsTab" role="tablist">
                            <li class="nav-item">
                                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#personal">Personal</button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#feeTab">Fee Details</button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#parentsTab">Parents</button>
                            </li>
                        </ul>
                        
                        <div class="tab-content">
                            <div class="tab-pane fade show active" id="personal">
                                <table class="table">
                                    <tr><th>Name:</th><td id="modalStudentName"></td></tr>
                                    <tr><th>Student ID:</th><td id="modalStudentId"></td></tr>
                                    <tr><th>Mobile:</th><td id="modalStudentMobile"></td></tr>
                                    <tr><th>Aadhar:</th><td id="modalStudentAadhar"></td></tr>
                                    <tr><th>Joining Date:</th><td id="modalJoiningDate"></td></tr>
                                    <tr><th>Total Months:</th><td id="modalTotalMonths"></td></tr>
                                    <tr><th>Board:</th><td id="modalBoard"></td></tr>
                                    <tr><th>Class:</th><td id="modalClass"></td></tr>
                                    <tr><th>Current Address:</th><td id="modalCurrentAddress"></td></tr>
                                    <tr><th>Permanent Address:</th><td id="modalPermanentAddress"></td></tr>
                                </table>
                            </div>
                            
                            <div class="tab-pane fade" id="feeTab">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <div class="card bg-info text-white">
                                            <div class="card-body">
                                                <h6>Monthly Fee</h6>
                                                <h3 id="modalMonthlyFee"></h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card bg-success text-white">
                                            <div class="card-body">
                                                <h6>Total Fee</h6>
                                                <h3 id="modalTotalFee"></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <div class="card bg-primary text-white">
                                            <div class="card-body">
                                                <h6>Paid Fee</h6>
                                                <h3 id="modalPaidFee"></h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card bg-danger text-white">
                                            <div class="card-body">
                                                <h6>Due Fee</h6>
                                                <h3 id="modalDueFee"></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <h6 class="mt-3">Month-wise Fee Status</h6>
                                <div class="table-responsive" style="max-height: 300px;">
                                    <table class="table table-sm">
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
                            </div>
                            
                            <div class="tab-pane fade" id="parentsTab">
                                <table class="table">
                                    <tr><th>Father's Name:</th><td id="modalFatherName"></td></tr>
                                    <tr><th>Father's Mobile:</th><td id="modalFatherMobile"></td></tr>
                                    <tr><th>Mother's Name:</th><td id="modalMotherName"></td></tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Create Edit Fees Modal
    function createEditFeesModal() {
        if (document.getElementById('editFeesModal')) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'editFeesModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>Update Fees
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="editStudentId">
                        
                        <div class="mb-3">
                            <label class="form-label">Student Name</label>
                            <input type="text" class="form-control" id="editStudentName" readonly>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Current Fees Paid</label>
                            <input type="number" class="form-control" id="editCurrentFees" readonly>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">New Fees Amount</label>
                            <input type="number" class="form-control" id="editNewFees" placeholder="Enter new fee amount">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="updateFeesBtn">
                            <i class="fas fa-save me-2"></i>Update Fees
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ============================================
    // GLOBAL VARIABLES
    // ============================================
    let allStudents = [];
    let filteredStudents = [];
    let feeChart = null;
    let boardFilter = '';
    let classFilter = '';
    const token = localStorage.getItem('token');
    
    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
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
    // FEE CALCULATION
    // ============================================
    function calculateMonths(joiningDate) {
        const join = new Date(joiningDate);
        const current = new Date();
        const years = current.getFullYear() - join.getFullYear();
        const months = current.getMonth() - join.getMonth();
        return (years * 12) + months;
    }
    
    function calculateMonthlyFee(student) {
        const baseFee = 1000;
        if (student.education.class.includes('11') || student.education.class.includes('12')) {
            return baseFee + 500;
        }
        if (student.education.class.includes('BA') || student.education.class.includes('BSc') || 
            student.education.class.includes('BCom') || student.education.class.includes('BTech')) {
            return baseFee + 1000;
        }
        return baseFee;
    }
    
    function calculateFeeDetails(student) {
        const totalMonths = Math.max(1, calculateMonths(student.joiningDate));
        const monthlyFee = calculateMonthlyFee(student);
        const totalFee = totalMonths * monthlyFee;
        const paidFee = student.fees || 0;
        const dueFee = Math.max(0, totalFee - paidFee);
        
        const months = [];
        const joinDate = new Date(student.joiningDate);
        
        for (let i = 0; i < totalMonths; i++) {
            const monthDate = new Date(joinDate);
            monthDate.setMonth(joinDate.getMonth() + i);
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
    // FETCH ALL STUDENTS
    // ============================================
    async function fetchAllStudents() {
        try {
            const response = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to fetch');
            
            const result = await response.json();
            allStudents = result.data || [];
            filteredStudents = [...allStudents];
            
            populateBoardFilter();
            renderStudentTable();
            updateDashboard();
            renderFeeChart();
            
        } catch (err) {
            console.error('Fetch error:', err);
            document.getElementById('studentTableBody').innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                    <p>Failed to load students. Please refresh.</p>
                </td></tr>
            `;
        }
    }
    
    // ============================================
    // POPULATE BOARD FILTER
    // ============================================
    function populateBoardFilter() {
        const boards = [...new Set(allStudents.map(s => s.education.board))];
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
            .filter(s => s.education.board === board)
            .map(s => s.education.class)
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
            if (board && student.education.board !== board) return false;
            if (classVal && student.education.class !== classVal) return false;
            
            if (searchText) {
                const fullName = `${student.studentName.first} ${student.studentName.middle} ${student.studentName.last}`.toLowerCase();
                return fullName.includes(searchText) || 
                       student.studentId.includes(searchText) ||
                       student.mobile.includes(searchText);
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
            const status = feeDetails.dueFee > 0 ? 
                `<span class="badge bg-danger">Due: ₹${feeDetails.dueFee}</span>` : 
                `<span class="badge bg-success">Paid</span>`;
            
            return `
                <tr>
                    <td>
                        <strong>${student.studentName.first} ${student.studentName.last}</strong>
                        <br><small class="text-muted">ID: ${student.studentId}</small>
                    </td>
                    <td>${student.mobile}</td>
                    <td>${student.education.board.toUpperCase()}</td>
                    <td>${student.education.class}</td>
                    <td>₹${feeDetails.totalFee}</td>
                    <td>₹${feeDetails.paidFee}</td>
                    <td>${status}</td>
                    <td>
                        <button class="btn btn-sm btn-info text-white" onclick="viewStudent('${student.studentId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editStudentFees('${student.studentId}')">
                            <i class="fas fa-rupee-sign"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.studentId}')">
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
        
        const totalEl = document.getElementById('totalStudents');
        const collectedEl = document.getElementById('totalCollected');
        const dueEl = document.getElementById('totalDue');
        
        if (totalEl) totalEl.textContent = filteredStudents.length;
        if (collectedEl) collectedEl.textContent = `₹${totalFees}`;
        if (dueEl) dueEl.textContent = `₹${totalDue}`;
    }
    
    // ============================================
    // RENDER FEE CHART
    // ============================================
    function renderFeeChart() {
        const canvas = document.getElementById('feeChart');
        if (!canvas || typeof Chart === 'undefined') return;
        
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
            
            document.getElementById('modalStudentName').textContent = 
                `${student.studentName.first} ${student.studentName.middle} ${student.studentName.last}`;
            document.getElementById('modalStudentId').textContent = student.studentId;
            document.getElementById('modalStudentMobile').textContent = student.mobile;
            document.getElementById('modalStudentAadhar').textContent = student.aadharNumber;
            document.getElementById('modalJoiningDate').textContent = new Date(student.joiningDate).toLocaleDateString();
            document.getElementById('modalTotalMonths').textContent = feeDetails.totalMonths;
            document.getElementById('modalBoard').textContent = student.education.board.toUpperCase();
            document.getElementById('modalClass').textContent = student.education.class;
            document.getElementById('modalFatherName').textContent = 
                `${student.fatherName.first} ${student.fatherName.middle} ${student.fatherName.last}`;
            document.getElementById('modalFatherMobile').textContent = student.fatherMobile;
            document.getElementById('modalMotherName').textContent = 
                student.motherName.first ? `${student.motherName.first} ${student.motherName.last}` : 'N/A';
            document.getElementById('modalCurrentAddress').textContent = student.address.current;
            document.getElementById('modalPermanentAddress').textContent = student.address.permanent;
            
            document.getElementById('modalMonthlyFee').textContent = `₹${feeDetails.monthlyFee}`;
            document.getElementById('modalTotalFee').textContent = `₹${feeDetails.totalFee}`;
            document.getElementById('modalPaidFee').textContent = `₹${feeDetails.paidFee}`;
            document.getElementById('modalDueFee').textContent = `₹${feeDetails.dueFee}`;
            
            const monthTable = document.getElementById('monthlyFeeTable');
            monthTable.innerHTML = feeDetails.months.map(month => `
                <tr>
                    <td>${month.name}</td>
                    <td>₹${month.fee}</td>
                    <td><span class="badge ${month.paid ? 'bg-success' : 'bg-danger'}">${month.paid ? 'Paid' : 'Due'}</span></td>
                </tr>
            `).join('');
            
            const modal = new bootstrap.Modal(document.getElementById('studentDetailsModal'));
            modal.show();
            
        } catch (err) {
            showToast('Failed to load student details', 'error');
        }
    };
    
    // ============================================
    // EDIT STUDENT FEES
    // ============================================
    window.editStudentFees = function(studentId) {
        const student = allStudents.find(s => s.studentId === studentId);
        if (!student) return;
        
        document.getElementById('editStudentId').value = studentId;
        document.getElementById('editStudentName').value = 
            `${student.studentName.first} ${student.studentName.last}`;
        document.getElementById('editCurrentFees').value = student.fees || 0;
        document.getElementById('editNewFees').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('editFeesModal'));
        modal.show();
    };
    
    // ============================================
    // UPDATE FEES
    // ============================================
    window.updateFees = async function() {
        const studentId = document.getElementById('editStudentId').value;
        const newFees = parseInt(document.getElementById('editNewFees').value) || 0;
        
        if (newFees < 0) {
            showToast('Enter valid amount', 'warning');
            return;
        }
        
        const btn = document.getElementById('updateFeesBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        
        try {
            const response = await fetch(`/api/students/${studentId}/fees`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fees: newFees })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Fees updated successfully');
                
                const student = allStudents.find(s => s.studentId === studentId);
                if (student) student.fees = newFees;
                
                filterStudents();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('editFeesModal'));
                if (modal) modal.hide();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Failed to update fees', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-2"></i>Update Fees';
        }
    };
    
    // ============================================
    // DELETE STUDENT
    // ============================================
    window.deleteStudent = async function(studentId) {
        if (!confirm('Delete this student? This cannot be undone!')) return;
        
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Student deleted');
                allStudents = allStudents.filter(s => s.studentId !== studentId);
                filterStudents();
                updateDashboard();
                renderFeeChart();
            } else {
                showToast(result.message || 'Delete failed', 'error');
            }
        } catch (err) {
            showToast('Failed to delete student', 'error');
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
                s.studentId,
                `${s.studentName.first} ${s.studentName.last}`,
                s.mobile,
                s.education.board.toUpperCase(),
                s.education.class,
                new Date(s.joiningDate).toLocaleDateString(),
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
    // ADD STUDENT TAB TO NAVIGATION
    // ============================================
    function addStudentTab() {
        const tabList = document.getElementById('myTab');
        if (!tabList) return;
        
        // Check if tab already exists
        if (document.getElementById('students-tab')) return;
        
        const studentTab = document.createElement('li');
        studentTab.className = 'nav-item';
        studentTab.setAttribute('role', 'presentation');
        studentTab.innerHTML = `
            <button class="nav-link" id="students-tab" data-bs-toggle="tab" data-bs-target="#students" type="button" role="tab">
                <i class="fas fa-users me-2"></i>Students
            </button>
        `;
        
        tabList.appendChild(studentTab);
    }
    
    // ============================================
    // INITIALIZE EVENT LISTENERS
    // ============================================
    function initEventListeners() {
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
        
        document.getElementById('refreshStudents')?.addEventListener('click', function() {
            fetchAllStudents();
            showToast('Refreshing...', 'info');
        });
        
        document.getElementById('exportCSV')?.addEventListener('click', window.exportToCSV);
        
        document.getElementById('updateFeesBtn')?.addEventListener('click', window.updateFees);
        
        // Clear new fees input when modal is hidden
        document.getElementById('editFeesModal')?.addEventListener('hidden.bs.modal', function() {
            document.getElementById('editNewFees').value = '';
        });
    }
    
    // ============================================
    // LOAD CHART.JS DYNAMICALLY
    // ============================================
    function loadChartJS() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // ============================================
    // INITIALIZE EVERYTHING
    // ============================================
    async function init() {
        // Add student tab to navigation
        addStudentTab();
        
        // Create all HTML elements
        createStudentTabContent();
        createStudentDetailsModal();
        createEditFeesModal();
        
        // Load Chart.js
        try {
            await loadChartJS();
        } catch (err) {
            console.log('Chart.js loading failed, using fallback');
        }
        
        // Initialize event listeners
        initEventListeners();
        
        // Load student data
        fetchAllStudents();
    }
    
    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
