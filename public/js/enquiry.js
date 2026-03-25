// ============================================
// BAL BHARTI COACHING - ENQUIRY & VIDEO MODULE
// ============================================

class EnquiryVideoModule {
    constructor() {
        this.isModalOpen = false;
        this.currentVideo = null;
        this.init();
    }

    init() {
        this.injectStyles();
        this.createEnquiryFloatingButton();
        this.createVideoSidebar();
        this.createEnquiryModal();
        this.loadEnquiryForm();
        this.loadVideos();
        this.attachEventListeners();
    }

    // ============================================
    // INJECT CSS STYLES
    // ============================================
    injectStyles() {
        const styles = `
            <style>
                /* Floating Enquiry Button */
                .enquiry-float-btn {
                    position: fixed;
                    bottom: 100px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #4361ee, #7209b7);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(67,97,238,0.3);
                    z-index: 999;
                    transition: all 0.3s ease;
                    animation: pulseEnquiry 2s infinite;
                }
                .enquiry-float-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(67,97,238,0.4);
                }
                @keyframes pulseEnquiry {
                    0%, 100% { box-shadow: 0 4px 15px rgba(67,97,238,0.3); }
                    50% { box-shadow: 0 4px 25px rgba(67,97,238,0.6); }
                }
                
                /* Enquiry Modal */
                .enquiry-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(5px);
                    z-index: 10000;
                    display: none;
                    justify-content: center;
                    align-items: center;
                    animation: fadeIn 0.3s ease;
                }
                .enquiry-modal.open {
                    display: flex;
                }
                .enquiry-modal-content {
                    background: var(--card-bg, #fff);
                    width: 90%;
                    max-width: 550px;
                    max-height: 85vh;
                    border-radius: 24px;
                    overflow-y: auto;
                    position: relative;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .enquiry-modal-header {
                    background: linear-gradient(135deg, #4361ee, #7209b7);
                    padding: 20px;
                    color: white;
                    border-radius: 24px 24px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .enquiry-modal-header h3 {
                    margin: 0;
                    font-size: 1.3rem;
                }
                .enquiry-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                }
                .enquiry-form {
                    padding: 25px;
                }
                .form-group {
                    margin-bottom: 18px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: var(--text-primary, #333);
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 12px 15px;
                    border: 1px solid var(--border-color, #ddd);
                    border-radius: 12px;
                    background: var(--bg-primary, #fff);
                    color: var(--text-primary, #333);
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #4361ee;
                    box-shadow: 0 0 0 3px rgba(67,97,238,0.1);
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .submit-enquiry-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #4361ee, #7209b7);
                    border: none;
                    color: white;
                    font-weight: 700;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s;
                }
                .submit-enquiry-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(67,97,238,0.3);
                }
                
                /* Video Sidebar */
                .video-sidebar {
                    position: fixed;
                    left: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 280px;
                    background: var(--card-bg, #fff);
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    z-index: 998;
                    overflow: hidden;
                    border: 1px solid var(--border-color, #eee);
                    transition: all 0.3s ease;
                }
                @media (max-width: 992px) {
                    .video-sidebar {
                        display: none;
                    }
                    .video-sidebar-mobile {
                        display: block !important;
                        position: fixed;
                        bottom: 20px;
                        left: 20px;
                        right: 20px;
                        top: auto;
                        transform: none;
                        width: auto;
                        max-width: 300px;
                    }
                }
                .video-sidebar-header {
                    background: linear-gradient(135deg, #f72585, #fb5607);
                    padding: 12px 15px;
                    color: white;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .video-sidebar-content {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .video-item {
                    padding: 12px 15px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid var(--border-color, #eee);
                }
                .video-item:hover {
                    background: var(--bg-secondary, #f5f5f5);
                }
                .video-thumb {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    object-fit: cover;
                    background: #f0f0f0;
                }
                .video-info {
                    flex: 1;
                }
                .video-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--text-primary, #333);
                }
                .video-views {
                    font-size: 0.7rem;
                    color: var(--text-secondary, #666);
                }
                .video-player-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    z-index: 10001;
                    display: none;
                    justify-content: center;
                    align-items: center;
                }
                .video-player-modal.open {
                    display: flex;
                }
                .video-player-container {
                    width: 90%;
                    max-width: 900px;
                    background: #000;
                    border-radius: 16px;
                    overflow: hidden;
                    position: relative;
                }
                .video-player-container iframe,
                .video-player-container video {
                    width: 100%;
                    height: 500px;
                    border: none;
                }
                .close-video-btn {
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
                    .video-player-container iframe,
                    .video-player-container video {
                        height: 300px;
                    }
                }
                
                /* Mobile Video Toggle */
                .mobile-video-toggle {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #f72585, #fb5607);
                    border-radius: 50%;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    z-index: 999;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                @media (max-width: 992px) {
                    .mobile-video-toggle {
                        display: flex;
                    }
                }
                
                .success-message {
                    background: #06d6a0;
                    color: white;
                    padding: 12px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    text-align: center;
                }
                .error-message {
                    background: #fb5607;
                    color: white;
                    padding: 12px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    text-align: center;
                }
                .loading-indicator {
                    text-align: center;
                    padding: 20px;
                }
                .loading-indicator i {
                    font-size: 2rem;
                    animation: spin 1s linear infinite;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // ============================================
    // CREATE FLOATING ENQUIRY BUTTON
    // ============================================
    createEnquiryFloatingButton() {
        const btn = document.createElement('div');
        btn.className = 'enquiry-float-btn';
        btn.innerHTML = '<i class="fas fa-envelope"></i>';
        btn.onclick = () => this.openEnquiryModal();
        document.body.appendChild(btn);
    }

    // ============================================
    // CREATE VIDEO SIDEBAR
    // ============================================
    createVideoSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'video-sidebar';
        sidebar.id = 'videoSidebar';
        sidebar.innerHTML = `
            <div class="video-sidebar-header" id="videoSidebarToggle">
                <i class="fas fa-video"></i>
                <span>Demo Videos</span>
                <i class="fas fa-chevron-down" style="margin-left: auto;"></i>
            </div>
            <div class="video-sidebar-content" id="videoSidebarContent">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-pulse"></i>
                    <p>Loading videos...</p>
                </div>
            </div>
        `;
        document.body.appendChild(sidebar);
        
        // Mobile video toggle
        const mobileToggle = document.createElement('div');
        mobileToggle.className = 'mobile-video-toggle';
        mobileToggle.id = 'mobileVideoToggle';
        mobileToggle.innerHTML = '<i class="fas fa-video"></i>';
        mobileToggle.onclick = () => this.toggleMobileVideoSidebar();
        document.body.appendChild(mobileToggle);
        
        // Sidebar toggle functionality
        const toggleBtn = document.getElementById('videoSidebarToggle');
        const content = document.getElementById('videoSidebarContent');
        let isOpen = true;
        toggleBtn.onclick = () => {
            isOpen = !isOpen;
            content.style.display = isOpen ? 'block' : 'none';
            toggleBtn.querySelector('.fa-chevron-down').style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
        };
    }

    toggleMobileVideoSidebar() {
        const sidebar = document.getElementById('videoSidebar');
        if (sidebar.classList.contains('video-sidebar-mobile')) {
            sidebar.classList.remove('video-sidebar-mobile');
            sidebar.style.display = 'none';
        } else {
            sidebar.classList.add('video-sidebar-mobile');
            sidebar.style.display = 'block';
            setTimeout(() => {
                document.addEventListener('click', function closeSidebar(e) {
                    if (!sidebar.contains(e.target) && !e.target.closest('.mobile-video-toggle')) {
                        sidebar.style.display = 'none';
                        document.removeEventListener('click', closeSidebar);
                    }
                });
            }, 100);
        }
    }

    // ============================================
    // CREATE ENQUIRY MODAL
    // ============================================
    createEnquiryModal() {
        const modal = document.createElement('div');
        modal.className = 'enquiry-modal';
        modal.id = 'enquiryModal';
        modal.innerHTML = `
            <div class="enquiry-modal-content">
                <div class="enquiry-modal-header">
                    <h3><i class="fas fa-pen-alt"></i> Quick Enquiry</h3>
                    <button class="enquiry-close" id="closeEnquiryModal">&times;</button>
                </div>
                <div class="enquiry-form" id="enquiryFormContainer">
                    <div id="enquiryMessage"></div>
                    <form id="enquiryForm">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" name="fullName" required placeholder="Enter your full name">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mobile Number *</label>
                                <input type="tel" name="mobile" required placeholder="10 digit number">
                            </div>
                            <div class="form-group">
                                <label>Alternate Mobile</label>
                                <input type="tel" name="alternateMobile" placeholder="Optional">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Email (Optional)</label>
                            <input type="email" name="email" placeholder="your@email.com">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Parent Name</label>
                                <input type="text" name="parentName" placeholder="Father/Mother name">
                            </div>
                            <div class="form-group">
                                <label>Parent Mobile</label>
                                <input type="tel" name="parentMobile" placeholder="Optional">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Location / Area</label>
                            <input type="text" name="location" placeholder="Your area/location">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>City</label>
                                <input type="text" name="city" placeholder="City name">
                            </div>
                            <div class="form-group">
                                <label>Pincode</label>
                                <input type="text" name="pincode" placeholder="Pin code">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Board</label>
                                <select name="board">
                                    <option value="">Select Board</option>
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="UP Board">UP Board</option>
                                    <option value="Bihar Board">Bihar Board</option>
                                    <option value="MP Board">MP Board</option>
                                    <option value="Rajasthan Board">Rajasthan Board</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Class</label>
                                <select name="class">
                                    <option value="">Select Class</option>
                                    <option value="9th">Class 9th</option>
                                    <option value="10th">Class 10th</option>
                                    <option value="11th">Class 11th</option>
                                    <option value="12th">Class 12th</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Who is applying? *</label>
                                <select name="applicantType" required>
                                    <option value="self">Self</option>
                                    <option value="father">Father</option>
                                    <option value="mother">Mother</option>
                                    <option value="friend">Friend</option>
                                    <option value="relative">Relative</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>If Other, specify</label>
                                <input type="text" name="applicantRelation" placeholder="e.g., Uncle, Aunt">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Course Interested In</label>
                            <input type="text" name="course" placeholder="e.g., JEE, NEET, Foundation">
                        </div>
                        <div class="form-group">
                            <label>Preferred Contact Time</label>
                            <select name="preferredTime">
                                <option value="">Any time</option>
                                <option value="morning">Morning (9AM-12PM)</option>
                                <option value="afternoon">Afternoon (12PM-4PM)</option>
                                <option value="evening">Evening (4PM-8PM)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Message (Optional)</label>
                            <textarea name="message" rows="3" placeholder="Any specific query..."></textarea>
                        </div>
                        <button type="submit" class="submit-enquiry-btn">
                            <i class="fas fa-paper-plane"></i> Submit Enquiry
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closeEnquiryModal').onclick = () => this.closeEnquiryModal();
        modal.onclick = (e) => { if (e.target === modal) this.closeEnquiryModal(); };
    }

