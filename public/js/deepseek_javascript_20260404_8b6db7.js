// ============================================
// STUDENT-MANAGEMENT.JS
// Complete Frontend for Student Management System
// Mobile App + Web Responsive Design
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

    // ============================================
    // STYLES (Embedded CSS)
    // ============================================
    const styles = `
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

        /* Main Container */
        .sms-container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 25px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        /* Header */
        .sms-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }

        .logo h1 {
            font-size: 1.8rem;
            margin-bottom: 5px;
        }

        .logo p {
            font-size: 0.85rem;
            opacity: 0.9;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 50px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #667eea;
        }

        .logout-btn {
            background: rgba(255,255,255,0.3);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .logout-btn:hover {
            background: rgba(255,255,255,0.5);
        }

        /* Tabs - Mobile Friendly */
        .sms-tabs {
            display: flex;
            flex-wrap: wrap;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        .tab-btn {
            flex: 1;
            min-width: 100px;
            padding: 15px 20px;
            background: none;
            border: none;
            font-size: 1rem;
            font-weight: 600;
            color: #666;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            white-space: nowrap;
        }

        .tab-btn i {
            font-size: 1.2rem;
        }

        .tab-btn.active {
            color: #667eea;
            border-bottom: 3px solid #667eea;
            background: white;
        }

        .tab-btn:hover:not(.active) {
            background: #e9ecef;
        }

        /* Content Area */
        .sms-content {
            padding: 25px 30px;
            min-height: 500px;
        }

        .tab-pane {
            display: none;
            animation: fadeIn 0.3s ease;
        }

        .tab-pane.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            transition: transform 0.3s;
        }

        .stat-card:hover {
            transform: translateY(-5px);
        }

        .stat-card h3 {
            font-size: 2rem;
            margin-bottom: 5px;
        }

        .stat-card p {
            opacity: 0.9;
            font-size: 0.9rem;
        }

        /* Search Bar */
        .search-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .search-bar input {
            flex: 1;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s;
        }

        .search-bar input:focus {
            outline: none;
            border-color: #667eea;
        }

        .search-bar select {
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            background: white;
            cursor: pointer;
        }

        /* Table Styles - Responsive */
        .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }

        tr:hover {
            background: #f8f9fa;
        }

        /* Buttons */
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102,126,234,0.4);
        }

        .btn-danger {
            background: #dc3545;
            color: white;
        }

        .btn-danger:hover {
            background: #c82333;
        }

        .btn-warning {
            background: #ffc107;
            color: #333;
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-sm {
            padding: 5px 10px;
            font-size: 0.8rem;
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
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
            padding: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-body {
            padding: 20px;
        }

        .modal-footer {
            padding: 20px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            border-top: 1px solid #e0e0e0;
        }

        .close-modal {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
        }

        /* Form Styles */
        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 0.95rem;
            transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        /* Status Badges */
        .badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-paid { background: #d4edda; color: #155724; }
        .badge-partial { background: #fff3cd; color: #856404; }
        .badge-unpaid { background: #f8d7da; color: #721c24; }
        .badge-active { background: #d4edda; color: #155724; }
        .badge-blocked { background: #f8d7da; color: #721c24; }

        /* Timeline Chart */
        .timeline-container {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        }

        .timeline-month {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .timeline-label {
            width: 80px;
            font-weight: 600;
            font-size: 0.85rem;
        }

        .timeline-bar {
            flex: 1;
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            display: flex;
        }

        .timeline-attendance {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.5s;
        }

        .timeline-fees {
            height: 100%;
            background: linear-gradient(90deg, #ffc107, #fd7e14);
        }

        .timeline-percent {
            width: 50px;
            text-align: right;
            font-size: 0.85rem;
            font-weight: 600;
            margin-left: 10px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            .sms-header {
                padding: 15px;
                flex-direction: column;
                text-align: center;
            }

            .sms-content {
                padding: 15px;
            }

            .tab-btn {
                min-width: 80px;
                padding: 12px 10px;
                font-size: 0.85rem;
            }

            .tab-btn i {
                font-size: 1rem;
            }

            .stats-grid {
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .stat-card h3 {
                font-size: 1.5rem;
            }

            .form-row {
                grid-template-columns: 1fr;
                gap: 10px;
            }

            th, td {
                padding: 8px 10px;
                font-size: 0.85rem;
            }

            .btn {
                padding: 6px 12px;
                font-size: 0.8rem;
            }
        }

        /* Loading Spinner */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Alert Messages */
        .alert {
            padding: 12px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .alert-warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 50px;
            color: #999;
        }

        .empty-state i {
            font-size: 4rem;
            margin-bottom: 15px;
        }
    `;

    // ============================================
    // HTML TEMPLATES
    // ============================================
    const htmlTemplate = `
        <div class="sms-container">
            <div class="sms-header">
                <div class="logo">
                    <h1>🎓 Student Management System</h1>
                    <p>Complete Student Management Solution</p>
                </div>
                <div class="user-info" id="userInfo">
                    <div class="user-avatar" id="userAvatar">A</div>
                    <span id="userName">Admin</span>
                    <button class="logout-btn" onclick="window.studentManagement.logout()">🚪 Logout</button>
                </div>
            </div>

            <div class="sms-tabs">
                <button class="tab-btn" data-tab="dashboard">
                    📊 Dashboard
                </button>
                <button class="tab-btn" data-tab="students">
                    👨‍🎓 Students
                </button>
                <button class="tab-btn" data-tab="register">
                    📝 Register
                </button>
                <button class="tab-btn" data-tab="fees">
                    💰 Fees
                </button>
                <button class="tab-btn" data-tab="attendance">
                    📅 Attendance
                </button>
                <button class="tab-btn" data-tab="oldstudents">
                    📦 Old Students
                </button>
                <button class="tab-btn" data-tab="reports">
                    📈 Reports
                </button>
            </div>

            <div class="sms-content">
                <!-- Dashboard Tab -->
                <div class="tab-pane" data-pane="dashboard">
                    <div class="stats-grid" id="statsGrid">
                        <div class="stat-card">
                            <h3 id="totalStudents">0</h3>
                            <p>Total Students</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="activeStudents">0</h3>
                            <p>Active Students</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="blockedStudents">0</h3>
                            <p>Blocked Students</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="totalFeesCollected">₹0</h3>
                            <p>Fees Collected</p>
                        </div>
                    </div>

                    <div class="timeline-container">
                        <h3 style="margin-bottom: 15px;">📊 Monthly Overview</h3>
                        <div id="monthlyOverview"></div>
                    </div>

                    <div class="timeline-container" style="margin-top: 20px;">
                        <h3 style="margin-bottom: 15px;">⚠️ Recent Blocks & Issues</h3>
                        <div id="recentIssues"></div>
                    </div>
                </div>

                <!-- Students Tab -->
                <div class="tab-pane" data-pane="students">
                    <div class="search-bar">
                        <input type="text" id="searchStudent" placeholder="🔍 Search by name, ID, or mobile..." onkeyup="window.studentManagement.filterStudents()">
                        <select id="filterStatus" onchange="window.studentManagement.filterStudents()">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        <button class="btn btn-primary" onclick="window.studentManagement.showAddStudentModal()">
                            ➕ Add Student
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table id="studentsTable">
                            <thead>
                                <tr>
                                    <th>Photo</th><th>Student ID</th><th>Name</th><th>Class</th>
                                    <th>Mobile</th><th>Fees Status</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="studentsTableBody"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Register Tab -->
                <div class="tab-pane" data-pane="register">
                    <div class="stats-grid" style="margin-bottom: 20px;">
                        <div class="stat-card">
                            <h3 id="todayRegistrations">0</h3>
                            <p>Today's Registrations</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="weekRegistrations">0</h3>
                            <p>This Week</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="monthRegistrations">0</h3>
                            <p>This Month</p>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table id="recentRegistrationsTable">
                            <thead><tr><th>Date</th><th>Student ID</th><th>Name</th><th>Class</th><th>Fees</th></tr></thead>
                            <tbody id="recentRegistrationsBody"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Fees Tab -->
                <div class="tab-pane" data-pane="fees">
                    <div class="search-bar">
                        <input type="text" id="searchFees" placeholder="🔍 Search student..." onkeyup="window.studentManagement.filterFees()">
                        <select id="feesMonth" onchange="window.studentManagement.filterFees()">
                            <option value="">Select Month</option>
                        </select>
                        <select id="feesStatus" onchange="window.studentManagement.filterFees()">
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>
                    <div class="table-responsive">
                        <table id="feesTable">
                            <thead><tr><th>Student ID</th><th>Name</th><th>Month</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody id="feesTableBody"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Attendance Tab -->
                <div class="tab-pane" data-pane="attendance">
                    <div class="search-bar">
                        <input type="date" id="attendanceDate" onchange="window.studentManagement.loadAttendance()">
                        <select id="attendanceClass" onchange="window.studentManagement.loadAttendance()">
                            <option value="">All Classes</option>
                        </select>
                        <button class="btn btn-primary" onclick="window.studentManagement.markBulkAttendance()">📝 Mark Bulk Attendance</button>
                    </div>
                    <div class="table-responsive">
                        <table id="attendanceTable">
                            <thead><tr><th>Photo</th><th>Student ID</th><th>Name</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th><th>Action</th></tr></thead>
                            <tbody id="attendanceTableBody"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Old Students Tab -->
                <div class="tab-pane" data-pane="oldstudents">
                    <div class="search-bar">
                        <input type="text" id="searchOld" placeholder="🔍 Search..." onkeyup="window.studentManagement.filterOldStudents()">
                    </div>
                    <div class="table-responsive">
                        <table id="oldStudentsTable">
                            <thead><tr><th>Student ID</th><th>Name</th><th>Previous Class</th><th>Session</th><th>Total Paid</th><th>Total Due</th><th>Attendance %</th><th>Left On</th></tr></thead>
                            <tbody id="oldStudentsBody"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Reports Tab -->
                <div class="tab-pane" data-pane="reports">
                    <div class="search-bar">
                        <select id="reportType" onchange="window.studentManagement.loadReport()">
                            <option value="fees">Fees Report</option>
                            <option value="attendance">Attendance Report</option>
                            <option value="blocks">Block History</option>
                        </select>
                        <input type="month" id="reportMonth" onchange="window.studentManagement.loadReport()">
                        <button class="btn btn-primary" onclick="window.studentManagement.exportReport()">📎 Export Report</button>
                    </div>
                    <div id="reportContent"></div>
                </div>
            </div>
        </div>

        <!-- Add Student Modal -->
        <div id="addStudentModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📝 Register New Student</h3>
                    <button class="close-modal" onclick="window.studentManagement.closeModal('addStudentModal')">×</button>
                </div>
                <div class="modal-body">
                    <form id="studentForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>First Name *</label>
                                <input type="text" id="firstName" required>
                            </div>
                            <div class="form-group">
                                <label>Middle Name</label>
                                <input type="text" id="middleName">
                            </div>
                            <div class="form-group">
                                <label>Last Name *</label>
                                <input type="text" id="lastName" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Student ID *</label>
                                <input type="text" id="studentId" required placeholder="e.g., STU001">
                            </div>
                            <div class="form-group">
                                <label>Password *</label>
                                <input type="text" id="password" required placeholder="Default password">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Photo URL *</label>
                            <input type="text" id="photo" required placeholder="https://...">
                        </div>
                        <div class="form-group">
                            <label>Parent Type *</label>
                            <select id="parentType" onchange="window.studentManagement.toggleParentFields()">
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Guardian">Guardian</option>
                            </select>
                        </div>
                        <div id="fatherFields">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Father First Name *</label>
                                    <input type="text" id="fatherFirstName">
                                </div>
                                <div class="form-group">
                                    <label>Father Last Name *</label>
                                    <input type="text" id="fatherLastName">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Father Mobile *</label>
                                <input type="tel" id="fatherMobile" pattern="[0-9]{10}">
                            </div>
                        </div>
                        <div id="motherFields" style="display:none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Mother First Name *</label>
                                    <input type="text" id="motherFirstName">
                                </div>
                                <div class="form-group">
                                    <label>Mother Last Name *</label>
                                    <input type="text" id="motherLastName">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Mother Mobile *</label>
                                <input type="tel" id="motherMobile" pattern="[0-9]{10}">
                            </div>
                        </div>
                        <div id="guardianFields" style="display:none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Guardian First Name *</label>
                                    <input type="text" id="guardianFirstName">
                                </div>
                                <div class="form-group">
                                    <label>Guardian Last Name *</label>
                                    <input type="text" id="guardianLastName">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Guardian Mobile *</label>
                                <input type="tel" id="guardianMobile" pattern="[0-9]{10}">
                            </div>
                            <div class="form-group">
                                <label>Relation *</label>
                                <input type="text" id="guardianRelation" placeholder="e.g., Uncle, Aunt">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Student Mobile *</label>
                            <input type="tel" id="studentMobile" required pattern="[0-9]{10}">
                        </div>
                        <div class="form-group">
                            <label>Aadhar Number *</label>
                            <input type="text" id="aadharNumber" required pattern="[0-9]{12}">
                        </div>
                        <div class="form-group">
                            <label>Aadhar Document URL *</label>
                            <input type="text" id="aadharDocument" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Board *</label>
                                <select id="board">
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="UP Board">UP Board</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Class *</label>
                                <select id="class">
                                    <option value="9th">9th</option>
                                    <option value="10th">10th</option>
                                    <option value="11th">11th</option>
                                    <option value="12th">12th</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Monthly Fees (₹) *</label>
                            <input type="number" id="monthlyFees" required>
                        </div>
                        <div class="form-group">
                            <label>Joining Date *</label>
                            <input type="date" id="joiningDate" required>
                        </div>
                        <div class="form-group">
                            <label>Current Address *</label>
                            <textarea id="currentAddress" rows="2"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Permanent Address *</label>
                            <textarea id="permanentAddress" rows="2"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="window.studentManagement.closeModal('addStudentModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="window.studentManagement.registerStudent()">Register Student</button>
                </div>
            </div>
        </div>

        <!-- Fees Modal -->
        <div id="feesModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💰 Update Fees</h3>
                    <button class="close-modal" onclick="window.studentManagement.closeModal('feesModal')">×</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="feesStudentId">
                    <input type="hidden" id="feesSessionName">
                    <div class="form-group">
                        <label>Month</label>
                        <input type="text" id="feesMonthDisplay" readonly>
                    </div>
                    <div class="form-group">
                        <label>Total Amount (₹)</label>
                        <input type="text" id="feesAmount" readonly>
                    </div>
                    <div class="form-group">
                        <label>Paid Amount (₹)</label>
                        <input type="number" id="feesPaidAmount" step="1">
                    </div>
                    <div class="form-group">
                        <label>Remarks</label>
                        <textarea id="feesRemarks" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="window.studentManagement.closeModal('feesModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="window.studentManagement.updateFees()">Update Fees</button>
                </div>
            </div>
        </div>

        <!-- Attendance Modal -->
        <div id="attendanceModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📅 Mark Attendance</h3>
                    <button class="close-modal" onclick="window.studentManagement.closeModal('attendanceModal')">×</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="attendanceStudentId">
                    <div class="form-group">
                        <label>Student</label>
                        <input type="text" id="attendanceStudentName" readonly>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="attendanceDateInput" required>
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
                        <label>Check In Time</label>
                        <input type="time" id="checkInTime">
                    </div>
                    <div class="form-group">
                        <label>Check Out Time</label>
                        <input type="time" id="checkOutTime">
                    </div>
                    <div class="form-group">
                        <label>Remarks</label>
                        <textarea id="attendanceRemarks" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="window.studentManagement.closeModal('attendanceModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="window.studentManagement.saveAttendance()">Save Attendance</button>
                </div>
            </div>
        </div>

        <!-- Block Modal -->
        <div id="blockModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔴 Block Student</h3>
                    <button class="close-modal" onclick="window.studentManagement.closeModal('blockModal')">×</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="blockStudentId">
                    <div class="form-group">
                        <label>Student</label>
                        <input type="text" id="blockStudentName" readonly>
                    </div>
                    <div class="form-group">
                        <label>Reason *</label>
                        <select id="blockReason">
                            <option value="non_payment">Non-Payment of Fees</option>
                            <option value="disciplinary">Disciplinary Issue</option>
                            <option value="temporary_leave">Temporary Leave</option>
                            <option value="left_study">Left Study Permanently</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Block Until (Optional)</label>
                        <input type="date" id="blockUntil">
                    </div>
                    <div class="form-group">
                        <label>Remarks</label>
                        <textarea id="blockRemarks" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="window.studentManagement.closeModal('blockModal')">Cancel</button>
                    <button class="btn btn-danger" onclick="window.studentManagement.blockStudent()">Block Student</button>
                </div>
            </div>
        </div>

        <!-- Promote Modal -->
        <div id="promoteModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📈 Promote Student</h3>
                    <button class="close-modal" onclick="window.studentManagement.closeModal('promoteModal')">×</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="promoteStudentId">
                    <div class="form-group">
                        <label>Student</label>
                        <input type="text" id="promoteStudentName" readonly>
                    </div>
                    <div class="form-group">
                        <label>New Board</label>
                        <select id="promoteBoard">
                            <option value="CBSE">CBSE</option>
                            <option value="ICSE">ICSE</option>
                            <option value="UP Board">UP Board</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>New Class</label>
                        <select id="promoteClass">
                            <option value="9th">9th</option>
                            <option value="10th">10th</option>
                            <option value="11th">11th</option>
                            <option value="12th">12th</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>New Monthly Fees (₹)</label>
                        <input type="number" id="promoteFees" required>
                    </div>
                    <div class="form-group">
                        <label>New Joining Date</label>
                        <input type="date" id="promoteJoiningDate">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="window.studentManagement.closeModal('promoteModal')">Cancel</button>
                    <button class="btn btn-success" onclick="window.studentManagement.promoteStudent()">Promote</button>
                </div>
            </div>
        </div>
    `;

    // ============================================
    // MAIN APP CLASS
    // ============================================
    class StudentManagementSystem {
        constructor() {
            this.token = localStorage.getItem('adminToken');
            this.students = [];
            this.oldStudents = [];
            this.feesData = [];
            this.attendanceData = [];
            
            this.init();
        }

        async init() {
            // Check authentication
            const token = localStorage.getItem('adminToken');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            // Inject styles and HTML
            this.injectStyles();
            this.injectHTML();
            
            // Attach event listeners
            this.attachEventListeners();
            
            // Load initial data
            await this.loadDashboardData();
            await this.loadStudents();
            await this.loadOldStudents();
            await this.loadRegistrationStats();
            await this.loadFeesData();
            
            // Set default dates
            document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('reportMonth').value = new Date().toISOString().slice(0, 7);
            
            // Set joining date default
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            
            // Populate month dropdown
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

        attachEventListeners() {
            // Tab switching
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = btn.dataset.tab;
                    this.switchTab(tab);
                });
            });

            // Make functions globally accessible
            window.studentManagement = this;
        }

        switchTab(tab) {
            currentTab = tab;
            
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.dataset.tab === tab) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Update panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                if (pane.dataset.pane === tab) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
            
            // Load tab-specific data
            if (tab === 'students') this.loadStudents();
            else if (tab === 'oldstudents') this.loadOldStudents();
            else if (tab === 'fees') this.loadFeesData();
            else if (tab === 'attendance') this.loadAttendance();
            else if (tab === 'reports') this.loadReport();
        }

        // ============================================
        // API CALLS
        // ============================================
        async apiCall(endpoint, options = {}) {
            const token = localStorage.getItem('adminToken');
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...options.headers }
            });
            
            const data = await response.json();
            if (!data.success && response.status === 401) {
                localStorage.removeItem('adminToken');
                window.location.href = '/login.html';
            }
            return data;
        }

        async loadDashboardData() {
            try {
                const students = await this.apiCall('/students');
                if (students.success) {
                    const active = students.data.filter(s => !s.accountStatus?.isBlocked);
                    const blocked = students.data.filter(s => s.accountStatus?.isBlocked);
                    const totalFees = students.data.reduce((sum, s) => {
                        return sum + (s.feesHistory?.reduce((f, fsum) => fsum + (f.paidAmount || 0), 0) || 0);
                    }, 0);
                    
                    document.getElementById('totalStudents').textContent = students.data.length;
                    document.getElementById('activeStudents').textContent = active.length;
                    document.getElementById('blockedStudents').textContent = blocked.length;
                    document.getElementById('totalFeesCollected').textContent = `₹${totalFees.toLocaleString()}`;
                    
                    // Monthly overview
                    this.renderMonthlyOverview(students.data);
                    this.renderRecentIssues(students.data);
                }
            } catch (err) {
                console.error('Dashboard load error:', err);
            }
        }

        renderMonthlyOverview(students) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const container = document.getElementById('monthlyOverview');
            
            let html = '<div style="overflow-x: auto;">';
            for (let i = 0; i < 12; i++) {
                const monthAttendance = [];
                students.forEach(s => {
                    const monthData = s.attendance?.filter(a => {
                        const aDate = new Date(a.date);
                        return aDate.getMonth() === i;
                    });
                    if (monthData?.length) {
                        const present = monthData.filter(a => a.status === 'present').length;
                        monthAttendance.push((present / monthData.length) * 100);
                    }
                });
                const avgAttendance = monthAttendance.length ? 
                    Math.round(monthAttendance.reduce((a,b) => a+b, 0) / monthAttendance.length) : 0;
                
                html += `
                    <div class="timeline-month">
                        <div class="timeline-label">${months[i]}</div>
                        <div class="timeline-bar">
                            <div class="timeline-attendance" style="width: ${avgAttendance}%;"></div>
                        </div>
                        <div class="timeline-percent">${avgAttendance}%</div>
                    </div>
                `;
            }
            html += '</div>';
            container.innerHTML = html;
        }

        renderRecentIssues(students) {
            const blocked = students.filter(s => s.accountStatus?.isBlocked);
            const container = document.getElementById('recentIssues');
            
            if (blocked.length === 0) {
                container.innerHTML = '<div class="empty-state">✅ No blocked students</div>';
                return;
            }
            
            let html = '<div class="table-responsive"><table><thead><tr><th>Student</th><th>Reason</th><th>Blocked From</th><th>Action</th></tr></thead><tbody>';
            blocked.slice(0, 5).forEach(s => {
                html += `
                    <tr>
                        <td>${s.studentName?.first} ${s.studentName?.last}</td>
                        <td><span class="badge badge-blocked">${s.accountStatus?.blockReason || 'Unknown'}</span></td>
                        <td>${new Date(s.accountStatus?.blockedFrom).toLocaleDateString()}</td>
                        <td><button class="btn btn-sm btn-success" onclick="studentManagement.unblockStudent('${s.studentId}')">Unblock</button></td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        }

        async loadStudents() {
            try {
                const response = await this.apiCall('/students');
                if (response.success) {
                    this.students = response.data;
                    this.renderStudentsTable();
                }
            } catch (err) {
                this.showAlert('Error loading students', 'error');
            }
        }

        renderStudentsTable() {
            const searchTerm = document.getElementById('searchStudent')?.value.toLowerCase() || '';
            const statusFilter = document.getElementById('filterStatus')?.value || 'all';
            
            let filtered = this.students;
            if (searchTerm) {
                filtered = filtered.filter(s => 
                    s.studentId?.toLowerCase().includes(searchTerm) ||
                    `${s.studentName?.first} ${s.studentName?.last}`.toLowerCase().includes(searchTerm) ||
                    s.studentMobile?.includes(searchTerm)
                );
            }
            if (statusFilter !== 'all') {
                filtered = filtered.filter(s => 
                    statusFilter === 'active' ? !s.accountStatus?.isBlocked : s.accountStatus?.isBlocked
                );
            }
            
            const tbody = document.getElementById('studentsTableBody');
            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No students found</td></tr>';
                return;
            }
            
            tbody.innerHTML = filtered.map(s => `
                <tr>
                    <td><img src="${s.photo || 'https://via.placeholder.com/40'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                    <td>${s.studentId}</td>
                    <td>${s.studentName?.first} ${s.studentName?.last}</td>
                    <td>${s.education?.board} - ${s.education?.class}</td>
                    <td>${s.studentMobile}</td>
                    <td>${this.getFeesStatusBadge(s)}</td>
                    <td>${s.accountStatus?.isBlocked ? '<span class="badge badge-blocked">Blocked</span>' : '<span class="badge badge-active">Active</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="studentManagement.viewStudent('${s.studentId}')">👁️</button>
                        <button class="btn btn-sm btn-warning" onclick="studentManagement.showBlockModal('${s.studentId}', '${s.studentName?.first} ${s.studentName?.last}')">🔴</button>
                        ${!s.accountStatus?.isBlocked ? `<button class="btn btn-sm btn-success" onclick="studentManagement.showPromoteModal('${s.studentId}', '${s.studentName?.first} ${s.studentName?.last}')">📈</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="studentManagement.deleteStudent('${s.studentId}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }

        getFeesStatusBadge(student) {
            const currentMonth = new Date().toLocaleString('default', { month: 'short' });
            const currentYear = new Date().getFullYear();
            const currentFee = student.feesHistory?.find(f => 
                f.month === currentMonth && f.year === currentYear
            );
            
            if (!currentFee) return '<span class="badge badge-unpaid">No Record</span>';
            if (currentFee.status === 'paid') return '<span class="badge badge-paid">Paid</span>';
            if (currentFee.status === 'partial') return '<span class="badge badge-partial">Partial</span>';
            return '<span class="badge badge-unpaid">Unpaid</span>';
        }

        filterStudents() {
            this.renderStudentsTable();
        }

        async loadOldStudents() {
            try {
                const response = await this.apiCall('/old-students');
                if (response.success) {
                    this.oldStudents = response.data;
                    this.renderOldStudentsTable();
                }
            } catch (err) {
                console.error('Error loading old students:', err);
            }
        }

        renderOldStudentsTable() {
            const searchTerm = document.getElementById('searchOld')?.value.toLowerCase() || '';
            let filtered = this.oldStudents;
            if (searchTerm) {
                filtered = filtered.filter(s => 
                    s.studentId?.toLowerCase().includes(searchTerm) ||
                    `${s.studentName?.first} ${s.studentName?.last}`.toLowerCase().includes(searchTerm)
                );
            }
            
            const tbody = document.getElementById('oldStudentsBody');
            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No old students found</td></tr>';
                return;
            }
            
            tbody.innerHTML = filtered.map(s => `
                <tr>
                    <td>${s.studentId}</td>
                    <td>${s.studentName?.first} ${s.studentName?.last}</td>
                    <td>${s.education?.board} - ${s.education?.class}</td>
                    <td>${s.completedSession?.sessionName || 'N/A'}</td>
                    <td>₹${(s.totalFeesPaid || 0).toLocaleString()}</td>
                    <td>₹${(s.totalFeesDue || 0).toLocaleString()}</td>
                    <td>${Math.round(s.attendancePercentage || 0)}%</td>
                    <td>${new Date(s.sessionCompletedAt).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        filterOldStudents() {
            this.renderOldStudentsTable();
        }

        async loadRegistrationStats() {
            try {
                const students = await this.apiCall('/students');
                if (students.success) {
                    const today = new Date().toISOString().split('T')[0];
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const monthAgo = new Date();
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    
                    const todayReg = students.data.filter(s => 
                        new Date(s.registrationDate).toISOString().split('T')[0] === today
                    ).length;
                    const weekReg = students.data.filter(s => 
                        new Date(s.registrationDate) >= weekAgo
                    ).length;
                    const monthReg = students.data.filter(s => 
                        new Date(s.registrationDate) >= monthAgo
                    ).length;
                    
                    document.getElementById('todayRegistrations').textContent = todayReg;
                    document.getElementById('weekRegistrations').textContent = weekReg;
                    document.getElementById('monthRegistrations').textContent = monthReg;
                    
                    // Recent registrations
                    const recent = [...students.data].sort((a,b) => 
                        new Date(b.registrationDate) - new Date(a.registrationDate)
                    ).slice(0, 10);
                    
                    const tbody = document.getElementById('recentRegistrationsBody');
                    tbody.innerHTML = recent.map(s => `
                        <tr>
                            <td>${new Date(s.registrationDate).toLocaleDateString()}</td>
                            <td>${s.studentId}</td>
                            <td>${s.studentName?.first} ${s.studentName?.last}</td>
                            <td>${s.education?.board} - ${s.education?.class}</td>
                            <td>₹${s.monthlyFees}</td>
                        </tr>
                    `).join('');
                }
            } catch (err) {
                console.error('Error loading registration stats:', err);
            }
        }

        async loadFeesData() {
            try {
                const response = await this.apiCall('/students');
                if (response.success) {
                    this.feesData = response.data;
                    this.renderFeesTable();
                }
            } catch (err) {
                console.error('Error loading fees data:', err);
            }
        }

        renderFeesTable() {
            const searchTerm = document.getElementById('searchFees')?.value.toLowerCase() || '';
            const monthFilter = document.getElementById('feesMonth')?.value || '';
            const statusFilter = document.getElementById('feesStatus')?.value || 'all';
            
            let feesList = [];
            this.feesData.forEach(student => {
                (student.feesHistory || []).forEach(fee => {
                    feesList.push({
                        studentId: student.studentId,
                        studentName: `${student.studentName?.first} ${student.studentName?.last}`,
                        ...fee
                    });
                });
            });
            
            if (searchTerm) {
                feesList = feesList.filter(f => 
                    f.studentId.toLowerCase().includes(searchTerm) ||
                    f.studentName.toLowerCase().includes(searchTerm)
                );
            }
            if (monthFilter) {
                feesList = feesList.filter(f => `${f.month} ${f.year}` === monthFilter);
            }
            if (statusFilter !== 'all') {
                feesList = feesList.filter(f => f.status === statusFilter);
            }
            
            const tbody = document.getElementById('feesTableBody');
            if (feesList.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No fees records found</td></tr>';
                return;
            }
            
            tbody.innerHTML = feesList.map(f => `
                <tr>
                    <td>${f.studentId}</td>
                    <td>${f.studentName}</td>
                    <td>${f.month} ${f.year}</td>
                    <td>₹${f.amount}</td>
                    <td>₹${f.paidAmount || 0}</td>
                    <td>₹${f.dueAmount || 0}</td>
                    <td>${this.getStatusBadge(f.status)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="studentManagement.showFeesModal('${f.studentId}', '${f.month}', ${f.year}, ${f.amount}, '${f.sessionName}')">
                            💰 Pay
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        getStatusBadge(status) {
            if (status === 'paid') return '<span class="badge badge-paid">Paid</span>';
            if (status === 'partial') return '<span class="badge badge-partial">Partial</span>';
            return '<span class="badge badge-unpaid">Unpaid</span>';
        }

        filterFees() {
            this.renderFeesTable();
        }

        populateMonthDropdown() {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentYear = new Date().getFullYear();
            const select = document.getElementById('feesMonth');
            
            let html = '<option value="">All Months</option>';
            for (let i = 0; i < 12; i++) {
                html += `<option value="${months[i]} ${currentYear}">${months[i]} ${currentYear}</option>`;
            }
            select.innerHTML = html;
        }

        async loadAttendance() {
            try {
                const response = await this.apiCall('/students');
                if (response.success) {
                    this.attendanceData = response.data;
                    this.renderAttendanceTable();
                }
            } catch (err) {
                console.error('Error loading attendance:', err);
            }
        }

        renderAttendanceTable() {
            const selectedDate = document.getElementById('attendanceDate')?.value || new Date().toISOString().split('T')[0];
            const classFilter = document.getElementById('attendanceClass')?.value || '';
            
            let filtered = this.attendanceData;
            if (classFilter) {
                filtered = filtered.filter(s => s.education?.class === classFilter);
            }
            
            const tbody = document.getElementById('attendanceTableBody');
            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No students found</td></tr>';
                return;
            }
            
            tbody.innerHTML = filtered.map(s => {
                const attendance = s.attendance?.find(a => a.date === selectedDate);
                return `
                    <tr>
                        <td><img src="${s.photo || 'https://via.placeholder.com/40'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                        <td>${s.studentId}</td>
                        <td>${s.studentName?.first} ${s.studentName?.last}</td>
                        <td>
                            <select id="attStatus_${s.studentId}" class="att-status-select">
                                <option value="present" ${attendance?.status === 'present' ? 'selected' : ''}>Present</option>
                                <option value="absent" ${attendance?.status === 'absent' ? 'selected' : ''}>Absent</option>
                                <option value="late" ${attendance?.status === 'late' ? 'selected' : ''}>Late</option>
                                <option value="half-day" ${attendance?.status === 'half-day' ? 'selected' : ''}>Half Day</option>
                            </select>
                        </td>
                        <td><input type="time" id="checkIn_${s.studentId}" value="${attendance?.checkInTime || ''}" style="width: 100px;"></td>
                        <td><input type="time" id="checkOut_${s.studentId}" value="${attendance?.checkOutTime || ''}" style="width: 100px;"></td>
                        <td><input type="text" id="attRemarks_${s.studentId}" value="${attendance?.remarks || ''}" style="width: 120px;"></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="studentManagement.markSingleAttendance('${s.studentId}', '${selectedDate}')">Save</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        async markSingleAttendance(studentId, date) {
            const status = document.getElementById(`attStatus_${studentId}`).value;
            const checkInTime = document.getElementById(`checkIn_${studentId}`).value;
            const checkOutTime = document.getElementById(`checkOut_${studentId}`).value;
            const remarks = document.getElementById(`attRemarks_${studentId}`).value;
            
            try {
                const response = await this.apiCall(`/students/${studentId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify({ date, status, checkInTime, checkOutTime, remarks })
                });
                
                if (response.success) {
                    this.showAlert('Attendance marked successfully', 'success');
                    this.loadAttendance();
                } else {
                    this.showAlert(response.message || 'Failed to mark attendance', 'error');
                }
            } catch (err) {
                this.showAlert('Error marking attendance', 'error');
            }
        }

        markBulkAttendance() {
            const date = document.getElementById('attendanceDate').value;
            if (!date) {
                this.showAlert('Please select a date', 'error');
                return;
            }
            
            // Mark all as present
            this.attendanceData.forEach(async student => {
                await this.apiCall(`/students/${student.studentId}/attendance`, {
                    method: 'POST',
                    body: JSON.stringify({ date, status: 'present', checkInTime: '09:00', checkOutTime: '13:00', remarks: 'Bulk marked' })
                });
            });
            
            this.showAlert('Bulk attendance marked', 'success');
            this.loadAttendance();
        }

        // ============================================
        // MODAL FUNCTIONS
        // ============================================
        showAddStudentModal() {
            this.resetStudentForm();
            document.getElementById('addStudentModal').classList.add('active');
        }

        resetStudentForm() {
            document.getElementById('firstName').value = '';
            document.getElementById('middleName').value = '';
            document.getElementById('lastName').value = '';
            document.getElementById('studentId').value = '';
            document.getElementById('password').value = Math.random().toString(36).substring(2, 8);
            document.getElementById('photo').value = 'https://via.placeholder.com/100';
            document.getElementById('studentMobile').value = '';
            document.getElementById('aadharNumber').value = '';
            document.getElementById('aadharDocument').value = '';
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

        async registerStudent() {
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
            
            // Add parent info based on type
            if (parentType === 'Father') {
                studentData.fatherName = {
                    first: document.getElementById('fatherFirstName').value,
                    last: document.getElementById('fatherLastName').value
                };
                studentData.fatherMobile = document.getElementById('fatherMobile').value;
            } else if (parentType === 'Mother') {
                studentData.motherName = {
                    first: document.getElementById('motherFirstName').value,
                    last: document.getElementById('motherLastName').value
                };
                studentData.motherMobile = document.getElementById('motherMobile').value;
            } else if (parentType === 'Guardian') {
                studentData.guardianName = {
                    first: document.getElementById('guardianFirstName').value,
                    last: document.getElementById('guardianLastName').value
                };
                studentData.guardianMobile = document.getElementById('guardianMobile').value;
                studentData.guardianRelation = document.getElementById('guardianRelation').value;
            }
            
            // Validate
            if (!studentData.studentId || !studentData.studentMobile || !studentData.aadharNumber) {
                this.showAlert('Please fill all required fields', 'error');
                return;
            }
            
            try {
                const response = await this.apiCall('/student-register', {
                    method: 'POST',
                    body: JSON.stringify(studentData)
                });
                
                if (response.success) {
                    this.showAlert(`Student registered successfully! ID: ${response.studentId}, Password: ${response.password}`, 'success');
                    this.closeModal('addStudentModal');
                    this.loadStudents();
                    this.loadRegistrationStats();
                } else {
                    this.showAlert(response.message, 'error');
                }
            } catch (err) {
                this.showAlert('Registration failed', 'error');
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
            
            if (!paidAmount || paidAmount <= 0) {
                this.showAlert('Please enter valid amount', 'error');
                return;
            }
            
            try {
                const response = await this.apiCall(`/update-fees/${studentId}`, {
                    method: 'POST',
                    body: JSON.stringify({ month, year: parseInt(year), paidAmount, sessionName })
                });
                
                if (response.success) {
                    this.showAlert('Fees updated successfully', 'success');
                    this.closeModal('feesModal');
                    this.loadFeesData();
                    this.loadDashboardData();
                } else {
                    this.showAlert(response.message, 'error');
                }
            } catch (err) {
                this.showAlert('Failed to update fees', 'error');
            }
        }

        showBlockModal(studentId, studentName) {
            document.getElementById('blockStudentId').value = studentId;
            document.getElementById('blockStudentName').value = studentName;
            document.getElementById('blockReason').value = 'non_payment';
            document.getElementById('blockUntil').value = '';
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
                    this.showAlert('Student blocked successfully', 'success');
                    this.closeModal('blockModal');
                    this.loadStudents();
                    this.loadDashboardData();
                } else {
                    this.showAlert(response.message, 'error');
                }
            } catch (err) {
                this.showAlert('Failed to block student', 'error');
            }
        }

        async unblockStudent(studentId) {
            if (!confirm('Are you sure you want to unblock this student?')) return;
            
            try {
                const response = await this.apiCall(`/students/${studentId}/unblock`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    this.showAlert('Student unblocked successfully', 'success');
                    this.loadStudents();
                    this.loadDashboardData();
                } else {
                    this.showAlert(response.message, 'error');
                }
            } catch (err) {
                this.showAlert('Failed to unblock student', 'error');
            }
        }

        showPromoteModal(studentId, studentName) {
            document.getElementById('promoteStudentId').value = studentId;
            document.getElementById('promoteStudentName').value = studentName;
            document.getElementById('promoteFees').value = '';
            document.getElementById('promoteJoiningDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('promoteModal').classList.add('active');
        }

        async promoteStudent() {
            const studentId = document.getElementById('promoteStudentId').value;
            const newBoard = document.getElementById('promoteBoard').value;
            const newClass = document.getElementById('promoteClass').value;
            const newMonthlyFees = parseInt(document.getElementById('promoteFees').value);
            const newJoiningDate = document.getElementById('promoteJoiningDate').value;
            
            if (!newMonthlyFees) {
                this.showAlert('Please enter new monthly fees', 'error');
                return;
            }
            
            try {
                const response = await this.apiCall(`/students/${studentId}/promote`, {
                    method: 'POST',
                    body: JSON.stringify({ newBoard, newClass, newMonthlyFees, newJoiningDate })
                });
                
                if (response.success) {
                    this.showAlert(response.message, 'success');
                    this.closeModal('promoteModal');
                    this.loadStudents();
                    this.loadDashboardData();
                } else {
                    this.showAlert(response.message, 'error');
                }
            } catch (err) {
                this.showAlert('Failed to promote student', 'error');
            }
        }

        async deleteStudent(studentId) {
            if (!confirm('Are you sure you want to delete this student? This action cannot be undone!')) return;
            
            try {
                const response = await this.apiCall(`/students/${studentId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showAlert('Student deleted successfully', 'success');
                    this.loadStudents();
                    this.loadDashboardData();
                } else {
                    this.showAlert(response.message, 'error');
                }
            } catch (err) {
                this.showAlert('Failed to delete student', 'error');
            }
        }

        viewStudent(studentId) {
            const student = this.students.find(s => s.studentId === studentId);
            if (!student) return;
            
            const timelineHtml = this.generateTimelineHtml(student);
            
            this.showAlert(`
                <div style="max-height: 400px; overflow-y: auto;">
                    <h4>${student.studentName?.first} ${student.studentName?.last}</h4>
                    <p><strong>ID:</strong> ${student.studentId}</p>
                    <p><strong>Class:</strong> ${student.education?.board} - ${student.education?.class}</p>
                    <p><strong>Mobile:</strong> ${student.studentMobile}</p>
                    <p><strong>Session:</strong> ${student.currentSession?.sessionName}</p>
                    <p><strong>Session End:</strong> ${new Date(student.currentSession?.endDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${student.accountStatus?.isBlocked ? 'Blocked' : 'Active'}</p>
                    <hr>
                    ${timelineHtml}
                </div>
            `, 'info', 10000);
        }

        generateTimelineHtml(student) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            let html = '<h5>Attendance Timeline (Last 6 months)</h5><div style="margin-top: 10px;">';
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthIndex = date.getMonth();
                const monthName = months[monthIndex];
                const year = date.getFullYear();
                
                const monthAttendance = student.attendance?.filter(a => {
                    const aDate = new Date(a.date);
                    return aDate.getMonth() === monthIndex && aDate.getFullYear() === year;
                }) || [];
                
                const presentCount = monthAttendance.filter(a => a.status === 'present').length;
                const totalDays = monthAttendance.length;
                const percent = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;
                
                const feeRecord = student.feesHistory?.find(f => 
                    f.month === monthName && f.year === year
                );
                
                html += `
                    <div class="timeline-month" style="margin-bottom: 10px;">
                        <div class="timeline-label" style="width: 60px;">${monthName}</div>
                        <div class="timeline-bar">
                            <div class="timeline-attendance" style="width: ${percent}%;"></div>
                        </div>
                        <div class="timeline-percent" style="width: 40px;">${Math.round(percent)}%</div>
                        <div style="width: 60px; text-align: right;">
                            ${feeRecord?.status === 'paid' ? '✅' : feeRecord?.status === 'partial' ? '⚠️' : '❌'}
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
            return html;
        }

        async loadReport() {
            const reportType = document.getElementById('reportType').value;
            const month = document.getElementById('reportMonth').value;
            const container = document.getElementById('reportContent');
            
            try {
                const students = await this.apiCall('/students');
                if (!students.success) return;
                
                if (reportType === 'fees') {
                    container.innerHTML = this.generateFeesReport(students.data, month);
                } else if (reportType === 'attendance') {
                    container.innerHTML = this.generateAttendanceReport(students.data, month);
                } else if (reportType === 'blocks') {
                    container.innerHTML = this.generateBlocksReport(students.data);
                }
            } catch (err) {
                container.innerHTML = '<div class="alert alert-error">Error loading report</div>';
            }
        }

        generateFeesReport(students, month) {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[parseInt(monthNum) - 1];
            
            let totalCollected = 0;
            let totalDue = 0;
            let paidCount = 0;
            let partialCount = 0;
            let unpaidCount = 0;
            
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
                <div class="stats-grid" style="margin-bottom: 20px;">
                    <div class="stat-card"><h3>₹${totalCollected.toLocaleString()}</h3><p>Total Collected</p></div>
                    <div class="stat-card"><h3>₹${totalDue.toLocaleString()}</h3><p>Total Due</p></div>
                    <div class="stat-card"><h3>${paidCount}</h3><p>Paid</p></div>
                    <div class="stat-card"><h3>${partialCount}</h3><p>Partial</p></div>
                    <div class="stat-card"><h3>${unpaidCount}</h3><p>Unpaid</p></div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Student ID</th><th>Name</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
                        <tbody>
                            ${reportData.map(r => `
                                <tr>
                                    <td>${r.id}</td>
                                    <td>${r.name}</td>
                                    <td>₹${r.amount}</td>
                                    <td>₹${r.paid}</td>
                                    <td>₹${r.due}</td>
                                    <td>${this.getStatusBadge(r.status)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        generateAttendanceReport(students, month) {
            const [year, monthNum] = month.split('-');
            const monthIndex = parseInt(monthNum) - 1;
            
            let reportData = [];
            let totalPresent = 0;
            let totalDays = 0;
            
            students.forEach(s => {
                const monthAttendance = s.attendance?.filter(a => {
                    const aDate = new Date(a.date);
                    return aDate.getMonth() === monthIndex && aDate.getFullYear() === parseInt(year);
                }) || [];
                
                const present = monthAttendance.filter(a => a.status === 'present').length;
                const total = monthAttendance.length;
                const percentage = total > 0 ? (present / total) * 100 : 0;
                
                if (total > 0) {
                    reportData.push({
                        name: `${s.studentName?.first} ${s.studentName?.last}`,
                        id: s.studentId,
                        present: present,
                        total: total,
                        percentage: percentage
                    });
                    totalPresent += present;
                    totalDays += total;
                }
            });
            
            const overallPercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;
            
            return `
                <div class="stats-grid" style="margin-bottom: 20px;">
                    <div class="stat-card"><h3>${totalPresent}</h3><p>Total Present</p></div>
                    <div class="stat-card"><h3>${totalDays}</h3><p>Total Days</p></div>
                    <div class="stat-card"><h3>${Math.round(overallPercentage)}%</h3><p>Overall Attendance</p></div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Student ID</th><th>Name</th><th>Present</th><th>Total Days</th><th>Percentage</th></tr></thead>
                        <tbody>
                            ${reportData.map(r => `
                                <tr>
                                    <td>${r.id}</td>
                                    <td>${r.name}</td>
                                    <td>${r.present}</td>
                                    <td>${r.total}</td>
                                    <td>${Math.round(r.percentage)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        generateBlocksReport(students) {
            const blockedStudents = students.filter(s => s.accountStatus?.isBlocked);
            const blockHistory = [];
            
            students.forEach(s => {
                (s.blockHistory || []).forEach(block => {
                    blockHistory.push({
                        name: `${s.studentName?.first} ${s.studentName?.last}`,
                        id: s.studentId,
                        ...block
                    });
                });
            });
            
            return `
                <div class="stats-grid" style="margin-bottom: 20px;">
                    <div class="stat-card"><h3>${blockedStudents.length}</h3><p>Currently Blocked</p></div>
                    <div class="stat-card"><h3>${blockHistory.length}</h3><p>Total Block Events</p></div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Student</th><th>Blocked From</th><th>Blocked Until</th><th>Reason</th><th>Status</th></tr></thead>
                        <tbody>
                            ${blockHistory.map(b => `
                                <tr>
                                    <td>${b.name} (${b.id})</td>
                                    <td>${new Date(b.blockedFrom).toLocaleDateString()}</td>
                                    <td>${b.blockedUntil ? new Date(b.blockedUntil).toLocaleDateString() : 'Permanent'}</td>
                                    <td>${b.reason}</td>
                                    <td>${b.unblockedAt ? 'Unblocked' : 'Still Blocked'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
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
                <head><title>${reportType.toUpperCase()} Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #667eea; color: white; }
                    .stat-card { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 10px; margin: 10px; display: inline-block; min-width: 150px; }
                </style>
                </head>
                <body>
                    <h1>${reportType.toUpperCase()} Report - ${month}</h1>
                    ${content}
                    <p style="margin-top: 20px;">Generated on: ${new Date().toLocaleString()}</p>
                </body>
                </html>
            `);
            printWindow.print();
        }

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        showAlert(message, type = 'info', duration = 3000) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.innerHTML = `
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            `;
            alertDiv.style.position = 'fixed';
            alertDiv.style.top = '20px';
            alertDiv.style.right = '20px';
            alertDiv.style.zIndex = '10000';
            alertDiv.style.maxWidth = '400px';
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                if (alertDiv.parentElement) alertDiv.remove();
            }, duration);
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