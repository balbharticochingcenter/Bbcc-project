let showStudent = false;
let student, settings;

document.addEventListener("DOMContentLoaded", async () => {

    const studentId = localStorage.getItem("studentId");
    if (!studentId) return location.href = "/";

    // Pehle data fetch karna zaroori hai
    settings = await fetch("/api/get-settings").then(r => r.json());
    const students = await fetch("/api/get-students").then(r => r.json());
    student = students.find(s => s.student_id === studentId);

    if (!student) return location.href = "/";

    // Ab settings use kar sakte hain
    viewerBox.innerHTML = `
      <h2>${settings.title || ""}</h2>
      <p>${settings.sub_title || ""}</p>
    `;

    // 🔄 RING IMAGE SWITCH
    headerTitle.innerText = settings.title || "";
    headerSub.innerText = settings.sub_title || "";
    ringImage.src = settings.logo || "";

    setInterval(() => {
        showStudent = !showStudent;
        ringImage.src = showStudent ? (student.photo || settings.logo) : settings.logo;
        ringText.innerText = showStudent ? "PROFILE" : "";
    }, 1000);

    ringBox.onclick = openProfile;

    // SUBJECTS
    const classes = await fetch("/api/get-all-class-configs").then(r => r.json());
    const cls = classes[student.student_class];
    if (!cls || !cls.subjects) return;

    for (let sub in cls.subjects) {
        const div = document.createElement("div");
        div.className = "subject";
        div.innerText = sub;
        div.onclick = () => toggleSubject(div, sub, cls.subjects[sub]);
        subjectsBox.appendChild(div);
    }
});

// PROFILE - Fixed nesting
function openProfile() {
    pName.innerText = student.student_name;
    pParent.innerText = student.parent_name || "";
    pMobile.innerText = student.mobile || "";
    pPMobile.innerText = student.parent_mobile || "";
    pJoin.innerText = student.joining_date || "";
    
    // Agar modal element hai toh use show karein
    if(typeof profileModal !== 'undefined') profileModal.style.display = "block";
}

function closeProfile() { 
    if(typeof profileModal !== 'undefined') profileModal.style.display = "none"; 
}

function openFees() {
    feesTable.innerHTML = "";

    const joinDate = new Date(student.joining_date);
    const monthlyFees = Number(student.fees);
    const now = new Date();

    let d = new Date(joinDate);

    while (d <= now) {
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const key = `${year}-${month}`;

        const paid = Number(student.fees_data?.[key]?.paid || 0);
        const due = monthlyFees - paid;
        const status = due <= 0 ? "PAID" : "DUE";

        feesTable.innerHTML += `
          <tr>
            <td>${d.toLocaleString('default', { month: 'long' })} ${year}</td>
            <td>${monthlyFees}</td>
            <td>${paid}</td>
            <td>${due}</td>
            <td>${status}</td>
          </tr>
        `;

        d.setMonth(d.getMonth() + 1);
    }

    feesModal.style.display = "flex";
}

function closeFees() {
    feesModal.style.display = "none";
}

function openPDF(src) {
    viewerBox.innerHTML = `<iframe src="${src}" frameborder="0"></iframe>`;
}

function openVideo(url) {
    let id = "";
    if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1];
    else if (url.includes("embed/")) id = url.split("embed/")[1];
    else if (url.includes("v=")) id = url.split("v=")[1].split("&")[0];

    viewerBox.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
}

// LOGOUT
function logout() {
    localStorage.removeItem("studentId");
    location.href = "/";
}

function changePassword(newPass) {
    fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: student.student_id, password: newPass })
    });
}

function toggleSubject(div, name, data) {
    const old = div.querySelector(".subject-content");
    if (old) {
        old.remove();
        return;
    }

    const box = document.createElement("div");
    box.className = "subject-content";

    data.notes?.forEach((n, i) => {
        box.innerHTML += `<button onclick="event.stopPropagation(); openPDF('${n}')">Notes ${i + 1}</button><br>`;
    });

    data.videos?.forEach((v, i) => {
        box.innerHTML += `<button onclick="event.stopPropagation(); openVideo('${v}')">Chapter ${i + 1}</button><br>`;
    });

    div.appendChild(box);
}
