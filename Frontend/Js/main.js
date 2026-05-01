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
                            return legendItem.text !== 'Trend Line';
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
                                    const arrow = isPositive ? '▲' : (percentChange < 0 ? '▼' : '●');
                                    const changeText = percentChange > 0
                                        ? `${arrow} ${percentChange.toFixed(1)}% increase`
                                        : percentChange < 0
                                            ? `${arrow} ${Math.abs(percentChange).toFixed(1)}% decrease`
                                            : `● No change`;
                                    return [
                                        `Completed: ${value} anime`,
                                        `Trend: ${changeText}`
                                    ];
                                }
                                return `Completed: ${value} anime`;
                            }
                            return null;
                        },
                        footer: function (tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const currentValue = monthlyBarData[dataIndex];
                            const prevValue = dataIndex > 0 ? monthlyBarData[dataIndex - 1] : null;
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                            if (dataIndex > currentMonth) {
                                return `Coming in ${months[dataIndex]}`;
                            }

                            if (dataIndex > 0 && prevValue !== null && dataIndex <= currentMonth) {
                                const diff = currentValue - prevValue;
                                if (diff > 0) {
                                    return `+${diff} compared to ${months[dataIndex - 1]}`;
                                } else if (diff < 0) {
                                    return `${diff} compared to ${months[dataIndex - 1]}`;
                                }
                                return `Same as ${months[dataIndex - 1]}`;
                            }
                            return `First month of ${currentYear}`;
                        }
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

    // Custom hover effect for line points
    const canvasElement = document.getElementById('monthlyProgressChart');

    // Update tooltip style based on theme
    if (!isDark) {
        lineTooltip.style.background = 'linear-gradient(135deg, #ffffff, #f8fafc)';
        lineTooltip.style.color = '#1e293b';
        lineTooltip.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        lineTooltip.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
    }

    const showLineTooltip = (e) => {
        if (!window.monthlyProgressChart) return;

        const activeElements = window.monthlyProgressChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);

        if (activeElements && activeElements.length > 0) {
            const element = activeElements[0];
            const datasetIndex = element.datasetIndex;
            const dataIndex = element.index;

            if (dataIndex > currentMonth) {
                lineTooltip.style.opacity = '0';
                return;
            }

            if (datasetIndex === 1) {
                const value = monthlyBarData[dataIndex];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = months[dataIndex];
                const percentChange = percentageChanges[dataIndex];

                let tooltipText = '';
                let tooltipColor = '';

                if (dataIndex === 0) {
                    tooltipText = `Starting Point: ${value} anime in ${month}`;
                    tooltipColor = '#94A3B8';
                } else if (percentChange !== null && dataIndex <= currentMonth) {
                    const isIncrease = percentChange > 0;
                    const trendIcon = isIncrease ? '▲' : (percentChange < 0 ? '▼' : '●');
                    const changeValue = Math.abs(percentChange).toFixed(1);
                    const changeWord = percentChange > 0 ? 'increase' : (percentChange < 0 ? 'decrease' : 'no change');
                    tooltipColor = isIncrease ? '#10B981' : (percentChange < 0 ? '#EF4444' : '#94A3B8');
                    tooltipText = `${trendIcon} ${percentChange > 0 ? '+' : ''}${changeValue}% ${changeWord} from ${months[dataIndex - 1]}`;
                }

                lineTooltip.innerHTML = tooltipText;
                lineTooltip.style.borderColor = tooltipColor + '40';
                lineTooltip.style.opacity = '1';
                lineTooltip.style.left = (e.clientX + 15) + 'px';
                lineTooltip.style.top = (e.clientY - 40) + 'px';
                canvasElement.style.cursor = 'pointer';
            } else {
                lineTooltip.style.opacity = '0';
                canvasElement.style.cursor = 'default';
            }
        } else {
            lineTooltip.style.opacity = '0';
            canvasElement.style.cursor = 'default';
        }
    };

    if (canvasElement) {
        canvasElement.addEventListener('mousemove', showLineTooltip);
        canvasElement.addEventListener('mouseleave', () => {
            canvasElement.style.cursor = 'default';
        });
    }

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
        .slice(0, 9);

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
        if (anime.finishDate) {
            const parts = anime.finishDate.split('-');
            if (parts.length >= 2) {
                const [year, month, day] = parts;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                completionDate = `${monthNames[parseInt(month) - 1]} ${year}`;
                if (day) {
                    completionTooltip = `Completed on: ${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
                }
            }
        }

        // Format creation date for tooltip
        let creationTooltip = '';
        if (anime.createdAt) {
            const parts = anime.createdAt.split('-');
            if (parts.length >= 2) {
                const [year, month, day] = parts;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                creationTooltip = `Added on: ${monthNames[parseInt(month) - 1]} ${parseInt(day || '1')}, ${year}`;
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

        // Combine tooltips
        const combinedTooltip = [creationTooltip, completionTooltip].filter(Boolean).join(' | ');

        const titleWithCover = `
            <div class="anime-title-cell" title="${combinedTooltip.replace(/"/g, '&quot;')}">
                <img src="${anime.cover || 'https://via.placeholder.com/50x70/6a5acd/ffffff?text=No+Image'}"
                     alt="${escapedTitle}" class="anime-cover"
                     onerror="this.src='https://via.placeholder.com/50x70/6a5acd/ffffff?text=No+Image'">
                <div class="anime-info">
                    <div class="anime-title" title="${escapedTitle}">${safeTitle}</div>
                    ${anime.genres && anime.genres.length > 0
                ? `<div class="anime-genres">${anime.genres.slice(0, 3).join(', ').replace(/"/g, '&quot;')}</div>`
                : ''}
                </div>
            </div>
        `;

        return `
            <tr data-id="${anime.id}" class="clickable-row" style="cursor: pointer;">
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
        // Find the closest row with data-id attribute
        const row = e.target.closest('tr[data-id]');
        if (!row) return;

        // Don't trigger if clicking on interactive elements
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
    
    // Get selected date from form
    const selectedYear = document.getElementById('animeYear')?.value;
    const selectedMonth = document.getElementById('animeMonth')?.value;
    
    // Simple Nepal timestamp function
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
    
    // Handle finish date - use selected date if provided, otherwise keep existing or null
    let finishDate = null;
    let finishTimestamp = null;
    
    if (status === 'Completed') {
        if (selectedYear && selectedMonth) {
            // Use the date the user selected
            const year = selectedYear;
            const month = String(selectedMonth).padStart(2, '0');
            finishDate = `${year}-${month}-01`;
            finishTimestamp = `${year}-${month}-01 23:59:59`;
        } else if (existingAnime?.finishDate) {
            // Keep existing date when editing
            finishDate = existingAnime.finishDate;
            finishTimestamp = existingAnime.finishTimestamp;
        } else {
            // Fallback to current date
            const today = nowTimestamp.split(' ')[0];
            finishDate = today;
            finishTimestamp = `${today} 23:59:59`;
        }
    }
    
    if (existingAnime && isEditing) {
        // Update existing
        existingAnime.title = title;
        existingAnime.type = type;
        existingAnime.episodes = episodes;
        existingAnime.duration = duration;
        existingAnime.userStatus = status;
        existingAnime.progress = progress;
        existingAnime.score = score;
        existingAnime.cover = cover;
        existingAnime.genres = genres;
        existingAnime.finishDate = finishDate;
        existingAnime.finishTimestamp = finishTimestamp;
        existingAnime.updatedAt = nowTimestamp;
    } else {
        // Add new
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
            finishTimestamp: finishTimestamp,
            createdAt: nowTimestamp,
            updatedAt: nowTimestamp
        };
        animeData.push(newAnime);
    }
    
    saveData();
    
    // Log activity
    if (status === 'Completed' && (!isEditing || existingAnime?.userStatus !== 'Completed')) {
        logActivity('completed', title);
    } else if (!isEditing) {
        logActivity('added', title);
    } else if (isEditing) {
        logActivity('edited', title);
    }
    
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
    
    // Force immediate save and refresh
    saveData();
    updateAllComponents();
    
    showToast(isEditing ? 'Anime updated!' : 'Anime added!', 'success');
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('animeData', JSON.stringify(animeData));
}
function updateAllComponents() {
    updateStats();
    updateCharts();
    refreshAllCharts(); // ✅ ADD THIS LINE
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
            el.innerHTML = `<i class="fas fa-minus"></i> <span>No Track</span>`;
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
                labels: [ '2024', '2025', '2026', '2027', '2028'],
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
                    label: `Episodes Watched `,
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
                    label: `Hours Watched `,
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
// COMPLETE ACTIVITY HEATMAP - WORKING WITH YOUR DATA STRUCTURE
// GitHub-style heatmap that tracks anime completions
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
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'heatmap-tooltip';
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.background = '#1a1f2e';
        this.tooltip.style.color = 'white';
        this.tooltip.style.padding = '8px 14px';
        this.tooltip.style.borderRadius = '12px';
        this.tooltip.style.fontSize = '0.75rem';
        this.tooltip.style.fontWeight = '500';
        this.tooltip.style.border = '1px solid rgba(139, 92, 246, 0.4)';
        this.tooltip.style.backdropFilter = 'blur(8px)';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.zIndex = '1000';
        this.tooltip.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        this.tooltip.style.whiteSpace = 'nowrap';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
    }

    loadContributions() {
        const saved = localStorage.getItem('animeContributions');
        if (saved && Object.keys(JSON.parse(saved)).length > 0) {
            return JSON.parse(saved);
        }
        return this.generateFromAnimeData();
    }

    // Generate contributions from actual anime data
    generateFromAnimeData() {
        const contributions = {};
        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];

        animeData.forEach(anime => {
            // Track completions based on finishDate
            if (anime.userStatus === 'Completed' && anime.finishDate) {
                const finishDate = new Date(anime.finishDate);
                if (!isNaN(finishDate.getTime())) {
                    const key = this.formatDateKey(finishDate);
                    contributions[key] = (contributions[key] || 0) + 1;
                }
            }

            // Also track updates (progress changes, edits)
            if (anime.updatedAt) {
                let updateDate;
                if (typeof anime.updatedAt === 'string' && anime.updatedAt.includes(' ')) {
                    // Handle format like "2026-04-15 14:13"
                    const [datePart] = anime.updatedAt.split(' ');
                    updateDate = new Date(datePart);
                } else {
                    updateDate = new Date(anime.updatedAt);
                }

                if (!isNaN(updateDate.getTime())) {
                    const key = this.formatDateKey(updateDate);
                    // Add 0.5 for updates (will be rounded)
                    contributions[key] = (contributions[key] || 0) + 0.5;
                }
            }
        });

        // Round all values
        Object.keys(contributions).forEach(key => {
            contributions[key] = Math.round(contributions[key]);
        });

        return contributions;
    }

    saveContributions() {
        localStorage.setItem('animeContributions', JSON.stringify(this.contributions));
    }

    formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // Add contribution when anime is added/updated/completed
    addContribution(amount = 1, anime = null, action = null) {
        const today = this.formatDateKey(this.currentDay);

        let finalAmount = amount;

        // Bonus for completing an anime
        if (action === 'completed') {
            finalAmount = 2;
        }

        if (finalAmount > 0) {
            this.contributions[today] = (this.contributions[today] || 0) + finalAmount;
            this.saveContributions();
            this.render();

            // Only show toast for user actions (not on refresh)
            if (action) {
                this.showToast(`+${finalAmount} contribution${finalAmount !== 1 ? 's' : ''} added!`);
            }
        }

        return finalAmount;
    }

    showToast(message) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.heatmap-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = 'heatmap-toast';
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = 'linear-gradient(135deg, #8b5cf6, #6366f1)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '30px';
        toast.style.fontSize = '0.8rem';
        toast.style.fontWeight = '500';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        toast.style.animation = 'fadeInOut 2s ease';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    getContribution(date) {
        const key = this.formatDateKey(date);
        return this.contributions[key] || 0;
    }

    getTotalForYear(year) {
        let total = 0;
        for (const [date, count] of Object.entries(this.contributions)) {
            if (date.startsWith(year)) {
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
                        dateStr: this.formatDateKey(currentDate)
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

    renderMonthLabels(weeks) {
        const container = document.getElementById('heatmapMonths');
        if (!container) return;

        const monthPositions = {};
        let currentMonth = -1;

        weeks.forEach((week, weekIndex) => {
            week.forEach((day, dayIndex) => {
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
                    const level = this.getColorLevel(day.count);
                    cell.className = `heatmap-cell level-${level}`;
                    cell.setAttribute('data-date', day.dateStr);
                    cell.setAttribute('data-count', day.count);
                    cell.style.width = '12px';
                    cell.style.height = '12px';
                    cell.style.borderRadius = '3px';
                    cell.style.cursor = 'pointer';
                    cell.style.transition = 'all 0.15s ease';

                    cell.addEventListener('mouseenter', (e) => this.showTooltip(e, day));
                    cell.addEventListener('mouseleave', () => this.hideTooltip());

                    col.appendChild(cell);
                }
            });

            container.appendChild(col);
        });

        this.renderMonthLabels(weeks);
    }

    renderYearButtons() {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 2, currentYear - 1, currentYear];
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

    attachEventListeners() {
        // Listen for anime updates
        window.addEventListener('animeUpdate', (event) => {
            const amount = event.detail?.count || 1;
            const anime = event.detail?.anime || null;
            const action = event.detail?.action || null;
            this.addContribution(amount, anime, action);
        });

        // Sync across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'animeContributions') {
                this.contributions = JSON.parse(e.newValue) || {};
                this.render();
            } else if (e.key === 'animeData') {
                // Refresh when anime data changes from another tab
                this.refreshFromAnimeData();
            }
        });
    }

    startAutoRefresh() {
        setInterval(() => {
            const newDay = new Date();
            if (newDay.getDate() !== this.currentDay.getDate()) {
                this.currentDay = newDay;
                this.render();
            }
        }, 60000);
    }

    // Force refresh heatmap from actual anime data
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

