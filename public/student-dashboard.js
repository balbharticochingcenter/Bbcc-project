// Configuration
const API_BASE = window.location.origin;
let currentSettings = {};
let currentStudents = [];
let currentPage = 1;
let itemsPerPage = 10;
let selectedStudents = [];
let currentEditingStudent = null;
let currentFeesStudent = null;

// DOM Elements
const elements = {
    // Header elements
    logoImg: document.getElementById('logo-img'),
    mainTitle: document.getElementById('main-title'),
    subTitle: document.getElementById('sub-title'),
    
    // Filter elements
    classSelect: document.getElementById('class-select'),
    batchSelect: document.getElementById('batch-select'),
    bulkPromote: document.getElementById('bulk-promote'),
    
    // Table elements
    studentTableBody: document.getElementById('student-table-body'),
    totalStudents: document.getElementById('total-students'),
    totalFees: document.getElementById('total-fees'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageInfo: document.getElementById('page-info'),
    
    // Modal elements
    studentModal: document.getElementById('student-modal'),
    feesModal: document.getElementById('fees-modal'),
    promoteModal: document.getElementById('promote-modal'),
    loading: document.getElementById('loading'),
    
    // Student form elements
    modalTitle: document.getElementById('modal-title'),
    studentId: document.getElementById('student-id'),
    studentPhoto: document.getElementById('student-photo'),
    studentName: document.getElementById('student-name'),
    rollNumber: document.getElementById('roll-number'),
    password: document.getElementById('password'),
    parentName: document.getElementById('parent-name'),
    parentMobile: document.getElementById('parent-mobile'),
    studentMobile: document.getElementById('student-mobile'),
    doj: document.getElementById('doj'),
    modalClass: document.getElementById('modal-class'),
    modalBatch: document.getElementById('modal-batch'),
    feesInput: document.getElementById('fees'),
    deleteBtn: document.getElementById('delete-btn'),
    
    // Fees modal elements
    feesTitle: document.getElementById('fees-title'),
    feesPhoto: document.getElementById('fees-photo'),
    feesStudentName: document.getElementById('fees-student-name'),
    feesDetails: document.getElementById('fees-details'),
    totalFeesAmount: document.getElementById('total-fees-amount'),
    totalPaidAmount: document.getElementById('total-paid-amount'),
    totalDueAmount: document.getElementById('total-due-amount'),
    paymentTableBody: document.getElementById('payment-table-body'),
    paymentMonth: document.getElementById('payment-month'),
    paymentYear: document.getElementById('payment-year'),
    paymentAmount: document.getElementById('payment-amount'),
    
    // Promote modal elements
    promoteCount: document.getElementById('promote-count'),
    newClass: document.getElementById('new-class'),
    newBatch: document.getElementById('new-batch'),
    newFees: document.getElementById('new-fees')
};

// Initialize
async function initialize() {
    try {
        showLoading();
        await loadSettings();
        await loadClasses();
        updateUI();
        setupEventListeners();
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard. Please refresh.');
        hideLoading();
    }
}

// Load settings from database
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/api/director/get-settings`);
        if (!response.ok) throw new Error('Failed to load settings');
        currentSettings = await response.json();
    } catch (error) {
        console.error('Error loading settings:', error);
        currentSettings = {};
    }
}

// Update UI with current settings
function updateUI() {
    // Header
    if (currentSettings.logo) {
        elements.logoImg.src = currentSettings.logo;
    }
    elements.mainTitle.textContent = currentSettings.title || 'Bal Bharti Coaching Center';
    elements.subTitle.textContent = currentSettings.sub_title || 'Student Dashboard';
    
    // Set today's date as default for DOJ
    const today = new Date().toISOString().split('T')[0];
    elements.doj.value = today;
}

// Load classes from database (MongoDB compatible)
async function loadClasses() {
    try {
        // Aapke existing API use karein
        const response = await fetch(`${API_BASE}/api/get-all-classes`);
        if (!response.ok) throw new Error('Failed to load classes');
        const classes = await response.json();
        
        // Clear existing options
        elements.classSelect.innerHTML = '<option value="">Select Class</option>';
        elements.modalClass.innerHTML = '<option value="">Select Class</option>';
        elements.newClass.innerHTML = '<option value="">Select Class</option>';
        
        // Add classes to all selects
        classes.forEach(cls => {
            const option1 = document.createElement('option');
            option1.value = cls;
            option1.textContent = cls;
            elements.classSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = cls;
            option2.textContent = cls;
            elements.modalClass.appendChild(option2);
            
            const option3 = document.createElement('option');
            option3.value = cls;
            option3.textContent = cls;
            elements.newClass.appendChild(option3);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

// Load batches for selected class (MongoDB compatible)
async function loadBatches() {
    const className = elements.classSelect.value;
    if (!className) {
        elements.batchSelect.innerHTML = '<option value="">Select class first</option>';
        return;
    }
    
    try {
        // Naya API call - MongoDB ke according
        const response = await fetch(`${API_BASE}/api/student-dashboard/classes`);
        if (!response.ok) throw new Error('Failed to load batches');
        const data = await response.json();
        
        // Find the selected class
        const selectedClass = data.classes.find(c => c.class_name === className);
        
        elements.batchSelect.innerHTML = '<option value="">Select Batch</option>';
        if (selectedClass && selectedClass.batches) {
            selectedClass.batches.forEach(batch => {
                const option = document.createElement('option');
                option.value = batch.year;
                option.textContent = `${batch.year} - Fee: ₹${batch.fee}`;
                elements.batchSelect.appendChild(option);
            });
        } else {
            // Agar batch nahi hai toh current year show karein
            const currentYear = new Date().getFullYear();
            const option = document.createElement('option');
            option.value = currentYear;
            option.textContent = `${currentYear}`;
            elements.batchSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading batches:', error);
        elements.batchSelect.innerHTML = '<option value="">2024</option>';
    }
}

// Load batches for modal (MongoDB compatible)
async function loadModalBatches() {
    const className = elements.modalClass.value;
    if (!className) {
        elements.modalBatch.innerHTML = '<option value="">Select class first</option>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/student-dashboard/classes`);
        if (response.ok) {
            const data = await response.json();
            const selectedClass = data.classes.find(c => c.class_name === className);
            
            elements.modalBatch.innerHTML = '<option value="">Select Batch</option>';
            if (selectedClass && selectedClass.batches) {
                selectedClass.batches.forEach(batch => {
                    const option = document.createElement('option');
                    option.value = batch.year;
                    option.textContent = `${batch.year}`;
                    elements.modalBatch.appendChild(option);
                });
                
                // Auto-fill fees if available
                if (selectedClass.batches.length > 0) {
                    elements.feesInput.value = selectedClass.batches[0].fee || '';
                }
            }
        }
    } catch (error) {
        console.error('Error loading batches:', error);
        elements.modalBatch.innerHTML = '<option value="">2024</option>';
    }
}