    openEnquiryModal() {
        const modal = document.getElementById('enquiryModal');
        modal.classList.add('open');
        this.speakHindi('कृपया अपनी जानकारी भरें। हम जल्द ही आपसे संपर्क करेंगे।');
    }

    closeEnquiryModal() {
        const modal = document.getElementById('enquiryModal');
        modal.classList.remove('open');
    }

    // ============================================
    // LOAD ENQUIRY FORM HANDLER
    // ============================================
    loadEnquiryForm() {
        const form = document.getElementById('enquiryForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.submit-enquiry-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Submitting...';
            submitBtn.disabled = true;
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/enquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showMessage('✅ ' + result.message, 'success');
                    form.reset();
                    this.speakHindi('आपकी enquiry सफलतापूर्वक जमा हो गई। हम जल्द ही आपसे संपर्क करेंगे।');
                    setTimeout(() => this.closeEnquiryModal(), 2000);
                } else {
                    this.showMessage('❌ ' + result.message, 'error');
                    this.speakHindi('कृपया सही जानकारी भरें।');
                }
            } catch (error) {
                console.error('Enquiry error:', error);
                this.showMessage('❌ Network error. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    showMessage(msg, type) {
        const msgDiv = document.getElementById('enquiryMessage');
        msgDiv.innerHTML = `<div class="${type === 'success' ? 'success-message' : 'error-message'}">${msg}</div>`;
        setTimeout(() => { msgDiv.innerHTML = ''; }, 5000);
    }

    // ============================================
    // LOAD VIDEOS FROM API
    // ============================================
    async loadVideos() {
        const contentDiv = document.getElementById('videoSidebarContent');
        if (!contentDiv) return;
        
        try {
            const response = await fetch('/api/videos?limit=10');
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                this.renderVideoList(result.data);
                this.createVideoPlayerModal();
            } else {
                contentDiv.innerHTML = this.getDefaultVideosHTML();
                this.attachVideoClickHandlers();
            }
        } catch (error) {
            console.error('Video load error:', error);
            contentDiv.innerHTML = this.getDefaultVideosHTML();
            this.attachVideoClickHandlers();
        }
    }

