document.addEventListener("DOMContentLoaded", async () => {

    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
        alert("Login required");
        location.href = "/";
        return;
    }

    // ===== LOAD ALL STUDENTS =====
    const res = await fetch("/api/get-students");
    const students = await res.json();
    const s = students.find(st => st.student_id === studentId);

    // ===== PROFILE =====
    stuPhoto.src = s.photo;
    stuName.innerText = s.student_name;
    stuId.innerText = s.student_id;
    stuClass.innerText = s.student_class;
    stuDOJ.innerText = s.joining_date;
    stuMobile.value = s.mobile || "";
    parentMobile.value = s.parent_mobile || "";
    stuPass.value = s.pass;

    // ===== FEES =====
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let feesHTML = "";

    months.forEach((m, i) => {
        const paid = s.paid_months?.includes(i + 1);
        feesHTML += `
            <tr>
                <td>${m}</td>
                <td class="${paid ? 'paid' : 'unpaid'}">
                    ${paid ? 'PAID' : 'UNPAID'}
                </td>
            </tr>`;
    });

    feesTable.innerHTML = feesHTML;

    // ===== CLASS MATERIAL =====
    const cRes = await fetch("/api/get-all-class-configs");
    const classes = await cRes.json();
    const cls = classes[s.student_class];

    let matHTML = "";
    if (cls?.subjects) {
        for (let sub in cls.subjects) {
            matHTML += `<h4>${sub}</h4>`;
            cls.subjects[sub].videos?.forEach(v =>
                matHTML += `<a href="${v}" target="_blank">▶ Video</a><br>`
            );
            cls.subjects[sub].notes?.forEach(n =>
                matHTML += `<a href="${n}" download>📄 Notes</a><br>`
            );
        }
    }
    materialBox.innerHTML = matHTML || "No material uploaded.";
});

// ===== UPDATE PROFILE (ONLY MOBILE + PASS) =====
async function updateProfile() {
    await fetch("/api/update-student-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            student_id: localStorage.getItem("studentId"),
            mobile: stuMobile.value,
            parent_mobile: parentMobile.value,
            pass: stuPass.value
        })
    });

    alert("Profile Updated");
}
