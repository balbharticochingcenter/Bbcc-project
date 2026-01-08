let showStudent = false;
let student, settings;

document.addEventListener("DOMContentLoaded", async () => {

    const studentId = localStorage.getItem("studentId");
    if (!studentId) return location.href = "/";

    settings = await fetch("/api/get-settings").then(r=>r.json());
    const students = await fetch("/api/get-students").then(r=>r.json());
    student = students.find(s => s.student_id === studentId);

    if (!student) return location.href = "/";

    // 🔄 RING IMAGE SWITCH
    ringImage.src = settings.logo || "";
    setInterval(() => {
        showStudent = !showStudent;
        ringImage.src = showStudent ? (student.photo || settings.logo) : settings.logo;
        ringText.innerText = showStudent ? "PROFILE" : "";
    }, 1000);

    ringBox.onclick = openProfile;

    // SUBJECTS
    const classes = await fetch("/api/get-all-class-configs").then(r=>r.json());
    const cls = classes[student.student_class];
    if (!cls || !cls.subjects) return;

    for (let sub in cls.subjects) {
        const div = document.createElement("div");
        div.className = "subject";
        div.innerText = sub;
        div.onclick = () => loadSubject(sub, cls.subjects[sub]);
        subjectsBox.appendChild(div);
    }
});

// PROFILE
function openProfile() {
    pName.innerText = student.student_name;
    pParent.innerText = student.parent_name || "";
    pMobile.innerText = student.mobile || "";
    pPMobile.innerText = student.parent_mobile || "";
    pJoin.innerText = student.joining_date || "";

    feesBox.innerHTML = "";
    const paid = student.paid_months || [];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    months.forEach((m,i)=>{
        const st = paid.includes(i+1) ? "PAID" : "DUE";
        feesBox.innerHTML += `<p>${m} : ${st}</p>`;
    });

    profileModal.style.display="flex";
}
function closeProfile(){ profileModal.style.display="none"; }

// SUBJECT
function loadSubject(name, data) {
    viewerBox.innerHTML = `<h3>${name}</h3>`;

    data.notes?.forEach((n,i)=>{
        viewerBox.innerHTML += `<button onclick="openPDF('${n}')">Notes ${i+1}</button><br>`;
    });

    data.videos?.forEach((v,i)=>{
        viewerBox.innerHTML += `<button onclick="openVideo('${v}')">Chapter ${i+1}</button><br>`;
    });
}

function openPDF(src){
    viewerBox.innerHTML = `<iframe src="${src}" frameborder="0"></iframe>`;
}

function openVideo(url){
    let id = "";
    if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1];
    else if (url.includes("embed/")) id = url.split("embed/")[1];
    else if (url.includes("v=")) id = url.split("v=")[1].split("&")[0];

    viewerBox.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
}

// LOGOUT
function logout(){
    localStorage.removeItem("studentId");
    location.href = "/";
}
function changePassword(newPass){
    fetch("/api/change-password",{
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body:JSON.stringify({id:student.student_id,password:newPass})
    })
}
