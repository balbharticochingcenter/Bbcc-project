// --- Function to convert Image to Base64 String ---
// This is necessary because MongoDB stores images as long text strings in this setup
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- Modal Logic (Open/Close Pop-up) ---
const modal = document.getElementById("systemModal");
const btn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close");

if(btn) {
    btn.onclick = () => {
        modal.style.display = "block";
        console.log("System modal opened"); // English Comment: Log for debugging
    };
}

if(closeBtn) {
    closeBtn.onclick = () => {
        modal.style.display = "none";
    };
}

// Close modal if user clicks outside of the box
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// --- SAVE DATA TO DATABASE ---
const adminForm = document.getElementById("adminForm");
if(adminForm) {
    adminForm.onsubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh
        console.log("Submit initiated..."); 

        const formData = new FormData(adminForm);
        const data = Object.fromEntries(formData.entries());

        // Handle Logo file upload and conversion
        const logoInput = document.getElementById('logoInput');
        if (logoInput && logoInput.files[0]) {
            const logoFile = logoInput.files[0];
            // Safety check for file size (Max 2MB recommended for Base64)
            if (logoFile.size > 2 * 1024 * 1024) {
                alert("Logo is too large. Please select a file under 2MB.");
                return;
            }
            data.logo = await toBase64(logoFile);
        }

        try {
            // Sending data to server via POST request
            const response = await fetch('/api/update-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if(response.ok) {
                console.log("Database updated successfully:", result);
                alert("Settings saved to MongoDB Atlas!");
                modal.style.display = "none"; // Close modal after success
                
                // If on login.html or home page, refresh to show new data
                if (typeof loadSettings === "function") {
                    loadSettings();
                } else {
                    location.reload(); 
                }
            } else {
                throw new Error(result.error || "Server responded with an error");
            }
        } catch (err) {
            console.error("Failed to save data:", err);
            alert("Error: Data could not be saved. Check console for details.");
        }
    };
}

// --- LOAD DATA FROM DATABASE ---
// This function fetches data from MongoDB to display in Header/Footer
async function loadSettings() {
    console.log("Fetching settings from database...");
    try {
        const response = await fetch('/api/get-settings');
        if (!response.ok) throw new Error("Could not fetch settings");
        
        const data = await response.json();

        // Check if data exists before updating UI
        if(data && data.title) {
            if(document.getElementById('db-title')) document.getElementById('db-title').innerText = data.title;
            if(document.getElementById('db-subtitle')) document.getElementById('db-subtitle').innerText = data.sub_title;
            if(document.getElementById('db-contact')) document.getElementById('db-contact').innerText = "Contact: " + (data.contact || "");
            if(document.getElementById('db-admin')) document.getElementById('db-admin').innerText = data.admin_name || "Admin";
            
            // Render logo if available
            if(data.logo && document.getElementById('db-logo')) {
                const logoImg = document.getElementById('db-logo');
                logoImg.src = data.logo;
                logoImg.style.display = 'inline-block';
            }
            console.log("UI updated with Database data");
        }
    } catch (err) {
        console.error("Error loading settings:", err);
    }
}
