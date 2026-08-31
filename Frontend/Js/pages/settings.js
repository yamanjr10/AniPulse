// ============================================
// SETTINGS PAGE – Full Profile + Crop + Cloud Sync
// ============================================

(function () {
    'use strict';

    // ============================================
    // QUEUE STATUS UI
    // ============================================
    window.updateQueueStatusUI = function () {
        const queuedXPEl = document.getElementById('queuedXPAmount');
        if (!queuedXPEl) return;

        const queue = JSON.parse(localStorage.getItem('xpPendingQueue') || '[]');
        const totalQueuedXP = queue.reduce((sum, item) => sum + (item.xp || 0), 0);
        const queueCount = queue.length;

        const today = new Date().toDateString();
        const dailyXPKey = `dailyXP_${today}`;
        const todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');

        let maxDailyXP = 5000;
        if (window.AniPulseLevelSystem && window.AniPulseLevelSystem.MAX_DAILY_XP) {
            maxDailyXP = window.AniPulseLevelSystem.MAX_DAILY_XP;
        } else if (typeof MAX_DAILY_XP !== 'undefined') {
            maxDailyXP = MAX_DAILY_XP;
        }

        const queuedCountEl = document.getElementById('queuedItemsCount');
        const todayXPEl = document.getElementById('todayXPAmount');
        const dailyLimitEl = document.getElementById('dailyLimit');
        const queueFillEl = document.getElementById('queueProgressFill');
        const queuePercentEl = document.getElementById('queuePercent');
        const queueMessageEl = document.getElementById('queueMessage');

        if (queuedXPEl) {
            const old = parseInt(queuedXPEl.textContent);
            queuedXPEl.textContent = totalQueuedXP.toLocaleString();
            if (old !== totalQueuedXP && totalQueuedXP > 0) {
                queuedXPEl.classList.add('updated');
                setTimeout(() => queuedXPEl.classList.remove('updated'), 400);
            }
        }
        if (queuedCountEl) queuedCountEl.textContent = queueCount;
        if (todayXPEl) todayXPEl.textContent = todayXP;
        if (dailyLimitEl) dailyLimitEl.textContent = maxDailyXP.toLocaleString();

        const dailyPercent = Math.min(100, (todayXP / maxDailyXP) * 100);
        if (queueFillEl) queueFillEl.style.width = dailyPercent + '%';
        if (queuePercentEl) queuePercentEl.textContent = Math.floor(dailyPercent) + '%';

        if (queueMessageEl) {
            if (queueCount > 0) {
                queueMessageEl.className = 'queue-message has-queue';
                queueMessageEl.innerHTML = `<i class="fas fa-clock"></i> ${queueCount} item(s) queued (${totalQueuedXP.toLocaleString()} XP total). Will be added when daily limit resets.`;
            } else {
                queueMessageEl.className = 'queue-message';
                queueMessageEl.innerHTML = `<i class="fas fa-check-circle"></i> No pending XP in queue`;
            }
        }
    };

    function initQueueStatusUI() {
        const queueCard = document.querySelector('.queue-status-card');
        if (!queueCard) return;
        window.updateQueueStatusUI();
        setInterval(() => {
            const settingsPage = document.getElementById('settings-page');
            if (settingsPage && settingsPage.classList.contains('active')) {
                window.updateQueueStatusUI();
            }
        }, 30000);
    }

    // ============================================
    // SYNC UI
    // ============================================
    window.initSyncUI = function () {
        const lastSyncSpan = document.getElementById('lastSyncTime');
        const lastSync = localStorage.getItem('lastCloudSyncTime');
        if (lastSync) lastSyncSpan.textContent = new Date(lastSync).toLocaleString();

        document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
            if (window.dualStorage) {
                await window.dualStorage.syncToCloud();
                const newSync = localStorage.getItem('lastCloudSyncTime');
                if (newSync) lastSyncSpan.textContent = new Date(newSync).toLocaleString();
            }
        });

        document.getElementById('loadFromCloudBtn')?.addEventListener('click', async () => {
            if (confirm('⚠️ This will replace your local data with cloud data. Continue?')) {
                const result = await window.dualStorage?.loadFromCloud();
                if (result?.success) location.reload();
            }
        });
    };

    // ============================================
    // SETTINGS TABS
    // ============================================
    function initSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const contents = document.querySelectorAll('.settings-tab-content');
        if (!tabs.length || !contents.length) return;

        const savedTab = localStorage.getItem('settingsActiveTab') || 'profile';
        tabs.forEach(tab => {
            const tabName = tab.dataset.tab;
            tab.classList.toggle('active', tabName === savedTab);
        });
        contents.forEach(content => {
            const contentId = content.id.replace('tab-', '');
            content.classList.toggle('active', contentId === savedTab);
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const tabName = this.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                contents.forEach(content => {
                    const contentId = content.id.replace('tab-', '');
                    content.classList.toggle('active', contentId === tabName);
                });
                localStorage.setItem('settingsActiveTab', tabName);
            });
        });
        console.log('✅ Settings tabs initialized');
    }

    // ============================================
    // UPDATE PREVIEW DETAILS (bio, status, fav tags, socials)
    // ============================================
    function updatePreviewDetails() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || {});
        const bio = document.getElementById('previewBio');
        const status = document.getElementById('previewStatus');
        const favContainer = document.getElementById('previewFavAnime');
        const socialsContainer = document.getElementById('previewSocials');

        if (bio) bio.textContent = userProfile.bio || '';
        if (status) {
            const statusText = userProfile.status || '';
            status.textContent = statusText;
            status.style.display = statusText ? 'inline-block' : 'none';
            // Set data-status for gradient variants
            const lower = statusText.toLowerCase();
            if (lower.includes('watch') || lower.includes('view')) {
                status.setAttribute('data-status', 'watching');
            } else if (lower.includes('read') || lower.includes('book')) {
                status.setAttribute('data-status', 'reading');
            } else if (lower.includes('game') || lower.includes('play')) {
                status.setAttribute('data-status', 'gaming');
            } else if (lower.includes('break') || lower.includes('rest')) {
                status.setAttribute('data-status', 'break');
            } else if (lower.includes('work') || lower.includes('study')) {
                status.setAttribute('data-status', 'working');
            } else {
                status.removeAttribute('data-status');
            }
        }

        // Favorite Anime tags
        if (favContainer) {
            favContainer.innerHTML = '';
            const favs = userProfile.favoriteAnime || [];
            const animeMap = window.animeData ? window.animeData.reduce((map, a) => { map[a.id] = a.title; return map; }, {}) : {};
            favs.forEach(id => {
                const title = animeMap[id] || 'Unknown';
                const tag = document.createElement('span');
                tag.className = 'fav-tag';
                tag.textContent = title;
                favContainer.appendChild(tag);
            });
        }

        // Social Links – ✅ FIXED ICON MAPPING
        if (socialsContainer) {
            socialsContainer.innerHTML = '';
            const social = userProfile.social || {};
            const icons = {
                anilist: 'fa-list-ul',       // Font Awesome free icon for lists
                myanimelist: 'fa-book',       // Book icon for MAL
                twitter: 'fa-twitter',        // X/Twitter brand icon
                instagram: 'fa-instagram'     // Instagram brand icon
            };
            Object.keys(social).forEach(key => {
                if (social[key]) {
                    const a = document.createElement('a');
                    a.href = `https://${key}.com/${social[key]}`;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    // Use 'fab' for brands (twitter, instagram) and 'fas' for regular icons
                    const iconClass = (key === 'twitter' || key === 'instagram')
                        ? `fab ${icons[key]}`
                        : `fas ${icons[key]}`;
                    a.innerHTML = `<i class="${iconClass}"></i>`;
                    socialsContainer.appendChild(a);
                }
            });
        }

        // 🔁 Update member since date in preview (if element exists)
        updateMemberSinceDisplay(userProfile);
    }

    // ============================================
    // PROFILE PREVIEW – updates avatar + cover image
    // ============================================
    function refreshProfilePreview() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || {});
        const name = userProfile.name || userProfile.username || 'User';
        const avatar = userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366F1&color=fff`;
        const previewName = document.getElementById('profilePreviewName');
        const previewAvatar = document.getElementById('profilePreviewAvatar');
        if (previewName) previewName.textContent = name;
        if (previewAvatar) previewAvatar.src = avatar;

        // Cover image (banner)
        const coverImg = document.getElementById('coverPreviewImage');
        if (coverImg) {
            if (userProfile.cover) {
                coverImg.src = userProfile.cover;
                coverImg.style.display = 'block';
            } else {
                coverImg.src = '';
                coverImg.style.display = 'none';
            }
        }

        // Also update the cover preview (in the settings item)
        const coverPreviewImg = document.getElementById('coverPreviewImg');
        const coverPreviewDiv = document.getElementById('coverPreview');
        const removeCoverBtn = document.getElementById('removeCoverBtn');
        if (coverPreviewImg && coverPreviewDiv) {
            if (userProfile.cover) {
                coverPreviewImg.src = userProfile.cover;
                coverPreviewDiv.style.display = 'block';
                if (removeCoverBtn) removeCoverBtn.style.display = 'inline-flex';
            } else {
                coverPreviewDiv.style.display = 'none';
                if (removeCoverBtn) removeCoverBtn.style.display = 'none';
            }
        }

        // Update details (bio, status, favs, socials)
        updatePreviewDetails();

        // Ensure member since is set and displayed
        ensureMemberSince();
    }

    // ============================================
    // MEMBER SINCE – dynamic and saved
    // ============================================
    function ensureMemberSince() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        // If no memberSince, set it to the current month/year
        if (!userProfile.memberSince) {
            const now = new Date();
            const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            userProfile.memberSince = monthYear;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            // Also sync to cloud if logged in
            if (window.dualStorage && window.dualStorage.isLoggedIn()) {
                window.dualStorage.syncToCloud();
            }
        }
        // Update the display
        updateMemberSinceDisplay(userProfile);
    }

    function updateMemberSinceDisplay(userProfile) {
        const memberSinceText = document.getElementById('memberSinceText');
        if (memberSinceText && userProfile.memberSince) {
            memberSinceText.textContent = userProfile.memberSince;
        }
    }

    // ============================================
    // EXPORT DATA
    // ============================================
    window.exportData = function () {
        const data = window.animeData || [];
        if (!data.length) {
            if (typeof showToast === 'function') showToast('No data to export.', 'error');
            return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'My Anime List.json';
        link.click();
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('Data exported successfully!', 'success');
    };

    // ============================================
    // PERSISTENT AUTO‑BACKUP
    // ============================================
    (function setupPersistentAutoBackup() {
        if (!('showSaveFilePicker' in window)) {
            console.warn('Auto-backup: File System Access API not supported in this browser.');
            const statusEl = document.getElementById('backupStatus');
            if (statusEl) {
                statusEl.textContent = '⚠️ Auto-backup requires Chrome/Edge (File System API).';
                statusEl.style.color = '#fbbf24';
            }
            return;
        }

        const DB_NAME = 'AnimeTrackerDB';
        const STORE_NAME = 'backupHandleStore';

        async function openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onupgradeneeded = () => {
                    request.result.createObjectStore(STORE_NAME);
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function saveHandle(handle) {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(handle, 'backupHandle');
            await tx.complete;
            db.close();
        }

        async function loadHandle() {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get('backupHandle');
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
                tx.oncomplete = () => db.close();
            });
        }

        let backupHandle = null;
        let saveTimeout = null;
        const SAVE_DELAY = 800;

        function updateBackupStatus(message, type = 'info') {
            const statusEl = document.getElementById('backupStatus');
            if (!statusEl) return;
            statusEl.textContent = message;
            statusEl.style.color =
                type === 'success' ? 'limegreen' :
                    type === 'error' ? '#ff6b6b' :
                        type === 'warning' ? '#fbbf24' : 'rgba(255,255,255,0.6)';
        }

        async function saveBackupToFile() {
            if (!backupHandle) return;
            try {
                const perm = await backupHandle.queryPermission({ mode: 'readwrite' });
                if (perm === 'denied') {
                    console.warn('Backup permission denied.');
                    backupHandle = null;
                    await deleteHandle();
                    if (typeof showToast === 'function') {
                        showToast('Backup permission denied. Re‑enable in Settings.', 'error');
                    }
                    return;
                }
                const writable = await backupHandle.createWritable();
                await writable.write(JSON.stringify(window.animeData || [], null, 2));
                await writable.close();
                updateBackupStatus(`✅ Auto-backup enabled and file selected.`, 'success');
            } catch (err) {
                console.error('❌ Backup save error:', err);
                if (err.name === 'NotFoundError') {
                    backupHandle = null;
                    await deleteHandle();
                    if (typeof showToast === 'function') {
                        showToast('Backup file lost. Re‑enable in Settings.', 'error');
                    }
                }
            }
        }

        function triggerBackupSave() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveBackupToFile, SAVE_DELAY);
        }

        async function enableBackup() {
            try {
                backupHandle = await window.showSaveFilePicker({
                    suggestedName: 'AniPulse_Backup.json',
                    types: [{
                        description: 'AniPulse JSON Backup',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                await saveHandle(backupHandle);
                updateBackupStatus('✅ Auto-backup enabled and file selected.', 'success');
                if (typeof showToast === 'function') {
                    showToast('Backup file selected! Data will auto-save.', 'success');
                }
                await saveBackupToFile();
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'SecurityError') {
                    console.warn('Backup setup failed:', err);
                    updateBackupStatus('⚠️ Backup not enabled.', 'error');
                    if (typeof showToast === 'function') {
                        showToast('Backup setup canceled or failed.', 'info');
                    }
                } else {
                    updateBackupStatus('ℹ️ Backup setup canceled.', 'info');
                }
            }
        }

        async function restoreHandle() {
            const saved = await loadHandle();
            if (saved) {
                backupHandle = saved;
                updateBackupStatus('✅ Auto-backup enabled and file selected.', 'success');
                console.log('🔁 Restored backup handle from IndexedDB.');
                triggerBackupSave();
            } else {
                updateBackupStatus('ℹ️ No backup file selected. Click "Enable Backup" to set one up.', 'info');
            }
        }

        async function deleteHandle() {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete('backupHandle');
            await tx.complete;
            db.close();
        }

        const originalSaveData = window.saveData;
        if (typeof originalSaveData === 'function') {
            window.saveData = function (...args) {
                originalSaveData.apply(this, args);
                triggerBackupSave();
            };
        } else {
            document.addEventListener('animeUpdate', triggerBackupSave);
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData') triggerBackupSave();
        });

        let lastSnapshot = JSON.stringify(window.animeData || []);
        setInterval(() => {
            const current = JSON.stringify(window.animeData || []);
            if (current !== lastSnapshot) {
                localStorage.setItem('animeData', current);
                triggerBackupSave();
                lastSnapshot = current;
            }
        }, 5000);

        window.enableBackup = enableBackup;

        function attachBackupButton() {
            const btn = document.getElementById('enableBackupBtn');
            if (btn) {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', enableBackup);
                console.log('✅ Backup button attached.');
            } else {
                setTimeout(attachBackupButton, 500);
            }
        }

        restoreHandle();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachBackupButton);
        } else {
            attachBackupButton();
        }

        console.log('💾 Persistent auto-backup system loaded (settings).');
    })();

    // ============================================
    // HELPER: Save a single profile field (with cloud sync)
    // ============================================
    function saveProfileField(key, value) {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (value === undefined || value === null) {
            delete userProfile[key];
        } else {
            userProfile[key] = value;
        }
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        if (window.dualStorage && window.dualStorage.isLoggedIn()) {
            window.dualStorage.syncToCloud();
        }
        refreshProfilePreview();
        if (typeof window.updateSidebarUserInfo === 'function') {
            window.updateSidebarUserInfo();
        }
        return userProfile;
    }

    // ============================================
    // LOAD PROFILE DATA INTO FORM
    // ============================================
    function loadProfileForm() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};

        const fields = {
            usernameInput: userProfile.name || userProfile.username || '',
            profileBio: userProfile.bio || '',
            profileStatus: userProfile.status || '',
            favoriteAnime: (userProfile.favoriteAnime && Array.isArray(userProfile.favoriteAnime))
                ? userProfile.favoriteAnime.join(', ')
                : userProfile.favoriteAnime || '',
            socialAnilist: userProfile.social?.anilist || '',
            socialMAL: userProfile.social?.myanimelist || '',
            socialTwitter: userProfile.social?.twitter || '',
            socialInstagram: userProfile.social?.instagram || '',
        };

        Object.keys(fields).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = fields[id];
        });

        // Load favorite tags (handled by the tag input component)
        loadFavoriteTags();

        updateBioCharCount();
        refreshProfilePreview();

        // 🔁 Ensure member since is set and displayed
        ensureMemberSince();
    }

    function updateBioCharCount() {
        const bio = document.getElementById('profileBio');
        const count = document.getElementById('bioCharCount');
        if (bio && count) {
            count.textContent = `${bio.value.length} / 200`;
        }
    }

    // ============================================
    // COVER IMAGE UPLOAD WITH CROP (16:5 ratio)
    // ============================================
    async function uploadCoverWithCrop(file) {
        if (!file) return false;
        if (file.size > 5 * 1024 * 1024) {
            if (typeof showToast === 'function') showToast('Image too large! Max 5MB', 'error');
            return false;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            if (typeof showToast === 'function') showToast('Please select an image file', 'error');
            return false;
        }

        try {
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            if (typeof window.openCropModal !== 'function') {
                throw new Error('Crop modal not available. Please check avatar.js.');
            }

            // AniList banner ratio: 16:5 (1200×375)
            const croppedDataUrl = await window.openCropModal(dataUrl, 16 / 5, 1200, 375);

            // Compress to max 500KB
            let compressedDataUrl;
            if (typeof window.compressImageFromDataUrl === 'function') {
                compressedDataUrl = await window.compressImageFromDataUrl(croppedDataUrl, 500, 1200, 375);
            } else {
                compressedDataUrl = await compressFallback(croppedDataUrl, 1200, 375);
            }
            saveProfileField('cover', compressedDataUrl);
            if (typeof showToast === 'function') showToast('Cover image updated!', 'success');
            return true;
        } catch (error) {
            if (error.message !== 'Cancelled') {
                console.error('Cover upload error:', error);
                if (typeof showToast === 'function') showToast(error.message || 'Failed to upload cover', 'error');
            }
            return false;
        }
    }

    // Fallback compression
    async function compressFallback(dataUrl, maxWidth, maxHeight) {
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
                let quality = 0.85;
                let out = canvas.toDataURL('image/jpeg', quality);
                let attempts = 0;
                while (out.length > 500 * 1024 && quality > 0.3 && attempts < 10) {
                    quality -= 0.05;
                    out = canvas.toDataURL('image/jpeg', quality);
                    attempts++;
                }
                resolve(out);
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    // ============================================
    // FAVORITE ANIME – Tag Input Component
    // ============================================
    let selectedAnimeIds = [];

    function loadFavoriteTags() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        selectedAnimeIds = userProfile.favoriteAnime || [];
        renderTags();
    }

    function renderTags() {
        const tagContainer = document.getElementById('favTagContainer');
        const tagInput = document.getElementById('favTagInput');
        if (!tagContainer || !tagInput) return;

        // Remove existing tags (keep the input)
        const tags = tagContainer.querySelectorAll('.tag-item');
        tags.forEach(tag => tag.remove());

        const animeMap = {};
        (window.animeData || []).forEach(a => { animeMap[a.id] = a; });

        selectedAnimeIds.forEach(id => {
            const anime = animeMap[id];
            if (!anime) return;
            const tag = document.createElement('span');
            tag.className = 'tag-item';
            tag.dataset.id = id;
            tag.innerHTML = `
                ${window.escapeHtml(anime.title)}
                <button class="tag-remove" data-id="${id}" type="button">✕</button>
            `;
            tagContainer.insertBefore(tag, tagInput);

            tag.querySelector('.tag-remove').addEventListener('click', function (e) {
                e.stopPropagation();
                const id = parseInt(this.dataset.id);
                selectedAnimeIds = selectedAnimeIds.filter(i => i !== id);
                saveFavoriteAnime();
                renderTags();
                updateDropdownState();
            });
        });
    }

    function saveFavoriteAnime() {
        saveProfileField('favoriteAnime', selectedAnimeIds);
        // Also update the text input for manual entry
        const textInput = document.getElementById('favoriteAnime');
        if (textInput) {
            const animeMap = {};
            (window.animeData || []).forEach(a => { animeMap[a.id] = a; });
            const titles = selectedAnimeIds.map(id => animeMap[id]?.title || '').filter(Boolean);
            textInput.value = titles.join(', ');
        }
        // Update preview tags
        updatePreviewDetails();
    }

    function updateDropdownState() {
        const tagDropdown = document.getElementById('favTagDropdown');
        if (!tagDropdown) return;
        const results = tagDropdown.querySelectorAll('.tag-result');
        results.forEach(result => {
            const id = parseInt(result.dataset.id);
            const added = selectedAnimeIds.includes(id);
            result.classList.toggle('selected', added);
            const addBtn = result.querySelector('.result-add');
            const addedBadge = result.querySelector('.result-added');
            if (addBtn) addBtn.style.display = added ? 'none' : 'inline-block';
            if (addedBadge) addedBadge.style.display = added ? 'inline-block' : 'none';
        });
    }

    function searchAnimeForTags(query) {
        const tagDropdown = document.getElementById('favTagDropdown');
        if (!tagDropdown) return;
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) {
            tagDropdown.innerHTML = `<div class="tag-dropdown-empty">Start typing to search...</div>`;
            tagDropdown.classList.remove('open');
            return;
        }

        const results = (window.animeData || [])
            .filter(a => a.title.toLowerCase().includes(trimmed))
            .slice(0, 10);

        if (results.length === 0) {
            tagDropdown.innerHTML = `<div class="tag-dropdown-empty">No anime found matching "${window.escapeHtml(query)}"</div>`;
            tagDropdown.classList.add('open');
            return;
        }

        tagDropdown.innerHTML = results.map(anime => {
            const isAdded = selectedAnimeIds.includes(anime.id);
            const cover = anime.cover || 'https://placehold.co/32x44/6a5acd/white?text=No+Image';
            return `
                <div class="tag-result ${isAdded ? 'selected' : ''}" data-id="${anime.id}">
                    <img src="${cover}" alt="${window.escapeHtml(anime.title)}" onerror="this.src='https://placehold.co/32x44/6a5acd/white?text=No+Image'">
                    <div class="result-info">
                        <div class="result-title">${window.escapeHtml(anime.title)}</div>
                        <div class="result-meta">
                            <span>${anime.type || 'TV'}</span>
                            <span>${anime.episodes || '?'} eps</span>
                        </div>
                    </div>
                    ${isAdded ? `<span class="result-added">✓ Added</span>` : `<span class="result-add">+ Add</span>`}
                </div>
            `;
        }).join('');

        tagDropdown.classList.add('open');

        tagDropdown.querySelectorAll('.tag-result').forEach(result => {
            result.addEventListener('click', function () {
                const id = parseInt(this.dataset.id);
                if (selectedAnimeIds.includes(id)) {
                    selectedAnimeIds = selectedAnimeIds.filter(i => i !== id);
                } else {
                    selectedAnimeIds.push(id);
                }
                saveFavoriteAnime();
                renderTags();
                updateDropdownState();
                // Keep dropdown open and refocus
                document.getElementById('favTagInput')?.focus();
                searchAnimeForTags(document.getElementById('favTagInput')?.value || '');
            });
        });
    }

    // ============================================
    // MAIN SETTINGS INIT
    // ============================================
    window.initSettings = function () {
        initSettingsTabs();

        // ---- Load profile data into form ----
        loadProfileForm();

        // ---- Display name ----
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            usernameInput.addEventListener('change', function () {
                const newName = this.value.trim();
                if (newName) {
                    saveProfileField('name', newName);
                    saveProfileField('username', newName);
                    if (typeof showToast === 'function') showToast('Name updated!', 'success');
                }
            });
        }

        // ---- Sync UI ----
        window.initSyncUI();

        // ---- Clear data ----
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (this.disabled) return;
                if (confirm('Are you sure you want to delete all data?')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }

        // ---- Export data ----
        document.getElementById('exportDataBtn')?.addEventListener('click', function () {
            if (typeof window.exportData === 'function') window.exportData();
        });

        // ---- Queue status ----
        initQueueStatusUI();

        // ---- Bio ----
        const bio = document.getElementById('profileBio');
        if (bio) {
            bio.addEventListener('input', updateBioCharCount);
            bio.addEventListener('change', function () {
                saveProfileField('bio', this.value.trim());
                if (typeof showToast === 'function') showToast('Bio updated!', 'success');
            });
        }

        // ---- Custom Status ----
        const statusInput = document.getElementById('profileStatus');
        if (statusInput) {
            statusInput.addEventListener('change', function () {
                saveProfileField('status', this.value.trim());
                if (typeof showToast === 'function') showToast('Status updated!', 'success');
            });
        }

        // ---- Social Links ----
        const socialFields = ['socialAnilist', 'socialMAL', 'socialTwitter', 'socialInstagram'];
        socialFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', function () {
                    const key = id.replace('social', '').toLowerCase();
                    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    if (!userProfile.social) userProfile.social = {};
                    userProfile.social[key] = this.value.trim() || null;
                    localStorage.setItem('userProfile', JSON.stringify(userProfile));
                    if (window.dualStorage && window.dualStorage.isLoggedIn()) {
                        window.dualStorage.syncToCloud();
                    }
                    refreshProfilePreview();
                    if (typeof showToast === 'function') showToast(`${key} updated!`, 'success');
                });
            }
        });

        // ---- Cover Image ----
        const coverInput = document.getElementById('coverInput');
        if (coverInput) {
            const newCoverInput = coverInput.cloneNode(true);
            coverInput.parentNode.replaceChild(newCoverInput, coverInput);
            newCoverInput.addEventListener('change', async function (e) {
                const file = e.target.files[0];
                if (file) {
                    await uploadCoverWithCrop(file);
                }
                newCoverInput.value = '';
            });
        }

        // ---- Remove Cover ----
        document.getElementById('removeCoverBtn')?.addEventListener('click', function () {
            saveProfileField('cover', null);
            document.getElementById('coverPreview').style.display = 'none';
            document.getElementById('coverPreviewImg').src = '';
            this.style.display = 'none';
            refreshProfilePreview();
            if (typeof showToast === 'function') showToast('Cover removed', 'info');
        });

        // ---- Favorite Anime (Tag Input) ----
        const tagInput = document.getElementById('favTagInput');
        const tagDropdown = document.getElementById('favTagDropdown');

        if (tagInput && tagDropdown) {
            // Load initial tags
            loadFavoriteTags();

            // Search on input
            tagInput.addEventListener('input', function () {
                const query = this.value;
                if (query.trim().length > 0) {
                    searchAnimeForTags(query);
                } else {
                    tagDropdown.innerHTML = `<div class="tag-dropdown-empty">Start typing to search...</div>`;
                    tagDropdown.classList.remove('open');
                }
            });

            // Focus: show dropdown if query exists
            tagInput.addEventListener('focus', function () {
                if (this.value.trim().length > 0) {
                    searchAnimeForTags(this.value);
                } else {
                    tagDropdown.innerHTML = `<div class="tag-dropdown-empty">Start typing to search...</div>`;
                    tagDropdown.classList.remove('open');
                }
            });

            // Click outside to close dropdown
            document.addEventListener('click', function (e) {
                const wrapper = document.querySelector('.tag-input-wrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    tagDropdown.classList.remove('open');
                }
            });

            // Enter key: add first result if any
            tagInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const firstResult = tagDropdown.querySelector('.tag-result:not(.selected)');
                    if (firstResult) {
                        firstResult.click();
                    }
                    this.value = '';
                    tagDropdown.classList.remove('open');
                }
                if (e.key === 'Escape') {
                    tagDropdown.classList.remove('open');
                    this.blur();
                }
            });
        }

        // ---- Manual text input (sync with tag input) ----
        const favText = document.getElementById('favoriteAnime');
        if (favText) {
            favText.addEventListener('change', function () {
                const raw = this.value.trim();
                const titles = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
                const animeMap = {};
                (window.animeData || []).forEach(a => { animeMap[a.title.toLowerCase()] = a.id; });
                const ids = titles.map(title => animeMap[title.toLowerCase()]).filter(id => id !== undefined);
                if (ids.length > 0 || titles.length === 0) {
                    selectedAnimeIds = ids;
                    saveFavoriteAnime();
                    renderTags();
                    updateDropdownState();
                    // Clear search input if any
                    if (tagInput) tagInput.value = '';
                    if (tagDropdown) tagDropdown.classList.remove('open');
                }
            });
        }

        // ---- Save Profile Button ----
        document.getElementById('saveProfileBtn')?.addEventListener('click', function () {
            ['profileBio', 'profileStatus', ...socialFields].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.dispatchEvent) {
                    el.dispatchEvent(new Event('change'));
                }
            });
            if (favText) favText.dispatchEvent(new Event('change'));
            if (usernameInput) usernameInput.dispatchEvent(new Event('change'));
            // The tag input already saves on change, but we also save here
            saveFavoriteAnime();
            if (typeof showToast === 'function') showToast('Profile saved!', 'success');
        });

        // ---- Reset Profile Button ----
        document.getElementById('resetProfileBtn')?.addEventListener('click', function () {
            if (!confirm('Reset all profile details (bio, status, social links, cover) to defaults?')) return;
            const defaults = {
                bio: '',
                status: '',
                favoriteAnime: [],
                social: {},
                cover: null
                // memberSince is NOT reset – it stays as the original join date
            };
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            // Keep memberSince intact
            const memberSince = userProfile.memberSince;
            Object.keys(defaults).forEach(key => {
                userProfile[key] = defaults[key];
            });
            if (memberSince) userProfile.memberSince = memberSince;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            if (window.dualStorage && window.dualStorage.isLoggedIn()) {
                window.dualStorage.syncToCloud();
            }
            loadProfileForm();
            refreshProfilePreview();
            if (typeof showToast === 'function') showToast('Profile reset to defaults', 'info');
        });

        // ---- Listen for profile changes from other tabs ----
        window.addEventListener('storage', function (e) {
            if (e.key === 'userProfile') {
                loadProfileForm();
                refreshProfilePreview();
            }
        });

        // ---- Also listen for cloud load events ----
        document.addEventListener('cloudDataLoaded', function () {
            loadProfileForm();
            refreshProfilePreview();
        });

        console.log('✅ Settings initialized (with tag input & extended profile)');
    };

})();