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
  loadPendingRegistrations();
  const btn=document.getElementById("openStudentDashboardBtn");
  if(btn) btn.style.display="flex";
}

// ================= SYSTEM SETTINGS =================
async function loadSystemSettings(){
  try{
    const res = await fetch(API + '/api/get-settings');
    const s = await res.json();

    if(s.logo) document.getElementById("db-logo").src = s.logo;
    if(s.title) document.getElementById("db-title").innerText = s.title;
    if(s.sub_title) document.getElementById("db-subtitle").innerText = s.sub_title;

    if(s.facebook) document.getElementById("foot-facebook").href = s.facebook;
    if(s.gmail) document.getElementById("foot-gmail").href = "mailto:"+s.gmail;
    if(s.call_no) document.getElementById("foot-call").href = "tel:"+s.call_no;
    if(s.help) document.getElementById("foot-help").innerText = s.help;
  }catch(e){ console.error(e); }
}

// ================= ADMIN PROFILE =================
async function openAdminProfile(){
  document.getElementById('adminProfileModal').style.display='block';
  const res = await fetch('/api/get-admin-profile');
  const a = await res.json();
  if(a){
    admin_userid.value=a.admin_userid||"";
    admin_name.value=a.admin_name||"";
    admin_mobile.value=a.admin_mobile||"";
    admin_pass.value=a.admin_pass||"";
  }
}
function closeAdminModal(){ document.getElementById('adminProfileModal').style.display='none'; }

function handleAdminPhoto(input){
  const r=new FileReader();
  r.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas');
      c.width=c.height=120;
      c.getContext('2d').drawImage(img,0,0,120,120);
      const b=c.toDataURL('image/jpeg',0.1);
      admin_preview_img.src=b;
      header_admin_photo.src=b;
    };
    img.src=e.target.result;
  };
  r.readAsDataURL(input.files[0]);
}

