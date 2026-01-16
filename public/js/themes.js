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
