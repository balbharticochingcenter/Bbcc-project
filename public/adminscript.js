// ================= GLOBAL DOM =================
let bannerBase64 = "";
let allSMSStudents = [];
const dash_class = document.getElementById("dash_class");
const dash_year = document.getElementById("dash_year");
const dashTotal = document.getElementById("dashTotal");
const dashboardBody = document.getElementById("dashboardBody");

const feesExcelModal = document.getElementById("feesExcelModal");
const feesStudentInfo = document.getElementById("feesStudentInfo");
const feesExcelBody = document.getElementById("feesExcelBody");

const studentEditModal = document.getElementById("studentEditModal");

const edit_id = document.getElementById("edit_id");
const edit_class = document.getElementById("edit_class");
const edit_name = document.getElementById("edit_name");
const edit_parent = document.getElementById("edit_parent");
const edit_mobile = document.getElementById("edit_mobile");
const edit_parent_mobile = document.getElementById("edit_parent_mobile");
const edit_photo_preview = document.getElementById("edit_photo_preview");
const edit_photo_file = document.getElementById("edit_photo_file");
const fees_year = document.getElementById("fees_year");
const fees_month = document.getElementById("fees_month");

// ================= SECURITY =================
(function checkAuth(){
  // ✅ Sirf admin pages par hi chale
  if (!location.pathname.startsWith('/admin')) return;

  if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
    location.replace('login.html');
  }
})();

function logoutAdmin(){
  if(confirm("Logout?")){
    localStorage.removeItem('isAdminLoggedIn');
    location.href='login.html';
  }
}

// ================= GLOBAL API =================
const API = location.origin;

// ================= INIT =================
async function initDashboard(){
  await loadClassList();
  await loadSystemSettings();
  loadPendingRegistrations();

  const btn=document.getElementById("openStudentDashboardBtn");
  if(btn) btn.style.display="flex";
}

// ================= SYSTEM SETTINGS =================
async function loadSystemSettings(){
  try{
    const res = await fetch(API + '/api/get-settings');
    const s = await res.json();

    const db_logo = document.getElementById("db-logo");
    const db_title = document.getElementById("db-title");
    const db_subtitle = document.getElementById("db-subtitle");

    const foot_facebook = document.getElementById("foot-facebook");
    const foot_gmail = document.getElementById("foot-gmail");
    const foot_call = document.getElementById("foot-call");
    const foot_help = document.getElementById("foot-help");

    if(s.logo && db_logo) db_logo.src = s.logo;
    if(s.title && db_title) db_title.innerText = s.title;
    if(s.sub_title && db_subtitle) db_subtitle.innerText = s.sub_title;

    if(s.facebook && foot_facebook) foot_facebook.href = s.facebook;
    if(s.gmail && foot_gmail) foot_gmail.href = "mailto:"+s.gmail;
    if(s.call_no && foot_call) foot_call.href = "tel:"+s.call_no;
    if(s.help && foot_help) foot_help.innerText = s.help;

  }catch(e){
    console.error("Settings load error:", e);
  }
}
// --- ADMIN PROFILE FUNCTIONS ---

// 1. Modal Open & Load Data from DB
async function openAdminProfile() {
    document.getElementById('adminProfileModal').style.display = 'block';
    try {
        const res = await fetch('/api/get-admin-profile');
        const admin = await res.json();
        
        if (admin && admin.admin_userid) {
            document.getElementById('admin_userid').value = admin.admin_userid || '';
            document.getElementById('admin_name').value = admin.admin_name || '';
            document.getElementById('admin_mobile').value = admin.admin_mobile || '';
            document.getElementById('admin_pass').value = admin.admin_pass || '';
            
            // Note: Server model mein photo nahi hai, par SystemConfig se le sakte hain ya preview rakh sakte hain
            // Agar aap photo save karna chahte hain toh model mein 'admin_photo' add karna hoga.
        }
    } catch (err) {
        console.error("Profile load error:", err);
    }
}

function closeAdminModal() {
    document.getElementById('adminProfileModal').style.display = 'none';
}

// 2. Photo Compression Logic (Strict 5KB Limit)
function handleAdminPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Photo ko chota karein (Thumbnail size 120x120)
                canvas.width = 120;
                canvas.height = 120;
                ctx.drawImage(img, 0, 0, 120, 120);
                
                // 0.1 quality means maximum compression (helps reach ~5kb)
                let dataUrl = canvas.toDataURL('image/jpeg', 0.1); 
                
                document.getElementById('admin_preview_img').src = dataUrl;
                document.getElementById('header_admin_photo').src = dataUrl;
                console.log("Photo compressed to roughly 5kb or less.");
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 3. Update Database (POST to Server)
async function updateAdminProfile() {
    const adminData = {
        admin_userid: document.getElementById('admin_userid').value,
        admin_name: document.getElementById('admin_name').value,
        admin_mobile: document.getElementById('admin_mobile').value,
        admin_pass: document.getElementById('admin_pass').value
        // photo: document.getElementById('admin_preview_img').src // Add this if you add photo to DB schema
    };

    try {
        const res = await fetch('/api/update-admin-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });

        const result = await res.json();
        if (result.success) {
            alert("✅ Admin Record Updated in MongoDB!");
            closeAdminModal();
        } else {
            alert("❌ Update failed!");
        }
    } catch (err) {
        console.error("Server Error:", err);
        alert("Server error, check console.");
    }
}

// Ensure header photo loads on page start
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch to show photo in header
    fetch('/api/get-admin-profile')
        .then(r => r.json())
        .then(admin => {
            if(admin.admin_name) {
                // Agar aap photo SystemConfig se bhej rahe hain toh yahan update karein
                console.log("Admin loaded:", admin.admin_name);
            }
        });
});
// ================= CLASS LIST drop ke liye student dasbord pe  =================
async function loadClassList(){
  const res = await fetch(API + '/api/get-all-class-configs');
  const data = await res.json();
  window.classList = Object.keys(data);
}

// ================= RESULT =================
function calculateDivision(obt,total){
  if(!obt||!total) return '-';
  const p=(obt/total)*100;
  if(p>=60) return '1st';
  if(p>=45) return '2nd';
  if(p>=33) return '3rd';
  return 'Fail';
}