    getDefaultVideosHTML() {
        return `
            <div class="video-item" data-video-url="https://www.youtube.com/embed/dQw4w9WgXcQ" data-video-title="Introduction to Coaching">
                <img class="video-thumb" src="https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg" alt="Video">
                <div class="video-info">
                    <div class="video-title">Introduction to Bal Bharti Coaching</div>
                    <div class="video-views">Featured Video</div>
                </div>
            </div>
            <div class="video-item" data-video-url="https://www.youtube.com/embed/jNQXAC9IVRw" data-video-title="Study Tips">
                <img class="video-thumb" src="https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg" alt="Video">
                <div class="video-info">
                    <div class="video-title">Effective Study Tips for Students</div>
                    <div class="video-views">Popular</div>
                </div>
            </div>
            <div class="video-item" data-video-url="https://www.youtube.com/embed/YE7VzlLtp-4" data-video-title="Success Stories">
                <img class="video-thumb" src="https://img.youtube.com/vi/YE7VzlLtp-4/mqdefault.jpg" alt="Video">
                <div class="video-info">
                    <div class="video-title">Student Success Stories</div>
                    <div class="video-views">Inspiring</div>
                </div>
            </div>
        `;
    }

    renderVideoList(videos) {
        const contentDiv = document.getElementById('videoSidebarContent');
        if (!contentDiv) return;
        
        let html = '';
        videos.forEach(video => {
            const embedUrl = video.embedUrl || this.getEmbedUrl(video.videoUrl, video.videoSource);
            const thumbUrl = video.thumbnailUrl || this.getThumbnail(video.videoUrl, video.videoSource);
            html += `
                <div class="video-item" data-video-url="${embedUrl}" data-video-title="${video.title}" data-video-source="${video.videoSource}" data-original-url="${video.videoUrl}">
                    <img class="video-thumb" src="${thumbUrl}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/50?text=Video'">
                    <div class="video-info">
                        <div class="video-title">${video.title.substring(0, 40)}</div>
                        <div class="video-views">${video.views || 0} views</div>
                    </div>
                </div>
            `;
        });
        contentDiv.innerHTML = html;
        this.attachVideoClickHandlers();
    }

