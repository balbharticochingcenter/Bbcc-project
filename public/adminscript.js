// ================= GLOBAL DOM =================
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
  if(localStorage.getItem('isAdminLoggedIn')!=='true'){
    location.href='login.html';
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

// ================= CLASS LIST =================
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

  let students = await (await fetch(API+'/api/get-students')).json();

  students = students.filter(s =>
    s.student_class===dash_class.value &&
    new Date(s.joining_date).getFullYear()==dash_year.value
  );

  dashTotal.innerText = students.length;
  dashboardBody.innerHTML="";

  students.forEach(s=>{
    dashboardBody.innerHTML+=`
<tr>
// Is line ko replace karein:
<td><img src="${s.photo || ''}" width="40" onerror="handleImgError(this)" onclick="openFeesExcelPopup('${s.student_id}')" style="cursor:pointer; border-radius:4px;"></td>
<td>${s.student_id}</td>
<td><input value="${s.student_name||''}"></td>
<td><input value="${s.pass||''}"></td>
<td>${s.student_class}</td>
<td><input type="date" value="${s.joining_date||''}"></td>
<td><input value="${s.fees||''}" style="width:70px"></td>
<td>
 <input type="date" value="${s.exam_date||''}">
 <button onclick="this.previousElementSibling.value=''">❌</button>
</td>
<td><input value="${s.total_marks||''}" style="width:60px"></td>
<td><input value="${s.obtained_marks||''}" style="width:60px"></td>
<td>${calculateDivision(s.obtained_marks,s.total_marks)}</td>
<td><button onclick="saveDashStudent('${s.student_id}',this)">💾</button></td>
<td><button onclick="deleteDashStudent('${s.student_id}')">🗑</button></td>
</tr>`;
  });
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
  const students=await (await fetch(API+'/api/get-students')).json();
  const s=students.find(x=>x.student_id===currentFeesStudent);

  feesExcelBody.innerHTML="";
  let totalPaid=0, totalDue=0;

  const join=new Date(s.joining_date);
  const now=new Date();

  let y=join.getFullYear(), m=join.getMonth();

  while(new Date(y,m)<=now){
    const key=`${y}-${String(m+1).padStart(2,'0')}`;
    const row=s.fees_data?.[key]||{};
    const fees=Number(row.fees ?? s.fees ?? 0);
    const paid=Number(row.paid ?? 0);
    const due=fees-paid;

    totalPaid+=paid;
    totalDue+=due;

    feesExcelBody.innerHTML+=`
<tr data-key="${key}">
<td>${new Date(y,m).toLocaleString('default',{month:'long'})} ${y}</td>
<td><input value="${fees}"></td>
<td><input value="${paid}"></td>
<td>${due}</td>
<td>${paid>=fees?'Paid':'Due'}</td>
<td><button onclick="saveFeesRow(this)">💾</button></td>
</tr>`;

    m++; if(m>11){m=0;y++;}
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
async function saveFeesRow(btn) {
    const row = btn.closest('tr');
    const key = row.dataset.key; // Example: "2024-05"
    const inputs = row.querySelectorAll('input');
    const fees = inputs[0].value;
    const paid = inputs[1].value;

    const res = await fetch(API + '/api/update-student-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_id: currentFeesStudent,
            month: key,
            field: 'fees', // save multiple fields one by one or modify API
            value: fees
        })
    });
    
    // Paid update
    await fetch(API + '/api/update-student-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_id: currentFeesStudent,
            month: key,
            field: 'paid',
            value: paid
        })
    });

    alert("Fees Updated ✅");
    loadFeesExcel();
}
////=====================================================================
async function updateStudentProfile() {
    const data = {
        student_id: document.getElementById("edit_id").value,
        student_name: document.getElementById("edit_name").value,
        student_class: document.getElementById("edit_class").value,
        parent_name: document.getElementById("edit_parent").value,
        mobile: document.getElementById("edit_mobile").value,
        parent_mobile: document.getElementById("edit_parent_mobile").value
    };

    // Photo agar change hui ho toh
    const file = document.getElementById("edit_photo_file").files[0];
    if (file) {
        compressImage(file, async (base64) => {
            data.photo = base64;
            await sendUpdate(data);
        });
    } else {
        await sendUpdate(data);
    }
}

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
async function openStudentEditPopup(id) {
    const students = await (await fetch(API + '/api/get-students')).json();
    const s = students.find(x => x.student_id === id);

    document.getElementById("edit_id").value = s.student_id;
    document.getElementById("edit_name").value = s.student_name;
    document.getElementById("edit_class").value = s.student_class;
    document.getElementById("edit_parent").value = s.parent_name;
    document.getElementById("edit_mobile").value = s.mobile;
    document.getElementById("edit_parent_mobile").value = s.parent_mobile;
    document.getElementById("edit_photo_preview").src = s.photo;

    document.getElementById("studentEditModal").style.display = "block";
}

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

    let csv = "ID,Name,Pass,Class,Joining Date,Fees,Exam Date,Total,Obtained,Division\n";
    
    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        const inputs = row.querySelectorAll("input");
        
        // Data extract kar rahe hain
        const id = cols[1].innerText;
        const name = inputs[0].value;
        const pass = inputs[1].value;
        const cls = cols[4].innerText;
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
