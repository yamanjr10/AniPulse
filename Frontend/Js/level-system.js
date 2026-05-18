// =============================================
// LEVEL SYSTEM - RPG STYLE WITH XP TRACKING
// =============================================

// Level configuration - 21 levels with RPG-themed titles
const LEVEL_CONFIG = [
    { level: 1, title: "Newbie", xpRequired: 0 },
    { level: 2, title: "Scout", xpRequired: 100 },
    { level: 3, title: "Viewer", xpRequired: 250 },
    { level: 4, title: "Otaku", xpRequired: 500 },
    { level: 5, title: "Fanatic", xpRequired: 800 },
    { level: 6, title: "Binge Hunter", xpRequired: 1200 },
    { level: 7, title: "Senpai", xpRequired: 1700 },
    { level: 8, title: "Shonen Hero", xpRequired: 2300 },
    { level: 9, title: "Elite Otaku", xpRequired: 3000 },
    { level: 10, title: "Anime Legend", xpRequired: 4000 },
    { level: 11, title: "Sage", xpRequired: 5200 },
    { level: 12, title: "Archive Keeper", xpRequired: 6500 },
    { level: 13, title: "Dimension Traveler", xpRequired: 8000 },
    { level: 14, title: "Anime Master", xpRequired: 10000 },
    { level: 15, title: "Grand Senpai", xpRequired: 12500 },
    { level: 16, title: "Hokage", xpRequired: 15000 },
    { level: 17, title: "Transcendent", xpRequired: 18000 },
    { level: 18, title: "Elite", xpRequired: 22000 },
    { level: 19, title: "Eternal Watcher", xpRequired: 27000 },
    { level: 20, title: "Legend", xpRequired: 35000 },
    { level: 21, title: "Anime Deity", xpRequired: 45000 },
    { level: 22, title: "∞", xpRequired: Infinity }
];

// Storage keys
const LEVEL_STORAGE_KEY = 'userLevelData';
const XP_HISTORY_KEY = 'userXpHistory';

// User XP data structure
let userXPData = {
    totalXP: 0,
    currentLevel: 1,
    levelTitle: "Newbie",
    xpToNextLevel: 100,
    xpProgress: 0,
    lastUpdated: null,
    completedAnimeXP: {}
};

// Calculate XP for a single anime based on your formula
function calculateAnimeXP(anime) {
    let xp = 0;

    // 1. Completion Bonus: +10 XP (Anime marked as Completed)
    if (anime.userStatus === 'Completed') {
        xp += 10;
    }

    // 2. Episode Bonus: +1 XP per 2 episodes (episodes ÷ 2, floor)
    const episodes = anime.episodes || 0;
    xp += Math.floor(episodes / 2);

    // 3. Score Bonus based on rating range
    const score = anime.score || 0;
    if (score >= 9 && score <= 10) {
        xp += 10;  // 9-10 rating
    } else if (score >= 8 && score < 9) {
        xp += 5;   // 8-8.9 rating
    } else if (score >= 7 && score < 8) {
        xp += 3;   // 7-7.9 rating
    } else if (score >= 6 && score < 7) {
        xp += 2;   // 6-6.9 rating
    } else if (score >= 5 && score < 6) {
        xp += 1;   // 5-5.9 rating
    }
    // 0-4.9 rating: +0 XP

    // 4. Movie Bonus: +15 XP for movies
    if (anime.type === 'Movie') {
        xp += 15;
    }

    // 5. Watching Progress Bonus: +1 XP per 5 episodes watched
    const progress = anime.progress || episodes;
    xp += Math.floor(progress / 5);

    // 6. Rating Bonus: +2 XP if anime has a score/rating
    if (anime.score && anime.score > 0) {
        xp += 2;
    }

    // 7. Time Bonus (Hours): +2 XP per hour watched
    const duration = anime.duration || 20;
    const totalMinutes = episodes * duration;
    const totalHours = totalMinutes / 60;
    xp += Math.floor(totalHours * 1);

    // 8. Additional Bonus: +5 XP for completing all episodes (progress == episodes)
    if (anime.userStatus === 'Completed' && progress >= episodes && episodes > 0) {
        xp += 5;
    }

    // Ensure minimum XP of at least 5 for any completed anime
    if (anime.userStatus === 'Completed' && xp < 5) {
        xp = 5;
    }

    return xp;
}

