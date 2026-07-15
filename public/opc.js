/* ===== VIEW DETAILS BUTTON ===== */
.view-details-btn {
    padding: 8px 20px;
    background: rgba(255, 215, 0, 0.08);
    border: 1px solid rgba(255, 215, 0, 0.15);
    border-radius: 25px;
    color: #ffd700;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
}

.view-details-btn:hover {
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateY(-2px);
}

/* ===== POPUP SOCIAL LINKS ===== */
.popup-social-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 25px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.popup-social-link:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
}

/* ===== POPUP TEACHER ITEMS ===== */
.popup-teacher-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 15px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.03);
    transition: all 0.3s ease;
}

.popup-teacher-item:hover {
    background: rgba(255, 215, 0, 0.03);
    border-color: rgba(255, 215, 0, 0.08);
}

.popup-teacher-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: #1a1f35;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: #ffd700;
    border: 2px solid rgba(255, 215, 0, 0.1);
}

.popup-teacher-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.popup-teacher-avatar span {
    font-size: 20px;
    font-weight: 700;
    color: #ffd700;
}

.popup-teacher-info {
    flex: 1;
}

.popup-teacher-name {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
}

.popup-teacher-detail {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
}

/* ===== MODAL ANIMATION ===== */
@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* ===== SCROLLBAR STYLING ===== */
.center-details-content::-webkit-scrollbar {
    width: 6px;
}

.center-details-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
}

.center-details-content::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.2);
    border-radius: 10px;
}

.center-details-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 215, 0, 0.3);
}
