// ============================================
// AVATAR SYSTEM (Upload, Compress, Sync)
// ============================================

(function () {
    'use strict';

    // --- Compress image ---
    async function compressImage(file, maxSizeKB = 500, maxWidth = 200, maxHeight = 200) {
        return new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('Image too large! Maximum 5MB before compression'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width, height = img.height;
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    let quality = 0.8;
                    let dataUrl = canvas.toDataURL('image/jpeg', quality);
                    let attempts = 0;
                    while (dataUrl.length > maxSizeKB * 1024 && quality > 0.3 && attempts < 10) {
                        quality -= 0.1;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                        attempts++;
                    }
                    const finalSizeKB = Math.round(dataUrl.length / 1024);
                    console.log(`📸 Image compressed: ${finalSizeKB}KB`);
                    if (dataUrl.length > maxSizeKB * 1024) {
                        reject(new Error(`Image still too large (${finalSizeKB}KB). Try a smaller image.`));
                    } else {
                        resolve(dataUrl);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = event.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // --- Generate default avatar ---
    window.generateDefaultAvatar = function (username) {
        const colors = ['6366F1', '8B5CF6', 'EC4899', 'F43F5E', 'EF4444', 'F97316', 'F59E0B', '10B981', '14B8A6', '06B6D4', '3B82F6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const encodedName = encodeURIComponent(username || 'User');
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${randomColor}&color=fff&bold=true&length=2&size=200&rounded=true`;
    };

    // --- Update all avatars ---
    window.updateAllAvatars = function (avatarUrl) {
        const avatars = document.querySelectorAll('.user-avatar, .sidebar-avatar, .profile-preview-avatar, #avatarPreview, .profile-modal-avatar, .leaderboard-avatar, .friend-avatar, .friend-request-avatar, .search-result-avatar');
        avatars.forEach(img => { if (img) img.src = avatarUrl; });
    };

    // --- Save avatar to cloud ---
    async function saveAvatarToCloud(avatarDataUrl) {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Not logged in');
        const sizeKB = Math.round(avatarDataUrl.length / 1024);
        console.log(`📤 Uploading avatar (${sizeKB}KB) to cloud...`);
        const response = await fetch('http://localhost:3000/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ avatar: avatarDataUrl })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        return await response.json();
    }

    // --- Upload custom avatar ---
    window.uploadCustomAvatar = async function (file) {
        if (!file) return false;
        if (file.size > 5 * 1024 * 1024) {
            if (typeof showToast === 'function') showToast('Image too large! Maximum 5MB', 'error');
            return false;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            if (typeof showToast === 'function') showToast('Please select an image file (JPEG, PNG, GIF, WebP)', 'error');
            return false;
        }
        if (typeof showToast === 'function') showToast('Processing image...', 'info');
        try {
            const compressedDataUrl = await compressImage(file, 500, 200, 200);
            const finalSizeKB = Math.round(compressedDataUrl.length / 1024);
            window.updateAllAvatars(compressedDataUrl);
            await saveAvatarToCloud(compressedDataUrl);
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            userProfile.avatar = compressedDataUrl;
            userProfile.customAvatar = true;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            if (typeof showToast === 'function') showToast(`Avatar saved! (${finalSizeKB}KB)`, 'success');
            if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo();
            if (window.dualStorage) window.dualStorage.syncToCloud();
            return true;
        } catch (error) {
            console.error('Avatar upload failed:', error);
            if (typeof showToast === 'function') showToast(error.message || 'Failed to process image', 'error');
            return false;
        }
    };

    // --- Reset to default avatar ---
    window.resetToDefaultAvatar = async function () {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const username = userProfile.name || user.username || 'User';
        const defaultAvatar = window.generateDefaultAvatar(username);
        try {
            await saveAvatarToCloud(defaultAvatar);
            userProfile.avatar = defaultAvatar;
            userProfile.customAvatar = false;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            window.updateAllAvatars(defaultAvatar);
            if (typeof showToast === 'function') showToast('Avatar reset to default', 'success');
            if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo();
            if (window.dualStorage) window.dualStorage.syncToCloud();
        } catch (error) {
            console.error('Reset avatar failed:', error);
            if (typeof showToast === 'function') showToast('Failed to reset avatar', 'error');
        }
    };

    // --- Load avatar from cloud ---
    async function loadAvatarFromCloud() {
        const token = localStorage.getItem('authToken');
        if (!token) { loadAvatarFromLocal(); return; }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.uid;
            if (!userId) { loadAvatarFromLocal(); return; }
            const response = await fetch(`http://localhost:3000/api/user/avatar/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.avatar) {
                    window.updateAllAvatars(data.avatar);
                    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    userProfile.avatar = data.avatar;
                    userProfile.customAvatar = data.hasCustom;
                    localStorage.setItem('userProfile', JSON.stringify(userProfile));
                    return;
                }
            }
            loadAvatarFromLocal();
        } catch (error) {
            console.error('Failed to load avatar from cloud:', error);
            loadAvatarFromLocal();
        }
    }

    function loadAvatarFromLocal() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const username = userProfile.name || user.username || 'User';
        if (userProfile.avatar && userProfile.avatar.startsWith('data:image')) {
            window.updateAllAvatars(userProfile.avatar);
        } else if (userProfile.avatar && userProfile.avatar.startsWith('http')) {
            window.updateAllAvatars(userProfile.avatar);
        } else {
            const defaultAvatar = window.generateDefaultAvatar(username);
            userProfile.avatar = defaultAvatar;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            window.updateAllAvatars(defaultAvatar);
        }
    }

    // --- Init avatar system ---
    function initAvatarSystem() {
        const avatarInput = document.getElementById('avatarInput');
        const resetAvatarBtn = document.getElementById('resetAvatar');
        const usernameInput = document.getElementById('usernameInput');

        loadAvatarFromCloud();

        if (avatarInput) {
            const newInput = avatarInput.cloneNode(true);
            avatarInput.parentNode.replaceChild(newInput, avatarInput);
            newInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => { window.updateAllAvatars(event.target.result); };
                    reader.readAsDataURL(file);
                    await window.uploadCustomAvatar(file);
                }
                newInput.value = '';
            });
        }

        if (resetAvatarBtn) {
            const newBtn = resetAvatarBtn.cloneNode(true);
            resetAvatarBtn.parentNode.replaceChild(newBtn, resetAvatarBtn);
            newBtn.addEventListener('click', window.resetToDefaultAvatar);
        }

        if (usernameInput) {
            usernameInput.addEventListener('change', async () => {
                const newName = usernameInput.value.trim();
                if (newName) {
                    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    userProfile.name = newName;
                    if (!userProfile.avatar || (!userProfile.avatar.startsWith('data:image') && userProfile.avatar.includes('ui-avatars.com'))) {
                        const newAvatar = window.generateDefaultAvatar(newName);
                        userProfile.avatar = newAvatar;
                        window.updateAllAvatars(newAvatar);
                        if (localStorage.getItem('authToken')) {
                            await saveAvatarToCloud(newAvatar);
                        }
                    }
                    localStorage.setItem('userProfile', JSON.stringify(userProfile));
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    user.username = newName;
                    user.name = newName;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            });
        }

        console.log('✅ Avatar system initialized');
    }

    window.initAvatarSystem = initAvatarSystem;
})();