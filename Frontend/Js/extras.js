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
// DASHBOARD FEATURE — ANIME DNA
// =============================================

function calculateAnimeDNA() {
    if (!animeData || animeData.length === 0) {
        return {
            genre: 'N/A',
            avgScore: 'N/A',
            format: 'N/A'
        };
    }

    const genreCount = {};
    let scoreSum = 0;
    let scoreCount = 0;
    let movieCount = 0;

    animeData.forEach(anime => {
        if (Array.isArray(anime.genres)) {
            anime.genres.forEach(g => {
                genreCount[g] = (genreCount[g] || 0) + 1;
            });
        }

        if (anime.score) {
            scoreSum += anime.score;
            scoreCount++;
        }

        if (anime.type === 'Movie') movieCount++;
    });

    const favoriteGenre =
        Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
        genre: favoriteGenre,
        avgScore: scoreCount ? (scoreSum / scoreCount).toFixed(1) : 'N/A',
        format: movieCount > animeData.length / 2 ? 'Movies' : 'Series'
    };
}

function renderAnimeDNA() {
    const dna = calculateAnimeDNA();

    const genreEl = document.getElementById('dna-genre');
    const scoreEl = document.getElementById('dna-score');
    const formatEl = document.getElementById('dna-format');

    if (!genreEl || !scoreEl || !formatEl) return;

    genreEl.textContent = dna.genre;
    scoreEl.textContent = dna.avgScore;
    formatEl.textContent = dna.format;
}
document.addEventListener('DOMContentLoaded', renderAnimeDNA);

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

// =============================================
// COMPLETE ANIPULSE SYSTEM - LEVELS, XP, NOTIFICATIONS
// =============================================

// =============================================
// LEVEL SYSTEM 
// =============================================

// Level definitions
const LEVELS = [
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
];

// =============================================
// ANTI-SPAM & ANTI-EXPLOIT XP SYSTEM
// =============================================

// Track all XP grants to prevent abuse
let xpTransactionLog = JSON.parse(localStorage.getItem('xpTransactionLog')) || [];
let xpDailyLimit = JSON.parse(localStorage.getItem('xpDailyLimit')) || { date: new Date().toDateString(), total: 0 };

// Track pending XP (XP that couldn't be awarded due to daily limit)
let pendingXP = JSON.parse(localStorage.getItem('pendingXP')) || {
    amount: 0,
    source: [],
    lastUpdated: new Date().toISOString()
};

// XP Limits Configuration
const XP_LIMITS = {
    DAILY_MAX: 500,           // Max XP per day
    PER_ANIME_MAX: 200,       // Max XP per single anime
    MAX_EPISODES_PER_DAY: 50, // Max new episodes across all anime per day
    MAX_ANIME_PER_DAY: 20,    // Max anime added per day
    HOURLY_MAX: 150,          // Max XP per hour
    WARNING_THRESHOLD: 400,   // Show warning at 80% of daily limit
    MIN_TIME_BETWEEN_UPDATES: 60000, // 1 minute between same anime updates
};

// Track daily anime additions
let dailyAnimeCount = JSON.parse(localStorage.getItem('dailyAnimeCount')) || { date: new Date().toDateString(), count: 0 };

// =============================================
// CORE XP CALCULATION FUNCTIONS
// =============================================

function calculateTotalXPSafe() {
    let xp = 0;
    try {
        const animeList = animeData || [];
        animeList.forEach(anime => {
            if (anime.userStatus === 'Completed') {
                xp += 10;
                const episodes = anime.episodes || 0;
                xp += Math.floor(episodes / 2);
                if (anime.score >= 9) xp += 10;
                else if (anime.score >= 8) xp += 5;
                if (anime.type === 'Movie') xp += 5;
            }
            if (anime.userStatus === 'Watching') {
                xp += Math.floor((anime.progress || 0) / 5);
            }
            if (anime.score && anime.score > 0) xp += 2;
        });
        const totalHours = parseFloat(calculateTotalHours()) || 0;
        xp += Math.floor(totalHours * 2);
    } catch (e) {
        console.warn('XP calculation error:', e);
    }
    return xp;
}

function getCurrentLevelSafe(xp) {
    try {
        let currentLevel = LEVELS[0];
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].xpRequired) {
                currentLevel = LEVELS[i];
                break;
            }
        }
        return currentLevel;
    } catch (e) {
        return LEVELS[0];
    }
}

function getNextLevelSafe(currentXp) {
    try {
        for (let i = 0; i < LEVELS.length; i++) {
            if (currentXp < LEVELS[i].xpRequired) {
                return LEVELS[i];
            }
        }
    } catch (e) { }
    return null;
}

// =============================================
// ACTION DETECTION FOR XP CALCULATION
// =============================================

function detectAnimeAction(oldAnime, newAnime) {
    if (!oldAnime) {
        if (newAnime.userStatus === 'Completed') return 'add_completed';
        if (newAnime.userStatus === 'Watching') return 'add_watching';
        if (newAnime.userStatus === 'Plan to Watch') return 'add_plan';
        return 'add_plan';
    }
    if (oldAnime.userStatus !== newAnime.userStatus) {
        if (newAnime.userStatus === 'Completed') return 'status_to_completed';
        if (newAnime.userStatus === 'Watching' && oldAnime.userStatus === 'Plan to Watch') return 'status_to_watching';
        return 'status_change';
    }
    if (oldAnime.userStatus === 'Watching' && newAnime.progress > oldAnime.progress) return 'progress_update';
    if (newAnime.episodes > oldAnime.episodes) return 'episode_increase';
    if (!oldAnime.score && newAnime.score) return 'rating';
    return 'no_change';
}

// =============================================
// NOTIFICATION STORAGE & FUNCTIONS
// =============================================

let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
let previousXP = parseInt(localStorage.getItem('previousXP')) || 0;

function saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const dot = document.getElementById('notificationDot');
    const bell = document.getElementById('notificationBell');
    if (dot) {
        if (unreadCount > 0) {
            dot.style.display = 'flex';
            dot.textContent = unreadCount > 99 ? '99+' : unreadCount;
            dot.classList.add('has-count');
            setTimeout(() => dot?.classList.remove('has-count'), 500);
        } else {
            dot.style.display = 'none';
            dot.textContent = '';
        }
    }
    if (unreadCount > 0 && bell) {
        bell.classList.add('notification-bounce');
        setTimeout(() => bell.classList.remove('notification-bounce'), 500);
    }
}

function addNotification(type, title, message, relatedId = null) {
    const notification = {
        id: Date.now(), type, title, message, relatedId,
        timestamp: new Date().toISOString(), read: false
    };
    notifications.unshift(notification);
    if (notifications.length > 100) notifications = notifications.slice(0, 100);
    saveNotifications();
    let toastType = 'info';
    if (type === 'completed' || type === 'achievement') toastType = 'success';
    if (type === 'level') toastType = 'warning';
    if (type === 'xp') toastType = 'success';
    showToast(message, toastType);
    updateNotificationBadge();
    const center = document.getElementById('notificationCenter');
    if (center?.classList.contains('show')) renderNotifications();
    return notification;
}

