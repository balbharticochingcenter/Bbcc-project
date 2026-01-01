const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- LOAD SETTINGS (SYSTEM) ---
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        const data = await response.json();
        if(data) {
            document.getElementById('db-title').innerText = data.title || "My Site";
            document.getElementById('db-subtitle').innerText = data.sub_title || "";
            if(data.logo) document.getElementById('db-logo').src = data.logo;

            const socialDiv = document.getElementById('db-socials');
            socialDiv.innerHTML = `
                ${data.facebook ? `<a href="${data.facebook}"><i class="fab fa-facebook"></i></a>` : ''}
                ${data.youtube_link ? `<a href="${data.youtube_link}"><i class="fab fa-youtube"></i></a>` : ''}
                ${data.instagram ? `<a href="${data.instagram}"><i class="fab fa-instagram"></i></a>` : ''}
                ${data.twitter ? `<a href="${data.twitter}"><i class="fab fa-twitter"></i></a>` : ''}
                ${data.gmail ? `<a href="mailto:${data.gmail}"><i class="fas fa-envelope"></i></a>` : ''}
            `;

            // System Form Fill
            document.getElementById('form-title').value = data.title || "";
            document.getElementById('form-subtitle').value = data.sub_title || "";
            document.getElementById('form-contact').value = data.contact || "";
            document.getElementById('form-adminname').value = data.admin_name || "";
        }
    } catch (err) { console.error("Load Error:", err); }
}

// --- MODAL CONTROLS (Open/Close) ---
const sysModal = document.getElementById("systemModal");
const tModal = document.getElementById("teacherModal");

// System Modal Open
document.getElementById("openModalBtn").onclick = () => {
    loadSettings();
    sysModal.style.display = "block";
};

// Teacher Modal Open (Isse popup khulega)
document.getElementById("openTeacherBtn").onclick = () => {
    tModal.style.display = "block";
};

// Close Buttons
document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => {
        sysModal.style.display = "none";
        tModal.style.display = "none";
    };
});

window.onclick = (event) => {
    if (event.target == sysModal) sysModal.style.display = "none";
    if (event.target == tModal) tModal.style.display = "none";
};

// --- SYSTEM FORM SUBMIT ---
document.getElementById("adminForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const logoInput = document.getElementById('logoInput');
    if (logoInput.files[0]) data.logo = await toBase64(logoInput.files[0]);
    else data.logo = document.getElementById('db-logo').src;

    const res = await fetch('/api/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Settings Saved! ✨"); location.reload(); }
};

// --- TEACHER AUTO GEN ID/PASS ---
document.getElementById('t_name').oninput = (e) => {
    const name = e.target.value.trim().toUpperCase();
    if(name.length >= 3) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('t_id').value = name.substring(0, 3) + rand;
        document.getElementById('t_pass').value = name.substring(0, 3) + "@" + rand;
    }
};

// --- TEACHER FORM SUBMIT ---
document.getElementById("teacherForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.classes = formData.getAll('classes');
    data.subjects = formData.getAll('subjects');

    const photoInput = document.getElementById('t_photo');
    if (photoInput.files[0]) data.photo = await toBase64(photoInput.files[0]);

    const res = await fetch('/api/teacher-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Teacher Added! 🎓"); tModal.style.display = "none"; e.target.reset(); }
    else { alert("Error saving teacher!"); }
};
