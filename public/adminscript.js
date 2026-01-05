// ================= SECURITY =================
// Admin login check (frontend level)
(function checkAuth(){
  if(localStorage.getItem('isAdminLoggedIn')!=='true'){
    location.href='login.html';
  }
})();

// Admin logout
function logoutAdmin(){
  if(confirm("Logout?")){
    localStorage.removeItem('isAdminLoggedIn');
    location.href='login.html';
  }
}

// ================= GLOBAL API FIX =================
// Absolute API path (origin issue fix)
const API = location.origin;

// ================= INIT =================
// Dashboard init (page load)
async function initDashboard(){
  await loadClassList();          // load class configs
  await loadSystemSettings();     // 🔥 logo / title / footer load
  
  // 🔥 Student Dashboard button show
  const btn=document.getElementById("openStudentDashboardBtn");
  if(btn) btn.style.display="flex";
}

// ================= SYSTEM SETTINGS =================
// Logo, title, subtitle, footer load
async function loadSystemSettings(){
  try{
    const res = await fetch(API + '/api/get-settings');
    const s = await res.json();

    if(s.logo) document.getElementById("db-logo").src=s.logo;
    if(s.title) document.getElementById("db-title").innerText=s.title;
    if(s.sub_title) document.getElementById("db-subtitle").innerText=s.sub_title;

    if(s.facebook) document.getElementById("foot-facebook").href=s.facebook;
    if(s.gmail) document.getElementById("foot-gmail").href="mailto:"+s.gmail;
    if(s.call_no) document.getElementById("foot-call").href="tel:"+s.call_no;
    if(s.help) document.getElementById("foot-help").innerText=s.help;

  }catch(err){
    console.error("Settings load error",err);
  }
}

// ================= CLASS LIST =================
// Load all class configs
async function loadClassList(){
  const res = await fetch(API + '/api/get-all-class-configs');
  const data = await res.json();
  window.classList = Object.keys(data); // global use
}

// ================= RESULT UTILITY =================
// Division calculator
function calculateDivision(obt, total){
  if(!obt || !total) return '-';
  const p = (obt/total)*100;
  if(p>=60) return '1st';
  if(p>=45) return '2nd';
  if(p>=33) return '3rd';
  return 'Fail';
}

// ================= STUDENT DASHBOARD =================
// Open dashboard modal
document.getElementById("openStudentDashboardBtn").onclick=()=>{
  document.getElementById("studentDashboardModal").style.display="block";
  prepareDashboardFilters();
};

// Prepare class + year filter
function prepareDashboardFilters(){
  const cls=document.getElementById('dash_class');
  const year=document.getElementById('dash_year');

  cls.innerHTML='<option value="">Select Class</option>';
  classList.forEach(c=>cls.innerHTML+=`<option>${c}</option>`);

  const cy=new Date().getFullYear();
  year.innerHTML='<option value="">Select Year</option>';
  for(let y=cy;y>=2018;y--) year.innerHTML+=`<option>${y}</option>`;
}

