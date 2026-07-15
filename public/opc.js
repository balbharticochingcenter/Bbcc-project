// ============================================
// OPC.JS - Partner Coaching Centers + PDF Notes Module
// ============================================

// ❌ REMOVE THIS LINE - Already declared in index.html
// const API_BASE = window.location.origin + '/api';

let partnerCenters = [];

// ============================================
// FETCH PARTNER CENTERS FROM SERVER
// ============================================
async function fetchPartnerCenters() {
    try {
        const res = await fetch(`${API_BASE}/tuition-centers`);
        const result = await res.json();
        if (result.success && result.data && result.data.length > 0) {
            partnerCenters = result.data;
            renderPartnerCenters();
        } else {
            partnerCenters = [];
            renderPartnerCenters();
        }
    } catch (err) {
        console.error('❌ Partner centers fetch failed:', err);
        partnerCenters = [];
        renderPartnerCenters();
    }
}

// ============================================
// RENDER PARTNER CENTERS CARDS
// ============================================
function renderPartnerCenters() {
    const track = document.getElementById('partnerTrack');
    if (!track) return;

    if (!partnerCenters || partnerCenters.length === 0) {
        track.innerHTML = `
            <div class="partner-card" style="min-width:100%;max-width:100%;">
                <div style="padding:40px;text-align:center;color:rgba(255,255,255,0.3);">
                    <i class="fas fa-building" style="font-size:48px;display:block;margin-bottom:15px;"></i>
                    No partner coaching centers available
                </div>
            </div>
        `;
        return;
    }

    const items = [...partnerCenters, ...partnerCenters];
    let html = '';

    for (let i = 0; i < items.length; i++) {
        const c = items[i];
        const initials = c.centerName.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').slice(0, 4).toUpperCase();
        
        const dirInitials = c.directorName ? c.directorName.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'D';
        const teacherCount = c.teachers ? c.teachers.length : 0;

        // Class with "see more" button
        let classHtml = '';
        const classes = `${c.fromClass || 'N/A'} - ${c.toClass || 'N/A'}`;
        if (classes.length > 30) {
            classHtml = `
                <div class="center-classes">
                    ${classes.slice(0, 28)}<span class="more-classes" onclick="event.stopPropagation();alert('Full classes: ${classes}')">...see more</span>
                </div>
            `;
        } else {
            classHtml = `<div class="center-classes">${classes}</div>`;
        }

        let socialHtml = '';
        const socialLinks = [];

        if (c.whatsappNumber && c.whatsappNumber.trim() !== '') {
            socialLinks.push({ icon: 'fa-whatsapp', url: `https://wa.me/${c.whatsappNumber.replace(/\D/g, '')}`, title: 'WhatsApp' });
        }
        if (c.youtubeLink && c.youtubeLink.trim() !== '' && c.youtubeLink.trim() !== '#') {
            socialLinks.push({ icon: 'fa-youtube', url: c.youtubeLink, title: 'YouTube' });
        }
        if (c.facebookLink && c.facebookLink.trim() !== '' && c.facebookLink.trim() !== '#') {
            socialLinks.push({ icon: 'fa-facebook', url: c.facebookLink, title: 'Facebook' });
        }
        if (c.instagramLink && c.instagramLink.trim() !== '' && c.instagramLink.trim() !== '#') {
            socialLinks.push({ icon: 'fa-instagram', url: c.instagramLink, title: 'Instagram' });
        }
        if (c.telegramLink && c.telegramLink.trim() !== '' && c.telegramLink.trim() !== '#') {
            socialLinks.push({ icon: 'fa-telegram', url: c.telegramLink, title: 'Telegram' });
        }
        if (c.twitterLink && c.twitterLink.trim() !== '' && c.twitterLink.trim() !== '#') {
            socialLinks.push({ icon: 'fa-twitter', url: c.twitterLink, title: 'Twitter' });
        }
        if (c.linkedinLink && c.linkedinLink.trim() !== '' && c.linkedinLink.trim() !== '#') {
            socialLinks.push({ icon: 'fa-linkedin', url: c.linkedinLink, title: 'LinkedIn' });
        }
        if (c.encryptedCallLink && c.encryptedCallLink.trim() !== '' && c.encryptedCallLink.trim() !== '#') {
            socialLinks.push({ icon: 'fa-lock', url: c.encryptedCallLink, title: 'Encrypted Call', isEncrypted: true });
        }

        for (const link of socialLinks) {
            const isEncrypted = link.isEncrypted || false;
            socialHtml += `
                <a href="${link.url}" target="_blank" title="${link.title}" 
                   style="${isEncrypted ? 'background:rgba(37,99,235,0.1);border-color:rgba(37,99,235,0.2);color:#2563eb;' : ''}">
                    <i class="fas ${link.icon}"></i>
                </a>
            `;
        }

        let teachersHtml = '';
        if (c.teachers && c.teachers.length > 0) {
            const displayTeachers = c.teachers.slice(0, 5);
            for (const teacher of displayTeachers) {
                const tInitials = teacher.name ? teacher.name.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'T';
                teachersHtml += `
                    <div class="teacher-tag">
                        <div class="tag-avatar">
                            ${teacher.photo && teacher.photo.length > 50 ? 
                                `<img src="${teacher.photo}" alt="${teacher.name}">` : 
                                `<span>${tInitials}</span>`
                            }
                        </div>
                        <div class="tag-info">
                            <span class="tag-name">${teacher.name || 'Teacher'}</span>
                            <span class="tag-subject">${teacher.subject || ''} ${teacher.class ? '• ' + teacher.class : ''}</span>
                        </div>
                    </div>
                `;
            }
            if (c.teachers.length > 5) {
                teachersHtml += `<span style="font-size:12px;color:rgba(255,255,255,0.2);padding:6px 12px;">+${c.teachers.length - 5} more</span>`;
            }
        } else {
            teachersHtml = `<span class="no-teachers">No teachers listed</span>`;
        }

        let directorContactHtml = '';
        if (c.encryptedCallLink && c.encryptedCallLink.trim() !== '' && c.encryptedCallLink.trim() !== '#') {
            directorContactHtml = `
                <a href="${c.encryptedCallLink}" target="_blank" class="encrypted-call-btn">
                    <i class="fas fa-lock"></i> Encrypted Call
                </a>
            `;
        } else if (c.contactNumber && c.contactNumber.trim() !== '') {
            directorContactHtml = `
                <div class="director-contact"><i class="fas fa-phone"></i> ${c.contactNumber}</div>
            `;
        }

        html += `
            <div class="partner-card">
                <div class="partner-card-header">
                    <div class="center-logo">
                        ${c.clogo && c.clogo.length > 50 ? 
                            `<img src="${c.clogo}" alt="${c.centerName}">` : 
                            `<span>${initials}</span>`
                        }
                    </div>
                    <div class="center-info">
                        <div class="center-name">${c.centerName}</div>
                        ${classHtml}
                        ${c.address ? `<div class="center-address">📍 ${c.address}</div>` : ''}
                    </div>
                </div>

                <div class="director-section">
                    <div class="director-avatar">
                        ${c.directorPhoto && c.directorPhoto.length > 50 ? 
                            `<img src="${c.directorPhoto}" alt="${c.directorName || 'Director'}">` : 
                            `<span>${dirInitials}</span>`
                        }
                    </div>
                    <div class="director-details">
                        <div class="director-label">👤 Director</div>
                        <div class="director-name">${c.directorName || 'Not specified'}</div>
                        ${directorContactHtml}
                    </div>
                </div>

                <div class="teachers-list">
                    <div class="teachers-label">
                        <i class="fas fa-chalkboard-teacher"></i>
                        Teachers (${teacherCount})
                    </div>
                    <div class="teacher-tags">
                        ${teachersHtml}
                    </div>
                </div>

                ${socialHtml ? `<div class="card-social">${socialHtml}</div>` : ''}
            </div>
        `;
    }

    track.innerHTML = html;
    track.style.animation = 'scrollPartners 40s linear infinite';
    
    // Setup drag events
    setupDragEvents(track);
}

