// ============================================
// STUDENT MANAGEMENT SYSTEM
// Complete System with HTML, CSS, and JavaScript
// All in ONE FILE
// ============================================

(function() {
    'use strict';

    // ============================================
    // INJECT HTML & CSS DYNAMICALLY
    // ============================================

    const styles = `
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            
            /* Header */
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
            }
            
            .header h1 {
                font-size: 24px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .header-buttons {
                display: flex;
                gap: 10px;
            }
            
            .logout-btn {
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .logout-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                padding: 30px;
                background: #f8f9fa;
            }
            
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
            }
            
            .stat-card h3 {
                color: #667eea;
                font-size: 14px;
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            
            .stat-card p {
                font-size: 32px;
                font-weight: bold;
                color: #333;
            }
            
            /* Toolbar */
            .toolbar {
                padding: 20px 30px;
                background: white;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
            }
            
            .search-box {
                display: flex;
                gap: 10px;
                flex: 1;
                max-width: 400px;
            }
            
            .search-box input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .btn-primary {
                background: #667eea;
                color: white;
            }
            
            .btn-primary:hover {
                background: #5a67d8;
                transform: translateY(-2px);
            }
            
            .btn-danger {
                background: #e53e3e;
                color: white;
            }
            
            .btn-danger:hover {
                background: #c53030;
            }
            
            .btn-success {
                background: #48bb78;
                color: white;
            }
            
            .btn-warning {
                background: #ed8936;
                color: white;
            }
            
            /* Table */
            .table-container {
                overflow-x: auto;
                padding: 0 30px;
            }
            
            .students-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .students-table th {
                background: #f8f9fa;
                padding: 15px;
                text-align: left;
                font-weight: 600;
                color: #4a5568;
                border-bottom: 2px solid #e0e0e0;
            }
            
            .students-table td {
                padding: 15px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .students-table tr:hover {
                background: #f7fafc;
            }
            
            /* Badges */
            .badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .badge-success {
                background: #c6f6d5;
                color: #22543d;
            }
            
            .badge-danger {
                background: #fed7d7;
                color: #742a2a;
            }
            
            .badge-warning {
                background: #feebc8;
                color: #7c2d12;
            }
            
            /* Action Buttons */
            .action-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .btn-icon {
                padding: 6px 10px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .btn-view { background: #4299e1; color: white; }
            .btn-edit { background: #48bb78; color: white; }
            .btn-fees { background: #ed8936; color: white; }
            .btn-attendance { background: #9f7aea; color: white; }
            .btn-block { background: #e53e3e; color: white; }
            .btn-unblock { background: #38a169; color: white; }
            .btn-promote { background: #d69e2e; color: white; }
            .btn-delete { background: #c53030; color: white; }
            
            .btn-icon:hover {
                transform: scale(1.05);
            }
            
            /* Pagination */
            .pagination {
                padding: 20px 30px;
                display: flex;
                justify-content: center;
                gap: 10px;
            }
            
            .pagination button {
                padding: 8px 15px;
                border: 1px solid #ddd;
                background: white;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.3s;
            }
            
            .pagination button:hover {
                background: #667eea;
                color: white;
            }
            
            .pagination button.active {
                background: #667eea;
                color: white;
            }
            
            .pagination button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* Modal */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
                overflow-y: auto;
            }
            
            .modal-content {
                background: white;
                max-width: 800px;
                margin: 50px auto;
                border-radius: 15px;
                animation: slideDown 0.3s ease;
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .modal-header {
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .close-modal {
                font-size: 28px;
                cursor: pointer;
                background: none;
                border: none;
                color: white;
            }
            
            .modal-body {
                padding: 20px;
                max-height: 500px;
                overflow-y: auto;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #4a5568;
            }
            
            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .form-row-3 {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
            }
            
            /* Loading Overlay */
            .loading-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 2000;
                justify-content: center;
                align-items: center;
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Toast */
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                z-index: 3000;
                animation: slideIn 0.3s ease;
                display: none;
            }
            
            .toast.success { background: #48bb78; }
            .toast.error { background: #e53e3e; }
            .toast.info { background: #4299e1; }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                }
                to {
                    transform: translateX(0);
                }
            }
            
            /* Details Grid */
            .details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .detail-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
            }
            
            .detail-card h4 {
                color: #667eea;
                margin-bottom: 10px;
                border-bottom: 2px solid #667eea;
                padding-bottom: 5px;
            }
            
            .detail-card p {
                margin: 8px 0;
                font-size: 14px;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .toolbar {
                    flex-direction: column;
                }
                
                .search-box {
                    max-width: 100%;
                }
                
                .action-buttons {
                    flex-direction: column;
                }
                
                .form-row, .form-row-3 {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Image Preview */
            .image-preview {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .text-center {
                text-align: center;
            }
            
            .bg-red-50 { background: #fff5f5; }
            .bg-yellow-50 { background: #fffff0; }
            .text-green-600 { color: #38a169; }
        </style>
    `;

    const html = `
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>
                    📚 Bal Bharti Coaching Center
                    <span style="font-size: 14px;">Student Management System</span>
                </h1>
                <div class="header-buttons">
                    <button class="logout-btn" onclick="studentManagement.logout()">🚪 Logout</button>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Students</h3>
                    <p id="totalStudents">0</p>
                </div>
                <div class="stat-card">
                    <h3>Active Students</h3>
                    <p id="activeStudents">0</p>
                </div>
                <div class="stat-card">
                    <h3>Blocked Students</h3>
                    <p id="blockedStudents">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Fees Due</h3>
                    <p id="totalFeesDue">₹0</p>
                </div>
            </div>
            
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="🔍 Search by ID, Name, or Mobile...">
                    <button class="btn btn-primary" onclick="studentManagement.searchStudents()">Search</button>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="studentManagement.openAddStudentModal()">➕ Add Student</button>
                    <button class="btn btn-success" onclick="studentManagement.checkSessionCompletion()">📅 Check Session</button>
                    <button class="btn btn-warning" onclick="studentManagement.exportToExcel()">📊 Export</button>
                </div>
            </div>
            
            <!-- Students Table -->
            <div class="table-container">
                <table class="students-table">
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Status</th>
                            <th>Session</th>
                            <th>Fees</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        <tr><td colspan="8" class="text-center">Loading students...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div id="pagination" class="pagination"></div>
        </div>
        
        <!-- Add/Edit Student Modal -->
        <div id="studentModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="studentModalTitle">Add New Student</h2>
                    <button class="close-modal" onclick="studentManagement.closeModal('studentModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="studentForm" onsubmit="event.preventDefault(); studentManagement.saveStudent();">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Student ID *</label>
                                <input type="text" id="studentId" required>
                            </div>
                            <div class="form-group">
                                <label>Password *</label>
                                <input type="password" id="password">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>First Name *</label>
                                <input type="text" id="firstName" required>
                            </div>
                            <div class="form-group">
                                <label>Last Name *</label>
                                <input type="text" id="lastName" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mobile Number *</label>
                                <input type="tel" id="studentMobile" required>
                            </div>
                            <div class="form-group">
                                <label>Alternate Mobile</label>
                                <input type="tel" id="alternateMobile">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="email">
                        </div>
                        
                        <div class="form-group">
                            <label>Parent Type *</label>
                            <select id="parentType" onchange="studentManagement.toggleParentFields(this.value)">
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Guardian">Guardian</option>
                            </select>
                        </div>
                        
                        <!-- Father Section -->
                        <div id="fatherSection">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Father's First Name</label>
                                    <input type="text" id="fatherFirstName">
                                </div>
                                <div class="form-group">
                                    <label>Father's Last Name</label>
                                    <input type="text" id="fatherLastName">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Father's Mobile *</label>
                                <input type="tel" id="fatherMobile">
                            </div>
                        </div>
                        
                        <!-- Mother Section -->
                        <div id="motherSection" style="display:none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Mother's First Name</label>
                                    <input type="text" id="motherFirstName">
                                </div>
                                <div class="form-group">
                                    <label>Mother's Last Name</label>
                                    <input type="text" id="motherLastName">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Mother's Mobile *</label>
                                <input type="tel" id="motherMobile">
                            </div>
                        </div>
                        
                        <!-- Guardian Section -->
                        <div id="guardianSection" style="display:none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Guardian's First Name</label>
                                    <input type="text" id="guardianFirstName">
                                </div>
                                <div class="form-group">
                                    <label>Guardian's Last Name</label>
                                    <input type="text" id="guardianLastName">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Guardian's Mobile *</label>
                                    <input type="tel" id="guardianMobile">
                                </div>
                                <div class="form-group">
                                    <label>Relation *</label>
                                    <input type="text" id="guardianRelation" placeholder="e.g., Uncle, Aunt, Brother">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Aadhar Number *</label>
                                <input type="text" id="aadharNumber" required>
                            </div>
                            <div class="form-group">
                                <label>Aadhar Document URL *</label>
                                <input type="text" id="aadharDocument" placeholder="Image URL" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Board *</label>
                                <input type="text" id="board" required>
                            </div>
                            <div class="form-group">
                                <label>Class *</label>
                                <input type="text" id="class" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Monthly Fees (₹) *</label>
                                <input type="number" id="monthlyFees" required>
                            </div>
                            <div class="form-group">
                                <label>Joining Date *</label>
                                <input type="date" id="joiningDate" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Photo URL *</label>
                            <input type="text" id="photo" placeholder="Student photo URL" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Current Address *</label>
                            <textarea id="currentAddress" rows="2" required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Permanent Address *</label>
                            <textarea id="permanentAddress" rows="2" required></textarea>
                        </div>
                        
                        <div class="form-row-3">
                            <div class="form-group">
                                <label>City</label>
                                <input type="text" id="city">
                            </div>
                            <div class="form-group">
                                <label>State</label>
                                <input type="text" id="state">
                            </div>
                            <div class="form-group">
                                <label>Pincode</label>
                                <input type="text" id="pincode">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Previous School</label>
                            <input type="text" id="previousSchool">
                        </div>
                        
                        <div class="form-group">
                            <label>Remarks</label>
                            <textarea id="remarks" rows="2"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">Save Student</button>
                            <button type="button" class="btn btn-danger" onclick="studentManagement.closeModal('studentModal')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Fees Modal -->
        <div id="feesModal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>Fees Management</h2>
                    <button class="close-modal" onclick="studentManagement.closeModal('feesModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid" style="padding: 0; margin-bottom: 20px;">
                        <div class="stat-card">
                            <h3>Total Amount</h3>
                            <p id="feesTotalAmount">₹0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Total Paid</h3>
                            <p id="feesTotalPaid">₹0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Total Due</h3>
                            <p id="feesTotalDue">₹0</p>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="students-table">
                            <thead>
                                <tr><th>Session</th><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody id="feesTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Attendance Modal -->
        <div id="attendanceModal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>Attendance Management</h2>
                    <button class="close-modal" onclick="studentManagement.closeModal('attendanceModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid" style="padding: 0; margin-bottom: 20px;">
                        <div class="stat-card"><h3>Total Days</h3><p id="attendanceTotalDays">0</p></div>
                        <div class="stat-card"><h3>Present</h3><p id="attendancePresent">0</p></div>
                        <div class="stat-card"><h3>Absent</h3><p id="attendanceAbsent">0</p></div>
                        <div class="stat-card"><h3>Late</h3><p id="attendanceLate">0</p></div>
                        <div class="stat-card"><h3>Percentage</h3><p id="attendancePercentage">0%</p></div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                        <h4>Mark Today's Attendance</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date</label>
                                <input type="date" id="attendanceDate">
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select id="attendanceStatus">
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="half-day">Half Day</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Remarks</label>
                                <input type="text" id="attendanceRemarks" placeholder="Optional">
                            </div>
                            <div class="form-group">
                                <button class="btn btn-primary" onclick="studentManagement.markAttendance()" style="margin-top: 28px;">Mark Attendance</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="students-table">
                            <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Remarks</th></tr></thead>
                            <tbody id="attendanceTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- View Student Modal -->
        <div id="viewStudentModal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>Student Details</h2>
                    <button class="close-modal" onclick="studentManagement.closeModal('viewStudentModal')">&times;</button>
                </div>
                <div class="modal-body" id="viewStudentModalBody">
                </div>
            </div>
        </div>
        
        <!-- Loading Overlay -->
        <div id="loadingOverlay" class="loading-overlay">
            <div class="loading-spinner"></div>
        </div>
        
        <!-- Toast -->
        <div id="toast" class="toast"></div>
    `;

    // Inject HTML and CSS
    document.head.insertAdjacentHTML('beforeend', styles);
    document.body.innerHTML = html;

    // ============================================
    // STUDENT MANAGEMENT CLASS
    // ============================================

    class StudentManagementSystem {
        constructor() {
            this.currentPage = 1;
            this.pageSize = 10;
            this.totalStudents = 0;
            this.currentStudent = null;
            this.token = localStorage.getItem('adminToken');
            this.apiBaseUrl = '/api';
            this.init();
        }

        async init() {
            console.log('🚀 Student Management System Initialized');
            await this.checkAuth();
            await this.loadStudents();
            await this.loadStats();
            this.bindEvents();
        }

        async checkAuth() {
            if (!this.token) {
                window.location.href = '/login.html';
                return false;
            }
            
            // Verify token
            try {
                const response = await fetch(`${this.apiBaseUrl}/verify-token`, {
                    headers: this.getHeaders()
                });
                if (!response.ok) {
                    localStorage.removeItem('adminToken');
                    window.location.href = '/login.html';
                }
            } catch (error) {
                console.error('Auth check error:', error);
            }
            return true;
        }

        getHeaders() {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            };
        }

        showLoading(show = true) {
            const loader = document.getElementById('loadingOverlay');
            if (loader) loader.style.display = show ? 'flex' : 'none';
        }

        showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = message;
                toast.className = `toast ${type}`;
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 3000);
            }
        }

        async loadStudents(page = 1) {
            this.showLoading(true);
            this.currentPage = page;

            try {
                const response = await fetch(`${this.apiBaseUrl}/students`, {
                    headers: this.getHeaders()
                });

                if (!response.ok) throw new Error('Failed to load students');

                const result = await response.json();
                
                if (result.success) {
                    this.totalStudents = result.data.length;
                    this.renderStudentsTable(result.data);
                    this.renderPagination();
                }
            } catch (error) {
                console.error('Load students error:', error);
                this.showToast('Failed to load students', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async loadStats() {
            try {
                const response = await fetch(`${this.apiBaseUrl}/students`, {
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const students = result.data;
                    const totalStudents = students.length;
                    const activeStudents = students.filter(s => !s.accountStatus?.isBlocked).length;
                    const blockedStudents = students.filter(s => s.accountStatus?.isBlocked).length;
                    const totalFeesDue = students.reduce((sum, s) => {
                        const due = s.feesHistory?.reduce((fsum, f) => fsum + (f.dueAmount || 0), 0) || 0;
                        return sum + due;
                    }, 0);
                    
                    document.getElementById('totalStudents').textContent = totalStudents;
                    document.getElementById('activeStudents').textContent = activeStudents;
                    document.getElementById('blockedStudents').textContent = blockedStudents;
                    document.getElementById('totalFeesDue').textContent = `₹${totalFeesDue.toLocaleString()}`;
                }
            } catch (error) {
                console.error('Load stats error:', error);
            }
        }

        renderStudentsTable(students) {
            const tbody = document.getElementById('studentsTableBody');
            if (!tbody) return;

            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            const pageStudents = students.slice(start, end);

            if (pageStudents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No students found</td></tr>';
                return;
            }

            tbody.innerHTML = pageStudents.map(student => `
                <tr class="${student.accountStatus?.isBlocked ? 'bg-red-50' : ''}">
                    <td><img src="${student.photo || 'https://via.placeholder.com/40'}" class="image-preview" onerror="this.src='https://via.placeholder.com/40'"></td>
                    <td><strong>${student.studentId}</strong></td>
                    <td>${student.studentName?.first || ''} ${student.studentName?.last || ''}</td>
                    <td>${student.studentMobile || '-'}</td>
                    <td>
                        <span class="badge ${student.accountStatus?.isBlocked ? 'badge-danger' : 'badge-success'}">
                            ${student.accountStatus?.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                    </td>
                    <td>${student.currentSession?.sessionName || '-'}</td>
                    <td>₹${student.monthlyFees || 0}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon btn-view" onclick="studentManagement.viewStudent('${student.studentId}')" title="View">👁️</button>
                            <button class="btn-icon btn-edit" onclick="studentManagement.editStudent('${student.studentId}')" title="Edit">✏️</button>
                            <button class="btn-icon btn-fees" onclick="studentManagement.openFeesModal('${student.studentId}')" title="Fees">💰</button>
                            <button class="btn-icon btn-attendance" onclick="studentManagement.openAttendanceModal('${student.studentId}')" title="Attendance">📅</button>
                            ${!student.accountStatus?.isBlocked ? 
                                `<button class="btn-icon btn-block" onclick="studentManagement.blockStudent('${student.studentId}')" title="Block">🔒</button>` :
                                `<button class="btn-icon btn-unblock" onclick="studentManagement.unblockStudent('${student.studentId}')" title="Unblock">🔓</button>`
                            }
                            <button class="btn-icon btn-promote" onclick="studentManagement.promoteStudent('${student.studentId}')" title="Promote">⬆️</button>
                            <button class="btn-icon btn-delete" onclick="studentManagement.deleteStudent('${student.studentId}')" title="Delete">🗑️</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        renderPagination() {
            const pagination = document.getElementById('pagination');
            if (!pagination) return;

            const totalPages = Math.ceil(this.totalStudents / this.pageSize);
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }

            let html = `<button onclick="studentManagement.loadStudents(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
            
            for (let i = 1; i <= Math.min(totalPages, 5); i++) {
                html += `<button onclick="studentManagement.loadStudents(${i})" class="${this.currentPage === i ? 'active' : ''}">${i}</button>`;
            }

            if (totalPages > 5) {
                html += `<span>...</span>`;
                html += `<button onclick="studentManagement.loadStudents(${totalPages})">${totalPages}</button>`;
            }

            html += `<button onclick="studentManagement.loadStudents(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
            pagination.innerHTML = html;
        }

        async searchStudents() {
            const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
            
            if (!searchTerm) {
                await this.loadStudents();
                return;
            }

            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students`, {
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const filtered = result.data.filter(student => 
                        student.studentId.toLowerCase().includes(searchTerm) ||
                        `${student.studentName?.first} ${student.studentName?.last}`.toLowerCase().includes(searchTerm) ||
                        student.studentMobile?.includes(searchTerm)
                    );
                    this.renderStudentsTable(filtered);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                this.showLoading(false);
            }
        }

        openAddStudentModal() {
            this.currentStudent = null;
            document.getElementById('studentModalTitle').textContent = 'Add New Student';
            document.getElementById('studentForm').reset();
            document.getElementById('studentModal').style.display = 'block';
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            this.toggleParentFields('Father');
        }

        async editStudent(studentId) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}`, {
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.currentStudent = result.data;
                    this.populateStudentForm(result.data);
                    document.getElementById('studentModalTitle').textContent = 'Edit Student';
                    document.getElementById('studentModal').style.display = 'block';
                }
            } catch (error) {
                console.error('Edit error:', error);
                this.showToast('Failed to load student data', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        populateStudentForm(student) {
            document.getElementById('studentId').value = student.studentId;
            document.getElementById('firstName').value = student.studentName?.first || '';
            document.getElementById('lastName').value = student.studentName?.last || '';
            document.getElementById('studentMobile').value = student.studentMobile || '';
            document.getElementById('alternateMobile').value = student.alternateMobile || '';
            document.getElementById('email').value = student.email || '';
            document.getElementById('photo').value = student.photo || '';
            
            document.getElementById('parentType').value = student.parentType || 'Father';
            this.toggleParentFields(student.parentType || 'Father');
            
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
            
            document.getElementById('aadharNumber').value = student.aadharNumber || '';
            document.getElementById('aadharDocument').value = student.aadharDocument || '';
            document.getElementById('board').value = student.education?.board || '';
            document.getElementById('class').value = student.education?.class || '';
            document.getElementById('monthlyFees').value = student.monthlyFees || 0;
            
            const joinDate = student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '';
            document.getElementById('joiningDate').value = joinDate;
            
            document.getElementById('currentAddress').value = student.address?.current || '';
            document.getElementById('permanentAddress').value = student.address?.permanent || '';
            document.getElementById('city').value = student.address?.city || '';
            document.getElementById('state').value = student.address?.state || '';
            document.getElementById('pincode').value = student.address?.pincode || '';
            document.getElementById('previousSchool').value = student.previousSchool || '';
            document.getElementById('remarks').value = student.remarks || '';
        }

        toggleParentFields(parentType) {
            const fatherSection = document.getElementById('fatherSection');
            const motherSection = document.getElementById('motherSection');
            const guardianSection = document.getElementById('guardianSection');
            
            if (fatherSection) fatherSection.style.display = 'none';
            if (motherSection) motherSection.style.display = 'none';
            if (guardianSection) guardianSection.style.display = 'none';
            
            if (parentType === 'Father' && fatherSection) fatherSection.style.display = 'block';
            else if (parentType === 'Mother' && motherSection) motherSection.style.display = 'block';
            else if (parentType === 'Guardian' && guardianSection) guardianSection.style.display = 'block';
        }

        async saveStudent() {
            const studentData = this.collectFormData();
            
            if (!this.validateStudentData(studentData)) {
                return;
            }
            
            this.showLoading(true);
            
            try {
                let response;
                
                if (this.currentStudent) {
                    response = await fetch(`${this.apiBaseUrl}/students/${this.currentStudent.studentId}`, {
                        method: 'PUT',
                        headers: this.getHeaders(),
                        body: JSON.stringify(studentData)
                    });
                } else {
                    response = await fetch(`${this.apiBaseUrl}/student-register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });
                }
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.message, 'success');
                    this.closeModal('studentModal');
                    await this.loadStudents();
                    await this.loadStats();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Save error:', error);
                this.showToast('Failed to save student', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        collectFormData() {
            const parentType = document.getElementById('parentType').value;
            
            const data = {
                studentId: document.getElementById('studentId').value,
                password: document.getElementById('password').value,
                photo: document.getElementById('photo').value || 'https://via.placeholder.com/100',
                studentName: {
                    first: document.getElementById('firstName').value,
                    last: document.getElementById('lastName').value
                },
                parentType: parentType,
                studentMobile: document.getElementById('studentMobile').value,
                alternateMobile: document.getElementById('alternateMobile').value,
                email: document.getElementById('email').value,
                aadharNumber: document.getElementById('aadharNumber').value,
                aadharDocument: document.getElementById('aadharDocument').value,
                education: {
                    board: document.getElementById('board').value,
                    class: document.getElementById('class').value
                },
                monthlyFees: parseInt(document.getElementById('monthlyFees').value) || 0,
                joiningDate: document.getElementById('joiningDate').value,
                address: {
                    current: document.getElementById('currentAddress').value,
                    permanent: document.getElementById('permanentAddress').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    pincode: document.getElementById('pincode').value
                },
                previousSchool: document.getElementById('previousSchool').value,
                remarks: document.getElementById('remarks').value
            };
            
            if (parentType === 'Father') {
                data.fatherName = {
                    first: document.getElementById('fatherFirstName').value,
                    last: document.getElementById('fatherLastName').value
                };
                data.fatherMobile = document.getElementById('fatherMobile').value;
            } else if (parentType === 'Mother') {
                data.motherName = {
                    first: document.getElementById('motherFirstName').value,
                    last: document.getElementById('motherLastName').value
                };
                data.motherMobile = document.getElementById('motherMobile').value;
            } else if (parentType === 'Guardian') {
                data.guardianName = {
                    first: document.getElementById('guardianFirstName').value,
                    last: document.getElementById('guardianLastName').value
                };
                data.guardianMobile = document.getElementById('guardianMobile').value;
                data.guardianRelation = document.getElementById('guardianRelation').value;
            }
            
            return data;
        }

        validateStudentData(data) {
            if (!data.studentId) { this.showToast('Student ID is required', 'error'); return false; }
            if (!data.password && !this.currentStudent) { this.showToast('Password is required', 'error'); return false; }
            if (!data.studentName.first || !data.studentName.last) { this.showToast('Student name is required', 'error'); return false; }
            if (!data.studentMobile) { this.showToast('Student mobile number is required', 'error'); return false; }
            if (!data.aadharNumber) { this.showToast('Aadhar number is required', 'error'); return false; }
            if (!data.joiningDate) { this.showToast('Joining date is required', 'error'); return false; }
            
            if (data.parentType === 'Father' && !data.fatherMobile) { this.showToast("Father's mobile is required", 'error'); return false; }
            if (data.parentType === 'Mother' && !data.motherMobile) { this.showToast("Mother's mobile is required", 'error'); return false; }
            if (data.parentType === 'Guardian' && !data.guardianMobile) { this.showToast("Guardian's mobile is required", 'error'); return false; }
            
            return true;
        }

        async openFeesModal(studentId) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}`, {
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.currentStudent = result.data;
                    this.renderFeesTable(result.data);
                    document.getElementById('feesModal').style.display = 'block';
                }
            } catch (error) {
                console.error('Open fees modal error:', error);
                this.showToast('Failed to load fees data', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        renderFeesTable(student) {
            const tbody = document.getElementById('feesTableBody');
            if (!tbody) return;
            
            const feesHistory = student.feesHistory || [];
            
            const totalAmount = feesHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            const totalPaid = feesHistory.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            const totalDue = feesHistory.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
            
            document.getElementById('feesTotalAmount').textContent = `₹${totalAmount.toLocaleString()}`;
            document.getElementById('feesTotalPaid').textContent = `₹${totalPaid.toLocaleString()}`;
            document.getElementById('feesTotalDue').textContent = `₹${totalDue.toLocaleString()}`;
            
            if (feesHistory.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No fees records found</td></tr>';
                return;
            }
            
            tbody.innerHTML = feesHistory.map(fee => `
                <tr class="${fee.status === 'unpaid' ? 'bg-red-50' : fee.status === 'partial' ? 'bg-yellow-50' : ''}">
                    <td>${fee.sessionName || student.currentSession?.sessionName}</td>
                    <td>${fee.month} ${fee.year}</td>
                    <td>₹${(fee.amount || 0).toLocaleString()}</td>
                    <td>₹${(fee.paidAmount || 0).toLocaleString()}</td>
                    <td>₹${(fee.dueAmount || 0).toLocaleString()}</td>
                    <td><span class="badge ${fee.status === 'paid' ? 'badge-success' : fee.status === 'partial' ? 'badge-warning' : 'badge-danger'}">${fee.status?.toUpperCase() || 'UNPAID'}</span></td>
                    <td>${fee.status !== 'paid' ? `<button class="btn btn-primary" onclick="studentManagement.payFee('${student.studentId}', '${fee.month}', ${fee.year}, '${fee.sessionName}')">Pay</button>` : '<span class="text-green-600">✓ Paid</span>'}</td>
                </tr>
            `).join('');
        }

        async payFee(studentId, month, year, sessionName) {
            const amount = prompt(`Enter amount to pay for ${month} ${year}:`);
            if (!amount || isNaN(amount)) return;
            
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/update-fees/${studentId}`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        month: month,
                        year: year,
                        paidAmount: parseInt(amount),
                        sessionName: sessionName
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast('Fees updated successfully', 'success');
                    await this.openFeesModal(studentId);
                    await this.loadStats();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Pay fee error:', error);
                this.showToast('Failed to update fees', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async openAttendanceModal(studentId) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}`, {
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.currentStudent = result.data;
                    this.renderAttendanceTable(result.data);
                    document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
                    document.getElementById('attendanceModal').style.display = 'block';
                }
            } catch (error) {
                console.error('Open attendance modal error:', error);
                this.showToast('Failed to load attendance data', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        renderAttendanceTable(student) {
            const tbody = document.getElementById('attendanceTableBody');
            if (!tbody) return;
            
            const attendance = student.attendance || [];
            
            const totalDays = attendance.length;
            const presentDays = attendance.filter(a => a.status === 'present').length;
            const absentDays = attendance.filter(a => a.status === 'absent').length;
            const lateDays = attendance.filter(a => a.status === 'late').length;
            const percentage = totalDays > 0 ? ((presentDays + lateDays * 0.5) / totalDays * 100).toFixed(1) : 0;
            
            document.getElementById('attendanceTotalDays').textContent = totalDays;
            document.getElementById('attendancePresent').textContent = presentDays;
            document.getElementById('attendanceAbsent').textContent = absentDays;
            document.getElementById('attendanceLate').textContent = lateDays;
            document.getElementById('attendancePercentage').textContent = `${percentage}%`;
            
            if (attendance.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No attendance records found</td></tr>';
                return;
            }
            
            tbody.innerHTML = attendance.slice().reverse().map(att => `
                <tr>
                    <td>${att.date}</td>
                    <td><span class="badge ${att.status === 'present' ? 'badge-success' : att.status === 'late' ? 'badge-warning' : 'badge-danger'}">${att.status?.toUpperCase() || 'ABSENT'}</span></td>
                    <td>${att.checkInTime || '-'}</td>
                    <td>${att.remarks || '-'}</td>
                </tr>
            `).join('');
        }

        async markAttendance() {
            const studentId = this.currentStudent?.studentId;
            const date = document.getElementById('attendanceDate').value;
            const status = document.getElementById('attendanceStatus').value;
            const remarks = document.getElementById('attendanceRemarks').value;
            
            if (!date) { this.showToast('Please select date', 'error'); return; }
            
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}/attendance`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ date, status, remarks })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast('Attendance marked successfully', 'success');
                    await this.openAttendanceModal(studentId);
                } else if (result.isBlocked) {
                    this.showToast(result.message, 'error');
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Mark attendance error:', error);
                this.showToast('Failed to mark attendance', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async blockStudent(studentId) {
            const reason = prompt('Enter reason for blocking the student:');
            if (!reason) return;
            
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}/block`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ reason })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.message, 'success');
                    await this.loadStudents();
                    await this.loadStats();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Block error:', error);
                this.showToast('Failed to block student', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async unblockStudent(studentId) {
            if (!confirm('Are you sure you want to unblock this student?')) return;
            
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}/unblock`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.message, 'success');
                    await this.loadStudents();
                    await this.loadStats();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Unblock error:', error);
                this.showToast('Failed to unblock student', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async promoteStudent(studentId) {
            const newBoard = prompt('Enter new board (e.g., CBSE, ICSE, UP Board):');
            if (!newBoard) return;
            
            const newClass = prompt('Enter new class (e.g., 10th, 11th, 12th):');
            if (!newClass) return;
            
            const newMonthlyFees = prompt('Enter new monthly fees amount:');
            if (!newMonthlyFees || isNaN(newMonthlyFees)) return;
            
            const newJoiningDate = prompt('Enter new joining date (YYYY-MM-DD) or leave empty for today:', new Date().toISOString().split('T')[0]);
            
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}/promote`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        newBoard: newBoard,
                        newClass: newClass,
                        newMonthlyFees: parseInt(newMonthlyFees),
                        newJoiningDate: newJoiningDate
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.message, 'success');
                    await this.loadStudents();
                    await this.loadStats();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Promote error:', error);
                this.showToast('Failed to promote student', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async viewStudent(studentId) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}`, {
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showStudentDetails(result.data);
                }
            } catch (error) {
                console.error('View error:', error);
                this.showToast('Failed to load student details', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        showStudentDetails(student) {
            const modalBody = document.getElementById('viewStudentModalBody');
            if (!modalBody) return;
            
            modalBody.innerHTML = `
                <div class="details-grid">
                    <div class="detail-card">
                        <h4>Basic Information</h4>
                        <p><strong>Student ID:</strong> ${student.studentId}</p>
                        <p><strong>Name:</strong> ${student.studentName?.first} ${student.studentName?.last}</p>
                        <p><strong>Mobile:</strong> ${student.studentMobile}</p>
                        <p><strong>Email:</strong> ${student.email || '-'}</p>
                    </div>
                    
                    <div class="detail-card">
                        <h4>Parent Information</h4>
                        <p><strong>Type:</strong> ${student.parentType}</p>
                        ${student.parentType === 'Father' ? `
                            <p><strong>Father:</strong> ${student.fatherName?.first} ${student.fatherName?.last}</p>
                            <p><strong>Mobile:</strong> ${student.fatherMobile}</p>
                        ` : student.parentType === 'Mother' ? `
                            <p><strong>Mother:</strong> ${student.motherName?.first} ${student.motherName?.last}</p>
                            <p><strong>Mobile:</strong> ${student.motherMobile}</p>
                        ` : `
                            <p><strong>Guardian:</strong> ${student.guardianName?.first} ${student.guardianName?.last}</p>
                            <p><strong>Mobile:</strong> ${student.guardianMobile}</p>
                            <p><strong>Relation:</strong> ${student.guardianRelation}</p>
                        `}
                    </div>
                    
                    <div class="detail-card">
                        <h4>Education</h4>
                        <p><strong>Board:</strong> ${student.education?.board}</p>
                        <p><strong>Class:</strong> ${student.education?.class}</p>
                        <p><strong>Monthly Fees:</strong> ₹${student.monthlyFees}</p>
                    </div>
                    
                    <div class="detail-card">
                        <h4>Session Details</h4>
                        <p><strong>Session:</strong> ${student.currentSession?.sessionName}</p>
                        <p><strong>Joined:</strong> ${new Date(student.joiningDate).toLocaleDateString()}</p>
                        <p><strong>Session End:</strong> ${new Date(student.currentSession?.endDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="detail-card">
                        <h4>Address</h4>
                        <p><strong>Current:</strong> ${student.address?.current}</p>
                        <p><strong>Permanent:</strong> ${student.address?.permanent}</p>
                        <p>${student.address?.city}, ${student.address?.state} - ${student.address?.pincode}</p>
                    </div>
                    
                    <div class="detail-card">
                        <h4>Account Status</h4>
                        <p><strong>Status:</strong> ${student.accountStatus?.isBlocked ? 'BLOCKED' : 'ACTIVE'}</p>
                        ${student.accountStatus?.isBlocked ? `
                            <p><strong>Reason:</strong> ${student.accountStatus?.blockReason}</p>
                            <p><strong>Blocked On:</strong> ${new Date(student.accountStatus?.blockedFrom).toLocaleDateString()}</p>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.getElementById('viewStudentModal').style.display = 'block';
        }

        async deleteStudent(studentId) {
            if (!confirm(`Are you sure you want to delete student ${studentId}? This cannot be undone!`)) return;
            
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/students/${studentId}`, {
                    method: 'DELETE',
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast('Student deleted successfully', 'success');
                    await this.loadStudents();
                    await this.loadStats();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Delete error:', error);
                this.showToast('Failed to delete student', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async checkSessionCompletion() {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/check-session-completion`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.message, 'success');
                    await this.loadStudents();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Check session error:', error);
                this.showToast('Failed to check session completion', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        exportToExcel() {
            this.showToast('Export feature - Downloading CSV...', 'info');
            
            // Simple CSV export
            fetch(`${this.apiBaseUrl}/students`, { headers: this.getHeaders() })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        const students = result.data;
                        let csv = "ID,Name,Mobile,Board,Class,Monthly Fees,Status,Session\n";
                        students.forEach(s => {
                            csv += `${s.studentId},${s.studentName?.first} ${s.studentName?.last},${s.studentMobile},${s.education?.board},${s.education?.class},${s.monthlyFees},${s.accountStatus?.isBlocked ? 'BLOCKED' : 'ACTIVE'},${s.currentSession?.sessionName}\n`;
                        });
                        
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        this.showToast('Export completed!', 'success');
                    }
                })
                .catch(err => {
                    console.error('Export error:', err);
                    this.showToast('Export failed', 'error');
                });
        }

        logout() {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
        }

        closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        bindEvents() {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                let debounceTimer;
                searchInput.addEventListener('input', () => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => this.searchStudents(), 500);
                });
            }
            
            window.onclick = (e) => {
                if (e.target.classList.contains('modal')) {
                    e.target.style.display = 'none';
                }
            };
        }
    }

    // Initialize
    window.studentManagement = new StudentManagementSystem();
})();
