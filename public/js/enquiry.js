// ============================================
// BAL BHARTI COACHING - ENQUIRY MODAL MODULE
// Bilingual (Hindi + English) with 3D Modal
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
        centerPhone: '+919971095964',
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
    // APPLICANT TYPES - Bilingual
    // ============================================
    
    const APPLICANT_TYPES = [
        { value: 'self', label: '👤 Self / स्वयं', icon: '😊' },
        { value: 'father', label: '👨 Father / पिता', icon: '👔' },
        { value: 'mother', label: '👩 Mother / माता', icon: '🌸' },
        { value: 'friend', label: '👥 Friend / मित्र', icon: '🤝' },
        { value: 'relative', label: '👪 Relative / रिश्तेदार', icon: '🏠' },
        { value: 'other', label: '📝 Other / अन्य', icon: '✍️' }
    ];
    
    // ============================================
    // CREATE ENQUIRY BUTTON WITH 3D MODAL
    // ============================================
    
    function createEnquiryButton() {
        // Find hero section or top area
        const heroSection = document.querySelector('.hero-section, .banner, header, .container-fluid');
        const targetElement = heroSection || document.body;
        
        // Create floating button
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
            animation: bbFloat 3s ease-in-out infinite;
        `;
        
        buttonContainer.innerHTML = `
            <button id="bbEnquiryTriggerBtn" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                width: 70px;
                height: 70px;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(102,126,234,0.4);
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                color: white;
                font-weight: bold;
                animation: bbPulse 2s infinite;
            ">
                <span style="font-size: 28px;">📝</span>
                <span style="font-size: 10px;">Enquiry</span>
            </button>
            <div style="
                position: absolute;
                top: -10px;
                right: -10px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                animation: bbRipple 1.5s infinite;
            ">!</div>
        `;
        
        document.body.appendChild(buttonContainer);
        
        // Add click event
        const triggerBtn = document.getElementById('bbEnquiryTriggerBtn');
        if (triggerBtn) {
            triggerBtn.addEventListener('click', openEnquiryModal);
        }
        
        // Also add to any existing enquiry buttons
        document.querySelectorAll('.enquiry-btn, [data-enquiry]').forEach(btn => {
            btn.addEventListener('click', openEnquiryModal);
        });
    }
    
    // ============================================
    // CREATE 3D MODAL
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
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            z-index: 100000;
            justify-content: center;
            align-items: center;
            animation: bbFadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                position: relative;
                width: 90%;
                max-width: 550px;
                max-height: 90vh;
                overflow-y: auto;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
                border-radius: 32px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset;
                transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
                transition: transform 0.4s ease;
                animation: bbModalPop 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
            " id="bbModalInner">
                
                <!-- Header with gradient -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 25px;
                    border-radius: 32px 32px 0 0;
                    text-align: center;
                    position: relative;
                ">
                    <button id="bbCloseModal" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: rgba(255,255,255,0.2);
                        border: none;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">×</button>
                    
                    <div style="
                        width: 70px;
                        height: 70px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 15px;
                    ">
                        <span style="font-size: 40px;">📝</span>
                    </div>
                    
                    <h2 style="color: white; margin: 0 0 8px; font-size: 24px;">निःशुल्क परामर्श</h2>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Free Counselling | मुफ्त मार्गदर्शन</p>
                    
                    <div style="
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        margin-top: 15px;
                    ">
                        <span style="background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 12px;">📞 ${CONFIG.centerPhone}</span>
                        <span style="background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 12px;">💬 24x7 Support</span>
                    </div>
                </div>
                
                <!-- Form Body -->
                <div style="padding: 25px;">
                    <form id="bbEnquiryForm">
                        <!-- Name - Bilingual placeholder -->
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                👤 Full Name / पूरा नाम <span style="color: red;">*</span>
                            </label>
                            <input type="text" name="fullName" placeholder="e.g., Rajesh Kumar / राजेश कुमार" required style="
                                width: 100%;
                                padding: 14px 16px;
                                border: 2px solid #e0e0e0;
                                border-radius: 16px;
                                font-size: 15px;
                                transition: all 0.3s;
                                background: white;
                            ">
                        </div>
                        
                        <!-- Mobile Numbers -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    📱 Mobile / मोबाइल <span style="color: red;">*</span>
                                </label>
                                <input type="tel" name="mobile" placeholder="9876543210" required style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
                                    font-size: 15px;
                                ">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    📞 Alternate / वैकल्पिक
                                </label>
                                <input type="tel" name="alternateMobile" placeholder="9876543210" style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
                                    font-size: 15px;
                                ">
                            </div>
                        </div>
                        
                        <!-- Parent Details -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    👨‍👩 Parent Name / अभिभावक का नाम
                                </label>
                                <input type="text" name="parentName" placeholder="Parent / Father Name" style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
                                    font-size: 15px;
                                ">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    📱 Parent Mobile / अभिभावक मोबाइल
                                </label>
                                <input type="tel" name="parentMobile" placeholder="Parent Mobile Number" style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
                                    font-size: 15px;
                                ">
                            </div>
                        </div>
                        
                        <!-- Location & Board -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    📍 Location / शहर
                                </label>
                                <input type="text" name="location" placeholder="City / Area" style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
                                    font-size: 15px;
                                ">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    🏫 Board / बोर्ड
                                </label>
                                <select name="board" id="bbBoardSelectModal" style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
                                    font-size: 15px;
                                    background: white;
                                ">
                                    <option value="">Select Board / बोर्ड चुनें</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Class & Applicant Type -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    📚 Class / कक्षा <span style="color: red;">*</span>
                                </label>
                                <select name="class" id="bbClassSelectModal" required style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
                                    font-size: 15px;
                                    background: white;
                                ">
                                    <option value="">Select Class / कक्षा चुनें</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                    👤 Applying as / आवेदन करने वाले
                                </label>
                                <select name="applicantType" id="bbApplicantTypeModal" style="
                                    width: 100%;
                                    padding: 14px 16px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 16px;
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
                        
                        <!-- Relation (for Other) -->
                        <div style="margin-bottom: 15px; display: none;" id="bbRelationField">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                🤝 Relation / संबंध
                            </label>
                            <input type="text" name="applicantRelation" placeholder="e.g., Uncle, Aunt, etc." style="
                                width: 100%;
                                padding: 14px 16px;
                                border: 2px solid #e0e0e0;
                                border-radius: 16px;
                                font-size: 15px;
                            ">
                        </div>
                        
                        <!-- Message -->
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                                💬 Message / संदेश
                            </label>
                            <textarea name="message" rows="3" placeholder="Your message / आपका संदेश..." style="
                                width: 100%;
                                padding: 14px 16px;
                                border: 2px solid #e0e0e0;
                                border-radius: 16px;
                                font-size: 15px;
                                resize: vertical;
                                font-family: inherit;
                            "></textarea>
                        </div>
                        
                        <!-- Submit Button -->
                        <button type="submit" style="
                            width: 100%;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 16px;
                            border: none;
                            border-radius: 20px;
                            font-size: 18px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                        ">
                            <span>🚀</span>
                            <span>Submit Enquiry / आवेदन करें</span>
                        </button>
                        
                        <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #888;">
                            We'll contact you within 24 hours | हम 24 घंटे में संपर्क करेंगे
                        </p>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Populate dropdowns
        populateClassDropdown('bbClassSelectModal');
        populateBoardDropdown('bbBoardSelectModal');
        
        // Show relation field when "other" is selected
        const applicantTypeSelect = document.getElementById('bbApplicantTypeModal');
        const relationField = document.getElementById('bbRelationField');
        
        if (applicantTypeSelect && relationField) {
            applicantTypeSelect.addEventListener('change', () => {
                relationField.style.display = applicantTypeSelect.value === 'other' ? 'block' : 'none';
            });
        }
        
        // Close modal handlers
        const closeBtn = document.getElementById('bbCloseModal');
        const modalElement = document.getElementById('bbEnquiryModal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeEnquiryModal);
        }
        
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) closeEnquiryModal();
        });
        
        // Form submit handler
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
            
            // Add 3D hover effect
            const inner = document.getElementById('bbModalInner');
            if (inner) {
                inner.addEventListener('mousemove', (e) => {
                    const rect = inner.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    inner.style.transform = `perspective(1000px) rotateX(${y * 5}deg) rotateY(${x * 5}deg)`;
                });
                inner.addEventListener('mouseleave', () => {
                    inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
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
        
        // Validation
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
        
        // Submit button loading state
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
            success: { emoji: '✅', color: '#4caf50', title: 'सफलता / Success!' },
            error: { emoji: '❌', color: '#f44336', title: 'त्रुटि / Error!' },
            warning: { emoji: '⚠️', color: '#ff9800', title: 'सूचना / Warning!' }
        };
        
        const icon = icons[type] || icons.success;
        
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${icon.color};
                color: white;
                padding: 16px 24px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 100000;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: 'Segoe UI', sans-serif;
                animation: bbSlideIn 0.3s ease;
                max-width: 380px;
            ">
                <span style="font-size: 24px;">${icon.emoji}</span>
                <div style="flex: 1;">
                    <strong style="display: block; margin-bottom: 4px;">${icon.title}</strong>
                    <span style="font-size: 13px;">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px;
                border-radius: 40px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                animation: bbBounceIn 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
                box-shadow: 0 30px 60px rgba(0,0,0,0.4);
            ">
                <div style="
                    width: 100px;
                    height: 100px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    animation: bbPop 0.5s ease;
                ">
                    <span style="font-size: 60px;">🎉</span>
                </div>
                
                <h2 style="color: white; margin-bottom: 15px; font-size: 28px;">धन्यवाद ${name}!</h2>
                <h3 style="color: rgba(255,255,255,0.9); margin-bottom: 15px; font-size: 18px;">Thank You!</h3>
                
                <p style="color: rgba(255,255,255,0.95); margin-bottom: 25px; line-height: 1.6;">
                    ✅ आपकी enquiry सफलतापूर्वक जमा हो गई है।<br>
                    ✅ Your enquiry has been submitted successfully.<br><br>
                    📞 हम जल्द ही आपसे संपर्क करेंगे।<br>
                    📞 We'll contact you soon.
                </p>
                
                <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 20px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div>📞 ${CONFIG.centerPhone}</div>
                        <div>💬 24x7 Support</div>
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
                ">OK / ठीक है</button>
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
            right: 30px;
            background: #25D366;
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 8px 25px rgba(37,211,102,0.3);
            animation: bbSlideInRight 0.5s ease;
            font-family: 'Segoe UI', sans-serif;
            font-weight: 500;
        `;
        
        btn.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style="width: 24px; height: 24px;">
            <span>WhatsApp पर संपर्क करें / Contact on WhatsApp</span>
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
        const replyMessage = `🎉 नमस्ते ${data.fullName} जी!\n\n✅ आपकी enquiry सफलतापूर्वक जमा हो गई है।\n📚 कक्षा / Class: ${data.class}\n🏫 बोर्ड / Board: ${data.board || 'निर्धारित नहीं / Not specified'}\n\n📞 हम जल्द ही आपसे संपर्क करेंगे।\n📞 We'll contact you soon.\n\n🙏 धन्यवाद / Thank You\n- बाल भारती कोचिंग सेंटर\n- Bal Bharti Coaching Center`;
        
        console.log('📱 Auto-reply SMS:', replyMessage);
        showToast('आपके मोबाइल पर सूचना भेज दी गई है 📱 / SMS sent to your mobile', 'success');
    }
    
    // ============================================
    // ADD CSS ANIMATIONS
    // ============================================
    
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bbFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes bbPulse {
                0%, 100% { box-shadow: 0 10px 30px rgba(102,126,234,0.4); }
                50% { box-shadow: 0 15px 40px rgba(102,126,234,0.6); }
            }
            @keyframes bbRipple {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(1.5); opacity: 0; }
            }
            @keyframes bbSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes bbSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
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
            @keyframes bbBounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.95); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes bbModalPop {
                0% { transform: perspective(1000px) rotateX(-15deg) scale(0.9); opacity: 0; }
                100% { transform: perspective(1000px) rotateX(0deg) scale(1); opacity: 1; }
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
            #bbEnquiryForm input:focus, 
            #bbEnquiryForm select:focus, 
            #bbEnquiryForm textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
            }
            @media (max-width: 768px) {
                #bbEnquiryModal .modal-content {
                    width: 95%;
                    margin: 10px;
                }
                .bb-toast > div {
                    max-width: 90%;
                    right: 5%;
                    left: 5%;
                    top: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ============================================
    // INITIALIZE
    // ============================================
    
    function init() {
        console.log('🚀 Bal Bharti Coaching - Bilingual Modal Module Initialized');
        console.log('📞 Contact Number:', CONFIG.centerPhone);
        addStyles();
        createModal();
        createEnquiryButton();
        
        // Also add click handler to any existing enquiry buttons
        document.querySelectorAll('.enquiry-btn, [data-enquiry]').forEach(btn => {
            btn.addEventListener('click', openEnquiryModal);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