// ================= STUDENT DASHBOARD =================
document.getElementById("openStudentDashboardBtn").onclick = () => {
  document.getElementById("studentDashboardModal").style.display="block";
  prepareDashboardFilters();
};

function prepareDashboardFilters(){
  dash_class.innerHTML='<option value="">Select Class</option>';
  classList.forEach(c=>dash_class.innerHTML+=`<option>${c}</option>`);

  dash_year.innerHTML='<option value="">Select Year</option>';
  const cy=new Date().getFullYear();
  for(let y=cy;y>=2018;y--) dash_year.innerHTML+=`<option>${y}</option>`;
}

async function loadDashboardStudents(){
  if(!dash_class.value || !dash_year.value)
    return alert("Class & Year select karo");

  try {
    // ✅ नया API use karein jo batch date leke aata hai
    const res = await fetch(API + '/api/get-students-with-batchdate');
    let students = await res.json();

    // ✅ Class और Batch Start Date के hisaab se filter karo
    students = students.filter(s => {
      // Pehle class match karo
      if (s.student_class !== dash_class.value) return false;
      
      // Batch start date check karo
      if (!s.class_batch_start_date) return false;
      
      // Batch start date ka year check karo
      const batchYear = new Date(s.class_batch_start_date).getFullYear();
      return batchYear == dash_year.value;
    });

    dashTotal.innerText = students.length;
    dashboardBody.innerHTML = "";

    // ✅ Batch date format karo
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    students.forEach(s => {
      dashboardBody.innerHTML += `
<tr>
  <td><img src="${s.photo || ''}" width="40" onerror="handleImgError(this)" onclick="openFeesExcelPopup('${s.student_id}')" style="cursor:pointer; border-radius:4px;"></td>
  <td>${s.student_id}</td>
  <td><input value="${s.student_name||''}"></td>
  <td><input value="${s.pass||''}"></td>
  <td>${s.student_class}</td>
  <td>${formatDate(s.class_batch_start_date)}</td> <!-- ✅ Batch Start Date -->
  <td><input type="date" value="${s.joining_date||''}"></td>
  <td><input value="${s.fees||''}" style="width:70px"></td>
  <td>
   <input type="date" value="${s.exam_date||''}">
   <button onclick="this.previousElementSibling.value=''">❌</button>
  </td>
  <td><input value="${s.total_marks||''}" style="width:60px"></td>
  <td><input value="${s.obtained_marks||''}" style="width:60px"></td>
  <td>${calculateDivision(s.obtained_marks, s.total_marks)}</td>
  <td><button onclick="saveDashStudent('${s.student_id}',this)">💾</button></td>
  <td><button onclick="deleteDashStudent('${s.student_id}')">🗑</button></td>
</tr>`;
    });

  } catch (error) {
    console.error("Error loading students:", error);
    alert("Data load karne mein error aaya!");
  }
}
async function saveDashStudent(id,btn){
  const i=btn.closest('tr').querySelectorAll('input');
  await fetch(API+'/api/update-student-data',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id:id,
      student_name:i[0].value,
      pass:i[1].value,
      joining_date:i[2].value,
      fees:i[3].value,
      exam_date:i[4].value,
      total_marks:i[5].value,
      obtained_marks:i[6].value
    })
  });
  alert("Saved ✅");
}

// ================= DELETE STUDENT=================
async function deleteDashStudent(id){
  if(!confirm("Kya aap is student ko delete karna chahte hain?")) return;
  
  await fetch(API + '/api/delete-student', {
    method: 'POST', // Backend ke naye method se match karein
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: id })
  });

  alert("Student Deleted! 🗑️");
  loadDashboardStudents(); // List refresh karne ke liye
}

// ================= FEES =================
let currentFeesStudent=null;

function prepareFeesFilters(){
  // YEAR
  fees_year.innerHTML = '<option value="">Select Year</option>';
  const currentYear = new Date().getFullYear();
  for(let y=currentYear; y>=2018; y--){
    fees_year.innerHTML += `<option value="${y}">${y}</option>`;
  }

  // MONTH
  fees_month.innerHTML = '<option value="">Select Month</option>';
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  months.forEach((m,i)=>{
    fees_month.innerHTML += `<option value="${i+1}">${m}</option>`;
  });
}


