// ============================================
// STUDENT-MANAGEMENT.JS - COMPLETE VERSION
// WITH ALL FIELDS - SESSION PROMOTION - RE-ADMISSION
// ============================================

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const API_BASE_URL = window.location.origin + '/api';
    let studentsData = [];
    let oldStudentsData = [];
    let currentViewStudent = null;
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

    const allSessions = (() => {
        const sessions = [];
        for (let year = 2024; year <= 2050; year++) {
            sessions.push(`${year}-${year + 1}`);
        }
        return sessions;
    })();

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const genders = ['Male', 'Female', 'Other'];

    const DEFAULT_PHOTO = 'https://placehold.co/100x100/667eea/white?text=👤';

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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

    function formatDateTime(date) {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleString('en-IN');
        } catch(e) {
            return '-';
        }
    }

    function getStatusBadge(status) {
        if (status === 'paid') return '<span class="badge-paid">✅ Paid</span>';
        if (status === 'partial') return '<span class="badge-partial">⚠️ Partial</span>';
        return '<span class="badge-unpaid">❌ Unpaid</span>';
    }

    function isSessionEndingSoon(endDate) {
        if (!endDate) return false;
        const today = new Date();
        const end = new Date(endDate);
        const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30 && daysLeft > 0;
    }

    function isSessionExpired(endDate) {
        if (!endDate) return false;
        const today = new Date();
        const end = new Date(endDate);
        return today > end;
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
            display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
        .student-photo-large {
            width: 120px; height: 120px; border-radius: 50%;
            object-fit: cover; border: 3px solid #667eea;
            cursor: pointer;
        }
        .dashboard-info {
            flex: 1;
            min-width: 250px;
        }
        .info-row {
            display: grid; grid-template-columns: 160px 1fr;
            margin-bottom: 8px;
            font-size: 0.85rem;
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
        .btn-promote { background: linear-gradient(135deg, #28a745, #20c997); color: white; }
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
        .form-row-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; }
        
        .badge-paid { background: #d4edda; color: #155724; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .badge-partial { background: #fff3cd; color: #856404; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .badge-unpaid { background: #f8d7da; color: #721c24; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        
        .image-preview { 
            width: 100px; height: 100px; border-radius: 10px; 
            object-fit: cover; margin-top: 5px; 
            border: 2px solid #e0e0e0;
            background: #f8f9fa;
        }
        .image-actions { display: flex; gap: 10px; margin-top: 5px; flex-wrap: wrap; }
        
        .empty-state { text-align: center; padding: 50px; color: #999; }
        .action-buttons { display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; }
        
        .session-warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .session-expired {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .promotion-form, .readmission-form {
            background: #e8f5e9;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .section-title {
            background: #f0f0f0;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 15px 0 10px 0;
            font-weight: bold;
            color: #667eea;
        }
        
        @media (max-width: 768px) {
            .form-row, .form-row-3, .form-row-4 { grid-template-columns: 1fr; }
            .students-grid { grid-template-columns: 1fr; }
            .filter-bar { flex-direction: column; }
            .info-row { grid-template-columns: 1fr; gap: 5px; }
            .sms-wrapper { margin: 10px; border-radius: 15px; }
            .dashboard-header { flex-direction: column; align-items: center; text-align: center; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .btn { padding: 10px 14px; font-size: 0.8rem; }
            .data-table th, .data-table td { padding: 8px; font-size: 0.75rem; }
        }
        
        @media (min-width: 1024px) {
            .students-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }
    `;

    // ========== HTML TEMPLATE ==========
    const htmlTemplate = `
        <div class="sms-wrapper">
            <div class="sms-header">
                <div class="logo">
                    <h1>🎓 Bal Bharti Coaching Center</h1>
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
                
                <!-- NEW ADMISSION TAB - COMPLETE FORM -->
                <div class="tab-pane" data-pane="new-admission">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <h3>📝 <span id="formTitle">Register New Student</span></h3>
                        <div id="editModeIndicator" style="display: none;">
                            <span class="edit-mode-badge" style="background:#ffc107;padding:5px 12px;border-radius:20px;">✏️ Edit Mode</span>
                        </div>
                    </div>
                    
                    <form id="admissionForm">
                        <!-- Session Information -->
                        <div class="section-title">📅 Session Information</div>
                        <div class="form-row">
                            <div class="form-group"><label>Session *</label><select id="admissionSession" required>${allSessions.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div>
                            <div class="form-group"><label>Joining Date *</label><input type="date" id="joiningDate" required></div>
                        </div>
                        
                        <!-- Student Name -->
                        <div class="section-title">👤 Student Name</div>
                        <div class="form-row-3">
                            <div class="form-group"><label>First Name *</label><input type="text" id="firstName" required></div>
                            <div class="form-group"><label>Middle Name</label><input type="text" id="middleName"></div>
                            <div class="form-group"><label>Last Name *</label><input type="text" id="lastName" required></div>
                        </div>
                        
                        <!-- Personal Information -->
                        <div class="section-title">📋 Personal Information</div>
                        <div class="form-row">
                            <div class="form-group"><label>Date of Birth</label><input type="date" id="dob"></div>
                            <div class="form-group"><label>Gender</label><select id="gender"><option value="">Select</option>${genders.map(g => `<option value="${g}">${g}</option>`).join('')}</select></div>
                        </div>
                        
                        <!-- Aadhar & ID -->
                        <div class="section-title">🆔 Identification</div>
                        <div class="form-group">
                            <label>Aadhar Number (12 digits) *</label>
                            <input type="text" id="aadharNumber" required maxlength="12" pattern="[0-9]{12}" placeholder="Enter 12 digit Aadhar number">
                            <small>Student ID will be same as Aadhar number</small>
                        </div>
                        
                        <!-- Contact Information -->
                        <div class="section-title">📞 Contact Information</div>
                        <div class="form-row">
                            <div class="form-group"><label>Student Mobile *</label><input type="tel" id="studentMobile" required pattern="[0-9]{10}" placeholder="10 digit mobile"></div>
                            <div class="form-group"><label>Alternate Mobile</label><input type="tel" id="alternateMobile" pattern="[0-9]{10}" placeholder="Optional"></div>
                        </div>
                        <div class="form-group"><label>Email</label><input type="email" id="email" placeholder="student@example.com"></div>
                        <div class="form-group"><label>Emergency Contact</label><input type="tel" id="emergencyContact" pattern="[0-9]{10}" placeholder="Emergency contact number"></div>
                        
                        <!-- Parent Information -->
                        <div class="section-title">👪 Parent/Guardian Information</div>
                        <div class="form-group"><label>Parent Type *</label><select id="parentType"><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option></select></div>
                        
                        <div id="fatherFields">
                            <div class="form-row">
                                <div class="form-group"><label>Father Full Name</label><input type="text" id="fatherName" placeholder="First and Last name"></div>
                                <div class="form-group"><label>Father Mobile</label><input type="tel" id="fatherMobile" placeholder="10 digit mobile"></div>
                            </div>
                        </div>
                        <div id="motherFields" style="display:none;">
                            <div class="form-row">
                                <div class="form-group"><label>Mother Full Name</label><input type="text" id="motherName" placeholder="First and Last name"></div>
                                <div class="form-group"><label>Mother Mobile</label><input type="tel" id="motherMobile" placeholder="10 digit mobile"></div>
                            </div>
                        </div>
                        <div id="guardianFields" style="display:none;">
                            <div class="form-row">
                                <div class="form-group"><label>Guardian Full Name</label><input type="text" id="guardianName" placeholder="Full name"></div>
                                <div class="form-group"><label>Guardian Mobile</label><input type="tel" id="guardianMobile" placeholder="10 digit mobile"></div>
                            </div>
                            <div class="form-group"><label>Relation with Student</label><input type="text" id="guardianRelation" placeholder="e.g., Uncle, Aunt, Grandfather"></div>
                        </div>
                        
                        <!-- Academic Information -->
                        <div class="section-title">📚 Academic Information</div>
                        <div class="form-row">
                            <div class="form-group"><label>Board *</label><select id="board">${allBoards.map(b => `<option value="${b}">${b}</option>`).join('')}</select></div>
                            <div class="form-group"><label>Class *</label><select id="class">${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Section</label><input type="text" id="section" placeholder="A, B, C etc."></div>
                            <div class="form-group"><label>Roll Number</label><input type="text" id="rollNumber" placeholder="Class roll number"></div>
                        </div>
                        
                        <!-- Fees Information -->
                        <div class="section-title">💰 Fees Information</div>
                        <div class="form-group"><label>Monthly Fees (₹) *</label><input type="number" id="monthlyFees" required min="0" step="100" value="1000"></div>
                        
                        <!-- Documents -->
                        <div class="section-title">📎 Documents</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Student Photo</label>
                                <input type="hidden" id="photo">
                                <img id="photoPreview" class="image-preview" style="display:none;">
                                <div class="image-actions">
                                    <button type="button" class="btn btn-primary btn-sm" id="capturePhotoBtn">📷 Capture</button>
                                    <button type="button" class="btn btn-info btn-sm" id="uploadPhotoBtn">📁 Upload</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="clearPhotoBtn">🗑️ Clear</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Aadhar Document</label>
                                <input type="hidden" id="aadharDoc">
                                <img id="aadharPreview" class="image-preview" style="display:none;">
                                <div class="image-actions">
                                    <button type="button" class="btn btn-primary btn-sm" id="captureAadharBtn">📷 Capture</button>
                                    <button type="button" class="btn btn-info btn-sm" id="uploadAadharBtn">📁 Upload</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="clearAadharBtn">🗑️ Clear</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Address -->
                        <div class="section-title">🏠 Address</div>
                        <div class="form-group"><label>Current Address *</label><textarea id="currentAddress" rows="2" placeholder="House number, Street, Landmark"></textarea></div>
                        <div class="form-group"><label>Permanent Address</label><textarea id="permanentAddress" rows="2" placeholder="Leave blank if same as current address"></textarea></div>
                        <div class="form-row-3">
                            <div class="form-group"><label>City</label><input type="text" id="city" placeholder="City"></div>
                            <div class="form-group"><label>State</label><input type="text" id="state" placeholder="State"></div>
                            <div class="form-group"><label>Pincode</label><input type="text" id="pincode" maxlength="6" placeholder="Pincode"></div>
                        </div>
                        
                        <!-- Transport & Medical (Optional) -->
                        <div class="section-title">🚌 Transport Information (Optional)</div>
                        <div class="form-row">
                            <div class="form-group"><label>Availing Transport</label><select id="availingTransport"><option value="no">No</option><option value="yes">Yes</option></select></div>
                            <div class="form-group"><label>Bus Route</label><input type="text" id="busRoute" placeholder="Route number/name"></div>
                        </div>
                        <div class="form-group"><label>Bus Stop</label><input type="text" id="busStop" placeholder="Bus stop name"></div>
                        
                        <div class="section-title">🏥 Medical Information (Optional)</div>
                        <div class="form-row">
                            <div class="form-group"><label>Blood Group</label><select id="bloodGroup"><option value="">Select</option>${bloodGroups.map(bg => `<option value="${bg}">${bg}</option>`).join('')}</select></div>
                            <div class="form-group"><label>Allergies</label><input type="text" id="allergies" placeholder="Any allergies"></div>
                        </div>
                        <div class="form-group"><label>Medical Conditions</label><input type="text" id="medicalConditions" placeholder="Any medical conditions"></div>
                        
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
            <div class="modal-content" style="max-width: 1000px;">
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
        
        <!-- EDIT STUDENT MODAL -->
        <div id="editStudentModal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>✏️ Edit Student - <span id="editModalStudentId"></span></h3>
                    <button class="close-modal" id="closeEditModal">×</button>
                </div>
                <div class="modal-body" id="editModalBody"></div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelEditModalBtn">Cancel</button>
                    <button class="btn btn-primary" id="saveEditModalBtn">💾 Save Changes</button>
                </div>
            </div>
        </div>
        
        <!-- PROMOTION MODAL -->
        <div id="promotionModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>🎓 Promote Student to Next Session</h3>
                    <button class="close-modal" id="closePromotionModal">×</button>
                </div>
                <div class="modal-body">
                    <div id="promotionInfo"></div>
                    <div class="form-group">
                        <label>Select New Session *</label>
                        <select id="newSessionSelect" class="form-control" required></select>
                    </div>
                    <div class="form-group">
                        <label>New Class (Optional)</label>
                        <select id="newClassSelect" class="form-control"><option value="">Same as current</option>${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                    </div>
                    <div class="form-group">
                        <label>New Monthly Fees (Optional)</label>
                        <input type="number" id="newFeesAmount" class="form-control" placeholder="Keep same if empty">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelPromotionBtn">Cancel</button>
                    <button class="btn btn-success" id="confirmPromotionBtn">✅ Promote Student</button>
                </div>
            </div>
        </div>
        
        <!-- RE-ADMISSION MODAL -->
        <div id="readmissionModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>🔄 Re-admit Student</h3>
                    <button class="close-modal" id="closeReadmissionModal">×</button>
                </div>
                <div class="modal-body">
                    <div id="readmissionInfo"></div>
                    <div class="form-group">
                        <label>Select New Session *</label>
                        <select id="readmissionSessionSelect" class="form-control" required></select>
                    </div>
                    <div class="form-group">
                        <label>Class *</label>
                        <select id="readmissionClassSelect" class="form-control" required>${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                    </div>
                    <div class="form-group">
                        <label>Monthly Fees (₹) *</label>
                        <input type="number" id="readmissionFeesAmount" class="form-control" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelReadmissionBtn">Cancel</button>
                    <button class="btn btn-primary" id="confirmReadmissionBtn">✅ Re-admit Student</button>
                </div>
            </div>
        </div>
        
        <!-- DOCUMENT VIEWER MODAL -->
        <div id="documentViewerModal" class="modal">
            <div class="modal-content document-viewer" style="max-width: 90vw;">
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
                    <div class="form-group"><label>Date</label><input type="date" id="attendanceDate" class="form-control"></div>
                    <div class="form-group"><label>Status</label><select id="attendanceStatus" class="form-control"><option value="present">✅ Present</option><option value="absent">❌ Absent</option><option value="late">⏰ Late</option><option value="half-day">🌓 Half Day</option></select></div>
                    <div class="form-group"><label>Check In Time</label><input type="time" id="checkInTime" class="form-control"></div>
                    <div class="form-group"><label>Check Out Time</label><input type="time" id="checkOutTime" class="form-control"></div>
                    <div class="form-group"><label>Remarks</label><textarea id="attendanceRemarks" class="form-control" rows="2"></textarea></div>
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
                    <div class="form-group"><label>Select Month</label><select id="feesMonth" class="form-control"></select></div>
                    <div class="form-group"><label>Amount to Pay (₹)</label><input type="number" id="feesAmount" class="form-control" min="1" step="100"></div>
                    <div class="form-group"><label>Remarks</label><textarea id="feesRemarks" class="form-control" rows="2" placeholder="Optional remarks..."></textarea></div>
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
        constructor(containerId = 'app') {
            this.containerId = containerId;
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
            
            // Find container or use body
            const targetContainer = document.getElementById(this.containerId);
            if (targetContainer) {
                targetContainer.innerHTML = '';
                targetContainer.appendChild(appContainer);
            } else {
                document.body.innerHTML = '';
                document.body.appendChild(appContainer);
            }
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
            document.getElementById('closeEditModal')?.addEventListener('click', () => closeModal('editStudentModal'));
            document.getElementById('cancelEditModalBtn')?.addEventListener('click', () => closeModal('editStudentModal'));
            document.getElementById('saveEditModalBtn')?.addEventListener('click', () => this.saveEditFromModal());
            document.getElementById('closeDocViewer')?.addEventListener('click', () => closeModal('documentViewerModal'));
            document.getElementById('closeDocViewerBtn')?.addEventListener('click', () => closeModal('documentViewerModal'));
            document.getElementById('downloadDocBtn')?.addEventListener('click', () => this.downloadCurrentDocument());
            document.getElementById('closePromotionModal')?.addEventListener('click', () => closeModal('promotionModal'));
            document.getElementById('cancelPromotionBtn')?.addEventListener('click', () => closeModal('promotionModal'));
            document.getElementById('closeReadmissionModal')?.addEventListener('click', () => closeModal('readmissionModal'));
            document.getElementById('cancelReadmissionBtn')?.addEventListener('click', () => closeModal('readmissionModal'));
            
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
            if (!aadharInput || !studentIdField) return;
            
            aadharInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^0-9]/g, '');
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
            if (tab === 'new-admission') this.cancelEdit();
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
                this.students = response.success ? (response.data || []) : [];
                this.renderStudentsGrid();
            } catch (err) {
                this.students = [];
                this.renderStudentsGrid();
            }
        }

        async loadOldStudents() {
            try {
                const response = await this.apiCall('/old-students');
                this.oldStudents = response.success ? (response.data || []) : [];
                this.renderOldStudentsGrid();
            } catch (err) {
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
            if (search) filtered = filtered.filter(s => (s.studentId || '').includes(search) || `${s.studentName?.first || ''} ${s.studentName?.last || ''}`.toLowerCase().includes(search));
            
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
            if (search) filtered = filtered.filter(s => (s.studentId || '').includes(search) || `${s.studentName?.first || ''} ${s.studentName?.last || ''}`.toLowerCase().includes(search));
            
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
                fatherName: { first: "Rajesh Sharma", last: "" },
                fatherMobile: "9876543210",
                education: { board: "CBSE", class: "10th" },
                monthlyFees: 2000,
                joiningDate: new Date().toISOString().split('T')[0],
                address: { current: "123 Main Street, Delhi", permanent: "123 Main Street, Delhi", city: "Delhi", state: "Delhi", pincode: "110001" },
                photo: DEFAULT_PHOTO,
                aadharDocument: DEFAULT_PHOTO
            };
            
            const response = await this.apiCall('/students/register', { method: 'POST', body: JSON.stringify(demoData) });
            
            if (response.success) {
                showAlert('✅ Demo student created! ID: 123456789012, Password: 789012', 'success', 5000);
                await this.loadStudents();
                this.switchTab('students');
            } else {
                showAlert('Failed to create demo student: ' + response.message, 'error');
            }
        }

        // ========== DASHBOARD RENDERING (COMPLETE WITH ALL FIELDS) ==========
        async showStudentDashboard(studentId, isOld = false) {
            try {
                showAlert('Loading student data...', 'info');
                let student;
                if (isOld) {
                    student = this.oldStudents?.find(s => s.studentId === studentId);
                } else {
                    const response = await this.apiCall(`/students/${studentId}`);
                    if (response.success && response.data) student = response.data;
                }
                if (!student) { showAlert('Student not found!', 'error'); return; }
                
                currentViewStudent = student;
                this.renderDashboard(student, isOld);
                document.getElementById('dashboardModal').classList.add('active');
            } catch (err) {
                showAlert('Error loading dashboard: ' + err.message, 'error');
            }
        }

        renderDashboard(student, isOld = false) {
            const body = document.getElementById('dashboardBody');
            const footer = document.getElementById('dashboardFooter');
            if (!body) return;
            
            const s = student;
            const studentName = `${s.studentName?.first || ''} ${s.studentName?.middle || ''} ${s.studentName?.last || ''}`.trim() || 'N/A';
            const sessionEndDate = s.currentSession?.endDate;
            const sessionEnding = !isOld && isSessionEndingSoon(sessionEndDate);
            const sessionExpired = !isOld && isSessionExpired(sessionEndDate);
            
            // Calculate stats
            const feesHistory = s.feesHistory || [];
            const totalFees = feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            const paidFees = feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            const dueFees = totalFees - paidFees;
            const attendance = s.attendance || [];
            const totalDays = attendance.length;
            const presentDays = attendance.filter(a => a.status === 'present').length;
            const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
            const isBlocked = s.accountStatus?.isBlocked || false;
            
            let sessionWarningHtml = '';
            if (sessionEnding && !isOld) sessionWarningHtml = `<div class="session-warning">⚠️ <strong>Session Ending Soon!</strong> Current session ends on ${formatDate(sessionEndDate)}. Please promote student.</div>`;
            else if (sessionExpired && !isOld) sessionWarningHtml = `<div class="session-expired">🔴 <strong>Session Expired!</strong> Session ended on ${formatDate(sessionEndDate)}. Must promote to continue.</div>`;
            
            body.innerHTML = `
                <div class="dashboard-container">
                    ${sessionWarningHtml}
                    <div class="dashboard-header">
                        <div><img src="${s.photo || DEFAULT_PHOTO}" class="student-photo-large" onerror="this.src='${DEFAULT_PHOTO}'" onclick="window.smsInstance.viewDocument('${s.photo || DEFAULT_PHOTO}', 'Student Photo')"><div style="text-align:center;margin-top:5px;"><button class="btn btn-sm btn-info" onclick="window.smsInstance.viewDocument('${s.photo || DEFAULT_PHOTO}', 'Student Photo')">🔍 View Photo</button></div></div>
                        <div class="dashboard-info">
                            <div class="info-row"><div class="info-label">Student ID:</div><div class="info-value"><strong>${s.studentId || '-'}</strong></div></div>
                            <div class="info-row"><div class="info-label">Aadhar Number:</div><div class="info-value">${s.aadharNumber || s.studentId || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${studentName}</div></div>
                            <div class="info-row"><div class="info-label">Date of Birth:</div><div class="info-value">${formatDate(s.dateOfBirth)}</div></div>
                            <div class="info-row"><div class="info-label">Gender:</div><div class="info-value">${s.gender || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Mobile:</div><div class="info-value">${s.studentMobile || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Alternate Mobile:</div><div class="info-value">${s.alternateMobile || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${s.email || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Emergency Contact:</div><div class="info-value">${s.emergencyContact || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Joining Date:</div><div class="info-value">${formatDate(s.joiningDate)}</div></div>
                            <div class="info-row"><div class="info-label">Current Session:</div><div class="info-value">${s.currentSession?.sessionName || s.completedSession?.sessionName || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Session Start:</div><div class="info-value">${formatDate(s.currentSession?.startDate)}</div></div>
                            <div class="info-row"><div class="info-label">Session End:</div><div class="info-value">${formatDate(sessionEndDate)}</div></div>
                            <div class="info-row"><div class="info-label">Board:</div><div class="info-value">${s.education?.board || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Class:</div><div class="info-value">${s.education?.class || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Section:</div><div class="info-value">${s.education?.section || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Roll Number:</div><div class="info-value">${s.education?.rollNumber || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Monthly Fees:</div><div class="info-value">₹${s.monthlyFees || 0}</div></div>
                            <div class="info-row"><div class="info-label">Parent Type:</div><div class="info-value">${s.parentType || '-'}</div></div>
                            ${s.parentType === 'Father' ? `<div class="info-row"><div class="info-label">Father:</div><div class="info-value">${s.fatherName?.first || ''} | ${s.fatherMobile || ''}</div></div>` : ''}
                            ${s.parentType === 'Mother' ? `<div class="info-row"><div class="info-label">Mother:</div><div class="info-value">${s.motherName?.first || ''} | ${s.motherMobile || ''}</div></div>` : ''}
                            ${s.parentType === 'Guardian' ? `<div class="info-row"><div class="info-label">Guardian:</div><div class="info-value">${s.guardianName?.first || ''} (${s.guardianRelation || ''}) | ${s.guardianMobile || ''}</div></div>` : ''}
                            <div class="info-row"><div class="info-label">Current Address:</div><div class="info-value">${s.address?.current || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Permanent Address:</div><div class="info-value">${s.address?.permanent || '-'}</div></div>
                            <div class="info-row"><div class="info-label">City/State/Pincode:</div><div class="info-value">${s.address?.city || ''} ${s.address?.state || ''} ${s.address?.pincode || ''}</div></div>
                            <div class="info-row"><div class="info-label">Transport:</div><div class="info-value">${s.transportDetails?.availingTransport ? `Yes (${s.transportDetails?.busRoute || ''} - ${s.transportDetails?.busStop || ''})` : 'No'}</div></div>
                            <div class="info-row"><div class="info-label">Blood Group:</div><div class="info-value">${s.medicalInfo?.bloodGroup || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Allergies/Medical:</div><div class="info-value">${s.medicalInfo?.allergies || '-'} / ${s.medicalInfo?.medicalConditions || '-'}</div></div>
                            <div class="info-row"><div class="info-label">Status:</div><div class="info-value">${isBlocked ? `<span class="badge-blocked">🔴 BLOCKED</span>` : '<span class="badge-active">🟢 ACTIVE</span>'}</div></div>
                            <div class="info-row"><div class="info-label">Aadhar Document:</div><div class="info-value"><button class="btn btn-sm btn-info" onclick="window.smsInstance.viewDocument('${s.aadharDocument || DEFAULT_PHOTO}', 'Aadhar Document')">📄 View</button></div></div>
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;"><h3>₹${paidFees.toLocaleString()}</h3><p>Total Paid</p></div>
                        <div class="stat-card" style="background:linear-gradient(135deg,#dc3545,#c82333);color:white;"><h3>₹${dueFees.toLocaleString()}</h3><p>Total Due</p></div>
                        <div class="stat-card" style="background:linear-gradient(135deg,#28a745,#20c997);color:white;"><h3>${attendancePercent}%</h3><p>Attendance</p></div>
                        <div class="stat-card" style="background:linear-gradient(135deg,#ffc107,#fd7e14);color:#333;"><h3>${totalDays}</h3><p>Total Days</p></div>
                    </div>
                    <div class="chart-container"><div class="chart-title">📊 Monthly Attendance</div><canvas id="attendanceChart" style="height:300px;"></canvas></div>
                    <div class="chart-container"><div class="chart-title">💰 Fees Payment</div><canvas id="feesChart" style="height:300px;"></canvas></div>
                    <div class="chart-container"><div class="chart-title">📋 Fees History</div><div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody id="feesTableBody"></tbody></table></div></div>
                    <div class="chart-container"><div class="chart-title">📅 Recent Attendance</div><div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th></tr></thead><tbody id="attendanceTableBody"></tbody></table></div></div>
                    <div class="chart-container"><div class="chart-title">🔴 Block History</div><div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Blocked From</th><th>Blocked Until</th><th>Reason</th><th>Unblocked</th></tr></thead><tbody id="blockHistoryBody"></tbody></table></div></div>
                    <div class="action-buttons">
                        <button class="btn btn-info" id="markAttendanceBtn">📅 Mark Attendance</button>
                        <button class="btn btn-success" id="payFeesBtn">💰 Pay Fees</button>
                        ${!isOld ? `<button class="btn btn-primary" id="editStudentDashboardBtn">✏️ Edit Student</button>` : ''}
                        ${!isOld && (sessionEnding || sessionExpired) ? `<button class="btn btn-promote" id="promoteStudentBtn">🎓 Promote to Next Session</button>` : ''}
                    </div>
                </div>
            `;
            
            // Populate tables
            const feesTbody = document.getElementById('feesTableBody');
            if (feesTbody) {
                feesTbody.innerHTML = (feesHistory || []).map(f => `<tr><td>${f.month} ${f.year}</td><td>₹${f.amount}</td><td>₹${f.paidAmount || 0}</td><td>₹${f.dueAmount || 0}</td><td>${getStatusBadge(f.status)}</td><td>${f.status !== 'paid' ? `<button class="btn btn-success btn-sm pay-fee-btn" data-month="${f.month}" data-year="${f.year}" data-due="${f.dueAmount}">Pay</button>` : '-'}</td></tr>`).join('');
                document.querySelectorAll('.pay-fee-btn').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); this.openFeesModalWithMonth(currentViewStudent, btn.dataset.month, btn.dataset.year, btn.dataset.due); }));
            }
            
            const attTbody = document.getElementById('attendanceTableBody');
            if (attTbody) {
                const recent = [...(attendance || [])].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
                attTbody.innerHTML = recent.map(a => `<tr><td>${formatDate(a.date)}</td><td>${a.status || '-'}</td><td>${a.checkInTime || '-'}</td><td>${a.checkOutTime || '-'}</td>`).join('');
            }
            
            const blockTbody = document.getElementById('blockHistoryBody');
            if (blockTbody) {
                blockTbody.innerHTML = ((s.blockHistory || []).map(b => `<tr><td>${formatDate(b.blockedFrom)}</td><td>${b.blockedUntil ? formatDate(b.blockedUntil) : 'Permanent'}</td><td>${b.reason || '-'}</td><td>${b.unblockedAt ? formatDate(b.unblockedAt) : 'Still Blocked'}</td>`).join('') || '<tr><td colspan="4" class="empty-state">No block history</td></tr>');
            }
            
            // Charts
            const months = this.getLast12Months();
            const attData = months.map(m => { const monthAtt = (attendance || []).filter(a => { const d = new Date(a.date); return d.getMonth() === m.monthIndex && d.getFullYear() === m.year; }); const present = monthAtt.filter(a => a.status === 'present').length; return monthAtt.length ? (present/monthAtt.length)*100 : 0; });
            const feesData = months.map(m => { const fee = (feesHistory || []).find(f => f.monthIndex === m.monthIndex && f.year === m.year); return { paid: fee?.paidAmount || 0, due: fee?.dueAmount || 0 }; });
            
            setTimeout(() => {
                try {
                    if (window.Chart) {
                        const attCtx = document.getElementById('attendanceChart')?.getContext('2d');
                        if (attCtx) { if (charts.attendance) charts.attendance.destroy(); charts.attendance = new Chart(attCtx, { type: 'line', data: { labels: months.map(m => m.name), datasets: [{ label: 'Attendance %', data: attData, borderColor: '#667eea', fill: true }] }, options: { responsive: true, scales: { y: { min: 0, max: 100 } } } }); }
                        const feesCtx = document.getElementById('feesChart')?.getContext('2d');
                        if (feesCtx) { if (charts.fees) charts.fees.destroy(); charts.fees = new Chart(feesCtx, { type: 'bar', data: { labels: months.map(m => m.name), datasets: [{ label: 'Paid', data: feesData.map(d => d.paid), backgroundColor: '#28a745' }, { label: 'Due', data: feesData.map(d => d.due), backgroundColor: '#dc3545' }] }, options: { responsive: true } }); }
                    }
                } catch(e) { console.log('Chart error:', e); }
            }, 100);
            
            footer.innerHTML = `
                ${!isOld ? `<button class="btn btn-danger" id="deleteStudentBtn">🗑️ Delete Student</button>` : ''}
                ${!isOld && !isBlocked ? `<button class="btn btn-warning" id="blockStudentBtn">🔴 Block Student</button>` : ''}
                ${!isOld && isBlocked ? `<button class="btn btn-success" id="unblockStudentBtn">🟢 Unblock Student</button>` : ''}
                ${isOld ? `<button class="btn btn-primary" id="readmitStudentBtn">🔄 Re-admit Student</button>` : ''}
                <button class="btn btn-info" id="exportReportBtn">📎 Export Report</button>
                <button class="btn btn-secondary" id="closeDashboardFooterBtn">Close</button>
            `;
            
            document.getElementById('deleteStudentBtn')?.addEventListener('click', () => this.deleteStudent(s.studentId));
            document.getElementById('blockStudentBtn')?.addEventListener('click', () => this.blockStudent(s.studentId));
            document.getElementById('unblockStudentBtn')?.addEventListener('click', () => this.unblockStudent(s.studentId));
            document.getElementById('editStudentDashboardBtn')?.addEventListener('click', () => this.openEditPopup(s));
            document.getElementById('exportReportBtn')?.addEventListener('click', () => this.exportStudentReport(s));
            document.getElementById('closeDashboardFooterBtn')?.addEventListener('click', () => closeModal('dashboardModal'));
            document.getElementById('markAttendanceBtn')?.addEventListener('click', () => this.openAttendanceModal(s.studentId));
            document.getElementById('payFeesBtn')?.addEventListener('click', () => this.openFeesModal(s));
            document.getElementById('promoteStudentBtn')?.addEventListener('click', () => this.openPromotionModal(s));
            document.getElementById('readmitStudentBtn')?.addEventListener('click', () => this.openReadmissionModal(s));
        }

        getLast12Months() {
            const months = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                months.push({ name: d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear(), monthIndex: d.getMonth(), year: d.getFullYear() });
            }
            return months;
        }

        // ========== PROMOTION ==========
        openPromotionModal(student) {
            const currentYear = parseInt(student.currentSession?.sessionName?.split('-')[0]) || 2024;
            const sessionSelect = document.getElementById('newSessionSelect');
            sessionSelect.innerHTML = '';
            for (let year = currentYear + 1; year <= 2050; year++) {
                const session = `${year}-${year + 1}`;
                sessionSelect.innerHTML += `<option value="${session}" ${year === currentYear + 1 ? 'selected' : ''}>${session}</option>`;
            }
            document.getElementById('promotionInfo').innerHTML = `<div class="promotion-form"><p><strong>Student:</strong> ${student.studentName?.first} ${student.studentName?.last}</p><p><strong>Current Session:</strong> ${student.currentSession?.sessionName}</p><p><strong>Current Class:</strong> ${student.education?.class}</p><p><strong>Current Fees:</strong> ₹${student.monthlyFees}</p><hr><p>⚠️ Student will be archived and new record created.</p></div>`;
            document.getElementById('promotionModal').classList.add('active');
            document.getElementById('confirmPromotionBtn').onclick = () => this.confirmPromotion(student);
        }

        async confirmPromotion(student) {
            const newSession = document.getElementById('newSessionSelect').value;
            const newClass = document.getElementById('newClassSelect').value;
            const newFees = document.getElementById('newFeesAmount').value;
            if (!newSession) { showAlert('Select new session', 'error'); return; }
            
            try {
                showAlert('Promoting student...', 'info');
                const response = await this.apiCall(`/students/${student.studentId}/promote`, {
                    method: 'POST',
                    body: JSON.stringify({ newSession, newClass: newClass || student.education?.class, newFees: newFees ? parseInt(newFees) : student.monthlyFees })
                });
                if (response.success) {
                    showAlert('✅ Student promoted successfully!', 'success');
                    closeModal('promotionModal');
                    await this.loadStudents();
                    closeModal('dashboardModal');
                } else {
                    showAlert(response.message || 'Promotion failed', 'error');
                }
            } catch(err) { showAlert('Error promoting student', 'error'); }
        }

        // ========== RE-ADMISSION ==========
        openReadmissionModal(student) {
            const sessionSelect = document.getElementById('readmissionSessionSelect');
            sessionSelect.innerHTML = '';
            for (let year = 2024; year <= 2050; year++) {
                sessionSelect.innerHTML += `<option value="${year}-${year+1}">${year}-${year+1}</option>`;
            }
            document.getElementById('readmissionInfo').innerHTML = `<div class="readmission-form"><p><strong>Student:</strong> ${student.studentName?.first} ${student.studentName?.last}</p><p><strong>Previous Session:</strong> ${student.completedSession?.sessionName}</p><p><strong>Previous Class:</strong> ${student.education?.class}</p><p><strong>Previous Fees:</strong> ₹${student.monthlyFees}</p><hr><p>📝 Student will be re-admitted with new session.</p></div>`;
            document.getElementById('readmissionModal').classList.add('active');
            document.getElementById('confirmReadmissionBtn').onclick = () => this.confirmReadmission(student);
        }

        async confirmReadmission(student) {
            const newSession = document.getElementById('readmissionSessionSelect').value;
            const newClass = document.getElementById('readmissionClassSelect').value;
            const newFees = document.getElementById('readmissionFeesAmount').value;
            if (!newSession || !newClass || !newFees) { showAlert('Please fill all fields', 'error'); return; }
            
            try {
                showAlert('Re-admitting student...', 'info');
                const response = await this.apiCall('/students/readmit', {
                    method: 'POST',
                    body: JSON.stringify({ oldStudentId: student._id, studentId: student.studentId, aadharNumber: student.aadharNumber, studentName: student.studentName, studentMobile: student.studentMobile, email: student.email, parentType: student.parentType, fatherName: student.fatherName, fatherMobile: student.fatherMobile, motherName: student.motherName, motherMobile: student.motherMobile, guardianName: student.guardianName, guardianMobile: student.guardianMobile, guardianRelation: student.guardianRelation, address: student.address, photo: student.photo, aadharDocument: student.aadharDocument, newSession, newClass, newFees: parseInt(newFees) })
                });
                if (response.success) {
                    showAlert('✅ Student re-admitted successfully!', 'success');
                    closeModal('readmissionModal');
                    await this.loadStudents();
                    await this.loadOldStudents();
                    closeModal('dashboardModal');
                } else {
                    showAlert(response.message || 'Re-admission failed', 'error');
                }
            } catch(err) { showAlert('Error re-admitting student', 'error'); }
        }

        // ========== EDIT POPUP ==========
        openEditPopup(student) {
            currentEditStudentId = student.studentId;
            const editFormHtml = `
                <form id="editStudentForm">
                    <div class="section-title">📅 Session Information</div>
                    <div class="form-row"><div class="form-group"><label>Session *</label><select id="editSession">${allSessions.map(s => `<option value="${s}" ${student.currentSession?.sessionName === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Joining Date *</label><input type="date" id="editJoiningDate" value="${student.joiningDate ? student.joiningDate.split('T')[0] : ''}"></div></div>
                    <div class="section-title">👤 Student Name</div>
                    <div class="form-row-3"><div class="form-group"><label>First Name *</label><input type="text" id="editFirstName" value="${student.studentName?.first || ''}"></div><div class="form-group"><label>Middle Name</label><input type="text" id="editMiddleName" value="${student.studentName?.middle || ''}"></div><div class="form-group"><label>Last Name *</label><input type="text" id="editLastName" value="${student.studentName?.last || ''}"></div></div>
                    <div class="section-title">📋 Personal Info</div>
                    <div class="form-row"><div class="form-group"><label>DOB</label><input type="date" id="editDob" value="${student.dateOfBirth ? student.dateOfBirth.split('T')[0] : ''}"></div><div class="form-group"><label>Gender</label><select id="editGender"><option value="">Select</option>${genders.map(g => `<option value="${g}" ${student.gender === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div></div>
                    <div class="section-title">📞 Contact</div>
                    <div class="form-row"><div class="form-group"><label>Mobile *</label><input type="tel" id="editStudentMobile" value="${student.studentMobile || ''}"></div><div class="form-group"><label>Alternate Mobile</label><input type="tel" id="editAlternateMobile" value="${student.alternateMobile || ''}"></div></div>
                    <div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${student.email || ''}"></div>
                    <div class="form-group"><label>Emergency Contact</label><input type="tel" id="editEmergencyContact" value="${student.emergencyContact || ''}"></div>
                    <div class="section-title">👪 Parent</div>
                    <div class="form-group"><label>Parent Type</label><select id="editParentType"><option value="Father" ${student.parentType === 'Father' ? 'selected' : ''}>Father</option><option value="Mother" ${student.parentType === 'Mother' ? 'selected' : ''}>Mother</option><option value="Guardian" ${student.parentType === 'Guardian' ? 'selected' : ''}>Guardian</option></select></div>
                    <div id="editFatherFields" style="display:${student.parentType === 'Father' ? 'block' : 'none'}"><div class="form-row"><div class="form-group"><label>Father Name</label><input type="text" id="editFatherName" value="${student.fatherName?.first || ''}"></div><div class="form-group"><label>Father Mobile</label><input type="tel" id="editFatherMobile" value="${student.fatherMobile || ''}"></div></div></div>
                    <div id="editMotherFields" style="display:${student.parentType === 'Mother' ? 'block' : 'none'}"><div class="form-row"><div class="form-group"><label>Mother Name</label><input type="text" id="editMotherName" value="${student.motherName?.first || ''}"></div><div class="form-group"><label>Mother Mobile</label><input type="tel" id="editMotherMobile" value="${student.motherMobile || ''}"></div></div></div>
                    <div id="editGuardianFields" style="display:${student.parentType === 'Guardian' ? 'block' : 'none'}"><div class="form-row"><div class="form-group"><label>Guardian Name</label><input type="text" id="editGuardianName" value="${student.guardianName?.first || ''}"></div><div class="form-group"><label>Guardian Mobile</label><input type="tel" id="editGuardianMobile" value="${student.guardianMobile || ''}"></div></div><div class="form-group"><label>Relation</label><input type="text" id="editGuardianRelation" value="${student.guardianRelation || ''}"></div></div>
                    <div class="section-title">📚 Academic</div>
                    <div class="form-row"><div class="form-group"><label>Board</label><select id="editBoard">${allBoards.map(b => `<option value="${b}" ${student.education?.board === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div><div class="form-group"><label>Class</label><select id="editClass">${allClasses.map(c => `<option value="${c}" ${student.education?.class === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
                    <div class="form-row"><div class="form-group"><label>Section</label><input type="text" id="editSection" value="${student.education?.section || ''}"></div><div class="form-group"><label>Roll Number</label><input type="text" id="editRollNumber" value="${student.education?.rollNumber || ''}"></div></div>
                    <div class="section-title">💰 Fees</div>
                    <div class="form-group"><label>Monthly Fees</label><input type="number" id="editMonthlyFees" value="${student.monthlyFees || 1000}"></div>
                    <div class="section-title">🏠 Address</div>
                    <div class="form-group"><label>Current Address</label><textarea id="editCurrentAddress" rows="2">${student.address?.current || ''}</textarea></div>
                    <div class="form-group"><label>Permanent Address</label><textarea id="editPermanentAddress" rows="2">${student.address?.permanent || ''}</textarea></div>
                    <div class="form-row-3"><div class="form-group"><label>City</label><input type="text" id="editCity" value="${student.address?.city || ''}"></div><div class="form-group"><label>State</label><input type="text" id="editState" value="${student.address?.state || ''}"></div><div class="form-group"><label>Pincode</label><input type="text" id="editPincode" value="${student.address?.pincode || ''}"></div></div>
                    <div class="section-title">🚌 Transport</div>
                    <div class="form-row"><div class="form-group"><label>Availing Transport</label><select id="editAvailingTransport"><option value="no" ${!student.transportDetails?.availingTransport ? 'selected' : ''}>No</option><option value="yes" ${student.transportDetails?.availingTransport ? 'selected' : ''}>Yes</option></select></div><div class="form-group"><label>Bus Route</label><input type="text" id="editBusRoute" value="${student.transportDetails?.busRoute || ''}"></div></div>
                    <div class="form-group"><label>Bus Stop</label><input type="text" id="editBusStop" value="${student.transportDetails?.busStop || ''}"></div>
                    <div class="section-title">🏥 Medical</div>
                    <div class="form-row"><div class="form-group"><label>Blood Group</label><select id="editBloodGroup"><option value="">Select</option>${bloodGroups.map(bg => `<option value="${bg}" ${student.medicalInfo?.bloodGroup === bg ? 'selected' : ''}>${bg}</option>`).join('')}</select></div><div class="form-group"><label>Allergies</label><input type="text" id="editAllergies" value="${student.medicalInfo?.allergies || ''}"></div></div>
                    <div class="form-group"><label>Medical Conditions</label><input type="text" id="editMedicalConditions" value="${student.medicalInfo?.medicalConditions || ''}"></div>
                    <div class="section-title">📎 Documents</div>
                    <div class="form-row"><div class="form-group"><label>Photo</label><input type="hidden" id="editPhoto"><img id="editPhotoPreview" class="image-preview" src="${student.photo || DEFAULT_PHOTO}" style="display:block;"><div class="image-actions"><button type="button" id="editCapturePhotoBtn" class="btn btn-primary btn-sm">📷 Capture</button><button type="button" id="editUploadPhotoBtn" class="btn btn-info btn-sm">📁 Upload</button><button type="button" id="editClearPhotoBtn" class="btn btn-secondary btn-sm">🗑️ Clear</button></div></div>
                    <div class="form-group"><label>Aadhar Document</label><input type="hidden" id="editAadharDoc"><img id="editAadharPreview" class="image-preview" src="${student.aadharDocument || DEFAULT_PHOTO}" style="display:block;"><div class="image-actions"><button type="button" id="editCaptureAadharBtn" class="btn btn-primary btn-sm">📷 Capture</button><button type="button" id="editUploadAadharBtn" class="btn btn-info btn-sm">📁 Upload</button><button type="button" id="editClearAadharBtn" class="btn btn-secondary btn-sm">🗑️ Clear</button></div></div></div>
                </form>
            `;
            document.getElementById('editModalStudentId').innerText = student.studentId;
            document.getElementById('editModalBody').innerHTML = editFormHtml;
            this.setupEditFormEvents();
            document.getElementById('editStudentModal').classList.add('active');
        }

        setupEditFormEvents() {
            const editParentType = document.getElementById('editParentType');
            if (editParentType) editParentType.addEventListener('change', () => { const t = editParentType.value; document.getElementById('editFatherFields').style.display = t === 'Father' ? 'block' : 'none'; document.getElementById('editMotherFields').style.display = t === 'Mother' ? 'block' : 'none'; document.getElementById('editGuardianFields').style.display = t === 'Guardian' ? 'block' : 'none'; });
            
            document.getElementById('editCapturePhotoBtn')?.addEventListener('click', () => this.captureImage('editPhoto', 'editPhotoPreview'));
            document.getElementById('editUploadPhotoBtn')?.addEventListener('click', () => this.uploadImage('editPhoto', 'editPhotoPreview'));
            document.getElementById('editClearPhotoBtn')?.addEventListener('click', () => { document.getElementById('editPhoto').value = ''; document.getElementById('editPhotoPreview').src = DEFAULT_PHOTO; });
            document.getElementById('editCaptureAadharBtn')?.addEventListener('click', () => this.captureImage('editAadharDoc', 'editAadharPreview'));
            document.getElementById('editUploadAadharBtn')?.addEventListener('click', () => this.uploadImage('editAadharDoc', 'editAadharPreview'));
            document.getElementById('editClearAadharBtn')?.addEventListener('click', () => { document.getElementById('editAadharDoc').value = ''; document.getElementById('editAadharPreview').src = DEFAULT_PHOTO; });
        }

        async saveEditFromModal() {
            if (!currentEditStudentId) { showAlert('No student selected', 'error'); return; }
            const studentData = {
                studentName: { first: document.getElementById('editFirstName').value, middle: document.getElementById('editMiddleName').value || '', last: document.getElementById('editLastName').value },
                dateOfBirth: document.getElementById('editDob').value,
                gender: document.getElementById('editGender').value,
                studentMobile: document.getElementById('editStudentMobile').value,
                alternateMobile: document.getElementById('editAlternateMobile').value,
                email: document.getElementById('editEmail').value,
                emergencyContact: document.getElementById('editEmergencyContact').value,
                parentType: document.getElementById('editParentType').value,
                education: { board: document.getElementById('editBoard').value, class: document.getElementById('editClass').value, section: document.getElementById('editSection').value, rollNumber: document.getElementById('editRollNumber').value },
                monthlyFees: parseInt(document.getElementById('editMonthlyFees').value),
                address: { current: document.getElementById('editCurrentAddress').value, permanent: document.getElementById('editPermanentAddress').value, city: document.getElementById('editCity').value, state: document.getElementById('editState').value, pincode: document.getElementById('editPincode').value },
                transportDetails: { availingTransport: document.getElementById('editAvailingTransport').value === 'yes', busRoute: document.getElementById('editBusRoute').value, busStop: document.getElementById('editBusStop').value },
                medicalInfo: { bloodGroup: document.getElementById('editBloodGroup').value, allergies: document.getElementById('editAllergies').value, medicalConditions: document.getElementById('editMedicalConditions').value },
                photo: document.getElementById('editPhoto').value || DEFAULT_PHOTO,
                aadharDocument: document.getElementById('editAadharDoc').value || DEFAULT_PHOTO,
                currentSession: { sessionName: document.getElementById('editSession').value },
                joiningDate: document.getElementById('editJoiningDate').value
            };
            const pType = document.getElementById('editParentType').value;
            if (pType === 'Father') { studentData.fatherName = { first: document.getElementById('editFatherName').value, last: '' }; studentData.fatherMobile = document.getElementById('editFatherMobile').value; }
            else if (pType === 'Mother') { studentData.motherName = { first: document.getElementById('editMotherName').value, last: '' }; studentData.motherMobile = document.getElementById('editMotherMobile').value; }
            else if (pType === 'Guardian') { studentData.guardianName = { first: document.getElementById('editGuardianName').value, last: '' }; studentData.guardianMobile = document.getElementById('editGuardianMobile').value; studentData.guardianRelation = document.getElementById('editGuardianRelation').value; }
            
            const response = await this.apiCall(`/students/${currentEditStudentId}`, { method: 'PUT', body: JSON.stringify(studentData) });
            if (response.success) { showAlert('✅ Student updated!', 'success'); closeModal('editStudentModal'); await this.loadStudents(); if (currentViewStudent && currentViewStudent.studentId === currentEditStudentId) await this.showStudentDashboard(currentEditStudentId, false); }
            else showAlert(response.message || 'Update failed', 'error');
        }

        viewDocument(imageUrl, title) { document.getElementById('docViewerImage').src = imageUrl; document.getElementById('docViewerTitle').innerText = title; this.currentDocumentUrl = imageUrl; document.getElementById('documentViewerModal').classList.add('active'); }
        downloadCurrentDocument() { if (this.currentDocumentUrl) { const a = document.createElement('a'); a.href = this.currentDocumentUrl; a.download = 'document.jpg'; a.click(); } }

        openAttendanceModal(studentId) {
            document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('attendanceStatus').value = 'present';
            document.getElementById('checkInTime').value = '';
            document.getElementById('checkOutTime').value = '';
            document.getElementById('attendanceRemarks').value = '';
            const saveBtn = document.getElementById('saveAttendanceBtn');
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
            newBtn.addEventListener('click', () => this.saveAttendance(studentId));
            document.getElementById('attendanceModal').classList.add('active');
        }

        async saveAttendance(studentId) {
            const date = document.getElementById('attendanceDate').value;
            if (!date) { showAlert('Select date', 'error'); return; }
            const response = await this.apiCall(`/students/${studentId}/attendance`, { method: 'POST', body: JSON.stringify({ date, status: document.getElementById('attendanceStatus').value, checkInTime: document.getElementById('checkInTime').value, checkOutTime: document.getElementById('checkOutTime').value, remarks: document.getElementById('attendanceRemarks').value }) });
            if (response.success) { showAlert('Attendance marked!', 'success'); closeModal('attendanceModal'); await this.showStudentDashboard(studentId, false); await this.loadStudents(); }
            else showAlert(response.message || 'Failed', 'error');
        }

        openFeesModal(student) {
            const unpaid = (student.feesHistory || []).filter(f => f.status !== 'paid');
            const monthSelect = document.getElementById('feesMonth');
            monthSelect.innerHTML = '<option value="">Select Month</option>' + unpaid.map(f => `<option value="${f.month}|${f.year}" data-due="${f.dueAmount}">${f.month} ${f.year} - Due: ₹${f.dueAmount}</option>`).join('');
            document.getElementById('feesAmount').value = '';
            document.getElementById('feesRemarks').value = '';
            document.getElementById('feesInfo').innerHTML = '';
            monthSelect.onchange = () => { const due = monthSelect.options[monthSelect.selectedIndex]?.dataset.due || 0; document.getElementById('feesInfo').innerHTML = `<strong>Due: ₹${due}</strong>`; document.getElementById('feesAmount').max = due; if (due) document.getElementById('feesAmount').value = due; };
            const saveBtn = document.getElementById('saveFeesBtn');
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
            newBtn.addEventListener('click', () => this.saveFees(student.studentId));
            document.getElementById('feesModal').classList.add('active');
        }

        openFeesModalWithMonth(student, month, year, due) {
            const monthSelect = document.getElementById('feesMonth');
            monthSelect.innerHTML = `<option value="${month}|${year}" data-due="${due}">${month} ${year} - Due: ₹${due}</option>`;
            document.getElementById('feesAmount').value = due;
            document.getElementById('feesRemarks').value = '';
            document.getElementById('feesInfo').innerHTML = `<strong>Due: ₹${due}</strong>`;
            const saveBtn = document.getElementById('saveFeesBtn');
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
            newBtn.addEventListener('click', () => this.saveFees(student.studentId));
            document.getElementById('feesModal').classList.add('active');
        }

        async saveFees(studentId) {
            const selected = document.getElementById('feesMonth').value;
            if (!selected) { showAlert('Select month', 'error'); return; }
            const [month, year] = selected.split('|');
            const amount = parseInt(document.getElementById('feesAmount').value);
            if (!amount || amount <= 0) { showAlert('Enter valid amount', 'error'); return; }
            const response = await this.apiCall(`/students/${studentId}/fees`, { method: 'POST', body: JSON.stringify({ month, year: parseInt(year), paidAmount: amount, remarks: document.getElementById('feesRemarks').value }) });
            if (response.success) { showAlert('Fees paid!', 'success'); closeModal('feesModal'); await this.showStudentDashboard(studentId, false); await this.loadStudents(); }
            else showAlert(response.message || 'Failed', 'error');
        }

        async blockStudent(studentId) {
            const reason = prompt('Block reason:', 'Non-payment of fees');
            if (!reason) return;
            const response = await this.apiCall(`/students/${studentId}/block`, { method: 'POST', body: JSON.stringify({ reason }) });
            if (response.success) { showAlert('Student blocked', 'success'); await this.loadStudents(); closeModal('dashboardModal'); }
            else showAlert(response.message || 'Failed', 'error');
        }

        async unblockStudent(studentId) {
            if (!confirm('Unblock this student?')) return;
            const response = await this.apiCall(`/students/${studentId}/unblock`, { method: 'POST' });
            if (response.success) { showAlert('Student unblocked', 'success'); await this.loadStudents(); closeModal('dashboardModal'); }
            else showAlert(response.message || 'Failed', 'error');
        }

        async deleteStudent(studentId) {
            if (!confirm('Delete this student permanently?')) return;
            const response = await this.apiCall(`/students/${studentId}?permanent=true`, { method: 'DELETE' });
            if (response.success) { showAlert('Student deleted', 'success'); closeModal('dashboardModal'); await this.loadStudents(); }
            else showAlert(response.message || 'Failed', 'error');
        }

        exportStudentReport(student) {
            const win = window.open('', '_blank');
            const feesHistory = student.feesHistory || [];
            const total = feesHistory.reduce((s,f) => s + (f.amount||0),0);
            const paid = feesHistory.reduce((s,f) => s + (f.paidAmount||0),0);
            win.document.write(`<html><head><title>Report - ${student.studentId}</title><style>body{font-family:Arial;padding:20px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:8px} th{background:#667eea;color:white}</style></head><body><h1>Bal Bharti Coaching Center</h1><h2>Student Report</h2><img src="${student.photo || DEFAULT_PHOTO}" style="width:100px;border-radius:50%"><h3>${student.studentName?.first} ${student.studentName?.last}</h3><p>ID: ${student.studentId} | Class: ${student.education?.class} | Session: ${student.currentSession?.sessionName}</p><h3>Fees Summary</h3><p>Total: ₹${total} | Paid: ₹${paid} | Due: ₹${total-paid}</p><h3>Fees History</h3><table><tr><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th></tr>${feesHistory.map(f => `<tr><td>${f.month} ${f.year}</td><td>₹${f.amount}</td><td>₹${f.paidAmount||0}</td><td>₹${f.dueAmount||0}</td><td>${f.status}</td></tr>`).join('')}</table><p>Generated: ${new Date().toLocaleString()}</p></body></html>`);
            win.print();
        }

        async registerStudent() {
            const aadhar = document.getElementById('aadharNumber').value;
            if (!aadhar || aadhar.length !== 12) { showAlert('Valid 12-digit Aadhar required', 'error'); return; }
            if (!document.getElementById('studentMobile').value || document.getElementById('studentMobile').value.length !== 10) { showAlert('Valid 10-digit mobile required', 'error'); return; }
            if (!document.getElementById('firstName').value || !document.getElementById('lastName').value) { showAlert('First and last name required', 'error'); return; }
            
            const existing = this.students?.find(s => s.studentId === aadhar);
            if (existing) { showAlert(`Student ID ${aadhar} already exists!`, 'error'); return; }
            
            const pType = document.getElementById('parentType').value;
            const studentData = {
                studentId: aadhar, aadharNumber: aadhar,
                aadharDocument: document.getElementById('aadharDoc').value || DEFAULT_PHOTO,
                photo: document.getElementById('photo').value || DEFAULT_PHOTO,
                studentName: { first: document.getElementById('firstName').value, middle: document.getElementById('middleName').value || '', last: document.getElementById('lastName').value },
                dateOfBirth: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                studentMobile: document.getElementById('studentMobile').value,
                alternateMobile: document.getElementById('alternateMobile').value,
                email: document.getElementById('email').value,
                emergencyContact: document.getElementById('emergencyContact').value,
                parentType: pType,
                education: { board: document.getElementById('board').value, class: document.getElementById('class').value, section: document.getElementById('section').value, rollNumber: document.getElementById('rollNumber').value },
                monthlyFees: parseInt(document.getElementById('monthlyFees').value) || 1000,
                joiningDate: document.getElementById('joiningDate').value,
                address: { current: document.getElementById('currentAddress').value, permanent: document.getElementById('permanentAddress').value || document.getElementById('currentAddress').value, city: document.getElementById('city').value, state: document.getElementById('state').value, pincode: document.getElementById('pincode').value },
                transportDetails: { availingTransport: document.getElementById('availingTransport').value === 'yes', busRoute: document.getElementById('busRoute').value, busStop: document.getElementById('busStop').value },
                medicalInfo: { bloodGroup: document.getElementById('bloodGroup').value, allergies: document.getElementById('allergies').value, medicalConditions: document.getElementById('medicalConditions').value }
            };
            
            if (pType === 'Father') { studentData.fatherName = { first: document.getElementById('fatherName').value, last: '' }; studentData.fatherMobile = document.getElementById('fatherMobile').value; }
            else if (pType === 'Mother') { studentData.motherName = { first: document.getElementById('motherName').value, last: '' }; studentData.motherMobile = document.getElementById('motherMobile').value; }
            else if (pType === 'Guardian') { studentData.guardianName = { first: document.getElementById('guardianName').value, last: '' }; studentData.guardianMobile = document.getElementById('guardianMobile').value; studentData.guardianRelation = document.getElementById('guardianRelation').value; }
            
            const response = await this.apiCall('/students/register', { method: 'POST', body: JSON.stringify(studentData) });
            if (response.success) { showAlert(`✅ Registered! ID: ${aadhar}, Password: ${aadhar.slice(-6)}`, 'success', 8000); this.resetAdmissionForm(); await this.loadStudents(); this.switchTab('students'); }
            else showAlert(response.message || 'Registration failed', 'error');
        }

        async updateStudent() {
            if (!currentEditStudentId) { showAlert('No student selected', 'error'); return; }
            const pType = document.getElementById('parentType').value;
            const studentData = {
                studentName: { first: document.getElementById('firstName').value, middle: document.getElementById('middleName').value || '', last: document.getElementById('lastName').value },
                dateOfBirth: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                studentMobile: document.getElementById('studentMobile').value,
                alternateMobile: document.getElementById('alternateMobile').value,
                email: document.getElementById('email').value,
                emergencyContact: document.getElementById('emergencyContact').value,
                parentType: pType,
                education: { board: document.getElementById('board').value, class: document.getElementById('class').value, section: document.getElementById('section').value, rollNumber: document.getElementById('rollNumber').value },
                monthlyFees: parseInt(document.getElementById('monthlyFees').value),
                address: { current: document.getElementById('currentAddress').value, permanent: document.getElementById('permanentAddress').value || document.getElementById('currentAddress').value, city: document.getElementById('city').value, state: document.getElementById('state').value, pincode: document.getElementById('pincode').value },
                transportDetails: { availingTransport: document.getElementById('availingTransport').value === 'yes', busRoute: document.getElementById('busRoute').value, busStop: document.getElementById('busStop').value },
                medicalInfo: { bloodGroup: document.getElementById('bloodGroup').value, allergies: document.getElementById('allergies').value, medicalConditions: document.getElementById('medicalConditions').value },
                photo: document.getElementById('photo').value || DEFAULT_PHOTO,
                aadharDocument: document.getElementById('aadharDoc').value || DEFAULT_PHOTO
            };
            if (pType === 'Father') { studentData.fatherName = { first: document.getElementById('fatherName').value, last: '' }; studentData.fatherMobile = document.getElementById('fatherMobile').value; }
            else if (pType === 'Mother') { studentData.motherName = { first: document.getElementById('motherName').value, last: '' }; studentData.motherMobile = document.getElementById('motherMobile').value; }
            else if (pType === 'Guardian') { studentData.guardianName = { first: document.getElementById('guardianName').value, last: '' }; studentData.guardianMobile = document.getElementById('guardianMobile').value; studentData.guardianRelation = document.getElementById('guardianRelation').value; }
            
            const response = await this.apiCall(`/students/${currentEditStudentId}`, { method: 'PUT', body: JSON.stringify(studentData) });
            if (response.success) { showAlert('✅ Updated!', 'success'); this.cancelEdit(); await this.loadStudents(); this.switchTab('students'); }
            else showAlert(response.message || 'Update failed', 'error');
        }

        cancelEdit() {
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
            document.getElementById('monthlyFees').value = '1000';
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

        logout() { localStorage.removeItem('adminToken'); window.location.href = '/login.html'; }
    }

        window.StudentManagementSystem = StudentManagementSystem;
    
    window.initStudentModule = function(containerId = 'app') {
        if (window.studentInstance) {
            return window.studentInstance;
        }
        window.studentInstance = new StudentManagementSystem(containerId);
        return window.studentInstance;
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        const activeModule = sessionStorage.getItem('activeModule');
        if (activeModule !== 'teacher') {
            window.initStudentModule();
        }
    });
})();
