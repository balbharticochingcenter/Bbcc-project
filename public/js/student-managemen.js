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
       