// Function to trigger when anime is added
function onAnimeAdded(anime) {
    if (window.heatmap) {
        window.heatmap.addContribution(1, anime, 'add');
        window.dispatchEvent(new CustomEvent('animeUpdate', {
            detail: { count: 1, anime: anime, action: 'add' }
        }));
    }
}

// Function to trigger when anime is completed
function onAnimeCompleted(anime) {
    if (window.heatmap) {
        window.heatmap.addContribution(2, anime, 'completed');
        window.dispatchEvent(new CustomEvent('animeUpdate', {
            detail: { count: 2, anime: anime, action: 'completed' }
        }));
    }
}

// Function to trigger when anime is updated
function onAnimeUpdated(anime) {
    if (window.heatmap) {
        window.heatmap.addContribution(1, anime, 'update');
        window.dispatchEvent(new CustomEvent('animeUpdate', {
            detail: { count: 1, anime: anime, action: 'update' }
        }));
    }
}

// Hook into your existing handleAddAnime function
function hookHeatmapToAnimeFunctions() {
    // Store reference to original function
    const originalHandleAddAnime = window.handleAddAnime;

    if (typeof originalHandleAddAnime === 'function') {
        window.handleAddAnime = function (e) {
            const wasEditing = window.isEditing;
            const title = document.getElementById('animeTitle')?.value;
            const status = document.getElementById('animeStatus')?.value;
            const anime = {
                title: title,
                episodes: parseInt(document.getElementById('animeEpisodes')?.value) || 0
            };

            // Call original function
            originalHandleAddAnime(e);

            // Trigger heatmap update after a short delay
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
                    // Always refresh from data to ensure accuracy
                    window.heatmap.refreshFromAnimeData();
                }
            }, 300);
        };
    }

    // Hook delete function
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

    // Refresh on any data change
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
    // Initialize heatmap
    window.heatmap = new ActivityHeatmap();

    // Refresh from actual data after a short delay
    setTimeout(() => {
        if (window.heatmap) {
            window.heatmap.refreshFromAnimeData();
        }
    }, 500);

    // Hook into anime functions
    setTimeout(hookHeatmapToAnimeFunctions, 1000);

    // Add CSS animation
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
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
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
    `;
    document.head.appendChild(style);

    console.log('Activity Heatmap initialized successfully!');
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
        return d.getMonth() === 3 && d.getDate() <= 21;
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
window.addEventListener("load", hideLoader);


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

// =============================================
// PWA INSTALLATION FIX - DEBUG VERSION
// =============================================

(function() {
    console.log('🚀 Initializing PWA Install Handler...');
    
    let deferredPrompt = null;
    let installButtonShown = false;
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 beforeinstallprompt event fired!');
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install banner after 2 seconds
        setTimeout(() => {
            showInstallBanner();
        }, 2000);
    });
    
    // Function to show custom install banner
    function showInstallBanner() {
        if (installButtonShown) {
            console.log('Banner already shown');
            return;
        }
        if (!deferredPrompt) {
            console.log('No deferredPrompt available');
            return;
        }
        
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App already installed');
            return;
        }
        
        // Check if user dismissed recently
        const dismissed = localStorage.getItem('installPromptDismissed');
        if (dismissed && (Date.now() - parseInt(dismissed)) < 7 * 24 * 60 * 60 * 1000) {
            console.log('User dismissed prompt recently');
            return;
        }
        
        console.log('Showing install banner...');
        installButtonShown = true;
        
        // Remove existing banner if any
        const existingBanner = document.getElementById('custom-install-banner');
        if (existingBanner) existingBanner.remove();
        
        // Create custom install banner
        const banner = document.createElement('div');
        banner.id = 'custom-install-banner';
        banner.innerHTML = `
            <div class="install-banner-content">
                <div class="install-banner-icon">
                    <i class="fas fa-download"></i>
                </div>
                <div class="install-banner-text">
                    <h4>Install AniPulse</h4>
                    <p>Install as app for faster access and offline support</p>
                </div>
                <div class="install-banner-buttons">
                    <button class="install-banner-btn install-now-btn">
                        <i class="fas fa-download"></i> Install
                    </button>
                    <button class="install-banner-btn install-later-btn">
                        <i class="fas fa-times"></i> Later
                    </button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #custom-install-banner {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                z-index: 100000;
                background: linear-gradient(135deg, #1a1f2e, #0f1420);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                border: 1px solid rgba(139, 92, 246, 0.4);
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideUpBanner 0.4s ease-out;
                padding: 16px;
            }
            
            @keyframes slideUpBanner {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .install-banner-content {
                display: flex;
                align-items: center;
                gap: 16px;
                flex-wrap: wrap;
            }
            
            .install-banner-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #6366F1, #8B5CF6);
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                flex-shrink: 0;
            }
            
            .install-banner-text {
                flex: 1;
            }
            
            .install-banner-text h4 {
                margin: 0 0 4px 0;
                font-size: 1rem;
                font-weight: 700;
                color: white;
            }
            
            .install-banner-text p {
                margin: 0;
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .install-banner-buttons {
                display: flex;
                gap: 10px;
                flex-shrink: 0;
            }
            
            .install-banner-btn {
                padding: 8px 20px;
                border-radius: 40px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }
            
            .install-now-btn {
                background: linear-gradient(135deg, #6366F1, #8B5CF6);
                color: white;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .install-now-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
            }
            
            .install-later-btn {
                background: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.7);
                border: 1px solid rgba(139, 92, 246, 0.3);
            }
            
            .install-later-btn:hover {
                background: rgba(239, 68, 68, 0.15);
                color: #EF4444;
                border-color: rgba(239, 68, 68, 0.3);
            }
            
            @media (max-width: 640px) {
                .install-banner-text p {
                    display: none;
                }
                
                .install-banner-icon {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                }
                
                .install-banner-btn {
                    padding: 6px 16px;
                    font-size: 0.75rem;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(banner);
        
        // Add event listeners
        const installBtn = banner.querySelector('.install-now-btn');
        const laterBtn = banner.querySelector('.install-later-btn');
        
        installBtn.addEventListener('click', async () => {
            console.log('Install button clicked');
            if (!deferredPrompt) {
                alert('Install prompt not available. Use browser menu to install.');
                banner.remove();
                return;
            }
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install outcome: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('User installed the app');
                showToast('🎉 Installing AniPulse...', 'success');
            }
            
            deferredPrompt = null;
            banner.remove();
        });
        
        laterBtn.addEventListener('click', () => {
            console.log('User dismissed banner');
            localStorage.setItem('installPromptDismissed', Date.now().toString());
            banner.remove();
        });
    }
    
    // Also add install button to settings
    function addInstallToSettings() {
        setTimeout(() => {
            const settingsContainer = document.querySelector('#settings-page .settings-groups-container');
            if (!settingsContainer) return;
            
            if (document.getElementById('settings-install-btn')) return;
            if (window.matchMedia('(display-mode: standalone)').matches) return;
            
            const installSection = document.createElement('div');
            installSection.className = 'settings-group';
            installSection.innerHTML = `
                <h3><i class="fas fa-download"></i> Install App</h3>
                <p>Install AniPulse as a standalone app for the best experience.</p>
                <button id="settings-install-btn" style="
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #6366F1, #8B5CF6);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    <i class="fas fa-download"></i> Install AniPulse
                </button>
            `;
            
            const firstGroup = settingsContainer.querySelector('.settings-group');
            if (firstGroup) {
                settingsContainer.insertBefore(installSection, firstGroup);
            } else {
                settingsContainer.appendChild(installSection);
            }
            
            const installBtn = document.getElementById('settings-install-btn');
            if (installBtn) {
                installBtn.addEventListener('click', () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                    } else {
                        alert('Click the install icon (⊕) in your browser address bar');
                    }
                });
            }
        }, 2000);
    }
    
    addInstallToSettings();
    
    console.log('✅ PWA Install Handler Ready');
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
    window.restoreScroll = function() {
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
                                label: function(context) {
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
        window.updateGenreChartWithFilter = function() {
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
        window.refreshAllCharts = function() {
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

// Initialize the app with saved theme (theme loads before loader)
initializeTheme();

