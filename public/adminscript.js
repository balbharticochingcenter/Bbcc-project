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

    if(s.logo) db_logo.src=s.logo;
    if(s.title) db_title.innerText=s.title;
    if(s.sub_title) db_subtitle.innerText=s.sub_title;

    if(s.facebook) foot_facebook.href=s.facebook;
    if(s.gmail) foot_gmail.href="mailto:"+s.gmail;
    if(s.call_no) foot_call.href="tel:"+s.call_no;
    if(s.help) foot_help.innerText=s.help;
  }catch(e){ console.error(e); }
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
openStudentDashboardBtn.onclick=()=>{
  studentDashboardModal.style.display="block";
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

// ================= FEES =================
let currentFeesStudent=null;

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
    const fees=row.fees??s.fees??0;
    const paid=row.paid??0;
    const due=fees-paid;

    totalPaid+=Number(paid);
    totalDue+=Number(due);

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

  totalPaidSpan.innerText=totalPaid;
  totalDueSpan.innerText=totalDue;
}

async function saveFeesRow(btn){
  const tr=btn.closest('tr');
  const inputs=tr.querySelectorAll('input');
  const key=tr.dataset.key;

  await fetch(API+'/api/update-student-fees',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id:currentFeesStudent,
      month:key,
      field:'fees',
      value:inputs[0].value
    })
  });

  await fetch(API+'/api/update-student-fees',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id:currentFeesStudent,
      month:key,
      field:'paid',
      value:inputs[1].value
    })
  });

  alert("Fees Saved ✅");
  loadFeesExcel();
}

// ================= STUDENT EDIT =================
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
  edit_photo_preview.src=s.photo||'';
}

async function updateStudentProfile(){
  const file=edit_photo_file.files[0];

  if(file){
    compressImage(file,img=>{
      saveStudentProfile(img);
    });
  }else{
    saveStudentProfile(null);
  }
}

async function saveStudentProfile(photo){
  await fetch(API+'/api/update-student-data',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id:edit_id.value,
      student_class:edit_class.value,
      student_name:edit_name.value,
      parent_name:edit_parent.value,
      mobile:edit_mobile.value,
      parent_mobile:edit_parent_mobile.value,
      photo
    })
  });

  alert("Student Updated ✅");
  studentEditModal.style.display="none";
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
    cb(c.toDataURL('image/jpeg',0.3)); // <5kb
  };
  r.readAsDataURL(file);
}
