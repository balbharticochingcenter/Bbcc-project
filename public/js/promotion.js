// ============================================
// STUDENT ARCHIVE & PROMOTION SYSTEM
// CSP COMPLIANT - No inline event handlers
// ============================================

(function() {
    // Wait for DOM to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArchiveSystem);
    } else {
        initArchiveSystem();
    }
    
    async function initArchiveSystem() {
        // Check if archive tab already exists
        if (document.getElementById('archivePane')) return;
        
        // Get token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;
        
        // Find the tab container and add Archive button
        const tabContainer = document.querySelector('.tabs-container');
        if (tabContainer) {
            const archiveTabBtn = document.createElement('button');
            archiveTabBtn.className = 'tab-btn';
            archiveTabBtn.setAttribute('data-tab', 'archive');
            archiveTabBtn.innerHTML = '<i class="fas fa-archive"></i> Archive';
            tabContainer.appendChild(archiveTabBtn);
        }
        
        // Add to bottom navigation for mobile
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            const archiveNavItem = document.createElement('div');
            archiveNavItem.className = 'bottom-nav-item';
            archiveNavItem.setAttribute('data-tab', 'archive');
            archiveNavItem.innerHTML = '<i class="fas fa-archive"></i><span>Archive</span>';
            bottomNav.appendChild(archiveNavItem);
        }
        
        // Find where to insert archive pane
        const tabContents = document.getElementById('tabContents');
        if (!tabContents) return;
        
        // Create archive pane HTML (no inline event handlers)
        const archivePaneHTML = `
            <div class="tab-pane" id="archivePane" style="display:none">
                <div class="premium-card">
                    <div class="card-header">
                        <h3><i class="fas fa-archive"></i> Student Archive & Promotion</h3>
                        <div class="d-flex gap-2">
                            <button class="btn-secondary-premium" id="refreshArchiveBtn"><i class="fas fa-sync-alt"></i> Refresh</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Archive by Year Section -->
                        <div class="form-section" style="background: linear-gradient(135deg, #fef3c7, #fff3e0);">
                            <div class="form-section-title"><i class="fas fa-calendar-alt"></i> Archive Students by Joining Year</div>
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="fw-bold">Select Year</label>
                                    <select id="archiveYearSelect" class="form-select">
                                        <option value="">Choose Year</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="fw-bold">Reason (Optional)</label>
                                    <input type="text" id="archiveReasonInput" class="form-control" placeholder="e.g., Batch completed 2024">
                                </div>
                                <div class="col-md-4 d-flex align-items-end">
                                    <div class="d-flex gap-2 w-100">
                                        <button class="btn-secondary-premium w-50" id="previewArchiveBtn"><i class="fas fa-eye"></i> Preview</button>
                                        <button class="btn-primary-premium w-50" id="archiveByYearBtn"><i class="fas fa-archive"></i> Archive</button>
                                    </div>
                                </div>
                            </div>
                            <div id="archivePreviewDiv" class="mt-3" style="display:none; background:white; padding:15px; border-radius:12px; border:1px solid #eef2f6;"></div>
                        </div>
                        
                        <!-- Filter Section -->
                        <div class="row g-3 mt-4 mb-4">
                            <div class="col-md-3">
                                <label class="fw-bold">Board</label>
                                <select id="archiveBoardFilter" class="form-select">
                                    <option value="">All Boards</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="fw-bold">Class</label>
                                <select id="archiveClassFilter" class="form-select">
                                    <option value="">All Classes</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="fw-bold">Search</label>
                                <div class="search-box">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="archiveSearchInput" class="form-control" placeholder="Search by name/ID...">
                                </div>
                            </div>
                            <div class="col-md-2 d-flex align-items-end">
                                <button class="btn-primary-premium w-100" id="filterArchiveBtn"><i class="fas fa-filter"></i> Filter</button>
                            </div>
                        </div>
                        
                        <!-- Archived Students Table -->
                        <div class="table-responsive-custom">
                            <table class="premium-table">
                                <thead>
                                    <tr>
                                        <th style="width: 40px;"><input type="checkbox" id="selectAllArchive"></th>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Board</th>
                                        <th>Class</th>
                                        <th>Joining Year</th>
                                        <th>Archived Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="archivedStudentsList">
                                    <tr><td colspan="8" class="text-center py-5"><i class="fas fa-spinner fa-spin"></i> Loading archived students...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Bulk Actions & Pagination -->
                        <div class="d-flex justify-content-between align-items-center mt-4">
                            <div class="d-flex gap-2">
                                <button class="btn-secondary-premium" id="restoreSelectedBtn" disabled>
                                    <i class="fas fa-undo"></i> Restore Selected
                                </button>
                                <button class="btn-danger-premium" id="deleteSelectedArchiveBtn" disabled style="background: #dc2626; color: white; border: none; border-radius: 40px; padding: 10px 24px;">
                                    <i class="fas fa-trash"></i> Delete Permanently
                                </button>
                            </div>
                            <div id="archivePagination"></div>
                        </div>
                        
                        <!-- Info Note -->
                        <div class="alert alert-info mt-4" style="background: #e6f7ff; border-radius: 16px; padding: 12px 20px;">
                            <i class="fas fa-info-circle"></i> <strong>Note:</strong> Archived students are moved to separate storage. You can restore them anytime. Students are archived based on their <strong>Joining Year</strong>. Use this to manage old batches.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert archive pane
        const adminPane = document.getElementById('adminPane');
        if (adminPane) {
            adminPane.insertAdjacentHTML('afterend', archivePaneHTML);
        } else {
            tabContents.insertAdjacentHTML('beforeend', archivePaneHTML);
        }
        
        // Initialize archive functions (using addEventListener, not inline)
        initArchiveEventListeners();
        await loadArchiveFilters(token);
        await loadArchiveYears(token);
        await loadArchivedStudents(token);
    }
    
    // Initialize all event listeners
    function initArchiveEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshArchiveBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                loadArchivedStudents(token);
                loadArchiveYears(token);
            });
        }
        
        // Preview button
        const previewBtn = document.getElementById('previewArchiveBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                previewArchive(token);
            });
        }
        
        // Archive button
        const archiveBtn = document.getElementById('archiveByYearBtn');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                archiveByYear(token);
            });
        }
        
        // Filter button
        const filterBtn = document.getElementById('filterArchiveBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                loadArchivedStudents(token, 1);
            });
        }
        
        // Restore selected button
        const restoreSelectedBtn = document.getElementById('restoreSelectedBtn');
        if (restoreSelectedBtn) {
            restoreSelectedBtn.addEventListener('click', () => {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                restoreSelected(token);
            });
        }
        
        // Delete selected button
        const deleteSelectedBtn = document.getElementById('deleteSelectedArchiveBtn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                deleteSelectedArchived(token);
            });
        }
        
        // Select all checkbox
        const selectAll = document.getElementById('selectAllArchive');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                document.querySelectorAll('.archive-checkbox').forEach(cb => cb.checked = e.target.checked);
                updateBulkButtonsState();
            });
        }
        
        // Search input - enter key
        const searchInput = document.getElementById('archiveSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                    loadArchivedStudents(token, 1);
                }
            });
        }
        
        // Listen for checkbox changes
        document.addEventListener('change', (e) => {
            if (e.target.classList && e.target.classList.contains('archive-checkbox')) {
                updateBulkButtonsState();
                // Update select all state
                const allCheckboxes = document.querySelectorAll('.archive-checkbox');
                const selectAllEl = document.getElementById('selectAllArchive');
                if (selectAllEl && allCheckboxes.length > 0) {
                    const checkedCount = document.querySelectorAll('.archive-checkbox:checked').length;
                    selectAllEl.checked = checkedCount === allCheckboxes.length;
                    selectAllEl.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
                }
            }
        });
    }
    
    // Load boards and classes for filters
    async function loadArchiveFilters(token) {
        try {
            const res = await fetch('/api/boards', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                const boardSelect = document.getElementById('archiveBoardFilter');
                const classSelect = document.getElementById('archiveClassFilter');
                if (boardSelect) {
                    boardSelect.innerHTML = '<option value="">All Boards</option>' + 
                        data.data.boards.map(b => `<option value="${b}">${b}</option>`).join('');
                }
                if (classSelect) {
                    classSelect.innerHTML = '<option value="">All Classes</option>' + 
                        data.data.classes.map(c => `<option value="${c}">${c}</option>`).join('');
                }
            }
        } catch(e) { console.error('Error loading filters:', e); }
    }
    
    // Load available years for archive
    async function loadArchiveYears(token) {
        try {
            const res = await fetch('/api/archive-years', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                const yearSelect = document.getElementById('archiveYearSelect');
                if (yearSelect) {
                    yearSelect.innerHTML = '<option value="">Choose Year</option>';
                    data.data.forEach(y => {
                        yearSelect.innerHTML += `<option value="${y.year}">${y.year} (${y.count} students)</option>`;
                    });
                }
            }
        } catch(e) { console.error('Error loading years:', e); }
    }
    
    // Load archived students
    async function loadArchivedStudents(token, page = 1) {
        const board = document.getElementById('archiveBoardFilter')?.value || '';
        const classVal = document.getElementById('archiveClassFilter')?.value || '';
        const search = document.getElementById('archiveSearchInput')?.value || '';
        
        let url = `/api/archived-students?page=${page}&limit=20`;
        if (board) url += `&board=${encodeURIComponent(board)}`;
        if (classVal) url += `&class=${encodeURIComponent(classVal)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                window.archivedStudentsData = data.data;
                window.currentArchivePage = data.pagination.page;
                window.archiveTotalPages = data.pagination.pages;
                renderArchivedTable(token);
                renderArchivePagination(token);
            } else {
                const tbody = document.getElementById('archivedStudentsList');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-danger">Failed to load archived students</td></tr>';
                }
            }
        } catch(e) {
            console.error('Error loading archived students:', e);
            const tbody = document.getElementById('archivedStudentsList');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-danger">Error loading data</td></tr>';
            }
        }
    }
    
    // Render archived students table
    function renderArchivedTable(token) {
        const tbody = document.getElementById('archivedStudentsList');
        if (!tbody) return;
        
        const students = window.archivedStudentsData || [];
        
        if (!students.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5"><i class="fas fa-archive fa-2x text-muted"></i><p class="mt-2">No archived students found</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = students.map(s => `
            <tr>
                <td><input type="checkbox" class="archive-checkbox" data-id="${s._id}"></td>
                <td><strong>${escapeHtml(s.studentId)}</strong></td>
                <td>${escapeHtml(s.studentName.first)} ${escapeHtml(s.studentName.last)}</td>
                <td>${escapeHtml(s.education?.board || '-')}</td>
                <td>${escapeHtml(s.education?.class || '-')}</td>
                <td>${new Date(s.joiningDate).getFullYear()}</td>
                <td>${new Date(s.archivedAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn restore-single" data-id="${s._id}" style="background:#10b981;" title="Restore">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="action-btn delete-single" data-id="${s._id}" style="background:#dc2626;" title="Delete Permanently">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners for single actions (using addEventListener, not inline)
        document.querySelectorAll('.restore-single').forEach(btn => {
            btn.removeEventListener('click', handleRestoreClick);
            btn.addEventListener('click', handleRestoreClick);
        });
        document.querySelectorAll('.delete-single').forEach(btn => {
            btn.removeEventListener('click', handleDeleteClick);
            btn.addEventListener('click', handleDeleteClick);
        });
        
        function handleRestoreClick(e) {
            const id = e.currentTarget.getAttribute('data-id');
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            restoreStudent(token, id);
        }
        
        function handleDeleteClick(e) {
            const id = e.currentTarget.getAttribute('data-id');
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            deleteArchivedStudent(token, id);
        }
        
        updateBulkButtonsState();
    }
    
    // Render pagination
    function renderArchivePagination(token) {
        const div = document.getElementById('archivePagination');
        if (!div) return;
        
        const totalPages = window.archiveTotalPages || 1;
        const currentPage = window.currentArchivePage || 1;
        
        if (totalPages <= 1) {
            div.innerHTML = '';
            return;
        }
        
        let html = '<div class="d-flex gap-2 flex-wrap">';
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `<button class="btn-secondary-premium archive-page-btn ${activeClass}" data-page="${i}" style="padding:6px 12px; ${i === currentPage ? 'background: var(--gradient-primary); color: white;' : ''}">${i}</button>`;
        }
        if (totalPages > 5) {
            html += `<span class="px-2">...</span>`;
            html += `<button class="btn-secondary-premium archive-page-btn" data-page="${totalPages}" style="padding:6px 12px;">${totalPages}</button>`;
        }
        html += '</div>';
        div.innerHTML = html;
        
        document.querySelectorAll('.archive-page-btn').forEach(btn => {
            btn.removeEventListener('click', handlePageClick);
            btn.addEventListener('click', handlePageClick);
        });
        
        function handlePageClick(e) {
            const page = parseInt(e.currentTarget.getAttribute('data-page'));
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            loadArchivedStudents(token, page);
        }
    }
    
    // Update bulk buttons state
    function updateBulkButtonsState() {
        const checkedCount = document.querySelectorAll('.archive-checkbox:checked').length;
        const restoreBtn = document.getElementById('restoreSelectedBtn');
        const deleteBtn = document.getElementById('deleteSelectedArchiveBtn');
        if (restoreBtn) restoreBtn.disabled = checkedCount === 0;
        if (deleteBtn) deleteBtn.disabled = checkedCount === 0;
    }
    
    // Preview archive
    async function previewArchive(token) {
        const year = document.getElementById('archiveYearSelect').value;
        if (!year) {
            showToast('Please select a year', 'warning');
            return;
        }
        
        showLoader(true);
        try {
            const res = await fetch('/api/archive-by-year', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ year, dryRun: true })
            });
            const data = await res.json();
            if (data.success) {
                const div = document.getElementById('archivePreviewDiv');
                div.style.display = 'block';
                if (data.count === 0) {
                    div.innerHTML = `<div class="alert alert-warning mb-0"><i class="fas fa-exclamation-triangle"></i> No students found who joined in ${year}</div>`;
                } else {
                    div.innerHTML = `
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle"></i> <strong>${data.count} students</strong> will be archived from year ${year}
                            <hr class="my-2">
                            <div style="max-height: 200px; overflow-y: auto;">
                                ${data.preview.map(s => `• <strong>${escapeHtml(s.id)}</strong> - ${escapeHtml(s.name)} (${escapeHtml(s.class || 'N/A')})`).join('<br>')}
                            </div>
                        </div>
                    `;
                }
            } else {
                showToast(data.message || 'Preview failed', 'error');
            }
        } catch(e) {
            showToast('Preview failed', 'error');
        }
        showLoader(false);
    }
    
    // Archive by year
    async function archiveByYear(token) {
        const year = document.getElementById('archiveYearSelect').value;
        const reason = document.getElementById('archiveReasonInput').value;
        
        if (!year) {
            showToast('Please select a year', 'warning');
            return;
        }
        
        if (!confirm(`⚠️ WARNING: This will archive ALL students who joined in ${year}.\n\nArchived students will be moved to archive storage and removed from active list.\n\nThis action can be reversed by restoring students from archive.\n\nContinue?`)) {
            return;
        }
        
        showLoader(true);
        try {
            const res = await fetch('/api/archive-by-year', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ year, reason: reason || `Yearly archival for ${year}` })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`✅ ${data.message}`, 'success');
                loadArchivedStudents(token);
                loadArchiveYears(token);
                if (typeof window.loadStudents === 'function') window.loadStudents();
                const previewDiv = document.getElementById('archivePreviewDiv');
                if (previewDiv) previewDiv.style.display = 'none';
                const reasonInput = document.getElementById('archiveReasonInput');
                if (reasonInput) reasonInput.value = '';
            } else {
                showToast(data.message || 'Archive failed', 'error');
            }
        } catch(e) {
            showToast('Archive failed', 'error');
        }
        showLoader(false);
    }
    
    // Restore single student
    async function restoreStudent(token, id) {
        if (!confirm('Restore this student to active list?')) return;
        
        showLoader(true);
        try {
            const res = await fetch(`/api/restore-student/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Student restored successfully', 'success');
                loadArchivedStudents(token);
                loadArchiveYears(token);
                if (typeof window.loadStudents === 'function') window.loadStudents();
            } else {
                showToast(data.message || 'Restore failed', 'error');
            }
        } catch(e) {
            showToast('Restore failed', 'error');
        }
        showLoader(false);
    }
    
    // Delete archived student permanently
    async function deleteArchivedStudent(token, id) {
        if (!confirm('⚠️ PERMANENT DELETE: This will permanently delete the archived student record. This cannot be undone.\n\nContinue?')) return;
        
        showLoader(true);
        try {
            const res = await fetch(`/api/archived-students/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                showToast('Deleted permanently', 'success');
                loadArchivedStudents(token);
            } else {
                showToast(data.message || 'Delete failed', 'error');
            }
        } catch(e) {
            showToast('Delete failed', 'error');
        }
        showLoader(false);
    }
    
    // Restore selected students
    async function restoreSelected(token) {
        const selected = [...document.querySelectorAll('.archive-checkbox:checked')].map(cb => cb.getAttribute('data-id'));
        if (!selected.length) {
            showToast('Please select students to restore', 'warning');
            return;
        }
        
        if (!confirm(`Restore ${selected.length} student(s) to active list?`)) return;
        
        showLoader(true);
        let successCount = 0;
        let failCount = 0;
        
        for (const id of selected) {
            try {
                const res = await fetch(`/api/restore-student/${id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) successCount++;
                else failCount++;
            } catch(e) {
                failCount++;
            }
        }
        
        showToast(`✅ Restored: ${successCount}, Failed: ${failCount}`, successCount > 0 ? 'success' : 'error');
        loadArchivedStudents(token);
        loadArchiveYears(token);
        if (typeof window.loadStudents === 'function') window.loadStudents();
        showLoader(false);
    }
    
    // Delete selected archived students
    async function deleteSelectedArchived(token) {
        const selected = [...document.querySelectorAll('.archive-checkbox:checked')].map(cb => cb.getAttribute('data-id'));
        if (!selected.length) {
            showToast('Please select students to delete', 'warning');
            return;
        }
        
        if (!confirm(`⚠️ PERMANENT DELETE: This will permanently delete ${selected.length} archived student record(s). This cannot be undone.\n\nContinue?`)) return;
        
        showLoader(true);
        let successCount = 0;
        let failCount = 0;
        
        for (const id of selected) {
            try {
                const res = await fetch(`/api/archived-students/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) successCount++;
                else failCount++;
            } catch(e) {
                failCount++;
            }
        }
        
        showToast(`✅ Deleted: ${successCount}, Failed: ${failCount}`, successCount > 0 ? 'success' : 'error');
        loadArchivedStudents(token);
        showLoader(false);
    }
    
    // Helper: Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    // Helper: Show toast notification
    function showToast(msg, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.log(`${type}: ${msg}`);
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast-premium ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i><span>${escapeHtml(msg)}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    // Helper: Show/hide loader
    function showLoader(show) {
        const loader = document.getElementById('loaderOverlay');
        if (loader) loader.style.display = show ? 'flex' : 'none';
    }
    
    // Override switchTab to load archive data when tab is clicked
    const originalSwitchTab = window.switchTab;
    if (originalSwitchTab) {
        window.switchTab = function(tabId) {
            originalSwitchTab(tabId);
            if (tabId === 'archive') {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                loadArchivedStudents(token);
                loadArchiveYears(token);
            }
        };
    }
})();
