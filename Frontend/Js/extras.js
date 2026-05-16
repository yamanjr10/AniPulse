// =============================================
//UPDATE 1.0.0
// =============================================

// Make sure showToast is available
if (typeof showToast === 'undefined') {
    window.showToast = function(message, type = 'info') {
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
document.getElementById('addAnimeBtn')?.addEventListener('click', function() {
  document.getElementById('addAnimeModal').style.display = 'block';
  preventBodyScroll(true);
});

// Attach to import button
document.getElementById('importBtn')?.addEventListener('click', function() {
  document.getElementById('importModal').style.display = 'block';
  preventBodyScroll(true);
});

// Close modal handlers
document.querySelectorAll('.close-modal, .modal .btn-secondary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const modal = this.closest('.modal');
    if (modal) {
      modal.style.display = 'none';
      preventBodyScroll(false);
    }
  });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === this) {
      this.style.display = 'none';
      preventBodyScroll(false);
    }
  });
});

// Handle escape key
document.addEventListener('keydown', function(e) {
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

// Calculate total XP (safe version)
function calculateTotalXPSafe() {
    let xp = 0;
    try {
        const animeList = animeData || [];
        animeList.forEach(anime => {
            if (anime.userStatus === 'Completed') {
                xp += 10;
                const episodes = anime.episodes || 0;
                xp += Math.floor(episodes / 2);
                if (anime.score >= 8) xp += 5;
                if (anime.score >= 9) xp += 10;
                if (anime.type === 'Movie') xp += 5;
            }
            if (anime.userStatus === 'Watching') {
                xp += Math.floor((anime.progress || 0) / 5);
            }
            if (anime.score && anime.score > 0) xp += 2;
        });
        const totalHours = parseFloat(calculateTotalHours()) || 0;
        xp += Math.floor(totalHours * 2);
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {}
    return null;
}

// Update sidebar level (safe)
function updateSidebarLevelSafe() {
    try {
        const badgeEl = document.getElementById('levelBadgeText');
        const titleEl = document.getElementById('levelTitleText');
        
        if (!badgeEl || !titleEl) return;
        
        const totalXP = calculateTotalXPSafe();
        const currentLevel = getCurrentLevelSafe(totalXP);
        
        badgeEl.textContent = `Lv.${currentLevel.level}`;
        titleEl.textContent = currentLevel.title;
    } catch(e) {
        console.warn('Sidebar level update error:', e);
    }
}

// Update settings level (safe)
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
    } catch(e) {
        console.warn('Settings level update error:', e);
    }
}

// Check level up (safe)
let lastXPSafe = parseInt(localStorage.getItem('lastXPSafe') || '0');

function checkLevelUpSafe() {
    try {
        const currentXP = calculateTotalXPSafe();
        
        if (currentXP > lastXPSafe) {
            const oldLevel = getCurrentLevelSafe(lastXPSafe);
            const newLevel = getCurrentLevelSafe(currentXP);
            
            if (oldLevel.level !== newLevel.level) {
                showToast(`✨ Level Up! ${oldLevel.title} → ${newLevel.title}`, 'success');
            }
            
            lastXPSafe = currentXP;
            localStorage.setItem('lastXPSafe', lastXPSafe.toString());
        }
        
        updateSidebarLevelSafe();
        updateSettingsLevelSafe();
    } catch(e) {
        console.warn('Level check error:', e);
    }
}

// Initialize level system (safe - no overrides)
function initLevelSystemSafe() {
    setTimeout(() => {
        updateSidebarLevelSafe();
        updateSettingsLevelSafe();
    }, 100);
}

// Call when DOM is ready - NO OVERRIDES
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initLevelSystemSafe, 1000);
});

// Call when anime data changes - using existing saveData
const originalSaveDataBackup = window.saveData;
if (typeof originalSaveDataBackup === 'function') {
    window.saveData = function() {
        originalSaveDataBackup();
        setTimeout(checkLevelUpSafe, 200);
    };
} else {
    // If saveData doesn't exist, create a wrapper
    window.saveData = function() {
        localStorage.setItem('animeData', JSON.stringify(animeData));
        setTimeout(checkLevelUpSafe, 200);
    };
}

