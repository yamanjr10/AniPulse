// =============================================
//UPDATE 1.0.0
// =============================================

// Make sure showToast is available
if (typeof showToast === 'undefined') {
    window.showToast = function (message, type = 'info') {
        console.log(`[Toast] ${type}: ${message}`);
        // Create a simple toast if the main one isn't available
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<span>${message}</span>`;
            toastContainer.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            alert(message);
        }
    };
}

// --- Search Debounce ---
let searchTimeout;

function setupDebouncedSearch() {
    if (typeof window.searchAnime !== 'function' || window.searchAnime.__debounced) {
        return;
    }

    const originalSearch = window.searchAnime.bind(window);

    function debouncedSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => originalSearch(), 400);
    }

    debouncedSearch.__debounced = true;
    window.searchAnime = debouncedSearch;
}

function setupToastQueue() {
    if (typeof window.showToast !== 'function' || window.showToast.__queued) {
        return;
    }

    const originalShowToast = window.showToast.bind(window);

    function queuedShowToast(msg, type = 'info', customClass = '') {
        toastQueue.push({ msg, type, customClass });
        if (!showingToast) {
            processNextToast(originalShowToast);
        }
    }

    queuedShowToast.__queued = true;
    window.showToast = queuedShowToast;
}

function processNextToast(oldShowToast) {
    if (toastQueue.length === 0) {
        showingToast = false;
        return;
    }
    showingToast = true;
    const { msg, type, customClass } = toastQueue.shift();
    oldShowToast(msg, type, customClass);
    setTimeout(() => processNextToast(oldShowToast), 2000);
}

// --- Auto Backup Reminder ---
document.addEventListener('DOMContentLoaded', () => {
    setupDebouncedSearch();
    setupToastQueue();

    const lastBackup = localStorage.getItem('lastBackup');
    const now = Date.now();
    if (!lastBackup || now - parseInt(lastBackup) > 7 * 24 * 60 * 60 * 1000) {
        window.showToast('Reminder: Export your AnimeTracker data for backup!', 'info');
    }
    localStorage.setItem('lastBackup', now.toString());
});

// --- Favorite Genres Over Time Chart (based on user animeData) ---
function calculateUserGenreTrends() {
    const genreTrends = {};
    const years = new Set();

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.genres && anime.finishDate) {
            const finishYear = new Date(anime.finishDate).getFullYear();
            if (isNaN(finishYear)) return;
            years.add(finishYear);

            anime.genres.forEach(genre => {
                if (!genreTrends[genre]) genreTrends[genre] = {};
                genreTrends[genre][finishYear] = (genreTrends[genre][finishYear] || 0) + 1;
            });
        }
    });

    return {
        years: Array.from(years).sort((a, b) => a - b),
        data: genreTrends
    };
}

// --- Toast Queue ---
let toastQueue = [];
let showingToast = false;

const oldShowToast = showToast;
window.showToast = function (msg, type = 'info') {
    toastQueue.push({ msg, type });
    if (!showingToast) processNextToast();
};

function processNextToast() {
    if (toastQueue.length === 0) {
        showingToast = false;
        return;
    }
    showingToast = true;
    const { msg, type } = toastQueue.shift();
    oldShowToast(msg, type);
    setTimeout(processNextToast, 2000);
}

// =============================================
//Greatings
// =============================================

(function () {
    const banner = document.getElementById("greetingBanner");
    if (!banner) return;

    const greetingLine = document.getElementById("greetingLine");
    const greetingEmoji = document.getElementById("greetingEmoji");
    const greetingSubline = document.getElementById("greetingSubline");
    const liveClock = document.getElementById("liveClock");
    const dailyFocus = document.getElementById("dailyFocus");
    const streakInfo = document.getElementById("streakInfo");
    const dailyQuote = document.getElementById("dailyQuote");
    const dismissBtn = document.getElementById("dismissGreeting");

    const userName =
        window.userName ||
        localStorage.getItem("userName") ||
        "Otaku";

    // Anime Quotes Collection
    const quotes = [
        "“Whatever you lose, you'll find it again.” — One Piece",
        "“Push through the pain. Giving up hurts more.” — Naruto",
        "“If you don't take risks, you can't create a future.” — Luffy",
        "“No matter how deep the night, it always turns to day.” — Brook",
        "“People's lives don't end when they die. It ends when they lose faith.” — Itachi Uchiha",
        "“Reality is cruel, but you can't run from it forever. Face the facts.” — Akame",
        "“The world isn't perfect. But it's there for us, doing the best it can.” — Roy Mustang",
        "“A lesson without pain is meaningless. That's because getting hurt teaches us to grow.” — Tomoe",
        "“If you don't like your destiny, don't accept it. Instead, have the courage to change it.” — Naruto Uzumaki",
        "“Hard work is worthless for those that don't believe in themselves.” — Naruto Uzumaki",
        "“If you don't share someone's pain, you can never understand them.” — Nagato",
        "“You can die anytime, but living takes true courage.” — Kenshin Himura",
        "“We're not retreating, we're advancing in a different direction.” — Edward Elric",
        "“The moment you think of giving up, think of the reason why you held on so long.” — Natsu Dragneel",
        "“Never trust anyone too much; remember, the devil was once an angel.” — Kaneki Ken",
        "“You can't win a fight with your eyes closed.” — Killua Zoldyck",
        "“A true hero is one who overcomes life's misfortunes.” — Mumen Rider",
        "“The world is cruel, but also very beautiful.” — Mikasa Ackerman",
        "“Life is not a game of luck. If you wanna win, work hard.” — Sora",
        "“The world isn't perfect. But it's there for us, doing the best it can.” — Hachiman Hikigaya"
    ];

    // --- Streak logic ---
    const today = new Date().toDateString(); // "Mon Jan 10 2026"
    let streak = parseInt(localStorage.getItem("streak") || "0");
    const lastActive = localStorage.getItem("lastActive");

    // If user performed an action today, do nothing
    // If user comes after skipping one or more days, reset streak
    if (lastActive !== today) {
        if (lastActive === new Date(Date.now() - 86400000).toDateString()) {
            // Last active was yesterday → continue streak
            streak += 1;
        } else {
            // Last active was before yesterday → reset streak
            streak = 1;
        }
        localStorage.setItem("streak", streak);
        localStorage.setItem("lastActive", today);
    }

    function getGreetingData(hour) {
        if (hour < 12) return ["Good morning", "☀️", "Fresh episodes, fresh start"];
        if (hour < 17) return ["Good afternoon", "🌤️", "Perfect time to make progress"];
        if (hour < 22) return ["Good evening", "🌙", "Relax and enjoy your favorites"];
        return ["Good night", "🌌", "Late-night anime vibes"];
    }

    function updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        const [text, emoji, sub] = getGreetingData(hour);

        greetingLine.textContent = `${text}, ${userName}`;
        greetingEmoji.textContent = emoji;
        greetingSubline.textContent = sub;

        liveClock.textContent = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        streakInfo.textContent = `🔥 ${streak}-day streak`;

        dailyQuote.textContent =
            quotes[Math.floor(Math.random() * quotes.length)];
    }

    updateGreeting();
    setInterval(updateGreeting, 60 * 1000);
})();

// profile Drop Down Menu toggle

const profileToggle = document.getElementById("profileMenuToggle");
const profileDropdown = document.querySelector(".profile-dropdown");

profileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
    profileDropdown.classList.remove("open");
});

// search Drop Down Menu toggle

const searchToggle = document.getElementById("searchToggle");
const searchDropdown = document.querySelector(".search-dropdown");
const searchInput = document.getElementById("dashboardSearch");

/* Toggle when clicking the search icon */
searchToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    searchDropdown.classList.toggle("open");
    searchInput.focus();
});

/* Prevent closing when clicking inside the dropdown */
searchDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
});

/* Close when clicking outside */
document.addEventListener("click", () => {
    searchDropdown.classList.remove("open");
});
// =============================================
// ANIME DNA - FIXED VERSION
// =============================================

// Safe function to get anime data
function getAnimeDataSafe() {
    // Try to get from global variable first
    if (typeof window.animeData !== 'undefined' && window.animeData) {
        return window.animeData;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('animeData');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

// Calculate Anime DNA from user's completed anime
function calculateAnimeDNA() {
    // Use safe function to get data
    const animeList = getAnimeDataSafe();

    // Filter only completed anime
    const completedAnime = animeList.filter(anime => anime.userStatus === 'Completed');

    if (completedAnime.length === 0) {
        return {
            topGenre: '—',
            avgScore: '—',
            topFormat: '—'
        };
    }

    // 1. Calculate favorite genre (most common)
    const genreCount = {};
    completedAnime.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(genre => {
                // Skip unwanted genres
                if (genre === 'Award Winning') return;
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        }
    });

    let topGenre = '—';
    let maxCount = 0;
    for (const [genre, count] of Object.entries(genreCount)) {
        if (count > maxCount) {
            maxCount = count;
            topGenre = genre;
        }
    }

    // 2. Calculate average score
    const scoredAnime = completedAnime.filter(anime => anime.score && anime.score > 0);
    let avgScore = '—';
    if (scoredAnime.length > 0) {
        const totalScore = scoredAnime.reduce((sum, anime) => sum + anime.score, 0);
        const average = totalScore / scoredAnime.length;
        avgScore = average.toFixed(1);
    }

    // 3. Calculate preferred format (most common type)
    const typeCount = {};
    completedAnime.forEach(anime => {
        const type = anime.type || 'TV';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });

    let topFormat = '—';
    let maxTypeCount = 0;
    for (const [type, count] of Object.entries(typeCount)) {
        if (count > maxTypeCount) {
            maxTypeCount = count;
            topFormat = type;
        }
    }

    return {
        topGenre: topGenre,
        avgScore: avgScore,
        topFormat: topFormat
    };
}

// Render Anime DNA to the dashboard
function renderAnimeDNA() {
    const dnaGenre = document.getElementById('dna-genre');
    const dnaScore = document.getElementById('dna-score');
    const dnaFormat = document.getElementById('dna-format');

    if (!dnaGenre || !dnaScore || !dnaFormat) return;

    const dna = calculateAnimeDNA();

    // Update with animation
    dnaGenre.textContent = dna.topGenre;
    dnaScore.textContent = dna.avgScore;
    dnaFormat.textContent = dna.topFormat;

    // Add animation classes
    [dnaGenre, dnaScore, dnaFormat].forEach(el => {
        el.classList.add('dna-updated');
        setTimeout(() => {
            el.classList.remove('dna-updated');
        }, 500);
    });
}

// Also add a function to update DNA when data changes
function updateAnimeDNA() {
    // Small delay to ensure data is updated
    setTimeout(() => {
        renderAnimeDNA();
    }, 100);
}

// Listen for data changes
if (typeof window !== 'undefined') {
    // Listen for storage events
    window.addEventListener('storage', (e) => {
        if (e.key === 'animeData') {
            updateAnimeDNA();
        }
    });

    // Listen for custom anime update event
    window.addEventListener('animeUpdate', () => {
        updateAnimeDNA();
    });

    // Also try to hook into updateAllComponents if available
    setTimeout(() => {
        if (typeof window.updateAllComponents === 'function') {
            const originalUpdateAll = window.updateAllComponents;
            window.updateAllComponents = function () {
                originalUpdateAll();
                updateAnimeDNA();
            };
        }
    }, 1000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure animeData is loaded
    setTimeout(() => {
        renderAnimeDNA();
    }, 500);
});

// =============================================
// DANGER ZONE — CLEAR ALL DATA
// =============================================

const clearBtn = document.getElementById("clearDataBtn");

clearBtn.addEventListener("click", function () {
    if (clearBtn.disabled) {
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete all data?");
    if (confirmDelete) {
        localStorage.clear();
        location.reload();
    }
});

// =============================================
// No Background scroll
// =============================================

// Prevent background scroll when modal is open
function preventBodyScroll(prevent) {
    if (prevent) {
        // Get scrollbar width to prevent layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');

        document.body.classList.add('modal-open');
        document.body.style.paddingRight = scrollbarWidth + 'px';
    } else {
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.documentElement.style.removeProperty('--scrollbar-width');
    }
}

// Attach to add anime modal
document.getElementById('addAnimeBtn')?.addEventListener('click', function () {
    document.getElementById('addAnimeModal').style.display = 'block';
    preventBodyScroll(true);
});

// Attach to import button
document.getElementById('importBtn')?.addEventListener('click', function () {
    document.getElementById('importModal').style.display = 'block';
    preventBodyScroll(true);
});

// Close modal handlers
document.querySelectorAll('.close-modal, .modal .btn-secondary').forEach(btn => {
    btn.addEventListener('click', function (e) {
        const modal = this.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
            preventBodyScroll(false);
        }
    });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.style.display = 'none';
            preventBodyScroll(false);
        }
    });
});

// Handle escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="display: block"], .modal[style*="display:block"], .modal.show');
        if (openModal) {
            openModal.style.display = 'none';
            preventBodyScroll(false);
        }
    }
});

// =============================================
// CHECK FOR USER UPDATES - FIX MISSING FUNCTION
// =============================================

async function checkForUserUpdates() {
    console.log('🔍 Checking for user updates...');

    try {
        const updates = [];
        const now = new Date();

        // Check each anime in user's list for updates
        for (const userAnime of animeData) {
            if (userAnime.userStatus === 'Watching' || userAnime.userStatus === 'Plan to Watch') {
                try {
                    // Search for the anime to get latest info
                    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(userAnime.title)}&limit=1`);
                    const data = await response.json();

                    if (data.data && data.data.length > 0) {
                        const latestInfo = data.data[0];

                        // Check for new episodes
                        if (latestInfo.episodes && userAnime.episodes) {
                            if (latestInfo.episodes > userAnime.episodes) {
                                updates.push({
                                    type: 'new_episodes',
                                    anime: userAnime,
                                    latestInfo: latestInfo,
                                    newEpisodes: latestInfo.episodes - userAnime.episodes,
                                    message: `New episodes available for ${userAnime.title}! (${latestInfo.episodes} total)`
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error checking updates for ${userAnime.title}:`, error);
                }

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Show notifications for new updates
        if (updates.length > 0) {
            updates.forEach(update => {
                if (typeof showToast === 'function') {
                    showToast(update.message, 'info', 'update-toast');
                }
            });
        }

        // Store updates for the upcoming page
        localStorage.setItem('userAnimeUpdates', JSON.stringify({
            updates: updates,
            lastChecked: now.toISOString()
        }));

        console.log(`✅ Update check complete. Found ${updates.length} updates.`);
        return updates;

    } catch (error) {
        console.error('Error checking for updates:', error);
        return [];
    }
}
// ============================================
// USER PROFILE MODAL FUNCTIONS - SAFE VERSION
// ============================================

let currentProfileUserId = null;

// Helper: Format numbers to compact (10000 -> 10k)
function formatCompactNumber(num) {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

// Helper: Safe set text content
function safeSetText(id, value, defaultValue = '—') {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value !== undefined && value !== null ? value : defaultValue;
    }
    return el;
}

// Helper: Safe set innerHTML
function safeSetHTML(id, html) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = html || '';
    }
    return el;
}

// Helper: Safe set style
function safeSetStyle(id, property, value) {
    const el = document.getElementById(id);
    if (el) {
        el.style[property] = value;
    }
    return el;
}

// Helper: Safe set src
function safeSetSrc(id, value, fallback) {
    const el = document.getElementById(id);
    if (el) {
        el.src = value || fallback || 'https://ui-avatars.com/api/?name=User&background=6366F1&color=fff';
        el.onerror = function() {
            this.src = fallback || 'https://ui-avatars.com/api/?name=User&background=6366F1&color=fff';
        };
    }
    return el;
}

async function openUserProfile(userId) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    currentProfileUserId = userId;

    const modal = document.getElementById('userProfileModal');
    if (!modal) {
        console.error('User profile modal not found');
        showToast('Profile modal not available', 'error');
        return;
    }

    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    // Show loading state - safely
    safeSetText('profileName', 'Loading...');
    safeSetHTML('profileCompletedList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading anime list...</div>');

    try {
        const response = await fetch(`http://localhost:3000/api/user/full-profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load profile');

        const profile = await response.json();
        
        // Ensure required fields exist
        profile.stats = profile.stats || {};
        profile.animeList = profile.animeList || {};
        profile.achievements = profile.achievements || [];
        profile.recentActivity = profile.recentActivity || [];

        renderUserProfile(profile);

    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load user profile', 'error');
        closeUserProfileModal();
    }
}

function renderUserProfile(profile) {
    console.log('📝 Rendering user profile...');

    // ============================================
    // HEADER INFO - SAFE
    // ============================================

    safeSetText('profileName', profile.name || profile.username || 'User');
    safeSetText('profileLevel', `Lv.${profile.level || 1}`);
    safeSetText('profileTitle', profile.levelTitle || profile.title || 'Newbie');

    // XP Fill - SAFE
    const xpFillEl = document.getElementById('profileXpFill');
    if (xpFillEl) {
        const progress = Math.min(100, Math.max(0, profile.xpProgress || 0));
        xpFillEl.style.width = `${progress}%`;
    }

    // XP Text - SAFE
    const xpTextEl = document.getElementById('profileXpText');
    if (xpTextEl) {
        const currentXP = profile.totalXP || 0;
        const nextXP = (profile.totalXP + profile.xpToNextLevel) || 0;
        xpTextEl.innerHTML = `
            <span class="xp-current" data-full="${currentXP.toLocaleString()}">${formatCompactNumber(currentXP)}</span> / 
            <span class="xp-next" data-full="${nextXP.toLocaleString()}">${formatCompactNumber(nextXP)}</span> XP
        `;
    }

    // Avatar - SAFE
    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
        const avatarUrl = profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
        avatarImg.src = avatarUrl;
        avatarImg.onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
        };
    }

    // ============================================
    // STATS WITH COMPACT FORMATTING - SAFE
    // ============================================

    function updateStatElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            const num = value || 0;
            el.setAttribute('data-full', num.toLocaleString());
            el.innerHTML = formatCompactNumber(num);
            el.setAttribute('title', num.toLocaleString());
            el.style.cursor = 'help';
        }
    }

    updateStatElement('profileTotalAnime', profile.stats?.totalAnime);
    updateStatElement('profileCompleted', profile.stats?.completed);
    updateStatElement('profileWatching', profile.stats?.watching);
    updateStatElement('profilePlanToWatch', profile.stats?.planToWatch);
    updateStatElement('profileEpisodes', profile.stats?.totalEpisodes);
    updateStatElement('profileHours', profile.stats?.totalHours);

    // ============================================
    // FRIEND BUTTON - SAFE
    // ============================================

    const friendBtn = document.getElementById('profileFriendBtn');
    if (friendBtn) {
        if (!profile.isCurrentUser) {
            friendBtn.style.display = 'block';
            if (profile.isFriend) {
                friendBtn.innerHTML = '<i class="fas fa-user-check"></i> Friends';
                friendBtn.disabled = true;
                friendBtn.style.opacity = '0.6';
                friendBtn.style.cursor = 'not-allowed';
            } else {
                friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
                friendBtn.disabled = false;
                friendBtn.style.opacity = '1';
                friendBtn.style.cursor = 'pointer';
                friendBtn.onclick = () => {
                    if (typeof sendFriendRequest === 'function') {
                        sendFriendRequest(profile.uid);
                    }
                };
            }
        } else {
            friendBtn.style.display = 'none';
        }
    }

    // ============================================
    // ANIME LISTS - SAFE
    // ============================================

    renderProfileAnimeList('completed', profile.animeList?.completed || []);
    renderProfileAnimeList('watching', profile.animeList?.watching || []);
    renderProfileAnimeList('plan', profile.animeList?.planToWatch || []);

    // ============================================
    // ACHIEVEMENTS - SAFE
    // ============================================

    const achievements = profile.achievements || [];
    const container = document.getElementById('profileAchievementsList');
    if (container) {
        if (achievements.length > 0) {
            const achievementIcons = {
                'First Completion': 'fa-check-circle',
                'TV Enthusiast': 'fa-tv',
                'Movie Lover': 'fa-film',
                'Pro Finisher': 'fa-trophy',
                'Binge Master': 'fa-video',
                'Legendary Finisher': 'fa-crown',
                'Episode Addict': 'fa-fire',
                'Power Watcher': 'fa-bolt',
                'Series Slayer': 'fa-meteor'
            };

            container.innerHTML = achievements.map(achievement => `
                <div class="profile-achievement-card">
                    <div class="profile-achievement-icon">
                        <i class="fas ${achievementIcons[achievement] || 'fa-medal'}"></i>
                    </div>
                    <div class="profile-achievement-info">
                        <div class="profile-achievement-name">${escapeHtml(achievement)}</div>
                        <div class="profile-achievement-desc">Unlocked achievement</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">No achievements unlocked yet</div>';
        }
    }

    // ============================================
    // ACTIVITY - SAFE
    // ============================================

    const activities = profile.recentActivity || [];
    const activityContainer = document.getElementById('profileActivityList');
    if (activityContainer) {
        if (activities.length > 0) {
            activityContainer.innerHTML = activities.map(activity => {
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
                                ${activity.action === 'completed' ? 'Completed' : 
                                  activity.action === 'added' ? 'Added' : 'Updated'} 
                                <strong>${escapeHtml(activity.animeTitle || 'anime')}</strong>
                            </div>
                            <div class="profile-activity-time">${formatTimeAgo(activity.timestamp)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            activityContainer.innerHTML = '<div class="empty-state">No recent activity</div>';
        }
    }

    console.log('✅ User profile rendered successfully');
}

function renderProfileAnimeList(type, animeList) {
    const containerId = `profile${type.charAt(0).toUpperCase() + type.slice(1)}List`;
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!animeList || animeList.length === 0) {
        container.innerHTML = `<div class="empty-state">No ${type} anime found</div>`;
        return;
    }

    container.innerHTML = animeList.map(anime => `
        <div class="profile-anime-card">
            <img src="${anime.cover || 'https://placehold.co/60x85/6a5acd/white?text=No+Image'}" 
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
    // This is now handled inside renderUserProfile
    // Keeping for backward compatibility
}

function renderProfileActivity(activities) {
    // This is now handled inside renderUserProfile
    // Keeping for backward compatibility
}

function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    currentProfileUserId = null;
}

// ============================================
// PROFILE TAB SWITCHING - SAFE
// ============================================

document.addEventListener('click', function(e) {
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

    const activeContentId = contentMap[tabName];
    if (activeContentId) {
        const activeContent = document.getElementById(activeContentId);
        if (activeContent) activeContent.classList.add('active');
    }
});

// ============================================
// CHECK IF REQUIRED ELEMENTS EXIST
// ============================================

function checkProfileModalElements() {
    const requiredIds = [
        'profileName',
        'profileLevel',
        'profileTitle',
        'profileXpFill',
        'profileXpText',
        'profileAvatar',
        'profileTotalAnime',
        'profileCompleted',
        'profileWatching',
        'profilePlanToWatch',
        'profileEpisodes',
        'profileHours',
        'profileFriendBtn',
        'profileCompletedList',
        'profileWatchingList',
        'profilePlanList',
        'profileAchievementsList',
        'profileActivityList'
    ];

    const missing = requiredIds.filter(id => !document.getElementById(id));
    
    if (missing.length > 0) {
        console.warn('⚠️ Missing profile modal elements:', missing);
        return false;
    }
    return true;
}

// ============================================
// UPDATE viewUserProfile
// ============================================

window.viewUserProfile = openUserProfile;

console.log('✅ User profile functions loaded with safety checks!');

// ============================================
// REAL-TIME NOTIFICATION MANAGER - UPDATED
// ============================================

class RealTimeNotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.pollingInterval = null;
        this.isDropdownOpen = false;
        this.init();
    }

    init() {
        this.loadAllNotifications();
        this.setupEventListeners();
        this.startPolling();
        this.requestPermission();
    }

    async loadAllNotifications() {
        await this.loadSystemNotifications();
        await this.loadFriendRequests();
    }

    async loadSystemNotifications() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:3000/api/user/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const systemNotifs = data.notifications || [];

                // Keep friend requests from existing notifications
                const existingFriendReqs = this.notifications.filter(n => n.type === 'friend_request');

                // Merge and remove duplicates
                const allNotifs = [...systemNotifs, ...existingFriendReqs];
                this.notifications = allNotifs.filter((n, i, arr) =>
                    arr.findIndex(x => x.id === n.id) === i
                );

                this.unreadCount = this.notifications.filter(n => !n.read).length;
                this.renderNotifications();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Load system notifications error:', error);
        }
    }

    async loadFriendRequests() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:3000/api/friends/requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const requests = await response.json();
                console.log('📬 Pending friend requests:', requests.length);

                const requestNotifications = requests.map(req => ({
                    id: req.id,
                    type: 'friend_request',
                    title: 'New Friend Request',
                    message: `${req.fromName} sent you a friend request`,
                    read: false,
                    createdAt: req.createdAt,
                    data: {
                        fromUserId: req.from,
                        fromName: req.fromName,
                        requestId: req.id
                    }
                }));

                // Keep notifications that are not friend requests
                const otherNotifications = this.notifications.filter(n => n.type !== 'friend_request');

                // Check for new requests
                const existingIds = new Set(otherNotifications.map(n => n.id));
                const newRequests = requestNotifications.filter(r => !existingIds.has(r.id));

                if (newRequests.length > 0) {
                    this.notifications = [...newRequests, ...otherNotifications];
                    this.unreadCount += newRequests.length;
                    this.renderNotifications();
                    this.updateBadge();

                    // Show toast for each new request
                    newRequests.forEach(req => {
                        this.showToast(req.message, 'friend_request');
                    });
                } else {
                    this.notifications = [...requestNotifications, ...otherNotifications];
                    this.renderNotifications();
                }
            }
        } catch (error) {
            console.error('Load friend requests error:', error);
        }
    }

    setupEventListeners() {
        const bell = document.getElementById('notificationBell');
        const dropdown = document.getElementById('notificationDropdown');

        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.isDropdownOpen = !this.isDropdownOpen;
                dropdown.style.display = this.isDropdownOpen ? 'block' : 'none';
            });
        }

        document.addEventListener('click', (e) => {
            if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
                dropdown.style.display = 'none';
                this.isDropdownOpen = false;
            }
        });

        const markAllBtn = document.getElementById('markAllReadBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.notifications.map(notif => {
            const isAccepted = notif.type === 'friend_accepted';
            const acceptedClass = isAccepted ? 'notification-accepted' : '';

            return `
                <div class="notification-item ${notif.read ? '' : 'unread'} ${acceptedClass}" data-id="${notif.id}" data-type="${notif.type}" data-data='${JSON.stringify(notif.data || {})}'>
                    <div class="notification-icon ${notif.type}">
                        <i class="fas ${this.getIcon(notif.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notif.title)}</div>
                        <div class="notification-message">${this.escapeHtml(notif.message)}</div>
                        <div class="notification-time">${this.formatTime(notif.createdAt)}</div>
                        ${notif.type === 'friend_request' && !isAccepted ? `
                            <div class="notification-actions">
                                <button class="accept" onclick="event.stopPropagation(); notificationManager.acceptFriendRequest('${notif.id}', '${notif.data?.requestId}')">Accept</button>
                                <button class="decline" onclick="event.stopPropagation(); notificationManager.declineFriendRequest('${notif.id}', '${notif.data?.requestId}')">Decline</button>
                            </div>
                        ` : ''}
                        ${isAccepted ? `
                            <div class="notification-actions">
                                <button class="view-friend" onclick="event.stopPropagation(); notificationManager.viewFriendProfile('${notif.data?.fromUserId || notif.data?.userId}')">View Friend</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                const type = item.dataset.type;
                const data = JSON.parse(item.dataset.data || '{}');
                this.handleNotificationClick(type, data);
            });
        });
    }

    getIcon(type) {
        const icons = {
            'friend_request': 'fa-user-plus',
            'friend_accepted': 'fa-user-check',
            'achievement': 'fa-trophy',
            'anime_complete': 'fa-check-circle'
        };
        return icons[type] || 'fa-bell';
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Just now';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

        return date.toLocaleDateString();
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (this.unreadCount > 0) {
            badge.style.display = 'flex';
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            const bell = document.getElementById('notificationBell');
            if (bell) {
                bell.classList.add('has-notifications');
                setTimeout(() => bell.classList.remove('has-notifications'), 500);
            }
        } else {
            badge.style.display = 'none';
        }
    }

    async markAllAsRead() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            await fetch('http://localhost:3000/api/user/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ markAll: true })
            });

            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.renderNotifications();
            this.updateBadge();
        } catch (error) {
            console.error('Mark all read error:', error);
        }
    }

    async acceptFriendRequest(notificationId, requestId) {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Show loading state
        const acceptBtn = document.querySelector(`.notification-item[data-id="${notificationId}"] .accept`);
        if (acceptBtn) {
            acceptBtn.textContent = 'Accepting...';
            acceptBtn.disabled = true;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/friends/accept/${requestId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Get the friend's name
                const notification = this.notifications.find(n => n.id === notificationId);
                const friendName = notification?.data?.fromName || 'your new friend';

                // Replace with accepted notification
                const updatedNotification = {
                    id: notificationId + '_accepted',
                    type: 'friend_accepted',
                    title: '✓ Friend Request Accepted',
                    message: `You are now friends with ${friendName}! 🎉`,
                    read: false,
                    createdAt: new Date().toISOString(),
                    data: {
                        ...notification?.data,
                        status: 'accepted'
                    }
                };

                // Replace the old notification
                const index = this.notifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    this.notifications[index] = updatedNotification;
                }

                this.showToast(`You are now friends with ${friendName}! 🎉`, 'friend_accepted');
                this.renderNotifications();
                this.updateBadge();

                // Refresh friends list
                if (typeof loadFriends === 'function') {
                    await loadFriends();
                }

                // Close dropdown after 2 seconds
                setTimeout(() => {
                    const dropdown = document.getElementById('notificationDropdown');
                    if (dropdown) dropdown.style.display = 'none';
                    this.isDropdownOpen = false;
                }, 2000);

                console.log('✅ Friend request accepted!');
            } else {
                this.showToast('Failed to accept friend request', 'error');
                if (acceptBtn) {
                    acceptBtn.textContent = 'Accept';
                    acceptBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Accept error:', error);
            this.showToast('Error accepting friend request', 'error');
            if (acceptBtn) {
                acceptBtn.textContent = 'Accept';
                acceptBtn.disabled = false;
            }
        }
    }

    async declineFriendRequest(notificationId, requestId) {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const declineBtn = document.querySelector(`.notification-item[data-id="${notificationId}"] .decline`);
        if (declineBtn) {
            declineBtn.textContent = 'Declining...';
            declineBtn.disabled = true;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/friends/decline/${requestId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Remove the notification
                this.notifications = this.notifications.filter(n => n.id !== notificationId);
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.showToast('Friend request declined', 'info');
                this.renderNotifications();
                this.updateBadge();

                setTimeout(() => {
                    const dropdown = document.getElementById('notificationDropdown');
                    if (dropdown) dropdown.style.display = 'none';
                    this.isDropdownOpen = false;
                }, 1500);
            } else {
                this.showToast('Failed to decline friend request', 'error');
                if (declineBtn) {
                    declineBtn.textContent = 'Decline';
                    declineBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Decline error:', error);
            this.showToast('Error declining friend request', 'error');
            if (declineBtn) {
                declineBtn.textContent = 'Decline';
                declineBtn.disabled = false;
            }
        }
    }

    viewFriendProfile(userId) {
        if (userId && typeof openUserProfile === 'function') {
            openUserProfile(userId);
        }
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) dropdown.style.display = 'none';
        this.isDropdownOpen = false;
    }

    handleNotificationClick(type, data) {
        switch (type) {
            case 'anime_complete':
                if (data?.animeId) {
                    window.location.href = `/anime/${data.animeId}`;
                }
                break;
            case 'friend_accepted':
                this.showToast(`${data?.userName || 'Someone'} is now your friend! 🎉`, 'friend_accepted');
                if (typeof loadFriends === 'function') loadFriends();
                break;
        }

        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) dropdown.style.display = 'none';
        this.isDropdownOpen = false;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            friend_request: 'fa-user-plus',
            friend_accepted: 'fa-user-check',
            achievement: 'fa-trophy',
            anime_complete: 'fa-check-circle',
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const titles = {
            friend_request: 'Friend Request',
            friend_accepted: 'Friend Added',
            achievement: 'Achievement Unlocked!',
            anime_complete: 'Anime Completed',
            success: 'Success',
            error: 'Error',
            info: 'Notification'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type] || 'fa-bell'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type] || 'Notification'}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        });

        toast.addEventListener('click', () => {
            if (type === 'friend_request') {
                document.getElementById('notificationBell').click();
            }
            toast.remove();
        });
    }

    startPolling() {
        this.pollingInterval = setInterval(() => {
            this.loadFriendRequests();
            this.loadSystemNotifications();
        }, 10000);
    }

    requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    async refresh() {
        await this.loadAllNotifications();
        console.log('✅ Notifications refreshed');
    }
}