function renderNotifications() {
    const listEl = document.getElementById('notificationList');
    if (!listEl) return;
    if (notifications.length === 0) {
        listEl.innerHTML = `<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>`;
        return;
    }
    const getIcon = (type) => {
        switch (type) {
            case 'progress': return 'fa-chart-line';
            case 'completed': return 'fa-check-circle';
            case 'reminder': return 'fa-clock';
            case 'achievement': return 'fa-trophy';
            case 'level': return 'fa-level-up-alt';
            case 'profile': return 'fa-user-edit';
            case 'anime': return 'fa-tv';
            case 'xp': return 'fa-chart-line';
            default: return 'fa-info-circle';
        }
    };
    const getIconClass = (type) => {
        switch (type) {
            case 'progress': return 'progress';
            case 'completed': return 'completed';
            case 'reminder': return 'reminder';
            case 'achievement': return 'achievement';
            case 'level': return 'level';
            case 'profile': return 'profile';
            case 'anime': return 'anime';
            case 'xp': return 'xp';
            default: return '';
        }
    };
    listEl.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${getIconClass(notif.type)}"><i class="fas ${getIcon(notif.type)}"></i></div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatTimeAgo(notif.timestamp)}</div>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const notification = notifications.find(n => n.id === id);
            if (notification && !notification.read) {
                notification.read = true;
                saveNotifications();
                renderNotifications();
                updateNotificationBadge();
            }
            if (notification?.relatedId && typeof window.editAnime === 'function') {
                document.getElementById('notificationCenter')?.classList.remove('show');
                window.editAnime(notification.relatedId);
            }
        });
    });
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    saveNotifications();
    renderNotifications();
    updateNotificationBadge();
    showToast('All notifications marked as read', 'info');
}

function clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        notifications = [];
        saveNotifications();
        renderNotifications();
        updateNotificationBadge();
        showToast('All notifications cleared', 'info');
    }
}

// =============================================
// XP CARRYOVER SYSTEM
// =============================================

function addToPendingXP(xpAmount, animeTitle, reason) {
    pendingXP.amount += xpAmount;
    pendingXP.source.push({ anime: animeTitle, amount: xpAmount, reason, timestamp: new Date().toISOString() });
    pendingXP.lastUpdated = new Date().toISOString();
    localStorage.setItem('pendingXP', JSON.stringify(pendingXP));
    addNotification('info', '⏳ XP Queued', `${xpAmount} XP from "${animeTitle}" has been queued for tomorrow.`);
    updatePendingXPDisplay();
    updateDailyXPTracker();
    return true;
}

function processPendingXP() {
    if (pendingXP.amount > 0) {
        const today = new Date().toDateString();
        const lastProcessed = localStorage.getItem('lastPendingProcessed');
        if (lastProcessed !== today) {
            const currentXP = calculateTotalXPSafe();
            const newXP = currentXP + pendingXP.amount;
            showXPGainNotification(`${pendingXP.source.length} queued item(s)`, pendingXP.amount, currentXP, newXP);
            addNotification('xp', '📦 Queued XP Awarded!', `You received ${pendingXP.amount} XP from ${pendingXP.source.length} queued items!`);
            pendingXP = { amount: 0, source: [], lastUpdated: new Date().toISOString() };
            localStorage.setItem('pendingXP', JSON.stringify(pendingXP));
            localStorage.setItem('lastPendingProcessed', today);
            setTimeout(() => {
                updateSettingsLevelSafe();
                updateSidebarLevelSafe();
                updateDailyXPTracker();
            }, 100);
            return true;
        }
    }
    return false;
}

// =============================================
// UI UPDATE FUNCTIONS
// =============================================

function updateSidebarLevelSafe() {
    try {
        const badgeEl = document.getElementById('levelBadgeText');
        const titleEl = document.getElementById('levelTitleText');
        if (!badgeEl || !titleEl) return;
        const totalXP = calculateTotalXPSafe();
        const currentLevel = getCurrentLevelSafe(totalXP);
        badgeEl.textContent = `Lv.${currentLevel.level}`;
        titleEl.textContent = currentLevel.title;
    } catch (e) { console.warn('Sidebar level update error:', e); }
}

function updateSettingsLevelSafe() {
    try {
        const titleEl = document.getElementById('settingsLevelTitle');
        const numberEl = document.getElementById('settingsLevelNumber');
        const fillEl = document.getElementById('settingsProgressFill');
        const currentXPSpan = document.getElementById('settingsCurrentXP');
        const nextXPSpan = document.getElementById('settingsNextXP');
        const nextInfoEl = document.getElementById('settingsNextInfo');
        if (!titleEl || !numberEl) return;
        const totalXP = calculateTotalXPSafe();
        const currentLevel = getCurrentLevelSafe(totalXP);
        const nextLevel = getNextLevelSafe(totalXP);
        titleEl.textContent = currentLevel.title;
        numberEl.textContent = `Level ${currentLevel.level}`;
        if (nextLevel && fillEl) {
            const currentReq = currentLevel.xpRequired;
            const nextReq = nextLevel.xpRequired;
            const currentXP = totalXP - currentReq;
            const neededXP = nextReq - currentReq;
            const percentage = (currentXP / neededXP) * 100;
            fillEl.style.width = `${percentage}%`;
            if (currentXPSpan) currentXPSpan.textContent = totalXP;
            if (nextXPSpan) nextXPSpan.textContent = nextReq;
            if (nextInfoEl) nextInfoEl.textContent = `Next: ${nextLevel.title} at ${nextReq} XP`;
        } else if (fillEl) {
            fillEl.style.width = '100%';
            if (currentXPSpan) currentXPSpan.textContent = totalXP;
            if (nextXPSpan) nextXPSpan.textContent = totalXP;
            if (nextInfoEl) nextInfoEl.textContent = `Maximum Level Reached!`;
        }
    } catch (e) { console.warn('Settings level update error:', e); }
}

// =============================================
// XP GAIN NOTIFICATION
// =============================================

function calculateLevelProgressPercentage(xp) {
    const currentLevel = getCurrentLevelSafe(xp);
    const nextLevel = getNextLevelSafe(xp);
    if (!nextLevel) return 100;
    return ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100;
}

function showXPGainNotification(animeTitle, gainedXP, oldXP, newXP) {
    console.log(`🎉 XP GAIN: +${gainedXP} XP | ${oldXP} → ${newXP} | From: ${animeTitle}`);

    const currentLevel = getCurrentLevelSafe(newXP);
    const nextLevel = getNextLevelSafe(newXP);
    let xpNeeded = nextLevel ? nextLevel.xpRequired - newXP : 0;

    const xpToast = document.createElement('div');
    xpToast.className = 'xp-gain-toast';
    xpToast.innerHTML = `
        <div class="xp-gain-icon"><i class="fas fa-chart-line"></i></div>
        <div class="xp-gain-content">
            <div class="xp-gain-title">✨ +${gainedXP} XP Earned!</div>
            <div class="xp-gain-anime">From: ${animeTitle}</div>
            <div class="xp-gain-progress">
                <span class="xp-old">${oldXP}</span>
                <i class="fas fa-arrow-right"></i>
                <span class="xp-new">${newXP}</span>
                <span class="xp-total">XP</span>
            </div>
            ${nextLevel ? `<div class="xp-next-info"><i class="fas fa-target"></i> ${xpNeeded} more XP for ${nextLevel.title} (Lv.${nextLevel.level})</div>` : '<div class="xp-next-info">🏆 Maximum Level Reached!</div>'}
        </div>
        <div class="xp-gain-progress-bar"><div class="xp-progress-fill" style="width: ${calculateLevelProgressPercentage(newXP)}%"></div></div>
    `;
    document.body.appendChild(xpToast);

    // Animate progress bar
    setTimeout(() => {
        const fill = xpToast.querySelector('.xp-progress-fill');
        if (fill) {
            fill.style.transition = 'width 0.5s ease';
            fill.style.width = `${calculateLevelProgressPercentage(newXP)}%`;
        }
    }, 100);

    // Also add to notification center
    addNotification('xp', '⭐ XP Earned!', `You earned ${gainedXP} XP from "${animeTitle}". Total: ${newXP} XP`);

    // Auto remove after 6 seconds
    setTimeout(() => {
        xpToast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => xpToast.remove(), 300);
    }, 6000);
}

