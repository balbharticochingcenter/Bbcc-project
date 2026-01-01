// Function to convert Image to Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// MODAL LOGIC
const modal = document.getElementById("systemModal");
const btn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close");

if(btn) {
    btn.onclick = () => modal.style.display = "block";
}
if(closeBtn) {
    closeBtn.onclick = () => modal.style.display = "none";
}

// SAVE DATA TO DATABASE
const adminForm = document.getElementById("adminForm");
if(adminForm) {
    adminForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(adminForm);
        const data = Object.fromEntries(formData.entries());

        // Handle Logo file
        const logoFile = document.getElementById('logoInput').files[0];
        if (logoFile) {
            data.logo = await toBase64(logoFile);
        }

        const response = await fetch('/api/update-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if(response.ok) {
            alert("Settings saved to MongoDB!");
            location.reload();
        }
    };
}

// LOAD DATA FROM DATABASE (For login.html and header/footer)
async function loadSettings() {
    try {
        const response = await fetch('/api/get-settings');
        const data = await response.json();

        if(data.title) {
            document.getElementById('db-title').innerText = data.title;
            document.getElementById('db-subtitle').innerText = data.sub_title;
            document.getElementById('db-contact').innerText = "Contact: " + data.contact;
            document.getElementById('db-admin').innerText = data.admin_name;
            
            if(data.logo) {
                const logoImg = document.getElementById('db-logo');
                logoImg.src = data.logo;
                logoImg.style.display = 'inline-block';
            }
        }
    } catch (err) {
        console.log("Error loading data:", err);
    }
}