// =============================================
//  SMART NOTIFICATIONS
// =============================================

// Notification storage
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
let lastNotificationCheck = localStorage.getItem('lastNotificationCheck') || new Date().toISOString();

// Save notifications
function saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

// Add notification
function addNotification(type, title, message, relatedId = null) {
    const notification = {
        id: Date.now(),
        type: type, // 'progress', 'completed', 'reminder', 'achievement'
        title: title,
        message: message,
        relatedId: relatedId,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    saveNotifications();
    
    // Show toast for immediate notification
    showToast(message, type === 'completed' ? 'success' : 'info');
    
    // Update bell icon
    updateNotificationBadge();
    
    return notification;
}

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const dot = document.getElementById('notificationDot');
    const bell = document.getElementById('notificationBell');
    
    if (dot) {
        dot.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    
    // Add bounce animation if there are new notifications
    if (unreadCount > 0 && bell) {
        bell.classList.add('notification-bounce');
        setTimeout(() => bell.classList.remove('notification-bounce'), 500);
    }
}

// Render notifications in center
function renderNotifications() {
    const listEl = document.getElementById('notificationList');
    if (!listEl) return;
    
    if (notifications.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">No notifications yet</div>';
        return;
    }
    
    const getIcon = (type) => {
        switch(type) {
            case 'progress': return 'fa-chart-line';
            case 'completed': return 'fa-check-circle';
            case 'reminder': return 'fa-bell';
            case 'achievement': return 'fa-trophy';
            default: return 'fa-info-circle';
        }
    };
    
    const getIconClass = (type) => {
        switch(type) {
            case 'progress': return 'progress';
            case 'completed': return 'completed';
            case 'reminder': return 'reminder';
            case 'achievement': return 'achievement';
            default: return '';
        }
    };
    
    listEl.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${getIconClass(notif.type)}">
                <i class="fas ${getIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatTimeAgo(notif.timestamp)}</div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const notification = notifications.find(n => n.id === id);
            if (notification && !notification.read) {
                notification.read = true;
                saveNotifications();
                renderNotifications();
            }
            
            // If it's a progress notification, open the anime
            if (notification && notification.relatedId) {
                const modal = document.getElementById('addAnimeModal');
                if (modal && typeof window.editAnime === 'function') {
                    window.editAnime(notification.relatedId);
                }
            }
        });
    });
}

// Check for near-completion anime
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
        
        // Progress notifications at key milestones
        if (percentage >= 25 && percentage < 30) {
            addNotification('progress', 'Progress Update', 
                `"${anime.title}" is 25% complete! (${progress}/${total} episodes)`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 50 && percentage < 55) {
            addNotification('progress', 'Halfway There!', 
                `You're halfway through "${anime.title}"! ${remaining} episodes to go!`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 75 && percentage < 80) {
            addNotification('progress', 'Almost Done!', 
                `"${anime.title}" is 75% complete! Just ${remaining} episodes left!`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 90 && percentage < 95) {
            addNotification('progress', 'Final Stretch!', 
                `"${anime.title}" is 90% done! ${remaining} episodes remaining!`, anime.id);
            notifiedToday[key] = today;
        } else if (percentage >= 98 && percentage < 100) {
            addNotification('progress', 'So Close!', 
                `Just ${remaining} episode left of "${anime.title}"! Finish strong!`, anime.id);
            notifiedToday[key] = today;
        }
    });
    
    localStorage.setItem('notifiedProgress', JSON.stringify(notifiedToday));
}

// Check for stale watching (reminders)
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
            addNotification('reminder', 'Been a While', 
                `It's been a week since you watched "${anime.title}". Still planning to continue?`, anime.id);
            lastReminded[key] = today.toDateString();
        } else if (daysSinceUpdate === 14) {
            addNotification('reminder', 'Long Time No Watch', 
                `"${anime.title}" hasn't been updated in 2 weeks. Consider updating its status.`, anime.id);
            lastReminded[key] = today.toDateString();
        } else if (daysSinceUpdate === 30) {
            addNotification('reminder', 'Abandoned?', 
                `It's been a month since you watched "${anime.title}". Maybe it's time to drop or continue?`, anime.id);
            lastReminded[key] = today.toDateString();
        }
    });
    
    localStorage.setItem('lastReminded', JSON.stringify(lastReminded));
}

