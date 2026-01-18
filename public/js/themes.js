// COMPLETE SPECIAL DAYS THEME SYSTEM WITH ALL FESTIVALS
class ThemeManager {
    constructor() {
        this.specialDays = this.getSpecialDaysCalendar();
        this.currentTheme = null;
        this.activeFestivals = []; // सभी एक्टिव फेस्टिवल
        this.currentThemeIndex = 0;
        this.isThemeRotating = false;
        this.themeRotationInterval = null;
        this.isInitialized = false;
        this.isFestivalBannerVisible = true;
        this.handleBannerClickWithSound = null;
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        this.checkSpecialDays();
        
        // Multiple festivals हैं
        if (this.activeFestivals && this.activeFestivals.length > 1) {
            console.log(`🎊 Multiple Festivals Found: ${this.activeFestivals.length}`);
            
            // Theme rotation शुरू करो
            this.startThemeRotation();
            
            // पहला theme apply करो
            this.currentTheme = this.activeFestivals[0];
            this.applyTheme();
            
            // Multi-festival banner दिखाओ
            this.showMultiFestivalBanner();
            
            // Multi-festival notification
            this.showMultiFestivalNotification();
            
            // Celebration effects
            this.startCelebration();
            
            // Backgrounds preload
            this.preloadBackgrounds();
            
            // Sidebar में multi-festival banner
            this.addMultiFestivalToSidebar();
            
        } 
        // Single festival है
        else if (this.currentTheme) {
            console.log(`🎉 Single Festival: ${this.currentTheme.name}`);
            this.applyTheme();
            this.showNotification();
            this.showBanner();
            this.addSocialSharing();
            this.startCelebration();
            this.preloadBackground();
            this.addFestivalToSidebar();
        }
    }

    // ✅✅✅ सभी प्रमुख त्योहारों का Database (UPDATED)
    getSpecialDaysCalendar() {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        return [
            // JANUARY
            {
                name: "नया साल",
                englishName: "New Year",
                date: this.getFestivalDate('new-year', currentYear), // ✅ UPDATED
                theme: "new-year",
                icon: "fas fa-glass-cheers",
                startDaysBefore: 7,
                endDaysAfter: 5,
                colors: ["#FF4081", "#18FFFF", "#76FF03"],
                message: "नए साल की शुभकामनाएँ! 🎉",
                background: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#NewYear", "#HappyNewYear", "#BBCCMadhubani"],
                shareText: "नए साल की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🎉",
                emoji: "🎉",
                specialOffer: "नए साल पर विशेष छूट: सभी नए छात्रों के लिए 20% तक छूट!"
            },
            {
                name: "गणतंत्र दिवस",
                englishName: "Republic Day",
                date: this.getFestivalDate('republic-day', currentYear), // ✅ UPDATED
                theme: "republic-day",
                icon: "fas fa-flag",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#FF9933", "#FFFFFF", "#138808"],
                message: "🇮🇳 गणतंत्र दिवस की हार्दिक शुभकामनाएँ! 🇮🇳",
                background: "https://share.google/3r3qO0u2PnrRExFAU",
                hashtags: ["#RepublicDay", "#26January", "#India", "#BBCCMadhubani"],
                shareText: "गणतंत्र दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🇮🇳",
                emoji: "🇮🇳",
                specialOffer: "देशभक्ति सप्ताह: सभी रक्षा सेवा आकांक्षियों के लिए विशेष कक्षाएं"
            },

            // FEBRUARY
            {
                name: "बसंत पंचमी",
                englishName: "Vasant Panchami",
                date: this.getFestivalDate('vasant-panchami', currentYear), // ✅ UPDATED
                theme: "vasant-panchami",
                icon: "fas fa-palette",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#FFFF00", "#FFD700", "#FFA500"],
                message: "बसंत पंचमी की शुभकामनाएँ! 🌼 सरस्वती पूजा की हार्दिक शुभकामनाएँ",
                background: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#VasantPanchami", "#SaraswatiPuja", "#BBCCMadhubani", "#BasantPanchami"],
                shareText: "बसंत पंचमी एवं सरस्वती पूजा की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🌼",
                emoji: "🌼",
                specialOffer: "विद्या आरंभ: नए प्रवेश पर विशेष पुस्तकें मुफ्त"
            },
            {
                name: "महा शिवरात्रि",
                englishName: "Maha Shivratri",
                date: this.getFestivalDate('maha-shivratri', currentYear), // ✅ UPDATED
                theme: "shivratri",
                icon: "fas fa-om",
                startDaysBefore: 3,
                endDaysAfter: 3,
                colors: ["#4B0082", "#8A2BE2", "#9400D3"],
                message: "महा शिवरात्रि की शुभकामनाएँ! ॐ नमः शिवाय 🙏",
                background: "https://images.unsplash.com/photo-1581798459210-94d5d1d1dc56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#MahaShivratri", "#Shivratri", "#BBCCMadhubani", "#OmNamahShivaya"],
                shareText: "महा शिवरात्रि की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🙏",
                emoji: "🙏",
                specialOffer: "ध्यान सत्र: विशेष मेडिटेशन क्लासेस"
            },

            // MARCH
            {
                name: "होली",
                englishName: "Holi",
                date: this.getFestivalDate('holi', currentYear), // ✅ UPDATED
                theme: "holi",
                icon: "fas fa-palette",
                startDaysBefore: 7,
                endDaysAfter: 3,
                colors: ["#FF4081", "#4CAF50", "#2196F3"],
                message: "होली की रंगीन शुभकामनाएँ! 🎨",
                background: "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Holi", "#FestivalOfColors", "#BBCCMadhubani", "#HappyHoli"],
                shareText: "होली की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🎨",
                emoji: "🎨",
                specialOffer: "रंगभरी ऑफर: 3 दोस्तों के साथ ज्वाइन करें, 1 का फीस फ्री"
            },

