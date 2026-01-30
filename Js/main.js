// =============================================
//UPDATE 1.0.0
// =============================================

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
        if (profilePreviewName) profilePreviewName.textContent = name;
        if (topUserName) topUserName.textContent = name;
        if (sidebarUsername) sidebarUsername.textContent = name;

        if (profilePreviewAvatar) profilePreviewAvatar.src = avatar;
        if (topUserAvatar) topUserAvatar.src = avatar;
        if (sidebarAvatar) sidebarAvatar.src = avatar;

        localStorage.setItem('userProfile', JSON.stringify({ name, avatar }));
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

    // When avatar changes
    if (avatarInput) {
        avatarInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                updateUserProfile(usernameInput?.value || 'Unnamed', event.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Reset to default
    if (resetAvatarBtn) {
        resetAvatarBtn.addEventListener('click', () => {
            const defaultAvatar = 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff';
            updateUserProfile(usernameInput?.value || 'Unnamed', defaultAvatar);
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
            if (pageId === 'statistics-page') {
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

    // Initialize with sample data if empty
    if (animeData.length === 0) {
        initializeSampleData();
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


    // Check for updates periodically (every 6 hours)
    setInterval(checkForUserUpdates, 6 * 60 * 60 * 1000);

    // Check for updates on app start (with delay to avoid rate limiting)
    setTimeout(checkForUserUpdates, 5000);
});

// =============================================
// UPCOMING ANIME FUNCTIONALITY
// =============================================

// Initialize upcoming page
function initUpcomingPage() {
    upcomingFilters = document.querySelectorAll('.upcoming-filters .filter-btn');
    upcomingContent = document.getElementById('upcoming-content');
    upcomingLoading = document.getElementById('upcoming-loading');
    upcomingError = document.getElementById('upcoming-error');

    // Add event listeners for filter buttons
    upcomingFilters.forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-type');

            // Update active state
            upcomingFilters.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Show/hide sections based on type
            const myUpdatesSection = document.getElementById('my-updates-section');
            if (type === 'my-updates') {
                myUpdatesSection.style.display = 'block';
                loadMyUpdates();
            } else {
                myUpdatesSection.style.display = 'none';
                loadUpcomingAnime(type);
            }
        });
    });

    // Retry button
    document.getElementById('retry-upcoming')?.addEventListener('click', loadUpcomingData);
}

// Load all upcoming data
async function loadUpcomingData() {
    try {
        upcomingLoading.style.display = 'block';
        upcomingError.style.display = 'none';
        upcomingContent.style.display = 'none';

        // Load different types of anime data
        await Promise.all([
            loadUpcomingAnime('upcoming'),
            loadUpcomingAnime('trending'),
            loadUpcomingAnime('seasonal')
        ]);

        // Check for user updates
        await checkForUserUpdates();

        upcomingLoading.style.display = 'none';
        upcomingContent.style.display = 'block';

    } catch (error) {
        console.error('Error loading upcoming data:', error);
        upcomingLoading.style.display = 'none';
        upcomingError.style.display = 'block';
    }
}

// Load specific type of anime
async function loadUpcomingAnime(type = 'upcoming') {
    try {
        let url, params;

        switch (type) {
            case 'upcoming':
                url = 'https://api.jikan.moe/v4/top/anime';
                params = 'filter=upcoming&limit=12';
                break;
            case 'trending':
                url = 'https://api.jikan.moe/v4/top/anime';
                params = 'filter=airing&limit=12';
                break;
            case 'seasonal':
                const now = new Date();
                const year = now.getFullYear();
                const season = getCurrentSeason(now);
                url = `https://api.jikan.moe/v4/seasons/${year}/${season}`;
                params = 'limit=12';
                break;
        }

        const response = await fetch(`${url}?${params}`);
        const data = await response.json();

        if (data.data) {
            upcomingAnimeData[type] = data.data;
            renderUpcomingAnime(type);
        }

    } catch (error) {
        console.error(`Error loading ${type} anime:`, error);
        throw error;
    }
}

// Get current season
function getCurrentSeason(date) {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
}

// Render anime for a specific type
function renderUpcomingAnime(type) {
    const container = document.getElementById('upcoming-anime-grid');
    if (!container) return;

    const animeList = upcomingAnimeData[type];

    if (animeList.length === 0) {
        container.innerHTML = '<div class="no-anime">No anime found.</div>';
        return;
    }

    container.innerHTML = animeList.map(anime => {
        const title = anime.title_english || anime.title;
        const score = anime.score ? anime.score.toFixed(1) : 'N/A';
        const episodes = anime.episodes || '?';
        const startDate = anime.aired?.from ?
            new Date(anime.aired.from).toLocaleDateString() : 'TBA';

        // Check if this anime is in user's list
        const userAnime = animeData.find(a =>
            a.title.toLowerCase().includes(title.toLowerCase()) ||
            title.toLowerCase().includes(a.title.toLowerCase())
        );

        const updateBadge = userAnime ?
            `<div class="anime-update-badge" title="This anime is in your list!">
                <i class="fas fa-check"></i>
            </div>` : '';

        return `
            <div class="anime-card" onclick="handleUpcomingAnimeClick('${anime.mal_id}', '${title.replace(/'/g, "\\'")}')">
                ${updateBadge}
                <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}" 
                     alt="${title}" 
                     class="anime-cover"
                     onerror="this.src='https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'">
                <div class="anime-info">
                    <div class="anime-title">${title}</div>
                    <div class="anime-meta">
                        <span>${anime.type || 'TV'}</span>
                        <span>${episodes} eps</span>
                        ${anime.score ? `<span class="anime-score">⭐ ${score}</span>` : ''}
                    </div>
                    <div class="anime-meta">
                        <small>Starts: ${startDate}</small>
                    </div>
                    ${userAnime ? `
                    <div class="update-description" style="color: var(--info)">
                        <i class="fas fa-info-circle"></i>
                        Already in your list!
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Handle click on upcoming anime
function handleUpcomingAnimeClick(malId, title) {
    // Check if anime already exists in user's list
    const existingAnime = animeData.find(a =>
        a.title.toLowerCase() === title.toLowerCase()
    );

    if (existingAnime) {
        editAnime(existingAnime.id);
    } else {
        // Pre-fill the add anime form
        isEditing = false;
        currentEditId = null;
        animeForm.reset();
        submitBtn.textContent = 'Add Anime';
        deleteBtn.style.display = 'none';

        // Set the title to trigger search
        animeTitleInput.value = title;
        searchAnime();

        addAnimeModal.style.display = 'flex';
    }
}

// Check for user updates (new episodes, seasons, etc.)
async function checkForUserUpdates() {
    const updates = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

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

                    // Check for new season
                    if (latestInfo.title !== userAnime.title &&
                        latestInfo.title.includes(userAnime.title)) {
                        updates.push({
                            type: 'new_season',
                            anime: userAnime,
                            latestInfo: latestInfo,
                            message: `New season released: ${latestInfo.title}`
                        });
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
    showUpdateNotifications(updates);

    // Store updates for the upcoming page
    localStorage.setItem('userAnimeUpdates', JSON.stringify({
        updates: updates,
        lastChecked: now.toISOString()
    }));

    return updates;
}

// Show update notifications
function showUpdateNotifications(updates) {
    const seenUpdates = JSON.parse(localStorage.getItem('seenUpdates') || '[]');
    const newUpdates = updates.filter(update =>
        !seenUpdates.includes(`${update.anime.id}-${update.type}`)
    );

    newUpdates.forEach(update => {
        // Show toast notification
        showToast(update.message, 'info', 'update-toast');

        // Mark as seen
        seenUpdates.push(`${update.anime.id}-${update.type}`);
    });

    // Store seen updates (keep only from last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const filteredSeen = seenUpdates.filter(updateId => {
        // Simple filtering - in real app you might want to parse dates
        return true; // Keep all for now
    });

    localStorage.setItem('seenUpdates', JSON.stringify(filteredSeen));
}

// Load user-specific updates
function loadMyUpdates() {
    const updatesData = JSON.parse(localStorage.getItem('userAnimeUpdates') || '{"updates":[]}');
    const container = document.getElementById('my-updates-grid');

    if (!container) return;

    const updates = updatesData.updates || [];

    if (updates.length === 0) {
        container.innerHTML = `
            <div class="no-anime">
                <i class="fas fa-bell-slash"></i>
                <div>No updates for your watchlist yet.<br>We'll notify you when new episodes or seasons are released!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = updates.map(update => `
        <div class="compact-anime-card" onclick="editAnime('${update.anime.id}')">
            <img src="${update.anime.cover || 'https://via.placeholder.com/60x80/6a5acd/ffffff?text=No+Image'}" 
                 alt="${update.anime.title}">
            <div class="compact-anime-info">
                <div class="compact-anime-title">${update.anime.title}</div>
                <div class="compact-anime-meta">
                    ${update.type === 'new_episodes' ?
            `${update.newEpisodes} new episode${update.newEpisodes > 1 ? 's' : ''} available` :
            'New season available'}
                </div>
                <div class="update-description">
                    ${update.message}
                </div>
            </div>
        </div>
    `).join('');
}

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

// Search anime using Jikan API
async function searchAnime() {
    const query = animeTitleInput.value.trim();
    if (query.length < 3) {
        searchResults.style.display = 'none';
        return;
    }

    searchLoading.style.display = 'block';
    searchResults.style.display = 'none';

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();

        searchResults.innerHTML = '';
        if (data.data && data.data.length > 0) {
            data.data.forEach(anime => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/40x60?text=No+Image'}" alt="${anime.title}">
                        <div>
                            <div style="font-weight: 600;">${anime.title}</div>
                            <small>${anime.type} • ${anime.episodes || '?'} eps • Score: ${anime.score || 'N/A'}</small>
                        </div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    selectAnimeFromSearch(anime);
                });
                searchResults.appendChild(item);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div style="padding: 10px; text-align: center;">No results found</div>';
            searchResults.style.display = 'block';
        }
    } catch (error) {
        console.error('Error searching anime:', error);
        searchResults.innerHTML = '<div style="padding: 10px; text-align: center;">Error loading results</div>';
        searchResults.style.display = 'block';
    } finally {
        searchLoading.style.display = 'none';
    }
}

// Select anime from search results
function selectAnimeFromSearch(anime) {
    const englishTitle = anime.title_english || anime.title;
    animeTitleInput.value = englishTitle;
    const typeSelect = document.getElementById('animeType');
    typeSelect.value = anime.type || 'TV';

    // Set duration based on type
    const durationInput = document.getElementById('animeDuration');
    if (typeSelect.value === 'Movie') {
        durationInput.value = anime.duration ? Math.round(anime.duration) : '120';
        durationInput.readOnly = false;
    } else {
        durationInput.value = '20';
        durationInput.readOnly = true;
    }

    document.getElementById('animeEpisodes').value = anime.episodes || 1;
    animeCoverInput.value = anime.images?.jpg?.image_url || '';

    const unwantedGenres = ['Award Winning'];
    const genres = anime.genres
        ? anime.genres
            .filter(g => !unwantedGenres.includes(g.name))
            .map(g => g.name)
            .join(', ')
        : '';

    animeGenresInput.value = genres;
    document.getElementById('animeScore').value = anime.score || '';
    searchResults.style.display = 'none';
}

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
    // Monthly Progress Chart
    const monthlyProgressCtx = document.getElementById('monthlyProgressChart').getContext('2d');
    monthlyProgressChart = new Chart(monthlyProgressCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Anime Completed',
                data: calculateMonthlyProgress(),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--gray')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Genre Distribution Chart (Current Month Only)
    const genreDistributionCtx = document.getElementById('genreDistributionChart').getContext('2d');
    genreDistributionChart = new Chart(genreDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(calculateGenreDistribution()),
            datasets: [{
                data: Object.values(calculateGenreDistribution()),
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
                }
            }
        }
    });

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

// Calculate yearly completion
function calculateYearlyCompletion() {
    const yearlyData = [0, 0, 0, 0, 0, 0]; // 2023-2028

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const year = finishDate.getFullYear();
            const index = year - 2023;

            if (index >= 0 && index < 6) {
                yearlyData[index]++;
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
        .slice(0, 6);

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

// Log activity
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
}

// Update recent activity
function updateRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');

    if (activityLog.length === 0) {
        activityContainer.innerHTML = '<div class="no-activity">No recent activity. Add or update anime to see activity here.</div>';
        return;
    }

    activityContainer.innerHTML = activityLog.slice(0, 6).map(activity => {
        let activityText = '';
        let iconClass = '';

        switch (activity.action) {
            case 'added':
                activityText = `Added ${activity.animeTitle} to your list`;
                iconClass = 'added';
                break;
            case 'completed':
                activityText = `Completed ${activity.animeTitle}`;
                iconClass = 'completed';
                break;
            case 'watching':
                activityText = `Started watching ${activity.animeTitle}`;
                iconClass = 'watching';
                break;
            case 'edited':
                activityText = `Updated ${activity.animeTitle}`;
                iconClass = 'edited';
                break;
            case 'deleted':
                activityText = `Removed ${activity.animeTitle} from your list`;
                iconClass = 'deleted';
                break;
            default:
                activityText = `Updated ${activity.animeTitle}`;
                iconClass = 'edited';
        }

        return `
                    <div class="activity-item">
                        <div class="activity-icon ${iconClass}">
                            <i class="fas fa-${iconClass === 'added' ? 'plus' : iconClass === 'completed' ? 'check' : iconClass === 'watching' ? 'play' : iconClass === 'edited' ? 'edit' : 'trash'}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-anime">${activity.animeTitle}</div>
                            <div class="activity-desc">${activityText}</div>
                        </div>
                        <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
                    </div>
                `;
    }).join('');
}

// Update anime display
function updateAnimeDisplay() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const sortFilter = document.getElementById('sortFilter')?.value || 'id';
    const monthFilter = document.getElementById('monthFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';

    let filteredAnime = [...animeData];

    // ✅ Month/year filtering logic (handles "All Status" properly)
    if (monthFilter !== 'all' || yearFilter !== 'all') {
        filteredAnime = filteredAnime.filter(anime => {
            const dateToCheck = anime.finishDate || anime.updatedAt || anime.createdAt;
            if (!dateToCheck) return false;

            const [year, month] = dateToCheck.split('-');

            if (monthFilter !== 'all' && month !== monthFilter) return false;
            if (yearFilter !== 'all' && year !== yearFilter) return false;

            if (statusFilter === 'all') return true;
            return anime.userStatus === statusFilter;
        });
    } else {
        // ✅ Apply only status filter if no month/year filter
        if (statusFilter !== 'all') {
            filteredAnime = filteredAnime.filter(a => a.userStatus === statusFilter);
        }
    }

    // ✅ Sorting logic
    if (sortFilter === 'title') {
        filteredAnime.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortFilter === 'rating') {
        filteredAnime.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortFilter === 'episodes') {
        filteredAnime.sort((a, b) => (b.episodes || 0) - (a.episodes || 0));
    } else if (sortFilter === 'updated') {
        filteredAnime.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }

    // ✅ Update the anime counter after rendering
    const countEl = document.getElementById('anime-count');
    if (countEl) {
        countEl.textContent = `Total Anime: ${filteredAnime.length}`;
    }
    // ✅ Update the anime table
    updateAnimeTableView(filteredAnime);
}

// Update anime table view
function updateAnimeTableView(animeList) {
    const tableBody = document.getElementById('anime-table-body');

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
        // 🏷️ Status class & text
        let statusClass = '';
        const statusText = anime.userStatus || 'Unknown';
        switch (anime.userStatus) {
            case 'Completed': statusClass = 'badge-completed'; break;
            case 'Watching': statusClass = 'badge-watching'; break;
            case 'Plan to Watch': statusClass = 'badge-plan'; break;
            case 'Dropped': statusClass = 'badge-dropped'; break;
            default: statusClass = 'badge-plan';
        }

        // 📅 Format completion date
        let completionDate = '-';
        if (anime.finishDate) {
            const date = new Date(anime.finishDate);
            completionDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // 🎞️ Progress bar
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

        // 💯 Score display
        const scoreDisplay = anime.score
            ? `<span class="anime-score">${anime.score.toFixed(1)}</span>`
            : '-';

        // 📕 Title (shorten long ones)
        const safeTitle = anime.title.length > 35 ? anime.title.slice(0, 35) + '...' : anime.title;

        // 🎨 Title + Cover + Genres
        const titleWithCover = `
            <div class="anime-title-cell">
                <img src="${anime.cover || 'https://via.placeholder.com/50x70/6a5acd/ffffff?text=No+Image'}"
                     alt="${anime.title}" class="anime-cover">
                <div class="anime-info">
                    <div class="anime-title" title="${anime.title}">${safeTitle}</div>
                    ${anime.genres && anime.genres.length > 0
                ? `<div class="anime-genres">${anime.genres.slice(0, 3).join(', ')}</div>`
                : ''}
                </div>
            </div>
        `;

        // 🧱 Return table row
        return `
            <tr data-id="${anime.id}" onclick="event.stopPropagation(); editAnime('${anime.id}')">
                <td>${titleWithCover}</td>
                <td>${anime.type || 'TV'}</td>
                <td>${progressBar}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${scoreDisplay}</td>
                <td>${completionDate}</td>
            </tr>
        `;
    }).join('');
}

// Edit anime - Fixed version
function editAnime(id) {
    const anime = animeData.find(a => a.id == id);
    if (!anime) return;

    isEditing = true;
    currentEditId = id;

    // Populate form with anime data
    document.getElementById('animeId').value = anime.id;
    document.getElementById('animeTitle').value = anime.title;
    document.getElementById('animeType').value = anime.type;
    document.getElementById('animeEpisodes').value = anime.episodes;
    document.getElementById('animeDuration').value = anime.duration || (anime.type === 'Movie' ? 120 : 20);
    document.getElementById('animeStatus').value = anime.userStatus;
    document.getElementById('animeProgress').value = anime.progress;
    document.getElementById('animeScore').value = anime.score || '';
    document.getElementById('animeCover').value = anime.cover || '';
    document.getElementById('animeGenres').value = anime.genres ? anime.genres.join(', ') : '';

    // Set finish date if exists
    if (anime.finishDate) {
        const finishDate = new Date(anime.finishDate);
        document.getElementById('animeYear').value = finishDate.getFullYear().toString();
        document.getElementById('animeMonth').value = (finishDate.getMonth() + 1).toString().padStart(2, '0');
    } else {
        // Set current date as default
        const now = new Date();
        document.getElementById('animeYear').value = now.getFullYear().toString();
        document.getElementById('animeMonth').value = (now.getMonth() + 1).toString().padStart(2, '0');
    }

    // Set duration input readonly based on type
    const durationInput = document.getElementById('animeDuration');
    if (anime.type === 'Movie') {
        durationInput.readOnly = false;
    } else {
        durationInput.readOnly = true;
    }

    // Update button text and show delete button
    submitBtn.textContent = 'Update Anime';
    deleteBtn.style.display = 'inline-block';

    // Show modal
    addAnimeModal.style.display = 'flex';

    // Close search results if open
    searchResults.style.display = 'none';
}

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

    addAnimeModal.style.display = 'none';
    animeForm.reset();
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';

    isEditing = false;
    currentEditId = null;
    submitBtn.textContent = 'Add Anime';
    deleteBtn.style.display = 'none';

    // Reset filters to show all statuses
    document.getElementById('statusFilter').value = 'all';

    // Refresh everything
    updateAllComponents();

    showToast('Anime deleted successfully!', 'success');
}

// Handle adding/updating anime
function handleAddAnime(e) {
    e.preventDefault();

    const title = document.getElementById('animeTitle').value;
    const type = document.getElementById('animeType').value;
    const episodes = parseInt(document.getElementById('animeEpisodes').value);
    let duration = parseInt(document.getElementById('animeDuration').value);
    const status = document.getElementById('animeStatus').value;
    const progress = parseInt(document.getElementById('animeProgress').value);
    const score = document.getElementById('animeScore').value ? parseFloat(document.getElementById('animeScore').value) : null;
    const year = document.getElementById('animeYear').value;
    const month = document.getElementById('animeMonth').value;
    const cover = document.getElementById('animeCover').value || '"https://placehold.co/150x200?text=No+Image"';
    const genres = document.getElementById('animeGenres').value.split(',').map(g => g.trim()).filter(g => g);

    // For non-movie types, force duration to 20 minutes
    if (type !== 'Movie') {
        duration = 20;
    }

    let finishDate = null;
    let completedTimestamp = null;

    // Only set finish date if status is Completed
    if (status === 'Completed') {
        finishDate = `${year}-${month}-01`;
        completedTimestamp = Date.now();
    }

    let action = "added";

    if (isEditing && currentEditId) {
        const index = animeData.findIndex(a => a.id == currentEditId);
        if (index !== -1) {
            const now = new Date();
            const localTime = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + ' ' +
                String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0');

            action = "edited";
            animeData[index] = {
                ...animeData[index],
                title,
                type,
                episodes,
                duration,
                userStatus: status,
                progress,
                score,
                genres,
                finishDate,
                completedTimestamp: status === 'Completed' ? completedTimestamp : null,
                cover,
                updatedAt: localTime
            };
        }
    } else {
        const now = new Date();
        const localTime = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');

        // Use selected month-year for storing instead of system date
        const dateString = `${year}-${month}-01`; // ensures correct month selection (Jan 2026 stays Jan 2026)

        const newAnime = {
            id: animeData.length > 0 ? Math.max(...animeData.map(a => a.id)) + 1 : 1,
            title,
            type,
            episodes,
            duration,
            userStatus: status,
            progress,
            score,
            genres,

            // Finish date only for completed anime
            finishDate: status === "Completed" ? dateString : null,
            completedTimestamp: status === "Completed" ? Date.now() : null,

            cover,

            // 👇 FIX: These now save based on selected month/year
            createdAt: dateString,
            updatedAt: dateString
        };

        animeData.push(newAnime);
    }

    saveData();

    // Log the activity
    if (status === 'Completed') {
        logActivity("completed", title);
    } else if (action === "added") {
        logActivity("added", title);
    } else {
        logActivity("edited", title);
    }

    addAnimeModal.style.display = 'none';
    animeForm.reset();
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';

    const wasEditing = isEditing;

    isEditing = false;
    currentEditId = null;
    submitBtn.textContent = 'Add Anime';
    deleteBtn.style.display = 'none';

    // ✅ Refresh everything (table, charts, stats)
    updateAllComponents();

    // ✅ Show correct success message
    showToast(wasEditing ? 'Anime updated successfully!' : 'Anime added successfully!', 'success');
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('animeData', JSON.stringify(animeData));
}

// Update all components
function updateAllComponents() {
    updateStats();
    updateCharts();
    updateTopRatedAnime();
    updateCurrentMonthAnime();
    updateRecentActivity();
    updateAnimeDisplay();
    updateTotalAnimeCountAllMonths();
    updateSidebarUserInfo();

    // Update statistics if on statistics page
    if (document.getElementById('statistics-page').classList.contains('active')) {
        initStatisticsCharts();
        updateStatisticsTables();
    }

    // 🌀 Auto-refresh Episodes Over Time chart (real-time chart sync)
    if (typeof updateEpisodesOverTimeDisplay === "function") {
        const currentYear = new Date().getFullYear();
        updateEpisodesOverTimeDisplay(currentYear);
    }

    // 🟢 Auto-refresh "Currently Watching" dashboard section
    if (typeof updateCurrentlyWatching === "function") {
        updateCurrentlyWatching();
    }

    // 🟢 GitHub-style activity refresh
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

// User name management
function getUserName() {
    return localStorage.getItem('userName');
}

function setUserName(name) {
    localStorage.setItem('userName', name);
    updateUserNameDisplay(name);
}

function updateUserNameDisplay(name) {
    const userAvatar = document.querySelector('.user-avatar');
    const tooltip = document.querySelector('.user-profile .tooltip');

    if (userAvatar) {
        const encodedName = encodeURIComponent(name);
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=6a5acd&color=fff`;
    }

    if (tooltip) {
        tooltip.textContent = name;
    }
}

function showNameEntryModal() {
    const nameEntryModal = document.getElementById('nameEntryModal');
    nameEntryModal.style.display = 'flex';

    // Focus on input field
    document.getElementById('userNameInput').focus();
}

function hideNameEntryModal() {
    const nameEntryModal = document.getElementById('nameEntryModal');
    nameEntryModal.style.display = 'none';
}

function initializeUserName() {
    const savedName = getUserName();

    if (!savedName) {
        // Show name entry modal if no name is saved
        showNameEntryModal();
    } else {
        // Use saved name
        updateUserNameDisplay(savedName);
    }
}

// Handle name entry form submission
document.getElementById('nameEntryForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const userNameInput = document.getElementById('userNameInput');
    const name = userNameInput.value.trim();

    if (name) {
        setUserName(name);
        hideNameEntryModal();
        showToast(`Welcome, ${name}!`, 'success');
    }
});

// Calculate total watch time in hours
function calculateTotalHours() {
    let totalMinutes = 0;

    animeData.forEach(anime => {
        if (anime.type === 'Movie') {
            // For movies, use the duration directly
            totalMinutes += anime.duration || 0;
        } else {
            // For TV series, calculate based on episodes watched
            const episodesWatched = anime.progress || 0;
            const episodeDuration = anime.duration || 20; // Default 20 minutes per episode
            totalMinutes += episodesWatched * episodeDuration;
        }
    });

    // Convert minutes to hours and round to 1 decimal place
    return (totalMinutes / 60).toFixed(1);
}

// Get current month name
function getCurrentMonth() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return months[now.getMonth()];
}
// Calculate monthly stats
function calculateMonthlyStats() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthlyHours = 0;
    let monthlyCompleted = 0;
    let monthlyMovies = 0;
    let monthlyEpisodes = 0;

    animeData.forEach(anime => {
        const finishDate = anime.finishDate ? new Date(anime.finishDate) : null;

        // Check if anime was completed this month
        if (
            finishDate &&
            finishDate.getMonth() === currentMonth &&
            finishDate.getFullYear() === currentYear
        ) {
            // Calculate hours
            if (anime.type === 'Movie') {
                monthlyHours += (anime.duration || 0) / 60;
                monthlyMovies++;

                // ✅ Count movies as 1 episode
                monthlyEpisodes += 1;
            } else {
                const episodeDuration = anime.duration || 20;
                monthlyHours += ((anime.episodes || 0) * episodeDuration) / 60;
                monthlyEpisodes += anime.episodes || 0;
            }

            if (anime.userStatus === 'Completed') {
                monthlyCompleted++;
            }
        }
    });

    return {
        hours: monthlyHours.toFixed(1),
        completed: monthlyCompleted,
        movies: monthlyMovies,
        episodes: monthlyEpisodes
    };
}

