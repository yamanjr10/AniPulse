// ============================================
// AVATAR SYSTEM – Base64 to Firestore + Crop
// ============================================

(function () {
    'use strict';

    let cropper = null;
    let cropResolve = null;
    let cropReject = null;
    let cropWidth = 200;
    let cropHeight = 200;

    // ---- Compress image (from file) ----
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
                    let width = img.width,
                        height = img.height;
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

    // ---- Generate default avatar ----
    window.generateDefaultAvatar = function (username) {
        const colors = ['6366F1', '8B5CF6', 'EC4899', 'F43F5E', 'EF4444', 'F97316', 'F59E0B', '10B981', '14B8A6', '06B6D4', '3B82F6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const encodedName = encodeURIComponent(username || 'User');
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${randomColor}&color=fff&bold=true&length=2&size=200&rounded=true`;
    };

    // ---- Update all avatars ----
    window.updateAllAvatars = function (avatarUrl) {
        const avatars = document.querySelectorAll('.user-avatar, .sidebar-avatar, .profile-preview-avatar, #avatarPreview, .profile-modal-avatar, .leaderboard-avatar, .friend-avatar, .friend-request-avatar, .search-result-avatar');
        avatars.forEach(img => { if (img) img.src = avatarUrl; });
    };

    // ---- Save avatar to cloud ----
    async function saveAvatarToCloud(avatarDataUrl) {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Not logged in');

        const response = await fetch(`${window.API_BASE_URL}/api/upload/avatar`, {
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

        const data = await response.json();
        return data.avatarUrl;
    }

    // ---- Crop helper (modal) – IMPROVED VERSION ----
    function openCropModal(imageUrl, aspectRatio, outWidth = 200, outHeight = 200) {
        return new Promise((resolve, reject) => {
            const modal = document.getElementById('cropModal');
            if (!modal) {
                reject(new Error('Crop modal not found in DOM'));
                return;
            }
            const img = document.getElementById('cropImage');
            if (!img) {
                reject(new Error('Crop image element not found'));
                return;
            }
            img.src = imageUrl;

            // Store output dimensions
            cropWidth = outWidth;
            cropHeight = outHeight;

            // Show modal
            if (typeof window.openModal === 'function') {
                window.openModal(modal);
            } else {
                modal.style.display = 'flex';
                modal.removeAttribute('hidden');
            }

            // Use requestAnimationFrame to ensure the modal is rendered
            requestAnimationFrame(() => {
                img.onload = function () {
                    if (cropper) cropper.destroy();

                    // Get the natural dimensions of the image
                    const naturalWidth = img.naturalWidth;
                    const naturalHeight = img.naturalHeight;

                    cropper = new Cropper(img, {
                        aspectRatio: aspectRatio,
                        viewMode: 2,               // allow pan and zoom freely
                        dragMode: 'move',
                        autoCropArea: 1,           // crop box covers the full image initially
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: true,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                        zoomable: true,
                        zoomOnTouch: true,
                        zoomOnWheel: true,
                        minCropBoxWidth: 50,
                        minCropBoxHeight: 50,
                        // Set initial crop box to cover the entire image
                        ready: function () {
                            this.setCropBoxData({
                                left: 0,
                                top: 0,
                                width: naturalWidth,
                                height: naturalHeight
                            });
                        }
                    });

                    cropResolve = resolve;
                    cropReject = reject;
                };
                img.onerror = function () {
                    reject(new Error('Failed to load image'));
                    closeCropModal();
                };
                // If image is already cached, onload may have already fired
                if (img.complete) {
                    img.onload();
                }
            });

            // Button handlers – remove old listeners and attach new ones
            const closeBtn = document.getElementById('cropCloseBtn');
            const cancelBtn = document.getElementById('cropCancelBtn');
            const confirmBtn = document.getElementById('cropConfirmBtn');

            // Clone and replace to remove all previous listeners
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', closeCropModal);

            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', closeCropModal);

            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            newConfirmBtn.addEventListener('click', confirmCrop);
        });
    }

    // ---- Close crop modal ----
    function closeCropModal() {
        if (cropReject) cropReject(new Error('Cancelled'));
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        const modal = document.getElementById('cropModal');
        if (typeof window.closeModal === 'function') {
            window.closeModal(modal);
        } else if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('hidden', '');
        }
        cropResolve = null;
        cropReject = null;
    }

    // ---- Confirm crop ----
    async function confirmCrop() {
        if (!cropper) return;
        try {
            const canvas = cropper.getCroppedCanvas({
                width: cropWidth,
                height: cropHeight,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            cropResolve(dataUrl);
            closeCropModal();
        } catch (error) {
            cropReject(error);
        }
    }

    // ---- Compress from data URL ----
    async function compressImageFromDataUrl(dataUrl, maxSizeKB = 500, maxWidth = 200, maxHeight = 200) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width,
                    height = img.height;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                let quality = 0.8;
                let dataUrl2 = canvas.toDataURL('image/jpeg', quality);
                let attempts = 0;
                while (dataUrl2.length > maxSizeKB * 1024 && quality > 0.3 && attempts < 10) {
                    quality -= 0.1;
                    dataUrl2 = canvas.toDataURL('image/jpeg', quality);
                    attempts++;
                }
                const finalSizeKB = Math.round(dataUrl2.length / 1024);
                console.log(`📸 Cropped image compressed: ${finalSizeKB}KB`);
                if (dataUrl2.length > maxSizeKB * 1024) {
                    reject(new Error(`Image still too large (${finalSizeKB}KB). Try a smaller image.`));
                } else {
                    resolve(dataUrl2);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }

    // ---- Upload custom avatar with crop ----
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

        try {
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Avatar: square aspect ratio, 200x200
            const croppedDataUrl = await openCropModal(dataUrl, 1, 200, 200);
            const compressedDataUrl = await compressImageFromDataUrl(croppedDataUrl, 500, 200, 200);
            const avatarUrl = await saveAvatarToCloud(compressedDataUrl);

            window.updateAllAvatars(avatarUrl);

            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            userProfile.avatar = avatarUrl;
            userProfile.customAvatar = true;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));

            if (typeof showToast === 'function') showToast('Avatar saved!', 'success');
            if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo();
            if (window.dualStorage) window.dualStorage.syncToCloud();
            return true;
        } catch (error) {
            if (error.message !== 'Cancelled') {
                console.error('Avatar upload failed:', error);
                if (typeof showToast === 'function') showToast(error.message || 'Failed to process image', 'error');
            }
            return false;
        }
    };

    // ---- Reset to default avatar ----
    window.resetToDefaultAvatar = async function () {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const username = userProfile.name || user.username || 'User';
        const defaultAvatar = window.generateDefaultAvatar(username);

        try {
            const avatarUrl = await saveAvatarToCloud(defaultAvatar);
            userProfile.avatar = avatarUrl;
            userProfile.customAvatar = false;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            window.updateAllAvatars(avatarUrl);
            if (typeof showToast === 'function') showToast('Avatar reset to default', 'success');
            if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo();
            if (window.dualStorage) window.dualStorage.syncToCloud();
        } catch (error) {
            console.error('Reset avatar failed:', error);
            if (typeof showToast === 'function') showToast('Failed to reset avatar', 'error');
        }
    };

    // ---- Load avatar from cloud ----
    async function loadAvatarFromCloud() {
        const token = localStorage.getItem('authToken');
        if (!token) { loadAvatarFromLocal(); return; }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.uid;
            if (!userId) { loadAvatarFromLocal(); return; }
            const response = await fetch(`${window.API_BASE_URL}/api/upload/avatar/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.avatarUrl) {
                    window.updateAllAvatars(data.avatarUrl);
                    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    userProfile.avatar = data.avatarUrl;
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
        if (userProfile.avatar) {
            window.updateAllAvatars(userProfile.avatar);
        } else {
            const defaultAvatar = window.generateDefaultAvatar(username);
            userProfile.avatar = defaultAvatar;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            window.updateAllAvatars(defaultAvatar);
        }
    }

    // ---- Init avatar system ----
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
                if (file) await window.uploadCustomAvatar(file);
                newInput.value = '';
            });
        }

        if (resetAvatarBtn) {
            const newBtn = resetAvatarBtn.cloneNode(true);
            resetAvatarBtn.parentNode.replaceChild(newBtn, resetAvatarBtn);
            newBtn.addEventListener('click', window.resetToDefaultAvatar);
        }

        console.log('✅ Avatar system initialized (Firestore storage + crop)');
    }

    // ---- Expose public API ----
    window.initAvatarSystem = initAvatarSystem;
    window.openCropModal = openCropModal;                  // for settings.js (cover crop)
    window.compressImageFromDataUrl = compressImageFromDataUrl; // for settings.js

})();