// ============================================
// BAL BHARTI COACHING - ENQUIRY & VIDEO MODULE
// Complete Self-Contained JavaScript
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
        centerPhone: '+919876543210',
        centerName: 'Bal Bharti Coaching Center'
    };
    
    // ============================================
    // CLASS LIST (UKG to Graduation)
    // ============================================
    
    const CLASS_LIST = [
        { value: 'UKG', label: '📚 UKG' },
        { value: '1st', label: '📖 1st Class' },
        { value: '2nd', label: '📖 2nd Class' },
        { value: '3rd', label: '📖 3rd Class' },
        { value: '4th', label: '📖 4th Class' },
        { value: '5th', label: '📖 5th Class' },
        { value: '6th', label: '📖 6th Class' },
        { value: '7th', label: '📖 7th Class' },
        { value: '8th', label: '📖 8th Class' },
        { value: '9th', label: '📖 9th Class' },
        { value: '10th', label: '🎯 10th Class (Board)' },
        { value: '11th Science', label: '🔬 11th Science' },
        { value: '11th Commerce', label: '📊 11th Commerce' },
        { value: '11th Arts', label: '🎨 11th Arts' },
        { value: '12th Science', label: '🔬 12th Science' },
        { value: '12th Commerce', label: '📊 12th Commerce' },
        { value: '12th Arts', label: '🎨 12th Arts' },
        { value: 'B.Sc', label: '🎓 B.Sc - Bachelor of Science' },
        { value: 'B.Com', label: '🎓 B.Com - Bachelor of Commerce' },
        { value: 'B.A', label: '🎓 B.A - Bachelor of Arts' },
        { value: 'BCA', label: '💻 BCA - Computer Applications' },
        { value: 'BBA', label: '📈 BBA - Business Administration' },
        { value: 'M.Sc', label: '🎓 M.Sc - Master of Science' },
        { value: 'M.Com', label: '🎓 M.Com - Master of Commerce' },
        { value: 'M.A', label: '🎓 M.A - Master of Arts' },
        { value: 'Competitive', label: '🏆 Competitive Exam Preparation' },
        { value: 'Other', label: '📚 Other' }
    ];
    
    // ============================================
    // BOARD LIST
    // ============================================
    
    const BOARD_LIST = [
        '🏫 CBSE', '🏫 ICSE', '🏫 UP Board', '🏫 Bihar Board', 
        '🏫 MP Board', '🏫 Rajasthan Board', '🏫 Haryana Board', 
        '🏫 Punjab Board', '🏫 West Bengal Board', '🏫 Maharashtra Board',
        '🏫 Other State Board'
    ];
    
    // ============================================
    // APPLICANT TYPES
    // ============================================
    
    const APPLICANT_TYPES = [
        { value: 'self', label: '👤 स्वयं', icon: '😊' },
        { value: 'father', label: '👨 पिता', icon: '👔' },
        { value: 'mother', label: '👩 माता', icon: '🌸' },
        { value: 'friend', label: '👥 मित्र', icon: '🤝' },
        { value: 'relative', label: '👪 रिश्तेदार', icon: '🏠' },
        { value: 'other', label: '📝 अन्य', icon: '✍️' }
    ];
    
    // ============================================
    // DEFAULT VIDEOS
    // ============================================
    
    const DEFAULT_VIDEOS = [
        {
            id: 'intro1',
            title: '🎓 बाल भारती कोचिंग का परिचय',
            description: 'हमारे संस्थान की शिक्षण पद्धति और सफलता की कहानी',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            videoType: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            featured: true
        },
        {
            id: 'demo1',
            title: '🔬 गणित डेमो क्लास - बीजगणित',
            description: 'गणित को आसान बनाने की हमारी विशेष विधि',
            videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
            videoType: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
            featured: false
        },
        {
            id: 'demo2',
            title: '🧪 विज्ञान डेमो - भौतिक विज्ञान',
            description: 'प्रैक्टिकल तरीके से विज्ञान सीखें',
            videoUrl: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
            videoType: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/3JZ_D3ELwOQ/maxresdefault.jpg',
            featured: false
        },
        {
            id: 'demo3',
            title: '📖 अंग्रेजी ग्रामर क्लास',
            description: 'स्पोकन इंग्लिश और ग्रामर की बेहतरीन क्लास',
            videoUrl: 'https://www.youtube.com/watch?v=8jLOx1hD3_o',
            videoType: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/8jLOx1hD3_o/maxresdefault.jpg',
            featured: false
        },
        {
            id: 'demo4',
            title: '💻 कंप्यूटर साइंस - प्रोग्रामिंग बेसिक्स',
            description: 'कोडिंग की दुनिया में पहला कदम',
            videoUrl: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
            videoType: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/qz0aGYrrlhU/maxresdefault.jpg',
            featured: false
        },
        {
            id: 'demo5',
            title: '📝 एग्जाम टिप्स और ट्रिक्स',
            description: 'परीक्षा में अच्छे नंबर लाने के सीक्रेट',
            videoUrl: 'https://www.youtube.com/watch?v=6yBDK5nqT7k',
            videoType: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/6yBDK5nqT7k/maxresdefault.jpg',
            featured: false
        }
    ];
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.bb-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'bb-toast';
        
        const icons = {
            success: { emoji: '✅', color: '#4caf50', title: 'सफलता!' },
            error: { emoji: '❌', color: '#f44336', title: 'त्रुटि!' },
            warning: { emoji: '⚠️', color: '#ff9800', title: 'सूचना!' },
            info: { emoji: 'ℹ️', color: '#2196f3', title: 'जानकारी' }
        };
        
        const icon = icons[type] || icons.info;
        
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${icon.color};
                color: white;
                padding: 16px 24px;
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                z-index: 100000;
                display: flex;
                align-items: center;
                gap: 14px;
                font-family: 'Segoe UI', 'Poppins', sans-serif;
                animation: bbSlideIn 0.3s ease;
                max-width: 380px;
                backdrop-filter: blur(10px);
            ">
                <span style="font-size: 28px;">${icon.emoji}</span>
                <div style="flex: 1;">
                    <strong style="display: block; margin-bottom: 6px; font-size: 16px;">${icon.title}</strong>
                    <span style="font-size: 13px; opacity: 0.95;">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 22px;
                    cursor: pointer;
                    opacity: 0.7;
                    padding: 0 5px;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast && toast.parentElement) {
                toast.style.animation = 'bbSlideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    function getYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    function getEmbedUrl(url, type) {
        if (type === 'youtube') {
            const id = getYouTubeId(url);
            if (id) return `https://www.youtube.com/embed/${id}`;
        }
        return url;
    }
    
    // ============================================
    // CREATE ENQUIRY SECTION
    // ============================================
    
    function createEnquirySection() {
        // Find hero section or body to insert after
        const heroSection = document.querySelector('.hero-section, .banner, header');
        const targetElement = heroSection || document.body;
        
        const enquirySection = document.createElement('section');
        enquirySection.id = 'bb-enquiry-section';
        enquirySection.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 60px 20px;
            position: relative;
            overflow: hidden;
        `;
        
        enquirySection.innerHTML = `
            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -80px; left: -80px; width: 300px; height: 300px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
                    <div>
                        <div style="margin-bottom: 20px;">
                            <span style="background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 50px; color: white; font-size: 14px;">🎯 निःशुल्क परामर्श</span>
                        </div>
                        <h2 style="color: white; font-size: 2.5rem; margin-bottom: 20px; font-weight: 700;">
                            आज ही करें आवेदन
                        </h2>
                        <p style="color: rgba(255,255,255,0.9); font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px;">
                            हमारे विशेषज्ञ शिक्षक आपको बेहतर मार्गदर्शन देंगे। 
                            सीमित सीटों के लिए जल्दी करें!
                        </p>
                        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 10px; color: white;">
                                <span style="font-size: 24px;">📞</span>
                                <span>${CONFIG.centerPhone}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; color: white;">
                                <span style="font-size: 24px;">🏆</span>
                                <span>5000+ छात्र प्रशिक्षित</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <form id="bbEnquiryForm" style="
                            background: white;
                            padding: 35px;
                            border-radius: 24px;
                            box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                        ">
                            <h3 style="margin-bottom: 25px; color: #333; font-size: 1.5rem;">📝 आवेदन फॉर्म</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <input type="text" name="fullName" placeholder="👤 पूरा नाम *" required style="grid-column: span 2; padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 15px;">
                                <input type="tel" name="mobile" placeholder="📱 मोबाइल नंबर *" required style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px;">
                                <input type="tel" name="alternateMobile" placeholder="📞 वैकल्पिक मोबाइल" style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px;">
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <input type="text" name="parentName" placeholder="👨‍👩 पिता/माता का नाम" style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px;">
                                <input type="tel" name="parentMobile" placeholder="📱 पिता/माता का मोबाइल" style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px;">
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <input type="text" name="location" placeholder="📍 शहर/इलाका" style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px;">
                                <select name="board" id="bbBoardSelect" style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px; background: white;">
                                    <option value="">🏫 बोर्ड चुनें</option>
                                </select>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <select name="class" id="bbClassSelect" style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px; background: white;" required>
                                    <option value="">📚 कक्षा चुनें *</option>
                                </select>
                                <select name="applicantType" id="bbApplicantType" style="padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px; background: white;">
                                    <option value="self">👤 स्वयं</option>
                                    <option value="father">👨 पिता</option>
                                    <option value="mother">👩 माता</option>
                                    <option value="friend">👥 मित्र</option>
                                    <option value="relative">👪 रिश्तेदार</option>
                                    <option value="other">📝 अन्य</option>
                                </select>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <input type="text" name="applicantRelation" placeholder="अन्य होने पर संबंध बताएं" style="width: 100%; padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <textarea name="message" rows="3" placeholder="💬 आपका संदेश..." style="width: 100%; padding: 14px; border: 2px solid #e0e0e0; border-radius: 12px; resize: vertical;"></textarea>
                            </div>
                            
                            <button type="submit" style="
                                width: 100%;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                padding: 16px;
                                border: none;
                                border-radius: 12px;
                                font-size: 18px;
                                font-weight: bold;
                                cursor: pointer;
                                transition: transform 0.3s, box-shadow 0.3s;
                            ">
                                🚀 निःशुल्क परामर्श के लिए आवेदन करें
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after hero section
        if (heroSection && heroSection.nextSibling) {
            heroSection.parentNode.insertBefore(enquirySection, heroSection.nextSibling);
        } else {
            document.body.appendChild(enquirySection);
        }
        
        // Populate dropdowns
        populateClassDropdown('bbClassSelect');
        populateBoardDropdown('bbBoardSelect');
        
        // Attach form submit handler
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
            option.value = board.replace('🏫 ', '');
            option.textContent = board;
            select.appendChild(option);
        });
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
            showToast(`कृपया ${waitTime} सेकंड बाद पुनः प्रयास करें`, 'warning');
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
        
        // Validation
        if (!data.fullName) {
            showToast('कृपया अपना पूरा नाम दर्ज करें', 'error');
            return;
        }
        
        if (!data.mobile || !/^\d{10}$/.test(data.mobile)) {
            showToast('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें', 'error');
            return;
        }
        
        if (data.alternateMobile && !/^\d{10}$/.test(data.alternateMobile)) {
            showToast('वैकल्पिक मोबाइल नंबर 10 अंकों का होना चाहिए', 'error');
            return;
        }
        
        if (!data.class) {
            showToast('कृपया कक्षा का चयन करें', 'error');
            return;
        }
        
        // Submit button loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="bb-spinner"></span> भेज रहे हैं...';
        
        try {
            CONFIG.lastSubmissionTime = Date.now();
            
            const response = await fetch(`${CONFIG.apiBaseUrl}/api/enquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.status === 429) {
                showToast('बहुत अधिक अनुरोध! कृपया 5 मिनट बाद पुनः प्रयास करें', 'warning');
                return;
            }
            
            if (result.success) {
                showSuccessAnimation(data.fullName);
                form.reset();
                showWhatsAppButton(data);
                sendAutoReply(data);
            } else {
                showToast(result.message || 'जमा करने में विफल। कृपया पुनः प्रयास करें।', 'error');
            }
            
        } catch (error) {
            console.error('Enquiry error:', error);
            showToast('नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
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
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100001;
            animation: bbFadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px;
                border-radius: 32px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                animation: bbBounceIn 0.5s ease;
                box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 80px; margin-bottom: 20px; animation: bbPop 0.5s ease;">🎉</div>
                <h2 style="color: white; margin-bottom: 15px; font-size: 28px;">धन्यवाद ${name}!</h2>
                <p style="color: rgba(255,255,255,0.95); margin-bottom: 25px; line-height: 1.6;">
                    आपकी enquiry सफलतापूर्वक जमा हो गई है।<br>
                    हम जल्द ही आपसे संपर्क करेंगे।
                </p>
                <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 16px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: center; gap: 20px;">
                        <div>📞 ${CONFIG.centerPhone}</div>
                        <div>💬 24x7 सहायता</div>
                    </div>
                </div>
                <button onclick="this.closest('div').parentElement.remove()" style="
                    background: white;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 40px;
                    color: #667eea;
                    font-weight: bold;
                    font-size: 16px;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">ठीक है</button>
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
            bottom: 20px;
            left: 20px;
            background: #25D366;
            color: white;
            padding: 14px 24px;
            border-radius: 60px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            z-index: 99999;
            box-shadow: 0 8px 25px rgba(37,211,102,0.3);
            animation: bbSlideInLeft 0.5s ease;
            font-family: 'Segoe UI', sans-serif;
            font-weight: 500;
        `;
        
        btn.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style="width: 28px; height: 28px;">
            <span>WhatsApp पर संपर्क करें</span>
        `;
        
        btn.onclick = () => {
            const message = `नमस्ते, मैं ${data.fullName} हूँ। मैंने ${data.class} कक्षा के लिए enquiry की थी। कृपया मुझे संपर्क करें।`;
            window.open(`https://wa.me/${CONFIG.centerPhone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
        };
        
        document.body.appendChild(btn);
        
        setTimeout(() => {
            if (btn && btn.parentElement) {
                btn.style.animation = 'bbSlideOutLeft 0.3s ease';
                setTimeout(() => btn.remove(), 300);
            }
        }, 15000);
    }
    
    function sendAutoReply(data) {
        const replyMessage = `🎉 नमस्ते ${data.fullName} जी!\n\n✅ आपकी enquiry सफलतापूर्वक जमा हो गई है।\n📚 कक्षा: ${data.class}\n🏫 बोर्ड: ${data.board || 'निर्धारित नहीं'}\n\n📞 हम जल्द ही आपसे संपर्क करेंगे।\n\n🙏 धन्यवाद\n- बाल भारती कोचिंग सेंटर`;
        
        console.log('📱 Auto-reply SMS:', replyMessage);
        showToast('आपके मोबाइल पर सूचना भेज दी गई है 📱', 'success');
    }
    
    // ============================================
    // CREATE VIDEO SECTION
    // ============================================
    
    function createVideoSection() {
        const enquirySection = document.getElementById('bb-enquiry-section');
        const targetElement = enquirySection ? enquirySection.nextSibling : document.body;
        
        const videoSection = document.createElement('section');
        videoSection.id = 'bb-video-section';
        videoSection.style.cssText = `
            background: #f8f9fa;
            padding: 70px 20px;
        `;
        
        videoSection.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 50px;">
                    <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 24px; border-radius: 50px; font-size: 14px; display: inline-block; margin-bottom: 15px;">🎥 लर्निंग वीडियो</span>
                    <h2 style="font-size: 2.2rem; margin-bottom: 15px; color: #333;">हमारी शिक्षण विधि देखें</h2>
                    <p style="color: #666; max-width: 600px; margin: 0 auto;">डेमो वीडियो देखकर समझें कैसे हम छात्रों को बनाते हैं सफल</p>
                </div>
                
                <div id="bbFeaturedVideo" style="margin-bottom: 50px;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h3 style="color: #333;">📚 सभी वीडियो</h3>
                    <div style="display: flex; gap: 10px;">
                        <button id="bbViewAllBtn" style="background: none; border: none; color: #667eea; cursor: pointer; font-weight: bold;">सभी देखें →</button>
                    </div>
                </div>
                
                <div id="bbVideosGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px;"></div>
            </div>
        `;
        
        if (enquirySection && enquirySection.nextSibling) {
            enquirySection.parentNode.insertBefore(videoSection, enquirySection.nextSibling);
        } else {
            document.body.appendChild(videoSection);
        }
        
        // Create video modal
        createVideoModal();
        
        // Load videos
        loadVideos();
    }
    
    function createVideoModal() {
        const modal = document.createElement('div');
        modal.id = 'bbVideoModal';
        modal.style.cssText = `
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
        
        modal.innerHTML = `
            <div style="width: 90%; max-width: 1000px; position: relative;">
                <button onclick="document.getElementById('bbVideoModal').style.display='none'" style="
                    position: absolute;
                    top: -50px;
                    right: 0;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 32px;
                    cursor: pointer;
                    z-index: 10;
                ">×</button>
                <div id="bbVideoPlayer" style="
                    position: relative;
                    padding-bottom: 56.25%;
                    height: 0;
                    background: #000;
                    border-radius: 16px;
                    overflow: hidden;
                "></div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async function loadVideos() {
        const grid = document.getElementById('bbVideosGrid');
        const featuredContainer = document.getElementById('bbFeaturedVideo');
        
        if (!grid) return;
        
        try {
            const response = await fetch(`${CONFIG.apiBaseUrl}/api/videos?limit=6`);
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                renderVideos(result.data.slice(0, 6), grid);
                if (result.data[0]) renderFeaturedVideo(result.data[0], featuredContainer);
                else renderDefaultFeaturedVideo(featuredContainer);
            } else {
                renderDefaultVideos(grid);
                renderDefaultFeaturedVideo(featuredContainer);
            }
        } catch (error) {
            console.error('Load videos error:', error);
            renderDefaultVideos(grid);
            renderDefaultFeaturedVideo(featuredContainer);
        }
    }
    
    function renderVideos(videos, container) {
        if (!container) return;
        
        container.innerHTML = videos.map(video => `
            <div onclick="window.playVideo('${video.videoUrl}', '${video.videoSource || 'youtube'}')" style="
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                cursor: pointer;
                transition: all 0.3s;
            ">
                <div style="position: relative;">
                    <img src="${video.thumbnail || 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'}" alt="${video.title}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: rgba(0,0,0,0.7);
                        border-radius: 50%;
                        width: 55px;
                        height: 55px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <span style="color: white; font-size: 24px;">▶</span>
                    </div>
                </div>
                <div style="padding: 18px;">
                    <h4 style="margin: 0 0 8px; font-size: 18px; color: #333;">${video.title}</h4>
                    <p style="margin: 0; color: #666; font-size: 13px;">👁️ ${video.views || 0} views</p>
                </div>
            </div>
        `).join('');
    }
    
    function renderDefaultVideos(container) {
        container.innerHTML = DEFAULT_VIDEOS.filter(v => !v.featured).slice(0, 6).map(video => `
            <div onclick="window.playVideo('${video.videoUrl}', '${video.videoType}')" style="
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                cursor: pointer;
                transition: all 0.3s;
            ">
                <div style="position: relative;">
                    <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: rgba(0,0,0,0.7);
                        border-radius: 50%;
                        width: 55px;
                        height: 55px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <span style="color: white; font-size: 24px;">▶</span>
                    </div>
                </div>
                <div style="padding: 18px;">
                    <h4 style="margin: 0 0 8px; font-size: 18px; color: #333;">${video.title}</h4>
                    <p style="margin: 0; color: #666; font-size: 13px;">${video.description}</p>
                </div>
            </div>
        `).join('');
    }
    
    function renderFeaturedVideo(video, container) {
        if (!container) return;
        
        const embedUrl = getEmbedUrl(video.videoUrl, video.videoSource || 'youtube');
        
        container.innerHTML = `
            <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <div style="position: relative; padding-bottom: 45%;">
                    <iframe src="${embedUrl}?autoplay=0" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="padding: 25px;">
                    <h3 style="margin: 0 0 10px; font-size: 24px; color: #333;">${video.title}</h3>
                    <p style="margin: 0; color: #666; line-height: 1.6;">${video.description || 'बाल भारती कोचिंग सेंटर का फीचर्ड वीडियो'}</p>
                </div>
            </div>
        `;
    }
    
    function renderDefaultFeaturedVideo(container) {
        const featured = DEFAULT_VIDEOS.find(v => v.featured) || DEFAULT_VIDEOS[0];
        renderFeaturedVideo(featured, container);
    }
    
    // ============================================
    // VIDEO PLAYER FUNCTION
    // ============================================
    
    window.playVideo = function(videoUrl, videoType) {
        const modal = document.getElementById('bbVideoModal');
        const player = document.getElementById('bbVideoPlayer');
        
        if (!modal || !player) return;
        
        const embedUrl = getEmbedUrl(videoUrl, videoType);
        
        player.innerHTML = `
            <iframe src="${embedUrl}?autoplay=1" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Close on escape key
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    };
    
    // ============================================
    // ADD CSS ANIMATIONS
    // ============================================
    
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bbSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes bbSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes bbSlideInLeft {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes bbSlideOutLeft {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(-100%); opacity: 0; }
            }
            @keyframes bbFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes bbFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes bbBounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.95); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes bbPop {
                0% { transform: scale(0); }
                80% { transform: scale(1.2); }
                100% { transform: scale(1); }
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
            #bbEnquiryForm input:focus, #bbEnquiryForm select:focus, #bbEnquiryForm textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
            }
            .bb-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 100000;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ============================================
    // INITIALIZE EVERYTHING
    // ============================================
    
    function init() {
        console.log('🚀 Bal Bharti Coaching - Module Initialized');
        addStyles();
        createEnquirySection();
        createVideoSection();
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
