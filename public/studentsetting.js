// ============================================
// STUDENT MANAGEMENT - SIRF EK BUTTON
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
                <i class="fas fa-users me-2"></i>Student Management
            </button>
        `;
        
        tabList.appendChild(studentTab);
        console.log("✅ Student tab added");
        return true;
    }
    
    // ============================================
    // CREATE STUDENT TAB CONTENT - SIRF EK BUTTON
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
        
        // 🔴 SIRF EK BUTTON - Simple and Clean
        studentPane.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <div class="card border-primary mt-3">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-chart-line fa-4x text-primary mb-3"></i>
                            <h3 class="mb-3">Student Dashboard</h3>
                            <p class="text-muted mb-4">Click below to open the complete student dashboard with fees tracking, charts, and analytics</p>
                            <a href="/student-dashboard.html" target="_blank" class="btn btn-primary btn-lg">
                                <i class="fas fa-external-link-alt me-2"></i>Open Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        tabContent.appendChild(studentPane);
        console.log("✅ Student content created with dashboard button");
        return true;
    }
    
    // ============================================
    // INITIALIZE
    // ============================================
    function init() {
        console.log("🚀 Initializing Student Management - Single Button");
        
        addStudentTab();
        createStudentTabContent();
    }
    
    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