// Function to get detailed XP breakdown (for debugging/info)
function getAnimeXPBreakdown(anime) {
    const episodes = anime.episodes || 0;
    const score = anime.score || 0;
    const progress = anime.progress || episodes;
    const duration = anime.duration || 20;
    const totalMinutes = episodes * duration;
    const totalHours = totalMinutes / 60;

    return {
        completionBonus: anime.userStatus === 'Completed' ? 10 : 0,
        episodeBonus: Math.floor(episodes / 2),
        scoreBonus: (() => {
            if (score >= 9 && score <= 10) return 10;
            if (score >= 8 && score < 9) return 5;
            if (score >= 7 && score < 8) return 3;
            if (score >= 6 && score < 7) return 2;
            if (score >= 5 && score < 6) return 1;
            return 0;
        })(),
        movieBonus: anime.type === 'Movie' ? 15 : 0,
        progressBonus: Math.floor(progress / 5),
        ratingBonus: (anime.score && anime.score > 0) ? 2 : 0,
        timeBonus: Math.floor(totalHours * 2),
        completionExtraBonus: (anime.userStatus === 'Completed' && progress >= episodes && episodes > 0) ? 5 : 0,
        total: calculateAnimeXP(anime)
    };
}

// Initialize level system
function initLevelSystem() {
    loadUserXPData();
    updateAllLevelDisplays();
    setupLevelEventListeners();
    console.log('🎮 Level System initialized!');
}

// Load user XP data from localStorage
function loadUserXPData() {
    const savedData = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            userXPData = { ...userXPData, ...parsed };
            // Recalculate level from total XP to ensure consistency
            recalculateLevelFromXP();
        } catch (e) {
            console.error('Error loading XP data:', e);
        }
    } else {
        // First time user - calculate XP from existing completed anime
        calculateInitialXPFromHistory();
    }
}

// Calculate XP from existing completed anime
function calculateInitialXPFromHistory() {
    const animeData = window.animeData || JSON.parse(localStorage.getItem('animeData')) || [];
    let totalXP = 0;
    const completedAnimeXP = {};

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed') {
            const xp = calculateAnimeXP(anime);
            totalXP += xp;
            completedAnimeXP[anime.id] = xp;
        }
    });

    userXPData.totalXP = totalXP;
    userXPData.completedAnimeXP = completedAnimeXP;
    userXPData.lastUpdated = new Date().toISOString();

    recalculateLevelFromXP();
    saveUserXPData();

    console.log(`📊 Initial XP calculated: ${totalXP} XP from ${Object.keys(completedAnimeXP).length} completed anime`);
}

// Calculate total XP from all completed anime
function calculateTotalXPFromData() {
    const animeData = window.animeData || JSON.parse(localStorage.getItem('animeData')) || [];
    let totalXP = 0;

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed') {
            totalXP += calculateAnimeXP(anime);
        }
    });

    return totalXP;
}

