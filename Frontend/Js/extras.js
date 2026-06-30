// =============================================
// UPDATE 1.0.0 - COMPLETE EXTRAS.JS
// =============================================

// Make sure showToast is available
if (typeof showToast === 'undefined') {
    window.showToast = function (message, type = 'info') {
        console.log(`[Toast] ${type}: ${message}`);
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

// --- Favorite Genres Over Time Chart ---
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
// GREETINGS
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
    const today = new Date().toDateString();
    let streak = parseInt(localStorage.getItem("streak") || "0");
    const lastActive = localStorage.getItem("lastActive");

    if (lastActive !== today) {
        if (lastActive === new Date(Date.now() - 86400000).toDateString()) {
            streak += 1;
        } else {
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

        streakInfo.textContent = ` ${streak}-day streak`;

        dailyQuote.textContent =
            quotes[Math.floor(Math.random() * quotes.length)];
    }

    updateGreeting();
    setInterval(updateGreeting, 60 * 1000);
})();

// profile Drop Down Menu toggle
const profileToggle = document.getElementById("profileMenuToggle");
const profileDropdown = document.querySelector(".profile-dropdown");

if (profileToggle && profileDropdown) {
    profileToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle("open");
    });

    document.addEventListener("click", () => {
        profileDropdown.classList.remove("open");
    });
}

// search Drop Down Menu toggle
const searchToggle = document.getElementById("searchToggle");
const searchDropdown = document.querySelector(".search-dropdown");
const searchInput = document.getElementById("dashboardSearch");

if (searchToggle && searchDropdown) {
    searchToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        searchDropdown.classList.toggle("open");
        if (searchInput) searchInput.focus();
    });

    searchDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    document.addEventListener("click", () => {
        searchDropdown.classList.remove("open");
    });
}

// =============================================
// ANIME DNA - FIXED VERSION
// =============================================

function getAnimeDataSafe() {
    if (typeof window.animeData !== 'undefined' && window.animeData) {
        return window.animeData;
    }
    const stored = localStorage.getItem('animeData');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

function calculateAnimeDNA() {
    const animeList = getAnimeDataSafe();
    const completedAnime = animeList.filter(anime => anime.userStatus === 'Completed');

    if (completedAnime.length === 0) {
        return {
            topGenre: '—',
            avgScore: '—',
            topFormat: '—'
        };
    }

    const genreCount = {};
    completedAnime.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(genre => {
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

    const scoredAnime = completedAnime.filter(anime => anime.score && anime.score > 0);
    let avgScore = '—';
    if (scoredAnime.length > 0) {
        const totalScore = scoredAnime.reduce((sum, anime) => sum + anime.score, 0);
        avgScore = (totalScore / scoredAnime.length).toFixed(1);
    }

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

function renderAnimeDNA() {
    const dnaGenre = document.getElementById('dna-genre');
    const dnaScore = document.getElementById('dna-score');
    const dnaFormat = document.getElementById('dna-format');

    if (!dnaGenre || !dnaScore || !dnaFormat) return;

    const dna = calculateAnimeDNA();

    dnaGenre.textContent = dna.topGenre;
    dnaScore.textContent = dna.avgScore;
    dnaFormat.textContent = dna.topFormat;

    [dnaGenre, dnaScore, dnaFormat].forEach(el => {
        el.classList.add('dna-updated');
        setTimeout(() => {
            el.classList.remove('dna-updated');
        }, 500);
    });
}

function updateAnimeDNA() {
    setTimeout(() => {
        renderAnimeDNA();
    }, 100);
}

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === 'animeData') {
            updateAnimeDNA();
        }
    });

    window.addEventListener('animeUpdate', () => {
        updateAnimeDNA();
    });

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

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderAnimeDNA();
    }, 500);
});

// =============================================
// DANGER ZONE — CLEAR ALL DATA
// =============================================

const clearBtn = document.getElementById("clearDataBtn");
if (clearBtn) {
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
}

// =============================================
// No Background scroll
// =============================================

