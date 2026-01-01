const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Load Settings and Auto-Fill Form
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        const data = await response.json();

        if(data) {
            // Update Header/Footer
            document.getElementById('db-title').innerText = data.title || "My Site";
            document.getElementById('db-subtitle').innerText = data.sub_title || "";
            if(data.logo) document.getElementById('db-logo').src = data.logo;

            // Update Social Icons in Footer
            const socialDiv = document.getElementById('db-socials');
            socialDiv.innerHTML = `
                ${data.facebook ? `<a href="${data.facebook}"><i class="fab fa-facebook"></i></a>` : ''}
                ${data.youtube_link ? `<a href="${data.youtube_link}"><i class="fab fa-youtube"></i></a>` : ''}
                ${data.instagram ? `<a href="${data.instagram}"><i class="fab fa-instagram"></i></a>` : ''}
                ${data.twitter ? `<a href="${data.twitter}"><i class="fab fa-twitter"></i></a>` : ''}
                ${data.gmail ? `<a href="mailto:${data.gmail}"><i class="fas fa-envelope"></i></a>` : ''}
            `;

            // Auto-fill form fields when system button is clicked
            document.getElementById('form-title').value = data.title || "";
            document.getElementById('form-subtitle').value = data.sub_title || "";
            document.getElementById('form-contact').value = data.contact || "";
            document.getElementById('form-help').value = data.help || "";
            document.getElementById('form-gmail').value = data.gmail || "";
            document.getElementById('form-youtube').value = data.youtube_link || "";
            document.getElementById('form-facebook').value = data.facebook || "";
            document.getElementById('form-instagram').value = data.instagram || "";
            document.getElementById('form-twitter').value = data.twitter || "";
            document.getElementById('form-addmore').value = data.add_more || "";
            document.getElementById('form-adminname').value = data.admin_name || "";
        }
    } catch (err) { console.error("Load Error:", err); }
}

const adminForm = document.getElementById("adminForm");
adminForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(adminForm);
    const data = Object.fromEntries(formData.entries());

    const logoInput = document.getElementById('logoInput');
    if (logoInput.files[0]) {
        data.logo = await toBase64(logoInput.files[0]);
    } else {
        // Keep existing logo if new one isn't uploaded
        data.logo = document.getElementById('db-logo').src;
    }

    try {
        const response = await fetch('/api/update-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if(response.ok) {
            alert("✨ Magic! Data Saved Successfully ✨");
            location.reload();
        }
    } catch (err) { alert("Save Failed!"); }
};

// Modal Open/Close
const modal = document.getElementById("systemModal");
document.getElementById("openModalBtn").onclick = () => {
    loadSettings(); // Fetch latest data before opening
    modal.style.display = "block";
};
document.querySelector(".close").onclick = () => modal.style.display = "none";
// TEACHER MODAL CONTROLS
const tModal = document.getElementById("teacherModal");
document.getElementById("openTeacherBtn").onclick = () => tModal.style.display = "block";
document.getElementById("closeTeacher").onclick = () => tModal.style.display = "none";

// AUTO GEN ID & PASS (Name ke pehle 3 letters + Random Number)
document.getElementById('t_name').oninput = (e) => {
    const name = e.target.value.trim().toUpperCase();
    if(name.length >= 3) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('t_id').value = name.substring(0, 3) + rand;
        document.getElementById('t_pass').value = name.substring(0, 3) + "@" + rand;
    }
};

// SUBMIT TEACHER DATA
document.getElementById("teacherForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.classes = formData.getAll('classes'); // Collect all checked classes

    const photoInput = document.getElementById('t_photo');
    if (photoInput.files[0]) data.photo = await toBase64(photoInput.files[0]);

    const res = await fetch('/api/teacher-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if(res.ok) { alert("Teacher Added!"); tModal.style.display = "none"; e.target.reset(); }
};
