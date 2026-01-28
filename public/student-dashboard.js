// Configuration & State
const API_BASE = window.location.origin;
let currentSettings = {};
let currentStudents = [];
let currentPage = 1;
let itemsPerPage = 10;
let selectedStudents = [];
let currentEditingStudent = null;
let currentFeesStudent = null;
let compressedPhotoBase64 = ""; // Naya state compressed photo ke liye

// DOM Elements
const elements = {
    logoImg: document.getElementById('logo-img'),
    mainTitle: document.getElementById('main-title'),
    subTitle: document.getElementById('sub-title'),
    classSelect: document.getElementById('class-select'),
    batchSelect: document.getElementById('batch-select'),
    bulkPromote: document.getElementById('bulk-promote'),
    studentTableBody: document.getElementById('student-table-body'),
    totalStudents: document.getElementById('total-students'),
    totalFees: document.getElementById('total-fees'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageInfo: document.getElementById('page-info'),
    studentModal: document.getElementById('student-modal'),
    feesModal: document.getElementById('fees-modal'),
    promoteModal: document.getElementById('promote-modal'),
    loading: document.getElementById('loading'),
    modalTitle: document.getElementById('modal-title'),
    studentId: document.getElementById('student-id'),
    studentPhoto: document.getElementById('student-photo'), // Ye badal jayega patchUI se
    studentName: document.getElementById('student-name'),
    rollNumber: document.getElementById('roll-number'),
    password: document.getElementById('password'),
    parentName: document.getElementById('parent-name'),
    parentMobile: document.getElementById('parent-mobile'),
    studentMobile: document.getElementById('student-mobile'),
    doj: document.getElementById('doj'),
    modalClass: document.getElementById('modal-class'),
    modalBatch: document.getElementById('modal-batch'), // Ye badal jayega patchUI se
    feesInput: document.getElementById('fees'),
    deleteBtn: document.getElementById('delete-btn'),
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
    promoteCount: document.getElementById('promote-count'),
    newClass: document.getElementById('new-class'),
    newBatch: document.getElementById('new-batch'),
    newFees: document.getElementById('new-fees')
};

// --- NEW: PATCH UI FUNCTION (Bina HTML chhuye badlav) ---
function patchUI() {
    // 1. Photo field ko File Upload banana
    if (elements.studentPhoto) {
        elements.studentPhoto.type = "file";
        elements.studentPhoto.accept = "image/*";
        elements.studentPhoto.addEventListener('change', handlePhotoUpload);
    }
    // 2. Modal Batch Year ko Dropdown se Input banana
    if (elements.modalBatch) {
        const parent = elements.modalBatch.parentNode;
        const batchInput = document.createElement('input');
        batchInput.type = "number";
        batchInput.id = "modal-batch";
        batchInput.className = elements.modalBatch.className; // Same CSS style
        batchInput.placeholder = "Enter Year (e.g. 2026)";
        parent.replaceChild(batchInput, elements.modalBatch);
        elements.modalBatch = batchInput; // State update
    }
}

// --- NEW: PHOTO COMPRESSION LOGIC ---
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 300; 
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // 0.6 quality = Very small size, good clarity
            compressedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.6);
        };
    };
}

// Initialize
async function initialize() {
    try {
        showLoading();
        patchUI(); // Pehle UI sudharein
        await loadSettings();
        await loadClasses();
        updateUI();
        setupEventListeners();
        hideLoading();
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
    }
}