// Calculate percentage changes for monthly stats based on user data
function calculateStatChanges() {
    const currentStats = calculateMonthlyStats();
    const previousStats = getPreviousMonthlyStatsFromUserData();

    const changes = {};

    // Calculate percentage change for each metric
    changes.completed = calculatePercentageChange(previousStats.completed, currentStats.completed);
    changes.movies = calculatePercentageChange(previousStats.movies, currentStats.movies);
    changes.episodes = calculatePercentageChange(previousStats.episodes, currentStats.episodes);
    changes.hours = calculatePercentageChange(previousStats.hours, currentStats.hours);

    return changes;
}

// Get previous month's stats from actual user data
function getPreviousMonthlyStatsFromUserData() {
    const now = new Date();
    let prevYear = now.getFullYear();
    let prevMonth = now.getMonth() - 1;

    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
    }

    return calculateStatsForMonth(prevYear, prevMonth);
}

// Calculate stats for a specific month and year
function calculateStatsForMonth(year, month) {
    let monthlyHours = 0;
    let monthlyCompleted = 0;
    let monthlyMovies = 0;
    let monthlyEpisodes = 0;

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const finishYear = finishDate.getFullYear();
            const finishMonth = finishDate.getMonth();

            // Check if anime was completed in the specified month and year
            if (finishYear === year && finishMonth === month) {
                // Calculate hours for this anime
                if (anime.type === 'Movie') {
                    monthlyHours += (anime.duration || 0) / 60;
                    monthlyMovies++;
                } else {
                    const episodeDuration = anime.duration || 20;
                    monthlyHours += ((anime.episodes || 0) * episodeDuration) / 60;
                    monthlyEpisodes += anime.episodes || 0;
                }
                monthlyCompleted++;
            }
        }
    });

    return {
        hours: parseFloat(monthlyHours.toFixed(1)),
        completed: monthlyCompleted,
        movies: monthlyMovies,
        episodes: monthlyEpisodes
    };
}
function isFirstMonthOfYear() {
    return new Date().getMonth() === 0; // 0 = January
}

