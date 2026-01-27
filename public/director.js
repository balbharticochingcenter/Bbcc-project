// Configuration
const API_BASE = window.location.origin;
let currentSettings = {};
let editingField = null;

// DOM Elements
const elements = {
    logoImg: document.getElementById('logo-img'),
    mainTitle: document.getElementById('main-title'),
    subTitle: document.getElementById('sub-title'),
    
    // Footer elements
    footerTitle: document.getElementById('footer-title'),
    helpText: document.getElementById('help-text'),
    contactNumber: document.getElementById('contact-number'),
    emailAddress: document.getElementById('email-address'),
    helplineNumber: document.getElementById('helpline-number'),
    facebookLink: document.getElementById('facebook-link'),
    youtubeLink: document.getElementById('youtube-link'),
    instagramLink: document.getElementById('instagram-link'),
    twitterLink: document.getElementById('twitter-link'),
    
    // Modal elements
    editModal: document.getElementById('editModal'),
    modalTitle: document.getElementById('modal-title'),
    fieldLabel: document.getElementById('field-label'),
    editInput: document.getElementById('edit-input'),
    editTextarea: document.getElementById('edit-textarea')
};

// Initialize
async function initialize() {
    try {
        await loadSettings();
        updateUI();
        
        // Add click listeners for edit
        setupEditListeners();
        
    } catch (error) {
        console.error('Error loading settings:', error);
        alert('Error loading page. Please refresh.');
    }
}

// Load settings from database
async function loadSettings() {
    const response = await fetch(`${API_BASE}/api/director/get-settings`);
    if (!response.ok) throw new Error('Failed to load settings');
    currentSettings = await response.json();
}

// Update UI with current settings
function updateUI() {
    // Header
    if (currentSettings.logo) {
        elements.logoImg.src = currentSettings.logo;
    }
    elements.mainTitle.textContent = currentSettings.title || 'Bal Bharti Coaching Center';
    elements.subTitle.textContent = currentSettings.sub_title || 'Director Panel';
    
    // Footer
    elements.footerTitle.textContent = currentSettings.title || 'Bal Bharti Coaching Center';
    elements.helpText.textContent = currentSettings.help || 'Quality Education for All';
    elements.contactNumber.textContent = currentSettings.contact || 'Not set';
    elements.emailAddress.textContent = currentSettings.gmail || 'Not set';
    elements.helplineNumber.textContent = currentSettings.call_no || 'Not set';
    
    // Social links
    updateSocialLinks();
}

// Update social media links
function updateSocialLinks() {
    const socialLinks = elements.facebookLink.parentNode.querySelectorAll('a');
    socialLinks.forEach(link => {
        const platform = link.id.replace('-link', '');
        const url = currentSettings[platform];
        
        if (url && url !== 'Not set') {
            link.href = url;
            link.target = '_blank';
        } else {
            link.href = '#';
            link.onclick = (e) => {
                e.preventDefault();
                editField(platform, 'URL');
            };
        }
    });
}

// Setup edit listeners
function setupEditListeners() {
    // Click listeners are already set via onclick attributes in HTML
}

// Edit functions
function editLogo() {
    editField('logo', 'Logo (Base64)', true);
}

function editTitle() {
    editField('title', 'Main Title');
}

function editSubTitle() {
    editField('sub_title', 'Sub Title');
}

function editFooterTitle() {
    editField('title', 'Footer Title');
}

function editHelpText() {
    editField('help', 'Help Text', false, true);
}

function editContactNumber() {
    editField('contact', 'Contact Number');
}

function editEmail() {
    editField('gmail', 'Email Address');
}

function editHelpline() {
    editField('call_no', 'Helpline Number');
}

function editFacebook() {
    editField('facebook', 'Facebook URL');
}

function editYouTube() {
    editField('youtube_link', 'YouTube URL');
}

function editInstagram() {
    editField('instagram', 'Instagram URL');
}

function editTwitter() {
    editField('twitter', 'Twitter URL');
}

// Open edit modal
function editField(field, label, isLogo = false, isTextarea = false) {
    editingField = field;
    
    elements.modalTitle.textContent = `Edit ${label}`;
    elements.fieldLabel.textContent = label;
    
    const currentValue = currentSettings[field] || '';
    
    if (isTextarea) {
        elements.editInput.style.display = 'none';
        elements.editTextarea.style.display = 'block';
        elements.editTextarea.value = currentValue;
        elements.editTextarea.focus();
    } else {
        elements.editTextarea.style.display = 'none';
        elements.editInput.style.display = 'block';
        elements.editInput.type = isLogo ? 'textarea' : 'text';
        elements.editInput.value = currentValue;
        elements.editInput.focus();
        
        if (isLogo) {
            elements.editInput.placeholder = 'Paste base64 image data...';
        }
    }
    
    elements.editModal.style.display = 'flex';
}

// Close modal
function closeModal() {
    elements.editModal.style.display = 'none';
    editingField = null;
    elements.editInput.value = '';
    elements.editTextarea.value = '';
}

// Save changes
async function saveChanges() {
    if (!editingField) return;
    
    const value = elements.editTextarea.style.display === 'block' 
        ? elements.editTextarea.value.trim()
        : elements.editInput.value.trim();
    
    if (!value) {
        alert('Please enter a value');
        return;
    }
    
    try {
        // Save to database
        const response = await fetch(`${API_BASE}/api/director/update-settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                field: editingField,
                value: value
            })
        });
        
        if (!response.ok) throw new Error('Update failed');
        
        // Update local settings
        currentSettings[editingField] = value;
        
        // Update UI
        updateUI();
        
        // Close modal and refresh page
        closeModal();
        alert('Settings updated successfully! Page will refresh.');
        setTimeout(() => location.reload(), 1000);
        
    } catch (error) {
        console.error('Error saving:', error);
        alert('Error updating settings. Please try again.');
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/';
    }
}

// Modal close on outside click
window.addEventListener('click', (event) => {
    if (event.target === elements.editModal) {
        closeModal();
    }
});

// Enter key to save
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && elements.editModal.style.display === 'flex') {
        saveChanges();
    }
    if (event.key === 'Escape' && elements.editModal.style.display === 'flex') {
        closeModal();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initialize);
