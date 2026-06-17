// ============================================
// STUDENT MANAGEMENT - COMPLETE JS
// ALL HTML GENERATED DYNAMICALLY
// ============================================

// ===== INITIALIZE STUDENT MANAGEMENT =====
document.addEventListener('DOMContentLoaded', function() {
    // Check if student tab is clicked
    const studentTab = document.querySelector('[data-tab="students"]');
    if (studentTab) {
        studentTab.addEventListener('click', function() {
            setTimeout(() => {
                if (document.getElementById('tab-students').classList.contains('active')) {
                    initStudentManagement();
                }
            }, 100);
        });
    }
});

// ===== STUDENT MANAGEMENT APP =====
let allStudents = [];
let currentStudentId = null;
let isEditMode = false;

function initStudentManagement() {
    const container = document.getElementById('studentManagementApp');
    if (!container) return;
    
    // Render the entire student management UI
    container.innerHTML = `
        <!-- Sub Tabs -->
        <div class="sub-tabs">
            <button class="sub-tab-btn active" data-subtab="list" onclick="switchSubTab('list')">📋 Student List</button>
            <button class="sub-tab-btn" data-subtab="add" onclick="switchSubTab('add')">➕ Add Student</button>
        </div>

        <!-- Student List Sub Tab -->
        <div class="sub-tab-content active" id="subtab-list">
            <div class="card">
                <div class="card-title">
                    <span class="icon">🔍</span>
                    Search Students
                </div>
                <div class="search-bar">
                    <input type="text" id="searchInput" placeholder="Search by Aadhar, Name, Class..." oninput="searchStudents(this.value)">
                    <select id="classFilter" onchange="filterByClass(this.value)">
                        <option value="">All Classes</option>
                        <option value="Class 1st">Class 1st</option>
                        <option value="Class 2nd">Class 2nd</option>
                        <option value="Class 3rd">Class 3rd</option>
                        <option value="Class 4th">Class 4th</option>
                        <option value="Class 5th">Class 5th</option>
                        <option value="Class 6th">Class 6th</option>
                        <option value="Class 7th">Class 7th</option>
                        <option value="Class 8th">Class 8th</option>
                        <option value="Class 9th">Class 9th</option>
                        <option value="Class 10th">Class 10th</option>
                        <option value="B.Com">B.Com</option>
                        <option value="B.Sc">B.Sc</option>
                        <option value="B.A">B.A</option>
                    </select>
                    <button class="btn btn-primary" onclick="loadStudents()">🔄 Refresh</button>
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    <span class="icon">📋</span>
                    Student List
                    <span id="studentCount" style="font-size:14px;color:#888;font-weight:normal;"></span>
                </div>
                <div id="studentListContainer">
                    <div style="text-align:center;padding:30px;color:#888;">Loading students...</div>
                </div>
            </div>
        </div>

        <!-- Add Student Sub Tab -->
        <div class="sub-tab-content" id="subtab-add">
            <div class="card">
                <div class="card-title">
                    <span class="icon">➕</span>
                    <span id="addStudentTitle">Add New Student</span>
                </div>
                <form id="addStudentForm" onsubmit="saveStudent(event)">
                    <!-- Personal Details -->
                    <h3 style="margin-bottom:15px;color:#667eea;">📝 Personal Details</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>First Name *</label>
                            <input type="text" id="sFirstName" required>
                        </div>
                        <div class="form-group">
                            <label>Middle Name</label>
                            <input type="text" id="sMiddleName">
                        </div>
                        <div class="form-group">
                            <label>Last Name *</label>
                            <input type="text" id="sLastName" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Aadhar Number * (12 digits)</label>
                            <input type="text" id="sAadhar" maxlength="12" pattern="[0-9]{12}" required>
                        </div>
                        <div class="form-group">
                            <label>Date of Birth *</label>
                            <input type="date" id="sDob" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Gender *</label>
                            <select id="sGender" required>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Student Mobile *</label>
                            <input type="text" id="sMobile" maxlength="10" pattern="[0-9]{10}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="sEmail">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="sAddress" rows="2"></textarea>
                    </div>

                    <!-- Parent Details -->
                    <h3 style="margin:20px 0 15px;color:#667eea;">👨‍👩‍👦 Parent/Guardian Details</h3>
                    <div class="form-group">
                        <label>Parent Type</label>
                        <select id="sParentType">
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Guardian">Guardian</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Father Name</label>
                            <input type="text" id="sFatherName">
                        </div>
                        <div class="form-group">
                            <label>Father Mobile</label>
                            <input type="text" id="sFatherMobile" maxlength="10" pattern="[0-9]{10}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Mother Name</label>
                            <input type="text" id="sMotherName">
                        </div>
                        <div class="form-group">
                            <label>Mother Mobile</label>
                            <input type="text" id="sMotherMobile" maxlength="10" pattern="[0-9]{10}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Guardian Name</label>
                            <input type="text" id="sGuardianName">
                        </div>
                        <div class="form-group">
                            <label>Guardian Mobile</label>
                            <input type="text" id="sGuardianMobile" maxlength="10" pattern="[0-9]{10}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Guardian Relation</label>
                        <input type="text" id="sGuardianRelation" placeholder="e.g., Uncle, Aunt">
                    </div>

                    <!-- Education Details -->
                    <h3 style="margin:20px 0 15px;color:#667eea;">📚 Education Details</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Class *</label>
                            <select id="sClass" required>
                                <option value="">Select Class</option>
                                <optgroup label="Primary School">
                                    <option value="Class 1st">Class 1st</option>
                                    <option value="Class 2nd">Class 2nd</option>
                                    <option value="Class 3rd">Class 3rd</option>
                                    <option value="Class 4th">Class 4th</option>
                                    <option value="Class 5th">Class 5th</option>
                                </optgroup>
                                <optgroup label="Middle School">
                                    <option value="Class 6th">Class 6th</option>
                                    <option value="Class 7th">Class 7th</option>
                                    <option value="Class 8th">Class 8th</option>
                                </optgroup>
                                <optgroup label="High School">
                                    <option value="Class 9th">Class 9th</option>
                                    <option value="Class 10th">Class 10th</option>
                                </optgroup>
                                <optgroup label="Graduation">
                                    <option value="B.Com">B.Com</option>
                                    <option value="B.Sc">B.Sc</option>
                                    <option value="B.A">B.A</option>
                                </optgroup>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Board *</label>
                            <select id="sBoard" required>
                                <option value="">Select Board</option>
                                <option value="CBSE">CBSE</option>
                                <option value="BSEB">BSEB</option>
                                <option value="ICSE">ICSE</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Joining Date *</label>
                            <input type="date" id="sJoiningDate" required>
                        </div>
                        <div class="form-group">
                            <label>Monthly Fees * (₹)</label>
                            <input type="number" id="sFees" required min="0">
                        </div>
                    </div>

                    <!-- Photo Upload -->
                    <div class="form-group">
                        <label>Student Photo</label>
                        <div class="image-upload" onclick="document.getElementById('sPhotoInput').click()">
                            <div class="preview" id="sPhotoPreview">
                                <img src="" alt="Photo" style="display:none;" id="sPhotoPreviewImg">
                                <span id="sPhotoPlaceholder" style="font-size:40px;">📷</span>
                            </div>
                            <div class="hint">Click to upload photo (PNG, JPG)</div>
                            <input type="file" id="sPhotoInput" accept="image/*" onchange="handleStudentPhoto(event)">
                        </div>
                    </div>

                    <button type="submit" class="btn btn-success" style="width:100%;padding:14px;font-size:16px;">
                        ✅ Add Student
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Load students
    loadStudents();
}

// ===== SWITCH SUB TAB =====
function switchSubTab(tab) {
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-subtab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.sub-tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(`subtab-${tab}`).classList.add('active');
    
    if (tab === 'list') {
        loadStudents();
    }
}

// ===== LOAD STUDENTS =====
async function loadStudents() {
    try {
        const data = await apiCall('/api/students');
        if (data.success) {
            allStudents = data.data;
            renderStudentTable(allStudents);
            document.getElementById('studentCount').textContent = `(${allStudents.length} students)`;
        }
    } catch (error) {
        showToast('Error loading students', true);
    }
}

// ===== RENDER STUDENT TABLE =====
function renderStudentTable(students) {
    const container = document.getElementById('studentListContainer');
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888;">
                <div style="font-size:48px;margin-bottom:10px;">📭</div>
                <div>No students found</div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr style="background:#f8f9fa;border-bottom:2px solid #e0e0e0;">
                        <th style="padding:10px;text-align:left;">#</th>
                        <th style="padding:10px;text-align:left;">Photo</th>
                        <th style="padding:10px;text-align:left;">Name</th>
                        <th style="padding:10px;text-align:left;">Class</th>
                        <th style="padding:10px;text-align:left;">Board</th>
                        <th style="padding:10px;text-align:left;">Mobile</th>
                        <th style="padding:10px;text-align:left;">Fees</th>
                        <th style="padding:10px;text-align:left;">Status</th>
                        <th style="padding:10px;text-align:center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    students.forEach((student, index) => {
        const status = student.isBlocked ? '🔴 Blocked' : '✅ Active';
        const statusColor = student.isBlocked ? '#e74c3c' : '#2ecc71';
        
        html += `
            <tr style="border-bottom:1px solid #f0f0f0;cursor:pointer;" onclick="showStudentDetails('${student.studentId}')">
                <td style="padding:10px;">${index + 1}</td>
                <td style="padding:10px;">
                    ${student.photo ? `<img src="${student.photo}" style="width:35px;height:35px;border-radius:50%;object-fit:cover;">` : '📸'}
                </td>
                <td style="padding:10px;font-weight:600;">${student.fullName || 'N/A'}</td>
                <td style="padding:10px;">${student.currentClass || 'N/A'}</td>
                <td style="padding:10px;">${student.currentBoard || 'N/A'}</td>
                <td style="padding:10px;">${student.studentMobile || 'N/A'}</td>
                <td style="padding:10px;">₹${student.monthlyFees || 0}</td>
                <td style="padding:10px;">
                    <span style="color:${statusColor};font-weight:600;">${status}</span>
                </td>
                <td style="padding:10px;text-align:center;">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();showStudentDetails('${student.studentId}')">👁️</button>
                    <button class="btn btn-sm btn-warning" onclick="event.stopPropagation();editStudent('${student.studentId}')">✏️</button>
                    <button class="btn btn-sm ${student.isBlocked ? 'btn-success' : 'btn-danger'}" onclick="event.stopPropagation();toggleBlock('${student.studentId}')">
                        ${student.isBlocked ? '🔓' : '🔒'}
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== SEARCH STUDENTS =====
async function searchStudents(query) {
    if (!query || query.length < 2) {
        renderStudentTable(allStudents);
        return;
    }
    
    try {
        const data = await apiCall(`/api/students/search/${query}`);
        if (data.success) {
            renderStudentTable(data.data);
        }
    } catch (error) {
        showToast('Error searching students', true);
    }
}

// ===== FILTER BY CLASS =====
function filterByClass(className) {
    if (!className) {
        renderStudentTable(allStudents);
        return;
    }
    
    const filtered = allStudents.filter(s => s.currentClass === className);
    renderStudentTable(filtered);
}

// ===== STUDENT PHOTO HANDLER =====
function handleStudentPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        document.getElementById('sPhotoPreviewImg').src = base64;
        document.getElementById('sPhotoPreviewImg').style.display = 'block';
        document.getElementById('sPhotoPlaceholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ===== SAVE STUDENT =====
async function saveStudent(event) {
    event.preventDefault();
    
    const editId = document.getElementById('addStudentForm').dataset.editId;
    
    const data = {
        name: {
            first: document.getElementById('sFirstName').value.trim(),
            middle: document.getElementById('sMiddleName').value.trim(),
            last: document.getElementById('sLastName').value.trim()
        },
        aadharNumber: document.getElementById('sAadhar').value.trim(),
        dob: document.getElementById('sDob').value,
        gender: document.getElementById('sGender').value,
        studentMobile: document.getElementById('sMobile').value.trim(),
        email: document.getElementById('sEmail').value.trim(),
        address: document.getElementById('sAddress').value.trim(),
        parentType: document.getElementById('sParentType').value,
        fatherName: document.getElementById('sFatherName').value.trim(),
        fatherMobile: document.getElementById('sFatherMobile').value.trim(),
        motherName: document.getElementById('sMotherName').value.trim(),
        motherMobile: document.getElementById('sMotherMobile').value.trim(),
        guardianName: document.getElementById('sGuardianName').value.trim(),
        guardianMobile: document.getElementById('sGuardianMobile').value.trim(),
        guardianRelation: document.getElementById('sGuardianRelation').value.trim(),
        currentClass: document.getElementById('sClass').value,
        currentBoard: document.getElementById('sBoard').value,
        joiningDate: document.getElementById('sJoiningDate').value,
        monthlyFees: parseFloat(document.getElementById('sFees').value),
        photo: document.getElementById('sPhotoPreviewImg').src || ''
    };
    
    // Validate
    if (!data.name.first || !data.name.last) {
        showToast('Please enter full name', true);
        return;
    }
    if (!data.aadharNumber || data.aadharNumber.length !== 12) {
        showToast('Please enter valid 12 digit Aadhar number', true);
        return;
    }
    if (!data.studentMobile || data.studentMobile.length !== 10) {
        showToast('Please enter valid 10 digit mobile number', true);
        return;
    }
    if (!data.currentClass || !data.currentBoard || !data.joiningDate || !data.monthlyFees) {
        showToast('Please fill all required fields', true);
        return;
    }
    
    try {
        let response;
        if (editId) {
            response = await apiCall(`/api/students/${editId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await apiCall('/api/students', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
        
        if (response.success) {
            showToast(editId ? 'Student updated successfully!' : 'Student added successfully!');
            resetStudentForm();
            switchSubTab('list');
            loadStudents();
        } else {
            showToast(response.message || 'Failed to save student', true);
        }
    } catch (error) {
        showToast('Error saving student', true);
    }
}

// ===== RESET STUDENT FORM =====
function resetStudentForm() {
    document.getElementById('addStudentForm').reset();
    document.getElementById('addStudentForm').dataset.editId = '';
    document.getElementById('sPhotoPreviewImg').src = '';
    document.getElementById('sPhotoPreviewImg').style.display = 'none';
    document.getElementById('sPhotoPlaceholder').style.display = 'block';
    document.getElementById('addStudentTitle').textContent = 'Add New Student';
    const submitBtn = document.querySelector('#addStudentForm button[type="submit"]');
    submitBtn.textContent = '✅ Add Student';
    submitBtn.style.background = '';
}

// ===== SHOW STUDENT DETAILS =====
async function showStudentDetails(studentId) {
    currentStudentId = studentId;
    
    try {
        const data = await apiCall(`/api/students/${studentId}`);
        if (!data.success) {
            showToast('Student not found', true);
            return;
        }
        
        const student = data.data;
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'studentDetailModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
            padding: 20px;
        `;
        
        let educationHTML = '';
        student.educationHistory.forEach((hist, idx) => {
            const statusText = hist.isActive ? '🟢 CURRENT' : hist.isCompleted ? '✅ COMPLETED' : '⏳ UPCOMING';
            const statusColor = hist.isActive ? '#2ecc71' : hist.isCompleted ? '#27ae60' : '#f39c12';
            
            educationHTML += `
                <div style="background:#f8f9fa;border-radius:10px;padding:15px;margin-bottom:15px;border-left:4px solid ${statusColor};">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                        <div>
                            <strong style="font-size:16px;">📦 ${hist.class} (${hist.board})</strong>
                            <span style="color:${statusColor};font-weight:600;margin-left:10px;">${statusText}</span>
                        </div>
                        <div style="font-size:13px;color:#666;">
                            ${hist.joiningDate ? new Date(hist.joiningDate).toLocaleDateString() : 'N/A'} 
                            ${hist.endDate ? `→ ${new Date(hist.endDate).toLocaleDateString()}` : '→ Ongoing'}
                        </div>
                    </div>
                    
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:10px 0;font-size:13px;background:white;padding:10px;border-radius:8px;">
                        <div>📅 Months: ${hist.totalMonths || 0}</div>
                        <div>💰 Total: ₹${hist.totalFees || 0}</div>
                        <div>✅ Paid: ₹${hist.totalPaid || 0}</div>
                        <div>⚠️ Due: ₹${hist.totalDue || 0}</div>
                    </div>
                    
                    ${hist.isActive ? `
                        <div style="margin-top:10px;">
                            <div style="font-weight:600;font-size:14px;margin-bottom:8px;">💰 Month wise fees (Current Class - Excel View)</div>
                            <div style="overflow-x:auto;">
                                <table style="width:100%;border-collapse:collapse;font-size:12px;background:white;border-radius:8px;">
                                    <thead>
                                        <tr style="background:#667eea;color:white;">
                                            <th style="padding:6px 10px;">#</th>
                                            <th style="padding:6px 10px;">Month</th>
                                            <th style="padding:6px 10px;">Year</th>
                                            <th style="padding:6px 10px;">Fees</th>
                                            <th style="padding:6px 10px;">Paid</th>
                                            <th style="padding:6px 10px;">Due</th>
                                            <th style="padding:6px 10px;">Status</th>
                                            <th style="padding:6px 10px;">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                            `;
                            
                            hist.fees.forEach((fee, i) => {
                                const statusIcon = fee.status === 'paid' ? '✅' : fee.status === 'partial' ? '⚠️' : '❌';
                                const statusColorFee = fee.status === 'paid' ? '#2ecc71' : fee.status === 'partial' ? '#f39c12' : '#e74c3c';
                                
                                educationHTML += `
                                    <tr style="border-bottom:1px solid #f0f0f0;">
                                        <td style="padding:6px 10px;">${i+1}</td>
                                        <td style="padding:6px 10px;">${fee.month}</td>
                                        <td style="padding:6px 10px;">${fee.year}</td>
                                        <td style="padding:6px 10px;">₹${fee.amount}</td>
                                        <td style="padding:6px 10px;">₹${fee.paidAmount || 0}</td>
                                        <td style="padding:6px 10px;">₹${fee.dueAmount || 0}</td>
                                        <td style="padding:6px 10px;color:${statusColorFee};font-weight:600;">${statusIcon} ${fee.status}</td>
                                        <td style="padding:6px 10px;">
                                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();addPayment('${student.studentId}','${fee.month}',${fee.year})">💰 Pay</button>
                                        </td>
                                    </tr>
                                `;
                            });
                            
                            educationHTML += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : `
                        <div style="margin-top:10px;font-size:13px;color:#666;">
                            ✅ This class is completed. Total paid: ₹${hist.totalPaid || 0} | Total due: ₹${hist.totalDue || 0}
                        </div>
                    `}
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div style="background:white;border-radius:20px;max-width:1000px;width:100%;max-height:90vh;overflow-y:auto;padding:0;">
                <div style="position:sticky;top:0;background:white;padding:20px 25px;border-bottom:2px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;border-radius:20px 20px 0 0;z-index:1;">
                    <div style="display:flex;align-items:center;gap:15px;">
                        <div style="width:50px;height:50px;border-radius:50%;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:24px;">
                            ${student.photo ? `<img src="${student.photo}" style="width:100%;height:100%;object-fit:cover;">` : '👤'}
                        </div>
                        <div>
                            <h2 style="font-size:20px;color:#333;">${student.fullName || 'N/A'}</h2>
                            <div style="font-size:13px;color:#888;">ID: ${student.studentId} | Aadhar: ${student.aadharNumber}</div>
                        </div>
                    </div>
                    <button onclick="this.closest('#studentDetailModal').remove()" style="width:35px;height:35px;border:none;background:#f0f0f0;border-radius:50%;font-size:18px;cursor:pointer;">✕</button>
                </div>
                
                <div style="padding:25px;">
                    <!-- Personal Details -->
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;background:#f8f9fa;padding:15px;border-radius:10px;margin-bottom:20px;">
                        <div><strong>📞 Mobile:</strong> ${student.studentMobile || 'N/A'}</div>
                        <div><strong>📧 Email:</strong> ${student.email || 'N/A'}</div>
                        <div><strong>🎂 DOB:</strong> ${student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</div>
                        <div><strong>⚥ Gender:</strong> ${student.gender || 'N/A'}</div>
                        <div><strong>👨 Father:</strong> ${student.fatherName || 'N/A'} ${student.fatherMobile ? `(${student.fatherMobile})` : ''}</div>
                        <div><strong>👩 Mother:</strong> ${student.motherName || 'N/A'} ${student.motherMobile ? `(${student.motherMobile})` : ''}</div>
                    </div>
                    
                    <!-- Summary -->
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;background:linear-gradient(135deg,#667eea, #764ba2);color:white;padding:15px;border-radius:10px;margin-bottom:20px;">
                        <div><strong>📚 Total Classes:</strong> ${student.educationHistory.length}</div>
                        <div><strong>📅 Total Months:</strong> ${student.totalMonths || 0}</div>
                        <div><strong>💰 Total Fees:</strong> ₹${student.totalFees || 0}</div>
                        <div><strong>✅ Total Paid:</strong> ₹${student.totalPaid || 0}</div>
                        <div><strong>⚠️ Total Due:</strong> ₹${student.totalDue || 0}</div>
                    </div>
                    
                    <!-- Education History -->
                    <h3 style="margin-bottom:15px;color:#333;">🎓 Education & Promotion History</h3>
                    ${educationHTML}
                    
                    <!-- Actions -->
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;padding-top:20px;border-top:2px solid #f0f0f0;">
                        <button class="btn btn-primary" onclick="promoteStudent('${student.studentId}')">🚀 Promote</button>
                        <button class="btn btn-warning" onclick="editStudent('${student.studentId}')">✏️ Edit Profile</button>
                        <button class="btn ${student.isBlocked ? 'btn-success' : 'btn-danger'}" onclick="toggleBlock('${student.studentId}')">
                            ${student.isBlocked ? '🔓 Unblock' : '🔒 Block'}
                        </button>
                        <button class="btn btn-danger" onclick="deleteStudent('${student.studentId}')">🗑️ Delete</button>
                        <button onclick="this.closest('#studentDetailModal').remove()" class="btn" style="background:#e0e0e0;">❌ Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        showToast('Error loading student details', true);
    }
}

// ===== ADD PAYMENT =====
async function addPayment(studentId, month, year) {
    const amount = prompt(`Enter amount to pay for ${month} ${year}:`);
    if (!amount || isNaN(amount) || amount <= 0) return;
    
    const mode = prompt('Payment Mode (cash/cheque/online/card):') || 'cash';
    const remarks = prompt('Remarks (optional):') || '';
    
    try {
        const data = await apiCall(`/api/students/${studentId}/payment`, {
            method: 'POST',
            body: JSON.stringify({
                month,
                year,
                paidAmount: parseFloat(amount),
                paymentMode: mode,
                remarks
            })
        });
        
        if (data.success) {
            showToast('Payment added successfully!');
            document.getElementById('studentDetailModal')?.remove();
            showStudentDetails(studentId);
            loadStudents();
        } else {
            showToast(data.message || 'Failed to add payment', true);
        }
    } catch (error) {
        showToast('Error adding payment', true);
    }
}

// ===== PROMOTE STUDENT =====
async function promoteStudent(studentId) {
    const data = await apiCall(`/api/students/${studentId}`);
    if (!data.success) {
        showToast('Student not found', true);
        return;
    }
    
    const student = data.data;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;max-width:500px;width:100%;padding:30px;">
            <h2 style="margin-bottom:20px;">🚀 Promote Student</h2>
            <div style="background:#f8f9fa;padding:15px;border-radius:10px;margin-bottom:20px;">
                <div><strong>Student:</strong> ${student.fullName}</div>
                <div><strong>Current Class:</strong> ${student.currentClass} (${student.currentBoard})</div>
                <div><strong>Current Fees:</strong> ₹${student.monthlyFees}</div>
                <div><strong>Total Due:</strong> ₹${student.totalDue}</div>
                ${student.totalDue > 0 ? `<div style="color:#e74c3c;font-weight:600;">⚠️ Please clear all dues first!</div>` : ''}
            </div>
            
            <div class="form-group">
                <label>Promote To *</label>
                <select id="promoteClass" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px;">
                    <option value="">Select Class</option>
                    <optgroup label="Primary School">
                        <option value="Class 1st">Class 1st</option>
                        <option value="Class 2nd">Class 2nd</option>
                        <option value="Class 3rd">Class 3rd</option>
                        <option value="Class 4th">Class 4th</option>
                        <option value="Class 5th">Class 5th</option>
                    </optgroup>
                    <optgroup label="Middle School">
                        <option value="Class 6th">Class 6th</option>
                        <option value="Class 7th">Class 7th</option>
                        <option value="Class 8th">Class 8th</option>
                    </optgroup>
                    <optgroup label="High School">
                        <option value="Class 9th">Class 9th</option>
                        <option value="Class 10th">Class 10th</option>
                    </optgroup>
                    <optgroup label="Graduation">
                        <option value="B.Com">B.Com</option>
                        <option value="B.Sc">B.Sc</option>
                        <option value="B.A">B.A</option>
                    </optgroup>
                </select>
            </div>
            
            <div class="form-group">
                <label>Board *</label>
                <select id="promoteBoard" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px;">
                    <option value="CBSE">CBSE</option>
                    <option value="BSEB">BSEB</option>
                    <option value="ICSE">ICSE</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>New Monthly Fees *</label>
                <input type="number" id="promoteFees" value="${student.monthlyFees + 200}" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px;">
            </div>
            
            <div class="form-group">
                <label>Promotion Date *</label>
                <input type="date" id="promoteDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px;">
            </div>
            
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button onclick="confirmPromote('${studentId}')" class="btn btn-success" style="flex:1;" ${student.totalDue > 0 ? 'disabled' : ''}>
                    ✅ Promote
                </button>
                <button onclick="this.closest('div[style]').remove()" class="btn" style="flex:1;background:#e0e0e0;">❌ Cancel</button>
            </div>
            ${student.totalDue > 0 ? '<div style="color:#e74c3c;margin-top:10px;text-align:center;">Please clear all dues before promotion</div>' : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== CONFIRM PROMOTE =====
async function confirmPromote(studentId) {
    const newClass = document.getElementById('promoteClass').value;
    const newBoard = document.getElementById('promoteBoard').value;
    const newFees = parseFloat(document.getElementById('promoteFees').value);
    const promotionDate = document.getElementById('promoteDate').value;
    
    if (!newClass) {
        showToast('Please select a class', true);
        return;
    }
    
    if (!newFees || newFees <= 0) {
        showToast('Please enter valid fees', true);
        return;
    }
    
    try {
        const data = await apiCall(`/api/students/${studentId}/promote`, {
            method: 'POST',
            body: JSON.stringify({
                newClass,
                newBoard,
                newFees,
                promotionDate
            })
        });
        
        if (data.success) {
            showToast('Student promoted successfully! 🎉');
            document.querySelector('div[style*="position: fixed"][style*="z-index: 3000"]')?.remove();
            document.getElementById('studentDetailModal')?.remove();
            loadStudents();
        } else {
            showToast(data.message || 'Failed to promote', true);
        }
    } catch (error) {
        showToast('Error promoting student', true);
    }
}

// ===== EDIT STUDENT =====
async function editStudent(studentId) {
    try {
        const data = await apiCall(`/api/students/${studentId}`);
        if (!data.success) {
            showToast('Student not found', true);
            return;
        }
        
        const student = data.data;
        
        document.getElementById('studentDetailModal')?.remove();
        
        // Switch to add tab
        switchSubTab('add');
        
        // Fill form with student data
        document.getElementById('sFirstName').value = student.name?.first || '';
        document.getElementById('sMiddleName').value = student.name?.middle || '';
        document.getElementById('sLastName').value = student.name?.last || '';
        document.getElementById('sAadhar').value = student.aadharNumber || '';
        document.getElementById('sDob').value = student.dob ? new Date(student.dob).toISOString().split('T')[0] : '';
        document.getElementById('sGender').value = student.gender || '';
        document.getElementById('sMobile').value = student.studentMobile || '';
        document.getElementById('sEmail').value = student.email || '';
        document.getElementById('sAddress').value = student.address || '';
        document.getElementById('sParentType').value = student.parentType || 'Father';
        document.getElementById('sFatherName').value = student.fatherName || '';
        document.getElementById('sFatherMobile').value = student.fatherMobile || '';
        document.getElementById('sMotherName').value = student.motherName || '';
        document.getElementById('sMotherMobile').value = student.motherMobile || '';
        document.getElementById('sGuardianName').value = student.guardianName || '';
        document.getElementById('sGuardianMobile').value = student.guardianMobile || '';
        document.getElementById('sGuardianRelation').value = student.guardianRelation || '';
        document.getElementById('sClass').value = student.currentClass || '';
        document.getElementById('sBoard').value = student.currentBoard || '';
        document.getElementById('sJoiningDate').value = student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '';
        document.getElementById('sFees').value = student.monthlyFees || 0;
        
        if (student.photo) {
            document.getElementById('sPhotoPreviewImg').src = student.photo;
            document.getElementById('sPhotoPreviewImg').style.display = 'block';
            document.getElementById('sPhotoPlaceholder').style.display = 'none';
        }
        
        // Set edit mode
        document.getElementById('addStudentForm').dataset.editId = studentId;
        document.getElementById('addStudentTitle').textContent = 'Edit Student';
        const submitBtn = document.querySelector('#addStudentForm button[type="submit"]');
        submitBtn.textContent = '✏️ Update Student';
        submitBtn.style.background = '#f39c12';
        
        showToast('Edit mode - Update student details');
        
    } catch (error) {
        showToast('Error loading student for edit', true);
    }
}

// ===== TOGGLE BLOCK =====
async function toggleBlock(studentId) {
    try {
        const data = await apiCall(`/api/students/${studentId}`);
        if (!data.success) {
            showToast('Student not found', true);
            return;
        }
        
        const student = data.data;
        const action = student.isBlocked ? 'unblock' : 'block';
        
        if (!confirm(`Are you sure you want to ${action} this student?`)) return;
        
        const response = await apiCall(`/api/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify({ isBlocked: !student.isBlocked })
        });
        
        if (response.success) {
            showToast(`Student ${action}ed successfully!`);
            loadStudents();
            document.getElementById('studentDetailModal')?.remove();
        } else {
            showToast(`Failed to ${action} student`, true);
        }
    } catch (error) {
        showToast('Error toggling block status', true);
    }
}

// ===== DELETE STUDENT =====
async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone!')) return;
    
    try {
        const data = await apiCall(`/api/students/${studentId}`, {
            method: 'DELETE'
        });
        
        if (data.success) {
            showToast('Student deleted successfully!');
            document.getElementById('studentDetailModal')?.remove();
            loadStudents();
        } else {
            showToast('Failed to delete student', true);
        }
    } catch (error) {
        showToast('Error deleting student', true);
    }
}
