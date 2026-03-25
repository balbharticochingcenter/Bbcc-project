// ============================================
// ENQUIRY & DEMO VIDEO MODULE FOR ADMIN DASHBOARD
// ============================================

class EnquiryVideoAdminModule {
    constructor() {
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
        this.videoChart = null;
        this.enquiryChart = null;
        this.init();
    }

    init() {
        this.injectStyles();
        this.addVideoSectionToWebsiteTab();
        this.addEnquirySectionToStudentsTab();
        this.loadVideos();
        this.loadEnquiries();
        this.setupEventListeners();
    }

    injectStyles() {
        const styles = `
            <style>
                /* Video Section Styles */
                .video-management-card {
                    background: var(--card-bg, white);
                    border-radius: 24px;
                    overflow: hidden;
                    margin-bottom: 24px;
                    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.04));
                }
                .video-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    padding: 20px;
                }
                .video-card {
                    background: var(--bg-secondary, #f8fafc);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s;
                    cursor: pointer;
                    border: 1px solid var(--border-color, #e2e8f0);
                }
                .video-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.12));
                }
                .video-thumbnail {
                    width: 100%;
                    height: 160px;
                    object-fit: cover;
                    background: #f0f0f0;
                }
                .video-info {
                    padding: 12px 15px;
                }
                .video-title {
                    font-weight: 700;
                    font-size: 0.95rem;
                    margin-bottom: 6px;
                    color: var(--text-primary, #333);
                }
                .video-meta {
                    font-size: 0.7rem;
                    color: var(--text-secondary, #666);
                    display: flex;
                    justify-content: space-between;
                }
                .video-actions {
                    padding: 10px 15px;
                    border-top: 1px solid var(--border-color, #e2e8f0);
                    display: flex;
                    gap: 8px;
                }
                .video-actions button {
                    flex: 1;
                    padding: 6px;
                    border-radius: 30px;
                    font-size: 0.7rem;
                }
                
                /* Video Player Modal */
                .video-player-modal-custom {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    z-index: 10010;
                    display: none;
                    justify-content: center;
                    align-items: center;
                }
                .video-player-modal-custom.open {
                    display: flex;
                }
                .video-player-container-custom {
                    width: 90%;
                    max-width: 1000px;
                    background: #000;
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                }
                .video-player-container-custom iframe,
                .video-player-container-custom video {
                    width: 100%;
                    height: 500px;
                    border: none;
                }
                .close-video-custom {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    background: white;
                    border: none;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                }
                @media (max-width: 768px) {
                    .video-player-container-custom iframe,
                    .video-player-container-custom video {
                        height: 300px;
                    }
                }
                
                /* Enquiry Section Styles */
                .enquiry-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .enquiry-stat-card {
                    background: var(--bg-secondary, #f8fafc);
                    border-radius: 20px;
                    padding: 15px;
                    text-align: center;
                    border: 1px solid var(--border-color, #e2e8f0);
                }
                .enquiry-stat-number {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: var(--primary, #4361ee);
                }
                .enquiry-stat-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary, #666);
                }
                .enquiry-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .enquiry-table th,
                .enquiry-table td {
                    padding: 12px;
                    border-bottom: 1px solid var(--border-color, #e2e8f0);
                    vertical-align: middle;
                }
                .enquiry-table th {
                    background: var(--bg-secondary, #f8fafc);
                    font-weight: 700;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .status-pending { background: #fff3cd; color: #856404; }
                .status-contacted { background: #cce5ff; color: #004085; }
                .status-followup { background: #ffe5b4; color: #b45f06; }
                .status-admitted { background: #d4edda; color: #155724; }
                .status-not_interested { background: #f8d7da; color: #721c24; }
                .status-spam { background: #e2e3e5; color: #383d41; }
                
                .priority-high { background: #ffcccc; color: #cc0000; }
                .priority-urgent { background: #ff6666; color: white; }
                
                .enquiry-filter-bar {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                }
                .enquiry-filter-bar select,
                .enquiry-filter-bar input {
                    padding: 8px 15px;
                    border-radius: 30px;
                    border: 1px solid var(--border-color, #ddd);
                    background: var(--bg-primary, white);
                }
                .enquiry-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .enquiry-tab-btn {
                    padding: 8px 20px;
                    border-radius: 30px;
                    background: var(--bg-secondary, #f8fafc);
                    border: 1px solid var(--border-color, #e2e8f0);
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .enquiry-tab-btn.active {
                    background: var(--gradient-primary, linear-gradient(135deg, #4361ee, #7209b7));
                    color: white;
                    border-color: transparent;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // ============================================
    // VIDEO SECTION - WEBSITE TAB
    // ============================================
    addVideoSectionToWebsiteTab() {
        const websitePane = document.getElementById('websitePane');
        if (!websitePane) return;

        // Check if already added
        if (document.getElementById('videoManagementSection')) return;

        const videoSection = document.createElement('div');
        videoSection.id = 'videoManagementSection';
        videoSection.className = 'premium-card mt-4';
        videoSection.innerHTML = `
            <div class="card-header">
                <h3><i class="fas fa-video me-2"></i> Demo Video Management</h3>
                <div>
                    <button class="btn-primary-premium" id="addVideoBtn" style="padding: 8px 16px;">
                        <i class="fas fa-plus"></i> Add Video
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="videoSearch" class="form-control" placeholder="Search videos...">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <select id="videoCategoryFilter" class="form-select">
                            <option value="all">All Categories</option>
                            <option value="demo">Demo Classes</option>
                            <option value="intro">Introduction</option>
                            <option value="tutorial">Tutorials</option>
                            <option value="success">Success Stories</option>
                        </select>
                    </div>
                </div>
                <div id="videosGridContainer" class="video-grid">
                    <div class="text-center py-5">
                        <i class="fas fa-spinner fa-pulse fa-2x"></i>
                        <p class="mt-2">Loading videos...</p>
                    </div>
                </div>
            </div>
        `;

        // Insert after website form
        const websiteForm = websitePane.querySelector('.premium-card');
        if (websiteForm) {
            websiteForm.insertAdjacentElement('afterend', videoSection);
        } else {
            websitePane.appendChild(videoSection);
        }

        // Add Video Modal
        this.createVideoModal();
    }

    createVideoModal() {
        const modalHtml = `
            <div class="modal-custom" id="videoModal" style="display: none;">
                <div class="modal-content-custom" style="max-width: 600px;">
                    <div class="modal-header-custom">
                        <h4 id="videoModalTitle"><i class="fas fa-video"></i> Add New Video</h4>
                        <button class="modal-close" id="closeVideoModal">&times;</button>
                    </div>
                    <div class="modal-body-custom">
                        <form id="videoForm">
                            <div class="mb-3">
                                <label class="fw-bold">Video Title *</label>
                                <input type="text" id="videoTitle" class="form-control" required placeholder="Enter video title">
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Video Source *</label>
                                <select id="videoSource" class="form-select">
                                    <option value="youtube">YouTube</option>
                                    <option value="vimeo">Vimeo</option>
                                    <option value="mp4">Direct MP4 URL</option>
                                    <option value="embed">Embed Code</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Video URL *</label>
                                <input type="text" id="videoUrl" class="form-control" placeholder="https://youtube.com/watch?v=...">
                                <small class="text-muted">YouTube, Vimeo, or direct video URL</small>
                            </div>
                            <div class="mb-3" id="embedCodeDiv" style="display: none;">
                                <label class="fw-bold">Embed Code</label>
                                <textarea id="embedCode" class="form-control" rows="3" placeholder="<iframe src='...'></iframe>"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Thumbnail URL (Optional)</label>
                                <input type="text" id="videoThumbnail" class="form-control" placeholder="https://...">
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Category</label>
                                <select id="videoCategory" class="form-select">
                                    <option value="demo">Demo Classes</option>
                                    <option value="intro">Introduction</option>
                                    <option value="tutorial">Tutorials</option>
                                    <option value="success">Success Stories</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Description</label>
                                <textarea id="videoDescription" class="form-control" rows="2" placeholder="Video description..."></textarea>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="fw-bold">Order</label>
                                    <input type="number" id="videoOrder" class="form-control" value="0">
                                </div>
                                <div class="col-md-6">
                                    <label class="fw-bold">Status</label>
                                    <select id="videoStatus" class="form-select">
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-check mb-3">
                                <input type="checkbox" id="videoFeatured" class="form-check-input">
                                <label class="form-check-label">Feature this video (show on homepage)</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer-custom">
                        <button class="btn-secondary-premium" id="cancelVideoBtn">Cancel</button>
                        <button class="btn-primary-premium" id="saveVideoBtn">Save Video</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show/hide embed code field
        document.getElementById('videoSource').addEventListener('change', (e) => {
            const embedDiv = document.getElementById('embedCodeDiv');
            embedDiv.style.display = e.target.value === 'embed' ? 'block' : 'none';
            if (e.target.value === 'embed') {
                document.getElementById('videoUrl').placeholder = 'Optional for embed';
            } else {
                document.getElementById('videoUrl').placeholder = 'https://youtube.com/watch?v=...';
            }
        });
    }