async function openFeesExcelPopup(id){
  currentFeesStudent=id;
  feesExcelModal.style.display="block";

  const students=await (await fetch(API+'/api/get-students')).json();
  const s=students.find(x=>x.student_id===id);

  feesStudentInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${s.photo || ''}" width="70" height="70" 
                 style="border-radius:50%; cursor:pointer; object-fit: cover; border: 2px solid #ddd;" 
                 onerror="handleImgError(this)" 
                 onclick="openStudentEditPopup('${id}')">
            <div>
                <b style="font-size: 1.2em; color: #2c3e50;">${s.student_name}</b> (ID: ${s.student_id})<br>
                <span>📞 Student: ${s.mobile || 'N/A'}</span><br>
                <span style="color: #555;">👨‍👩‍👦 Parent: <b>${s.parent_name || 'N/A'}</b></span><br>
                <span>📱 Parent Mob: ${s.parent_mobile || 'N/A'}</span>
            </div>
        </div>
    `;

    prepareFeesFilters();
    loadFeesExcel();
}

// ================= FEES EXCEL =================
async function loadFeesExcel(){
    const students = await (await fetch(API + '/api/get-students')).json();
    const s = students.find(x => x.student_id === currentFeesStudent);

    feesExcelBody.innerHTML = "";
    let totalPaid = 0, totalDue = 0;

    const join = new Date(s.joining_date);
    const now = new Date();

    let y = join.getFullYear(), m = join.getMonth();

    while(new Date(y, m) <= now){
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const row = s.fees_data?.[key] || {};
        const fees = Number(row.fees ?? s.fees ?? 0);
        const paid = Number(row.paid ?? 0);
        const due = fees - paid;

        totalPaid += paid;
        totalDue += due;

        // Color Logic: Paid hai to Green Badge, Due hai to Red Badge
        const statusClass = paid >= fees ? 'status-paid' : 'status-due';
        const statusText = paid >= fees ? 'Paid' : 'Due';
        const dueColor = due > 0 ? '#e74c3c' : '#27ae60';

        feesExcelBody.innerHTML += `
            <tr data-key="${key}">
                <td>${new Date(y, m).toLocaleString('default', {month: 'long'})} ${y}</td>
                <td><input type="number" value="${fees}" style="width:80px"></td>
                <td><input type="number" value="${paid}" style="width:80px"></td>
                <td><b style="color: ${dueColor}">${due}</b></td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button onclick="saveFeesRow(this)" style="padding: 5px 10px;">
                        💾 Save
                    </button>
                </td>
            </tr>`;

        m++; if(m > 11){ m = 0; y++; }
    }

    document.getElementById("totalPaid").innerText = totalPaid;
    document.getElementById("totalDue").innerText = totalDue;
}

// ================= IMAGE COMPRESS =================
function compressImage(file,cb){
  const img=new Image();
  const r=new FileReader();
  r.onload=e=>img.src=e.target.result;
  img.onload=()=>{
    const c=document.createElement('canvas');
    c.width=c.height=150;
    c.getContext('2d').drawImage(img,0,0,150,150);
    cb(c.toDataURL('image/jpeg',0.3));
  };
  r.readAsDataURL(file);
}
// ================= MODAL CLOSE FIX =================
document.querySelectorAll('.close').forEach(btn=>{
  btn.onclick = () => {
    const modal = btn.closest('.modal');
    if(modal) modal.style.display = "none";
  };
});

// background click se bhi close
window.onclick = (e) => {
  document.querySelectorAll('.modal').forEach(m=>{
    if(e.target === m){
      m.style.display = "none";
    }
  });
};
////=============================================
    // Paid update
  async function updateStudentPaidFees(key, paid){
  await fetch(API + '/api/update-student-fees',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id: currentFeesStudent,
      month: key,
      field:'paid',
      value: paid
    })
  });

  alert("Fees Updated ✅");
  loadFeesExcel();
}

////=====================================================================
async function sendUpdate(data) {
    const res = await fetch(API + '/api/update-student-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) {
        alert("Profile Updated!");
        location.reload();
    }
}
//////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// 1. Loaded Class ko delete karne ka function
async function deleteLoadedClass() {
    const className = dash_class.value;
    if (!className) return alert("Pehle class select karein!");

    if (confirm(`Kya aap nishchit hain ki aap Class ${className} ke SARE students ko delete karna chahte hain?`)) {
        try {
            const res = await fetch(`${API}/api/delete-class/${className}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                loadDashboardStudents(); // List refresh karne ke liye
            }
        } catch (e) {
            alert("Delete karne mein error aaya.");
        }
    }
}

// 2. Fees Row ko save karne ka function
async function saveFeesRow(btn) {
    const row = btn.closest('tr');
    const key = row.dataset.key; // Example: "2024-05"
    const inputs = row.querySelectorAll('input');
    const feesVal = inputs[0].value;
    const paidVal = inputs[1].value;

    // Fees amount update
    await fetch(API + '/api/update-student-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: currentFeesStudent, month: key, field: 'fees', value: feesVal })
    });

    // Paid amount update
    await fetch(API + '/api/update-student-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: currentFeesStudent, month: key, field: 'paid', value: paidVal })
    });

    alert("Fees Data Saved ✅");
    loadFeesExcel(); // Re-calculate totals
}

// 3. Student Profile Edit karne ka function
async function openStudentEditPopup(id) {
    const students = await (await fetch(API + '/api/get-students')).json();
    const s = students.find(x => x.student_id === id);

    if(!s) return alert("Student nahi mila");

    document.getElementById("edit_id").value = s.student_id;
    document.getElementById("edit_name").value = s.student_name || "";
    document.getElementById("edit_class").value = s.student_class || "";
    document.getElementById("edit_parent").value = s.parent_name || "";
    document.getElementById("edit_mobile").value = s.mobile || "";
    document.getElementById("edit_parent_mobile").value = s.parent_mobile || "";
    document.getElementById("edit_photo_preview").src = s.photo || "";

    document.getElementById("studentEditModal").style.display = "block";
}