// Check for completion achievements
function checkCompletionNotifications(anime) {
    const completedCount = animeData.filter(a => a.userStatus === 'Completed').length;
    
    // Milestone achievements
    const milestones = [1, 5, 10, 25, 50, 100, 250, 500];
    const lastMilestone = localStorage.getItem('lastCompletionMilestone') || 0;
    
    for (const milestone of milestones) {
        if (completedCount >= milestone && lastMilestone < milestone) {
            addNotification('achievement', 'Achievement Unlocked! 🏆', 
                `You've completed ${milestone} anime! Keep up the great work!`);
            localStorage.setItem('lastCompletionMilestone', milestone);
            break;
        }
    }
}

// Weekly summary notification
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
        addNotification('achievement', 'Weekly Summary', 
            `This week: ${completedThisWeek} completed, ${addedThisWeek} added to your list!`);
    }
    
    localStorage.setItem('lastWeeklySummary', `${now.getFullYear()}-${now.getMonth()}-${weekNumber}`);
}

// Daily reminder to update progress
function sendDailyReminder() {
    const lastReminder = localStorage.getItem('lastDailyReminder');
    const today = new Date().toDateString();
    
    if (lastReminder === today) return;
    
    const watchingCount = animeData.filter(a => a.userStatus === 'Watching').length;
    
    if (watchingCount > 0) {
        addNotification('reminder', 'Daily Reminder', 
            `You have ${watchingCount} anime in progress. Don't forget to update your progress!`);
    }
    
    localStorage.setItem('lastDailyReminder', today);
}

// Initialize notification system
function initNotifications() {
    // Check for notifications periodically
    setInterval(() => {
        checkProgressNotifications();
        checkReminderNotifications();
    }, 1000 * 60 * 60); // Every hour
    
    // Daily checks
    setInterval(() => {
        sendDailyReminder();
    }, 1000 * 60 * 60 * 24); // Every day
    
    // Weekly summary
    setInterval(() => {
        sendWeeklySummary();
    }, 1000 * 60 * 60 * 24 * 7); // Every week
    
    // Initial checks
    setTimeout(() => {
        checkProgressNotifications();
        checkReminderNotifications();
        sendDailyReminder();
        sendWeeklySummary();
    }, 5000);
    
    // Bell click handler
    const bell = document.getElementById('notificationBell');
    const center = document.getElementById('notificationCenter');
    
    if (bell && center) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            center.classList.toggle('show');
            renderNotifications();
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!center.contains(e.target) && !bell.contains(e.target)) {
                center.classList.remove('show');
            }
        });
    }
    
    // Clear all button
    const clearBtn = document.getElementById('clearAllNotifications');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            notifications = [];
            saveNotifications();
            renderNotifications();
        });
    }
}

// Hook into anime completion for immediate notification
const originalHandleAddAnimeForNotifications = window.handleAddAnime;
if (typeof originalHandleAddAnimeForNotifications === 'function') {
    window.handleAddAnime = function(e) {
        const wasCompleted = document.getElementById('animeStatus')?.value === 'Completed';
        originalHandleAddAnimeForNotifications(e);
        
        setTimeout(() => {
            if (wasCompleted) {
                const title = document.getElementById('animeTitle')?.value;
                addNotification('completed', 'Anime Completed! 🎉', 
                    `Congratulations on completing "${title}"!`);
                checkCompletionNotifications();
            }
            checkProgressNotifications();
        }, 500);
    };
}

// Add bounce animation CSS
const notifStyle = document.createElement('style');
notifStyle.textContent = `
    @keyframes notificationBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
    }
    .notification-bounce {
        animation: notificationBounce 0.5s ease;
    }
`;
document.head.appendChild(notifStyle);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initNotifications, 2000);
});