// Load students (Updated with Status Logic)
async function loadStudents() {
    const className = elements.classSelect.value;
    const batchYear = elements.batchSelect.value;
    if (!className) return alert('Please select a class');

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/student-dashboard/students?class_name=${className}${batchYear ? `&batch_year=${batchYear}` : ''}`);
        const data = await response.json();
        currentStudents = data.students || [];
        renderStudents();
        updatePagination();
        hideLoading();
    } catch (error) {
        hideLoading();
    }
}

// Render Table (13 Columns implementation)
function renderStudents() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageStudents = currentStudents.slice(startIndex, startIndex + itemsPerPage);
    elements.studentTableBody.innerHTML = '';

    pageStudents.forEach(student => {
        const totalFees = parseFloat(student.fees) || 0;
        const totalPaid = student.total_paid || 0;
        const due = totalFees - totalPaid;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${student.photo || 'default-avatar.png'}" width="40" height="40" style="border-radius:5px; object-fit:cover;"></td>
            <td>${student.student_name}</td>
            <td>${student.roll_number || student.student_id}</td>
            <td><code>${student.pass}</code></td>
            <td>${student.parent_name}</td>
            <td>${student.parent_mobile}</td>
            <td>${student.mobile || student.student_mobile || 'N/A'}</td>
            <td>${formatDate(student.doj)}</td>
            <td>${student.student_class}</td>
            <td>${student.batch_year}</td>
            <td>₹${totalFees}</td>
            <td><span style="color: ${due <= 0 ? '#48bb78' : '#f56565'}; font-weight: bold;">
                ${due <= 0 ? 'Paid' : `Due: ₹${due}`}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editStudent('${student.student_id || student._id}')">Edit</button>
                    <button class="btn-fees" onclick="openFeesTracker('${student.student_id || student._id}')">Fees</button>
                </div>
            </td>
        `;
        elements.studentTableBody.appendChild(row);
    });
}

// Fees Tracker (Monthly Logic implementation)
async function openFeesTracker(studentId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/student-dashboard/fees/${studentId}`);
        const data = await response.json();
        currentFeesStudent = data.student;

        elements.feesTitle.textContent = `Fees Tracker - ${data.student.name}`;
        elements.totalFeesAmount.textContent = `₹${data.fee_summary.total_fees}`;
        elements.totalPaidAmount.textContent = `₹${data.fee_summary.total_paid}`;
        elements.totalDueAmount.textContent = `₹${data.fee_summary.due_amount}`;

        // Monthly breakdown table
        elements.paymentTableBody.innerHTML = '';
        const monthlyTarget = data.fee_summary.total_fees / 12;

        data.payment_history.forEach(pay => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${getMonthName(pay.month)}</td>
                <td>${pay.year}</td>
                <td>${data.student.class}</td>
                <td>${data.student.batch}</td>
                <td>₹${pay.amount}</td>
                <td><span class="status-paid">Paid</span></td>
                <td>${formatDate(pay.payment_date)}</td>
                <td>-</td>
            `;
            elements.paymentTableBody.appendChild(row);
        });

        elements.feesModal.style.display = 'flex';
        hideLoading();
    } catch (error) {
        hideLoading();
    }
}

// Save Student (Updated for Manual Batch & Compressed Photo)
async function saveStudent() {
    const studentData = {
        student_id: elements.studentId.value || undefined,
        photo: compressedPhotoBase64 || undefined, // Use compressed base64
        student_name: elements.studentName.value.trim(),
        roll_number: elements.rollNumber.value.trim(),
        pass: elements.password.value.trim(),
        parent_name: elements.parentName.value.trim(),
        parent_mobile: elements.parentMobile.value.trim(),
        mobile: elements.studentMobile.value.trim(),
        doj: elements.doj.value,
        student_class: elements.modalClass.value,
        batch_year: elements.modalBatch.value, // Now a text/number input
        fees: elements.feesInput.value
    };

    const method = elements.studentId.value ? 'PUT' : 'POST';
    const url = elements.studentId.value 
        ? `${API_BASE}/api/student-dashboard/update-student/${elements.studentId.value}`
        : `${API_BASE}/api/student-dashboard/add-student`;

    try {
        showLoading();
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        if(res.ok) {
            alert("Success!");
            closeStudentModal();
            loadStudents();
        }
        hideLoading();
    } catch (error) {
        hideLoading();
    }
}

// Helper: Format Date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
}

// All your other functions (loadSettings, loadClasses, updatePagination, etc.) remain below...
// [Baki purane functions yaha paste kar dein]

document.addEventListener('DOMContentLoaded', initialize);
