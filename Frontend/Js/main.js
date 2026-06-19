// ============================================
// QUEUE STATUS UI - Settings Page
// ============================================

function checkAndHideEmptySections() {
    const watchingGrid = document.getElementById('currently-watching-grid');
    const watchingSection = document.getElementById('currently-watching-section');
    
    if (!watchingGrid || !watchingSection) return;
    
    const animeCards = watchingGrid.querySelectorAll('.anime-card');
    const hasAnimeCards = animeCards.length > 0;
    
    // Use CSS custom property instead of direct style
    if (hasAnimeCards) {
        watchingSection.style.setProperty('--watching-section-display', 'block');
    } else {
        watchingSection.style.setProperty('--watching-section-display', 'none');
    }
    
    console.log('Section visibility set to:', hasAnimeCards ? 'block' : 'none');
}

// Safe wrapper - only runs if elements exist
function updateQueueStatusUI() {
    // Only run if the queue elements exist on page
    const queuedXPEl = document.getElementById('queuedXPAmount');
    if (!queuedXPEl) return; // Exit if elements not found

    const queue = JSON.parse(localStorage.getItem('xpPendingQueue') || '[]');
    const totalQueuedXP = queue.reduce((sum, item) => sum + (item.xp || 0), 0);
    const queueCount = queue.length;

    const today = new Date().toDateString();
    const dailyXPKey = `dailyXP_${today}`;
    const todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');

    // Get the REAL limit from level-system.js
    let maxDailyXP = 5000;
    if (window.AniPulseLevelSystem && window.AniPulseLevelSystem.MAX_DAILY_XP) {
        maxDailyXP = window.AniPulseLevelSystem.MAX_DAILY_XP;
    } else if (typeof MAX_DAILY_XP !== 'undefined') {
        maxDailyXP = MAX_DAILY_XP;
    }

    // Update stats
    const queuedCountEl = document.getElementById('queuedItemsCount');
    const todayXPEl = document.getElementById('todayXPAmount');
    const dailyLimitEl = document.getElementById('dailyLimit');
    const queueFillEl = document.getElementById('queueProgressFill');
    const queuePercentEl = document.getElementById('queuePercent');
    const queueMessageEl = document.getElementById('queueMessage');

    if (queuedXPEl) {
        const oldValue = parseInt(queuedXPEl.textContent);
        queuedXPEl.textContent = totalQueuedXP.toLocaleString();
        if (oldValue !== totalQueuedXP && totalQueuedXP > 0) {
            queuedXPEl.classList.add('updated');
            setTimeout(() => queuedXPEl.classList.remove('updated'), 400);
        }
    }

    if (queuedCountEl) {
        queuedCountEl.textContent = queueCount;
    }

    if (todayXPEl) {
        todayXPEl.textContent = todayXP;
    }

    if (dailyLimitEl) {
        dailyLimitEl.textContent = maxDailyXP.toLocaleString();
    }

    // Update progress bar (percentage of daily limit used)
    const dailyPercent = Math.min(100, (todayXP / maxDailyXP) * 100);
    if (queueFillEl) {
        queueFillEl.style.width = dailyPercent + '%';
    }
    if (queuePercentEl) {
        queuePercentEl.textContent = Math.floor(dailyPercent) + '%';
    }

    // Update message
    if (queueMessageEl) {
        if (queueCount > 0) {
            queueMessageEl.className = 'queue-message has-queue';
            queueMessageEl.innerHTML = `<i class="fas fa-clock"></i> ${queueCount} item(s) queued (${totalQueuedXP.toLocaleString()} XP total). Will be added when daily limit resets.`;
        } else {
            queueMessageEl.className = 'queue-message';
            queueMessageEl.innerHTML = `<i class="fas fa-check-circle"></i> No pending XP in queue`;
        }
    }
}

// Initialize queue UI (safe - only if elements exist)
function initQueueStatusUI() {
    // Check if queue elements exist on page
    const queueCard = document.querySelector('.queue-status-card');
    if (!queueCard) return;

    updateQueueStatusUI();

    // Update every 30 seconds
    setInterval(() => {
        const settingsPage = document.getElementById('settings-page');
        if (settingsPage && settingsPage.classList.contains('active')) {
            updateQueueStatusUI();
        }
    }, 30000);
}

// Listen for XP updates
window.addEventListener('xpUpdated', () => {
    updateQueueStatusUI();
});

// Listen for storage events
window.addEventListener('storage', (e) => {
    if (e.key === 'xpPendingQueue' || (e.key && e.key.startsWith('dailyXP_'))) {
        updateQueueStatusUI();
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for level-system to load
    setTimeout(() => {
        initQueueStatusUI();
    }, 1000);
});

// Make functions globally available
window.updateQueueStatusUI = updateQueueStatusUI;

// ============================================
// FIX PLACEHOLDER IMAGES - RUN IMMEDIATELY
// ============================================

(function fixPlaceholdersEarly() {
    // Replace all via.placeholder.com URLs before they load
    const originalImageSrc = Object.getOwnPropertyDescriptor(Image.prototype, 'src');

    // Intercept image src setting
    Object.defineProperty(Image.prototype, 'src', {
        get: function () {
            return this.getAttribute('src');
        },
        set: function (value) {
            if (value && value.includes('via.placeholder.com')) {
                const match = value.match(/(\d+)x(\d+)/);
                if (match) {
                    value = `https://placehold.co/${match[1]}x${match[2]}/6a5acd/white?text=No+Image`;
                } else {
                    value = 'https://placehold.co/50x70/6a5acd/white?text=No+Image';
                }
            }
            this.setAttribute('src', value);
            if (originalImageSrc?.set) {
                originalImageSrc.set.call(this, value);
            }
        }
    });

    // Also fix existing images
    const fixExisting = () => {
        document.querySelectorAll('img').forEach(img => {
            if (img.src && img.src.includes('via.placeholder.com')) {
                const match = img.src.match(/(\d+)x(\d+)/);
                if (match) {
                    img.src = `https://placehold.co/${match[1]}x${match[2]}/6a5acd/white?text=No+Image`;
                } else {
                    img.src = 'https://placehold.co/50x70/6a5acd/white?text=No+Image';
                }
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixExisting);
    } else {
        fixExisting();
    }

    console.log('✅ Placeholder image interceptor installed');
})();

// Define lineTooltip globally BEFORE any function uses it
let lineTooltip = null;

// Create lineTooltip function
function createLineTooltip() {
    if (lineTooltip) return lineTooltip;

    lineTooltip = document.getElementById('lineChartTooltip');
    if (!lineTooltip) {
        lineTooltip = document.createElement('div');
        lineTooltip.id = 'lineChartTooltip';
        lineTooltip.style.position = 'fixed';
        lineTooltip.style.background = 'linear-gradient(135deg, #1a1f2e, #0f1420)';
        lineTooltip.style.color = 'white';
        lineTooltip.style.padding = '8px 14px';
        lineTooltip.style.borderRadius = '12px';
        lineTooltip.style.fontSize = '0.75rem';
        lineTooltip.style.fontWeight = '500';
        lineTooltip.style.border = '1px solid rgba(139, 92, 246, 0.4)';
        lineTooltip.style.backdropFilter = 'blur(8px)';
        lineTooltip.style.pointerEvents = 'none';
        lineTooltip.style.zIndex = '10000';
        lineTooltip.style.whiteSpace = 'nowrap';
        lineTooltip.style.opacity = '0';
        lineTooltip.style.transition = 'opacity 0.2s ease';
        document.body.appendChild(lineTooltip);
        console.log('✅ lineTooltip created');
    }
    return lineTooltip;
}

// Call it immediately
createLineTooltip();

// ✅ AUTO-RELOAD SYSTEM - Detects changes and refreshes page automatically
let lastChecksum = null;
let autoReloadInterval = null;

// Simple hash function - works with any character set
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

// Calculate checksum of current HTML to detect changes
function calculatePageChecksum() {
    return simpleHash(document.documentElement.innerHTML).slice(0, 20);
}

// Initialize auto-reload system
function initAutoReload() {
    // Check for changes every 1 second
    autoReloadInterval = setInterval(async () => {
        try {
            const response = await fetch(window.location.href, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const html = await response.text();
            const newChecksum = simpleHash(html).slice(0, 20);

            if (lastChecksum === null) {
                lastChecksum = newChecksum;
            } else if (lastChecksum !== newChecksum) {
                console.log('🔄 Changes detected! Reloading page...');
                // Show notification before reload
                showToast('Changes detected! Refreshing...', 'info');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } catch (error) {
            console.error('Auto-reload check failed:', error);
        }
    }, 1000); // Check every 1 second
}

// Stop auto-reload
function stopAutoReload() {
    if (autoReloadInterval) {
        clearInterval(autoReloadInterval);
        autoReloadInterval = null;
    }
}

// Initialize with empty data
let animeData = JSON.parse(localStorage.getItem('animeData')) || [];
let isEditing = false;
let currentEditId = null;


// Save data to localStorage only
function saveData() {
    localStorage.setItem('animeData', JSON.stringify(animeData));
    console.log('💾 Data saved to localStorage');
}

// Make saveData global
window.saveData = saveData;

// Logout handler (simple version)
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
});

// Initialize sync UI
function initSyncUI() {
    const lastSyncSpan = document.getElementById('lastSyncTime');
    const lastSync = localStorage.getItem('lastCloudSyncTime');

    if (lastSync) {
        lastSyncSpan.textContent = new Date(lastSync).toLocaleString();
    }

    // Sync Now button
    document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
        if (window.dualStorage) {
            await window.dualStorage.syncToCloud();
            const newSync = localStorage.getItem('lastCloudSyncTime');
            if (newSync) {
                lastSyncSpan.textContent = new Date(newSync).toLocaleString();
            }
        }
    });

    // Load from Cloud button
    document.getElementById('loadFromCloudBtn')?.addEventListener('click', async () => {
        if (confirm('⚠️ This will replace your local data with cloud data. Continue?')) {
            const result = await window.dualStorage?.loadFromCloud();
            if (result?.success) {
                location.reload();
            }
        }
    });
}

// Call when settings page becomes active
document.querySelector('.menu-item[data-page="settings"]')?.addEventListener('click', () => {
    setTimeout(initSyncUI, 100);
});
// ============================================
// AVATAR SYSTEM - Compressed & Stored in Firestore
// ============================================

// Compress image to small data URL (under 500KB)
async function compressImage(file, maxSizeKB = 500, maxWidth = 200, maxHeight = 200) {
    return new Promise((resolve, reject) => {
        // Check original file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Image too large! Maximum 5MB before compression'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Resize image to max 200x200
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

                // Start with quality 0.8
                let quality = 0.8;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // Reduce quality until size is under limit
                let attempts = 0;
                while (dataUrl.length > maxSizeKB * 1024 && quality > 0.3 && attempts < 10) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                    attempts++;
                }

                const finalSizeKB = Math.round(dataUrl.length / 1024);
                console.log(`📸 Image compressed: ${finalSizeKB}KB (limit: ${maxSizeKB}KB)`);

                if (dataUrl.length > maxSizeKB * 1024) {
                    reject(new Error(`Image still too large after compression (${finalSizeKB}KB). Please try a smaller image.`));
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

// Generate default avatar from username (URL-based)
function generateDefaultAvatar(username) {
    const colors = ['6366F1', '8B5CF6', 'EC4899', 'F43F5E', 'EF4444', 'F97316', 'F59E0B', '10B981', '14B8A6', '06B6D4', '3B82F6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const encodedName = encodeURIComponent(username || 'User');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=${randomColor}&color=fff&bold=true&length=2&size=200&rounded=true`;
}

// Update all avatars on the page
function updateAllAvatars(avatarUrl) {
    const avatars = document.querySelectorAll('.user-avatar, .sidebar-avatar, .profile-preview-avatar, #avatarPreview, .profile-modal-avatar, .leaderboard-avatar, .friend-avatar, .friend-request-avatar, .search-result-avatar');
    avatars.forEach(img => {
        if (img) img.src = avatarUrl;
    });
}

// Save avatar to Firestore via backend
async function saveAvatarToCloud(avatarDataUrl) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('Not logged in');
    }

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

// Handle custom avatar upload
async function uploadCustomAvatar(file) {
    if (!file) return false;

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large! Maximum 5MB', 'error');
        return false;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Please select an image file (JPEG, PNG, GIF, WebP)', 'error');
        return false;
    }

    showToast('Processing image...', 'info');

    try {
        // Compress image to under 500KB
        const compressedDataUrl = await compressImage(file, 500, 200, 200);
        const finalSizeKB = Math.round(compressedDataUrl.length / 1024);

        // Show preview immediately
        updateAllAvatars(compressedDataUrl);

        // Save to cloud (Firestore)
        const result = await saveAvatarToCloud(compressedDataUrl);

        // Update localStorage as backup
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        userProfile.avatar = compressedDataUrl;
        userProfile.customAvatar = true;
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        showToast(`Avatar saved! (${finalSizeKB}KB)`, 'success');

        // Sync other components
        if (typeof updateSidebarUserInfo === 'function') updateSidebarUserInfo();
        if (window.dualStorage) window.dualStorage.syncToCloud();

        return true;

    } catch (error) {
        console.error('Avatar upload failed:', error);
        showToast(error.message || 'Failed to process image', 'error');
        return false;
    }
}

// Reset to default avatar
async function resetToDefaultAvatar() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = userProfile.name || user.username || 'User';

    const defaultAvatar = generateDefaultAvatar(username);

    try {
        // Save default to cloud
        await saveAvatarToCloud(defaultAvatar);

        // Update localStorage
        userProfile.avatar = defaultAvatar;
        userProfile.customAvatar = false;
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        // Update UI
        updateAllAvatars(defaultAvatar);

        showToast('Avatar reset to default', 'success');

        // Sync other components
        if (typeof updateSidebarUserInfo === 'function') updateSidebarUserInfo();
        if (window.dualStorage) window.dualStorage.syncToCloud();

    } catch (error) {
        console.error('Reset avatar failed:', error);
        showToast('Failed to reset avatar', 'error');
    }
}

// Load avatar from cloud
async function loadAvatarFromCloud() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        loadAvatarFromLocal();
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.uid;

        if (!userId) {
            loadAvatarFromLocal();
            return;
        }

        const response = await fetch(`http://localhost:3000/api/user/avatar/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.avatar) {
                updateAllAvatars(data.avatar);

                // Update localStorage
                const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                userProfile.avatar = data.avatar;
                userProfile.customAvatar = data.hasCustom;
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                return;
            }
        }

        // Fallback to localStorage
        loadAvatarFromLocal();

    } catch (error) {
        console.error('Failed to load avatar from cloud:', error);
        loadAvatarFromLocal();
    }
}

// Load avatar from localStorage (fallback)
function loadAvatarFromLocal() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = userProfile.name || user.username || 'User';

    if (userProfile.avatar && userProfile.avatar.startsWith('data:image')) {
        // Custom uploaded avatar
        updateAllAvatars(userProfile.avatar);
    } else if (userProfile.avatar && userProfile.avatar.startsWith('http')) {
        // URL avatar
        updateAllAvatars(userProfile.avatar);
    } else {
        // Generate default avatar
        const defaultAvatar = generateDefaultAvatar(username);
        userProfile.avatar = defaultAvatar;
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        updateAllAvatars(defaultAvatar);
    }
}

// Initialize avatar system
function initAvatarSystem() {
    const avatarInput = document.getElementById('avatarInput');
    const resetAvatarBtn = document.getElementById('resetAvatar');
    const usernameInput = document.getElementById('usernameInput');

    // Load avatar from cloud
    loadAvatarFromCloud();

    // Handle file upload
    if (avatarInput) {
        const newAvatarInput = avatarInput.cloneNode(true);
        avatarInput.parentNode.replaceChild(newAvatarInput, avatarInput);

        newAvatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Show preview immediately
                const reader = new FileReader();
                reader.onload = (event) => {
                    updateAllAvatars(event.target.result);
                };
                reader.readAsDataURL(file);

                await uploadCustomAvatar(file);
            }
            newAvatarInput.value = '';
        });
    }

    // Handle reset button
    if (resetAvatarBtn) {
        const newResetBtn = resetAvatarBtn.cloneNode(true);
        resetAvatarBtn.parentNode.replaceChild(newResetBtn, resetAvatarBtn);

        newResetBtn.addEventListener('click', resetToDefaultAvatar);
    }

    // Handle username change (update default avatar if using default)
    if (usernameInput) {
        usernameInput.addEventListener('change', async () => {
            const newName = usernameInput.value.trim();
            if (newName) {
                const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                userProfile.name = newName;

                // Only update avatar if it's a default/generated URL
                if (!userProfile.avatar || (!userProfile.avatar.startsWith('data:image') && userProfile.avatar.includes('ui-avatars.com'))) {
                    const newAvatar = generateDefaultAvatar(newName);
                    userProfile.avatar = newAvatar;
                    updateAllAvatars(newAvatar);

                    // Save to cloud if logged in
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
}

// Call when settings page loads
const settingsMenuItemAvatar = document.querySelector('.menu-item[data-page="settings"]');
if (settingsMenuItemAvatar) {
    settingsMenuItemAvatar.addEventListener('click', () => {
        setTimeout(initAvatarSystem, 100);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadAvatarFromCloud, 500);
});

// Chart variables
let monthlyProgressChart, genreDistributionChart, completionChart, scoreDistributionChart;
let statusDistributionChart, typeDistributionChart, genreStatsChart;
let episodesOverTimeChart, watchTimeByMonthChart;

// DOM elements
const addAnimeBtn = document.getElementById('addAnimeBtn');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const statsBtn = document.getElementById('statsBtn');
const addAnimeModal = document.getElementById('addAnimeModal');
const importModal = document.getElementById('importModal');
const animeForm = document.getElementById('addAnimeForm');
const closeModalBtns = document.querySelectorAll('.close-modal');
const animeTitleInput = document.getElementById('animeTitle');
const searchResults = document.getElementById('searchResults');
const searchLoading = document.getElementById('searchLoading');
const animeCoverInput = document.getElementById('animeCover');
const animeGenresInput = document.getElementById('animeGenres');
const submitBtn = document.getElementById('submitBtn');
const deleteBtn = document.getElementById('deleteBtn');
const animeIdInput = document.getElementById('animeId');
const importFile = document.getElementById('importFile');
const importDataBtn = document.getElementById('importDataBtn');

// Activity log for tracking user actions
let activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];

// Watchlist pagination
const itemsPerPage = 30;
let currentPage = 1;
let currentStatus = 'all';

// Upcoming Anime Data
let upcomingAnimeData = {
    upcoming: [],
    trending: [],
    seasonal: []
};

// DOM Elements for upcoming page
let upcomingFilters, upcomingContent, upcomingLoading, upcomingError;

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    // 🔒 DO NOT trigger animations here - they will start after loader completes
    // This function only sets up event listeners

    // ✅ Start auto-reload system to detect changes
    initAutoReload();

    // === PROFILE SYNC START ===
    const usernameInput = document.getElementById('usernameInput');
    const avatarInput = document.getElementById('avatarInput');
    const resetAvatarBtn = document.getElementById('resetAvatar');

    const profilePreviewName = document.getElementById('profilePreviewName');
    const profilePreviewAvatar = document.getElementById('profilePreviewAvatar');

    const topUserAvatar = document.querySelector('.user-profile .user-avatar');
    const topUserName = document.querySelector('.user-profile span');
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const sidebarUsername = document.querySelector('.sidebar-username');

    // Load from localStorage if saved
    const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'AnimeFan92',
        avatar: 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff'
    };

    function updateUserProfile(name, avatar) {
        // Get current level data from the level system
        let currentLevel = 1;
        let currentTitle = 'Newbie';
        let currentXP = 0;

        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
            const profile = window.AniPulseLevelSystem.getUserProfile();
            currentLevel = profile.level || 1;
            currentTitle = profile.title || 'Newbie';
            currentXP = profile.totalExp || 0;
        }

        if (profilePreviewName) profilePreviewName.textContent = name;
        if (topUserName) topUserName.textContent = name;
        if (sidebarUsername) sidebarUsername.textContent = name;

        if (profilePreviewAvatar) profilePreviewAvatar.src = avatar;
        if (topUserAvatar) topUserAvatar.src = avatar;
        if (sidebarAvatar) sidebarAvatar.src = avatar;

        // Save to localStorage WITHOUT overwriting level data
        const existingProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        const updatedProfile = {
            name: name,
            avatar: avatar,
            // Preserve existing level data
            level: existingProfile.level || currentLevel,
            title: existingProfile.title || currentTitle,
            totalXP: existingProfile.totalXP || currentXP
        };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        // Force refresh the level display
        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
            setTimeout(() => {
                window.AniPulseLevelSystem.updateAllLevelUI();
            }, 100);
        }
    }

    // Initialize
    updateUserProfile(savedProfile.name, savedProfile.avatar);
    if (usernameInput) usernameInput.value = savedProfile.name;

    // When username changes
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const currentAvatar = JSON.parse(localStorage.getItem('userProfile'))?.avatar ||
                'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff';
            updateUserProfile(usernameInput.value || 'Unnamed', currentAvatar);
        });
    }

    // When avatar changes - use URL avatar service
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Use UI Avatars service with custom colors
            const username = usernameInput?.value || 'User';
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&bold=true&length=2&size=150`;

            updateUserProfile(username, avatarUrl);

            showToast('Avatar updated!', 'success');
        });
    }

    // Reset to default
    if (resetAvatarBtn) {
        resetAvatarBtn.addEventListener('click', () => {
            const defaultAvatar = 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff';
            updateUserProfile(usernameInput?.value || 'Unnamed', defaultAvatar);
            // Force level UI update
            setTimeout(() => {
                if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
                    window.AniPulseLevelSystem.updateAllLevelUI();
                }
                updateSidebarUserInfo();
            }, 100);
        });
    }
    // === PROFILE SYNC END ===

    // Add event listeners
    addAnimeBtn.addEventListener('click', () => {
        isEditing = false;
        currentEditId = null;
        animeForm.reset();
        submitBtn.textContent = 'Add Anime';
        deleteBtn.style.display = 'none';
        animeIdInput.value = '';
        addAnimeModal.style.display = 'flex';
    });

    importBtn.addEventListener('click', () => {
        importModal.style.display = 'flex';
    });

    exportBtn.addEventListener('click', exportData);

    statsBtn.addEventListener('click', () => {
        document.querySelector('.menu-item[data-page="statistics"]').click();
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addAnimeModal.style.display = 'none';
            importModal.style.display = 'none';
        });
    });

    animeForm.addEventListener('submit', handleAddAnime);

    // Close modal when clicking outside
    addAnimeModal.addEventListener('click', (e) => {
        if (e.target === addAnimeModal) {
            addAnimeModal.style.display = 'none';
        }
    });

    importModal.addEventListener('click', (e) => {
        if (e.target === importModal) {
            importModal.style.display = 'none';
        }
    });

    // Search for anime when typing
    animeTitleInput.addEventListener('input', searchAnime);

    // Delete button handler
    deleteBtn.addEventListener('click', deleteAnime);

    // Set default duration based on type
    document.getElementById('animeType').addEventListener('change', function () {
        const type = this.value;
        const durationInput = document.getElementById('animeDuration');

        if (type === 'Movie') {
            durationInput.value = '120'; // Default movie duration
            durationInput.readOnly = false;
        } else {
            durationInput.value = '20'; // Default episode duration for TV/OVA/ONA/Special
            durationInput.readOnly = true;
        }
    });

    // Import data button
    importDataBtn.addEventListener('click', () => {
        if (importFile.files.length > 0) {
            importData({ target: { files: importFile.files } });
        } else {
            showToast('Please select a file to import', 'error');
        }
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function () {
            const pageId = this.getAttribute('data-page') + '-page';

            // Remove active class from all menu items and pages
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

            // Add active class to current menu item and page
            this.classList.add('active');
            document.getElementById(pageId).classList.add('active');

            // 🧭 Scroll back to top on page change
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Initialize specific page content
            if (pageId === 'dashboard-page') {
                // Update currently watching section when dashboard loads
                if (typeof updateCurrentlyWatching === 'function') {
                    updateCurrentlyWatching();
                }
            } else if (pageId === 'statistics-page') {
                setTimeout(() => {
                    initStatisticsCharts();
                    updateStatisticsTables();
                }, 100);
            } else if (pageId === 'watchlist-page') {
                const activeStatus = document.querySelector('.filter-btn.active')?.getAttribute('data-status') || 'all';
                updateWatchlist(activeStatus, 1);
            } else if (pageId === 'achievements-page') {
                updateAchievements();
            } else if (pageId === 'upcoming-page') {
                setTimeout(() => {
                    initUpcomingPage();
                    loadUpcomingData();
                }, 100);
            }
        });
    });

    // Status and sort filters
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        localStorage.setItem('animeFilterStatus', e.target.value);
        updateAnimeDisplay();
    });

    document.getElementById('monthFilter').addEventListener('change', (e) => {
        localStorage.setItem('animeFilterMonth', e.target.value);
        updateAnimeDisplay();
    });

    document.getElementById('yearFilter').addEventListener('change', (e) => {
        localStorage.setItem('animeFilterYear', e.target.value);
        updateAnimeDisplay();
    });

    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', updateAnimeDisplay);
    }

    // Initialize user name
    initializeUserName();
    initSettings();

    // Mobile menu functionality
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuToggle && sidebar) {

        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
        });

        sidebar.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
            });
        });

        document.addEventListener('click', (e) => {
            if (
                window.innerWidth <= 768 &&
                sidebar.classList.contains('mobile-open') &&
                !sidebar.contains(e.target) &&
                !mobileMenuToggle.contains(e.target)
            ) {
                sidebar.classList.remove('mobile-open');
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }
    console.log('mobile menu init');

    // Check for updates on app start (with delay to avoid rate limiting)
    setTimeout(checkForUserUpdates, 5000);

    // Initialize Currently Watching section visibility on page load
    setTimeout(() => {
        if (typeof updateCurrentlyWatching === 'function') {
            updateCurrentlyWatching();
            console.log('✅ Currently Watching section initialized on page load');
            
            // Debug: Show current state
            const section = document.getElementById('currently-watching-section');
            const dataToUse = Array.isArray(animeData) ? animeData : 
                JSON.parse(localStorage.getItem('animeData')) || [];
            console.log('DEBUG: animeData loaded:', dataToUse.length, 'items');
            console.log('DEBUG: Watching count:', dataToUse.filter(a => a.userStatus === 'Watching').length);
            console.log('DEBUG: Section hidden?', window.getComputedStyle(section).display === 'none');
        }
    }, 300);

    // Add periodic check to maintain section visibility (every 2 seconds)
    setInterval(() => {
        if (typeof updateCurrentlyWatching === 'function') {
            const section = document.getElementById('currently-watching-section');
            if (section && section.offsetHeight > 0) {
                // Section is visible - double-check if it should be
                const dataToUse = Array.isArray(animeData) ? animeData : 
                    JSON.parse(localStorage.getItem('animeData')) || [];
                const hasWatching = dataToUse.some(a => a.userStatus === 'Watching');
                if (!hasWatching) {
                    console.log('⚠️ Section is visible but has no watching anime - hiding it');
                    updateCurrentlyWatching();
                }
            }
        }
    }, 2000);

    // Listen for visibility changes and update section
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && typeof updateCurrentlyWatching === 'function') {
            console.log('📱 Page became visible - updating Currently Watching section');
            updateCurrentlyWatching();
        }
    });
});

// =============================================
// EXISTING FUNCTIONALITY 
// =============================================

// Helper function to calculate watch time
function calculateWatchTime(anime) {
    if (anime.type === 'Movie') {
        return anime.duration / 60; // Return hours for movies
    } else {
        return (anime.episodes * 20) / 60; // 20 minutes per episode for TV/OVA/ONA/Special
    }
}

// =============================================
// COMPLETELY FIXED SEARCH - PROPER TITLE SELECTION
// =============================================

const searchCache = new Map();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500;
let activeRequest = null;

// Get best title (prioritize English)
function getBestTitle(anime) {
    return anime.title_english ||
        anime.title_romaji ||
        anime.title_japanese ||
        anime.title ||
        'Unknown Title';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Main search function
async function searchAnime() {
    const searchInput = document.getElementById('animeTitle');
    const query = searchInput?.value.trim();
    const searchResults = document.getElementById('searchResults');
    const searchLoading = document.getElementById('searchLoading');

    console.log('🔍 Searching for:', query);

    if (!query || query.length < 3) {
        if (searchResults) searchResults.style.display = 'none';
        if (searchLoading) searchLoading.style.display = 'none';
        return;
    }

    const cacheKey = query.toLowerCase();
    if (searchCache.has(cacheKey)) {
        console.log('📦 Using cached results');
        displaySearchResults(searchCache.get(cacheKey), searchResults);
        return;
    }

    if (searchLoading) searchLoading.style.display = 'block';
    if (searchResults) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
    }

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && activeRequest) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`⏳ Waiting ${waitTime}ms...`);
        setTimeout(() => {
            if (document.getElementById('animeTitle')?.value.trim() === query) {
                executeSearch(query, searchResults, searchLoading, cacheKey);
            }
        }, waitTime);
        return;
    }

    executeSearch(query, searchResults, searchLoading, cacheKey);
}

async function executeSearch(query, searchResults, searchLoading, cacheKey) {
    if (activeRequest) return;

    activeRequest = true;
    lastRequestTime = Date.now();

    try {
        console.log('🌐 Fetching from Jikan API...');
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8`);

        if (response.status === 429) {
            if (searchResults) {
                searchResults.innerHTML = '<div style="padding: 12px; text-align: center; color: #ff6b6b;">⏳ Too many requests. Please wait...</div>';
                searchResults.style.display = 'block';
            }
            setTimeout(() => {
                if (document.getElementById('animeTitle')?.value.trim() === query) {
                    searchCache.delete(cacheKey);
                    executeSearch(query, searchResults, searchLoading, cacheKey);
                }
            }, 5000);
            return;
        }

        const data = await response.json();
        searchCache.set(cacheKey, data);
        setTimeout(() => searchCache.delete(cacheKey), 10 * 60 * 1000);

        displaySearchResults(data, searchResults);

    } catch (error) {
        console.error('Search error:', error);
        if (searchResults) {
            searchResults.innerHTML = '<div style="padding: 12px; text-align: center; color: #ff6b6b;">Error loading results</div>';
            searchResults.style.display = 'block';
        }
    } finally {
        if (searchLoading) searchLoading.style.display = 'none';
        activeRequest = null;
    }
}

// Display search results
function displaySearchResults(data, searchResults) {
    if (!searchResults) return;

    if (data.data && data.data.length > 0) {
        searchResults.innerHTML = '';

        data.data.forEach(anime => {
            const englishTitle = getBestTitle(anime);
            const japaneseTitle = anime.title_japanese || '';

            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                transition: background 0.2s;
            `;

            // Display title with Japanese in small text
            const titleDisplay = japaneseTitle && japaneseTitle !== englishTitle
                ? `${escapeHtml(englishTitle)} <span style="font-size: 0.7rem; opacity: 0.6;">(${escapeHtml(japaneseTitle)})</span>`
                : escapeHtml(englishTitle);

            item.innerHTML = `
                <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/45x65/6a5acd/ffffff?text=No+Image'}" 
                     style="width: 45px; height: 65px; object-fit: cover; border-radius: 8px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${titleDisplay}</div>
                    <small style="opacity: 0.7;">
                        ${anime.type || 'TV'} • ${anime.episodes || '?'} eps • 
                        ${anime.score ? `⭐ ${anime.score}` : 'Not rated'}
                    </small>
                </div>
            `;

            // IMPORTANT: Store the complete anime data
            const animeData = {
                title: englishTitle,
                title_english: englishTitle,
                title_romaji: anime.title_romaji || englishTitle,
                type: anime.type || 'TV',
                episodes: anime.episodes || 1,
                score: anime.score || null,
                duration: anime.duration,
                images: anime.images,
                genres: anime.genres || [],
                synopsis: anime.synopsis || ''
            };

            // Direct click handler
            item.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                selectAnimeFromSearch(animeData);
            };

            searchResults.appendChild(item);
        });
        searchResults.style.display = 'block';
    } else {
        searchResults.innerHTML = '<div style="padding: 12px; text-align: center; color: #888;">No results found</div>';
        searchResults.style.display = 'block';
    }
}

// FIXED: Select anime and fill the form correctly
window.selectAnimeFromSearch = function (anime) {
    if (!anime) {
        console.error('No anime data provided');
        return;
    }

    // Get all form elements
    const titleInput = document.getElementById('animeTitle');
    const typeSelect = document.getElementById('animeType');
    const episodesInput = document.getElementById('animeEpisodes');
    const durationInput = document.getElementById('animeDuration');
    const coverInput = document.getElementById('animeCover');
    const genresInput = document.getElementById('animeGenres');
    const scoreInput = document.getElementById('animeScore');
    const searchResults = document.getElementById('searchResults');

    // IMPORTANT: Set the actual anime title (not the search query)
    if (titleInput) {
        titleInput.value = anime.title;
    }

    // Set type
    if (typeSelect) {
        const animeType = anime.type || 'TV';
        typeSelect.value = animeType;

        // Trigger change event to update duration
        const changeEvent = new Event('change');
        typeSelect.dispatchEvent(changeEvent);
    }

    // Set episodes
    if (episodesInput) {
        const episodes = anime.episodes || 1;
        episodesInput.value = episodes;
    }

    // Set duration based on type
    if (durationInput) {
        if (anime.type === 'Movie') {
            durationInput.value = anime.duration ? Math.round(parseInt(anime.duration) || 120) : '120';
            durationInput.readOnly = false;
        } else {
            durationInput.value = '20';
            durationInput.readOnly = true;
        }
    }

    // Set cover image
    if (coverInput && anime.images?.jpg?.image_url) {
        coverInput.value = anime.images.jpg.image_url;
    }

    // Set genres
    if (genresInput && anime.genres && anime.genres.length > 0) {
        const unwantedGenres = ['Award Winning'];
        const genres = anime.genres
            .filter(g => !unwantedGenres.includes(g.name))
            .map(g => g.name)
            .join(', ');
        genresInput.value = genres;
    }

    // Set score
    if (scoreInput && anime.score) {
        const score = typeof anime.score === 'number' ? anime.score : parseFloat(anime.score);
        if (!isNaN(score)) {
            scoreInput.value = score;
        }
    }

    // Close search results
    if (searchResults) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
    }

    // Show success message
    showToast(`✓ Selected: ${anime.title}`, 'success');

    // Also update the search input to show the selected title
    if (titleInput) {
        // Small visual feedback
        titleInput.style.border = '2px solid #10b981';
        setTimeout(() => {
            titleInput.style.border = '';
        }, 1000);
    }
};

// Initialize search
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔍 Initializing search system...');

    const searchInput = document.getElementById('animeTitle');

    if (!searchInput) {
        console.error('❌ Search input not found!');
        return;
    }

    // Fix form group positioning
    const formGroup = searchInput.closest('.form-group');
    if (formGroup && getComputedStyle(formGroup).position !== 'relative') {
        formGroup.style.position = 'relative';
    }

    // Remove existing listeners by cloning
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    let searchTimeout;
    newSearchInput.addEventListener('input', function (e) {
        const query = this.value.trim();

        if (searchTimeout) clearTimeout(searchTimeout);

        // Show hint for short queries
        if (query.length > 0 && query.length < 3) {
            const searchResults = document.getElementById('searchResults');
            if (searchResults) {
                searchResults.innerHTML = '<div style="padding: 12px; text-align: center; color: #888;">Type at least 3 characters...</div>';
                searchResults.style.display = 'block';
            }
            return;
        }

        // Debounce search
        searchTimeout = setTimeout(() => {
            if (query.length >= 3) {
                searchAnime();
            } else {
                const searchResults = document.getElementById('searchResults');
                const searchLoading = document.getElementById('searchLoading');
                if (searchResults) searchResults.style.display = 'none';
                if (searchLoading) searchLoading.style.display = 'none';
            }
        }, 800);
    });

    console.log('✅ Search system ready!');

    // Test the function
    console.log('selectAnimeFromSearch function exists:', typeof window.selectAnimeFromSearch === 'function');
});

// Make sure searchAnime is global
window.searchAnime = searchAnime;

// Update statistics
function updateStats() {
    // Update current month name
    document.getElementById('current-month').textContent = getCurrentMonth();

    // Calculate and update monthly stats from user data
    const monthlyStats = calculateMonthlyStats();

    // Update DOM elements with actual user data
    document.getElementById('completed-count').textContent = monthlyStats.completed;
    document.getElementById('movies-count').textContent = monthlyStats.movies;
    document.getElementById('episodes-count').textContent = monthlyStats.episodes;
    document.getElementById('total-hours-count').textContent = monthlyStats.hours;

    // Update stat cards with percentage changes based on user data
    updateStatCardsWithChanges();
}

// Initialize charts
function initCharts() {
    // Get current theme
    const isDark = document.body.getAttribute('data-theme') === 'dark';

    // Define colors based on theme
    const textColor = isDark ? '#ffffff' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
    const tooltipBg = isDark ? '#1a1f2e' : '#ffffff';
    const tooltipText = isDark ? '#ffffff' : '#0f172a';

    // Monthly Progress Chart with Trend Line - Styled Version
    // Reusing existing variables from initCharts() function

    const monthlyProgressCtx = document.getElementById('monthlyProgressChart').getContext('2d');

    // Calculate monthly progress data (only up to current month)
    function calculateMonthlyProgressData() {
        const monthlyData = Array(12).fill(0);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const animeData = window.animeData || JSON.parse(localStorage.getItem('animeData')) || [];

        animeData.forEach(anime => {
            if (anime.userStatus === 'Completed' && anime.finishDate) {
                const [yearStr, monthStr] = anime.finishDate.split('-');
                const year = parseInt(yearStr, 10);
                const monthIndex = parseInt(monthStr, 10) - 1;

                if (!isNaN(year) && !isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11) {
                    if (year === currentYear && monthIndex <= currentMonth) {
                        monthlyData[monthIndex]++;
                    }
                }
            }
        });

        return monthlyData;
    }

    // Calculate percentage changes between months
    function calculatePercentageChanges(data, currentMonth) {
        const changes = [];
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                changes.push(null);
            } else if (i > currentMonth) {
                changes.push(null);
            } else {
                const prevValue = data[i - 1];
                const currentValue = data[i];
                if (prevValue === 0 && currentValue === 0) {
                    changes.push(0);
                } else if (prevValue === 0) {
                    changes.push(100);
                } else {
                    changes.push(((currentValue - prevValue) / prevValue) * 100);
                }
            }
        }
        return changes;
    }

    // Get segment color based on value change
    function getSegmentColor(p0, p1, dataIndex, currentMonth) {
        if (dataIndex > currentMonth) return 'transparent';
        if (p0 === undefined || p1 === undefined) return '#94A3B8';
        if (p1 > p0) return '#10B981';
        if (p1 < p0) return '#EF4444';
        return '#94A3B8';
    }

    // Get point color based on index and changes
    function getPointColor(index, data, changes, currentMonth) {
        if (index > currentMonth) return 'transparent';
        if (index === 0) return '#94A3B8';
        const change = changes[index];
        if (change === null) return '#94A3B8';
        if (change > 0) return '#10B981';
        if (change < 0) return '#EF4444';
        return '#94A3B8';
    }

    // Destroy existing chart if it exists
    if (window.monthlyProgressChart && typeof window.monthlyProgressChart.destroy === 'function') {
        window.monthlyProgressChart.destroy();
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlyBarData = calculateMonthlyProgressData();
    const totalCompleted = monthlyBarData.reduce((a, b) => a + b, 0);
    const percentageChanges = calculatePercentageChanges(monthlyBarData, currentMonth);

    // Update total anime display
    const totalAnimeSpan = document.getElementById('monthly-total-anime');
    if (totalAnimeSpan) {
        totalAnimeSpan.textContent = `Total Completed: ${totalCompleted}`;
    }

    // Create the chart with enhanced styling
    window.monthlyProgressChart = new Chart(monthlyProgressCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Anime Completed',
                    data: monthlyBarData,
                    backgroundColor: 'rgba(99, 102, 241, 0.75)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    yAxisID: 'y',
                    barPercentage: 0.65,
                    categoryPercentage: 0.8,
                    hoverBackgroundColor: 'rgba(99, 102, 241, 0.9)',
                    hoverBorderColor: 'rgba(99, 102, 241, 1)',
                    cursor: 'pointer',
                },
                {
                    label: 'Trend Line',
                    data: monthlyBarData,
                    type: 'line',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.3,
                    pointRadius: (context) => {
                        const index = context.dataIndex;
                        return index > currentMonth ? 0 : 5;
                    },
                    pointHoverRadius: (context) => {
                        const index = context.dataIndex;
                        return index > currentMonth ? 0 : 8;
                    },
                    pointBackgroundColor: (context) => {
                        const index = context.dataIndex;
                        return getPointColor(index, monthlyBarData, percentageChanges, currentMonth);
                    },
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBorderWidth: 3,
                    pointShadowBlur: 8,
                    pointShadowColor: 'rgba(0, 0, 0, 0.2)',
                    fill: false,
                    yAxisID: 'y',
                    segment: {
                        borderColor: (ctx) => {
                            const p0 = ctx.p0.parsed.y;
                            const p1 = ctx.p1.parsed.y;
                            const dataIndex = ctx.p1DataIndex || ctx.p0DataIndex;
                            return getSegmentColor(p0, p1, dataIndex, currentMonth);
                        },
                        borderWidth: (ctx) => {
                            const dataIndex = ctx.p1DataIndex || ctx.p0DataIndex;
                            return dataIndex > currentMonth ? 0 : 3;
                        },
                        borderDash: (ctx) => {
                            const dataIndex = ctx.p1DataIndex || ctx.p0DataIndex;
                            return dataIndex > currentMonth ? [5, 5] : [];
                        },
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '500',
                            family: "'Inter', sans-serif"
                        },
                        filter: (legendItem) => {
                            // Hide BOTH 'Trend Line' AND 'Anime Completed'
                            return legendItem.text !== 'Trend Line' && legendItem.text !== 'Anime Completed';
                        }
                    }
                },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipText,
                    bodyColor: tooltipText,
                    footerColor: '#A78BFA',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                    titleFont: {
                        size: 13,
                        weight: '600',
                        family: "'Inter', sans-serif"
                    },
                    bodyFont: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    footerFont: {
                        size: 11,
                        weight: '500',
                        family: "'Inter', sans-serif"
                    },
                    callbacks: {
                        title: function (tooltipItems) {
                            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                            const dataIndex = tooltipItems[0].dataIndex;
                            if (dataIndex > currentMonth) {
                                return `${months[dataIndex]} (Upcoming)`;
                            }
                            return months[dataIndex];
                        },
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.raw;
                            const dataIndex = context.dataIndex;

                            if (context.datasetIndex === 1 && dataIndex > currentMonth) {
                                return null;
                            }

                            if (label === 'Anime Completed') {
                                if (dataIndex > currentMonth) {
                                    return `Completed: ${value} anime`;
                                }

                                const percentChange = percentageChanges[dataIndex];
                                if (percentChange !== null && dataIndex > 0 && dataIndex <= currentMonth) {
                                    const isPositive = percentChange > 0;
                                    const arrow = isPositive ? '+' : (percentChange < 0 ? '-' : '●');
                                    const changeText = percentChange > 0
                                        ? `${arrow} ${percentChange.toFixed(1)}% increase`
                                        : percentChange < 0
                                            ? `${arrow} ${Math.abs(percentChange).toFixed(1)}% decrease`
                                            : `● No change`;
                                    return [
                                        `Completed: ${value} anime`,
                                        `Change: ${changeText}`
                                    ];
                                }
                                return `Completed: ${value} anime`;
                            }
                            return null;
                        },
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false,
                        lineWidth: 1,
                        tickLength: 0,
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11,
                            weight: '500',
                            family: "'Inter', sans-serif"
                        },
                        stepSize: 1,
                        precision: 0,
                        padding: 8,
                    },
                    title: {
                        display: true,
                        text: 'Anime Completed',
                        color: textColor,
                        font: {
                            size: 11,
                            weight: '500',
                            family: "'Inter', sans-serif"
                        },
                        padding: { bottom: 10 }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        color: (context) => {
                            const index = context.index;
                            return index > currentMonth ? 'rgba(100, 116, 139, 0.5)' : textColor;
                        },
                        font: {
                            size: 11,
                            weight: '500',
                            family: "'Inter', sans-serif"
                        },
                        padding: 8,
                    },
                    title: {
                        display: true,
                        text: 'Month',
                        color: textColor,
                        font: {
                            size: 11,
                            weight: '500',
                            family: "'Inter', sans-serif"
                        },
                        padding: { top: 10 }
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 15,
                    left: 10,
                    right: 10
                }
            },
            elements: {
                bar: {
                    borderRadius: 8,
                },
                line: {
                    borderJoin: 'round',
                    borderCap: 'round'
                },
                point: {
                    hoverRadius: 8,
                    hoverBorderWidth: 3
                }
            }
        }
    });

    // Function to update chart when data changes
    function updateMonthlyProgressChart() {
        const newData = calculateMonthlyProgressData();
        const newTotal = newData.reduce((a, b) => a + b, 0);
        const newChanges = calculatePercentageChanges(newData, currentMonth);

        if (window.monthlyProgressChart) {
            window.monthlyProgressChart.data.datasets[0].data = newData;
            window.monthlyProgressChart.data.datasets[1].data = newData;

            window.monthlyProgressChart.data.datasets[1].pointBackgroundColor = (context) => {
                const index = context.dataIndex;
                return getPointColor(index, newData, newChanges, currentMonth);
            };

            window.monthlyProgressChart.update();

            const totalSpan = document.getElementById('monthly-total-anime');
            if (totalSpan) {
                totalSpan.textContent = `Total Completed: ${newTotal}`;
            }

            percentageChanges.length = 0;
            newChanges.forEach(c => percentageChanges.push(c));
            monthlyBarData.length = 0;
            newData.forEach(d => monthlyBarData.push(d));
        }
    }

    // Make update function globally available
    window.updateMonthlyProgressChart = updateMonthlyProgressChart;

    // =============================================
    // ENHANCED GENRE DISTRIBUTION CHART WITH TIME FILTERS
    // =============================================

    // Global variables for genre filter
    let currentGenreFilter = 'month'; // month, lastMonth, year, all
    let genreDistributionChart = null; // Will hold the chart instance

    // ========== HELPER FUNCTIONS ==========

    /**
     * Get completion timestamp from anime
     */
    function getAnimeCompletionTime(anime) {
        // Try finishDate first
        if (anime.finishDate) {
            const date = new Date(anime.finishDate);
            if (!isNaN(date.getTime())) return date;
        }
        // Try completedTimestamp
        if (anime.completedTimestamp) {
            return new Date(anime.completedTimestamp);
        }
        // Try updatedAt
        if (anime.updatedAt) {
            const date = new Date(anime.updatedAt);
            if (!isNaN(date.getTime())) return date;
        }
        return null;
    }

    /**
     * Get filtered anime based on time period
     */
    function getFilteredAnimeByTime(filterType) {
        // Only get completed anime
        const completedAnime = animeData.filter(anime => anime.userStatus === 'Completed');

        if (filterType === 'all') {
            return completedAnime;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return completedAnime.filter(anime => {
            const completionDate = getAnimeCompletionTime(anime);
            if (!completionDate) return false;

            switch (filterType) {
                case 'month':
                    // Same month and year
                    return completionDate.getMonth() === currentMonth &&
                        completionDate.getFullYear() === currentYear;

                case 'lastMonth':
                    // Previous month
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return completionDate.getMonth() === lastMonth &&
                        completionDate.getFullYear() === lastMonthYear;

                case 'year':
                    // Same year
                    return completionDate.getFullYear() === currentYear;

                default:
                    return true;
            }
        });
    }

    /**
     * Calculate genre distribution from filtered anime
     */
    function calculateGenreDistributionWithFilter(filteredAnime) {
        const genreCount = {};

        filteredAnime.forEach(anime => {
            if (anime.genres && Array.isArray(anime.genres) && anime.genres.length > 0) {
                anime.genres.forEach(genre => {
                    const cleanGenre = genre.trim();
                    if (cleanGenre) {
                        genreCount[cleanGenre] = (genreCount[cleanGenre] || 0) + 1;
                    }
                });
            }
        });

        return genreCount;
    }

    /**
     * Get human-readable label for current filter
     */
    function getGenreFilterLabel(filterType) {
        const labels = {
            month: 'This Month',
            lastMonth: 'Last Month',
            year: 'This Year',
            all: 'All Time'
        };
        return labels[filterType] || 'This Month';
    }

    /**
     * Update genre chart based on current filter
     */
    function updateGenreChartWithFilter() {
        if (!genreDistributionChart) {
            console.warn('Genre chart not initialized yet');
            return;
        }

        // Get filtered anime based on selected time period
        const filteredAnime = getFilteredAnimeByTime(currentGenreFilter);

        // Calculate genre distribution for filtered anime
        const genreDistribution = calculateGenreDistributionWithFilter(filteredAnime);

        // Get labels and data
        const labels = Object.keys(genreDistribution);
        const data = Object.values(genreDistribution);

        // Handle no data case
        const noDataMessage = document.getElementById('genreNoDataMessage');
        const chartCanvas = document.getElementById('genreDistributionChart');

        if (labels.length === 0) {
            // Show no data message
            if (noDataMessage) noDataMessage.style.display = 'block';
            if (chartCanvas) chartCanvas.style.opacity = '0.5';

            // Update chart with placeholder
            genreDistributionChart.data.labels = ['No Data'];
            genreDistributionChart.data.datasets[0].data = [1];
            genreDistributionChart.data.datasets[0].backgroundColor = ['rgba(100, 100, 100, 0.3)'];
            genreDistributionChart.update();
            return;
        }

        // Hide no data message
        if (noDataMessage) noDataMessage.style.display = 'none';
        if (chartCanvas) chartCanvas.style.opacity = '1';

        // Color palette for genres (preserving your existing colors)
        const colorPalette = [
            '#ef4444', '#3b82f6', '#facc15', '#a855f7', '#10b981',
            '#ec4899', '#f97316', '#6366f1', '#6489e0ff', '#84cc16',
            '#14b8a6', '#c026d3', '#06b6d4', '#e11d48', '#78350f',
            '#22c55e', '#f59e0b', '#9333ea', '#64748b', '#f9e616'
        ];

        // Generate colors for each genre
        const backgroundColors = labels.map((_, index) =>
            colorPalette[index % colorPalette.length]
        );

        // Update chart data
        genreDistributionChart.data.labels = labels;
        genreDistributionChart.data.datasets[0].data = data;
        genreDistributionChart.data.datasets[0].backgroundColor = backgroundColors;

        // Smooth update
        genreDistributionChart.update({
            duration: 400,
            easing: 'easeInOutQuart'
        });
    }

    /**
     * Initialize genre filter buttons
     */
    function initGenreFilters() {
        const filterButtons = document.querySelectorAll('.genre-filter-btn');

        if (filterButtons.length === 0) {
            console.warn('Genre filter buttons not found');
            return;
        }

        // Load saved filter from localStorage
        const savedFilter = localStorage.getItem('genreFilterType');
        if (savedFilter && ['month', 'lastMonth', 'year', 'all'].includes(savedFilter)) {
            currentGenreFilter = savedFilter;
        }

        // Set active button and add click handlers
        filterButtons.forEach(btn => {
            const filterValue = btn.getAttribute('data-filter');
            if (filterValue === currentGenreFilter) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', (e) => {
                const newFilter = btn.getAttribute('data-filter');
                if (!newFilter || newFilter === currentGenreFilter) return;

                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update filter
                currentGenreFilter = newFilter;

                // Save to localStorage
                localStorage.setItem('genreFilterType', currentGenreFilter);

                // Update chart
                updateGenreChartWithFilter();
            });
        });

        // Initial chart update
        updateGenreChartWithFilter();
    }

    // ========== MODIFIED ORIGINAL CHART INITIALIZATION ==========
    // Replace your existing genreDistributionChart initialization with this:

    const genreDistributionCtx = document.getElementById('genreDistributionChart').getContext('2d');
    genreDistributionChart = new Chart(genreDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: [], // Start empty, will be populated by filter
            datasets: [{
                data: [], // Start empty, will be populated by filter
                backgroundColor: [
                    '#ef4444', '#3b82f6', '#facc15', '#a855f7', '#10b981',
                    '#ec4899', '#f97316', '#6366f1', '#6489e0ff', '#84cc16',
                    '#14b8a6', '#c026d3', '#06b6d4', '#e11d48', '#78350f',
                    '#22c55e', '#f59e0b', '#9333ea', '#64748b', '#f9e616'
                ],
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'gray',
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Initialize filters after chart is created
    initGenreFilters();

    // ========== INTEGRATION WITH EXISTING FUNCTIONS ==========

    // Hook into existing updateCharts function if it exists
    const originalUpdateCharts = window.updateCharts || function () { };
    window.updateCharts = function () {
        originalUpdateCharts();
        // Refresh genre chart when other charts update
        if (genreDistributionChart) {
            updateGenreChartWithFilter();
        }
    };

    // Hook into data changes
    const originalUpdateAllComponents = window.updateAllComponents || function () { };
    window.updateAllComponents = function () {
        originalUpdateAllComponents();
        // Refresh genre chart when data changes
        setTimeout(() => {
            if (genreDistributionChart) {
                updateGenreChartWithFilter();
            }
        }, 100);
    };

    // Also update when statistics page becomes active
    document.addEventListener('DOMContentLoaded', () => {
        const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
        if (statsMenuItem) {
            statsMenuItem.addEventListener('click', () => {
                setTimeout(() => {
                    if (genreDistributionChart) {
                        updateGenreChartWithFilter();
                    }
                }, 200);
            });
        }
    });

    console.log('✅ Enhanced Genre Distribution Chart with Time Filters Loaded');

    // Initialize other charts for statistics page
    initStatisticsCharts();
}

// Calculate monthly progress data
function calculateMonthlyProgress() {
    const monthlyData = Array(12).fill(0);
    const now = new Date();
    const currentYear = now.getFullYear();

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const [yearStr, monthStr] = anime.finishDate.split('-');
            const year = parseInt(yearStr, 10);
            const monthIndex = parseInt(monthStr, 10) - 1;

            // Skip invalid months or years in the future
            if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return;

            // Only count anime for the current year
            if (year === currentYear) {
                monthlyData[monthIndex]++;
            }
        }
    });

    return monthlyData;
}

// Calculate genre distribution for current month
function calculateGenreDistribution() {
    const genreCount = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    animeData.forEach(anime => {
        if (anime.genres && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            // Check if anime was completed in current month and year
            if (finishDate.getMonth() === currentMonth &&
                finishDate.getFullYear() === currentYear) {

                anime.genres.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                });
            }
        }
    });

    return genreCount;
}

// Calculate yearly completion - FIXED VERSION
function calculateYearlyCompletion() {
    const currentYear = new Date().getFullYear();

    // Define the years we want to display
    const years = [2024, 2025, 2026, 2027, 2028];
    const yearlyData = [0, 0, 0, 0, 0]; // Index 0=2024, 1=2025, etc.

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed') {
            let completionYear = null;

            // Try to get the completion year from different fields
            if (anime.actualFinishDate) {
                completionYear = parseInt(anime.actualFinishDate.split('-')[0]);
            } else if (anime.finishDate) {
                // finishDate could be "2026-05" or "2026-05-01"
                completionYear = parseInt(anime.finishDate.split('-')[0]);
            } else if (anime.finishTimestamp) {
                completionYear = parseInt(anime.finishTimestamp.split('-')[0]);
            }

            // Find which year index this belongs to
            const yearIndex = years.indexOf(completionYear);
            if (yearIndex !== -1) {
                yearlyData[yearIndex]++;
            }
        }
    });
    return yearlyData;
}

// Calculate score distribution
function calculateScoreDistribution() {
    const scoreRanges = [0, 0, 0, 0, 0, 0]; // 10, 9, 8, 7, 6, 5 or less

    animeData.forEach(anime => {
        if (anime.score) {
            if (anime.score === 10) scoreRanges[0]++;
            else if (anime.score >= 9) scoreRanges[1]++;
            else if (anime.score >= 8) scoreRanges[2]++;
            else if (anime.score >= 7) scoreRanges[3]++;
            else if (anime.score >= 6) scoreRanges[4]++;
            else scoreRanges[5]++;
        }
    });

    return scoreRanges;
}

// Update all charts with current data
function updateCharts() {
    if (monthlyProgressChart) {
        monthlyProgressChart.data.datasets[0].data = calculateMonthlyProgress();
        monthlyProgressChart.update();
    }

    if (genreDistributionChart) {
        const genreData = calculateGenreDistribution();
        genreDistributionChart.data.labels = Object.keys(genreData);
        genreDistributionChart.data.datasets[0].data = Object.values(genreData);

        // Update chart title with current month
        genreDistributionChart.options.plugins.title.text = getCurrentMonth() + ' Distribution';
        genreDistributionChart.update();
    }

    // Update statistics charts if they exist
    if (completionChart) {
        completionChart.data.datasets[0].data = calculateYearlyCompletion();
        completionChart.update();
    }

    if (scoreDistributionChart) {
        scoreDistributionChart.data.datasets[0].data = calculateScoreDistribution();
        scoreDistributionChart.update();
    }

    if (statusDistributionChart) {
        const statusData = calculateStatusDistribution();
        statusDistributionChart.data.labels = Object.keys(statusData);
        statusDistributionChart.data.datasets[0].data = Object.values(statusData);
        statusDistributionChart.update();
    }

    if (typeDistributionChart) {
        const typeData = calculateTypeDistribution();
        typeDistributionChart.data.labels = Object.keys(typeData);
        typeDistributionChart.data.datasets[0].data = Object.values(typeData);
        typeDistributionChart.update();
    }

    if (genreStatsChart) {
        const genreStats = calculateGenreStats();
        genreStatsChart.data.labels = Object.keys(genreStats);
        genreStatsChart.data.datasets[0].data = Object.values(genreStats);
        genreStatsChart.update();
    }

    // Update new charts
    if (episodesOverTimeChart) {
        episodesOverTimeChart.data.datasets[0].data = calculateEpisodesOverTime();
        episodesOverTimeChart.update();
    }

    if (watchTimeByMonthChart) {
        watchTimeByMonthChart.data.datasets[0].data = calculateWatchTimeByMonth();
        watchTimeByMonthChart.update();
    }
}

// Update top rated anime
function updateTopRatedAnime() {
    const topRatedContainer = document.getElementById('top-rated-anime');

    // Filter anime with ratings and sort by rating (highest first)
    const topRatedAnime = animeData
        .filter(anime => anime.score && anime.score >= 8)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

    if (topRatedAnime.length === 0) {
        topRatedContainer.innerHTML = '<div class="no-anime">No highly rated anime yet. Rate some anime to see them here!</div>';
        return;
    }

    topRatedContainer.innerHTML = topRatedAnime.map(anime => `
                <div class="anime-card">
                    <img src="${anime.cover || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}" alt="${anime.title}" class="anime-cover">
                    <div class="anime-info">
                        <div class="anime-title">${anime.title}</div>
                        <div class="anime-meta">
                            <span>${anime.type || 'TV'}</span>
                            <span class="anime-score"> ${anime.score}</span>
                        </div>
                    </div>
                </div>
            `).join('');
}

// Add this variable to track the update interval
let activityUpdateInterval = null;

// Modified updateRecentActivity function with proper time formatting
function updateRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');

    if (!activityContainer) return;

    if (activityLog.length === 0) {
        activityContainer.innerHTML = '<div class="no-activity">No recent activity. Add or update anime to see activity here.</div>';
        return;
    }

    activityContainer.innerHTML = activityLog.slice(0, 6).map(activity => {
        let activityText = '';
        let iconClass = '';
        let iconName = '';

        switch (activity.action) {
            case 'added':
                activityText = `Added ${activity.animeTitle} to your list`;
                iconClass = 'added';
                iconName = 'plus';
                break;
            case 'completed':
                activityText = `Completed ${activity.animeTitle}`;
                iconClass = 'completed';
                iconName = 'check';
                break;
            case 'watching':
                activityText = `Started watching ${activity.animeTitle}`;
                iconClass = 'watching';
                iconName = 'play';
                break;
            case 'edited':
                activityText = `Updated ${activity.animeTitle}`;
                iconClass = 'edited';
                iconName = 'edit';
                break;
            case 'deleted':
                activityText = `Removed ${activity.animeTitle} from your list`;
                iconClass = 'deleted';
                iconName = 'trash';
                break;
            default:
                activityText = `Updated ${activity.animeTitle}`;
                iconClass = 'edited';
                iconName = 'edit';
        }

        return `
            <div class="activity-item" data-timestamp="${activity.timestamp}">
                <div class="activity-icon ${iconClass}">
                    <i class="fas fa-${iconName}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-anime">${escapeHtml(activity.animeTitle)}</div>
                    <div class="activity-desc">${activityText}</div>
                </div>
                <div class="activity-time" data-time="${activity.timestamp}">
                    ${formatTimeAgo(activity.timestamp)}
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Improved formatTimeAgo with more accurate time calculation
function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;

    // Handle invalid dates
    if (isNaN(date.getTime())) return 'Unknown';

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffMins < 2) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 2) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 2) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 2) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths < 2) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears < 2) return '1 year ago';

    return `${diffYears} years ago`;
}

// Function to update all activity times without re-rendering the whole list
function updateActivityTimes() {
    const timeElements = document.querySelectorAll('#recent-activity .activity-time');

    timeElements.forEach(el => {
        const timestamp = el.getAttribute('data-time');
        if (timestamp) {
            const newTimeText = formatTimeAgo(timestamp);
            if (el.textContent !== newTimeText) {
                el.textContent = newTimeText;
            }
        }
    });
}

// Start automatic time updates for activities
function startActivityTimeUpdates() {
    // Clear existing interval if any
    if (activityUpdateInterval) {
        clearInterval(activityUpdateInterval);
    }

    // Update times every 60 seconds
    activityUpdateInterval = setInterval(() => {
        // Only update if the activities are visible on screen
        const recentActivityElement = document.getElementById('recent-activity');
        if (recentActivityElement && recentActivityElement.offsetParent !== null) {
            updateActivityTimes();
        }
    }, 60000); // Update every minute
}

// Stop activity time updates (call this if needed)
function stopActivityTimeUpdates() {
    if (activityUpdateInterval) {
        clearInterval(activityUpdateInterval);
        activityUpdateInterval = null;
    }
}

// Modified logActivity function with better timestamp handling
function logActivity(action, animeTitle, timestamp) {
    const activity = {
        id: Date.now(),
        action,
        animeTitle,
        timestamp: timestamp || new Date().toISOString()
    };

    activityLog.unshift(activity);

    // Keep only the last 50 activities
    if (activityLog.length > 50) {
        activityLog = activityLog.slice(0, 50);
    }

    localStorage.setItem('activityLog', JSON.stringify(activityLog));
    updateRecentActivity();

    // Dispatch custom event for any other components that might need to know
    window.dispatchEvent(new CustomEvent('activityLogged', { detail: activity }));
}

// Optional: Add visibility change detection to update times when tab becomes active
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Tab became visible, update times immediately
        updateActivityTimes();
    }
});

// Initialize activity time updates when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    startActivityTimeUpdates();

    // Also update times when returning to dashboard page
    const dashboardMenuItem = document.querySelector('.menu-item[data-page="dashboard"]');
    if (dashboardMenuItem) {
        dashboardMenuItem.addEventListener('click', () => {
            setTimeout(updateActivityTimes, 100);
        });
    }
});

// =============================================
// MAKE EDIT ANIME GLOBALLY AVAILABLE
// =============================================

// Edit anime - Shows existing dates properly
function editAnime(id) {
    const anime = animeData.find(a => a.id == id);
    if (!anime) return;

    isEditing = true;
    currentEditId = id;

    // Populate form with anime data
    const animeIdInput = document.getElementById('animeId');
    const animeTitle = document.getElementById('animeTitle');
    const animeType = document.getElementById('animeType');
    const animeEpisodes = document.getElementById('animeEpisodes');
    const animeDuration = document.getElementById('animeDuration');
    const animeStatus = document.getElementById('animeStatus');
    const animeProgress = document.getElementById('animeProgress');
    const animeScore = document.getElementById('animeScore');
    const animeCover = document.getElementById('animeCover');
    const animeGenres = document.getElementById('animeGenres');
    const animeYear = document.getElementById('animeYear');
    const animeMonth = document.getElementById('animeMonth');
    const durationInput = document.getElementById('animeDuration');
    const submitButton = document.getElementById('submitBtn');
    const deleteButton = document.getElementById('deleteBtn');
    const addModal = document.getElementById('addAnimeModal');
    const searchResultsDiv = document.getElementById('searchResults');

    if (animeIdInput) animeIdInput.value = anime.id;
    if (animeTitle) animeTitle.value = anime.title;
    if (animeType) animeType.value = anime.type;
    if (animeEpisodes) animeEpisodes.value = anime.episodes;
    if (animeDuration) animeDuration.value = anime.duration || (anime.type === 'Movie' ? 120 : 20);
    if (animeStatus) animeStatus.value = anime.userStatus;
    if (animeProgress) animeProgress.value = anime.progress;
    if (animeScore) animeScore.value = anime.score || '';
    if (animeCover) animeCover.value = anime.cover || '';
    if (animeGenres) animeGenres.value = anime.genres ? anime.genres.join(', ') : '';

    // Set finish date if exists - extract year and month for display
    if (anime.finishDate && animeYear && animeMonth) {
        const [year, month] = anime.finishDate.split('-');
        animeYear.value = year;
        animeMonth.value = month;
    } else if (animeYear && animeMonth) {
        // Set current date as default
        const now = new Date();
        animeYear.value = now.getFullYear().toString();
        animeMonth.value = (now.getMonth() + 1).toString().padStart(2, '0');
    }

    // Set duration input readonly based on type
    if (durationInput) {
        if (anime.type === 'Movie') {
            durationInput.readOnly = false;
        } else {
            durationInput.readOnly = true;
        }
    }

    // Update button text and show delete button
    if (submitButton) submitButton.textContent = 'Update Anime';
    if (deleteButton) deleteButton.style.display = 'inline-block';

    // Show modal
    if (addModal) addModal.style.display = 'flex';

    // Close search results if open
    if (searchResultsDiv) searchResultsDiv.style.display = 'none';
}

// Make editAnime available globally for click handlers
window.editAnime = editAnime;

// =============================================
// DELETE ANIME FUNCTION
// =============================================

// Delete anime - Fixed version
function deleteAnime() {
    if (!currentEditId) return;

    if (!confirm('Are you sure you want to delete this anime?')) return;

    const anime = animeData.find(a => a.id == currentEditId);
    if (anime) {
        logActivity("deleted", anime.title);
    }

    animeData = animeData.filter(a => a.id != currentEditId);
    saveData();
    try { window.dispatchEvent(new Event('xpUpdated')); } catch (e) { /* ignore */ }

    const addModal = document.getElementById('addAnimeModal');
    const animeFormElement = document.getElementById('addAnimeForm');
    const searchResultsDiv = document.getElementById('searchResults');
    const submitButton = document.getElementById('submitBtn');
    const deleteButton = document.getElementById('deleteBtn');
    const statusFilter = document.getElementById('statusFilter');

    if (addModal) addModal.style.display = 'none';
    if (animeFormElement) animeFormElement.reset();
    if (searchResultsDiv) {
        searchResultsDiv.style.display = 'none';
        searchResultsDiv.innerHTML = '';
    }

    isEditing = false;
    currentEditId = null;
    if (submitButton) submitButton.textContent = 'Add Anime';
    if (deleteButton) deleteButton.style.display = 'none';

    // Reset filters to show all statuses
    if (statusFilter) statusFilter.value = 'all';

    // Refresh everything
    updateAllComponents();

    showToast('Anime deleted successfully!', 'success');
}

// Make deleteAnime available globally
window.deleteAnime = deleteAnime;

// =============================================
// UPDATE ANIME TABLE VIEW WITH WORKING CLICKS
// =============================================

// Update anime table view - Shows Month Year only, full date on hover
function updateAnimeTableView(animeList) {
    const tableBody = document.getElementById('anime-table-body');
    if (!tableBody) return;

    if (animeList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-anime">
                    No anime found matching your filters. Add some anime to get started!
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = animeList.map(anime => {
        let statusClass = '';
        const statusText = anime.userStatus || 'Unknown';
        switch (anime.userStatus) {
            case 'Completed': statusClass = 'badge-completed'; break;
            case 'Watching': statusClass = 'badge-watching'; break;
            case 'Plan to Watch': statusClass = 'badge-plan'; break;
            case 'Dropped': statusClass = 'badge-dropped'; break;
            default: statusClass = 'badge-plan';
        }

        // Format completion date - Show only Month Year in table
        let completionDate = '-';
        let completionTooltip = '';

        if (anime.userStatus === 'Completed') {
            // Use finishDate (YYYY-MM) for display in table
            if (anime.finishDate && anime.finishDate.length >= 7) {
                const [year, month] = anime.finishDate.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                completionDate = `${monthNames[parseInt(month) - 1]} ${year}`;
            }

            // Use actualFinishDate for tooltip (exact date)
            if (anime.actualFinishDate) {
                const actualParts = anime.actualFinishDate.split('-');
                if (actualParts.length >= 3) {
                    const [year, month, day] = actualParts;
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    completionTooltip = `Completed on: ${monthNames[parseInt(month) - 1]} ${year}`;
                }
            } else if (anime.finishDate) {
                // Fallback if no actualFinishDate
                completionTooltip = `Completed in: ${completionDate}`;
            }
        }

        const progress = anime.progress || 0;
        const episodes = anime.episodes || 0;
        const progressPercentage = episodes > 0 ? Math.round((progress / episodes) * 100) : 0;

        const progressBar = `
            <div class="progress-wrapper">
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
                <small>${progress}/${episodes || '?'} (${progressPercentage}%)</small>
            </div>
        `;

        const scoreDisplay = anime.score
            ? `<span class="anime-score">${anime.score.toFixed(1)}</span>`
            : '-';

        const safeTitle = anime.title.length > 35 ? anime.title.slice(0, 35) + '...' : anime.title;
        const escapedTitle = safeTitle.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        // Format creation date for tooltip
        let creationTooltip = '';
        if (anime.createdAt) {
            const parts = anime.createdAt.split(' ')[0].split('-');
            if (parts.length >= 3) {
                const [year, month, day] = parts;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                creationTooltip = `Added on: ${monthNames[parseInt(month) - 1]} ${year}`;
            }
        }

        // Combine tooltips
        const combinedTooltip = [creationTooltip, completionTooltip].filter(Boolean).join(' | ');

        const titleWithCover = `
            <div class="anime-title-cell" title="${combinedTooltip.replace(/"/g, '&quot;')}">
                <img src="${anime.cover || 'https://via.placeholder.com/50x70/6a5acd/ffffff?text=No+Image'}"
                     alt="${escapedTitle}" class="anime-cover"
                     onerror="this.src='https://placehold.co/50x70/6a5acd/white?text=No+Image'">
                <div class="anime-info">
                    <div class="anime-title" title="${escapedTitle}">${safeTitle}</div>
                    ${anime.genres && anime.genres.length > 0
                ? `<div class="anime-genres">${anime.genres.slice(0, 3).join(', ').replace(/"/g, '&quot;')}</div>`
                : ''}
                </div>
            </div>
        `;

        return `
            <tr data-id="${anime.id}" style="cursor: pointer;">
                <td>${titleWithCover}</td>
                <td>${anime.type || 'TV'}</td>
                <td>${progressBar}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${scoreDisplay}</td>
                <td><span title="${completionTooltip.replace(/"/g, '&quot;')}">${completionDate}</span></td>
            </tr>
        `;
    }).join('');

    // Remove any existing click handler to avoid duplicates
    if (tableBody._clickHandler) {
        tableBody.removeEventListener('click', tableBody._clickHandler);
    }

    // Add click event listener using event delegation
    const clickHandler = function (e) {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;

        if (e.target.closest('.progress-wrapper') ||
            e.target.closest('.badge') ||
            e.target.closest('a') ||
            e.target.closest('button')) {
            return;
        }

        const animeId = row.getAttribute('data-id');
        if (animeId && typeof window.editAnime === 'function') {
            window.editAnime(animeId);
        }
    };

    tableBody.addEventListener('click', clickHandler);
    tableBody._clickHandler = clickHandler;
}

// =============================================
// UPDATE ANIME DISPLAY (Calls the table update)
// =============================================

// Update anime display with filters
function updateAnimeDisplay() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const sortFilter = document.getElementById('sortFilter')?.value || 'id';
    const monthFilter = document.getElementById('monthFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';

    let filteredAnime = [...animeData];

    // Month/year filtering logic
    if (monthFilter !== 'all' || yearFilter !== 'all') {
        filteredAnime = filteredAnime.filter(anime => {
            const dateToCheck = anime.finishDate || anime.updatedAt || anime.createdAt;
            if (!dateToCheck) return false;

            const parts = dateToCheck.split('-');
            if (parts.length < 2) return false;

            const [year, month] = parts;

            if (monthFilter !== 'all' && month !== monthFilter) return false;
            if (yearFilter !== 'all' && year !== yearFilter) return false;

            if (statusFilter === 'all') return true;
            return anime.userStatus === statusFilter;
        });
    } else {
        // Apply only status filter if no month/year filter
        if (statusFilter !== 'all') {
            filteredAnime = filteredAnime.filter(a => a.userStatus === statusFilter);
        }
    }

    // Sorting logic
    if (sortFilter === 'title') {
        filteredAnime.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortFilter === 'rating') {
        filteredAnime.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortFilter === 'episodes') {
        filteredAnime.sort((a, b) => (b.episodes || 0) - (a.episodes || 0));
    } else if (sortFilter === 'updated') {
        filteredAnime.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }

    // Update the anime counter
    const countEl = document.getElementById('anime-count');
    if (countEl) {
        countEl.textContent = `Total Anime: ${filteredAnime.length}`;
    }

    // Update the anime table
    updateAnimeTableView(filteredAnime);
}

function handleAddAnime(e) {
    e.preventDefault();

    const title = document.getElementById('animeTitle')?.value.trim();
    const type = document.getElementById('animeType')?.value || 'TV';
    const episodes = parseInt(document.getElementById('animeEpisodes')?.value, 10) || 0;
    const duration = parseInt(document.getElementById('animeDuration')?.value, 10) || (type === 'Movie' ? 120 : 20);
    const status = document.getElementById('animeStatus')?.value || 'Plan to Watch';
    const progress = parseInt(document.getElementById('animeProgress')?.value, 10) || 0;
    const scoreValue = document.getElementById('animeScore')?.value;
    const score = scoreValue ? parseFloat(scoreValue) : null;
    const cover = document.getElementById('animeCover')?.value || '';
    const genres = (document.getElementById('animeGenres')?.value || '')
        .split(',')
        .map(genre => genre.trim())
        .filter(Boolean);

    const selectedYear = document.getElementById('animeYear')?.value;
    const selectedMonth = document.getElementById('animeMonth')?.value;

    const getNepalTimestamp = () => {
        const now = new Date();
        const nepalOffset = 5 * 60 + 45;
        const utcOffset = now.getTimezoneOffset();
        const nepalTime = new Date(now.getTime() + (nepalOffset + utcOffset) * 60 * 1000);
        const year = nepalTime.getFullYear();
        const month = String(nepalTime.getMonth() + 1).padStart(2, '0');
        const day = String(nepalTime.getDate()).padStart(2, '0');
        const hours = String(nepalTime.getHours()).padStart(2, '0');
        const minutes = String(nepalTime.getMinutes()).padStart(2, '0');
        const seconds = String(nepalTime.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const getNextId = () => {
        if (animeData.length === 0) return 1;
        const maxId = Math.max(...animeData.map(a => parseInt(a.id) || 0));
        return maxId + 1;
    };

    const existingAnime = animeData.find(a => a.id == currentEditId);
    const nowTimestamp = getNepalTimestamp();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');

    let wasCompletedBefore = existingAnime?.userStatus === 'Completed';
    let isNowCompleted = status === 'Completed';
    let statusChangedToCompleted = isEditing && !wasCompletedBefore && isNowCompleted;
    let statusChangedFromCompleted = isEditing && wasCompletedBefore && !isNowCompleted;

    // Track if this is a new anime being added
    const isNewAnime = !existingAnime;
    const isStartingToWatch = !isEditing && status === 'Watching';

    // ============================================
    // CREATE FEED ACTIVITY FOR STARTED WATCHING
    // ============================================
    if (isNewAnime && status === 'Watching') {
        feedOnStartedWatching(title, progress || 1);
        console.log(`📰 Feed: ${title} started watching`);
    }

    // Also handle when editing and status changes to Watching (not from Completed)
    if (isEditing && !wasCompletedBefore && status === 'Watching' && existingAnime?.userStatus !== 'Watching') {
        feedOnStartedWatching(title, progress || 1);
        console.log(`📰 Feed: ${title} started watching (updated)`);
    }

    // ============================================
    // CREATE FEED ACTIVITY WHEN ANIME IS COMPLETED
    // ============================================
    if (statusChangedToCompleted) {
        // Calculate XP earned
        let xpEarned = 0;
        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.calculateExpFromParts === 'function') {
            const xp = window.AniPulseLevelSystem.calculateExpFromParts({
                episodes: episodes,
                progress: episodes,
                duration: duration,
                type: type,
                score: score,
                hasScore: !!score
            });
            xpEarned = xp + 10;
        } else {
            const episodeBonus = Math.floor(episodes / 2);
            const scoreBonus = score ? (score >= 9 ? 8 : score >= 8 ? 5 : score >= 7 ? 3 : 0) : 0;
            xpEarned = episodeBonus + scoreBonus + 10;
        }

        // Create feed activity for completed anime
        feedOnAnimeCompleted(title, episodes, score, xpEarned);
        console.log(`📰 Feed: ${title} completed (${episodes} episodes, ${xpEarned} XP)`);
    }

    // ============================================
    // FIXED: Handle finish date - PRESERVE existing completed dates
    // ============================================
    let finishDate = null;
    let actualFinishDate = null;

    if (status === 'Completed') {
        if (existingAnime && existingAnime.userStatus === 'Completed' && existingAnime.finishDate) {
            actualFinishDate = existingAnime.actualFinishDate;
            finishDate = existingAnime.finishDate;
            console.log(`📅 Preserved original completion date for ${title}: ${finishDate}`);
        }
        else if (existingAnime && isEditing && existingAnime.actualFinishDate) {
            actualFinishDate = existingAnime.actualFinishDate;
            finishDate = existingAnime.finishDate || actualFinishDate.substring(0, 7);
        }
        else if (selectedYear && selectedMonth && !existingAnime) {
            const year = selectedYear;
            const month = String(selectedMonth).padStart(2, '0');
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            actualFinishDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
            finishDate = `${year}-${month}`;
        }
        else {
            actualFinishDate = `${currentYear}-${currentMonth}-${currentDay}`;
            finishDate = `${currentYear}-${currentMonth}`;
        }
    } else {
        if (!existingAnime) {
            finishDate = null;
            actualFinishDate = null;
        }
    }

    // Determine toast message
    let toastMessage = '';
    let logAction = '';

    if (!isEditing) {
        if (status === 'Completed') {
            toastMessage = ` "${title}" added and marked as completed!`;
            logAction = 'completed';
        } else {
            toastMessage = ` "${title}" added to your ${status === 'Watching' ? 'watching' : 'plan to watch'} list!`;
            logAction = 'added';
        }
    } else if (isEditing) {
        if (statusChangedToCompleted) {
            toastMessage = ` "${title}" marked as completed! Great job!`;
            logAction = 'completed';
        } else if (statusChangedFromCompleted) {
            toastMessage = ` "${title}" updated (Completed → ${status})`;
            logAction = 'edited';
        } else if (existingAnime.title !== title) {
            toastMessage = ` "${existingAnime.title}" renamed to "${title}"`;
            logAction = 'edited';
        } else {
            toastMessage = ` "${title}" updated successfully!`;
            logAction = 'edited';
        }
    }

    if (existingAnime && isEditing) {
        existingAnime.title = title;
        existingAnime.type = type;
        existingAnime.episodes = episodes;
        existingAnime.duration = duration;
        existingAnime.userStatus = status;
        existingAnime.progress = progress;
        existingAnime.score = score;
        existingAnime.cover = cover;
        existingAnime.genres = genres;

        if (!existingAnime.finishDate && finishDate) {
            existingAnime.finishDate = finishDate;
            existingAnime.actualFinishDate = actualFinishDate;
        }

        existingAnime.updatedAt = nowTimestamp;
    } else {
        const newAnime = {
            id: getNextId(),
            title,
            type,
            episodes,
            duration,
            userStatus: status,
            progress,
            score,
            cover,
            genres,
            finishDate: finishDate,
            actualFinishDate: actualFinishDate,
            createdAt: nowTimestamp,
            updatedAt: nowTimestamp
        };
        animeData.push(newAnime);
    }

    saveData();
    logActivity(logAction, title);

    // Close modal and reset
    const addAnimeModal = document.getElementById('addAnimeModal');
    const animeForm = document.getElementById('addAnimeForm');
    const searchResults = document.getElementById('searchResults');
    const submitBtn = document.getElementById('submitBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    if (addAnimeModal) addAnimeModal.style.display = 'none';
    if (animeForm) animeForm.reset();
    if (searchResults) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
    }

    isEditing = false;
    currentEditId = null;
    if (submitBtn) submitBtn.textContent = 'Add Anime';
    if (deleteBtn) deleteBtn.style.display = 'none';

    saveData();
    updateAllComponents();
    showToast(toastMessage, 'success');
}

// ============================================
// FEED ACTIVITY FUNCTIONS
// ============================================

function createFeedActivity(type, data) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    fetch('http://localhost:3000/api/feed/create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data })
    }).catch(error => {
        console.error('Failed to create feed activity:', error);
    });
}

function feedOnAnimeCompleted(animeTitle, episodes, score, xpEarned) {
    createFeedActivity('completed_anime', {
        animeTitle: animeTitle,
        episodes: episodes,
        score: score || 0,
        xpEarned: xpEarned
    });
}

function feedOnStartedWatching(animeTitle, episodeStart) {
    createFeedActivity('started_watching', {
        animeTitle: animeTitle,
        episodeStart: episodeStart || 1
    });
}

function feedOnAddedAnime(animeTitle, status) {
    createFeedActivity('added_anime', {
        animeTitle: animeTitle,
        status: status
    });
}

function feedOnLevelUp(level, title) {
    createFeedActivity('level_up', {
        level: level,
        title: title
    });
}

function feedOnAchievement(achievementName) {
    createFeedActivity('achievement', {
        achievement: achievementName
    });
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('animeData', JSON.stringify(animeData));
}
function updateAllComponents() {
    updateStats();
    updateCharts();
    refreshAllCharts();
    updateCurrentMonthAnime();
    updateAnimeDisplay();
    updateTotalAnimeCountAllMonths();
    updateSidebarUserInfo();

    const dashboardPage = document.getElementById('dashboard-page');

    // ✅ ONLY run on dashboard
    if (dashboardPage && dashboardPage.classList.contains('active')) {
        updateTopRatedAnime();
        updateRecentActivity();
    }

    // ✅ Statistics page
    if (document.getElementById('statistics-page').classList.contains('active')) {
        initStatisticsCharts();
        updateStatisticsTables();
    }

    // Other global updates
    if (typeof updateEpisodesOverTimeDisplay === "function") {
        const currentYear = new Date().getFullYear();
        updateEpisodesOverTimeDisplay(currentYear);
    }

    if (typeof updateCurrentlyWatching === "function") {
        updateCurrentlyWatching();
    }

    if (typeof renderActivityHeatmap === "function") {
        renderActivityHeatmap(animeData);
    }
}

// JSON + PDF Export
function exportData() {
    if (!animeData.length) {
        showToast("No data to export.", "error");
        return;
    }

    // Export JSON
    const blob = new Blob([JSON.stringify(animeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'My Anime List.json';
    link.click();
    URL.revokeObjectURL(url);

    showToast('Data exported successfully!', 'success');
}

// Import JSON File
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error("Invalid file format");

            animeData = imported;
            localStorage.setItem('animeData', JSON.stringify(animeData));

            // Log import activity
            logActivity("imported", "anime collection");

            updateAllComponents();

            importModal.style.display = 'none';
            showToast("Import successful!", "success");
        } catch (err) {
            showToast("Import failed: " + err.message, "error");
        }
    };
    reader.readAsText(file);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    updateThemeToggleIcon(newTheme);

    // Save theme preference
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    settings.theme = newTheme;
    localStorage.setItem('appSettings', JSON.stringify(settings));
}

// Update theme toggle icon
function updateThemeToggleIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Show toast notification
function showToast(message, type = 'info', customClass = '') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type} ${customClass}`;
    toast.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : type === 'warning' ? 'exclamation-triangle' : 'info'}-circle"></i>
                <span>${message}</span>
            `;

    toastContainer.appendChild(toast);

    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Utility functions
function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('appSettings') ?
        JSON.parse(localStorage.getItem('appSettings')).theme : 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = now.toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = formattedDate;
}

// =============================================
// USER NAME MANAGEMENT - COMPLETE FIX
// =============================================

// Get user name from localStorage (checks multiple locations)
function getUserName() {
    // First check userProfile (used by settings page)
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));
    if (userProfile && userProfile.name) {
        return userProfile.name;
    }

    // Then check legacy userName
    const userName = localStorage.getItem('userName');
    if (userName) {
        return userName;
    }

    return null;
}

// Set user name (saves to both locations for consistency)
function setUserName(name) {
    if (!name || name.trim() === '') {
        name = 'Otaku';
    }

    const trimmedName = name.trim();

    // Save to legacy location
    localStorage.setItem('userName', trimmedName);

    // Save to userProfile (used by settings)
    let userProfile = JSON.parse(localStorage.getItem('userProfile'));
    if (!userProfile) {
        userProfile = {
            name: trimmedName,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=6a5acd&color=fff`
        };
    } else {
        userProfile.name = trimmedName;
    }
    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    // Update all displays
    updateUserNameDisplay(trimmedName);
    updateGreetingMessage();
    updateSidebarUserInfo();

    return trimmedName;
}

// Update user name display everywhere
function updateUserNameDisplay(name) {
    // Update top bar user avatar
    const userAvatar = document.querySelector('.user-profile .user-avatar');
    if (userAvatar) {
        const encodedName = encodeURIComponent(name);
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=6a5acd&color=fff`;
        userAvatar.alt = name;
    }

    // Update top bar username text
    const topUserName = document.querySelector('.user-profile span');
    if (topUserName) {
        topUserName.textContent = name;
    }

    // Update tooltip
    const tooltip = document.querySelector('.user-profile .tooltip');
    if (tooltip) {
        tooltip.textContent = name;
    }

    // Update sidebar username
    const sidebarUsername = document.querySelector('.sidebar-username');
    if (sidebarUsername) {
        sidebarUsername.textContent = name;
    }

    // Update sidebar avatar
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    if (sidebarAvatar) {
        const encodedName = encodeURIComponent(name);
        sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=6a5acd&color=fff`;
        sidebarAvatar.alt = name;
    }

    // Update settings page input
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput && usernameInput.value !== name) {
        usernameInput.value = name;
    }

    // Update profile preview in settings
    const profilePreviewName = document.getElementById('profilePreviewName');
    if (profilePreviewName) {
        profilePreviewName.textContent = name;
    }

    // Update profile preview avatar
    const profilePreviewAvatar = document.getElementById('profilePreviewAvatar');
    if (profilePreviewAvatar) {
        const encodedName = encodeURIComponent(name);
        profilePreviewAvatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=6a5acd&color=fff`;
    }
}

// Update greeting message with user's name
function updateGreetingMessage() {
    const userName = getUserName();
    const greetingLine = document.querySelector('.greeting-line');

    if (greetingLine) {
        const hour = new Date().getHours();
        let timeGreeting = '';

        if (hour < 12) timeGreeting = 'Good Morning';
        else if (hour < 17) timeGreeting = 'Good Afternoon';
        else timeGreeting = 'Good Evening';

        if (userName && userName !== 'AnimeFan94' && userName !== 'AnimeFan') {
            greetingLine.innerHTML = `${timeGreeting}, ${userName}! <span class="greeting-emoji">👋</span>`;
        } else {
            greetingLine.innerHTML = `${timeGreeting}, Otaku! <span class="greeting-emoji">👋</span>`;
        }
    }
}

// Show name entry modal
function showNameEntryModal() {
    const nameEntryModal = document.getElementById('nameEntryModal');
    if (nameEntryModal) {
        nameEntryModal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Clear input and focus
        const input = document.getElementById('userNameInput');
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 100);
        }
    }
}

// Hide name entry modal
function hideNameEntryModal() {
    const nameEntryModal = document.getElementById('nameEntryModal');
    if (nameEntryModal) {
        nameEntryModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Initialize user name on app start
function initializeUserName() {
    const savedName = getUserName();

    // Check if modal has been shown in this session
    const modalShown = sessionStorage.getItem('nameModalShown');

    if (!savedName && !modalShown) {
        // First time - show modal
        setTimeout(() => {
            showNameEntryModal();
            sessionStorage.setItem('nameModalShown', 'true');
        }, 500);
    } else if (savedName) {
        // Use saved name
        updateUserNameDisplay(savedName);
        updateGreetingMessage();
    } else {
        // Fallback - set default
        setUserName('Otaku');
        updateGreetingMessage();
    }
}

// Handle name entry form submission
function initNameEntryForm() {
    const form = document.getElementById('nameEntryForm');
    if (!form) return;

    // Remove existing listener to avoid duplicates
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const userNameInput = document.getElementById('userNameInput');
        let name = userNameInput ? userNameInput.value.trim() : '';

        if (name && name.length > 0) {
            setUserName(name);
            showToast(`Welcome, ${name}! 🎉`, 'success');
        } else {
            setUserName('Otaku');
            showToast('Welcome, Otaku! 🎉', 'success');
        }

        hideNameEntryModal();

        // Refresh all components
        setTimeout(() => {
            if (typeof updateAllComponents === 'function') {
                updateAllComponents();
            }
            updateGreetingMessage();
        }, 100);
    });

    // Allow Enter key to submit
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
        nameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                newForm.dispatchEvent(new Event('submit'));
            }
        });
    }
}

// Close modal when clicking on backdrop or close button
function initModalCloseHandlers() {
    const modal = document.getElementById('nameEntryModal');
    if (!modal) return;

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            const nameInput = document.getElementById('userNameInput');
            const name = nameInput ? nameInput.value.trim() : '';
            if (name) {
                setUserName(name);
            } else {
                setUserName('Otaku');
            }
            hideNameEntryModal();
            showToast('Welcome!', 'success');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            const nameInput = document.getElementById('userNameInput');
            const name = nameInput ? nameInput.value.trim() : '';
            if (name) {
                setUserName(name);
            } else {
                setUserName('Otaku');
            }
            hideNameEntryModal();
            showToast('Welcome!', 'success');
        }
    });
}

// Sync settings page with user name
function initSettingsNameSync() {
    const usernameInput = document.getElementById('usernameInput');
    if (!usernameInput) return;

    // Set initial value
    const currentName = getUserName();
    if (currentName) {
        usernameInput.value = currentName;
    }

    // Listen for changes
    usernameInput.addEventListener('change', function () {
        const newName = this.value.trim();
        if (newName && newName.length > 0) {
            setUserName(newName);
            showToast(`Name updated to ${newName}`, 'success');
        } else {
            // Reset to current name if empty
            const current = getUserName();
            this.value = current || 'Otaku';
        }
    });
}

// Override the existing updateSidebarUserInfo to include name sync
const originalUpdateSidebarUserInfo = window.updateSidebarUserInfo;
if (typeof originalUpdateSidebarUserInfo === 'function') {
    window.updateSidebarUserInfo = function () {
        originalUpdateSidebarUserInfo();
        const userName = getUserName();
        if (userName) {
            const sidebarUsername = document.querySelector('.sidebar-username');
            if (sidebarUsername) sidebarUsername.textContent = userName;
        }
    };
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Initialize name system FIRST
    initializeUserName();
    initNameEntryForm();
    initModalCloseHandlers();
    initSettingsNameSync();

    // Update greeting after a short delay
    setTimeout(() => {
        updateGreetingMessage();
    }, 100);
});

// =============================================
// COMPLETE FIXED STATISTICS CHARTS
// =============================================

// Get current month name
function getCurrentMonth() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return months[now.getMonth()];
}

// Update statistics tables
function updateStatisticsTables() {
    const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
    
    // Calculate statistics
    const totalAnime = animeData.length;
    const completedAnime = animeData.filter(a => a.userStatus === 'Completed').length;
    const totalHours = calculateTotalHours();
    const avgScore = calculateAverageScore();
    const completionRate = totalAnime > 0 ? Math.round((completedAnime / totalAnime) * 100) : 0;
    
    // Update overview cards
    const totalAnimeStats = document.getElementById('total-anime-stats');
    const totalHoursStats = document.getElementById('total-hours-stats');
    const avgScoreStats = document.getElementById('avg-score-stats');
    const completionRateEl = document.getElementById('completion-rate');
    
    if (totalAnimeStats) totalAnimeStats.textContent = totalAnime;
    if (totalHoursStats) totalHoursStats.textContent = totalHours;
    if (avgScoreStats) avgScoreStats.textContent = avgScore;
    if (completionRateEl) completionRateEl.textContent = completionRate + '%';
    
    // Update yearly breakdown
    const yearlyBreakdownEl = document.getElementById('yearlyBreakdown');
    if (yearlyBreakdownEl) {
        const yearlyData = {};
        const currentYear = new Date().getFullYear();
        for (let year = 2020; year <= currentYear; year++) yearlyData[year] = 0;
        
        animeData.forEach(anime => {
            if (anime.finishDate) {
                const finishYear = new Date(anime.finishDate).getFullYear();
                if (yearlyData.hasOwnProperty(finishYear)) yearlyData[finishYear]++;
            }
        });
        
        const maxCount = Math.max(...Object.values(yearlyData), 1);
        yearlyBreakdownEl.innerHTML = Object.entries(yearlyData)
            .filter(([_, count]) => count > 0 || parseInt(_) === currentYear)
            .map(([year, count]) => `
                <div class="stat-row">
                    <div class="stat-label-small">${year}</div>
                    <div class="stat-progress">
                        <div class="stat-progress-bar" style="width: ${(count / maxCount) * 100}%"></div>
                    </div>
                    <div class="stat-value-small">${count}</div>
                </div>
            `).join('');
    }
    
    // Update score analysis
    const scoreAnalysisEl = document.getElementById('scoreAnalysis');
    if (scoreAnalysisEl) {
        const ratedAnime = animeData.filter(a => a.score && a.score > 0);
        const avgScoreVal = ratedAnime.length > 0 ? (ratedAnime.reduce((s, a) => s + a.score, 0) / ratedAnime.length).toFixed(1) : 0;
        const highest = ratedAnime.sort((a, b) => b.score - a.score)[0];
        const lowest = ratedAnime.sort((a, b) => a.score - b.score)[0];
        
        scoreAnalysisEl.innerHTML = `
            <div class="stat-row">
                <div class="stat-label-small">Rated Anime</div>
                <div class="stat-value-small">${ratedAnime.length}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Average Score</div>
                <div class="stat-value-small">${avgScoreVal}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Highest Rated</div>
                <div class="stat-value-small">${highest ? highest.score + ' (' + highest.title + ')' : 'N/A'}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Lowest Rated</div>
                <div class="stat-value-small">${lowest ? lowest.score + ' (' + lowest.title + ')' : 'N/A'}</div>
            </div>
        `;
    }
}

// Calculate average score helper
function calculateAverageScore() {
    const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
    const ratedAnime = animeData.filter(anime => anime.score && anime.score > 0);
    if (ratedAnime.length === 0) return 0;
    const totalScore = ratedAnime.reduce((sum, anime) => sum + anime.score, 0);
    return (totalScore / ratedAnime.length).toFixed(1);
}

// Calculate monthly stats based on actualFinishDate
function calculateMonthlyStats() {
    const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthlyHours = 0;
    let monthlyCompleted = 0;
    let monthlyMovies = 0;
    let monthlyEpisodes = 0;

    animeData.forEach(anime => {
        // Only count completed anime
        if (anime.userStatus !== 'Completed') return;
        
        // Get completion date - prioritize actualFinishDate
        let completionDate = null;
        if (anime.actualFinishDate) {
            completionDate = new Date(anime.actualFinishDate);
        } else if (anime.finishDate) {
            completionDate = new Date(anime.finishDate);
        }
        
        // Check if anime was completed this month
        if (completionDate && 
            !isNaN(completionDate.getTime()) &&
            completionDate.getMonth() === currentMonth &&
            completionDate.getFullYear() === currentYear
        ) {
            // Calculate hours
            if (anime.type === 'Movie') {
                monthlyHours += (anime.duration || 120) / 60;
                monthlyMovies++;
                monthlyEpisodes += 1;
            } else {
                const episodeDuration = anime.duration || 20;
                monthlyHours += ((anime.episodes || 0) * episodeDuration) / 60;
                monthlyEpisodes += anime.episodes || 0;
            }
            monthlyCompleted++;
        }
    });

    return {
        hours: monthlyHours.toFixed(1),
        completed: monthlyCompleted,
        movies: monthlyMovies,
        episodes: monthlyEpisodes
    };
}

// Update stat cards with percentage changes
function updateStatCardsWithChanges() {
    // Check if it's January (first month of year)
    const isFirstMonth = new Date().getMonth() === 0;
    
    if (isFirstMonth) {
        // January - no comparison data available
        const stats = ['completed', 'movies', 'episodes', 'hours'];
        stats.forEach(stat => {
            const el = document.getElementById(`${stat}-change`);
            if (el) {
                el.className = 'stat-change neutral';
                el.innerHTML = `<i class="fas fa-minus"></i> <span>No Track</span>`;
            }
        });
        return;
    }
    
    // Calculate changes by comparing with previous month
    const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get previous month and year
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
    }
    
    // Calculate current month stats
    let currentCompleted = 0;
    let currentMovies = 0;
    let currentEpisodes = 0;
    let currentHours = 0;
    
    // Calculate previous month stats
    let prevCompleted = 0;
    let prevMovies = 0;
    let prevEpisodes = 0;
    let prevHours = 0;
    
    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;
        
        let completionDate = null;
        if (anime.actualFinishDate) {
            completionDate = new Date(anime.actualFinishDate);
        } else if (anime.finishDate) {
            completionDate = new Date(anime.finishDate);
        }
        
        if (!completionDate || isNaN(completionDate.getTime())) return;
        
        const year = completionDate.getFullYear();
        const month = completionDate.getMonth();
        
        // Check if current month
        if (year === currentYear && month === currentMonth) {
            currentCompleted++;
            if (anime.type === 'Movie') {
                currentMovies++;
                currentEpisodes += 1;
                currentHours += (anime.duration || 120) / 60;
            } else {
                currentEpisodes += anime.episodes || 0;
                currentHours += ((anime.episodes || 0) * (anime.duration || 20)) / 60;
            }
        }
        
        // Check if previous month
        if (year === prevYear && month === prevMonth) {
            prevCompleted++;
            if (anime.type === 'Movie') {
                prevMovies++;
                prevEpisodes += 1;
                prevHours += (anime.duration || 120) / 60;
            } else {
                prevEpisodes += anime.episodes || 0;
                prevHours += ((anime.episodes || 0) * (anime.duration || 20)) / 60;
            }
        }
    });
    
    // Calculate and update each stat card
    updateSingleStatCard('completed', prevCompleted, currentCompleted);
    updateSingleStatCard('movies', prevMovies, currentMovies);
    updateSingleStatCard('episodes', prevEpisodes, currentEpisodes);
    updateSingleStatCard('hours', prevHours, currentHours);
}

// Update a single stat card with percentage change
function updateSingleStatCard(statName, previousValue, currentValue) {
    const changeElement = document.getElementById(`${statName}-change`);
    if (!changeElement) return;
    
    changeElement.innerHTML = '';
    changeElement.className = 'stat-change';
    
    // Calculate percentage change
    let percentage = 0;
    let isPositive = true;
    let isNeutral = false;
    let changeText = '';
    
    if (previousValue === 0 && currentValue === 0) {
        isNeutral = true;
        changeText = 'No data';
    } else if (previousValue === 0 && currentValue > 0) {
        isPositive = true;
        changeText = 'New activity';
        percentage = 100;
    } else if (previousValue > 0 && currentValue === 0) {
        isPositive = false;
        changeText = 'No activity';
        percentage = 100;
    } else {
        const change = ((currentValue - previousValue) / previousValue) * 100;
        percentage = Math.abs(change);
        isPositive = change > 0;
        
        if (percentage < 1) {
            isNeutral = true;
            changeText = 'No change';
        } else {
            changeText = `${percentage.toFixed(1)}% ${isPositive ? 'more' : 'less'}`;
        }
    }
    
    if (isNeutral) {
        changeElement.classList.add('neutral');
        changeElement.innerHTML = `<i class="fas fa-minus"></i> <span>${changeText}</span>`;
    } else if (isPositive) {
        changeElement.classList.add('positive');
        changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> <span>${changeText}</span>`;
    } else {
        changeElement.classList.add('negative');
        changeElement.innerHTML = `<i class="fas fa-arrow-down"></i> <span>${changeText}</span>`;
    }
}

// Use namespace to avoid conflicts
window.AniPulseCharts = window.AniPulseCharts || {};

// =============================================
// HELPER: Parse date safely
// =============================================
function parseDateSafely(dateString) {
    if (!dateString) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    if (/^\d{4}-\d{2}$/.test(dateString)) {
        const [year, month] = dateString.split('-').map(Number);
        return new Date(year, month - 1, 15);
    }

    if (dateString.includes(' ')) {
        const datePart = dateString.split(' ')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            const [year, month, day] = datePart.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
    }

    return null;
}

// =============================================
// DATA CALCULATION FUNCTIONS (using actualFinishDate)
// =============================================

function getAnimeDataSafe() {
    return JSON.parse(localStorage.getItem('animeData')) || [];
}

function calculateYearlyCompletionFixed() {
    const animeData = getAnimeDataSafe();
    const years = [2024, 2025, 2026, 2027, 2028];
    const yearlyData = [0, 0, 0, 0, 0];

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed') {
            let completionYear = null;
            if (anime.actualFinishDate) completionYear = parseInt(anime.actualFinishDate.split('-')[0]);
            if (!completionYear && anime.finishDate) completionYear = parseInt(anime.finishDate.split('-')[0]);
            const index = years.indexOf(completionYear);
            if (index !== -1 && !isNaN(completionYear)) yearlyData[index]++;
        }
    });
    return yearlyData;
}

function calculateScoreDistributionFixed() {
    const animeData = getAnimeDataSafe();
    const scoreRanges = [0, 0, 0, 0, 0, 0];
    animeData.forEach(anime => {
        if (anime.score) {
            if (anime.score === 10) scoreRanges[0]++;
            else if (anime.score >= 9) scoreRanges[1]++;
            else if (anime.score >= 8) scoreRanges[2]++;
            else if (anime.score >= 7) scoreRanges[3]++;
            else if (anime.score >= 6) scoreRanges[4]++;
            else scoreRanges[5]++;
        }
    });
    return scoreRanges;
}

function calculateStatusDistributionFixed() {
    const animeData = getAnimeDataSafe();
    return {
        'Completed': animeData.filter(a => a.userStatus === 'Completed').length,
        'Watching': animeData.filter(a => a.userStatus === 'Watching').length,
        'Plan to Watch': animeData.filter(a => a.userStatus === 'Plan to Watch').length,
        'Dropped': animeData.filter(a => a.userStatus === 'Dropped').length
    };
}

function calculateTypeDistributionFixed() {
    const animeData = getAnimeDataSafe();
    const distribution = {};
    animeData.forEach(anime => {
        const type = anime.type || 'TV';
        distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
}

function calculateGenreStatsFixed() {
    const animeData = getAnimeDataSafe();
    const genreCount = {};
    animeData.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(genre => {
                if (genre !== 'Award Winning') genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        }
    });
    return Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 10).reduce((obj, [k, v]) => {
        obj[k] = v;
        return obj;
    }, {});
}

function calculateEpisodesPerMonthFixed(year) {
    const monthlyEpisodes = Array(12).fill(0);
    const animeData = getAnimeDataSafe();
    const processed = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;

        const key = `${anime.id}_${year}`;
        if (processed.has(key)) return;

        let completionDate = null;
        if (anime.actualFinishDate) completionDate = parseDateSafely(anime.actualFinishDate);
        if (!completionDate && anime.finishDate) completionDate = parseDateSafely(anime.finishDate);

        if (completionDate && completionDate.getFullYear() === year) {
            processed.add(key);
            const episodes = anime.type === 'Movie' ? 1 : (anime.episodes || 0);
            monthlyEpisodes[completionDate.getMonth()] += episodes;
        }
    });
    return monthlyEpisodes;
}

function calculateWatchTimePerMonthFixed(year) {
    const monthlyHours = Array(12).fill(0);
    const animeData = getAnimeDataSafe();
    const processed = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;

        const key = `${anime.id}_${year}`;
        if (processed.has(key)) return;

        let completionDate = null;
        if (anime.actualFinishDate) completionDate = parseDateSafely(anime.actualFinishDate);
        if (!completionDate && anime.finishDate) completionDate = parseDateSafely(anime.finishDate);

        if (completionDate && completionDate.getFullYear() === year) {
            processed.add(key);
            let hours = 0;
            if (anime.type === 'Movie') {
                hours = (anime.duration || 120) / 60;
            } else {
                hours = ((anime.episodes || 0) * (anime.duration || 20)) / 60;
            }
            monthlyHours[completionDate.getMonth()] += hours;
        }
    });
    return monthlyHours.map(h => Math.round(h * 10) / 10);
}

// =============================================
// CHART INITIALIZATION (All charts in one function)
// =============================================

function initStatisticsCharts() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    // 1. COMPLETION CHART
    const completionCanvas = document.getElementById('completionChart');
    if (completionCanvas) {
        if (window.AniPulseCharts.completionChart) window.AniPulseCharts.completionChart.destroy();
        const ctx = completionCanvas.getContext('2d');
        window.AniPulseCharts.completionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['2024', '2025', '2026', '2027', '2028'],
                datasets: [{
                    label: 'Anime Completed',
                    data: calculateYearlyCompletionFixed(),
                    backgroundColor: '#48bb78',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: textColor } }
                }
            }
        });
    }

    // 2. SCORE DISTRIBUTION CHART
    const scoreCanvas = document.getElementById('scoreDistributionChart');
    if (scoreCanvas) {
        if (window.AniPulseCharts.scoreChart) window.AniPulseCharts.scoreChart.destroy();
        const ctx = scoreCanvas.getContext('2d');
        window.AniPulseCharts.scoreChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['10', '9', '8', '7', '6', '5 or less'],
                datasets: [{
                    data: calculateScoreDistributionFixed(),
                    backgroundColor: ['rgba(139,92,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(59,130,246,0.8)', 'rgba(156,163,175,0.8)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: textColor } } }
            }
        });
    }

    // 7. COMPLETION RATE BY YEAR CHART
    const completionRateCanvas = document.getElementById('completionRateByYearChart');
    if (completionRateCanvas) {
        if (window.AniPulseCharts.completionRateChart) window.AniPulseCharts.completionRateChart.destroy();
        const ctx = completionRateCanvas.getContext('2d');
        const animeData = getAnimeDataSafe();
        const yearStats = {};
        animeData.forEach(anime => {
            if (anime.finishDate) {
                const year = new Date(anime.finishDate).getFullYear();
                if (!yearStats[year]) yearStats[year] = { completed: 0, total: 0 };
                yearStats[year].total++;
                if (anime.userStatus === 'Completed') yearStats[year].completed++;
            }
        });
        const years = Object.keys(yearStats).sort();
        const completionRates = years.map(y => ((yearStats[y].completed / yearStats[y].total) * 100).toFixed(1));
        window.AniPulseCharts.completionRateChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: years, datasets: [{ label: 'Completion Rate (%)', data: completionRates, backgroundColor: 'rgba(106,90,205,0.7)' }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }, x: { ticks: { color: textColor } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    // 8. POPULATE YEAR DROPDOWNS
    populateYearDropdownsFixed();

    console.log('✅ All statistics charts initialized');
}

// =============================================
// YEAR DROPDOWNS
// =============================================

function getAvailableYearsFromData() {
    const animeData = getAnimeDataSafe();
    const years = new Set();
    const currentYear = new Date().getFullYear();

    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;
        if (anime.actualFinishDate && /^\d{4}/.test(anime.actualFinishDate)) {
            years.add(parseInt(anime.actualFinishDate.split('-')[0]));
        }
        if (anime.finishDate && /^\d{4}/.test(anime.finishDate)) {
            years.add(parseInt(anime.finishDate.split('-')[0]));
        }
    });

    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
}

function populateYearDropdownsFixed() {
    const years = getAvailableYearsFromData();
    const currentYear = new Date().getFullYear();

    const episodesSelect = document.getElementById('episodesYearSelect');
    if (episodesSelect) {
        episodesSelect.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            episodesSelect.appendChild(option);
        });
        episodesSelect.value = years.includes(currentYear) ? currentYear : years[0];
        episodesSelect.onchange = (e) => {
            const year = parseInt(e.target.value);
            if (window.AniPulseCharts.episodesChart) {
                const newData = calculateEpisodesPerMonthFixed(year);
                window.AniPulseCharts.episodesChart.data.datasets[0].data = newData;
                window.AniPulseCharts.episodesChart.data.datasets[0].label = `Episodes Watched (${year})`;
                window.AniPulseCharts.episodesChart.update();
                const total = newData.reduce((a, b) => a + b, 0);
                const totalEl = document.getElementById('yearly-total-episodes');
                if (totalEl) totalEl.innerHTML = `Total Eps: ${total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}`;
            }
        };
    }

    const watchTimeSelect = document.getElementById('watchTimeYearSelect');
    if (watchTimeSelect) {
        watchTimeSelect.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            watchTimeSelect.appendChild(option);
        });
        watchTimeSelect.value = years.includes(currentYear) ? currentYear : years[0];
        watchTimeSelect.onchange = (e) => {
            const year = parseInt(e.target.value);
            if (window.AniPulseCharts.watchTimeChart) {
                const newData = calculateWatchTimePerMonthFixed(year);
                window.AniPulseCharts.watchTimeChart.data.datasets[0].data = newData;
                window.AniPulseCharts.watchTimeChart.update();
                const total = Math.round(newData.reduce((a, b) => a + b, 0));
                const totalEl = document.getElementById('monthly-total-hours');
                if (totalEl) totalEl.innerHTML = `Total Hrs: ${total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}`;
            }
        };
    }
}

// =============================================
// REFRESH FUNCTION
// =============================================

function refreshAllChartsFixed() {
    const currentYear = new Date().getFullYear();

    if (window.AniPulseCharts.completionChart) {
        window.AniPulseCharts.completionChart.data.datasets[0].data = calculateYearlyCompletionFixed();
        window.AniPulseCharts.completionChart.update();
    }
    if (window.AniPulseCharts.scoreChart) {
        window.AniPulseCharts.scoreChart.data.datasets[0].data = calculateScoreDistributionFixed();
        window.AniPulseCharts.scoreChart.update();
    }
    if (window.AniPulseCharts.statusChart) {
        const statusData = calculateStatusDistributionFixed();
        window.AniPulseCharts.statusChart.data.datasets[0].data = Object.values(statusData);
        window.AniPulseCharts.statusChart.update();
    }
    if (window.AniPulseCharts.typeChart) {
        const typeData = calculateTypeDistributionFixed();
        window.AniPulseCharts.typeChart.data.datasets[0].data = Object.values(typeData);
        window.AniPulseCharts.typeChart.update();
    }
    if (window.AniPulseCharts.genreChart) {
        const genreStats = calculateGenreStatsFixed();
        window.AniPulseCharts.genreChart.data.labels = Object.keys(genreStats);
        window.AniPulseCharts.genreChart.data.datasets[0].data = Object.values(genreStats);
        window.AniPulseCharts.genreChart.update();
    }
    if (window.AniPulseCharts.episodesChart) {
        const newData = calculateEpisodesPerMonthFixed(currentYear);
        window.AniPulseCharts.episodesChart.data.datasets[0].data = newData;
        window.AniPulseCharts.episodesChart.update();
        const total = newData.reduce((a, b) => a + b, 0);
        const totalEl = document.getElementById('yearly-total-episodes');
        if (totalEl) totalEl.innerHTML = `Total Eps: ${total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}`;
    }
    if (window.AniPulseCharts.watchTimeChart) {
        const newData = calculateWatchTimePerMonthFixed(currentYear);
        window.AniPulseCharts.watchTimeChart.data.datasets[0].data = newData;
        window.AniPulseCharts.watchTimeChart.update();
        const total = Math.round(newData.reduce((a, b) => a + b, 0));
        const totalEl = document.getElementById('monthly-total-hours');
        if (totalEl) totalEl.innerHTML = `Total Hrs: ${total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}`;
    }

    populateYearDropdownsFixed();
}

// =============================================
// INITIALIZATION
// =============================================

// Override the existing initStatisticsCharts
window.initStatisticsCharts = initStatisticsCharts;
window.refreshAllCharts = refreshAllChartsFixed;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const statisticsPage = document.getElementById('statistics-page');
    if (statisticsPage && statisticsPage.classList.contains('active')) {
        setTimeout(initStatisticsCharts, 500);
    }

    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(initStatisticsCharts, 300);
        });
    }

    // Listen for data changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'animeData') setTimeout(refreshAllChartsFixed, 300);
    });

    // Listen for theme changes
    const observer = new MutationObserver(() => {
        if (document.getElementById('statistics-page')?.classList.contains('active')) {
            refreshAllChartsFixed();
        }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
});

console.log('✅ Fixed statistics charts loaded - all charts will display data correctly');

// === ACHIEVEMENTS SYSTEM ===

// Update achievements grid dynamically
function updateAchievements() {
    const grid = document.getElementById("achievementsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const achievements = [
        // 🌱 Basic Progression
        { icon: "fa-check-circle", title: "First Completion", desc: "Complete your first anime.", goal: 1, progress: d => d.filter(a => a.userStatus === "Completed").length },
        { icon: "fa-tv", title: "TV Enthusiast", desc: "Complete 10 TV series.", goal: 10, progress: d => d.filter(a => a.type === "TV" && a.userStatus === "Completed").length },
        { icon: "fa-film", title: "Movie Lover", desc: "Watch 5 anime movies.", goal: 5, progress: d => d.filter(a => a.type === "Movie" && a.userStatus === "Completed").length },
        { icon: "fa-trophy", title: "Pro Finisher", desc: "Complete 50 anime.", goal: 50, progress: d => d.filter(a => a.userStatus === "Completed").length },
        { icon: "fa-video", title: "Binge Master", desc: "Complete 100 anime.", goal: 100, progress: d => d.filter(a => a.userStatus === "Completed").length },
        { icon: "fa-crown", title: "Legendary Finisher", desc: "Complete 250 anime.", goal: 250, progress: d => d.filter(a => a.userStatus === "Completed").length },

        // 🔥 Watching Volume
        { icon: "fa-fire", title: "Episode Addict", desc: "Watch 100 total episodes.", goal: 100, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
        { icon: "fa-bolt", title: "Power Watcher", desc: "Watch 500 total episodes.", goal: 500, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
        { icon: "fa-meteor", title: "Series Slayer", desc: "Watch 1000 total episodes.", goal: 1000, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },

        // ⏱️ Time-based
        { icon: "fa-hourglass-half", title: "Watch Hour Collector", desc: "Watch 100 hours of anime.", goal: 100, progress: d => totalWatchHours(d) },
        { icon: "fa-clock", title: "Dedicated Watcher", desc: "Spend 250 hours watching anime.", goal: 250, progress: d => totalWatchHours(d) },
        { icon: "fa-infinity", title: "Marathon Legend", desc: "Spend 500 hours watching anime.", goal: 500, progress: d => totalWatchHours(d) },

        // 💬 Rating & Taste
        { icon: "fa-star", title: "Perfect Score", desc: "Rate an anime 10/10.", goal: 1, progress: d => d.filter(a => a.score === 10).length },
        { icon: "fa-heart", title: "Fan Favorite", desc: "Rate 10 anime 9 or higher.", goal: 10, progress: d => d.filter(a => a.score >= 9).length },
        { icon: "fa-star-half-alt", title: "Reviewer", desc: "Rate 25 anime.", goal: 25, progress: d => d.filter(a => a.score > 0).length },
        { icon: "fa-star-of-life", title: "Critic", desc: "Rate 50 anime.", goal: 50, progress: d => d.filter(a => a.score > 0).length },
        { icon: "fa-balance-scale", title: "Honest Rater", desc: "Rate anime with scores from 1 to 10.", goal: 10, progress: d => new Set(d.filter(a => a.score > 0).map(a => a.score)).size },

        // 🎨 Genre Exploration
        { icon: "fa-paint-brush", title: "Genre Explorer", desc: "Watch anime across 10 genres.", goal: 10, progress: d => new Set(d.flatMap(a => a.genres || [])).size },
        { icon: "fa-compass", title: "Genre Master", desc: "Watch anime from 20 genres.", goal: 20, progress: d => new Set(d.flatMap(a => a.genres || [])).size },
        { icon: "fa-rainbow", title: "Genre Collector", desc: "Watch every major genre (25 total).", goal: 25, progress: d => new Set(d.flatMap(a => a.genres || [])).size },

        // 🗓️ Streaks & Activity
        { icon: "fa-calendar-alt", title: "Monthly Streak", desc: "Complete anime in 3 consecutive months.", goal: 3, progress: d => countConsecutiveMonths(d) },
        { icon: "fa-chart-line", title: "Consistent Viewer", desc: "Watch anime in 6 consecutive months.", goal: 6, progress: d => countConsecutiveMonths(d) },
        { icon: "fa-calendar-check", title: "Year of Anime", desc: "Watch anime in 12 consecutive months.", goal: 12, progress: d => countConsecutiveMonths(d) },
        { icon: "fa-fire-alt", title: "Hot Streak", desc: "Complete 5 anime this month.", goal: 5, progress: d => getCompletedThisMonth(d) },

        // 📚 Collection & List Growth
        { icon: "fa-list", title: "Collector", desc: "Add 50 anime to your list.", goal: 50, progress: d => d.length },
        { icon: "fa-layer-group", title: "Library Keeper", desc: "Add 100 anime to your list.", goal: 100, progress: d => d.length },
        { icon: "fa-database", title: "Archivist", desc: "Add 250 anime to your list.", goal: 250, progress: d => d.length },

        // 🧠 Variety & Depth
        { icon: "fa-brain", title: "Decade Jumper", desc: "Watch anime from 5 different decades.", goal: 5, progress: d => decadesWatched(d).length },
        { icon: "fa-theater-masks", title: "Mixed Tastes", desc: "Watch anime across 15 studios.", goal: 15, progress: d => new Set(d.map(a => a.studio).filter(Boolean)).size },
        { icon: "fa-lightbulb", title: "Old but Gold", desc: "Watch 5 anime before the year 2000.", goal: 5, progress: d => d.filter(a => a.startYear && a.startYear < 2000).length },

        // 🏅 Special / Fun
        { icon: "fa-smile", title: "Casual Enjoyer", desc: "Rate 10 anime 7 or higher.", goal: 10, progress: d => d.filter(a => a.score >= 7).length },
        { icon: "fa-sad-cry", title: "Heartbreaker", desc: "Rate 5 anime 4 or lower.", goal: 5, progress: d => d.filter(a => a.score > 0 && a.score <= 4).length },
        { icon: "fa-random", title: "Experimental Watcher", desc: "Watch 3 anime from Music, Sports, or Slice of Life genres.", goal: 3, progress: d => new Set(d.flatMap(a => a.genres || []).filter(g => ["Music", "Sports", "Slice of Life"].includes(g))).size },
        {
            icon: "fa-fire-flame-curved", title: "Weekend Warrior", desc: "Complete 2 anime during a weekend.", goal: 2, progress: d => d.filter(a => {
                if (!a.finishDate || a.userStatus !== "Completed") return false;
                const day = new Date(a.finishDate).getDay();
                return day === 6 || day === 0;
            }).length
        },
        {
            icon: "fa-user-shield", title: "Veteran Otaku", desc: "Have 3 years of anime watching history.", goal: 3, progress: d => {
                const years = [...new Set(d.filter(a => a.finishDate).map(a => new Date(a.finishDate).getFullYear()))];
                return years.length;
            }
        },
        // 🌟 Special Streaks
        { icon: "fa-sun", title: "Half-Year Streak", desc: "Watch anime in 6 consecutive months.", goal: 6, progress: d => countConsecutiveMonths(d) },
        { icon: "fa-moon", title: "Two-Year Streak", desc: "Watch anime in 24 consecutive months.", goal: 24, progress: d => countConsecutiveMonths(d) },
        {
            icon: "fa-star", title: "Night Owl", desc: "Complete 5 anime finished after midnight.", goal: 5, progress: d => d.filter(a => {
                if (!a.finishDate || a.userStatus !== "Completed") return false;
                const hour = new Date(a.finishDate).getHours();
                return hour >= 0 && hour < 6; // midnight to 6 AM
            }).length
        },

        // 🎬 Anime Volume
        { icon: "fa-compact-disc", title: "Binge Watcher", desc: "Complete 200 total episodes.", goal: 200, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
        { icon: "fa-film", title: "Epic Marathon", desc: "Complete 500 total episodes.", goal: 500, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },

        // 🎨 Genre Challenges
        { icon: "fa-dragon", title: "Fantasy Fanatic", desc: "Complete 10 fantasy anime.", goal: 10, progress: d => d.filter(a => (a.genres || []).includes("Fantasy") && a.userStatus === "Completed").length },
        { icon: "fa-heartbeat", title: "Romance Lover", desc: "Complete 10 romance anime.", goal: 10, progress: d => d.filter(a => (a.genres || []).includes("Romance") && a.userStatus === "Completed").length },
        { icon: "fa-skull-crossbones", title: "Horror Hunter", desc: "Complete 5 horror anime.", goal: 5, progress: d => d.filter(a => (a.genres || []).includes("Horror") && a.userStatus === "Completed").length },

        // 💡 Rating & Review
        { icon: "fa-thumbs-up", title: "Top Critic", desc: "Rate 20 anime 9 or higher.", goal: 20, progress: d => d.filter(a => a.score >= 9).length },
        { icon: "fa-thumbs-down", title: "Harsh Critic", desc: "Rate 10 anime 3 or lower.", goal: 10, progress: d => d.filter(a => a.score <= 3 && a.score > 0).length },

        // 🏫 Studio & Production
        { icon: "fa-building", title: "Studio Collector", desc: "Watch anime from 10 different studios.", goal: 10, progress: d => new Set(d.map(a => a.studio).filter(Boolean)).size },
        { icon: "fa-certificate", title: "Studio Master", desc: "Watch anime from 20 different studios.", goal: 20, progress: d => new Set(d.map(a => a.studio).filter(Boolean)).size },

        // 📆 Seasonal
        {
            icon: "fa-snowflake", title: "Winter Watcher", desc: "Complete 5 anime finished in winter (Dec-Feb).", goal: 5, progress: d => d.filter(a => {
                if (!a.finishDate || a.userStatus !== "Completed") return false;
                const month = new Date(a.finishDate).getMonth() + 1;
                return [12, 1, 2].includes(month);
            }).length
        },
        {
            icon: "fa-sun", title: "Summer Watcher", desc: "Complete 5 anime finished in summer (Jun-Aug).", goal: 5, progress: d => d.filter(a => {
                if (!a.finishDate || a.userStatus !== "Completed") return false;
                const month = new Date(a.finishDate).getMonth() + 1;
                return [6, 7, 8].includes(month);
            }).length
        },

        // 🏆 Fun / Easter Eggs
        {
            icon: "fa-ghost", title: "Anime Ghost", desc: "Watch an anime that no one else has in your list.", goal: 1, progress: d => {
                // placeholder: assume we have some way to check uniqueness
                return 0;
            }
        },
        { icon: "fa-gamepad", title: "Gamer's Choice", desc: "Complete 3 anime adapted from games.", goal: 3, progress: d => d.filter(a => (a.genres || []).includes("Game") && a.userStatus === "Completed").length },
    ];

    // Helper to get number of anime completed this month

    function getMonthlyHotStreak(data, minPerMonth = 5) {
        // Create a map of "YYYY-MM" → completed anime count
        const monthMap = {};

        data.forEach(a => {
            if (!a.finishDate || a.userStatus !== "Completed") return;
            const d = new Date(a.finishDate);
            const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
        });

        // Sort months chronologically
        const months = Object.keys(monthMap)
            .map(s => {
                const [y, m] = s.split('-').map(Number);
                return { year: y, month: m, count: monthMap[s] };
            })
            .sort((a, b) => a.year - b.year || a.month - b.month);

        if (months.length === 0) return 0;

        // Calculate consecutive months where completed >= minPerMonth
        let maxStreak = 0, streak = 0;

        for (let i = 0; i < months.length; i++) {
            if (months[i].count >= minPerMonth) {
                // Check if consecutive with previous
                if (i === 0 || (months[i].year - months[i - 1].year) * 12 + (months[i].month - months[i - 1].month) === 1) {
                    streak++;
                } else {
                    streak = 1; // reset streak if gap
                }
                maxStreak = Math.max(maxStreak, streak);
            } else {
                streak = 0; // streak broken if month < minPerMonth
            }
        }

        return maxStreak;
    }

    // === COUNTERS ===
    let completed = 0, inProgress = 0;
    const unlockedIds = JSON.parse(localStorage.getItem("unlockedAchievements") || "[]");
    const newUnlocks = [];

    achievements.forEach((a, i) => {
        const current = a.progress(animeData);
        const percent = Math.min((current / a.goal) * 100, 100);
        const done = current >= a.goal;

        let statusClass = "status-locked";
        let statusText = "Locked";

        if (done) {
            statusClass = "status-completed";
            statusText = "Completed";
            completed++;
            if (!unlockedIds.includes(i)) {
                unlockedIds.push(i);
                newUnlocks.push(a.title);
            }
        } else if (current > 0) {
            statusClass = "status-progress";
            statusText = `In Progress (${Math.floor(percent)}%)`;
            inProgress++;
        }

        const card = document.createElement("div");
        card.className = `achievement-card fade-in ${done ? "unlocked" : ""}`;
        card.innerHTML = `
            <div class="achievement-icon"><i class="fas ${a.icon}"></i></div>
            <div class="achievement-title">${a.title}</div>
            <div class="achievement-desc">${a.desc}</div>
            <div class="achievement-status ${statusClass}">${statusText}</div>
            <div class="achievement-progress-bar">
                <div class="achievement-progress" style="width:${percent}%;"></div>
            </div>
        `;
        grid.appendChild(card);
    });

    // === TOTALS ===
    document.getElementById("totalAchievements").textContent = achievements.length;
    document.getElementById("completedAchievements").textContent = completed;
    document.getElementById("inProgressAchievements").textContent = inProgress;

    // === SAVE UNLOCKS + SHOW TOASTS ===
    if (newUnlocks.length > 0) {
        newUnlocks.forEach(title => showToast(`Achievement Unlocked: ${title}! 🏆`, "success"));
        localStorage.setItem("unlockedAchievements", JSON.stringify(unlockedIds));
    }
}

// === HELPER FUNCTIONS ===
function totalWatchHours(data) {
    return data.reduce((sum, a) => sum + ((a.episodes || 0) * (a.duration || 20)) / 60, 0);
}

function countConsecutiveMonths(data) {
    const monthStrings = [...new Set(
        data
            .filter(a => a.userStatus === "Completed" && a.finishDate)
            .map(a => {
                const d = new Date(a.finishDate);
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                return `${d.getFullYear()}-${month}`;
            })
    )];

    const months = monthStrings
        .map(s => {
            const [y, m] = s.split('-').map(Number);
            return { year: y, month: m };
        })
        .sort((a, b) => a.year - b.year || a.month - b.month);

    if (months.length === 0) return 0;

    let maxStreak = 1, streak = 1;
    for (let i = 1; i < months.length; i++) {
        const prev = months[i - 1];
        const curr = months[i];

        const diff = (curr.year - prev.year) * 12 + (curr.month - prev.month);

        if (diff === 1) {
            streak++;
        } else {
            streak = 1; // reset streak if gap
        }

        maxStreak = Math.max(maxStreak, streak);
    }

    return maxStreak;
}

function getCompletedThisMonth(data) {
    const now = new Date();
    return data.filter(a => {
        if (a.userStatus !== "Completed" || !a.finishDate) return false;
        const d = new Date(a.finishDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
}

function completionsInLastDays(data, days) {
    const now = new Date();
    const cutoff = new Date(now - days * 86400000);
    return data.filter(a => a.finishDate && new Date(a.finishDate) >= cutoff && a.userStatus === "Completed").length;
}

function decadesWatched(data) {
    const decades = new Set();
    data.forEach(a => {
        if (a.startYear) decades.add(Math.floor(a.startYear / 10) * 10);
    });
    return Array.from(decades);
}

// Settings functionality
function initSettings() {
    const usernameInput = document.getElementById("usernameInput");
    const avatarInput = document.getElementById("avatarInput");
    const resetAvatarBtn = document.getElementById("resetAvatar");
    const clearDataBtn = document.getElementById("clearDataBtn");
    const exportDataBtn = document.getElementById("exportDataBtn");
    const manualBackupBtn = document.getElementById("manualBackupBtn");
    const restoreBackupBtn = document.getElementById("restoreBackupBtn");

    // Load saved settings from localStorage
    const savedName = localStorage.getItem("username");
    const savedAvatar = localStorage.getItem("userAvatar");

    if (savedName && usernameInput) {
        usernameInput.value = savedName;
    }

    // --- Handle Name Change ---
    if (usernameInput) {
        usernameInput.addEventListener("input", () => {
            const newName = usernameInput.value.trim() || "AnimeFan";
            localStorage.setItem("username", newName);
            updateSidebarUserInfo();
        });
    }

    // --- Handle Avatar Upload ---
    if (avatarInput) {
        avatarInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const imgUrl = ev.target.result;
                localStorage.setItem("userAvatar", imgUrl);
                updateSidebarUserInfo();
            };
            reader.readAsDataURL(file);
        });
    }

    // --- Reset Avatar ---
    if (resetAvatarBtn) {
        resetAvatarBtn.addEventListener("click", () => {
            localStorage.removeItem("userAvatar");
            updateSidebarUserInfo();
        });
    }

    // --- Clear Data ---
    if (clearDataBtn) {
        clearDataBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // --- Export Data ---
    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", exportData);
    }

    // --- Manual Backup ---
    if (manualBackupBtn) {
        manualBackupBtn.addEventListener("click", () => saveBackup(true));
    }

    // --- Restore Backup ---
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener("click", restoreBackup);
    }

    // Initialize sidebar with current data
    updateSidebarUserInfo();
}

function updateSidebarUserInfo() {
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const sidebarUsername = document.querySelector('.sidebar-username');
    const sidebarUserStats = document.querySelector('.sidebar-user-stats');

    // Get saved profile
    const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'AnimeFan',
        avatar: 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff'
    };

    const savedName = savedProfile.name;
    const savedAvatar = savedProfile.avatar;

    // ✅ Get level data from level-system.js (NOT from localStorage userProfile)
    let currentLevel = 1;
    let currentTitle = 'Newbie';
    let currentXP = 0;

    if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
        const levelProfile = window.AniPulseLevelSystem.getUserProfile();
        currentLevel = levelProfile.level || 1;
        currentTitle = levelProfile.title || 'Newbie';
        currentXP = levelProfile.totalExp || 0;
    } else {
        // Fallback to localStorage
        const savedLevel = localStorage.getItem('userLevel');
        const savedTitle = localStorage.getItem('userLevelTitle');
        if (savedLevel) currentLevel = parseInt(savedLevel);
        if (savedTitle) currentTitle = savedTitle;
    }

    // Calculate totals
    const totalAnime = animeData?.length || 0;
    const totalHours = calculateTotalHours();
    const totalEpisodes = calculateTotalEpisodes();

    // Update sidebar visuals
    if (sidebarAvatar) {
        sidebarAvatar.src = savedAvatar;
        sidebarAvatar.alt = savedName;
    }

    if (sidebarUsername) {
        sidebarUsername.textContent = savedName;
    }

    // Update level display in sidebar
    const levelBadge = document.querySelector('.level-badge, #levelBadgeText');
    const levelTitle = document.querySelector('.level-title, #levelTitleText');

    if (levelBadge) {
        levelBadge.textContent = `Lv.${currentLevel}`;
    }
    if (levelTitle) {
        levelTitle.textContent = currentTitle;
    }

    if (sidebarUserStats) {
        sidebarUserStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-number" id="animeCountSidebar">${totalAnime}</span>
                <span class="stat-label">Anime</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" id="toggleStat">
                <span class="stat-number" id="toggleNumber" title="${totalHours.toLocaleString()} Hours">
                    ${formatNumberShort(totalHours)}
                </span>
                <span class="stat-label" id="toggleLabel">Hrs</span>
            </div>
        `;
    }

    // Update level display in settings page if visible
    const settingsLevelNumber = document.getElementById('settingsLevelNumber');
    const settingsLevelTitle = document.getElementById('settingsLevelTitle');
    const settingsCurrentXP = document.getElementById('settingsCurrentXP');
    const settingsNextXP = document.getElementById('settingsNextXP');

    if (settingsLevelNumber) settingsLevelNumber.textContent = `Level ${currentLevel}`;
    if (settingsLevelTitle) settingsLevelTitle.textContent = currentTitle;

    // Update top bar
    const topUserAvatar = document.querySelector('.user-profile .user-avatar');
    const topUserName = document.querySelector('.user-profile span');
    if (topUserAvatar) topUserAvatar.src = savedAvatar;
    if (topUserName) topUserName.textContent = savedName;
}

// 🧮 Calculate total episodes
function calculateTotalEpisodes() {
    let total = 0;
    animeData.forEach(anime => {
        const eps = anime.progress || anime.episodes || 0;
        total += eps;
    });
    return total;
}

// 🧮 Calculate total hours (same logic)
function calculateTotalHours() {
    let totalMinutes = 0;
    animeData.forEach(anime => {
        if (anime.type === 'Movie') {
            totalMinutes += anime.duration || 120;
        } else {
            const eps = anime.progress || anime.episodes || 0;
            const epDur = anime.duration || 20;
            totalMinutes += eps * epDur;
        }
    });
    return Math.round(totalMinutes / 60);
}

// 🔢 Short number format (1.3k → 1300)
function formatNumberShort(num) {
    if (num >= 1_000_000)
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000)
        return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
}

// Monthly anime counter
function updateTotalAnimeCountAllMonths() {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Count only anime marked as Completed in the current year
    const totalCompleted = animeData.filter(anime => {
        if (!anime.finishDate || anime.userStatus !== 'Completed') return false;
        const [year] = anime.finishDate.split('-').map(Number);
        return year === currentYear;
    }).length;

    const totalAnimeEl = document.getElementById('monthly-total-anime');
    if (totalAnimeEl) {
        totalAnimeEl.textContent = `Total Anime in ${currentYear}: ${totalCompleted}`;
    }
}

// Update current month completed anime with scrolling container
function updateCurrentMonthAnime() {
    const currentMonthContainer = document.getElementById('current-month-anime');
    const currentMonthNameEl = document.getElementById('current-month-name');

    if (!currentMonthContainer || !currentMonthNameEl) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // Update month name
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    currentMonthNameEl.textContent = monthNames[currentMonth];

    // Filter anime completed in current month
    const currentMonthAnime = animeData.filter(anime => {
        if (anime.userStatus !== 'Completed' || !anime.finishDate) return false;

        const finishDate = new Date(anime.finishDate);
        const finishMonth = finishDate.getMonth();
        const finishYear = finishDate.getFullYear();

        return finishMonth === currentMonth && finishYear === currentYear;
    });

    if (currentMonthAnime.length === 0) {
        currentMonthContainer.innerHTML = `
            <div class="no-anime">
                <i class="fas fa-calendar-times"></i>
                <div>No anime completed this month yet.<br>Keep watching!</div>
            </div>
        `;
        return;
    }

    // Sort by completion date (newest first)
    currentMonthAnime.sort((a, b) => new Date(b.finishDate) - new Date(a.finishDate));

    currentMonthContainer.innerHTML = currentMonthAnime.map(anime => `
        <div class="anime-card" onclick="editAnime('${anime.id}')">
            <img src="${anime.cover || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}" 
                 alt="${anime.title}" 
                 class="anime-cover"
                 onerror="this.src='https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'">
            <div class="anime-info">
                <div class="anime-title">${anime.title}</div>
                <div class="anime-meta">
                    <span>${anime.type || 'TV'}</span>
                    ${anime.score ? `<span class="anime-score">⭐ ${anime.score}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Initialize drag scrolling after content is loaded
    initializeDragScrolling();
}

// Drag scrolling functionality
function initializeDragScrolling() {
    const container = document.getElementById('current-month-anime');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse events
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Scroll multiplier
        container.scrollLeft = scrollLeft - walk;
    });

    // Touch events for mobile
    container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('touchend', () => {
        isDown = false;
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    // Prevent default drag behavior for images
    container.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
}

// === WATCHLIST PAGE WITH PAGINATION ===
function updateWatchlist(status = 'all', page = 1) {
    const container = document.getElementById('watchlist-container');
    const pagination = document.getElementById('pagination');
    if (!container || !pagination) return;

    currentStatus = status;
    currentPage = page;

    let filteredAnime = [...animeData];
    if (status !== 'all') filteredAnime = filteredAnime.filter(a => a.userStatus === status);
    filteredAnime.reverse();

    const totalPages = Math.ceil(filteredAnime.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageAnime = filteredAnime.slice(start, end);

    if (filteredAnime.length === 0) {
        container.innerHTML = `<div class="no-anime">No anime found for "${status}".</div>`;
        pagination.innerHTML = '';
        return;
    }

    container.innerHTML = pageAnime.map(anime => `
        <div class="anime-card" data-id="${anime.id}">
            <img src="${anime.cover || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}" alt="${anime.title}" class="anime-cover">
            <div class="anime-info">
                <div class="anime-title">${anime.title}</div>
                <div class="anime-meta">
                    <span>${anime.type || 'TV'}</span>
                    ${anime.score ? `<span class="anime-score">⭐ ${anime.score}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Pagination UI
    renderPagination(totalPages, page);
}

function renderPagination(totalPages, activePage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let buttons = '';

    // First and Prev
    buttons += `
        <button class="page-btn" ${activePage === 1 ? 'disabled' : ''} data-page="1">«</button>
        <button class="page-btn" ${activePage === 1 ? 'disabled' : ''} data-page="${activePage - 1}">‹</button>
    `;

    // Determine visible range
    const maxVisible = 3; // number of pages before/after current
    let startPage = Math.max(1, activePage - maxVisible);
    let endPage = Math.min(totalPages, activePage + maxVisible);

    // Add leading ellipsis if needed
    if (startPage > 2) {
        buttons += `<button class="page-btn" data-page="1">1</button>`;
        buttons += `<span class="page-dots">…</span>`;
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        buttons += `<button class="page-btn ${i === activePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    // Add trailing ellipsis if needed
    if (endPage < totalPages - 1) {
        buttons += `<span class="page-dots">…</span>`;
        buttons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next and Last
    buttons += `
        <button class="page-btn" ${activePage === totalPages ? 'disabled' : ''} data-page="${activePage + 1}">›</button>
        <button class="page-btn" ${activePage === totalPages ? 'disabled' : ''} data-page="${totalPages}">»</button>
    `;

    pagination.innerHTML = buttons;

    // Attach event listeners
    pagination.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = parseInt(btn.dataset.page);
            if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
                updateWatchlist(currentStatus, targetPage);
            }
        });
    });
}

// Watchlist filter initialization
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.watchlist-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateWatchlist(btn.getAttribute('data-status'), 1);
        });
    });
});

// 💾 Backup & Restore System
function saveBackup(manual = false) {
    if (!animeData || animeData.length === 0) return;

    const backup = {
        timestamp: new Date().toISOString(),
        data: animeData
    };

    localStorage.setItem('animeBackup', JSON.stringify(backup));

    const statusEl = document.getElementById('lastBackupTime');
    if (statusEl) {
        const time = new Date(backup.timestamp).toLocaleString();
        statusEl.textContent = `Last backup: ${time} ${manual ? '(manual)' : '(auto)'}`;
    }

    console.log(`[Backup] Saved ${animeData.length} anime at ${backup.timestamp}`);
}

function restoreBackup() {
    const raw = localStorage.getItem('animeBackup');
    if (!raw) {
        alert('⚠️ No backup found!');
        return;
    }

    const backup = JSON.parse(raw);
    if (!backup.data || !Array.isArray(backup.data)) {
        alert('❌ Backup file is invalid!');
        return;
    }

    animeData = backup.data;
    localStorage.setItem('animeData', JSON.stringify(animeData));

    updateAllComponents();

    alert(`✅ Backup restored from ${new Date(backup.timestamp).toLocaleString()}`);
}

// Show last backup info
const existingBackup = JSON.parse(localStorage.getItem('animeBackup'));
if (existingBackup && existingBackup.timestamp) {
    const statusEl = document.getElementById('lastBackupTime');
    if (statusEl) {
        statusEl.textContent = `Last backup: ${new Date(existingBackup.timestamp).toLocaleString()}`;
    }
}

// ⏱ Auto backup every 1 minutes
setInterval(() => saveBackup(false), 1 * 60 * 1000);

/* === 📊 DASHBOARD ENHANCEMENTS === */

// Wait until page fully loaded
window.addEventListener("DOMContentLoaded", () => {
    // 🔒 Defer animation setup until loader completes
    if (!animationsStarted) {
        // Wait for animations to start
        const checkAnimationStart = setInterval(() => {
            if (animationsStarted) {
                clearInterval(checkAnimationStart);
                setupAnimationInteractions();
            }
        }, 50);
        return;
    }

    setupAnimationInteractions();
});

function setupAnimationInteractions() {
    // Search functionality
    const dashboardSearch = document.getElementById("dashboardSearch");
    if (dashboardSearch) {
        dashboardSearch.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const animeCards = document.querySelectorAll("#top-rated-anime .anime-card");

            animeCards.forEach(card => {
                const title = card.querySelector(".anime-title")?.textContent.toLowerCase() || "";
                card.style.display = title.includes(query) ? "block" : "none";
            });
        });
    }

    // Re-run animation whenever user returns to Dashboard
    document.querySelectorAll(".menu-item[data-page='dashboard']").forEach(btn => {
        btn.addEventListener("click", () => {
            setTimeout(() => {
                const completed = parseInt(document.getElementById("completed-count")?.textContent) || 0;
                const movies = parseInt(document.getElementById("movies-count")?.textContent) || 0;
                const episodes = parseInt(document.getElementById("episodes-count")?.textContent) || 0;
                const hours = parseInt(document.getElementById("total-hours-count")?.textContent) || 0;

                // Reset numbers to zero for re-animation
                document.getElementById("completed-count").textContent = 0;
                document.getElementById("movies-count").textContent = 0;
                document.getElementById("episodes-count").textContent = 0;
                document.getElementById("total-hours-count").textContent = 0;

                // Animate them back up
                setTimeout(() => {
                    animateCount(document.getElementById("completed-count"), completed, 1500);
                    animateCount(document.getElementById("movies-count"), movies, 1500);
                    animateCount(document.getElementById("episodes-count"), episodes, 1500);
                    animateCount(document.getElementById("total-hours-count"), hours, 1500);
                }, 300);
            }, 400);
        });
    });
}

/* === 📅 YEARLY COUNT-UP ANIMATION (HOURS & EPISODES) === */
window.addEventListener("DOMContentLoaded", () => {
    // 🔒 Defer until animations start
    if (!animationsStarted) {
        const checkAnimationStart = setInterval(() => {
            if (animationsStarted) {
                clearInterval(checkAnimationStart);
                setupYearlyAnimationInteractions();
            }
        }, 50);
        return;
    }

    setupYearlyAnimationInteractions();
});

function setupYearlyAnimationInteractions() {
    const totalHoursEl = document.getElementById("monthly-total-hours");
    const totalEpisodesEl = document.getElementById("yearly-total-episodes");

    function getYearlyTotals() {
        const animeData = JSON.parse(localStorage.getItem("animeData")) || [];
        const now = new Date();
        const currentYear = now.getFullYear();

        let totalHours = 0;
        let totalEpisodes = 0;

        animeData.forEach(anime => {
            if (anime.userStatus !== "Completed" || !anime.finishDate) return;
            const finish = new Date(anime.finishDate);
            if (finish.getFullYear() !== currentYear) return;

            const epCount = Number(anime.episodes) || 0;
            const duration = Number(anime.duration) || 20;
            const type = anime.type?.toLowerCase() || "tv";

            let hours = 0;
            if (type === "movie") hours = duration / 60;
            else hours = (epCount * duration) / 60;

            totalHours += hours;
            totalEpisodes += epCount;
        });

        return {
            totalHours: Math.round(totalHours),
            totalEpisodes
        };
    }

    function animateCounter(el, targetValue, label) {
        if (!el) return;
        const duration = 4000;
        const startValue = 0;
        const startTime = performance.now();

        function easeOut(t) {
            return t * (2 - t);
        }

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOut(progress);
            const current = Math.floor(startValue + targetValue * eased);
            el.textContent = `${label}: ${current}`;
            if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    }

    // Animate again when user opens the Statistics page
    document.querySelectorAll(".menu-item[data-page='statistics']").forEach(btn => {
        btn.addEventListener("click", () => {
            setTimeout(() => {
                const totals = getYearlyTotals();
                animateCounter(totalHoursEl, totals.totalHours, "Total Hrs ");
                animateCounter(totalEpisodesEl, totals.totalEpisodes, "Total Eps ");
            }, 400);
        });
    });

    // Recalculate dynamically if data changes
    window.addEventListener("storage", () => {
        const totals = getYearlyTotals();
        animateCounter(totalHoursEl, totals.totalHours, "Total Hrs ");
        animateCounter(totalEpisodesEl, totals.totalEpisodes, "Total Eps ");
    });
}

/* === 🔢 Universal count-up helper (used across all dashboard counters) === */
function animateCount(element, targetValue, duration = 1500, format = v => v) {
    if (!element) return;
    const startValue = 0;
    const startTime = performance.now();

    function easeOutQuad(t) { return t * (2 - t); }

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuad(progress);
        const value = startValue + (targetValue - startValue) * eased;
        element.textContent = format(Math.floor(value));
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

/* === 🧩 Update sidebar user info (fade-up toggle animation) === */
function updateSidebarUserInfo() {
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const sidebarUsername = document.querySelector('.sidebar-username');
    const sidebarUserStats = document.querySelector('.sidebar-user-stats');

    // ✅ Load user profile
    const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'AnimeFan',
        avatar: 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff'
    };

    const savedName = savedProfile.name;
    const savedAvatar = savedProfile.avatar;

    // 🧮 Load anime data
    const animeData = JSON.parse(localStorage.getItem("animeData")) || [];
    let totalEpisodes = 0;
    let totalHours = 0;

    animeData.forEach(anime => {
        if (anime.userStatus !== "Completed") return;
        if (anime.episodes) totalEpisodes += anime.episodes;
        if (anime.duration && anime.episodes)
            totalHours += (anime.duration * anime.episodes) / 60;
    });

    const totalAnime = animeData.length;
    totalHours = Math.round(totalHours);

    // 🔢 Short format helper (NO ROUNDING UP → 3.1K instead of 3.2K)
    const formatShort = num => {
        if (num >= 1_000_000) {
            let val = Math.floor(num / 100_000) / 10;
            return val % 1 === 0 ? val.toFixed(0) + 'M' : val + 'M';
        }
        if (num >= 1_000) {
            let val = Math.floor(num / 100) / 10;
            return val % 1 === 0 ? val.toFixed(0) + 'K' : val + 'K';
        }
        return num.toString();
    };

    // 🖼️ Sidebar visuals
    if (sidebarAvatar) {
        sidebarAvatar.src = savedAvatar;
        sidebarAvatar.alt = savedName;
    }
    if (sidebarUsername) sidebarUsername.textContent = savedName;

    if (sidebarUserStats) {
        sidebarUserStats.innerHTML = `
          <div class="stat-item">
            <span class="stat-number" id="animeCount">0</span>
            <span class="stat-label">Anime</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item" id="toggleStat">
            <span class="stat-number fade-up" id="toggleNumber" title="${totalHours.toLocaleString()} Hours">0</span>
            <span class="stat-label fade-up" id="toggleLabel">Hrs</span>
          </div>
        `;

        const animeCountEl = document.getElementById('animeCount');
        const toggleNumberEl = document.getElementById('toggleNumber');
        const toggleLabelEl = document.getElementById('toggleLabel');

        // Initial animation
        animateCount(animeCountEl, totalAnime, 4500);
        animateCount(toggleNumberEl, totalHours, 4500, formatShort);

        let showingHours = true;

        // 🔁 Fade-up switch every 15s
        setInterval(() => {
            toggleNumberEl.classList.add('fade-up-out');
            toggleLabelEl.classList.add('fade-up-out');

            setTimeout(() => {
                if (showingHours) {
                    toggleLabelEl.textContent = 'Eps';
                    toggleNumberEl.textContent = formatShort(totalEpisodes);
                    toggleNumberEl.title = totalEpisodes.toLocaleString() + ' Episodes';
                } else {
                    toggleLabelEl.textContent = 'Hrs';
                    toggleNumberEl.textContent = formatShort(totalHours);
                    toggleNumberEl.title = totalHours.toLocaleString() + ' Hours';
                }

                toggleNumberEl.classList.remove('fade-up-out');
                toggleLabelEl.classList.remove('fade-up-out');
                toggleNumberEl.classList.add('fade-up-in');
                toggleLabelEl.classList.add('fade-up-in');

                setTimeout(() => {
                    toggleNumberEl.classList.remove('fade-up-in');
                    toggleLabelEl.classList.remove('fade-up-in');
                }, 400);

                showingHours = !showingHours;
            }, 350);
        }, 15000);
    }
}


/* === 🔁 Reanimate when data changes === */
window.addEventListener('storage', () => {
    updateSidebarUserInfo();
});

/* ============================================================
🔄 AUTO-SAVE + PERSISTENT JSON BACKUP (Edge / Chrome)
============================================================ */

(async function setupPersistentAutoBackup() {
    if (typeof animeData === "undefined") return;

    // --- IndexedDB helper ---
    const DB_NAME = "AnimeTrackerDB";
    const STORE_NAME = "backupHandleStore";

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
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(handle, "backupHandle");
        await tx.complete;
        db.close();
    }

    async function loadHandle() {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const req = tx.objectStore(STORE_NAME).get("backupHandle");
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
            tx.oncomplete = () => db.close();
        });
    }

    async function deleteHandle() {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete("backupHandle");
        await tx.complete;
        db.close();
    }

    // --- Backup logic ---
    let backupHandle = await loadHandle();
    let saveTimeout = null;
    const SAVE_DELAY = 800; // debounce delay

    async function saveBackup() {
        if (!backupHandle) return;
        try {
            const perm = await backupHandle.queryPermission({ mode: "readwrite" });
            if (perm === "denied") {
                console.warn("Backup permission denied.");
                return;
            }

            const writable = await backupHandle.createWritable();
            await writable.write(JSON.stringify(animeData, null, 2));
            await writable.close();

            console.log("✅ JSON backup updated successfully.");
            const statusEl = document.getElementById("backupStatus");
            if (statusEl)
                statusEl.textContent = "✅ Auto backup updated at " + new Date().toLocaleTimeString();
        } catch (err) {
            console.error("❌ Error saving backup:", err);
        }
    }

    // Debounced save trigger
    function triggerBackupSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveBackup, SAVE_DELAY);
    }

    // Create Proxy wrapper for auto-save to localStorage + backup file
    const animeDataProxy = new Proxy(animeData, {
        set(target, prop, value) {
            target[prop] = value;
            localStorage.setItem("animeData", JSON.stringify(animeData));
            triggerBackupSave();
            return true;
        },
        deleteProperty(target, prop) {
            delete target[prop];
            localStorage.setItem("animeData", JSON.stringify(animeData));
            triggerBackupSave();
            return true;
        },
    });

    animeData = animeDataProxy;

    // --- UI button for enabling backup (robust attach even if DOM already loaded) ---
    function attachBackupButton() {
        const enableBtn = document.getElementById("enableBackupBtn");
        if (!enableBtn) {
            console.warn("⚠️ enableBackupBtn not found yet. Retrying...");
            setTimeout(attachBackupButton, 500);
            return;
        }

        console.log("✅ Backup button found and ready.");
        enableBtn.addEventListener("click", async () => {
            console.log("🟢 Backup button clicked.");
            try {
                backupHandle = await window.showSaveFilePicker({
                    suggestedName: "AnimeTracker_Backup.json",
                    types: [{
                        description: "AnimeTracker JSON Backup",
                        accept: { "application/json": [".json"] },
                    }],
                });
                await saveHandle(backupHandle);
                console.log("✅ Backup file handle saved for future sessions.");
                const statusEl = document.getElementById("backupStatus");
                if (statusEl)
                    statusEl.textContent = "✅ Auto backup enabled and file selected.";
            } catch (err) {
                console.warn("Backup setup canceled or failed:", err);
                const statusEl = document.getElementById("backupStatus");
                if (statusEl) statusEl.textContent = "⚠️ Backup not enabled.";
            }
        });


    }

    // Attach immediately if DOM ready, else wait
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attachBackupButton);
    } else {
        attachBackupButton();
    }


    // --- Watch for direct replacements or major changes ---
    let lastSnapshot = JSON.stringify(animeData);
    setInterval(() => {
        const current = JSON.stringify(animeData);
        if (current !== lastSnapshot) {
            localStorage.setItem("animeData", current);
            triggerBackupSave();
            lastSnapshot = current;
        }
    }, 5000);

    // --- Show status if backup was already enabled on reload ---
    if (backupHandle) {
        const statusEl = document.getElementById("backupStatus");
        if (statusEl) {
            statusEl.textContent = "✅ Auto backup enabled and file selected.";
            statusEl.style.color = "limegreen";
        }
        console.log("🔁 Restored existing backup handle from IndexedDB.");
    }

    console.log("💾 Persistent auto-backup active (Edge/Chrome only).");


})();

// -----------------------------
// Persistent filter restore
// -----------------------------
(function restoreFiltersFromLocalStorage() {
    const mappings = [
        { elId: 'statusFilter', storageKey: 'animeFilterStatus' },
        { elId: 'monthFilter', storageKey: 'animeFilterMonth' },
        { elId: 'yearFilter', storageKey: 'animeFilterYear' }
    ];

    // Try to restore immediately if elements exist, otherwise retry until they do
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
        attempts++;
        const allReady = mappings.every(m => document.getElementById(m.elId));
        if (!allReady && attempts <= maxAttempts) return;

        clearInterval(interval);

        // Apply saved values (if any) and attach change listeners
        mappings.forEach(({ elId, storageKey }) => {
            const el = document.getElementById(elId);
            if (!el) return;

            const saved = localStorage.getItem(storageKey);
            if (saved && el.value !== saved) {
                el.value = saved;
            }

            // Ensure we save using the existing keys used elsewhere in the app
            el.addEventListener('change', (e) => {
                localStorage.setItem(storageKey, e.target.value);
                if (typeof updateAnimeDisplay === 'function') updateAnimeDisplay();
            });
        });

        // After restoring, refresh display so filters apply immediately
        if (typeof updateAnimeDisplay === 'function') {
            updateAnimeDisplay();
        }
    }, 200);
})();

// ============================================================
// 👤 Persistent User Avatar
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const avatarEl = document.querySelector(".user-avatar");
    if (!avatarEl) return;

    // 🔁 Restore saved avatar on page load
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
        avatarEl.src = savedAvatar;
        console.log("✅ Restored saved avatar.");
    } else {
        console.log("ℹ️ No saved avatar found, using default.");
    }

    // 🖼️ Handle custom upload (if you add a hidden input)
    const uploadInput = document.getElementById("avatarUpload");
    if (uploadInput) {
        uploadInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const dataURL = event.target.result;
                avatarEl.src = dataURL;
                localStorage.setItem("userAvatar", dataURL);
                console.log("💾 Avatar updated and saved.");
            };
            reader.readAsDataURL(file);
        });
    }
});

// =============================================
// UPDATE 1.0.1 — User Insights (Dashboard)
// =============================================
function updateUserInsights() {
    const el = document.getElementById('user-insights');
    if (!el) return;

    const genres = {};
    let totalHours = 0, totalEpisodes = 0, months = {};

    animeData.forEach(anime => {
        if (anime.userStatus !== "Completed") return;

        // Count genres
        if (Array.isArray(anime.genres)) {
            anime.genres.forEach(g => {
                genres[g] = (genres[g] || 0) + 1;
            });
        }

        // Count month activity
        if (anime.finishDate) {
            const m = new Date(anime.finishDate).toLocaleString("default", { month: "short" });
            months[m] = (months[m] || 0) + 1;
        }

        // Calculate total hours
        if (anime.duration && anime.episodes) {
            totalHours += (anime.duration * anime.episodes) / 60;
        }

        // Count total episodes watched
        if (anime.episodes) totalEpisodes += anime.episodes;
    });

    // Compute summary
    const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const topMonth = Object.entries(months).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const totalRounded = Math.round(totalHours);

    // Helper: Compact number (e.g. 2807 -> 2.8k)
    const formatCompact = num => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return num.toString();
    };

    // Render insights with hover tooltips showing exact values
    el.innerHTML = `
      <div class="insight-card">
        <div><strong>Top Genre:</strong> ${topGenre}</div>
      </div>
      <div class="insight-card" title="${totalEpisodes.toLocaleString()} Episodes">
        <div><strong>Total Episodes Watched:</strong> ${formatCompact(totalEpisodes)}</div>
      </div>
      <div class="insight-card" title="${totalRounded.toLocaleString()} Hours">
        <div><strong>Total Hours Watched:</strong> ${formatCompact(totalRounded)} hrs</div>
      </div>
      <div class="insight-card">
        <div><strong>Most Active Month:</strong> ${topMonth}</div>
      </div>
    `;
}

// Hook into anime display refresh
const oldUpdateAnimeDisplay_102 = window.updateAnimeDisplay;
window.updateAnimeDisplay = function () {
    if (typeof oldUpdateAnimeDisplay_102 === 'function') oldUpdateAnimeDisplay_102();
    setTimeout(updateUserInsights, 400);
};

// =============================================
// CURRENTLY WATCHING DASHBOARD MODULE (auto-hide if empty)
// =============================================
(function () {
    document.addEventListener('DOMContentLoaded', () => {

        function getEpisodeProgress(anime) {
            const current =
                anime.currentEpisode ??
                anime.episodesWatched ??
                anime.watchedEpisodes ??
                anime.epWatched ??
                anime.progress ??
                0;

            const total =
                anime.totalEpisodes ??
                anime.episodes ??
                anime.epTotal ??
                anime.totalEp ??
                null;

            return { current, total };
        }

        function updateCurrentlyWatching() {
            const section = document.getElementById('currently-watching-section');
            const container = document.getElementById('currently-watching-grid');
            if (!section || !container) {
                console.warn('❌ Currently Watching: Elements not found');
                return;
            }

            // Get anime data from global variable or localStorage
            let dataToUse = animeData;
            if (!Array.isArray(dataToUse)) {
                const stored = localStorage.getItem('animeData');
                dataToUse = stored ? JSON.parse(stored) : [];
            }

            console.log('📊 Currently Watching - Total anime in data:', dataToUse.length);
            console.log('📊 Anime data sample:', dataToUse.slice(0, 3).map(a => ({ title: a.title, status: a.userStatus })));

            // Filter for "Watching" status (exact match on userStatus property)
            const watchingList = dataToUse.filter(a => {
                const status = a.userStatus;
                const isWatching = status === 'Watching';
                if (isWatching) {
                    console.log(`✅ Found watching anime: ${a.title} (status: "${status}")`);
                }
                return isWatching;
            });

            console.log(`🎬 Currently Watching - Found ${watchingList.length} anime with "Watching" status`);

            // 🟢 Hide or show the whole section
            if (watchingList.length === 0) {
                section.style.display = 'none';
                section.style.visibility = 'hidden';
                section.classList.add('hidden');
                container.innerHTML = '';
                console.log('✅ Currently Watching section HIDDEN (no anime in Watching status)');
                return;
            } else {
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.classList.remove('hidden');
                console.log(`✅ Currently Watching section SHOWN (${watchingList.length} anime)`);
            }

            // 🟡 Populate the grid
            container.innerHTML = watchingList.map(a => {
                const { current, total } = getEpisodeProgress(a);
                const percent = (total && current)
                    ? Math.min(100, Math.round((current / total) * 100))
                    : 0;

                return `
                    <div class="anime-card fade-in" onclick="editAnime && editAnime('${a.id}')">
                        <div class="anime-img-wrapper">
                            <img src="${a.cover || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}"
                                alt="${a.title}" class="anime-cover">
                            ${a.score ? `<div class="rating-badge">${a.score}</div>` : ''}
                        </div>
                        <div class="anime-info">
                            <div class="anime-title">${a.title}</div>
                            <div class="anime-meta">
                                <span>${current}${total ? `/${total}` : ''} eps</span>
                                ${a.type ? `<span class="anime-type">${a.type}</span>` : ''}
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${percent}%;"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        updateCurrentlyWatching();
        window.updateCurrentlyWatching = updateCurrentlyWatching;
    });
})();
// =============================================
// COMPLETE ACTIVITY HEATMAP - FULLY FIXED
// Handles all date formats (ISO, YYYY-MM, YYYY-MM-DD, timestamps)
// Shows correct completion dates, no duplication, no cross-year contamination
// =============================================

class ActivityHeatmap {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentDay = new Date();
        this.contributions = this.loadContributions();
        this.tooltip = null;
        this.init();
    }

    init() {
        this.createTooltip();
        this.render();
        this.attachEventListeners();
        this.startAutoRefresh();
        this.setupThemeObserver();
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'heatmap-tooltip';
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.background = 'linear-gradient(135deg, #1a1f2e, #0f1420)';
        this.tooltip.style.color = 'white';
        this.tooltip.style.padding = '10px 16px';
        this.tooltip.style.borderRadius = '12px';
        this.tooltip.style.fontSize = '0.75rem';
        this.tooltip.style.fontWeight = '500';
        this.tooltip.style.border = '1px solid rgba(139, 92, 246, 0.4)';
        this.tooltip.style.backdropFilter = 'blur(8px)';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.zIndex = '10000';
        this.tooltip.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        this.tooltip.style.whiteSpace = 'nowrap';
        this.tooltip.style.display = 'none';
        this.tooltip.style.transition = 'opacity 0.2s ease';
        document.body.appendChild(this.tooltip);
    }

    // ============================================
    // DATE PARSING - Handles ALL formats
    // ============================================
    
    parseDateSafely(dateValue) {
        if (!dateValue) return null;
        
        // Case 1: Number timestamp (e.g., 1776371330194)
        if (typeof dateValue === 'number') {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime()) && date.getFullYear() > 2000) {
                return date;
            }
        }
        
        // Case 2: String date
        if (typeof dateValue === 'string') {
            // Format: YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                const [year, month, day] = dateValue.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) return date;
            }
            
            // Format: YYYY-MM
            if (/^\d{4}-\d{2}$/.test(dateValue)) {
                const [year, month] = dateValue.split('-').map(Number);
                const date = new Date(year, month - 1, 15);
                if (!isNaN(date.getTime())) return date;
            }
            
            // Format: ISO with timezone (2024-04-01T00:00:00.000Z)
            if (dateValue.includes('T')) {
                const datePart = dateValue.split('T')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                    const [year, month, day] = datePart.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    if (!isNaN(date.getTime())) return date;
                }
            }
            
            // Format: Datetime with space (2026-04-16 19:54:40)
            if (dateValue.includes(' ')) {
                const datePart = dateValue.split(' ')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                    const [year, month, day] = datePart.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    if (!isNaN(date.getTime())) return date;
                }
            }
            
            // Format: Just year (rare)
            if (/^\d{4}$/.test(dateValue)) {
                const year = parseInt(dateValue);
                const date = new Date(year, 0, 1);
                if (!isNaN(date.getTime())) return date;
            }
        }
        
        return null;
    }

    formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // ============================================
    // LOAD & GENERATE CONTRIBUTIONS
    // ============================================
    
    loadContributions() {
        const saved = localStorage.getItem('animeContributions');
        if (saved && Object.keys(JSON.parse(saved)).length > 0) {
            return JSON.parse(saved);
        }
        return this.generateFromAnimeData();
    }

    generateFromAnimeData() {
        const contributions = {};
        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const processedAnime = new Set();

        animeData.forEach(anime => {
            // ONLY track completed anime
            if (anime.userStatus !== 'Completed') return;
            
            let completionDate = null;
            
            // PRIORITY 1: Use actualFinishDate (exact day - most accurate)
            if (anime.actualFinishDate) {
                completionDate = this.parseDateSafely(anime.actualFinishDate);
            }
            
            // PRIORITY 2: Use finishDate
            if (!completionDate && anime.finishDate) {
                completionDate = this.parseDateSafely(anime.finishDate);
            }
            
            // PRIORITY 3: Use completedTimestamp
            if (!completionDate && anime.completedTimestamp) {
                completionDate = this.parseDateSafely(anime.completedTimestamp);
            }
            
            // PRIORITY 4: Use updatedAt as last resort
            if (!completionDate && anime.updatedAt) {
                completionDate = this.parseDateSafely(anime.updatedAt);
            }
            
            // PRIORITY 5: Use createdAt
            if (!completionDate && anime.createdAt) {
                completionDate = this.parseDateSafely(anime.createdAt);
            }
            
            if (completionDate && !isNaN(completionDate.getTime())) {
                const dateKey = this.formatDateKey(completionDate);
                const uniqueKey = `${anime.id || anime.title}_${dateKey}`;
                
                if (!processedAnime.has(uniqueKey)) {
                    processedAnime.add(uniqueKey);
                    contributions[dateKey] = (contributions[dateKey] || 0) + 1;
                }
            }
        });

        return contributions;
    }

    saveContributions() {
        localStorage.setItem('animeContributions', JSON.stringify(this.contributions));
    }

    // ============================================
    // ADD CONTRIBUTION (when anime is added/completed)
    // ============================================
    
    addContribution(amount = 1, anime = null, action = null) {
        // For completed anime, just refresh from data to prevent duplication
        if (action === 'completed') {
            setTimeout(() => {
                this.refreshFromAnimeData();
                this.showToast(`✓ Completed anime recorded!`, '#10b981');
            }, 500);
            return;
        }
        
        const today = this.formatDateKey(this.currentDay);
        if (amount > 0) {
            this.contributions[today] = (this.contributions[today] || 0) + amount;
            this.saveContributions();
            this.render();
            
            if (action) {
                this.showToast(`+${amount} contribution${amount !== 1 ? 's' : ''} added!`, '#6366f1');
            }
        }
    }

    showToast(message, color = '#6366f1') {
        const existingToasts = document.querySelectorAll('.heatmap-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = 'heatmap-toast';
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = `linear-gradient(135deg, ${color}, ${color === '#10b981' ? '#059669' : '#4f46e5'})`;
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '30px';
        toast.style.fontSize = '0.8rem';
        toast.style.fontWeight = '500';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        toast.style.animation = 'fadeInOut 2s ease';

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // ============================================
    // GET DATA
    // ============================================
    
    getContribution(date) {
        const key = this.formatDateKey(date);
        return this.contributions[key] || 0;
    }

    getTotalForYear(year) {
        let total = 0;
        for (const [date, count] of Object.entries(this.contributions)) {
            if (date.startsWith(year.toString())) {
                total += count;
            }
        }
        return total;
    }

    getColorLevel(count) {
        if (count === 0) return 0;
        if (count <= 1) return 1;
        if (count <= 2) return 2;
        if (count <= 3) return 3;
        return 4;
    }

    getColorForLevel(level) {
        const colors = {
            0: '#2d3748',  // No activity - dark gray
            1: '#9be9a8',  // 1 anime - light green
            2: '#40c463',  // 2 anime - medium green
            3: '#30a14e',  // 3 anime - dark green
            4: '#216e39'   // 4+ anime - darkest green
        };
        return colors[level] || colors[0];
    }

    // ============================================
    // WEEKS DATA GENERATION
    // ============================================
    
    getWeeksData(year) {
        const weeks = [];
        const today = new Date();
        const maxDate = (year === this.currentYear) ? today : new Date(year, 11, 31);

        // Find first Sunday of the year
        const firstDay = new Date(year, 0, 1);
        let firstSunday = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        firstSunday.setDate(firstDay.getDate() - dayOfWeek);

        // Generate weeks
        for (let week = 0; week < 53; week++) {
            const weekStart = new Date(firstSunday);
            weekStart.setDate(firstSunday.getDate() + (week * 7));

            if (weekStart > maxDate) break;

            const days = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(weekStart.getDate() + day);

                if (currentDate <= maxDate && currentDate >= new Date(year, 0, 1)) {
                    const count = this.getContribution(currentDate);
                    days.push({
                        date: new Date(currentDate),
                        count: count,
                        dateStr: this.formatDateKey(currentDate),
                        level: this.getColorLevel(count)
                    });
                } else {
                    days.push(null);
                }
            }

            if (days.some(d => d !== null)) {
                weeks.push(days);
            }
        }

        return weeks;
    }

    // ============================================
    // RENDER HEATMAP
    // ============================================
    
    renderMonthLabels(weeks) {
        let container = document.getElementById('heatmapMonths');
        if (!container) {
            const wrapper = document.querySelector('.heatmap-wrapper');
            if (wrapper) {
                container = document.createElement('div');
                container.id = 'heatmapMonths';
                container.className = 'heatmap-months';
                wrapper.insertBefore(container, wrapper.firstChild);
            }
        }
        
        if (!container) return;

        const monthPositions = {};
        let currentMonth = -1;

        weeks.forEach((week, weekIndex) => {
            week.forEach((day) => {
                if (day && day.date.getDate() <= 7 && day.date.getMonth() !== currentMonth) {
                    currentMonth = day.date.getMonth();
                    const position = weekIndex * 15 + 10;
                    monthPositions[currentMonth] = {
                        name: day.date.toLocaleString('default', { month: 'short' }),
                        position: position
                    };
                }
            });
        });

        const sortedMonths = Object.entries(monthPositions)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([_, data]) => data);

        container.innerHTML = sortedMonths.map(month => `
            <span class="month-label" style="left: ${month.position}px;">${month.name}</span>
        `).join('');
    }

    renderHeatmap() {
        const container = document.getElementById('heatmapGrid');
        if (!container) return;

        const weeks = this.getWeeksData(this.currentYear);
        container.innerHTML = '';

        weeks.forEach(week => {
            const col = document.createElement('div');
            col.className = 'heatmap-col';
            col.style.display = 'flex';
            col.style.flexDirection = 'column';
            col.style.gap = '3px';

            week.forEach(day => {
                if (day === null) {
                    const emptyCell = document.createElement('div');
                    emptyCell.style.width = '12px';
                    emptyCell.style.height = '12px';
                    emptyCell.style.visibility = 'hidden';
                    col.appendChild(emptyCell);
                } else {
                    const cell = document.createElement('div');
                    const color = this.getColorForLevel(day.level);
                    cell.className = `heatmap-cell level-${day.level}`;
                    cell.setAttribute('data-date', day.dateStr);
                    cell.setAttribute('data-count', day.count);
                    cell.style.width = '12px';
                    cell.style.height = '12px';
                    cell.style.borderRadius = '3px';
                    cell.style.cursor = 'pointer';
                    cell.style.transition = 'all 0.15s ease';
                    cell.style.backgroundColor = color;

                    cell.addEventListener('mouseenter', (e) => this.showTooltip(e, day));
                    cell.addEventListener('mouseleave', () => this.hideTooltip());

                    col.appendChild(cell);
                }
            });

            container.appendChild(col);
        });

        this.renderMonthLabels(weeks);
    }

    // ============================================
    // YEAR BUTTONS (Dynamic from data)
    // ============================================
    
    getAvailableYears() {
        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const years = new Set();
        const currentYear = new Date().getFullYear();
        
        animeData.forEach(anime => {
            if (anime.userStatus === 'Completed') {
                // Check actualFinishDate
                if (anime.actualFinishDate) {
                    const yearMatch = anime.actualFinishDate.match(/^\d{4}/);
                    if (yearMatch) years.add(parseInt(yearMatch[0]));
                }
                // Check finishDate
                if (anime.finishDate) {
                    const yearMatch = anime.finishDate.match(/^\d{4}/);
                    if (yearMatch) years.add(parseInt(yearMatch[0]));
                }
                // Check completedTimestamp
                if (anime.completedTimestamp) {
                    const date = this.parseDateSafely(anime.completedTimestamp);
                    if (date) years.add(date.getFullYear());
                }
            }
        });
        
        if (years.size === 0) years.add(currentYear);
        return Array.from(years).sort((a, b) => b - a);
    }

    renderYearButtons() {
        const years = this.getAvailableYears();
        const container = document.getElementById('heatmapYears');
        if (!container) return;

        container.innerHTML = years.map(year => `
            <button class="year-btn ${year === this.currentYear ? 'active' : ''}" data-year="${year}">
                ${year}
            </button>
        `).join('');

        container.querySelectorAll('.year-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentYear = parseInt(btn.dataset.year);
                this.renderYearButtons();
                this.renderHeatmap();
                this.updateTotalDisplay();
            });
        });
    }

    updateTotalDisplay() {
        const total = this.getTotalForYear(this.currentYear);
        const totalSpan = document.getElementById('totalCount');
        const yearSpan = document.getElementById('currentYearDisplay');
        if (totalSpan) totalSpan.textContent = total;
        if (yearSpan) yearSpan.textContent = this.currentYear;
    }

    // ============================================
    // TOOLTIP
    // ============================================
    
    showTooltip(event, day) {
        if (!day) return;

        const count = day.count;
        const date = day.date;
        const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const contributionText = count === 1 ? 'completion' : 'completions';

        this.tooltip.innerHTML = `${count} anime ${contributionText} on ${formattedDate}`;
        this.tooltip.style.display = 'block';

        let left = event.clientX + 15;
        let top = event.clientY - 30;

        if (left + 200 > window.innerWidth) {
            left = event.clientX - 200;
        }
        if (top < 0) {
            top = event.clientY + 20;
        }

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    // ============================================
    // EVENT LISTENERS & AUTO REFRESH
    // ============================================
    
    attachEventListeners() {
        window.addEventListener('animeUpdate', () => {
            setTimeout(() => this.refreshFromAnimeData(), 300);
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'animeContributions') {
                this.contributions = JSON.parse(e.newValue) || {};
                this.render();
            } else if (e.key === 'animeData') {
                this.refreshFromAnimeData();
            }
        });
    }

    startAutoRefresh() {
        setInterval(() => {
            const newDay = new Date();
            if (newDay.getDate() !== this.currentDay.getDate()) {
                this.currentDay = newDay;
                if (this.currentYear === newDay.getFullYear()) {
                    this.refreshFromAnimeData();
                } else {
                    this.render();
                }
            }
        }, 60000);
    }

    setupThemeObserver() {
        const observer = new MutationObserver(() => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            const tooltipBg = isDark ? '#1a1f2e' : '#ffffff';
            const tooltipText = isDark ? 'white' : '#1a1f2e';
            if (this.tooltip) {
                this.tooltip.style.background = tooltipBg;
                this.tooltip.style.color = tooltipText;
            }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    refreshFromAnimeData() {
        this.contributions = this.generateFromAnimeData();
        this.saveContributions();
        this.render();
    }

    render() {
        this.renderYearButtons();
        this.renderHeatmap();
        this.updateTotalDisplay();
    }
}

// =============================================
// INTEGRATION FUNCTIONS
// =============================================

function onAnimeAdded(anime) {
    if (window.heatmap) {
        window.heatmap.addContribution(1, anime, 'add');
        window.dispatchEvent(new CustomEvent('animeUpdate', {
            detail: { count: 1, anime: anime, action: 'add' }
        }));
    }
}

function onAnimeCompleted(anime) {
    if (window.heatmap) {
        window.heatmap.addContribution(2, anime, 'completed');
        window.dispatchEvent(new CustomEvent('animeUpdate', {
            detail: { count: 2, anime: anime, action: 'completed' }
        }));
    }
}

function onAnimeUpdated(anime) {
    if (window.heatmap) {
        window.heatmap.addContribution(1, anime, 'update');
        window.dispatchEvent(new CustomEvent('animeUpdate', {
            detail: { count: 1, anime: anime, action: 'update' }
        }));
    }
}

function hookHeatmapToAnimeFunctions() {
    const originalHandleAddAnime = window.handleAddAnime;

    if (typeof originalHandleAddAnime === 'function') {
        window.handleAddAnime = function (e) {
            const wasEditing = window.isEditing;
            const title = document.getElementById('animeTitle')?.value;
            const status = document.getElementById('animeStatus')?.value;
            const anime = {
                title: title,
                episodes: parseInt(document.getElementById('animeEpisodes')?.value) || 0,
                id: document.getElementById('animeId')?.value
            };

            originalHandleAddAnime(e);

            setTimeout(() => {
                if (window.heatmap) {
                    if (wasEditing) {
                        if (status === 'Completed') {
                            onAnimeCompleted(anime);
                        } else {
                            onAnimeUpdated(anime);
                        }
                    } else {
                        onAnimeAdded(anime);
                    }
                    window.heatmap.refreshFromAnimeData();
                }
            }, 300);
        };
    }

    const originalDeleteAnime = window.deleteAnime;
    if (typeof originalDeleteAnime === 'function') {
        window.deleteAnime = function () {
            originalDeleteAnime();
            setTimeout(() => {
                if (window.heatmap) {
                    window.heatmap.refreshFromAnimeData();
                }
            }, 300);
        };
    }

    const originalUpdateAllComponents = window.updateAllComponents;
    if (typeof originalUpdateAllComponents === 'function') {
        window.updateAllComponents = function () {
            originalUpdateAllComponents();
            setTimeout(() => {
                if (window.heatmap) {
                    window.heatmap.refreshFromAnimeData();
                }
            }, 200);
        };
    }
}

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    window.heatmap = new ActivityHeatmap();

    setTimeout(() => {
        if (window.heatmap) {
            window.heatmap.refreshFromAnimeData();
        }
    }, 500);

    setTimeout(hookHeatmapToAnimeFunctions, 1000);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(20px); }
            15% { opacity: 1; transform: translateX(0); }
            85% { opacity: 1; transform: translateX(0); }
            100% { opacity: 0; transform: translateX(20px); }
        }
        
        .heatmap-cell:hover {
            transform: scale(1.2);
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
            z-index: 10;
        }
        
        .heatmap-col {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        
        .heatmap-toast {
            animation: fadeInOut 2s ease;
        }
        
        .heatmap-months {
            position: relative;
            height: 20px;
            margin-bottom: 10px;
        }
        
        .month-label {
            position: absolute;
            font-size: 11px;
            color: #888;
        }
        
        .heatmap-years {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .year-btn {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 5px 12px;
            cursor: pointer;
            color: #94a3b8;
            transition: all 0.3s ease;
        }
        
        .year-btn:hover {
            border-color: #6366f1;
            color: #6366f1;
        }
        
        .year-btn.active {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-color: transparent;
            color: white;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ Activity Heatmap initialized successfully!');
});

// =============================================
// DARK DASHBOARD CHARTS 
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // GLOBAL CHART STYLING
    // =========================
    Chart.defaults.color = "#b5b8ff";
    Chart.defaults.borderColor = "rgba(255,255,255,0.05)";
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.plugins.legend.labels.color = "#aab";
    Chart.defaults.plugins.title.color = "#b5b8ff";
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(0,0,0,0.7)";
    Chart.defaults.plugins.tooltip.titleColor = "#fff";
    Chart.defaults.plugins.tooltip.bodyColor = "#ddd";
    Chart.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.1)";
    Chart.defaults.plugins.tooltip.borderWidth = 1;

    const completed = animeData.filter(a => a.userStatus?.toLowerCase() === 'completed');

    //   Watch Time by Day of Week
    (function watchByWeekdayChartInit() {
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const totals = Array(7).fill(0);

        completed.forEach(a => {
            if (!a.finishDate || !a.episodes || !a.duration) return;
            const d = new Date(a.finishDate);
            const day = isNaN(d.getDay()) ? Math.floor(Math.random() * 7) : d.getDay();
            const hours = (a.episodes * a.duration) / 60;
            totals[day] += hours;
        });

        new Chart(document.getElementById('watchByWeekdayChart'), {
            type: 'line',
            data: {
                labels: weekdays,
                datasets: [{
                    label: 'Total Hours Watched',
                    data: totals,
                    borderColor: 'rgba(231,76,60,1)',
                    backgroundColor: 'rgba(231,76,60,0.3)',
                    tension: 0.3,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        color: '#b5b8ff',
                        font: { size: 16, weight: 'bold' },
                        padding: { bottom: 10 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#9ca3af" },
                        title: { display: true, text: 'Hours', color: '#b5b8ff' }
                    },
                    x: {
                        grid: { color: "rgba(255,255,255,0.03)" },
                        ticks: { color: "#9ca3af" }
                    }
                }
            }
        });
    })();

    //  Longest & Shortest Anime — SPLIT INTO TWO CHARTS
    (function animeLengthCharts() {
        const sorted = [...completed].sort((a, b) => b.episodes - a.episodes);
        const longest = sorted.slice(0, 5);

        const nonMovies = sorted.filter(a => a.type?.toLowerCase() !== "movie");
        const shortest = nonMovies.slice(-5).reverse();

        // === Longest Chart ===
        new Chart(document.getElementById('longestAnimeChart'), {
            type: 'bar',
            data: {
                labels: longest.map(a => `${a.title.slice(0, 15)}`),
                datasets: [{
                    label: 'Episodes',
                    data: longest.map(a => a.episodes),
                    backgroundColor: 'rgba(46, 204, 113,0.7)',
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        font: { size: 16, weight: 'bold' },
                        color: '#b5b8ff',
                        padding: { bottom: 10 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#9ca3af" },
                        title: { display: true, text: 'Episodes', color: '#b5b8ff' }
                    },
                    x: {
                        grid: { color: "rgba(255,255,255,0.03)" },
                        ticks: { color: "#9ca3af", maxRotation: 0 }
                    }
                }
            }
        });

        // === Shortest Chart ===
        new Chart(document.getElementById('shortestAnimeChart'), {
            type: 'bar',
            data: {
                labels: shortest.map(a => `${a.title.slice(0, 15)}`),
                datasets: [{
                    label: 'Episodes',
                    data: shortest.map(a => a.episodes),
                    backgroundColor: 'rgba(241, 196, 15,0.7)',
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        font: { size: 16, weight: 'bold' },
                        color: '#b5b8ff',
                        padding: { bottom: 10 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#9ca3af" },
                        title: { display: true, text: 'Episodes', color: '#b5b8ff' }
                    },
                    x: {
                        grid: { color: "rgba(255,255,255,0.03)" },
                        ticks: { color: "#9ca3af", maxRotation: 0 }
                    }
                }
            }
        });
    })();

    //  Favorite Seasons Chart
    (function seasonalPreferenceChartInit() {
        const seasonMap = { Winter: 0, Spring: 0, Summer: 0, Fall: 0 };
        completed.forEach(a => {
            if (!a.finishDate) return;
            const [, month] = a.finishDate.split('-');
            const m = parseInt(month, 10);
            const season =
                m <= 2 ? 'Winter' :
                    m <= 5 ? 'Spring' :
                        m <= 8 ? 'Summer' :
                            'Fall';
            seasonMap[season]++;
        });

        new Chart(document.getElementById('seasonalPreferenceChart'), {
            type: 'polarArea',
            data: {
                labels: Object.keys(seasonMap),
                datasets: [{
                    data: Object.values(seasonMap),
                    backgroundColor: [
                        'rgba(52,152,219,0.7)',
                        'rgba(46,204,113,0.7)',
                        'rgba(241,196,15,0.7)',
                        'rgba(231,76,60,0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#b5b8ff' } },
                    title: {
                        display: true,
                        color: '#b5b8ff',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        });
    })();
});

//  Handle "Member Since" date
function initMemberSince() {
    const key = "memberSinceDate";
    let joinDate = localStorage.getItem(key);

    // If user is new, store today's date
    if (!joinDate) {
        joinDate = new Date().toISOString();
        localStorage.setItem(key, joinDate);
    }

    // Format for display (e.g., "October 2025")
    const date = new Date(joinDate);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const display = `Member since ${month} ${year}`;
    const textEl = document.getElementById("memberSinceText");
    if (textEl) textEl.textContent = display;
}
//  Initialize after DOM is ready
document.addEventListener("DOMContentLoaded", initMemberSince);

document.addEventListener("DOMContentLoaded", () => {
    const themeCards = document.querySelectorAll(".theme-card, .theme-option"); // supports both class names

    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";

    // Apply saved theme to <body>
    document.body.dataset.theme = savedTheme;

    // Highlight the active theme card
    themeCards.forEach((card) => {
        const theme = card.dataset.theme;
        if (theme === savedTheme) card.classList.add("active");

        card.addEventListener("click", () => {
            // Remove previous active state
            themeCards.forEach((c) => c.classList.remove("active"));
            card.classList.add("active");

            // Apply and store theme
            const selectedTheme = card.dataset.theme;
            localStorage.setItem("theme", selectedTheme);

            if (selectedTheme === "system") {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                document.body.dataset.theme = prefersDark ? "dark" : "light";
            } else {
                document.body.dataset.theme = selectedTheme;
            }
        });
    });
});
/* =========================================================
   Dashboard Search → Temporary Filter Override (FINAL UX)
   ========================================================= */

(function () {
    const searchInput = document.getElementById('dashboardSearch');
    const animeMenu = document.querySelector('.menu-item[data-page="anime-list"]');

    if (!searchInput || !animeMenu) return;

    let navigated = false;
    let savedFilters = null;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();

        // Navigate once
        if (!navigated) {
            navigated = true;
            animeMenu.click();
        }

        // Save filters ONCE when search starts
        if (query && !savedFilters) {
            savedFilters = getCurrentFilters();
            setFiltersToAll();
        }

        // Restore filters when search is cleared
        if (!query && savedFilters) {
            restoreFilters(savedFilters);
            savedFilters = null;
            navigated = false;
            return;
        }

        // Filter after render
        setTimeout(() => filterTable(query), 150);
    });

    /* ---------- helpers ---------- */

    function getCurrentFilters() {
        return {
            status: document.getElementById('statusFilter')?.value,
            month: document.getElementById('monthFilter')?.value,
            year: document.getElementById('yearFilter')?.value
        };
    }

    function setFiltersToAll() {
        setFilterValue('statusFilter', 'all');
        setFilterValue('monthFilter', 'all');
        setFilterValue('yearFilter', 'all');
    }

    function restoreFilters(filters) {
        setFilterValue('statusFilter', filters.status);
        setFilterValue('monthFilter', filters.month);
        setFilterValue('yearFilter', filters.year);
    }

    function setFilterValue(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = value;
        el.dispatchEvent(new Event('change'));
    }

    function filterTable(query) {
        const rows = document.querySelectorAll('#anime-table-body tr');
        if (!rows.length) return;

        rows.forEach(row => {
            const title = row.cells[0]?.textContent.toLowerCase() || '';
            row.style.display = !query || title.includes(query) ? '' : 'none';
        });
    }
})();

/* =========================================================
    STABLE ANILIST SEARCH 
   ========================================================= */

window.normalizeAnimeData = function (anime) {
    return {
        title: anime.title.english || anime.title.romaji,
        episodes: anime.episodes || 0,
        score: anime.averageScore ? anime.averageScore / 10 : null,
        images: {
            jpg: {
                image_url: anime.coverImage?.large || "https://placehold.co/150x200?text=No+Image"
            }
        },
        genres: (anime.genres || []).map(g => ({ name: g })),
        type: anime.format || "TV"
    };
};




/* ==================================================
   ANIPULSE RECAP SYSTEM (12-SLIDE COMPREHENSIVE)
================================================== */

/* ---------- CONFIG ---------- */
const RECAP_ACTIVE = true;          // Enable recaps
const RECAP_WINDOW_DAYS = 7;        // Recaps available first 7 days of each month
const TEST_MODE = false;           // Set to true to force Jan-only for testing

/* ---------- STATE ---------- */
let recapSlides = [];
let currentSlide = 0;

/* ==================================================
   DATE WINDOW LOGIC
================================================== */

function isRecapWindowOpen() {
    if (!RECAP_ACTIVE) return false;

    // TEST MODE: Only January 1-21
    if (TEST_MODE) {
        const d = new Date();
        return d.getMonth() === 5 && d.getDate() <= 21;
    }

    // PRODUCTION: First 7 days of ANY month
    const d = new Date();
    return d.getDate() <= RECAP_WINDOW_DAYS;
}

function getPreviousMonthForRecap() {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0–11
    const currentYear = now.getFullYear();

    let targetMonth, targetYear;

    if (currentMonth === 0) {
        // January → December of previous year
        targetMonth = 11;
        targetYear = currentYear - 1;
    } else {
        // Other months → previous month
        targetMonth = currentMonth - 1;
        targetYear = currentYear;
    }

    return { month: targetMonth, year: targetYear };
}

function getPreviousYearForRecap() {
    const now = new Date();
    return now.getFullYear() - 1;
}

/* ==================================================
   TOAST SYSTEM
================================================== */

function createToast(message, options = {}) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast " + (options.type || "info");

    const text = document.createElement("span");
    text.innerHTML = message;
    toast.appendChild(text);

    if (options.actionText && options.onAction) {
        const btn = document.createElement("button");
        btn.className = "toast-action";
        btn.innerHTML = options.actionText;

        btn.onclick = () => {
            options.onAction();
            toast.remove();
        };

        toast.appendChild(btn);
    }

    container.appendChild(toast);

    if (!options.persist) {
        setTimeout(() => toast.remove(), 4000);
    }
}

/* ==================================================
   DATA SOURCE
================================================== */

function getAnimeData() {
    return animeData || [];
}

/* ==================================================
   STORAGE KEYS
================================================== */

const RECAP_KEYS = {
    monthlyAutoSeen: (y, m) => `recap-monthly-auto-${y}-${m}`,
    yearlyAutoSeen: y => `recap-yearly-auto-${y}`
};

// ==============================
// Global constants
// ==============================
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];


/* ==================================================
   COMPLETION TIME NORMALIZER
================================================== */

function getCompletionTime(anime) {
    // 1. Try finishDate first
    if (anime.finishDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(anime.finishDate)) {
            const [year, month, day] = anime.finishDate.split('-').map(Number);
            const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            return date.getTime();
        }
    }

    // 2. Fallback to completedTimestamp
    if (anime.completedTimestamp) return anime.completedTimestamp;

    // 3. Fallback to updatedAt
    if (anime.updatedAt) {
        const date = new Date(anime.updatedAt);
        date.setHours(23, 59, 59, 999);
        return date.getTime();
    }

    return null;
}
function buildComprehensiveRecap(list, type, periodInfo = {}) {
    const isYearly = type === 'Yearly';

    // Resolve month name (ONLY for monthly recaps)
    const monthName =
        !isYearly && typeof periodInfo.month === 'number'
            ? MONTH_NAMES[periodInfo.month]   // month is 0–11
            : null;

    if (!list.length) {
        return {
            totalAnime: 0,
            totalHours: 0,
            totalEpisodes: 0,
            avgEpisodesPerDay: 0,
            avgScore: 0,
            topGenre: "—",
            secondGenre: "—",
            thirdGenre: "—",
            topAnime: null,
            completionMonth: null,
            animeByScore: [],
            avgDuration: 0,
            streakDays: 0,
            monthName,
            year: periodInfo.year,
            type
        };
    }

    // =========================
    // Basic stats
    // =========================
    const totalEpisodes = list.reduce((sum, a) => sum + (a.episodes || 0), 0);
    const totalMinutes = list.reduce(
        (sum, a) => sum + (a.episodes * (a.duration || 0)),
        0
    );
    const totalHours = totalMinutes / 60;

    // Average score
    const scoredAnime = list.filter(a => a.score && a.score > 0);
    const avgScore = scoredAnime.length
        ? (
            scoredAnime.reduce((sum, a) => sum + a.score, 0) /
            scoredAnime.length
        ).toFixed(1)
        : 0;

    // Genre analysis
    const genres = {};
    list.forEach(a =>
        (a.genres || []).forEach(g => (genres[g] = (genres[g] || 0) + 1))
    );
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]);

    // Top anime (by score)
    const animeByScore = [...list]
        .filter(a => a.score && a.score > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    // Average episodes per day
    const daysInPeriod = isYearly
        ? 365
        : new Date(periodInfo.year, periodInfo.month + 1, 0).getDate();

    const avgEpisodesPerDay = (totalEpisodes / daysInPeriod).toFixed(1);

    // Average duration
    const avgDuration = (
        list.reduce((sum, a) => sum + (a.duration || 0), 0) / list.length
    ).toFixed(0);

    // Busiest month (yearly only)
    let completionMonth = null;
    if (isYearly) {
        const months = {};
        list.forEach(a => {
            const time = getCompletionTime(a);
            if (time) {
                const m = new Date(time).getMonth();
                months[m] = (months[m] || 0) + 1;
            }
        });

        const busiest = Object.entries(months).sort((a, b) => b[1] - a[1])[0];
        if (busiest) {
            completionMonth = MONTH_NAMES[parseInt(busiest[0])];
        }
    }

    // Streak calculation
    const completionDays = new Set();
    list.forEach(a => {
        const time = getCompletionTime(a);
        if (time) {
            completionDays.add(new Date(time).toISOString().split('T')[0]);
        }
    });

    return {
        totalAnime: list.length,
        totalHours: totalHours.toFixed(1),
        totalEpisodes,
        avgEpisodesPerDay,
        avgScore,
        topGenre: topGenres[0]?.[0] || "—",
        secondGenre: topGenres[1]?.[0] || "—",
        thirdGenre: topGenres[2]?.[0] || "—",
        topAnime: animeByScore[0] || null,
        secondAnime: animeByScore[1] || null,
        thirdAnime: animeByScore[2] || null,
        completionMonth,
        animeByScore: animeByScore.slice(0, 3),
        avgDuration,
        streakDays: completionDays.size,
        monthName,
        year: periodInfo.year,
        type
    };
}

/* ==================================================
   RECAP GENERATORS
================================================== */

function getMonthlyRecap(year, month) {
    // month is 0–11 (JS standard)
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();

    const completed = getAnimeData().filter(a => {
        if (a.userStatus !== "Completed") return false;

        const time = getCompletionTime(a);
        if (!time) return false;

        return time >= start && time <= end;
    });

    return buildComprehensiveRecap(completed, 'Monthly', { month, year });
}

function getYearlyRecap(year) {
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year, 11, 31, 23, 59, 59).getTime();

    const completed = getAnimeData().filter(a => {
        if (a.userStatus !== "Completed") return false;

        const time = getCompletionTime(a);
        if (!time) return false;

        return time >= start && time <= end;
    });

    return buildComprehensiveRecap(completed, 'Yearly', { year });
}

/* ==================================================
   RECAP MODAL (12 SLIDES)
================================================== */

function openRecap(type, data, periodInfo = {}) {
    const modal = document.getElementById("recap-modal");
    if (!modal) {
        console.error("Recap modal not found!");
        createToast('<i class="fas fa-exclamation-circle"></i> Recap modal not found!', { type: 'error' });
        return;
    }

    modal.classList.remove("hidden");

    // Set modal title
    const modalTitle = document.querySelector('.modal-title');
    if (modalTitle) {
        const periodText = periodInfo.month
            ? `${data.monthName} ${data.year}`
            : `${data.year}`;
        modalTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${type} Recap - ${periodText}`;
    }

    // Set progress indicator
    updateProgressIndicator();

    // Generate 12 comprehensive slides
    recapSlides = generateTwelveSlides(data, type, periodInfo);
    currentSlide = 0;
    renderSlide();
}

function generateTwelveSlides(data, type, periodInfo) {
    const periodText = periodInfo.month
        ? `${data.monthName} ${data.year}`
        : `${data.year}`;

    const isYearly = type === 'Yearly';

    if (data.totalAnime === 0) {
        return [
            `<div class="slide-icon"><i class="fas fa-calendar-times"></i></div>
       <h1>No anime completed</h1>
       <p class="period">${periodText}</p>
       <p class="hint">${isYearly ? 'This year' : 'This month'} was quiet...</p>`,

            `<div class="slide-icon"><i class="fas fa-search"></i></div>
       <h1>Explore New Titles</h1>
       <p class="subtitle">Discover hidden gems</p>`,

            `<div class="slide-icon"><i class="fas fa-bullseye"></i></div>
       <h1>Set Watching Goals</h1>
       <p class="subtitle">Plan for next ${isYearly ? 'year' : 'month'}</p>`,

            `<div class="slide-icon"><i class="fas fa-heart"></i></div>
       <h1>Find Your Genre</h1>
       <p class="subtitle">What do you enjoy most?</p>`,

            `<div class="slide-icon"><i class="fas fa-clock"></i></div>
       <h1>Manage Your Time</h1>
       <p class="subtitle">Balance watching schedule</p>`,

            `<div class="slide-icon"><i class="fas fa-users"></i></div>
       <h1>Join Communities</h1>
       <p class="subtitle">Share with other fans</p>`,

            `<div class="slide-icon"><i class="fas fa-star"></i></div>
       <h1>Rate As You Watch</h1>
       <p class="subtitle">Track your favorites</p>`,

            `<div class="slide-icon"><i class="fas fa-tags"></i></div>
       <h1>Organize Your List</h1>
       <p class="subtitle">Keep everything tidy</p>`,

            `<div class="slide-icon"><i class="fas fa-calendar-check"></i></div>
       <h1>Mark Completion Dates</h1>
       <p class="subtitle">For accurate recaps</p>`,

            `<div class="slide-icon"><i class="fas fa-chart-bar"></i></div>
       <h1>Watch Progress Grow</h1>
       <p class="subtitle">See your journey unfold</p>`,

            `<div class="slide-icon"><i class="fas fa-trophy"></i></div>
       <h1>Achievements Await</h1>
       <p class="subtitle">Unlock new milestones</p>`,

            `<div class="slide-icon"><i class="fas fa-flag-checkered"></i></div>
       <h1>Ready for the Next Chapter</h1>
       <p class="subtitle">${periodText} Recap Complete!</p>
       <p class="hint">See you ${isYearly ? 'next year' : 'next month'}!</p>`
        ];
    }

    return [
        // Slide 1: Welcome & Period
        `<div class="slide-icon"><i class="fas fa-calendar-alt"></i></div> <h1>
            ${isYearly
            ? data.year
            : `${data.monthName} ${data.year}`} </h1> <p class="subtitle">
            ${isYearly
            ? `${data.year} Anime Recap`
            : `${data.monthName} Anime Recap`} 
            </p> <p class="hint">Let's look back at your journey</p>
<div class="slide-counter">1/12</div>`,

        // Slide 2: Total Anime Completed
        `<div class="slide-icon"><i class="fas fa-tv"></i></div>
     <h1>${data.totalAnime}</h1>
     <p class="subtitle">Anime Completed</p>
     <p class="hint">${isYearly ? 'Over 12 months' : 'In one month'}</p>
     <div class="stat-badge">
       <span><i class="fas fa-film"></i> ${data.totalEpisodes} episodes</span>
     </div>
     <div class="slide-counter">2/12</div>`,

        // Slide 3: Watch Time
        `<div class="slide-icon"><i class="fas fa-clock"></i></div>
     <h1>${data.totalHours}</h1>
     <p class="subtitle">Hours Watched</p>
     <p class="hint">That's ${Math.floor(data.totalHours / 24)} days!</p>
     <div class="stat-badge">
       <span><i class="fas fa-calendar-day"></i> ${data.avgEpisodesPerDay} episodes/day</span>
     </div>
     <div class="slide-counter">3/12</div>`,

        // Slide 4: Average Score
        `<div class="slide-icon"><i class="fas fa-star"></i></div>
     <h1>${data.avgScore}</h1>
     <p class="subtitle">Average Score</p>
     <p class="hint">${data.avgScore >= 8 ? 'Great taste!' : data.avgScore >= 7 ? 'Solid picks!' : 'You\'re critical!'}</p>
     <div class="rating-meter">
       <div class="meter-fill" style="width: ${(data.avgScore / 10) * 100}%"></div>
     </div>
     <div class="slide-counter">4/12</div>`,

        // Slide 5: Top Genre
        `<div class="slide-icon"><i class="fas fa-tags"></i></div>
     <h1>${data.topGenre}</h1>
     <p class="subtitle">Favorite Genre</p>
     <p class="hint">Your most watched category</p>
     <div class="genre-list">
       <span class="genre-badge primary">${data.topGenre}</span>
       ${data.secondGenre !== "—" ? `<span class="genre-badge secondary">${data.secondGenre}</span>` : ''}
       ${data.thirdGenre !== "—" ? `<span class="genre-badge tertiary">${data.thirdGenre}</span>` : ''}
     </div>
     <div class="slide-counter">5/12</div>`,

        // Slide 6: Top Rated Anime
        `<div class="slide-icon"><i class="fas fa-crown"></i></div>
     <h1>${data.topAnime?.title || 'None'}</h1>
     <p class="subtitle">Top Rated Anime</p>
     ${data.topAnime ? `
       <p class="score"><i class="fas fa-star"></i> ${data.topAnime.score}</p>
       <p class="hint">Your highest rated</p>
     ` : '<p class="hint">Rate your anime!</p>'}
     <div class="slide-counter">6/12</div>`,

        // Slide 7: Completion Pattern
        `<div class="slide-icon"><i class="fas fa-chart-line"></i></div>
     <h1>${data.streakDays}</h1>
     <p class="subtitle">Active Watching Days</p>
     <p class="hint">${isYearly ? 'Out of 365 days' : 'Out of 30 days on average'}</p>
     <div class="streak-bar">
       <div class="streak-fill" style="width: ${isYearly ? (data.streakDays / 365) * 100 : (data.streakDays / 30) * 100}%"></div>
     </div>
     ${isYearly && data.completionMonth ? `
       <p class="hint">Busiest month: ${data.completionMonth}</p>
     ` : ''}
     <div class="slide-counter">7/12</div>`,

        // Slide 8: Anime Marathon
        `<div class="slide-icon"><i class="fas fa-running"></i></div>
     <h1>${data.avgDuration}</h1>
     <p class="subtitle">Average Episode Length</p>
     <p class="hint">${data.avgDuration >= 20 ? 'Standard TV format' : 'Shorts & movies'}</p>
     <div class="stat-badge">
       <span><i class="fas fa-hourglass-half"></i> ${data.totalEpisodes} total episodes</span>
     </div>
     <div class="slide-counter">8/12</div>`,

        // Slide 9: Second Best Anime
        `<div class="slide-icon"><i class="fas fa-medal"></i></div>
     <h1>${data.secondAnime?.title || 'None'}</h1>
     <p class="subtitle">Second Highest Rated</p>
     ${data.secondAnime ? `
       <p class="score"><i class="fas fa-star"></i> ${data.secondAnime.score}</p>
     ` : '<p class="hint">Need more ratings</p>'}
     <div class="slide-counter">9/12</div>`,

        // Slide 10: Watching Consistency
        `<div class="slide-icon"><i class="fas fa-calendar-check"></i></div>
     <h1>${Math.round((data.streakDays / (isYearly ? 365 : 30)) * 100)}%</h1>
     <p class="subtitle">Consistency Rate</p>
     <p class="hint">Days with anime watching</p>
     <div class="slide-counter">10/12</div>`,

        // Slide 11: Third Best Anime
        `<div class="slide-icon"><i class="fas fa-award"></i></div>
     <h1>${data.thirdAnime?.title || 'None'}</h1>
     <p class="subtitle">Third Highest Rated</p>
     ${data.thirdAnime ? `
       <p class="score"><i class="fas fa-star"></i> ${data.thirdAnime.score}</p>
       <p class="hint">Completing the podium!</p>
     ` : '<p class="hint">Keep watching and rating</p>'}
     <div class="slide-counter">11/12</div>`,

        // Slide 12: Conclusion
        `<div class="slide-icon"><i class="fas fa-flag-checkered"></i></div>
     <h1>Recap Complete!</h1>
     <p class="subtitle">${periodText}</p>
     <div class="recap-summary">
       <div class="summary-item">
         <i class="fas fa-tv"></i>
         <span>${data.totalAnime} anime</span>
       </div>
       <div class="summary-item">
         <i class="fas fa-clock"></i>
         <span>${data.totalHours} hours</span>
       </div>
       <div class="summary-item">
         <i class="fas fa-star"></i>
         <span>${data.avgScore} avg score</span>
       </div>
       <div class="summary-item">
         <i class="fas fa-tags"></i>
         <span>${data.topGenre}</span>
       </div>
     </div>
     <p class="hint">See you ${isYearly ? 'next year' : 'next month'} for another recap!</p>
     <div class="slide-counter">12/12</div>`
    ];
}

function renderSlide() {
    const slides = document.querySelectorAll(".recap-slide");
    slides.forEach(s => s.classList.remove("active"));

    const slide = document.getElementById(`slide-${currentSlide + 1}`);
    if (!slide) return;

    slide.innerHTML = recapSlides[currentSlide];
    slide.classList.add("active");
    updateProgressIndicator();
}

function updateProgressIndicator() {
    const progress = document.querySelector('.recap-progress');
    if (progress) {
        const percent = ((currentSlide + 1) / recapSlides.length) * 100;
        progress.style.width = `${percent}%`;
    }

    // Update slide counter in controls
    const counter = document.querySelector('.slide-counter-global');
    if (counter) {
        counter.textContent = `${currentSlide + 1}/${recapSlides.length}`;
    }
}

/* ==================================================
   MANUAL RECAP ACCESS (FROM SETTINGS)
================================================== */
function openRecapManually() {
    if (!isRecapWindowOpen()) {
        createToast(
            `<i class="fas fa-calendar"></i> Recaps available 1-${RECAP_WINDOW_DAYS} of each month`,
            { type: "info" }
        );
        return;
    }

    // 1️⃣ FIRST: Monthly recap (previous month)
    const { month, year } = getPreviousMonthForRecap();
    const monthlyData = getMonthlyRecap(year, month);

    if (monthlyData.totalAnime > 0) {
        openRecap("Monthly", monthlyData, { month, year });
        return;
    }

    // 2️⃣ Fallback: Previous year recap
    const prevYear = getPreviousYearForRecap();
    const yearlyData = getYearlyRecap(prevYear);

    if (yearlyData.totalAnime > 0) {
        openRecap("Yearly", yearlyData, { year: prevYear });
        return;
    }

    // 3️⃣ Nothing found
    createToast(
        '<i class="fas fa-info-circle"></i> No completed anime found for recap periods',
        { type: "info" }
    );
}

/* ==================================================
   SETUP EVENT LISTENERS
================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Modal controls
    document.getElementById("next-slide")?.addEventListener("click", () => {
        if (currentSlide < recapSlides.length - 1) {
            currentSlide++;
            renderSlide();
        }
    });

    document.getElementById("prev-slide")?.addEventListener("click", () => {
        if (currentSlide > 0) {
            currentSlide--;
            renderSlide();
        }
    });

    document.querySelector(".recap-close")?.addEventListener("click", () => {
        document.getElementById("recap-modal").classList.add("hidden");
    });

    // Settings button
    document.getElementById("openRecapFromSettings")?.addEventListener("click", openRecapManually);

    // Auto popups
    if (isRecapWindowOpen()) {
        setupAutoPopups();
    }
});

function setupAutoPopups() {
    const now = new Date();

    /* ---------- YEARLY RECAP (2025 FIRST) ---------- */
    const yearlyYear = 2025;
    const yearlyKey = RECAP_KEYS.yearlyAutoSeen(yearlyYear);

    if (!localStorage.getItem(yearlyKey)) {
        const data = getYearlyRecap(yearlyYear);

        if (data.totalAnime > 0) {
            setTimeout(() => {
                createToast(`<i class="fas fa-trophy"></i> Your ${yearlyYear} Yearly Recap is ready!`, {
                    actionText: '<i class="fas fa-eye"></i> View Recap',
                    persist: true,
                    type: 'success',
                    onAction: () => {
                        openRecap("Yearly", data, { year: yearlyYear });
                        localStorage.setItem(yearlyKey, "true");
                    }
                });
            }, 1000);
        }
    }

    /* ---------- MONTHLY RECAP ---------- */
    const { month: prevMonth, year: mYear } = getPreviousMonthForRecap();
    const monthlyKey = RECAP_KEYS.monthlyAutoSeen(mYear, prevMonth);

    if (!localStorage.getItem(monthlyKey)) {
        const data = getMonthlyRecap(mYear, prevMonth);

        if (data.totalAnime > 0) {
            setTimeout(() => {
                const monthName = new Date(mYear, prevMonth - 1).toLocaleString('default', { month: 'long' });
                createToast(`<i class="fas fa-chart-bar"></i> Your ${data.monthName} Recap is ready!`, {
                    actionText: '<i class="fas fa-eye"></i> View Recap',
                    persist: true,
                    type: 'info',
                    onAction: () => {
                        openRecap("Monthly", data, { month: prevMonth, year: mYear });
                        localStorage.setItem(monthlyKey, "true");
                    }
                });
            }, 2500);
        }
    }
}

/* ==================================================
   KEYBOARD NAVIGATION
================================================== */

document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("recap-modal");
    if (!modal || modal.classList.contains("hidden")) return;

    if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        document.getElementById("next-slide")?.click();
    } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        document.getElementById("prev-slide")?.click();
    } else if (e.key === "Escape") {
        e.preventDefault();
        document.querySelector(".recap-close")?.click();
    }
});


// Inject styles
if (!document.getElementById('recap-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'recap-styles';
    document.head.appendChild(styleEl);
}

// Add progress bar to modal HTML if not exists
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('recap-modal');
    if (modal && !modal.querySelector('.recap-progress-container')) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'recap-progress-container';
        progressContainer.innerHTML = '<div class="recap-progress"></div>';

    }

    // Add global slide counter to controls if not exists
    const controls = document.querySelector('.recap-controls');
    if (controls && !controls.querySelector('.slide-counter-global')) {
        const counter = document.createElement('div');
        counter.className = 'slide-counter-global';
        counter.textContent = '0/12';
        controls.insertBefore(counter, controls.querySelector('#next-slide'));
    }
});

/* ==================================================
   DEBUG AND TESTING
================================================== */

window.RecapSystem = {
    isRecapWindowOpen,
    getPreviousMonthForRecap,
    getPreviousYearForRecap,
    getMonthlyRecap,
    getYearlyRecap,
    openRecapManually,
    buildComprehensiveRecap,

    debug: function () {
        console.log("=== 12-SLIDE RECAP SYSTEM DEBUG ===");
        console.log("Window open:", isRecapWindowOpen());

        // Test 2025 yearly recap
        const yearly2025 = getYearlyRecap(2025);
        console.log("2025 Yearly Recap (12 slides):", yearly2025);

        if (yearly2025.totalAnime === 0) {
            console.log("⚠️ No anime found for 2025!");

            // Show all completed anime
            const allCompleted = getAnimeData().filter(a => a.userStatus === "Completed");
            console.log("Total completed anime:", allCompleted.length);

            allCompleted.forEach(anime => {
                console.log(`- ${anime.title}: finishDate="${anime.finishDate}", score=${anime.score}, episodes=${anime.episodes}`);
            });
        }

        // Test current monthly
        const prevMonth = getPreviousMonthForRecap();
        console.log("Previous month:", prevMonth);

        const monthly = getMonthlyRecap(prevMonth.year, prevMonth.month);
        console.log("Monthly recap data:", monthly);

        // Test slide generation
        console.log("Generated slides for yearly:", generateTwelveSlides(yearly2025, 'Yearly', { year: 2025 }).length);
    },

    forceOpen2025Recap: function () {
        const yearlyData = getYearlyRecap(2025);
        if (yearlyData.totalAnime > 0) {
            openRecap("Yearly", yearlyData, { year: 2025 });
        } else {
            alert("No anime completed in 2025! Check finishDate values.");
        }
    },

    testSlideGeneration: function () {
        const testData = {
            totalAnime: 15,
            totalHours: "145.5",
            totalEpisodes: 320,
            avgEpisodesPerDay: "8.8",
            avgScore: "8.2",
            topGenre: "Action",
            secondGenre: "Fantasy",
            thirdGenre: "Adventure",
            topAnime: { title: "Attack on Titan", score: 9.2 },
            secondAnime: { title: "Jujutsu Kaisen", score: 8.9 },
            thirdAnime: { title: "Demon Slayer", score: 8.7 },
            completionMonth: "October",
            avgDuration: "24",
            streakDays: 45,
            monthName: "January",
            year: 2025,
            type: "Yearly"
        };

        const slides = generateTwelveSlides(testData, 'Yearly', { year: 2025 });
        console.log("Test slides:", slides);
        alert("Check console for 12-slide test output!");
    }
};

console.log("🎬 12-Slide Recap System Loaded");

// ==================================================
// Loader with Animation Trigger System 
// ==================================================

let animationsStarted = false;

// ==================================================
// Start animations safely after loader
// ==================================================
function startAnimationsAfterLoader() {
    if (animationsStarted) return;
    animationsStarted = true;

    // 🎬 Run dashboard functions safely
    try { updateStats(); } catch (e) { }
    try { initCharts(); } catch (e) { }
    try { updateTopRatedAnime(); } catch (e) { }
    try { updateCurrentMonthAnime(); } catch (e) { }
    try { updateRecentActivity(); } catch (e) { }
    try { updateAnimeDisplay(); } catch (e) { }
    try { updateTotalAnimeCountAllMonths(); } catch (e) { }
    try { updateSidebarUserInfo(); } catch (e) { }
    try { updateCurrentDate(); } catch (e) { }

    // 🎬 Animate overview stats safely
    setTimeout(() => {
        const completedEl = document.getElementById("completed-count");
        const moviesEl = document.getElementById("movies-count");
        const episodesEl = document.getElementById("episodes-count");
        const hoursEl = document.getElementById("total-hours-count");

        const completed = parseInt(completedEl?.textContent) || 0;
        const movies = parseInt(moviesEl?.textContent) || 0;
        const episodes = parseInt(episodesEl?.textContent) || 0;
        const hours = parseInt(hoursEl?.textContent) || 0;

        completedEl && (completedEl.textContent = 0);
        moviesEl && (moviesEl.textContent = 0);
        episodesEl && (episodesEl.textContent = 0);
        hoursEl && (hoursEl.textContent = 0);

        setTimeout(() => {
            try { completedEl && animateCount(completedEl, completed, 4500); } catch (e) { }
            try { moviesEl && animateCount(moviesEl, movies, 4500); } catch (e) { }
            try { episodesEl && animateCount(episodesEl, episodes, 4500); } catch (e) { }
            try { hoursEl && animateCount(hoursEl, hours, 4500); } catch (e) { }
        }, 400);
    }, 200);

    // 🎬 Heatmap rendering
    setTimeout(() => {
        const animeData = JSON.parse(localStorage.getItem("animeData")) || [];
        try { renderActivityHeatmap(animeData); } catch (e) { }
    }, 300);

    // 🎬 Optional: searchAnime safe call
    try { typeof searchAnime === "function" && searchAnime(); } catch (e) { }
}

/* =====================================================
   ✅ SINGLE APP LOADER SYSTEM (NO CONFLICTS)
===================================================== */

let loaderFinished = false;
let loaderStartTime = 0;

const MIN_LOADER_TIME = 1800; // 1.8s
const MAX_LOADER_TIME = 8000; // safety

function hideLoader() {
    if (loaderFinished) return;

    const elapsed = Date.now() - loaderStartTime;
    const wait = Math.max(0, MIN_LOADER_TIME - elapsed);

    setTimeout(() => {
        loaderFinished = true;

        const loader = document.getElementById("app-loader");

        if (loader) {
            loader.style.transition = "opacity 0.35s ease";
            loader.style.opacity = "0";
            loader.style.pointerEvents = "none";

            setTimeout(() => loader.remove(), 350);
        }

        document.body.classList.remove("loading");

        if (typeof startAnimationsAfterLoader === "function") {
            startAnimationsAfterLoader();
        }

    }, wait);
}


// Progress animation
function runFakeProgress() {
    const bar = document.getElementById("loader-progress");
    const percent = document.getElementById("loader-percent");

    if (!bar || !percent) return;

    let progress = 0;

    const timer = setInterval(() => {
        if (loaderFinished) {
            clearInterval(timer);
            return;
        }

        if (progress < 80) progress += 5;
        else if (progress < 92) progress += 2;
        else progress += 0.3;

        progress = Math.min(progress, 95);

        bar.style.width = progress + "%";
        percent.textContent = Math.floor(progress) + "%";

    }, 120);
}


// Start loader
document.addEventListener("DOMContentLoaded", () => {

    loaderStartTime = Date.now();

    document.body.classList.add("loading");

    runFakeProgress();

});


// Finish loader
window.addEventListener("load", () => {
    hideLoader();
    // Ensure Currently Watching section is properly set after all resources load
    if (typeof updateCurrentlyWatching === 'function') {
        updateCurrentlyWatching();
    }
});


// Emergency safety
setTimeout(hideLoader, MAX_LOADER_TIME);


// Dev reload
if (
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
) {
    if (typeof initAutoReload === "function") {
        initAutoReload();
    }
}

// ================= AFTER LOADER ANIMATIONS =================

// Add this function definition
function animateCounter(element, targetValue, prefix = '') {
    if (!element) return;

    const duration = 2000; // 2 seconds
    const startValue = 0;
    const startTime = performance.now();

    function easeOutQuad(t) {
        return t * (2 - t);
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuad(progress);
        const current = Math.floor(startValue + targetValue * eased);

        element.textContent = prefix + current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = prefix + targetValue; // Ensure final value
        }
    }

    requestAnimationFrame(update);
}

// Yearly totals animation
setTimeout(() => {

    const totalHoursEl = document.getElementById("monthly-total-hours");
    const totalEpisodesEl = document.getElementById("yearly-total-episodes");

    if (!totalHoursEl || !totalEpisodesEl) return;

    const animeData = JSON.parse(localStorage.getItem("animeData")) || [];
    const now = new Date();
    const currentYear = now.getFullYear();

    let totalHours = 0;
    let totalEpisodes = 0;

    animeData.forEach(anime => {
        if (anime.userStatus !== "Completed" || !anime.finishDate) return;

        const finish = new Date(anime.finishDate);
        if (finish.getFullYear() !== currentYear) return;

        const epCount = Number(anime.episodes) || 0;
        const duration = Number(anime.duration) || 20;
        const type = anime.type?.toLowerCase() || "tv";

        let hours = 0;

        if (type === "movie") hours = duration / 60;
        else hours = (epCount * duration) / 60;

        totalHours += hours;
        totalEpisodes += epCount;
    });

    animateCounter(totalHoursEl, Math.round(totalHours), "Total Hrs in 2025 ");
    animateCounter(totalEpisodesEl, totalEpisodes, "Total Eps in 2025 ");

}, 200);

// Heatmap
setTimeout(() => {

    const animeData = JSON.parse(localStorage.getItem("animeData")) || [];

    if (typeof renderActivityHeatmap === "function") {
        renderActivityHeatmap(animeData);
    }

}, 350);

// =============================================
// FIXED YEAR SELECTOR FOR CHARTS
// =============================================

// Global variables
let currentEpisodesYear = null;
let currentWatchTimeYear = null;

/**
 * Format numbers to K/M/B for compact display
 */
function formatCompactNumber(num) {
    if (num === 0) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
}

/**
 * Get all available years from anime data
 */
function getAvailableYears() {
    const years = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const year = new Date(anime.finishDate).getFullYear();
            if (!isNaN(year)) {
                years.add(year);
            }
        }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);

    if (sortedYears.length === 0) {
        sortedYears.push(new Date().getFullYear());
    }

    return sortedYears;
}

/**
 * Calculate episodes per month for a specific year
 */
function calculateEpisodesPerMonth(year) {
    const monthlyEpisodes = Array(12).fill(0);
    const seen = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;

        let completionDate = null;
        if (anime.finishDate) {
            completionDate = new Date(anime.finishDate);
        } else if (anime.completedTimestamp) {
            completionDate = new Date(anime.completedTimestamp);
        }

        if (!completionDate || isNaN(completionDate.getTime())) return;

        const animeYear = completionDate.getFullYear();
        if (animeYear !== year) return;

        const monthIndex = completionDate.getMonth();
        if (monthIndex < 0 || monthIndex > 11) return;

        const key = `${anime.id || anime.title}-${animeYear}-${monthIndex}`;
        if (seen.has(key)) return;
        seen.add(key);

        const episodes = anime.type === 'Movie' ? 1 : (anime.episodes || 0);
        monthlyEpisodes[monthIndex] += episodes;
    });

    return monthlyEpisodes;
}

/**
 * Calculate total episodes for a year
 */
function calculateTotalEpisodesForYear(year) {
    let total = 0;
    const seen = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;

        let completionDate = null;
        if (anime.finishDate) {
            completionDate = new Date(anime.finishDate);
        } else if (anime.completedTimestamp) {
            completionDate = new Date(anime.completedTimestamp);
        }

        if (!completionDate || isNaN(completionDate.getTime())) return;

        const animeYear = completionDate.getFullYear();
        if (animeYear !== year) return;

        const key = `${anime.id || anime.title}-${animeYear}`;
        if (seen.has(key)) return;
        seen.add(key);

        const episodes = anime.type === 'Movie' ? 1 : (anime.episodes || 0);
        total += episodes;
    });

    return total;
}

/**
 * Update episodes chart with proper Y-axis limits
 */
function updateEpisodesChart(year) {
    if (!episodesOverTimeChart) {
        console.warn('Episodes chart not initialized');
        return;
    }

    const monthlyData = calculateEpisodesPerMonth(year);
    const totalEpisodes = calculateTotalEpisodesForYear(year);
    const formattedTotal = formatCompactNumber(totalEpisodes);

    // Find max value for Y-axis
    const maxValue = Math.max(...monthlyData, 1);
    // Calculate nice Y-axis max (round up to nearest nice number)
    const yAxisMax = Math.ceil(maxValue * 1.1); // Add 10% padding

    // Update total display
    const totalEpisodesSpan = document.getElementById('yearly-total-episodes');
    if (totalEpisodesSpan) {
        totalEpisodesSpan.innerHTML = `Total Eps: ${formattedTotal}`;
        totalEpisodesSpan.title = `${totalEpisodes.toLocaleString()} episodes`;
    }

    // Update chart data
    episodesOverTimeChart.data.datasets[0].data = monthlyData;
    episodesOverTimeChart.data.datasets[0].label = `Episodes Watched (${year})`;

    // Update Y-axis max to prevent huge scale
    if (episodesOverTimeChart.options.scales?.y) {
        episodesOverTimeChart.options.scales.y.max = yAxisMax;
        episodesOverTimeChart.options.scales.y.suggestedMax = yAxisMax;
    }

    episodesOverTimeChart.update();
}

/**
 * Calculate watch time per month for a specific year
 */
function calculateWatchTimePerMonth(year) {
    const monthlyHours = Array(12).fill(0);
    const seen = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;

        let completionDate = null;
        if (anime.finishDate) {
            completionDate = new Date(anime.finishDate);
        } else if (anime.completedTimestamp) {
            completionDate = new Date(anime.completedTimestamp);
        }

        if (!completionDate || isNaN(completionDate.getTime())) return;

        const animeYear = completionDate.getFullYear();
        if (animeYear !== year) return;

        const monthIndex = completionDate.getMonth();
        if (monthIndex < 0 || monthIndex > 11) return;

        const key = `${anime.id || anime.title}-${animeYear}-${monthIndex}`;
        if (seen.has(key)) return;
        seen.add(key);

        let hours = 0;
        if (anime.type === 'Movie') {
            hours = (anime.duration || 120) / 60;
        } else {
            const episodeDuration = anime.duration || 20;
            hours = ((anime.episodes || 0) * episodeDuration) / 60;
        }

        monthlyHours[monthIndex] += hours;
    });

    return monthlyHours.map(h => Math.round(h * 10) / 10);
}

/**
 * Calculate total hours for a year
 */
function calculateTotalHoursForYear(year) {
    let total = 0;
    const seen = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;

        let completionDate = null;
        if (anime.finishDate) {
            completionDate = new Date(anime.finishDate);
        } else if (anime.completedTimestamp) {
            completionDate = new Date(anime.completedTimestamp);
        }

        if (!completionDate || isNaN(completionDate.getTime())) return;

        const animeYear = completionDate.getFullYear();
        if (animeYear !== year) return;

        const key = `${anime.id || anime.title}-${animeYear}`;
        if (seen.has(key)) return;
        seen.add(key);

        let hours = 0;
        if (anime.type === 'Movie') {
            hours = (anime.duration || 120) / 60;
        } else {
            const episodeDuration = anime.duration || 20;
            hours = ((anime.episodes || 0) * episodeDuration) / 60;
        }

        total += hours;
    });

    return Math.round(total * 10) / 10;
}

/**
 * Update watch time chart with proper Y-axis limits
 */
function updateWatchTimeChart(year) {
    if (!watchTimeByMonthChart) {
        console.warn('Watch time chart not initialized');
        return;
    }

    const monthlyData = calculateWatchTimePerMonth(year);
    const totalHours = calculateTotalHoursForYear(year);
    const formattedHours = formatCompactNumber(totalHours);

    // Find max value for Y-axis
    const maxValue = Math.max(...monthlyData, 1);
    const yAxisMax = Math.ceil(maxValue * 1.1);

    // Update total display
    const totalHoursSpan = document.getElementById('monthly-total-hours');
    if (totalHoursSpan) {
        totalHoursSpan.innerHTML = `Total Hrs: ${formattedHours}`;
        totalHoursSpan.title = `${totalHours.toLocaleString()} hours`;
    }

    // Update chart data
    watchTimeByMonthChart.data.datasets[0].data = monthlyData;

    // Update Y-axis max
    if (watchTimeByMonthChart.options.scales?.y) {
        watchTimeByMonthChart.options.scales.y.max = yAxisMax;
        watchTimeByMonthChart.options.scales.y.suggestedMax = yAxisMax;
    }

    watchTimeByMonthChart.update();
}

/**
 * Populate year dropdowns
 */
function populateYearDropdowns() {
    const years = getAvailableYears();
    const currentYear = new Date().getFullYear();

    // Populate Episodes Year Selector
    const episodesSelect = document.getElementById('episodesYearSelect');
    if (episodesSelect) {
        episodesSelect.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            episodesSelect.appendChild(option);
        });

        if (!currentEpisodesYear) {
            currentEpisodesYear = years.includes(currentYear) ? currentYear : years[0];
        }
        episodesSelect.value = currentEpisodesYear;

        episodesSelect.removeEventListener('change', handleEpisodesYearChange);
        episodesSelect.addEventListener('change', handleEpisodesYearChange);
    }

    // Populate Watch Time Year Selector
    const watchTimeSelect = document.getElementById('watchTimeYearSelect');
    if (watchTimeSelect) {
        watchTimeSelect.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            watchTimeSelect.appendChild(option);
        });

        if (!currentWatchTimeYear) {
            currentWatchTimeYear = years.includes(currentYear) ? currentYear : years[0];
        }
        watchTimeSelect.value = currentWatchTimeYear;

        watchTimeSelect.removeEventListener('change', handleWatchTimeYearChange);
        watchTimeSelect.addEventListener('change', handleWatchTimeYearChange);
    }
}

/**
 * Handle episodes year change
 */
function handleEpisodesYearChange(event) {
    const selectedYear = parseInt(event.target.value);
    currentEpisodesYear = selectedYear;
    updateEpisodesChart(selectedYear);
}

/**
 * Handle watch time year change
 */
function handleWatchTimeYearChange(event) {
    const selectedYear = parseInt(event.target.value);
    currentWatchTimeYear = selectedYear;
    updateWatchTimeChart(selectedYear);
}

/**
 * Initialize year selectors
 */
function initYearSelectors() {
    populateYearDropdowns();
}

// Hook into existing updateAllComponents
const originalUpdateAllComponents = window.updateAllComponents;
if (typeof originalUpdateAllComponents === 'function') {
    window.updateAllComponents = function () {
        originalUpdateAllComponents();
        setTimeout(() => {
            populateYearDropdowns();
            if (currentEpisodesYear) updateEpisodesChart(currentEpisodesYear);
            if (currentWatchTimeYear) updateWatchTimeChart(currentWatchTimeYear);
        }, 100);
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initYearSelectors();
    }, 500);
});

// function to force refresh all charts including genre with filters
function refreshAllCharts() {
    // Update monthly progress chart
    if (window.monthlyProgressChart) {
        const monthlyData = calculateMonthlyProgress();
        window.monthlyProgressChart.data.datasets[0].data = monthlyData;
        window.monthlyProgressChart.data.datasets[1].data = monthlyData;
        window.monthlyProgressChart.update();

        const totalCompleted = monthlyData.reduce((a, b) => a + b, 0);
        const totalSpan = document.getElementById('monthly-total-anime');
        if (totalSpan) {
            totalSpan.textContent = `Total Completed: ${totalCompleted}`;
        }
    }

    // Update genre chart with current filter
    if (typeof updateGenreChartWithFilter === 'function') {
        updateGenreChartWithFilter();
    }

    // Update statistics charts if they exist
    if (completionChart) {
        completionChart.data.datasets[0].data = calculateYearlyCompletion();
        completionChart.update();
    }

    if (scoreDistributionChart) {
        scoreDistributionChart.data.datasets[0].data = calculateScoreDistribution();
        scoreDistributionChart.update();
    }

    if (statusDistributionChart) {
        const statusData = calculateStatusDistribution();
        statusDistributionChart.data.labels = Object.keys(statusData);
        statusDistributionChart.data.datasets[0].data = Object.values(statusData);
        statusDistributionChart.update();
    }

    if (typeDistributionChart) {
        const typeData = calculateTypeDistribution();
        typeDistributionChart.data.labels = Object.keys(typeData);
        typeDistributionChart.data.datasets[0].data = Object.values(typeData);
        typeDistributionChart.update();
    }

    if (genreStatsChart) {
        const genreStats = calculateGenreStats();
        genreStatsChart.data.labels = Object.keys(genreStats);
        genreStatsChart.data.datasets[0].data = Object.values(genreStats);
        genreStatsChart.update();
    }

    // Update episodes over time chart
    if (episodesOverTimeChart && currentEpisodesYear) {
        updateEpisodesChart(currentEpisodesYear);
    }

    // Update watch time chart
    if (watchTimeByMonthChart && currentWatchTimeYear) {
        updateWatchTimeChart(currentWatchTimeYear);
    }
}

// ============================================
// SIMPLE WORKING PWA INSTALL - SINGLE VERSION
// ============================================

(function () {
    console.log('📱 Setting up PWA install...');

    let deferredPrompt = null;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('✅ Install prompt available!');
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App already installed');
        return;
    }

    function showInstallButton() {
        // Don't add if already exists
        if (document.getElementById('pwa-install-btn')) return;

        // Check if user dismissed
        if (localStorage.getItem('pwa-dismissed')) return;

        // Find where to add button
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;

        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'theme-toggle';
        installBtn.innerHTML = '<i class="fas fa-download"></i>';
        installBtn.title = 'Install App';
        installBtn.style.cursor = 'pointer';

        installBtn.onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBtn.remove();
                    showToast('🎉 Installing AniPulse!', 'success');
                }
                deferredPrompt = null;
            } else {
                // Show manual instructions
                const msg = 'Click the install icon (⊕) in your browser address bar';
                alert(msg);
                showToast(msg, 'info');
            }
        };

        // Add after theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.insertAdjacentElement('afterend', installBtn);
        } else {
            userActions.appendChild(installBtn);
        }

        // Auto-hide after 30 seconds (optional)
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.style.opacity = '0.5';
            }
        }, 30000);
    }

    // Optional: Add dismiss functionality
    function addDismissOption() {
        setTimeout(() => {
            const btn = document.getElementById('pwa-install-btn');
            if (btn) {
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    localStorage.setItem('pwa-dismissed', 'true');
                    btn.remove();
                    showToast('Install prompt dismissed', 'info');
                });
            }
        }, 1000);
    }

    addDismissOption();

    console.log('✅ PWA install ready - look for download icon');
})();

// =============================================
// FLOATING SCROLL TO TOP BUTTON
// =============================================

(function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');
    if (!scrollBtn) return;

    let scrollTimeout;
    let isVisible = false;

    // Function to check scroll position and show/hide button
    function toggleScrollButton() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Show button when scrolled down more than 300px
        if (scrollTop > 300) {
            if (!isVisible) {
                scrollBtn.classList.add('show');
                isVisible = true;
            }
        } else {
            if (isVisible) {
                scrollBtn.classList.remove('show');
                isVisible = false;
            }
        }

        // Update scroll progress ring (optional)
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / documentHeight) * 360;
        document.documentElement.style.setProperty('--scroll-progress', `${scrollPercent}deg`);
    }

    // Smooth scroll to top
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Visual feedback
        scrollBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            scrollBtn.style.transform = '';
        }, 200);
    }

    // Throttled scroll event for better performance
    function handleScroll() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(toggleScrollButton, 100);
    }

    // Add event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', toggleScrollButton);
    scrollBtn.addEventListener('click', scrollToTop);

    // Initial check
    setTimeout(toggleScrollButton, 500);

    // Re-check when page changes (for page navigation)
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(toggleScrollButton, 300);
        });
    });

    // Also check when modal closes
    const observer = new MutationObserver(() => {
        toggleScrollButton();
    });

    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true
    });

    console.log('✅ Scroll to Top button initialized');
})();


// ============================================
// FIX MODAL SCROLL ISSUE
// ============================================

(function fixModalScrollIssue() {
    console.log('🔧 Applying modal scroll fix...');

    // Function to properly close modals and restore scrolling
    function closeModal(modalElement) {
        if (!modalElement) return;

        // Hide the modal
        modalElement.style.display = 'none';

        // Remove the modal-open class from body
        document.body.classList.remove('modal-open');

        // Reset body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        document.body.style.paddingRight = '';

        // For iOS Safari fix
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('width');
        document.body.style.removeProperty('height');
        document.body.style.removeProperty('top');

        // Remove any inline styles that might be causing issues
        document.documentElement.style.overflow = '';
        document.documentElement.style.removeProperty('overflow');

        console.log('✅ Modal closed, scroll restored');
    }

    // Function to properly open modal and disable background scroll
    function openModal(modalElement) {
        if (!modalElement) return;

        // Show the modal
        modalElement.style.display = 'flex';

        // Add modal-open class to body
        document.body.classList.add('modal-open');

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        console.log('✅ Modal opened, scroll disabled');
    }

    // Fix Add Anime Modal
    const addModal = document.getElementById('addAnimeModal');
    if (addModal) {
        // Get all close buttons for this modal
        const closeButtons = addModal.querySelectorAll('.close-modal');
        const cancelBtn = addModal.querySelector('#cancelBtn');

        // Close when clicking the backdrop
        addModal.addEventListener('click', (e) => {
            if (e.target === addModal) {
                closeModal(addModal);
            }
        });

        // Close when clicking close buttons
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(addModal);
            });
        });

        // Close when clicking cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                closeModal(addModal);
            });
        }

        console.log('✅ Add Anime Modal fixed');
    }

    // Fix Import Modal
    const importModal = document.getElementById('importModal');
    if (importModal) {
        // Get all close buttons
        const closeButtons = importModal.querySelectorAll('.close-modal');
        const cancelBtn = importModal.querySelector('#cancelImportBtn');

        // Close when clicking the backdrop
        importModal.addEventListener('click', (e) => {
            if (e.target === importModal) {
                closeModal(importModal);
            }
        });

        // Close when clicking close buttons
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(importModal);
            });
        });

        // Close when clicking cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                closeModal(importModal);
            });
        }

        console.log('✅ Import Modal fixed');
    }

    // Fix Add Anime Button
    const addAnimeBtn = document.getElementById('addAnimeBtn');
    if (addAnimeBtn) {
        // Remove existing listeners to avoid duplicates
        const newBtn = addAnimeBtn.cloneNode(true);
        addAnimeBtn.parentNode.replaceChild(newBtn, addAnimeBtn);

        newBtn.addEventListener('click', () => {
            if (addModal) {
                // Reset form
                const form = document.getElementById('addAnimeForm');
                if (form) form.reset();

                // Reset editing state
                if (typeof window.isEditing !== 'undefined') {
                    window.isEditing = false;
                    window.currentEditId = null;
                }

                const submitBtn = document.getElementById('submitBtn');
                const deleteBtn = document.getElementById('deleteBtn');
                if (submitBtn) submitBtn.textContent = 'Add Anime';
                if (deleteBtn) deleteBtn.style.display = 'none';

                // Open modal
                openModal(addModal);
            }
        });

        console.log('✅ Add Anime Button fixed');
    }

    // Fix Import Button
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        // Remove existing listeners
        const newBtn = importBtn.cloneNode(true);
        importBtn.parentNode.replaceChild(newBtn, importBtn);

        newBtn.addEventListener('click', () => {
            if (importModal) {
                openModal(importModal);
            }
        });

        console.log('✅ Import Button fixed');
    }

    // Fix Escape key for all modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (addModal && addModal.style.display === 'flex') {
                closeModal(addModal);
            }
            if (importModal && importModal.style.display === 'flex') {
                closeModal(importModal);
            }
        }
    });

    // Fix form submit to ensure modal closes
    const animeForm = document.getElementById('addAnimeForm');
    if (animeForm) {
        animeForm.addEventListener('submit', () => {
            setTimeout(() => {
                if (addModal && addModal.style.display !== 'flex') {
                    closeModal(addModal);
                } else if (addModal) {
                    // Force close after a short delay if still open
                    setTimeout(() => {
                        if (addModal.style.display === 'flex') {
                            closeModal(addModal);
                        }
                    }, 500);
                }
            }, 200);
        });
    }

    // Helper function to manually restore scroll (for emergencies)
    window.restoreScroll = function () {
        if (addModal) addModal.style.display = 'none';
        if (importModal) importModal.style.display = 'none';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.classList.remove('modal-open');
        document.documentElement.style.overflow = '';
        console.log('✅ Scroll manually restored');
    };

    // Add CSS for modal-open state
    if (!document.getElementById('modal-fix-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-fix-styles';
        style.textContent = `
            body.modal-open {
                overflow: hidden !important;
                position: fixed !important;
                width: 100% !important;
                height: 100% !important;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ Modal scroll fix applied successfully!');
    console.log('💡 If scroll gets stuck, type restoreScroll() in console to fix it');
})();

// ============================================
// FIX GENRE DISTRIBUTION CHART - PREVENT CORRUPTION
// ============================================

(function fixGenreChart() {
    console.log('🔧 Applying genre chart stability fix...');

    // Store chart instance globally
    let genreChartInstance = null;
    let chartRetryCount = 0;
    const MAX_RETRIES = 3;

    // Function to safely destroy and recreate genre chart
    function safeRecreateGenreChart() {
        const canvas = document.getElementById('genreDistributionChart');
        if (!canvas) return false;

        // Check if canvas is visible and has valid dimensions
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.log('⏳ Chart canvas not visible, waiting...');
            return false;
        }

        try {
            // Destroy existing chart if it exists
            if (genreChartInstance && typeof genreChartInstance.destroy === 'function') {
                genreChartInstance.destroy();
                genreChartInstance = null;
            }

            // Get fresh context
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Get current data from animeData
            const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
            const currentFilter = localStorage.getItem('genreFilterType') || 'month';

            // Calculate genre distribution based on current filter
            const filteredAnime = getFilteredAnimeByTimeWrapper(animeData, currentFilter);
            const genreDistribution = calculateGenreDistributionWrapper(filteredAnime);

            const labels = Object.keys(genreDistribution);
            const data = Object.values(genreDistribution);

            // Handle empty data
            if (labels.length === 0) {
                // Show no data message
                const noDataMsg = document.getElementById('genreNoDataMessage');
                if (noDataMsg) noDataMsg.style.display = 'block';
                canvas.style.opacity = '0.5';

                // Create placeholder chart
                genreChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['No Data'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['rgba(100, 100, 100, 0.3)'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
                return true;
            }

            // Hide no data message
            const noDataMsg = document.getElementById('genreNoDataMessage');
            if (noDataMsg) noDataMsg.style.display = 'none';
            canvas.style.opacity = '1';

            // Color palette
            const colorPalette = [
                '#ef4444', '#3b82f6', '#facc15', '#a855f7', '#10b981',
                '#ec4899', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
                '#c026d3', '#06b6d4', '#e11d48', '#78350f', '#22c55e',
                '#f59e0b', '#9333ea', '#64748b', '#f9e616'
            ];

            const backgroundColors = labels.map((_, index) =>
                colorPalette[index % colorPalette.length]
            );

            // Create new chart
            genreChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: getComputedStyle(document.body).getPropertyValue('--color-text-secondary') || '#94a3b8',
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 11 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            console.log('✅ Genre chart recreated successfully');
            chartRetryCount = 0;
            return true;

        } catch (error) {
            console.error('❌ Error recreating genre chart:', error);
            return false;
        }
    }

    // Wrapper for getFilteredAnimeByTime
    function getFilteredAnimeByTimeWrapper(animeData, filterType) {
        const completedAnime = animeData.filter(anime => anime.userStatus === 'Completed');

        if (filterType === 'all') return completedAnime;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return completedAnime.filter(anime => {
            let completionDate = null;
            if (anime.finishDate) {
                completionDate = new Date(anime.finishDate);
            } else if (anime.completedTimestamp) {
                completionDate = new Date(anime.completedTimestamp);
            } else if (anime.updatedAt) {
                completionDate = new Date(anime.updatedAt);
            }

            if (!completionDate || isNaN(completionDate.getTime())) return false;

            switch (filterType) {
                case 'month':
                    return completionDate.getMonth() === currentMonth &&
                        completionDate.getFullYear() === currentYear;
                case 'lastMonth':
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return completionDate.getMonth() === lastMonth &&
                        completionDate.getFullYear() === lastMonthYear;
                case 'year':
                    return completionDate.getFullYear() === currentYear;
                default:
                    return true;
            }
        });
    }

    // Wrapper for calculateGenreDistribution
    function calculateGenreDistributionWrapper(filteredAnime) {
        const genreCount = {};
        filteredAnime.forEach(anime => {
            if (anime.genres && Array.isArray(anime.genres) && anime.genres.length > 0) {
                anime.genres.forEach(genre => {
                    const cleanGenre = genre.trim();
                    if (cleanGenre) {
                        genreCount[cleanGenre] = (genreCount[cleanGenre] || 0) + 1;
                    }
                });
            }
        });
        return genreCount;
    }

    // Function to check if chart is corrupted
    function isChartCorrupted() {
        const canvas = document.getElementById('genreDistributionChart');
        if (!canvas) return false;

        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) return true;

            // Check if canvas has valid size
            if (canvas.width === 0 || canvas.height === 0) return true;

            // Check if chart instance exists and is valid
            if (genreChartInstance && typeof genreChartInstance.destroy !== 'function') {
                return true;
            }

            return false;
        } catch (e) {
            return true;
        }
    }

    // Function to fix chart on statistics page view
    function fixChartOnPageView() {
        const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
        if (statsMenuItem) {
            statsMenuItem.addEventListener('click', () => {
                setTimeout(() => {
                    if (isChartCorrupted()) {
                        console.log('🔄 Chart corrupted, recreating...');
                        safeRecreateGenreChart();
                    } else {
                        // Even if not corrupted, force a refresh
                        setTimeout(() => {
                            if (genreChartInstance && typeof genreChartInstance.update === 'function') {
                                genreChartInstance.update();
                            } else {
                                safeRecreateGenreChart();
                            }
                        }, 100);
                    }
                }, 300);
            });
        }
    }

    // Fix when window resizes (can cause corruption)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (document.getElementById('statistics-page')?.classList.contains('active')) {
                if (genreChartInstance && typeof genreChartInstance.resize === 'function') {
                    genreChartInstance.resize();
                } else {
                    safeRecreateGenreChart();
                }
            }
        }, 250);
    });

    // Fix when theme changes (dark/light mode)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                setTimeout(() => {
                    if (document.getElementById('statistics-page')?.classList.contains('active')) {
                        safeRecreateGenreChart();
                    }
                }, 200);
            }
        });
    });
    observer.observe(document.body, { attributes: true });

    // Fix when returning to statistics page from other pages
    function fixOnPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                if (document.getElementById('statistics-page')?.classList.contains('active')) {
                    setTimeout(() => {
                        if (isChartCorrupted()) {
                            safeRecreateGenreChart();
                        } else if (genreChartInstance) {
                            genreChartInstance.update();
                        }
                    }, 200);
                }
            }
        });
    }

    // Hook into existing updateGenreChartWithFilter function
    const originalUpdateGenre = window.updateGenreChartWithFilter;
    if (typeof originalUpdateGenre === 'function') {
        window.updateGenreChartWithFilter = function () {
            try {
                originalUpdateGenre();
            } catch (error) {
                console.warn('Original genre update failed, using safe version:', error);
                safeRecreateGenreChart();
            }
        };
    }

    // Also hook into refreshAllCharts
    const originalRefreshAll = window.refreshAllCharts;
    if (typeof originalRefreshAll === 'function') {
        window.refreshAllCharts = function () {
            originalRefreshAll();
            setTimeout(() => {
                if (document.getElementById('statistics-page')?.classList.contains('active')) {
                    safeRecreateGenreChart();
                }
            }, 150);
        };
    }

    // Initialize
    fixChartOnPageView();
    fixOnPageVisibility();

    // Run initial check when statistics page becomes visible
    setInterval(() => {
        if (document.getElementById('statistics-page')?.classList.contains('active')) {
            if (isChartCorrupted()) {
                console.log('🔄 Periodic check: Chart corrupted, recreating...');
                safeRecreateGenreChart();
            }
        }
    }, 5000); // Check every 5 seconds

    // Make safe recreate function available globally
    window.fixGenreChart = safeRecreateGenreChart;

    console.log('✅ Genre chart stability fix applied!');
    console.log('💡 If chart breaks, type fixGenreChart() in console to fix it');
})();

// ============================================
// SAFE EMPTY STATES - NO ERRORS
// ============================================

function showEmptyState(container, type, customMessage = null) {
    if (!container) return;

    try {
        const emptyStates = {
            anime: {
                icon: 'fa-tv',
                title: 'No Anime Yet',
                message: 'Start your anime journey by adding your first anime!',
                action: 'Add Your First Anime'
            },
            watchlist: {
                icon: 'fa-heart',
                title: 'Watchlist is Empty',
                message: 'Add some anime to your watchlist to keep track.',
                action: 'Browse Anime'
            },
            activity: {
                icon: 'fa-history',
                title: 'No Activity Yet',
                message: 'Your recent activity will appear here.',
                action: 'Add Anime'
            }
        };

        const state = emptyStates[type] || emptyStates.anime;

        container.innerHTML = `
            <div class="empty-state animated">
                <div class="empty-state-icon">
                    <i class="fas ${state.icon}"></i>
                </div>
                <h3 class="empty-state-title">${customMessage?.title || state.title}</h3>
                <p class="empty-state-message">${customMessage?.message || state.message}</p>
                <button class="empty-state-action btn-primary" data-action="${type}">
                    <i class="fas fa-plus"></i>
                    ${customMessage?.action || state.action}
                </button>
            </div>
        `;

        const actionBtn = container.querySelector('.empty-state-action');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                if (type === 'anime' || type === 'activity') {
                    document.getElementById('addAnimeBtn')?.click();
                } else if (type === 'watchlist') {
                    document.querySelector('.menu-item[data-page="anime-list"]')?.click();
                }
            });
        }
    } catch (e) {
        console.warn('Empty state error:', e);
    }
}

// Safe apply function
function safeApplyEmptyStates() {
    try {
        const topRated = document.getElementById('top-rated-anime');
        if (topRated && animeData && animeData.filter(a => a.score && a.score >= 8).length === 0) {
            showEmptyState(topRated, 'rating');
        }
    } catch (e) { }
}

// ============================================
// COMMUNITY PAGE - COMPLETE WORKING VERSION
// ============================================

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatNumberShort(num) {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// TAB SWITCHING
// ============================================

function initCommunityTabs() {
    const tabs = document.querySelectorAll('.community-tab');
    const contents = document.querySelectorAll('.community-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            contents.forEach(content => content.classList.remove('active'));
            const activeContent = document.getElementById(`community-${tabName}-tab`);
            if (activeContent) {
                activeContent.classList.add('active');
            }

            // Load data based on tab
            if (tabName === 'friends') {
                loadFriends();
                loadFriendRequests();
            } else if (tabName === 'leaderboard') {
                initLeaderboard();
            }
        });
    });
}
// ============================================
// FRIENDS LIST
// ============================================

async function loadFriends() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const friendsList = document.getElementById('friendsList');
    const friendsCount = document.getElementById('friendsCount');
    if (!friendsList) return;

    friendsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading friends...</div>';

    try {
        const response = await fetch('http://localhost:3000/api/friends/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load friends');

        const friends = await response.json();
        console.log('Friends data from API:', friends);

        if (friendsCount) friendsCount.textContent = friends.length;

        if (friends.length === 0) {
            friendsList.innerHTML = '<div class="empty-state">No friends yet. Search for users to add!</div>';
            return;
        }

        friendsList.innerHTML = friends.map(friend => {
            // Get the correct display name - prioritize name field
            let displayName = friend.name || friend.username;

            // Fallback to extracting from avatar if needed
            if (!displayName || displayName === 'User' || displayName === 'Anime Fan') {
                const avatarMatch = friend.avatar?.match(/name=([^&]+)/);
                if (avatarMatch) {
                    displayName = decodeURIComponent(avatarMatch[1]);
                } else {
                    displayName = 'User';
                }
            }

            const avatarUrl = friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`;
            const totalAnime = friend.totalAnime || 0;
            const totalHoursFormatted = formatNumberShort(friend.totalHours || 0);
            const title = friend.title || 'Newbie';
            const level = friend.level || 1;

            console.log(`Friend display: ${displayName}, Title: ${title}, Level: ${level}`);

            return `
                <div class="friend-card" onclick="openUserProfile('${friend.uid}')">
                    <img src="${avatarUrl}" class="friend-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff'">
                    <div class="friend-info">
                        <div class="friend-name">${escapeHtml(displayName)}</div>
                        <div class="friend-level">${escapeHtml(title)} • Lv.${level}</div>
                    </div>
                    <button class="remove-friend-btn" onclick="event.stopPropagation(); removeFriend('${friend.uid}')">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load friends:', error);
        friendsList.innerHTML = '<div class="empty-state">Failed to load friends. Please refresh.</div>';
    }
}

// ============================================
// FRIEND REQUESTS
// ============================================

async function loadFriendRequests() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:3000/api/friends/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await response.json();

        const requestsSection = document.getElementById('friendRequestsSection');
        const requestsList = document.getElementById('friendRequestsList');
        if (!requestsList) return;

        if (requests.length === 0) {
            if (requestsSection) requestsSection.style.display = 'none';
            return;
        }

        if (requestsSection) requestsSection.style.display = 'block';

        requestsList.innerHTML = requests.map(req => {
            let displayName = req.fromName || req.fromUsername;

            // Fallback to extracting from avatar if needed
            if (!displayName || displayName === 'User' || displayName === 'Anime Fan') {
                const avatarMatch = req.fromAvatar?.match(/name=([^&]+)/);
                if (avatarMatch) {
                    displayName = decodeURIComponent(avatarMatch[1]);
                } else {
                    displayName = 'User';
                }
            }

            const avatarUrl = req.fromAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`;

            return `
                <div class="friend-request-item">
                    <div class="friend-request-info">
                        <img src="${avatarUrl}" class="friend-request-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff'">
                        <div>
                            <div class="friend-request-name">${escapeHtml(displayName)}</div>
                            <div class="friend-request-level">Lv.${req.fromLevel || 1}</div>
                        </div>
                    </div>
                    <div class="friend-request-actions">
                        <button class="btn-accept" onclick="acceptFriendRequest('${req.id}')"><i class="fas fa-check"></i> Accept</button>
                        <button class="btn-decline" onclick="declineFriendRequest('${req.id}')"><i class="fas fa-times"></i> Decline</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load friend requests:', error);
    }
}

// ============================================
// SEARCH USERS
// ============================================

async function searchUsers() {
    const query = document.getElementById('searchUsersInput')?.value.trim();
    if (!query || query.length < 2) {
        showToast('Please enter at least 2 characters', 'info');
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    const resultsList = document.getElementById('searchResultsList');
    if (!resultsList) return;

    resultsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

    try {
        const response = await fetch(`http://localhost:3000/api/user/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Search failed');

        const users = await response.json();

        if (users.length === 0) {
            resultsList.innerHTML = '<div class="empty-state">No users found. Try a different name.</div>';
            return;
        }

        resultsList.innerHTML = users.map(user => {
            const displayName = user.name || user.username || 'User';
            const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`;

            return `
                <div class="search-result-item" onclick="openUserProfile('${user.uid}')">
                    <div class="search-result-info">
                        <img src="${avatarUrl}" class="search-result-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff'">
                        <div>
                            <div class="friend-request-name">${escapeHtml(displayName)}</div>
                            <div class="friend-request-level">${user.title || 'Newbie'} • Lv.${user.level || 1}</div>
                        </div>
                    </div>
                    <button class="btn-add-friend" onclick="event.stopPropagation(); sendFriendRequest('${user.uid}')">
                        <i class="fas fa-user-plus"></i> Add Friend
                    </button>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Search failed:', error);
        resultsList.innerHTML = '<div class="empty-state">Failed to search users. Please try again.</div>';
        showToast('Search failed. Please try again.', 'error');
    }
}

// ============================================
// FRIEND ACTIONS
// ============================================

async function sendFriendRequest(userId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3000/api/friends/request/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Friend request sent!', 'success');
            document.getElementById('searchUsersInput').value = '';
            document.getElementById('searchResultsList').innerHTML = '';
        } else {
            showToast(result.error, 'error');
        }
    } catch (error) {
        console.error('Failed to send friend request:', error);
        showToast('Failed to send friend request', 'error');
    }
}

async function acceptFriendRequest(requestId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3000/api/friends/accept/${requestId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Friend request accepted!', 'success');
            loadFriendRequests();
            loadFriends();
        }
    } catch (error) {
        console.error('Failed to accept request:', error);
    }
}

async function declineFriendRequest(requestId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3000/api/friends/decline/${requestId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Friend request declined', 'info');
            loadFriendRequests();
        }
    } catch (error) {
        console.error('Failed to decline request:', error);
    }
}

async function removeFriend(friendId) {
    if (!confirm('Remove this friend?')) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3000/api/friends/remove/${friendId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Friend removed', 'info');
            loadFriends();
        }
    } catch (error) {
        console.error('Failed to remove friend:', error);
    }
}

// ============================================
// OPEN USER PROFILE (New Modal)
// ============================================

async function openUserProfile(userId) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.uid === userId) {
        showToast('This is you!', 'info');
        return;
    }

    const modal = document.getElementById('userProfileModal');
    if (!modal) {
        console.error('User profile modal not found');
        showToast('Profile modal not available', 'error');
        return;
    }

    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    // Show loading state
    document.getElementById('profileName').textContent = 'Loading...';
    document.getElementById('profileCompletedList').innerHTML = '<div class="loading-spinner">Loading anime list...</div>';

    try {
        const response = await fetch(`http://localhost:3000/api/user/full-profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load profile');

        const profile = await response.json();
        renderUserProfile(profile);

    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load user profile', 'error');
        closeUserProfileModal();
    }
}

function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

function renderUserProfile(profile) {
    // Header info
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileLevel').textContent = `Lv.${profile.level}`;
    document.getElementById('profileTitle').textContent = profile.levelTitle;
    document.getElementById('profileXpFill').style.width = `${profile.xpProgress}%`;
    document.getElementById('profileXpText').textContent = `${profile.totalXP.toLocaleString()} / ${(profile.totalXP + profile.xpToNextLevel).toLocaleString()} XP`;

    const avatarImg = document.getElementById('profileAvatar');
    avatarImg.src = profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366F1&color=fff`;
    avatarImg.onerror = function () {
        this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366F1&color=fff`;
    };

    // Stats
    document.getElementById('profileTotalAnime').textContent = profile.stats.totalAnime;
    document.getElementById('profileCompleted').textContent = profile.stats.completed;
    document.getElementById('profileWatching').textContent = profile.stats.watching;
    document.getElementById('profilePlanToWatch').textContent = profile.stats.planToWatch;
    document.getElementById('profileEpisodes').textContent = profile.stats.totalEpisodes.toLocaleString();
    document.getElementById('profileHours').textContent = profile.stats.totalHours.toLocaleString();

    // Friend button
    const friendBtn = document.getElementById('profileFriendBtn');
    if (!profile.isCurrentUser) {
        friendBtn.style.display = 'block';
        if (profile.isFriend) {
            friendBtn.innerHTML = '<i class="fas fa-user-check"></i> Friends';
            friendBtn.disabled = true;
            friendBtn.style.opacity = '0.6';
        } else {
            friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
            friendBtn.disabled = false;
            friendBtn.style.opacity = '1';
            friendBtn.onclick = () => sendFriendRequest(profile.uid);
        }
    } else {
        friendBtn.style.display = 'none';
    }

    // Anime Lists
    renderProfileAnimeList('completed', profile.animeList.completed);
    renderProfileAnimeList('watching', profile.animeList.watching);
    renderProfileAnimeList('plan', profile.animeList.planToWatch);

    // Achievements
    renderProfileAchievements(profile.achievements);

    // Activity
    renderProfileActivity(profile.recentActivity);
}

function renderProfileAnimeList(type, animeList) {
    const container = document.getElementById(`profile${type.charAt(0).toUpperCase() + type.slice(1)}List`);
    if (!container) return;

    if (!animeList || animeList.length === 0) {
        container.innerHTML = '<div class="empty-state">No anime found</div>';
        return;
    }

    container.innerHTML = animeList.map(anime => `
        <div class="profile-anime-card">
            <img src="${anime.cover || 'https://via.placeholder.com/60x85/6a5acd/ffffff?text=No+Image'}" 
                 class="profile-anime-cover" 
                 onerror="this.src='https://placehold.co/60x85/6a5acd/white?text=No+Image'">
            <div class="profile-anime-info">
                <div class="profile-anime-title">${escapeHtml(anime.title)}</div>
                ${anime.score ? `<div class="profile-anime-score">⭐ ${anime.score}</div>` : ''}
                <div class="profile-anime-episodes">${anime.episodes || 0} episodes</div>
            </div>
        </div>
    `).join('');
}

function renderProfileAchievements(achievements) {
    const container = document.getElementById('profileAchievementsList');
    if (!container) return;

    if (!achievements || achievements.length === 0) {
        container.innerHTML = '<div class="empty-state">No achievements unlocked yet</div>';
        return;
    }

    container.innerHTML = achievements.map(achievement => `
        <div class="profile-achievement-card">
            <div class="profile-achievement-icon">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="profile-achievement-info">
                <div class="profile-achievement-name">${escapeHtml(achievement)}</div>
                <div class="profile-achievement-desc">Unlocked achievement</div>
            </div>
        </div>
    `).join('');
}

function renderProfileActivity(activities) {
    const container = document.getElementById('profileActivityList');
    if (!container) return;

    if (!activities || activities.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent activity</div>';
        return;
    }

    container.innerHTML = activities.map(activity => {
        let iconClass = 'added';
        let iconName = 'plus-circle';

        switch (activity.action) {
            case 'completed': iconClass = 'completed'; iconName = 'check-circle'; break;
            case 'added': iconClass = 'added'; iconName = 'plus-circle'; break;
            case 'edited': iconClass = 'edited'; iconName = 'edit'; break;
            default: iconClass = 'added'; iconName = 'plus-circle';
        }

        return `
            <div class="profile-activity-item">
                <div class="profile-activity-icon ${iconClass}">
                    <i class="fas fa-${iconName}"></i>
                </div>
                <div class="profile-activity-content">
                    <div class="profile-activity-text">
                        ${activity.action === 'completed' ? 'Completed' : activity.action === 'added' ? 'Added' : 'Updated'} 
                        <strong>${escapeHtml(activity.animeTitle)}</strong>
                    </div>
                    <div class="profile-activity-time">${formatTimeAgo(activity.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Profile tab switching
document.addEventListener('click', function (e) {
    const tab = e.target.closest('.profile-tab');
    if (!tab) return;

    const tabName = tab.dataset.tab;
    const container = tab.closest('.profile-modal-body');
    if (!container) return;

    // Update active tab
    container.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update active content
    const contentMap = {
        'completed': 'profileTabCompleted',
        'watching': 'profileTabWatching',
        'plan': 'profileTabPlan',
        'achievements': 'profileTabAchievements',
        'activity': 'profileTabActivity'
    };

    Object.values(contentMap).forEach(contentId => {
        const content = document.getElementById(contentId);
        if (content) content.classList.remove('active');
    });

    const activeContent = document.getElementById(contentMap[tabName]);
    if (activeContent) activeContent.classList.add('active');
});

// ============================================
// LEADERBOARD 
// ============================================

let currentLeaderboardStat = 'level';
let currentTimePeriod = localStorage.getItem('leaderboardTimePeriod') || 'all';
let isLoadingLeaderboard = false;
let lastLoadedTime = 0;
let yourStatsCache = null;

function saveTimePeriod(period) {
    currentTimePeriod = period;
    localStorage.setItem('leaderboardTimePeriod', period);
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

function formatNumberShort(num) {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

// Load your stats using full-stats endpoint
async function loadYourStats(force = false) {
    if (!force && yourStatsCache) {
        return yourStatsCache;
    }

    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        let userId = null;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.uid) {
            userId = user.uid;
        } else if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                userId = payload.uid;
            } catch (e) { }
        }

        if (!userId) return null;

        const response = await fetch(`http://localhost:3000/api/user/full-stats/${userId}?period=${currentTimePeriod}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load stats');

        const stats = await response.json();

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const storedTotalXP = userData.totalXP || 20015;
        stats.totalXP = storedTotalXP;

        yourStatsCache = stats;

        // Update DOM elements
        const totalXPEl = document.getElementById('yourTotalXP');
        const totalAnimeEl = document.getElementById('yourTotalAnime');
        const totalEpisodesEl = document.getElementById('yourTotalEpisodes');
        const totalHoursEl = document.getElementById('yourTotalHours');
        const avatarEl = document.getElementById('yourAvatar');
        const usernameEl = document.getElementById('yourUsername');
        const levelEl = document.getElementById('yourLevel');
        const topGenresEl = document.getElementById('yourTopGenres');

        if (totalXPEl) totalXPEl.textContent = formatNumberShort(stats.totalXP);
        if (totalAnimeEl) totalAnimeEl.textContent = formatNumber(stats.totalAnime);
        if (totalEpisodesEl) totalEpisodesEl.textContent = formatNumberShort(stats.totalEpisodes);
        if (totalHoursEl) totalHoursEl.textContent = formatNumberShort(stats.totalHours);

        if (avatarEl) avatarEl.src = stats.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(stats.name || 'User')}&background=6366F1&color=fff`;
        if (usernameEl) usernameEl.textContent = stats.name || 'You';
        if (levelEl) levelEl.textContent = `${stats.title || 'Newbie'} • Lv.${stats.level || 1}`;

        if (topGenresEl) {
            if (stats.topGenres && stats.topGenres.length > 0) {
                topGenresEl.innerHTML = stats.topGenres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('');
            } else {
                topGenresEl.innerHTML = '<span class="genre-tag">No data yet</span>';
            }
        }

        return stats;

    } catch (error) {
        console.error('Failed to load your stats:', error);
        return null;
    }
}

// Load friend leaderboard
async function loadFriendLeaderboard() {
    if (isLoadingLeaderboard) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const leaderboardList = document.getElementById('friendLeaderboardList');
    if (!leaderboardList) return;

    isLoadingLeaderboard = true;
    leaderboardList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</div>';

    try {
        let currentUserId = null;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.uid) {
            currentUserId = user.uid;
        } else if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUserId = payload.uid;
            } catch (e) { }
        }

        const yourStats = await loadYourStats(true);
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const storedTotalXP = userData.totalXP || 20015;

        const friendsResponse = await fetch('http://localhost:3000/api/friends/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const friends = await friendsResponse.json();

        if (!friends || friends.length === 0) {
            leaderboardList.innerHTML = '<div class="empty-state">Add friends to see leaderboard!</div>';
            isLoadingLeaderboard = false;
            return;
        }

        const friendsWithStats = [];
        for (const friend of friends) {
            try {
                const statsResponse = await fetch(`http://localhost:3000/api/user/full-stats/${friend.uid}?period=${currentTimePeriod}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (statsResponse.ok) {
                    const stats = await statsResponse.json();
                    friendsWithStats.push({
                        uid: friend.uid,
                        name: stats.name || friend.name,
                        avatar: stats.avatar || friend.avatar,
                        level: stats.level || 1,
                        title: stats.title || 'Newbie',
                        totalXP: stats.totalXP || 0,
                        totalAnime: stats.totalAnime || 0,
                        totalEpisodes: stats.totalEpisodes || 0,
                        totalHours: stats.totalHours || 0,
                        topGenres: stats.topGenres || []
                    });
                }
            } catch (error) {
                console.error(`Failed to get stats for ${friend.name}:`, error);
            }
        }

        const currentUserStats = {
            uid: 'current',
            name: yourStats?.name || 'You',
            avatar: yourStats?.avatar,
            level: yourStats?.level || 1,
            title: yourStats?.title || 'Newbie',
            totalXP: storedTotalXP,
            totalAnime: yourStats?.totalAnime || 0,
            totalEpisodes: yourStats?.totalEpisodes || 0,
            totalHours: yourStats?.totalHours || 0,
            topGenres: yourStats?.topGenres || [],
            isCurrentUser: true
        };

        let allUsers = [currentUserStats, ...friendsWithStats];
        allUsers = allUsers.filter(user => user.name && user.name !== 'User');

        allUsers.sort((a, b) => {
            if (currentLeaderboardStat === 'level') return (b.level || 0) - (a.level || 0);
            if (currentLeaderboardStat === 'xp') return (b.totalXP || 0) - (a.totalXP || 0);
            if (currentLeaderboardStat === 'anime') return (b.totalAnime || 0) - (a.totalAnime || 0);
            if (currentLeaderboardStat === 'episodes') return (b.totalEpisodes || 0) - (a.totalEpisodes || 0);
            if (currentLeaderboardStat === 'hours') return (b.totalHours || 0) - (a.totalHours || 0);
            return 0;
        });

        if (allUsers.length === 0) {
            leaderboardList.innerHTML = '<div class="empty-state">No friends with data available</div>';
            isLoadingLeaderboard = false;
            return;
        }

        leaderboardList.innerHTML = allUsers.map((user, index) => {
            let rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';

            let valueDisplay = '';
            if (currentLeaderboardStat === 'level') valueDisplay = `Lv.${user.level}`;
            else if (currentLeaderboardStat === 'xp') valueDisplay = `${formatNumberShort(user.totalXP)} XP`;
            else if (currentLeaderboardStat === 'anime') valueDisplay = `${formatNumber(user.totalAnime)} anime`;
            else if (currentLeaderboardStat === 'episodes') valueDisplay = `${formatNumberShort(user.totalEpisodes)} eps`;
            else if (currentLeaderboardStat === 'hours') valueDisplay = `${formatNumberShort(user.totalHours)} hrs`;

            const username = user.name || 'User';
            const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff`;
            const topGenres = (user.topGenres || []).slice(0, 3);

            return `
                <div class="leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}" onclick="openUserProfile('${user.uid === 'current' ? currentUserId : user.uid}')">
                    <div class="leaderboard-rank ${rankClass}">#${index + 1}</div>
                    <div class="leaderboard-user">
                        <img src="${avatarUrl}" class="leaderboard-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff'">
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">${escapeHtml(username)}</div>
                            <div class="leaderboard-level">${user.title || 'Newbie'}</div>
                            <div class="leaderboard-stats">
                                <span title="Episodes">🎬 ${formatNumberShort(user.totalEpisodes || 0)} eps</span>
                                <span title="Anime">📺 ${formatNumber(user.totalAnime || 0)} anime</span>
                                <span title="Hours">⏱️ ${formatNumberShort(user.totalHours || 0)} hrs</span>
                            </div>
                            ${topGenres.length ? `<div class="leaderboard-genres">${topGenres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}</div>` : ''}
                        </div>
                    </div>
                    <div class="leaderboard-value">${valueDisplay}</div>
                </div>
            `;
        }).join('');

        lastLoadedTime = Date.now();

    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        leaderboardList.innerHTML = '<div class="empty-state">Failed to load leaderboard</div>';
    } finally {
        isLoadingLeaderboard = false;
    }
}

function initLeaderboard() {
    currentTimePeriod = localStorage.getItem('leaderboardTimePeriod') || 'all';

    document.querySelectorAll('.time-period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === currentTimePeriod) btn.classList.add('active');
    });

    document.querySelectorAll('.leaderboard-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.leaderboard-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLeaderboardStat = btn.dataset.stat;
            loadFriendLeaderboard();
        };
    });

    document.querySelectorAll('.time-period-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.time-period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveTimePeriod(btn.dataset.period);
            yourStatsCache = null;
            loadFriendLeaderboard();
        };
    });

    loadFriendLeaderboard();
}

// ============================================
// INITIALIZE COMMUNITY PAGE
// ============================================

function initCommunityPage() {
    initCommunityTabs();
    loadFriends();
    loadFriendRequests();

    const searchBtn = document.getElementById('searchUsersBtn');
    if (searchBtn) searchBtn.addEventListener('click', searchUsers);

    const searchInput = document.getElementById('searchUsersInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchUsers();
        });
    }

    const leaderboardTab = document.querySelector('.community-tab[data-tab="leaderboard"]');
    if (leaderboardTab) {
        leaderboardTab.addEventListener('click', () => setTimeout(initLeaderboard, 100));
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

const communityMenuItemFinal = document.querySelector('.menu-item[data-page="community"]');
if (communityMenuItemFinal) {
    communityMenuItemFinal.addEventListener('click', () => {
        setTimeout(initCommunityPage, 100);
    });
}

// ============================================
// STATE PERSISTENCE & AUTO-REFRESH SYSTEM
// ============================================

class StateManager {
    constructor() {
        this.currentPage = localStorage.getItem('lastActivePage') || 'dashboard';
        this.lastScrollPosition = parseInt(localStorage.getItem('lastScrollPosition')) || 0;
        this.filters = {
            status: localStorage.getItem('animeFilterStatus') || 'all',
            month: localStorage.getItem('animeFilterMonth') || 'all',
            year: localStorage.getItem('animeFilterYear') || 'all',
            sort: localStorage.getItem('animeSortFilter') || 'id'
        };
        this.refreshInterval = null;
        this.init();
    }

    init() {
        // Restore last active page
        this.restoreLastPage();

        // Restore scroll position
        this.restoreScrollPosition();

        // Start auto-refresh every 30 seconds
        this.startAutoRefresh();

        // Save state on page unload
        window.addEventListener('beforeunload', () => this.saveCurrentState());

        // Save scroll position on scroll
        window.addEventListener('scroll', () => {
            localStorage.setItem('lastScrollPosition', window.scrollY);
        });

        console.log('📌 State Manager initialized - Last page:', this.currentPage);
    }

    restoreLastPage() {
        // Find and click the menu item for the last active page
        const menuItem = document.querySelector(`.menu-item[data-page="${this.currentPage}"]`);
        if (menuItem && !menuItem.classList.contains('active')) {
            setTimeout(() => {
                menuItem.click();
            }, 100);
        }
    }

    restoreScrollPosition() {
        setTimeout(() => {
            window.scrollTo({ top: this.lastScrollPosition, behavior: 'auto' });
        }, 200);
    }

    saveCurrentState() {
        // Save current page
        const activeMenuItem = document.querySelector('.menu-item.active');
        if (activeMenuItem) {
            const page = activeMenuItem.getAttribute('data-page');
            if (page) localStorage.setItem('lastActivePage', page);
        }

        // Save scroll position
        localStorage.setItem('lastScrollPosition', window.scrollY);

        // Save filters
        const statusFilter = document.getElementById('statusFilter');
        const monthFilter = document.getElementById('monthFilter');
        const yearFilter = document.getElementById('yearFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (statusFilter) localStorage.setItem('animeFilterStatus', statusFilter.value);
        if (monthFilter) localStorage.setItem('animeFilterMonth', monthFilter.value);
        if (yearFilter) localStorage.setItem('animeFilterYear', yearFilter.value);
        if (sortFilter) localStorage.setItem('animeSortFilter', sortFilter.value);
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds (only if page is visible)
        this.refreshInterval = setInterval(() => {
            if (!document.hidden) {
                this.refreshCurrentPageData();
            }
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async refreshCurrentPageData() {
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;

        const pageId = activePage.id;
        console.log(`🔄 Auto-refreshing data for: ${pageId}`);

        try {
            // Refresh based on current page
            if (pageId === 'dashboard-page') {
                await this.refreshDashboard();
            } else if (pageId === 'anime-list-page') {
                await this.refreshAnimeList();
            } else if (pageId === 'watchlist-page') {
                await this.refreshWatchlist();
            } else if (pageId === 'statistics-page') {
                await this.refreshStatistics();
            } else if (pageId === 'achievements-page') {
                await this.refreshAchievements();
            } else if (pageId === 'ranking-page') {
                await this.refreshRanking();
            } else if (pageId === 'community-page') {
                await this.refreshCommunity();
            } else if (pageId === 'settings-page') {
                await this.refreshSettings();
            }

            // Show subtle notification
            this.showRefreshNotification();

        } catch (error) {
            console.error('Auto-refresh failed:', error);
        }
    }

    async refreshDashboard() {
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateTopRatedAnime === 'function') updateTopRatedAnime();
        if (typeof updateCurrentMonthAnime === 'function') updateCurrentMonthAnime();
        if (typeof updateRecentActivity === 'function') updateRecentActivity();
        if (typeof updateCurrentlyWatching === 'function') updateCurrentlyWatching();
        if (typeof renderAnimeDNA === 'function') renderAnimeDNA();
        if (typeof updateCharts === 'function') updateCharts();
    }

    async refreshAnimeList() {
        if (typeof updateAnimeDisplay === 'function') updateAnimeDisplay();
    }

    async refreshWatchlist() {
        const activeStatus = document.querySelector('.filter-btn.active')?.getAttribute('data-status') || 'all';
        if (typeof updateWatchlist === 'function') updateWatchlist(activeStatus, 1);
    }

    async refreshStatistics() {
        if (typeof initStatisticsCharts === 'function') initStatisticsCharts();
        if (typeof updateStatisticsTables === 'function') updateStatisticsTables();
        if (typeof refreshAllCharts === 'function') refreshAllCharts();
    }

    async refreshAchievements() {
        if (typeof updateAchievements === 'function') updateAchievements();
    }

    async refreshRanking() {
        if (typeof loadRankings === 'function') loadRankings(currentRankType || 'level', true);
        if (typeof loadMyRank === 'function') loadMyRank();
    }

    async refreshCommunity() {
        if (typeof loadFriends === 'function') loadFriends();
        if (typeof loadFriendRequests === 'function') loadFriendRequests();
        if (document.querySelector('.community-tab.active')?.dataset.tab === 'leaderboard') {
            if (typeof loadFriendLeaderboard === 'function') loadFriendLeaderboard();
        }
    }

    async refreshSettings() {
        if (typeof updateSidebarUserInfo === 'function') updateSidebarUserInfo();
        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
            window.AniPulseLevelSystem.updateAllLevelUI();
        }
    }

    showRefreshNotification() {
        // Create temporary notification
        let notification = document.querySelector('.auto-refresh-toast');
        if (notification) notification.remove();

        notification = document.createElement('div');
        notification.className = 'auto-refresh-toast';
        notification.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Data refreshed';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 8px 16px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 500;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Initialize State Manager
const stateManager = new StateManager();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    .auto-refresh-toast {
        animation: slideInRight 0.3s ease;
    }
`;
document.head.appendChild(style);

// ============================================
// ANIME LIST MANAGEMENT
// ============================================

// Save anime list (triggers notifications for completed anime)
async function saveAnimeList(animeList) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('No auth token, cannot save');
        return false;
    }

    try {
        const response = await fetch('http://localhost:3000/api/anime/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ animeList })
        });

        if (response.ok) {
            console.log('✅ Anime list saved successfully');

            // Refresh notifications to show any newly created ones
            if (typeof notificationManager !== 'undefined') {
                await notificationManager.refresh();
            }

            return true;
        } else {
            console.error('Save failed:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('❌ Save error:', error);
        return false;
    }
}

// Example: Call this when user marks an anime as completed
async function markAnimeAsCompleted(anime) {
    // Get current anime list
    let animeList = getCurrentAnimeList(); // Your function to get current list

    // Find or add anime
    const existingIndex = animeList.findIndex(a => a.id === anime.id);

    if (existingIndex !== -1) {
        // Update existing
        animeList[existingIndex] = {
            ...animeList[existingIndex],
            userStatus: 'Completed',
            finishDate: new Date().toISOString()
        };
    } else {
        // Add new
        animeList.push({
            ...anime,
            userStatus: 'Completed',
            finishDate: new Date().toISOString()
        });
    }

    // Save - this triggers backend notification
    await saveAnimeList(animeList);

    // Show local feedback
    showToast(`"${anime.title}" marked as completed!`, 'anime_complete');
}

// Helper toast function if not already defined
function showToast(message, type = 'info') {
    if (typeof notificationManager !== 'undefined') {
        notificationManager.showToast(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

// ============================================
//  SEARCH SYSTEM - WITH FALLBACK API & GENRE FIX
// ============================================

(function() {
    console.log('🔧 Loading search system with dual API support...');

    // ============================================
    // CONFIGURATION
    // ============================================
    const SEARCH_CONFIG = {
        CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
        TIMEOUT: 8000, // 8 seconds
        DEBOUNCE_DELAY: 600,
        MIN_QUERY_LENGTH: 2,
        MAX_RESULTS: 10,
        JIKAN_API: 'https://api.jikan.moe/v4/anime',
        ANILIST_API: 'https://graphql.anilist.co',
        KITSU_API: 'https://kitsu.io/api/edge/anime',
    };

    // ============================================
    // SEARCH CACHE
    // ============================================
    const searchCache = new Map();

    // ============================================
    // API STATUS
    // ============================================
    let isJikanAvailable = true;
    let apiCheckInProgress = false;
    let lastApiCheck = 0;
    let usingFallback = false;

    // ============================================
    // CHECK API STATUS
    // ============================================
    async function checkApiAvailability() {
        const now = Date.now();
        if (now - lastApiCheck < 30000) return isJikanAvailable;
        if (apiCheckInProgress) return isJikanAvailable;

        apiCheckInProgress = true;
        lastApiCheck = now;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('https://api.jikan.moe/v4/status', {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                isJikanAvailable = data.myanimelist_heartbeat?.status === 'HEALTHY' && !data.myanimelist_heartbeat?.down;
            } else {
                isJikanAvailable = false;
            }
        } catch (error) {
            isJikanAvailable = false;
            console.warn('⚠️ Jikan API not reachable, will use fallback');
        }

        apiCheckInProgress = false;
        usingFallback = !isJikanAvailable;
        return isJikanAvailable;
    }

    // ============================================
    // SEARCH WITH ANILIST (FALLBACK)
    // ============================================
    async function searchAnilist(query) {
        console.log('🔍 Searching AniList for:', query);
        
        const graphqlQuery = `
            query ($search: String) {
                Page(page: 1, perPage: 10) {
                    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        episodes
                        format
                        averageScore
                        genres
                        status
                        startDate {
                            year
                            month
                            day
                        }
                        endDate {
                            year
                            month
                            day
                        }
                        description
                        duration
                        season
                        seasonYear
                        studios {
                            nodes {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            const response = await fetch(SEARCH_CONFIG.ANILIST_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { search: query }
                })
            });

            if (!response.ok) {
                throw new Error(`AniList API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.data?.Page?.media) {
                return null;
            }

            return {
                data: data.data.Page.media.map(media => ({
                    title: media.title.english || media.title.romaji || media.title.native || 'Unknown',
                    title_english: media.title.english || '',
                    title_romaji: media.title.romaji || '',
                    title_japanese: media.title.native || '',
                    type: media.format || 'TV',
                    episodes: media.episodes || 0,
                    score: media.averageScore ? media.averageScore / 10 : null,
                    images: {
                        jpg: {
                            image_url: media.coverImage?.large || media.coverImage?.medium || null
                        }
                    },
                    genres: media.genres || [],
                    synopsis: media.description || '',
                    duration: media.duration || 20,
                    status: media.status || 'Finished',
                    season: media.season || '',
                    seasonYear: media.seasonYear || null,
                    studios: media.studios?.nodes?.map(s => s.name) || [],
                    source: 'anilist'
                }))
            };

        } catch (error) {
            console.error('AniList search failed:', error);
            return null;
        }
    }

    // ============================================
    // SEARCH WITH KITSU (ALTERNATIVE FALLBACK)
    // ============================================
    async function searchKitsu(query) {
        console.log('🔍 Searching Kitsu for:', query);
        
        try {
            const response = await fetch(
                `${SEARCH_CONFIG.KITSU_API}?filter[text]=${encodeURIComponent(query)}&page[limit]=10&sort=-averageRating`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Kitsu API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.data || data.data.length === 0) {
                return null;
            }

            return {
                data: data.data.map(item => {
                    const attrs = item.attributes;
                    return {
                        title: attrs.titles?.en || attrs.titles?.en_jp || attrs.canonicalTitle || 'Unknown',
                        title_english: attrs.titles?.en || '',
                        title_romaji: attrs.titles?.en_jp || '',
                        title_japanese: attrs.titles?.ja_jp || '',
                        type: attrs.showType || 'TV',
                        episodes: attrs.episodeCount || 0,
                        score: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : null,
                        images: {
                            jpg: {
                                image_url: attrs.posterImage?.original || attrs.posterImage?.large || null
                            }
                        },
                        genres: attrs.genres?.map(g => g.name) || [],
                        synopsis: attrs.synopsis || '',
                        duration: attrs.episodeLength || 20,
                        status: attrs.status || 'Finished',
                        source: 'kitsu'
                    };
                })
            };

        } catch (error) {
            console.error('Kitsu search failed:', error);
            return null;
        }
    }

    // ============================================
    // SEARCH WITH JIKAN (PRIMARY)
    // ============================================
    async function searchJikan(query) {
        console.log('🔍 Searching Jikan for:', query);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const url = `${SEARCH_CONFIG.JIKAN_API}?q=${encodeURIComponent(query)}&limit=10`;
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            
            clearTimeout(timeoutId);

            if (response.status === 504 || response.status === 429) {
                throw new Error(`API error: ${response.status}`);
            }

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.warn('Jikan search failed:', error.message);
            throw error;
        }
    }

    // ============================================
    // MAIN SEARCH FUNCTION - WITH FALLBACK
    // ============================================
    async function performSearch(query) {
        const cacheKey = query.toLowerCase().trim();
        const cached = searchCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < SEARCH_CONFIG.CACHE_DURATION)) {
            console.log('📦 Using cached results for:', query);
            return cached.data;
        }

        try {
            await checkApiAvailability();
            
            if (isJikanAvailable) {
                try {
                    const data = await searchJikan(query);
                    if (data && data.data && data.data.length > 0) {
                        searchCache.set(cacheKey, { data: data, timestamp: Date.now() });
                        return data;
                    }
                } catch (jikanError) {
                    console.warn('Jikan failed, trying fallback...');
                    isJikanAvailable = false;
                    usingFallback = true;
                }
            }

            try {
                const anilistData = await searchAnilist(query);
                if (anilistData && anilistData.data && anilistData.data.length > 0) {
                    searchCache.set(cacheKey, { data: anilistData, timestamp: Date.now() });
                    return anilistData;
                }
            } catch (anilistError) {
                console.warn('AniList failed, trying Kitsu...');
            }

            try {
                const kitsuData = await searchKitsu(query);
                if (kitsuData && kitsuData.data && kitsuData.data.length > 0) {
                    searchCache.set(cacheKey, { data: kitsuData, timestamp: Date.now() });
                    return kitsuData;
                }
            } catch (kitsuError) {
                console.warn('Kitsu failed too');
            }

            return null;

        } catch (error) {
            console.error('All search methods failed:', error);
            return null;
        }
    }

    // ============================================
    // ESCAPE HTML
    // ============================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // DISPLAY SEARCH RESULTS - WITH GENRES
    // ============================================
    function displaySearchResults(data, searchResults, source = '') {
        if (!searchResults) return;
        searchResults.innerHTML = '';

        if (!data || !data.data || data.data.length === 0) {
            searchResults.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #94A3B8;">
                    <i class="fas fa-search" style="font-size: 28px; display: block; margin-bottom: 12px; color: #6366F1;"></i>
                    <div style="font-weight: 600; margin-bottom: 4px;">No results found</div>
                    <small>Try using different keywords</small>
                    ${source ? `<div style="margin-top: 8px; font-size: 0.7rem; color: #64748B;">Searched via: ${source}</div>` : ''}
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        if (source) {
            const sourceIndicator = document.createElement('div');
            sourceIndicator.style.cssText = `
                padding: 8px 16px;
                background: rgba(139, 92, 246, 0.1);
                border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                font-size: 0.7rem;
                color: #A78BFA;
                text-align: center;
            `;
            sourceIndicator.innerHTML = `<i class="fas fa-info-circle"></i> Results from: ${source}`;
            searchResults.appendChild(sourceIndicator);
        }

        data.data.forEach(anime => {
            const title = anime.title_english || anime.title_romaji || anime.title || 'Unknown';
            
            // Extract genres for display
            let genreDisplay = '';
            if (anime.genres) {
                if (Array.isArray(anime.genres)) {
                    if (anime.genres.length > 0 && typeof anime.genres[0] === 'object') {
                        const genreNames = anime.genres.slice(0, 3).map(g => g.name);
                        genreDisplay = genreNames.join(', ');
                    } else {
                        genreDisplay = anime.genres.slice(0, 3).join(', ');
                    }
                }
            }
            
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                transition: all 0.2s ease;
            `;

            const coverUrl = anime.images?.jpg?.image_url || 
                            anime.images?.large || 
                            anime.coverImage?.large ||
                            'https://placehold.co/45x65/6a5acd/white?text=No+Image';

            item.innerHTML = `
                <img src="${coverUrl}" 
                     style="width: 45px; height: 65px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='https://placehold.co/45x65/6a5acd/white?text=No+Image'">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--color-text-primary, white); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(title)}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.7rem; color: #94A3B8;">${anime.type || 'TV'}</span>
                        <span style="font-size: 0.7rem; color: #94A3B8;">${anime.episodes || '?'} eps</span>
                        ${anime.score ? `<span style="font-size: 0.7rem; color: #FBBF24;">⭐ ${anime.score}</span>` : ''}
                        ${genreDisplay ? `<span style="font-size: 0.6rem; color: #94A3B8; background: rgba(139,92,246,0.08); padding: 1px 8px; border-radius: 10px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(genreDisplay)}">${escapeHtml(genreDisplay)}</span>` : ''}
                        ${anime.source ? `<span style="font-size: 0.55rem; color: #64748B; background: rgba(139,92,246,0.1); padding: 1px 6px; border-radius: 10px;">${anime.source}</span>` : ''}
                    </div>
                </div>
            `;

            const animeData = {
                title: title,
                title_english: anime.title_english || '',
                title_romaji: anime.title_romaji || '',
                type: anime.type || 'TV',
                episodes: anime.episodes || 1,
                score: anime.score || null,
                images: {
                    jpg: {
                        image_url: coverUrl
                    }
                },
                genres: anime.genres || [],
                synopsis: anime.synopsis || '',
                duration: anime.duration || 20,
                source: anime.source || source || 'unknown'
            };

            item.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.selectAnimeFromSearch === 'function') {
                    window.selectAnimeFromSearch(animeData);
                }
            };

            searchResults.appendChild(item);
        });

        searchResults.style.display = 'block';
    }

    // ============================================
    // SELECT ANIME FUNCTION - WITH GENRE FIX
    // ============================================
    window.selectAnimeFromSearch = function(anime) {
        console.log('🎯 Selecting anime:', anime.title);
        console.log('📋 Genres from API:', anime.genres);
        
        const titleInput = document.getElementById('animeTitle');
        const typeSelect = document.getElementById('animeType');
        const episodesInput = document.getElementById('animeEpisodes');
        const durationInput = document.getElementById('animeDuration');
        const coverInput = document.getElementById('animeCover');
        const genresInput = document.getElementById('animeGenres');
        const scoreInput = document.getElementById('animeScore');
        const searchResults = document.getElementById('searchResults');

        // 1. SET TITLE
        if (titleInput) {
            titleInput.value = anime.title || '';
            titleInput.style.border = '2px solid #10B981';
            setTimeout(() => { titleInput.style.border = ''; }, 1000);
        }

        // 2. SET TYPE
        if (typeSelect) {
            const animeType = anime.type || 'TV';
            typeSelect.value = animeType;
            const changeEvent = new Event('change');
            typeSelect.dispatchEvent(changeEvent);
        }

        // 3. SET EPISODES
        if (episodesInput) {
            episodesInput.value = anime.episodes || 1;
        }

        // 4. SET DURATION
        if (durationInput) {
            if (anime.type === 'Movie') {
                durationInput.value = anime.duration ? Math.round(parseInt(anime.duration) || 120) : '120';
                durationInput.readOnly = false;
            } else {
                durationInput.value = anime.duration || '20';
                durationInput.readOnly = true;
            }
        }

        // 5. SET COVER IMAGE
        if (coverInput && anime.images) {
            const coverUrl = anime.images?.jpg?.image_url || 
                            anime.images?.large || 
                            anime.coverImage?.large ||
                            anime.coverImage?.medium ||
                            '';
            if (coverUrl) {
                coverInput.value = coverUrl;
                console.log('📸 Cover URL set:', coverUrl);
            }
        }

        // 6. SET GENRES - FIXED!
        if (genresInput && anime.genres) {
            let genreString = '';
            
            if (Array.isArray(anime.genres)) {
                if (anime.genres.length > 0 && typeof anime.genres[0] === 'object') {
                    // Jikan format (objects with name property)
                    const unwantedGenres = ['Award Winning'];
                    genreString = anime.genres
                        .filter(g => !unwantedGenres.includes(g.name))
                        .map(g => g.name)
                        .join(', ');
                } else {
                    // String array (AniList or Kitsu)
                    genreString = anime.genres.join(', ');
                }
            } else if (typeof anime.genres === 'string') {
                genreString = anime.genres;
            }
            
            genresInput.value = genreString;
            console.log('🎭 Genres set:', genreString);
        } else {
            console.warn('⚠️ No genres available for:', anime.title);
        }

        // 7. SET SCORE
        if (scoreInput && anime.score) {
            const score = typeof anime.score === 'number' ? anime.score : parseFloat(anime.score);
            if (!isNaN(score)) {
                scoreInput.value = score;
            }
        }

        // 8. CLOSE SEARCH RESULTS
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }

        // 9. SHOW SUCCESS
        const genreCount = Array.isArray(anime.genres) ? anime.genres.length : 0;
        showToast(`✓ Selected: ${anime.title} (${genreCount} genres)`, 'success');
        
        console.log('✅ Anime selected successfully:', {
            title: anime.title,
            type: anime.type,
            episodes: anime.episodes,
            score: anime.score,
            genres: anime.genres,
            cover: anime.images?.jpg?.image_url
        });
    };

    // ============================================
    // SHOW LOADING / ERROR
    // ============================================
    function showSearchLoading(query) {
        const searchLoading = document.getElementById('searchLoading');
        if (searchLoading) {
            searchLoading.style.display = 'block';
            searchLoading.innerHTML = `
                <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
                Searching for "${escapeHtml(query)}"...
            `;
        }
    }

    function hideSearchLoading() {
        const searchLoading = document.getElementById('searchLoading');
        if (searchLoading) {
            searchLoading.style.display = 'none';
            searchLoading.innerHTML = 'Searching...';
        }
    }

    function showSearchError(message, details = '') {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;
        
        searchResults.innerHTML = `
            <div style="padding: 24px 20px; text-align: center;">
                <i class="fas fa-exclamation-circle" style="font-size: 36px; color: #F87171; display: block; margin-bottom: 12px;"></i>
                <div style="font-weight: 600; color: #F87171; margin-bottom: 8px; font-size: 1rem;">${message}</div>
                ${details ? `<div style="color: #94A3B8; font-size: 0.8rem; margin-bottom: 12px;">${details}</div>` : ''}
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 12px;">
                    <button onclick="window.retrySearch()" style="
                        padding: 8px 24px;
                        background: linear-gradient(135deg, #6366F1, #8B5CF6);
                        color: white;
                        border: none;
                        border-radius: 30px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.85rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                    <button onclick="window.closeSearchResults()" style="
                        padding: 8px 24px;
                        background: rgba(255, 255, 255, 0.05);
                        color: #94A3B8;
                        border: 1px solid rgba(139, 92, 246, 0.15);
                        border-radius: 30px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.85rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background=''">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        searchResults.style.display = 'block';
    }

    window.closeSearchResults = function() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }
        hideSearchLoading();
    };

    // ============================================
    // MAIN SEARCH FUNCTION
    // ============================================
    let searchTimeout = null;
    let isSearching = false;

    window.searchAnime = async function() {
        const searchInput = document.getElementById('animeTitle');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        const searchResults = document.getElementById('searchResults');

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
            if (searchResults) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            }
            hideSearchLoading();
            return;
        }

        searchTimeout = setTimeout(async () => {
            if (isSearching) return;
            isSearching = true;

            showSearchLoading(query);

            if (searchResults) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            }

            try {
                const result = await performSearch(query);
                
                if (result) {
                    const source = result.data?.[0]?.source || 
                                  (usingFallback ? 'AniList/Kitsu' : 'Jikan');
                    displaySearchResults(result, searchResults, source);
                } else {
                    showSearchError('No results found', 'Try using different keywords or check your spelling');
                }

            } catch (error) {
                console.error('Search error:', error);
                showSearchError('Search failed', 'Please try again later');
            } finally {
                hideSearchLoading();
                isSearching = false;
            }
        }, SEARCH_CONFIG.DEBOUNCE_DELAY);
    };

    // ============================================
    // RETRY SEARCH
    // ============================================
    window.retrySearch = function() {
        const searchInput = document.getElementById('animeTitle');
        if (searchInput) {
            const query = searchInput.value.trim();
            if (query) {
                const cacheKey = query.toLowerCase().trim();
                searchCache.delete(cacheKey);
            }
            isJikanAvailable = true;
            usingFallback = false;
            lastApiCheck = 0;
            window.searchAnime();
        }
    };

    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    if (typeof showToast !== 'function') {
        window.showToast = function(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<span>${message}</span>`;
            container.appendChild(toast);
            
            setTimeout(() => toast.remove(), 3000);
        };
    }

    // ============================================
    // INITIALIZE SEARCH SYSTEM
    // ============================================
    function initSearchSystem() {
        const searchInput = document.getElementById('animeTitle');
        if (!searchInput) {
            setTimeout(initSearchSystem, 500);
            return;
        }

        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);

        newInput.addEventListener('input', window.searchAnime);
        newInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                    searchTimeout = null;
                }
                window.searchAnime();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.closeSearchResults();
            }
        });

        document.addEventListener('click', (e) => {
            const searchResults = document.getElementById('searchResults');
            const searchInput = document.getElementById('animeTitle');
            if (searchResults && searchInput) {
                if (!searchResults.contains(e.target) && e.target !== searchInput) {
                    searchResults.style.display = 'none';
                }
            }
        });

        checkApiAvailability();
        console.log('✅ Search system initialized with fallback APIs');
        console.log('📡 Jikan API:', isJikanAvailable ? '🟢 Available' : '🔴 Using Fallback');
    }

    // ============================================
    // START
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearchSystem);
    } else {
        initSearchSystem();
    }

    // ============================================
    // CACHE CLEANUP
    // ============================================
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of searchCache) {
            if (now - value.timestamp > SEARCH_CONFIG.CACHE_DURATION) {
                searchCache.delete(key);
            }
        }
    }, 10 * 60 * 1000);

    console.log('✅ Multi-API search system loaded with genre fix!');
})();

// ============================================
// FIX: CHART INITIALIZATION - SAFE CHECK
// ============================================

(function fixChartInitialization() {
    'use strict';

    console.log('🔧 Applying chart initialization fix...');

    // ============================================
    // SAFE GET CONTEXT FUNCTION
    // ============================================

    function safeGetContext(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`⚠️ Canvas "${canvasId}" not found in DOM`);
            return null;
        }
        
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.warn(`⚠️ Cannot get 2D context for "${canvasId}"`);
                return null;
            }
            return ctx;
        } catch (error) {
            console.warn(`⚠️ Error getting context for "${canvasId}":`, error);
            return null;
        }
    }

    // ============================================
    // SAFE DESTROY CHART
    // ============================================

    function safeDestroyChart(chartInstance) {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            try {
                chartInstance.destroy();
            } catch (e) {
                // Ignore destroy errors
            }
        }
        return null;
    }

    // ============================================
    // CHECK IF ELEMENTS EXIST BEFORE INIT
    // ============================================

    function checkChartElements() {
        const chartIds = [
            'completionChart',
            'scoreDistributionChart',
            'statusDistributionChart',
            'typeDistributionChart',
            'genreStatsChart',
            'avgScoreByGenreChart',
            'watchByWeekdayChart',
            'longestAnimeChart',
            'shortestAnimeChart',
            'seasonalPreferenceChart'
        ];

        const missing = chartIds.filter(id => !document.getElementById(id));
        
        if (missing.length > 0) {
            console.warn('⚠️ Missing chart elements:', missing);
            return false;
        }
        return true;
    }

    // ============================================
    // OVERRIDE initStatisticsCharts WITH SAFE CHECKS
    // ============================================

    const originalInit = window.initStatisticsCharts;

    window.initStatisticsCharts = function() {
        console.log('📊 Initializing statistics charts (safe version)...');

        // Check if we're on the statistics page
        const statsPage = document.getElementById('statistics-page');
        if (!statsPage || !statsPage.classList.contains('active')) {
            console.log('⏳ Statistics page not active, skipping chart init');
            return;
        }

        // Check if chart elements exist
        if (!checkChartElements()) {
            console.log('⏳ Chart elements not ready, retrying...');
            setTimeout(() => {
                if (window.initStatisticsCharts) {
                    window.initStatisticsCharts();
                }
            }, 500);
            return;
        }

        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

        // ============================================
        // 1. COMPLETION CHART
        // ============================================

        const completionCanvas = document.getElementById('completionChart');
        if (completionCanvas) {
            const ctx = safeGetContext('completionChart');
            if (ctx) {
                if (window.AniPulseCharts && window.AniPulseCharts.completionChart) {
                    window.AniPulseCharts.completionChart = safeDestroyChart(window.AniPulseCharts.completionChart);
                }
                
                window.AniPulseCharts = window.AniPulseCharts || {};
                window.AniPulseCharts.completionChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['2024', '2025', '2026', '2027', '2028'],
                        datasets: [{
                            label: 'Anime Completed',
                            data: calculateYearlyCompletionFixed ? calculateYearlyCompletionFixed() : [0, 0, 0, 0, 0],
                            backgroundColor: '#48bb78',
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                            x: { grid: { display: false }, ticks: { color: textColor } }
                        }
                    }
                });
            }
        }

        // ============================================
        // 2. SCORE DISTRIBUTION CHART
        // ============================================

        const scoreCanvas = document.getElementById('scoreDistributionChart');
        if (scoreCanvas) {
            const ctx = safeGetContext('scoreDistributionChart');
            if (ctx) {
                if (window.AniPulseCharts && window.AniPulseCharts.scoreChart) {
                    window.AniPulseCharts.scoreChart = safeDestroyChart(window.AniPulseCharts.scoreChart);
                }
                
                window.AniPulseCharts = window.AniPulseCharts || {};
                window.AniPulseCharts.scoreChart = new Chart(ctx, {
                    type: 'polarArea',
                    data: {
                        labels: ['10', '9', '8', '7', '6', '5 or less'],
                        datasets: [{
                            data: calculateScoreDistributionFixed ? calculateScoreDistributionFixed() : [0, 0, 0, 0, 0, 0],
                            backgroundColor: ['rgba(139,92,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(59,130,246,0.8)', 'rgba(156,163,175,0.8)'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'right', labels: { color: textColor } } }
                    }
                });
            }
        }

        // ============================================
        // 3. STATUS DISTRIBUTION CHART
        // ============================================

        const statusCanvas = document.getElementById('statusDistributionChart');
        if (statusCanvas) {
            const ctx = safeGetContext('statusDistributionChart');
            if (ctx) {
                if (window.AniPulseCharts && window.AniPulseCharts.statusChart) {
                    window.AniPulseCharts.statusChart = safeDestroyChart(window.AniPulseCharts.statusChart);
                }
                
                const statusData = calculateStatusDistributionFixed ? calculateStatusDistributionFixed() : {};
                window.AniPulseCharts = window.AniPulseCharts || {};
                window.AniPulseCharts.statusChart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(statusData),
                        datasets: [{ 
                            data: Object.values(statusData), 
                            backgroundColor: ['#48bb78', '#4299e1', '#ed8936', '#f56565'], 
                            borderWidth: 0 
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'right', labels: { color: textColor } } }
                    }
                });
            }
        }

        // ============================================
        // 4. TYPE DISTRIBUTION CHART
        // ============================================

        const typeCanvas = document.getElementById('typeDistributionChart');
        if (typeCanvas) {
            const ctx = safeGetContext('typeDistributionChart');
            if (ctx) {
                if (window.AniPulseCharts && window.AniPulseCharts.typeChart) {
                    window.AniPulseCharts.typeChart = safeDestroyChart(window.AniPulseCharts.typeChart);
                }
                
                const typeData = calculateTypeDistributionFixed ? calculateTypeDistributionFixed() : {};
                window.AniPulseCharts = window.AniPulseCharts || {};
                window.AniPulseCharts.typeChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(typeData),
                        datasets: [{ 
                            data: Object.values(typeData), 
                            backgroundColor: ['#6a5acd', '#70db70', '#20b2aa', '#ff7f50', '#48bb78'], 
                            borderWidth: 0 
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'right', labels: { color: textColor } } }
                    }
                });
            }
        }

        // ============================================
        // 5. GENRE STATS CHART
        // ============================================

        const genreCanvas = document.getElementById('genreStatsChart');
        if (genreCanvas) {
            const ctx = safeGetContext('genreStatsChart');
            if (ctx) {
                if (window.AniPulseCharts && window.AniPulseCharts.genreChart) {
                    window.AniPulseCharts.genreChart = safeDestroyChart(window.AniPulseCharts.genreChart);
                }
                
                const genreStats = calculateGenreStatsFixed ? calculateGenreStatsFixed() : {};
                window.AniPulseCharts = window.AniPulseCharts || {};
                window.AniPulseCharts.genreChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(genreStats),
                        datasets: [{ 
                            label: 'Number of Anime', 
                            data: Object.values(genreStats), 
                            backgroundColor: 'rgba(106,90,205,0.7)', 
                            borderRadius: 8 
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                            y: { grid: { display: false }, ticks: { color: textColor } }
                        }
                    }
                });
            }
        }

        // ============================================
        // 6. AVERAGE SCORE BY GENRE CHART
        // ============================================

        const avgScoreCanvas = document.getElementById('avgScoreByGenreChart');
        if (avgScoreCanvas) {
            const ctx = safeGetContext('avgScoreByGenreChart');
            if (ctx) {
                if (window.AniPulseCharts && window.AniPulseCharts.avgScoreChart) {
                    window.AniPulseCharts.avgScoreChart = safeDestroyChart(window.AniPulseCharts.avgScoreChart);
                }
                
                const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
                const genreScores = {};
                animeData.forEach(anime => {
                    if (anime.genres && anime.score) {
                        anime.genres.forEach(g => {
                            const genreName = typeof g === 'object' ? g.name : g;
                            if (!genreScores[genreName]) {
                                genreScores[genreName] = { total: 0, count: 0 };
                            }
                            genreScores[genreName].total += anime.score;
                            genreScores[genreName].count++;
                        });
                    }
                });
                const labels = Object.keys(genreScores);
                const avgScores = labels.map(g => (genreScores[g].total / genreScores[g].count).toFixed(1));
                
                window.AniPulseCharts = window.AniPulseCharts || {};
                window.AniPulseCharts.avgScoreChart = new Chart(ctx, {
                    type: 'bar',
                    data: { 
                        labels: labels, 
                        datasets: [{ 
                            label: 'Average Score', 
                            data: avgScores, 
                            backgroundColor: 'rgba(106,90,205,0.7)' 
                        }] 
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: { 
                            x: { beginAtZero: true, max: 10, grid: { color: gridColor }, ticks: { color: textColor } }, 
                            y: { ticks: { color: textColor } } 
                        }
                    }
                });
            }
        }

        console.log('✅ All statistics charts initialized safely');
    };

    // ============================================
    // FIX animeLengthCharts
    // ============================================

    const originalAnimeLengthCharts = window.animeLengthCharts;

    window.animeLengthCharts = function() {
        console.log('📊 Initializing anime length charts (safe version)...');

        const longestCanvas = document.getElementById('longestAnimeChart');
        const shortestCanvas = document.getElementById('shortestAnimeChart');

        // Check if canvases exist
        if (!longestCanvas || !shortestCanvas) {
            console.log('⏳ Anime length chart elements not ready');
            return;
        }

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const completed = animeData.filter(a => a.userStatus?.toLowerCase() === 'completed');

        // Longest
        const sorted = [...completed].sort((a, b) => b.episodes - a.episodes);
        const longest = sorted.slice(0, 5);

        const nonMovies = sorted.filter(a => a.type?.toLowerCase() !== "movie");
        const shortest = nonMovies.slice(-5).reverse();

        // === Longest Chart ===
        const longestCtx = safeGetContext('longestAnimeChart');
        if (longestCtx) {
            if (window.AniPulseCharts && window.AniPulseCharts.longestChart) {
                window.AniPulseCharts.longestChart = safeDestroyChart(window.AniPulseCharts.longestChart);
            }
            
            window.AniPulseCharts = window.AniPulseCharts || {};
            window.AniPulseCharts.longestChart = new Chart(longestCtx, {
                type: 'bar',
                data: {
                    labels: longest.map(a => `${a.title.slice(0, 15)}`),
                    datasets: [{
                        label: 'Episodes',
                        data: longest.map(a => a.episodes),
                        backgroundColor: 'rgba(46, 204, 113,0.7)',
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#9ca3af', maxRotation: 0 } }
                    }
                }
            });
        }

        // === Shortest Chart ===
        const shortestCtx = safeGetContext('shortestAnimeChart');
        if (shortestCtx) {
            if (window.AniPulseCharts && window.AniPulseCharts.shortestChart) {
                window.AniPulseCharts.shortestChart = safeDestroyChart(window.AniPulseCharts.shortestChart);
            }
            
            window.AniPulseCharts = window.AniPulseCharts || {};
            window.AniPulseCharts.shortestChart = new Chart(shortestCtx, {
                type: 'bar',
                data: {
                    labels: shortest.map(a => `${a.title.slice(0, 15)}`),
                    datasets: [{
                        label: 'Episodes',
                        data: shortest.map(a => a.episodes),
                        backgroundColor: 'rgba(241, 196, 15,0.7)',
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#9ca3af', maxRotation: 0 } }
                    }
                }
            });
        }

        console.log('✅ Anime length charts initialized safely');
    };

    // ============================================
    // FIX seasonalPreferenceChart
    // ============================================

    window.seasonalPreferenceChart = function() {
        const canvas = document.getElementById('seasonalPreferenceChart');
        if (!canvas) {
            console.log('⏳ Seasonal preference chart element not ready');
            return;
        }

        const ctx = safeGetContext('seasonalPreferenceChart');
        if (!ctx) return;

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const completed = animeData.filter(a => a.userStatus?.toLowerCase() === 'completed');

        const seasonMap = { Winter: 0, Spring: 0, Summer: 0, Fall: 0 };
        completed.forEach(a => {
            if (!a.finishDate) return;
            const [, month] = a.finishDate.split('-');
            const m = parseInt(month, 10);
            const season =
                m <= 2 ? 'Winter' :
                m <= 5 ? 'Spring' :
                m <= 8 ? 'Summer' :
                'Fall';
            seasonMap[season]++;
        });

        if (window.AniPulseCharts && window.AniPulseCharts.seasonalChart) {
            window.AniPulseCharts.seasonalChart = safeDestroyChart(window.AniPulseCharts.seasonalChart);
        }

        window.AniPulseCharts = window.AniPulseCharts || {};
        window.AniPulseCharts.seasonalChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(seasonMap),
                datasets: [{
                    data: Object.values(seasonMap),
                    backgroundColor: [
                        'rgba(52,152,219,0.7)',
                        'rgba(46,204,113,0.7)',
                        'rgba(241,196,15,0.7)',
                        'rgba(231,76,60,0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#b5b8ff' } }
                }
            }
        });

        console.log('✅ Seasonal preference chart initialized safely');
    };

    // ============================================
    // OVERRIDE watchByWeekdayChart
    // ============================================

    window.watchByWeekdayChart = function() {
        const canvas = document.getElementById('watchByWeekdayChart');
        if (!canvas) {
            console.log('⏳ Watch by weekday chart element not ready');
            return;
        }

        const ctx = safeGetContext('watchByWeekdayChart');
        if (!ctx) return;

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const completed = animeData.filter(a => a.userStatus?.toLowerCase() === 'completed');

        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const totals = Array(7).fill(0);

        completed.forEach(a => {
            if (!a.finishDate || !a.episodes || !a.duration) return;
            const d = new Date(a.finishDate);
            const day = isNaN(d.getDay()) ? Math.floor(Math.random() * 7) : d.getDay();
            const hours = (a.episodes * a.duration) / 60;
            totals[day] += hours;
        });

        if (window.AniPulseCharts && window.AniPulseCharts.watchWeekdayChart) {
            window.AniPulseCharts.watchWeekdayChart = safeDestroyChart(window.AniPulseCharts.watchWeekdayChart);
        }

        window.AniPulseCharts = window.AniPulseCharts || {};
        window.AniPulseCharts.watchWeekdayChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekdays,
                datasets: [{
                    label: 'Total Hours Watched',
                    data: totals,
                    borderColor: 'rgba(231,76,60,1)',
                    backgroundColor: 'rgba(231,76,60,0.3)',
                    tension: 0.3,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } },
                    x: { grid: { color: "rgba(255,255,255,0.03)" }, ticks: { color: "#9ca3af" } }
                }
            }
        });

        console.log('✅ Watch by weekday chart initialized safely');
    };

    // ============================================
    // HOOK INTO PAGE NAVIGATION
    // ============================================

    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(() => {
                if (window.initStatisticsCharts) {
                    window.initStatisticsCharts();
                }
                if (window.animeLengthCharts) {
                    window.animeLengthCharts();
                }
                if (window.watchByWeekdayChart) {
                    window.watchByWeekdayChart();
                }
                if (window.seasonalPreferenceChart) {
                    window.seasonalPreferenceChart();
                }
            }, 300);
        });
    }

    // ============================================
    // WATCH FOR STATISTICS PAGE ACTIVATION
    // ============================================

    const observer = new MutationObserver(() => {
        const statsPage = document.getElementById('statistics-page');
        if (statsPage && statsPage.classList.contains('active')) {
            setTimeout(() => {
                if (window.initStatisticsCharts) {
                    window.initStatisticsCharts();
                }
                if (window.animeLengthCharts) {
                    window.animeLengthCharts();
                }
                if (window.watchByWeekdayChart) {
                    window.watchByWeekdayChart();
                }
                if (window.seasonalPreferenceChart) {
                    window.seasonalPreferenceChart();
                }
            }, 300);
        }
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });

    console.log('✅ Chart initialization fix applied!');

})();

// ============================================
// COMPLETE DATA SYNC SYSTEM - FINAL VERSION
// ============================================

(function() {
    'use strict';

    console.log('🔧 Loading data sync system...');

    // ============================================
    // DATA STATUS BAR (Visible on Mobile)
    // ============================================

    function showDataStatus(message, type = 'loading') {
        let bar = document.getElementById('dataStatusBar');
        
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'dataStatusBar';
            bar.style.cssText = `
                display: none;
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(12px);
                padding: 10px 20px;
                border-radius: 30px;
                border: 1px solid rgba(139, 92, 246, 0.3);
                color: white;
                font-size: 0.8rem;
                z-index: 9999;
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 90%;
                transition: all 0.3s ease;
            `;
            bar.innerHTML = `
                <span id="dataStatusText">Loading data...</span>
                <span id="dataStatusSpinner" style="margin-left: 8px;">
                    <i class="fas fa-spinner fa-spin"></i>
                </span>
            `;
            document.body.appendChild(bar);
        }

        const text = document.getElementById('dataStatusText');
        const spinner = document.getElementById('dataStatusSpinner');
        
        bar.style.display = 'block';
        if (text) text.textContent = message;
        
        if (spinner) {
            if (type === 'loading') {
                spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                bar.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            } else if (type === 'success') {
                spinner.innerHTML = '<i class="fas fa-check-circle" style="color: #34D399;"></i>';
                bar.style.borderColor = 'rgba(52, 211, 153, 0.5)';
            } else if (type === 'error') {
                spinner.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #F87171;"></i>';
                bar.style.borderColor = 'rgba(248, 113, 113, 0.5)';
            } else {
                spinner.innerHTML = '';
            }
        }
    }

    function hideDataStatus() {
        const bar = document.getElementById('dataStatusBar');
        if (bar) {
            bar.style.display = 'none';
        }
    }

    // ============================================
    // CALCULATE TOTAL HOURS
    // ============================================

    function calculateTotalHours(animeData) {
        let totalHours = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed') {
                if (a.type === 'Movie') {
                    totalHours += (a.duration || 120) / 60;
                } else {
                    totalHours += ((a.episodes || 0) * (a.duration || 20)) / 60;
                }
            }
        });
        return Math.round(totalHours);
    }

    // ============================================
    // REFRESH ALL UI
    // ============================================

    function refreshAllUI() {
        console.log('🔄 Refreshing UI...');
        
        const functions = [
            'updateSidebarUserInfo',
            'updateStats', 
            'updateGreetingMessage',
            'initCharts',
            'initStatisticsCharts',
            'refreshAllCharts',
            'updateCurrentlyWatching',
            'updateTopRatedAnime',
            'updateRecentActivity',
            'updateAnimeDisplay',
            'updateWatchlist',
            'updateAchievements',
            'updateStatsHero',
            'updateOverviewMetrics',
            'updateLibraryAnalytics',
            'updateRatingAnalytics',
            'updateCompletionJourney',
            'updateStudioSeasonal'
        ];

        functions.forEach(fnName => {
            if (typeof window[fnName] === 'function') {
                try { window[fnName](); } catch (e) {}
            }
        });

        if (window.AniPulseLevelSystem?.updateAllLevelUI) {
            window.AniPulseLevelSystem.updateAllLevelUI();
        }

        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const userName = userProfile.name || 'AnimeFan';
        const avatar = userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366F1&color=fff`;
        
        document.querySelectorAll('.sidebar-username, .user-profile span, #profilePreviewName, #heroUsername').forEach(el => {
            if (el) el.textContent = userName;
        });

        document.querySelectorAll('.user-avatar, .sidebar-avatar, #profilePreviewAvatar').forEach(el => {
            if (el) el.src = avatar;
        });
    }

    // ============================================
    // LOAD DATA FROM DATABASE
    // ============================================

    async function loadAllDataFromDatabase() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showDataStatus('Not logged in', 'error');
            setTimeout(hideDataStatus, 3000);
            return false;
        }

        showDataStatus('Loading your data...', 'loading');

        try {
            const response = await fetch('http://localhost:3000/api/sync/load-all', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error('Failed to load data');
            }

            const { data } = result;
            let loadedCount = 0;
            
            if (data.animeData && Array.isArray(data.animeData)) {
                localStorage.setItem('animeData', JSON.stringify(data.animeData));
                window.animeData = data.animeData;
                loadedCount = data.animeData.length;
                console.log(`✅ Loaded ${data.animeData.length} anime`);
            }

            if (data.userProfile) {
                const userProfile = {
                    name: data.userProfile.name || data.userProfile.username || 'AnimeFan',
                    avatar: data.userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.userProfile.name || 'User')}&background=6366F1&color=fff`,
                    level: data.userProfile.level || 1,
                    title: data.userProfile.title || 'Newbie',
                    totalXP: data.userProfile.totalXP || 0
                };
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                console.log(`✅ Loaded user: ${userProfile.name}`);
            }

            if (data.levelData) {
                localStorage.setItem('userLevel', String(data.levelData.level || 1));
                localStorage.setItem('userLevelTitle', data.levelData.title || 'Newbie');
                localStorage.setItem('userTotalXP', String(data.levelData.totalXP || 0));
                console.log(`✅ Level: ${data.levelData.level} (${data.levelData.totalXP} XP)`);
            }

            if (data.activityLog && Array.isArray(data.activityLog)) {
                localStorage.setItem('activityLog', JSON.stringify(data.activityLog));
                window.activityLog = data.activityLog;
            }

            if (data.unlockedAchievements && Array.isArray(data.unlockedAchievements)) {
                localStorage.setItem('unlockedAchievements', JSON.stringify(data.unlockedAchievements));
            }

            showDataStatus(`✅ Loaded ${loadedCount} anime`, 'success');
            
            setTimeout(() => {
                refreshAllUI();
                hideDataStatus();
                if (typeof showToast === 'function') {
                    showToast('Data loaded successfully! 🎉', 'success');
                }
            }, 1000);

            return true;

        } catch (error) {
            console.error('Load error:', error);
            showDataStatus(`❌ ${error.message}`, 'error');
            setTimeout(hideDataStatus, 4000);
            
            // Try local data as fallback
            const localData = localStorage.getItem('animeData');
            if (localData) {
                window.animeData = JSON.parse(localData);
                showDataStatus('📦 Using local data', 'info');
                setTimeout(() => {
                    refreshAllUI();
                    hideDataStatus();
                }, 1000);
                return false;
            }
            return false;
        }
    }

    // ============================================
    // SAVE DATA TO DATABASE
    // ============================================

    async function saveAllDataToDatabase() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;

        try {
            const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
            const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
            const userXpHistory = JSON.parse(localStorage.getItem('userXpHistory') || '[]');
            const animeContributions = JSON.parse(localStorage.getItem('animeContributions') || '{}');
            const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');

            const level = parseInt(localStorage.getItem('userLevel') || '1');
            const title = localStorage.getItem('userLevelTitle') || 'Newbie';
            const totalXP = parseInt(localStorage.getItem('userTotalXP') || '0');

            const levelData = {
                level: level,
                title: title,
                totalXP: totalXP,
                totalAnime: animeData.filter(a => a.userStatus === 'Completed').length,
                totalHours: calculateTotalHours(animeData)
            };

            const response = await fetch('http://localhost:3000/api/sync/sync-all', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    animeData,
                    activityLog,
                    userProfile,
                    unlockedAchievements,
                    userXpHistory,
                    animeContributions,
                    appSettings,
                    levelData
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            console.log('✅ Data saved to database');
            return true;

        } catch (error) {
            console.error('Save error:', error);
            return false;
        }
    }

    // ============================================
    // CHECK LOGIN ON LOAD
    // ============================================

    async function checkLoginAndLoadData() {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !user.uid) {
            console.log('👤 Not logged in');
            return;
        }

        console.log(`👤 Logged in as: ${user.name || user.username}`);
        await loadAllDataFromDatabase();
    }

    // ============================================
    // OVERRIDE LOGIN
    // ============================================

    window.loginUser = async function(email, password) {
        try {
            showDataStatus('🔐 Logging in...', 'loading');
            
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();
            
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            const userProfile = {
                name: data.user.name || data.user.username || 'AnimeFan',
                avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name || 'User')}&background=6366F1&color=fff`,
                level: data.user.level || 1,
                title: data.user.title || 'Newbie',
                totalXP: data.user.totalXP || 0
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            
            showDataStatus('✅ Logged in! Loading data...', 'success');
            
            await loadAllDataFromDatabase();
            
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
            
            return true;
            
        } catch (error) {
            console.error('Login error:', error);
            showDataStatus(`❌ ${error.message}`, 'error');
            setTimeout(hideDataStatus, 4000);
            return false;
        }
    };

    // ============================================
    // AUTO-SAVE ON DATA CHANGE
    // ============================================

    const originalSaveData = window.saveData;
    if (typeof originalSaveData === 'function') {
        window.saveData = function() {
            originalSaveData();
            clearTimeout(window._saveTimeout);
            window._saveTimeout = setTimeout(() => {
                saveAllDataToDatabase();
            }, 3000);
        };
    }

    // ============================================
    // INITIALIZE
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(checkLoginAndLoadData, 800);
        });
    } else {
        setTimeout(checkLoginAndLoadData, 800);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(checkLoginAndLoadData, 500);
        }
    });

    // ============================================
    // EXPOSE
    // ============================================

    window.loadAllDataFromDatabase = loadAllDataFromDatabase;
    window.saveAllDataToDatabase = saveAllDataToDatabase;
    window.refreshAllUI = refreshAllUI;
    window.showDataStatus = showDataStatus;
    window.hideDataStatus = hideDataStatus;

    console.log('✅ Data sync system loaded!');

})();

// ============================================
// FIX: CHART INITIALIZATION - ONLY RUN ON STATISTICS PAGE
// ============================================

(function fixChartInitialization() {
    'use strict';

    console.log('🔧 Fixing chart initialization...');

    // ============================================
    // SAFE CHART INITIALIZATION
    // ============================================

    // Store the original init function
    const originalInitCharts = window.initStatisticsCharts;

    // Override with safe version
    window.initStatisticsCharts = function() {
        console.log('📊 Initializing statistics charts (safe version)...');

        // Check if we're on the statistics page
        const statsPage = document.getElementById('statistics-page');
        if (!statsPage || !statsPage.classList.contains('active')) {
            console.log('⏳ Statistics page not active, skipping chart init');
            return;
        }

        // Check if chart elements exist
        const chartIds = [
            'completionChart',
            'scoreDistributionChart',
            'statusDistributionChart',
            'typeDistributionChart',
            'genreStatsChart',
            'avgScoreByGenreChart',
            'watchByWeekdayChart',
            'longestAnimeChart',
            'shortestAnimeChart',
            'seasonalPreferenceChart'
        ];

        const missingCharts = chartIds.filter(id => !document.getElementById(id));
        
        if (missingCharts.length > 0) {
            console.log('⏳ Chart elements not ready, retrying in 500ms...');
            console.log('⚠️ Missing:', missingCharts);
            setTimeout(() => {
                if (window.initStatisticsCharts) {
                    window.initStatisticsCharts();
                }
            }, 500);
            return;
        }

        // All elements exist, call original
        if (typeof originalInitCharts === 'function') {
            try {
                originalInitCharts();
                console.log('✅ Charts initialized successfully');
            } catch (error) {
                console.warn('⚠️ Chart initialization error:', error.message);
            }
        }
    };

    // ============================================
    // FIX: animeLengthCharts
    // ============================================

    const originalAnimeLengthCharts = window.animeLengthCharts;

    window.animeLengthCharts = function() {
        const longestCanvas = document.getElementById('longestAnimeChart');
        const shortestCanvas = document.getElementById('shortestAnimeChart');

        if (!longestCanvas || !shortestCanvas) {
            console.log('⏳ Anime length chart elements not ready');
            return;
        }

        if (typeof originalAnimeLengthCharts === 'function') {
            try {
                originalAnimeLengthCharts();
            } catch (error) {
                console.warn('⚠️ Anime length chart error:', error.message);
            }
        }
    };

    // ============================================
    // FIX: watchByWeekdayChart
    // ============================================

    const originalWatchByWeekday = window.watchByWeekdayChart;

    window.watchByWeekdayChart = function() {
        const canvas = document.getElementById('watchByWeekdayChart');
        if (!canvas) {
            console.log('⏳ Watch by weekday chart element not ready');
            return;
        }

        if (typeof originalWatchByWeekday === 'function') {
            try {
                originalWatchByWeekday();
            } catch (error) {
                console.warn('⚠️ Watch by weekday chart error:', error.message);
            }
        }
    };

    // ============================================
    // FIX: seasonalPreferenceChart
    // ============================================

    const originalSeasonalPreference = window.seasonalPreferenceChart;

    window.seasonalPreferenceChart = function() {
        const canvas = document.getElementById('seasonalPreferenceChart');
        if (!canvas) {
            console.log('⏳ Seasonal preference chart element not ready');
            return;
        }

        if (typeof originalSeasonalPreference === 'function') {
            try {
                originalSeasonalPreference();
            } catch (error) {
                console.warn('⚠️ Seasonal preference chart error:', error.message);
            }
        }
    };

    // ============================================
    // INITIALIZE CHARTS WHEN STATISTICS PAGE IS ACTIVATED
    // ============================================

    // Watch for Statistics page activation
    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', function() {
            console.log('📊 Statistics page clicked, initializing charts...');
            setTimeout(() => {
                if (window.initStatisticsCharts) {
                    window.initStatisticsCharts();
                }
                if (window.animeLengthCharts) {
                    window.animeLengthCharts();
                }
                if (window.watchByWeekdayChart) {
                    window.watchByWeekdayChart();
                }
                if (window.seasonalPreferenceChart) {
                    window.seasonalPreferenceChart();
                }
            }, 300);
        });
    }

    // Also watch for when Statistics page becomes visible
    const observer = new MutationObserver(() => {
        const statsPage = document.getElementById('statistics-page');
        if (statsPage && statsPage.classList.contains('active')) {
            console.log('📊 Statistics page became active, initializing charts...');
            setTimeout(() => {
                if (window.initStatisticsCharts) {
                    window.initStatisticsCharts();
                }
                if (window.animeLengthCharts) {
                    window.animeLengthCharts();
                }
                if (window.watchByWeekdayChart) {
                    window.watchByWeekdayChart();
                }
                if (window.seasonalPreferenceChart) {
                    window.seasonalPreferenceChart();
                }
            }, 300);
        }
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });

    // ============================================
    // SAFE GET CONTEXT FUNCTION
    // ============================================

    window.safeGetContext = function(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`⚠️ Canvas "${canvasId}" not found`);
            return null;
        }
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.warn(`⚠️ Cannot get 2D context for "${canvasId}"`);
                return null;
            }
            return ctx;
        } catch (error) {
            console.warn(`⚠️ Error getting context for "${canvasId}":`, error);
            return null;
        }
    };

    // ============================================
    // SAFE DESTROY CHART
    // ============================================

    window.safeDestroyChart = function(chartInstance) {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            try {
                chartInstance.destroy();
            } catch (e) {
                // Ignore
            }
        }
        return null;
    };

    // ============================================
    // OVERRIDE refreshAllCharts to be safe
    // ============================================

    const originalRefreshAll = window.refreshAllCharts;

    window.refreshAllCharts = function() {
        const statsPage = document.getElementById('statistics-page');
        if (!statsPage || !statsPage.classList.contains('active')) {
            console.log('⏳ Statistics page not active, skipping chart refresh');
            return;
        }

        if (typeof originalRefreshAll === 'function') {
            try {
                originalRefreshAll();
            } catch (error) {
                console.warn('⚠️ Chart refresh error:', error.message);
            }
        }
    };

    console.log('✅ Chart initialization fix applied!');

})();



// Initialize the app with saved theme (theme loads before loader)
initializeTheme();