/* Percentage change calculation (UNCHANGED, SAFE) */
function calculatePercentageChange(previous, current) {
    previous = Number(previous) || 0;
    current = Number(current) || 0;

    if (previous === 0 && current === 0) {
        return {
            percentage: 0,
            isPositive: true,
            isNeutral: true,
            text: 'No data'
        };
    }

    if (previous === 0 && current > 0) {
        return {
            percentage: 100,
            isPositive: true,
            isNeutral: false,
            text: 'New activity'
        };
    }

    if (previous > 0 && current === 0) {
        return {
            percentage: 100,
            isPositive: false,
            isNeutral: true,
            text: 'No activity this month'
        };
    }

    const percentage = ((current - previous) / previous) * 100;
    const absPercentage = Math.abs(percentage);

    if (absPercentage < 1) {
        return {
            percentage: 0,
            isPositive: true,
            isNeutral: true,
            text: 'No change'
        };
    }

    return {
        percentage: absPercentage.toFixed(1),
        isPositive: percentage > 0,
        isNeutral: false,
        text: `${absPercentage.toFixed(1)}% ${percentage > 0 ? 'more' : 'less'}`
    };
}

/* Update ALL stat cards safely */
function updateStatCardsWithChanges() {

    // 🚫 JANUARY → NO COMPARISON AT ALL
    if (isFirstMonthOfYear()) {
        ['completed', 'movies', 'episodes', 'hours'].forEach(stat => {
            const el = document.getElementById(`${stat}-change`);
            if (!el) return;

            el.className = 'stat-change neutral';
            el.innerHTML = `<i class="fas fa-minus"></i> <span>No Data</span>`;
        });
        return;
    }

    // ✅ FEB–DEC → NORMAL MONTH-TO-MONTH COMPARISON
    const changes = calculateStatChanges();

    updateSingleStatCard('completed', changes.completed);
    updateSingleStatCard('movies', changes.movies);
    updateSingleStatCard('episodes', changes.episodes);
    updateSingleStatCard('hours', changes.hours);
}

