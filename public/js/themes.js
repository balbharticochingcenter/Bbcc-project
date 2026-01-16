// Special Days Theme Management System
class ThemeManager {
    constructor() {
        this.specialDays = this.getSpecialDaysCalendar();
        this.currentTheme = null;
        this.init();
    }

    // Special Days Database (अगले 15 दिनों के लिए)
    getSpecialDaysCalendar() {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        return [
            // Republic Day (26 January) - 10 days preparation
            {
                name: "गणतंत्र दिवस",
                englishName: "Republic Day",
                date: new Date(currentYear, 0, 26), // 26 January
                theme: "republic-day",
                icon: "fas fa-flag",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#FF9933", "#FFFFFF", "#138808"],
                message: "🇮🇳 गणतंत्र दिवस की हार्दिक शुभकामनाएँ! 🇮🇳"
            },
            // Independence Day (15 August)
            {
                name: "स्वतंत्रता दिवस",
                englishName: "Independence Day",
                date: new Date(currentYear, 7, 15), // 15 August
                theme: "independence-day",
                icon: "fas fa-dove",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#FF671F", "#FFFFFF", "#046A38"],
                message: "🇮🇳 स्वतंत्रता दिवस की हार्दिक शुभकामनाएँ! 🇮🇳"
            },
            // Gandhi Jayanti (2 October)
            {
                name: "गाँधी जयंती",
                englishName: "Gandhi Jayanti",
                date: new Date(currentYear, 9, 2), // 2 October
                theme: "gandhi-jayanti",
                icon: "fas fa-peace",
                startDaysBefore: 7,
                endDaysAfter: 3,
                colors: ["#7d7d7d", "#ffffff"],
                message: "गाँधी जयंती की शुभकामनाएँ!"
            },
            // Diwali (Calculate based on Hindu calendar)
            {
                name: "दिवाली",
                englishName: "Diwali",
                date: this.getDiwaliDate(currentYear),
                theme: "diwali",
                icon: "fas fa-oil-can",
                startDaysBefore: 15,
                endDaysAfter: 7,
                colors: ["#FFD700", "#FF6B35", "#4A00E0"],
                message: "दिवाली की शुभकामनाएँ! 🪔"
            },
            // Holi (Calculate based on Hindu calendar)
            {
                name: "होली",
                englishName: "Holi",
                date: this.getHoliDate(currentYear),
                theme: "holi",
                icon: "fas fa-palette",
                startDaysBefore: 7,
                endDaysAfter: 3,
                colors: ["#FF4081", "#4CAF50", "#2196F3"],
                message: "होली की शुभकामनाएँ! 🎨"
            },
            // Teacher's Day (5 September)
            {
                name: "शिक्षक दिवस",
                englishName: "Teacher's Day",
                date: new Date(currentYear, 8, 5), // 5 September
                theme: "teachers-day",
                icon: "fas fa-chalkboard-teacher",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#9C27B0", "#FF9800"],
                message: "शिक्षक दिवस की शुभकामनाएँ!"
            },
            // Children's Day (14 November)
            {
                name: "बाल दिवस",
                englishName: "Children's Day",
                date: new Date(currentYear, 10, 14), // 14 November
                theme: "childrens-day",
                icon: "fas fa-child",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#FF5722", "#00BCD4"],
                message: "बाल दिवस की शुभकामनाएँ!"
            },
            // Christmas (25 December)
            {
                name: "क्रिसमस",
                englishName: "Christmas",
                date: new Date(currentYear, 11, 25), // 25 December
                theme: "christmas",
                icon: "fas fa-sleigh",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#D32F2F", "#388E3C", "#FFFFFF"],
                message: "क्रिसमस की शुभकामनाएँ! 🎄"
            },
            // New Year (1 January)
            {
                name: "नया साल",
                englishName: "New Year",
                date: new Date(currentYear + 1, 0, 1), // 1 January
                theme: "new-year",
                icon: "fas fa-glass-cheers",
                startDaysBefore: 7,
                endDaysAfter: 5,
                colors: ["#FF4081", "#18FFFF", "#76FF03"],
                message: "नए साल की शुभकामनाएँ! 🎉"
            },
            // International Women's Day (8 March)
            {
                name: "अंतर्राष्ट्रीय महिला दिवस",
                englishName: "International Women's Day",
                date: new Date(currentYear, 2, 8), // 8 March
                theme: "womens-day",
                icon: "fas fa-female",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#E91E63", "#9C27B0"],
                message: "अंतर्राष्ट्रीय महिला दिवस की शुभकामनाएँ!"
            },
            // Labor Day (1 May)
            {
                name: "श्रम दिवस",
                englishName: "Labor Day",
                date: new Date(currentYear, 4, 1), // 1 May
                theme: "labor-day",
                icon: "fas fa-tools",
                startDaysBefore: 3,
                endDaysAfter: 3,
                colors: ["#FF9800", "#4CAF50"],
                message: "श्रम दिवस की शुभकामनाएँ!"
            }
        ];
    }