async function updateAdminProfile(){
  const body={
    admin_userid:admin_userid.value,
    admin_name:admin_name.value,
    admin_mobile:admin_mobile.value,
    admin_pass:admin_pass.value
  };
  const r=await fetch('/api/update-admin-profile',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  const j=await r.json();
  if(j.success){ alert("Updated"); closeAdminModal(); }
}

// ================= CLASS LIST =================
async function loadClassList(){
  const r=await fetch(API+'/api/get-all-class-configs');
  const d=await r.json();
  window.classList=Object.keys(d);
}

// ================= RESULT =================
function calculateDivision(o,t){
  if(!o||!t) return '-';
  const p=o/t*100;
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
  for(let y=new Date().getFullYear();y>=2018;y--) dash_year.innerHTML+=`<option>${y}</option>`;
}

async function loadDashboardStudents(){
  if(!dash_class.value||!dash_year.value) return alert("Select Class & Year");
  let s=await (await fetch(API+'/api/get-students')).json();
  s=s.filter(x=>x.student_class===dash_class.value && new Date(x.joining_date).getFullYear()==dash_year.value);
  dashTotal.innerText=s.length;
  dashboardBody.innerHTML="";
  s.forEach(st=>{
    dashboardBody.innerHTML+=`
<tr>
<td><img src="${st.photo||''}" width="40" onclick="openFeesExcelPopup('${st.student_id}')" onerror="handleImgError(this)"></td>
<td>${st.student_id}</td>
<td><input value="${st.student_name||''}"></td>
<td><input value="${st.pass||''}"></td>
<td>${st.student_class}</td>
<td><input type="date" value="${st.joining_date||''}"></td>
<td><input value="${st.fees||''}"></td>
<td><input type="date" value="${st.exam_date||''}"></td>
<td><input value="${st.total_marks||''}"></td>
<td><input value="${st.obtained_marks||''}"></td>
<td>${calculateDivision(st.obtained_marks,st.total_marks)}</td>
<td><button onclick="saveDashStudent('${st.student_id}',this)">💾</button></td>
<td><button onclick="deleteDashStudent('${st.student_id}')">🗑</button></td>
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
  alert("Saved");
}

async function deleteDashStudent(id){
  if(!confirm("Delete student?")) return;
  await fetch(API+'/api/delete-student',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({student_id:id})});
  loadDashboardStudents();
}

// ================= FEES =================
let currentFeesStudent=null;

function prepareFeesFilters(){
  fees_year.innerHTML='<option>Select Year</option>';
  for(let y=new Date().getFullYear();y>=2018;y--) fees_year.innerHTML+=`<option>${y}</option>`;
  fees_month.innerHTML='<option>Select Month</option>';
  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].forEach((m,i)=>fees_month.innerHTML+=`<option value="${i+1}">${m}</option>`);
}

async function openFeesExcelPopup(id){
  currentFeesStudent=id;
  feesExcelModal.style.display="block";
  const s=(await (await fetch(API+'/api/get-students')).json()).find(x=>x.student_id===id);
  feesStudentInfo.innerHTML=`<b>${s.student_name}</b> (${s.student_id})`;
  prepareFeesFilters();
  loadFeesExcel();
}

async function loadFeesExcel(){
  const s=(await (await fetch(API+'/api/get-students')).json()).find(x=>x.student_id===currentFeesStudent);
  feesExcelBody.innerHTML="";
  let tp=0,td=0;
  let j=new Date(s.joining_date),n=new Date();
  let y=j.getFullYear(),m=j.getMonth();
  while(new Date(y,m)<=n){
    const k=`${y}-${String(m+1).padStart(2,'0')}`;
    const r=s.fees_data?.[k]||{};
    const f=Number(r.fees??s.fees??0);
    const p=Number(r.paid??0);
    const d=f-p;
    tp+=p;td+=d;
    feesExcelBody.innerHTML+=`
<tr data-key="${k}">
<td>${y}-${m+1}</td>
<td><input value="${f}"></td>
<td><input value="${p}"></td>
<td>${d}</td>
<td>${p>=f?'Paid':'Due'}</td>
<td><button onclick="saveFeesRow(this)">💾</button></td>
</tr>`;
    m++;if(m>11){m=0;y++;}
  }
  totalPaid.innerText=tp;
  totalDue.innerText=td;
}

async function saveFeesRow(btn){
  const r=btn.closest('tr');
  const k=r.dataset.key;
  const i=r.querySelectorAll('input');
  await fetch(API+'/api/update-student-fees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({student_id:currentFeesStudent,month:k,field:'fees',value:i[0].value})});
  await fetch(API+'/api/update-student-fees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({student_id:currentFeesStudent,month:k,field:'paid',value:i[1].value})});
  loadFeesExcel();
}

// ================= STUDENT EDIT =================
async function openStudentEditPopup(id){
  const s=(await (await fetch(API+'/api/get-students')).json()).find(x=>x.student_id===id);
  edit_id.value=s.student_id;
  edit_name.value=s.student_name||"";
  edit_class.value=s.student_class||"";
  edit_parent.value=s.parent_name||"";
  edit_mobile.value=s.mobile||"";
  edit_parent_mobile.value=s.parent_mobile||"";
  edit_photo_preview.src=s.photo||"";
  studentEditModal.style.display="block";
}

async function updateStudentProfile(){
  const d={
    student_id:edit_id.value,
    student_name:edit_name.value,
    student_class:edit_class.value,
    parent_name:edit_parent.value,
    mobile:edit_mobile.value,
    parent_mobile:edit_parent_mobile.value
  };
  const f=edit_photo_file.files[0];
  if(f){
    compressImage(f,b=>{ d.photo=b; sendStudentUpdate(d); });
  }else sendStudentUpdate(d);
}

async function sendStudentUpdate(d){
  await fetch(API+'/api/update-student-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
  studentEditModal.style.display="none";
  loadDashboardStudents();
}

// ================= HELPERS =================
const DEFAULT_AVATAR="https://cdn-icons-png.flaticon.com/512/149/149071.png";
function handleImgError(i){ i.src=DEFAULT_AVATAR; }

function compressImage(f,cb){
  const r=new FileReader();
  r.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas');
      c.width=c.height=150;
      c.getContext('2d').drawImage(img,0,0,150,150);
      cb(c.toDataURL('image/jpeg',0.3));
    };
    img.src=e.target.result;
  };
  r.readAsDataURL(f);
}

// ================= MODAL GENERIC =================
function openModal(id){ document.getElementById(id).style.display='block'; }
function closeModal(id){
  if(id) document.getElementById(id).style.display='none';
  else document.getElementById("modal").style.display='none';
}
// ================= CLASS CONFIG =================
let selectedClass = "";
let bannerBase64 = "";
let classData = { subjects: {} };
let feeMap = {};
let ALL_SUBJECTS = [];
let classDB = {};
const classCards = document.getElementById("classCards");

// ================= BANNER =================
const bannerInput = document.getElementById("bannerInput");
if (bannerInput) {
  bannerInput.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => bannerBase64 = r.result;
    r.readAsDataURL(f);
  });
}

// ================= FETCH INITIAL DATA =================
fetch('/api/get-class-fees')
  .then(r => r.json())
  .then(d => d.forEach(x => feeMap[x.class_name] = x.monthly_fees));

fetch('/api/get-all-class-configs')
  .then(r => r.json())
  .then(d => { classDB = d; loadClasses(); });

fetch('/api/get-all-classes')
  .then(r => r.json())
  .then(c => { window.ALL_CLASSES = c; loadClasses(); });

fetch('/api/get-all-subjects')
  .then(r => r.json())
  .then(s => ALL_SUBJECTS = s);

// ================= CLASS CARDS =================
function loadClasses(){
  if (!window.ALL_CLASSES || !classCards) return;
  classCards.innerHTML = "";
  ALL_CLASSES.forEach(cls => {
    const banner = classDB[cls]?.banner || "";
    classCards.innerHTML += `
      <div class="card">
        ${banner ? `<img src="${banner}">` : ""}
        <b>${cls}</b>
        <input value="${feeMap[cls] || ""}" 
               onblur="saveFees('${cls}',this.value)">
        <button onclick="openClassModal('${cls}')">Manage</button>
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

// ================= CLASS MODAL =================
function openClassModal(cls){
  selectedClass = cls;
  classData = classDB[cls] || {};
  if (!classData.subjects) classData.subjects = {};

  document.getElementById("modalTitle").innerText = cls;
  document.getElementById("introVideo").value = classData.intro_video || "";
  document.getElementById("feesInput").value = feeMap[cls] || "";
  document.getElementById("subjectList").innerHTML = "";

  ALL_SUBJECTS.forEach(drawSubject);
  document.getElementById("modal").style.display = "block";
}

function closeClassModal(){
  document.getElementById("modal").style.display = "none";
}

// ================= SUBJECTS =================
function safeId(s){ return s.replace(/\s+/g,'_').toLowerCase(); }

function drawSubject(sub){
  const sid = safeId(sub);
  const checked = !!classData.subjects[sub];
  const d = document.createElement("div");
  d.innerHTML = `
    <label>
      <input type="checkbox" ${checked?"checked":""}
        onchange="toggleSubject('${sub}',this.checked)">
      ${sub}
    </label>
    <div id="box-${sid}"></div>`;
  document.getElementById("subjectList").appendChild(d);
  if (checked) renderSubjectBox(sub);
}

function toggleSubject(sub,on){
  if (on){
    if (!classData.subjects[sub])
      classData.subjects[sub] = { notes:[], videos:[] };
    renderSubjectBox(sub);
  } else {
    delete classData.subjects[sub];
    document.getElementById(`box-${safeId(sub)}`).innerHTML = "";
  }
}

function renderSubjectBox(sub){
  const sid = safeId(sub);
  document.getElementById(`box-${sid}`).innerHTML = `
    <div class="subject-box">
      <b>${sub}</b>
      <div id="n-${sid}"></div>
      <button onclick="addNote('${sub}')">➕ Note</button>
      <div id="v-${sid}"></div>
      <button onclick="addVideo('${sub}')">➕ Video</button>
    </div>`;
}

function addNote(sub){
  const sid = safeId(sub);
  const i = document.createElement("input");
  i.type = "file";
  i.onchange = e => {
    const r = new FileReader();
    r.onload = () => classData.subjects[sub].notes.push(r.result);
    r.readAsDataURL(e.target.files[0]);
  };
  document.getElementById(`n-${sid}`).appendChild(i);
}

function addVideo(sub){
  const sid = safeId(sub);
  const i = document.createElement("input");
  i.placeholder = "YouTube link";
  i.onblur = () => classData.subjects[sub].videos.push(i.value);
  document.getElementById(`v-${sid}`).appendChild(i);
}

// ================= SAVE CLASS CONFIG =================
function saveAll(){
  saveFees(selectedClass, document.getElementById("feesInput").value);
  fetch('/api/save-class-config',{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      class_name:selectedClass,
      banner:bannerBase64 || classData.banner || "",
      intro_video:document.getElementById("introVideo").value,
      subjects:classData.subjects
    })
  }).then(()=>{
    alert("Saved Successfully ✅");
    closeClassModal();
  });
}
