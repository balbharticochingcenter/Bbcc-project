// Configuration
const API_BASE = window.location.origin;

// State variables
let currentSettings = {};
let currentEditField = null;
let currentEditValue = null;

// DOM Elements
const elements = {
    logoImg: document.getElementById('logo-img'),
    mainTitle: document.getElementById('main-title'),
    subTitle: document.getElementById('sub-title'),
    editModal: document.getElementById('editModal'),
    logoModal: document.getElementById('logoModal'),
    editInput: document.getElementById('edit-input'),
    editLabel: document.getElementById('edit-label'),
    editHint: document.getElementById('edit-hint'),
    logoPreviewImg: document.getElementById('logo-preview-img'),
    logoBase64: document.getElementById('logo-base64')
};

// Initialize the dashboard
async function initializeDashboard() {
    try {
        // Load settings from database
        const response = await fetch(`${API_BASE}/api/get-settings`);
        currentSettings = await response.json();
        
        // Update header
        updateHeader();
        
        // Update settings cards
        updateSettingsCards();
        
        // Update footer
        updateFooter();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard data. Please refresh the page.');
    }
}

// Update header with current settings
function updateHeader() {
    // Logo
    if (currentSettings.logo) {
        elements.logoImg.src = currentSettings.logo;
        elements.logoPreviewImg.src = currentSettings.logo;
    } else {
        elements.logoImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik01MCAzMEM0MS43MTU3IDMwIDM1IDM2LjcxNTcgMzUgNDVDMzUgNTMuMjg0MyA0MS43MTU3IDYwIDUwIDYwQzU4LjI4NDMgNjAgNjUgNTMuMjg0MyA2NSA0NUM2NSAzNi43MTU3IDU4LjI4NDMgMzAgNTAgMzBaTTcwIDY1QzcwIDY0LjQ0NzcgNzAuNDQ3NyA2NCA3MSA2NEg4OUM4OS41NTIzIDY0IDkwIDY0LjQ0NzcgOTAgNjVWODVDOTAgODUuNTUyMyA4OS41NTIzIDg2IDg5IDg2SDExQzEwLjQ0NzcgODYgMTAgODUuNTUyMyAxMCA4NVY2NUMxMCA2NC40NDc3IDEwLjQ0NzcgNjQgMTEgNjRIMjlDMjkuNTUyMyA2NCAzMCA2NC40NDc3IDMwIDY1VjgyQzMwIDgyLjU1MjMgMzAuNDQ3NyA4MyAzMSA4M0g2OEM2OC41NTIzIDgzIDY5IDgyLjU1MjMgNjkgODJWNjVDNjkgNjQuNDQ3NyA2OS40NDc3IDY0IDcwIDY0WiIgZmlsbD0iIzRGNDZFNSIvPgo8L3N2Zz4K';
    }
    
    // Title
    elements.mainTitle.textContent = currentSettings.title || 'Bal Bharti Coaching Center';
    
    // Subtitle
    elements.subTitle.textContent = currentSettings.sub_title || 'Director Dashboard';
}

// Update settings cards with current values
function updateSettingsCards() {
    // Contact Information
    document.getElementById('contact-value').textContent = currentSettings.contact || 'Not set';
    document.getElementById('call_no-value').textContent = currentSettings.call_no || 'Not set';
    document.getElementById('gmail-value').textContent = currentSettings.gmail || 'Not set';
    
    // Social Media
    document.getElementById('facebook-value').textContent = currentSettings.facebook || 'Not set';
    document.getElementById('youtube_link-value').textContent = currentSettings.youtube_link || 'Not set';
    document.getElementById('instagram-value').textContent = currentSettings.instagram || 'Not set';
    document.getElementById('twitter-value').textContent = currentSettings.twitter || 'Not set';
    
    // Admin & Help
    document.getElementById('admin_name-value').textContent = currentSettings.admin_name || 'Not set';
    document.getElementById('help-value').textContent = currentSettings.help || 'Not set';
    
    // Masked GROQ key
    const groqKey = currentSettings.groq_key;
    const groqElement = document.getElementById('groq_key-value');
    if (groqKey && groqKey.length > 8) {
        groqElement.textContent = '••••••••' + groqKey.slice(-8);
    } else {
        groqElement.textContent = 'Not set';
    }
}

// Update footer with current values
function updateFooter() {
    // Help text
    const helpFooter = document.getElementById('help-footer');
    helpFooter.textContent = currentSettings.help || 'Quality Education for All';
    
    // Contact info
    document.getElementById('contact-footer').textContent = currentSettings.contact || 'Not set';
    document.getElementById('gmail-footer').textContent = currentSettings.gmail || 'Not set';
    
    // Social links
    const facebookLink = document.getElementById('facebook-link');
    const youtubeLink = document.getElementById('youtube-link');
    const instagramLink = document.getElementById('instagram-link');
    const twitterLink = document.getElementById('twitter-link');
    
    if (currentSettings.facebook) {
        facebookLink.href = currentSettings.facebook;
    } else {
        facebookLink.href = '#';
        facebookLink.onclick = (e) => {
            e.preventDefault();
            alert('Facebook link not set. Please update in settings.');
        };
    }
    
    if (currentSettings.youtube_link) {
        youtubeLink.href = currentSettings.youtube_link;
    } else {
        youtubeLink.href = '#';
        youtubeLink.onclick = (e) => {
            e.preventDefault();
            alert('YouTube link not set. Please update in settings.');
        };
    }
    
    if (currentSettings.instagram) {
        instagramLink.href = currentSettings.instagram;
    } else {
        instagramLink.href = '#';
        instagramLink.onclick = (e) => {
            e.preventDefault();
            alert('Instagram link not set. Please update in settings.');
        };
    }
    
    if (currentSettings.twitter) {
        twitterLink.href = currentSettings.twitter;
    } else {
        twitterLink.href = '#';
        twitterLink.onclick = (e) => {
            e.preventDefault();
            alert('Twitter link not set. Please update in settings.');
        };
    }
}

