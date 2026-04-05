// ============================================
// STUDENT-MANAGEMENT.JS - COMPLETE FIXED VERSION
// WITH PROPER EDIT, PHOTO DISPLAY, DOCUMENT VIEW, AND NO DUPLICATE ISSUES
// ============================================

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const API_BASE_URL = window.location.origin + '/api';
    let studentsData = [];
    let oldStudentsData = [];
    let currentViewStudent = null;
    let isEditMode = false;
    let currentEditStudentId = null;
    let charts = {};

    // ========== BOARDS & CLASSES ==========
    const allBoards = [
        'CBSE', 'ICSE', 'UP Board', 'Bihar Board', 'MP Board', 'Rajasthan Board',
        'Gujarat Board', 'Maharashtra Board', 'Tamil Nadu Board', 'Karnataka Board',
        'Telangana Board', 'Andhra Board', 'West Bengal Board', 'Punjab Board',
        'Haryana Board', 'Jharkhand Board', 'Chhattisgarh Board', 'Uttarakhand Board',
        'Assam Board', 'Odisha Board', 'Kerala Board', 'Delhi Board', 'Other'
    ];

    const allClasses = [
        'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th',
        '9th', '10th', '11th', '12th', 'Graduation', 'Post Graduation', 'Other'
    ];

    const allSessions = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];

    const DEFAULT_PHOTO = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23667eea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40"%3E📷%3C/text%3E%3C/svg%3E';

    // ========== HELPER FUNCTIONS ==========
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
            justify-content: space-between; align-items: center; font-family: Arial, sans-serif; z-index: 10001;
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

    function formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-IN');
    }

    function getStatusBadge(status) {
        if (status === 'paid') return '<span class="badge badge-paid">✅ Paid</span>';
        if (status === 'partial') return '<span class="badge badge-partial">⚠️ Partial</span>';
        return '<span class="badge badge-unpaid">❌ Unpaid</span>';
    }

    // ========== STYLES ==========
    const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .sms-wrapper {
            max-width: 1400px; margin: 0 auto; background: white;
            border-radius: 25px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden; margin: 20px;
        }
        .sms-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .main-tab-btn.active { color: #667eea; border-bottom: 3px solid #667eea; background: white; }
        .sms-content { padding: 25px; min-height: 500px; }
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
            outline: none; border-color: #667eea;
        }
        
        .students-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        .student-card {
            background: white; border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden; cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .student-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .student-card-header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            padding: 20px; text-align: center;
        }
        .student-card-img {
            width: 100px; height: 100px; border-radius: 50%;
            object-fit: cover; border: 3px solid white;
            margin-bottom: 10px;
        }
        .student-card-name {
            color: white; font-size: 1.1rem; font-weight: bold;
        }
        .student-card-id {
            color: rgba(255,255,255,0.8); font-size: 0.8rem;
        }
        .student-card-body {
            padding: 15px;
        }
        .student-card-info {
            display: flex; justify-content: space-between;
            margin-bottom: 8px; font-size: 0.85rem;
        }
        .student-card-info span:first-child { color: #666; }
        .student-card-info span:last-child { font-weight: 500; color: #333; }
        .badge-blocked { background: #dc3545; color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        .badge-active { background: #28a745; color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        
        .dashboard-container {
            background: #f8f9fa; border-radius: 15px;
            padding: 20px;
        }
        .dashboard-header {
            display: flex; gap: 20px; flex-wrap: wrap;
            margin-bottom: 25px;
        }
        .dashboard-photo {
            width: 120px; height: 120px; border-radius: 50%;
            object-fit: cover; border: 3px solid #667eea;
        }
        .dashboard-info {
            flex: 1;
        }
        .info-row {
            display: grid; grid-template-columns: 150px 1fr;
            margin-bottom: 10px;
        }
        .info-label { font-weight: 600; color: #666; }
        .info-value { color: #333; }
        
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
        .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
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
            max-width: 1200px; width: 90%; max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2);
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
            outline: none; border-color: #667eea;
        }
        .form-group input:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        
        .badge-paid { background: #d4edda; color: #155724; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .badge-partial { background: #fff3cd; color: #856404; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .badge-unpaid { background: #f8d7da; color: #721c24; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        
        .image-preview { 
            width: 100px; 
            height: 100px; 
            border-radius: 10px; 
            object-fit: cover; 
            margin-top: 5px; 
            border: 2px solid #e0e0e0;
            background: #f8f9fa;
        }
        .image-actions { display: flex; gap: 10px; margin-top: 5px; flex-wrap: wrap; }
        
        .empty-state { text-align: center; padding: 50px; color: #999; }
        
        .edit-mode-badge {
            background: #ffc107;
            color: #333;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .student-photo-large {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #667eea;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .student-photo-large:hover {
            transform: scale(1.05);
        }
        
        /* Mobile Responsive Styles - APK like feel */
        @media (max-width: 768px) {
            .form-row, .form-row-3 { grid-template-columns: 1fr; }
            .students-grid { grid-template-columns: 1fr; }
            .filter-bar { flex-direction: column; }
            .info-row { grid-template-columns: 1fr; gap: 5px; }
            .sms-wrapper { margin: 10px; border-radius: 15px; }
            .sms-header { padding: 12px 15px; }
            .logo h1 { font-size: 1.2rem; }
            .main-tab-btn { padding: 12px 10px; font-size: 0.85rem; }
            .sms-content { padding: 15px; }
            .student-card { margin-bottom: 10px; }
            .modal-content { width: 95%; margin: 10px; }
            .dashboard-header { flex-direction: column; align-items: center; text-align: center; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .btn { padding: 10px 14px; font-size: 0.8rem; }
            .data-table th, .data-table td { padding: 8px; font-size: 0.75rem; }
        }
        
        /* Desktop optimizations */
        @media (min-width: 1024px) {
            .students-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
            .sms-content { padding: 30px; }
        }
        
        /* Document viewer modal */
        .document-viewer {
            max-width: 90vw;
            max-height: 90vh;
        }
        .document-viewer img {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
        }
        .doc-thumb {
            cursor: pointer;
            transition: transform 0.2s;
        }
        .doc-thumb:hover {
            transform: scale(1.02);
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 10px;
        }
        
        /* Loading spinner */
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    // ========== HTML TEMPLATE ==========
    const htmlTemplate = `
        <div class="sms-wrapper">
            <div class="sms-header">
                <div class="logo">
                    <h1>🎓 Bal Bharti Coaching</h1>
                    <p>Complete Student Management System</p>
                </div>
                <div class="user-info">
                    <button class="btn btn-info" id="logoutBtn" style="background: rgba(255,255,255,0.2);">🚪 Logout</button>
                </div>
            </div>
            
            <div class="main-tabs">
                <button class="main-tab-btn active" data-tab="students">📋 Students</button>
                <button class="main-tab-btn" data-tab="new-admission">➕ New Admission</button>
                <button class="main-tab-btn" data-tab="old-students">📦 Old Students</button>
            </div>
            
            <div class="sms-content">
                <!-- STUDENTS TAB -->
                <div class="tab-pane active" data-pane="students">
                    <div class="filter-bar">
                        <select id="filterBoard"><option value="all">All Boards</option>${allBoards.map(b => `<option value="${b}">${b}</option>`).join('')}</select>
                        <select id="filterClass"><option value="all">All Classes</option>${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                        <select id="filterSession"><option value="all">All Sessions</option>${allSessions.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
                        <input type="text" id="searchStudent" placeholder="🔍 Search by name or ID...">
                        <button class="btn btn-primary" id="refreshBtn">🔄 Refresh</button>
                        <button class="btn btn-success" id="createDemoBtn">🎓 Create Demo Student</button>
                    </div>
                    <div id="studentsGrid" class="students-grid"></div>
                </div>
                
                <!-- NEW ADMISSION / EDIT STUDENT TAB -->
                <div class="tab-pane" data-pane="new-admission">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <h3>📝 <span id="formTitle">Register New Student</span></h3>
                        <div id="editModeIndicator" style="display: none;">
                            <span class="edit-mode-badge">✏️ Edit Mode - Student ID: <span id="editStudentIdDisplay"></span></span>
                        </div>
                    </div>
                    <form id="admissionForm">
                        <div class="form-row">
                            <div class="form-group"><label>Session *</label><select id="admissionSession" required>${allSessions.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div>
                            <div class="form-group"><label>Joining Date *</label><input type="date" id="joiningDate" required></div>
                        </div>
                        
                        <div class="form-row-3">
                            <div class="form-group"><label>First Name *</label><input type="text" id="firstName" required></div>
                            <div class="form-group"><label>Middle Name</label><input type="text" id="middleName"></div>
                            <div class="form-group"><label>Last Name *</label><input type="text" id="lastName" required></div>
                        </div>
                        
                        <div class="form-group">
                            <label>Aadhar Number (Student ID) * <span style="color:#dc3545;">(12 digit number - UNIQUE)</span></label>
                            <input type="text" id="aadharNumber" required maxlength="12" pattern="[0-9]{12}" placeholder="Enter 12 digit Aadhar number">
                            <small style="color: #28a745; display: block; margin-top: 5px;">💡 Student ID will be automatically set to this Aadhar number (Must be unique)</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Student ID (Auto from Aadhar) *</label>
                            <input type="text" id="studentIdField" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group"><label>Student Mobile *</label><input type="tel" id="studentMobile" required pattern="[0-9]{10}" placeholder="10 digit mobile number"></div>
                            <div class="form-group"><label>Email</label><input type="email" id="email" placeholder="student@example.com"></div>
                        </div>
                        
                        <div class="form-group"><label>Parent Type *</label><select id="parentType"><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option></select></div>
                        <div id="fatherFields">
                            <div class="form-row">
                                <div class="form-group"><label>Father Name *</label><input type="text" id="fatherName" placeholder="First and Last name"></div>
                                <div class="form-group"><label>Father Mobile *</label><input type="tel" id="fatherMobile" placeholder="10 digit mobile"></div>
                            </div>
                        </div>
                        <div id="motherFields" style="display:none;">
                            <div class="form-row">
                                <div class="form-group"><label>Mother Name *</label><input type="text" id="motherName" placeholder="First and Last name"></div>
                                <div class="form-group"><label>Mother Mobile *</label><input type="tel" id="motherMobile" placeholder="10 digit mobile"></div>
                            </div>
                        </div>
                        <div id="guardianFields" style="display:none;">
                            <div class="form-row">
                                <div class="form-group"><label>Guardian Name *</label><input type="text" id="guardianName" placeholder="Full name"></div>
                                <div class="form-group"><label>Guardian Mobile *</label><input type="tel" id="guardianMobile" placeholder="10 digit mobile"></div>
                            </div>
                            <div class="form-group"><label>Relation *</label><input type="text" id="guardianRelation" placeholder="e.g., Uncle, Aunt, Grandfather"></div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group"><label>Board *</label><select id="board">${allBoards.map(b => `<option value="${b}">${b}</option>`).join('')}</select></div>
                            <div class="form-group"><label>Class *</label><select id="class">${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                        </div>
                        
                        <div class="form-group"><label>Monthly Fees (₹) *</label><input type="number" id="monthlyFees" required min="0" step="100" value="1000"></div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Student Photo</label>
                                <input type="hidden" id="photo">
                                <img id="photoPreview" class="image-preview" style="display:none;">
                                <div class="image-actions">
                                    <button type="button" class="btn btn-primary btn-sm" id="capturePhotoBtn">📷 Capture Photo</button>
                                    <button type="button" class="btn btn-info btn-sm" id="uploadPhotoBtn">📁 Upload Photo</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="clearPhotoBtn">🗑️ Clear</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Aadhar Document</label>
                                <input type="hidden" id="aadharDoc">
                                <img id="aadharPreview" class="image-preview" style="display:none;">
                                <div class="image-actions">
                                    <button type="button" class="btn btn-primary btn-sm" id="captureAadharBtn">📷 Capture Aadhar</button>
                                    <button type="button" class="btn btn-info btn-sm" id="uploadAadharBtn">📁 Upload Aadhar</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="clearAadharBtn">🗑️ Clear</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group"><label>Current Address *</label><textarea id="currentAddress" rows="2" placeholder="House number, Street, City, PIN code"></textarea></div>
                        <div class="form-group"><label>Permanent Address</label><textarea id="permanentAddress" rows="2" placeholder="Leave blank if same as current address"></textarea></div>
                        
                        <div class="btn-group">
                            <button type="button" class="btn btn-primary" id="registerStudentBtn">✅ Register Student</button>
                            <button type="button" class="btn btn-warning" id="updateStudentBtn" style="display:none;">✏️ Update Student</button>
                            <button type="button" class="btn btn-secondary" id="cancelEditBtn" style="display:none;">❌ Cancel Edit</button>
                            <button type="button" class="btn btn-warning" id="resetFormBtn">🔄 Reset Form</button>
                        </div>
                    </form>
                </div>
                
                <!-- OLD STUDENTS TAB -->
                <div class="tab-pane" data-pane="old-students">
                    <div class="filter-bar">
                        <select id="oldFilterBoard"><option value="all">All Boards</option>${allBoards.map(b => `<option value="${b}">${b}</option>`).join('')}</select>
                        <select id="oldFilterClass"><option value="all">All Classes</option>${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                        <select id="oldFilterSession"><option value="all">All Sessions</option>${allSessions.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
                        <input type="text" id="searchOld" placeholder="🔍 Search by name or ID...">
                    </div>
                    <div id="oldStudentsGrid" class="students-grid"></div>
                </div>
            </div>
        </div>
        
        <!-- STUDENT DASHBOARD MODAL -->
        <div id="dashboardModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="dashboardTitle">Student Dashboard</h3>
                    <button class="close-modal" id="closeDashboardModal">×</button>
                </div>
                <div class="modal-body" id="dashboardBody">
                    <div style="text-align: center; padding: 50px;">Loading...</div>
                </div>
                <div class="modal-footer" id="dashboardFooter"></div>
            </div>
        </div>
        
        <!-- EDIT STUDENT POPUP MODAL -->
        <div id="editStudentModal" class="modal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>✏️ Edit Student - <span id="editModalStudentId"></span></h3>
                    <button class="close-modal" id="closeEditModal">×</button>
                </div>
                <div class="modal-body" id="editModalBody">
                    <!-- Edit form will be dynamically populated -->
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelEditModalBtn">Cancel</button>
                    <button class="btn btn-primary" id="saveEditModalBtn">💾 Save Changes</button>
                </div>
            </div>
        </div>
        
        <!-- DOCUMENT VIEWER MODAL -->
        <div id="documentViewerModal" class="modal">
            <div class="modal-content document-viewer">
                <div class="modal-header">
                    <h3 id="docViewerTitle">Document Viewer</h3>
                    <button class="close-modal" id="closeDocViewer">×</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <img id="docViewerImage" src="" alt="Document" style="max-width: 100%; max-height: 70vh;">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="closeDocViewerBtn">Close</button>
                    <button class="btn btn-primary" id="downloadDocBtn">📥 Download</button>
                </div>
            </div>
        </div>
        
        <!-- MARK ATTENDANCE MODAL -->
        <div id="attendanceModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>📅 Mark Attendance</h3>
                    <button class="close-modal" id="closeAttendanceModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="attendanceDate" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="attendanceStatus" class="form-control">
                            <option value="present">✅ Present</option>
                            <option value="absent">❌ Absent</option>
                            <option value="late">⏰ Late</option>
                            <option value="half-day">🌓 Half Day</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Check In Time</label>
                        <input type="time" id="checkInTime" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Check Out Time</label>
                        <input type="time" id="checkOutTime" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Remarks</label>
                        <textarea id="attendanceRemarks" class="form-control" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelAttendanceBtn">Cancel</button>
                    <button class="btn btn-primary" id="saveAttendanceBtn">💾 Save Attendance</button>
                </div>
            </div>
        </div>
        
        <!-- PAY FEES MODAL -->
        <div id="feesModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>💰 Pay Fees</h3>
                    <button class="close-modal" id="closeFeesModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Select Month</label>
                        <select id="feesMonth" class="form-control"></select>
                    </div>
                    <div class="form-group">
                        <label>Amount to Pay (₹)</label>
                        <input type="number" id="feesAmount" class="form-control" min="1" step="100">
                    </div>
                    <div class="form-group">
                        <label>Remarks</label>
                        <textarea id="feesRemarks" class="form-control" rows="2" placeholder="Optional remarks..."></textarea>
                    </div>
                    <div id="feesInfo" style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-top: 10px;"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelFeesBtn">Cancel</button>
                    <button class="btn btn-success" id="saveFeesBtn">💰 Pay Now</button>
                </div>
            </div>
        </div>
    `;

    // ========== MAIN APP CLASS ==========
    class StudentManagementSystem {
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
            await this.loadStudents();
            await this.loadOldStudents();
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            this.setupParentTypeToggle();
            this.setupAutoStudentIdFromAadhar();
            this.setupClearButtons();
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

        attachEventListeners() {
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
            });
            
            document.getElementById('closeDashboardModal')?.addEventListener('click', () => closeModal('dashboardModal'));
            document.getElementById('closeAttendanceModal')?.addEventListener('click', () => closeModal('attendanceModal'));
            document.getElementById('closeFeesModal')?.addEventListener('click', () => closeModal('feesModal'));
            document.getElementById('cancelAttendanceBtn')?.addEventListener('click', () => closeModal('attendanceModal'));
            document.getElementById('cancelFeesBtn')?.addEventListener('click', () => closeModal('feesModal'));
            
            // Edit modal close buttons
            document.getElementById('closeEditModal')?.addEventListener('click', () => closeModal('editStudentModal'));
            document.getElementById('cancelEditModalBtn')?.addEventListener('click', () => closeModal('editStudentModal'));
            document.getElementById('saveEditModalBtn')?.addEventListener('click', () => this.saveEditFromModal());
            
            // Document viewer close buttons
            document.getElementById('closeDocViewer')?.addEventListener('click', () => closeModal('documentViewerModal'));
            document.getElementById('closeDocViewerBtn')?.addEventListener('click', () => closeModal('documentViewerModal'));
            document.getElementById('downloadDocBtn')?.addEventListener('click', () => this.downloadCurrentDocument());
            
            document.getElementById('filterBoard')?.addEventListener('change', () => this.renderStudentsGrid());
            document.getElementById('filterClass')?.addEventListener('change', () => this.renderStudentsGrid());
            document.getElementById('filterSession')?.addEventListener('change', () => this.renderStudentsGrid());
            document.getElementById('searchStudent')?.addEventListener('input', () => this.renderStudentsGrid());
            document.getElementById('oldFilterBoard')?.addEventListener('change', () => this.renderOldStudentsGrid());
            document.getElementById('oldFilterClass')?.addEventListener('change', () => this.renderOldStudentsGrid());
            document.getElementById('oldFilterSession')?.addEventListener('change', () => this.renderOldStudentsGrid());
            document.getElementById('searchOld')?.addEventListener('input', () => this.renderOldStudentsGrid());
            document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadStudents());
            document.getElementById('createDemoBtn')?.addEventListener('click', () => this.createDemoStudent());
            
            document.getElementById('registerStudentBtn')?.addEventListener('click', () => this.registerStudent());
            document.getElementById('updateStudentBtn')?.addEventListener('click', () => this.updateStudent());
            document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.cancelEdit());
            document.getElementById('resetFormBtn')?.addEventListener('click', () => this.resetAdmissionForm());
            
            document.getElementById('capturePhotoBtn')?.addEventListener('click', () => this.captureImage('photo', 'photoPreview'));
            document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => this.uploadImage('photo', 'photoPreview'));
            document.getElementById('captureAadharBtn')?.addEventListener('click', () => this.captureImage('aadharDoc', 'aadharPreview'));
            document.getElementById('uploadAadharBtn')?.addEventListener('click', () => this.uploadImage('aadharDoc', 'aadharPreview'));
            
            document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        }

        setupClearButtons() {
            document.getElementById('clearPhotoBtn')?.addEventListener('click', () => {
                document.getElementById('photo').value = '';
                const preview = document.getElementById('photoPreview');
                preview.style.display = 'none';
                preview.src = '';
            });
            document.getElementById('clearAadharBtn')?.addEventListener('click', () => {
                document.getElementById('aadharDoc').value = '';
                const preview = document.getElementById('aadharPreview');
                preview.style.display = 'none';
                preview.src = '';
            });
        }

        setupAutoStudentIdFromAadhar() {
            const aadharInput = document.getElementById('aadharNumber');
            const studentIdField = document.getElementById('studentIdField');
            
            if (aadharInput && studentIdField) {
                aadharInput.addEventListener('input', (e) => {
                    let value = e.target.value;
                    value = value.replace(/[^0-9]/g, '');
                    if (value.length > 12) value = value.slice(0, 12);
                    aadharInput.value = value;
                    studentIdField.value = value;
                });
                
                aadharInput.addEventListener('blur', () => {
                    if (aadharInput.value.length !== 12 && aadharInput.value.length > 0) {
                        showAlert('Aadhar number must be exactly 12 digits!', 'warning', 2000);
                    }
                    studentIdField.value = aadharInput.value;
                });
            }
        }

        setupParentTypeToggle() {
            const parentType = document.getElementById('parentType');
            if (parentType) {
                parentType.addEventListener('change', () => {
                    const type = parentType.value;
                    document.getElementById('fatherFields').style.display = type === 'Father' ? 'block' : 'none';
                    document.getElementById('motherFields').style.display = type === 'Mother' ? 'block' : 'none';
                    document.getElementById('guardianFields').style.display = type === 'Guardian' ? 'block' : 'none';
                });
            }
        }

        switchTab(tab) {
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.dataset.pane === tab);
            });
            
            if (tab === 'new-admission') {
                this.cancelEdit();
            }
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

        async loadStudents() {
            try {
                const response = await this.apiCall('/students');
                if (response.success) {
                    this.students = response.data || [];
                    this.renderStudentsGrid();
                } else {
                    this.students = [];
                    this.renderStudentsGrid();
                }
            } catch (err) {
                console.error('Load students error:', err);
                this.students = [];
                this.renderStudentsGrid();
            }
        }

        async loadOldStudents() {
            try {
                const response = await this.apiCall('/old-students');
                if (response.success) {
                    this.oldStudents = response.data || [];
                    this.renderOldStudentsGrid();
                } else {
                    this.oldStudents = [];
                    this.renderOldStudentsGrid();
                }
            } catch (err) {
                console.error('Load old students error:', err);
                this.oldStudents = [];
                this.renderOldStudentsGrid();
            }
        }

        renderStudentsGrid() {
            const board = document.getElementById('filterBoard')?.value || 'all';
            const classVal = document.getElementById('filterClass')?.value || 'all';
            const session = document.getElementById('filterSession')?.value || 'all';
            const search = document.getElementById('searchStudent')?.value.toLowerCase() || '';
            
            let filtered = this.students || [];
            if (board !== 'all') filtered = filtered.filter(s => s.education?.board === board);
            if (classVal !== 'all') filtered = filtered.filter(s => s.education?.class === classVal);
            if (session !== 'all') filtered = filtered.filter(s => s.currentSession?.sessionName === session);
            if (search) filtered = filtered.filter(s => 
                (s.studentId || '').includes(search) || 
                `${s.studentName?.first || ''} ${s.studentName?.last || ''}`.toLowerCase().includes(search)
            );
            
            const grid = document.getElementById('studentsGrid');
            if (!grid) return;
            
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state">📭 No students found. Click "Create Demo Student" to add one!</div>';
                return;
            }
            
            grid.innerHTML = filtered.map(s => `
                <div class="student-card" data-id="${s.studentId}">
                    <div class="student-card-header">
                        <img src="${s.photo || DEFAULT_PHOTO}" class="student-card-img" onerror="this.src='${DEFAULT_PHOTO}'">
                        <div class="student-card-name">${s.studentName?.first || ''} ${s.studentName?.last || ''}</div>
                        <div class="student-card-id">${s.studentId || '-'}</div>
                    </div>
                    <div class="student-card-body">
                        <div class="student-card-info"><span>📞 Mobile:</span><span>${s.studentMobile || '-'}</span></div>
                        <div class="student-card-info"><span>📚 Class:</span><span>${s.education?.class || '-'}</span></div>
                        <div class="student-card-info"><span>📅 Session:</span><span>${s.currentSession?.sessionName || '-'}</span></div>
                        <div class="student-card-info"><span>💰 Status:</span><span>${s.accountStatus?.isBlocked ? '<span class="badge-blocked">Blocked</span>' : '<span class="badge-active">Active</span>'}</span></div>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('#studentsGrid .student-card').forEach(card => {
                card.addEventListener('click', () => this.showStudentDashboard(card.dataset.id, false));
            });
        }

        renderOldStudentsGrid() {
            const board = document.getElementById('oldFilterBoard')?.value || 'all';
            const classVal = document.getElementById('oldFilterClass')?.value || 'all';
            const session = document.getElementById('oldFilterSession')?.value || 'all';
            const search = document.getElementById('searchOld')?.value.toLowerCase() || '';
            
            let filtered = this.oldStudents || [];
            if (board !== 'all') filtered = filtered.filter(s => s.education?.board === board);
            if (classVal !== 'all') filtered = filtered.filter(s => s.education?.class === classVal);
            if (session !== 'all') filtered = filtered.filter(s => s.completedSession?.sessionName === session);
            if (search) filtered = filtered.filter(s => 
                (s.studentId || '').includes(search) || 
                `${s.studentName?.first || ''} ${s.studentName?.last || ''}`.toLowerCase().includes(search)
            );
            
            const grid = document.getElementById('oldStudentsGrid');
            if (!grid) return;
            
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state">📦 No old students found</div>';
                return;
            }
            
            grid.innerHTML = filtered.map(s => `
                <div class="student-card" data-id="${s.studentId}">
                    <div class="student-card-header">
                        <img src="${s.photo || DEFAULT_PHOTO}" class="student-card-img" onerror="this.src='${DEFAULT_PHOTO}'">
                        <div class="student-card-name">${s.studentName?.first || ''} ${s.studentName?.last || ''}</div>
                        <div class="student-card-id">${s.studentId || '-'}</div>
                    </div>
                    <div class="student-card-body">
                        <div class="student-card-info"><span>📞 Mobile:</span><span>${s.studentMobile || '-'}</span></div>
                        <div class="student-card-info"><span>📚 Class:</span><span>${s.education?.class || '-'}</span></div>
                        <div class="student-card-info"><span>📅 Completed:</span><span>${formatDate(s.sessionCompletedAt)}</span></div>
                        <div class="student-card-info"><span>💰 Paid:</span><span>₹${(s.totalFeesPaid || 0).toLocaleString()}</span></div>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('#oldStudentsGrid .student-card').forEach(card => {
                card.addEventListener('click', () => this.showStudentDashboard(card.dataset.id, true));
            });
        }

        async createDemoStudent() {
            try {
                // Check if demo student already exists
                const existing = this.students?.find(s => s.studentId === '123456789012');
                if (existing) {
                    showAlert('Demo student already exists!', 'info');
                    this.switchTab('students');
                    return;
                }
                
                showAlert('Creating demo student...', 'info');
                
                const demoData = {
                    studentId: "123456789012",
                    aadharNumber: "123456789012",
                    studentName: { first: "Rahul", middle: "", last: "Sharma" },
                    studentMobile: "9876543210",
                    email: "rahul@example.com",
                    parentType: "Father",
                    fatherName: { first: "Rajesh", last: "Sharma" },
                    fatherMobile: "9876543210",
                    motherName: { first: "", last: "" },
                    motherMobile: "",
                    guardianName: { first: "", last: "" },
                    guardianMobile: "",
                    guardianRelation: "",
                    education: { board: "CBSE", class: "10th" },
                    monthlyFees: 2000,
                    joiningDate: new Date().toISOString().split('T')[0],
                    address: { current: "123 Main Street, Delhi", permanent: "123 Main Street, Delhi" },
                    photo: DEFAULT_PHOTO,
                    aadharDocument: DEFAULT_PHOTO
                };
                
                const response = await this.apiCall('/students/register', {
                    method: 'POST',
                    body: JSON.stringify(demoData)
                });
                
                if (response.success) {
                    showAlert('✅ Demo student created! ID: 123456789012, Password: 789012', 'success', 5000);
                    await this.loadStudents();
                    this.switchTab('students');
                } else {
                    showAlert('Failed to create demo student: ' + response.message, 'error');
                }
            } catch (err) {
                showAlert('Error creating demo student', 'error');
            }
        }

        // ========== OPEN EDIT POPUP MODAL ==========
        openEditPopup(student) {
            currentEditStudentId = student.studentId;
            
            // Create edit form HTML
            const editFormHtml = `
                <form id="editStudentForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Session *</label>
                            <select id="editSession" class="form-control" required>
                                ${allSessions.map(s => `<option value="${s}" ${student.currentSession?.sessionName === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Joining Date *</label>
                            <input type="date" id="editJoiningDate" class="form-control" value="${student.joiningDate ? student.joiningDate.split('T')[0] : ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row-3">
                        <div class="form-group">
                            <label>First Name *</label>
                            <input type="text" id="editFirstName" class="form-control" value="${student.studentName?.first || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Middle Name</label>
                            <input type="text" id="editMiddleName" class="form-control" value="${student.studentName?.middle || ''}">
                        </div>
                        <div class="form-group">
                            <label>Last Name *</label>
                            <input type="text" id="editLastName" class="form-control" value="${student.studentName?.last || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Aadhar Number (ID) *</label>
                            <input type="text" id="editAadharNumber" class="form-control" value="${student.aadharNumber || student.studentId || ''}" disabled>
                            <small style="color: #dc3545;">Aadhar number cannot be changed</small>
                        </div>
                        <div class="form-group">
                            <label>Student ID *</label>
                            <input type="text" id="editStudentId" class="form-control" value="${student.studentId || ''}" disabled>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Student Mobile *</label>
                            <input type="tel" id="editStudentMobile" class="form-control" value="${student.studentMobile || ''}" required pattern="[0-9]{10}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="editEmail" class="form-control" value="${student.email || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Parent Type *</label>
                        <select id="editParentType" class="form-control">
                            <option value="Father" ${student.parentType === 'Father' ? 'selected' : ''}>Father</option>
                            <option value="Mother" ${student.parentType === 'Mother' ? 'selected' : ''}>Mother</option>
                            <option value="Guardian" ${student.parentType === 'Guardian' ? 'selected' : ''}>Guardian</option>
                        </select>
                    </div>
                    
                    <div id="editFatherFields" style="display: ${student.parentType === 'Father' ? 'block' : 'none'};">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Father Name *</label>
                                <input type="text" id="editFatherName" class="form-control" value="${student.fatherName?.first || ''}">
                            </div>
                            <div class="form-group">
                                <label>Father Mobile *</label>
                                <input type="tel" id="editFatherMobile" class="form-control" value="${student.fatherMobile || ''}">
                            </div>
                        </div>
                    </div>
                    
                    <div id="editMotherFields" style="display: ${student.parentType === 'Mother' ? 'block' : 'none'};">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mother Name *</label>
                                <input type="text" id="editMotherName" class="form-control" value="${student.motherName?.first || ''}">
                            </div>
                            <div class="form-group">
                                <label>Mother Mobile *</label>
                                <input type="tel" id="editMotherMobile" class="form-control" value="${student.motherMobile || ''}">
                            </div>
                        </div>
                    </div>
                    
                    <div id="editGuardianFields" style="display: ${student.parentType === 'Guardian' ? 'block' : 'none'};">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Guardian Name *</label>
                                <input type="text" id="editGuardianName" class="form-control" value="${student.guardianName?.first || ''}">
                            </div>
                            <div class="form-group">
                                <label>Guardian Mobile *</label>
                                <input type="tel" id="editGuardianMobile" class="form-control" value="${student.guardianMobile || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Relation *</label>
                            <input type="text" id="editGuardianRelation" class="form-control" value="${student.guardianRelation || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Board *</label>
                            <select id="editBoard" class="form-control">
                                ${allBoards.map(b => `<option value="${b}" ${student.education?.board === b ? 'selected' : ''}>${b}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Class *</label>
                            <select id="editClass" class="form-control">
                                ${allClasses.map(c => `<option value="${c}" ${student.education?.class === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Monthly Fees (₹) *</label>
                        <input type="number" id="editMonthlyFees" class="form-control" value="${student.monthlyFees || 1000}" required min="0" step="100">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Student Photo</label>
                            <input type="hidden" id="editPhoto">
                            <img id="editPhotoPreview" class="image-preview" src="${student.photo || DEFAULT_PHOTO}" style="display:block; cursor:pointer;" onclick="document.getElementById('editUploadPhotoInput').click()">
                            <input type="file" id="editUploadPhotoInput" accept="image/*" style="display:none;">
                            <div class="image-actions">
                                <button type="button" class="btn btn-primary btn-sm" id="editCapturePhotoBtn">📷 Capture</button>
                                <button type="button" class="btn btn-info btn-sm" id="editUploadPhotoBtn">📁 Upload</button>
                                <button type="button" class="btn btn-secondary btn-sm" id="editClearPhotoBtn">🗑️ Clear</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Aadhar Document</label>
                            <input type="hidden" id="editAadharDoc">
                            <img id="editAadharPreview" class="image-preview" src="${student.aadharDocument || DEFAULT_PHOTO}" style="display:block; cursor:pointer;" onclick="document.getElementById('editUploadAadharInput').click()">
                            <input type="file" id="editUploadAadharInput" accept="image/*" style="display:none;">
                            <div class="image-actions">
                                <button type="button" class="btn btn-primary btn-sm" id="editCaptureAadharBtn">📷 Capture</button>
                                <button type="button" class="btn btn-info btn-sm" id="editUploadAadharBtn">📁 Upload</button>
                                <button type="button" class="btn btn-secondary btn-sm" id="editClearAadharBtn">🗑️ Clear</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Current Address *</label>
                        <textarea id="editCurrentAddress" class="form-control" rows="2">${student.address?.current || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Permanent Address</label>
                        <textarea id="editPermanentAddress" class="form-control" rows="2">${student.address?.permanent || ''}</textarea>
                    </div>
                </form>
            `;
            
            document.getElementById('editModalStudentId').innerText = student.studentId;
            document.getElementById('editModalBody').innerHTML = editFormHtml;
            
            // Setup edit form event listeners
            this.setupEditFormEvents(student);
            
            document.getElementById('editStudentModal').classList.add('active');
        }
        
        setupEditFormEvents(student) {
            // Parent type toggle in edit modal
            const editParentType = document.getElementById('editParentType');
            if (editParentType) {
                editParentType.addEventListener('change', () => {
                    const type = editParentType.value;
                    document.getElementById('editFatherFields').style.display = type === 'Father' ? 'block' : 'none';
                    document.getElementById('editMotherFields').style.display = type === 'Mother' ? 'block' : 'none';
                    document.getElementById('editGuardianFields').style.display = type === 'Guardian' ? 'block' : 'none';
                });
            }
            
            // Photo handling in edit modal
            const editPhotoInput = document.getElementById('editUploadPhotoInput');
            const editPhotoPreview = document.getElementById('editPhotoPreview');
            
            document.getElementById('editCapturePhotoBtn')?.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = async (e) => {
                    if (e.target.files && e.target.files[0]) {
                        const compressed = await this.compressImage(e.target.files[0]);
                        document.getElementById('editPhoto').value = compressed;
                        editPhotoPreview.src = compressed;
                        editPhotoPreview.style.display = 'block';
                        showAlert('Photo captured successfully!', 'success');
                    }
                };
                input.click();
            });
            
            document.getElementById('editUploadPhotoBtn')?.addEventListener('click', () => {
                editPhotoInput.click();
            });
            
            editPhotoInput?.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const compressed = await this.compressImage(e.target.files[0]);
                    document.getElementById('editPhoto').value = compressed;
                    editPhotoPreview.src = compressed;
                    showAlert('Photo uploaded successfully!', 'success');
                }
            });
            
            document.getElementById('editClearPhotoBtn')?.addEventListener('click', () => {
                document.getElementById('editPhoto').value = '';
                editPhotoPreview.src = DEFAULT_PHOTO;
            });
            
            // Aadhar document handling in edit modal
            const editAadharInput = document.getElementById('editUploadAadharInput');
            const editAadharPreview = document.getElementById('editAadharPreview');
            
            document.getElementById('editCaptureAadharBtn')?.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = async (e) => {
                    if (e.target.files && e.target.files[0]) {
                        const compressed = await this.compressImage(e.target.files[0]);
                        document.getElementById('editAadharDoc').value = compressed;
                        editAadharPreview.src = compressed;
                        showAlert('Aadhar captured successfully!', 'success');
                    }
                };
                input.click();
            });
            
            document.getElementById('editUploadAadharBtn')?.addEventListener('click', () => {
                editAadharInput.click();
            });
            
            editAadharInput?.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const compressed = await this.compressImage(e.target.files[0]);
                    document.getElementById('editAadharDoc').value = compressed;
                    editAadharPreview.src = compressed;
                    showAlert('Aadhar uploaded successfully!', 'success');
                }
            });
            
            document.getElementById('editClearAadharBtn')?.addEventListener('click', () => {
                document.getElementById('editAadharDoc').value = '';
                editAadharPreview.src = DEFAULT_PHOTO;
            });
        }
        
        async saveEditFromModal() {
            if (!currentEditStudentId) {
                showAlert('No student selected for edit', 'error');
                return;
            }
            
            const parentType = document.getElementById('editParentType').value;
            
            const studentData = {
                studentId: currentEditStudentId,
                studentName: {
                    first: document.getElementById('editFirstName').value,
                    middle: document.getElementById('editMiddleName').value || '',
                    last: document.getElementById('editLastName').value
                },
                studentMobile: document.getElementById('editStudentMobile').value,
                email: document.getElementById('editEmail').value || '',
                parentType: parentType,
                education: {
                    board: document.getElementById('editBoard').value,
                    class: document.getElementById('editClass').value
                },
                monthlyFees: parseInt(document.getElementById('editMonthlyFees').value),
                address: {
                    current: document.getElementById('editCurrentAddress').value,
                    permanent: document.getElementById('editPermanentAddress').value || document.getElementById('editCurrentAddress').value
                },
                photo: document.getElementById('editPhoto').value || DEFAULT_PHOTO,
                aadharDocument: document.getElementById('editAadharDoc').value || DEFAULT_PHOTO,
                currentSession: {
                    sessionName: document.getElementById('editSession').value
                },
                joiningDate: document.getElementById('editJoiningDate').value
            };
            
            if (parentType === 'Father') {
                studentData.fatherName = { first: document.getElementById('editFatherName').value, last: '' };
                studentData.fatherMobile = document.getElementById('editFatherMobile').value;
            } else if (parentType === 'Mother') {
                studentData.motherName = { first: document.getElementById('editMotherName').value, last: '' };
                studentData.motherMobile = document.getElementById('editMotherMobile').value;
            } else if (parentType === 'Guardian') {
                studentData.guardianName = { first: document.getElementById('editGuardianName').value, last: '' };
                studentData.guardianMobile = document.getElementById('editGuardianMobile').value;
                studentData.guardianRelation = document.getElementById('editGuardianRelation').value;
            }
            
            try {
                const response = await this.apiCall(`/students/${currentEditStudentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(studentData)
                });
                
                if (response.success) {
                    showAlert('✅ Student updated successfully!', 'success');
                    closeModal('editStudentModal');
                    await this.loadStudents();
                    // Refresh dashboard if open
                    if (currentViewStudent && currentViewStudent.studentId === currentEditStudentId) {
                        await this.showStudentDashboard(currentEditStudentId, false);
                    }
                } else {
                    showAlert(response.message || 'Update failed', 'error');
                }
            } catch (err) {
                showAlert('Error updating student: ' + err.message, 'error');
            }
        }
        
        // ========== VIEW DOCUMENT ==========
        viewDocument(imageUrl, title) {
            const docViewerImage = document.getElementById('docViewerImage');
            const docViewerTitle = document.getElementById('docViewerTitle');
            docViewerImage.src = imageUrl;
            docViewerTitle.innerText = title;
            this.currentDocumentUrl = imageUrl;
            document.getElementById('documentViewerModal').classList.add('active');
        }
        
        downloadCurrentDocument() {
            if (this.currentDocumentUrl) {
                const link = document.createElement('a');
                link.href = this.currentDocumentUrl;
                link.download = 'document.jpg';
                link.click();
            }
        }

        async showStudentDashboard(studentId, isOld = false) {
            try {
                showAlert('Loading student data...', 'info');
                
                let student;
                if (isOld) {
                    student = this.oldStudents?.find(s => s.studentId === studentId);
                } else {
                    const response = await this.apiCall(`/students/${studentId}`);
                    if (response.success && response.data) {
                        student = response.data;
                    }
                }
                
                if (!student) {
                    showAlert('Student not found!', 'error');
                    return;
                }
                
                currentViewStudent = student;
                this.renderDashboard(student, isOld);
                document.getElementById('dashboardModal').classList.add('active');
            } catch (err) {
                console.error('Dashboard error:', err);
                showAlert('Error loading dashboard: ' + err.message, 'error');
            }
        }

        renderDashboard(student, isOld = false) {
            const body = document.getElementById('dashboardBody');
            const footer = document.getElementById('dashboardFooter');
            if (!body) return;
            
            const studentName = `${student.studentName?.first || ''} ${student.studentName?.last || ''}`.trim() || 'N/A';
            const studentId = student.studentId || 'N/A';
            const studentMobile = student.studentMobile || 'N/A';
            const board = student.education?.board || 'N/A';
            const className = student.education?.class || 'N/A';
            const sessionName = student.currentSession?.sessionName || student.completedSession?.sessionName || 'N/A';
            const monthlyFees = student.monthlyFees || 0;
            
            const feesHistory = student.feesHistory || [];
            const totalFees = feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            const paidFees = feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            const dueFees = totalFees - paidFees;
            
            const attendance = student.attendance || [];
            const totalDays = attendance.length;
            const presentDays = attendance.filter(a => a.status === 'present').length;
            const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
            
            const isBlocked = student.accountStatus?.isBlocked || false;
            const blockReason = student.accountStatus?.blockReason || '';
            
            const months = this.getLast12Months();
            const attendanceData = this.getAttendanceData(student, months);
            const feesData = this.getFeesData(student, months);
            
            body.innerHTML = `
                <div class="dashboard-container">
                    <div class="dashboard-header">
                        <div style="position: relative;">
                            <img src="${student.photo || DEFAULT_PHOTO}" class="student-photo-large" onerror="this.src='${DEFAULT_PHOTO}'" onclick="window.smsInstance.viewDocument('${student.photo || DEFAULT_PHOTO}', 'Student Photo - ${studentName}')">
                            <div style="text-align: center; margin-top: 5px;">
                                <button class="btn btn-sm btn-info" onclick="window.smsInstance.viewDocument('${student.photo || DEFAULT_PHOTO}', 'Student Photo - ${studentName}')">🔍 View Photo</button>
                            </div>
                        </div>
                        <div class="dashboard-info">
                            <div class="info-row"><div class="info-label">Student ID:</div><div class="info-value"><strong>${studentId}</strong></div></div>
                            <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${studentName}</div></div>
                            <div class="info-row"><div class="info-label">Mobile:</div><div class="info-value">${studentMobile}</div></div>
                            <div class="info-row"><div class="info-label">Board & Class:</div><div class="info-value">${board} - ${className}</div></div>
                            <div class="info-row"><div class="info-label">Session:</div><div class="info-value">${sessionName}</div></div>
                            <div class="info-row"><div class="info-label">Monthly Fees:</div><div class="info-value">₹${monthlyFees}</div></div>
                            <div class="info-row"><div class="info-label">Status:</div><div class="info-value">${isBlocked ? `<span class="badge-blocked">🔴 BLOCKED - ${blockReason}</span>` : '<span class="badge-active">🟢 ACTIVE</span>'}</div></div>
                            <div class="info-row"><div class="info-label">Aadhar Document:</div><div class="info-value"><button class="btn btn-sm btn-info" onclick="window.smsInstance.viewDocument('${student.aadharDocument || DEFAULT_PHOTO}', 'Aadhar Document - ${studentName}')">📄 View Aadhar</button></div></div>
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white;">
                            <h3>₹${paidFees.toLocaleString()}</h3><p>Total Paid</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #dc3545, #c82333); color: white;">
                            <h3>₹${dueFees.toLocaleString()}</h3><p>Total Due</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #28a745, #20c997); color: white;">
                            <h3>${attendancePercent}%</h3><p>Attendance</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #ffc107, #fd7e14); color: #333;">
                            <h3>${totalDays}</h3><p>Total Days</p>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📊 Monthly Attendance (Last 12 Months)</div>
                        <canvas id="attendanceChart" style="height: 300px; width: 100%;"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">💰 Fees Payment (Paid vs Due)</div>
                        <canvas id="feesChart" style="height: 300px; width: 100%;"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📉 Fees Due Trend</div>
                        <canvas id="dueTrendChart" style="height: 300px; width: 100%;"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📋 Fees History</div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead><tr><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody id="feesTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📅 Recent Attendance</div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th></tr></thead>
                                <tbody id="attendanceTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">🔴 Block History</div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead><tr><th>Blocked From</th><th>Blocked Until</th><th>Reason</th><th>Unblocked</th></tr></thead>
                                <tbody id="blockHistoryBody"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-info" id="markAttendanceBtn">📅 Mark Attendance</button>
                        <button class="btn btn-success" id="payFeesBtn">💰 Pay Fees</button>
                        ${!isOld ? `<button class="btn btn-primary" id="editStudentDashboardBtn">✏️ Edit Student</button>` : ''}
                    </div>
                </div>
            `;
            
            this.populateFeesTable(feesHistory, student.studentId);
            this.populateAttendanceTable(attendance);
            this.populateBlockHistory(student.blockHistory || []);
            
            setTimeout(() => {
                this.renderAttendanceChart(attendanceData, months);
                this.renderFeesChart(feesData, months);
                this.renderDueTrendChart(feesData, months);
            }, 100);
            
            footer.innerHTML = `
                ${!isOld ? `<button class="btn btn-danger" id="deleteStudentBtn">🗑️ Delete Student</button>` : ''}
                ${!isOld && !isBlocked ? `<button class="btn btn-warning" id="blockStudentBtn">🔴 Block Student</button>` : ''}
                ${!isOld && isBlocked ? `<button class="btn btn-success" id="unblockStudentBtn">🟢 Unblock Student</button>` : ''}
                <button class="btn btn-info" id="exportReportBtn">📎 Export Report</button>
                <button class="btn btn-secondary" id="closeDashboardFooterBtn">Close</button>
            `;
            
            document.getElementById('deleteStudentBtn')?.addEventListener('click', () => this.deleteStudent(student.studentId));
            document.getElementById('blockStudentBtn')?.addEventListener('click', () => this.blockStudent(student.studentId));
            document.getElementById('unblockStudentBtn')?.addEventListener('click', () => this.unblockStudent(student.studentId));
            document.getElementById('editStudentDashboardBtn')?.addEventListener('click', () => this.openEditPopup(student));
            document.getElementById('exportReportBtn')?.addEventListener('click', () => this.exportStudentReport(student));
            document.getElementById('closeDashboardFooterBtn')?.addEventListener('click', () => closeModal('dashboardModal'));
            document.getElementById('markAttendanceBtn')?.addEventListener('click', () => this.openAttendanceModal(student.studentId));
            document.getElementById('payFeesBtn')?.addEventListener('click', () => this.openFeesModal(student));
        }

        populateFeesTable(feesHistory, studentId) {
            const tbody = document.getElementById('feesTableBody');
            if (!tbody) return;
            
            if (!feesHistory || feesHistory.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No fees records found</td></tr>';
                return;
            }
            
            tbody.innerHTML = feesHistory.map(f => `
                <tr>
                    <td>${f.month || '-'} ${f.year || ''}</td>
                    <td>₹${f.amount || 0}</td>
                    <td>₹${f.paidAmount || 0}</td>
                    <td>₹${f.dueAmount || 0}</td>
                    <td>${getStatusBadge(f.status)}</td>
                    <td>
                        ${f.status !== 'paid' ? `<button class="btn btn-success btn-sm pay-fee-btn" data-month="${f.month}" data-year="${f.year}" data-due="${f.dueAmount}">Pay</button>` : '-'}
                    </td>
                </tr>
            `).join('');
            
            document.querySelectorAll('.pay-fee-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const month = btn.dataset.month;
                    const year = btn.dataset.year;
                    const due = btn.dataset.due;
                    this.openFeesModalWithMonth(currentViewStudent, month, year, due);
                });
            });
        }

        populateAttendanceTable(attendance) {
            const tbody = document.getElementById('attendanceTableBody');
            if (!tbody) return;
            
            if (!attendance || attendance.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No attendance records found</td></tr>';
                return;
            }
            
            const recent = [...attendance].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
            tbody.innerHTML = recent.map(a => `
                <tr>
                    <td>${formatDate(a.date)}</td>
                    <td>${a.status || '-'}</td>
                    <td>${a.checkInTime || '-'}</td>
                    <td>${a.checkOutTime || '-'}</td>
                </tr>
            `).join('');
        }

        populateBlockHistory(blockHistory) {
            const tbody = document.getElementById('blockHistoryBody');
            if (!tbody) return;
            
            if (!blockHistory || blockHistory.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No block history</td></tr>';
                return;
            }
            
            tbody.innerHTML = blockHistory.map(b => `
                <tr>
                    <td>${formatDate(b.blockedFrom)}</td>
                    <td>${b.blockedUntil ? formatDate(b.blockedUntil) : 'Permanent'}</td>
                    <td>${b.reason || '-'}</td>
                    <td>${b.unblockedAt ? formatDate(b.unblockedAt) : 'Still Blocked'}</td>
                </tr>
            `).join('');
        }

        getLast12Months() {
            const months = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                months.push({
                    name: d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear(),
                    monthIndex: d.getMonth(),
                    year: d.getFullYear()
                });
            }
            return months;
        }

        getAttendanceData(student, months) {
            const attendance = student.attendance || [];
            return months.map(m => {
                const monthAttendance = attendance.filter(a => {
                    const d = new Date(a.date);
                    return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
                });
                const present = monthAttendance.filter(a => a.status === 'present').length;
                const total = monthAttendance.length;
                return total > 0 ? (present / total) * 100 : 0;
            });
        }

        getFeesData(student, months) {
            const feesHistory = student.feesHistory || [];
            return months.map(m => {
                const fee = feesHistory.find(f => f.monthIndex === m.monthIndex && f.year === m.year);
                return {
                    paid: fee?.paidAmount || 0,
                    due: fee?.dueAmount || 0,
                    amount: fee?.amount || 0
                };
            });
        }

        renderAttendanceChart(data, months) {
            const canvas = document.getElementById('attendanceChart');
            if (!canvas) return;
            
            try {
                if (charts.attendance) charts.attendance.destroy();
                const ctx = canvas.getContext('2d');
                charts.attendance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: months.map(m => m.name),
                        datasets: [{
                            label: 'Attendance %',
                            data: data,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true, scales: { y: { min: 0, max: 100, title: { display: true, text: 'Percentage (%)' } } } }
                });
            } catch (err) {
                console.error('Chart error:', err);
            }
        }

        renderFeesChart(data, months) {
            const canvas = document.getElementById('feesChart');
            if (!canvas) return;
            
            try {
                if (charts.fees) charts.fees.destroy();
                const ctx = canvas.getContext('2d');
                charts.fees = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: months.map(m => m.name),
                        datasets: [
                            { label: 'Paid Amount (₹)', data: data.map(d => d.paid), backgroundColor: '#28a745' },
                            { label: 'Due Amount (₹)', data: data.map(d => d.due), backgroundColor: '#dc3545' }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } } } }
                });
            } catch (err) {
                console.error('Chart error:', err);
            }
        }

        renderDueTrendChart(data, months) {
            const canvas = document.getElementById('dueTrendChart');
            if (!canvas) return;
            
            try {
                if (charts.dueTrend) charts.dueTrend.destroy();
                const ctx = canvas.getContext('2d');
                charts.dueTrend = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: months.map(m => m.name),
                        datasets: [{
                            label: 'Due Amount (₹)',
                            data: data.map(d => d.due),
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } } } }
                });
            } catch (err) {
                console.error('Chart error:', err);
            }
        }

        openAttendanceModal(studentId) {
            document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('attendanceStatus').value = 'present';
            document.getElementById('checkInTime').value = '';
            document.getElementById('checkOutTime').value = '';
            document.getElementById('attendanceRemarks').value = '';
            
            const saveBtn = document.getElementById('saveAttendanceBtn');
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.saveAttendance(studentId));
            
            document.getElementById('attendanceModal').classList.add('active');
        }

        async saveAttendance(studentId) {
            const date = document.getElementById('attendanceDate').value;
            const status = document.getElementById('attendanceStatus').value;
            const checkInTime = document.getElementById('checkInTime').value;
            const checkOutTime = document.getElementById('checkOutTime').value;
            const remarks = document.getElementById('attendanceRemarks').value;
            
            if (!date) {
                showAlert('Please select a date', 'error');
                return;
            }
            
            try {
                const response = await this.apiCall(`/students/${studentId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify({ date, status, checkInTime, checkOutTime, remarks })
                });
                
                if (response.success) {
                    showAlert('Attendance marked successfully!', 'success');
                    closeModal('attendanceModal');
                    await this.showStudentDashboard(studentId, false);
                    await this.loadStudents();
                } else {
                    showAlert(response.message || 'Failed to mark attendance', 'error');
                }
            } catch (err) {
                showAlert('Error marking attendance', 'error');
            }
        }

        openFeesModal(student) {
            const feesHistory = student.feesHistory || [];
            const unpaidMonths = feesHistory.filter(f => f.status !== 'paid');
            
            const monthSelect = document.getElementById('feesMonth');
            monthSelect.innerHTML = '<option value="">Select Month</option>';
            
            unpaidMonths.forEach(f => {
                monthSelect.innerHTML += `<option value="${f.month}|${f.year}" data-due="${f.dueAmount}">${f.month} ${f.year} - Due: ₹${f.dueAmount}</option>`;
            });
            
            document.getElementById('feesAmount').value = '';
            document.getElementById('feesRemarks').value = '';
            document.getElementById('feesInfo').innerHTML = '';
            
            monthSelect.onchange = () => {
                const selected = monthSelect.options[monthSelect.selectedIndex];
                const due = selected?.dataset.due || 0;
                document.getElementById('feesInfo').innerHTML = `<strong>Due Amount: ₹${due}</strong>`;
                document.getElementById('feesAmount').max = due;
                if (due > 0) document.getElementById('feesAmount').value = due;
            };
            
            const saveBtn = document.getElementById('saveFeesBtn');
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.saveFees(student.studentId));
            
            document.getElementById('feesModal').classList.add('active');
        }

        openFeesModalWithMonth(student, month, year, due) {
            const monthSelect = document.getElementById('feesMonth');
            monthSelect.innerHTML = `<option value="${month}|${year}" data-due="${due}">${month} ${year} - Due: ₹${due}</option>`;
            
            document.getElementById('feesAmount').value = due;
            document.getElementById('feesRemarks').value = '';
            document.getElementById('feesInfo').innerHTML = `<strong>Due Amount: ₹${due}</strong>`;
            
            const saveBtn = document.getElementById('saveFeesBtn');
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.saveFees(student.studentId));
            
            document.getElementById('feesModal').classList.add('active');
        }

        async saveFees(studentId) {
            const monthSelect = document.getElementById('feesMonth');
            const selectedValue = monthSelect.value;
            if (!selectedValue) {
                showAlert('Please select a month', 'error');
                return;
            }
            
            const [month, year] = selectedValue.split('|');
            const paidAmount = parseInt(document.getElementById('feesAmount').value);
            const remarks = document.getElementById('feesRemarks').value;
            
            if (!paidAmount || paidAmount <= 0) {
                showAlert('Please enter a valid amount', 'error');
                return;
            }
            
            try {
                const response = await this.apiCall(`/students/${studentId}/fees`, {
                    method: 'POST',
                    body: JSON.stringify({ month, year: parseInt(year), paidAmount, remarks })
                });
                
                if (response.success) {
                    showAlert('Fees paid successfully!', 'success');
                    closeModal('feesModal');
                    await this.showStudentDashboard(studentId, false);
                    await this.loadStudents();
                } else {
                    showAlert(response.message || 'Failed to pay fees', 'error');
                }
            } catch (err) {
                showAlert('Error paying fees', 'error');
            }
        }

        async blockStudent(studentId) {
            const reason = prompt('Enter block reason:', 'Non-payment of fees');
            if (!reason) return;
            try {
                const response = await this.apiCall(`/students/${studentId}/block`, {
                    method: 'POST',
                    body: JSON.stringify({ reason })
                });
                if (response.success) {
                    showAlert('Student blocked successfully', 'success');
                    await this.loadStudents();
                    closeModal('dashboardModal');
                } else {
                    showAlert(response.message || 'Block failed', 'error');
                }
            } catch (err) {
                showAlert('Error blocking student', 'error');
            }
        }

        async unblockStudent(studentId) {
            if (!confirm('Are you sure you want to unblock this student?')) return;
            try {
                const response = await this.apiCall(`/students/${studentId}/unblock`, { method: 'POST' });
                if (response.success) {
                    showAlert('Student unblocked successfully', 'success');
                    await this.loadStudents();
                    closeModal('dashboardModal');
                } else {
                    showAlert(response.message || 'Unblock failed', 'error');
                }
            } catch (err) {
                showAlert('Error unblocking student', 'error');
            }
        }

        async deleteStudent(studentId) {
            if (!confirm('Are you sure you want to delete this student? This cannot be undone!')) return;
            try {
                const response = await this.apiCall(`/students/${studentId}`, { method: 'DELETE' });
                if (response.success) {
                    showAlert('Student deleted successfully', 'success');
                    closeModal('dashboardModal');
                    await this.loadStudents();
                } else {
                    showAlert(response.message || 'Delete failed', 'error');
                }
            } catch (err) {
                showAlert('Error deleting student', 'error');
            }
        }

        exportStudentReport(student) {
            const printWindow = window.open('', '_blank');
            const feesHistory = student.feesHistory || [];
            const totalFees = feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            const paidFees = feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            const dueFees = totalFees - paidFees;
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Student Report - ${student.studentId}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #667eea; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #667eea; color: white; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
                        .summary-card { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 10px; flex: 1; text-align: center; }
                        .student-photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Bal Bharti Coaching Center</h1>
                        <h2>Student Report</h2>
                        <img src="${student.photo || DEFAULT_PHOTO}" class="student-photo" onerror="this.src='${DEFAULT_PHOTO}'">
                    </div>
                    <div class="summary">
                        <div class="summary-card"><h3>₹${totalFees.toLocaleString()}</h3><p>Total Fees</p></div>
                        <div class="summary-card"><h3>₹${paidFees.toLocaleString()}</h3><p>Paid Fees</p></div>
                        <div class="summary-card"><h3>₹${dueFees.toLocaleString()}</h3><p>Due Fees</p></div>
                    </div>
                    <h3>Student Details</h3>
                    <table>
                        <tr><th>Field</th><th>Value</th></tr>
                        <tr><td>Student ID</td><td>${student.studentId || '-'}</td></tr>
                        <tr><td>Name</td><td>${student.studentName?.first || ''} ${student.studentName?.last || ''}</td></tr>
                        <tr><td>Mobile</td><td>${student.studentMobile || '-'}</td></tr>
                        <tr><td>Board</td><td>${student.education?.board || '-'}</td></tr>
                        <tr><td>Class</td><td>${student.education?.class || '-'}</td></tr>
                        <tr><td>Session</td><td>${student.currentSession?.sessionName || '-'}</td></tr>
                    </table>
                    <h3>Fees History</h3>
                    <table>
                        <thead><tr><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
                        <tbody>
                            ${feesHistory.map(f => `
                                <tr><td>${f.month} ${f.year}</td><td>₹${f.amount}</td><td>₹${f.paidAmount || 0}</td><td>₹${f.dueAmount || 0}</td><td>${f.status}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="margin-top: 30px; text-align: center;">Generated on: ${new Date().toLocaleString()}</p>
                </body>
                </html>
            `);
            printWindow.print();
        }

        async registerStudent() {
            const aadharNumber = document.getElementById('aadharNumber').value;
            const studentId = aadharNumber;
            
            // Validation
            if (!studentId || studentId.length !== 12) {
                showAlert('Please enter valid 12-digit Aadhar number', 'error');
                return;
            }
            
            if (!document.getElementById('studentMobile').value || document.getElementById('studentMobile').value.length !== 10) {
                showAlert('Please enter valid 10-digit mobile number', 'error');
                return;
            }
            
            if (!document.getElementById('firstName').value || !document.getElementById('lastName').value) {
                showAlert('Please enter student name (first and last)', 'error');
                return;
            }
            
            // Check if student ID already exists
            const existingStudent = this.students?.find(s => s.studentId === studentId);
            if (existingStudent) {
                showAlert(`Student with ID ${studentId} already exists! Please use a different Aadhar number.`, 'error');
                return;
            }
            
            const parentType = document.getElementById('parentType').value;
            
            const studentData = {
                studentId: studentId,
                aadharNumber: studentId,
                aadharDocument: document.getElementById('aadharDoc').value || DEFAULT_PHOTO,
                photo: document.getElementById('photo').value || DEFAULT_PHOTO,
                studentName: {
                    first: document.getElementById('firstName').value,
                    middle: document.getElementById('middleName').value || '',
                    last: document.getElementById('lastName').value
                },
                parentType: parentType,
                studentMobile: document.getElementById('studentMobile').value,
                email: document.getElementById('email').value || '',
                education: {
                    board: document.getElementById('board').value,
                    class: document.getElementById('class').value
                },
                monthlyFees: parseInt(document.getElementById('monthlyFees').value) || 1000,
                joiningDate: document.getElementById('joiningDate').value,
                address: {
                    current: document.getElementById('currentAddress').value,
                    permanent: document.getElementById('permanentAddress').value || document.getElementById('currentAddress').value
                }
            };
            
            // Add parent fields based on selection
            if (parentType === 'Father') {
                studentData.fatherName = { first: document.getElementById('fatherName').value, last: '' };
                studentData.fatherMobile = document.getElementById('fatherMobile').value;
                studentData.motherName = { first: '', last: '' };
                studentData.motherMobile = '';
                studentData.guardianName = { first: '', last: '' };
                studentData.guardianMobile = '';
                studentData.guardianRelation = '';
            } else if (parentType === 'Mother') {
                studentData.motherName = { first: document.getElementById('motherName').value, last: '' };
                studentData.motherMobile = document.getElementById('motherMobile').value;
                studentData.fatherName = { first: '', last: '' };
                studentData.fatherMobile = '';
                studentData.guardianName = { first: '', last: '' };
                studentData.guardianMobile = '';
                studentData.guardianRelation = '';
            } else if (parentType === 'Guardian') {
                studentData.guardianName = { first: document.getElementById('guardianName').value, last: '' };
                studentData.guardianMobile = document.getElementById('guardianMobile').value;
                studentData.guardianRelation = document.getElementById('guardianRelation').value;
                studentData.fatherName = { first: '', last: '' };
                studentData.fatherMobile = '';
                studentData.motherName = { first: '', last: '' };
                studentData.motherMobile = '';
            }
            
            try {
                const response = await this.apiCall('/students/register', {
                    method: 'POST',
                    body: JSON.stringify(studentData)
                });
                
                if (response.success) {
                    const password = studentId.slice(-6);
                    showAlert(`✅ Student registered successfully!\nID: ${studentId}\nPassword: ${password}`, 'success', 8000);
                    this.resetAdmissionForm();
                    await this.loadStudents();
                    this.switchTab('students');
                } else {
                    if (response.message?.includes('duplicate') || response.message?.includes('already exists')) {
                        showAlert(`Student with ID ${studentId} already exists! Please use a different Aadhar number.`, 'error');
                    } else {
                        showAlert(response.message || 'Registration failed', 'error');
                    }
                }
            } catch (err) {
                showAlert('Error registering student: ' + err.message, 'error');
            }
        }

        async updateStudent() {
            if (!currentEditStudentId) {
                showAlert('No student selected for edit', 'error');
                return;
            }
            
            const parentType = document.getElementById('parentType').value;
            
            const studentData = {
                studentId: currentEditStudentId,
                studentName: {
                    first: document.getElementById('firstName').value,
                    middle: document.getElementById('middleName').value || '',
                    last: document.getElementById('lastName').value
                },
                studentMobile: document.getElementById('studentMobile').value,
                email: document.getElementById('email').value || '',
                parentType: parentType,
                education: {
                    board: document.getElementById('board').value,
                    class: document.getElementById('class').value
                },
                monthlyFees: parseInt(document.getElementById('monthlyFees').value),
                address: {
                    current: document.getElementById('currentAddress').value,
                    permanent: document.getElementById('permanentAddress').value || document.getElementById('currentAddress').value
                },
                photo: document.getElementById('photo').value || DEFAULT_PHOTO,
                aadharDocument: document.getElementById('aadharDoc').value || DEFAULT_PHOTO
            };
            
            if (parentType === 'Father') {
                studentData.fatherName = { first: document.getElementById('fatherName').value, last: '' };
                studentData.fatherMobile = document.getElementById('fatherMobile').value;
            } else if (parentType === 'Mother') {
                studentData.motherName = { first: document.getElementById('motherName').value, last: '' };
                studentData.motherMobile = document.getElementById('motherMobile').value;
            } else if (parentType === 'Guardian') {
                studentData.guardianName = { first: document.getElementById('guardianName').value, last: '' };
                studentData.guardianMobile = document.getElementById('guardianMobile').value;
                studentData.guardianRelation = document.getElementById('guardianRelation').value;
            }
            
            try {
                const response = await this.apiCall(`/students/${currentEditStudentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(studentData)
                });
                
                if (response.success) {
                    showAlert('✅ Student updated successfully!', 'success');
                    this.cancelEdit();
                    await this.loadStudents();
                    this.switchTab('students');
                } else {
                    showAlert(response.message || 'Update failed', 'error');
                }
            } catch (err) {
                showAlert('Error updating student: ' + err.message, 'error');
            }
        }

        cancelEdit() {
            isEditMode = false;
            currentEditStudentId = null;
            document.getElementById('formTitle').innerText = '📝 Register New Student';
            document.getElementById('editModeIndicator').style.display = 'none';
            document.getElementById('registerStudentBtn').style.display = 'inline-flex';
            document.getElementById('updateStudentBtn').style.display = 'none';
            document.getElementById('cancelEditBtn').style.display = 'none';
            this.resetAdmissionForm();
        }

        resetAdmissionForm() {
            const form = document.getElementById('admissionForm');
            if (form) form.reset();
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('photo').value = '';
            document.getElementById('aadharDoc').value = '';
            document.getElementById('photoPreview').style.display = 'none';
            document.getElementById('aadharPreview').style.display = 'none';
            document.getElementById('photoPreview').src = '';
            document.getElementById('aadharPreview').src = '';
            document.getElementById('studentIdField').value = '';
            document.getElementById('aadharNumber').value = '';
            document.getElementById('monthlyFees').value = '1000';
            
            // Reset parent fields visibility
            document.getElementById('fatherFields').style.display = 'block';
            document.getElementById('motherFields').style.display = 'none';
            document.getElementById('guardianFields').style.display = 'none';
        }

        async captureImage(fieldId, previewId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = async (e) => {
                if (e.target.files && e.target.files[0]) {
                    try {
                        const compressed = await this.compressImage(e.target.files[0]);
                        document.getElementById(fieldId).value = compressed;
                        const preview = document.getElementById(previewId);
                        if (preview) {
                            preview.src = compressed;
                            preview.style.display = 'block';
                        }
                        showAlert('Image captured successfully!', 'success');
                    } catch (err) {
                        showAlert('Error processing image', 'error');
                    }
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
                    try {
                        const compressed = await this.compressImage(e.target.files[0]);
                        document.getElementById(fieldId).value = compressed;
                        const preview = document.getElementById(previewId);
                        if (preview) {
                            preview.src = compressed;
                            preview.style.display = 'block';
                        }
                        showAlert('Image uploaded successfully!', 'success');
                    } catch (err) {
                        showAlert('Error processing image', 'error');
                    }
                }
            };
            input.click();
        }

        async compressImage(file, maxSizeKB = 15) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;
                        let quality = 0.7;
                        
                        const maxDimension = 200;
                        if (width > height && width > maxDimension) {
                            height = (height * maxDimension) / width;
                            width = maxDimension;
                        } else if (height > maxDimension) {
                            width = (width * maxDimension) / height;
                            height = maxDimension;
                        }
                        
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        let result = canvas.toDataURL('image/jpeg', quality);
                        
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

        logout() {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        const sms = new StudentManagementSystem();
        window.smsInstance = sms;
    });
})();
