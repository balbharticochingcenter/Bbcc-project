// ============================================
// TEACHER MANAGEMENT - SIRF EK BUTTON
// ============================================

(function() {
    console.log("👨‍🏫 Teacher Management Loading...");
    
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
    // ADD TEACHER TAB TO NAVIGATION
    // ============================================
    function addTeacherTab() {
        console.log("Adding teacher tab...");
        
        const tabList = document.getElementById('myTab');
        if (!tabList) {
            console.log("❌ Tab list not found");
            return false;
        }
        
        // Check if tab already exists
        if (document.getElementById('teachers-tab')) {
            console.log("✅ Teacher tab already exists");
            return true;
        }
        
        const teacherTab = document.createElement('li');
        teacherTab.className = 'nav-item';
        teacherTab.setAttribute('role', 'presentation');
        teacherTab.innerHTML = `
            <button class="nav-link" id="teachers-tab" data-bs-toggle="tab" data-bs-target="#teachers" type="button" role="tab">
                <i class="fas fa-chalkboard-teacher me-2"></i>Teacher Management
            </button>
        `;
        
        tabList.appendChild(teacherTab);
        console.log("✅ Teacher tab added");
        return true;
    }
    
    // ============================================
    // CREATE TEACHER TAB CONTENT - SIRF EK BUTTON
    // ============================================
    function createTeacherTabContent() {
        console.log("Creating teacher tab content...");
        
        if (document.getElementById('teachers')) {
            console.log("✅ Teacher content already exists");
            return true;
        }
        
        const tabContent = document.querySelector('.tab-content');
        if (!tabContent) {
            console.log("❌ Tab content not found");
            return false;
        }
        
        const teacherPane = document.createElement('div');
        teacherPane.className = 'tab-pane fade';
        teacherPane.id = 'teachers';
        teacherPane.setAttribute('role', 'tabpanel');
        
        // 🔴 SIRF EK BUTTON - Teacher Dashboard
        teacherPane.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <div class="card border-success mt-3">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-chalkboard-teacher fa-4x text-success mb-3"></i>
                            <h3 class="mb-3">Teacher Dashboard</h3>
                            <p class="text-muted mb-4">Click below to open the teacher management dashboard</p>
                            <a href="/teacher-dashboard.html" target="_blank" class="btn btn-success btn-lg">
                                <i class="fas fa-external-link-alt me-2"></i>Open Teacher Dashboard
                            </a>
                            <p class="text-muted small mt-3">
                                <i class="fas fa-info-circle me-1"></i>
                                Opens in new tab - Admin access required
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        tabContent.appendChild(teacherPane);
        console.log("✅ Teacher content created with dashboard button");
        return true;
    }
    
    // ============================================
    // INITIALIZE
    // ============================================
    function init() {
        console.log("🚀 Initializing Teacher Management - Single Button");
        
        addTeacherTab();
        createTeacherTabContent();
    }
    
    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
