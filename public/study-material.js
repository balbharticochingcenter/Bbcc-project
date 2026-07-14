// ============================================
// STUDY MATERIAL MANAGEMENT - COMPLETE
// ============================================

// ===== STATE =====
let videos = [];
let notes = [];
let editingVideoId = null;
let editingNoteId = null;

// ============================================
// INIT STUDY MATERIAL
// ============================================
function initStudyMaterial() {
    const container = document.getElementById('studyMaterialApp');
    if (!container) return;
    
    container.innerHTML = `
        <div class="sub-tabs">
            <button class="sub-tab-btn active" data-subtab="videos" onclick="switchStudyTab('videos')">
                🎬 Videos
            </button>
            <button class="sub-tab-btn" data-subtab="notes" onclick="switchStudyTab('notes')">
                📄 PDF Notes
            </button>
        </div>

        <!-- ===== VIDEOS TAB ===== -->
        <div class="sub-tab-content active" id="subtab-videos">
            <!-- Add Video Form -->
            <div class="card">
                <div class="card-title">
                    <span class="icon">🎬</span>
                    <span id="videoFormTitle">Add New Video</span>
                </div>
                <form id="videoForm" onsubmit="saveVideo(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Video Thumbnail</label>
                            <div class="image-upload" onclick="document.getElementById('videoThumbInput').click()">
                                <div class="preview" id="videoThumbPreview">
                                    <img src="" alt="Thumbnail" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:8px;" id="videoThumbImg">
                                    <span id="videoThumbPlaceholder" style="font-size:40px;">🖼️</span>
                                </div>
                                <div class="hint">Click to upload thumbnail (JPG, PNG)</div>
                                <input type="file" id="videoThumbInput" accept="image/*" onchange="handleVideoThumb(event)">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Video Title *</label>
                            <input type="text" id="videoTitle" placeholder="Enter video title" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Video Link *</label>
                        <input type="url" id="videoLink" placeholder="https://youtube.com/watch?v=..." required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="videoDescription" rows="2" placeholder="Enter video description"></textarea>
                    </div>
                    <input type="hidden" id="editVideoId" value="">
                    <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;">
                        ✅ Add Video
                    </button>
                </form>
            </div>

            <!-- Video List -->
            <div class="card">
                <div class="card-title">
                    <span class="icon">📹</span>
                    Video List
                    <span id="videoCount" style="font-size:14px;color:#888;font-weight:normal;"></span>
                </div>
                <div id="videoListContainer">
                    <div class="text-center" style="padding:30px;color:#888;">No videos added yet</div>
                </div>
            </div>
        </div>

        <!-- ===== NOTES TAB ===== -->
        <div class="sub-tab-content" id="subtab-notes">
            <!-- Add PDF Note Form -->
            <div class="card">
                <div class="card-title">
                    <span class="icon">📄</span>
                    <span id="noteFormTitle">Add New PDF Note</span>
                </div>
                <form id="noteForm" onsubmit="saveNote(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>PDF File *</label>
                            <div class="image-upload" onclick="document.getElementById('notePdfInput').click()">
                                <div class="preview" id="notePdfPreview">
                                    <span id="notePdfPlaceholder" style="font-size:40px;">📄</span>
                                    <span id="notePdfName" style="display:none;font-size:14px;color:#667eea;font-weight:600;"></span>
                                </div>
                                <div class="hint">Click to upload PDF file (Max 5MB)</div>
                                <input type="file" id="notePdfInput" accept=".pdf" onchange="handleNotePdf(event)">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes Title *</label>
                            <input type="text" id="noteTitle" placeholder="Enter notes title" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="noteDescription" rows="2" placeholder="Enter notes description"></textarea>
                    </div>
                    <input type="hidden" id="editNoteId" value="">
                    <button type="submit" class="btn btn-success" style="width:100%;padding:12px;">
                        📄 Add PDF Note
                    </button>
                </form>
            </div>

            <!-- Notes List -->
            <div class="card">
                <div class="card-title">
                    <span class="icon">📚</span>
                    PDF Notes List
                    <span id="noteCount" style="font-size:14px;color:#888;font-weight:normal;"></span>
                </div>
                <div id="noteListContainer">
                    <div class="text-center" style="padding:30px;color:#888;">No PDF notes added yet</div>
                </div>
            </div>
        </div>
    `;
    
    loadStudyMaterial();
}