// Initialize
let notificationManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new RealTimeNotificationManager();
});

window.addEventListener('focus', () => {
    if (notificationManager) {
        notificationManager.refresh();
    }
});

// ============================================
// FLOATING ADD ANIME BUTTON - GLOBAL FOR ALL PAGES
// ============================================

(function initFloatingAddButton() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFloatingButton);
    } else {
        setupFloatingButton();
    }

    function setupFloatingButton() {
        // Get the floating button element
        const floatBtn = document.getElementById('floatingAddAnimeBtn');
        if (!floatBtn) return;

        // Remove any existing listeners to avoid duplicates
        const newFloatBtn = floatBtn.cloneNode(true);
        floatBtn.parentNode?.replaceChild(newFloatBtn, floatBtn);

        // Add click handler
        newFloatBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openAddAnimeModal();
        });

        console.log('✅ Floating Add Anime button initialized');
    }

    // Global function to open the add anime modal (can be called from anywhere)
    window.openAddAnimeModal = function () {
        const addModal = document.getElementById('addAnimeModal');
        const originalAddBtn = document.getElementById('addAnimeBtn');

        // Reset editing state
        if (typeof window.isEditing !== 'undefined') {
            window.isEditing = false;
            window.currentEditId = null;
        }

        // Reset form fields
        const animeForm = document.getElementById('addAnimeForm');
        if (animeForm) animeForm.reset();

        // Reset submit button text and hide delete button
        const submitBtn = document.getElementById('submitBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (submitBtn) submitBtn.textContent = 'Add Anime';
        if (deleteBtn) deleteBtn.style.display = 'none';

        // Clear search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }

        // Clear anime ID
        const animeIdField = document.getElementById('animeId');
        if (animeIdField) animeIdField.value = '';

        // Reset cover and genres
        const coverInput = document.getElementById('animeCover');
        const genresInput = document.getElementById('animeGenres');
        if (coverInput) coverInput.value = '';
        if (genresInput) genresInput.value = '';

        // Reset progress to 0
        const progressField = document.getElementById('animeProgress');
        if (progressField) progressField.value = 0;

        // Set default type duration
        const typeSelect = document.getElementById('animeType');
        const durationField = document.getElementById('animeDuration');
        if (typeSelect && durationField) {
            if (typeSelect.value === 'Movie') {
                durationField.value = '120';
                durationField.readOnly = false;
            } else {
                durationField.value = '20';
                durationField.readOnly = true;
            }
        }

        // Show modal
        if (addModal) {
            addModal.style.display = 'flex';

            // Prevent background scroll
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';

            // Focus on title input for better UX
            setTimeout(() => {
                const titleInput = document.getElementById('animeTitle');
                if (titleInput) titleInput.focus();
            }, 100);
        } else if (originalAddBtn && typeof originalAddBtn.click === 'function') {
            // Fallback: click the original button
            originalAddBtn.click();
        } else {
            console.warn('Could not open Add Anime modal');
            showToast('Add Anime feature unavailable', 'error');
        }

        // Haptic feedback for mobile
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    };

    // Helper function for toast if needed
    function showToast(message, type) {
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span>${message}</span>`;
            toastContainer.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    // Ensure modal close restores body scroll (safety)
    const modal = document.getElementById('addAnimeModal');
    if (modal) {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'style') {
                    if (modal.style.display === 'none') {
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.position = '';
                        document.body.style.width = '';
                        document.body.style.height = '';
                    }
                }
            });
        });
        observer.observe(modal, { attributes: true });
    }
})();