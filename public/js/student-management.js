// ============================================
// STUDENT-MANAGEMENT.JS - COMPLETE ZERO ERROR VERSION
// With Image Compression, File Upload, Attendance History, Edit Features
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const API_BASE_URL = window.location.origin + '/api';
    let currentUser = null;
    let currentTab = 'dashboard';
    let studentsData = [];
    let oldStudentsData = [];
    let currentEditStudentId = null;
    let currentEditAttendanceId = null;

    // ============================================
    // IMAGE COMPRESSION FUNCTION (5-10 KB)
    // ============================================
    async function compressImage(file, maxSizeKB = 10) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.match(/image.*/)) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    let quality = 0.7;
                    
                    // Calculate new dimensions (max 800px)
                    const maxDimension = 800;
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = (height * maxDimension) / width;
                            width = maxDimension;
                        } else {
                            width = (width * maxDimension) / height;
                            height = maxDimension;
                        }
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    let result = canvas.toDataURL('image/jpeg', quality);
                    
                    // Reduce quality until size is under maxSizeKB
                    while (result.length > maxSizeKB * 1024 && quality > 0.1) {
                        quality -= 0.1;
                        result = canvas.toDataURL('image/jpeg', quality);
                    }
                    
                    resolve(result);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    // ============================================
    // FILE TO BASE64 (for PDF/DOC)
    // ============================================
    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    function showAlert(message, type = 'info', duration = 3000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `<span>${message}</span><button class="close-alert-btn">×</button>`;
        alertDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            max-width: 400px; background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff3cd'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#856404'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#ffeeba'};
            border-radius: 10px; padding: 12px 20px; display: flex;
            justify-content: space-between; align-items: center;
        `;
        document.body.appendChild(alertDiv);
        const closeBtn = alertDiv.querySelector('.close-alert-btn');
        closeBtn.style.cssText = 'background: none; border: none; font-size: 1.2rem; cursor: pointer;';
        closeBtn.onclick = () => alertDiv.remove();
        setTimeout(() => { if (alertDiv.parentElement) alertDiv.remove(); }, duration);
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    function getStatusBadge(status) {
        if (status === 'paid') return '<span class="badge badge-paid">Paid</span>';
        if (status === 'partial') return '<span class="badge badge-partial">Partial</span>';
        return '<span class="badge badge-unpaid">Unpaid</span>';
    }

    // All India Boards
    const allBoards = [
        'CBSE', 'ICSE', 'UP Board', 'Bihar Board', 'MP Board', 'Rajasthan Board',
        'Gujarat Board', 'Maharashtra Board', 'Tamil Nadu Board', 'Karnataka Board',
        'Telangana Board', 'Andhra Board', 'West Bengal Board', 'Punjab Board',
        'Haryana Board', 'Jharkhand Board', 'Chhattisgarh Board', 'Uttarakhand Board',
        'Assam Board', 'Odisha Board', 'Kerala Board', 'Delhi Board', 'Other'
    ];

    // All Classes
    const allClasses = [
        'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th',
        '9th', '10th', '11th', '12th', 'Graduation', 'Post Graduation', 'Other'
    ];

    // ============================================
    // STYLES
    // ============================================
    const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; padding: 20px;
        }
        .sms-container {
            max-width: 1400px; margin: 0 auto; background: white;
            border-radius: 25px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;
        }
        .sms-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 20px 30px; display: flex;
            justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;
        }
        .logo h1 { font-size: 1.8rem; margin-bottom: 5px; }
        .logo p { font-size: 0.85rem; opacity: 0.9; }
        .user-info {
            display: flex; align-items: center; gap: 15px;
            background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 50px;
        }
        .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #667eea; }
        .logout-btn { background: rgba(255,255,255,0.3); border: none; color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: all 0.3s; }
        .logout-btn:hover { background: rgba(255,255,255,0.5); }
        .sms-tabs {
            display: flex; flex-wrap: wrap; background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0; overflow-x: auto; -webkit-overflow-scrolling: touch;
        }
        .tab-btn {
            flex: 1; min-width: 90px; padding: 15px 15px; background: none;
            border: none; font-size: 0.9rem; font-weight: 600; color: #666;
            cursor: pointer; transition: all 0.3s; display: flex;
            align-items: center; justify-content: center; gap: 5px; white-space: nowrap;
        }
        .tab-btn.active { color: #667eea; border-bottom: 3px solid #667eea; background: white; }
        .tab-btn:hover:not(.active) { background: #e9ecef; }
        .sms-content { padding: 25px 30px; min-height: 500px; }
        .tab-pane { display: none; animation: fadeIn 0.3s ease; }
        .tab-pane.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card h3 { font-size: 1.8rem; margin-bottom: 5px; }
        .stat-card p { opacity: 0.9; font-size: 0.85rem; }
        .filter-group { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-group input, .filter-group select { padding: 10px 15px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 0.9rem; }
        .filter-group input:focus, .filter-group select:focus { outline: none; border-color: #667eea; }
        .filter-group input { flex: 1; min-width: 200px; }
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 15px; overflow: hidden; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e0e0e0; font-size: 0.85rem; }
        th { background: #f8f9fa; font-weight: 600; color: #333; }
        tr:hover { background: #f8f9fa; }
        .btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 0.8rem; transition: all 0.3s; display: inline-flex; align-items: center; gap: 5px; }
        .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102,126,234,0.4); }
        .btn-danger { background: #dc3545; color: white; }
        .btn-warning { background: #ffc107; color: #333; }
        .btn-success { background: #28a745; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        .btn-sm { padding: 5px 10px; font-size: 0.7rem; }
        .file-input-wrapper {
            position: relative;
            display: inline-block;
            width: 100%;
        }
        .file-input-wrapper input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        .file-input-label {
            display: block;
            padding: 10px;
            background: #f0f0f0;
            border: 2px dashed #ccc;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            font-size: 0.8rem;
        }
        .image-preview {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            margin-top: 10px;
            border: 2px solid #667eea;
        }
        .modal {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;
        }
        .modal.active { display: flex; }
        .modal-content {
            background: white; border-radius: 20px; max-width: 650px; width: 90%;
            max-height: 90vh; overflow-y: auto; animation: slideIn 0.3s ease;
        }
        @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-header { padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e0e0e0; }
        .close-modal { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #333; font-size: 0.85rem; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #667eea; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .badge-paid { background: #d4edda; color: #155724; }
        .badge-partial { background: #fff3cd; color: #856404; }
        .badge-unpaid { background: #f8d7da; color: #721c24; }
        .badge-active { background: #d4edda; color: #155724; }
        .badge-blocked { background: #f8d7da; color: #721c24; }
        .badge-present { background: #d4edda; color: #155724; }
        .badge-absent { background: #f8d7da; color: #721c24; }
        .badge-late { background: #fff3cd; color: #856404; }
        .timeline-container { background: #f8f9fa; border-radius: 15px; padding: 20px; margin-top: 20px; }
        .timeline-month { display: flex; align-items: center; margin-bottom: 15px; flex-wrap: wrap; }
        .timeline-label { width: 70px; font-weight: 600; font-size: 0.8rem; }
        .timeline-bar { flex: 1; height: 25px; background: #e0e0e0; border-radius: 15px; overflow: hidden; }
        .timeline-attendance { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.5s; }
        .timeline-percent { width: 45px; text-align: right; font-size: 0.8rem; font-weight: 600; margin-left: 10px; }
        .help-btn { position: fixed; bottom: 30px; right: 30px; width: 55px; height: 55px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; font-size: 28px; cursor: pointer; box-shadow: 0 5px 20px rgba(0,0,0,0.3); z-index: 999; transition: all 0.3s; }
        .help-btn:hover { transform: scale(1.1); }
        .help-panel { position: fixed; bottom: 100px; right: 30px; width: 350px; background: white; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 998; display: none; max-height: 500px; overflow-y: auto; }
        .help-panel.active { display: block; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .help-header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between; align-items: center; }
        .help-body { padding: 15px; }
        .help-item { padding: 12px; border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: background 0.3s; }
        .help-item:hover { background: #f8f9fa; }
        .help-item h4 { color: #667eea; margin-bottom: 5px; font-size: 0.9rem; }
        .help-item p { font-size: 0.75rem; color: #666; }
        .empty-state { text-align: center; padding: 50px; color: #999; }
        .attendance-history {
            max-height: 300px;
            overflow-y: auto;
            margin-top: 10px;
        }
        .attendance-history table {
            font-size: 0.75rem;
        }
        .attendance-history th, .attendance-history td {
            padding: 8px 10px;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .sms-header { padding: 15px; flex-direction: column; text-align: center; }
            .sms-content { padding: 15px; }
            .tab-btn { min-width: 70px; padding: 10px; font-size: 0.7rem; }
            .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
            .stat-card h3 { font-size: 1.2rem; }
            .form-row, .form-row-3 { grid-template-columns: 1fr; }
            .help-panel { width: calc(100% - 40px); right: 20px; left: 20px; bottom: 100px; }
        }
    `;

    // ============================================
    // HTML TEMPLATE
    // ============================================
    const htmlTemplate = `
        <div class="sms-container">
            <div class="sms-header">
                <div class="logo"><h1>🎓 Bal Bharti Coaching</h1><p>Complete Student Management System</p></div>
                <div class="user-info"><div class="user-avatar" id="userAvatar">A</div><span id="userName">Admin</span><button class="logout-btn" id="logoutBtn">🚪 Logout</button></div>
            </div>
            <div class="sms-tabs">
                <button class="tab-btn" data-tab="dashboard">📊 Dashboard</button>
                <button class="tab-btn" data-tab="students">👨‍🎓 Students</button>
                <button class="tab-btn" data-tab="register">📝 Register</button>
                <button class="tab-btn" data-tab="fees">💰 Fees</button>
                <button class="tab-btn" data-tab="attendance">📅 Attendance</button>
                <button class="tab-btn" data-tab="oldstudents">📦 Old Students</button>
                <button class="tab-btn" data-tab="studentdb">🎓 Student Dashboard</button>
                <button class="tab-btn" data-tab="reports">📈 Reports</button>
            </div>
            <div class="sms-content">
                <div class="tab-pane" data-pane="dashboard">
                    <div class="stats-grid" id="statsGrid"></div>
                    <div class="timeline-container"><h3 style="margin-bottom:15px;">📊 Monthly Attendance Overview</h3><div id="monthlyOverview"></div></div>
                    <div class="timeline-container" style="margin-top:20px;"><h3 style="margin-bottom:15px;">⚠️ Recently Blocked Students</h3><div id="recentIssues"></div></div>
                </div>

                <div class="tab-pane" data-pane="students">
                    <div class="filter-group">
                        <input type="text" id="searchStudent" placeholder="🔍 Search by name, ID, or mobile...">
                        <select id="filterBoard"></select>
                        <select id="filterClass"></select>
                        <select id="filterStatus"><option value="all">All Status</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
                        <button class="btn btn-primary" id="addStudentBtn">➕ Add Student</button>
                    </div>
                    <div class="table-responsive"><table id="studentsTable"><thead><tr><th>Photo</th><th>ID</th><th>Name</th><th>Board</th><th>Class</th><th>Mobile</th><th>Fees</th><th>Status</th><th>Actions</th></tr></thead><tbody id="studentsTableBody"></tbody></table></div>
                </div>

                <div class="tab-pane" data-pane="register">
                    <div class="stats-grid"><div class="stat-card"><h3 id="todayRegistrations">0</h3><p>Today's Registrations</p></div><div class="stat-card"><h3 id="weekRegistrations">0</h3><p>This Week</p></div><div class="stat-card"><h3 id="monthRegistrations">0</h3><p>This Month</p></div></div>
                    <div class="table-responsive"><h4>📋 Recent Registrations</h4><table><thead><tr><th>Date</th><th>Student ID</th><th>Name</th><th>Board</th><th>Class</th><th>Fees</th></tr></thead><tbody id="recentRegistrationsBody"></tbody></table></div>
                </div>

                <div class="tab-pane" data-pane="fees">
                    <div class="filter-group"><input type="text" id="searchFees" placeholder="🔍 Search student..."><select id="feesMonth"></select><select id="feesStatus"><option value="all">All Status</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option></select></div>
                    <div class="table-responsive"></table><thead><tr><th>Student ID</th><th>Name</th><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody id="feesTableBody"></tbody></table></div>
                </div>

                <div class="tab-pane" data-pane="attendance">
                    <div class="filter-group"><input type="date" id="attendanceDate"><select id="attendanceBoard"></select><select id="attendanceClass"></select><button class="btn btn-primary" id="bulkAttendanceBtn">📝 Bulk Present</button></div>
                    <div class="table-responsive"><tr><thead><tr><th>Photo</th><th>ID</th><th>Name</th><th>Board</th><th>Class</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th><th>Action</th></tr></thead><tbody id="attendanceTableBody"></tbody></table></div>
                </div>

                <div class="tab-pane" data-pane="oldstudents">
                    <div class="filter-group"><input type="text" id="searchOld" placeholder="🔍 Search..."><select id="oldBoardFilter"></select><select id="oldClassFilter"></select></div>
                    <div class="table-responsive"><table><thead><tr><th>Student ID</th><th>Name</th><th>Board</th><th>Class</th><th>Session</th><th>Total Paid</th><th>Total Due</th><th>Attendance %</th><th>Left On</th></tr></thead><tbody id="oldStudentsBody"></tbody></table></div>
                </div>

                <div class="tab-pane" data-pane="studentdb">
                    <div class="filter-group"><input type="text" id="studentDashboardSearch" placeholder="🔍 Search student by ID or Name..."><button class="btn btn-primary" id="viewStudentDashboardBtn">View Dashboard</button></div>
                    <div id="studentDashboardContent" class="timeline-container" style="display: none;"><div id="studentDashboardInfo"></div><h4>📊 Attendance Timeline</h4><div id="studentDashboardTimeline"></div><h4 style="margin-top:20px;">💰 Fees Status</h4><div id="studentDashboardFees"></div><h4 style="margin-top:20px;">🔴 Block History</h4><div id="studentDashboardBlocks"></div></div>
                </div>

                <div class="tab-pane" data-pane="reports">
                    <div class="filter-group"><select id="reportType"><option value="fees">Fees Report</option><option value="attendance">Attendance Report</option><option value="blocks">Block History</option></select><input type="month" id="reportMonth"><button class="btn btn-primary" id="exportReportBtn">📎 Export / Print</button></div>
                    <div id="reportContent"></div>
                </div>
            </div>
        </div>

        <button class="help-btn" id="helpBtn">❓</button>
        <div class="help-panel" id="helpPanel"><div class="help-header"><h3>📖 Help & Guide</h3><button class="close-modal" id="closeHelpBtn">×</button></div><div class="help-body" id="helpBody"></div></div>

        <!-- Student Modal -->
        <div id="studentModal" class="modal">
            <div class="modal-content">
                <div class="modal-header"><h3 id="studentModalTitle">📝 Register New Student</h3><button class="close-modal" id="closeStudentModal">×</button></div>
                <div class="modal-body">
                    <form id="studentForm">
                        <div class="form-row-3">
                            <div class="form-group"><label>First Name *</label><input type="text" id="firstName" required></div>
                            <div class="form-group"><label>Middle Name</label><input type="text" id="middleName"></div>
                            <div class="form-group"><label>Last Name *</label><input type="text" id="lastName" required></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Student ID *</label><input type="text" id="studentId" required placeholder="e.g., STU001"></div>
                            <div class="form-group"><label>Password *</label><input type="text" id="password" required></div>
                        </div>
                        
                        <!-- Photo Upload with Compression -->
                        <div class="form-group">
                            <label>Photo *</label>
                            <div class="file-input-wrapper">
                                <div class="file-input-label" id="photoLabel">📸 Click to capture or upload photo</div>
                                <input type="file" id="photoFile" accept="image/*" capture="environment">
                            </div>
                            <input type="hidden" id="photo" value="">
                            <div id="photoPreview"></div>
                        </div>
                        
                        <div class="form-group"><label>Parent Type *</label><select id="parentType"><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option></select></div>
                        <div id="fatherFields"><div class="form-row"><div class="form-group"><label>Father First Name *</label><input type="text" id="fatherFirstName"></div><div class="form-group"><label>Father Last Name *</label><input type="text" id="fatherLastName"></div></div><div class="form-group"><label>Father Mobile *</label><input type="tel" id="fatherMobile" pattern="[0-9]{10}"></div></div>
                        <div id="motherFields" style="display:none;"><div class="form-row"><div class="form-group"><label>Mother First Name *</label><input type="text" id="motherFirstName"></div><div class="form-group"><label>Mother Last Name *</label><input type="text" id="motherLastName"></div></div><div class="form-group"><label>Mother Mobile *</label><input type="tel" id="motherMobile" pattern="[0-9]{10}"></div></div>
                        <div id="guardianFields" style="display:none;"><div class="form-row"><div class="form-group"><label>Guardian First Name *</label><input type="text" id="guardianFirstName"></div><div class="form-group"><label>Guardian Last Name *</label><input type="text" id="guardianLastName"></div></div><div class="form-group"><label>Guardian Mobile *</label><input type="tel" id="guardianMobile" pattern="[0-9]{10}"></div><div class="form-group"><label>Relation *</label><input type="text" id="guardianRelation" placeholder="e.g., Uncle, Aunt"></div></div>
                        <div class="form-group"><label>Student Mobile *</label><input type="tel" id="studentMobile" required pattern="[0-9]{10}"></div>
                        <div class="form-group"><label>Aadhar Number *</label><input type="text" id="aadharNumber" required pattern="[0-9]{12}"></div>
                        
                        <!-- Aadhar Document Upload -->
                        <div class="form-group">
                            <label>Aadhar Document *</label>
                            <div class="file-input-wrapper">
                                <div class="file-input-label" id="aadharLabel">📄 Click to upload Aadhar (PDF/Image)</div>
                                <input type="file" id="aadharFile" accept="image/*,application/pdf">
                            </div>
                            <input type="hidden" id="aadharDocument" value="">
                            <div id="aadharPreview"></div>
                        </div>
                        
                        <div class="form-row"><div class="form-group"><label>Board *</label><select id="board"></select></div><div class="form-group"><label>Class *</label><select id="class"></select></div></div>
                        <div class="form-group"><label>Monthly Fees (₹) *</label><input type="number" id="monthlyFees" required></div>
                        <div class="form-group"><label>Joining Date *</label><input type="date" id="joiningDate" required></div>
                        <div class="form-group"><label>Current Address *</label><textarea id="currentAddress" rows="2"></textarea></div>
                        <div class="form-group"><label>Permanent Address *</label><textarea id="permanentAddress" rows="2"></textarea></div>
                    </form>
                </div>
                <div class="modal-footer"><button class="btn" id="cancelStudentBtn">Cancel</button><button class="btn btn-primary" id="saveStudentBtn">Save Student</button></div>
            </div>
        </div>

        <!-- Update Photo/Doc Modal -->
        <div id="updateMediaModal" class="modal">
            <div class="modal-content">
                <div class="modal-header"><h3>📸 Update Photo & Documents</h3><button class="close-modal" id="closeMediaModal">×</button></div>
                <div class="modal-body">
                    <input type="hidden" id="mediaStudentId">
                    <div class="form-group">
                        <label>Current Photo</label>
                        <div id="currentPhotoDisplay"></div>
                        <div class="file-input-wrapper">
                            <div class="file-input-label">📸 Update Photo</div>
                            <input type="file" id="updatePhotoFile" accept="image/*" capture="environment">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Current Aadhar Document</label>
                        <div id="currentAadharDisplay"></div>
                        <div class="file-input-wrapper">
                            <div class="file-input-label">📄 Update Aadhar Document</div>
                            <input type="file" id="updateAadharFile" accept="image/*,application/pdf">
                        </div>
                    </div>
                </div>
                <div class="modal-footer"><button class="btn" id="cancelMediaBtn">Cancel</button><button class="btn btn-primary" id="saveMediaBtn">Update</button></div>
            </div>
        </div>

        <!-- Attendance History Modal -->
        <div id="attendanceHistoryModal" class="modal">
            <div class="modal-content">
                <div class="modal-header"><h3>📅 Attendance History</h3><button class="close-modal" id="closeHistoryModal">×</button></div>
                <div class="modal-body">
                    <input type="hidden" id="historyStudentId">
                    <div id="attendanceHistoryContent" class="attendance-history"></div>
                </div>
                <div class="modal-footer"><button class="btn" id="closeHistoryBtn">Close</button></div>
            </div>
        </div>

        <!-- Fees Modal -->
        <div id="feesModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>💰 Update Fees</h3><button class="close-modal" id="closeFeesModal">×</button></div>
        <div class="modal-body"><input type="hidden" id="feesStudentId"><input type="hidden" id="feesSessionName"><div class="form-group"><label>Month</label><input type="text" id="feesMonthDisplay" readonly></div>
        <div class="form-group"><label>Total Amount (₹)</label><input type="text" id="feesAmount" readonly></div><div class="form-group"><label>Paid Amount (₹)</label><input type="number" id="feesPaidAmount" step="1"></div>
        <div class="form-group"><label>Remarks</label><textarea id="feesRemarks" rows="2"></textarea></div></div>
        <div class="modal-footer"><button class="btn" id="cancelFeesBtn">Cancel</button><button class="btn btn-primary" id="updateFeesBtn">Update Fees</button></div></div></div>

        <!-- Block Modal -->
        <div id="blockModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>🔴 Block Student</h3><button class="close-modal" id="closeBlockModal">×</button></div>
        <div class="modal-body"><input type="hidden" id="blockStudentId"><div class="form-group"><label>Student</label><input type="text" id="blockStudentName" readonly></div>
        <div class="form-group"><label>Reason *</label><select id="blockReason"><option value="non_payment">Non-Payment of Fees</option><option value="disciplinary">Disciplinary Issue</option><option value="temporary_leave">Temporary Leave</option><option value="left_study">Left Study Permanently</option></select></div>
        <div class="form-group"><label>Block Until (Optional)</label><input type="date" id="blockUntil"></div></div>
        <div class="modal-footer"><button class="btn" id="cancelBlockBtn">Cancel</button><button class="btn btn-danger" id="confirmBlockBtn">Block Student</button></div></div></div>

        <!-- Promote Modal -->
        <div id="promoteModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>📈 Promote Student</h3><button class="close-modal" id="closePromoteModal">×</button></div>
        <div class="modal-body"><input type="hidden" id="promoteStudentId"><div class="form-group"><label>Student</label><input type="text" id="promoteStudentName" readonly></div>
        <div class="form-group"><label>New Board</label><select id="promoteBoard"></select></div><div class="form-group"><label>New Class</label><select id="promoteClass"></select></div>
        <div class="form-group"><label>New Monthly Fees (₹)</label><input type="number" id="promoteFees" required></div>
        <div class="form-group"><label>New Joining Date</label><input type="date" id="promoteJoiningDate"></div></div>
        <div class="modal-footer"><button class="btn" id="cancelPromoteBtn">Cancel</button><button class="btn btn-success" id="confirmPromoteBtn">Promote</button></div></div></div>
    `;

    // ============================================
    // MAIN APP CLASS
    // ============================================
    class StudentManagementSystem {
        constructor() {
            this.token = localStorage.getItem('adminToken');
            this.students = [];
            this.oldStudents = [];
            this.attendanceData = [];
            
            if (!this.token) { 
                window.location.href = '/login.html'; 
                return; 
            }
            this.init();
        }

        async init() {
            this.injectStyles();
            this.injectHTML();
            this.populateDropdowns();
            this.attachEventListeners();
            this.setupFileUploads();
            await this.loadDashboardData();
            await this.loadStudents();
            await this.loadOldStudents();
            await this.loadRegistrationStats();
            await this.loadFeesData();
            document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('reportMonth').value = new Date().toISOString().slice(0, 7);
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('promoteJoiningDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('password').value = Math.random().toString(36).substring(2, 10);
            this.populateMonthDropdown();
        }

        injectStyles() {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        injectHTML() {
            const appContainer = document.createElement('div');
            appContainer.id = 'smsApp';
            appContainer.innerHTML = htmlTemplate;
            document.body.innerHTML = '';
            document.body.appendChild(appContainer);
        }

        setupFileUploads() {
            // Photo upload with compression
            const photoFile = document.getElementById('photoFile');
            if (photoFile) {
                photoFile.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        showAlert('Compressing image...', 'info', 1000);
                        const compressed = await compressImage(file, 10);
                        if (compressed) {
                            document.getElementById('photo').value = compressed;
                            const preview = document.getElementById('photoPreview');
                            preview.innerHTML = `<img src="${compressed}" class="image-preview">`;
                            showAlert('Photo compressed to ~10KB', 'success', 1000);
                        }
                    }
                });
            }
            
            // Aadhar document upload
            const aadharFile = document.getElementById('aadharFile');
            if (aadharFile) {
                aadharFile.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (file.type.match(/image.*/)) {
                            const compressed = await compressImage(file, 20);
                            if (compressed) {
                                document.getElementById('aadharDocument').value = compressed;
                                const preview = document.getElementById('aadharPreview');
                                preview.innerHTML = `<img src="${compressed}" style="max-width:100px; margin-top:5px;">`;
                                showAlert('Document compressed successfully', 'success', 1000);
                            }
                        } else {
                            const base64 = await fileToBase64(file);
                            document.getElementById('aadharDocument').value = base64;
                            const preview = document.getElementById('aadharPreview');
                            preview.innerHTML = `<span style="font-size:0.7rem;">📄 ${file.name}</span>`;
                            showAlert('Document uploaded', 'success', 1000);
                        }
                    }
                });
            }
            
            // Update photo
            const updatePhotoFile = document.getElementById('updatePhotoFile');
            if (updatePhotoFile) {
                updatePhotoFile.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const compressed = await compressImage(file, 10);
                        if (compressed) {
                            document.getElementById('updatePhotoData')?.remove();
                            const input = document.createElement('input');
                            input.type = 'hidden';
                            input.id = 'updatePhotoData';
                            input.value = compressed;
                            document.getElementById('updateMediaModal').querySelector('.modal-body').appendChild(input);
                            showAlert('Photo updated', 'success', 1000);
                        }
                    }
                });
            }
            
            // Update aadhar
            const updateAadharFile = document.getElementById('updateAadharFile');
            if (updateAadharFile) {
                updateAadharFile.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        let data;
                        if (file.type.match(/image.*/)) {
                            data = await compressImage(file, 20);
                        } else {
                            data = await fileToBase64(file);
                        }
                        if (data) {
                            document.getElementById('updateAadharData')?.remove();
                            const input = document.createElement('input');
                            input.type = 'hidden';
                            input.id = 'updateAadharData';
                            input.value = data;
                            document.getElementById('updateMediaModal').querySelector('.modal-body').appendChild(input);
                            showAlert('Aadhar document updated', 'success', 1000);
                        }
                    }
                });
            }
        }

        populateDropdowns() {
            const boardSelects = ['filterBoard', 'attendanceBoard', 'oldBoardFilter', 'board', 'promoteBoard'];
            boardSelects.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.innerHTML = '<option value="all">All Boards</option>' + allBoards.map(b => `<option value="${b}">${b}</option>`).join('');
                }
            });
            
            const classSelects = ['filterClass', 'attendanceClass', 'oldClassFilter', 'class', 'promoteClass'];
            classSelects.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.innerHTML = '<option value="all">All Classes</option>' + allClasses.map(c => `<option value="${c}">${c}</option>`).join('');
                }
            });
        }

        attachEventListeners() {
            // Tab switching
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.switchTab(btn.dataset.tab));
            });

            // Modal close buttons
            const modalIds = ['closeStudentModal', 'cancelStudentBtn', 'closeFeesModal', 'cancelFeesBtn', 'closeBlockModal', 'cancelBlockBtn', 'closePromoteModal', 'cancelPromoteBtn', 'closeMediaModal', 'cancelMediaBtn', 'closeHistoryModal', 'closeHistoryBtn'];
            modalIds.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        const modal = id.includes('Student') ? 'studentModal' : 
                                     id.includes('Fees') ? 'feesModal' :
                                     id.includes('Block') ? 'blockModal' :
                                     id.includes('Promote') ? 'promoteModal' :
                                     id.includes('Media') ? 'updateMediaModal' :
                                     'attendanceHistoryModal';
                        closeModal(modal);
                    });
                }
            });
            
            // Main buttons
            document.getElementById('addStudentBtn')?.addEventListener('click', () => this.showAddStudentModal());
            document.getElementById('saveStudentBtn')?.addEventListener('click', () => this.saveStudent());
            document.getElementById('updateFeesBtn')?.addEventListener('click', () => this.updateFees());
            document.getElementById('confirmBlockBtn')?.addEventListener('click', () => this.blockStudent());
            document.getElementById('confirmPromoteBtn')?.addEventListener('click', () => this.promoteStudent());
            document.getElementById('bulkAttendanceBtn')?.addEventListener('click', () => this.markBulkAttendance());
            document.getElementById('viewStudentDashboardBtn')?.addEventListener('click', () => this.viewStudentDashboard());
            document.getElementById('exportReportBtn')?.addEventListener('click', () => this.exportReport());
            document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
            document.getElementById('parentType')?.addEventListener('change', () => this.toggleParentFields());
            document.getElementById('saveMediaBtn')?.addEventListener('click', () => this.updateStudentMedia());
            
            // Filters
            document.getElementById('searchStudent')?.addEventListener('input', () => this.renderStudentsTable());
            document.getElementById('filterBoard')?.addEventListener('change', () => this.renderStudentsTable());
            document.getElementById('filterClass')?.addEventListener('change', () => this.renderStudentsTable());
            document.getElementById('filterStatus')?.addEventListener('change', () => this.renderStudentsTable());
            document.getElementById('searchFees')?.addEventListener('input', () => this.renderFeesTable());
            document.getElementById('feesMonth')?.addEventListener('change', () => this.renderFeesTable());
            document.getElementById('feesStatus')?.addEventListener('change', () => this.renderFeesTable());
            document.getElementById('searchOld')?.addEventListener('input', () => this.renderOldStudentsTable());
            document.getElementById('oldBoardFilter')?.addEventListener('change', () => this.renderOldStudentsTable());
            document.getElementById('oldClassFilter')?.addEventListener('change', () => this.renderOldStudentsTable());
            document.getElementById('attendanceDate')?.addEventListener('change', () => this.loadAttendance());
            document.getElementById('attendanceBoard')?.addEventListener('change', () => this.loadAttendance());
            document.getElementById('attendanceClass')?.addEventListener('change', () => this.loadAttendance());
            document.getElementById('studentDashboardSearch')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') this.viewStudentDashboard(); });
            document.getElementById('reportType')?.addEventListener('change', () => this.loadReport());
            document.getElementById('reportMonth')?.addEventListener('change', () => this.loadReport());
            
            // Help
            document.getElementById('helpBtn')?.addEventListener('click', () => {
                document.getElementById('helpPanel').classList.toggle('active');
            });
            document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
                document.getElementById('helpPanel').classList.remove('active');
            });
            
            const helpBody = document.getElementById('helpBody');
            if (helpBody) {
                const helpItems = [
                    { tab: 'dashboard', title: '📊 Dashboard', desc: 'View total students, active/blocked count, fees collected, monthly attendance graph' },
                    { tab: 'students', title: '👨‍🎓 Students', desc: 'Manage all students - add, edit, block, unblock, promote, delete. Filter by board, class, status' },
                    { tab: 'register', title: '📝 Register', desc: 'Register new students with complete details. Parent type selection (Father/Mother/Guardian)' },
                    { tab: 'fees', title: '💰 Fees', desc: 'View and update fees payments. Filter by month and status. Click Pay button to record payment' },
                    { tab: 'attendance', title: '📅 Attendance', desc: 'Mark daily attendance. Filter by board, class. Bulk present option available. View attendance history' },
                    { tab: 'oldstudents', title: '📦 Old Students', desc: 'View students who completed session or left. Filter by board and class' },
                    { tab: 'studentdb', title: '🎓 Student Dashboard', desc: 'View individual student complete profile - attendance timeline, fees status, block history' },
                    { tab: 'reports', title: '📈 Reports', desc: 'Generate fees, attendance, and block reports. Export to print' }
                ];
                helpBody.innerHTML = helpItems.map(item => `
                    <div class="help-item" data-help-tab="${item.tab}">
                        <h4>${item.title}</h4><p>${item.desc}</p>
                    </div>
                `).join('');
                document.querySelectorAll('.help-item[data-help-tab]').forEach(item => {
                    item.addEventListener('click', () => {
                        this.switchTab(item.dataset.helpTab);
                        document.getElementById('helpPanel').classList.remove('active');
                    });
                });
            }
        }

        switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.dataset.pane === tab);
            });
            if (tab === 'students') this.renderStudentsTable();
            else if (tab === 'oldstudents') this.renderOldStudentsTable();
            else if (tab === 'fees') this.renderFeesTable();
            else if (tab === 'attendance') this.loadAttendance();
            else if (tab === 'reports') this.loadReport();
        }

        async apiCall(endpoint, options = {}) {
            const defaultOptions = {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` }
            };
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } });
                const data = await response.json();
                if (!data.success && response.status === 401) {
                    localStorage.removeItem('adminToken');
                    window.location.href = '/login.html';
                }
                return data;
            } catch (err) {
                console.error('API Error:', err);
                return { success: false, message: 'Network error' };
            }
        }

        async loadDashboardData() {
            try {
                const students = await this.apiCall('/students');
                if (students.success && students.data) {
                    this.students = students.data;
                    const active = students.data.filter(s => !s.accountStatus?.isBlocked);
                    const blocked = students.data.filter(s => s.accountStatus?.isBlocked);
                    const totalFees = students.data.reduce((sum, s) => sum + (s.feesHistory?.reduce((f, fsum) => fsum + (f.paidAmount || 0), 0) || 0), 0);
                    document.getElementById('statsGrid').innerHTML = `
                        <div class="stat-card"><h3>${students.data.length}</h3><p>Total Students</p></div>
                        <div class="stat-card"><h3>${active.length}</h3><p>Active Students</p></div>
                        <div class="stat-card"><h3>${blocked.length}</h3><p>Blocked Students</p></div>
                        <div class="stat-card"><h3>₹${totalFees.toLocaleString()}</h3><p>Fees Collected</p></div>
                    `;
                    this.renderMonthlyOverview(students.data);
                    this.renderRecentIssues(students.data);
                }
            } catch (err) { console.error(err); }
        }

        renderMonthlyOverview(students) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const container = document.getElementById('monthlyOverview');
            let html = '<div style="overflow-x: auto;">';
            for (let i = 0; i < 12; i++) {
                let monthAttendance = [];
                students.forEach(s => {
                    const monthData = s.attendance?.filter(a => new Date(a.date).getMonth() === i);
                    if (monthData?.length) monthAttendance.push((monthData.filter(a => a.status === 'present').length / monthData.length) * 100);
                });
                const avgAttendance = monthAttendance.length ? Math.round(monthAttendance.reduce((a,b) => a+b, 0) / monthAttendance.length) : 0;
                html += `<div class="timeline-month"><div class="timeline-label">${months[i]}</div><div class="timeline-bar"><div class="timeline-attendance" style="width: ${avgAttendance}%;"></div></div><div class="timeline-percent">${avgAttendance}%</div></div>`;
            }
            html += '</div>';
            container.innerHTML = html;
        }

        renderRecentIssues(students) {
            const blocked = students.filter(s => s.accountStatus?.isBlocked);
            const container = document.getElementById('recentIssues');
            if (blocked.length === 0) { container.innerHTML = '<div class="empty-state">✅ No blocked students</div>'; return; }
            let html = '<div class="table-responsive"><table><thead><tr><th>Student</th><th>Reason</th><th>Blocked From</th><th>Action</th></tr></thead><tbody>';
            blocked.slice(0, 5).forEach(s => {
                html += `<tr>
                    <td>${s.studentName?.first} ${s.studentName?.last}</td>
                    <td><span class="badge badge-blocked">${s.accountStatus?.blockReason || 'Unknown'}</span></td>
                    <td>${new Date(s.accountStatus?.blockedFrom).toLocaleDateString()}</td>
                    <td><button class="btn btn-sm btn-success unblock-btn" data-id="${s.studentId}">Unblock</button></td>
                </tr>`;
            });
            html += '</tbody>}</div>';
            container.innerHTML = html;
            document.querySelectorAll('.unblock-btn').forEach(btn => {
                btn.addEventListener('click', () => this.unblockStudent(btn.dataset.id));
            });
        }

        async loadStudents() {
            try {
                const response = await this.apiCall('/students');
                if (response.success && response.data) { this.students = response.data; this.renderStudentsTable(); }
            } catch (err) { console.error(err); }
        }

        renderStudentsTable() {
            const searchTerm = document.getElementById('searchStudent')?.value.toLowerCase() || '';
            const boardFilter = document.getElementById('filterBoard')?.value || 'all';
            const classFilter = document.getElementById('filterClass')?.value || 'all';
            const statusFilter = document.getElementById('filterStatus')?.value || 'all';
            
            let filtered = this.students.filter(s => {
                if (searchTerm && !`${s.studentId} ${s.studentName?.first} ${s.studentName?.last} ${s.studentMobile}`.toLowerCase().includes(searchTerm)) return false;
                if (boardFilter !== 'all' && s.education?.board !== boardFilter) return false;
                if (classFilter !== 'all' && s.education?.class !== classFilter) return false;
                if (statusFilter === 'active' && s.accountStatus?.isBlocked) return false;
                if (statusFilter === 'blocked' && !s.accountStatus?.isBlocked) return false;
                return true;
            });
            
            const tbody = document.getElementById('studentsTableBody');
            if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No students found</td></tr>'; return; }
            
            tbody.innerHTML = filtered.map(s => `
                <tr>
                    <td><img src="${s.photo || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23667eea\'/%3E%3Ctext x=\'20\' y=\'25\' text-anchor=\'middle\' fill=\'white\' font-size=\'14\'%3E📷%3C/text%3E%3C/svg%3E'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"></td>
                    <td>${s.studentId}</td>
                    <td>${s.studentName?.first} ${s.studentName?.last}</td>
                    <td>${s.education?.board || '-'}</td>
                    <td>${s.education?.class || '-'}</td>
                    <td>${s.studentMobile}</td>
                    <td>${this.getStudentFeesStatus(s)}</td>
                    <td>${s.accountStatus?.isBlocked ? '<span class="badge badge-blocked">Blocked</span>' : '<span class="badge badge-active">Active</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-info view-student" data-id="${s.studentId}">👁️</button>
                        <button class="btn btn-sm btn-warning edit-student" data-id="${s.studentId}">✏️</button>
                        <button class="btn btn-sm btn-primary update-media" data-id="${s.studentId}">📸</button>
                        <button class="btn btn-sm btn-danger block-student" data-id="${s.studentId}" data-name="${s.studentName?.first} ${s.studentName?.last}">🔴</button>
                        ${!s.accountStatus?.isBlocked ? `<button class="btn btn-sm btn-success promote-student" data-id="${s.studentId}" data-name="${s.studentName?.first} ${s.studentName?.last}">📈</button>` : ''}
                        <button class="btn btn-sm btn-danger delete-student" data-id="${s.studentId}">🗑️</button>
                    </td>
                </tr>
            `).join('');
            
            document.querySelectorAll('.view-student').forEach(btn => btn.addEventListener('click', () => this.viewStudent(btn.dataset.id)));
            document.querySelectorAll('.edit-student').forEach(btn => btn.addEventListener('click', () => this.editStudent(btn.dataset.id)));
            document.querySelectorAll('.update-media').forEach(btn => btn.addEventListener('click', () => this.showUpdateMediaModal(btn.dataset.id)));
            document.querySelectorAll('.block-student').forEach(btn => btn.addEventListener('click', () => this.showBlockModal(btn.dataset.id, btn.dataset.name)));
            document.querySelectorAll('.promote-student').forEach(btn => btn.addEventListener('click', () => this.showPromoteModal(btn.dataset.id, btn.dataset.name)));
            document.querySelectorAll('.delete-student').forEach(btn => btn.addEventListener('click', () => this.deleteStudent(btn.dataset.id)));
        }

        getStudentFeesStatus(student) {
            const currentMonth = new Date().toLocaleString('default', { month: 'short' });
            const currentYear = new Date().getFullYear();
            const currentFee = student.feesHistory?.find(f => f.month === currentMonth && f.year === currentYear);
            if (!currentFee) return '<span class="badge badge-unpaid">No Record</span>';
            return currentFee.status === 'paid' ? '<span class="badge badge-paid">Paid</span>' : currentFee.status === 'partial' ? '<span class="badge badge-partial">Partial</span>' : '<span class="badge badge-unpaid">Unpaid</span>';
        }

        async loadOldStudents() {
            try {
                const response = await this.apiCall('/old-students');
                if (response.success && response.data) { this.oldStudents = response.data; this.renderOldStudentsTable(); }
            } catch (err) { console.error(err); }
        }

        renderOldStudentsTable() {
            const searchTerm = document.getElementById('searchOld')?.value.toLowerCase() || '';
            const boardFilter = document.getElementById('oldBoardFilter')?.value || 'all';
            const classFilter = document.getElementById('oldClassFilter')?.value || 'all';
            let filtered = this.oldStudents.filter(s => {
                if (searchTerm && !`${s.studentId} ${s.studentName?.first} ${s.studentName?.last}`.toLowerCase().includes(searchTerm)) return false;
                if (boardFilter !== 'all' && s.education?.board !== boardFilter) return false;
                if (classFilter !== 'all' && s.education?.class !== classFilter) return false;
                return true;
            });
            const tbody = document.getElementById('oldStudentsBody');
            if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No old students found</td></tr>'; return; }
            tbody.innerHTML = filtered.map(s => `
                <tr>
                    <td>${s.studentId}</td>
                    <td>${s.studentName?.first} ${s.studentName?.last}</td>
                    <td>${s.education?.board || '-'}</td>
                    <td>${s.education?.class || '-'}</td>
                    <td>${s.completedSession?.sessionName || 'N/A'}</td>
                    <td>₹${(s.totalFeesPaid || 0).toLocaleString()}</td>
                    <td>₹${(s.totalFeesDue || 0).toLocaleString()}</td>
                    <td>${Math.round(s.attendancePercentage || 0)}%</td>
                    <td>${new Date(s.sessionCompletedAt).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        async loadRegistrationStats() {
            try {
                const students = await this.apiCall('/students');
                if (students.success && students.data) {
                    const today = new Date().toISOString().split('T')[0];
                    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
                    document.getElementById('todayRegistrations').textContent = students.data.filter(s => new Date(s.registrationDate).toISOString().split('T')[0] === today).length;
                    document.getElementById('weekRegistrations').textContent = students.data.filter(s => new Date(s.registrationDate) >= weekAgo).length;
                    document.getElementById('monthRegistrations').textContent = students.data.filter(s => new Date(s.registrationDate) >= monthAgo).length;
                    const recent = [...students.data].sort((a,b) => new Date(b.registrationDate) - new Date(a.registrationDate)).slice(0, 10);
                    document.getElementById('recentRegistrationsBody').innerHTML = recent.map(s => `
                        <tr>
                            <td>${new Date(s.registrationDate).toLocaleDateString()}</td>
                            <td>${s.studentId}</td>
                            <td>${s.studentName?.first} ${s.studentName?.last}</td>
                            <td>${s.education?.board || '-'}</td>
                            <td>${s.education?.class || '-'}</td>
                            <td>₹${s.monthlyFees}</td>
                        </tr>
                    `).join('');
                }
            } catch (err) { console.error(err); }
        }

        async loadFeesData() {
            try {
                const response = await this.apiCall('/students');
                if (response.success && response.data) { this.feesData = response.data; this.renderFeesTable(); }
            } catch (err) { console.error(err); }
        }

        renderFeesTable() {
            const searchTerm = document.getElementById('searchFees')?.value.toLowerCase() || '';
            const monthFilter = document.getElementById('feesMonth')?.value || '';
            const statusFilter = document.getElementById('feesStatus')?.value || 'all';
            let feesList = [];
            this.feesData.forEach(student => {
                (student.feesHistory || []).forEach(fee => {
                    feesList.push({ studentId: student.studentId, studentName: `${student.studentName?.first} ${student.studentName?.last}`, ...fee });
                });
            });
            if (searchTerm) feesList = feesList.filter(f => f.studentId.toLowerCase().includes(searchTerm) || f.studentName.toLowerCase().includes(searchTerm));
            if (monthFilter) feesList = feesList.filter(f => `${f.month} ${f.year}` === monthFilter);
            if (statusFilter !== 'all') feesList = feesList.filter(f => f.status === statusFilter);
            const tbody = document.getElementById('feesTableBody');
            if (feesList.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No fees records found</td></tr>'; return; }
            tbody.innerHTML = feesList.map(f => `
                <tr>
                    <td>${f.studentId}</td>
                    <td>${f.studentName}</td>
                    <td>${f.month} ${f.year}</td>
                    <td>₹${f.amount}</td>
                    <td>₹${f.paidAmount || 0}</td>
                    <td>₹${f.dueAmount || 0}</td>
                    <td>${getStatusBadge(f.status)}</td>
                    <td><button class="btn btn-sm btn-primary pay-fees" data-id="${f.studentId}" data-month="${f.month}" data-year="${f.year}" data-amount="${f.amount}" data-session="${f.sessionName}">💰 Pay</button></td>
                </tr>
            `).join('');
            document.querySelectorAll('.pay-fees').forEach(btn => {
                btn.addEventListener('click', () => this.showFeesModal(btn.dataset.id, btn.dataset.month, parseInt(btn.dataset.year), parseInt(btn.dataset.amount), btn.dataset.session));
            });
        }

        populateMonthDropdown() {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentYear = new Date().getFullYear();
            const select = document.getElementById('feesMonth');
            let html = '<option value="">All Months</option>';
            for (let i = 0; i < 12; i++) html += `<option value="${months[i]} ${currentYear}">${months[i]} ${currentYear}</option>`;
            select.innerHTML = html;
        }

        async loadAttendance() {
            try {
                const response = await this.apiCall('/students');
                if (response.success && response.data) { this.attendanceData = response.data; this.renderAttendanceTable(); }
            } catch (err) { console.error(err); }
        }

        renderAttendanceTable() {
            const selectedDate = document.getElementById('attendanceDate')?.value || new Date().toISOString().split('T')[0];
            const boardFilter = document.getElementById('attendanceBoard')?.value || 'all';
            const classFilter = document.getElementById('attendanceClass')?.value || 'all';
            let filtered = this.attendanceData.filter(s => {
                if (boardFilter !== 'all' && s.education?.board !== boardFilter) return false;
                if (classFilter !== 'all' && s.education?.class !== classFilter) return false;
                return true;
            });
            const tbody = document.getElementById('attendanceTableBody');
            if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No students found</td></tr>'; return; }
            tbody.innerHTML = filtered.map(s => {
                const attendance = s.attendance?.find(a => a.date === selectedDate);
                return `
                    <tr>
                        <td><img src="${s.photo || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23667eea\'/%3E%3Ctext x=\'20\' y=\'25\' text-anchor=\'middle\' fill=\'white\' font-size=\'14\'%3E📷%3C/text%3E%3C/svg%3E'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"></td>
                        <td>${s.studentId}</td>
                        <td>${s.studentName?.first} ${s.studentName?.last}</td>
                        <td>${s.education?.board || '-'}</td>
                        <td>${s.education?.class || '-'}</td>
                        <td><select class="att-status" data-id="${s.studentId}"><option value="present" ${attendance?.status === 'present' ? 'selected' : ''}>Present</option><option value="absent" ${attendance?.status === 'absent' ? 'selected' : ''}>Absent</option><option value="late" ${attendance?.status === 'late' ? 'selected' : ''}>Late</option><option value="half-day" ${attendance?.status === 'half-day' ? 'selected' : ''}>Half Day</option></select></td>
                        <td><input type="time" class="checkin" data-id="${s.studentId}" value="${attendance?.checkInTime || ''}" style="width:100px;"></td>
                        <td><input type="time" class="checkout" data-id="${s.studentId}" value="${attendance?.checkOutTime || ''}" style="width:100px;"></td>
                        <td><input type="text" class="att-remarks" data-id="${s.studentId}" value="${attendance?.remarks || ''}" style="width:120px;"></td>
                        <td>
                            <button class="btn btn-sm btn-primary save-attendance" data-id="${s.studentId}" data-date="${selectedDate}">Save</button>
                            <button class="btn btn-sm btn-info view-history" data-id="${s.studentId}" data-name="${s.studentName?.first} ${s.studentName?.last}">📜 History</button>
                        </td>
                    </tr>
                `;
            }).join('');
            document.querySelectorAll('.save-attendance').forEach(btn => {
                btn.addEventListener('click', () => this.markSingleAttendance(btn.dataset.id, btn.dataset.date));
            });
            document.querySelectorAll('.view-history').forEach(btn => {
                btn.addEventListener('click', () => this.showAttendanceHistory(btn.dataset.id, btn.dataset.name));
            });
        }

        async markSingleAttendance(studentId, date) {
            const status = document.querySelector(`.att-status[data-id="${studentId}"]`).value;
            const checkInTime = document.querySelector(`.checkin[data-id="${studentId}"]`).value;
            const checkOutTime = document.querySelector(`.checkout[data-id="${studentId}"]`).value;
            const remarks = document.querySelector(`.att-remarks[data-id="${studentId}"]`).value;
            try {
                const response = await this.apiCall(`/students/${studentId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify({ date, status, checkInTime, checkOutTime, remarks })
                });
                if (response.success) { showAlert('Attendance marked successfully', 'success'); this.loadAttendance(); }
                else showAlert(response.message || 'Failed', 'error');
            } catch (err) { showAlert('Error marking attendance', 'error'); }
        }

        async showAttendanceHistory(studentId, studentName) {
            const student = this.students.find(s => s.studentId === studentId);
            if (!student) return;
            
            document.getElementById('historyStudentId').value = studentId;
            const historyHtml = `
                <h4>${studentName} - Attendance History</h4>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            ${(student.attendance || []).sort((a,b) => new Date(b.date) - new Date(a.date)).map(att => `
                                <tr>
                                    <td>${new Date(att.date).toLocaleDateString()}</td>
                                    <td>${att.status === 'present' ? '<span class="badge badge-present">Present</span>' : att.status === 'absent' ? '<span class="badge badge-absent">Absent</span>' : att.status === 'late' ? '<span class="badge badge-late">Late</span>' : '<span class="badge badge-warning">Half Day</span>'}</td>
                                    <td>${att.checkInTime || '-'}</td>
                                    <td>${att.checkOutTime || '-'}</td>
                                    <td>${att.remarks || '-'}</td>
                                    <td><button class="btn btn-sm btn-warning edit-attendance" data-date="${att.date}" data-student="${studentId}">✏️</button></td>
                                </tr>
                            `).join('')}
                            ${(student.attendance || []).length === 0 ? '<tr><td colspan="6" class="empty-state">No attendance records found</td>' : ''}
                        </tbody>
                    </table>
                </div>
            `;
            document.getElementById('attendanceHistoryContent').innerHTML = historyHtml;
            document.querySelectorAll('.edit-attendance').forEach(btn => {
                btn.addEventListener('click', () => this.editAttendanceRecord(btn.dataset.student, btn.dataset.date));
            });
            document.getElementById('attendanceHistoryModal').classList.add('active');
        }

        async editAttendanceRecord(studentId, date) {
            const student = this.students.find(s => s.studentId === studentId);
            const attendance = student.attendance?.find(a => a.date === date);
            if (!attendance) return;
            
            currentEditAttendanceId = { studentId, date };
            
            const modalHtml = `
                <div class="modal-content">
                    <div class="modal-header"><h3>✏️ Edit Attendance</h3><button class="close-modal" onclick="closeModal('editAttendanceModal')">×</button></div>
                    <div class="modal-body">
                        <div class="form-group"><label>Date</label><input type="date" id="editDate" value="${date}"></div>
                        <div class="form-group"><label>Status</label>
                            <select id="editStatus">
                                <option value="present" ${attendance.status === 'present' ? 'selected' : ''}>Present</option>
                                <option value="absent" ${attendance.status === 'absent' ? 'selected' : ''}>Absent</option>
                                <option value="late" ${attendance.status === 'late' ? 'selected' : ''}>Late</option>
                                <option value="half-day" ${attendance.status === 'half-day' ? 'selected' : ''}>Half Day</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Check In Time</label><input type="time" id="editCheckIn" value="${attendance.checkInTime || ''}"></div>
                        <div class="form-group"><label>Check Out Time</label><input type="time" id="editCheckOut" value="${attendance.checkOutTime || ''}"></div>
                        <div class="form-group"><label>Remarks</label><textarea id="editRemarks" rows="2">${attendance.remarks || ''}</textarea></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn" id="closeEditModal">Cancel</button>
                        <button class="btn btn-primary" id="saveEditAttendance">Save Changes</button>
                    </div>
                </div>
            `;
            
            let modal = document.getElementById('editAttendanceModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'editAttendanceModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            modal.innerHTML = modalHtml;
            modal.classList.add('active');
            
            document.getElementById('closeEditModal')?.addEventListener('click', () => closeModal('editAttendanceModal'));
            document.getElementById('saveEditAttendance')?.addEventListener('click', async () => {
                const newDate = document.getElementById('editDate').value;
                const newStatus = document.getElementById('editStatus').value;
                const newCheckIn = document.getElementById('editCheckIn').value;
                const newCheckOut = document.getElementById('editCheckOut').value;
                const newRemarks = document.getElementById('editRemarks').value;
                
                // Delete old record
                await this.apiCall(`/students/${studentId}/attendance`, {
                    method: 'DELETE',
                    body: JSON.stringify({ date: date })
                });
                
                // Save new record
                const response = await this.apiCall(`/students/${studentId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify({ date: newDate, status: newStatus, checkInTime: newCheckIn, checkOutTime: newCheckOut, remarks: newRemarks })
                });
                
                if (response.success) {
                    showAlert('Attendance updated successfully', 'success');
                    closeModal('editAttendanceModal');
                    this.loadAttendance();
                    this.loadStudents();
                } else {
                    showAlert(response.message || 'Failed to update', 'error');
                }
            });
        }

        async markBulkAttendance() {
            const date = document.getElementById('attendanceDate').value;
            if (!date) { showAlert('Please select a date', 'error'); return; }
            for (const student of this.attendanceData) {
                await this.apiCall(`/students/${student.studentId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify({ date, status: 'present', checkInTime: '09:00', checkOutTime: '13:00', remarks: 'Bulk marked' })
                });
            }
            showAlert('Bulk attendance marked', 'success');
            this.loadAttendance();
        }

        showAddStudentModal() {
            currentEditStudentId = null;
            document.getElementById('studentModalTitle').textContent = '📝 Register New Student';
            this.resetStudentForm();
            document.getElementById('studentModal').classList.add('active');
        }

        resetStudentForm() {
            document.getElementById('firstName').value = '';
            document.getElementById('middleName').value = '';
            document.getElementById('lastName').value = '';
            document.getElementById('studentId').value = '';
            document.getElementById('password').value = Math.random().toString(36).substring(2, 10);
            document.getElementById('photo').value = '';
            document.getElementById('photoPreview').innerHTML = '';
            document.getElementById('studentMobile').value = '';
            document.getElementById('aadharNumber').value = '';
            document.getElementById('aadharDocument').value = '';
            document.getElementById('aadharPreview').innerHTML = '';
            document.getElementById('monthlyFees').value = '';
            document.getElementById('currentAddress').value = '';
            document.getElementById('permanentAddress').value = '';
            document.getElementById('parentType').value = 'Father';
            this.toggleParentFields();
        }

        toggleParentFields() {
            const parentType = document.getElementById('parentType').value;
            document.getElementById('fatherFields').style.display = parentType === 'Father' ? 'block' : 'none';
            document.getElementById('motherFields').style.display = parentType === 'Mother' ? 'block' : 'none';
            document.getElementById('guardianFields').style.display = parentType === 'Guardian' ? 'block' : 'none';
        }

        async editStudent(studentId) {
            const student = this.students.find(s => s.studentId === studentId);
            if (!student) return;
            currentEditStudentId = studentId;
            document.getElementById('studentModalTitle').textContent = '✏️ Edit Student';
            document.getElementById('firstName').value = student.studentName?.first || '';
            document.getElementById('middleName').value = student.studentName?.middle || '';
            document.getElementById('lastName').value = student.studentName?.last || '';
            document.getElementById('studentId').value = student.studentId;
            document.getElementById('password').value = student.password || '';
            if (student.photo) {
                document.getElementById('photoPreview').innerHTML = `<img src="${student.photo}" class="image-preview">`;
                document.getElementById('photo').value = student.photo;
            }
            document.getElementById('parentType').value = student.parentType || 'Father';
            this.toggleParentFields();
            if (student.parentType === 'Father') {
                document.getElementById('fatherFirstName').value = student.fatherName?.first || '';
                document.getElementById('fatherLastName').value = student.fatherName?.last || '';
                document.getElementById('fatherMobile').value = student.fatherMobile || '';
            } else if (student.parentType === 'Mother') {
                document.getElementById('motherFirstName').value = student.motherName?.first || '';
                document.getElementById('motherLastName').value = student.motherName?.last || '';
                document.getElementById('motherMobile').value = student.motherMobile || '';
            } else if (student.parentType === 'Guardian') {
                document.getElementById('guardianFirstName').value = student.guardianName?.first || '';
                document.getElementById('guardianLastName').value = student.guardianName?.last || '';
                document.getElementById('guardianMobile').value = student.guardianMobile || '';
                document.getElementById('guardianRelation').value = student.guardianRelation || '';
            }
            document.getElementById('studentMobile').value = student.studentMobile || '';
            document.getElementById('aadharNumber').value = student.aadharNumber || '';
            if (student.aadharDocument) {
                if (student.aadharDocument.startsWith('data:image')) {
                    document.getElementById('aadharPreview').innerHTML = `<img src="${student.aadharDocument}" style="max-width:100px; margin-top:5px;">`;
                } else {
                    document.getElementById('aadharPreview').innerHTML = `<span style="font-size:0.7rem;">📄 Document uploaded</span>`;
                }
                document.getElementById('aadharDocument').value = student.aadharDocument;
            }
            document.getElementById('board').value = student.education?.board || 'CBSE';
            document.getElementById('class').value = student.education?.class || '9th';
            document.getElementById('monthlyFees').value = student.monthlyFees || '';
            document.getElementById('joiningDate').value = student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '';
            document.getElementById('currentAddress').value = student.address?.current || '';
            document.getElementById('permanentAddress').value = student.address?.permanent || '';
            document.getElementById('studentModal').classList.add('active');
        }

        async saveStudent() {
            const parentType = document.getElementById('parentType').value;
            const studentData = {
                studentId: document.getElementById('studentId').value,
                password: document.getElementById('password').value,
                photo: document.getElementById('photo').value,
                studentName: { 
                    first: document.getElementById('firstName').value, 
                    middle: document.getElementById('middleName').value, 
                    last: document.getElementById('lastName').value 
                },
                parentType: parentType,
                studentMobile: document.getElementById('studentMobile').value,
                aadharNumber: document.getElementById('aadharNumber').value,
                aadharDocument: document.getElementById('aadharDocument').value,
                education: { 
                    board: document.getElementById('board').value, 
                    class: document.getElementById('class').value 
                },
                monthlyFees: parseInt(document.getElementById('monthlyFees').value),
                joiningDate: document.getElementById('joiningDate').value,
                address: { 
                    current: document.getElementById('currentAddress').value, 
                    permanent: document.getElementById('permanentAddress').value 
                }
            };
            
            if (parentType === 'Father') {
                studentData.fatherName = { first: document.getElementById('fatherFirstName').value, last: document.getElementById('fatherLastName').value };
                studentData.fatherMobile = document.getElementById('fatherMobile').value;
            } else if (parentType === 'Mother') {
                studentData.motherName = { first: document.getElementById('motherFirstName').value, last: document.getElementById('motherLastName').value };
                studentData.motherMobile = document.getElementById('motherMobile').value;
            } else if (parentType === 'Guardian') {
                studentData.guardianName = { first: document.getElementById('guardianFirstName').value, last: document.getElementById('guardianLastName').value };
                studentData.guardianMobile = document.getElementById('guardianMobile').value;
                studentData.guardianRelation = document.getElementById('guardianRelation').value;
            }
            
            if (!studentData.studentId || !studentData.studentMobile || !studentData.aadharNumber) {
                showAlert('Please fill all required fields', 'error'); 
                return;
            }
            
            try {
                let response;
                if (currentEditStudentId) {
                    response = await this.apiCall(`/students/${currentEditStudentId}`, { 
                        method: 'PUT', 
                        body: JSON.stringify(studentData) 
                    });
                } else {
                    response = await this.apiCall('/student-register', { 
                        method: 'POST', 
                        body: JSON.stringify(studentData) 
                    });
                }
                if (response.success) {
                    showAlert(currentEditStudentId ? 'Student updated successfully!' : `Student registered! ID: ${response.studentId}`, 'success');
                    closeModal('studentModal');
                    this.loadStudents();
                    this.loadRegistrationStats();
                    this.loadDashboardData();
                } else {
                    showAlert(response.message, 'error');
                }
            } catch (err) { 
                showAlert('Operation failed', 'error'); 
            }
        }

        showUpdateMediaModal(studentId) {
            const student = this.students.find(s => s.studentId === studentId);
            if (!student) return;
            
            document.getElementById('mediaStudentId').value = studentId;
            document.getElementById('currentPhotoDisplay').innerHTML = `<img src="${student.photo || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect width=\'80\' height=\'80\' fill=\'%23667eea\'/%3E%3Ctext x=\'40\' y=\'45\' text-anchor=\'middle\' fill=\'white\' font-size=\'20\'%3E📷%3C/text%3E%3C/svg%3E'}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">`;
            document.getElementById('currentAadharDisplay').innerHTML = student.aadharDocument ? 
                (student.aadharDocument.startsWith('data:image') ? 
                    `<img src="${student.aadharDocument}" style="max-width:100px;">` : 
                    `<span>📄 Document uploaded</span>`) : 
                '<span>No document</span>';
            
            // Remove old hidden inputs
            document.getElementById('updatePhotoData')?.remove();
            document.getElementById('updateAadharData')?.remove();
            
            document.getElementById('updateMediaModal').classList.add('active');
        }

        async updateStudentMedia() {
            const studentId = document.getElementById('mediaStudentId').value;
            const updateData = {};
            
            const newPhoto = document.getElementById('updatePhotoData')?.value;
            const newAadhar = document.getElementById('updateAadharData')?.value;
            
            if (newPhoto) updateData.photo = newPhoto;
            if (newAadhar) updateData.aadharDocument = newAadhar;
            
            if (Object.keys(updateData).length === 0) {
                showAlert('No changes to update', 'error');
                return;
            }
            
            try {
                const response = await this.apiCall(`/students/${studentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });
                if (response.success) {
                    showAlert('Photo/Documents updated successfully', 'success');
                    closeModal('updateMediaModal');
                    this.loadStudents();
                } else {
                    showAlert(response.message, 'error');
                }
            } catch (err) {
                showAlert('Failed to update', 'error');
            }
        }

        showFeesModal(studentId, month, year, amount, sessionName) {
            document.getElementById('feesStudentId').value = studentId;
            document.getElementById('feesMonthDisplay').value = `${month} ${year}`;
            document.getElementById('feesAmount').value = amount;
            document.getElementById('feesSessionName').value = sessionName;
            document.getElementById('feesPaidAmount').value = '';
            document.getElementById('feesModal').classList.add('active');
        }

        async updateFees() {
            const studentId = document.getElementById('feesStudentId').value;
            const monthYear = document.getElementById('feesMonthDisplay').value;
            const [month, year] = monthYear.split(' ');
            const paidAmount = parseInt(document.getElementById('feesPaidAmount').value);
            const sessionName = document.getElementById('feesSessionName').value;
            if (!paidAmount || paidAmount <= 0) { showAlert('Please enter valid amount', 'error'); return; }
            try {
                const response = await this.apiCall(`/update-fees/${studentId}`, {
                    method: 'POST',
                    body: JSON.stringify({ month, year: parseInt(year), paidAmount, sessionName })
                });
                if (response.success) { 
                    showAlert('Fees updated successfully', 'success'); 
                    closeModal('feesModal'); 
                    this.loadFeesData(); 
                    this.loadDashboardData(); 
                } else {
                    showAlert(response.message, 'error');
                }
            } catch (err) { 
                showAlert('Failed to update fees', 'error'); 
            }
        }

        showBlockModal(studentId, studentName) {
            document.getElementById('blockStudentId').value = studentId;
            document.getElementById('blockStudentName').value = studentName;
            document.getElementById('blockModal').classList.add('active');
        }

        async blockStudent() {
            const studentId = document.getElementById('blockStudentId').value;
            const reason = document.getElementById('blockReason').value;
            const blockUntil = document.getElementById('blockUntil').value;
            try {
                const response = await this.apiCall(`/students/${studentId}/block`, {
                    method: 'POST',
                    body: JSON.stringify({ reason, blockUntil: blockUntil || null })
                });
                if (response.success) { 
                    showAlert('Student blocked successfully', 'success'); 
                    closeModal('blockModal'); 
                    this.loadStudents(); 
                    this.loadDashboardData(); 
                } else {
                    showAlert(response.message, 'error');
                }
            } catch (err) { 
                showAlert('Failed to block student', 'error'); 
            }
        }

        async unblockStudent(studentId) {
            if (!confirm('Are you sure you want to unblock this student?')) return;
            try {
                const response = await this.apiCall(`/students/${studentId}/unblock`, { method: 'POST' });
                if (response.success) { 
                    showAlert('Student unblocked successfully', 'success'); 
                    this.loadStudents(); 
                    this.loadDashboardData(); 
                } else {
                    showAlert(response.message, 'error');
                }
            } catch (err) { 
                showAlert('Failed to unblock student', 'error'); 
            }
        }

        showPromoteModal(studentId, studentName) {
            document.getElementById('promoteStudentId').value = studentId;
            document.getElementById('promoteStudentName').value = studentName;
            document.getElementById('promoteModal').classList.add('active');
        }

        async promoteStudent() {
            const studentId = document.getElementById('promoteStudentId').value;
            const newBoard = document.getElementById('promoteBoard').value;
            const newClass = document.getElementById('promoteClass').value;
            const newMonthlyFees = parseInt(document.getElementById('promoteFees').value);
            const newJoiningDate = document.getElementById('promoteJoiningDate').value;
            if (!newMonthlyFees) { showAlert('Please enter new monthly fees', 'error'); return; }
            try {
                const response = await this.apiCall(`/students/${studentId}/promote`, {
                    method: 'POST',
                    body: JSON.stringify({ newBoard, newClass, newMonthlyFees, newJoiningDate })
                });
                if (response.success) { 
                    showAlert(response.message, 'success'); 
                    closeModal('promoteModal'); 
                    this.loadStudents(); 
                    this.loadDashboardData(); 
                } else {
                    showAlert(response.message, 'error');
                }
            } catch (err) { 
                showAlert('Failed to promote student', 'error'); 
            }
        }

        async deleteStudent(studentId) {
            if (!confirm('Are you sure you want to delete this student? This action cannot be undone!')) return;
            try {
                const response = await this.apiCall(`/students/${studentId}`, { method: 'DELETE' });
                if (response.success) { 
                    showAlert('Student deleted successfully', 'success'); 
                    this.loadStudents(); 
                    this.loadDashboardData(); 
                } else {
                    showAlert(response.message, 'error');
                }
            } catch (err) { 
                showAlert('Failed to delete student', 'error'); 
            }
        }

        viewStudent(studentId) {
            const student = this.students.find(s => s.studentId === studentId);
            if (!student) return;
            let timelineHtml = '<div class="timeline-container"><h4>Attendance Timeline (Last 6 months)</h4>';
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(); date.setMonth(date.getMonth() - i);
                const monthIndex = date.getMonth();
                const monthName = months[monthIndex];
                const year = date.getFullYear();
                const monthAttendance = student.attendance?.filter(a => { const ad = new Date(a.date); return ad.getMonth() === monthIndex && ad.getFullYear() === year; }) || [];
                const presentCount = monthAttendance.filter(a => a.status === 'present').length;
                const totalDays = monthAttendance.length;
                const percent = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;
                const feeRecord = student.feesHistory?.find(f => f.month === monthName && f.year === year);
                timelineHtml += `<div class="timeline-month"><div class="timeline-label">${monthName}</div><div class="timeline-bar"><div class="timeline-attendance" style="width: ${percent}%;"></div></div><div class="timeline-percent">${Math.round(percent)}%</div><div style="width:60px;text-align:right;">${feeRecord?.status === 'paid' ? '✅' : feeRecord?.status === 'partial' ? '⚠️' : '❌'}</div></div>`;
            }
            timelineHtml += '</div>';
            showAlert(`
                <div style="max-height:500px;overflow-y:auto;">
                    <h4>${student.studentName?.first} ${student.studentName?.last}</h4>
                    <p><strong>ID:</strong> ${student.studentId}</p>
                    <p><strong>Board:</strong> ${student.education?.board} | <strong>Class:</strong> ${student.education?.class}</p>
                    <p><strong>Mobile:</strong> ${student.studentMobile}</p>
                    <p><strong>Session:</strong> ${student.currentSession?.sessionName} (Ends: ${new Date(student.currentSession?.endDate).toLocaleDateString()})</p>
                    <p><strong>Status:</strong> ${student.accountStatus?.isBlocked ? '<span class="badge badge-blocked">Blocked</span>' : '<span class="badge badge-active">Active</span>'}</p>
                    <hr>${timelineHtml}
                </div>
            `, 'info', 10000);
        }

        viewStudentDashboard() {
            const searchTerm = document.getElementById('studentDashboardSearch').value.toLowerCase();
            const student = this.students.find(s => s.studentId.toLowerCase() === searchTerm || `${s.studentName?.first} ${s.studentName?.last}`.toLowerCase().includes(searchTerm));
            if (!student) { showAlert('Student not found!', 'error'); return; }
            
            const container = document.getElementById('studentDashboardContent');
            container.style.display = 'block';
            
            const totalFees = student.feesHistory?.reduce((sum, f) => sum + f.amount, 0) || 0;
            const paidFees = student.feesHistory?.reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0;
            const dueFees = totalFees - paidFees;
            const totalDays = student.attendance?.length || 0;
            const presentDays = student.attendance?.filter(a => a.status === 'present').length || 0;
            const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
            
            document.getElementById('studentDashboardInfo').innerHTML = `
                <div class="stats-grid" style="margin-bottom:20px;">
                    <div class="stat-card"><h3>${student.studentId}</h3><p>Student ID</p></div>
                    <div class="stat-card"><h3>${student.studentName?.first} ${student.studentName?.last}</h3><p>Name</p></div>
                    <div class="stat-card"><h3>${student.education?.board} - ${student.education?.class}</h3><p>Board & Class</p></div>
                    <div class="stat-card"><h3>${student.studentMobile}</h3><p>Mobile</p></div>
                    <div class="stat-card"><h3>${attendancePercent}%</h3><p>Attendance</p></div>
                    <div class="stat-card"><h3>₹${paidFees.toLocaleString()}</h3><p>Fees Paid</p></div>
                    <div class="stat-card"><h3>₹${dueFees.toLocaleString()}</h3><p>Fees Due</p></div>
                    <div class="stat-card"><h3>${student.currentSession?.sessionName || 'N/A'}</h3><p>Current Session</p></div>
                </div>
            `;
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            let timelineHtml = '';
            for (let i = 5; i >= 0; i--) {
                const date = new Date(); date.setMonth(date.getMonth() - i);
                const monthIndex = date.getMonth();
                const monthName = months[monthIndex];
                const year = date.getFullYear();
                const monthAttendance = student.attendance?.filter(a => { const ad = new Date(a.date); return ad.getMonth() === monthIndex && ad.getFullYear() === year; }) || [];
                const presentCount = monthAttendance.filter(a => a.status === 'present').length;
                const total = monthAttendance.length;
                const percent = total > 0 ? (presentCount / total) * 100 : 0;
                timelineHtml += `<div class="timeline-month"><div class="timeline-label">${monthName}</div><div class="timeline-bar"><div class="timeline-attendance" style="width: ${percent}%;"></div></div><div class="timeline-percent">${Math.round(percent)}%</div></div>`;
            }
            document.getElementById('studentDashboardTimeline').innerHTML = timelineHtml || '<p>No attendance data</p>';
            
            let feesHtml = '<div class="table-responsive"><table><thead><tr><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead><tbody>';
            (student.feesHistory || []).forEach(f => {
                feesHtml += `<tr>
                    <td>${f.month} ${f.year}</td>
                    <td>₹${f.amount}</td>
                    <td>₹${f.paidAmount || 0}</td>
                    <td>₹${f.dueAmount || 0}</td>
                    <td>${getStatusBadge(f.status)}</td>
                </tr>`;
            });
            feesHtml += '</tbody>}</div>';
            document.getElementById('studentDashboardFees').innerHTML = feesHtml || '<p>No fees data</p>';
            
            let blocksHtml = '<div class="table-responsive"><tr><thead><tr><th>Blocked From</th><th>Blocked Until</th><th>Reason</th><th>Unblocked</th></tr></thead><tbody>';
            (student.blockHistory || []).forEach(b => {
                blocksHtml += `<tr>
                    <td>${new Date(b.blockedFrom).toLocaleDateString()}</td>
                    <td>${b.blockedUntil ? new Date(b.blockedUntil).toLocaleDateString() : 'Permanent'}</td>
                    <td>${b.reason}</td>
                    <td>${b.unblockedAt ? new Date(b.unblockedAt).toLocaleDateString() : 'Still Blocked'}</td>
                </tr>`;
            });
            blocksHtml += '</tbody>}</div>';
            document.getElementById('studentDashboardBlocks').innerHTML = blocksHtml || '<p>No block history</p>';
        }

        async loadReport() {
            const reportType = document.getElementById('reportType').value;
            const month = document.getElementById('reportMonth').value;
            const container = document.getElementById('reportContent');
            try {
                const students = await this.apiCall('/students');
                if (!students.success) return;
                if (reportType === 'fees') container.innerHTML = this.generateFeesReport(students.data, month);
                else if (reportType === 'attendance') container.innerHTML = this.generateAttendanceReport(students.data, month);
                else if (reportType === 'blocks') container.innerHTML = this.generateBlocksReport(students.data);
            } catch (err) { 
                container.innerHTML = '<div class="alert alert-error">Error loading report</div>'; 
            }
        }

        generateFeesReport(students, month) {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[parseInt(monthNum) - 1];
            let totalCollected = 0, totalDue = 0, paidCount = 0, partialCount = 0, unpaidCount = 0;
            const reportData = [];
            students.forEach(s => {
                const fee = s.feesHistory?.find(f => f.month === monthName && f.year === parseInt(year));
                if (fee) {
                    reportData.push({ 
                        name: `${s.studentName?.first} ${s.studentName?.last}`, 
                        id: s.studentId, 
                        amount: fee.amount, 
                        paid: fee.paidAmount || 0, 
                        due: fee.dueAmount || 0, 
                        status: fee.status 
                    });
                    totalCollected += fee.paidAmount || 0; 
                    totalDue += fee.dueAmount || 0;
                    if (fee.status === 'paid') paidCount++;
                    else if (fee.status === 'partial') partialCount++;
                    else unpaidCount++;
                }
            });
            return `
                <div class="stats-grid">
                    <div class="stat-card"><h3>₹${totalCollected.toLocaleString()}</h3><p>Total Collected</p></div>
                    <div class="stat-card"><h3>₹${totalDue.toLocaleString()}</h3><p>Total Due</p></div>
                    <div class="stat-card"><h3>${paidCount}</h3><p>Paid</p></div>
                    <div class="stat-card"><h3>${partialCount}</h3><p>Partial</p></div>
                    <div class="stat-card"><h3>${unpaidCount}</h3><p>Unpaid</p></div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Student ID</th><th>Name</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
                        <tbody>${reportData.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>₹${r.amount}</td><td>₹${r.paid}</td><td>₹${r.due}</td><td>${getStatusBadge(r.status)}</td></tr>`).join('')}</tbody>
                    </table>
                </div>
            `;
        }

        generateAttendanceReport(students, month) {
            const [year, monthNum] = month.split('-');
            const monthIndex = parseInt(monthNum) - 1;
            let reportData = [], totalPresent = 0, totalDays = 0;
            students.forEach(s => {
                const monthAttendance = s.attendance?.filter(a => { 
                    const ad = new Date(a.date); 
                    return ad.getMonth() === monthIndex && ad.getFullYear() === parseInt(year); 
                }) || [];
                const present = monthAttendance.filter(a => a.status === 'present').length;
                const total = monthAttendance.length;
                if (total > 0) {
                    reportData.push({ 
                        name: `${s.studentName?.first} ${s.studentName?.last}`, 
                        id: s.studentId, 
                        present, 
                        total, 
                        percentage: (present / total) * 100 
                    });
                    totalPresent += present; 
                    totalDays += total;
                }
            });
            const overallPercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;
            return `
                <div class="stats-grid">
                    <div class="stat-card"><h3>${totalPresent}</h3><p>Total Present</p></div>
                    <div class="stat-card"><h3>${totalDays}</h3><p>Total Days</p></div>
                    <div class="stat-card"><h3>${Math.round(overallPercentage)}%</h3><p>Overall Attendance</p></div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Student ID</th><th>Name</th><th>Present</th><th>Total Days</th><th>Percentage</th></tr></thead>
                        <tbody>${reportData.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.present}</td><td>${r.total}</td><td>${Math.round(r.percentage)}%</td></tr>`).join('')}</tbody>
                    </table>
                </div>
            `;
        }

        generateBlocksReport(students) {
            const blockedStudents = students.filter(s => s.accountStatus?.isBlocked);
            const blockHistory = [];
            students.forEach(s => { 
                (s.blockHistory || []).forEach(b => { 
                    blockHistory.push({ 
                        name: `${s.studentName?.first} ${s.studentName?.last}`, 
                        id: s.studentId, 
                        ...b 
                    }); 
                }); 
            });
            return `
                <div class="stats-grid">
                    <div class="stat-card"><h3>${blockedStudents.length}</h3><p>Currently Blocked</p></div>
                    <div class="stat-card"><h3>${blockHistory.length}</h3><p>Total Block Events</p></div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Student</th><th>Blocked From</th><th>Blocked Until</th><th>Reason</th><th>Status</th></tr></thead>
                        <tbody>${blockHistory.map(b => `<tr>
                            <td>${b.name} (${b.id})</td>
                            <td>${new Date(b.blockedFrom).toLocaleDateString()}</td>
                            <td>${b.blockedUntil ? new Date(b.blockedUntil).toLocaleDateString() : 'Permanent'}</td>
                            <td>${b.reason}</td>
                            <td>${b.unblockedAt ? 'Unblocked' : 'Still Blocked'}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                </div>
            `;
        }

        exportReport() {
            const reportType = document.getElementById('reportType').value;
            const month = document.getElementById('reportMonth').value;
            const content = document.getElementById('reportContent').innerHTML;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${reportType.toUpperCase()} Report</title>
                        <style>
                            body { font-family: Arial; padding: 20px; }
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid #ddd; padding: 8px; }
                            th { background: #667eea; color: white; }
                            .stat-card { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 10px; margin: 10px; display: inline-block; min-width: 150px; }
                        </style>
                    </head>
                    <body>
                        <h1>${reportType.toUpperCase()} Report - ${month}</h1>
                        ${content}
                        <p style="margin-top:20px;">Generated on: ${new Date().toLocaleString()}</p>
                    </body>
                </html>
            `);
            printWindow.print();
        }

        logout() {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => { 
        new StudentManagementSystem(); 
    });
})();