/* Update one stat card */
function updateSingleStatCard(statName, change) {
    const changeElement = document.getElementById(`${statName}-change`);
    if (!changeElement || !change) return;

    changeElement.innerHTML = '';
    changeElement.className = 'stat-change';

    if (change.isNeutral) {
        changeElement.classList.add('neutral');
    } else if (change.isPositive) {
        changeElement.classList.add('positive');
    } else {
        changeElement.classList.add('negative');
    }

    let iconClass = 'fas fa-minus';
    if (!change.isNeutral) {
        iconClass = change.isPositive
            ? 'fas fa-arrow-up'
            : 'fas fa-arrow-down';
    }

    changeElement.innerHTML = `
        <i class="${iconClass}"></i>
        <span>${change.text}</span>
    `;
}

// Initialize sample data
function initializeSampleData() {
    // Add sample anime data if none exists
    if (animeData.length === 0) {
        const sampleAnime = [
            {
                id: 1,
                title: "Demon Slayer: Kimetsu no Yaiba",
                type: "TV",
                episodes: 26,
                duration: 20,
                userStatus: "Completed",
                progress: 26,
                score: 9.0,
                genres: ["Action", "Fantasy", "Supernatural"],
                finishDate: "2025-10-15",
                cover: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                title: "Your Name",
                type: "Movie",
                episodes: 1,
                duration: 120,
                userStatus: "Completed",
                progress: 1,
                score: 9.5,
                genres: ["Romance", "Supernatural", "Drama"],
                finishDate: "2025-10-10",
                cover: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        animeData = sampleAnime;
        saveData();

        // Log sample activities
        logActivity("added", "Demon Slayer: Kimetsu no Yaiba");
        logActivity("completed", "Demon Slayer: Kimetsu no Yaiba");
        logActivity("added", "Your Name");
        logActivity("completed", "Your Name");
    }
}

// Add these functions to calculate detailed statistics
function calculateStatistics() {
    return {
        totalAnime: animeData.length,
        totalHours: calculateTotalHours(),
        averageScore: calculateAverageScore(),
        completionRate: calculateCompletionRate(),
        statusDistribution: calculateStatusDistribution(),
        typeDistribution: calculateTypeDistribution(),
        genreStats: calculateGenreStats(),
        yearlyBreakdown: calculateYearlyBreakdown(),
        scoreAnalysis: calculateScoreAnalysis()
    };
}

function calculateAverageScore() {
    const ratedAnime = animeData.filter(anime => anime.score && anime.score > 0);
    if (ratedAnime.length === 0) return 0;

    const totalScore = ratedAnime.reduce((sum, anime) => sum + anime.score, 0);
    return (totalScore / ratedAnime.length).toFixed(1);
}

function calculateCompletionRate() {
    if (animeData.length === 0) return 0;
    const completed = animeData.filter(anime => anime.userStatus === 'Completed').length;
    return Math.round((completed / animeData.length) * 100);
}

function calculateStatusDistribution() {
    const distribution = {
        'Completed': 0,
        'Watching': 0,
        'Plan to Watch': 0,
        'Dropped': 0
    };

    animeData.forEach(anime => {
        if (distribution.hasOwnProperty(anime.userStatus)) {
            distribution[anime.userStatus]++;
        }
    });

    return distribution;
}

function calculateTypeDistribution() {
    const distribution = {};

    animeData.forEach(anime => {
        const type = anime.type || 'TV';
        distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
}

function calculateGenreStats() {
    const genreCount = {};

    animeData.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        }
    });

    // Sort by count and return top 10
    return Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [genre, count]) => {
            obj[genre] = count;
            return obj;
        }, {});
}

function calculateYearlyBreakdown() {
    const yearlyData = {};
    const currentYear = new Date().getFullYear();

    for (let year = 2020; year <= currentYear; year++) {
        yearlyData[year] = 0;
    }

    animeData.forEach(anime => {
        if (anime.finishDate) {
            const finishYear = new Date(anime.finishDate).getFullYear();
            if (yearlyData.hasOwnProperty(finishYear)) {
                yearlyData[finishYear]++;
            }
        }
    });

    return yearlyData;
}

function calculateScoreAnalysis() {
    const analysis = {
        totalRated: 0,
        average: 0,
        highest: { score: 0, title: '' },
        lowest: { score: 10, title: '' },
        scoreCounts: { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, '5 or less': 0 }
    };

    let totalScore = 0;
    let ratedCount = 0;

    animeData.forEach(anime => {
        if (anime.score && anime.score > 0) {
            ratedCount++;
            totalScore += anime.score;

            // Update highest score
            if (anime.score > analysis.highest.score) {
                analysis.highest = { score: anime.score, title: anime.title };
            }

            // Update lowest score
            if (anime.score < analysis.lowest.score) {
                analysis.lowest = { score: anime.score, title: anime.title };
            }

            // Count scores by range
            if (anime.score === 10) analysis.scoreCounts[10]++;
            else if (anime.score >= 9) analysis.scoreCounts[9]++;
            else if (anime.score >= 8) analysis.scoreCounts[8]++;
            else if (anime.score >= 7) analysis.scoreCounts[7]++;
            else if (anime.score >= 6) analysis.scoreCounts[6]++;
            else analysis.scoreCounts['5 or less']++;
        }
    });

    analysis.totalRated = ratedCount;
    analysis.average = ratedCount > 0 ? (totalScore / ratedCount).toFixed(1) : 0;

    return analysis;
}