// ============================================
// SWITCH STUDY TAB
// ============================================
function switchStudyTab(tab) {
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-subtab="${tab}"]`).classList.add('active');
    document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`subtab-${tab}`).classList.add('active');
}

// ============================================
// VIDEO THUMBNAIL HANDLER
// ============================================
function handleVideoThumb(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    compressImage(file, 50, function(compressedBase64) {
        document.getElementById('videoThumbImg').src = compressedBase64;
        document.getElementById('videoThumbImg').style.display = 'block';
        document.getElementById('videoThumbPlaceholder').style.display = 'none';
        showToast('Thumbnail uploaded successfully!');
    });
}

// ============================================
// PDF NOTE HANDLER
// ============================================
function handleNotePdf(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        showToast('Please upload a PDF file', true);
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('PDF file must be less than 5MB', true);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        document.getElementById('notePdfName').textContent = file.name;
        document.getElementById('notePdfName').style.display = 'block';
        document.getElementById('notePdfPlaceholder').style.display = 'none';
        document.getElementById('notePdfPreview').dataset.pdfBase64 = base64;
        showToast('PDF uploaded successfully!');
    };
    reader.readAsDataURL(file);
}

// ============================================
// COMPRESS IMAGE
// ============================================
function compressImage(file, maxSizeKB, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let quality = 0.9;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = img.width;
            let height = img.height;
            
            // Max dimensions for thumbnail
            const maxDimension = 320;
            if (width > maxDimension || height > maxDimension) {
                const ratio = Math.min(maxDimension / width, maxDimension / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            let base64 = canvas.toDataURL('image/jpeg', quality);
            
            while (base64.length / 1024 > maxSizeKB && quality > 0.1) {
                quality -= 0.1;
                base64 = canvas.toDataURL('image/jpeg', quality);
            }
            
            callback(base64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ============================================
// LOAD STUDY MATERIAL
// ============================================
async function loadStudyMaterial() {
    try {
        const data = await apiCall('/api/study-material');
        if (data.success) {
            videos = data.data.videos || [];
            notes = data.data.notes || [];
            renderVideos(videos);
            renderNotes(notes);
            updateCounts();
        }
    } catch (error) {
        showToast('Error loading study material', true);
    }
}

// ============================================
// RENDER VIDEOS
// ============================================
function renderVideos(videoList) {
    const container = document.getElementById('videoListContainer');
    if (!container) return;
    
    if (!videoList || videoList.length === 0) {
        container.innerHTML = '<div class="text-center" style="padding:30px;color:#888;">📹 No videos added yet</div>';
        return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">';
    
    for (let i = 0; i < videoList.length; i++) {
        const v = videoList[i];
        html += `
            <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);transition:all 0.3s ease;border:1px solid #f0f0f0;">
                <div style="position:relative;padding-top:56.25%;background:#0b0e1a;">
                    ${v.thumbnail ? `<img src="${v.thumbnail}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">` : 
                    `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;">🎬</div>`}
                    <a href="${v.link}" target="_blank" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;background:rgba(255,0,0,0.8);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;text-decoration:none;transition:all 0.3s ease;border:3px solid white;box-shadow:0 0 30px rgba(0,0,0,0.3);"
                        onmouseover="this.style.transform='translate(-50%,-50%) scale(1.1)'" 
                        onmouseout="this.style.transform='translate(-50%,-50%) scale(1)'">
                        ▶
                    </a>
                </div>
                <div style="padding:15px;">
                    <h4 style="font-size:16px;color:#333;margin-bottom:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${v.title || 'Untitled'}</h4>
                    ${v.description ? `<p style="font-size:13px;color:#888;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;">${v.description}</p>` : ''}
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:11px;color:#aaa;">${v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''}</span>
                        <button class="btn-sm btn-danger" onclick="deleteVideo('${v._id || i}')">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// RENDER NOTES