// ============================================
// DRAG EVENTS FOR PARTNER CARDS
// ============================================
function setupDragEvents(track) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    track.addEventListener('mousedown', (e) => {
        isDown = true;
        track.style.animationPlayState = 'paused';
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft || 0;
        track.style.cursor = 'grabbing';
    });

    track.addEventListener('mouseleave', () => {
        isDown = false;
        track.style.animationPlayState = 'running';
        track.style.cursor = 'grab';
    });

    track.addEventListener('mouseup', () => {
        isDown = false;
        track.style.animationPlayState = 'running';
        track.style.cursor = 'grab';
    });

    track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 0.8;
        const currentTransform = window.getComputedStyle(track).transform;
        let matrix = currentTransform.match(/matrix.*\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(', ');
            const currentX = parseFloat(values[4]) || 0;
            const newX = currentX + walk;
            track.style.transform = `translateX(${newX}px)`;
        }
        startX = x;
    });

    // Touch events
    track.addEventListener('touchstart', (e) => {
        isDown = true;
        track.style.animationPlayState = 'paused';
        startX = e.touches[0].pageX - track.offsetLeft;
        const currentTransform = window.getComputedStyle(track).transform;
        let matrix = currentTransform.match(/matrix.*\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(', ');
            scrollLeft = parseFloat(values[4]) || 0;
        }
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - track.offsetLeft;
        const walk = (x - startX) * 0.8;
        const newX = scrollLeft + walk;
        track.style.transform = `translateX(${newX}px)`;
    }, { passive: true });

    track.addEventListener('touchend', () => {
        isDown = false;
        track.style.animationPlayState = 'running';
    }, { passive: true });
}

