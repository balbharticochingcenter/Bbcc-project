

// 1. Security Guard: Check if Admin is logged in
(function checkAuth() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isAdminLoggedIn !== 'true') {
        // Agar login nahi hai toh seedha login page (index.html) par bhej dega
        window.location.href = 'login.html'; 
    }
})();

// 2. Logout Function
function logoutAdmin() {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('isAdminLoggedIn'); // Login status delete karein
        window.location.href = 'login.html'; // First page par bhejein
    }
}


////OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO NEW BOTON STU DASbORD  OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO

document.getElementById("openStudentDashboardBtn").onclick = () => {
    document.getElementById("studentDashboardModal").style.display = "block";
    prepareDashboardFilters();
};

/////--------------------------------------------------------------------------
    function prepareDashboardFilters() {
    const clsSel = document.getElementById('dash_class');
    const yearSel = document.getElementById('dash_year');

    clsSel.innerHTML = `<option value="">Select Class</option>` +
        classList.map(c => `<option value="${c}">${c}</option>`).join('');

    const currentYear = new Date().getFullYear();
    yearSel.innerHTML = `<option value="">Select Year</option>`;
    for(let y=currentYear; y>=2018; y--) {
        yearSel.innerHTML += `<option value="${y}">${y}</option>`;
    }
}
////--------------------------------------------------------------------
    async function loadDashboardStudents() {
    const cls = document.getElementById('dash_class').value;
    const year = document.getElementById('dash_year').value;
    if(!cls || !year) return alert("Class & Year dono select karo");

    const res = await fetch('/api/get-students');
    let students = await res.json();

    students = students.filter(s =>
        s.student_class === cls &&
        new Date(s.joining_date).getFullYear() == year
    );

    const body = document.getElementById('dashboardBody');
    body.innerHTML = "";

    students.forEach(s => {
    body.innerHTML += `
<tr>
<td>
  <img src="${s.photo}" width="40"
   onclick="openFeesExcelPopup('${s.student_id}')">
</td>

<td>${s.student_id}</td>

<td><input value="${s.student_name||''}"></td>

<td><input value="${s.pass||''}"></td>

<td>${s.student_class}</td>

<td>
  <input type="date" value="${s.joining_date||''}">
</td>

<td><input value="${s.fees||''}" style="width:70px"></td>

<td>
  <input type="date" value="${s.exam_date||''}">
  <button onclick="this.previousElementSibling.value=''">❌</button>
</td>

<td><input value="${s.total_marks||''}" style="width:60px"></td>

<td><input value="${s.obtained_marks||''}" style="width:60px"></td>

<td>${calculateDivision(s.obtained_marks, s.total_marks)}</td>

<td>
  <button onclick="saveDashStudent('${s.student_id}',this)">💾</button>
</td>

<td>
  <button onclick="deleteDashStudent('${s.student_id}')">🗑</button>
</td>
</tr>`;

    });
}
////--------------------------------------------------
async function saveDashStudent(id, btn){
  const row = btn.closest('tr');
  const inputs = row.querySelectorAll('input');

  await fetch('/api/update-student-data',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      student_id: id,
      student_name: inputs[0].value,
      pass: inputs[1].value,
      joining_date: inputs[2].value,
      fees: inputs[3].value,
      exam_date: inputs[4].value || "",
      total_marks: inputs[5].value,
      obtained_marks: inputs[6].value
    })
  });

  alert("Saved");
}

////----------------------------------------------------------------------
    async function deleteDashStudent(id) {
    if(!confirm("Delete student?")) return;
    await fetch('/api/delete-student', {
        method:'DELETE',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({student_id:id})
    });
    loadDashboardStudents();
}
////----------------------------------------------------------------------
    async function deleteLoadedClass() {
    if(!confirm("DELETE FULL LOADED CLASS DATA?")) return;

    const rows = document.querySelectorAll('#dashboardBody tr');
    for (let r of rows) {
        const id = r.children[2].innerText;
        await fetch('/api/delete-student', {
            method:'DELETE',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({student_id:id})
        });
    }
    alert("All deleted");
    document.getElementById('dashboardBody').innerHTML="";
}

    
let currentFeesStudent = null;