// Recalculate level based on total XP
function recalculateLevelFromXP() {
    let newLevel = 1;
    let newTitle = LEVEL_CONFIG[0].title;
    let xpToNext = LEVEL_CONFIG[1].xpRequired;
    let xpProgress = 0;
    
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
        if (userXPData.totalXP >= LEVEL_CONFIG[i].xpRequired) {
            newLevel = LEVEL_CONFIG[i].level;
            newTitle = LEVEL_CONFIG[i].title;
            
            if (i + 1 < LEVEL_CONFIG.length) {
                xpToNext = LEVEL_CONFIG[i + 1].xpRequired - LEVEL_CONFIG[i].xpRequired;
                xpProgress = userXPData.totalXP - LEVEL_CONFIG[i].xpRequired;
            } else {
                xpToNext = 0;
                xpProgress = 0;
            }
            break;
        }
    }
    
    const oldLevel = userXPData.currentLevel;
    const levelChanged = oldLevel !== newLevel;
    
    userXPData.currentLevel = newLevel;
    userXPData.levelTitle = newTitle;
    userXPData.xpToNextLevel = xpToNext;
    userXPData.xpProgress = Math.min(xpProgress, xpToNext);
    
    console.log(`📊 Level: ${oldLevel} → ${newLevel} (${newTitle}), XP: ${userXPData.xpProgress}/${userXPData.xpToNextLevel}`);
    
    // Check for level up
    if (levelChanged && newLevel > oldLevel) {
        triggerLevelUp(oldLevel, newLevel, newTitle);
    }
    
    return { oldLevel, newLevel, levelChanged };
}

// Save user XP data
function saveUserXPData() {
    localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(userXPData));
}

// Award XP for completing an anime - INSTANT VERSION
function awardXPForAnime(anime, previousStatus = null) {
    console.log('🔥 awardXPForAnime called for:', anime?.title);
    
    if (!anime || anime.userStatus !== 'Completed') {
        console.log('❌ Not completed, skipping');
        return 0;
    }
    
    // Check if already awarded XP for this anime
    if (userXPData.completedAnimeXP[anime.id]) {
        console.log(`⚠️ XP already awarded for "${anime.title}"`);
        return 0;
    }
    
    // Calculate XP for this anime
    const xpEarned = calculateAnimeXP(anime);
    const breakdown = getAnimeXPBreakdown(anime);
    
    console.log(`📊 Calculated ${xpEarned} XP for "${anime.title}"`);
    
    // Store before values
    const beforeLevel = userXPData.currentLevel;
    const beforeTotalXP = userXPData.totalXP;
    
    // Add XP - INSTANT
    userXPData.totalXP += xpEarned;
    userXPData.completedAnimeXP[anime.id] = xpEarned;
    userXPData.lastUpdated = new Date().toISOString();
    
    // Recalculate level - INSTANT
    recalculateLevelFromXP();
    saveUserXPData();
    
    console.log(`✅ XP Added! New total: ${userXPData.totalXP} XP (was ${beforeTotalXP})`);
    
    // Show XP popup - INSTANT
    showXPPopup(anime.title, xpEarned, beforeTotalXP, userXPData.totalXP, beforeLevel, userXPData.currentLevel, breakdown);
    
    // Update all displays - INSTANT
    updateAllLevelDisplays();
    
    // Save XP history
    saveXPHistory(anime.id, anime.title, xpEarned);
    
    // Also update the sidebar stats to show new total
    if (typeof updateSidebarUserInfo === 'function') {
        updateSidebarUserInfo();
    }
    
    return xpEarned;
}

// Save XP history for tracking
function saveXPHistory(animeId, animeTitle, xpEarned) {
    let history = JSON.parse(localStorage.getItem(XP_HISTORY_KEY) || '[]');
    history.unshift({
        id: Date.now(),
        animeId: animeId,
        animeTitle: animeTitle,
        xpEarned: xpEarned,
        timestamp: new Date().toISOString(),
        totalXP: userXPData.totalXP,
        level: userXPData.currentLevel
    });

    // Keep only last 100 entries
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem(XP_HISTORY_KEY, JSON.stringify(history));
}

