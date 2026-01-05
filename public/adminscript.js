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
<td><img src="${s.photo}" width="40" onclick="openFeesExcelPopup('${s.student_id}')"></td>
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

// ================= DELETE STUDENT (MISSING) =================
async function deleteDashStudent(id){
  if(!confirm("Delete student?")) return;
  await fetch(API+'/api/delete-student',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ student_id:id })
  });
  loadDashboardStudents();
}

// ================= FEES =================
let currentFeesStudent=null;

function prepareFeesFilters(){ /* future safe */ }

async function openFeesExcelPopup(id){
  currentFeesStudent=id;
  feesExcelModal.style.display="block";

  const students=await (await fetch(API+'/api/get-students')).json();
  const s=students.find(x=>x.student_id===id);

  feesStudentInfo.innerHTML=`
<img src="${s.photo}" width="60" style="border-radius:50%"
 onclick="openStudentEditPopup('${id}')">
<b>${s.student_name}</b> 📞${s.mobile}
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