// Load batches for promote modal
async function loadPromoteBatches() {
    const className = elements.newClass.value;
    if (!className) {
        elements.newBatch.innerHTML = '<option value="">Select class first</option>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/student-dashboard/classes`);
        if (response.ok) {
            const data = await response.json();
            const selectedClass = data.classes.find(c => c.class_name === className);
            
            elements.newBatch.innerHTML = '<option value="">Select Batch</option>';
            if (selectedClass && selectedClass.batches) {
                selectedClass.batches.forEach(batch => {
                    const option = document.createElement('option');
                    option.value = batch.year;
                    option.textContent = `${batch.year}`;
                    elements.newBatch.appendChild(option);
                });
                
                // Auto-fill fees if available
                if (selectedClass.batches.length > 0) {
                    elements.newFees.value = selectedClass.batches[0].fee || '';
                }
            }
        }
    } catch (error) {
        console.error('Error loading batches:', error);
        elements.newBatch.innerHTML = '<option value="">2024</option>';
    }
}

// Load students (MongoDB compatible)
async function loadStudents() {
    const className = elements.classSelect.value;
    const batchYear = elements.batchSelect.value;
    
    if (!className) {
        alert('Please select a class');
        return;
    }
    
    try {
        showLoading();
        
        // Naya API call - MongoDB compatible
        const response = await fetch(
            `${API_BASE}/api/student-dashboard/students?class_name=${className}` + 
            (batchYear ? `&batch_year=${batchYear}` : '')
        );
        
        if (!response.ok) throw new Error('Failed to load students');
        
        const data = await response.json();
        currentStudents = data.students || [];
        currentPage = 1;
        renderStudents();
        updatePagination();
        
        // Update selected students for bulk promote
        if (elements.bulkPromote.checked) {
            selectedStudents = currentStudents.map(s => s.student_id);
            elements.bulkPromote.checked = false;
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Error loading students. Please try again.');
        hideLoading();
    }
}

// Render students in table (MongoDB compatible)
function renderStudents() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageStudents = currentStudents.slice(startIndex, endIndex);
    
    elements.studentTableBody.innerHTML = '';
    
    if (pageStudents.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="13" style="text-align: center; padding: 2rem; color: #718096;">
                No students found. Click "Add New Student" to add students.
            </td>
        `;
        elements.studentTableBody.appendChild(row);
        
        elements.totalStudents.textContent = '0 Students';
        elements.totalFees.textContent = 'Total Fees: ₹0';
        return;
    }
    
    // Calculate totals
    const totalFees = currentStudents.reduce((sum, student) => sum + (parseFloat(student.fees) || 0), 0);
    elements.totalStudents.textContent = `${currentStudents.length} Students`;
    elements.totalFees.textContent = `Total Fees: ₹${totalFees.toLocaleString()}`;
    
    // Render each student
    pageStudents.forEach(student => {
        const row = document.createElement('tr');
        
        // Calculate fees status - MongoDB ke according
        const totalFees = parseFloat(student.fees) || 0;
        const totalPaid = student.total_paid || 0;
        const feesDue = totalFees - totalPaid;
        const status = feesDue <= 0 ? 'Paid' : 'Due';
        
        // Photo URL handle karein
        let photoUrl = 'default-avatar.png';
        if (student.photo) {
            if (student.photo.startsWith('data:image')) {
                photoUrl = student.photo;
            } else if (student.photo.startsWith('http')) {
                photoUrl = student.photo;
            }
        }
        
        row.innerHTML = `
            <td>
                <img src="${photoUrl}" 
                     alt="${student.student_name}" 
                     class="student-photo"
                     onerror="this.src='default-avatar.png'">
            </td>
            <td>${student.student_name || 'N/A'}</td>
            <td>${student.roll_number || student.student_id || 'N/A'}</td>
            <td>${student.pass || 'N/A'}</td>
            <td>${student.parent_name || 'N/A'}</td>
            <td>${student.parent_mobile || 'N/A'}</td>
            <td>${student.mobile || student.student_mobile || 'N/A'}</td>
            <td>${formatDate(student.doj || student.joining_date)}</td>
            <td>${student.student_class || 'N/A'}</td>
            <td>${student.batch_year || '2024'}</td>
            <td>₹${parseFloat(student.fees || 0).toLocaleString()}</td>
            <td><span class="status-${status.toLowerCase()}">${status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editStudent('${student.student_id || student._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-fees" onclick="openFeesTracker('${student.student_id || student._id}')">
                        <i class="fas fa-rupee-sign"></i> Fees
                    </button>
                </div>
            </td>
        `;
        
        elements.studentTableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(currentStudents.length / itemsPerPage);
    
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.prevBtn.disabled = currentPage === 1;
    elements.nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Next page
function nextPage() {
    const totalPages = Math.ceil(currentStudents.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderStudents();
        updatePagination();
    }
}

// Previous page
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderStudents();
        updatePagination();
    }
}

// Open add student modal
function openAddStudentModal() {
    elements.modalTitle.textContent = 'Add New Student';
    elements.deleteBtn.style.display = 'none';
    elements.studentId.value = '';
    clearStudentForm();
    elements.studentModal.style.display = 'flex';
}

// Edit student (MongoDB compatible)
async function editStudent(studentId) {
    try {
        showLoading();
        // Naya API call
        const response = await fetch(`${API_BASE}/api/student-dashboard/student/${studentId}`);
        if (!response.ok) throw new Error('Failed to load student');
        
        const data = await response.json();
        const student = data.student;
        currentEditingStudent = student;
        
        // Fill form
        elements.modalTitle.textContent = 'Edit Student';
        elements.deleteBtn.style.display = 'block';
        elements.studentId.value = student.student_id || student._id;
        elements.studentPhoto.value = student.photo || '';
        elements.studentName.value = student.student_name || '';
        elements.rollNumber.value = student.roll_number || student.student_id || '';
        elements.password.value = student.pass || '';
        elements.parentName.value = student.parent_name || '';
        elements.parentMobile.value = student.parent_mobile || '';
        elements.studentMobile.value = student.mobile || student.student_mobile || '';
        
        // Date format handle karein
        let dojValue = '';
        if (student.doj) {
            dojValue = student.doj.split('T')[0];
        } else if (student.joining_date) {
            dojValue = student.joining_date.split('T')[0];
        }
        elements.doj.value = dojValue;
        
        elements.feesInput.value = student.fees || '';
        
        // Load classes and select current
        await loadClasses();
        elements.modalClass.value = student.student_class || '';
        
        // Load batches for the class
        await loadModalBatches();
        setTimeout(() => {
            elements.modalBatch.value = student.batch_year || '';
        }, 100);
        
        elements.studentModal.style.display = 'flex';
        hideLoading();
    } catch (error) {
        console.error('Error loading student:', error);
        alert('Error loading student details');
        hideLoading();
    }
}

// Clear student form
function clearStudentForm() {
    elements.studentPhoto.value = '';
    elements.studentName.value = '';
    elements.rollNumber.value = '';
    elements.password.value = generatePassword();
    elements.parentName.value = '';
    elements.parentMobile.value = '';
    elements.studentMobile.value = '';
    elements.doj.value = new Date().toISOString().split('T')[0];
    elements.modalClass.value = '';
    elements.modalBatch.innerHTML = '<option value="">Select Class First</option>';
    elements.feesInput.value = '';
}

// Generate random password
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Save student (MongoDB compatible)
async function saveStudent() {
    const studentData = {
        student_id: elements.studentId.value || undefined,
        photo: elements.studentPhoto.value.trim() || undefined,
        student_name: elements.studentName.value.trim(),
        roll_number: elements.rollNumber.value.trim() || undefined,
        pass: elements.password.value.trim(),
        parent_name: elements.parentName.value.trim(),
        parent_mobile: elements.parentMobile.value.trim(),
        mobile: elements.studentMobile.value.trim() || undefined,
        doj: elements.doj.value,
        student_class: elements.modalClass.value,
        batch_year: elements.modalBatch.value,
        fees: elements.feesInput.value
    };
    
    // Validate
    if (!studentData.student_name || !studentData.student_class) {
        alert('Please fill all required fields (Name and Class)');
        return;
    }
    
    try {
        showLoading();
        let response;
        
        if (elements.studentId.value) {
            // Update existing student
            response = await fetch(`${API_BASE}/api/student-dashboard/update-student/${elements.studentId.value}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });
        } else {
            // Add new student
            response = await fetch(`${API_BASE}/api/student-dashboard/add-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save student');
        
        const result = await response.json();
        
        closeStudentModal();
        
        // Reload students if same class/batch
        const currentClass = elements.classSelect.value;
        const currentBatch = elements.batchSelect.value;
        
        if (currentClass === studentData.student_class && 
            (!currentBatch || currentBatch === studentData.batch_year)) {
            await loadStudents();
        }
        
        alert(result.message || 'Student saved successfully!');
        hideLoading();
    } catch (error) {
        console.error('Error saving student:', error);
        alert('Error saving student. Please try again.');
        hideLoading();
    }
}

// Delete student (MongoDB compatible)
async function deleteStudent() {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
        return;
    }
    
    const studentId = elements.studentId.value;
    if (!studentId) return;
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/student-dashboard/delete-student/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete student');
        
        closeStudentModal();
        
        // Reload students
        await loadStudents();
        
        alert('Student deleted successfully!');
        hideLoading();
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
        hideLoading();
    }
}

// Close student modal
function closeStudentModal() {
    elements.studentModal.style.display = 'none';
    currentEditingStudent = null;
}

// Open fees tracker (MongoDB compatible)
async function openFeesTracker(studentId) {
    try {
        showLoading();
        
        // Naya API call
        const response = await fetch(`${API_BASE}/api/student-dashboard/fees/${studentId}`);
        if (!response.ok) throw new Error('Failed to load fees details');
        
        const data = await response.json();
        currentFeesStudent = { 
            ...data.student, 
            payment_history: data.payment_history || [],
            fee_months: data.fee_months || []
        };
        
        // Update UI
        elements.feesTitle.textContent = `Fees Tracker - ${data.student.name}`;
        
        // Photo handle karein
        let photoUrl = 'default-avatar.png';
        if (data.student.photo) {
            if (data.student.photo.startsWith('data:image')) {
                photoUrl = data.student.photo;
            } else if (data.student.photo.startsWith('http')) {
                photoUrl = data.student.photo;
            }
        }
        elements.feesPhoto.src = photoUrl;
        elements.feesPhoto.onerror = function() { this.src = 'default-avatar.png'; };
        
        elements.feesStudentName.textContent = data.student.name;
        elements.feesDetails.textContent = `${data.student.class} - Batch ${data.student.batch} | Roll No: ${data.student.roll_number}`;
        
        // Calculate totals
        const totalFees = data.fee_summary?.total_fees || 0;
        const totalPaid = data.fee_summary?.total_paid || 0;
        const totalDue = data.fee_summary?.due_amount || 0;
        
        elements.totalFeesAmount.textContent = `₹${totalFees.toLocaleString()}`;
        elements.totalPaidAmount.textContent = `₹${totalPaid.toLocaleString()}`;
        elements.totalDueAmount.textContent = `₹${totalDue.toLocaleString()}`;
        
        // Render payment history
        renderPaymentHistory(data.payment_history || []);
        
        elements.feesModal.style.display = 'flex';
        hideLoading();
    } catch (error) {
        console.error('Error opening fees tracker:', error);
        alert('Error loading fees information');
        hideLoading();
    }
}

// Render payment history (MongoDB compatible)
function renderPaymentHistory(payments) {
    elements.paymentTableBody.innerHTML = '';
    
    if (payments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 2rem; color: #718096;">
                No payment records found.
            </td>
        `;
        elements.paymentTableBody.appendChild(row);
        return;
    }
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${getMonthName(payment.month)}</td>
            <td>${payment.year}</td>
            <td>${payment.class || currentFeesStudent?.class}</td>
            <td>${payment.batch_year || currentFeesStudent?.batch}</td>
            <td>₹${parseFloat(payment.amount || 0).toLocaleString()}</td>
            <td><span class="status-paid">Paid</span></td>
            <td>${formatDate(payment.payment_date)}</td>
            <td>
                <button class="btn-edit" onclick="editPayment('${payment._id || payment.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        elements.paymentTableBody.appendChild(row);
    });
}