    async loadVideos() {
        try {
            const res = await fetch('/api/admin/videos', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            if (data.success) {
                this.renderVideos(data.data);
            } else {
                this.renderDefaultVideos();
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.renderDefaultVideos();
        }
    }

    renderVideos(videos) {
        const container = document.getElementById('videosGridContainer');
        if (!container) return;

        if (!videos || videos.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-video-slash fa-3x text-muted"></i>
                    <p class="mt-3">No videos added yet. Click "Add Video" to get started.</p>
                </div>
            `;
            return;
        }

        const searchTerm = document.getElementById('videoSearch')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('videoCategoryFilter')?.value || 'all';

        let filteredVideos = videos.filter(v => {
            const matchesSearch = v.title.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        container.innerHTML = filteredVideos.map(video => `
            <div class="video-card" data-video-id="${video._id}">
                <img class="video-thumbnail" src="${this.getVideoThumbnail(video)}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/280x160?text=No+Thumbnail'">
                <div class="video-info">
                    <div class="video-title">${this.escapeHtml(video.title)}</div>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                        <span class="badge bg-secondary">${video.category || 'general'}</span>
                        <span class="badge ${video.isActive ? 'bg-success' : 'bg-danger'}">${video.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    ${video.featured ? '<span class="badge bg-warning text-dark"><i class="fas fa-star"></i> Featured</span>' : ''}
                </div>
                <div class="video-actions">
                    <button class="btn btn-sm btn-outline-primary play-video" data-id="${video._id}" data-url="${this.getEmbedUrl(video)}" data-title="${video.title}">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="btn btn-sm btn-outline-warning edit-video" data-id="${video._id}" data-video='${JSON.stringify(video)}'>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-video" data-id="${video._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.attachVideoEvents();
    }

    renderDefaultVideos() {
        const container = document.getElementById('videosGridContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="video-card">
                <img class="video-thumbnail" src="https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg" alt="Sample Video">
                <div class="video-info">
                    <div class="video-title">Introduction to Bal Bharti Coaching</div>
                    <div class="video-meta"><span><i class="fas fa-eye"></i> 1250</span><span class="badge bg-secondary">intro</span></div>
                </div>
                <div class="video-actions">
                    <button class="btn btn-sm btn-outline-primary play-demo-video" data-url="https://www.youtube.com/embed/dQw4w9WgXcQ"><i class="fas fa-play"></i> Play</button>
                </div>
            </div>
            <div class="video-card">
                <img class="video-thumbnail" src="https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg" alt="Sample Video">
                <div class="video-info">
                    <div class="video-title">Effective Study Tips for Students</div>
                    <div class="video-meta"><span><i class="fas fa-eye"></i> 890</span><span class="badge bg-secondary">tutorial</span></div>
                </div>
                <div class="video-actions">
                    <button class="btn btn-sm btn-outline-primary play-demo-video" data-url="https://www.youtube.com/embed/jNQXAC9IVRw"><i class="fas fa-play"></i> Play</button>
                </div>
            </div>
        `;

        document.querySelectorAll('.play-demo-video').forEach(btn => {
            btn.onclick = () => this.openVideoPlayer(btn.dataset.url, 'Demo Video');
        });
    }

    getVideoThumbnail(video) {
        if (video.thumbnail) return video.thumbnail;
        if (video.videoSource === 'youtube') {
            const match = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
            if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
        }
        return 'https://via.placeholder.com/280x160?text=Video';
    }

    getEmbedUrl(video) {
        if (video.embedCode) return video.embedCode;
        if (video.videoSource === 'youtube') {
            const match = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
            if (match) return `https://www.youtube.com/embed/${match[1]}`;
        }
        if (video.videoSource === 'vimeo') {
            const match = video.videoUrl.match(/vimeo\.com\/(\d+)/);
            if (match) return `https://player.vimeo.com/video/${match[1]}`;
        }
        return video.videoUrl;
    }

    openVideoPlayer(url, title) {
        let modal = document.getElementById('videoPlayerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'videoPlayerModal';
            modal.className = 'video-player-modal-custom';
            modal.innerHTML = `
                <div class="video-player-container-custom">
                    <button class="close-video-custom" id="closeVideoPlayerCustom">&times;</button>
                    <div id="videoPlayerContainerCustom"></div>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeVideoPlayerCustom').onclick = () => {
                modal.classList.remove('open');
                document.getElementById('videoPlayerContainerCustom').innerHTML = '';
            };
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                    document.getElementById('videoPlayerContainerCustom').innerHTML = '';
                }
            };
        }

        const container = document.getElementById('videoPlayerContainerCustom');
        let embedHtml = '';
        if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) {
            embedHtml = `<iframe src="${url}?autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
            embedHtml = `<video controls autoplay><source src="${url}" type="video/mp4">Your browser does not support video.</video>`;
        } else {
            embedHtml = `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`;
        }
        container.innerHTML = embedHtml;
        modal.classList.add('open');
        this.showToast(`Playing: ${title}`, 'info');
    }

    attachVideoEvents() {
        document.querySelectorAll('.play-video').forEach(btn => {
            btn.onclick = () => {
                const url = btn.dataset.url;
                const title = btn.dataset.title;
                if (url) this.openVideoPlayer(url, title);
            };
        });

        document.querySelectorAll('.edit-video').forEach(btn => {
            btn.onclick = () => {
                const video = JSON.parse(btn.dataset.video);
                this.openEditVideoModal(video);
            };
        });

        document.querySelectorAll('.delete-video').forEach(btn => {
            btn.onclick = () => this.deleteVideo(btn.dataset.id);
        });
    }

    async openEditVideoModal(video) {
        const modal = document.getElementById('videoModal');
        document.getElementById('videoModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Video';
        document.getElementById('videoTitle').value = video.title;
        document.getElementById('videoSource').value = video.videoSource || 'youtube';
        document.getElementById('videoUrl').value = video.videoUrl || '';
        document.getElementById('videoThumbnail').value = video.thumbnail || '';
        document.getElementById('videoCategory').value = video.category || 'demo';
        document.getElementById('videoDescription').value = video.description || '';
        document.getElementById('videoOrder').value = video.order || 0;
        document.getElementById('videoStatus').value = video.isActive ? 'true' : 'false';
        document.getElementById('videoFeatured').checked = video.featured || false;
        
        if (video.embedCode) {
            document.getElementById('embedCode').value = video.embedCode;
        }
        
        const sourceSelect = document.getElementById('videoSource');
        const embedDiv = document.getElementById('embedCodeDiv');
        embedDiv.style.display = sourceSelect.value === 'embed' ? 'block' : 'none';
        
        modal.style.display = 'block';
        
        const saveBtn = document.getElementById('saveVideoBtn');
        const oldSaveHandler = saveBtn.onclick;
        saveBtn.onclick = async () => {
            await this.updateVideo(video._id);
            modal.style.display = 'none';
            this.loadVideos();
        };
        
        document.getElementById('closeVideoModal').onclick = () => modal.style.display = 'none';
        document.getElementById('cancelVideoBtn').onclick = () => modal.style.display = 'none';
    }

    async updateVideo(id) {
        const data = {
            title: document.getElementById('videoTitle').value,
            videoSource: document.getElementById('videoSource').value,
            videoUrl: document.getElementById('videoUrl').value,
            thumbnail: document.getElementById('videoThumbnail').value,
            category: document.getElementById('videoCategory').value,
            description: document.getElementById('videoDescription').value,
            order: parseInt(document.getElementById('videoOrder').value) || 0,
            isActive: document.getElementById('videoStatus').value === 'true',
            featured: document.getElementById('videoFeatured').checked
        };
        
        if (document.getElementById('videoSource').value === 'embed') {
            data.embedCode = document.getElementById('embedCode').value;
        }
        
        try {
            const res = await fetch(`/api/admin/videos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                this.showToast('Video updated successfully!', 'success');
            } else {
                this.showToast(result.message || 'Update failed', 'error');
            }
        } catch (error) {
            this.showToast('Update failed', 'error');
        }
    }

    async deleteVideo(id) {
        if (!confirm('Delete this video? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/admin/videos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const result = await res.json();
            if (result.success) {
                this.showToast('Video deleted successfully!', 'success');
                this.loadVideos();
            } else {
                this.showToast(result.message || 'Delete failed', 'error');
            }
        } catch (error) {
            this.showToast('Delete failed', 'error');
        }
    }

    // ============================================
    // ENQUIRY SECTION - STUDENTS TAB
    // ============================================
    addEnquirySectionToStudentsTab() {
        const studentsPane = document.getElementById('studentsPane');
        if (!studentsPane) return;

        // Check if already added
        if (document.getElementById('enquiryManagementSection')) return;

        // Create Enquiry Tab inside Students Pane
        const enquirySection = document.createElement('div');
        enquirySection.id = 'enquiryManagementSection';
        enquirySection.className = 'premium-card mt-4';
        enquirySection.innerHTML = `
            <div class="card-header">
                <h3><i class="fas fa-envelope me-2"></i> Enquiry Management</h3>
                <div>
                    <button class="btn-secondary-premium" id="refreshEnquiriesBtn" style="padding: 8px 16px;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="enquiry-stats-grid" id="enquiryStatsGrid">
                    <div class="enquiry-stat-card"><div class="enquiry-stat-number">-</div><div class="enquiry-stat-label">Total</div></div>
                    <div class="enquiry-stat-card"><div class="enquiry-stat-number">-</div><div class="enquiry-stat-label">Pending</div></div>
                    <div class="enquiry-stat-card"><div class="enquiry-stat-number">-</div><div class="enquiry-stat-label">Contacted</div></div>
                    <div class="enquiry-stat-card"><div class="enquiry-stat-number">-</div><div class="enquiry-stat-label">Follow-up</div></div>
                    <div class="enquiry-stat-card"><div class="enquiry-stat-number">-</div><div class="enquiry-stat-label">Admitted</div></div>
                </div>
                
                <div class="enquiry-tabs">
                    <button class="enquiry-tab-btn active" data-status="all">All Enquiries</button>
                    <button class="enquiry-tab-btn" data-status="pending">Pending</button>
                    <button class="enquiry-tab-btn" data-status="contacted">Contacted</button>
                    <button class="enquiry-tab-btn" data-status="followup">Follow-up</button>
                    <button class="enquiry-tab-btn" data-status="admitted">Admitted</button>
                    <button class="enquiry-tab-btn" data-status="high-priority">High Priority</button>
                </div>
                
                <div class="enquiry-filter-bar">
                    <input type="text" id="enquirySearch" class="form-control" placeholder="Search by name, mobile, parent..." style="flex: 2;">
                    <select id="enquiryBoardFilter" class="form-select" style="flex: 1;">
                        <option value="">All Boards</option>
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="UP Board">UP Board</option>
                        <option value="Bihar Board">Bihar Board</option>
                    </select>
                    <select id="enquiryClassFilter" class="form-select" style="flex: 1;">
                        <option value="">All Classes</option>
                        <option value="9th">Class 9th</option>
                        <option value="10th">Class 10th</option>
                        <option value="11th">Class 11th</option>
                        <option value="12th">Class 12th</option>
                    </select>
                    <input type="date" id="enquiryFromDate" class="form-control" style="flex: 1;">
                    <input type="date" id="enquiryToDate" class="form-control" style="flex: 1;">
                </div>
                
                <div class="table-responsive">
                    <table class="enquiry-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Parent</th>
                                <th>Board/Class</th>
                                <th>Location</th>
                                <th>Applicant</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="enquiriesList">
                            <tr><td colspan="10" class="text-center py-4"><i class="fas fa-spinner fa-pulse"></i> Loading enquiries...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div id="enquiryPagination"></div>
                    <button class="btn-primary-premium" id="exportEnquiriesBtn" style="padding: 6px 15px;">
                        <i class="fas fa-download"></i> Export CSV
                    </button>
                </div>
            </div>
        `;

        // Insert after student management card
        const studentCard = studentsPane.querySelector('.premium-card');
        if (studentCard) {
            studentCard.insertAdjacentElement('afterend', enquirySection);
        } else {
            studentsPane.appendChild(enquirySection);
        }

        this.currentEnquiryStatus = 'all';
        this.currentEnquiryPage = 1;
    }

    async loadEnquiries() {
        const token = this.token;
        if (!token) return;

        const status = this.currentEnquiryStatus === 'high-priority' ? 'all' : (this.currentEnquiryStatus === 'all' ? '' : this.currentEnquiryStatus);
        const search = document.getElementById('enquirySearch')?.value || '';
        const board = document.getElementById('enquiryBoardFilter')?.value || '';
        const classVal = document.getElementById('enquiryClassFilter')?.value || '';
        const fromDate = document.getElementById('enquiryFromDate')?.value || '';
        const toDate = document.getElementById('enquiryToDate')?.value || '';
        const page = this.currentEnquiryPage || 1;

        let url = `/api/admin/enquiries?page=${page}&limit=20`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (board) url += `&board=${encodeURIComponent(board)}`;
        if (classVal) url += `&class=${encodeURIComponent(classVal)}`;
        if (fromDate) url += `&fromDate=${fromDate}`;
        if (toDate) url += `&toDate=${toDate}`;

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                this.renderEnquiries(data.data, data.stats, data.pagination);
            } else {
                this.showToast('Failed to load enquiries', 'error');
            }
        } catch (error) {
            console.error('Error loading enquiries:', error);
            this.showToast('Error loading enquiries', 'error');
        }
    }

    renderEnquiries(enquiries, stats, pagination) {
        const tbody = document.getElementById('enquiriesList');
        const statsGrid = document.getElementById('enquiryStatsGrid');
        
        // Update stats
        if (stats) {
            statsGrid.innerHTML = `
                <div class="enquiry-stat-card"><div class="enquiry-stat-number">${stats.total || 0}</div><div class="enquiry-stat-label">Total</div></div>
                <div class="enquiry-stat-card"><div class="enquiry-stat-number">${stats.pending || 0}</div><div class="enquiry-stat-label">Pending</div></div>
                <div class="enquiry-stat-card"><div class="enquiry-stat-number">${stats.contacted || 0}</div><div class="enquiry-stat-label">Contacted</div></div>
                <div class="enquiry-stat-card"><div class="enquiry-stat-number">${stats.followup || 0}</div><div class="enquiry-stat-label">Follow-up</div></div>
                <div class="enquiry-stat-card"><div class="enquiry-stat-number">${stats.admitted || 0}</div><div class="enquiry-stat-label">Admitted</div></div>
            `;
        }

        if (!enquiries || enquiries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4"><i class="fas fa-inbox fa-2x text-muted"></i><p class="mt-2">No enquiries found</p></td></tr>';
            return;
        }

        tbody.innerHTML = enquiries.map((e, idx) => `
            <tr style="${e.priority === 'high' ? 'border-left: 3px solid #f59e0b' : e.priority === 'urgent' ? 'border-left: 3px solid #ef4444' : ''}">
                <td>${((pagination?.page || 1) - 1) * (pagination?.limit || 20) + idx + 1}</td>
                <td>
                    <strong>${this.escapeHtml(e.fullName)}</strong><br>
                    <small class="text-muted">${this.escapeHtml(e.email || 'No email')}</small>
                 </td>
                <td>
                    <a href="tel:${e.mobile}" class="text-decoration-none"><i class="fas fa-phone-alt"></i> ${e.mobile}</a>
                    ${e.alternateMobile ? `<br><small>Alt: ${e.alternateMobile}</small>` : ''}
                 </td>
                <td>
                    ${e.parentName ? `<strong>${this.escapeHtml(e.parentName)}</strong><br>` : ''}
                    ${e.parentMobile ? `<small>${e.parentMobile}</small>` : ''}
                 </td>
                <td>
                    ${e.board || '-'}<br>
                    <small>${e.class || '-'}</small>
                 </td>
                <td>
                    ${this.escapeHtml(e.location || '-')}<br>
                    <small>${this.escapeHtml(e.city || '')}</small>
                 </td>
                <td>
                    <span class="badge bg-secondary">${e.applicantType}</span>
                    ${e.applicantRelation ? `<br><small>${e.applicantRelation}</small>` : ''}
                 </td>
                <td>
                    <select class="form-select form-select-sm status-change" data-id="${e._id}" style="width: 110px; font-size: 0.7rem;">
                        <option value="pending" ${e.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="contacted" ${e.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="followup" ${e.status === 'followup' ? 'selected' : ''}>Follow-up</option>
                        <option value="admitted" ${e.status === 'admitted' ? 'selected' : ''}>Admitted</option>
                        <option value="not_interested" ${e.status === 'not_interested' ? 'selected' : ''}>Not Interested</option>
                        <option value="spam" ${e.status === 'spam' ? 'selected' : ''}>Spam</option>
                    </select>
                 </td>
                <td>
                    <small>${new Date(e.createdAt).toLocaleDateString('en-IN')}</small><br>
                    <small class="text-muted">${new Date(e.createdAt).toLocaleTimeString()}</small>
                 </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-enquiry" data-id="${e._id}" data-enquiry='${JSON.stringify(e)}' title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success call-enquiry" data-mobile="${e.mobile}" data-name="${e.fullName}" title="Call">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-enquiry" data-id="${e._id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                 </td>
             </tr>
        `).join('');

        // Add pagination
        if (pagination && pagination.pages > 1) {
            const paginationDiv = document.getElementById('enquiryPagination');
            let paginationHtml = '<div class="btn-group">';
            for (let i = 1; i <= Math.min(pagination.pages, 5); i++) {
                paginationHtml += `<button class="btn btn-sm ${i === pagination.page ? 'btn-primary' : 'btn-outline-primary'} page-btn" data-page="${i}">${i}</button>`;
            }
            paginationHtml += '</div>';
            paginationDiv.innerHTML = paginationHtml;
            document.querySelectorAll('.page-btn').forEach(btn => {
                btn.onclick = () => {
                    this.currentEnquiryPage = parseInt(btn.dataset.page);
                    this.loadEnquiries();
                };
            });
        }

        this.attachEnquiryEvents();
    }

    attachEnquiryEvents() {
        // Status change
        document.querySelectorAll('.status-change').forEach(select => {
            select.onchange = async (e) => {
                const id = select.dataset.id;
                const status = select.value;
                await this.updateEnquiryStatus(id, status);
            };
        });

        // View enquiry
        document.querySelectorAll('.view-enquiry').forEach(btn => {
            btn.onclick = () => {
                const enquiry = JSON.parse(btn.dataset.enquiry);
                this.showEnquiryDetails(enquiry);
            };
        });

        // Call enquiry
        document.querySelectorAll('.call-enquiry').forEach(btn => {
            btn.onclick = () => {
                const mobile = btn.dataset.mobile;
                const name = btn.dataset.name;
                if (mobile) {
                    window.location.href = `tel:${mobile}`;
                    this.showToast(`Calling ${name}...`, 'info');
                }
            };
        });

        // Delete enquiry
        document.querySelectorAll('.delete-enquiry').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Delete this enquiry? This action cannot be undone.')) {
                    await this.deleteEnquiry(btn.dataset.id);
                }
            };
        });
    }

    async updateEnquiryStatus(id, status) {
        try {
            const res = await fetch(`/api/admin/enquiries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast(`Enquiry marked as ${status}`, 'success');
                this.loadEnquiries();
            } else {
                this.showToast(data.message || 'Update failed', 'error');
            }
        } catch (error) {
            this.showToast('Update failed', 'error');
        }
    }

    async deleteEnquiry(id) {
        try {
            const res = await fetch(`/api/admin/enquiries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('Enquiry deleted successfully', 'success');
                this.loadEnquiries();
            } else {
                this.showToast(data.message || 'Delete failed', 'error');
            }
        } catch (error) {
            this.showToast('Delete failed', 'error');
        }
    }

    showEnquiryDetails(enquiry) {
        const modalHtml = `
            <div class="modal-custom" id="enquiryDetailModal" style="display: flex;">
                <div class="modal-content-custom" style="max-width: 700px;">
                    <div class="modal-header-custom">
                        <h4><i class="fas fa-user"></i> Enquiry Details</h4>
                        <button class="modal-close" id="closeEnquiryDetailModal">&times;</button>
                    </div>
                    <div class="modal-body-custom">
                        <div class="row g-3">
                            <div class="col-md-6"><strong>Full Name:</strong> ${this.escapeHtml(enquiry.fullName)}</div>
                            <div class="col-md-6"><strong>Mobile:</strong> <a href="tel:${enquiry.mobile}">${enquiry.mobile}</a></div>
                            <div class="col-md-6"><strong>Alternate Mobile:</strong> ${enquiry.alternateMobile || '-'}</div>
                            <div class="col-md-6"><strong>Email:</strong> ${this.escapeHtml(enquiry.email || '-')}</div>
                            <div class="col-md-6"><strong>Parent Name:</strong> ${this.escapeHtml(enquiry.parentName || '-')}</div>
                            <div class="col-md-6"><strong>Parent Mobile:</strong> ${enquiry.parentMobile || '-'}</div>
                            <div class="col-md-6"><strong>Location:</strong> ${this.escapeHtml(enquiry.location || '-')}</div>
                            <div class="col-md-6"><strong>City:</strong> ${this.escapeHtml(enquiry.city || '-')}</div>
                            <div class="col-md-6"><strong>Board:</strong> ${enquiry.board || '-'}</div>
                            <div class="col-md-6"><strong>Class:</strong> ${enquiry.class || '-'}</div>
                            <div class="col-md-6"><strong>Applicant Type:</strong> ${enquiry.applicantType}</div>
                            <div class="col-md-6"><strong>Course:</strong> ${enquiry.course || '-'}</div>
                            <div class="col-md-12"><strong>Message:</strong><br>${this.escapeHtml(enquiry.message || '-')}</div>
                            <div class="col-md-12"><hr><strong>Status:</strong> <span class="status-badge status-${enquiry.status}">${enquiry.status}</span></div>
                            <div class="col-md-12"><strong>Submitted on:</strong> ${new Date(enquiry.createdAt).toLocaleString()}</div>
                            <div class="col-md-12"><strong>IP Address:</strong> ${enquiry.ipAddress || '-'}</div>
                        </div>
                    </div>
                    <div class="modal-footer-custom">
                        <button class="btn-primary-premium" id="closeDetailModal">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('enquiryDetailModal');
        const closeModal = () => modal.remove();
        document.getElementById('closeEnquiryDetailModal').onclick = closeModal;
        document.getElementById('closeDetailModal').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    setupEventListeners() {
        // Add Video Button
        const addVideoBtn = document.getElementById('addVideoBtn');
        if (addVideoBtn) {
            addVideoBtn.onclick = () => this.openAddVideoModal();
        }

        // Save Video Button
        const saveVideoBtn = document.getElementById('saveVideoBtn');
        if (saveVideoBtn) {
            saveVideoBtn.onclick = async () => {
                await this.addNewVideo();
                document.getElementById('videoModal').style.display = 'none';
                this.loadVideos();
            };
        }

        // Cancel Video Button
        const cancelVideoBtn = document.getElementById('cancelVideoBtn');
        if (cancelVideoBtn) {
            cancelVideoBtn.onclick = () => {
                document.getElementById('videoModal').style.display = 'none';
            };
        }

        // Video Search
        const videoSearch = document.getElementById('videoSearch');
        if (videoSearch) {
            videoSearch.oninput = () => this.loadVideos();
        }

        // Video Category Filter
        const videoCategoryFilter = document.getElementById('videoCategoryFilter');
        if (videoCategoryFilter) {
            videoCategoryFilter.onchange = () => this.loadVideos();
        }

        // Enquiry Filters
        const enquirySearch = document.getElementById('enquirySearch');
        if (enquirySearch) {
            enquirySearch.oninput = () => {
                this.currentEnquiryPage = 1;
                this.loadEnquiries();
            };
        }

        const enquiryBoardFilter = document.getElementById('enquiryBoardFilter');
        if (enquiryBoardFilter) {
            enquiryBoardFilter.onchange = () => {
                this.currentEnquiryPage = 1;
                this.loadEnquiries();
            };
        }

        const enquiryClassFilter = document.getElementById('enquiryClassFilter');
        if (enquiryClassFilter) {
            enquiryClassFilter.onchange = () => {
                this.currentEnquiryPage = 1;
                this.loadEnquiries();
            };
        }

        const enquiryFromDate = document.getElementById('enquiryFromDate');
        if (enquiryFromDate) {
            enquiryFromDate.onchange = () => {
                this.currentEnquiryPage = 1;
                this.loadEnquiries();
            };
        }

        const enquiryToDate = document.getElementById('enquiryToDate');
        if (enquiryToDate) {
            enquiryToDate.onchange = () => {
                this.currentEnquiryPage = 1;
                this.loadEnquiries();
            };
        }

        // Enquiry Tabs
        document.querySelectorAll('.enquiry-tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.enquiry-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentEnquiryStatus = btn.dataset.status;
                this.currentEnquiryPage = 1;
                this.loadEnquiries();
            };
        });

        // Refresh Enquiries
        const refreshBtn = document.getElementById('refreshEnquiriesBtn');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadEnquiries();
        }

        // Export Enquiries
        const exportBtn = document.getElementById('exportEnquiriesBtn');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportEnquiriesToCSV();
        }
    }

    openAddVideoModal() {
        const modal = document.getElementById('videoModal');
        document.getElementById('videoModalTitle').innerHTML = '<i class="fas fa-video"></i> Add New Video';
        document.getElementById('videoForm').reset();
        document.getElementById('videoSource').value = 'youtube';
        document.getElementById('embedCodeDiv').style.display = 'none';
        modal.style.display = 'block';
    }

    async addNewVideo() {
        const data = {
            title: document.getElementById('videoTitle').value,
            videoSource: document.getElementById('videoSource').value,
            videoUrl: document.getElementById('videoUrl').value,
            thumbnail: document.getElementById('videoThumbnail').value,
            category: document.getElementById('videoCategory').value,
            description: document.getElementById('videoDescription').value,
            order: parseInt(document.getElementById('videoOrder').value) || 0,
            isActive: document.getElementById('videoStatus').value === 'true',
            featured: document.getElementById('videoFeatured').checked
        };
        
        if (document.getElementById('videoSource').value === 'embed') {
            data.embedCode = document.getElementById('embedCode').value;
        }
        
        if (!data.title) {
            this.showToast('Please enter video title', 'error');
            return false;
        }
        
        try {
            const res = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                this.showToast('Video added successfully!', 'success');
                return true;
            } else {
                this.showToast(result.message || 'Add failed', 'error');
                return false;
            }
        } catch (error) {
            this.showToast('Add failed', 'error');
            return false;
        }
    }

    async exportEnquiriesToCSV() {
        try {
            const res = await fetch('/api/admin/enquiries?limit=1000', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                const enquiries = data.data;
                const headers = ['Name', 'Mobile', 'Alternate Mobile', 'Email', 'Parent Name', 'Parent Mobile', 'Location', 'City', 'Board', 'Class', 'Applicant Type', 'Course', 'Status', 'Created Date'];
                const rows = enquiries.map(e => [
                    e.fullName,
                    e.mobile,
                    e.alternateMobile || '',
                    e.email || '',
                    e.parentName || '',
                    e.parentMobile || '',
                    e.location || '',
                    e.city || '',
                    e.board || '',
                    e.class || '',
                    e.applicantType,
                    e.course || '',
                    e.status,
                    new Date(e.createdAt).toLocaleString()
                ]);
                
                const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `enquiries_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                this.showToast('Enquiries exported successfully!', 'success');
            }
        } catch (error) {
            this.showToast('Export failed', 'error');
        }
    }

    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-premium ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i><span>${msg}</span>`;
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
}

// ============================================
// INITIALIZE MODULE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Wait for token to be available
    setTimeout(() => {
        if (localStorage.getItem('token') || sessionStorage.getItem('token')) {
            new EnquiryVideoAdminModule();
        }
    }, 1000);
});

console.log('✅ Enquiry & Demo Video Module Loaded!');
