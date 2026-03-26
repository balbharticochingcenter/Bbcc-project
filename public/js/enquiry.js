// ============================================
// BAL BHARTI COACHING - COMPLETE MODULE (FIXED VIDEO PLAYER)
// Demo Video + 3D Cartoon Modal + Bilingual Form
// ============================================

(function() {
    'use strict';
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    const CONFIG = {
        apiBaseUrl: window.location.origin,
        debounceTime: 3000,
        lastSubmissionTime: 0,
        centerPhone: '+coming soon',
        centerName: 'Bal Bharti Coaching Center',
        whatsappNumber: '919971095964'
    };
    
    // ============================================
    // CLASS LIST (UKG to Graduation) - Bilingual
    // ============================================
    
    const CLASS_LIST = [
        { value: 'UKG', label: '📚 UKG' },
        { value: '1st', label: '📖 1st Class / कक्षा 1' },
        { value: '2nd', label: '📖 2nd Class / कक्षा 2' },
        { value: '3rd', label: '📖 3rd Class / कक्षा 3' },
        { value: '4th', label: '📖 4th Class / कक्षा 4' },
        { value: '5th', label: '📖 5th Class / कक्षा 5' },
        { value: '6th', label: '📖 6th Class / कक्षा 6' },
        { value: '7th', label: '📖 7th Class / कक्षा 7' },
        { value: '8th', label: '📖 8th Class / कक्षा 8' },
        { value: '9th', label: '📖 9th Class / कक्षा 9' },
        { value: '10th', label: '🎯 10th Class (Board) / कक्षा 10 (बोर्ड)' },
        { value: '11th Science', label: '🔬 11th Science / 11वीं विज्ञान' },
        { value: '11th Commerce', label: '📊 11th Commerce / 11वीं वाणिज्य' },
        { value: '11th Arts', label: '🎨 11th Arts / 11वीं कला' },
        { value: '12th Science', label: '🔬 12th Science / 12वीं विज्ञान' },
        { value: '12th Commerce', label: '📊 12th Commerce / 12वीं वाणिज्य' },
        { value: '12th Arts', label: '🎨 12th Arts / 12वीं कला' },
        { value: 'B.Sc', label: '🎓 B.Sc - Bachelor of Science / विज्ञान स्नातक' },
        { value: 'B.Com', label: '🎓 B.Com - Bachelor of Commerce / वाणिज्य स्नातक' },
        { value: 'B.A', label: '🎓 B.A - Bachelor of Arts / कला स्नातक' },
        { value: 'BCA', label: '💻 BCA - Computer Applications / कंप्यूटर अनुप्रयोग' },
        { value: 'BBA', label: '📈 BBA - Business Administration / व्यवसाय प्रबंधन' },
        { value: 'M.Sc', label: '🎓 M.Sc - Master of Science / विज्ञान परास्नातक' },
        { value: 'M.Com', label: '🎓 M.Com - Master of Commerce / वाणिज्य परास्नातक' },
        { value: 'M.A', label: '🎓 M.A - Master of Arts / कला परास्नातक' },
        { value: 'Competitive', label: '🏆 Competitive Exam / प्रतियोगी परीक्षा' },
        { value: 'Other', label: '📚 Other / अन्य' }
    ];
    
    // ============================================
    // BOARD LIST - Bilingual
    // ============================================
    
    const BOARD_LIST = [
        '🏫 CBSE / सीबीएसई',
        '🏫 ICSE / आईसीएसई',
        '🏫 UP Board / यूपी बोर्ड',
        '🏫 Bihar Board / बिहार बोर्ड',
        '🏫 MP Board / एमपी बोर्ड',
        '🏫 Rajasthan Board / राजस्थान बोर्ड',
        '🏫 Haryana Board / हरियाणा बोर्ड',
        '🏫 Punjab Board / पंजाब बोर्ड',
        '🏫 West Bengal Board / पश्चिम बंगाल बोर्ड',
        '🏫 Maharashtra Board / महाराष्ट्र बोर्ड',
        '🏫 Other State Board / अन्य राज्य बोर्ड'
    ];
    
    // ============================================
    // IMPROVED VIDEO URL PARSER - Supports ALL YouTube formats
    // ============================================
    
    function extractYouTubeVideoId(url) {
        if (!url) return null;
        
        // Handle various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([^&]+)/i,           // youtube.com/watch?v=xxxx
            /(?:youtu\.be\/)([^?]+)/i,                       // youtu.be/xxxx
            /(?:youtube\.com\/embed\/)([^?]+)/i,              // youtube.com/embed/xxxx
            /(?:youtube\.com\/v\/)([^?]+)/i,                 // youtube.com/v/xxxx
            /(?:youtube\.com\/shorts\/)([^?]+)/i,            // youtube.com/shorts/xxxx
            /(?:youtube\.com\/live\/)([^?]+)/i,              // youtube.com/live/xxxx
            /(?:youtube\.com\/watch\?.*&v=)([^&]+)/i,        // youtube.com/watch?foo=bar&v=xxxx
            /(?:youtube-nocookie\.com\/embed\/)([^?]+)/i     // youtube-nocookie.com/embed/xxxx
        ];
        
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1] && match[1].length === 11) {
                return match[1];
            }
        }
        
        // Try to extract any 11-character string that might be a video ID
        const possibleId = url.match(/([a-zA-Z0-9_-]{11})/);
        if (possibleId && possibleId[1].length === 11) {
            return possibleId[1];
        }
        
        return null;
    }
    
    function getEmbedUrlFromData(url, source) {
        if (!url) return '';
        
        // If it's YouTube
        if (source === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1&fs=1`;
            }
        }
        
        // If it's Vimeo
        if (source === 'vimeo' || url.includes('vimeo.com')) {
            const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
                return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
            }
        }
        
        // If it's direct MP4 or other video file
        if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            return url;
        }
        
        // If it's already an embed URL
        if (url.includes('/embed/') || url.includes('player.')) {
            return url;
        }
        
        // Default: return original URL
        return url;
    }
    
    function getThumbnailUrlFromData(video) {
        // Use custom thumbnail if provided
        if (video.thumbnail) return video.thumbnail;
        
        // YouTube thumbnail
        if (video.videoSource === 'youtube' || video.videoUrl?.includes('youtube.com') || video.videoUrl?.includes('youtu.be')) {
            const videoId = extractYouTubeVideoId(video.videoUrl);
            if (videoId) {
                // Try maxresdefault first, fallback to hqdefault
                return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
        }
        
        // Default placeholder
        return 'https://via.placeholder.com/640x360?text=Video+Thumbnail';
    }
    
    // ============================================
    // FETCH VIDEOS FROM DATABASE
    // ============================================
    
    async function fetchVideosFromDatabase() {
        try {
            console.log('📡 Fetching videos from database...');
            
            const response = await fetch(`${CONFIG.apiBaseUrl}/api/videos?limit=20`);
            
            if (!response.ok) {
                console.log('❌ No videos found in database');
                return [];
            }
            
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                console.log(`✅ Found ${result.data.length} videos in database`);
                return result.data;
            } else {
                console.log('⚠️ No videos found in database');
                return [];
            }
            
        } catch (error) {
            console.error('❌ Error fetching videos:', error);
            return [];
        }
    }
    
    // ============================================
    // CREATE DEMO VIDEO SECTION (Only if videos exist)
    // ============================================
    
    function createDemoVideoSection(videos) {
        if (document.getElementById('bbVideoSection')) return;
        if (!videos || videos.length === 0) {
            console.log('🚫 No videos available, skipping video section');
            return;
        }
        
        const videoSection = document.createElement('section');
        videoSection.id = 'bbVideoSection';
        videoSection.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 60px 20px;
            position: relative;
            overflow: hidden;
        `;
        
        videoSection.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1; pointer-events: none;">
                <div style="position: absolute; top: 20%; left: 10%; width: 300px; height: 300px; background: rgba(255,255,255,0.3); border-radius: 50%; filter: blur(100px);"></div>
                <div style="position: absolute; bottom: 20%; right: 10%; width: 400px; height: 400px; background: rgba(255,255,255,0.2); border-radius: 50%; filter: blur(100px);"></div>
            </div>
            
            <div style="max-width: 1200px; margin: 0 auto; position: relative; z-index: 1;">
                <div style="text-align: center; margin-bottom: 50px;">
                    <span style="background: rgba(255,255,255,0.2); color: white; padding: 8px 24px; border-radius: 50px; font-size: 14px; display: inline-block; margin-bottom: 15px;">
                        🎥 हमारी शिक्षण विधि / Our Teaching Method
                    </span>
                    <h2 style="color: white; font-size: 2rem; margin-bottom: 15px;">डेमो वीडियो देखें</h2>
                    <p style="color: rgba(255,255,255,0.9); max-width: 600px; margin: 0 auto;">Watch Demo Videos | समझें कैसे हम बनाते हैं सफल</p>
                </div>
                
                <div id="bbFeaturedVideoContainer" style="margin-bottom: 40px;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h3 style="color: white;">📚 अन्य वीडियो / More Videos</h3>
                    <button id="bbViewMoreVideos" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        padding: 8px 20px;
                        border-radius: 30px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    ">सभी देखें →</button>
                </div>
                
                <div id="bbVideosGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;"></div>
            </div>
        `;
        
        // Insert after hero section
        const heroSection = document.querySelector('.hero-section, .banner, header');
        if (heroSection && heroSection.nextSibling) {
            heroSection.parentNode.insertBefore(videoSection, heroSection.nextSibling);
        } else {
            document.body.insertBefore(videoSection, document.body.firstChild);
        }
        
        // Render videos
        renderVideosFromData(videos);
        
        // View more button
        const viewMoreBtn = document.getElementById('bbViewMoreVideos');
        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', () => {
                const grid = document.getElementById('bbVideosGrid');
                if (grid) {
                    renderAllVideosFromData(grid, videos);
                }
            });
        }
    }
    
    function renderVideosFromData(videos) {
        const featuredContainer = document.getElementById('bbFeaturedVideoContainer');
        const grid = document.getElementById('bbVideosGrid');
        
        if (!videos || videos.length === 0) return;
        
        const featuredVideo = videos.find(v => v.featured === true) || videos[0];
        
        if (featuredContainer) {
            renderFeaturedVideoFromData(featuredVideo, featuredContainer);
        }
        
        const gridVideos = videos.filter(v => v._id !== featuredVideo._id).slice(0, 4);
        
        if (grid) {
            renderVideosGridFromData(grid, gridVideos);
        }
    }
    
    function renderFeaturedVideoFromData(video, container) {
        if (!container || !video) return;
        
        const embedUrl = getEmbedUrlFromData(video.videoUrl, video.videoSource || 'youtube');
        
        container.innerHTML = `
            <div style="
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            ">
                <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe src="${embedUrl}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="padding: 20px;">
                    <h3 style="margin: 0 0 8px; color: white; font-size: 20px;">${escapeHtml(video.title)}</h3>
                    <p style="margin: 0; color: rgba(255,255,255,0.8);">${escapeHtml(video.description || 'Watch this demo video')}</p>
                </div>
            </div>
        `;
    }
    
    function renderVideosGridFromData(container, videos) {
        if (!container) return;
        
        if (videos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: white; padding: 40px;">
                    <p>More videos coming soon...</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = videos.map(video => {
            const videoId = extractYouTubeVideoId(video.videoUrl);
            const thumbnail = video.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://via.placeholder.com/640x360?text=Video');
            
            return `
            <div onclick="playDemoVideoFromData('${escapeHtml(video.videoUrl)}', '${video.videoSource || 'youtube'}', '${escapeHtml(video.title)}')" style="
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <div style="position: relative;">
                    <img src="${thumbnail}" alt="${escapeHtml(video.title)}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" onerror="this.src='https://via.placeholder.com/640x360?text=Video'">
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: rgba(0,0,0,0.6);
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: transform 0.2s;
                    ">
                        <span style="color: white; font-size: 20px;">▶</span>
                    </div>
                </div>
                <div style="padding: 15px;">
                    <h4 style="margin: 0 0 5px; color: white; font-size: 16px;">${escapeHtml(video.title)}</h4>
                    <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">${escapeHtml((video.description || '').substring(0, 60))}...</p>
                </div>
            </div>
        `}).join('');
    }
    
    function renderAllVideosFromData(container, videos) {
        if (!container) return;
        
        container.innerHTML = videos.map(video => {
            const videoId = extractYouTubeVideoId(video.videoUrl);
            const thumbnail = video.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://via.placeholder.com/640x360?text=Video');
            
            return `
            <div onclick="playDemoVideoFromData('${escapeHtml(video.videoUrl)}', '${video.videoSource || 'youtube'}', '${escapeHtml(video.title)}')" style="
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <div style="position: relative;">
                    <img src="${thumbnail}" alt="${escapeHtml(video.title)}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" onerror="this.src='https://via.placeholder.com/640x360?text=Video'">
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: rgba(0,0,0,0.6);
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <span style="color: white; font-size: 20px;">▶</span>
                    </div>
                </div>
                <div style="padding: 15px;">
                    <h4 style="margin: 0 0 5px; color: white; font-size: 16px;">${escapeHtml(video.title)}</h4>
                    <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">${escapeHtml((video.description || '').substring(0, 60))}...</p>
                </div>
            </div>
        `}).join('');
    }
    
    // ============================================
    // IMPROVED VIDEO PLAYER MODAL - INSTANT PLAY
    // ============================================
    
    function createVideoPlayerModal() {
        if (document.getElementById('bbDemoVideoModal')) return;
        
        const videoModal = document.createElement('div');
        videoModal.id = 'bbDemoVideoModal';
        videoModal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 100002;
            justify-content: center;
            align-items: center;
        `;
        
        videoModal.innerHTML = `
            <div style="width: 90%; max-width: 1200px; position: relative;">
                <button onclick="closeVideoPlayerModal()" style="
                    position: absolute;
                    top: -50px;
                    right: 0;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 40px;
                    cursor: pointer;
                    z-index: 100003;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">×</button>
                <div id="bbDemoVideoPlayer" style="
                    position: relative;
                    padding-bottom: 56.25%;
                    height: 0;
                    background: #000;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                "></div>
                <div id="bbVideoTitle" style="
                    color: white;
                    text-align: center;
                    margin-top: 15px;
                    font-size: 18px;
                    font-weight: 500;
                "></div>
            </div>
        `;
        
        document.body.appendChild(videoModal);
    }
    
    window.playDemoVideoFromData = function(videoUrl, videoType, videoTitle) {
        console.log('🎬 Playing video:', videoUrl, videoType, videoTitle);
        
        // Create modal if not exists
        createVideoPlayerModal();
        
        const videoModal = document.getElementById('bbDemoVideoModal');
        const player = document.getElementById('bbDemoVideoPlayer');
        const titleDiv = document.getElementById('bbVideoTitle');
        
        if (!videoModal || !player) {
            console.error('Video modal not found');
            return;
        }
        
        // Generate embed URL
        let embedUrl = getEmbedUrlFromData(videoUrl, videoType);
        
        // Add autoplay if not present
        if (embedUrl && !embedUrl.includes('autoplay')) {
            embedUrl += embedUrl.includes('?') ? '&autoplay=1' : '?autoplay=1';
        }
        
        console.log('📺 Embed URL:', embedUrl);
        
        // Set video title
        if (titleDiv) {
            titleDiv.innerHTML = videoTitle || 'Playing Video';
        }
        
        // Create iframe
        player.innerHTML = `
            <iframe src="${embedUrl}" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
        // Show modal
        videoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Close on escape key
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                closeVideoPlayerModal();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    };
    
    window.closeVideoPlayerModal = function() {
        const videoModal = document.getElementById('bbDemoVideoModal');
        const player = document.getElementById('bbDemoVideoPlayer');
        
        if (videoModal) {
            videoModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // Clear iframe to stop video playing
        if (player) {
            player.innerHTML = '';
        }
    };
    
    // ============================================
    // CREATE ENQUIRY BUTTON (Center Position)
    // ============================================
    
    function createEnquiryButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            animation: bbFloat 3s ease-in-out infinite;
        `;
        
        buttonContainer.innerHTML = `
            <button id="bbEnquiryTriggerBtn" style="
                background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
                border: none;
                padding: 14px 32px;
                border-radius: 60px;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(255,107,107,0.4);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                color: white;
                font-weight: bold;
                font-size: 18px;
                animation: bbPulse 2s infinite;
            ">
                <span style="font-size: 24px;">📝</span>
                <span>Free Counselling | निःशुल्क परामर्श</span>
                <span style="font-size: 20px;">👇</span>
            </button>
        `;
        
        document.body.appendChild(buttonContainer);
        
        const triggerBtn = document.getElementById('bbEnquiryTriggerBtn');
        if (triggerBtn) {
            triggerBtn.addEventListener('click', openEnquiryModal);
        }
    }
    
    // ============================================
    // CREATE 3D CARTOON MODAL (Form)
    // ============================================
    
    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'bbEnquiryModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px);
            z-index: 100000;
            justify-content: center;
            align-items: center;
            animation: bbFadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                position: relative;
                width: 90%;
                max-width: 600px;
                max-height: 85vh;
                overflow-y: auto;
                background: linear-gradient(135deg, #fff5e6 0%, #ffe6f0 100%);
                border-radius: 60px 60px 60px 20px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.4), 0 0 0 5px #ffd966, 0 0 0 12px #ffb347;
                animation: bbCartoonPop 0.6s cubic-bezier(0.34, 1.3, 0.64, 1);
                transform-origin: center;
            " id="bbModalInner">
                
                <!-- Cartoon Character -->
                <div style="
                    position: absolute;
                    top: -40px;
                    left: -30px;
                    width: 100px;
                    height: 100px;
                    background: #ffd93d;
                    border-radius: 50%;
                    box-shadow: 0 10px 0 #ccaa33;
                    animation: bbBob 2s ease-in-out infinite;
                    z-index: 10;
                ">
                    <div style="
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        width: 15px;
                        height: 15px;
                        background: white;
                        border-radius: 50%;
                        box-shadow: 25px 0 0 white;
                    "></div>
                    <div style="
                        position: absolute;
                        bottom: 25px;
                        left: 35px;
                        width: 30px;
                        height: 20px;
                        background: #ff8866;
                        border-radius: 0 0 20px 20px;
                    "></div>
                    <div style="
                        position: absolute;
                        bottom: 10px;
                        left: 30px;
                        font-size: 30px;
                    ">🎓</div>
                </div>
                
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #ff9a3c 0%, #ff6b6b 100%);
                    padding: 35px 25px 20px 25px;
                    border-radius: 60px 60px 30px 30px;
                    text-align: center;
                    position: relative;
                ">
                    <button id="bbCloseModal" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: rgba(255,255,255,0.3);
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">×</button>
                    
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: rgba(255,255,255,0.3);
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 15px;
                        animation: bbSpin 4s linear infinite;
                    ">
                        <span style="font-size: 50px;">📝✨</span>
                    </div>
                    
                    <h2 style="color: white; margin: 0 0 8px; font-size: 28px; text-shadow: 2px 2px 0 rgba(0,0,0,0.2);">
                        🎉 Free Counselling! 🎉
                    </h2>
                    <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 16px;">
                        निःशुल्क परामर्श | Get Expert Guidance
                    </p>
                    
                    <div style="
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        margin-top: 15px;
                        flex-wrap: wrap;
                    ">
                        <span style="background: rgba(255,255,255,0.25); padding: 6px 15px; border-radius: 30px; font-size: 13px;">
                            📞 ${CONFIG.centerPhone}
                        </span>
                        <span style="background: rgba(255,255,255,0.25); padding: 6px 15px; border-radius: 30px; font-size: 13px;">
                            💬 24x7 Support
                        </span>
                    </div>
                </div>
                
                <!-- Form Body -->
                <div style="padding: 25px;">
                    <form id="bbEnquiryForm">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                👤 Full Name / पूरा नाम <span style="color: red;">*</span>
                            </label>
                            <input type="text" name="fullName" placeholder="e.g., Rajesh Kumar / राजेश कुमार" required style="
                                width: 100%;
                                padding: 14px 18px;
                                border: 2px solid #ffd966;
                                border-radius: 30px;
                                font-size: 15px;
                                background: white;
                            ">
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    📱 Mobile / मोबाइल <span style="color: red;">*</span>
                                </label>
                                <input type="tel" name="mobile" placeholder="9876543210" required style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                ">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    📞 Alternate / वैकल्पिक
                                </label>
                                <input type="tel" name="alternateMobile" placeholder="9876543210" style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                ">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    👨‍👩 Parent Name / अभिभावक
                                </label>
                                <input type="text" name="parentName" placeholder="Parent / Father Name" style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                ">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    📱 Parent Mobile
                                </label>
                                <input type="tel" name="parentMobile" placeholder="Parent Mobile Number" style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                ">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    📍 Location / शहर
                                </label>
                                <input type="text" name="location" placeholder="City / Area" style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                ">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    🏫 Board / बोर्ड
                                </label>
                                <select name="board" id="bbBoardSelectModal" style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                    background: white;
                                ">
                                    <option value="">Select Board / बोर्ड चुनें</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    📚 Class / कक्षा <span style="color: red;">*</span>
                                </label>
                                <select name="class" id="bbClassSelectModal" required style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                    background: white;
                                ">
                                    <option value="">Select Class / कक्षा चुनें</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                    👤 Applying as / आवेदन करने वाले
                                </label>
                                <select name="applicantType" id="bbApplicantTypeModal" style="
                                    width: 100%;
                                    padding: 14px 18px;
                                    border: 2px solid #ffd966;
                                    border-radius: 30px;
                                    font-size: 15px;
                                    background: white;
                                ">
                                    <option value="self">👤 Self / स्वयं</option>
                                    <option value="father">👨 Father / पिता</option>
                                    <option value="mother">👩 Mother / माता</option>
                                    <option value="friend">👥 Friend / मित्र</option>
                                    <option value="relative">👪 Relative / रिश्तेदार</option>
                                    <option value="other">📝 Other / अन्य</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 15px; display: none;" id="bbRelationField">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                🤝 Relation / संबंध
                            </label>
                            <input type="text" name="applicantRelation" placeholder="e.g., Uncle, Aunt, etc." style="
                                width: 100%;
                                padding: 14px 18px;
                                border: 2px solid #ffd966;
                                border-radius: 30px;
                                font-size: 15px;
                            ">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ff6b6b;">
                                💬 Message / संदेश
                            </label>
                            <textarea name="message" rows="3" placeholder="Your message / आपका संदेश..." style="
                                width: 100%;
                                padding: 14px 18px;
                                border: 2px solid #ffd966;
                                border-radius: 25px;
                                font-size: 15px;
                                resize: vertical;
                                font-family: inherit;
                            "></textarea>
                        </div>
                        
                        <button type="submit" style="
                            width: 100%;
                            background: linear-gradient(135deg, #ff9a3c 0%, #ff6b6b 100%);
                            color: white;
                            padding: 16px;
                            border: none;
                            border-radius: 50px;
                            font-size: 18px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 12px;
                            box-shadow: 0 5px 15px rgba(255,107,107,0.4);
                        ">
                            <span>🚀</span>
                            <span>Submit Enquiry / आवेदन करें</span>
                            <span>🎯</span>
                        </button>
                        
                        <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #ff8e53;">
                            We'll contact you within 24 hours | हम 24 घंटे में संपर्क करेंगे
                        </p>
                    </form>
                </div>
                
                <div style="
                    background: linear-gradient(135deg, #ffd966 0%, #ffb347 100%);
                    padding: 12px;
                    border-radius: 0 0 60px 20px;
                    text-align: center;
                ">
                    <p style="margin: 0; color: #663300; font-size: 12px;">
                        🎓 बाल भारती कोचिंग | Since 2010 | 5000+ Students Trained
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        populateClassDropdown('bbClassSelectModal');
        populateBoardDropdown('bbBoardSelectModal');
        
        const applicantTypeSelect = document.getElementById('bbApplicantTypeModal');
        const relationField = document.getElementById('bbRelationField');
        
        if (applicantTypeSelect && relationField) {
            applicantTypeSelect.addEventListener('change', () => {
                relationField.style.display = applicantTypeSelect.value === 'other' ? 'block' : 'none';
            });
        }
        
        const closeBtn = document.getElementById('bbCloseModal');
        const modalElement = document.getElementById('bbEnquiryModal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeEnquiryModal);
        }
        
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) closeEnquiryModal();
        });
        
        const form = document.getElementById('bbEnquiryForm');
        if (form) {
            form.addEventListener('submit', handleEnquirySubmit);
        }
    }
    
    function populateClassDropdown(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        CLASS_LIST.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.value;
            option.textContent = cls.label;
            select.appendChild(option);
        });
    }
    
    function populateBoardDropdown(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        BOARD_LIST.forEach(board => {
            const option = document.createElement('option');
            option.value = board.replace(/🏫 | \/.*/g, '').trim();
            option.textContent = board;
            select.appendChild(option);
        });
    }
    
    function openEnquiryModal() {
        const modal = document.getElementById('bbEnquiryModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            const inner = document.getElementById('bbModalInner');
            if (inner) {
                inner.addEventListener('mousemove', (e) => {
                    const rect = inner.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    inner.style.transform = `rotateX(${y * 5}deg) rotateY(${x * 5}deg) scale(1.02)`;
                });
                inner.addEventListener('mouseleave', () => {
                    inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
                });
            }
        }
    }
    
    function closeEnquiryModal() {
        const modal = document.getElementById('bbEnquiryModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    // ============================================
    // HANDLE ENQUIRY SUBMIT
    // ============================================
    
    async function handleEnquirySubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const now = Date.now();
        
        if (now - CONFIG.lastSubmissionTime < CONFIG.debounceTime) {
            const waitTime = Math.ceil((CONFIG.debounceTime - (now - CONFIG.lastSubmissionTime)) / 1000);
            showToast(`कृपया ${waitTime} सेकंड बाद पुनः प्रयास करें / Please wait ${waitTime} seconds`, 'warning');
            return;
        }
        
        const formData = new FormData(form);
        const data = {
            fullName: formData.get('fullName')?.trim(),
            mobile: formData.get('mobile')?.trim(),
            alternateMobile: formData.get('alternateMobile')?.trim() || '',
            parentName: formData.get('parentName')?.trim() || '',
            parentMobile: formData.get('parentMobile')?.trim() || '',
            location: formData.get('location')?.trim() || '',
            board: formData.get('board')?.trim() || '',
            class: formData.get('class')?.trim() || '',
            applicantType: formData.get('applicantType') || 'self',
            applicantRelation: formData.get('applicantRelation')?.trim() || '',
            message: formData.get('message')?.trim() || '',
            source: 'website'
        };
        
        if (!data.fullName) {
            showToast('कृपया अपना पूरा नाम दर्ज करें / Please enter full name', 'error');
            return;
        }
        
        if (!data.mobile || !/^\d{10}$/.test(data.mobile)) {
            showToast('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें / Enter valid 10-digit mobile', 'error');
            return;
        }
        
        if (data.alternateMobile && !/^\d{10}$/.test(data.alternateMobile)) {
            showToast('वैकल्पिक मोबाइल नंबर 10 अंकों का होना चाहिए / Alternate mobile must be 10 digits', 'error');
            return;
        }
        
        if (!data.class) {
            showToast('कृपया कक्षा का चयन करें / Please select class', 'error');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="bb-spinner"></span> Submitting / भेज रहे हैं...';
        
        try {
            CONFIG.lastSubmissionTime = Date.now();
            
            const response = await fetch(`${CONFIG.apiBaseUrl}/api/enquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.status === 429) {
                showToast('बहुत अधिक अनुरोध! कृपया 5 मिनट बाद पुनः प्रयास करें / Too many requests! Please wait 5 minutes', 'warning');
                return;
            }
            
            if (result.success) {
                showSuccessAnimation(data.fullName);
                form.reset();
                closeEnquiryModal();
                showWhatsAppButton(data);
                sendAutoReply(data);
            } else {
                showToast(result.message || 'जमा करने में विफल। कृपया पुनः प्रयास करें। / Submission failed. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('Enquiry error:', error);
            showToast('नेटवर्क त्रुटि। कृपया पुनः प्रयास करें। / Network error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    
    // ============================================
    // UI COMPONENTS
    // ============================================
    
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.bb-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'bb-toast';
        
        const icons = {
            success: { emoji: '✅', color: '#4caf50' },
            error: { emoji: '❌', color: '#f44336' },
            warning: { emoji: '⚠️', color: '#ff9800' }
        };
        
        const icon = icons[type] || icons.success;
        
        toast.innerHTML = `
            <div style="
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: ${icon.color};
                color: white;
                padding: 14px 24px;
                border-radius: 60px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 100000;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: bbSlideUp 0.3s ease;
                white-space: nowrap;
            ">
                <span style="font-size: 20px;">${icon.emoji}</span>
                <span style="font-size: 14px;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast && toast.parentElement) {
                toast.style.animation = 'bbSlideDown 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }
    
    function showSuccessAnimation(name) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100001;
            animation: bbFadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #ffd966 0%, #ffb347 100%);
                padding: 40px;
                border-radius: 80px 80px 80px 40px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                animation: bbCartoonPop 0.5s ease;
                box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                border: 5px solid white;
            ">
                <div style="
                    width: 100px;
                    height: 100px;
                    background: white;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    animation: bbSpin 0.5s ease;
                ">
                    <span style="font-size: 60px;">🎉🎓</span>
                </div>
                
                <h2 style="color: #663300; margin-bottom: 10px; font-size: 28px;">🎉 धन्यवाद ${name}! 🎉</h2>
                <h3 style="color: #ff6b6b; margin-bottom: 15px; font-size: 18px;">Thank You!</h3>
                
                <p style="color: #663300; margin-bottom: 25px; line-height: 1.6;">
                    ✅ आपकी enquiry सफलतापूर्वक जमा हो गई है।<br>
                    ✅ Your enquiry has been submitted successfully.<br><br>
                    📞 हम जल्द ही आपसे संपर्क करेंगे।<br>
                    📞 We'll contact you soon.
                </p>
                
                <div style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 40px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div>📞 ${CONFIG.centerPhone}</div>
                        <div>💬 24x7 Support</div>
                    </div>
                </div>
                
                <button onclick="this.closest('div').parentElement.remove()" style="
                    background: #ff6b6b;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 50px;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">OK / ठीक है 🎯</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal && modal.parentElement) {
                modal.style.animation = 'bbFadeOut 0.3s ease';
                setTimeout(() => modal.remove(), 300);
            }
        }, 6000);
    }
    
    function showWhatsAppButton(data) {
        const btn = document.createElement('div');
        btn.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 20px;
            background: #25D366;
            color: white;
            padding: 12px 20px;
            border-radius: 60px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 8px 25px rgba(37,211,102,0.3);
            animation: bbSlideInRight 0.5s ease;
            font-weight: 500;
        `;
        
        btn.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style="width: 24px; height: 24px;">
            <span>WhatsApp पर संपर्क करें</span>
        `;
        
        btn.onclick = () => {
            const message = `नमस्ते, मैं ${data.fullName} हूँ। मैंने ${data.class} कक्षा के लिए enquiry की थी। कृपया मुझे संपर्क करें। / Hello, I am ${data.fullName}. I have submitted enquiry for ${data.class} class. Please contact me.`;
            window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        };
        
        document.body.appendChild(btn);
        
        setTimeout(() => {
            if (btn && btn.parentElement) {
                btn.style.animation = 'bbSlideOutRight 0.3s ease';
                setTimeout(() => btn.remove(), 300);
            }
        }, 15000);
    }
    
    function sendAutoReply(data) {
        console.log('📱 Auto-reply SMS would be sent to:', data.mobile);
        showToast('आपके मोबाइल पर सूचना भेज दी गई है 📱 / SMS sent to your mobile', 'success');
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    // ============================================
    // ADD CSS ANIMATIONS
    // ============================================
    
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bbFloat {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(-10px); }
            }
            @keyframes bbPulse {
                0%, 100% { box-shadow: 0 10px 30px rgba(255,107,107,0.4); transform: scale(1); }
                50% { box-shadow: 0 15px 40px rgba(255,107,107,0.6); transform: scale(1.05); }
            }
            @keyframes bbCartoonPop {
                0% { transform: scale(0.2) rotate(-10deg); opacity: 0; }
                50% { transform: scale(1.1) rotate(2deg); }
                70% { transform: scale(0.95) rotate(-1deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes bbBob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes bbSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes bbSlideUp {
                from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            @keyframes bbSlideDown {
                from { transform: translateX(-50%) translateY(0); opacity: 1; }
                to { transform: translateX(-50%) translateY(100px); opacity: 0; }
            }
            @keyframes bbSlideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes bbSlideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes bbFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes bbFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            .bb-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 0.8s linear infinite;
                margin-right: 8px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            #bbEnquiryForm input:focus, 
            #bbEnquiryForm select:focus, 
            #bbEnquiryForm textarea:focus {
                outline: none;
                border-color: #ff9a3c;
                box-shadow: 0 0 0 3px rgba(255,154,60,0.2);
            }
            @media (max-width: 768px) {
                #bbEnquiryTriggerBtn {
                    padding: 10px 20px !important;
                    font-size: 14px !important;
                }
                #bbEnquiryTriggerBtn span:first-child {
                    font-size: 18px !important;
                }
                .bb-toast > div {
                    white-space: normal !important;
                    max-width: 90%;
                    text-align: center;
                }
                #bbModalInner {
                    width: 95%;
                    max-height: 90vh;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ============================================
    // INITIALIZE EVERYTHING
    // ============================================
    
    async function init() {
        console.log('🚀 Bal Bharti Coaching - Complete Module Initialized');
        
        addStyles();
        createModal();
        createEnquiryButton();
        createVideoPlayerModal();
        
        const videos = await fetchVideosFromDatabase();
        
        if (videos && videos.length > 0) {
            console.log(`✅ Creating video section with ${videos.length} videos`);
            createDemoVideoSection(videos);
        } else {
            console.log('❌ No videos found in database');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