function showXPLossNotification(animeTitle, lostXP, oldXP, newXP) {
    const lossToast = document.createElement('div');
    lossToast.className = 'xp-loss-toast';
    lossToast.innerHTML = `
        <div class="xp-gain-icon" style="background: rgba(239,68,68,0.15);"><i class="fas fa-chart-line" style="color:#ef4444;"></i></div>
        <div class="xp-gain-content">
            <div class="xp-gain-title" style="color:#f87171;">📉 -${lostXP} XP</div>
            <div class="xp-gain-anime">Removed: ${animeTitle}</div>
            <div class="xp-gain-progress"><span class="xp-old">${oldXP}</span> <i class="fas fa-arrow-right"></i> <span class="xp-new">${newXP}</span> <span class="xp-total">XP</span></div>
        </div>
        <div class="xp-gain-progress-bar"><div class="xp-progress-fill" style="width: ${calculateLevelProgressPercentage(newXP)}%"></div></div>
    `;
    document.body.appendChild(lossToast);
    setTimeout(() => {
        lossToast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => lossToast.remove(), 300);
    }, 4000);
}

// =============================================
// DAILY XP TRACKER
// =============================================

function getTodayEarnedXP() {
    const today = new Date().toDateString();
    // Force refresh from localStorage
    const savedLimit = JSON.parse(localStorage.getItem('xpDailyLimit')) || { date: today, total: 0 };
    console.log(`📊 getTodayEarnedXP: saved date=${savedLimit.date}, today=${today}, total=${savedLimit.total}`);
    
    if (savedLimit.date === today) {
        xpDailyLimit = savedLimit;
        return savedLimit.total || 0;
    }
    return 0;
}

function updateDailyXPTracker() {
    const earnedXP = getTodayEarnedXP();
    const remainingXP = Math.max(0, XP_LIMITS.DAILY_MAX - earnedXP);
    const percentage = Math.min(100, (earnedXP / XP_LIMITS.DAILY_MAX) * 100);

    console.log(`🔄 Tracker Update: Earned=${earnedXP}, Remaining=${remainingXP}, Percentage=${percentage}%`);

    const limitText = document.getElementById('dailyLimitText');
    const progressBar = document.getElementById('dailyXPProgressBar');
    const earnedSpan = document.getElementById('xpEarnedToday');
    const remainingSpan = document.getElementById('xpRemainingToday');
    const warningDiv = document.getElementById('dailyXPWarning');

    if (limitText) {
        limitText.textContent = `${earnedXP} / ${XP_LIMITS.DAILY_MAX} XP`;
        limitText.classList.add('xp-updated');
        setTimeout(() => limitText.classList.remove('xp-updated'), 500);
    }

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.classList.remove('warning', 'danger');
        if (percentage >= 90) progressBar.classList.add('danger');
        else if (percentage >= 75) progressBar.classList.add('warning');
    }

    if (earnedSpan) {
        earnedSpan.textContent = `${earnedXP} XP earned today`;
        earnedSpan.classList.add('xp-updated');
        setTimeout(() => earnedSpan.classList.remove('xp-updated'), 500);
    }

    if (remainingSpan) {
        if (remainingXP > 0) {
            remainingSpan.textContent = `${remainingXP} XP remaining`;
            remainingSpan.style.color = '#10b981';
        } else {
            remainingSpan.textContent = `Limit reached! ${pendingXP.amount > 0 ? pendingXP.amount + ' XP queued' : 'XP will be queued'}`;
            remainingSpan.style.color = '#f59e0b';
        }
    }

    if (warningDiv) {
        if (percentage >= 75) {
            warningDiv.style.display = 'flex';
            if (remainingXP <= 0) {
                warningDiv.innerHTML = `<i class="fas fa-hourglass-end"></i><span>Daily limit reached! ${pendingXP.amount > 0 ? `${pendingXP.amount} XP queued for tomorrow.` : 'New XP will be queued for tomorrow.'}</span>`;
            } else {
                warningDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>Only ${remainingXP} XP left today! XP after this will be queued.</span>`;
            }
        } else {
            warningDiv.style.display = 'none';
        }
    }

    updatePendingXPDisplay();
}

function updatePendingXPDisplay() {
    const pendingDiv = document.querySelector('.pending-xp-display');
    if (pendingDiv) {
        if (pendingXP.amount > 0) {
            const uniqueAnime = [...new Set(pendingXP.source.map(s => s.anime))];
            pendingDiv.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;"><i class="fas fa-clock" style="color:#f59e0b;"></i><span><strong>${pendingXP.amount} XP Queued</strong></span><span style="margin-left:auto;font-size:0.65rem;color:#f59e0b;">⏳ Pending</span></div>
                <div style="font-size:0.65rem;color:#94a3b8;margin-top:4px;">From: ${uniqueAnime.slice(0, 3).join(', ')}${uniqueAnime.length > 3 ? ` +${uniqueAnime.length - 3} more` : ''}</div>
                <div style="font-size:0.6rem;color:#64748b;margin-top:6px;"><i class="fas fa-info-circle"></i> Will be awarded automatically tomorrow</div>
                <div class="tracker-progress" style="margin-top:8px;height:4px;"><div class="tracker-progress-bar" style="width:${Math.min(100, (pendingXP.amount / XP_LIMITS.DAILY_MAX) * 100)}%; background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div>
            `;
            pendingDiv.style.display = 'block';
        } else pendingDiv.style.display = 'none';
    }
}

function addDailyXPTrackerToSettings() {
    const levelCard = document.querySelector('.level-card');
    if (levelCard && !document.querySelector('.daily-xp-tracker')) {
        const trackerHTML = `<div class="daily-xp-tracker" id="dailyXPTracker"><div class="tracker-header"><div class="tracker-title"><i class="fas fa-calendar-day"></i><span>Today's XP Limit</span></div><div class="tracker-limit" id="dailyLimitText">0 / ${XP_LIMITS.DAILY_MAX} XP</div></div><div class="tracker-progress"><div class="tracker-progress-bar" id="dailyXPProgressBar" style="width:0%"></div></div><div class="tracker-stats"><span class="xp-earned" id="xpEarnedToday">0 XP earned today</span><span class="xp-remaining" id="xpRemainingToday">${XP_LIMITS.DAILY_MAX} XP remaining</span></div><div class="tracker-warning" id="dailyXPWarning" style="display:none;"><i class="fas fa-exclamation-triangle"></i><span>Approaching limit! XP will be queued.</span></div></div>`;
        levelCard.insertAdjacentHTML('beforeend', trackerHTML);
    }
}

