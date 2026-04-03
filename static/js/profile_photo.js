/* ═══════════════════════════════════════════
   PROFILE PHOTO HANDLER v1.0
   Upload, preview, persist in localStorage
   ═══════════════════════════════════════════ */

const PHOTO_KEY = 'fasalai_profile_photo';

/**
 * Handle photo file input change
 */
function handleProfilePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
        if (typeof showToast === 'function') showToast('Please select an image file', 'error');
        return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        if (typeof showToast === 'function') showToast('Image must be under 2MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        applyProfilePhoto(dataUrl);
        // Persist in localStorage
        try {
            localStorage.setItem(PHOTO_KEY, dataUrl);
        } catch (err) {
            console.warn('Could not save photo to localStorage:', err);
        }
        if (typeof showToast === 'function') showToast('Profile photo updated!', 'success');
    };
    reader.readAsDataURL(file);
}

/**
 * Apply photo to all profile photo elements
 */
function applyProfilePhoto(dataUrl) {
    const img = document.getElementById('profile-photo-img');
    const placeholder = document.getElementById('profile-photo-placeholder');

    // Update Profile Section
    if (img) {
        img.src = dataUrl;
        img.style.display = 'block';
    }
    if (placeholder) {
        placeholder.style.display = dataUrl ? 'none' : 'flex';
    }

    // Update Dashboard Nav Avatar & Hide Default Icon
    const navAvatar = document.getElementById('nav-profile-avatar');
    const navIcon = document.getElementById('nav-profile-icon');
    
    if (navAvatar && dataUrl) {
        navAvatar.src = dataUrl;
        navAvatar.style.display = 'block';
        if (navIcon) navIcon.style.display = 'none';
    } else {
        if (navAvatar) navAvatar.style.display = 'none';
        if (navIcon) navIcon.style.display = 'block';
    }

    // Update the chat avatar if shown
    const chatAvatar = document.getElementById('chat-user-avatar');
    if (chatAvatar && dataUrl) {
        chatAvatar.src = dataUrl;
    }
}

/**
 * Load saved photo on page load
 */
function loadSavedProfilePhoto() {
    try {
        const saved = localStorage.getItem(PHOTO_KEY);
        if (saved) {
            applyProfilePhoto(saved);
        }
    } catch (e) {
        console.warn('Could not load saved photo:', e);
    }
}

// Auto-load on DOM ready
document.addEventListener('DOMContentLoaded', loadSavedProfilePhoto);

// Also load when profile tab is shown (in case of SPA navigation)
document.addEventListener('click', (e) => {
    if (e.target && (
        e.target.closest('[onclick*="profile"]') ||
        e.target.id === 'nav-profile-btn'
    )) {
        setTimeout(loadSavedProfilePhoto, 100);
    }
});