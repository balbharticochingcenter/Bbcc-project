// ============================================
// TEACHER-MANAGEMENT.JS - COMPLETE VERSION
// FOR COACHING CENTER
// ============================================

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const API_BASE_URL = window.location.origin + '/api';
    let teachersData = [];
    let leftTeachersData = [];
    let currentViewTeacher = null;
    let currentEditTeacherId = null;
    let charts = {};

    // ========== CONSTANTS ==========
    const subjectsList = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
        'Hindi', 'Sanskrit', 'Computer Science', 'Social Science', 
        'Reasoning', 'Aptitude', 'General Knowledge'
    ];

    const classesList = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];
    const boardsList = ['CBSE', 'ICSE', 'UP Board', 'Bihar Board', 'Other'];
    const genders = ['Male', 'Female', 'Other'];
    const paymentModes = ['cash', 'bank', 'upi'];

    const DEFAULT_PHOTO = 'https://placehold.co/100x100/28a745/white?text=👨‍🏫';

    // ========== HELPER FUNCTIONS ==========
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
            justify-content: space-between; align-items: center; font-family: Arial, sans-serif;
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

    // ========== STYLES ==========
    const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            min-height: 100vh;
        }
        .tms-wrapper {
            max-width: 1400px; margin: 0 auto; background: white;
            border-radius: 25px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden; margin: 20px;
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
            display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
        .form-group label .required { color: #dc3545; }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%; padding: 10px; border: 2px solid #e0e0e0;
            border-radius: 8px; font-size: 0.9rem;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none; border-color: #28a745;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .form-row-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; }
        
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
        
        @media (max-width: 768px) {
            .form-row, .form-row-3, .form-row-4 { grid-template-columns: 1fr; }
            .teachers-grid { grid-template-columns: 1fr; }
            .filter-bar { flex-direction: column; }
        }
    `;

    // ========== HTML TEMPLATE ==========
    const htmlTemplate = `
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
                <!-- TEACHERS TAB -->
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
                
                <!-- NEW TEACHER TAB -->
                <div class="tab-pane" data-pane="new-teacher">
                    <h3>📝 <span id="formTitle">Register New Teacher</span></h3>
                    
                    <form id="teacherForm">
                        <!-- Documents Section -->
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
                        
                        <!-- Personal Information -->
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
                        
                        <!-- Address -->
                        <div class="section-title">🏠 Address</div>
                        <div class="form-group"><label>Current Address *</label><textarea id="currentAddress" rows="2" required placeholder="House number, Street, Landmark"></textarea></div>
                        <div class="form-group"><label>Permanent Address</label><textarea id="permanentAddress" rows="2" placeholder="Leave blank if same as current address"></textarea></div>
                        
                        <!-- Professional -->
                        <div class="section-title">📚 Professional Information</div>
                        <div class="form-row">
                            <div class="form-group"><label>Qualification *</label><input type="text" id="qualificationName" required placeholder="e.g., M.Sc, B.Ed"></div>
                            <div class="form-group"><label>Experience (Years) *</label><input type="number" id="experience" required min="0" step="1"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Joining Date *</label><input type="date" id="joiningDate" required></div>
                            <div class="form-group"><label>Monthly Salary (₹) *</label><input type="number" id="defaultSalary" required min="0" step="1000"></div>
                        </div>
                        
                        <!-- Subjects (Multi-Select) -->
                        <div class="section-title">📖 Subjects (Select all that apply) *</div>
                        <div class="checkbox-group" id="subjectsGroup">
                            ${subjectsList.map(s => `<label><input type="checkbox" value="${s}"> ${s}</label>`).join('')}
                        </div>
                        
                        <!-- Classes (Multi-Select) -->
                        <div class="section-title">🏫 Classes (Select all that apply) *</div>
                        <div class="checkbox-group" id="classesGroup">
                            ${classesList.map(c => `<label><input type="checkbox" value="${c}"> ${c}</label>`).join('')}
                        </div>
                        
                        <!-- Boards (Multi-Select) -->
                        <div class="section-title">🎓 Boards (Select all that apply) *</div>
                        <div class="checkbox-group" id="boardsGroup">
                            ${boardsList.map(b => `<label><input type="checkbox" value="${b}"> ${b}</label>`).join('')}
                        </div>
                        
                        <!-- Bank Details (Optional) -->
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
                
                <!-- LEFT TEACHERS TAB -->
                <div class="tab-pane" data-pane="left-teachers">
                    <div class="filter-bar">
                        <input type="text" id="searchLeft" placeholder="🔍 Search by name or ID...">
                    </div>
                    <div id="leftTeachersGrid" class="teachers-grid"></div>
                </div>
                
                <!-- NOTICES TAB -->
                <div class="tab-pane" data-pane="notices">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" id="sendNoticeBtn">➕ Send Notice to Teacher</button>
                    </div>
                    <div id="noticesList" class="notices-container"></div>
                </div>
            </div>
        </div>
        
        <!-- TEACHER DASHBOARD MODAL -->
        <div id="dashboardModal" class="modal">
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header">
                    <h3 id="dashboardTitle">Teacher Dashboard</h3>
                    <button class="close-modal" id="closeDashboardModal">×</button>
                </div>
                <div class="modal-body" id="dashboardBody">
                    <div style="text-align: center; padding: 50px;">Loading...</div>
                </div>
                <div class="modal-footer" id="dashboardFooter"></div>
            </div>
        </div>
        
        <!-- ATTENDANCE MODAL -->
        <div id="attendanceModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>📅 Mark Attendance</h3>
                    <button class="close-modal" id="closeAttendanceModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group"><label>Date *</label><input type="date" id="attendanceDate" class="form-control" required></div>
                    <div class="form-group"><label>Status *</label><select id="attendanceStatus" class="form-control">
                        <option value="present">✅ Present</option>
                        <option value="absent">❌ Absent</option>
                        <option value="holiday">🎉 Holiday</option>
                        <option value="leave">🏖️ Leave</option>
                    </select></div>
                    <div class="form-group"><label>Check In Time</label><input type="time" id="checkInTime" class="form-control"></div>
                    <div class="form-group"><label>Check Out Time</label><input type="time" id="checkOutTime" class="form-control"></div>
                    <div class="form-group">
                        <label>Live Photo (Optional)</label>
                        <input type="hidden" id="attendancePhoto">
                        <img id="attendancePhotoPreview" class="image-preview" style="display:none;">
                        <div class="image-actions">
                            <button type="button" class="btn btn-primary btn-sm" id="captureAttendancePhotoBtn">📷 Capture</button>
                            <button type="button" class="btn btn-secondary btn-sm" id="clearAttendancePhotoBtn">🗑️ Clear</button>
                        </div>
                    </div>
                    <div class="form-group"><label>Remarks</label><textarea id="attendanceRemarks" class="form-control" rows="2"></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelAttendanceBtn">Cancel</button>
                    <button class="btn btn-primary" id="saveAttendanceBtn">💾 Save Attendance</button>
                </div>
            </div>
        </div>
        
        <!-- SALARY MODAL -->
        <div id="salaryModal" class="modal">
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h3>💰 Salary Management</h3>
                    <button class="close-modal" id="closeSalaryModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group"><label>Select Month *</label><select id="salaryMonth" class="form-control"></select></div>
                    <div class="form-group"><label>Custom Salary Amount (Optional)</label><input type="number" id="customSalaryAmount" class="form-control" placeholder="Leave empty for default"></div>
                    <div class="form-group"><button class="btn btn-info" id="generateSalaryBtn">📊 Generate Salary</button></div>
                    <div id="salaryResult" style="background:#f8f9fa; padding:15px; border-radius:8px; margin-top:15px; display:none;"></div>
                    <hr>
                    <div class="form-group"><label>Pay Amount (₹)</label><input type="number" id="payAmount" class="form-control" placeholder="Amount to pay"></div>
                    <div class="form-group"><label>Payment Mode</label><select id="paymentMode" class="form-control"><option value="">Select</option>${paymentModes.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Remarks</label><textarea id="paymentRemarks" class="form-control" rows="2"></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelSalaryBtn">Cancel</button>
                    <button class="btn btn-success" id="paySalaryBtn">💰 Pay Salary</button>
                </div>
            </div>
        </div>
        
        <!-- NOTICE SEND MODAL -->
        <div id="noticeModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>📢 Send Notice</h3>
                    <button class="close-modal" id="closeNoticeModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group"><label>To</label><select id="noticeTo" class="form-control"><option value="all">All Teachers</option></select></div>
                    <div class="form-group"><label>Title *</label><input type="text" id="noticeTitle" class="form-control" required></div>
                    <div class="form-group"><label>Message *</label><textarea id="noticeMessage" class="form-control" rows="4" required></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelNoticeBtn">Cancel</button>
                    <button class="btn btn-primary" id="sendNoticeConfirmBtn">📤 Send Notice</button>
                </div>
            </div>
        </div>
        
        <!-- DOCUMENT VIEWER MODAL -->
        <div id="documentViewerModal" class="modal">
            <div class="modal-content" style="max-width: 90vw;">
                <div class="modal-header">
                    <h3 id="docViewerTitle">Document Viewer</h3>
                    <button class="close-modal" id="closeDocViewer">×</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <img id="docViewerImage" src="" alt="Document" style="max-width: 100%; max-height: 70vh;">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="closeDocViewerBtn">Close</button>
                </div>
            </div>
        </div>
    `;

    // ========== MAIN APP CLASS ==========
    class TeacherManagementSystem {
        constructor() {
            this.token = localStorage.getItem('adminToken');
            if (!this.token) {
                window.location.href = '/login.html';
                return;
            }
            this.init();
        }

        async init() {
            this.injectStyles();
            this.injectHTML();
            this.attachEventListeners();
            await this.loadTeachers();
            await this.loadLeftTeachers();
            await this.loadNotices();
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
        }

        injectStyles() {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        injectHTML() {
            const appContainer = document.createElement('div');
            appContainer.id = 'tmsApp';
            appContainer.innerHTML = htmlTemplate;
            document.body.innerHTML = '';
            document.body.appendChild(appContainer);
        }

        attachEventListeners() {
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
            });
            
            document.getElementById('closeDashboardModal')?.addEventListener('click', () => closeModal('dashboardModal'));
            document.getElementById('closeAttendanceModal')?.addEventListener('click', () => closeModal('attendanceModal'));
            document.getElementById('closeSalaryModal')?.addEventListener('click', () => closeModal('salaryModal'));
            document.getElementById('closeNoticeModal')?.addEventListener('click', () => closeModal('noticeModal'));
            document.getElementById('cancelAttendanceBtn')?.addEventListener('click', () => closeModal('attendanceModal'));
            document.getElementById('cancelSalaryBtn')?.addEventListener('click', () => closeModal('salaryModal'));
            document.getElementById('cancelNoticeBtn')?.addEventListener('click', () => closeModal('noticeModal'));
            document.getElementById('closeDocViewer')?.addEventListener('click', () => closeModal('documentViewerModal'));
            document.getElementById('closeDocViewerBtn')?.addEventListener('click', () => closeModal('documentViewerModal'));
            
            document.getElementById('filterSubject')?.addEventListener('change', () => this.renderTeachersGrid());
            document.getElementById('filterClass')?.addEventListener('change', () => this.renderTeachersGrid());
            document.getElementById('filterBoard')?.addEventListener('change', () => this.renderTeachersGrid());
            document.getElementById('searchTeacher')?.addEventListener('input', () => this.renderTeachersGrid());
            document.getElementById('searchLeft')?.addEventListener('input', () => this.renderLeftTeachersGrid());
            document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadTeachers());
            document.getElementById('backToMainBtn')?.addEventListener('click', () => window.location.href = '/management.html');
            document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
            
            document.getElementById('registerTeacherBtn')?.addEventListener('click', () => this.registerTeacher());
            document.getElementById('updateTeacherBtn')?.addEventListener('click', () => this.updateTeacher());
            document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.cancelEdit());
            document.getElementById('resetFormBtn')?.addEventListener('click', () => this.resetForm());
            document.getElementById('sendNoticeBtn')?.addEventListener('click', () => this.openNoticeModal());
            document.getElementById('sendNoticeConfirmBtn')?.addEventListener('click', () => this.sendNotice());
            
            // Image capture/upload buttons
            document.getElementById('capturePhotoBtn')?.addEventListener('click', () => this.captureImage('photo', 'photoPreview'));
            document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => this.uploadImage('photo', 'photoPreview'));
            document.getElementById('clearPhotoBtn')?.addEventListener('click', () => this.clearImage('photo', 'photoPreview'));
            document.getElementById('captureAadharBtn')?.addEventListener('click', () => this.captureImage('aadharCopy', 'aadharPreview'));
            document.getElementById('uploadAadharBtn')?.addEventListener('click', () => this.uploadImage('aadharCopy', 'aadharPreview'));
            document.getElementById('clearAadharBtn')?.addEventListener('click', () => this.clearImage('aadharCopy', 'aadharPreview'));
            document.getElementById('captureQualificationBtn')?.addEventListener('click', () => this.captureImage('qualificationDoc', 'qualificationPreview'));
            document.getElementById('uploadQualificationBtn')?.addEventListener('click', () => this.uploadImage('qualificationDoc', 'qualificationPreview'));
            document.getElementById('clearQualificationBtn')?.addEventListener('click', () => this.clearImage('qualificationDoc', 'qualificationPreview'));
        }

        async apiCall(endpoint, options = {}) {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`,
                        ...options.headers
                    }
                });
                const data = await response.json();
                if (!data.success && response.status === 401) {
                    localStorage.removeItem('adminToken');
                    window.location.href = '/login.html';
                }
                return data;
            } catch (err) {
                console.error('API Error:', err);
                return { success: false, message: err.message };
            }
        }

        switchTab(tab) {
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.dataset.pane === tab);
            });
            if (tab === 'new-teacher') this.cancelEdit();
            if (tab === 'notices') this.loadNotices();
        }

        async loadTeachers() {
            try {
                const response = await this.apiCall('/teachers');
                this.teachersData = response.success ? (response.data || []) : [];
                this.renderTeachersGrid();
            } catch (err) {
                this.teachersData = [];
                this.renderTeachersGrid();
            }
        }

        async loadLeftTeachers() {
            try {
                const response = await this.apiCall('/teachers/left');
                this.leftTeachersData = response.success ? (response.data || []) : [];
                this.renderLeftTeachersGrid();
            } catch (err) {
                this.leftTeachersData = [];
                this.renderLeftTeachersGrid();
            }
        }

        async loadNotices() {
            try {
                const response = await this.apiCall('/notices');
                if (response.success) {
                    this.renderNotices(response.data || []);
                }
            } catch (err) {
                console.error('Load notices error:', err);
            }
        }

        renderTeachersGrid() {
            const subject = document.getElementById('filterSubject')?.value || 'all';
            const classVal = document.getElementById('filterClass')?.value || 'all';
            const board = document.getElementById('filterBoard')?.value || 'all';
            const search = document.getElementById('searchTeacher')?.value.toLowerCase() || '';
            
            let filtered = this.teachersData || [];
            
            if (subject !== 'all') {
                filtered = filtered.filter(t => t.professional?.subjects?.includes(subject));
            }
            if (classVal !== 'all') {
                filtered = filtered.filter(t => t.professional?.classes?.includes(classVal));
            }
            if (board !== 'all') {
                filtered = filtered.filter(t => t.professional?.boards?.includes(board));
            }
            if (search) {
                filtered = filtered.filter(t => 
                    (t.teacherId || '').includes(search) || 
                    (t.personal?.name || '').toLowerCase().includes(search)
                );
            }
            
            const grid = document.getElementById('teachersGrid');
            if (!grid) return;
            
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state">📭 No teachers found. Click "New Teacher" to add one!</div>';
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
                        <div class="teacher-card-info"><span>🏫 Classes:</span><span>${(t.professional?.classes || []).join(', ')}</span></div>
                        <div class="teacher-card-info"><span>💰 Salary:</span><span>₹${t.salary?.defaultSalary || 0}</span></div>
                        <div class="teacher-card-info"><span>Status:</span><span>${t.status?.isBlocked ? '<span class="badge-blocked">Blocked</span>' : '<span class="badge-active">Active</span>'}</span></div>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('#teachersGrid .teacher-card').forEach(card => {
                card.addEventListener('click', () => this.showTeacherDashboard(card.dataset.id));
            });
        }

        renderLeftTeachersGrid() {
            const search = document.getElementById('searchLeft')?.value.toLowerCase() || '';
            
            let filtered = this.leftTeachersData || [];
            if (search) {
                filtered = filtered.filter(t => 
                    (t.teacherId || '').includes(search) || 
                    (t.personal?.name || '').toLowerCase().includes(search)
                );
            }
            
            const grid = document.getElementById('leftTeachersGrid');
            if (!grid) return;
            
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state">📦 No left teachers found</div>';
                return;
            }
            
            grid.innerHTML = filtered.map(t => `
                <div class="teacher-card">
                    <div class="teacher-card-header">
                        <img src="${t.personal?.photo || DEFAULT_PHOTO}" class="teacher-card-img" onerror="this.src='${DEFAULT_PHOTO}'">
                        <div class="teacher-card-name">${t.personal?.name || 'N/A'}</div>
                        <div class="teacher-card-id">${t.teacherId || '-'}</div>
                    </div>
                    <div class="teacher-card-body">
                        <div class="teacher-card-info"><span>📞 Mobile:</span><span>${t.personal?.mobile || '-'}</span></div>
                        <div class="teacher-card-info"><span>📅 Left Date:</span><span>${formatDate(t.status?.leavingDate)}</span></div>
                        <div class="teacher-card-info"><span>📝 Reason:</span><span>${t.status?.leavingReason || '-'}</span></div>
                    </div>
                </div>
            `).join('');
        }

        renderNotices(notices) {
            const container = document.getElementById('noticesList');
            if (!container) return;
            
            if (!notices || notices.length === 0) {
                container.innerHTML = '<div class="empty-state">📭 No notices yet</div>';
                return;
            }
            
            container.innerHTML = notices.map(n => `
                <div style="background:${n.from === 'admin' ? '#e8f5e9' : '#fff3e0'}; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid ${n.from === 'admin' ? '#28a745' : '#ff9800'}">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                        <strong>${n.title}</strong>
                        <small>${formatDate(n.sentAt)}</small>
                    </div>
                    <div style="margin-top:8px;">${n.message}</div>
                    <div style="margin-top:8px; font-size:0.8rem; color:#666;">
                        From: ${n.from === 'admin' ? 'Admin' : n.teacherName} | To: ${n.to === 'admin' ? 'Admin' : 'Teachers'}
                        ${n.reply ? `<br>Reply: ${n.reply}` : ''}
                    </div>
                </div>
            `).join('');
        }

        async showTeacherDashboard(teacherId) {
            try {
                showAlert('Loading teacher data...', 'info');
                const response = await this.apiCall(`/teachers/${teacherId}`);
                if (!response.success || !response.data) {
                    showAlert('Teacher not found!', 'error');
                    return;
                }
                currentViewTeacher = response.data;
                this.renderDashboard(currentViewTeacher);
                document.getElementById('dashboardModal').classList.add('active');
            } catch (err) {
                showAlert('Error loading dashboard: ' + err.message, 'error');
            }
        }

        renderDashboard(teacher) {
            const body = document.getElementById('dashboardBody');
            const footer = document.getElementById('dashboardFooter');
            if (!body) return;
            
            const t = teacher;
            const isBlocked = t.status?.isBlocked || false;
            
            // Calculate stats
            const salaryPayments = t.salaryPayments || [];
            const totalPaid = salaryPayments.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
            const totalDue = salaryPayments.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
            const attendance = t.attendance || [];
            const totalPresent = attendance.filter(a => a.status === 'present').length;
            const attendancePercent = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;
            
            body.innerHTML = `
                <div class="dashboard-container">
                    <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:20px;">
                        <div>
                            <img src="${t.personal?.photo || DEFAULT_PHOTO}" class="teacher-photo-large" onerror="this.src='${DEFAULT_PHOTO}'" onclick="window.tmsInstance.viewDocument('${t.personal?.photo || DEFAULT_PHOTO}', 'Teacher Photo')">
                            <div style="text-align:center; margin-top:5px;">
                                <button class="btn btn-sm btn-info" onclick="window.tmsInstance.viewDocument('${t.personal?.photo || DEFAULT_PHOTO}', 'Teacher Photo')">🔍 View</button>
                            </div>
                        </div>
                        <div style="flex:1;">
                            <div class="info-row"><strong>Name:</strong> ${t.personal?.name || '-'}</div>
                            <div class="info-row"><strong>Teacher ID:</strong> ${t.teacherId || '-'}</div>
                            <div class="info-row"><strong>Mobile:</strong> ${t.personal?.mobile || '-'}</div>
                            <div class="info-row"><strong>Email:</strong> ${t.personal?.email || '-'}</div>
                            <div class="info-row"><strong>DOB:</strong> ${formatDate(t.personal?.dob)}</div>
                            <div class="info-row"><strong>Gender:</strong> ${t.personal?.gender || '-'}</div>
                            <div class="info-row"><strong>Qualification:</strong> ${t.documents?.qualificationName || '-'}</div>
                            <div class="info-row"><strong>Experience:</strong> ${t.professional?.experience || 0} years</div>
                            <div class="info-row"><strong>Joining Date:</strong> ${formatDate(t.professional?.joiningDate)}</div>
                            <div class="info-row"><strong>Address:</strong> ${t.personal?.currentAddress || '-'}</div>
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card" style="background:linear-gradient(135deg,#28a745,#20c997);color:white;"><h3>₹${totalPaid.toLocaleString()}</h3><p>Total Paid</p></div>
                        <div class="stat-card" style="background:linear-gradient(135deg,#dc3545,#c82333);color:white;"><h3>₹${totalDue.toLocaleString()}</h3><p>Total Due</p></div>
                        <div class="stat-card" style="background:linear-gradient(135deg,#17a2b8,#138496);color:white;"><h3>${attendancePercent}%</h3><p>Attendance</p></div>
                        <div class="stat-card" style="background:linear-gradient(135deg,#ffc107,#fd7e14);color:#333;"><h3>${t.professional?.subjects?.length || 0}</h3><p>Subjects</p></div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📚 Assigned Subjects</div>
                        <div>${(t.professional?.subjects || []).map(s => `<span style="background:#28a74520; padding:5px 12px; border-radius:20px; margin:5px; display:inline-block;">${s}</span>`).join('')}</div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">🏫 Assigned Classes</div>
                        <div>${(t.professional?.classes || []).map(c => `<span style="background:#17a2b820; padding:5px 12px; border-radius:20px; margin:5px; display:inline-block;">${c}</span>`).join('')}</div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">🎓 Assigned Boards</div>
                        <div>${(t.professional?.boards || []).map(b => `<span style="background:#ffc10720; padding:5px 12px; border-radius:20px; margin:5px; display:inline-block;">${b}</span>`).join('')}</div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">💰 Salary History</div>
                        <div style="overflow-x:auto;">
                            <table class="data-table">
                                <thead><tr><th>Month</th><th>Base Salary</th><th>Working Days</th><th>Present</th><th>Calculated</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${(t.salaryPayments || []).map(s => `
                                        <tr>
                                            <td>${s.month} ${s.year}</td>
                                            <td>₹${s.baseSalary}</td>
                                            <td>${s.workingDays}</td>
                                            <td>${s.presentDays}</td>
                                            <td>₹${s.calculatedAmount}</td>
                                            <td>₹${s.paidAmount}</td>
                                            <td>₹${s.dueAmount}</td>
                                            <td>${s.status === 'paid' ? '✅ Paid' : s.status === 'partial' ? '⚠️ Partial' : '❌ Unpaid'}</td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="8" class="empty-state">No salary records</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📅 Recent Attendance</div>
                        <div style="overflow-x:auto;">
                            <table class="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Photo</th></tr></thead>
                                <tbody>
                                    ${(t.attendance || []).slice(-10).reverse().map(a => `
                                        <tr>
                                            <td>${formatDate(a.date)}</td>
                                            <td>${a.status}</td>
                                            <td>${a.checkIn || '-'}</td>
                                            <td>${a.checkOut || '-'}</td>
                                            <td>${a.photo ? `<button class="btn btn-sm btn-info" onclick="window.tmsInstance.viewDocument('${a.photo}', 'Attendance Photo')">📷 View</button>` : '-'}</td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="5" class="empty-state">No attendance records</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📋 Assignment Change History</div>
                        <div style="overflow-x:auto;">
                            <table class="data-table">
                                <thead><tr><th>Date</th><th>Changes</th><th>Reason</th></tr></thead>
                                <tbody>
                                    ${(t.professional?.assignmentHistory || []).slice().reverse().map(h => `
                                        <tr>
                                            <td>${formatDate(h.date)}</td>
                                            <td><pre style="margin:0; font-size:0.75rem;">${JSON.stringify(h.changes, null, 2)}</pre></td>
                                            <td>${h.reason || '-'}</td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="3" class="empty-state">No history</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            footer.innerHTML = `
                <button class="btn btn-info" id="markAttendanceBtn">📅 Mark Attendance</button>
                <button class="btn btn-success" id="manageSalaryBtn">💰 Manage Salary</button>
                <button class="btn btn-primary" id="editTeacherBtn">✏️ Edit Teacher</button>
                ${!isBlocked ? `<button class="btn btn-warning" id="blockTeacherBtn">🔴 Block Teacher</button>` : ''}
                ${isBlocked ? `<button class="btn btn-success" id="unblockTeacherBtn">🟢 Unblock Teacher</button>` : ''}
                <button class="btn btn-danger" id="moveToLeftBtn">📦 Move to Left</button>
                <button class="btn btn-secondary" id="closeDashboardFooterBtn">Close</button>
            `;
            
            document.getElementById('markAttendanceBtn')?.addEventListener('click', () => this.openAttendanceModal(t.teacherId));
            document.getElementById('manageSalaryBtn')?.addEventListener('click', () => this.openSalaryModal(t));
            document.getElementById('editTeacherBtn')?.addEventListener('click', () => this.openEditTeacherModal(t));
            document.getElementById('blockTeacherBtn')?.addEventListener('click', () => this.blockTeacher(t.teacherId));
            document.getElementById('unblockTeacherBtn')?.addEventListener('click', () => this.unblockTeacher(t.teacherId));
            document.getElementById('moveToLeftBtn')?.addEventListener('click', () => this.moveToLeft(t.teacherId));
            document.getElementById('closeDashboardFooterBtn')?.addEventListener('click', () => closeModal('dashboardModal'));
        }

        openAttendanceModal(teacherId) {
            document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('attendanceStatus').value = 'present';
            document.getElementById('checkInTime').value = '';
            document.getElementById('checkOutTime').value = '';
            document.getElementById('attendanceRemarks').value = '';
            document.getElementById('attendancePhoto').value = '';
            document.getElementById('attendancePhotoPreview').style.display = 'none';
            
            const saveBtn = document.getElementById('saveAttendanceBtn');
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
            newBtn.addEventListener('click', () => this.saveAttendance(teacherId));
            
            document.getElementById('captureAttendancePhotoBtn')?.addEventListener('click', () => this.captureImage('attendancePhoto', 'attendancePhotoPreview'));
            document.getElementById('clearAttendancePhotoBtn')?.addEventListener('click', () => this.clearImage('attendancePhoto', 'attendancePhotoPreview'));
            
            document.getElementById('attendanceModal').classList.add('active');
        }

        async saveAttendance(teacherId) {
            const date = document.getElementById('attendanceDate').value;
            if (!date) { showAlert('Select date', 'error'); return; }
            
            const response = await this.apiCall(`/teachers/${teacherId}/attendance`, {
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
                await this.loadTeachers();
                await this.showTeacherDashboard(teacherId);
            } else {
                showAlert(response.message || 'Failed', 'error');
            }
        }

        openSalaryModal(teacher) {
            const monthSelect = document.getElementById('salaryMonth');
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const currentYear = new Date().getFullYear();
            
            monthSelect.innerHTML = '';
            for (let i = 0; i < 12; i++) {
                monthSelect.innerHTML += `<option value="${months[i]}|${currentYear}">${months[i]} ${currentYear}</option>`;
            }
            
            document.getElementById('customSalaryAmount').value = '';
            document.getElementById('payAmount').value = '';
            document.getElementById('paymentMode').value = '';
            document.getElementById('paymentRemarks').value = '';
            document.getElementById('salaryResult').style.display = 'none';
            
            const generateBtn = document.getElementById('generateSalaryBtn');
            const newGenBtn = generateBtn.cloneNode(true);
            generateBtn.parentNode.replaceChild(newGenBtn, generateBtn);
            newGenBtn.addEventListener('click', () => this.generateSalary(teacher.teacherId));
            
            const payBtn = document.getElementById('paySalaryBtn');
            const newPayBtn = payBtn.cloneNode(true);
            payBtn.parentNode.replaceChild(newPayBtn, payBtn);
            newPayBtn.addEventListener('click', () => this.paySalary(teacher.teacherId));
            
            document.getElementById('salaryModal').classList.add('active');
        }

        async generateSalary(teacherId) {
            const selected = document.getElementById('salaryMonth').value;
            if (!selected) { showAlert('Select month', 'error'); return; }
            const [month, year] = selected.split('|');
            const customSalary = document.getElementById('customSalaryAmount').value;
            
            const response = await this.apiCall(`/teachers/${teacherId}/salary/generate`, {
                method: 'POST',
                body: JSON.stringify({ month, year: parseInt(year), customSalary: customSalary ? parseInt(customSalary) : null })
            });
            
            if (response.success) {
                const resultDiv = document.getElementById('salaryResult');
                resultDiv.innerHTML = `
                    <strong>Generated Salary:</strong><br>
                    Base Salary: ₹${response.data.baseSalary}<br>
                    Working Days: ${response.data.workingDays}<br>
                    Present Days: ${response.data.presentDays}<br>
                    <strong>Calculated Amount: ₹${response.data.calculatedAmount}</strong><br>
                    Due: ₹${response.data.dueAmount}
                `;
                resultDiv.style.display = 'block';
                showAlert('Salary generated!', 'success');
                await this.loadTeachers();
            } else {
                showAlert(response.message || 'Failed', 'error');
            }
        }

        async paySalary(teacherId) {
            const selected = document.getElementById('salaryMonth').value;
            if (!selected) { showAlert('Select month', 'error'); return; }
            const [month, year] = selected.split('|');
            const paidAmount = parseInt(document.getElementById('payAmount').value);
            const paymentMode = document.getElementById('paymentMode').value;
            const remarks = document.getElementById('paymentRemarks').value;
            
            if (!paidAmount || paidAmount <= 0) { showAlert('Enter valid amount', 'error'); return; }
            
            const response = await this.apiCall(`/teachers/${teacherId}/salary/pay`, {
                method: 'POST',
                body: JSON.stringify({ month, year: parseInt(year), paidAmount, paymentMode, remarks })
            });
            
            if (response.success) {
                showAlert('Salary paid!', 'success');
                closeModal('salaryModal');
                await this.loadTeachers();
                await this.showTeacherDashboard(teacherId);
            } else {
                showAlert(response.message || 'Failed', 'error');
            }
        }

        openEditTeacherModal(teacher) {
            currentEditTeacherId = teacher.teacherId;
            
            // Fill form
            document.getElementById('fullName').value = teacher.personal?.name || '';
            document.getElementById('aadharNumber').value = teacher.teacherId || '';
            document.getElementById('aadharNumber').disabled = true;
            document.getElementById('dob').value = teacher.personal?.dob ? teacher.personal.dob.split('T')[0] : '';
            document.getElementById('gender').value = teacher.personal?.gender || '';
            document.getElementById('mobile').value = teacher.personal?.mobile || '';
            document.getElementById('email').value = teacher.personal?.email || '';
            document.getElementById('currentAddress').value = teacher.personal?.currentAddress || '';
            document.getElementById('permanentAddress').value = teacher.personal?.permanentAddress || '';
            document.getElementById('qualificationName').value = teacher.documents?.qualificationName || '';
            document.getElementById('experience').value = teacher.professional?.experience || 0;
            document.getElementById('joiningDate').value = teacher.professional?.joiningDate ? teacher.professional.joiningDate.split('T')[0] : '';
            document.getElementById('defaultSalary').value = teacher.salary?.defaultSalary || 0;
            document.getElementById('bankName').value = teacher.bankDetails?.bankName || '';
            document.getElementById('accountNumber').value = teacher.bankDetails?.accountNumber || '';
            document.getElementById('ifsc').value = teacher.bankDetails?.ifsc || '';
            document.getElementById('upiId').value = teacher.bankDetails?.upiId || '';
            
            // Checkboxes
            document.querySelectorAll('#subjectsGroup input').forEach(cb => {
                cb.checked = teacher.professional?.subjects?.includes(cb.value) || false;
            });
            document.querySelectorAll('#classesGroup input').forEach(cb => {
                cb.checked = teacher.professional?.classes?.includes(cb.value) || false;
            });
            document.querySelectorAll('#boardsGroup input').forEach(cb => {
                cb.checked = teacher.professional?.boards?.includes(cb.value) || false;
            });
            
            // Images
            if (teacher.personal?.photo) {
                document.getElementById('photo').value = teacher.personal.photo;
                const preview = document.getElementById('photoPreview');
                preview.src = teacher.personal.photo;
                preview.style.display = 'block';
            }
            if (teacher.documents?.aadharCopy) {
                document.getElementById('aadharCopy').value = teacher.documents.aadharCopy;
                const preview = document.getElementById('aadharPreview');
                preview.src = teacher.documents.aadharCopy;
                preview.style.display = 'block';
            }
            if (teacher.documents?.qualificationDoc) {
                document.getElementById('qualificationDoc').value = teacher.documents.qualificationDoc;
                const preview = document.getElementById('qualificationPreview');
                preview.src = teacher.documents.qualificationDoc;
                preview.style.display = 'block';
            }
            
            document.getElementById('formTitle').innerText = '✏️ Edit Teacher';
            document.getElementById('registerTeacherBtn').style.display = 'none';
            document.getElementById('updateTeacherBtn').style.display = 'inline-flex';
            document.getElementById('cancelEditBtn').style.display = 'inline-flex';
            
            this.switchTab('new-teacher');
        }

        async updateTeacher() {
            if (!currentEditTeacherId) { showAlert('No teacher selected', 'error'); return; }
            
            const selectedSubjects = Array.from(document.querySelectorAll('#subjectsGroup input:checked')).map(cb => cb.value);
            const selectedClasses = Array.from(document.querySelectorAll('#classesGroup input:checked')).map(cb => cb.value);
            const selectedBoards = Array.from(document.querySelectorAll('#boardsGroup input:checked')).map(cb => cb.value);
            
            const teacherData = {
                personal: {
                    name: document.getElementById('fullName').value,
                    dob: document.getElementById('dob').value,
                    gender: document.getElementById('gender').value,
                    mobile: document.getElementById('mobile').value,
                    email: document.getElementById('email').value,
                    currentAddress: document.getElementById('currentAddress').value,
                    permanentAddress: document.getElementById('permanentAddress').value,
                    photo: document.getElementById('photo').value
                },
                documents: {
                    aadharCopy: document.getElementById('aadharCopy').value,
                    qualificationDoc: document.getElementById('qualificationDoc').value,
                    qualificationName: document.getElementById('qualificationName').value
                },
                professional: {
                    joiningDate: document.getElementById('joiningDate').value,
                    experience: parseInt(document.getElementById('experience').value),
                    subjects: selectedSubjects,
                    classes: selectedClasses,
                    boards: selectedBoards,
                    changeReason: "Manual update by admin"
                },
                salary: {
                    defaultSalary: parseInt(document.getElementById('defaultSalary').value)
                },
                bankDetails: {
                    bankName: document.getElementById('bankName').value,
                    accountNumber: document.getElementById('accountNumber').value,
                    ifsc: document.getElementById('ifsc').value,
                    upiId: document.getElementById('upiId').value
                }
            };
            
            const response = await this.apiCall(`/teachers/${currentEditTeacherId}`, {
                method: 'PUT',
                body: JSON.stringify(teacherData)
            });
            
            if (response.success) {
                showAlert('✅ Teacher updated successfully!', 'success');
                this.cancelEdit();
                await this.loadTeachers();
                if (currentViewTeacher && currentViewTeacher.teacherId === currentEditTeacherId) {
                    await this.showTeacherDashboard(currentEditTeacherId);
                }
            } else {
                showAlert(response.message || 'Update failed', 'error');
            }
        }

        async registerTeacher() {
            const aadharNumber = document.getElementById('aadharNumber').value;
            if (!aadharNumber || aadharNumber.length !== 12) {
                showAlert('Valid 12-digit Aadhar number required', 'error');
                return;
            }
            
            const selectedSubjects = Array.from(document.querySelectorAll('#subjectsGroup input:checked')).map(cb => cb.value);
            const selectedClasses = Array.from(document.querySelectorAll('#classesGroup input:checked')).map(cb => cb.value);
            const selectedBoards = Array.from(document.querySelectorAll('#boardsGroup input:checked')).map(cb => cb.value);
            
            if (selectedSubjects.length === 0) { showAlert('Select at least one subject', 'error'); return; }
            if (selectedClasses.length === 0) { showAlert('Select at least one class', 'error'); return; }
            if (selectedBoards.length === 0) { showAlert('Select at least one board', 'error'); return; }
            
            const teacherData = {
                aadharNumber: aadharNumber,
                personal: {
                    name: document.getElementById('fullName').value,
                    dob: document.getElementById('dob').value,
                    gender: document.getElementById('gender').value,
                    mobile: document.getElementById('mobile').value,
                    email: document.getElementById('email').value,
                    currentAddress: document.getElementById('currentAddress').value,
                    permanentAddress: document.getElementById('permanentAddress').value,
                    photo: document.getElementById('photo').value
                },
                documents: {
                    aadharCopy: document.getElementById('aadharCopy').value,
                    qualificationDoc: document.getElementById('qualificationDoc').value,
                    qualificationName: document.getElementById('qualificationName').value
                },
                professional: {
                    joiningDate: document.getElementById('joiningDate').value,
                    experience: parseInt(document.getElementById('experience').value),
                    subjects: selectedSubjects,
                    classes: selectedClasses,
                    boards: selectedBoards,
                    branches: ['Main Branch']
                },
                salary: {
                    defaultSalary: parseInt(document.getElementById('defaultSalary').value)
                },
                bankDetails: {
                    bankName: document.getElementById('bankName').value,
                    accountNumber: document.getElementById('accountNumber').value,
                    ifsc: document.getElementById('ifsc').value,
                    upiId: document.getElementById('upiId').value
                }
            };
            
            const response = await this.apiCall('/teachers/register', {
                method: 'POST',
                body: JSON.stringify(teacherData)
            });
            
            if (response.success) {
                showAlert(`✅ Teacher registered! ID: ${aadharNumber}, Password: ${response.password}`, 'success', 8000);
                this.resetForm();
                await this.loadTeachers();
                this.switchTab('teachers');
            } else {
                showAlert(response.message || 'Registration failed', 'error');
            }
        }

        async blockTeacher(teacherId) {
            const reason = prompt('Block reason:', '');
            if (!reason) return;
            const response = await this.apiCall(`/teachers/${teacherId}/block`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            if (response.success) {
                showAlert('Teacher blocked', 'success');
                await this.loadTeachers();
                closeModal('dashboardModal');
            } else {
                showAlert(response.message || 'Failed', 'error');
            }
        }

        async unblockTeacher(teacherId) {
            if (!confirm('Unblock this teacher?')) return;
            const response = await this.apiCall(`/teachers/${teacherId}/unblock`, { method: 'POST' });
            if (response.success) {
                showAlert('Teacher unblocked', 'success');
                await this.loadTeachers();
                closeModal('dashboardModal');
            } else {
                showAlert(response.message || 'Failed', 'error');
            }
        }

        async moveToLeft(teacherId) {
            const reason = prompt('Reason for leaving:', '');
            if (!reason) return;
            const lastWorkingDay = prompt('Last working day (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            const response = await this.apiCall(`/teachers/${teacherId}/move-to-left`, {
                method: 'POST',
                body: JSON.stringify({ leavingReason: reason, lastWorkingDay })
            });
            if (response.success) {
                showAlert('Teacher moved to left list', 'success');
                await this.loadTeachers();
                await this.loadLeftTeachers();
                closeModal('dashboardModal');
            } else {
                showAlert(response.message || 'Failed', 'error');
            }
        }

        openNoticeModal() {
            this.loadTeacherNamesForNotice();
            document.getElementById('noticeTitle').value = '';
            document.getElementById('noticeMessage').value = '';
            document.getElementById('noticeModal').classList.add('active');
        }

        async loadTeacherNamesForNotice() {
            const select = document.getElementById('noticeTo');
            select.innerHTML = '<option value="all">All Teachers</option>';
            for (const teacher of this.teachersData) {
                select.innerHTML += `<option value="${teacher.teacherId}">${teacher.personal?.name} (${teacher.teacherId})</option>`;
            }
        }

        async sendNotice() {
            const teacherId = document.getElementById('noticeTo').value;
            const title = document.getElementById('noticeTitle').value;
            const message = document.getElementById('noticeMessage').value;
            
            if (!title || !message) { showAlert('Title and message required', 'error'); return; }
            
            const response = await this.apiCall('/teachers/notice', {
                method: 'POST',
                body: JSON.stringify({
                    teacherId: teacherId === 'all' ? null : teacherId,
                    title: title,
                    message: message,
                    from: 'admin'
                })
            });
            
            if (response.success) {
                showAlert('Notice sent!', 'success');
                closeModal('noticeModal');
                await this.loadNotices();
            } else {
                showAlert(response.message || 'Failed', 'error');
            }
        }

        cancelEdit() {
            currentEditTeacherId = null;
            document.getElementById('aadharNumber').disabled = false;
            document.getElementById('formTitle').innerText = 'Register New Teacher';
            document.getElementById('registerTeacherBtn').style.display = 'inline-flex';
            document.getElementById('updateTeacherBtn').style.display = 'none';
            document.getElementById('cancelEditBtn').style.display = 'none';
            this.resetForm();
        }

        resetForm() {
            const form = document.getElementById('teacherForm');
            if (form) form.reset();
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('aadharNumber').disabled = false;
            this.clearImage('photo', 'photoPreview');
            this.clearImage('aadharCopy', 'aadharPreview');
            this.clearImage('qualificationDoc', 'qualificationPreview');
            document.querySelectorAll('#subjectsGroup input').forEach(cb => cb.checked = false);
            document.querySelectorAll('#classesGroup input').forEach(cb => cb.checked = false);
            document.querySelectorAll('#boardsGroup input').forEach(cb => cb.checked = false);
        }

        clearImage(fieldId, previewId) {
            document.getElementById(fieldId).value = '';
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.style.display = 'none';
                preview.src = '';
            }
        }

        async captureImage(fieldId, previewId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const compressed = await this.compressImage(e.target.files[0]);
                    document.getElementById(fieldId).value = compressed;
                    const preview = document.getElementById(previewId);
                    if (preview) { preview.src = compressed; preview.style.display = 'block'; }
                    showAlert('Image captured!', 'success');
                }
            };
            input.click();
        }

        async uploadImage(fieldId, previewId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const compressed = await this.compressImage(e.target.files[0]);
                    document.getElementById(fieldId).value = compressed;
                    const preview = document.getElementById(previewId);
                    if (preview) { preview.src = compressed; preview.style.display = 'block'; }
                    showAlert('Image uploaded!', 'success');
                }
            };
            input.click();
        }

        async compressImage(file, maxSizeKB = 15) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        let width = img.width, height = img.height, quality = 0.7;
                        const maxDim = 200;
                        if (width > height && width > maxDim) { height = (height * maxDim) / width; width = maxDim; }
                        else if (height > maxDim) { width = (width * maxDim) / height; height = maxDim; }
                        const canvas = document.createElement('canvas');
                        canvas.width = width; canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        let result = canvas.toDataURL('image/jpeg', quality);
                        while (result.length > maxSizeKB * 1024 && quality > 0.1) { quality -= 0.1; result = canvas.toDataURL('image/jpeg', quality); }
                        resolve(result);
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
            });
        }

        viewDocument(imageUrl, title) {
            document.getElementById('docViewerImage').src = imageUrl;
            document.getElementById('docViewerTitle').innerText = title;
            document.getElementById('documentViewerModal').classList.add('active');
        }

        logout() {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        window.tmsInstance = new TeacherManagementSystem();
    });
})();