// Initialize additional charts
function initStatisticsCharts() {
    // --- Completion Chart (Safe Destroy Before Recreate) ---
    let completionChart; // store instance globally

    function renderCompletionChart() {
        const completionCanvas = document.getElementById('completionChart');
        if (!completionCanvas) return;

        const completionCtx = completionCanvas.getContext('2d');

        // ✅ Destroy previous chart instance before reusing the canvas
        if (completionChart) {
            completionChart.destroy();
        }

        completionChart = new Chart(completionCtx, {
            type: 'bar',
            data: {
                labels: ['2023', '2024', '2025', '2026', '2027', '2028'],
                datasets: [{
                    label: 'Anime Completed',
                    data: calculateYearlyCompletion(),
                    backgroundColor: '#48bb78'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // ✅ Call this instead of creating the chart directly
    renderCompletionChart();

    // Score Distribution Chart
    const scoreDistributionCtx = document.getElementById('scoreDistributionChart')?.getContext('2d');
    if (scoreDistributionCtx) {
        scoreDistributionChart = new Chart(scoreDistributionCtx, {
            type: 'polarArea',
            data: {
                labels: ['10', '9', '8', '7', '6', '5 or less'],
                datasets: [{
                    data: calculateScoreDistribution(),
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(156, 163, 175, 0.8)'
                    ],
                    borderWidth: 2,
                    hoverBackgroundColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(156, 163, 175, 1)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                        }
                    }
                }
            }
        });
    }

    // Status Distribution Chart
    const statusCtx = document.getElementById('statusDistributionChart')?.getContext('2d');
    if (statusCtx) {
        statusDistributionChart = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(calculateStatusDistribution()),
                datasets: [{
                    data: Object.values(calculateStatusDistribution()),
                    backgroundColor: [
                        '#48bb78', // Completed - green
                        '#4299e1', // Watching - blue
                        '#ed8936', // Plan to Watch - orange
                        '#f56565'  // Dropped - red
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Type Distribution Chart
    const typeCtx = document.getElementById('typeDistributionChart')?.getContext('2d');
    if (typeCtx) {
        typeDistributionChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(calculateTypeDistribution()),
                datasets: [{
                    data: Object.values(calculateTypeDistribution()),
                    backgroundColor: [
                        '#6a5acd', '#70db70ff', '#20b2aa', '#ff7f50', '#48bb78'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Genre Stats Chart
    const genreCtx = document.getElementById('genreStatsChart')?.getContext('2d');
    if (genreCtx) {
        const genreStats = calculateGenreStats();
        genreStatsChart = new Chart(genreCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(genreStats),
                datasets: [{
                    label: 'Number of Anime',
                    data: Object.values(genreStats),
                    backgroundColor: 'rgba(106, 90, 205, 0.7)',
                    borderColor: 'rgba(106, 90, 205, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--gray')
                        }
                    },
                    y: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Initialize new charts
    initNewCharts();
}
// Initialize new charts
function initNewCharts(selectedYear = new Date().getFullYear()) {
    // === EPISODES WATCHED OVER TIME CHART ===
    const episodesOverTimeCtx = document
        .getElementById("episodesOverTimeChart")
        ?.getContext("2d");

    if (!episodesOverTimeCtx) return;

    // 🧮 Normalize any possible date format to safe YYYY-MM-DD local date
    function normalizeLocalDate(rawDate) {
        if (!rawDate) return null;

        // Add missing day if user saved just YYYY-MM
        if (/^\d{4}-\d{2}$/.test(rawDate)) rawDate += "-01";

        // Pad months/days if needed
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(rawDate)) {
            const [yy, mm, dd] = rawDate.split("-");
            rawDate = `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        }

        const [y, m, d] = rawDate.split("-").map(Number);
        if (!y || !m) return null;

        const date = new Date(y, m - 1, d || 1);
        return isNaN(date) ? null : date;
    }

    // 🧮 Calculate episodes watched per month for the selected year
    function calculateEpisodesOverTime(year = selectedYear) {
        const monthlyEpisodes = Array(12).fill(0);
        const seen = new Set();

        animeData.forEach((anime) => {
            if (anime.userStatus !== "Completed" || !anime.finishDate) return;

            const finishDate = normalizeLocalDate(anime.finishDate);
            if (!finishDate) return;

            if (finishDate.getFullYear() !== year) return;
            if (finishDate > new Date()) return;

            const monthIndex = finishDate.getMonth();
            if (monthIndex < 0 || monthIndex > 11) return;

            // Local-safe unique key
            const key = `${anime.title || anime.name}-${finishDate.getFullYear()}-${String(
                finishDate.getMonth() + 1
            ).padStart(2, "0")}-${String(finishDate.getDate()).padStart(2, "0")}`;
            if (seen.has(key)) return;
            seen.add(key);

            const eps = Number(anime.episodes) || 0;
            monthlyEpisodes[monthIndex] += eps;
        });

        return monthlyEpisodes.map((e) => Math.round(e));
    }

    // 🧮 Calculate total episodes watched for the selected year
    function calculateTotalEpisodesThisYear(year = selectedYear) {
        let totalEpisodes = 0;
        const seen = new Set();

        animeData.forEach((anime) => {
            if (anime.userStatus !== "Completed" || !anime.finishDate) return;

            const finishDate = normalizeLocalDate(anime.finishDate);
            if (!finishDate) return;

            if (finishDate.getFullYear() !== year) return;
            if (finishDate > new Date()) return;

            const key = `${anime.title || anime.name}-${finishDate.getFullYear()}-${String(
                finishDate.getMonth() + 1
            ).padStart(2, "0")}-${String(finishDate.getDate()).padStart(2, "0")}`;
            if (seen.has(key)) return;
            seen.add(key);

            totalEpisodes += Number(anime.episodes) || 0;
        });

        return Math.round(totalEpisodes);
    }

    // 🎨 Create the Episodes Over Time chart
    episodesOverTimeChart = new Chart(episodesOverTimeCtx, {
        type: "line",
        data: {
            labels: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ],
            datasets: [
                {
                    label: `Episodes Watched (${selectedYear})`,
                    data: calculateEpisodesOverTime(),
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    borderColor: "rgba(99, 102, 241, 1)",
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: "rgba(99, 102, 241, 1)",
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
                x: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                },
            },
            plugins: { legend: { display: false } },
        },
    });

    // 🕒 Display total episodes watched this year
    const totalEpisodesElement = document.getElementById("yearly-total-episodes");
    if (totalEpisodesElement) {
        totalEpisodesElement.textContent = `Total Eps (${selectedYear}): ${calculateTotalEpisodesThisYear()}`;
    }

    // 🌀 Auto-update chart + total when data changes
    function updateEpisodesOverTimeDisplay(year = selectedYear) {
        if (!episodesOverTimeChart) return;

        episodesOverTimeChart.data.datasets[0].data = calculateEpisodesOverTime(year);
        episodesOverTimeChart.data.datasets[0].label = `Episodes Watched (${year})`;
        episodesOverTimeChart.update();

        const totalEpisodes = calculateTotalEpisodesThisYear(year);
        if (totalEpisodesElement) {
            totalEpisodesElement.textContent = `Total Eps (${year}): ${totalEpisodes}`;
        }
    }

    // Make updater globally accessible
    window.updateEpisodesOverTimeDisplay = updateEpisodesOverTimeDisplay;
}

// === WATCH TIME BY MONTH CHART (FIXED & MOBILE SAFE) ===

const watchTimeByMonthCanvas =
    document.getElementById('watchTimeByMonthChart');

if (watchTimeByMonthCanvas && typeof Chart !== 'undefined') {

    const watchTimeByMonthCtx = watchTimeByMonthCanvas.getContext('2d');

    function getCurrentYearSafe() {
        return new Date().getFullYear();
    }

    // 🧮 Calculate monthly hours (ALWAYS fresh year)
    function calculateWatchTimeByMonth() {
        const currentYear = getCurrentYearSafe();
        const monthlyHours = Array(12).fill(0);

        animeData.forEach(anime => {
            if (anime.userStatus === "Completed" && anime.finishDate) {
                const finishDate = new Date(anime.finishDate);
                const monthIndex = finishDate.getMonth();

                if (finishDate.getFullYear() === currentYear) {
                    if (anime.type === "Movie") {
                        monthlyHours[monthIndex] += (anime.duration || 120) / 60;
                    } else {
                        monthlyHours[monthIndex] += ((anime.episodes || 0) * 20) / 60;
                    }
                }
            }
        });

        return monthlyHours.map(h => Math.round(h));
    }

    function calculateTotalHoursThisYear() {
        const currentYear = getCurrentYearSafe();
        let totalHours = 0;

        animeData.forEach(anime => {
            if (anime.userStatus === "Completed" && anime.finishDate) {
                const finishDate = new Date(anime.finishDate);
                if (finishDate.getFullYear() === currentYear) {
                    if (anime.type === "Movie") {
                        totalHours += (anime.duration || 120) / 60;
                    } else {
                        totalHours += ((anime.episodes || 0) * 20) / 60;
                    }
                }
            }
        });

        return Math.round(totalHours);
    }

    function renderWatchTimeChart() {

        if (watchTimeByMonthChart) {
            watchTimeByMonthChart.destroy();
        }

        watchTimeByMonthChart = new Chart(watchTimeByMonthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    data: calculateWatchTimeByMonth(),
                    borderColor: 'rgba(99, 241, 217, 1)',
                    backgroundColor: 'rgba(32, 229, 206, 0.25)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: {}
                }
            }
        });

        const totalEl = document.getElementById('monthly-total-hours');
        if (totalEl) {
            totalEl.textContent =
                `Total Hrs (${getCurrentYearSafe()}): ${calculateTotalHoursThisYear()}`;
        }
    }

    // Initial render
    renderWatchTimeChart();

    // Public updater
    window.updateWatchTimeDisplay = renderWatchTimeChart;

    // 📱 Mobile resize fix
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderWatchTimeChart, 300);
    });
}


// Average Score by Genre Chart
const avgScoreByGenreCtx = document.getElementById('avgScoreByGenreChart')?.getContext('2d');
if (avgScoreByGenreCtx) {
    const genreScores = {};

    animeData.forEach(anime => {
        if (anime.genres && anime.score) {
            anime.genres.forEach(g => {
                if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
                genreScores[g].total += anime.score;
                genreScores[g].count++;
            });
        }
    });

    const avgScores = Object.keys(genreScores).map(g => (genreScores[g].total / genreScores[g].count).toFixed(1));

    new Chart(avgScoreByGenreCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(genreScores),
            datasets: [{
                label: 'Average Score',
                data: avgScores,
                backgroundColor: 'rgba(106, 90, 205, 0.7)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--gray')
                    }
                },
                y: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    }
                }
            }
        }
    });
}

// Completion Rate by Year Chart
const completionRateCtx = document.getElementById('completionRateByYearChart')?.getContext('2d');
if (completionRateCtx) {
    // Collect data
    const yearStats = {};

    animeData.forEach(anime => {
        if (anime.finishDate) {
            const year = new Date(anime.finishDate).getFullYear();
            if (!yearStats[year]) yearStats[year] = { completed: 0, total: 0 };
            yearStats[year].total++;
            if (anime.userStatus === 'Completed') {
                yearStats[year].completed++;
            }
        }
    });

    const years = Object.keys(yearStats).sort();
    const completionRates = years.map(y => {
        const { completed, total } = yearStats[y];
        return ((completed / total) * 100).toFixed(1);
    });

    // Create chart
    new Chart(completionRateCtx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Completion Rate (%)',
                data: completionRates,
                backgroundColor: 'rgba(106, 90, 205, 0.7)',
                borderColor: 'rgba(106, 90, 205, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Completion Rate (%)',
                        color: '#aaa'
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--gray')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Calculate monthly labels for charts
function calculateMonthlyLabels() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Return last 12 months
    const labels = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(`${months[date.getMonth()]} ${date.getFullYear()}`);
    }

    return labels;
}

// Calculate episodes watched over time
function calculateEpisodesOverTime() {
    const now = new Date();
    const data = Array(12).fill(0);

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const finishYear = finishDate.getFullYear();
            const finishMonth = finishDate.getMonth();

            // Check if anime was completed in the last 12 months
            const monthsAgo = (now.getFullYear() - finishYear) * 12 + (now.getMonth() - finishMonth);
            if (monthsAgo >= 0 && monthsAgo < 12) {
                // For TV series, count episodes; for movies, count as 1
                const episodeCount = anime.type === 'Movie' ? 1 : (anime.episodes || 0);
                data[11 - monthsAgo] += episodeCount;
            }
        }
    });

    return data;
}

// Calculate watch time by month
function calculateWatchTimeByMonth() {
    const now = new Date();
    const data = Array(12).fill(0);

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const finishYear = finishDate.getFullYear();
            const finishMonth = finishDate.getMonth();

            // Check if anime was completed in the last 12 months
            const monthsAgo = (now.getFullYear() - finishYear) * 12 + (now.getMonth() - finishMonth);
            if (monthsAgo >= 0 && monthsAgo < 12) {
                let watchTime = 0;
                if (anime.type === 'Movie') {
                    watchTime = (anime.duration || 120) / 60; // Convert minutes to hours
                } else {
                    const episodeDuration = anime.duration || 20;
                    watchTime = ((anime.episodes || 0) * episodeDuration) / 60; // Convert minutes to hours
                }
                data[11 - monthsAgo] += watchTime;
            }
        }
    });

    return data.map(hours => parseFloat(hours.toFixed(1)));
}

// Update statistics tables
function updateStatisticsTables() {
    const stats = calculateStatistics();

    // Update overview cards if they exist
    const totalAnimeStats = document.getElementById('total-anime-stats');
    const totalHoursStats = document.getElementById('total-hours-stats');
    const avgScoreStats = document.getElementById('avg-score-stats');
    const completionRate = document.getElementById('completion-rate');

    if (totalAnimeStats) totalAnimeStats.textContent = stats.totalAnime;
    if (totalHoursStats) totalHoursStats.textContent = stats.totalHours;
    if (avgScoreStats) avgScoreStats.textContent = stats.averageScore;
    if (completionRate) completionRate.textContent = stats.completionRate + '%';

    // Update yearly breakdown
    const yearlyBreakdownEl = document.getElementById('yearlyBreakdown');
    if (yearlyBreakdownEl) {
        yearlyBreakdownEl.innerHTML = Object.entries(stats.yearlyBreakdown)
            .map(([year, count]) => `
                <div class="stat-row">
                    <div class="stat-label-small">${year}</div>
                    <div class="stat-progress">
                        <div class="stat-progress-bar" style="width: ${(count / Math.max(...Object.values(stats.yearlyBreakdown))) * 100}%"></div>
                    </div>
                    <div class="stat-value-small">${count}</div>
                </div>
            `).join('');
    }

    // Update score analysis
    const scoreAnalysisEl = document.getElementById('scoreAnalysis');
    if (scoreAnalysisEl) {
        scoreAnalysisEl.innerHTML = `
            <div class="stat-row">
                <div class="stat-label-small">Rated Anime</div>
                <div class="stat-value-small">${stats.scoreAnalysis.totalRated}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Average Score</div>
                <div class="stat-value-small">${stats.scoreAnalysis.average}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Highest Rated</div>
                <div class="stat-value-small">${stats.scoreAnalysis.highest.score} (${stats.scoreAnalysis.highest.title})</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Lowest Rated</div>
                <div class="stat-value-small">${stats.scoreAnalysis.lowest.score} (${stats.scoreAnalysis.lowest.title})</div>
            </div>
        `;
    }
}
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

// Update sidebar user info with data from localStorage
function updateSidebarUserInfo() {
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const sidebarUsername = document.querySelector('.sidebar-username');
    const sidebarUserStats = document.querySelector('.sidebar-user-stats');

    // ✅ Get saved profile from correct localStorage key
    const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'AnimeFan',
        avatar: 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff'
    };

    const savedName = savedProfile.name;
    const savedAvatar = savedProfile.avatar;

    // 🧮 Calculate totals
    const totalAnime = animeData.length;
    const totalHours = calculateTotalHours();
    const totalEpisodes = calculateTotalEpisodes();

    // 🖼️ Update sidebar info
    if (sidebarAvatar) {
        sidebarAvatar.src = savedAvatar;
        sidebarAvatar.alt = savedName;
    }

    if (sidebarUsername) {
        sidebarUsername.textContent = savedName;
    }

    if (sidebarUserStats) {
        sidebarUserStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-number">${totalAnime}</span>
                <span class="stat-label">Anime</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" id="toggleStat">
                <span class="stat-number" id="toggleNumber" title="${totalHours.toLocaleString()}">
                    ${formatNumberShort(totalHours)}
                </span>
                <span class="stat-label" id="toggleLabel">Hrs</span>
            </div>
        `;
    }

    // 🌀 Animate + hover reveal
    const numberEl = document.getElementById('toggleNumber');
    const labelEl = document.getElementById('toggleLabel');
    let showing = 'hours';

    if (numberEl && labelEl) {
        setInterval(() => {
            numberEl.classList.add('fade-out');
            labelEl.classList.add('fade-out');

            setTimeout(() => {
                if (showing === 'hours') {
                    numberEl.textContent = formatNumberShort(totalEpisodes);
                    numberEl.title = totalEpisodes.toLocaleString();
                    labelEl.textContent = 'Eps';
                    showing = 'episodes';
                } else {
                    numberEl.textContent = formatNumberShort(totalHours);
                    numberEl.title = totalHours.toLocaleString();
                    labelEl.textContent = 'Hrs';
                    showing = 'hours';
                }

                numberEl.classList.remove('fade-out');
                labelEl.classList.remove('fade-out');
                numberEl.classList.add('fade-in');
                labelEl.classList.add('fade-in');

                setTimeout(() => {
                    numberEl.classList.remove('fade-in');
                    labelEl.classList.remove('fade-in');
                }, 400);
            }, 400);
        }, 15000);
    }

    // ✅ Also update top bar for consistency
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
                animateCounter(totalHoursEl, totals.totalHours, "Total Hrs in 2025 ");
                animateCounter(totalEpisodesEl, totals.totalEpisodes, "Total Eps in 2025 ");
            }, 400);
        });
    });

    // Recalculate dynamically if data changes
    window.addEventListener("storage", () => {
        const totals = getYearlyTotals();
        animateCounter(totalHoursEl, totals.totalHours, "Total Hrs in 2025 ");
        animateCounter(totalEpisodesEl, totals.totalEpisodes, "Total Eps in 2025 ");
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

    // 🔢 Short format helper
    const formatShort = num => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
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

        // 🔁 Fade-up switch every 60 s
        setInterval(() => {
            // trigger fade-up class
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

                // reset position to bottom then fade-up in
                toggleNumberEl.classList.remove('fade-up-out');
                toggleLabelEl.classList.remove('fade-up-out');
                toggleNumberEl.classList.add('fade-up-in');
                toggleLabelEl.classList.add('fade-up-in');

                // remove class after animation
                setTimeout(() => {
                    toggleNumberEl.classList.remove('fade-up-in');
                    toggleLabelEl.classList.remove('fade-up-in');
                }, 400);

                showingHours = !showingHours;
            }, 350);
        }, 15000);
    }
}


/* === 🚀 Auto-update sidebar when page loads === */
// This is called from startAnimationsAfterLoader, no need to listen here

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
            if (!section || !container) return;

            const watchingList = (typeof animeData !== "undefined" && Array.isArray(animeData))
                ? animeData.filter(a => a.userStatus?.toLowerCase() === 'watching')
                : [];

            // 🟢 Hide or show the whole section
            if (watchingList.length === 0) {
                section.style.display = 'none';
                return;
            } else {
                section.style.display = '';
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
// GITHUB-STYLE ACTIVITY HEATMAP 
// =============================================
function renderActivityHeatmap(animeData) {
    const ctx = document.getElementById("activityHeatmapChart")?.getContext("2d");
    if (!ctx) return;

    // Destroy old chart before drawing new one
    if (window.activityByDayChartInstance) window.activityByDayChartInstance.destroy();

    // 🗓 Prepare last 56 days (8 weeks)
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 55);

    const allDays = [];
    for (let i = 0; i < 56; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        allDays.push(d);
    }

    //  Count updates per date
    const dayCounts = {};
    animeData.forEach(a => {
        if (!a.updatedAt) return;
        const dateStr = new Date(a.updatedAt).toISOString().split("T")[0];
        dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
    });

    //  heatmap
    const data = allDays.map((d, i) => ({
        x: Math.floor(i / 7), // week index
        y: d.getDay(),        // weekday index
        v: dayCounts[d.toISOString().split("T")[0]] || 0,
        date: d.toISOString().split("T")[0]
    }));

    //  GitHub color scale
    const colorScale = (v) => {
        if (v === 0) return "rgba(40,44,52,0.4)";
        if (v < 2) return "#9be9a8";
        if (v < 4) return "#40c463";
        if (v < 6) return "#30a14e";
        return "#216e39";
    };

    //  Drawing heatmap
    window.activityByDayChartInstance = new Chart(ctx, {
        type: "matrix",
        data: {
            datasets: [{
                label: "Anime Activity",
                data,
                backgroundColor: c => colorScale(c.raw.v),
                borderColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                width: ctx => {
                    const ca = ctx.chart.chartArea;
                    return ca ? (ca.width / 8) - 4 : 20;
                },
                height: ctx => {
                    const ca = ctx.chart.chartArea;
                    return ca ? (ca.height / 7) - 4 : 20;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    offset: true,
                    grid: { display: false },
                    ticks: { display: false }
                },
                y: {
                    reverse: true,
                    ticks: {
                        callback: (val) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][val],
                        color: "#ccc",
                        font: { size: 11 }
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: c => c[0].raw.date,
                        label: c => `${c.raw.v} update${c.raw.v !== 1 ? "s" : ""}`
                    }
                }
            }
        }
    });

    //  Most active day text
    const maxDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const text = document.getElementById("mostActiveDayText");
    if (text) {
        if (maxDay) text.innerHTML = `<strong>🔥 Most Active:</strong> ${maxDay[0]} (${maxDay[1]} updates)`;
        else text.innerHTML = `<em>No activity yet.</em>`;
    }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    if (typeof animeData !== "undefined" && Array.isArray(animeData)) {
        renderActivityHeatmap(animeData);
    }
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

/* =====================================
    NOTIFICATIONS
   ===================================== */

(function () {
    // Get elements safely (NO searching, NO loops)
    const notifBtn = document.getElementById('notif-btn');
    const notifPanel = document.getElementById('notif-panel');
    const notifList = document.getElementById('notif-list');
    const notifCount = document.getElementById('notif-count');
    const clearBtn = document.getElementById('clear-notifs');

    // If notification UI does not exist, exit silently
    if (!notifBtn || !notifPanel || !notifList) return;

    // Load stored notifications
    let notifications =
        JSON.parse(localStorage.getItem('userUpdateNotifications')) || [];

    // Toggle notification panel
    notifBtn.onclick = function () {
        notifPanel.classList.toggle('hidden');
    };

    // Clear notifications
    if (clearBtn) {
        clearBtn.onclick = function () {
            notifications = [];
            localStorage.removeItem('userUpdateNotifications');
            renderNotifications();
        };
    }

    // Render notifications
    function renderNotifications() {
        notifList.innerHTML = '';

        if (notifications.length === 0) {
            notifList.innerHTML =
                '<div class="notif-item">No new updates</div>';
            if (notifCount) notifCount.classList.add('hidden');
            return;
        }

        notifications.forEach(n => {
            const div = document.createElement('div');
            div.className = 'notif-item';
            div.innerHTML = `
                <strong>${n.anime.title}</strong><br>
                ${n.message}
            `;
            notifList.appendChild(div);
        });

        if (notifCount) {
            notifCount.textContent = notifications.length;
            notifCount.classList.remove('hidden');
        }
    }

    // 🔥 Hook into your existing update checker
    const originalCheckForUserUpdates = window.checkForUserUpdates;

    if (typeof originalCheckForUserUpdates === 'function') {
        window.checkForUserUpdates = async function () {
            const updates = await originalCheckForUserUpdates();

            if (Array.isArray(updates) && updates.length > 0) {
                notifications.unshift(...updates);
                localStorage.setItem(
                    'userUpdateNotifications',
                    JSON.stringify(notifications)
                );
                renderNotifications();
            }

            return updates;
        };
    }

    // Initial render
    renderNotifications();
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

window.searchAnime = async function () {
    const query = animeTitleInput.value.trim();

    if (query.length < 3) {
        searchResults.style.display = "none";
        return;
    }

    searchLoading.style.display = "block";
    searchResults.style.display = "none";
    searchResults.innerHTML = "";

    try {
        const res = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query: `
                query ($search: String) {
                  Page(perPage: 10) {
                    media(search: $search, type: ANIME) {
                      title {
                        romaji
                        english
                      }
                      episodes
                      format
                      averageScore
                      genres
                      coverImage {
                        large
                      }
                    }
                  }
                }`,
                variables: { search: query }
            })
        });

        const json = await res.json();
        const results = json?.data?.Page?.media || [];

        if (!results.length) {
            searchResults.innerHTML =
                `<div style="padding:10px;text-align:center;">No results found</div>`;
        } else {
            results.forEach(anime => {
                const item = document.createElement("div");
                item.className = "search-result-item";
                item.innerHTML = `
                    <div style="display:flex;gap:10px;align-items:center;">
                        <img src="${anime.coverImage.large}"
                             style="width:40px;height:60px;border-radius:4px;">
                        <div>
                            <div style="font-weight:600;">
                                ${anime.title.english || anime.title.romaji}
                            </div>
                            <small>
                                ${anime.format} • ${anime.episodes || "?"} eps • ⭐ ${(anime.averageScore / 10) || "N/A"}
                            </small>
                        </div>
                    </div>
                `;

                item.onclick = () => {
                    const normalized = normalizeAnimeData(anime);
                    selectAnimeFromSearch(normalized);
                    searchResults.style.display = "none";
                };

                searchResults.appendChild(item);
            });
        }

        searchResults.style.display = "block";
    } catch (err) {
        console.error("AniList search failed:", err);
        searchResults.innerHTML =
            `<div style="padding:10px;text-align:center;">Search unavailable</div>`;
        searchResults.style.display = "block";
    } finally {
        searchLoading.style.display = "none";
    }
};


/* ==================================================
   ANIPULSE RECAP SYSTEM (12-SLIDE COMPREHENSIVE)
================================================== */

/* ---------- CONFIG ---------- */
const RECAP_ACTIVE = true;          // Enable recaps
const RECAP_WINDOW_DAYS = 7;        // Recaps available first 7 days of each month
const TEST_MODE = true;           // Set to true to force Jan-only for testing

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
        return d.getMonth() === 0 && d.getDate() <= 21;
    }

    // PRODUCTION: First 7 days of ANY month
    const d = new Date();
    return d.getDate() <= RECAP_WINDOW_DAYS;
}

function getPreviousMonthForRecap() {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = Jan, 1 = Feb, etc.
    const currentYear = now.getFullYear();

    let targetMonth, targetYear;

    if (currentMonth === 0) {
        // January: show December of previous year
        targetMonth = 12;
        targetYear = currentYear - 1;
    } else {
        // Other months: show previous month (1-based for our function)
        targetMonth = currentMonth; // February (1) shows January (1 in 1-based)
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

/* ==================================================
   ADVANCED STATS BUILDER (12 SLIDES)
================================================== */

function buildComprehensiveRecap(list, type, periodInfo) {
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
            monthName: periodInfo.month ? new Date(periodInfo.year, periodInfo.month - 1).toLocaleString('default', { month: 'long' }) : '',
            year: periodInfo.year
        };
    }

    // Basic stats
    const totalEpisodes = list.reduce((sum, a) => sum + (a.episodes || 0), 0);
    const totalMinutes = list.reduce((sum, a) => sum + (a.episodes * (a.duration || 0)), 0);
    const totalHours = totalMinutes / 60;

    // Average score
    const scoredAnime = list.filter(a => a.score && a.score > 0);
    const avgScore = scoredAnime.length > 0
        ? (scoredAnime.reduce((sum, a) => sum + a.score, 0) / scoredAnime.length).toFixed(1)
        : 0;

    // Genre analysis
    const genres = {};
    list.forEach(a => (a.genres || []).forEach(g => (genres[g] = (genres[g] || 0) + 1)));
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]);

    // Top anime (by score)
    const animeByScore = [...list]
        .filter(a => a.score && a.score > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    // Average episodes per day calculation
    const daysInPeriod = type === 'Yearly' ? 365 :
        periodInfo.month ? new Date(periodInfo.year, periodInfo.month, 0).getDate() : 30;
    const avgEpisodesPerDay = (totalEpisodes / daysInPeriod).toFixed(1);

    // Average duration per episode
    const avgDuration = (list.reduce((sum, a) => sum + (a.duration || 0), 0) / list.length).toFixed(0);

    // Find busiest month (for yearly recaps)
    let completionMonth = null;
    if (type === 'Yearly') {
        const months = {};
        list.forEach(a => {
            const time = getCompletionTime(a);
            if (time) {
                const month = new Date(time).getMonth();
                months[month] = (months[month] || 0) + 1;
            }
        });
        const busiest = Object.entries(months).sort((a, b) => b[1] - a[1])[0];
        if (busiest) {
            completionMonth = new Date(periodInfo.year, parseInt(busiest[0]), 1)
                .toLocaleString('default', { month: 'long' });
        }
    }

    // Estimate streak (simplified - days with at least one episode completed)
    const completionDays = new Set();
    list.forEach(a => {
        const time = getCompletionTime(a);
        if (time) {
            const date = new Date(time).toISOString().split('T')[0];
            completionDays.add(date);
        }
    });
    const streakDays = completionDays.size;

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
        streakDays,
        monthName: periodInfo.month ? new Date(periodInfo.year, periodInfo.month - 1).toLocaleString('default', { month: 'long' }) : '',
        year: periodInfo.year,
        type: type
    };
}

/* ==================================================
   RECAP GENERATORS
================================================== */

function getMonthlyRecap(year, month) {
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 0, 23, 59, 59).getTime();

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
        `<div class="slide-icon"><i class="fas fa-calendar-alt"></i></div>
     <h1>${isYearly ? data.year : data.monthName + ' ' + data.year}</h1>
     <p class="subtitle">${type} Anime Recap</p>
     <p class="hint">Let's look back at your journey</p>
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
        const today = new Date();
        createToast(`<i class="fas fa-calendar"></i> Recaps available 1-${RECAP_WINDOW_DAYS} of each month`, {
            type: "info"
        });
        return;
    }

    // Always try 2025 yearly recap first
    const yearlyYear = 2025;
    const yearlyData = getYearlyRecap(yearlyYear);

    if (yearlyData.totalAnime > 0) {
        openRecap("Yearly", yearlyData, { year: yearlyYear });
        return;
    }

    // If no 2025 yearly, try current year-1
    const prevYear = getPreviousYearForRecap();
    if (prevYear !== 2025) {
        const prevYearData = getYearlyRecap(prevYear);
        if (prevYearData.totalAnime > 0) {
            openRecap("Yearly", prevYearData, { year: prevYear });
            return;
        }
    }

    // Fallback to monthly recap
    const { month, year } = getPreviousMonthForRecap();
    const monthlyData = getMonthlyRecap(year, month);

    if (monthlyData.totalAnime > 0) {
        openRecap("Monthly", monthlyData, { month, year });
    } else {
        createToast('<i class="fas fa-info-circle"></i> No completed anime found for recap periods', {
            type: "info"
        });
    }
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
                createToast(`<i class="fas fa-chart-bar"></i> Your ${monthName} Recap is ready!`, {
                    actionText: '<i class="fas fa-eye"></i> View 12-Slide Recap',
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
// Loader with Animation Trigger System (Mobile Safe)
// ==================================================

let animationsStarted = false;

function startAnimationsAfterLoader() {
  if (animationsStarted) return;
  animationsStarted = true;

  // 🎬 Dashboard updates
  try { updateStats(); } catch(e) {}
  try { initCharts(); } catch(e) {}
  try { updateTopRatedAnime(); } catch(e) {}
  try { updateCurrentMonthAnime(); } catch(e) {}
  try { updateRecentActivity(); } catch(e) {}
  try { updateAnimeDisplay(); } catch(e) {}
  try { updateTotalAnimeCountAllMonths(); } catch(e) {}
  try { updateSidebarUserInfo(); } catch(e) {}
  try { updateCurrentDate(); } catch(e) {}

  // 🎬 Overview stats count-up
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
      try { completedEl && animateCount(completedEl, completed, 4500); } catch(e) {}
      try { moviesEl && animateCount(moviesEl, movies, 4500); } catch(e) {}
      try { episodesEl && animateCount(episodesEl, episodes, 4500); } catch(e) {}
      try { hoursEl && animateCount(hoursEl, hours, 4500); } catch(e) {}
    }, 400);
  }, 200);

  // 🎬 Yearly totals animation
  setTimeout(() => {
    const totalHoursEl = document.getElementById("monthly-total-hours");
    const totalEpisodesEl = document.getElementById("yearly-total-episodes");

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

    function animateCounter(el, targetValue, label) {
      if (!el) return;
      const duration = 4000;
      const startValue = 0;
      const startTime = performance.now();

      function easeOut(t) { return t * (2 - t); }

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

    animateCounter(totalHoursEl, Math.round(totalHours), "Total Hrs in 2025");
    animateCounter(totalEpisodesEl, totalEpisodes, "Total Eps in 2025");
  }, 400);

  // 🎬 Heatmap rendering
  setTimeout(() => {
    try { renderActivityHeatmap(JSON.parse(localStorage.getItem("animeData")) || []); } catch(e) {}
  }, 500);

  // 🎬 Optional searchAnime call
  try { typeof searchAnime === "function" && searchAnime(); } catch(e) {}
}

// ==================================================
// Loader fail-safe
// ==================================================
setTimeout(() => {
  const loader = document.getElementById("app-loader");
  if (loader) {
    loader.style.display = "none";
    document.body.classList.remove("loading");
    startAnimationsAfterLoader();
  }
}, 6000);

// ==================================================
// Loader logic
// ==================================================
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("app-loader");
  const progressBar = document.getElementById("loader-progress");
  const percentText = document.getElementById("loader-percent");

  if (!loader || !progressBar || !percentText) {
    startAnimationsAfterLoader();
    return;
  }

  document.body.classList.add("loading");

  let progress = 0;

  const fakeLoader = setInterval(() => {
    progress += Math.random() * 10 + 5;

    if (progress >= 100) {
      progress = 100;
      clearInterval(fakeLoader);

      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
        document.body.classList.remove("loading");
        startAnimationsAfterLoader();
      }, 400);
    }

    progressBar.style.width = progress + "%";
    percentText.textContent = Math.floor(progress) + "%";
  }, 200);
});


// Initialize the app with saved theme (theme loads before loader)
initializeTheme();