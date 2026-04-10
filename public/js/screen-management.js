// screen-management.js - Helper functions for screen management

// Image compression using browser-image-compression
async function compressImage(file, maxSizeMB = 0.5) {
    const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 800,
        useWebWorker: true,
    };
    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('Compression error:', error);
        return file;
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Load all screen data
async function loadScreenData() {
    try {
        const response = await fetch('/api/screen');
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
    } catch (error) {
        console.error('Error loading screen data:', error);
    }
    return null;
}

// Update screen settings
async function updateScreenSettings(formData) {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/screen', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    return await response.json();
}

// Delete gallery item
async function deleteGalleryItem(id) {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/screen/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
}

// Add video link to gallery
async function addVideoLinkToGallery(videoUrl) {
    const formData = new FormData();
    formData.append('videoLinks', JSON.stringify([{ url: videoUrl }]));
    return await updateScreenSettings(formData);
}
