// ============================================
// STUDENT-MANAGEMENT.JS - COMPLETE SYSTEM
// WITH GRAPHS, BLOCK/UNBLOCK, OLD STUDENTS
// ============================================

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const API_BASE_URL = window.location.origin + '/api';
    let currentUser = null;
    let currentTab = 'students';
    let studentsData = [];
    let oldStudentsData = [];
    let currentViewStudent = null;
    let isEditMode = false;
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

    const allSessions = ['2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'];

    // Default Photo
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
            justify-content: space-between; align-items: center; font-family: Arial, sans-serif;
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
        return new Date(date).toLocaleDateString('en-IN');
    }

    function getStatusBadge(status) {
        if (status === 'paid') return '<span class="badge badge-paid">✅ Paid</span>';
        if (status === 'partial') return '<span class="badge badge-partial">⚠️ Partial</span>';
        return '<span class="badge badge-unpaid">❌ Unpaid</span>';
    }

    // Image Compression
    async function compressImage(file, maxSizeKB = 15) {
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
            padding: 20px; margin-top: 20px;
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
        
        .chart-container {
            background: white; border-radius: 15px;
            padding: 20px; margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .chart-title {
            font-size: 1.1rem; font-weight: 600;
            margin-bottom: 15px; color: #333;
        }
        .chart-canvas {
            height: 300px; position: relative;
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
            max-width: 800px; width: 90%; max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2);
            color: white; display: flex; justify-content: space-between;
            align-items: center;
        }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e0e0e0; }
        .close-modal { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.85rem; }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%; padding: 10px; border: 2px solid #e0e0e0;
            border-radius: 8px; font-size: 0.9rem;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none; border-color: #667eea;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        
        .badge-paid { background: #d4edda; color: #155724; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .badge-partial { background: #fff3cd; color: #856404; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .badge-unpaid { background: #f8d7da; color: #721c24; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        
        .image-preview { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; margin-top: 5px; border: 2px solid #e0e0e0; }
        .image-actions { display: flex; gap: 10px; margin-top: 5px; }
        
        .empty-state { text-align: center; padding: 50px; color: #999; }
        
        @media (max-width: 768px) {
            .form-row, .form-row-3 { grid-template-columns: 1fr; }
            .students-grid { grid-template-columns: 1fr; }
            .filter-bar { flex-direction: column; }
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
                    </div>
                    <div id="studentsGrid" class="students-grid"></div>
                </div>
                
                <!-- NEW ADMISSION TAB -->
                <div class="tab-pane" data-pane="new-admission">
                    <h3 style="margin-bottom:20px;">📝 Register New Student</h3>
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
                        <div class="form-group"><label>Aadhar Number (Student ID) *</label><input type="text" id="aadharNumber" required maxlength="12" pattern="[0-9]{12}" placeholder="12 digit Aadhar number"></div>
                        <div class="form-group"><label>Student Mobile *</label><input type="tel" id="studentMobile" required pattern="[0-9]{10}"></div>
                        <div class="form-group"><label>Email</label><input type="email" id="email"></div>
                        
                        <div class="form-group"><label>Parent Type *</label><select id="parentType"><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option></select></div>
                        <div id="fatherFields">
                            <div class="form-row"><div class="form-group"><label>Father Name *</label><input type="text" id="fatherName"></div><div class="form-group"><label>Father Mobile *</label><input type="tel" id="fatherMobile"></div></div>
                        </div>
                        <div id="motherFields" style="display:none;">
                            <div class="form-row"><div class="form-group"><label>Mother Name *</label><input type="text" id="motherName"></div><div class="form-group"><label>Mother Mobile *</label><input type="tel" id="motherMobile"></div></div>
                        </div>
                        <div id="guardianFields" style="display:none;">
                            <div class="form-row"><div class="form-group"><label>Guardian Name *</label><input type="text" id="guardianName"></div><div class="form-group"><label>Guardian Mobile *</label><input type="tel" id="guardianMobile"></div></div>
                            <div class="form-group"><label>Relation *</label><input type="text" id="guardianRelation" placeholder="e.g., Uncle, Aunt"></div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group"><label>Board *</label><select id="board">${allBoards.map(b => `<option value="${b}">${b}</option>`).join('')}</select></div>
                            <div class="form-group"><label>Class *</label><select id="class">${allClasses.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                        </div>
                        <div class="form-group"><label>Monthly Fees (₹) *</label><input type="number" id="monthlyFees" required></div>
                        
                        <div class="form-group"><label>Student Photo *</label><input type="hidden" id="photo"><img id="photoPreview" class="image-preview" style="display:none;"><div class="image-actions"><button type="button" class="btn btn-primary btn-sm" id="capturePhotoBtn">📷 Capture Photo</button><button type="button" class="btn btn-info btn-sm" id="uploadPhotoBtn">📁 Upload Photo</button></div></div>
                        <div class="form-group"><label>Aadhar Document *</label><input type="hidden" id="aadharDoc"><img id="aadharPreview" class="image-preview" style="display:none;"><div class="image-actions"><button type="button" class="btn btn-primary btn-sm" id="captureAadharBtn">📷 Capture Aadhar</button><button type="button" class="btn btn-info btn-sm" id="uploadAadharBtn">📁 Upload Aadhar</button></div></div>
                        
                        <div class="form-group"><label>Current Address *</label><textarea id="currentAddress" rows="2"></textarea></div>
                        <div class="form-group"><label>Permanent Address</label><textarea id="permanentAddress" rows="2"></textarea></div>
                        
                        <div class="btn-group">
                            <button type="button" class="btn btn-primary" id="registerStudentBtn">✅ Register Student</button>
                            <button type="button" class="btn btn-warning" id="resetFormBtn">🔄 Reset</button>
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
            <div class="modal-content" style="max-width: 1200px;">
                <div class="modal-header">
                    <h3 id="dashboardTitle">Student Dashboard</h3>
                    <button class="close-modal" id="closeDashboardModal">×</button>
                </div>
                <div class="modal-body" id="dashboardBody"></div>
                <div class="modal-footer">
                    <button class="btn btn-danger" id="deleteStudentBtn" style="display:none;">🗑️ Delete Student</button>
                    <button class="btn btn-warning" id="blockStudentBtn" style="display:none;">🔴 Block Student</button>
                    <button class="btn btn-success" id="unblockStudentBtn" style="display:none;">🟢 Unblock Student</button>
                    <button class="btn btn-primary" id="editStudentBtn" style="display:none;">✏️ Edit</button>
                    <button class="btn btn-success" id="saveEditBtn" style="display:none;">💾 Save Changes</button>
                    <button class="btn btn-info" id="exportReportBtn" style="display:none;">📎 Export Report</button>
                    <button class="btn btn-primary" id="reAdmitBtn" style="display:none;">🔄 Re-admit</button>
                    <button class="btn" id="cancelEditBtn" style="display:none;">Cancel</button>
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
            // Tab switching
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
            });
            
            // Modal close
            document.getElementById('closeDashboardModal')?.addEventListener('click', () => closeModal('dashboardModal'));
            
            // Filters
            document.getElementById('filterBoard')?.addEventListener('change', () => this.renderStudentsGrid());
            document.getElementById('filterClass')?.addEventListener('change', () => this.renderStudentsGrid());
            document.getElementById('filterSession')?.addEventListener('change', () => this.renderStudentsGrid());
            document.getElementById('searchStudent')?.addEventListener('input', () => this.renderStudentsGrid());
            document.getElementById('oldFilterBoard')?.addEventListener('change', () => this.renderOldStudentsGrid());
            document.getElementById('oldFilterClass')?.addEventListener('change', () => this.renderOldStudentsGrid());
            document.getElementById('oldFilterSession')?.addEventListener('change', () => this.renderOldStudentsGrid());
            document.getElementById('searchOld')?.addEventListener('input', () => this.renderOldStudentsGrid());
            document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadStudents());
            
            // New Admission
            document.getElementById('registerStudentBtn')?.addEventListener('click', () => this.registerStudent());
            document.getElementById('resetFormBtn')?.addEventListener('click', () => this.resetAdmissionForm());
            document.getElementById('capturePhotoBtn')?.addEventListener('click', () => this.captureImage('photo', 'photoPreview'));
            document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => this.uploadImage('photo', 'photoPreview'));
            document.getElementById('captureAadharBtn')?.addEventListener('click', () => this.captureImage('aadharDoc', 'aadharPreview'));
            document.getElementById('uploadAadharBtn')?.addEventListener('click', () => this.uploadImage('aadharDoc', 'aadharPreview'));
            
            // Logout
            document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
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
            currentTab = tab;
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.dataset.pane === tab);
            });
            if (tab === 'students') this.renderStudentsGrid();
            if (tab === 'old-students') this.renderOldStudentsGrid();
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
                showAlert('Network error: ' + err.message, 'error');
                return { success: false, message: err.message };
            }
        }

        async loadStudents() {
            try {
                const response = await this.apiCall('/students');
                if (response.success) {
                    this.students = response.data;
                    this.renderStudentsGrid();
                }
            } catch (err) {
                showAlert('Error loading students', 'error');
            }
        }

        async loadOldStudents() {
            try {
                const response = await this.apiCall('/old-students');
                if (response.success) {
                    this.oldStudents = response.data;
                    this.renderOldStudentsGrid();
                }
            } catch (err) {
                showAlert('Error loading old students', 'error');
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
                s.studentId.includes(search) || 
                `${s.studentName?.first} ${s.studentName?.last}`.toLowerCase().includes(search)
            );
            
            const grid = document.getElementById('studentsGrid');
            if (!grid) return;
            
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state">📭 No students found</div>';
                return;
            }
            
            grid.innerHTML = filtered.map(s => `
                <div class="student-card" data-id="${s.studentId}">
                    <div class="student-card-header">
                        <img src="${s.photo || DEFAULT_PHOTO}" class="student-card-img" onerror="this.src='${DEFAULT_PHOTO}'">
                        <div class="student-card-name">${s.studentName?.first || ''} ${s.studentName?.last || ''}</div>
                        <div class="student-card-id">${s.studentId}</div>
                    </div>
                    <div class="student-card-body">
                        <div class="student-card-info"><span>📞 Mobile:</span><span>${s.studentMobile || '-'}</span></div>
                        <div class="student-card-info"><span>📚 Class:</span><span>${s.education?.class || '-'}</span></div>
                        <div class="student-card-info"><span>📅 Session:</span><span>${s.currentSession?.sessionName || '-'}</span></div>
                        <div class="student-card-info"><span>💰 Status:</span><span>${s.accountStatus?.isBlocked ? '<span class="badge-blocked">Blocked</span>' : '<span class="badge-active">Active</span>'}</span></div>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('.student-card').forEach(card => {
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
                s.studentId.includes(search) || 
                `${s.studentName?.first} ${s.studentName?.last}`.toLowerCase().includes(search)
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
                        <div class="student-card-id">${s.studentId}</div>
                    </div>
                    <div class="student-card-body">
                        <div class="student-card-info"><span>📞 Mobile:</span><span>${s.studentMobile || '-'}</span></div>
                        <div class="student-card-info"><span>📚 Class:</span><span>${s.education?.class || '-'}</span></div>
                        <div class="student-card-info"><span>📅 Completed:</span><span>${formatDate(s.sessionCompletedAt)}</span></div>
                        <div class="student-card-info"><span>💰 Total Paid:</span><span>₹${(s.totalFeesPaid || 0).toLocaleString()}</span></div>
                        <div class="student-card-info"><span>⚠️ Due:</span><span>₹${(s.totalFeesDue || 0).toLocaleString()}</span></div>
                        <div class="student-card-info"><span>📊 Attendance:</span><span>${Math.round(s.attendancePercentage || 0)}%</span></div>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('#oldStudentsGrid .student-card').forEach(card => {
                card.addEventListener('click', () => this.showStudentDashboard(card.dataset.id, true));
            });
        }

        async showStudentDashboard(studentId, isOld = false) {
            try {
                let student;
                if (isOld) {
                    student = this.oldStudents?.find(s => s.studentId === studentId);
                } else {
                    const response = await this.apiCall(`/students/${studentId}`);
                    if (response.success) student = response.data;
                }
                
                if (!student) {
                    showAlert('Student not found', 'error');
                    return;
                }
                
                currentViewStudent = student;
                this.renderDashboard(student, isOld);
                document.getElementById('dashboardModal').classList.add('active');
            } catch (err) {
                showAlert('Error loading dashboard', 'error');
            }
        }

        renderDashboard(student, isOld = false) {
            const body = document.getElementById('dashboardBody');
            if (!body) return;
            
            const totalFees = student.feesHistory?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
            const paidFees = student.feesHistory?.reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0;
            const dueFees = totalFees - paidFees;
            const totalDays = student.attendance?.length || 0;
            const presentDays = student.attendance?.filter(a => a.status === 'present').length || 0;
            const attendancePercent = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
            
            // Prepare chart data
            const last12Months = this.getLast12Months();
            const attendanceData = this.getAttendanceData(student, last12Months);
            const feesData = this.getFeesData(student, last12Months);
            
            body.innerHTML = `
                <div class="dashboard-container">
                    <div class="dashboard-header">
                        <img src="${student.photo || DEFAULT_PHOTO}" class="dashboard-photo" onerror="this.src='${DEFAULT_PHOTO}'" id="dashboardPhoto">
                        <div class="dashboard-info">
                            ${!isEditMode ? `
                                <div class="info-row"><div class="info-label">Student ID:</div><div class="info-value" id="viewStudentId">${student.studentId}</div></div>
                                <div class="info-row"><div class="info-label">Name:</div><div class="info-value" id="viewName">${student.studentName?.first || ''} ${student.studentName?.middle || ''} ${student.studentName?.last || ''}</div></div>
                                <div class="info-row"><div class="info-label">Mobile:</div><div class="info-value" id="viewMobile">${student.studentMobile || '-'}</div></div>
                                <div class="info-row"><div class="info-label">Board & Class:</div><div class="info-value" id="viewEducation">${student.education?.board || '-'} - ${student.education?.class || '-'}</div></div>
                                <div class="info-row"><div class="info-label">Session:</div><div class="info-value" id="viewSession">${student.currentSession?.sessionName || '-'} (${formatDate(student.currentSession?.startDate)} to ${formatDate(student.currentSession?.endDate)})</div></div>
                                <div class="info-row"><div class="info-label">Monthly Fees:</div><div class="info-value" id="viewFees">₹${student.monthlyFees || 0}</div></div>
                            ` : `
                                <div class="info-row"><div class="info-label">Student ID:</div><div class="info-value"><strong>${student.studentId}</strong> (Cannot edit)</div></div>
                                <div class="info-row"><div class="info-label">First Name:</div><div class="info-value"><input type="text" id="editFirstName" value="${student.studentName?.first || ''}" class="form-control"></div></div>
                                <div class="info-row"><div class="info-label">Middle Name:</div><div class="info-value"><input type="text" id="editMiddleName" value="${student.studentName?.middle || ''}" class="form-control"></div></div>
                                <div class="info-row"><div class="info-label">Last Name:</div><div class="info-value"><input type="text" id="editLastName" value="${student.studentName?.last || ''}" class="form-control"></div></div>
                                <div class="info-row"><div class="info-label">Mobile:</div><div class="info-value"><input type="tel" id="editMobile" value="${student.studentMobile || ''}" class="form-control"></div></div>
                                <div class="info-row"><div class="info-label">Board:</div><div class="info-value"><select id="editBoard" class="form-control">${allBoards.map(b => `<option value="${b}" ${student.education?.board === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div></div>
                                <div class="info-row"><div class="info-label">Class:</div><div class="info-value"><select id="editClass" class="form-control">${allClasses.map(c => `<option value="${c}" ${student.education?.class === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
                                <div class="info-row"><div class="info-label">Monthly Fees:</div><div class="info-value"><input type="number" id="editMonthlyFees" value="${student.monthlyFees || 0}" class="form-control"></div></div>
                            `}
                        </div>
                    </div>
                    
                    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div class="stat-card" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                            <h3>₹${paidFees.toLocaleString()}</h3><p>Total Paid</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                            <h3>₹${dueFees.toLocaleString()}</h3><p>Total Due</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                            <h3>${Math.round(attendancePercent)}%</h3><p>Attendance</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #ffc107, #fd7e14); color: #333; padding: 15px; border-radius: 10px; text-align: center;">
                            <h3>${student.accountStatus?.isBlocked ? '🔴 BLOCKED' : '🟢 ACTIVE'}</h3><p>Status</p>
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
                        <div class="chart-title">📋 Fees History Details</div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead><tr><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th>${!isOld && isEditMode ? '<th>Action</th>' : ''}</tr></thead>
                                <tbody id="feesTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-title">📅 Attendance Records</div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th>${!isOld && isEditMode ? '<th>Action</th>' : ''}</tr></thead>
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
                </div>
            `;
            
            // Populate tables
            this.populateFeesTable(student, isOld);
            this.populateAttendanceTable(student, isOld);
            this.populateBlockHistory(student);
            
            // Render charts
            this.renderAttendanceChart(attendanceData);
            this.renderFeesChart(feesData);
            this.renderDueTrendChart(feesData);
            
            // Show/hide buttons
            document.getElementById('deleteStudentBtn').style.display = !isOld && !isEditMode ? 'inline-flex' : 'none';
            document.getElementById('blockStudentBtn').style.display = !isOld && !isEditMode && !student.accountStatus?.isBlocked ? 'inline-flex' : 'none';
            document.getElementById('unblockStudentBtn').style.display = !isOld && !isEditMode && student.accountStatus?.isBlocked ? 'inline-flex' : 'none';
            document.getElementById('editStudentBtn').style.display = !isOld && !isEditMode ? 'inline-flex' : 'none';
            document.getElementById('saveEditBtn').style.display = !isOld && isEditMode ? 'inline-flex' : 'none';
            document.getElementById('cancelEditBtn').style.display = !isOld && isEditMode ? 'inline-flex' : 'none';
            document.getElementById('exportReportBtn').style.display = 'inline-flex';
            document.getElementById('reAdmitBtn').style.display = isOld ? 'inline-flex' : 'none';
            
            // Attach button events
            document.getElementById('deleteStudentBtn')?.addEventListener('click', () => this.deleteStudent(student.studentId));
            document.getElementById('blockStudentBtn')?.addEventListener('click', () => this.blockStudent(student.studentId));
            document.getElementById('unblockStudentBtn')?.addEventListener('click', () => this.unblockStudent(student.studentId));
            document.getElementById('editStudentBtn')?.addEventListener('click', () => this.enableEditMode(student));
            document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEditStudent(student));
            document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.cancelEditMode(student));
            document.getElementById('exportReportBtn')?.addEventListener('click', () => this.exportStudentReport(student));
            document.getElementById('reAdmitBtn')?.addEventListener('click', () => this.reAdmitStudent(student));
        }

        populateFeesTable(student, isOld) {
            const tbody = document.getElementById('feesTableBody');
            if (!tbody) return;
            
            const feesHistory = student.feesHistory || [];
            tbody.innerHTML = feesHistory.map(f => `
                <tr>
                    <td>${f.month} ${f.year}</td>
                    <td>₹${f.amount}</td>
                    <td>${!isOld && isEditMode ? `<input type="number" class="edit-paid-amount" data-month="${f.month}" data-year="${f.year}" value="${f.paidAmount || 0}" style="width:80px;">` : `₹${f.paidAmount || 0}`}</td>
                    <td>₹${f.dueAmount || 0}</td>
                    <td>${getStatusBadge(f.status)}</td>
                    ${!isOld && isEditMode ? `<td><button class="btn btn-sm btn-primary update-fees-btn" data-month="${f.month}" data-year="${f.year}">Update</button></td>` : ''}
                </tr>
            `).join('');
            
            if (!isOld && isEditMode) {
                document.querySelectorAll('.update-fees-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const month = btn.dataset.month;
                        const year = parseInt(btn.dataset.year);
                        const paidInput = document.querySelector(`.edit-paid-amount[data-month="${month}"][data-year="${year}"]`);
                        const paidAmount = parseInt(paidInput?.value || 0);
                        await this.updateFees(student.studentId, month, year, paidAmount, student.currentSession?.sessionName);
                    });
                });
            }
        }

        populateAttendanceTable(student, isOld) {
            const tbody = document.getElementById('attendanceTableBody');
            if (!tbody) return;
            
            const attendance = (student.attendance || []).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
            tbody.innerHTML = attendance.map(a => `
                <tr>
                    <td>${formatDate(a.date)}</td>
                    <td>${!isOld && isEditMode ? `<select class="edit-att-status" data-date="${a.date}"><option value="present" ${a.status === 'present' ? 'selected' : ''}>Present</option><option value="absent" ${a.status === 'absent' ? 'selected' : ''}>Absent</option><option value="late" ${a.status === 'late' ? 'selected' : ''}>Late</option><option value="half-day" ${a.status === 'half-day' ? 'selected' : ''}>Half Day</option></select>` : a.status}</td>
                    <td>${!isOld && isEditMode ? `<input type="time" class="edit-checkin" data-date="${a.date}" value="${a.checkInTime || ''}">` : a.checkInTime || '-'}</td>
                    <td>${!isOld && isEditMode ? `<input type="time" class="edit-checkout" data-date="${a.date}" value="${a.checkOutTime || ''}">` : a.checkOutTime || '-'}</td>
                    <td>${!isOld && isEditMode ? `<input type="text" class="edit-att-remarks" data-date="${a.date}" value="${a.remarks || ''}" style="width:100px;">` : a.remarks || '-'}</td>
                    ${!isOld && isEditMode ? `<td><button class="btn btn-sm btn-primary update-attendance-btn" data-date="${a.date}">Save</button></td>` : ''}
                </tr>
            `).join('');
            
            if (!isOld && isEditMode) {
                document.querySelectorAll('.update-attendance-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const date = btn.dataset.date;
                        const status = document.querySelector(`.edit-att-status[data-date="${date}"]`)?.value;
                        const checkInTime = document.querySelector(`.edit-checkin[data-date="${date}"]`)?.value;
                        const checkOutTime = document.querySelector(`.edit-checkout[data-date="${date}"]`)?.value;
                        const remarks = document.querySelector(`.edit-att-remarks[data-date="${date}"]`)?.value;
                        await this.updateAttendance(student.studentId, date, status, checkInTime, checkOutTime, remarks);
                    });
                });
            }
        }

        populateBlockHistory(student) {
            const tbody = document.getElementById('blockHistoryBody');
            if (!tbody) return;
            
            const blocks = student.blockHistory || [];
            tbody.innerHTML = blocks.map(b => `
                <tr>
                    <td>${formatDate(b.blockedFrom)}</td>
                    <td>${b.blockedUntil ? formatDate(b.blockedUntil) : 'Permanent'}</td>
                    <td>${b.reason || '-'}</td>
                    <td>${b.unblockedAt ? formatDate(b.unblockedAt) : 'Still Blocked'}</td>
                </tr>
            `).join('');
            
            if (blocks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No block history</td></tr>';
            }
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
            return months.map(m => {
                const monthAttendance = (student.attendance || []).filter(a => {
                    const d = new Date(a.date);
                    return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
                });
                const present = monthAttendance.filter(a => a.status === 'present').length;
                const total = monthAttendance.length;
                return total > 0 ? (present / total) * 100 : 0;
            });
        }

        getFeesData(student, months) {
            return months.map(m => {
                const fee = (student.feesHistory || []).find(f => f.monthIndex === m.monthIndex && f.year === m.year);
                return {
                    paid: fee?.paidAmount || 0,
                    due: fee?.dueAmount || 0,
                    amount: fee?.amount || 0
                };
            });
        }

        renderAttendanceChart(data) {
            const ctx = document.getElementById('attendanceChart')?.getContext('2d');
            if (!ctx) return;
            if (charts.attendance) charts.attendance.destroy();
            charts.attendance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.getLast12Months().map(m => m.name),
                    datasets: [{
                        label: 'Attendance %',
                        data: data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true, scales: { y: { min: 0, max: 100 } } }
            });
        }

        renderFeesChart(data) {
            const ctx = document.getElementById('feesChart')?.getContext('2d');
            if (!ctx) return;
            if (charts.fees) charts.fees.destroy();
            charts.fees = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: this.getLast12Months().map(m => m.name),
                    datasets: [
                        { label: 'Paid Amount', data: data.map(d => d.paid), backgroundColor: '#28a745' },
                        { label: 'Due Amount', data: data.map(d => d.due), backgroundColor: '#dc3545' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }
            });
        }

        renderDueTrendChart(data) {
            const ctx = document.getElementById('dueTrendChart')?.getContext('2d');
            if (!ctx) return;
            if (charts.dueTrend) charts.dueTrend.destroy();
            charts.dueTrend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.getLast12Months().map(m => m.name),
                    datasets: [{
                        label: 'Due Amount (₹)',
                        data: data.map(d => d.due),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }
            });
        }

        enableEditMode(student) {
            isEditMode = true;
            this.renderDashboard(student, false);
        }

        cancelEditMode(student) {
            isEditMode = false;
            this.renderDashboard(student, false);
        }

        async saveEditStudent(student) {
            try {
                const updatedData = {
                    studentName: {
                        first: document.getElementById('editFirstName')?.value || '',
                        middle: document.getElementById('editMiddleName')?.value || '',
                        last: document.getElementById('editLastName')?.value || ''
                    },
                    studentMobile: document.getElementById('editMobile')?.value || '',
                    education: {
                        board: document.getElementById('editBoard')?.value || '',
                        class: document.getElementById('editClass')?.value || ''
                    },
                    monthlyFees: parseInt(document.getElementById('editMonthlyFees')?.value || 0)
                };
                
                const response = await this.apiCall(`/students/${student.studentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedData)
                });
                
                if (response.success) {
                    showAlert('Student updated successfully', 'success');
                    isEditMode = false;
                    await this.loadStudents();
                    await this.showStudentDashboard(student.studentId, false);
                } else {
                    showAlert(response.message || 'Update failed', 'error');
                }
            } catch (err) {
                showAlert('Error saving student', 'error');
            }
        }

        async updateFees(studentId, month, year, paidAmount, sessionName) {
            try {
                const response = await this.apiCall(`/update-fees/${studentId}`, {
                    method: 'POST',
                    body: JSON.stringify({ month, year, paidAmount, sessionName })
                });
                if (response.success) {
                    showAlert('Fees updated successfully', 'success');
                    await this.loadStudents();
                    await this.showStudentDashboard(studentId, false);
                } else {
                    showAlert(response.message || 'Update failed', 'error');
                }
            } catch (err) {
                showAlert('Error updating fees', 'error');
            }
        }

        async updateAttendance(studentId, date, status, checkInTime, checkOutTime, remarks) {
            try {
                const response = await this.apiCall(`/students/${studentId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify({ date, status, checkInTime, checkOutTime, remarks })
                });
                if (response.success) {
                    showAlert('Attendance updated', 'success');
                    await this.loadStudents();
                    await this.showStudentDashboard(studentId, false);
                } else {
                    showAlert(response.message || 'Update failed', 'error');
                }
            } catch (err) {
                showAlert('Error updating attendance', 'error');
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
                    await this.showStudentDashboard(studentId, false);
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
                const response = await this.apiCall(`/students/${studentId}/unblock`, {
                    method: 'POST'
                });
                if (response.success) {
                    showAlert('Student unblocked successfully', 'success');
                    await this.loadStudents();
                    await this.showStudentDashboard(studentId, false);
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
                const response = await this.apiCall(`/students/${studentId}`, {
                    method: 'DELETE'
                });
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

        async reAdmitStudent(student) {
            const newSession = prompt('Enter new session (e.g., 2026-2027):', allSessions[allSessions.length - 1]);
            if (!newSession) return;
            const newClass = prompt('Enter new class:', student.education?.class || '');
            if (!newClass) return;
            const newFees = prompt('Enter new monthly fees:', student.monthlyFees || 1000);
            
            try {
                const response = await this.apiCall(`/students/${student.studentId}/promote`, {
                    method: 'POST',
                    body: JSON.stringify({
                        newBoard: student.education?.board,
                        newClass: newClass,
                        newMonthlyFees: parseInt(newFees),
                        newJoiningDate: new Date().toISOString().split('T')[0]
                    })
                });
                if (response.success) {
                    showAlert('Student re-admitted successfully', 'success');
                    closeModal('dashboardModal');
                    await this.loadStudents();
                    await this.loadOldStudents();
                } else {
                    showAlert(response.message || 'Re-admission failed', 'error');
                }
            } catch (err) {
                showAlert('Error re-admitting student', 'error');
            }
        }

        exportStudentReport(student) {
            const printWindow = window.open('', '_blank');
            const totalFees = student.feesHistory?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
            const paidFees = student.feesHistory?.reduce((sum, f) => sum + (f.paidAmount || 0), 0) || 0;
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
                        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
                        .summary-card { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 10px; flex: 1; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Bal Bharti Coaching Center</h1>
                        <h2>Student Report</h2>
                    </div>
                    <div class="summary">
                        <div class="summary-card"><h3>₹${totalFees.toLocaleString()}</h3><p>Total Fees</p></div>
                        <div class="summary-card"><h3>₹${paidFees.toLocaleString()}</h3><p>Paid Fees</p></div>
                        <div class="summary-card"><h3>₹${dueFees.toLocaleString()}</h3><p>Due Fees</p></div>
                    </div>
                    <h3>Student Details</h3>
                    <table>
                        <tr><th>Field</th><th>Value</th></tr>
                        <tr><td>Student ID</td><td>${student.studentId}</td></tr>
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
                            ${(student.feesHistory || []).map(f => `
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
            const studentData = {
                studentId: document.getElementById('aadharNumber').value,
                aadharNumber: document.getElementById('aadharNumber').value,
                aadharDocument: document.getElementById('aadharDoc').value || DEFAULT_PHOTO,
                photo: document.getElementById('photo').value || DEFAULT_PHOTO,
                studentName: {
                    first: document.getElementById('firstName').value,
                    middle: document.getElementById('middleName').value,
                    last: document.getElementById('lastName').value
                },
                parentType: document.getElementById('parentType').value,
                studentMobile: document.getElementById('studentMobile').value,
                email: document.getElementById('email').value,
                education: {
                    board: document.getElementById('board').value,
                    class: document.getElementById('class').value
                },
                monthlyFees: parseInt(document.getElementById('monthlyFees').value),
                joiningDate: document.getElementById('joiningDate').value,
                address: {
                    current: document.getElementById('currentAddress').value,
                    permanent: document.getElementById('permanentAddress').value || document.getElementById('currentAddress').value
                }
            };
            
            // Parent data
            const parentType = studentData.parentType;
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
            
            if (!studentData.studentId || studentData.studentId.length !== 12) {
                showAlert('Please enter valid 12-digit Aadhar number', 'error');
                return;
            }
            if (!studentData.studentMobile || studentData.studentMobile.length !== 10) {
                showAlert('Please enter valid 10-digit mobile number', 'error');
                return;
            }
            
            try {
                const response = await this.apiCall('/student-register', {
                    method: 'POST',
                    body: JSON.stringify(studentData)
                });
                
                if (response.success) {
                    showAlert(`Student registered successfully! ID: ${response.studentId}, Password: ${response.password}`, 'success', 5000);
                    this.resetAdmissionForm();
                    await this.loadStudents();
                    this.switchTab('students');
                } else {
                    showAlert(response.message || 'Registration failed', 'error');
                }
            } catch (err) {
                showAlert('Error registering student', 'error');
            }
        }

        resetAdmissionForm() {
            document.getElementById('admissionForm').reset();
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('photo').value = '';
            document.getElementById('aadharDoc').value = '';
            document.getElementById('photoPreview').style.display = 'none';
            document.getElementById('aadharPreview').style.display = 'none';
            document.getElementById('password').value = Math.random().toString(36).substring(2, 10);
        }

        async captureImage(fieldId, previewId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = async (e) => {
                if (e.target.files && e.target.files[0]) {
                    try {
                        const compressed = await compressImage(e.target.files[0]);
                        document.getElementById(fieldId).value = compressed;
                        const preview = document.getElementById(previewId);
                        if (preview) {
                            preview.src = compressed;
                            preview.style.display = 'block';
                        }
                        showAlert('Image captured and compressed!', 'success');
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
                        const compressed = await compressImage(e.target.files[0]);
                        document.getElementById(fieldId).value = compressed;
                        const preview = document.getElementById(previewId);
                        if (preview) {
                            preview.src = compressed;
                            preview.style.display = 'block';
                        }
                        showAlert('Image uploaded and compressed!', 'success');
                    } catch (err) {
                        showAlert('Error processing image', 'error');
                    }
                }
            };
            input.click();
        }

        logout() {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        new StudentManagementSystem();
    });
})();