            // APRIL
            {
                name: "रामनवमी",
                englishName: "Ram Navami",
                date: this.getFestivalDate('ram-navami', currentYear), // ✅ UPDATED
                theme: "ram-navami",
                icon: "fas fa-pray",
                startDaysBefore: 3,
                endDaysAfter: 3,
                colors: ["#FFD700", "#FF6B35", "#FF0000"],
                message: "श्री राम नवमी की शुभकामनाएँ! 🙏 जय श्री राम",
                background: "https://images.unsplash.com/photo-1560713997-1a7c78b63c15?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#RamNavami", "#JayShriRam", "#BBCCMadhubani", "#Ramayana"],
                shareText: "राम नवमी की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🙏",
                emoji: "🙏",
                specialOffer: "धर्म ज्ञान प्रतियोगिता: विजेता को मुफ्त कोर्स"
            },

            // AUGUST
            {
                name: "रक्षा बंधन",
                englishName: "Raksha Bandhan",
                date: this.getFestivalDate('raksha-bandhan', currentYear), // ✅ UPDATED
                theme: "raksha-bandhan",
                icon: "fas fa-hands-helping",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#FF69B4", "#FFFFFF", "#800080"],
                message: "रक्षा बंधन की शुभकामनाएँ! भाई-बहन के प्यार का त्योहार",
                background: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#RakshaBandhan", "#Rakhi", "#BBCCMadhubani", "#BrotherSister"],
                shareText: "रक्षा बंधन की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी",
                emoji: "🎀",
                specialOffer: "भाई-बहन ऑफर: एक साथ एडमिशन पर 25% छूट"
            },
            {
                name: "जन्माष्टमी",
                englishName: "Janmashtami",
                date: this.getFestivalDate('janmashtami', currentYear), // ✅ UPDATED
                theme: "janmashtami",
                icon: "fas fa-baby",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#0000FF", "#FFFF00", "#FFFFFF"],
                message: "जन्माष्टमी की शुभकामनाएँ! 🎉 जय श्री कृष्ण",
                background: "https://images.unsplash.com/photo-1560713997-1a7c78b63c15?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Janmashtami", "#Krishna", "#BBCCMadhubani", "#JayShriKrishna"],
                shareText: "जन्माष्टमी की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🎉",
                emoji: "🎉",
                specialOffer: "कृष्ण ज्ञान क्विज: विजेता को स्पेशल गिफ्ट"
            },
            {
                name: "स्वतंत्रता दिवस",
                englishName: "Independence Day",
                date: this.getFestivalDate('independence-day', currentYear), // ✅ UPDATED
                theme: "independence-day",
                icon: "fas fa-dove",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#FF671F", "#FFFFFF", "#046A38"],
                message: "🇮🇳 स्वतंत्रता दिवस की हार्दिक शुभकामनाएँ! 🇮🇳",
                background: "https://images.unsplash.com/photo-1594736797933-d0e64d2f0c7a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#IndependenceDay", "#15August", "#India", "#BBCCMadhubani"],
                shareText: "स्वतंत्रता दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🇮🇳",
                emoji: "🇮🇳",
                specialOffer: "देशभक्ति सप्ताह: सभी रक्षा सेवा आकांक्षियों के लिए फ्री काउंसलिंग"
            },

            // SEPTEMBER
            {
                name: "गणेश चतुर्थी",
                englishName: "Ganesh Chaturthi",
                date: this.getFestivalDate('ganesh-chaturthi', currentYear), // ✅ UPDATED
                theme: "ganesh-chaturthi",
                icon: "fas fa-elephant",
                startDaysBefore: 7,
                endDaysAfter: 10,
                colors: ["#FFD700", "#FF0000", "#FFFFFF"],
                message: "गणेश चतुर्थी की शुभकामनाएँ! 🐘 गणपति बप्पा मोरया",
                background: "https://images.unsplash.com/photo-1563496779257-5f1a5c71b5d2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#GaneshChaturthi", "#GanpatiBappa", "#BBCCMadhubani", "#Ganesha"],
                shareText: "गणेश चतुर्थी की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🐘",
                emoji: "🐘",
                specialOffer: "विद्या आरंभ पूजा: नए सत्र की शुरुआत पर विशेष"
            },
            {
                name: "शिक्षक दिवस",
                englishName: "Teacher's Day",
                date: this.getFestivalDate('teachers-day', currentYear), // ✅ UPDATED
                theme: "teachers-day",
                icon: "fas fa-chalkboard-teacher",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#9C27B0", "#FF9800", "#FFFFFF"],
                message: "शिक्षक दिवस की शुभकामनाएँ! सभी गुरुजनों को नमन",
                background: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#TeachersDay", "#5September", "#BBCCMadhubani", "#RespectTeachers"],
                shareText: "शिक्षक दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी",
                emoji: "👨‍🏫",
                specialOffer: "गुरु दक्षिणा: पुराने छात्रों के लिए 30% छूट"
            },

            // OCTOBER
            {
                name: "दुर्गा पूजा",
                englishName: "Durga Puja",
                date: this.getFestivalDate('durga-puja', currentYear), // ✅ UPDATED
                theme: "durga-puja",
                icon: "fas fa-female",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#FF0000", "#FFFFFF", "#FFD700"],
                message: "दुर्गा पूजा की शुभकामनाएँ! 🙏 जय माँ दुर्गा",
                background: "https://images.unsplash.com/photo-1603216663465-7eb81d8dbf6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#DurgaPuja", "#Navratri", "#BBCCMadhubani", "#JaiMaaDurga"],
                shareText: "दुर्गा पूजा की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🙏",
                emoji: "🙏",
                specialOffer: "नवरात्रि विशेष: 9 दिनों की फ्री वर्कशॉप"
            },
            {
                name: "दशहरा",
                englishName: "Dussehra",
                date: this.getFestivalDate('dussehra', currentYear), // ✅ UPDATED
                theme: "dussehra",
                icon: "fas fa-crosshairs",
                startDaysBefore: 3,
                endDaysAfter: 3,
                colors: ["#FF0000", "#FFFFFF", "#000000"],
                message: "दशहरा की शुभकामनाएँ! बुराई पर अच्छाई की जीत",
                background: "https://images.unsplash.com/photo-1603216663465-7eb81d8dbf6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Dussehra", "#Vijayadashami", "#BBCCMadhubani", "#GoodOverEvil"],
                shareText: "दशहरा की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी",
                emoji: "⚔️",
                specialOffer: "विजयादशमी ऑफर: टॉपर्स के लिए स्पेशल स्कॉलरशिप"
            },
            {
                name: "दिवाली",
                englishName: "Diwali",
                date: this.getFestivalDate('diwali', currentYear), // ✅ UPDATED
                theme: "diwali",
                icon: "fas fa-oil-can",
                startDaysBefore: 15,
                endDaysAfter: 7,
                colors: ["#FFD700", "#FF6B35", "#4A00E0"],
                message: "दिवाली की शुभकामनाएँ! 🪔 रोशनी का त्योहार",
                background: "https://images.unsplash.com/photo-1604061986762-dbbe1297a68e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Diwali", "#FestivalOfLights", "#BBCCMadhubani", "#HappyDiwali"],
                shareText: "दिवाली की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🪔",
                emoji: "🪔",
                specialOffer: "दिवाली बोनस: फीस जमा करने पर एक्स्ट्रा क्लासेस फ्री"
            },
            {
                name: "गाँधी जयंती",
                englishName: "Gandhi Jayanti",
                date: this.getFestivalDate('gandhi-jayanti', currentYear), // ✅ UPDATED
                theme: "gandhi-jayanti",
                icon: "fas fa-peace",
                startDaysBefore: 7,
                endDaysAfter: 3,
                colors: ["#7d7d7d", "#ffffff", "#000000"],
                message: "गाँधी जयंती की शुभकामनाएँ!",
                background: "https://images.unsplash.com/photo-1581798459210-94d5d1d1dc56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#GandhiJayanti", "#2October", "#BBCCMadhubani"],
                shareText: "गाँधी जयंती की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी",
                emoji: "🕊️",
                specialOffer: "सत्याग्रह सप्ताह: सामाजिक सेवा प्रोजेक्ट में भाग लें, पाएं छूट"
            },

            // NOVEMBER
            {
                name: "छठ पूजा",
                englishName: "Chhath Puja",
                date: this.getFestivalDate('chhath-puja', currentYear), // ✅ UPDATED
                theme: "chhath-puja",
                icon: "fas fa-sun",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#FF8C00", "#FFD700", "#FF4500"],
                message: "छठ पूजा की शुभकामनाएँ! सूर्य देव की आराधना",
                background: "https://images.unsplash.com/photo-1604061986762-dbbe1297a68e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#ChhathPuja", "#Chhath", "#BBCCMadhubani", "#BiharFestival"],
                shareText: "छठ पूजा की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी",
                emoji: "☀️",
                specialOffer: "बिहार विशेष: स्थानीय छात्रों के लिए अतिरिक्त छूट"
            },
            {
                name: "बाल दिवस",
                englishName: "Children's Day",
                date: this.getFestivalDate('childrens-day', currentYear), // ✅ UPDATED
                theme: "childrens-day",
                icon: "fas fa-child",
                startDaysBefore: 5,
                endDaysAfter: 3,
                colors: ["#FF5722", "#00BCD4", "#8BC34A"],
                message: "बाल दिवस की शुभकामनाएँ! सभी बच्चों को",
                background: "https://images.unsplash.com/photo-1530277645362-bb2d3b9a6c6a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#ChildrensDay", "#14November", "#BBCCMadhubani", "#HappyChildrensDay"],
                shareText: "बाल दिवस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी",
                emoji: "👧",
                specialOffer: "बच्चों के लिए विशेष: सभी कोर्सेज पर 15% छूट"
            },

            // DECEMBER
            {
                name: "क्रिसमस",
                englishName: "Christmas",
                date: this.getFestivalDate('christmas', currentYear), // ✅ UPDATED
                theme: "christmas",
                icon: "fas fa-sleigh",
                startDaysBefore: 10,
                endDaysAfter: 5,
                colors: ["#D32F2F", "#388E3C", "#FFFFFF"],
                message: "क्रिसमस की शुभकामनाएँ! 🎄 मेरी क्रिसमस",
                background: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                hashtags: ["#Christmas", "#25December", "#BBCCMadhubani", "#MerryChristmas"],
                shareText: "क्रिसमस की शुभकामनाएँ! बाल भारती कोचिंग सेंटर, मधुबनी 🎄",
                emoji: "🎄",
                specialOffer: "क्रिसमस गिफ्ट: नए एडमिशन पर फ्री स्टडी किट"
            }
        ];
    }

    // ✅✅✅ नया AUTOMATIC FESTIVAL DATE FUNCTION ✅✅✅
   getFestivalDate(festivalName, year) {
    // 2026 के लिए सटीक तारीखें
    const festivalDates2026 = {
        // JANUARY 2026
        'new-year': [1, 0],        // 1 Jan
        'republic-day': [26, 0],   // 26 Jan
        'vasant-panchami': [23, 0], // 23 Jan ✅
        
        // FEBRUARY 2026  
        'maha-shivratri': [16, 1], // 16 Feb
        
        // MARCH 2026
        'holi': [3, 2],            // 3 Mar
        
        // APRIL 2026
        'ram-navami': [5, 3],      // 5 Apr
        
        // AUGUST 2026
        'independence-day': [15, 7], // 15 Aug
        'raksha-bandhan': [23, 7],  // 23 Aug
        'janmashtami': [24, 7],     // 24 Aug
        
        // SEPTEMBER 2026
        'teachers-day': [5, 8],     // 5 Sep
        'ganesh-chaturthi': [23, 8], // 23 Sep
        
        // OCTOBER 2026
        'gandhi-jayanti': [2, 9],   // 2 Oct
        'durga-puja': [11, 9],      // 11 Oct
        'dussehra': [20, 9],        // 20 Oct
        'diwali': [29, 9],          // 29 Oct
        
        // NOVEMBER 2026
        'chhath-puja': [7, 10],     // 7 Nov
        'childrens-day': [14, 10],  // 14 Nov
        
        // DECEMBER 2026
        'christmas': [25, 11]       // 25 Dec
    };
    
    // यदि 2026 है और त्योहार database में है
    if (year === 2026 && festivalDates2026[festivalName]) {
        const [day, month] = festivalDates2026[festivalName];
        return new Date(2026, month, day);
    }
    
    // अन्य वर्षों के लिए fixed dates
    const fixedDates = {
        'new-year': new Date(year, 0, 1),
        'republic-day': new Date(year, 0, 26),
        'independence-day': new Date(year, 7, 15),
        'teachers-day': new Date(year, 8, 5),
        'gandhi-jayanti': new Date(year, 9, 2),
        'childrens-day': new Date(year, 10, 14),
        'christmas': new Date(year, 11, 25)
    };
    
    return fixedDates[festivalName] || new Date(year, 0, 1);
}
    checkSpecialDays() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeFestivals = [];  // सभी एक्टिव फेस्टिवल इकट्ठा करें
        
        for (const day of this.specialDays) {
            const startDate = new Date(day.date);
            startDate.setDate(startDate.getDate() - day.startDaysBefore);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(day.date);
            endDate.setDate(endDate.getDate() + day.endDaysAfter);
            endDate.setHours(23, 59, 59, 999);

            if (today >= startDate && today <= endDate) {
                activeFestivals.push(day);  // सभी जोड़ें
            }
        }
        
        // अब सॉर्ट करें
        if (activeFestivals.length > 0) {
            // 1. पहले ठीक आज वाले फेस्टिवल (exact date match)
            // 2. फिर शुरू हुए लेकिन आज नहीं वाले
            // 3. फिर आने वाले (upcoming)
            
            activeFestivals.sort((a, b) => {
                // Exact festival date today - highest priority
                const aIsToday = today.getDate() === a.date.getDate() && 
                                today.getMonth() === a.date.getMonth();
                const bIsToday = today.getDate() === b.date.getDate() && 
                                today.getMonth() === b.date.getMonth();
                
                if (aIsToday && !bIsToday) return -1;
                if (!aIsToday && bIsToday) return 1;
                
                // Closest festival gets priority
                const aDiff = Math.abs(a.date - today);
                const bDiff = Math.abs(b.date - today);
                return aDiff - bDiff;
            });
            
            // पहला सबसे इम्पोर्टेन्ट थीम
            this.currentTheme = activeFestivals[0];
            
            // सभी एक्टिव फेस्टिवल स्टोर करें
            this.activeFestivals = activeFestivals;
            
            console.log(`🎊 ${activeFestivals.length} फेस्टिवल एक्टिव:`);
            activeFestivals.forEach(f => {
                console.log(`   - ${f.name} (${f.date.toLocaleDateString()})`);
            });
        }
    }

    // =================== THEME ROTATION SYSTEM ===================
    
    // थीम रोटेशन शुरू करें (हर 10 सेकंड)
    startThemeRotation() {
        if (this.activeFestivals.length <= 1) return;
        
        this.isThemeRotating = true;
        
        // हर 10 सेकंड में थीम बदलें
        this.themeRotationInterval = setInterval(() => {
            this.rotateToNextTheme();
        }, 10000); // 10 seconds
        
        console.log(`🎭 Theme Rotation Started: ${this.activeFestivals.length} festivals, 10s interval`);
        
        // रोटेशन जानकारी दिखाएं
        this.showRotationInfo();
    }
    
    // अगली थीम पर जाएं
    rotateToNextTheme() {
        if (this.activeFestivals.length <= 1) return;
        
        // पहले वाली थीम remove करें
        document.body.classList.remove(`theme-${this.currentTheme.theme}`);
        
        // अगली थीम select करें
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.activeFestivals.length;
        this.currentTheme = this.activeFestivals[this.currentThemeIndex];
        
        // नई थीम apply करें
        this.applyTheme();
        
        // रोटेशन जानकारी update करें
        this.updateRotationInfo();
        
        console.log(`🔄 Theme Changed to: ${this.currentTheme.name} (${this.currentThemeIndex + 1}/${this.activeFestivals.length})`);
    }
    
    // थीम apply करें (updated for rotation)
    applyTheme() {
        if (!this.currentTheme) return;
        
        // सभी पुरानी थीम classes हटाएं
        if (this.activeFestivals.length > 1) {
            this.activeFestivals.forEach(festival => {
                document.body.classList.remove(`theme-${festival.theme}`);
            });
        }
        
        // नई थीम class add करें
        document.body.classList.add(`theme-${this.currentTheme.theme}`, 'theme-active');
        
        // अन्य elements को update करें
        document.querySelectorAll('.main-header, .main-footer, .hero-container').forEach(el => {
            el?.classList.add('theme-active');
        });
        
        // CSS variables update करें
        this.updateCSSVariables();
        
        // CSS animations add करें
        this.addThemeStyles();
        
        // Background update करें
        this.updateBackground();
    }
    
    updateBackground() {
        if (!this.currentTheme?.background) return;
        
        const heroContainer = document.querySelector('.hero-container');
        if (heroContainer) {
            heroContainer.style.backgroundImage = 
                `linear-gradient(rgba(var(--theme-primary-rgb), 0.9), 
                  rgba(var(--theme-primary-rgb), 0.7)),
                 url('${this.currentTheme.background}')`;
            heroContainer.style.backgroundSize = 'cover';
            heroContainer.style.backgroundPosition = 'center';
            heroContainer.style.transition = 'background-image 1s ease-in-out';
        }
    }
    
    // रोटेशन जानकारी दिखाएं
    showRotationInfo() {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'theme-rotation-info';
        infoDiv.id = 'themeRotationInfo';
        infoDiv.innerHTML = `
            <div class="rotation-content">
                <span class="rotation-icon">🎭</span>
                <span class="rotation-text">
                    <strong>${this.activeFestivals.length} फेस्टिवल</strong>
                    <small>हर 10 सेकंड में थीम बदल रहा है</small>
                </span>
                <button class="rotation-pause-btn" title="रोकें/चालू करें">
                    <i class="fas fa-pause"></i>
                </button>
            </div>
            <div class="rotation-progress">
                <div class="progress-bar"></div>
            </div>
        `;
        
        document.body.appendChild(infoDiv);
        
        // Pause button event
        infoDiv.querySelector('.rotation-pause-btn').addEventListener('click', () => {
            this.toggleThemeRotation();
        });
        
        // Progress bar animation
        this.startProgressBar();
    }
    
    updateRotationInfo() {
        const infoDiv = document.getElementById('themeRotationInfo');
        if (!infoDiv) return;
        
        const rotationText = infoDiv.querySelector('.rotation-text strong');
        if (rotationText) {
            rotationText.textContent = `${this.currentThemeIndex + 1}/${this.activeFestivals.length} - ${this.currentTheme.name}`;
        }
        
        // Progress bar restart
        this.startProgressBar();
    }
    
    startProgressBar() {
        const progressBar = document.querySelector('.rotation-progress .progress-bar');
        if (progressBar) {
            progressBar.style.animation = 'none';
            setTimeout(() => {
                progressBar.style.animation = 'progressAnimation 10s linear';
            }, 10);
        }
    }
    
    toggleThemeRotation() {
        const btn = document.querySelector('.rotation-pause-btn i');
        
        if (this.isThemeRotating) {
            // Pause rotation
            clearInterval(this.themeRotationInterval);
            this.isThemeRotating = false;
            btn.className = 'fas fa-play';
            
            // Progress bar pause
            const progressBar = document.querySelector('.rotation-progress .progress-bar');
            if (progressBar) {
                progressBar.style.animationPlayState = 'paused';
            }
            
            this.showToast('थीम रोटेशन रोका गया');
        } else {
            // Resume rotation
            this.startThemeRotation();
            btn.className = 'fas fa-pause';
            
            // Progress bar resume
            const progressBar = document.querySelector('.rotation-progress .progress-bar');
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
            }
            
            this.showToast('थीम रोटेशन शुरू किया');
        }
    }
    
    // =================== MULTI-FESTIVAL BANNER ===================
    
    showMultiFestivalBanner() {
        const banner = document.createElement('div');
        banner.className = 'multi-festival-banner';
        banner.id = 'multiFestivalBanner';
        
        // Festival names scroll करें
        const festivalNames = this.activeFestivals.map(f => f.name).join(' • ');
        
        banner.innerHTML = `
            <div class="festival-scroll">
                <i class="fas fa-star"></i>
                <span class="festival-names">${festivalNames}</span>
                <i class="fas fa-star"></i>
            </div>
            <div class="festival-counter">
                <span>${this.activeFestivals.length} फेस्टिवल</span>
                <button class="theme-info-btn" title="थीम जानकारी">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Info button event
        banner.querySelector('.theme-info-btn').addEventListener('click', () => {
            this.showMultiFestivalInfo();
        });
        
        // Adjust header margin
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.marginTop = '60px';
        }
    }
    
    showMultiFestivalInfo() {
        const modal = document.createElement('div');
        modal.className = 'multi-festival-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎊 ${this.activeFestivals.length} फेस्टिवल एक्टिव</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="festival-list">
                        ${this.activeFestivals.map((festival, index) => `
                            <div class="festival-item ${index === this.currentThemeIndex ? 'active' : ''}">
                                <div class="festival-icon">${this.getFestivalEmoji(festival.theme)}</div>
                                <div class="festival-details">
                                    <h4>${festival.name}</h4>
                                    <p>${festival.englishName}</p>
                                    <small>${festival.message}</small>
                                </div>
                                <div class="festival-status">
                                    ${index === this.currentThemeIndex ? 
                                        '<span class="active-badge">सक्रिय</span>' : 
                                        `<button onclick="themeManager.switchToTheme(${index})">चुनें</button>`
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-footer">
                        <p>थीम हर 10 सेकंड में बदलती है। मैन्युअल चुनने के 30 सेकंड बाद ऑटो रोटेशन फिर शुरू होगा।</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    switchToTheme(index) {
        if (index >= 0 && index < this.activeFestivals.length) {
            // Manual switch - pause auto rotation
            clearInterval(this.themeRotationInterval);
            this.isThemeRotating = false;
            
            // Change theme
            this.currentThemeIndex = index;
            this.currentTheme = this.activeFestivals[index];
            this.applyTheme();
            
            // Update UI
            const btn = document.querySelector('.rotation-pause-btn i');
            if (btn) btn.className = 'fas fa-play';
            
            this.updateRotationInfo();
            this.showToast(`${this.currentTheme.name} थीम चुना गया`);
            
            // Restart rotation after 30 seconds
            setTimeout(() => {
                this.startThemeRotation();
            }, 30000);
        }
    }
    
    showMultiFestivalNotification() {
        const notification = document.createElement('div');
        notification.className = 'multi-festival-notification';
        notification.id = 'multiFestivalNotification';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="festival-icons">
                    ${this.activeFestivals.map(f => 
                        `<span class="festival-icon" title="${f.name}">${this.getFestivalEmoji(f.theme)}</span>`
                    ).join('')}
                </div>
                <div class="notification-text">
                    <strong>${this.activeFestivals.length} फेस्टिवल की शुभकामनाएँ!</strong>
                    <p>थीम हर 10 सेकंड में बदल रही है</p>
                </div>
                <button class="close-notification">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 500);
            }
        }, 10000);
        
        // Close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    // =================== UPDATED FUNCTIONS ===================
    
    preloadBackgrounds() {
        this.activeFestivals.forEach(festival => {
            if (festival.background) {
                const img = new Image();
                img.src = festival.background;
                img.onload = () => {
                    console.log(`✅ Background loaded: ${festival.name}`);
                };
            }
        });
    }
    
    addMultiFestivalToSidebar() {
        setTimeout(() => {
            const selectors = [
                '.teacher-ring-section',
                '.sidebar',
                '.right-sidebar',
                '.left-sidebar',
                '.side-section',
                '.main-container aside',
                '[class*="sidebar"]',
                '[class*="side"]:not(.main-side)'
            ];
            
            let targetSection = null;
            
            for (const selector of selectors) {
                targetSection = document.querySelector(selector);
                if (targetSection && targetSection.offsetParent !== null) {
                    break;
                }
            }
            
            if (!targetSection) {
                this.createMultiFestivalFloatingBanner();
                return;
            }
            
            const festivalBanner = document.createElement('div');
            festivalBanner.className = 'multi-festival-sidebar-banner';
            festivalBanner.id = 'multiFestivalSidebarBanner';
            
            festivalBanner.innerHTML = `
                <div class="festival-carousel">
                    ${this.activeFestivals.map((festival, index) => `
                        <div class="festival-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <div class="festival-emoji">${this.getFestivalEmoji(festival.theme)}</div>
                            <h4>${festival.name}</h4>
                            <p>${festival.message}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="festival-dots">
                    ${this.activeFestivals.map((_, index) => `
                        <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                    `).join('')}
                </div>
                <div class="festival-timer">
                    <div class="timer-bar"></div>
                </div>
            `;
            
            targetSection.insertBefore(festivalBanner, targetSection.firstChild);
            
            // Add event listeners for dots
            festivalBanner.querySelectorAll('.dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.switchToTheme(index);
                });
            });
            
            // Auto rotate carousel
            let carouselIndex = 0;
            setInterval(() => {
                const slides = festivalBanner.querySelectorAll('.festival-slide');
                const dots = festivalBanner.querySelectorAll('.dot');
                
                slides.forEach(slide => slide.classList.remove('active'));
                dots.forEach(dot => dot.classList.remove('active'));
                
                carouselIndex = (carouselIndex + 1) % this.activeFestivals.length;
                
                slides[carouselIndex].classList.add('active');
                dots[carouselIndex].classList.add('active');
            }, 5000);
            
        }, 1000);
    }
    
    createMultiFestivalFloatingBanner() {
        const banner = document.createElement('div');
        banner.className = 'multi-festival-floating-banner';
        banner.id = 'multiFestivalFloatingBanner';
        
        banner.innerHTML = `
            <div class="floating-content">
                <div class="festival-count">
                    <i class="fas fa-star"></i>
                    <span>${this.activeFestivals.length} फेस्टिवल</span>
                </div>
                <div class="current-festival">
                    <strong>${this.currentTheme.name}</strong>
                    <small>${this.currentTheme.message}</small>
                </div>
                <button class="floating-btn" onclick="themeManager.showMultiFestivalInfo()">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Update current festival every 10 seconds
        setInterval(() => {
            const currentFestival = banner.querySelector('.current-festival strong');
            const currentMessage = banner.querySelector('.current-festival small');
            
            if (currentFestival && currentMessage) {
                currentFestival.textContent = this.currentTheme.name;
                currentMessage.textContent = this.currentTheme.message;
            }
        }, 10000);
    }

    // =================== ORIGINAL FUNCTIONS (UPDATED) ===================
    
    updateCSSVariables() {
        if (!this.currentTheme) return;

        const root = document.documentElement;
        const colors = this.currentTheme.colors;

        root.style.setProperty('--theme-primary', colors[0]);
        root.style.setProperty('--theme-secondary', colors[1] || colors[0]);
        root.style.setProperty('--theme-accent', colors[2] || colors[0]);
        
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? 
                `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
                '74, 111, 255';
        };
        
        root.style.setProperty('--theme-primary-rgb', hexToRgb(colors[0]));
    }

    addThemeStyles() {
        const styleId = 'festival-theme-styles';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            /* Theme Rotation Styles */
            .theme-rotation-info {
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                color: white;
                border-radius: 10px;
                padding: 10px 15px;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                min-width: 250px;
                animation: slideInRight 0.5s ease;
            }
            
            .rotation-content {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }
            
            .rotation-icon {
                font-size: 1.2rem;
            }
            
            .rotation-text {
                flex: 1;
            }
            
            .rotation-text strong {
                display: block;
                font-size: 0.9rem;
            }
            
            .rotation-text small {
                font-size: 0.75rem;
                opacity: 0.9;
            }
            
            .rotation-pause-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .rotation-pause-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }
            
            .rotation-progress {
                height: 3px;
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                width: 100%;
                background: white;
                animation: progressAnimation 10s linear infinite;
                transform-origin: left;
            }
            
            @keyframes progressAnimation {
                0% { transform: scaleX(0); }
                100% { transform: scaleX(1); }
            }
            
            /* Multi Festival Banner */
            .multi-festival-banner {
                background: linear-gradient(90deg, 
                    var(--theme-primary) 0%,
                    var(--theme-secondary) 50%,
                    var(--theme-accent) 100%);
                color: white;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                animation: slideDown 0.5s ease;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 999;
            }
            
            .festival-scroll {
                display: flex;
                align-items: center;
                gap: 15px;
                overflow: hidden;
                flex: 1;
            }
            
            .festival-names {
                white-space: nowrap;
                animation: scrollText 30s linear infinite;
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .festival-counter {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(255,255,255,0.2);
                padding: 5px 12px;
                border-radius: 20px;
            }
            
            .theme-info-btn {
                background: transparent;
                color: white;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                padding: 5px;
                border-radius: 50%;
                transition: all 0.3s;
            }
            
            .theme-info-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }
            
            /* Multi Festival Notification */
            .multi-festival-notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                color: white;
                border-radius: 10px;
                padding: 15px;
                z-index: 9998;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                animation: slideInRight 0.5s ease;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .festival-icons {
                display: flex;
                gap: 8px;
            }
            
            .festival-icons .festival-icon {
                font-size: 1.5rem;
                animation: bounce 2s infinite;
            }
            
            .notification-text {
                flex: 1;
            }
            
            .notification-text strong {
                display: block;
                font-size: 1rem;
                margin-bottom: 3px;
            }
            
            .notification-text p {
                font-size: 0.85rem;
                opacity: 0.9;
                margin: 0;
            }
            
            .close-notification {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1rem;
            }
            
            /* Multi Festival Modal */
            .multi-festival-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .multi-festival-modal .modal-content {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideUp 0.4s ease;
            }
            
            .modal-header {
                background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                color: white;
                padding: 20px;
                border-radius: 15px 15px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                margin: 0;
            }
            
            .close-modal {
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .festival-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .festival-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                border-bottom: 1px solid #eee;
                transition: all 0.3s;
            }
            
            .festival-item.active {
                background: rgba(var(--theme-primary-rgb), 0.1);
                border-left: 4px solid var(--theme-primary);
            }
            
            .festival-item:last-child {
                border-bottom: none;
            }
            
            .festival-icon {
                font-size: 2rem;
            }
            
            .festival-details {
                flex: 1;
            }
            
            .festival-details h4 {
                margin: 0 0 5px;
                color: var(--theme-primary);
            }
            
            .festival-details p {
                margin: 0 0 3px;
                font-size: 0.9rem;
                color: #666;
            }
            
            .festival-details small {
                font-size: 0.8rem;
                color: #888;
            }
            
            .festival-status .active-badge {
                background: var(--theme-primary);
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .festival-status button {
                background: var(--theme-primary);
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s;
            }
            
            .festival-status button:hover {
                background: var(--theme-secondary);
                transform: scale(1.05);
            }
            
            .modal-footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #eee;
                font-size: 0.9rem;
                color: #666;
                text-align: center;
            }
            
            /* Multi Festival Sidebar Banner */
            .multi-festival-sidebar-banner {
                margin: 15px;
                background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            
            .festival-carousel {
                padding: 20px;
            }
            
            .festival-slide {
                display: none;
                text-align: center;
                color: white;
            }
            
            .festival-slide.active {
                display: block;
                animation: fadeIn 0.5s ease;
            }
            
            .festival-slide .festival-emoji {
                font-size: 3rem;
                margin-bottom: 10px;
                animation: bounce 2s infinite;
            }
            
            .festival-slide h4 {
                margin: 0 0 10px;
                font-size: 1.4rem;
            }
            
            .festival-slide p {
                margin: 0;
                font-size: 0.95rem;
                opacity: 0.9;
            }
            
            .festival-dots {
                display: flex;
                justify-content: center;
                gap: 8px;
                padding: 10px;
                background: rgba(0,0,0,0.2);
            }
            
            .dot {
                width: 10px;
                height: 10px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .dot.active {
                background: white;
                transform: scale(1.3);
            }
            
            .festival-timer {
                height: 3px;
                background: rgba(0,0,0,0.2);
            }
            
            .timer-bar {
                height: 100%;
                width: 100%;
                background: white;
                animation: timerAnimation 5s linear infinite;
            }
            
            /* Multi Festival Floating Banner */
            .multi-festival-floating-banner {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                color: white;
                border-radius: 10px;
                padding: 15px;
                z-index: 9999;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                animation: slideInUp 0.5s ease;
            }
            
            .floating-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .festival-count {
                background: rgba(255,255,255,0.2);
                padding: 5px 10px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .current-festival {
                flex: 1;
                min-width: 150px;
            }
            
            .current-festival strong {
                display: block;
                font-size: 1rem;
                margin-bottom: 3px;
            }
            
            .current-festival small {
                font-size: 0.8rem;
                opacity: 0.9;
                display: block;
            }
            
            .floating-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                transition: all 0.3s;
            }
            
            .floating-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }
            
            /* Animations */
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                }
                to {
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes scrollText {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
            
            @keyframes timerAnimation {
                0% { width: 0%; }
                100% { width: 100%; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            
            /* Original Theme Styles */
            .theme-active .main-header {
                background: linear-gradient(135deg, 
                    var(--theme-primary), 
                    var(--theme-secondary)) !important;
                transition: all 1s ease;
            }
            
            .theme-active .btn-primary {
                background: var(--theme-primary) !important;
                border-color: var(--theme-primary) !important;
                transition: all 1s ease;
            }
            
            body {
                transition: background-color 1s ease, color 1s ease;
            }
            
            .theme-active {
                transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
            }
        `;
    }

    // =================== ORIGINAL FUNCTIONS (KEEP AS IS) ===================
    
    preloadBackground() {
        if (!this.currentTheme?.background) return;
        
        const img = new Image();
        img.src = this.currentTheme.background;
        img.onload = () => {
            console.log('✅ Background image loaded:', this.currentTheme.background);
        };
    }

    getFestivalEmoji(theme) {
        const themeEmojis = {
            'new-year': '🎉',
            'republic-day': '🇮🇳',
            'vasant-panchami': '🌼',
            'shivratri': '🙏',
            'holi': '🎨',
            'ram-navami': '🙏',
            'independence-day': '🇮🇳',
            'raksha-bandhan': '🎀',
            'janmashtami': '🎉',
            'ganesh-chaturthi': '🐘',
            'teachers-day': '👨‍🏫',
            'durga-puja': '🙏',
            'dussehra': '⚔️',
            'diwali': '🪔',
            'gandhi-jayanti': '🕊️',
            'chhath-puja': '☀️',
            'childrens-day': '👧',
            'christmas': '🎄'
        };
        
        return themeEmojis[theme] || '🎊';
    }

    showNotification() {
        if (!this.currentTheme) return;

        const existingNotification = document.getElementById('specialDayNotification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = 'special-notification';
        notification.id = 'specialDayNotification';
        
        notification.innerHTML = `
            <i class="fas fa-calendar-star"></i>
            <div class="special-notification-content">
                <strong>${this.currentTheme.message}</strong>
                <div class="share-buttons">
                    <button class="share-btn whatsapp" onclick="window.themeManager.shareOnWhatsApp()">
                        <i class="fab fa-whatsapp"></i> Share
                    </button>
                    <button class="share-btn facebook" onclick="window.themeManager.shareOnFacebook()">
                        <i class="fab fa-facebook-f"></i> Share
                    </button>
                    <button class="share-btn download" onclick="window.themeManager.downloadThemeImage()">
                        <i class="fas fa-download"></i> Save
                    </button>
                </div>
            </div>
            <button class="close-notification" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 500);
            }
        }, 15000);
    }

    showBanner() {
        if (!this.currentTheme) return;

        const existingBanner = document.querySelector('.special-day-banner');
        if (existingBanner) existingBanner.remove();

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
        
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.marginTop = '60px';
        }
    }

    addSocialSharing() {
        if (!this.currentTheme) return;
        
        const shareContainer = document.querySelector('.social-sharing-container');
        if (!shareContainer) return;
        
        shareContainer.innerHTML = `
            <div class="festival-sharing">
                <h4>शुभकामनाएँ साझा करें:</h4>
                <div class="sharing-buttons">
                    <button class="share-btn whatsapp" onclick="themeManager.shareOnWhatsApp()">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button class="share-btn facebook" onclick="themeManager.shareOnFacebook()">
                        <i class="fab fa-facebook-f"></i> Facebook
                    </button>
                    <button class="share-btn twitter" onclick="themeManager.shareOnTwitter()">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button class="share-btn instagram" onclick="themeManager.shareOnInstagram()">
                        <i class="fab fa-instagram"></i> Instagram
                    </button>
                </div>
            </div>
        `;
    }

    startCelebration() {
        if (!this.currentTheme) return;
        
        this.addParticles();
        document.addEventListener('click', this.playFestiveSound.bind(this), { once: true });
    }

    addParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'festival-particles';
        particlesContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
            overflow: hidden;
        `;
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            const color = this.currentTheme.colors[Math.floor(Math.random() * this.currentTheme.colors.length)];
            
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${color};
                border-radius: 50%;
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
                opacity: ${Math.random() * 0.5 + 0.3};
            `;
            
            particlesContainer.appendChild(particle);
        }
        
        document.body.appendChild(particlesContainer);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatParticle {
                0% {
                    transform: translateY(100vh) rotate(0deg);
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    getFestivalMP3(theme) {
        const mp3Files = {
            'diwali': 'https://assets.mixkit.co/sfx/preview/mixkit-firework-show-3019.mp3',
            'holi': 'https://assets.mixkit.co/sfx/preview/mixkit-party-horn-sound-2927.mp3',
            'new-year': 'https://assets.mixkit.co/sfx/preview/mixkit-new-year-countdown-party-2171.mp3',
            'christmas': 'https://assets.mixkit.co/sfx/preview/mixkit-christmas-bells-2995.mp3',
            'ganesh-chaturthi': 'https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3',
            'republic-day': 'https://assets.mixkit.co/sfx/preview/mixkit-national-anthem-of-india-170.mp3',
            'independence-day': 'https://assets.mixkit.co/sfx/preview/mixkit-national-anthem-of-india-170.mp3',
            'janmashtami': 'https://assets.mixkit.co/sfx/preview/mixkit-flute-melody-ambient-148.mp3',
            'ram-navami': 'https://assets.mixkit.co/sfx/preview/mixkit-temple-bell-sound-3554.mp3',
            'durga-puja': 'https://assets.mixkit.co/sfx/preview/mixkit-temple-drum-hitting-3555.mp3',
            'dussehra': 'https://assets.mixkit.co/sfx/preview/mixkit-victory-fanfare-2011.mp3',
            'vasant-panchami': 'https://assets.mixkit.co/sfx/preview/mixkit-flute-happy-melody-148.mp3',
            'shivratri': 'https://assets.mixkit.co/sfx/preview/mixkit-meditation-bells-1925.mp3',
            'raksha-bandhan': 'https://assets.mixkit.co/sfx/preview/mixkit-happy-family-melody-2020.mp3',
            'teachers-day': 'https://assets.mixkit.co/sfx/preview/mixkit-applause-light-1-276.mp3',
            'gandhi-jayanti': 'https://assets.mixkit.co/sfx/preview/mixkit-peaceful-bells-1924.mp3',
            'chhath-puja': 'https://assets.mixkit.co/sfx/preview/mixkit-morning-in-the-jungle-1235.mp3',
            'childrens-day': 'https://assets.mixkit.co/sfx/preview/mixkit-kids-laughing-143.mp3',
            'default': 'https://assets.mixkit.co/sfx/preview/mixkit-celebration-horn-2015.mp3'
        };
        
        return mp3Files[theme] || mp3Files['default'];
    }

    playMP3Sound(theme) {
        const mp3Url = this.getFestivalMP3(theme);
        const audio = new Audio(mp3Url);
        audio.volume = 0.3;
        
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 10000);
        
        audio.play().catch(e => {
            console.log('MP3 play failed, using generated sound instead');
            this.playFestiveSound();
        });
    }

    getFestivalSoundPattern(theme) {
        const patterns = {
            'diwali': {
                notes: [
                    { frequency: 659.25, duration: 0.2, type: 'square' },
                    { frequency: 523.25, duration: 0.2, type: 'square' },
                    { frequency: 392.00, duration: 0.3, type: 'square' },
                    { frequency: 659.25, duration: 0.1, type: 'square' },
                    { frequency: 783.99, duration: 0.4, type: 'square' },
                    { frequency: 523.25, duration: 0.2, type: 'square' },
                    { frequency: 392.00, duration: 0.5, type: 'square' },
                    { frequency: 293.66, duration: 0.3, type: 'square' },
                ]
            },
            'holi': {
                notes: [
                    { frequency: 523.25, duration: 0.3, type: 'sine' },
                    { frequency: 587.33, duration: 0.3, type: 'sine' },
                    { frequency: 659.25, duration: 0.3, type: 'sine' },
                    { frequency: 698.46, duration: 0.3, type: 'sine' },
                    { frequency: 783.99, duration: 0.4, type: 'sine' },
                    { frequency: 880.00, duration: 0.4, type: 'sine' },
                    { frequency: 987.77, duration: 0.5, type: 'sine' },
                    { frequency: 1046.50, duration: 0.5, type: 'sine' },
                ]
            },
            'new-year': {
                notes: [
                    { frequency: 1046.50, duration: 0.5, type: 'triangle' },
                    { frequency: 1174.66, duration: 0.5, type: 'triangle' },
                    { frequency: 1318.51, duration: 0.5, type: 'triangle' },
                    { frequency: 1396.91, duration: 0.5, type: 'triangle' },
                    { frequency: 1567.98, duration: 1.0, type: 'triangle' },
                    { frequency: 1760.00, duration: 1.0, type: 'triangle' },
                    { frequency: 1975.53, duration: 1.5, type: 'triangle' },
                ]
            },
            'default': {
                notes: [
                    { frequency: 440.00, duration: 0.3, type: 'sine' },
                    { frequency: 493.88, duration: 0.3, type: 'sine' },
                    { frequency: 523.25, duration: 0.4, type: 'sine' },
                    { frequency: 587.33, duration: 0.3, type: 'sine' },
                    { frequency: 659.25, duration: 0.5, type: 'sine' },
                    { frequency: 587.33, duration: 0.3, type: 'sine' },
                    { frequency: 523.25, duration: 0.4, type: 'sine' },
                    { frequency: 493.88, duration: 0.3, type: 'sine' },
                    { frequency: 440.00, duration: 0.5, type: 'sine' },
                ]
            }
        };
        
        return patterns[theme] || patterns['default'];
    }

    playFestiveSound() {
        if (!this.currentTheme) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const soundPattern = this.getFestivalSoundPattern(this.currentTheme.theme);
            
            soundPattern.notes.forEach((note, index) => {
                setTimeout(() => {
                    this.playNote(audioContext, note.frequency, note.duration, note.type);
                }, index * 500);
            });
            
            console.log(`🎵 Playing ${this.currentTheme.name} theme sound`);
            
        } catch (e) {
            console.log('Audio not supported or blocked by browser');
            this.playMP3Sound(this.currentTheme.theme);
        }
    }

    playNote(audioContext, frequency, duration, type = 'sine') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    addFestivalToSidebar() {
        if (!this.currentTheme || !this.isFestivalBannerVisible) return;
        
        this.removeFestivalFromSidebar();
        
        setTimeout(() => {
            const selectors = [
                '.teacher-ring-section',
                '.sidebar',
                '.right-sidebar',
                '.left-sidebar',
                '.side-section',
                '.main-container aside',
                '[class*="sidebar"]',
                '[class*="side"]:not(.main-side)'
            ];
            
            let targetSection = null;
            
            for (const selector of selectors) {
                targetSection = document.querySelector(selector);
                if (targetSection && targetSection.offsetParent !== null) {
                    break;
                }
            }
            
            if (!targetSection) {
                this.createFloatingBanner();
                return;
            }
            
            const festivalBanner = document.createElement('div');
            festivalBanner.className = 'festival-sidebar-banner';
            festivalBanner.id = 'festivalSidebarBanner';
            
            const today = new Date();
            const festivalDate = new Date(this.currentTheme.date);
            const diffTime = festivalDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let statusText = '';
            let statusClass = '';
            if (diffDays > 0) {
                statusText = `${diffDays} दिन बचे`;
                statusClass = 'upcoming';
            } else if (diffDays === 0) {
                statusText = 'आज है!';
                statusClass = 'today';
            } else {
                statusText = `${Math.abs(diffDays)} दिन पहले`;
                statusClass = 'past';
            }
            
            festivalBanner.innerHTML = `
                <div class="festival-banner-content">
                    <div class="festival-icon">
                        ${this.getFestivalEmoji(this.currentTheme.theme)}
                    </div>
                    <h3 class="festival-title">
                        ${this.currentTheme.name}
                        <span class="festival-english">${this.currentTheme.englishName}</span>
                    </h3>
                    <p class="festival-message">
                        ${this.currentTheme.message}
                    </p>
                    <div class="festival-info">
                        <div class="days-count ${statusClass}">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${statusText}</span>
                        </div>
                        <div class="festival-colors">
                            ${this.currentTheme.colors.map(color => 
                                `<span class="color-dot" style="background: ${color};"></span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="festival-offer">
                        <p><i class="fas fa-gift"></i> ${this.currentTheme.specialOffer}</p>
                    </div>
                    <button class="festival-action-btn">
                        <i class="fas fa-star"></i>
                        <span>विशेष ऑफर देखें</span>
                    </button>
                    <div class="festival-hashtags">
                        ${this.currentTheme.hashtags.slice(0, 3).map(tag => 
                            `<span class="hashtag">${tag}</span>`
                        ).join('')}
                    </div>
                    <button class="close-festival-banner">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            targetSection.insertBefore(festivalBanner, targetSection.firstChild);
            
            this.addSoundToBanner();
            
            festivalBanner.querySelector('.festival-action-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleFestivalBannerClick();
            });
            
            festivalBanner.querySelector('.close-festival-banner').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFestivalFromSidebar();
                this.showToast('फेस्टिवल बैनर बंद किया गया');
            });
            
            const bannerContent = festivalBanner.querySelector('.festival-banner-content');
            bannerContent.addEventListener('mouseenter', () => {
                bannerContent.style.transform = 'translateY(-5px)';
                bannerContent.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)';
            });
            
            bannerContent.addEventListener('mouseleave', () => {
                bannerContent.style.transform = 'translateY(0)';
                bannerContent.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
            });
            
            this.addBannerStyles();
            
            console.log('✅ Festival banner added successfully');
            
        }, 1000);
    }

    addSoundToBanner() {
        const banner = document.getElementById('festivalSidebarBanner');
        if (!banner) return;
        
        const bannerContent = banner.querySelector('.festival-banner-content');
        if (!bannerContent) return;
        
        bannerContent.removeEventListener('click', this.handleBannerClickWithSound);
        
        this.handleBannerClickWithSound = (e) => {
            if (!e.target.closest('.close-festival-banner') && 
                !e.target.closest('.festival-action-btn')) {
                
                this.playFestiveSound();
                setTimeout(() => {
                    this.handleFestivalBannerClick();
                }, 500);
            }
        };
        
        bannerContent.addEventListener('click', this.handleBannerClickWithSound.bind(this));
        
        console.log('🔊 Sound added to festival banner');
    }

    createFloatingBanner() {
        const festivalBanner = document.createElement('div');
        festivalBanner.className = 'festival-floating-banner';
        festivalBanner.id = 'festivalSidebarBanner';
        festivalBanner.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 300px;
            z-index: 9999;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        festivalBanner.innerHTML = `
            <div style="
                background: linear-gradient(135deg, ${this.currentTheme.colors[0]}, ${this.currentTheme.colors[1] || this.currentTheme.colors[0]});
                color: white;
                padding: 20px;
                text-align: center;
            ">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">
                    ${this.getFestivalEmoji(this.currentTheme.theme)}
                </div>
                <h4 style="margin: 0 0 10px;">${this.currentTheme.name}</h4>
                <p style="margin: 0 0 15px; font-size: 0.9rem;">${this.currentTheme.message}</p>
                <button onclick="themeManager.handleFestivalBannerClick()" style="
                    padding: 8px 20px;
                    background: white;
                    color: ${this.currentTheme.colors[0]};
                    border: none;
                    border-radius: 20px;
                    font-weight: bold;
                    cursor: pointer;
                ">
                    देखें
                </button>
                <button onclick="themeManager.removeFestivalFromSidebar()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    cursor: pointer;
                ">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(festivalBanner);
        this.addSoundToBanner();
    }

    addBannerStyles() {
        const styleId = 'festival-banner-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        
        style.textContent = `
            .festival-sidebar-banner {
                margin: 15px;
                animation: float 6s ease-in-out infinite;
            }
            
            .festival-banner-content {
                background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
                color: white;
                border-radius: 20px;
                padding: 25px 20px;
                text-align: center;
                border: 3px solid white;
                box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
            }
            
            .festival-banner-content::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(255,255,255,0.1) 50%,
                    transparent 70%
                );
                animation: shine 3s infinite linear;
            }
            
            .festival-icon {
                font-size: 3.8rem;
                margin-bottom: 15px;
                animation: bounce 2s infinite;
                filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
                line-height: 1;
            }
            
            .festival-title {
                margin: 0 0 10px;
                font-size: 1.7rem;
                font-weight: 800;
                text-shadow: 0 2px 8px rgba(0,0,0,0.3);
                line-height: 1.2;
            }
            
            .festival-english {
                display: block;
                font-size: 1rem;
                font-weight: 500;
                opacity: 0.9;
                margin-top: 5px;
            }
            
            .festival-message {
                margin: 0 0 20px;
                font-size: 1.05rem;
                opacity: 0.95;
                line-height: 1.5;
                min-height: 50px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            
            .festival-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(255,255,255,0.15);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .days-count {
                font-size: 1rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .days-count.upcoming {
                color: #4caf50;
            }
            
            .days-count.today {
                color: #ffeb3b;
                animation: pulse 1.5s infinite;
            }
            
            .days-count.past {
                color: #ff9800;
            }
            
            .festival-colors {
                display: flex;
                gap: 10px;
            }
            
            .color-dot {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: transform 0.3s;
            }
            
            .color-dot:hover {
                transform: scale(1.3);
            }
            
            .festival-offer {
                background: rgba(0,0,0,0.2);
                border-radius: 10px;
                padding: 12px;
                margin-bottom: 20px;
                border-left: 4px solid white;
            }
            
            .festival-offer p {
                margin: 0;
                font-size: 0.95rem;
                line-height: 1.4;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .festival-offer i {
                font-size: 1.2rem;
            }
            
            .festival-action-btn {
                padding: 14px 35px;
                background: linear-gradient(to right, white, #f8f9fa);
                color: var(--theme-primary);
                border: none;
                border-radius: 30px;
                font-weight: 800;
                font-size: 1.1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin: 0 auto 20px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            
            .festival-action-btn:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 12px 25px rgba(0,0,0,0.3);
            }
            
            .festival-hashtags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
                margin-top: 15px;
            }
            
            .hashtag {
                background: rgba(255,255,255,0.25);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
                border: 1px solid rgba(255,255,255,0.4);
                transition: all 0.3s;
            }
            
            .hashtag:hover {
                background: rgba(255,255,255,0.4);
                transform: translateY(-2px);
            }
            
            .close-festival-banner {
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(255,255,255,0.25);
                color: white;
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255,255,255,0.3);
            }
            
            .close-festival-banner:hover {
                background: rgba(255,255,255,0.4);
                transform: rotate(90deg) scale(1.1);
            }
            
            @keyframes shine {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
        `;
        
        document.head.appendChild(style);
    }

    removeFestivalFromSidebar() {
        const banner = document.getElementById('festivalSidebarBanner');
        const floatingBanner = document.querySelector('.festival-floating-banner');
        
        if (banner) {
            banner.style.opacity = '0';
            banner.style.transform = 'scale(0.8)';
            setTimeout(() => banner.remove(), 300);
        }
        
        if (floatingBanner) {
            floatingBanner.style.opacity = '0';
            floatingBanner.style.transform = 'translateX(100%)';
            setTimeout(() => floatingBanner.remove(), 300);
        }
        
        this.isFestivalBannerVisible = false;
    }

    handleFestivalBannerClick() {
        if (!this.currentTheme) return;
        
        this.playFestiveSound();
        
        setTimeout(() => {
            this.showFestivalModal();
        }, 300);
        
        const clicks = parseInt(localStorage.getItem('festivalClicks') || '0') + 1;
        localStorage.setItem('festivalClicks', clicks.toString());
        localStorage.setItem('lastFestivalClicked', this.currentTheme.name);
    }

    showFestivalModal() {
        const modalId = 'festivalModal';
        let modal = document.getElementById(modalId);
        
        if (modal) modal.remove();
        
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'festival-modal';
        
        modal.innerHTML = `
            <div class="festival-modal-content">
                <div class="festival-modal-header" style="
                    background: linear-gradient(135deg, ${this.currentTheme.colors[0]}, ${this.currentTheme.colors[1] || this.currentTheme.colors[0]});
                    color: white;
                    padding: 25px;
                    border-radius: 15px 15px 0 0;
                    text-align: center;
                ">
                    <h2 style="margin: 0 0 10px;">
                        <i class="${this.currentTheme.icon}"></i>
                        ${this.currentTheme.name}
                    </h2>
                    <p style="margin: 0; opacity: 0.9;">${this.currentTheme.englishName}</p>
                </div>
                
                <div class="festival-modal-body" style="padding: 25px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 4rem; margin-bottom: 15px;">
                            ${this.getFestivalEmoji(this.currentTheme.theme)}
                        </div>
                        <p style="font-size: 1.1rem; line-height: 1.6;">
                            ${this.currentTheme.message}
                        </p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0; color: var(--theme-primary);">
                            <i class="fas fa-gift"></i> विशेष ऑफर
                        </h4>
                        <p style="margin: 10px 0;">${this.currentTheme.specialOffer}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; color: var(--theme-primary);">
                                <i class="fas fa-palette"></i>
                            </div>
                            <div style="font-size: 0.9rem;">थीम कलर्स</div>
                            <div style="display: flex; gap: 5px; justify-content: center; margin-top: 5px;">
                                ${this.currentTheme.colors.map(color => 
                                    `<span style="
                                        width: 20px;
                                        height: 20px;
                                        background: ${color};
                                        border-radius: 50%;
                                        border: 2px solid white;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    "></span>`
                                ).join('')}
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; color: var(--theme-primary);">
                                <i class="fas fa-hashtag"></i>
                            </div>
                            <div style="font-size: 0.9rem;">हैशटैग</div>
                            <div style="margin-top: 5px;">
                                ${this.currentTheme.hashtags.slice(0, 2).map(tag => 
                                    `<div style="font-size: 0.8rem; color: #666;">${tag}</div>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button onclick="themeManager.shareOnWhatsApp()" style="
                            flex: 1;
                            padding: 12px;
                            background: #25D366;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            font-weight: bold;
                        ">
                            <i class="fab fa-whatsapp"></i> शेयर करें
                        </button>
                        
                        <button onclick="themeManager.closeFestivalModal()" style="
                            flex: 1;
                            padding: 12px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            font-weight: bold;
                        ">
                            <i class="fas fa-times"></i> बंद करें
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            .festival-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .festival-modal-content {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 500px;
                animation: slideUp 0.4s ease;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(50px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        
        document.head.appendChild(modalStyles);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFestivalModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFestivalModal();
            }
        });
    }

    closeFestivalModal() {
        const modal = document.getElementById('festivalModal');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'festival-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--theme-primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    shareOnWhatsApp() {
        const text = `${this.currentTheme.shareText}\n\n${window.location.href}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    shareOnFacebook() {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
    }

    shareOnTwitter() {
        const text = `${this.currentTheme.shareText}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
    }

    shareOnInstagram() {
        this.showToast('Instagram पर शेयर करने के लिए मैन्युअली कॉपी करें');
        const text = `${this.currentTheme.shareText}\n${window.location.href}`;
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
        });
    }

    downloadThemeImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, this.currentTheme.colors[0]);
        gradient.addColorStop(1, this.currentTheme.colors[1] || this.currentTheme.colors[0]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentTheme.name, canvas.width/2, 200);
        
        ctx.font = '40px Arial';
        ctx.fillText(this.currentTheme.englishName, canvas.width/2, 260);
        
        ctx.font = '30px Arial';
        ctx.fillText('बाल भारती कोचिंग सेंटर, मधुबनी', canvas.width/2, 350);
        
        ctx.font = '25px Arial';
        ctx.fillText(this.currentTheme.message, canvas.width/2, 420);
        
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${this.currentTheme.theme}-greeting.png`;
        link.href = dataURL;
        link.click();
        
        this.showToast('इमेज डाउनलोड हो रही है...');
    }

    shouldShowBanner() {
        if (!this.currentTheme) return false;
        
        const hideBanner = localStorage.getItem('hideFestivalBanner');
        if (hideBanner === 'true') return false;
        
        const lastClosed = localStorage.getItem('festivalBannerLastClosed');
        if (lastClosed) {
            const lastClosedDate = new Date(lastClosed);
            const today = new Date();
            if (lastClosedDate.toDateString() === today.toDateString()) {
                return false;
            }
        }
        
        return true;
    }

    saveBannerState(visible) {
        this.isFestivalBannerVisible = visible;
        if (!visible) {
            localStorage.setItem('festivalBannerLastClosed', new Date().toISOString());
        }
    }
}

// Initialize Theme Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    themeManager.init();
    
    // Add theme toggle button to header if needed
    setTimeout(() => {
        const header = document.querySelector('.main-header');
        if (header && themeManager.currentTheme) {
            const themeToggle = document.createElement('button');
            themeToggle.className = 'theme-toggle-btn';
            themeToggle.innerHTML = `<i class="fas fa-theater-masks"></i>`;
            themeToggle.title = 'फेस्टिवल थीम';
            themeToggle.style.cssText = `
                background: var(--theme-primary);
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 10px;
            `;
            themeToggle.addEventListener('click', () => {
                themeManager.playFestiveSound();
                setTimeout(() => {
                    themeManager.showFestivalModal();
                }, 300);
            });
            
            const headerActions = header.querySelector('.header-actions, .nav-right, [class*="action"]');
            if (headerActions) {
                headerActions.appendChild(themeToggle);
            } else {
                header.appendChild(themeToggle);
            }
        }
    }, 2000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