// Get month name from number
function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
}

// Record payment (MongoDB compatible)
async function recordPayment() {
    if (!currentFeesStudent) return;
    
    const month = parseInt(elements.paymentMonth.value);
    const year = parseInt(elements.paymentYear.value);
    const amount = parseFloat(elements.paymentAmount.value);
    
    if (!month || !year || !amount || amount <= 0) {
        alert('Please enter valid payment details');
        return;
    }
    
    const paymentData = {
        student_id: currentFeesStudent.id || currentFeesStudent._id,
        month: month,
        year: year,
        amount: amount,
        mode: 'Cash',
        receipt_no: `RCPT${Date.now()}`
    };
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/student-dashboard/record-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) throw new Error('Failed to record payment');
        
        // Clear form
        elements.paymentAmount.value = '';
        
        // Refresh fees tracker
        await openFeesTracker(currentFeesStudent.id || currentFeesStudent._id);
        
        alert('Payment recorded successfully!');
        hideLoading();
    } catch (error) {
        console.error('Error recording payment:', error);
        alert('Error recording payment. Please try again.');
        hideLoading();
    }
}

// Edit payment (placeholder)
function editPayment(paymentId) {
    alert('Edit payment functionality to be implemented');
}

// Close fees modal
function closeFeesModal() {
    elements.feesModal.style.display = 'none';
    currentFeesStudent = null;
}