    // Diwali date calculation (simplified)
    getDiwaliDate(year) {
        // Simplified: Diwali usually in October/November
        // Actual calculation requires Hindu calendar
        return new Date(year, 9, 27); // Approx date
    }

    // Holi date calculation (simplified)
    getHoliDate(year) {
        // Holi usually in March
        return new Date(year, 2, 8); // Approx date
    }

    init() {
        this.checkSpecialDays();
        this.applyTheme();
        this.showBanner();
        this.startCelebration();
    }

    // Check if today is within special day range
    checkSpecialDays() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const day of this.specialDays) {
            const startDate = new Date(day.date);
            startDate.setDate(startDate.getDate() - day.startDaysBefore);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(day.date);
            endDate.setDate(endDate.getDate() + day.endDaysAfter);
            endDate.setHours(23, 59, 59, 999);

            if (today >= startDate && today <= endDate) {
                this.currentTheme = day;
                console.log(`🎉 Active Theme: ${day.name} (${day.englishName})`);
                return;
            }
        }

        console.log("📅 No special theme today");
    }

    // Apply theme to page
    applyTheme() {
        if (!this.currentTheme) return;

        // Add theme class to body
        document.body.classList.add(`theme-${this.currentTheme.theme}`);
        document.body.classList.add('theme-active');

        // Apply to header
        const header = document.querySelector('.main-header');
        if (header) header.classList.add('theme-active');

        // Apply to footer
        const footer = document.querySelector('.main-footer');
        if (footer) footer.classList.add('theme-active');

        // Apply to buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.classList.add('theme-active');
        });

        // Apply to VIP cards
        document.querySelectorAll('.vip-card').forEach(card => {
            card.classList.add('theme-active');
        });

        // Update CSS variables
        this.updateCSSVariables();
    }

    // Update CSS custom properties
    updateCSSVariables() {
        if (!this.currentTheme) return;

        const root = document.documentElement;
        const colors = this.currentTheme.colors;

        root.style.setProperty('--theme-primary', colors[0]);
        root.style.setProperty('--theme-secondary', colors[1] || colors[0]);
        root.style.setProperty('--theme-accent', colors[2] || colors[0]);
    }

    // Show special day banner
    showBanner() {
        if (!this.currentTheme) return;

        // Create banner
        const banner = document.createElement('div');
        banner.className = 'special-day-banner';
        banner.innerHTML = `
            <i class="${this.currentTheme.icon}"></i>
            <div>
                <strong>${this.currentTheme.message}</strong>
                <br>
                <small>${this.currentTheme.name} - ${this.currentTheme.englishName}</small>
            </div>
            <i class="${this.currentTheme.icon}"></i>
        `;

        // Insert at top
        document.body.insertBefore(banner, document.body.firstChild);

        // Adjust header margin
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.marginTop = '60px';
        }

        // Auto remove after 10 seconds
        setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(-100%)';
            banner.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                if (banner.parentNode) {
                    banner.parentNode.removeChild(banner);
                    if (header) header.style.marginTop = '';
                }
            }, 500);
        }, 10000);
    }

    // Start celebration effects
    startCelebration() {
        if (!this.currentTheme) return;

        // Create fireworks container
        const fireworks = document.createElement('div');
        fireworks.className = 'fireworks';
        document.body.appendChild(fireworks);

        // Create confetti
        this.createConfetti(fireworks);

        // Stop after 5 seconds
        setTimeout(() => {
            fireworks.style.opacity = '0';
            setTimeout(() => {
                if (fireworks.parentNode) {
                    fireworks.parentNode.removeChild(fireworks);
                }
            }, 1000);
        }, 5000);
    }

    // Create confetti effect
    createConfetti(container) {
        const colors = this.currentTheme.colors;
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = confetti.style.width;
            confetti.style.opacity = Math.random() + 0.5;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            
            container.appendChild(confetti);
        }
    }

    // Get upcoming special days (for info panel)
    getUpcomingDays(days = 30) {
        const today = new Date();
        const upcoming = [];

        for (const day of this.specialDays) {
            const daysUntil = Math.floor((day.date - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntil >= 0 && daysUntil <= days) {
                upcoming.push({
                    ...day,
                    daysUntil,
                    status: daysUntil <= day.startDaysBefore ? 'preparation' : 'upcoming'
                });
            }
        }

        return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    
    // Add upcoming days info button
    addThemeInfoButton();
});