function addPendingXPDisplay() {
    const levelCard = document.querySelector('.level-card');
    if (levelCard && !document.querySelector('.pending-xp-display')) {
        const pendingDiv = document.createElement('div');
        pendingDiv.className = 'pending-xp-display';
        pendingDiv.style.cssText = `margin-top:16px;padding:12px;background:rgba(245,158,11,0.1);border-radius:12px;border-left:3px solid #f59e0b;font-size:0.75rem;`;
        levelCard.appendChild(pendingDiv);
        updatePendingXPDisplay();
    }
}

// =============================================
// DAILY LIMIT RESET
// =============================================

function checkAndResetDailyLimits() {
    const now = new Date();
    const today = now.toDateString();
    const lastReset = localStorage.getItem('lastDailyReset');
    if (!lastReset || new Date(lastReset).toDateString() !== today) {
        processPendingXP();
        xpDailyLimit = { date: today, total: 0, episodeCount: 0 };
        localStorage.setItem('xpDailyLimit', JSON.stringify(xpDailyLimit));
        dailyAnimeCount = { date: today, count: 0 };
        localStorage.setItem('dailyAnimeCount', JSON.stringify(dailyAnimeCount));
        localStorage.setItem('lastDailyReset', now.toISOString());
        setTimeout(() => {
            updateDailyXPTracker();
            updateSettingsLevelSafe();
            updateSidebarLevelSafe();
            addNotification('info', '📅 New Day!', `Daily XP limit reset! You can earn ${XP_LIMITS.DAILY_MAX} XP today.`);
        }, 100);
    }
}
setInterval(checkAndResetDailyLimits, 60 * 1000);

// =============================================
// MAIN XP CALCULATION WITH CARRYOVER
// =============================================

function canAddAnimeToday() {
    const today = new Date().toDateString();
    if (dailyAnimeCount.date !== today) dailyAnimeCount = { date: today, count: 0 };
    return dailyAnimeCount.count < XP_LIMITS.MAX_ANIME_PER_DAY;
}

function recordAnimeAddition() {
    const today = new Date().toDateString();
    if (dailyAnimeCount.date !== today) dailyAnimeCount = { date: today, count: 0 };
    dailyAnimeCount.count++;
    localStorage.setItem('dailyAnimeCount', JSON.stringify(dailyAnimeCount));
}

function checkHourlyLimit() {
    const lastHour = Date.now() - 3600000;
    const hourlyXP = xpTransactionLog.filter(t => new Date(t.timestamp).getTime() > lastHour).reduce((s, t) => s + t.amount, 0);
    if (hourlyXP >= XP_LIMITS.HOURLY_MAX) {
        addNotification('warning', '⏰ Slow Down!', `You've earned ${hourlyXP} XP in the last hour. Max ${XP_LIMITS.HOURLY_MAX} XP/hour.`);
        return false;
    }
    return true;
}

function getTimeSinceLastUpdate(animeId) {
    const last = localStorage.getItem(`last_update_${animeId}`);
    return last ? Date.now() - parseInt(last) : XP_LIMITS.MIN_TIME_BETWEEN_UPDATES + 1;
}

function getAnimeCompletionCount(animeId) {
    return (JSON.parse(localStorage.getItem('animeCompletions')) || {})[animeId] || 0;
}

function recordAnimeCompletion(animeId) {
    const completions = JSON.parse(localStorage.getItem('animeCompletions')) || {};
    completions[animeId] = (completions[animeId] || 0) + 1;
    localStorage.setItem('animeCompletions', JSON.stringify(completions));
}

function recordXPTransaction(animeId, amount, reason, oldXP, newXP) {
    xpTransactionLog.unshift({ 
        id: Date.now(), 
        animeId, 
        amount, 
        reason, 
        oldXP, 
        newXP, 
        timestamp: new Date().toISOString(), 
        fingerprint: getSimpleFingerprint() 
    });
    if (xpTransactionLog.length > 1000) xpTransactionLog = xpTransactionLog.slice(0, 1000);
    localStorage.setItem('xpTransactionLog', JSON.stringify(xpTransactionLog));
    
    // Update daily limit - MAKE SURE THIS IS UPDATING CORRECTLY
    const today = new Date().toDateString();
    if (xpDailyLimit.date !== today) {
        xpDailyLimit = { date: today, total: 0, episodeCount: 0 };
    }
    xpDailyLimit.total += amount;
    localStorage.setItem('xpDailyLimit', JSON.stringify(xpDailyLimit));
    localStorage.setItem(`last_update_${animeId}`, Date.now().toString());
    
    console.log(`📊 Updating tracker: +${amount} XP, Total today: ${xpDailyLimit.total}`);
    
    // Force update tracker
    updateDailyXPTracker();
}

function getSimpleFingerprint() {
    const info = `${navigator.userAgent}_${navigator.language}_${screen.width}x${screen.height}`;
    let hash = 0;
    for (let i = 0; i < info.length; i++) hash = ((hash << 5) - hash) + info.charCodeAt(i);
    return Math.abs(hash).toString(16);
}

function isPotentialHacker() {
    const lastHour = Date.now() - 3600000;
    if (xpTransactionLog.filter(t => new Date(t.timestamp).getTime() > lastHour).length > 20) {
        addNotification('warning', '🚨 Activity Limit', 'Too many actions. Please slow down.');
        return true;
    }
    return false;
}

function getAnimeTotalXP(animeId) {
    return xpTransactionLog.filter(t => t.animeId === animeId).reduce((s, t) => s + t.amount, 0);
}

function isSuspiciousActivity(anime, oldEp, newEp, oldProg, newProg) {
    const today = new Date().toDateString();
    if (xpDailyLimit.date !== today) xpDailyLimit = { date: today, total: 0, episodeCount: 0 };
    if ((newEp - oldEp) > XP_LIMITS.MAX_EPISODES_PER_DAY) {
        addNotification('warning', '⚠️ Suspicious', `Cannot add more than ${XP_LIMITS.MAX_EPISODES_PER_DAY} episodes/day.`);
        return true;
    }
    if (getTimeSinceLastUpdate(anime.id) < XP_LIMITS.MIN_TIME_BETWEEN_UPDATES && (newProg - oldProg) > 10) {
        addNotification('warning', '⚠️ Slow Down', 'Please wait before updating again.');
        return true;
    }
    if (getAnimeCompletionCount(anime.id) > 1) {
        addNotification('warning', '⚠️ Already Completed', `"${anime.title}" already completed. No more XP.`);
        return true;
    }
    return false;
}