// Open bulk promote modal
function openPromoteModal() {
    if (selectedStudents.length === 0) {
        alert('No students selected. Please load students first.');
        return;
    }
    
    elements.promoteCount.textContent = selectedStudents.length;
    elements.newClass.value = '';
    elements.newBatch.innerHTML = '<option value="">Select Class First</option>';
    elements.newFees.value = '';
    
    elements.promoteModal.style.display = 'flex';
}

// Promote students (MongoDB compatible)
async function promoteStudents() {
    const newClass = elements.newClass.value;
    const newBatch = elements.newBatch.value;
    const newFees = elements.newFees.value;
    
    if (!newClass || !newBatch || !newFees) {
        alert('Please fill all fields for promotion');
        return;
    }
    
    if (!confirm(`Promote ${selectedStudents.length} students to ${newClass} - ${newBatch}?`)) {
        return;
    }
    
    const promotionData = {
        student_ids: selectedStudents,
        new_class: newClass,
        new_batch: newBatch,
        new_fees: newFees
    };
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/student-dashboard/bulk-promote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(promotionData)
        });
        
        if (!response.ok) throw new Error('Failed to promote students');
        
        const result = await response.json();
        
        closePromoteModal();
        
        // Reload current students
        await loadStudents();
        
        alert(result.message || 'Students promoted successfully!');
        hideLoading();
    } catch (error) {
        console.error('Error promoting students:', error);
        alert('Error promoting students. Please try again.');
        hideLoading();
    }
}

// Close promote modal
function closePromoteModal() {
    elements.promoteModal.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    // Class change listeners
    elements.classSelect.addEventListener('change', loadBatches);
    elements.modalClass.addEventListener('change', loadModalBatches);
    elements.newClass.addEventListener('change', loadPromoteBatches);
    
    // Bulk promote checkbox
    elements.bulkPromote.addEventListener('change', function() {
        if (this.checked && currentStudents.length > 0) {
            selectedStudents = currentStudents.map(s => s.student_id || s._id);
            openPromoteModal();
        }
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN');
    } catch (e) {
        return dateString;
    }
}

// Show loading
function showLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'flex';
    }
}

// Hide loading
function hideLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'none';
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initialize);
