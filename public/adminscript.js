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

// ================= INIT =================
async function initDashboard(){
  await loadClassList();
}

async function loadClassList(){
  const res = await fetch('/api/get-all-class-configs');
  const data = await res.json();
  window.classList = Object.keys(data);
}
/////////--------------------------===========================
function calculateDivision(obt, total){
  if(!obt || !total) return '-';
  const p = (obt/total)*100;
  if(p>=60) return '1st';
  if(p>=45) return '2nd';
  if(p>=33) return '3rd';
  return 'Fail';
}

// ================= STUDENT DASHBOARD =================
document.getElementById("openStudentDashboardBtn").onclick=()=>{
  document.getElementById("studentDashboardModal").style.display="block";
  prepareDashboardFilters();
};

function prepareDashboardFilters(){
  const cls=document.getElementById('dash_class');
  const year=document.getElementById('dash_year');

  cls.innerHTML='<option value="">Select Class</option>';
  classList.forEach(c=>cls.innerHTML+=`<option>${c}</option>`);

  const cy=new Date().getFullYear();
  year.innerHTML='<option value="">Select Year</option>';
  for(let y=cy;y>=2018;y--) year.innerHTML+=`<option>${y}</option>`;
}

async function loadDashboardStudents(){
  const cls=dash_class.value;
  const yr=dash_year.value;
  if(!cls||!yr) return alert("Class & Year select karo");

  let students=await (await fetch('/api/get-students')).json();
  students=students.filter(s=>s.student_class===cls &&
    new Date(s.joining_date).getFullYear()==yr);

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
  await fetch('/api/update-student-data',{
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

async function deleteDashStudent(id){
  if(!confirm("Delete?")) return;
  await fetch('/api/delete-student',{
    method:'DELETE',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({student_id:id})
  });
  loadDashboardStudents();
}

async function deleteLoadedClass(){
  if(!confirm("DELETE FULL CLASS?")) return;
  document.querySelectorAll('#dashboardBody tr').forEach(async r=>{
    const id=r.children[1].innerText;
    await fetch('/api/delete-student',{
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({student_id:id})
    });
  });
  dashboardBody.innerHTML="";
}

// ================= MODALS =================
document.querySelectorAll('.close').forEach(c=>{
  c.onclick=()=>c.closest('.modal').style.display="none";
});

// ================= FEES =================
let currentFeesStudent=null;

async function openFeesExcelPopup(id){
  currentFeesStudent=id;
  feesExcelModal.style.display="block";

  const students=await (await fetch('/api/get-students')).json();
  const s=students.find(x=>x.student_id===id);

  feesStudentInfo.innerHTML=`
<b>${s.student_name}</b> | Parent:${s.parent_name} 📞${s.mobile}
<button onclick="callNow('${s.mobile}')">📞</button>
<button onclick="sendSMS('${s.mobile}')">💬</button>`;

  prepareFeesFilters();
  loadFeesExcel();
}

function callNow(n){location.href=`tel:${n}`;}
function sendSMS(n){location.href=`sms:${n}?body=Fees reminder from BBCC`;}