function calculateXPSafely(anime, action, oldData = null) {
    // PLAN TO WATCH - NO XP
    if (action === 'add_plan') {
        console.log(`📚 "${anime.title}" added as Plan to Watch: 0 XP`);
        return 0;
    }

    // Check daily anime limit for completed anime only
    if (action === 'add_completed' && !canAddAnimeToday()) {
        addNotification('warning', '📚 Daily Limit', `Already added ${XP_LIMITS.MAX_ANIME_PER_DAY} anime today. Come back tomorrow!`);
        return 0;
    }

    if (!checkHourlyLimit()) return 0;
    if (oldData && isSuspiciousActivity(anime, oldData.episodes, anime.episodes, oldData.progress, anime.progress)) return 0;
    if (isPotentialHacker()) return 0;

    let xpGained = 0;

    // ADD COMPLETED - Full XP
    if (action === 'add_completed' && getAnimeCompletionCount(anime.id) === 0) {
        xpGained = 10 + Math.floor((anime.episodes || 0) / 2);
        if (anime.score >= 9) xpGained += 10;
        else if (anime.score >= 8) xpGained += 5;
        if (anime.type === 'Movie') xpGained += 5;
        console.log(`🏆 Adding "${anime.title}" as Completed: ${xpGained} XP`);
    }
    // ADD WATCHING - XP for initial progress
    else if (action === 'add_watching') {
        const progress = anime.progress || 0;
        xpGained = Math.floor(progress / 5);
        console.log(`🎬 Adding "${anime.title}" as Watching: ${xpGained} XP (${progress} episodes)`);
    }
    // STATUS TO COMPLETED - Bonus XP
    else if (action === 'status_to_completed' && oldData && getAnimeCompletionCount(anime.id) === 0) {
        xpGained = 10;
        if (anime.score >= 9) xpGained += 10;
        else if (anime.score >= 8) xpGained += 5;
        console.log(`🏆 Completing "${anime.title}": ${xpGained} XP`);
    }
    // STATUS TO WATCHING - XP for progress
    else if (action === 'status_to_watching' && oldData) {
        const progress = anime.progress || 0;
        if (progress > 0) {
            xpGained = Math.floor(progress / 5);
            console.log(`🎬 Changing "${anime.title}" to Watching: ${xpGained} XP`);
        }
    }
    // PROGRESS UPDATE - XP for new episodes
    else if (action === 'progress_update' && oldData) {
        const increase = (anime.progress || 0) - (oldData.progress || 0);
        if (increase > 0 && increase <= 50) {
            xpGained = Math.floor(increase / 5);
            if (xpGained > 0) {
                console.log(`📈 Progress update for "${anime.title}": +${xpGained} XP (${increase} episodes)`);
            }
        }
    }
    // EPISODE INCREASE - XP for new episodes in completed anime
    else if (action === 'episode_increase' && oldData) {
        const increase = (anime.episodes || 0) - (oldData.episodes || 0);
        if (increase > 0 && increase <= 10) {
            xpGained = Math.floor(increase / 2);
            console.log(`📺 New episodes for "${anime.title}": +${xpGained} XP`);
        }
    }
    // RATING ADDED - Small XP
    else if (action === 'rating' && oldData && !oldData.score && anime.score) {
        xpGained = 2;
        console.log(`⭐ Rating added for "${anime.title}": +2 XP`);
    }

    if (xpGained === 0) return 0;

    // Apply daily limit - EXCESS GOES TO PENDING (CARRYOVER)
    const remainingDaily = XP_LIMITS.DAILY_MAX - xpDailyLimit.total;
    let finalXP = Math.min(xpGained, remainingDaily);
    let excess = xpGained - finalXP;
    if (excess > 0) {
        addToPendingXP(excess, anime.title, action);
        addNotification('warning', '⏳ Daily Limit Reached', `${excess} XP from "${anime.title}" has been queued for tomorrow.`);
    }

    // Apply per-anime limit (no carryover for this)
    const animeTotal = getAnimeTotalXP(anime.id);
    if (animeTotal + finalXP > XP_LIMITS.PER_ANIME_MAX) {
        finalXP = Math.max(0, XP_LIMITS.PER_ANIME_MAX - animeTotal);
        if (finalXP === 0) {
            addNotification('warning', '🎯 Anime XP Limit', `"${anime.title}" has reached the maximum ${XP_LIMITS.PER_ANIME_MAX} XP.`);
        }
    }

    // Show warning when approaching limit
    if (xpDailyLimit.total + finalXP >= XP_LIMITS.WARNING_THRESHOLD && xpDailyLimit.total < XP_LIMITS.WARNING_THRESHOLD) {
        const remaining = XP_LIMITS.DAILY_MAX - (xpDailyLimit.total + finalXP);
        addNotification('info', '📊 Daily XP Progress', `${remaining} XP left today! ${pendingXP.amount} XP queued.`);
    }

    // Record successful addition
    if (finalXP > 0 && action === 'add_completed') {
        recordAnimeAddition();
        recordAnimeCompletion(anime.id);
    }

    return finalXP;
}

// =============================================
// LEVEL UP CHECK
// =============================================

let lastXPSafe = parseInt(localStorage.getItem('lastXPSafe') || '0');

function checkLevelUpSafe() {
    try {
        const currentXP = calculateTotalXPSafe();
        if (currentXP > lastXPSafe) {
            const oldLevel = getCurrentLevelSafe(lastXPSafe);
            const newLevel = getCurrentLevelSafe(currentXP);
            if (oldLevel.level !== newLevel.level) {
                showToast(`✨ Level Up! ${oldLevel.title} → ${newLevel.title}`, 'success');
                addNotification('level', '🌟 Level Up!', `You reached ${newLevel.title} (Level ${newLevel.level})!`);
            }
            lastXPSafe = currentXP;
            localStorage.setItem('lastXPSafe', lastXPSafe.toString());
        }
        updateSidebarLevelSafe();
        updateSettingsLevelSafe();
    } catch (e) { console.warn('Level check error:', e); }
}

// =============================================
// NOTIFICATION GENERATORS (reminders, summaries, milestones)
// =============================================

function checkProgressNotifications() { /* existing implementation */ }
function checkReminderNotifications() { /* existing implementation */ }
function getConsecutiveMonthsWithCompletions() { /* existing implementation */ }
function checkYearlyMilestones() { /* existing implementation */ }
function checkCompletionNotifications() { /* existing implementation */ }
function sendWeeklySummary() { /* existing implementation */ }
function sendDailyReminder() { /* existing implementation */ }

// =============================================
// MAIN HANDLER FOR ANIME ACTIONS - COMPLETE FIX
// =============================================

