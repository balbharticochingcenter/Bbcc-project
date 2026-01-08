document.addEventListener("DOMContentLoaded", async () => {

    const studentId = localStorage.getItem("studentId");
    if (!studentId) return location.href = "/";

    /* ===== HEADER + FOOTER ===== */
    const settings = await fetch("/api/get-settings").then(r => r.json());

    siteHeader.innerHTML = `
        <div class="header-box">
            <h1>${settings.title || "Institute"}</h1>
            <p>${settings.sub_title || ""}</p>
        </div>
    `;

    siteFooter.innerHTML = `
        <p>📞 ${settings.contact || ""} | ✉ ${settings.gmail || ""}</p>
    `;

    /* ===== STUDENT DATA ===== */
    const students = await fetch("/api/get-students").then(r => r.json());
    const s = students.find(x => x.student_id === studentId);

    stuPhoto.src = s.photo;
    stuName.innerText = s.student_name;
    stuId.innerText = s.student_id;
    stuClass.innerText = s.student_class;
    stuDOJ.innerText = s.joining_date;

    stuMobile.value = s.mobile || "";
    parentMobile.value = s.parent_mobile || "";
    stuPass.value = s.pass;

    /* ===== FEES ===== */
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    feesTable.innerHTML = months.map((m,i)=>`
        <tr>
            <td>${m}</td>
            <td class="${s.paid_months.includes(i+1) ? 'paid' : 'unpaid'}">
                ${s.paid_months.includes(i+1) ? "PAID" : "UNPAID"}
            </td>
        </tr>
    `).join("");

    /* ===== CLASS MATERIAL (ONLY STUDENT CLASS) ===== */
    const classes = await fetch("/api/get-all-class-configs").then(r=>r.json());
    const cls = classes[s.student_class];

    let html = "";
    if (cls?.subjects) {
        for (let sub in cls.subjects) {
            html += `<h4>${sub}</h4>`;
            cls.subjects[sub].videos?.forEach(v =>
                html += `<a href="${v}" target="_blank">▶ Video</a>`
            );
            cls.subjects[sub].notes?.forEach(n =>
                html += `<a href="${n}" download>📄 Notes</a>`
            );
        }
    }

    materialBox.innerHTML = html || "No material available.";
});

/* ===== UPDATE PROFILE ===== */
async function updateProfile() {
    await fetch("/api/update-student-data", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            student_id: localStorage.getItem("studentId"),
            mobile: stuMobile.value,
            parent_mobile: parentMobile.value,
            pass: stuPass.value
        })
    });
    alert("Profile Updated");
}
function logout() {
    localStorage.removeItem("studentId");
    location.href = "/";
}