// ============================================
// FETCH PDF NOTES FROM SERVER
// ============================================
async function fetchPDFNotes() {
    try {
        const res = await fetch(`${API_BASE}/study-material`);
        const result = await res.json();
        if (result.success && result.data && result.data.notes && result.data.notes.length > 0) {
            renderPDFNotes(result.data.notes);
        } else {
            renderPDFNotes([]);
        }
    } catch (err) {
        console.error('❌ PDF Notes fetch failed:', err);
        renderPDFNotes([]);
    }
}

// ============================================
// RENDER PDF NOTES
// ============================================
function renderPDFNotes(notes) {
    const container = document.getElementById('pdfNotesContainer');
    if (!container) return;

    if (!notes || notes.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.3);">
                <i class="fas fa-file-pdf" style="font-size:48px; display:block; margin-bottom:15px; color:rgba(255,255,255,0.1);"></i>
                No PDF notes available
            </div>
        `;
        return;
    }

    let html = '';
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        html += `
            <div class="note-card">
                <a href="${note.pdf}" download="${note.title || 'note'}.pdf" target="_blank">
                    <i class="fas fa-file-pdf"></i>
                    <h3>${note.title || 'Untitled'}</h3>
                    ${note.description ? `<p>${note.description}</p>` : ''}
                    <span class="download-btn">📥 Download PDF</span>
                    <div style="font-size:11px; color:rgba(255,255,255,0.2); margin-top:8px;">
                        ${note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
                    </div>
                </a>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ============================================
// AUTO INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const partnerSection = document.getElementById('partnerSection');
    if (partnerSection) {
        fetchPartnerCenters();
    }
    
    const pdfSection = document.getElementById('pdfNotesSection');
    if (pdfSection) {
        fetchPDFNotes();
    }
});