const originalHandleAddAnime = window.handleAddAnime;
if (typeof originalHandleAddAnime === 'function') {
    window.handleAddAnime = function (e) {
        // Capture form values BEFORE any changes
        const titleInput = document.getElementById('animeTitle');
        const statusSelect = document.getElementById('animeStatus');
        const progressInput = document.getElementById('animeProgress');
        const episodesInput = document.getElementById('animeEpisodes');
        const scoreInput = document.getElementById('animeScore');
        const typeSelect = document.getElementById('animeType');

        const animeTitle = titleInput?.value?.trim() || 'Unknown';
        const newStatus = statusSelect?.value || 'Plan to Watch';
        const newProgress = parseInt(progressInput?.value) || 0;
        const newEpisodes = parseInt(episodesInput?.value) || 0;
        const newScore = parseFloat(scoreInput?.value) || null;
        const newType = typeSelect?.value || 'TV';
        const isBeingAdded = !window.isEditing;

        // Capture old data if editing
        let oldAnimeData = null;
        let oldStatus = '';
        let oldProgress = 0;
        let oldEpisodes = 0;
        let oldScore = null;

        if (window.isEditing && window.currentEditId) {
            const existingAnime = animeData.find(a => a.id == window.currentEditId);
            if (existingAnime) {
                oldAnimeData = { ...existingAnime };
                oldStatus = existingAnime.userStatus || '';
                oldProgress = existingAnime.progress || 0;
                oldEpisodes = existingAnime.episodes || 0;
                oldScore = existingAnime.score || null;
            }
        }

        // Create new anime data object for action detection
        const newAnimeData = {
            id: window.currentEditId || Date.now(),
            title: animeTitle,
            userStatus: newStatus,
            progress: newProgress,
            episodes: newEpisodes,
            score: newScore,
            type: newType
        };

        // Detect the action
        const action = detectAnimeAction(oldAnimeData, newAnimeData);

        // Calculate XP based on action
        let xpGained = 0;
        let xpBreakdown = '';

        if (action === 'add_plan') {
            xpGained = 0;
            xpBreakdown = 'Plan to Watch: 0 XP';
        }
        else if (action === 'add_watching') {
            xpGained = Math.floor(newProgress / 5);
            xpBreakdown = `Watching: +${xpGained} XP (${newProgress} episodes × 0.2)`;
        }
        else if (action === 'add_completed') {
            xpGained = 10 + Math.floor(newEpisodes / 2);
            if (newScore >= 9) xpGained += 10;
            else if (newScore >= 8) xpGained += 5;
            if (newType === 'Movie') xpGained += 5;
            xpBreakdown = `Completed: +${xpGained} XP (Completion:10 + Episodes:${Math.floor(newEpisodes / 2)} + Score:${newScore >= 9 ? 10 : (newScore >= 8 ? 5 : 0)} + ${newType === 'Movie' ? 'Movie:5' : ''})`;
        }
        else if (action === 'status_to_watching') {
            xpGained = Math.floor(newProgress / 5);
            xpBreakdown = `Plan → Watching: +${xpGained} XP (${newProgress} episodes × 0.2)`;
        }
        else if (action === 'status_to_completed') {
            xpGained = 10;
            if (newScore >= 9) xpGained += 10;
            else if (newScore >= 8) xpGained += 5;
            xpBreakdown = `Watching → Completed: +${xpGained} XP (Completion bonus + Score bonus)`;
        }
        else if (action === 'progress_update') {
            const increase = newProgress - oldProgress;
            xpGained = Math.floor(increase / 5);
            xpBreakdown = `Progress Update: +${xpGained} XP (${increase} new episodes × 0.2)`;
        }
        else if (action === 'rating') {
            xpGained = 2;
            xpBreakdown = `Rating Added: +2 XP`;
        }

        console.log(`📊 XP Calculation: ${xpBreakdown}`);

        // Apply daily limit
        let finalXP = xpGained;
        let excessXP = 0;

        if (finalXP > 0) {
            const remainingDaily = XP_LIMITS.DAILY_MAX - xpDailyLimit.total;
            if (finalXP > remainingDaily) {
                excessXP = finalXP - remainingDaily;
                finalXP = remainingDaily;
                if (excessXP > 0) {
                    addToPendingXP(excessXP, animeTitle, action);
                }
            }

            // Apply per-anime limit
            const animeTotal = getAnimeTotalXP(newAnimeData.id);
            if (animeTotal + finalXP > XP_LIMITS.PER_ANIME_MAX) {
                finalXP = Math.max(0, XP_LIMITS.PER_ANIME_MAX - animeTotal);
            }
        }

        // Get XP before calling original function
        const xpBefore = calculateTotalXPSafe();
        const levelBefore = getCurrentLevelSafe(xpBefore);

        // Call original function
        originalHandleAddAnime(e);

        // Show XP notification after the fact
        setTimeout(() => {
            const xpAfter = calculateTotalXPSafe();
            const levelAfter = getCurrentLevelSafe(xpAfter);

            // Inside originalHandleAddAnime, replace the manual XP addition block
            if (xpAfter === xpBefore && finalXP > 0) {
                const newTotalXP = xpBefore + finalXP;

                // Update daily limit - FORCE UPDATE
                const today = new Date().toDateString();
                if (xpDailyLimit.date !== today) {
                    xpDailyLimit = { date: today, total: 0, episodeCount: 0 };
                }
                xpDailyLimit.total += finalXP;
                localStorage.setItem('xpDailyLimit', JSON.stringify(xpDailyLimit));

                console.log(`📊 Manual XP Addition: +${finalXP} XP, Daily total now: ${xpDailyLimit.total}`);

                // Record transaction
                recordXPTransaction(newAnimeData.id, finalXP, action, xpBefore, newTotalXP);

                // Force update tracker IMMEDIATELY
                updateDailyXPTracker();

                // Show XP gain notification
                if (finalXP > 0) {
                    showXPGainNotification(animeTitle, finalXP, xpBefore, newTotalXP);
                }

                updateSettingsLevelSafe();
                updateSidebarLevelSafe();

                if (levelBefore.level !== levelAfter.level) {
                    addNotification('level', '🎉 Level Up!', `You reached ${levelAfter.title} (Level ${levelAfter.level})!`);
                }
            }

            // Show status change notifications
            if (action === 'add_plan') {
                addNotification('anime', '📚 Added to Plan', `"${animeTitle}" has been added to your plan to watch list.`);
            }
            else if (action === 'add_watching') {
                addNotification('anime', '📺 Started Watching', `You started watching "${animeTitle}". Enjoy the journey!`);
                if (xpGained > 0) {
                    showToast(`🎬 +${xpGained} XP from starting "${animeTitle}"!`, 'success');
                }
            }
            else if (action === 'add_completed') {
                addNotification('completed', '✨ Anime Completed! ✨', `Congratulations on completing "${animeTitle}"! 🎉`);
                checkCompletionNotifications();
                if (xpGained > 0) {
                    showToast(`🏆 +${xpGained} XP for completing "${animeTitle}"!`, 'success');
                }
            }
            else if (action === 'status_to_watching') {
                addNotification('anime', '🎬 Started Watching', `You started watching "${animeTitle}". Update progress to earn more XP!`);
                if (xpGained > 0) {
                    showToast(`🎬 +${xpGained} XP from starting "${animeTitle}"!`, 'success');
                }
            }
            else if (action === 'status_to_completed') {
                addNotification('completed', '✨ Anime Completed! ✨', `Congratulations on completing "${animeTitle}"! 🎉`);
                checkCompletionNotifications();
                if (xpGained > 0) {
                    showToast(`🏆 +${xpGained} XP for completing "${animeTitle}"!`, 'success');
                }
            }
            else if (action === 'progress_update' && xpGained > 0) {
                const increase = newProgress - oldProgress;
                showToast(`📈 +${xpGained} XP for watching ${increase} more episode${increase > 1 ? 's' : ''} of "${animeTitle}"!`, 'success');
            }
            else if (action === 'rating' && xpGained > 0) {
                showToast(`⭐ +2 XP for rating "${animeTitle}"!`, 'success');
            }

            previousXP = xpAfter;
            localStorage.setItem('previousXP', previousXP);
            checkLevelUpSafe();
        }, 500);
    };
}