// Load students in dashboard table
async function loadDashboardStudents(){
  const cls=dash_class.value;
  const yr=dash_year.value;
  if(!cls||!yr) return alert("Class & Year select karo");

  let students=await (await fetch(API + '/api/get-students')).json();

  students=students.filter(s=>
    s.student_class===cls &&
    new Date(s.joining_date).getFullYear()==yr
  );

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

// Save dashboard student
async function saveDashStudent(id,btn){
  const i=btn.closest('tr').querySelectorAll('input');
  await fetch(API + '/api/update-student-data',{
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
  alert("Saved");
}

// Delete single student
async function deleteDashStudent(id){
  if(!confirm("Delete?")) return;
  await fetch(API + '/api/delete-student',{
    method:'DELETE',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({student_id:id})
  });
  loadDashboardStudents();
}

// Delete full loaded class
async function deleteLoadedClass(){
  if(!confirm("DELETE FULL CLASS?")) return;
  document.querySelectorAll('#dashboardBody tr').forEach(async r=>{
    const id=r.children[1].innerText;
    await fetch(API + '/api/delete-student',{
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({student_id:id})
    });
  });
  dashboardBody.innerHTML="";
}

// ================= MODALS =================
// Close any modal
document.querySelectorAll('.close').forEach(c=>{
  c.onclick=()=>c.closest('.modal').style.display="none";
});

// ================= FEES =================
let currentFeesStudent=null;

// Open fees excel popup
async function openFeesExcelPopup(id){
  currentFeesStudent=id;
  feesExcelModal.style.display="block";

  const students=await (await fetch(API + '/api/get-students')).json();
  const s=students.find(x=>x.student_id===id);

  feesStudentInfo.innerHTML=`
<img src="${s.photo}" width="60" style="border-radius:50%;cursor:pointer"
 onclick="openStudentEditPopup('${s.student_id}')">

<b>${s.student_name}</b> | Parent:${s.parent_name} 📞${s.mobile}
<button onclick="callNow('${s.mobile}')">📞</button>
<button onclick="sendSMS('${s.mobile}')">💬</button>`;
  prepareFeesFilters();
  loadFeesExcel();
}

// Call & SMS helpers
function callNow(n){location.href=`tel:${n}`;}
function sendSMS(n){location.href=`sms:${n}?body=Fees reminder from BBCC`;}

// ================= FEES CRASH FIX =================
// Dummy functions (JS crash prevent)
function prepareFeesFilters(){}
function loadFeesExcel(){}
function closeFeesExcel(){
  feesExcelModal.style.display="none";
}
// ================= FEES FILTERS (REAL IMPLEMENTATION) =================
function prepareFeesFilters(){
  const yearSel=document.getElementById("fees_year");
  const monthSel=document.getElementById("fees_month");

  yearSel.innerHTML='<option value="">All Years</option>';
  monthSel.innerHTML='<option value="">All Months</option>';

  const cy=new Date().getFullYear();
  for(let y=cy;y>=2018;y--){
    yearSel.innerHTML+=`<option value="${y}">${y}</option>`;
  }

  const months=[
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  months.forEach((m,i)=>{
    monthSel.innerHTML+=`<option value="${i+1}">${m}</option>`;
  });
}
////-==========================================================
async function loadFeesExcel(){
  const y=document.getElementById("fees_year").value;
  const m=document.getElementById("fees_month").value;

  const res=await fetch(API+'/api/get-fees');
  let data=await res.json();

  data=data.filter(f=>f.student_id===currentFeesStudent);

  if(y) data=data.filter(f=>new Date(f.month).getFullYear()==y);
  if(m) data=data.filter(f=>new Date(f.month).getMonth()+1==m);

  feesExcelBody.innerHTML="";

  data.forEach(f=>{
    feesExcelBody.innerHTML+=`
<tr>
<td>${new Date(f.month).toLocaleString('default',{month:'long'})}</td>
<td>${f.fees}</td>
<td>${f.paid}</td>
<td>${f.fees - f.paid}</td>
<td>${f.paid>=f.fees?'Paid':'Due'}</td>
<td><button>💾</button></td>
</tr>`;
  });
}
///=============================================================
async function openStudentEditPopup(id){
  studentEditModal.style.display="block";

  const students=await (await fetch(API+'/api/get-students')).json();
  const s=students.find(x=>x.student_id===id);

  edit_id.value=s.student_id;
  edit_class.value=s.student_class;
  edit_name.value=s.student_name;
  edit_parent.value=s.parent_name;
  edit_mobile.value=s.mobile;
  edit_parent_mobile.value=s.parent_mobile;
}

async function updateStudentProfile(){
  await fetch(API+'/api/update-student-profile',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id:edit_id.value,
      student_class:edit_class.value,
      student_name:edit_name.value,
      parent_name:edit_parent.value,
      mobile:edit_mobile.value,
      parent_mobile:edit_parent_mobile.value
    })
  });

  alert("Student Updated");
  studentEditModal.style.display="none";
}
//======================================================================
