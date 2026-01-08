let showStudent = false;
let student;

document.addEventListener("DOMContentLoaded", async () => {

    const studentId = localStorage.getItem("studentId");
    if (!studentId) return location.href = "/";

    const settings = await fetch("/api/get-settings").then(r=>r.json());
    const students = await fetch("/api/get-students").then(r=>r.json());
    student = students.find(s=>s.student_id===studentId);

    // 🔄 RING LOGIC
    setInterval(() => {
        showStudent = !showStudent;
        ringImage.src = showStudent ? student.photo : settings.logo;
        ringText.innerText = showStudent ? "PROFILE" : "";
    }, 1000);

    ringBox.onclick = openProfile;

    // SUBJECTS
    const classes = await fetch("/api/get-all-class-configs").then(r=>r.json());
    const cls = classes[student.student_class];

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
    pParent.innerText = student.parent_name;
    pMobile.innerText = student.mobile;
    pPMobile.innerText = student.parent_mobile;
    pJoin.innerText = student.joining_date;

    feesBox.innerHTML = "";
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    months.forEach((m,i)=>{
        const st = student.paid_months.includes(i+1) ? "PAID" : "DUE";
        feesBox.innerHTML += `<p>${m} : ${st}</p>`;
    });

    profileModal.style.display="flex";
}
function closeProfile(){ profileModal.style.display="none"; }

// SUBJECT LOAD
function loadSubject(name, data) {
    viewerBox.innerHTML = `<h3>${name}</h3>`;

    data.notes?.forEach((n,i)=>{
        viewerBox.innerHTML += `<button onclick="openPDF('${n}')">Notes ${i+1}</button>`;
    });

    data.videos?.forEach((v,i)=>{
        viewerBox.innerHTML += `<button onclick="openVideo('${v}')">Chapter ${i+1}</button>`;
    });
}

function openPDF(src){
    viewerBox.innerHTML = `<iframe src="${src}" frameborder="0"></iframe>`;
}
function openVideo(url){
    const id = url.split("v=")[1];
    viewerBox.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
}