async function openFeesExcelPopup(student_id) {
    currentFeesStudent = student_id;
    document.getElementById("feesExcelModal").style.display = "block";

    const res = await fetch('/api/get-students');
    const students = await res.json();
    const s = students.find(x => x.student_id === student_id);

    document.getElementById("feesStudentInfo").innerHTML = `
        <b>${s.student_name}</b> |
        Parent: ${s.parent_name} |
        📞 ${s.mobile}
        <button onclick="callNow('${s.mobile}')">📞</button>
        <button onclick="sendSMS('${s.mobile}')">💬</button>
    `;

    prepareFeesFilters();
    loadFeesExcel();
}
////--------------------------------------------------------
function prepareFeesFilters(){
    const y = document.getElementById('fees_year');
    const m = document.getElementById('fees_month');

    y.innerHTML = `<option value="all">All Years</option>`;
    m.innerHTML = '<option value="">All Months</option>';

    const cy = new Date().getFullYear();
    for(let i=cy;i>=2018;i--) y.innerHTML += `<option>${i}</option>`;

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];
    months.forEach((mo,i)=>{
        m.innerHTML += `<option value="${i+1}">${mo}</option>`;
    });
}
//----------------------------------------------------------------------
async function loadFeesExcel(){
  const yearSel = document.getElementById('fees_year').value;
  const monthSel = document.getElementById('fees_month').value;

  const res = await fetch('/api/get-students');
  const s = (await res.json())
        .find(x=>x.student_id===currentFeesStudent);

  const body = document.getElementById('feesExcelBody');
  body.innerHTML = "";

  const join = new Date(s.joining_date);
  const now = new Date();

  let yStart = join.getFullYear();
  let yEnd = now.getFullYear();

  for(let y=yStart; y<=yEnd; y++){
    if(yearSel!=="all" && Number(yearSel)!==y) continue;

    let mStart = (y===yStart)? join.getMonth()+1 : 1;
    let mEnd = (y===yEnd)? now.getMonth()+1 : 12;

    for(let m=mStart; m<=mEnd; m++){
      if(monthSel && Number(monthSel)!==m) continue;

      const key = `${y}-${m}`;
      const data = s.fees_data?.[key] || {};
      const paid = Number(data.paid||0);
      const fees = Number(s.fees||0);
      const due = fees - paid;
        const dueText = (due <= 0) ? "PAID" : due;

      body.innerHTML += `
      <tr>
        <td>${key}</td>
        <td>${fees}</td>
        <td>
          <input value="${paid}"
           oninput="autoDue(this,${fees})"
           style="width:70px">
        </td>
        <td class="dueCell">${due}</td>
        <td>${due <= 0 ? "✅ Paid" : "❌ Due"}</td>
        <td>
          <button onclick="saveMonthlyFees('${key}',this)">💾</button>
        </td>
      </tr>`;
    }
  }
}

/////----------------------------------------------------
async function saveMonthlyFees(key, btn){
    const paid = btn.closest('tr').querySelector('input').value;

    await fetch('/api/update-student-fees',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            student_id:currentFeesStudent,
            month:key,
            field:'paid',
            value:paid
        })
    });
    alert("Updated");
    loadFeesExcel();
}

////////-----------------------------------------------
function autoDue(input, fees){
  const paid = Number(input.value||0);
  const due = fees - paid;

  const cell = input.closest('tr').querySelector('.dueCell');
  cell.innerText = (due <= 0) ? "PAID" : due;
}

///-------------------------------------------------------------------
function callNow(num){
    window.location.href = `tel:${num}`;
}
function sendSMS(num){
    window.location.href = `sms:${num}?body=Fees reminder from BBCC`;
}
/////---------------------------------------
function closeFeesExcel(){
    document.getElementById("feesExcelModal").style.display="none";
}
///