// Add theme info button to header
function addThemeInfoButton() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    const themeBtn = document.createElement('button');
    themeBtn.className = 'action-btn theme-info-btn';
    themeBtn.innerHTML = '<i class="fas fa-calendar-day"></i>';
    themeBtn.title = 'Upcoming Special Days';
    themeBtn.style.marginLeft = '10px';
    
    themeBtn.onclick = () => showThemeInfoModal();
    
    headerRight.insertBefore(themeBtn, headerRight.firstChild);
}

// Show theme information modal
function showThemeInfoModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const upcomingDays = window.themeManager.getUpcomingDays(60);
    
    modal.innerHTML = `
        <div class="modal-content three-d-card" style="max-width: 600px;">
            <span class="close-button" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div class="modal-header">
                <h2><i class="fas fa-calendar-alt"></i> Upcoming Special Days</h2>
                <p>BBCC celebrates all festivals and national days</p>
            </div>
            
            <div style="padding: 30px; max-height: 60vh; overflow-y: auto;">
                ${upcomingDays.map(day => `
                    <div style="
                        background: white;
                        border-radius: 10px;
                        padding: 20px;
                        margin-bottom: 15px;
                        border-left: 5px solid ${day.colors[0]};
                        box-shadow: 0 3px 10px rgba(0,0,0,0.05);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="margin: 0; color: #333;">
                                    <i class="${day.icon}"></i> ${day.name}
                                </h3>
                                <p style="margin: 5px 0 0; color: #666;">
                                    ${day.englishName} • ${day.date.toLocaleDateString()}
                                </p>
                            </div>
                            <div style="
                                background: ${day.colors[0]};
                                color: white;
                                padding: 5px 15px;
                                border-radius: 20px;
                                font-size: 0.9rem;
                                font-weight: bold;
                            ">
                                ${day.daysUntil === 0 ? 'TODAY' : 
                                  day.daysUntil === 1 ? 'TOMORROW' : 
                                  `${day.daysUntil} days`}
                            </div>
                        </div>
                        
                        ${day.daysUntil <= day.startDaysBefore ? `
                            <div style="
                                margin-top: 15px;
                                padding: 10px;
                                background: rgba(255, 193, 7, 0.1);
                                border-radius: 5px;
                                border: 1px solid #ffc107;
                            ">
                                <i class="fas fa-clock"></i>
                                <strong>Theme active:</strong>
                                ${day.startDaysBefore - day.daysUntil} days of preparation completed
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
                
                ${upcomingDays.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-calendar-times fa-3x"></i>
                        <p>No upcoming special days in next 60 days</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    // Close on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}
// SPECIAL DAYS THEME SYSTEM WITH SOCIAL SHARING
class ThemeManager {
    constructor() {
        this.specialDays = this.getSpecialDaysCalendar();
        this.currentTheme = null;
        this.init();
    }

    // Special Days Database with Background Images
    getSpecialDaysCalendar() {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        return [
            {
                name: "गणतंत्र दिवस",
                englishName: "Republic Day",
                date: new Date(currentYear, 0, 26),
                theme: "republic-day",
                icon: "fas fa-flag",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#FF9933", "#FFFFFF", "#138808"],
                message: "🇮🇳 गणतंत्र दिवस की हार्दिक शुभकामनाएँ! 🇮🇳",
                background: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#RepublicDay", "#26January", "#India", "#BBCCMadhubani"],
                shareText: "गणतंत्र दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🇮🇳"
            },
            {
                name: "स्वतंत्रता दिवस",
                englishName: "Independence Day",
                date: new Date(currentYear, 7, 15),
                theme: "independence-day",
                icon: "fas fa-dove",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#FF671F", "#FFFFFF", "#046A38"],
                message: "🇮🇳 स्वतंत्रता दिवस की हार्दिक शुभकामनाएँ! 🇮🇳",
                background: "https://images.unsplash.com/photo-1594736797933-d0e64d2f0c7a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#IndependenceDay", "#15August", "#India", "#BBCCMadhubani"],
                shareText: "स्वतंत्रता दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🇮🇳"
            },
            {
                name: "दिवाली",
                englishName: "Diwali",
                date: this.getDiwaliDate(currentYear),
                theme: "diwali",
                icon: "fas fa-oil-can",
                startDaysBefore: 15,
                endDaysAfter: 7,
                colors: ["#FFD700", "#FF6B35", "#4A00E0"],
                message: "दिवाली की शुभकामनाएँ! 🪔 रोशनी का त्योहार",
                background: "https://images.unsplash.com/photo-1604061986762-dbbe1297a68e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Diwali", "#FestivalOfLights", "#BBCCMadhubani", "#HappyDiwali"],
                shareText: "दिवाली की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🪔"
            },
            {
                name: "होली",
                englishName: "Holi",
                date: this.getHoliDate(currentYear),
                theme: "holi",
                icon: "fas fa-palette",
                startDaysBefore: 7,
                endDaysAfter: 3,
                colors: ["#FF4081", "#4CAF50", "#2196F3"],
                message: "होली की रंगीन शुभकामनाएँ! 🎨",
                background: "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Holi", "#FestivalOfColors", "#BBCCMadhubani", "#HappyHoli"],
                shareText: "होली की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🎨"
            },
            {
                name: "शिक्षक दिवस",
                englishName: "Teacher's Day",
                date: new Date(currentYear, 8, 5),
                theme: "teachers-day",
                icon: "fas fa-chalkboard-teacher",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#9C27B0", "#FF9800"],
                message: "शिक्षक दिवस की शुभकामनाएँ! सभी गुरुजनों को नमन",
                background: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#TeachersDay", "#5September", "#BBCCMadhubani", "#RespectTeachers"],
                shareText: "शिक्षक दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी"
            },
            {
                name: "क्रिसमस",
                englishName: "Christmas",
                date: new Date(currentYear, 11, 25),
                theme: "christmas",
                icon: "fas fa-sleigh",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#D32F2F", "#388E3C", "#FFFFFF"],
                message: "क्रिसमस की शुभकामनाएँ! 🎄 मेरी क्रिसमस",
                background: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Christmas", "#25December", "#BBCCMadhubani", "#MerryChristmas"],
                shareText: "क्रिसमस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🎄"
            },
            {
                name: "नया साल",
                englishName: "New Year",
                date: new Date(currentYear + 1, 0, 1),
                theme: "new-year",
                icon: "fas fa-glass-cheers",
                startDaysBefore: 7,
                endDaysAfter: 5,
                colors: ["#FF4081", "#18FFFF", "#76FF03"],
                message: "नए साल की शुभकामनाएँ! 🎉 2025",
                background: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#NewYear", "#HappyNewYear", "#BBCCMadhubani", "#2025"],
                shareText: "नए साल की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🎉"
            },
            {
                name: "बाल दिवस",
                englishName: "Children's Day",
                date: new Date(currentYear, 10, 14),
                theme: "childrens-day",
                icon: "fas fa-child",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#FF5722", "#00BCD4", "#8BC34A"],
                message: "बाल दिवस की शुभकामनाएँ! सभी बच्चों को",
                background: "https://images.unsplash.com/photo-1530277645362-bb2d3b9a6c6a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#ChildrensDay", "#14November", "#BBCCMadhubani", "#HappyChildrensDay"],
                shareText: "बाल दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी"
            }
        ];
    }

    getDiwaliDate(year) {
        return new Date(year, 9, 27);
    }

    getHoliDate(year) {
        return new Date(year, 2, 8);
    }

    init() {
        this.checkSpecialDays();
        if (this.currentTheme) {
            this.applyTheme();
            this.showNotification();
            this.showBanner();
            this.addSocialSharing();
            this.startCelebration();
            this.preloadBackground();
        }
    }

    checkSpecialDays() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const day of this.specialDays) {
            const startDate = new Date(day.date);
            startDate.setDate(startDate.getDate() - day.startDaysBefore);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(day.date);
            endDate.setDate(endDate.getDate() + day.endDaysAfter);
            endDate.setHours(23, 59, 59, 999);

            if (today >= startDate && today <= endDate) {
                this.currentTheme = day;
                console.log(`🎉 Active Theme: ${day.name} (${day.englishName})`);
                return;
            }
        }
    }

    applyTheme() {
        if (!this.currentTheme) return;

        // Add theme class
        document.body.classList.add(`theme-${this.currentTheme.theme}`, 'theme-active');
        
        // Apply to other elements
        document.querySelectorAll('.main-header, .main-footer, .hero-container').forEach(el => {
            el?.classList.add('theme-active');
        });

        // Update CSS variables
        this.updateCSSVariables();
    }

    updateCSSVariables() {
        if (!this.currentTheme) return;

        const root = document.documentElement;
        const colors = this.currentTheme.colors;

        root.style.setProperty('--theme-primary', colors[0]);
        root.style.setProperty('--theme-secondary', colors[1] || colors[0]);
        root.style.setProperty('--theme-accent', colors[2] || colors[0]);
        
        // Convert hex to rgb for opacity
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? 
                `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
                '74, 111, 255';
        };
        
        root.style.setProperty('--theme-primary-rgb', hexToRgb(colors[0]));
    }

    // Preload background image
    preloadBackground() {
        if (!this.currentTheme?.background) return;
        
        const img = new Image();
        img.src = this.currentTheme.background;
        img.onload = () => {
            console.log('✅ Background image loaded:', this.currentTheme.background);
        };
    }

    // Show notification with share buttons
    showNotification() {
        if (!this.currentTheme) return;

        const notification = document.createElement('div');
        notification.className = 'special-notification';
        notification.id = 'specialDayNotification';
        
        notification.innerHTML = `
            <i class="fas fa-calendar-star"></i>
            <div class="special-notification-content">
                <strong>${this.currentTheme.message}</strong>
                <div class="share-buttons">
                    <button class="share-btn whatsapp" onclick="themeManager.shareOnWhatsApp()">
                        <i class="fab fa-whatsapp"></i> Share
                    </button>
                    <button class="share-btn facebook" onclick="themeManager.shareOnFacebook()">
                        <i class="fab fa-facebook-f"></i> Share
                    </button>
                    <button class="share-btn download" onclick="themeManager.downloadThemeImage()">
                        <i class="fas fa-download"></i> Save
                    </button>
                </div>
            </div>
            <button class="close-notification" onclick="this.parentElement.style.display='none'">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);
        
        // Auto-close after 15 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.parentNode.removeChild(notification), 500);
            }
        }, 15000);
    }

    // Show top banner
    showBanner() {
        if (!this.currentTheme) return;

        const banner = document.createElement('div');
        banner.className = 'special-day-banner';
        
        banner.innerHTML = `
            <i class="${this.currentTheme.icon}"></i>
            <div>
                <strong>${this.currentTheme.name} - ${this.currentTheme.englishName}</strong>
                <br>
                <small>बाल भारती कोचिंग सेंटर, मधुबनी</small>
            </div>
            <i class="${this.currentTheme.icon}"></i>
        `;

        document.body.insertBefore(banner, document.body.firstChild);
        
        // Adjust header margin
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.marginTop = '60px';
            
            // Restore margin when banner is removed
            banner.addEventListener('animationend', () => {
                if (!banner.parentNode) {
                    header.style.marginTop = '';
                }
            });
        }
    }

    // Add social sharing panel
    addSocialSharing() {
        if (!this.currentTheme) return;

        const panel = document.createElement('div');
        panel.className = 'social-sharing-panel';
        panel.innerHTML = `
            <h4><i class="fas fa-share-alt"></i> Share Festive Greetings</h4>
            <div class="social-share-buttons">
                <button class="social-share-btn whatsapp" onclick="themeManager.shareOnWhatsApp()">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </button>
                <button class="social-share-btn facebook" onclick="themeManager.shareOnFacebook()">
                    <i class="fab fa-facebook-f"></i>
                    <span>Facebook</span>
                </button>
                <button class="social-share-btn instagram" onclick="themeManager.shareOnInstagram()">
                    <i class="fab fa-instagram"></i>
                    <span>Instagram</span>
                </button>
                <button class="social-share-btn twitter" onclick="themeManager.shareOnTwitter()">
                    <i class="fab fa-twitter"></i>
                    <span>Twitter</span>
                </button>
                <button class="social-share-btn share" onclick="themeManager.shareNative()">
                    <i class="fas fa-share"></i>
                    <span>More</span>
                </button>
                <button class="social-share-btn download" onclick="themeManager.downloadThemeImage()">
                    <i class="fas fa-download"></i>
                    <span>Save Image</span>
                </button>
            </div>
        `;

        document.body.appendChild(panel);
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(100%)';
            setTimeout(() => {
                if (panel.parentNode) panel.parentNode.removeChild(panel);
            }, 500);
        }, 30000);
    }

    // ===== SOCIAL SHARING FUNCTIONS =====
    
    shareOnWhatsApp() {
        const text = `${this.currentTheme.shareText}\n\n${window.location.href}\n\n${this.currentTheme.hashtags.join(' ')}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    shareOnFacebook() {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(this.currentTheme.shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
    }

    shareOnTwitter() {
        const text = `${this.currentTheme.shareText} ${this.currentTheme.hashtags.join(' ')}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
    }

    shareOnInstagram() {
        // Instagram doesn't support direct sharing, open app or show instructions
        alert('To share on Instagram:\n1. Take a screenshot\n2. Open Instagram\n3. Post as Story/Feed\n4. Add hashtags: ' + this.currentTheme.hashtags.join(' '));
        
        // Optional: Create downloadable image
        this.downloadThemeImage();
    }

    shareNative() {
        if (navigator.share) {
            navigator.share({
                title: this.currentTheme.name + ' - BBCC Madhubani',
                text: this.currentTheme.shareText,
                url: window.location.href,
            })
            .catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            this.copyToClipboard();
        }
    }

    copyToClipboard() {
        const text = `${this.currentTheme.shareText}\n${window.location.href}\n${this.currentTheme.hashtags.join(' ')}`;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('Copied to clipboard! You can now paste anywhere.');
            })
            .catch(err => {
                console.error('Copy failed:', err);
                alert('Please copy manually:\n\n' + text);
            });
    }

    async downloadThemeImage() {
        try {
            // Create a festive image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 1200;
            canvas.height = 630;
            
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, this.currentTheme.colors[0]);
            gradient.addColorStop(0.5, this.currentTheme.colors[1] || this.currentTheme.colors[0]);
            gradient.addColorStop(1, this.currentTheme.colors[2] || this.currentTheme.colors[0]);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentTheme.name, canvas.width/2, 200);
            
            ctx.font = '40px Arial';
            ctx.fillText(this.currentTheme.englishName, canvas.width/2, 270);
            
            ctx.font = '30px Arial';
            ctx.fillText('बाल भारती कोचिंग सेंटर, मधुबनी', canvas.width/2, 350);
            ctx.fillText('📚 Quality Education for Classes 1-10', canvas.width/2, 400);
            
            ctx.font = '25px Arial';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            this.currentTheme.hashtags.forEach((tag, i) => {
                ctx.fillText(tag, canvas.width/2, 450 + i * 35);
            });
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            
            // Download
            const link = document.createElement('a');
            link.download = `BBCC_${this.currentTheme.englishName.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
            
            alert('🎉 Festive image downloaded! Share it on social media.');
        } catch (error) {
            console.error('Image creation failed:', error);
            alert('Please take a screenshot to share!');
        }
    }

    // Celebration effects
    startCelebration() {
        this.createFireworks();
        this.createFloatingElements();
        
        // Play subtle sound (optional)
        this.playCelebrationSound();
    }

    createFireworks() {
        const container = document.createElement('div');
        container.className = 'fireworks';
        document.body.appendChild(container);

        // Create multiple fireworks
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createFirework(container);
            }, i * 100);
        }

        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => container.remove(), 1000);
        }, 5000);
    }

    createFirework(container) {
        const colors = this.currentTheme.colors;
        const x = Math.random() * 100;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti';
            
            particle.style.left = `${x}vw`;
            particle.style.top = '0';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDuration = `${Math.random() * 2 + 1}s`;
            particle.style.animationDelay = `${Math.random()}s`;
            
            container.appendChild(particle);
        }
    }

    createFloatingElements() {
        const icons = ['🎉', '🎊', '✨', '🎨', '🪔', '🇮🇳', '🎄', '🌟', '💫', '🥳'];
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const element = document.createElement('div');
                element.className = 'floating-element';
                element.textContent = icons[Math.floor(Math.random() * icons.length)];
                element.style.left = `${Math.random() * 100}vw`;
                element.style.color = this.currentTheme.colors[Math.floor(Math.random() * this.currentTheme.colors.length)];
                element.style.animationDuration = `${Math.random() * 10 + 10}s`;
                
                document.body.appendChild(element);
                
                // Remove after animation
                setTimeout(() => element.remove(), 20000);
            }, i * 500);
        }
    }

    playCelebrationSound() {
        // Optional: Add subtle celebration sound
        // const audio = new Audio('/sounds/celebration.mp3');
        // audio.volume = 0.3;
        // audio.play().catch(e => console.log('Audio play failed:', e));
    }

    // Get upcoming days
    getUpcomingDays(days = 30) {
        const today = new Date();
        const upcoming = [];

        for (const day of this.specialDays) {
            const daysUntil = Math.floor((day.date - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntil >= 0 && daysUntil <= days) {
                upcoming.push({
                    ...day,
                    daysUntil,
                    status: daysUntil <= day.startDaysBefore ? 'preparation' : 'upcoming'
                });
            }
        }

        return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    }
}