// ============================================
function renderNotes(noteList) {
    const container = document.getElementById('noteListContainer');
    if (!container) return;
    
    if (!noteList || noteList.length === 0) {
        container.innerHTML = '<div class="text-center" style="padding:30px;color:#888;">📄 No PDF notes added yet</div>';
        return;
    }
    
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">';
    
    for (let i = 0; i < noteList.length; i++) {
        const n = noteList[i];
        html += `
            <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);transition:all 0.3s ease;border:1px solid #f0f0f0;">
                <div style="padding:20px;text-align:center;background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                    <div style="font-size:48px;margin-bottom:5px;">📄</div>
                    <a href="${n.pdf}" target="_blank" style="color:#667eea;font-weight:600;text-decoration:none;font-size:14px;">📥 View PDF</a>
                </div>
                <div style="padding:15px;">
                    <h4 style="font-size:16px;color:#333;margin-bottom:5px;">${n.title || 'Untitled'}</h4>
                    ${n.description ? `<p style="font-size:13px;color:#888;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;">${n.description}</p>` : ''}
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:11px;color:#aaa;">${n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</span>
                        <button class="btn-sm btn-danger" onclick="deleteNote('${n._id || i}')">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// UPDATE COUNTS
// ============================================
function updateCounts() {
    const videoCount = document.getElementById('videoCount');
    const noteCount = document.getElementById('noteCount');
    if (videoCount) videoCount.textContent = `(${videos.length} videos)`;
    if (noteCount) noteCount.textContent = `(${notes.length} notes)`;
}

// ============================================
// SAVE VIDEO
// ============================================
async function saveVideo(event) {
    event.preventDefault();
    
    const editId = document.getElementById('editVideoId').value;
    const title = document.getElementById('videoTitle').value.trim();
    const link = document.getElementById('videoLink').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const thumbnail = document.getElementById('videoThumbImg').src || '';
    
    if (!title) { showToast('Please enter video title', true); return; }
    if (!link) { showToast('Please enter video link', true); return; }
    
    const data = { title, link, description, thumbnail };
    
    try {
        let response;
        if (editId) {
            response = await apiCall('/api/study-material/video/' + editId, {
                method: 'PUT',
                body: data
            });
        } else {
            response = await apiCall('/api/study-material/video', {
                method: 'POST',
                body: data
            });
        }
        
        if (response.success) {
            showToast(editId ? 'Video updated!' : 'Video added!');
            resetVideoForm();
            loadStudyMaterial();
        } else {
            showToast(response.message || 'Failed to save video', true);
        }
    } catch (error) {
        showToast('Error saving video', true);
    }
}

// ============================================
// SAVE NOTE
// ============================================
async function saveNote(event) {
    event.preventDefault();
    
    const editId = document.getElementById('editNoteId').value;
    const title = document.getElementById('noteTitle').value.trim();
    const description = document.getElementById('noteDescription').value.trim();
    const pdf = document.getElementById('notePdfPreview').dataset.pdfBase64 || '';
    
    if (!title) { showToast('Please enter notes title', true); return; }
    if (!pdf) { showToast('Please upload a PDF file', true); return; }
    
    const data = { title, description, pdf };
    
    try {
        let response;
        if (editId) {
            response = await apiCall('/api/study-material/note/' + editId, {
                method: 'PUT',
                body: data
            });
        } else {
            response = await apiCall('/api/study-material/note', {
                method: 'POST',
                body: data
            });
        }
        
        if (response.success) {
            showToast(editId ? 'Note updated!' : 'Note added!');
            resetNoteForm();
            loadStudyMaterial();
        } else {
            showToast(response.message || 'Failed to save note', true);
        }
    } catch (error) {
        showToast('Error saving note', true);
    }
}

// ============================================
// DELETE VIDEO
// ============================================
async function deleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
        const data = await apiCall('/api/study-material/video/' + id, {
            method: 'DELETE'
        });
        
        if (data.success) {
            showToast('Video deleted!');
            loadStudyMaterial();
        } else {
            showToast('Failed to delete video', true);
        }
    } catch (error) {
        showToast('Error deleting video', true);
    }
}

// ============================================
// DELETE NOTE
// ============================================
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this PDF note?')) return;
    
    try {
        const data = await apiCall('/api/study-material/note/' + id, {
            method: 'DELETE'
        });
        
        if (data.success) {
            showToast('Note deleted!');
            loadStudyMaterial();
        } else {
            showToast('Failed to delete note', true);
        }
    } catch (error) {
        showToast('Error deleting note', true);
    }
}

// ============================================
// RESET FORMS
// ============================================
function resetVideoForm() {
    document.getElementById('videoForm').reset();
    document.getElementById('editVideoId').value = '';
    document.getElementById('videoThumbImg').src = '';
    document.getElementById('videoThumbImg').style.display = 'none';
    document.getElementById('videoThumbPlaceholder').style.display = 'block';
    document.getElementById('videoFormTitle').textContent = 'Add New Video';
    document.querySelector('#videoForm button[type="submit"]').textContent = '✅ Add Video';
}

function resetNoteForm() {
    document.getElementById('noteForm').reset();
    document.getElementById('editNoteId').value = '';
    document.getElementById('notePdfPlaceholder').style.display = 'block';
    document.getElementById('notePdfName').style.display = 'none';
    document.getElementById('notePdfPreview').dataset.pdfBase64 = '';
    document.getElementById('noteFormTitle').textContent = 'Add New PDF Note';
    document.querySelector('#noteForm button[type="submit"]').textContent = '📄 Add PDF Note';
}