    getEmbedUrl(url, source) {
        if (!url) return '';
        if (source === 'youtube') {
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
            return match ? `https://www.youtube.com/embed/${match[1]}` : url;
        }
        if (source === 'vimeo') {
            const match = url.match(/vimeo\.com\/(\d+)/);
            return match ? `https://player.vimeo.com/video/${match[1]}` : url;
        }
        return url;
    }

    getThumbnail(url, source) {
        if (source === 'youtube') {
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
            return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : 'https://via.placeholder.com/50';
        }
        return 'https://via.placeholder.com/50?text=Video';
    }

    attachVideoClickHandlers() {
        document.querySelectorAll('.video-item').forEach(item => {
            item.onclick = () => {
                const videoUrl = item.dataset.videoUrl;
                const videoTitle = item.dataset.videoTitle;
                if (videoUrl) {
                    this.openVideoPlayer(videoUrl, videoTitle);
                }
            };
        });
    }

    createVideoPlayerModal() {
        const modal = document.createElement('div');
        modal.className = 'video-player-modal';
        modal.id = 'videoPlayerModal';
        modal.innerHTML = `
            <div class="video-player-container">
                <button class="close-video-btn" id="closeVideoPlayer">&times;</button>
                <div id="videoPlayerContainer"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closeVideoPlayer').onclick = () => this.closeVideoPlayer();
        modal.onclick = (e) => { if (e.target === modal) this.closeVideoPlayer(); };
    }

    openVideoPlayer(videoUrl, title) {
        const modal = document.getElementById('videoPlayerModal');
        const container = document.getElementById('videoPlayerContainer');
        
        let embedHtml = '';
        if (videoUrl.includes('youtube.com/embed') || videoUrl.includes('player.vimeo.com')) {
            embedHtml = `<iframe src="${videoUrl}?autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        } else if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
            embedHtml = `<video controls autoplay><source src="${videoUrl}" type="video/mp4">Your browser does not support video.</video>`;
        } else {
            embedHtml = `<iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>`;
        }
        
        container.innerHTML = embedHtml;
        modal.classList.add('open');
        this.speakHindi(title + ' वीडियो चल रहा है');
    }

    closeVideoPlayer() {
        const modal = document.getElementById('videoPlayerModal');
        const container = document.getElementById('videoPlayerContainer');
        container.innerHTML = '';
        modal.classList.remove('open');
    }

    // ============================================
    // ATTACH ADDITIONAL EVENT LISTENERS
    // ============================================
    attachEventListeners() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEnquiryModal();
                this.closeVideoPlayer();
            }
        });
    }

    // ============================================
    // HINDI VOICE GUIDE
    // ============================================
    speakHindi(text) {
        if (window.voiceEnabled === false) return;
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
}

// ============================================
// INITIALIZE MODULE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Wait for page to load
    setTimeout(() => {
        new EnquiryVideoModule();
    }, 1000);
});