// 4. Student Data Update (Submit) function
async function updateStudentProfile() {
    const data = {
        student_id: document.getElementById("edit_id").value,
        student_name: document.getElementById("edit_name").value,
        student_class: document.getElementById("edit_class").value,
        parent_name: document.getElementById("edit_parent").value,
        mobile: document.getElementById("edit_mobile").value,
        parent_mobile: document.getElementById("edit_parent_mobile").value
    };

    const file = document.getElementById("edit_photo_file").files[0];
    
    const sendData = async (finalData) => {
        const res = await fetch(API + '/api/update-student-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });
        if (res.ok) {
            alert("Student Profile Updated! ✅");
            document.getElementById("studentEditModal").style.display = "none";
            loadDashboardStudents(); 
        }
    };

    if (file) {
        compressImage(file, (base64) => {
            data.photo = base64;
            sendData(data);
        });
    } else {
        sendData(data);
    }
}
////==========================================================================================
function downloadStudentExcel() {
    const rows = document.querySelectorAll("#dashboardBody tr");
    if (rows.length === 0) return alert("Pehle data load karein!");

    let csv = "ID,Name,Pass,Class,Batch Start Date,Joining Date,Fees,Exam Date,Total,Obtained,Division\n";
    
    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        const inputs = row.querySelectorAll("input");
        
        // Data extract kar rahe hain
        const id = cols[1].innerText;
        const name = inputs[0].value;
        const pass = inputs[1].value;
        const cls = cols[4].innerText;
      const batchStart = cols[5].innerText; 
        const doj = inputs[2].value;
        const fees = inputs[3].value;
        const exam = inputs[4].value;
        const total = inputs[5].value;
        const obt = inputs[6].value;
        const div = cols[10].innerText;

        csv += `${id},${name},${pass},${cls},${doj},${fees},${exam},${total},${obt},${div}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Students_${dash_class.value}_${dash_year.value}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function downloadFeesExcel() {
    const rows = document.querySelectorAll("#feesExcelBody tr");
    if (rows.length === 0) return alert("Pehle data load karein!");

    let csv = "Month,Monthly Fees,Paid,Due,Status\n";
    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        const inputs = row.querySelectorAll("input");
        csv += `${cols[0].innerText},${inputs[0].value},${inputs[1].value},${cols[3].innerText},${cols[4].innerText}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fees_Report.csv`;
    a.click();
}
// adminscript.js ke bilkul niche ye copy-paste karein
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

function handleImgError(img) {
    img.onerror = null; 
    img.src = DEFAULT_AVATAR;
}
//////////=============================================class result dasbord ==============================

// Modal Open aur Filters taiyar karna
function openClassExamModal() {
    document.getElementById("classExamModal").style.display = "block";
    const clsSelect = document.getElementById("exam_dash_class");
    const yrSelect = document.getElementById("exam_dash_year");

    clsSelect.innerHTML = '<option value="">Select Class</option>';
    window.classList.forEach(c => clsSelect.innerHTML += `<option>${c}</option>`);

    yrSelect.innerHTML = '<option value="">Select Year</option>';
    const cy = new Date().getFullYear();
    for (let y = cy; y >= 2018; y--) yrSelect.innerHTML += `<option>${y}</option>`;
}

// Students Load karna
async function loadExamStudents() {
    const cls = document.getElementById("exam_dash_class").value;
    const yr = document.getElementById("exam_dash_year").value;
    
    if (!cls || !yr) return;

    try {
        // ✅ नया API use karo
        const res = await fetch(API + '/api/get-students-with-batchdate');
        let students = await res.json();

        // ✅ Class और Batch Date से filter karo
        students = students.filter(s => {
            if (s.student_class !== cls) return false;
            if (!s.class_batch_start_date) return false;
            
            const batchYear = new Date(s.class_batch_start_date).getFullYear();
            return batchYear == yr;
        });

        const body = document.getElementById("examDashboardBody");
        body.innerHTML = "";

        students.forEach(s => {
            body.innerHTML += `
            <tr data-id="${s.student_id}">
                <td><img src="${s.photo || ''}" width="40" onerror="handleImgError(this)" style="border-radius:4px;"></td>
                <td><b>${s.student_name}</b><br><small>${s.student_id}</small></td>
                <td>${formatDate(s.class_batch_start_date)}</td> <!-- ✅ Batch Date add -->
                <td><input type="date" class="row-date" value="${s.exam_date || ''}"></td>
                <td><input type="text" class="row-subject" value="${s.exam_subject || ''}" placeholder="Subject"></td>
                <td><input type="number" class="row-total" value="${s.total_marks || ''}" style="width:60px"></td>
                <td><input type="number" class="row-obt" value="${s.obtained_marks || ''}" style="width:60px" oninput="updateRowDiv(this)"></td>
                <td class="row-div">${calculateDivision(s.obtained_marks, s.total_marks)}</td>
            </tr>`;
        });
    } catch (error) {
        console.error("Data load karne mein error:", error);
    }
}
// Bulk Apply Button Logic
function applyBulkSettings() {
    const sub = document.getElementById("bulk_subject").value;
    const total = document.getElementById("bulk_total_marks").value;
    const date = document.getElementById("bulk_exam_date").value;

    document.querySelectorAll("#examDashboardBody tr").forEach(row => {
        if (sub) row.querySelector(".row-subject").value = sub;
        if (total) row.querySelector(".row-total").value = total;
        if (date) row.querySelector(".row-date").value = date;
    });
}

// Division auto update on typing marks
function updateRowDiv(input) {
    const row = input.closest('tr');
    const obt = input.value;
    const total = row.querySelector(".row-total").value;
    row.querySelector(".row-div").innerText = calculateDivision(obt, total);
}

// PUBLIC RESULT: Sabka data update karna
// PUBLIC RESULT: Sabka data update karna (Fast Method)
async function saveAllResults() {
    if(!confirm("Kya aap sabhi students ka result update karna chahte hain?")) return;
    
    const rows = document.querySelectorAll("#examDashboardBody tr");
    const updatePromises = []; // Sari requests yahan store hongi

    rows.forEach(row => {
        const data = {
            student_id: row.dataset.id,
            exam_date: row.querySelector(".row-date").value,
            total_marks: row.querySelector(".row-total").value,
            obtained_marks: row.querySelector(".row-obt").value,
            exam_subject: row.querySelector(".row-subject").value
        };
        
        // Request ko queue mein daal rahe hain
        const p = fetch(API + '/api/update-student-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        updatePromises.push(p);
    });

    try {
        await Promise.all(updatePromises); // Sabko ek saath save karega
        alert("Result Published Successfully! ✅");
        loadExamStudents(); // Table refresh
    } catch (e) {
        alert("Kuch error aaya, kripya check karein.");
    }
}

// CANCEL EXAM: Sabka data clear karna (Subject bhi clear karega)
async function cancelAllExams() {
    if(!confirm("CAUTION: Kya aap puri class ka exam data delete karna chahte hain?")) return;

    const rows = document.querySelectorAll("#examDashboardBody tr");
    const clearPromises = [];

    rows.forEach(row => {
        const data = {
            student_id: row.dataset.id,
            exam_date: "",
            total_marks: "",
            obtained_marks: "",
            exam_subject: "" // Subject ko bhi khali karega
        };
        const p = fetch(API + '/api/update-student-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        clearPromises.push(p);
    });

    await Promise.all(clearPromises);
    alert("Exam data clear kar diya gaya! 🗑️");
    loadExamStudents();
}
// --- MODAL CONTROLS ---
function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- SYSTEM CONFIG LOGIC ---
// 1. DATA LOAD: Modal khulne par DB se data laana
async function openSystemConfig() {
    document.getElementById('systemConfigModal').style.display = 'block';
    const res = await fetch('/api/get-settings');
    const data = await res.json();
    if (data) {
        document.getElementById('cfg_title').value = data.title || "";
        document.getElementById('cfg_subtitle').value = data.sub_title || "";
        document.getElementById('cfg_contact').value = data.contact || "";
        document.getElementById('cfg_call_no').value = data.call_no || "";
        document.getElementById('cfg_gmail').value = data.gmail || "";
        document.getElementById('cfg_facebook').value = data.facebook || "";
        document.getElementById('cfg_youtube').value = data.youtube_link || "";
        document.getElementById('cfg_insta').value = data.instagram || "";
    }
}

// 2. DATA UPDATE: Naya data save karna

async function saveSystemConfig() {
    // 1. Button ko sahi se pakadne ka tareika
    const btn = document.querySelector("#systemConfigModal button[onclick='saveSystemConfig()']");
    
    if(btn) {
        btn.innerText = "Updating...";
        btn.disabled = true;
    }

    const config = {
        title: document.getElementById('cfg_title').value,
        sub_title: document.getElementById('cfg_subtitle').value,
        contact: document.getElementById('cfg_contact').value,
        call_no: document.getElementById('cfg_call_no').value,
        gmail: document.getElementById('cfg_gmail').value,
        facebook: document.getElementById('cfg_facebook').value,
        youtube_link: document.getElementById('cfg_youtube').value,
        instagram: document.getElementById('cfg_insta').value
    };

    try {
        const res = await fetch(API + '/api/update-settings', { // Yahan 'API' variable use karein jo aapne upar define kiya hai
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        const result = await res.json();
        
        if(result.success) {
            alert("✅ Settings Database mein save ho gayi hain!");
            location.reload();
        } else {
            alert("❌ Error: " + (result.error || "Unknown Error"));
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("❌ Server connection fail ho gaya.");
    } finally {
        if(btn) {
            btn.innerText = "💾 Update Settings";
            btn.disabled = false;
        }
    }
}
// 3. SLIDER LOGIC: Crop (200x200) and Compress (5KB)
let tempSliderBase64 = "";

function previewAndCropSlider(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById('cropCanvas');
                const ctx = canvas.getContext('2d');
                // Center Crop to 200x200
                const size = Math.min(img.width, img.height);
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
                
                // Compression logic to stay near 5KB (Quality 0.1 - 0.2)
                tempSliderBase64 = canvas.toDataURL('image/jpeg', 0.2); 
                document.getElementById('slider_crop_preview').src = tempSliderBase64;
                document.getElementById('sliderPreviewContainer').style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function uploadSlider() {
    if(!tempSliderBase64) return;
    const res = await fetch('/api/add-slider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: tempSliderBase64 })
    });
    const data = await res.json();
    if(data.success) {
        alert("Photo Added!");
        loadSliders(); 
        document.getElementById('sliderPreviewContainer').style.display = 'none';
    }
}

// 4. LOAD & DELETE SLIDERS
async function openSliderManager() {
    document.getElementById('sliderModal').style.display = 'block';
    loadSliders();
}

async function loadSliders() {
    const res = await fetch('/api/get-sliders');
    const sliders = await res.json();
    const container = document.getElementById('existingSliders');
    container.innerHTML = sliders.map(s => `
        <div style="position:relative; width:100px; height:100px; border-radius:8px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.2);">
            <img src="${s.photo}" style="width:100%; height:100%; object-fit:cover;">
            <button onclick="deleteSlider('${s._id}')" style="position:absolute; top:2px; right:2px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

async function deleteSlider(id) {
    if(!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/delete-slider/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if(data.success) loadSliders();
}


// 🔔 Pending Students Load + Approve / Reject Buttons included
async function loadPendingRegistrations() {
    const res = await fetch('/api/get-students');
    const students = await res.json();

    const box = document.getElementById('pendingList');
    box.innerHTML = '';

    const pending = students.filter(s => s.fees === "" || s.fees === null || s.fees === 0 || s.fees === "0");

    if (pending.length === 0) {
        box.innerHTML = "<p>✅ Koi pending registration nahi hai</p>";
        return;
    }

    pending.forEach(s => {
        box.innerHTML += `
        <div class="pending-card">
            <img src="${s.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}">

            <div style="flex:1">
                <label>Student Name</label>
                <input id="student_name_${s.student_id}" value="${s.student_name || ''}">

                <label>Student ID</label>
                <input value="${s.student_id}" disabled>

                <label>Password</label>
                <input id="pass_${s.student_id}" value="${s.pass || ''}">

                <label>Class</label>
                <input id="class_${s.student_id}" value="${s.student_class || ''}">

                <label>Parent Name</label>
                <input id="parent_name_${s.student_id}" value="${s.parent_name || ''}">

                <label>Student Mobile No.</label>
                <input id="mobile_${s.student_id}" value="${s.mobile || ''}">

                <label>Parent Mobile No.</label>
                <input id="parent_mobile_${s.student_id}" value="${s.parent_mobile || ''}">

                <label>Date of Joining</label>
                <input type="date" id="doj_${s.student_id}" value="${s.joining_date || ''}">
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
                <label>Monthly Fees</label>
                <input placeholder="Fees" id="fees_${s.student_id}">

                <button onclick="approveStudent('${s.student_id}')"
                    style="background:#2ecc71;color:white;padding:6px;border:none;">
                    ✔ Approve
                </button>

                <button onclick="rejectStudent('${s.student_id}')"
                    style="background:#e74c3c;color:white;padding:6px;border:none;">
                    ❌ Reject
                </button>
            </div>
        </div>`;
    });
}

// ✅ APPROVE
async function approveStudent(id) {
    const fees = document.getElementById(`fees_${id}`).value;
    if (!fees) {
        alert("Fees daalna zaroori hai");
        return;
    }

    const body = {
        student_id: id,
        student_name: document.getElementById(`student_name_${id}`).value,
        pass: document.getElementById(`pass_${id}`).value,
        student_class: document.getElementById(`class_${id}`).value,
        parent_name: document.getElementById(`parent_name_${id}`).value,
        mobile: document.getElementById(`mobile_${id}`).value,
        parent_mobile: document.getElementById(`parent_mobile_${id}`).value,
        joining_date: document.getElementById(`doj_${id}`).value,
        fees: fees
    };

    await fetch('/api/update-student-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    alert("✅ Student Approved & Data Saved");
    loadPendingRegistrations();
}

// ❌ REJECT (DB se delete)
async function rejectStudent(id) {
    if (!confirm("⚠️ Kya aap is student ko reject karna chahte ho? Data permanently delete ho jayega.")) return;

    await fetch('/api/delete-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id })
    });

    alert("❌ Student Rejected & Data Deleted");
    loadPendingRegistrations();
}

let selectedClass = "";

let classData = { subjects:{} };
const saved = localStorage.getItem("classData");
if(saved){
  classData = JSON.parse(saved);
}

let feeMap = {};
let ALL_SUBJECTS = [];

const classCards = document.getElementById("classCards");

/* ================= LOAD DATA ================= */

fetch('/api/get-class-fees')
.then(r=>r.json())
.then(d=> d.forEach(x=> feeMap[x.class_name]=x.monthly_fees));

let classDB = {};
fetch('/api/get-all-class-configs')
.then(r=>r.json())
.then(d=>{ classDB=d; loadClasses(); });

fetch('/api/get-all-classes')
.then(r=>r.json())
.then(CLASSES=>{
  window.ALL_CLASSES = CLASSES;
  loadClasses();
});

fetch('/api/get-all-subjects')
.then(r=>r.json())
.then(subs=> ALL_SUBJECTS = subs);

/* ================= CLASS CARDS ================= */

function loadClasses(){
  if(!window.ALL_CLASSES) return;
  classCards.innerHTML="";

  ALL_CLASSES.forEach(cls=>{
    const banner = classDB[cls]?.banner || "";
    classCards.innerHTML += `
      <div class="card">
        ${banner ? `<img src="${banner}">` : ""}
        <b>${cls}</b>

        <input value="${feeMap[cls]||""}"
          placeholder="Fees"
          onblur="saveFees('${cls}',this.value)">

        <button onclick="openModal('${cls}')">Manage</button>
      </div>`;
  });
}

function saveFees(cls,val){
  fetch('/api/update-class-fees',{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({class_name:cls,monthly_fees:val})
  });
}

/* ================= MODAL ================= */

function openModal(cls){
  selectedClass = cls;
  currentClass = cls; // ⭐ IMPORTANT (missing tha)

  classData = classDB[cls] || {};
  if(!classData.subjects) classData.subjects = {};

  document.getElementById("modalTitle").innerText = cls;
  document.getElementById("introVideo").value = classData.intro_video || "";
  document.getElementById("feesInput").value = feeMap[cls] || "";
 document.getElementById("batchStartDate").value = 
    classData.batch_start_date ? 
    new Date(classData.batch_start_date).toISOString().split('T')[0] : "";
  // 🔥 BANNER PREVIEW
  bannerBase64 = classData.banner || "";
  const preview = document.getElementById("bannerPreview");
  if (bannerBase64) {
    preview.src = bannerBase64;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }

  document.getElementById("subjectList").innerHTML = "";
  ALL_SUBJECTS.forEach(sub => drawSubject(sub));

  document.getElementById("modal").style.display="block";
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

/* ================= SUBJECT UI ================= */

function drawSubject(sub){
  const sid = safeId(sub);
  const checked = !!classData.subjects[sub];

  const div = document.createElement("div");
  div.innerHTML = `
    <label>
      <input type="checkbox" ${checked?"checked":""}
        onchange="toggleSubject('${sub}',this.checked)">
      ${sub}
    </label>
    <div id="box-${sid}"></div>
  `;

  document.getElementById("subjectList").appendChild(div);

  if(checked) renderSubjectBox(sub);
}

function toggleSubject(sub,on){
  if(on){
    if(!classData.subjects[sub])
      classData.subjects[sub]={notes:[],videos:[]};
    renderSubjectBox(sub);
  }else{
    delete classData.subjects[sub];
    document.getElementById(`box-${safeId(sub)}`).innerHTML="";
  }
}

function renderSubjectBox(sub){
  const sid = safeId(sub);
  const box = document.getElementById(`box-${sid}`);

  const notes = classData.subjects[sub]?.notes || [];
  const videos = classData.subjects[sub]?.videos || [];

  box.innerHTML = `
    <div class="subject-box">
      <b>${sub}</b>

      <div id="n-${sid}">
        ${notes.map((n,i)=>`
          <div style="margin:5px 0">
            📄 Note ${i+1}
            <a href="${n}" target="_blank">View</a>
            <button onclick="removeNote('${sub}',${i})">❌</button>
          </div>
        `).join("")}
      </div>
      <button onclick="addNote('${sub}')">➕ Add Note</button>

      <hr>

      <div id="v-${sid}">
        ${videos.map((v,i)=>`
          <div style="margin:5px 0">
            ▶️ <a href="${v}" target="_blank">${v}</a>
            <button onclick="removeVideo('${sub}',${i})">❌</button>
          </div>
        `).join("")}
      </div>
      <button onclick="addVideo('${sub}')">➕ Add Video</button>
    </div>
  `;
}
function removeNote(sub,index){
  classData.subjects[sub].notes.splice(index,1);
  renderSubjectBox(sub);
}

function removeVideo(sub,index){
  classData.subjects[sub].videos.splice(index,1);
  renderSubjectBox(sub);
}

/* ================= HELPERS ================= */

function safeId(str){
  return str.replace(/\s+/g,'_').toLowerCase();
}

function addNote(sub){
  const sid = safeId(sub);
  const i=document.createElement("input");
  i.type="file";
  i.onchange=e=>{
    const r=new FileReader();
    r.onload=()=>classData.subjects[sub].notes.push(r.result);
    renderSubjectBox(sub);
    r.readAsDataURL(e.target.files[0]);
  };
  document.getElementById(`n-${sid}`).appendChild(i);
}

function addVideo(sub){
  const sid = safeId(sub);
  const i = document.createElement("input");
  i.placeholder = "YouTube link";
  i.style.display = "block";
  i.style.margin = "5px 0";

  i.onchange = () => {
    if(i.value){
      classData.subjects[sub].videos.push(i.value);
      renderSubjectBox(sub);
    }
  };

  document.getElementById(`v-${sid}`).appendChild(i);
}

/* ================= SAVE ================= */

// Class Management Modal में saveAll() function update करें
function saveAll() {
  const data = {
    class_name: currentClass,
    banner: bannerBase64,
    intro_video: document.getElementById("introVideo").value,
    fees: document.getElementById("feesInput").value,
    batch_start_date: document.getElementById("batchStartDate").value,
    subjects: classData.subjects
  };

  fetch('/api/save-class-config', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(r => r.json())
  .then(() => {
    alert("Class saved successfully ✅");
    // ✅ Agar naya batch date set kiya hai toh existing students ka batch date update karo
    updateStudentsBatchDate(currentClass, data.batch_start_date);
  });
}

// ✅ Existing students ka batch date update karne ka function
async function updateStudentsBatchDate(className, newBatchDate) {
  try {
    const response = await fetch('/api/update-class-batch-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_name: className,
        batch_start_date: newBatchDate
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log(`✅ Batch date updated for class ${className}`);
    }
  } catch (error) {
    console.error("Batch date update error:", error);
  }
}
function handleBannerUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 180;

      canvas.getContext("2d").drawImage(img, 0, 0, 400, 180);

      bannerBase64 = canvas.toDataURL("image/jpeg", 0.3);

      const preview = document.getElementById("bannerPreview");
      preview.src = bannerBase64;
      preview.style.display = "block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

////////////////////////////////////////////////////////////HGHGHHHHHHHHHKFTKTKYKKHJLKJ//////////////////////////////

// ================= SMS REMINDER =================
function openSMSReminderModal() {
    document.getElementById("smsReminderModal").style.display = "block";
    loadSMSReminderData();
}

function closeSMSReminder() {
    document.getElementById("smsReminderModal").style.display = "none";
}

async function loadSMSReminderData() {
    const students = await (await fetch(API + "/api/get-students")).json();
    
    // ✅ Store all students globally
    allSMSStudents = students;
    
    // ✅ Class filter dropdown load
    const filterSelect = document.getElementById("sms_class_filter");
    filterSelect.innerHTML = '<option value="all">📚 All Classes</option>';
    
    // Unique classes nikalein
    const uniqueClasses = [...new Set(students.map(s => s.student_class).filter(c => c))];
    uniqueClasses.sort().forEach(cls => {
        filterSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
    });
    
    // ✅ Apply filter
    filterSMSByClass();
}

// ✅ Filter function
function filterSMSByClass() {
    const selectedClass = document.getElementById("sms_class_filter").value;
    const body = document.getElementById("smsReminderBody");
    
    let filteredStudents = allSMSStudents;
    if (selectedClass !== "all") {
        filteredStudents = allSMSStudents.filter(s => s.student_class === selectedClass);
    }
    
    renderSMSBody(filteredStudents, body);
}

// ✅ Render function (Hindi SMS)
function renderSMSBody(students, bodyElement) {
    bodyElement.innerHTML = "";
    const today = new Date();

    if (students.length === 0) {
        bodyElement.innerHTML = `
        <tr>
            <td colspan="10" style="text-align:center; padding:20px; color:#666;">
                📭 Selected class mein koi pending fees nahi hai
            </td>
        </tr>`;
        return;
    }

    students.forEach(s => {
        let dueList = [];
        let total = 0;

        let d = new Date(s.joining_date);
        let y = d.getFullYear(), m = d.getMonth();

        while (new Date(y, m) <= today) {
            const key = `${y}-${String(m + 1).padStart(2, '0')}`;
            const fee = Number(s.fees_data?.[key]?.fees ?? s.fees);
            const paid = Number(s.fees_data?.[key]?.paid ?? 0);

            if (paid < fee) {
                let due = fee - paid;
                total += due;
                let label = new Date(y, m).toLocaleString('en-IN', { month: 'short', year: '2-digit' }).toUpperCase();
                dueList.push(`${label} : ₹${due}`);
            }
            m++; if (m > 11) { m = 0; y++; }
        }

        if (dueList.length === 0) return;

        // ✅ HINDI MESSAGE TEXT
        const msg = `प्रिय अभिभावक/छात्र,

आपके निम्नलिखित फीस राशि लंबित है:
छात्र आईडी : ${s.student_id} | पासवर्ड : ${s.pass || 'N/A'}
${dueList.join('\n')}

कुल लंबित राशि : ₹${total}

कृपया लंबित फीस शीघ्र अदा करें।

संपर्क: 9971095964
वेबसाइट: https://balbharticoachingcenter.onrender.com

धन्यवाद,
बाल भारती कोचिंग सेंटर`;

        bodyElement.innerHTML += `
<tr>
<td><img src="${s.photo||'user.png'}" width="40"></td>
<td>${s.student_id}</td>
<td>${s.student_name}</td>
<td>${s.student_class}</td>
<td>${dueList.join("<br>")}</td>
<td><b>₹${total}</b></td>
<td>${s.parent_mobile}</td>
<td>${s.mobile}</td>
<td>
<textarea class="msgBox" data-parent="${s.parent_mobile}" data-student="${s.mobile}"
style="width:260px;height:160px">${msg}</textarea>
</td>
<td>
<b>Student</b><br>
📩 <span onclick="sendSMS('${s.mobile}',this)">SMS</span>
🟢 <span onclick="sendWA('${s.mobile}',this)">WA</span>
<hr>
<b>Parent</b><br>
📩 <span onclick="sendSMS('${s.parent_mobile}',this)">SMS</span>
🟢 <span onclick="sendWA('${s.parent_mobile}',this)">WA</span>
<span class="apiBtn"
 onclick="sendSMSviaAPI(this)"
 data-student="${s.mobile}"
 data-parent="${s.parent_mobile}">
📡 API SMS
</span>
</td>
</tr>`;
    });
}

function getMsg(el) {
    return el.closest("tr").querySelector(".msgBox").value;
}

function sendSMS(num, el) {
    window.open(`sms:${num}?body=${encodeURIComponent(getMsg(el))}`);
}

function sendWA(num, el) {
    window.open(`https://wa.me/91${num}?text=${encodeURIComponent(getMsg(el))}`);
}

function sendToAllParents() {
    document.querySelectorAll(".msgBox").forEach(t => {
        window.open(`sms:${t.dataset.parent}?body=${encodeURIComponent(t.value)}`);
    });
}

function sendToAllStudents() {
    document.querySelectorAll(".msgBox").forEach(t => {
        window.open(`sms:${t.dataset.student}?body=${encodeURIComponent(t.value)}`);
    });
}

function printReminder() {
    let w = window.open("");
    w.document.write(document.getElementById("reminderTable").outerHTML);
    w.print();
}




/////////////////////////////////////////////
// ================= CSV DOWNLOAD FUNCTIONS WITH VALIDATION =================

// Helper function to validate Indian mobile number
function isValidMobile(number) {
    if (!number) return false;
    
    const cleaned = number.toString().trim();
    
    // Check for "N/A", empty, or invalid values
    if (cleaned === "N/A" || cleaned === "" || cleaned === "null" || cleaned === "undefined") {
        return false;
    }
    
    // Check if it's a valid 10-digit Indian mobile number
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(cleaned.replace(/\D/g, ''));
}

// 1. PARENT CSV DOWNLOAD - Only valid parent numbers
function downloadParentCSV() {
    const rows = document.querySelectorAll("#smsReminderBody tr");
    if (rows.length === 0) {
        alert("Koi data nahi hai download karne ke liye!");
        return;
    }
    
    let csv = "Parent Mobile,SMS Text\n";
    let count = 0;
    
    rows.forEach(row => {
        const parentMobileCell = row.querySelector("td:nth-child(7)");
        const parentMobile = parentMobileCell ? parentMobileCell.innerText.trim() : "";
        const smsText = row.querySelector(".msgBox")?.value.trim() || "";
        
        // Skip if parent mobile is not valid
        if (!isValidMobile(parentMobile)) {
            console.log(`Skipping parent: ${parentMobile} - Invalid mobile`);
            return; // Continue to next iteration
        }
        
        // CSV format: Escape quotes and newlines
        const escapedText = smsText.replace(/"/g, '""');
        // Replace newlines with space for single line
        const singleLineText = escapedText.replace(/\n/g, ' ');
        
        csv += `"${parentMobile}","${singleLineText}"\n`;
        count++;
    });
    
    if (count === 0) {
        alert("Koi valid parent mobile number nahi hai CSV banane ke liye!");
        return;
    }
    
    downloadCSV(csv, `parent_fees_reminder_${getFormattedDate()}.csv`);
    showDownloadMessage(count, "parents");
}

// 2. STUDENT CSV DOWNLOAD - Only valid student numbers
function downloadStudentCSV() {
    const rows = document.querySelectorAll("#smsReminderBody tr");
    if (rows.length === 0) {
        alert("Koi data nahi hai download karne ke liye!");
        return;
    }
    
    let csv = "Student Mobile,SMS Text\n";
    let count = 0;
    
    rows.forEach(row => {
        const studentMobileCell = row.querySelector("td:nth-child(8)");
        const studentMobile = studentMobileCell ? studentMobileCell.innerText.trim() : "";
        const smsText = row.querySelector(".msgBox")?.value.trim() || "";
        
        // Skip if student mobile is not valid
        if (!isValidMobile(studentMobile)) {
            console.log(`Skipping student: ${studentMobile} - Invalid mobile`);
            return; // Continue to next iteration
        }
        
        // CSV format: Escape quotes and newlines
        const escapedText = smsText.replace(/"/g, '""');
        // Replace newlines with space for single line
        const singleLineText = escapedText.replace(/\n/g, ' ');
        
        csv += `"${studentMobile}","${singleLineText}"\n`;
        count++;
    });
    
    if (count === 0) {
        alert("Koi valid student mobile number nahi hai CSV banane ke liye!");
        return;
    }
    
    downloadCSV(csv, `student_fees_reminder_${getFormattedDate()}.csv`);
    showDownloadMessage(count, "students");
}

// 3. ALL DATA CSV - Includes both with validation
function downloadAllCSV() {
    const rows = document.querySelectorAll("#smsReminderBody tr");
    if (rows.length === 0) {
        alert("Koi data nahi hai!");
        return;
    }
    
    let csv = "Student ID,Student Name,Class,Parent Mobile,Student Mobile,SMS Text,Due Amount,Due Months\n";
    let parentCount = 0;
    let studentCount = 0;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const studentId = cells[1]?.innerText.trim() || "";
        const studentName = cells[2]?.innerText.trim() || "";
        const studentClass = cells[3]?.innerText.trim() || "";
        const parentMobile = cells[6]?.innerText.trim() || "";
        const studentMobile = cells[7]?.innerText.trim() || "";
        const dueMonths = cells[4]?.innerText.trim() || "";
        const dueAmount = cells[5]?.innerText.trim() || "";
        const smsText = row.querySelector(".msgBox")?.value.trim() || "";
        
        // Only include if at least one valid mobile exists
        const hasValidParent = isValidMobile(parentMobile);
        const hasValidStudent = isValidMobile(studentMobile);
        
        if (!hasValidParent && !hasValidStudent) {
            console.log(`Skipping row ${studentId}: No valid mobile numbers`);
            return; // Skip this row
        }
        
        // Count valid numbers
        if (hasValidParent) parentCount++;
        if (hasValidStudent) studentCount++;
        
        // CSV escaping
        const escapedText = smsText.replace(/"/g, '""');
        const singleLineText = escapedText.replace(/\n/g, ' ');
        const escapedDueMonths = dueMonths.replace(/"/g, '""').replace(/\n/g, ', ');
        
        csv += `"${studentId}","${studentName}","${studentClass}","${parentMobile}","${studentMobile}","${singleLineText}","${dueAmount}","${escapedDueMonths}"\n`;
    });
    
    if (parentCount === 0 && studentCount === 0) {
        alert("Koi valid mobile numbers nahi hai CSV banane ke liye!");
        return;
    }
    
    downloadCSV(csv, `all_fees_data_${getFormattedDate()}.csv`);
    showDownloadMessage(parentCount + studentCount, "total entries");
}

// 4. COMMON CSV DOWNLOAD HELPER
function downloadCSV(csvContent, fileName) {
    try {
        // Add BOM for UTF-8 encoding (for Excel compatibility)
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
    } catch (error) {
        console.error("CSV download error:", error);
        alert("CSV download mein error aaya. Kripya console check karein.");
    }
}

// 5. HELPER FUNCTIONS
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}`;
}

function showDownloadMessage(count, type) {
    // You can show a small notification here
    console.log(`✅ ${count} ${type} added to CSV`);
    
    // Optional: Show a toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = `
        <strong>✅ CSV Downloaded!</strong><br>
        ${count} ${type} added to file
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Add CSS for animations (add to your CSS file or style tag)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