// Show XP popup notification with breakdown
function showXPPopup(animeTitle, xpEarned, beforeTotalXP, afterTotalXP, beforeLevel, afterLevel, breakdown) {
    const levelUp = afterLevel > beforeLevel;
    const levelTitle = LEVEL_CONFIG[afterLevel].title;
    const nextLevelXP = userXPData.xpToNextLevel;
    const currentProgress = userXPData.xpProgress;
    const totalXP = afterTotalXP;
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.innerHTML = `
        <div class="xp-popup-content ${levelUp ? 'level-up' : ''}">
            <div class="xp-popup-icon">
                ${levelUp ? '<i class="fas fa-trophy"></i>' : '<i class="fas fa-star"></i>'}
            </div>
            <div class="xp-popup-text">
                ${levelUp ? '<div class="level-up-text">LEVEL UP!</div>' : ''}
                <div class="xp-earned">+${xpEarned} XP</div>
                <div class="xp-anime">from "${escapeHtml(animeTitle)}"</div>
                ${levelUp ? `<div class="level-reached">Reached ${levelTitle} (Level ${afterLevel})!</div>` : ''}
                <div class="xp-progress-mini">
                    <div class="xp-progress-bar-mini" style="width: ${(currentProgress / nextLevelXP) * 100}%"></div>
                    <div class="xp-progress-stats">
                        <span>📊 ${currentProgress} / ${nextLevelXP} XP</span>
                        <span>🎯 Total: ${totalXP} XP</span>
                    </div>
                </div>
            </div>
            <button class="xp-popup-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Force reflow to trigger animation
    popup.offsetHeight;
    
    // Add show class
    popup.classList.add('show');
    
    // Auto-remove after 5 seconds
    const timeout = setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            if (popup && popup.parentNode) popup.remove();
        }, 300);
    }, 5000);
    
    // Close button
    const closeBtn = popup.querySelector('.xp-popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeout);
            popup.classList.remove('show');
            setTimeout(() => {
                if (popup && popup.parentNode) popup.remove();
            }, 300);
        });
    }
    
    // Also show a simple toast as backup
    if (typeof window.showToast === 'function') {
        const message = levelUp 
            ? `🎉 LEVEL UP! +${xpEarned} XP! You are now ${levelTitle}!`
            : `✨ +${xpEarned} XP from "${animeTitle}"! Total: ${totalXP} XP`;
        window.showToast(message, levelUp ? 'success' : 'info');
    } else {
        // Fallback alert if no toast function
        console.log(`✨ +${xpEarned} XP from "${animeTitle}"! Total: ${totalXP} XP`);
    }
    
    console.log(`🎉 Popup shown: +${xpEarned} XP from "${animeTitle}"`);
}

// Escape HTML helper
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update sidebar with level info
function updateSidebarLevelDisplay() {
    // Find sidebar user container
    const sidebarUser = document.querySelector('.sidebar-user');
    if (!sidebarUser) return;

    // Check if level display already exists
    let levelDisplay = sidebarUser.querySelector('.user-level-display');

    if (!levelDisplay) {
        // Create level display element
        levelDisplay = document.createElement('div');
        levelDisplay.className = 'user-level-display';

    }
}

// Update settings page with level info and next level preview
function updateSettingsLevelDisplay() {
    const settingsContainer = document.querySelector('#settings-page .settings-container');
    if (!settingsContainer) return;

    // Check if level card exists
    let levelCard = document.getElementById('level-progress-card');

    if (!levelCard) {
        // Create level card
        levelCard = document.createElement('div');
        levelCard.id = 'level-progress-card';
        levelCard.className = 'settings-group level-progress-card';

        // Find where to insert (after profile preview)
        const profilePreview = settingsContainer.querySelector('.profile-preview');
        if (profilePreview) {
            profilePreview.insertAdjacentElement('afterend', levelCard);
        } else {
            settingsContainer.insertBefore(levelCard, settingsContainer.firstChild);
        }
    }

    // Calculate next 5 levels preview
    const nextLevels = [];
    for (let i = userXPData.currentLevel + 1; i <= Math.min(userXPData.currentLevel + 5, LEVEL_CONFIG.length - 2); i++) {
        const levelData = LEVEL_CONFIG[i];
        const xpNeeded = levelData.xpRequired - userXPData.totalXP;
        nextLevels.push({
            level: levelData.level,
            title: levelData.title,
            xpNeeded: Math.max(0, xpNeeded)
        });
    }

    const progressPercent = (userXPData.xpProgress / userXPData.xpToNextLevel) * 100;

    levelCard.innerHTML = `
        <h3><i class="fas fa-chart-line"></i> Your Level Progress</h3>
        
        <div class="level-main-card">
            <div class="level-info">
                <div class="current-level-badge">
                    <span class="level-num">Level ${userXPData.currentLevel}</span>
                    <span class="level-name">${userXPData.levelTitle}</span>
                </div>
                <div class="level-xp-bar">
                    <div class="level-xp-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="level-xp-stats">
                <span> ${userXPData.totalXP.toLocaleString()} / ${userXPData.xpToNextLevel + (userXPData.totalXP - userXPData.xpProgress)} XP Total for Level ${userXPData.currentLevel + 1}</span>
                  <span> ${Math.ceil(progressPercent)}% Completed</span>
                </div>
            </div>
        </div>
        
        <div class="level-stats-grid">
            <div class="level-stat">
                <i class="fas fa-trophy"></i>
                <div>
                    <div class="stat-label">Total XP</div>
                    <div class="stat-value">${userXPData.totalXP.toLocaleString()}</div>
                </div>
            </div>
            <div class="level-stat">
                <i class="fas fa-check-circle"></i>
                <div>
                    <div class="stat-label">Completed Anime</div>
                    <div class="stat-value">${Object.keys(userXPData.completedAnimeXP).length}</div>
                </div>
            </div>
            <div class="level-stat">
                <i class="fas fa-rocket"></i>
                <div>
                    <div class="stat-label">Current Rank</div>
                    <div class="stat-value">${userXPData.levelTitle}</div>
                </div>
            </div>
        </div>
    `;
}

// Update top bar level display
function updateTopBarLevelDisplay() {
    const userActions = document.querySelector('.user-actions');
    if (!userActions) return;

    let levelBadge = document.getElementById('topbar-level-badge');

    if (!levelBadge) {
        levelBadge = document.createElement('div');
        levelBadge.id = 'topbar-level-badge';
        levelBadge.className = 'level-mini-badge';

        // Insert before user profile
        const userProfile = userActions.querySelector('.user-profile');
        if (userProfile) {
            userActions.insertBefore(levelBadge, userProfile);
        }
    }

   // Set rank attribute for CSS styling
    levelBadge.setAttribute('data-rank', userXPData.levelTitle);
    
    levelBadge.innerHTML = `
        <i class="fas fa-crown"></i>
        <span class="level-number">Lv.${userXPData.currentLevel}</span>
        <span class="level-title-mini">${userXPData.levelTitle}</span>
    `;
}

// Update all level displays across the site
function updateAllLevelDisplays() {
    updateSidebarLevelDisplay();
    updateSettingsLevelDisplay();
    updateTopBarLevelDisplay();

    // Dispatch custom event for any other components
    window.dispatchEvent(new CustomEvent('levelUpdated', {
        detail: {
            level: userXPData.currentLevel,
            title: userXPData.levelTitle,
            totalXP: userXPData.totalXP,
            progress: userXPData.xpProgress,
            xpToNext: userXPData.xpToNextLevel
        }
    }));
}

// Trigger level up effects
function triggerLevelUp(oldLevel, newLevel, newTitle) {
    console.log(`🎉 LEVEL UP! ${oldLevel} → ${newLevel} - ${newTitle}`);

    // Create floating celebration effect
    createLevelUpCelebration(newLevel, newTitle);

    // Show special toast
    if (typeof window.showToast === 'function') {
        window.showToast(`🎉 LEVEL UP! You are now ${newTitle} (Level ${newLevel})!`, 'success', 8000);
    }
}

// Create floating celebration effect for level up
function createLevelUpCelebration(level, title) {
    const celebration = document.createElement('div');
    celebration.className = 'level-up-celebration';
    celebration.innerHTML = `
        <div class="celebration-content">
            <i class="fas fa-crown"></i>
            <div class="celebration-text">
                <div class="celebration-title">LEVEL UP!</div>
                <div class="celebration-level">${title}</div>
                <div class="celebration-num">Level ${level}</div>
            </div>
        </div>
    `;

    document.body.appendChild(celebration);

    // Animate
    setTimeout(() => celebration.classList.add('show'), 10);

    // Remove after animation
    setTimeout(() => {
        celebration.classList.remove('show');
        setTimeout(() => celebration.remove(), 500);
    }, 3000);
}

// Hook into anime completion events
function setupLevelEventListeners() {
    // Listen for anime updates from main.js
    window.addEventListener('animeCompleted', (event) => {
        const { anime, previousStatus } = event.detail || {};
        if (anime) {
            awardXPForAnime(anime, previousStatus);
        }
    });

    // Watch for storage changes (cross-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === LEVEL_STORAGE_KEY) {
            loadUserXPData();
            updateAllLevelDisplays();
        } else if (e.key === 'animeData') {
            // Sync XP with anime data changes
            syncXPWithAnimeData();
        }
    });

    // Also check when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            syncXPWithAnimeData();
        }
    });
}

// Sync XP with anime data (for when data changes externally)
function syncXPWithAnimeData() {
    const animeData = window.animeData || JSON.parse(localStorage.getItem('animeData')) || [];
    const completedAnime = animeData.filter(a => a.userStatus === 'Completed');

    let totalXP = 0;
    const completedAnimeXP = {};

    completedAnime.forEach(anime => {
        const xp = calculateAnimeXP(anime);
        totalXP += xp;
        completedAnimeXP[anime.id] = xp;
    });

    if (totalXP !== userXPData.totalXP) {
        userXPData.totalXP = totalXP;
        userXPData.completedAnimeXP = completedAnimeXP;
        userXPData.lastUpdated = new Date().toISOString();
        recalculateLevelFromXP();
        saveUserXPData();
        updateAllLevelDisplays();
        console.log('🔄 XP synced with anime data');
    }
}

// Manual refresh function (call when needed)
function refreshLevelDisplay() {
    syncXPWithAnimeData();
    updateAllLevelDisplays();
}

// Get current user level data (for other components)
function getUserLevelData() {
    return {
        level: userXPData.currentLevel,
        title: userXPData.levelTitle,
        totalXP: userXPData.totalXP,
        xpProgress: userXPData.xpProgress,
        xpToNext: userXPData.xpToNextLevel,
        completionCount: Object.keys(userXPData.completedAnimeXP).length
    };
}

// Export functions for global use
window.levelSystem = {
    init: initLevelSystem,
    awardXPForAnime: awardXPForAnime,
    getUserLevelData: getUserLevelData,
    refreshDisplay: refreshLevelDisplay,
    calculateAnimeXP: calculateAnimeXP,
    getAnimeXPBreakdown: getAnimeXPBreakdown,
    getLevelConfig: () => LEVEL_CONFIG
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for animeData to load
        setTimeout(initLevelSystem, 500);
    });
} else {
    setTimeout(initLevelSystem, 500);
}

// Force refresh all displays - call this after any XP change
function forceRefreshDisplay() {
    console.log('🔄 Force refreshing all level displays...');
    updateAllLevelDisplays();
    
    // Also refresh sidebar stats
    if (typeof updateSidebarUserInfo === 'function') {
        updateSidebarUserInfo();
    }
    
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('levelDataChanged', {
        detail: getUserLevelData()
    }));
}

// Add to exports
window.levelSystem = {
    init: initLevelSystem,
    awardXPForAnime: awardXPForAnime,
    getUserLevelData: getUserLevelData,
    refreshDisplay: refreshLevelDisplay,
    forceRefresh: forceRefreshDisplay,  // Add this
    calculateAnimeXP: calculateAnimeXP,
    getAnimeXPBreakdown: getAnimeXPBreakdown,
    getLevelConfig: () => LEVEL_CONFIG
};

// Add this to level-system.js for debugging
function resetAnimeXP(animeId) {
    if (userXPData.completedAnimeXP[animeId]) {
        const oldXP = userXPData.completedAnimeXP[animeId];
        delete userXPData.completedAnimeXP[animeId];
        userXPData.totalXP -= oldXP;
        recalculateLevelFromXP();
        saveUserXPData();
        updateAllLevelDisplays();
        console.log(`🔄 Reset XP for anime ID ${animeId}: removed ${oldXP} XP`);
        return true;
    }
    console.log(`❌ No XP found for anime ID ${animeId}`);
    return false;
}

// Add to exports
window.levelSystem.resetAnimeXP = resetAnimeXP;

// Remove XP for a deleted anime
function removeAnimeXP(animeId, animeTitle) {
    if (userXPData.completedAnimeXP[animeId]) {
        const removedXP = userXPData.completedAnimeXP[animeId];
        delete userXPData.completedAnimeXP[animeId];
        userXPData.totalXP -= removedXP;
        
        // Ensure total XP doesn't go below 0
        if (userXPData.totalXP < 0) userXPData.totalXP = 0;
        
        recalculateLevelFromXP();
        saveUserXPData();
        updateAllLevelDisplays();
        
        console.log(`🗑️ Removed ${removedXP} XP for deleted anime: ${animeTitle}`);
        
        // Show toast notification
        if (typeof window.showToast === 'function') {
            window.showToast(`🗑️ Removed ${removedXP} XP for "${animeTitle}"`, 'info');
        }
        
        return removedXP;
    }
    console.log(`ℹ️ No XP found for deleted anime: ${animeTitle}`);
    return 0;
}

// Add to exports
window.levelSystem.removeAnimeXP = removeAnimeXP;

// Force clear XP for a specific anime and recalculate everything
function forceClearAnimeXP(animeId, animeTitle) {
    console.log(`🔧 Force clearing XP for: ${animeTitle} (ID: ${animeId})`);
    
    if (userXPData.completedAnimeXP[animeId]) {
        const removedXP = userXPData.completedAnimeXP[animeId];
        delete userXPData.completedAnimeXP[animeId];
        userXPData.totalXP -= removedXP;
        
        // Ensure total XP doesn't go below 0
        if (userXPData.totalXP < 0) userXPData.totalXP = 0;
        
        // Recalculate level
        recalculateLevelFromXP();
        saveUserXPData();
        updateAllLevelDisplays();
        
        console.log(`✅ Removed ${removedXP} XP for "${animeTitle}"`);
        console.log(`📊 New total XP: ${userXPData.totalXP}`);
        
        return removedXP;
    }
    console.log(`ℹ️ No XP found for "${animeTitle}"`);
    return 0;
}

// Completely reset XP system (use with caution)
function resetEntireXPSystem() {
    if (confirm('⚠️ This will reset ALL your XP progress! Are you sure?')) {
        // Reset XP data
        userXPData = {
            totalXP: 0,
            currentLevel: 1,
            levelTitle: "Newbie",
            xpToNextLevel: 100,
            xpProgress: 0,
            lastUpdated: new Date().toISOString(),
            completedAnimeXP: {}
        };
        
        // Recalculate from current anime data
        const animeData = window.animeData || JSON.parse(localStorage.getItem('animeData')) || [];
        let totalXP = 0;
        
        animeData.forEach(anime => {
            if (anime.userStatus === 'Completed') {
                const xp = calculateAnimeXP(anime);
                totalXP += xp;
                userXPData.completedAnimeXP[anime.id] = xp;
            }
        });
        
        userXPData.totalXP = totalXP;
        recalculateLevelFromXP();
        saveUserXPData();
        updateAllLevelDisplays();
        
        console.log(`🔄 XP System Reset! New total: ${totalXP} XP`);
        location.reload();
    }
}

// Add to exports
window.levelSystem.forceClearAnimeXP = forceClearAnimeXP;
window.levelSystem.resetEntireXPSystem = resetEntireXPSystem;