// =============================================
// INITIALIZATION
// =============================================

function initLevelSystemSafe() {
    setTimeout(() => {
        updateSidebarLevelSafe();
        updateSettingsLevelSafe();
        addDailyXPTrackerToSettings();
        addPendingXPDisplay();
        updateDailyXPTracker();
    }, 100);
}

function initNotifications() {
    setInterval(() => { checkProgressNotifications(); checkReminderNotifications(); }, 3600000);
    setInterval(sendDailyReminder, 86400000);
    setInterval(sendWeeklySummary, 604800000);
    setTimeout(() => {
        checkProgressNotifications();
        checkReminderNotifications();
        sendWeeklySummary();
        updateNotificationBadge();
    }, 5000);

    const bell = document.getElementById('notificationBell');
    const center = document.getElementById('notificationCenter');
    if (bell && center) {
        const newBell = bell.cloneNode(true);
        bell.parentNode.replaceChild(newBell, bell);
        newBell.addEventListener('click', (e) => { e.stopPropagation(); center.classList.toggle('show'); renderNotifications(); });
        document.addEventListener('click', (e) => { if (!center.contains(e.target) && !newBell.contains(e.target)) center.classList.remove('show'); });
    }
    const markBtn = document.getElementById('markAllReadBtn');
    if (markBtn) markBtn.addEventListener('click', () => markAllAsRead());
    const clearBtn = document.getElementById('clearAllNotifications');
    if (clearBtn) clearBtn.addEventListener('click', () => clearAllNotifications());
    const closeBtn = document.getElementById('notificationCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => center?.classList.remove('show'));
}

// Final initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initLevelSystemSafe();
        initNotifications();
        checkAndResetDailyLimits();
        checkLevelUpSafe();
    }, 1000);
});

// Save data interceptor for level checks
const originalSaveData = window.saveData;
if (typeof originalSaveData === 'function') {
    window.saveData = function () {
        originalSaveData();
        setTimeout(checkLevelUpSafe, 200);
    };
} else {
    window.saveData = function () {
        localStorage.setItem('animeData', JSON.stringify(animeData));
        setTimeout(checkLevelUpSafe, 200);
    };
}