// Initialize Theme Manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    
    // Add theme info button to header
    addThemeInfoButton();
});

function addThemeInfoButton() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    const themeBtn = document.createElement('button');
    themeBtn.className = 'action-btn theme-info-btn';
    themeBtn.innerHTML = '<i class="fas fa-calendar-day"></i> <span>Festivals</span>';
    themeBtn.title = 'Upcoming Festivals & Special Days';
    themeBtn.style.marginLeft = '10px';
    themeBtn.style.background = 'var(--theme-primary)';
    
    themeBtn.onclick = () => showThemeInfoModal();
    
    headerRight.appendChild(themeBtn);
}

function showThemeInfoModal() {
    const upcomingDays = window.themeManager?.getUpcomingDays(60) || [];
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content three-d-card" style="max-width: 700px;">
            <span class="close-button" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div class="modal-header">
                <h2><i class="fas fa-calendar-alt"></i> Upcoming Festivals & Special Days</h2>
                <p>बाल भारती कोचिंग सेंटर celebrates all festivals</p>
            </div>
            
            <div style="padding: 30px; max-height: 70vh; overflow-y: auto;">
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    ${upcomingDays.map(day => `
                        <div style="
                            background: white;
                            border-radius: 15px;
                            padding: 25px;
                            border-left: 8px solid ${day.colors[0]};
                            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                            position: relative;
                            overflow: hidden;
                        ">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                <div style="
                                    width: 60px;
                                    height: 60px;
                                    background: ${day.colors[0]};
                                    color: white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 1.5rem;
                                ">
                                    <i class="${day.icon}"></i>
                                </div>
                                <div>
                                    <h3 style="margin: 0; color: #333;">${day.name}</h3>
                                    <p style="margin: 5px 0 0; color: #666;">${day.englishName}</p>
                                </div>
                            </div>
                            
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-top: 20px;
                                padding-top: 15px;
                                border-top: 1px solid #eee;
                            ">
                                <div>
                                    <div style="color: #666; font-size: 0.9rem;">
                                        <i class="fas fa-calendar"></i> 
                                        ${day.date.toLocaleDateString('en-IN', { 
                                            day: 'numeric', 
                                            month: 'long', 
                                            year: 'numeric' 
                                        })}
                                    </div>
                                    <div style="color: #666; font-size: 0.9rem; margin-top: 5px;">
                                        <i class="fas fa-clock"></i> 
                                        ${day.daysUntil === 0 ? 'Today' : 
                                          day.daysUntil === 1 ? 'Tomorrow' : 
                                          `In ${day.daysUntil} days`}
                                    </div>
                                </div>
                                
                                <div style="
                                    background: ${day.colors[0]};
                                    color: white;
                                    padding: 8px 20px;
                                    border-radius: 20px;
                                    font-size: 0.9rem;
                                    font-weight: bold;
                                ">
                                    ${day.daysUntil <= day.startDaysBefore ? 
                                      '🎉 Theme Active' : 
                                      '📅 Coming Soon'}
                                </div>
                            </div>
                            
                            ${day.daysUntil <= day.startDaysBefore ? `
                                <div style="
                                    margin-top: 15px;
                                    padding: 12px;
                                    background: rgba(255, 193, 7, 0.1);
                                    border-radius: 8px;
                                    border: 1px solid #ffc107;
                                    font-size: 0.9rem;
                                    color: #856404;
                                ">
                                    <i class="fas fa-sparkles"></i>
                                    <strong>Theme active for:</strong> 
                                    ${day.startDaysBefore - day.daysUntil} days
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                
                ${upcomingDays.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-calendar-times fa-3x"></i>
                        <p style="margin-top: 15px;">No upcoming special days in next 60 days</p>
                    </div>
                ` : `
                    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i>
                        <p>BBCC celebrates all festivals with special themes and activities</p>
                    </div>
                `}
            </div>
            
            <div style="padding: 20px 30px; border-top: 1px solid #eee; text-align: center;">
                <button onclick="themeManager.downloadThemeImage()" style="
                    padding: 12px 30px;
                    background: var(--theme-primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="fas fa-download"></i> Download Festive Images
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}
