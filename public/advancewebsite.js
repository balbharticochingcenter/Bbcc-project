// ============================================
// ADVANCE WEBSITE MANAGEMENT - FIXED VERSION
// Admin ID Change + Slider Photo Compress + Testimonial Edit
// ============================================

let currentTestimonials = [];
let sliderImages = [];

// ============================================
// INITIALIZE ADVANCE WEBSITE TAB
// ============================================
async function initAdvanceWebsiteTab() {
    await loadAdminProfileForChange();
    await loadAllTestimonialsForAdmin();  // Changed: Load all testimonials including inactive
    await loadSliderImagesFromConfig();
    setupEventListeners();
}

// ============================================
// 1. ADMIN ID CHANGE FUNCTION - FIXED
// ============================================
async function loadAdminProfileForChange() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }
        
        const res = await fetch('/api/admin/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const adminIdField = document.getElementById('changeAdminId');
            if (adminIdField) {
                adminIdField.value = data.data.adminID || '';
                adminIdField.placeholder = 'Current Admin ID';
            }
        } else {
            console.error('Failed to load admin profile:', data.message);
        }
    } catch (err) {
        console.error('Error loading admin profile:', err);
        showToast('Error loading admin profile', 'error');
    }
}

async function changeAdminId(newAdminId, password) {
    if (!newAdminId || newAdminId.length < 3) {
        showToast('Admin ID must be at least 3 characters', 'error');
        return false;
    }
    
    // Validate alphanumeric only
    const validIdRegex = /^[a-zA-Z0-9_]+$/;
    if (!validIdRegex.test(newAdminId)) {
        showToast('Admin ID can only contain letters, numbers, and underscore', 'error');
        return false;
    }
    
    showLoader(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/change-admin-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newAdminId, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showToast('✅ Admin ID changed successfully! Please login again.', 'success');
            setTimeout(() => {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }, 2000);
            return true;
        } else {
            showToast(data.message || 'Failed to change Admin ID', 'error');
            return false;
        }
    } catch (err) {
        console.error('Change Admin ID error:', err);
        showToast('Error changing Admin ID: ' + (err.message || 'Server error'), 'error');
        return false;
    } finally {
        showLoader(false);
    }
}

// ============================================
// 2. SLIDER IMAGE WITH COMPRESS UPLOAD - FIXED
// ============================================
async function loadSliderImagesFromConfig() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        sliderImages = data.slides || [];
        renderSliderImages();
    } catch (err) {
        console.error('Error loading slider images:', err);
        showToast('Error loading slider images', 'error');
    }
}