function preventBodyScroll(prevent) {
    if (prevent) {
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

document.getElementById('addAnimeBtn')?.addEventListener('click', function () {
    document.getElementById('addAnimeModal').style.display = 'block';
    preventBodyScroll(true);
});

document.getElementById('importBtn')?.addEventListener('click', function () {
    document.getElementById('importModal').style.display = 'block';
    preventBodyScroll(true);
});

document.querySelectorAll('.close-modal, .modal .btn-secondary').forEach(btn => {
    btn.addEventListener('click', function (e) {
        const modal = this.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
            preventBodyScroll(false);
        }
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.style.display = 'none';
            preventBodyScroll(false);
        }
    });
});

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
// CHECK FOR USER UPDATES
// =============================================

async function checkForUserUpdates() {
    console.log('🔍 Checking for user updates...');

    try {
        const updates = [];
        const now = new Date();
        const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');

        for (const userAnime of animeData) {
            if (userAnime.userStatus === 'Watching' || userAnime.userStatus === 'Plan to Watch') {
                try {
                    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(userAnime.title)}&limit=1`);
                    const data = await response.json();

                    if (data.data && data.data.length > 0) {
                        const latestInfo = data.data[0];

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

                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        if (updates.length > 0) {
            updates.forEach(update => {
                if (typeof showToast === 'function') {
                    showToast(update.message, 'info', 'update-toast');
                }
            });
        }

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
// USER PROFILE MODAL - COMPLETE FIXED VERSION
// ============================================

// Use unique variable name to avoid conflicts
let _profileModalUserId = null;

// Helper: Format numbers to compact
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

// ============================================
// OPEN USER PROFILE - WITH FALLBACKS
// ============================================

async function openUserProfile(userId) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    _profileModalUserId = userId;

    const modal = document.getElementById('userProfileModal');
    if (!modal) {
        console.error('User profile modal not found');
        showToast('Profile modal not available', 'error');
        return;
    }

    // Show modal properly
    modal.removeAttribute('hidden');
    modal.classList.add('active');
    modal.classList.add('show');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '10000';

    // Lock body scroll
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';

    // Show loading state
    safeSetText('profileName', 'Loading...');
    safeSetHTML('profileCompletedList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading anime list...</div>');
    safeSetHTML('profileWatchingList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>');
    safeSetHTML('profilePlanList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>');
    safeSetHTML('profileAchievementsList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading achievements...</div>');
    safeSetHTML('profileActivityList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading activity...</div>');

    try {
        // Try primary API endpoint
        const response = await fetch(`http://localhost:3000/api/user/full-profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            // If 404, try fallback endpoint
            if (response.status === 404) {
                console.warn('Full profile endpoint not found, trying fallback...');
                const fallbackResponse = await fetch(`http://localhost:3000/api/user/profile/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (fallbackResponse.ok) {
                    const profile = await fallbackResponse.json();
                    renderUserProfileWithFallback(profile);
                    return;
                }
                
                // If fallback also fails, try friends list
                console.warn('Profile endpoints unavailable, using friends fallback...');
                await renderFriendsFallback(userId);
                return;
            }
            throw new Error(`Failed to load profile (${response.status})`);
        }

        const profile = await response.json();
        profile.stats = profile.stats || {};
        profile.animeList = profile.animeList || {};
        profile.achievements = profile.achievements || [];
        profile.recentActivity = profile.recentActivity || [];

        renderUserProfile(profile);

    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load user profile, showing friends instead', 'info');
        await renderFriendsFallback(userId);
    }
}

// ============================================
// RENDER USER PROFILE - MAIN
// ============================================

function renderUserProfile(profile) {
    console.log('📝 Rendering user profile...');

    // Header Info
    safeSetText('profileName', profile.name || profile.username || 'User');
    safeSetText('profileLevel', `Lv.${profile.level || 1}`);
    safeSetText('profileTitle', profile.levelTitle || profile.title || 'Newbie');

    // XP Fill
    const xpFillEl = document.getElementById('profileXpFill');
    if (xpFillEl) {
        const progress = Math.min(100, Math.max(0, profile.xpProgress || 0));
        xpFillEl.style.width = `${progress}%`;
    }

    // XP Text
    const xpTextEl = document.getElementById('profileXpText');
    if (xpTextEl) {
        const currentXP = profile.totalXP || 0;
        const nextXP = (profile.totalXP + profile.xpToNextLevel) || 1000;
        xpTextEl.innerHTML = `
            <span class="xp-current">${formatCompactNumber(currentXP)}</span> / 
            <span class="xp-next">${formatCompactNumber(nextXP)}</span> XP
        `;
    }

    // Avatar
    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
        const avatarUrl = profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
        avatarImg.src = avatarUrl;
        avatarImg.onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
        };
    }

    // Stats
    function updateStatElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            const num = value || 0;
            el.innerHTML = formatCompactNumber(num);
            el.setAttribute('title', num.toLocaleString());
        }
    }

    updateStatElement('profileTotalAnime', profile.stats?.totalAnime);
    updateStatElement('profileCompleted', profile.stats?.completed);
    updateStatElement('profileWatching', profile.stats?.watching);
    updateStatElement('profilePlanToWatch', profile.stats?.planToWatch);
    updateStatElement('profileEpisodes', profile.stats?.totalEpisodes);
    updateStatElement('profileHours', profile.stats?.totalHours);

    // Friend Button
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

    // Anime Lists
    renderProfileAnimeList('completed', profile.animeList?.completed || []);
    renderProfileAnimeList('watching', profile.animeList?.watching || []);
    renderProfileAnimeList('plan', profile.animeList?.planToWatch || []);

    // Achievements
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

    // Activity
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

// ============================================
// RENDER PROFILE WITH FALLBACK DATA
// ============================================

function renderUserProfileWithFallback(profile) {
    console.log('📝 Rendering user profile with fallback data...');

    safeSetText('profileName', profile.name || profile.username || 'User');
    safeSetText('profileLevel', `Lv.${profile.level || 1}`);
    safeSetText('profileTitle', profile.levelTitle || profile.title || 'Newbie');

    const xpFillEl = document.getElementById('profileXpFill');
    if (xpFillEl) {
        const progress = Math.min(100, Math.max(0, profile.xpProgress || 0));
        xpFillEl.style.width = `${progress}%`;
    }

    const xpTextEl = document.getElementById('profileXpText');
    if (xpTextEl) {
        const currentXP = profile.totalXP || 0;
        const nextXP = (profile.totalXP + profile.xpToNextLevel) || 1000;
        xpTextEl.innerHTML = `
            <span class="xp-current">${formatCompactNumber(currentXP)}</span> / 
            <span class="xp-next">${formatCompactNumber(nextXP)}</span> XP
        `;
    }

    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
        const avatarUrl = profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
        avatarImg.src = avatarUrl;
        avatarImg.onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
        };
    }

    function updateStatElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            const num = value || 0;
            el.innerHTML = formatCompactNumber(num);
            el.setAttribute('title', num.toLocaleString());
        }
    }

    updateStatElement('profileTotalAnime', profile.stats?.totalAnime || 0);
    updateStatElement('profileCompleted', profile.stats?.completed || 0);
    updateStatElement('profileWatching', profile.stats?.watching || 0);
    updateStatElement('profilePlanToWatch', profile.stats?.planToWatch || 0);
    updateStatElement('profileEpisodes', profile.stats?.totalEpisodes || 0);
    updateStatElement('profileHours', profile.stats?.totalHours || 0);

    const friendBtn = document.getElementById('profileFriendBtn');
    if (friendBtn) {
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

    renderProfileAnimeList('completed', profile.animeList?.completed || []);
    renderProfileAnimeList('watching', profile.animeList?.watching || []);
    renderProfileAnimeList('plan', profile.animeList?.planToWatch || []);

    const achievements = profile.achievements || [];
    const container = document.getElementById('profileAchievementsList');
    if (container) {
        if (achievements.length > 0) {
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
        } else {
            container.innerHTML = '<div class="empty-state">No achievements unlocked yet</div>';
        }
    }

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

    console.log('✅ User profile rendered with fallback');
}

// ============================================
// FRIENDS FALLBACK
// ============================================

async function renderFriendsFallback(userId) {
    console.log('📝 Using friends fallback for user:', userId);
    
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    let userData = null;
    let friendsList = [];

    const token = localStorage.getItem('authToken');
    
    try {
        const friendsResponse = await fetch('http://localhost:3000/api/friends/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (friendsResponse.ok) {
            friendsList = await friendsResponse.json();
        }
    } catch (e) {
        console.warn('Could not fetch friends list:', e);
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    if (userId === currentUser.uid || userId === 'current') {
        userData = {
            name: userProfile.name || currentUser.username || 'You',
            avatar: userProfile.avatar || currentUser.avatar,
            level: currentUser.level || 1,
            title: currentUser.title || 'Newbie',
            totalXP: currentUser.totalXP || 0,
            stats: {
                totalAnime: 0,
                completed: 0,
                watching: 0,
                planToWatch: 0,
                totalEpisodes: 0,
                totalHours: 0
            },
            isCurrentUser: true,
            achievements: ['🌟 Profile Loaded'],
            recentActivity: [],
            animeList: {
                completed: [],
                watching: [],
                planToWatch: []
            }
        };
    } else {
        const foundFriend = friendsList.find(f => f.uid === userId);
        
        if (foundFriend) {
            userData = {
                name: foundFriend.name || foundFriend.username || 'Friend',
                avatar: foundFriend.avatar,
                level: foundFriend.level || 1,
                title: foundFriend.title || 'Newbie',
                totalXP: foundFriend.totalXP || 0,
                stats: {
                    totalAnime: foundFriend.totalAnime || 0,
                    completed: 0,
                    watching: 0,
                    planToWatch: 0,
                    totalEpisodes: 0,
                    totalHours: 0
                },
                isCurrentUser: false,
                isFriend: true,
                achievements: ['👥 Friend'],
                recentActivity: [],
                animeList: {
                    completed: [],
                    watching: [],
                    planToWatch: []
                }
            };
        } else {
            userData = {
                name: 'Unknown User',
                avatar: `https://ui-avatars.com/api/?name=Unknown&background=6366F1&color=fff`,
                level: 1,
                title: 'Newbie',
                totalXP: 0,
                stats: {
                    totalAnime: 0,
                    completed: 0,
                    watching: 0,
                    planToWatch: 0,
                    totalEpisodes: 0,
                    totalHours: 0
                },
                isCurrentUser: false,
                isFriend: false,
                achievements: ['🔍 User Not Found'],
                recentActivity: [],
                animeList: {
                    completed: [],
                    watching: [],
                    planToWatch: []
                }
            };
        }
    }

    if (friendsList.length > 0) {
        const friendNames = friendsList.slice(0, 3).map(f => f.name || f.username || 'Friend');
        if (friendNames.length > 0) {
            userData.achievements = [
                ...userData.achievements,
                `👥 Friends: ${friendNames.join(', ')}${friendsList.length > 3 ? ` +${friendsList.length - 3} more` : ''}`
            ];
        }
    }

    renderUserProfileWithFallback(userData);
    showToast('Profile loaded with friends fallback', 'info');
}

// ============================================
// RENDER PROFILE ANIME LIST
// ============================================

function renderProfileAnimeList(type, animeList) {
    const containerId = `profile${type.charAt(0).toUpperCase() + type.slice(1)}List`;
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!animeList || animeList.length === 0) {
        container.innerHTML = `<div class="empty-state">No ${type} anime found</div>`;
        return;
    }

    container.innerHTML = animeList.slice(0, 10).map(anime => `
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

// ============================================
// CLOSE USER PROFILE MODAL
// ============================================

function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        modal.setAttribute('hidden', '');
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
    }
    _profileModalUserId = null;
}

// ============================================
// PROFILE TAB SWITCHING
// ============================================

document.addEventListener('click', function(e) {
    const tab = e.target.closest('.profile-tab');
    if (!tab) return;

    const tabName = tab.dataset.tab;
    const container = tab.closest('.profile-modal-body');
    if (!container) return;

    container.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

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
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.openUserProfile = openUserProfile;
window.closeUserProfileModal = closeUserProfileModal;
window.renderUserProfile = renderUserProfile;
window.renderUserProfileWithFallback = renderUserProfileWithFallback;
window.renderFriendsFallback = renderFriendsFallback;
window.renderProfileAnimeList = renderProfileAnimeList;
window.viewUserProfile = openUserProfile;

console.log('✅ User profile functions loaded with fallbacks!');
console.log('💡 Type "window.openUserProfile(userId)" to open a profile');

// ============================================
// REAL-TIME NOTIFICATION MANAGER
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

                const existingFriendReqs = this.notifications.filter(n => n.type === 'friend_request');
                const allNotifs = [...systemNotifs, ...existingFriendReqs];
                this.notifications = allNotifs.filter((n, i, arr) =>
                    arr.findIndex(x => x.id === n.id) === i
                );

                this.unreadCount = this.notifications.filter(n => !n.read).length;
                
                if (typeof this.renderNotifications === 'function') {
                    this.renderNotifications();
                }
                if (typeof this.updateBadge === 'function') {
                    this.updateBadge();
                }
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

                const otherNotifications = this.notifications.filter(n => n.type !== 'friend_request');
                const existingIds = new Set(otherNotifications.map(n => n.id));
                const newRequests = requestNotifications.filter(r => !existingIds.has(r.id));

                if (newRequests.length > 0) {
                    this.notifications = [...newRequests, ...otherNotifications];
                    this.unreadCount += newRequests.length;
                    
                    if (typeof this.renderNotifications === 'function') {
                        this.renderNotifications();
                    }
                    if (typeof this.updateBadge === 'function') {
                        this.updateBadge();
                    }

                    newRequests.forEach(req => {
                        if (typeof this.showToast === 'function') {
                            this.showToast(req.message, 'friend_request');
                        }
                    });
                } else {
                    this.notifications = [...requestNotifications, ...otherNotifications];
                    if (typeof this.renderNotifications === 'function') {
                        this.renderNotifications();
                    }
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
                if (dropdown) dropdown.style.display = this.isDropdownOpen ? 'block' : 'none';
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
            if (badge) {
                badge.style.display = 'flex';
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            }
            const bell = document.getElementById('notificationBell');
            if (bell) {
                bell.classList.add('has-notifications');
                setTimeout(() => bell.classList.remove('has-notifications'), 500);
            }
        } else {
            if (badge) badge.style.display = 'none';
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
            if (typeof this.renderNotifications === 'function') {
                this.renderNotifications();
            }
            if (typeof this.updateBadge === 'function') {
                this.updateBadge();
            }
        } catch (error) {
            console.error('Mark all read error:', error);
        }
    }

    async acceptFriendRequest(notificationId, requestId) {
        const token = localStorage.getItem('authToken');
        if (!token) return;

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
                const notification = this.notifications.find(n => n.id === notificationId);
                const friendName = notification?.data?.fromName || 'your new friend';

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

                const index = this.notifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    this.notifications[index] = updatedNotification;
                }

                if (typeof this.showToast === 'function') {
                    this.showToast(`You are now friends with ${friendName}! 🎉`, 'friend_accepted');
                }
                if (typeof this.renderNotifications === 'function') {
                    this.renderNotifications();
                }
                if (typeof this.updateBadge === 'function') {
                    this.updateBadge();
                }

                if (typeof loadFriends === 'function') {
                    await loadFriends();
                }

                setTimeout(() => {
                    const dropdown = document.getElementById('notificationDropdown');
                    if (dropdown) dropdown.style.display = 'none';
                    this.isDropdownOpen = false;
                }, 2000);

                console.log('✅ Friend request accepted!');
            } else {
                if (typeof this.showToast === 'function') {
                    this.showToast('Failed to accept friend request', 'error');
                }
                if (acceptBtn) {
                    acceptBtn.textContent = 'Accept';
                    acceptBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Accept error:', error);
            if (typeof this.showToast === 'function') {
                this.showToast('Error accepting friend request', 'error');
            }
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
                this.notifications = this.notifications.filter(n => n.id !== notificationId);
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                if (typeof this.showToast === 'function') {
                    this.showToast('Friend request declined', 'info');
                }
                if (typeof this.renderNotifications === 'function') {
                    this.renderNotifications();
                }
                if (typeof this.updateBadge === 'function') {
                    this.updateBadge();
                }

                setTimeout(() => {
                    const dropdown = document.getElementById('notificationDropdown');
                    if (dropdown) dropdown.style.display = 'none';
                    this.isDropdownOpen = false;
                }, 1500);
            } else {
                if (typeof this.showToast === 'function') {
                    this.showToast('Failed to decline friend request', 'error');
                }
                if (declineBtn) {
                    declineBtn.textContent = 'Decline';
                    declineBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Decline error:', error);
            if (typeof this.showToast === 'function') {
                this.showToast('Error declining friend request', 'error');
            }
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
                if (typeof this.showToast === 'function') {
                    this.showToast(`${data?.userName || 'Someone'} is now your friend! 🎉`, 'friend_accepted');
                }
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

// Initialize notification manager
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
// FLOATING ADD ANIME BUTTON
// ============================================

(function initFloatingAddButton() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFloatingButton);
    } else {
        setupFloatingButton();
    }

    function setupFloatingButton() {
        const floatBtn = document.getElementById('floatingAddAnimeBtn');
        if (!floatBtn) return;

        const newFloatBtn = floatBtn.cloneNode(true);
        floatBtn.parentNode?.replaceChild(newFloatBtn, floatBtn);

        newFloatBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openAddAnimeModal();
        });

        console.log('✅ Floating Add Anime button initialized');
    }

    window.openAddAnimeModal = function () {
        const addModal = document.getElementById('addAnimeModal');
        const originalAddBtn = document.getElementById('addAnimeBtn');

        if (typeof window.isEditing !== 'undefined') {
            window.isEditing = false;
            window.currentEditId = null;
        }

        const animeForm = document.getElementById('addAnimeForm');
        if (animeForm) animeForm.reset();

        const submitBtn = document.getElementById('submitBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (submitBtn) submitBtn.textContent = 'Add Anime';
        if (deleteBtn) deleteBtn.style.display = 'none';

        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }

        const animeIdField = document.getElementById('animeId');
        if (animeIdField) animeIdField.value = '';

        const coverInput = document.getElementById('animeCover');
        const genresInput = document.getElementById('animeGenres');
        if (coverInput) coverInput.value = '';
        if (genresInput) genresInput.value = '';

        const progressField = document.getElementById('animeProgress');
        if (progressField) progressField.value = 0;

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

        if (addModal) {
            addModal.style.display = 'flex';
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';

            setTimeout(() => {
                const titleInput = document.getElementById('animeTitle');
                if (titleInput) titleInput.focus();
            }, 100);
        } else if (originalAddBtn && typeof originalAddBtn.click === 'function') {
            originalAddBtn.click();
        } else {
            console.warn('Could not open Add Anime modal');
            if (typeof showToast === 'function') {
                showToast('Add Anime feature unavailable', 'error');
            }
        }

        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    };

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

// ============================================
// SETTINGS TAB SWITCHING
// ============================================

(function initSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const contents = document.querySelectorAll('.settings-tab-content');

    if (!tabs.length || !contents.length) return;

    const savedTab = localStorage.getItem('settingsActiveTab') || 'profile';

    tabs.forEach(tab => {
        const tabName = tab.dataset.tab;
        if (tabName === savedTab) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    contents.forEach(content => {
        const contentId = content.id.replace('tab-', '');
        if (contentId === savedTab) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            contents.forEach(content => {
                const contentId = content.id.replace('tab-', '');
                if (contentId === tabName) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            localStorage.setItem('settingsActiveTab', tabName);
        });
    });

    console.log('✅ Settings tabs initialized');
})();

// ============================================
// ESCAPE HTML HELPER - GLOBAL
// ============================================

if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}

// ============================================
// FORMAT TIME AGO - GLOBAL
// ============================================

if (typeof formatTimeAgo === 'undefined') {
    window.formatTimeAgo = function(dateString) {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return date.toLocaleDateString();
    };
}

console.log('✅ extras.js loaded successfully!');
console.log('✅ User profile modal has fallbacks for 404 errors');
console.log('💡 To open profile: openUserProfile(userId)');