// CSS styles injection
if (!document.getElementById('notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
        @keyframes notificationBounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)} }
        @keyframes badgePulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.2)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideOutRight { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(100%)} }
        .notification-bounce { animation: notificationBounce 0.5s ease; }
        .notification-dot.has-count { animation: badgePulse 0.5s ease; }
        .notification-icon.level { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .notification-icon.profile { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .notification-icon.anime { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .notification-icon.xp { background: rgba(16,185,129,0.15); color: #10b981; }
        .xp-gain-toast, .xp-loss-toast { position: fixed; bottom: 30px; right: 30px; width: 340px; background: linear-gradient(135deg,#1a1f2e,#0f1420); border-radius: 16px; border-left: 4px solid #10b981; padding: 16px; z-index: 10002; animation: slideInRight 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .xp-loss-toast { border-left-color: #ef4444; }
        .xp-gain-icon { width: 40px; height: 40px; background: rgba(16,185,129,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .xp-gain-icon i { font-size: 1.2rem; color: #10b981; }
        .xp-gain-title { font-size: 1rem; font-weight: bold; color: #10b981; margin-bottom: 4px; }
        .xp-gain-anime { font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; }
        .xp-gain-progress { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; margin: 8px 0; }
        .xp-old { color: #64748b; text-decoration: line-through; }
        .xp-new { color: #10b981; font-weight: bold; font-size: 1rem; }
        .xp-next-info { font-size: 0.7rem; color: #a78bfa; margin-top: 8px; display: flex; align-items: center; gap: 6px; }
        .xp-gain-progress-bar { margin-top: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; height: 4px; overflow: hidden; }
        .xp-progress-fill { background: linear-gradient(90deg,#10b981,#34d399); height: 100%; width: 0%; border-radius: 10px; transition: width 0.3s ease; }
        .tracker-progress-bar.warning { background: linear-gradient(90deg,#f59e0b,#fbbf24); }
        .tracker-progress-bar.danger { background: linear-gradient(90deg,#ef4444,#f87171); }
    `;
    document.head.appendChild(style);
}

function addAnimeAddedNotification(animeTitle, status) {
    if (status === 'Completed') {
        addNotification('completed', '✨ Anime Completed!', `Congratulations on completing "${animeTitle}"! 🎉`);
    } else if (status === 'Watching') {
        addNotification('anime', '📺 Started Watching', `You started watching "${animeTitle}". Enjoy the journey!`);
    } else {
        addNotification('anime', '📚 Added to List', `"${animeTitle}" has been added to your list.`);
    }
}

function checkProgressNotifications() {
    const watchingAnime = animeData.filter(anime => anime.userStatus === 'Watching');
    const today = new Date().toDateString();
    const notifiedToday = JSON.parse(localStorage.getItem('notifiedProgress') || '{}');

    watchingAnime.forEach(anime => {
        const progress = anime.progress || 0;
        const total = anime.episodes || 0;
        if (total === 0) return;
        const percentage = (progress / total) * 100;
        const remaining = total - progress;
        const key = `${anime.id}_${Math.floor(percentage / 10)}`;
        if (notifiedToday[key] === today) return;
        if (percentage >= 25 && percentage < 30) {
            addNotification('progress', 'Progress Update', `"${anime.title}" is 25% complete! (${progress}/${total} episodes)`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 50 && percentage < 55) {
            addNotification('progress', 'Halfway There!', `You're halfway through "${anime.title}"! ${remaining} episodes to go!`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 75 && percentage < 80) {
            addNotification('progress', 'Almost Done!', `"${anime.title}" is 75% complete! Just ${remaining} episodes left!`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 90 && percentage < 95) {
            addNotification('progress', 'Final Stretch!', `"${anime.title}" is 90% done! ${remaining} episodes remaining!`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 98 && percentage < 100) {
            addNotification('progress', 'So Close!', `Just ${remaining} episode left of "${anime.title}"! Finish strong!`, anime.id);
            notifiedToday[key] = today;
        }
    });
    localStorage.setItem('notifiedProgress', JSON.stringify(notifiedToday));
}

function checkReminderNotifications() {
    const watchingAnime = animeData.filter(anime => anime.userStatus === 'Watching');
    const today = new Date();
    const lastReminded = JSON.parse(localStorage.getItem('lastReminded') || '{}');
    watchingAnime.forEach(anime => {
        const lastUpdated = anime.updatedAt ? new Date(anime.updatedAt) : new Date(anime.createdAt);
        if (!lastUpdated) return;
        const daysSinceUpdate = Math.floor((today - lastUpdated) / (1000 * 60 * 60 * 24));
        const key = anime.id.toString();
        if (lastReminded[key] === today.toDateString()) return;
        if (daysSinceUpdate === 7) {
            addNotification('reminder', 'Been a While', `It's been a week since you watched "${anime.title}". Still planning to continue?`, anime.id);
            lastReminded[key] = today.toDateString();
        } else if (daysSinceUpdate === 14) {
            addNotification('reminder', 'Long Time No Watch', `"${anime.title}" hasn't been updated in 2 weeks. Consider updating its status.`, anime.id);
            lastReminded[key] = today.toDateString();
        } else if (daysSinceUpdate === 30) {
            addNotification('reminder', 'Abandoned?', `It's been a month since you watched "${anime.title}". Maybe it's time to drop or continue?`, anime.id);
            lastReminded[key] = today.toDateString();
        }
    });
    localStorage.setItem('lastReminded', JSON.stringify(lastReminded));
}

function getConsecutiveMonthsWithCompletions() {
    const completedAnime = animeData.filter(a => a.userStatus === 'Completed');
    const monthsWithCompletions = new Set();
    completedAnime.forEach(anime => {
        let completionDate = null;
        if (anime.actualFinishDate) completionDate = new Date(anime.actualFinishDate);
        else if (anime.finishDate) completionDate = new Date(anime.finishDate);
        else if (anime.finishTimestamp) completionDate = new Date(anime.finishTimestamp);
        if (completionDate && !isNaN(completionDate.getTime())) {
            monthsWithCompletions.add(`${completionDate.getFullYear()}-${completionDate.getMonth()}`);
        }
    });
    const sortedMonths = Array.from(monthsWithCompletions).sort();
    if (sortedMonths.length === 0) return 0;
    const now = new Date();
    let currentStreak = 0;
    let checkDate = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 0; i < 24; i++) {
        if (monthsWithCompletions.has(`${checkDate.getFullYear()}-${checkDate.getMonth()}`)) {
            currentStreak++;
            checkDate.setMonth(checkDate.getMonth() - 1);
        } else break;
    }
    return currentStreak;
}

function checkYearlyMilestones() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const completedAnime = animeData.filter(a => a.userStatus === 'Completed');
    const thisYearCompletions = completedAnime.filter(anime => {
        let completionDate = null;
        if (anime.actualFinishDate) completionDate = new Date(anime.actualFinishDate);
        else if (anime.finishDate) completionDate = new Date(anime.finishDate);
        else if (anime.finishTimestamp) completionDate = new Date(anime.finishTimestamp);
        if (!completionDate || isNaN(completionDate.getTime())) return false;
        return completionDate.getFullYear() === currentYear;
    }).length;
    const yearlyMilestones = [10, 25, 50, 100, 200, 365];
    const lastYearlyMilestone = parseInt(localStorage.getItem(`lastYearlyMilestone_${currentYear}`)) || 0;
    for (const milestone of yearlyMilestones) {
        if (thisYearCompletions >= milestone && lastYearlyMilestone < milestone) {
            addNotification('achievement', '🎯 Yearly Milestone!', `You've completed ${milestone} anime in ${currentYear}! What a year!`);
            localStorage.setItem(`lastYearlyMilestone_${currentYear}`, milestone);
            break;
        }
    }
}

function checkCompletionNotifications() {
    const completedAnime = animeData.filter(a => a.userStatus === 'Completed');
    const totalCompleted = completedAnime.length;
    const overallMilestones = [1, 5, 10, 25, 50, 100, 250, 500];
    const lastOverallMilestone = parseInt(localStorage.getItem('lastOverallMilestone')) || 0;
    for (const milestone of overallMilestones) {
        if (totalCompleted >= milestone && lastOverallMilestone < milestone) {
            addNotification('achievement', '🏆 Lifetime Achievement!', `You've completed ${milestone} anime in total!`);
            localStorage.setItem('lastOverallMilestone', milestone);
            break;
        }
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthCompletions = completedAnime.filter(anime => {
        let completionDate = null;
        if (anime.actualFinishDate) completionDate = new Date(anime.actualFinishDate);
        else if (anime.finishDate) completionDate = new Date(anime.finishDate);
        else if (anime.finishTimestamp) completionDate = new Date(anime.finishTimestamp);
        if (!completionDate || isNaN(completionDate.getTime())) return false;
        return completionDate.getFullYear() === currentYear && completionDate.getMonth() === currentMonth;
    }).length;
    const monthlyMilestones = [1, 3, 5, 10, 15, 20, 30];
    const lastMonthlyMilestone = parseInt(localStorage.getItem(`lastMonthlyMilestone_${currentYear}_${currentMonth}`)) || 0;
    for (const milestone of monthlyMilestones) {
        if (currentMonthCompletions >= milestone && lastMonthlyMilestone < milestone) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            addNotification('achievement', '🏅 Monthly Milestone!', `You've completed ${milestone} anime in ${monthNames[currentMonth]}!`);
            localStorage.setItem(`lastMonthlyMilestone_${currentYear}_${currentMonth}`, milestone);
            break;
        }
    }
    const streakMonths = getConsecutiveMonthsWithCompletions();
    const streakMilestones = [3, 6, 12, 24];
    const lastStreakMilestone = parseInt(localStorage.getItem('lastStreakMilestone')) || 0;
    for (const milestone of streakMilestones) {
        if (streakMonths >= milestone && lastStreakMilestone < milestone) {
            addNotification('achievement', '🔥 Streak Milestone!', `${streakMonths} consecutive months with completions! Keep going!`);
            localStorage.setItem('lastStreakMilestone', milestone);
            break;
        }
    }
    checkYearlyMilestones();
}

function sendWeeklySummary() {
    const lastSummary = localStorage.getItem('lastWeeklySummary');
    const now = new Date();
    const weekNumber = Math.floor(now.getDate() / 7);
    if (lastSummary === `${now.getFullYear()}-${now.getMonth()}-${weekNumber}`) return;
    const completedThisWeek = animeData.filter(anime => {
        if (anime.userStatus !== 'Completed') return false;
        const completedDate = anime.actualFinishDate || anime.finishDate;
        if (!completedDate) return false;
        const date = new Date(completedDate);
        const daysAgo = (now - date) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
    }).length;
    const addedThisWeek = animeData.filter(anime => {
        const addedDate = anime.createdAt ? new Date(anime.createdAt) : null;
        if (!addedDate) return false;
        const daysAgo = (now - addedDate) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
    }).length;
    if (completedThisWeek > 0 || addedThisWeek > 0) {
        addNotification('achievement', 'Weekly Summary', `This week: ${completedThisWeek} completed, ${addedThisWeek} added!`);
    }
    localStorage.setItem('lastWeeklySummary', `${now.getFullYear()}-${now.getMonth()}-${weekNumber}`);
}

function sendDailyReminder() {
    const lastReminder = localStorage.getItem('lastDailyReminder');
    const today = new Date().toDateString();
    if (lastReminder === today) return;
    const watchingCount = animeData.filter(a => a.userStatus === 'Watching').length;
    if (watchingCount > 0) {
        addNotification('reminder', 'Daily Reminder', `You have ${watchingCount} anime in progress. Don't forget to update!`);
    }
    localStorage.setItem('lastDailyReminder', today);
}

function debugTracker() {
    const today = new Date().toDateString();
    const saved = JSON.parse(localStorage.getItem('xpDailyLimit'));
    console.log('=== TRACKER DEBUG ===');
    console.log('Today:', today);
    console.log('xpDailyLimit object:', xpDailyLimit);
    console.log('Saved in localStorage:', saved);
    console.log('getTodayEarnedXP():', getTodayEarnedXP());
    console.log('====================');
}