// Edit field functions
function editTitle() {
    currentEditField = 'title';
    currentEditValue = currentSettings.title || '';
    openEditModal('Main Title', 'Enter the main title for the website', currentEditValue);
}

function editSubTitle() {
    currentEditField = 'sub_title';
    currentEditValue = currentSettings.sub_title || '';
    openEditModal('Sub Title', 'Enter the subtitle for the website', currentEditValue);
}

function editField(fieldName) {
    currentEditField = fieldName;
    currentEditValue = currentSettings[fieldName] || '';
    
    const fieldLabels = {
        contact: 'Contact Number',
        call_no: 'Call Number',
        gmail: 'Gmail Address',
        facebook: 'Facebook Link',
        youtube_link: 'YouTube Link',
        instagram: 'Instagram Link',
        twitter: 'Twitter Link',
        admin_name: 'Admin Name',
        help: 'Help Text',
        groq_key: 'GROQ API Key'
    };
    
    const fieldHints = {
        contact: 'Primary contact number for the coaching center',
        call_no: 'Secondary contact number (optional)',
        gmail: 'Official email address',
        facebook: 'Full Facebook page URL',
        youtube_link: 'Full YouTube channel URL',
        instagram: 'Full Instagram profile URL',
        twitter: 'Full Twitter profile URL',
        admin_name: 'Name of the admin/director',
        help: 'Help text shown in footer',
        groq_key: 'GROQ API key for AI features (keep secure)'
    };
    
    openEditModal(
        fieldLabels[fieldName] || fieldName,
        fieldHints[fieldName] || 'Enter new value',
        currentEditValue
    );
}

// Open edit modal
function openEditModal(label, hint, value) {
    elements.editLabel.textContent = label;
    elements.editHint.textContent = hint;
    elements.editInput.value = value;
    elements.editModal.style.display = 'flex';
    elements.editInput.focus();
}

// Close edit modal
function closeModal() {
    elements.editModal.style.display = 'none';
    currentEditField = null;
    currentEditValue = null;
}

// Save changes to database
async function saveChanges() {
    if (!currentEditField) return;
    
    const newValue = elements.editInput.value.trim();
    
    if (newValue === currentEditValue) {
        closeModal();
        return;
    }
    
    try {
        // Update local settings
        currentSettings[currentEditField] = newValue;
        
        // Send to server
        const response = await fetch(`${API_BASE}/api/update-settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentSettings)
        });
        
        if (response.ok) {
            // Update UI
            if (currentEditField === 'title') {
                elements.mainTitle.textContent = newValue;
            } else if (currentEditField === 'sub_title') {
                elements.subTitle.textContent = newValue;
            } else {
                updateSettingsCards();
                updateFooter();
            }
            
            closeModal();
            showToast('Settings updated successfully!', 'success');
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        console.error('Error saving changes:', error);
        showToast('Error updating settings. Please try again.', 'error');
    }
}

// Logo functions
function openLogoEdit() {
    elements.logoModal.style.display = 'flex';
}

function closeLogoModal() {
    elements.logoModal.style.display = 'none';
    elements.logoBase64.value = '';
}

async function saveLogo() {
    const base64Data = elements.logoBase64.value.trim();
    
    if (!base64Data) {
        alert('Please paste base64 image data');
        return;
    }
    
    // Validate base64 data
    if (!base64Data.startsWith('data:image/')) {
        alert('Invalid base64 image data. Please make sure it starts with "data:image/"');
        return;
    }
    
    try {
        // Update local settings
        currentSettings.logo = base64Data;
        
        // Send to server
        const response = await fetch(`${API_BASE}/api/update-settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentSettings)
        });
        
        if (response.ok) {
            // Update UI
            elements.logoImg.src = base64Data;
            elements.logoPreviewImg.src = base64Data;
            closeLogoModal();
            showToast('Logo updated successfully!', 'success');
        } else {
            throw new Error('Logo update failed');
        }
    } catch (error) {
        console.error('Error saving logo:', error);
        showToast('Error updating logo. Please try again.', 'error');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/';
    }
}

// Toast notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Event listeners for closing modals
window.addEventListener('click', (event) => {
    if (event.target === elements.editModal) {
        closeModal();
    }
    if (event.target === elements.logoModal) {
        closeLogoModal();
    }
});

// Prevent form submission on Enter in modals
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if (elements.editModal.style.display === 'flex') {
            event.preventDefault();
            saveChanges();
        }
    }
    if (event.key === 'Escape') {
        if (elements.editModal.style.display === 'flex') {
            closeModal();
        }
        if (elements.logoModal.style.display === 'flex') {
            closeLogoModal();
        }
    }
});

// Preview logo when pasting base64
elements.logoBase64.addEventListener('input', function() {
    const base64Data = this.value.trim();
    if (base64Data.startsWith('data:image/')) {
        elements.logoPreviewImg.src = base64Data;
    }
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);