function renderSliderImages() {
    const container = document.getElementById('sliderImagesContainer');
    if (!container) return;
    
    if (!sliderImages.length) {
        container.innerHTML = '<div class="text-center p-4 text-muted">No slider images added yet. Click the upload area above to add images.</div>';
        return;
    }
    
    container.innerHTML = sliderImages.map((img, index) => `
        <div class="slider-item" data-index="${index}" style="position: relative; display: inline-block; margin: 10px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <img src="${img}" style="width: 150px; height: 100px; object-fit: cover; border-radius: 12px;" onerror="this.src='https://via.placeholder.com/150x100?text=Invalid+Image'">
            <button type="button" class="btn btn-danger btn-sm remove-slider-img" data-index="${index}" style="position: absolute; top: 5px; right: 5px; border-radius: 50%; width: 28px; height: 28px; padding: 0;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Add remove event listeners
    document.querySelectorAll('.remove-slider-img').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            sliderImages.splice(index, 1);
            renderSliderImages();
            showToast('Image removed. Click "Save Changes" to update.', 'info');
        });
    });
}

async function compressAndUploadSliderImage(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxWidth = 1200;
                    const maxHeight = 800;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    let quality = 0.8;
                    let dataUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    // Reduce quality if still too large
                    while (dataUrl.length > 500000 && quality > 0.3) {
                        quality -= 0.1;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    
                    resolve(dataUrl);
                };
                img.onerror = () => {
                    // Fallback: return original data URL
                    resolve(e.target.result);
                };
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(file);
        } catch (err) {
            reject(err);
        }
    });
}

async function addNewSliderImage(file) {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file (JPG, PNG, GIF)', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }
    
    showLoader(true);
    try {
        const compressedImage = await compressAndUploadSliderImage(file);
        sliderImages.push(compressedImage);
        renderSliderImages();
        showToast('✅ Image added! Click "Save Changes" to update website.', 'success');
    } catch (err) {
        console.error('Upload error:', err);
        showToast('Error uploading image', 'error');
    } finally {
        showLoader(false);
    }
}

async function saveSliderImagesToServer() {
    if (!sliderImages.length) {
        showToast('No images to save', 'warning');
        return;
    }
    
    showLoader(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login again', 'error');
            return;
        }
        
        // First get current config to preserve other settings
        const configRes = await fetch('/api/config');
        const currentConfig = await configRes.json();
        
        // Update only slides
        const updateData = {
            logoText: currentConfig.logoText || 'BBCC',
            logoType: currentConfig.logoType || 'text',
            logoImage: currentConfig.logoImage || '',
            title: currentConfig.title || 'Bal Bharti Coaching',
            subTitle: currentConfig.subTitle || 'Excellence in Education',
            aboutText: currentConfig.aboutText || '',
            whatsapp: currentConfig.whatsapp || '',
            insta: currentConfig.insta || '',
            fb: currentConfig.fb || '',
            contactAddress: currentConfig.contactAddress || '',
            contactPhone: currentConfig.contactPhone || '',
            contactEmail: currentConfig.contactEmail || '',
            slides: sliderImages
        };
        
        const res = await fetch('/api/update-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await res.json();
        
        if (data.success) {
            showToast('✅ Slider images saved successfully!', 'success');
            // Refresh preview
            if (typeof updatePreview === 'function') updatePreview();
        } else {
            showToast(data.message || 'Save failed', 'error');
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast('Error saving slider images', 'error');
    } finally {
        showLoader(false);
    }
}

// ============================================
// 3. TESTIMONIAL MANAGEMENT - FIXED
// ============================================
async function loadAllTestimonialsForAdmin() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            // If no token, load only active testimonials
            const res = await fetch('/api/testimonials');
            const data = await res.json();
            if (data.success) {
                currentTestimonials = data.data;
                renderTestimonials();
            }
            return;
        }
        
        // Try to load all testimonials (including inactive) from admin endpoint
        try {
            const res = await fetch('/api/admin/testimonials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                currentTestimonials = data.data;
                renderTestimonials();
                return;
            }
        } catch (adminErr) {
            console.log('Admin testimonials endpoint not available, using public endpoint');
        }
        
        // Fallback: load only active testimonials
        const res = await fetch('/api/testimonials');
        const data = await res.json();
        if (data.success) {
            currentTestimonials = data.data;
            renderTestimonials();
        }
    } catch (err) {
        console.error('Error loading testimonials:', err);
        showToast('Error loading testimonials', 'error');
    }
}

function renderTestimonials() {
    const container = document.getElementById('testimonialsContainer');
    if (!container) return;
    
    if (!currentTestimonials.length) {
        container.innerHTML = '<div class="text-center p-4 text-muted">No testimonials found. Click "Add Testimonial" to create one.</div>';
        return;
    }
    
    container.innerHTML = currentTestimonials.map((t, index) => `
        <div class="testimonial-card mb-3 p-3 border rounded-3" data-index="${index}" data-id="${t._id || ''}" style="background: #f8fafc;">
            <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex gap-3">
                    ${t.image ? `<img src="${t.image}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/60?text=No+Image'">` : `<div style="width: 60px; height: 60px; background: #eef2f6; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><i class="fas fa-user fa-2x text-muted"></i></div>`}
                    <div>
                        <h6 class="mb-0 fw-bold">${escapeHtml(t.name)}</h6>
                        <small class="text-muted">${escapeHtml(t.role)}</small>
                        <div class="mt-1 text-warning">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>
                        <p class="mb-0 mt-2" style="max-width: 400px;">${escapeHtml(t.text.substring(0, 150))}${t.text.length > 150 ? '...' : ''}</p>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary edit-testimonial me-1" data-index="${index}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-testimonial" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="mt-2 d-flex align-items-center gap-3">
                <div>
                    <label class="small">Order: </label>
                    <input type="number" class="form-control form-control-sm d-inline-block w-auto testimonial-order" data-index="${index}" value="${t.order || 0}" style="width: 70px;">
                </div>
                <div>
                    <label class="small">Active: </label>
                    <input type="checkbox" class="testimonial-active" data-index="${index}" ${t.isActive ? 'checked' : ''}>
                </div>
                ${t._id ? `<span class="badge bg-secondary ms-2">ID: ${t._id.substring(0, 8)}...</span>` : '<span class="badge bg-warning ms-2">New</span>'}
            </div>
        </div>
    `).join('');
    
    // Add event listeners for order and active changes
    document.querySelectorAll('.testimonial-order').forEach(input => {
        input.removeEventListener('change', handleOrderChange);
        input.addEventListener('change', handleOrderChange);
    });
    
    document.querySelectorAll('.testimonial-active').forEach(checkbox => {
        checkbox.removeEventListener('change', handleActiveChange);
        checkbox.addEventListener('change', handleActiveChange);
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-testimonial').forEach(btn => {
        btn.removeEventListener('click', handleEditClick);
        btn.addEventListener('click', handleEditClick);
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-testimonial').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
}

function handleOrderChange(e) {
    const index = parseInt(e.target.dataset.index);
    currentTestimonials[index].order = parseInt(e.target.value) || 0;
    showToast('Order updated. Click "Save Changes" to apply.', 'info');
}

function handleActiveChange(e) {
    const index = parseInt(e.target.dataset.index);
    currentTestimonials[index].isActive = e.target.checked;
    showToast('Status updated. Click "Save Changes" to apply.', 'info');
}

function handleEditClick(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    openEditTestimonialModal(index);
}

function handleDeleteClick(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (confirm('Delete this testimonial?')) {
        currentTestimonials.splice(index, 1);
        renderTestimonials();
        showToast('Testimonial removed. Click "Save Changes" to update.', 'info');
    }
}

function openEditTestimonialModal(index) {
    const t = currentTestimonials[index];
    if (!t) return;
    
    const modalHtml = `
        <div class="modal-custom" id="editTestimonialModal">
            <div class="modal-content-custom" style="max-width: 550px;">
                <div class="modal-header-custom">
                    <h4><i class="fas fa-comment"></i> ${t._id ? 'Edit' : 'Add'} Testimonial</h4>
                    <button class="modal-close" id="closeTestimonialModal">&times;</button>
                </div>
                <div class="modal-body-custom">
                    <form id="editTestimonialForm">
                        <input type="hidden" id="testimonialId" value="${t._id || ''}">
                        <div class="mb-3">
                            <label>Name *</label>
                            <input type="text" class="form-control" id="testimonialName" value="${escapeHtml(t.name)}" required>
                        </div>
                        <div class="mb-3">
                            <label>Role *</label>
                            <select class="form-select" id="testimonialRole">
                                <option value="Student" ${t.role === 'Student' ? 'selected' : ''}>Student</option>
                                <option value="Parent" ${t.role === 'Parent' ? 'selected' : ''}>Parent</option>
                                <option value="Teacher" ${t.role === 'Teacher' ? 'selected' : ''}>Teacher</option>
                                <option value="Alumni" ${t.role === 'Alumni' ? 'selected' : ''}>Alumni</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label>Rating (1-5)</label>
                            <select class="form-select" id="testimonialRating">
                                ${[1,2,3,4,5].map(r => `<option value="${r}" ${t.rating === r ? 'selected' : ''}>${'★'.repeat(r)}${'☆'.repeat(5-r)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label>Testimonial Text *</label>
                            <textarea class="form-control" id="testimonialText" rows="4" required>${escapeHtml(t.text)}</textarea>
                        </div>
                        <div class="mb-3">
                            <label>Image URL or Upload</label>
                            <input type="text" class="form-control mb-2" id="testimonialImageUrl" placeholder="Or enter image URL" value="${escapeHtml(t.image || '')}">
                            <div class="file-upload-area" id="testimonialImageArea">
                                <i class="fas fa-camera"></i> Or click to upload image
                            </div>
                            <input type="file" id="testimonialImageFile" style="display:none" accept="image/*">
                            <input type="hidden" id="testimonialImageData" value="${t.image || ''}">
                            <div id="testimonialImagePreview" class="mt-2">
                                ${t.image ? `<img src="${t.image}" style="max-width: 100px; border-radius: 12px;" onerror="this.style.display='none'">` : '<small class="text-muted">No image</small>'}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer-custom">
                    <button class="btn-secondary-premium" id="cancelTestimonialBtn">Cancel</button>
                    <button class="btn-primary-premium" id="saveTestimonialBtn">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('editTestimonialModal');
    modal.style.display = 'block';
    
    document.getElementById('closeTestimonialModal').onclick = () => modal.remove();
    document.getElementById('cancelTestimonialBtn').onclick = () => modal.remove();
    
    // Image upload
    const area = document.getElementById('testimonialImageArea');
    const fileInput = document.getElementById('testimonialImageFile');
    const urlInput = document.getElementById('testimonialImageUrl');
    const hiddenData = document.getElementById('testimonialImageData');
    const preview = document.getElementById('testimonialImagePreview');
    
    area.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
        if (e.target.files[0]) {
            const compressed = await compressAndUploadSliderImage(e.target.files[0]);
            hiddenData.value = compressed;
            urlInput.value = '';
            preview.innerHTML = `<img src="${compressed}" style="max-width: 100px; border-radius: 12px;">`;
        }
    };
    
    urlInput.onchange = () => {
        if (urlInput.value) {
            hiddenData.value = urlInput.value;
            preview.innerHTML = `<img src="${urlInput.value}" style="max-width: 100px; border-radius: 12px;" onerror="this.style.display='none'">`;
        }
    };
    
    document.getElementById('saveTestimonialBtn').onclick = async () => {
        const updatedTestimonial = {
            name: document.getElementById('testimonialName').value,
            role: document.getElementById('testimonialRole').value,
            rating: parseInt(document.getElementById('testimonialRating').value),
            text: document.getElementById('testimonialText').value,
            image: hiddenData.value,
            order: t.order || 0,
            isActive: t.isActive !== undefined ? t.isActive : true
        };
        
        if (!updatedTestimonial.name || !updatedTestimonial.text) {
            showToast('Name and text are required', 'error');
            return;
        }
        
        // Save to server immediately
        showLoader(true);
        try {
            const token = localStorage.getItem('token');
            let url = '/api/testimonials';
            let method = 'POST';
            
            if (t._id) {
                url = `/api/testimonials/${t._id}`;
                method = 'PUT';
            }
            
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedTestimonial)
            });
            
            const data = await res.json();
            
            if (data.success) {
                showToast('✅ Testimonial saved successfully!', 'success');
                modal.remove();
                await loadAllTestimonialsForAdmin(); // Reload all testimonials
            } else {
                showToast(data.message || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save error:', err);
            showToast('Error saving testimonial', 'error');
        } finally {
            showLoader(false);
        }
    };
}

async function saveTestimonialsToServer() {
    if (!currentTestimonials.length) {
        showToast('No testimonials to save', 'warning');
        return;
    }
    
    showLoader(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login again', 'error');
            return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const testimonial of currentTestimonials) {
            try {
                let url = '/api/testimonials';
                let method = 'POST';
                
                if (testimonial._id) {
                    url = `/api/testimonials/${testimonial._id}`;
                    method = 'PUT';
                }
                
                const res = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(testimonial)
                });
                
                const data = await res.json();
                if (data.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                errorCount++;
            }
        }
        
        if (errorCount === 0) {
            showToast(`✅ All ${successCount} testimonials saved successfully!`, 'success');
        } else {
            showToast(`✅ ${successCount} saved, ${errorCount} failed`, 'warning');
        }
        
        await loadAllTestimonialsForAdmin();
        
    } catch (err) {
        console.error('Save error:', err);
        showToast('Error saving testimonials', 'error');
    } finally {
        showLoader(false);
    }
}

function addNewTestimonial() {
    const newTestimonial = {
        name: 'New Testimonial',
        role: 'Student',
        rating: 5,
        text: 'Write your testimonial here...',
        image: '',
        order: currentTestimonials.length,
        isActive: true
    };
    currentTestimonials.push(newTestimonial);
    renderTestimonials();
    // Open edit for the new one
    setTimeout(() => {
        const editBtn = document.querySelector(`.edit-testimonial[data-index="${currentTestimonials.length - 1}"]`);
        if (editBtn) editBtn.click();
    }, 100);
}

// ============================================
// 4. SETUP EVENT LISTENERS - FIXED
// ============================================
function setupEventListeners() {
    // Change Admin ID button
    const changeIdBtn = document.getElementById('changeAdminIdBtn');
    if (changeIdBtn) {
        changeIdBtn.removeEventListener('click', changeIdBtn._listener);
        changeIdBtn._listener = async () => {
            const newAdminId = document.getElementById('changeAdminId').value;
            const password = document.getElementById('adminPasswordForIdChange').value;
            if (!password) {
                showToast('Please enter your password to confirm', 'warning');
                return;
            }
            await changeAdminId(newAdminId, password);
        };
        changeIdBtn.addEventListener('click', changeIdBtn._listener);
    }
    
    // Add slider image button and upload area
    const addSliderBtn = document.getElementById('addSliderImageBtn');
    const uploadArea = document.getElementById('sliderImageUploadArea');
    
    const handleSliderClick = () => {
        document.getElementById('sliderImageFile').click();
    };
    
    if (addSliderBtn) {
        addSliderBtn.removeEventListener('click', handleSliderClick);
        addSliderBtn.addEventListener('click', handleSliderClick);
    }
    
    if (uploadArea) {
        uploadArea.removeEventListener('click', handleSliderClick);
        uploadArea.addEventListener('click', handleSliderClick);
    }
    
    const sliderFileInput = document.getElementById('sliderImageFile');
    if (sliderFileInput) {
        sliderFileInput.removeEventListener('change', sliderFileInput._listener);
        sliderFileInput._listener = (e) => {
            if (e.target.files && e.target.files[0]) {
                addNewSliderImage(e.target.files[0]);
            }
            sliderFileInput.value = '';
        };
        sliderFileInput.addEventListener('change', sliderFileInput._listener);
    }
    
    // Save slider images button
    const saveSliderBtn = document.getElementById('saveSliderImagesBtn');
    if (saveSliderBtn) {
        saveSliderBtn.removeEventListener('click', saveSliderBtn._listener);
        saveSliderBtn._listener = saveSliderImagesToServer;
        saveSliderBtn.addEventListener('click', saveSliderBtn._listener);
    }
    
    // Add testimonial button
    const addTestimonialBtn = document.getElementById('addTestimonialBtn');
    if (addTestimonialBtn) {
        addTestimonialBtn.removeEventListener('click', addTestimonialBtn._listener);
        addTestimonialBtn._listener = addNewTestimonial;
        addTestimonialBtn.addEventListener('click', addTestimonialBtn._listener);
    }
    
    // Save testimonials button
    const saveTestimonialsBtn = document.getElementById('saveTestimonialsBtn');
    if (saveTestimonialsBtn) {
        saveTestimonialsBtn.removeEventListener('click', saveTestimonialsBtn._listener);
        saveTestimonialsBtn._listener = saveTestimonialsToServer;
        saveTestimonialsBtn.addEventListener('click', saveTestimonialsBtn._listener);
    }
    
    // Reset button
    const resetAdvanceBtn = document.getElementById('resetAdvanceBtn');
    if (resetAdvanceBtn) {
        resetAdvanceBtn.removeEventListener('click', resetAdvanceBtn._listener);
        resetAdvanceBtn._listener = () => {
            if (confirm('Reset all changes? Unsaved changes will be lost.')) {
                loadAdminProfileForChange();
                loadSliderImagesFromConfig();
                loadAllTestimonialsForAdmin();
                showToast('Reset complete', 'success');
            }
        };
        resetAdvanceBtn.addEventListener('click', resetAdvanceBtn._listener);
    }
    
    // Refresh slider button
    const refreshSliderBtn = document.getElementById('refreshSliderBtn');
    if (refreshSliderBtn) {
        refreshSliderBtn.removeEventListener('click', refreshSliderBtn._listener);
        refreshSliderBtn._listener = loadSliderImagesFromConfig;
        refreshSliderBtn.addEventListener('click', refreshSliderBtn._listener);
    }
    
    // Password toggle
    document.querySelectorAll('.toggle-pass').forEach(icon => {
        icon.removeEventListener('click', icon._listener);
        icon._listener = function() {
            const input = this.previousElementSibling;
            if (input && input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else if (input) {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        };
        icon.addEventListener('click', icon._listener);
    });
}

// ============================================
// 5. RENDER ADVANCE WEBSITE TAB HTML - FIXED
// ============================================
function renderAdvanceWebsiteTab() {
    const advanceTabHtml = `
        <div class="premium-card">
            <div class="card-header">
                <h3><i class="fas fa-crown"></i> Advance Website Settings</h3>
            </div>
            <div class="card-body">
                <!-- Admin ID Change Section -->
                <div class="form-section">
                    <div class="form-section-title">
                        <i class="fas fa-user-edit"></i> Change Admin ID
                    </div>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label>New Admin ID</label>
                            <input type="text" class="form-control" id="changeAdminId" placeholder="Enter new admin ID" minlength="3">
                            <small class="text-muted">Minimum 3 characters (letters, numbers, underscore only). You'll need to login again after change.</small>
                        </div>
                        <div class="col-md-6">
                            <label>Confirm with Password</label>
                            <div class="position-relative">
                                <input type="password" class="form-control" id="adminPasswordForIdChange" placeholder="Enter your current password">
                                <i class="fas fa-eye toggle-pass position-absolute" style="right: 16px; top: 50%; transform: translateY(-50%); cursor: pointer;"></i>
                            </div>
                        </div>
                        <div class="col-12">
                            <button class="btn-primary-premium" id="changeAdminIdBtn">
                                <i class="fas fa-key"></i> Change Admin ID
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Slider Images with Compress Upload -->
                <div class="form-section">
                    <div class="form-section-title">
                        <i class="fas fa-images"></i> Slider Images (Auto Compress)
                    </div>
                    <div class="row g-3">
                        <div class="col-12">
                            <div class="file-upload-area" id="sliderImageUploadArea" style="cursor: pointer;">
                                <i class="fas fa-cloud-upload-alt fa-2x"></i>
                                <p class="mb-0">Click to upload slider image (Auto compressed)</p>
                                <small class="text-muted">Supports JPG, PNG, GIF. Max 5MB. Images are automatically compressed to reduce size.</small>
                            </div>
                            <input type="file" id="sliderImageFile" style="display:none" accept="image/*">
                        </div>
                        <div class="col-12">
                            <div id="sliderImagesContainer" class="d-flex flex-wrap gap-2"></div>
                        </div>
                        <div class="col-12">
                            <button class="btn-primary-premium me-2" id="saveSliderImagesBtn">
                                <i class="fas fa-save"></i> Save Slider Changes
                            </button>
                            <button class="btn-secondary-premium" id="refreshSliderBtn">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Testimonial Management -->
                <div class="form-section">
                    <div class="form-section-title">
                        <i class="fas fa-comments"></i> Testimonials Management
                    </div>
                    <div class="row g-3">
                        <div class="col-12">
                            <div id="testimonialsContainer"></div>
                        </div>
                        <div class="col-12">
                            <button class="btn-primary-premium me-2" id="addTestimonialBtn">
                                <i class="fas fa-plus-circle"></i> Add New Testimonial
                            </button>
                            <button class="btn-primary-premium me-2" id="saveTestimonialsBtn">
                                <i class="fas fa-save"></i> Save All Testimonials
                            </button>
                            <button class="btn-secondary-premium" id="resetAdvanceBtn">
                                <i class="fas fa-undo-alt"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return advanceTabHtml;
}

// ============================================
// 6. INTEGRATION WITH MAIN DASHBOARD
// ============================================
function integrateAdvanceWebsiteTab() {
    // Wait for DOM to be fully loaded
    const checkElements = setInterval(() => {
        const desktopTabs = document.querySelector('.tabs-container.d-none.d-md-flex');
        const bottomNav = document.querySelector('.bottom-nav.d-md-none');
        const tabContents = document.getElementById('tabContents');
        
        if (desktopTabs && bottomNav && tabContents) {
            clearInterval(checkElements);
            
            // Check if advance tab already exists
            if (document.querySelector('.tab-btn[data-tab="advance"]')) return;
            
            // Add advance tab to desktop
            const advanceTabBtn = document.createElement('button');
            advanceTabBtn.className = 'tab-btn';
            advanceTabBtn.setAttribute('data-tab', 'advance');
            advanceTabBtn.innerHTML = '<i class="fas fa-cog"></i> Advance Website';
            desktopTabs.appendChild(advanceTabBtn);
            
            // Add advance tab to mobile bottom nav
            const advanceMobileBtn = document.createElement('div');
            advanceMobileBtn.className = 'bottom-nav-item';
            advanceMobileBtn.setAttribute('data-tab', 'advance');
            advanceMobileBtn.innerHTML = '<i class="fas fa-cog"></i><span>Advance</span>';
            bottomNav.appendChild(advanceMobileBtn);
            
            // Create advance pane
            const advancePane = document.createElement('div');
            advancePane.id = 'advancePane';
            advancePane.className = 'tab-pane';
            advancePane.style.display = 'none';
            advancePane.innerHTML = renderAdvanceWebsiteTab();
            tabContents.appendChild(advancePane);
            
            // Add click handlers for new tabs
            document.querySelectorAll('.tab-btn, .bottom-nav-item').forEach(el => {
                if (el.getAttribute('data-tab') === 'advance') {
                    el.addEventListener('click', () => {
                        if (typeof window.switchTab === 'function') {
                            window.switchTab('advance');
                        } else {
                            // Manual tab switch
                            document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
                            document.getElementById('advancePane').style.display = 'block';
                            document.querySelectorAll('.tab-btn').forEach(btn => {
                                btn.classList.toggle('active', btn.getAttribute('data-tab') === 'advance');
                            });
                            document.querySelectorAll('.bottom-nav-item').forEach(item => {
                                item.classList.toggle('active', item.getAttribute('data-tab') === 'advance');
                            });
                            setTimeout(() => initAdvanceWebsiteTab(), 100);
                        }
                    });
                }
            });
            
            // Override switchTab if exists
            if (typeof window.switchTab === 'function') {
                const originalSwitchTab = window.switchTab;
                window.switchTab = function(tabId) {
                    originalSwitchTab(tabId);
                    if (tabId === 'advance') {
                        setTimeout(() => initAdvanceWebsiteTab(), 100);
                    }
                };
            }
            
            console.log('✅ Advance Website Tab integrated successfully!');
        }
    }, 100);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.initAdvanceWebsiteTab = initAdvanceWebsiteTab;
window.integrateAdvanceWebsiteTab = integrateAdvanceWebsiteTab;
window.renderAdvanceWebsiteTab = renderAdvanceWebsiteTab;
window.addNewSliderImage = addNewSliderImage;
window.saveSliderImagesToServer = saveSliderImagesToServer;
window.changeAdminId = changeAdminId;
window.saveTestimonialsToServer = saveTestimonialsToServer;
window.addNewTestimonial = addNewTestimonial;
window.loadAllTestimonialsForAdmin = loadAllTestimonialsForAdmin;

// Auto-integrate when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrateAdvanceWebsiteTab);
} else {
    integrateAdvanceWebsiteTab();
}
