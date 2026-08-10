// pages/dashboard.js
// ============================================
// DASHBOARD PAGE – Stats, Top Rated, Activity, DNA, Currently Watching
// ============================================

(function () {
    'use strict';

    let _updatingStats = false;
    let _lastStatsValues = null;
    let _sidebarToggleInterval = null;
    let _sidebarCurrentStat = 'hours';

    // --- Update stats (with retry, verification, and auto-restore) ---
    window.updateStats = function (retries = 0) {
        if (_updatingStats) {
            console.log('⏳ Stats update already in progress, skipping...');
            return;
        }
        _updatingStats = true;

        try {
            const data = window.animeData || [];
            const hasStatsFn = typeof window.calculateMonthlyStats === 'function';
            const hasData = Array.isArray(data) && data.length > 0;

            if ((!hasData || !hasStatsFn) && retries < 15) {
                console.log(`🔄 updateStats retry ${retries + 1}/15...`);
                _updatingStats = false;
                setTimeout(() => window.updateStats(retries + 1), 500);
                return;
            }

            if (!hasData) {
                console.warn('⚠️ No anime data found after retries – stats will show 0');
            }

            const monthlyStats = hasStatsFn
                ? window.calculateMonthlyStats({ debug: false })
                : { hours: '0.0', completed: 0, movies: 0, episodes: 0 };

            _lastStatsValues = monthlyStats;

            const monthEl = document.getElementById('current-month');
            if (monthEl) {
                const monthName = typeof window.getCurrentMonth === 'function'
                    ? window.getCurrentMonth()
                    : new Date().toLocaleString('default', { month: 'long' });
                monthEl.textContent = monthName;
            }

            const elements = {
                completed: document.getElementById('completed-count'),
                movies: document.getElementById('movies-count'),
                episodes: document.getElementById('episodes-count'),
                hours: document.getElementById('total-hours-count')
            };

            if (elements.completed) elements.completed.textContent = monthlyStats.completed;
            if (elements.movies) elements.movies.textContent = monthlyStats.movies;
            if (elements.episodes) elements.episodes.textContent = monthlyStats.episodes;
            // Floor hours
            if (elements.hours) {
                const hoursNum = parseFloat(monthlyStats.hours);
                elements.hours.textContent = isNaN(hoursNum) ? '0' : Math.floor(hoursNum);
            }

            const completedEl = elements.completed;
            if (completedEl) {
                const currentValue = parseInt(completedEl.textContent) || 0;
                const expectedValue = monthlyStats.completed;
                if (currentValue !== expectedValue && retries < 10) {
                    console.warn(`⚠️ DOM mismatch: expected ${expectedValue}, got ${currentValue}. Retrying...`);
                    _updatingStats = false;
                    setTimeout(() => window.updateStats(retries + 1), 300);
                    return;
                }
            }

            if (typeof window.updateStatCardsWithChanges === 'function') {
                window.updateStatCardsWithChanges({ debug: false });
            }

            console.log('✅ Stats updated:', monthlyStats);

        } finally {
            _updatingStats = false;
        }
    };

    // --- Force restore stats if they get reset ---
    window.restoreStats = function () {
        if (_lastStatsValues) {
            console.log('🔄 Restoring stats after potential reset...');
            const stats = _lastStatsValues;
            const els = {
                completed: document.getElementById('completed-count'),
                movies: document.getElementById('movies-count'),
                episodes: document.getElementById('episodes-count'),
                hours: document.getElementById('total-hours-count')
            };
            if (els.completed) els.completed.textContent = stats.completed;
            if (els.movies) els.movies.textContent = stats.movies;
            if (els.episodes) els.episodes.textContent = stats.episodes;
            if (els.hours) {
                const hoursNum = parseFloat(stats.hours);
                els.hours.textContent = isNaN(hoursNum) ? '0' : Math.floor(hoursNum);
            }
        }
    };

    // --- Watch for DOM changes that might reset stats ---
    function setupStatWatcher() {
        const statIds = ['completed-count', 'movies-count', 'episodes-count', 'total-hours-count'];
        statIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const observer = new MutationObserver(() => {
                if (_lastStatsValues) {
                    const current = parseInt(el.textContent) || 0;
                    let expected = 0;
                    if (id === 'completed-count') expected = _lastStatsValues.completed;
                    else if (id === 'movies-count') expected = _lastStatsValues.movies;
                    else if (id === 'episodes-count') expected = _lastStatsValues.episodes;
                    else if (id === 'total-hours-count') {
                        const raw = parseFloat(_lastStatsValues.hours);
                        expected = isNaN(raw) ? 0 : Math.floor(raw);
                    }
                    if (current !== expected && expected !== undefined) {
                        console.warn(`⚠️ Stat ${id} was reset to ${current}, restoring to ${expected}`);
                        el.textContent = expected;
                    }
                }
            });
            observer.observe(el, { childList: false, characterData: true, subtree: false });
        });
    }

    // --- Top rated anime ---
    window.updateTopRatedAnime = function () {
        const container = document.getElementById('top-rated-anime');
        const data = window.animeData || [];
        const topRated = data
            .filter(a => a.score && a.score >= 8)
            .sort((a, b) => b.score - a.score)
            .slice(0, 7);

        if (topRated.length === 0) {
            container.innerHTML = '<div class="no-anime">No highly rated anime yet. Rate some anime to see them here!</div>';
            return;
        }

        container.innerHTML = topRated.map(anime => `
            <div class="anime-card" onclick="window.editAnime && window.editAnime('${anime.id}')">
                <img src="${anime.cover || 'https://placehold.co/300x400/6a5acd/white?text=No+Image'}" alt="${window.escapeHtml(anime.title)}" class="anime-cover" onerror="this.src='https://placehold.co/300x400/6a5acd/white?text=No+Image'">
                <div class="anime-info">
                    <div class="anime-title" title="${window.escapeHtml(anime.title)}">${window.escapeHtml(anime.title)}</div>
                    <div class="anime-meta">
                        <span>${anime.type || 'TV'}</span>
                        <span class="anime-score">⭐ ${anime.score}</span>
                    </div>
                </div>
            </div>
        `).join('');
    };

    // --- Current month anime (scrolling) ---
    window.updateCurrentMonthAnime = function () {
        const container = document.getElementById('current-month-anime');
        const nameEl = document.getElementById('current-month-name');
        if (!container || !nameEl) return;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        nameEl.textContent = monthNames[currentMonth];

        const data = window.animeData || [];
        const monthAnime = data.filter(a => {
            if (a.userStatus !== 'Completed' || !a.finishDate) return false;
            const d = new Date(a.finishDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        if (monthAnime.length === 0) {
            container.innerHTML = `
                <div class="no-anime">
                    <i class="fas fa-calendar-times"></i>
                    <div>No anime completed this month yet.<br>Keep watching!</div>
                </div>
            `;
            return;
        }

        monthAnime.sort((a, b) => new Date(b.finishDate) - new Date(a.finishDate));

        container.innerHTML = monthAnime.map(anime => `
            <div class="anime-card" onclick="window.editAnime && window.editAnime('${anime.id}')">
                <img src="${anime.cover || 'https://placehold.co/300x400/6a5acd/white?text=No+Image'}" alt="${window.escapeHtml(anime.title)}" class="anime-cover" onerror="this.src='https://placehold.co/300x400/6a5acd/white?text=No+Image'">
                <div class="anime-info">
                    <div class="anime-title">${window.escapeHtml(anime.title)}</div>
                    <div class="anime-meta">
                        <span>${anime.type || 'TV'}</span>
                        ${anime.score ? `<span class="anime-score">⭐ ${anime.score}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        if (typeof window.initializeDragScrolling === 'function') {
            window.initializeDragScrolling();
        }
    };

    // --- Drag scrolling ---
    window.initializeDragScrolling = function () {
        const container = document.getElementById('current-month-anime');
        if (!container) return;
        let isDown = false, startX, scrollLeft;
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('active');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });
        container.addEventListener('mouseleave', () => { isDown = false; container.classList.remove('active'); });
        container.addEventListener('mouseup', () => { isDown = false; container.classList.remove('active'); });
        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
        container.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });
        container.addEventListener('touchend', () => { isDown = false; });
        container.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
        container.addEventListener('dragstart', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });
    };

    // --- Recent activity ---
    window.updateRecentActivity = function () {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        const log = window.activityLog || [];
        if (log.length === 0) {
            container.innerHTML = '<div class="no-activity">No recent activity. Add or update anime to see activity here.</div>';
            return;
        }
        container.innerHTML = log.slice(0, 6).map(activity => {
            let iconClass = 'added', iconName = 'plus';
            const actionMap = {
                'added': { class: 'added', icon: 'plus' },
                'completed': { class: 'completed', icon: 'check' },
                'watching': { class: 'watching', icon: 'play' },
                'edited': { class: 'edited', icon: 'edit' },
                'deleted': { class: 'deleted', icon: 'trash' }
            };
            const info = actionMap[activity.action] || actionMap['edited'];
            let activityText = `Updated ${window.escapeHtml(activity.animeTitle)}`;
            if (activity.action === 'added') activityText = `Added ${window.escapeHtml(activity.animeTitle)} to your list`;
            else if (activity.action === 'completed') activityText = `Completed ${window.escapeHtml(activity.animeTitle)}`;
            else if (activity.action === 'watching') activityText = `Started watching ${window.escapeHtml(activity.animeTitle)}`;
            else if (activity.action === 'deleted') activityText = `Removed ${window.escapeHtml(activity.animeTitle)} from your list`;

            return `
                <div class="activity-item" data-timestamp="${activity.timestamp}">
                    <div class="activity-icon ${info.class}">
                        <i class="fas fa-${info.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-anime">${window.escapeHtml(activity.animeTitle)}</div>
                        <div class="activity-desc">${activityText}</div>
                    </div>
                    <div class="activity-time" data-time="${activity.timestamp}">
                        ${window.formatTimeAgo(activity.timestamp)}
                    </div>
                </div>
            `;
        }).join('');
    };

    // --- Currently watching ---
    window.updateCurrentlyWatching = function () {
        const section = document.getElementById('currently-watching-section');
        const container = document.getElementById('currently-watching-grid');
        if (!section || !container) return;

        const data = window.animeData || [];
        const watchingList = data.filter(a => a.userStatus === 'Watching');

        if (watchingList.length === 0) {
            section.style.display = 'none';
            section.style.visibility = 'hidden';
            section.classList.add('hidden');
            container.innerHTML = '';
            return;
        }
        section.style.display = 'block';
        section.style.visibility = 'visible';
        section.classList.remove('hidden');

        container.innerHTML = watchingList.map(a => {
            const current = a.progress || 0;
            const total = a.episodes || 0;
            const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
            const episodesText = total ? `${current}/${total} eps` : `${current} eps`;
            const showPercentage = percent > 15;
            const percentageText = showPercentage ? `${percent}%` : '';

            return `
                <div class="anime-card fade-in" onclick="window.editAnime && window.editAnime('${a.id}')">
                    <div class="anime-img-wrapper" style="position:relative;">
                        <img src="${a.cover || 'https://placehold.co/300x400/6a5acd/white?text=No+Image'}"
                             alt="${window.escapeHtml(a.title)}"
                             class="anime-cover"
                             loading="lazy"
                             onerror="this.src='https://placehold.co/300x400/6a5acd/white?text=No+Image'">
                        ${a.score ? `<div class="rating-badge"> ${a.score}</div>` : ''}
                    </div>
                    <div class="anime-info">
                        <div class="anime-title" title="${window.escapeHtml(a.title)}">${window.escapeHtml(a.title)}</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar blue" style="width: ${percent}%;">
                                <span class="progress-percentage">${percentageText}</span>
                            </div>
                        </div>
                        <div class="progress-text">
                            <span class="episodes-text">${episodesText}</span>
                            <span class="percentage-text">${percent}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // --- Anime DNA ---
    window.renderAnimeDNA = function () {
        const genreEl = document.getElementById('dna-genre');
        const scoreEl = document.getElementById('dna-score');
        const formatEl = document.getElementById('dna-format');
        if (!genreEl || !scoreEl || !formatEl) return;

        const data = window.animeData || [];
        const completed = data.filter(a => a.userStatus === 'Completed');

        if (completed.length === 0) {
            genreEl.textContent = '—';
            scoreEl.textContent = '—';
            formatEl.textContent = '—';
            return;
        }

        const genreCount = {};
        completed.forEach(a => {
            if (a.genres && Array.isArray(a.genres)) {
                a.genres.forEach(g => {
                    if (g !== 'Award Winning') genreCount[g] = (genreCount[g] || 0) + 1;
                });
            }
        });
        let topGenre = '—', maxCount = 0;
        for (const [g, c] of Object.entries(genreCount)) {
            if (c > maxCount) { maxCount = c; topGenre = g; }
        }

        const scored = completed.filter(a => a.score && a.score > 0);
        let avgScore = '—';
        if (scored.length > 0) {
            const total = scored.reduce((s, a) => s + a.score, 0);
            avgScore = (total / scored.length).toFixed(1);
        }

        const typeCount = {};
        completed.forEach(a => {
            const t = a.type || 'TV';
            typeCount[t] = (typeCount[t] || 0) + 1;
        });
        let topFormat = '—', maxType = 0;
        for (const [t, c] of Object.entries(typeCount)) {
            if (c > maxType) { maxType = c; topFormat = t; }
        }

        genreEl.textContent = topGenre;
        scoreEl.textContent = avgScore;
        formatEl.textContent = topFormat;

        [genreEl, scoreEl, formatEl].forEach(el => {
            el.classList.add('dna-updated');
            setTimeout(() => el.classList.remove('dna-updated'), 500);
        });
    };

    // ============================================
    // QUICK ACTIONS – Import / Export / Stats
    // ============================================

    function initQuickActions() {
        // --- Import: open modal ---
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', function (e) {
                e.preventDefault();
                const importModal = document.getElementById('importModal');
                if (importModal && typeof window.openModal === 'function') {
                    window.openModal(importModal);
                } else {
                    if (typeof showToast === 'function') showToast('Import modal not available', 'error');
                }
            });
        }

        // --- Export: call window.exportData (from settings.js) ---
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (typeof window.exportData === 'function') {
                    window.exportData();
                } else {
                    const data = window.animeData || [];
                    if (data.length === 0) {
                        if (typeof showToast === 'function') showToast('No data to export', 'error');
                        return;
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'AniPulse_Backup.json';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    if (typeof showToast === 'function') showToast('Data exported successfully!', 'success');
                }
            });
        }

        // --- Stats: navigate to Statistics page ---
        const statsBtn = document.getElementById('statsBtn');
        if (statsBtn) {
            statsBtn.addEventListener('click', function (e) {
                e.preventDefault();
                const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
                if (statsMenuItem) {
                    statsMenuItem.click();
                } else if (typeof navigateTo === 'function') {
                    navigateTo('statistics');
                } else {
                    if (typeof showToast === 'function') showToast('Statistics page not available', 'error');
                }
            });
        }

        // --- Import Data: merge/update ---
        const importDataBtn = document.getElementById('importDataBtn');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', function (e) {
                e.preventDefault();
                const fileInput = document.getElementById('importFile');
                const file = fileInput?.files?.[0];
                if (!file) {
                    if (typeof showToast === 'function') showToast('Please select a JSON file', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        const importedData = JSON.parse(ev.target.result);
                        if (!Array.isArray(importedData)) {
                            if (typeof showToast === 'function') showToast('Invalid JSON: expected an array', 'error');
                            return;
                        }

                        const existingMap = new Map();
                        window.animeData.forEach(a => existingMap.set(a.id, a));

                        let addedCount = 0;
                        let updatedCount = 0;

                        importedData.forEach(imported => {
                            const existing = existingMap.get(imported.id);
                            if (existing) {
                                Object.keys(imported).forEach(key => {
                                    if (key !== 'id') {
                                        existing[key] = imported[key];
                                    }
                                });
                                updatedCount++;
                            } else {
                                window.animeData.push(imported);
                                addedCount++;
                            }
                        });

                        if (addedCount === 0 && updatedCount === 0) {
                            if (typeof showToast === 'function') showToast('No changes detected', 'info');
                            return;
                        }

                        if (typeof window.saveData === 'function') window.saveData();
                        if (typeof window.updateAllComponents === 'function') window.updateAllComponents();

                        let message = '';
                        if (addedCount > 0) message += `Added ${addedCount} new anime. `;
                        if (updatedCount > 0) message += `Updated ${updatedCount} existing anime.`;
                        if (typeof showToast === 'function') showToast(`Import successful! ${message}`, 'success');

                        const importModal = document.getElementById('importModal');
                        if (importModal && typeof window.closeModal === 'function') {
                            window.closeModal(importModal);
                        }
                        fileInput.value = '';

                    } catch (err) {
                        if (typeof showToast === 'function') showToast('Failed to parse JSON file', 'error');
                        console.error('Import error:', err);
                    }
                };
                reader.onerror = function () {
                    if (typeof showToast === 'function') showToast('Failed to read file', 'error');
                };
                reader.readAsText(file);
            });
        }
    }

    // ============================================
    // SIDEBAR USER INFO – WITH HOURS ↔ EPISODES TOGGLE
    // ============================================

    window.updateSidebarUserInfo = function () {
        const sidebarAvatar = document.querySelector('.sidebar-avatar');
        const sidebarUsername = document.querySelector('.sidebar-username');
        const sidebarUserStats = document.querySelector('.sidebar-user-stats');

        const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || {
            name: 'AnimeFan',
            avatar: 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff'
        };
        const savedName = savedProfile.name;
        const savedAvatar = savedProfile.avatar;

        let currentLevel = 1,
            currentTitle = 'Newbie';
        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
            const profile = window.AniPulseLevelSystem.getUserProfile();
            currentLevel = profile.level || 1;
            currentTitle = profile.title || 'Newbie';
        } else {
            const savedLevel = localStorage.getItem('userLevel');
            const savedTitle = localStorage.getItem('userLevelTitle');
            if (savedLevel) currentLevel = parseInt(savedLevel);
            if (savedTitle) currentTitle = savedTitle;
        }

        if (sidebarAvatar) {
            sidebarAvatar.src = savedAvatar;
            sidebarAvatar.alt = savedName;
        }
        if (sidebarUsername) sidebarUsername.textContent = savedName;

        const badgeEl = document.getElementById('levelBadgeText');
        const titleEl = document.getElementById('levelTitleText');
        if (badgeEl) badgeEl.textContent = `Lv.${currentLevel}`;
        if (titleEl) titleEl.textContent = currentTitle;

        // ---- Calculate stats ----
        const data = window.animeData || [];
        const totalAnime = data.length;
        const totalHours = typeof window.calculateTotalHours === 'function' ? window.calculateTotalHours() : 0;
        const totalEpisodes = typeof window.calculateTotalEpisodes === 'function' ? window.calculateTotalEpisodes() : 0;

        // ---- Build sidebar stats with a single toggle item ----
        if (sidebarUserStats) {
            const formatShort = window.formatNumberShort || ((n) => n.toString());
            sidebarUserStats.innerHTML = `
                <div class="stat-item">
                    <span class="stat-number" id="animeCountSidebar">${totalAnime}</span>
                    <span class="stat-label">Anime</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item" id="toggleStat">
                    <span class="stat-number toggle-number" id="toggleNumber" title="${totalHours.toLocaleString()} Hours">
                        ${formatShort(totalHours)}
                    </span>
                    <span class="stat-label toggle-label" id="toggleLabel">Hours</span>
                </div>
            `;
        }

        // ---- Start auto-toggle ----
        startSidebarStatToggle(totalHours, totalEpisodes);

        // ---- Settings page level display ----
        const settingsLevelNum = document.getElementById('settingsLevelNumber');
        const settingsLevelTitle = document.getElementById('settingsLevelTitle');
        if (settingsLevelNum) settingsLevelNum.textContent = `Level ${currentLevel}`;
        if (settingsLevelTitle) settingsLevelTitle.textContent = currentTitle;

        const topAvatar = document.querySelector('.user-profile .user-avatar');
        const topName = document.querySelector('.user-profile span');
        if (topAvatar) topAvatar.src = savedAvatar;
        if (topName) topName.textContent = savedName;

        setupSidebarGuard();
    };

    // ---- Toggle function with single element (no display issues) ----
    function startSidebarStatToggle(totalHours, totalEpisodes) {
        if (_sidebarToggleInterval) {
            clearInterval(_sidebarToggleInterval);
            _sidebarToggleInterval = null;
        }

        const numberEl = document.getElementById('toggleNumber');
        const labelEl = document.getElementById('toggleLabel');
        if (!numberEl || !labelEl) return;

        const formatShort = window.formatNumberShort || ((n) => n.toString());
        let currentStat = 'hours';

        const setStat = (stat) => {
            if (stat === 'hours') {
                numberEl.textContent = formatShort(totalHours);
                numberEl.title = `${totalHours.toLocaleString()} Hours`;
                labelEl.textContent = 'Hours';
                currentStat = 'hours';
            } else {
                numberEl.textContent = formatShort(totalEpisodes);
                numberEl.title = `${totalEpisodes.toLocaleString()} Episodes`;
                labelEl.textContent = 'Eps';
                currentStat = 'episodes';
            }
            // Apply fade animation
            numberEl.style.animation = 'none';
            labelEl.style.animation = 'none';
            requestAnimationFrame(() => {
                numberEl.style.animation = 'fadeIn 0.6s ease';
                labelEl.style.animation = 'fadeIn 0.6s ease';
            });
        };

        // Start with hours
        setStat('hours');

        _sidebarToggleInterval = setInterval(() => {
            if (currentStat === 'hours') {
                setStat('episodes');
            } else {
                setStat('hours');
            }
        }, 15000);
    }

    // --- Guard the sidebarLevel container from being overwritten ---
    function setupSidebarGuard() {
        const sidebarLevel = document.getElementById('sidebarLevel');
        if (!sidebarLevel) return;
        if (sidebarLevel._guardObserver) {
            sidebarLevel._guardObserver.disconnect();
        }
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const badge = sidebarLevel.querySelector('.level-badge');
                    const title = sidebarLevel.querySelector('.level-title');
                    if (!badge || !title || !badge.textContent.trim().startsWith('Lv.')) {
                        console.warn('⚠️ Sidebar level was overwritten – restoring...');
                        window.updateSidebarUserInfo();
                    }
                }
            });
        });
        observer.observe(sidebarLevel, { childList: true, subtree: true, characterData: true });
        sidebarLevel._guardObserver = observer;
    }

    // --- Total hours ---
    window.calculateTotalHours = function () {
        const data = window.animeData || [];
        let totalMinutes = 0;
        data.forEach(a => {
            if (a.type === 'Movie') {
                totalMinutes += a.duration || 120;
            } else {
                const eps = a.progress || a.episodes || 0;
                const epDur = a.duration || 20;
                totalMinutes += eps * epDur;
            }
        });
        return Math.round(totalMinutes / 60);
    };

    window.calculateTotalEpisodes = function () {
        const data = window.animeData || [];
        return data.reduce((s, a) => s + (a.progress || a.episodes || 0), 0);
    };

    // --- Total anime count by year ---
    window.updateTotalAnimeCountAllMonths = function () {
        const now = new Date();
        const currentYear = now.getFullYear();
        const data = window.animeData || [];
        const total = data.filter(a => {
            if (!a.finishDate || a.userStatus !== 'Completed') return false;
            const year = parseInt(a.finishDate.split('-')[0]);
            return year === currentYear;
        }).length;
        const el = document.getElementById('monthly-total-anime');
        if (el) el.textContent = `Total Anime in ${currentYear}: ${total}`;
    };

    // --- User insights ---
    window.updateUserInsights = function () {
        const el = document.getElementById('user-insights');
        if (!el) return;
        const data = window.animeData || [];
        const genres = {};
        let totalHours = 0,
            totalEpisodes = 0,
            months = {};

        data.forEach(a => {
            if (a.userStatus !== 'Completed') return;
            if (Array.isArray(a.genres)) {
                a.genres.forEach(g => { genres[g] = (genres[g] || 0) + 1; });
            }
            if (a.finishDate) {
                const m = new Date(a.finishDate).toLocaleString('default', { month: 'short' });
                months[m] = (months[m] || 0) + 1;
            }
            if (a.duration && a.episodes) {
                totalHours += (a.duration * a.episodes) / 60;
            }
            if (a.episodes) totalEpisodes += a.episodes;
        });

        const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const topMonth = Object.entries(months).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const totalRounded = Math.round(totalHours);
        const formatCompact = window.formatCompactNumber || ((n) => n.toString());

        el.innerHTML = `
            <div class="insight-card"><div><strong>Top Genre:</strong> ${topGenre}</div></div>
            <div class="insight-card" title="${totalEpisodes.toLocaleString()} Episodes">
                <div><strong>Total Episodes Watched:</strong> ${formatCompact(totalEpisodes)}</div>
            </div>
            <div class="insight-card" title="${totalRounded.toLocaleString()} Hours">
                <div><strong>Total Hours Watched:</strong> ${formatCompact(totalRounded)} hrs</div>
            </div>
            <div class="insight-card"><div><strong>Most Active Month:</strong> ${topMonth}</div></div>
        `;
    };

    // --- Master update ---
    window.updateAllComponents = function () {
        if (typeof window.updateStats === 'function') window.updateStats();
        if (typeof window.refreshAllCharts === 'function') window.refreshAllCharts();
        if (typeof window.updateCurrentMonthAnime === 'function') window.updateCurrentMonthAnime();
        if (typeof window.updateAnimeDisplay === 'function') window.updateAnimeDisplay();
        if (typeof window.updateTotalAnimeCountAllMonths === 'function') window.updateTotalAnimeCountAllMonths();
        if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo();
        if (typeof window.updateUserInsights === 'function') window.updateUserInsights();

        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage && dashboardPage.classList.contains('active')) {
            if (typeof window.updateTopRatedAnime === 'function') window.updateTopRatedAnime();
            if (typeof window.updateRecentActivity === 'function') window.updateRecentActivity();
        }

        if (document.getElementById('statistics-page')?.classList.contains('active')) {
            if (typeof window.initStatisticsCharts === 'function') window.initStatisticsCharts();
            if (typeof window.updateStatisticsTables === 'function') window.updateStatisticsTables();
        }

        if (typeof window.updateCurrentlyWatching === 'function') window.updateCurrentlyWatching();
        if (typeof window.renderAnimeDNA === 'function') window.renderAnimeDNA();
        if (typeof window.renderActivityHeatmap === 'function') {
            const data = window.animeData || [];
            window.renderActivityHeatmap(data);
        }

        if (typeof window.updateMonthlyProgressChart === 'function') {
            if (window.monthlyProgressChart) {
                window.updateMonthlyProgressChart();
            }
        }
    };

    // --- Update current date ---
    window.updateCurrentDate = function () {
        const el = document.getElementById('currentDate');
        if (el) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            el.textContent = new Date().toLocaleDateString('en-US', options);
        }
    };

    // ============================================
    // STREAK STYLING – NEW FUNCTION
    // ============================================

    function updateStreakStyle(streak) {
        const streakInfo = document.getElementById('streakInfo');
        const streakFire = document.getElementById('streakFire');
        if (!streakInfo || !streakFire) return;

        let color, textShadow, filter;

        if (streak < 3) {
            // Gray
            color = '#9CA3AF';
            textShadow = 'none';
            filter = 'none';
        } else if (streak < 10) {
            // Yellow / Orange
            color = '#FFB000';
            textShadow = '0 0 8px rgba(255, 176, 0, 0.3)';
            filter = 'drop-shadow(0 0 6px rgba(255, 176, 0, 0.4))';
        } else if (streak < 30) {
            // Orange
            color = '#FF6B00';
            textShadow = '0 0 10px rgba(255, 107, 0, 0.4)';
            filter = 'drop-shadow(0 0 8px rgba(255, 107, 0, 0.5))';
        } else if (streak < 100) {
            // Pink
            color = '#FF3B81';
            textShadow = '0 0 12px rgba(255, 59, 129, 0.5)';
            filter = 'drop-shadow(0 0 10px rgba(255, 59, 129, 0.6))';
        } else if (streak < 200) {
            // Magenta
            color = '#D000FF';
            textShadow = '0 0 15px rgba(208, 0, 255, 0.6)';
            filter = 'drop-shadow(0 0 12px rgba(208, 0, 255, 0.7))';
        } else {
            // Purple
            color = '#8B5CF6';
            textShadow = '0 0 20px rgba(139, 92, 246, 0.7)';
            filter = 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.8))';
        }

        // Apply inline styles (highest specificity)
        streakInfo.style.color = color;
        streakInfo.style.textShadow = textShadow;
        streakFire.style.color = color;
        streakFire.style.filter = filter;

        // Add transitions only once
        if (!streakInfo.style.transition) {
            streakInfo.style.transition = 'color 0.4s ease, text-shadow 0.4s ease';
            streakFire.style.transition = 'color 0.4s ease, filter 0.4s ease, transform 0.4s ease';
        }

        // Fire icon subtle scaling based on streak
        if (streak >= 100) {
            streakFire.style.transform = 'scale(1.05)';
        } else {
            streakFire.style.transform = 'scale(1)';
        }
    }

    // --- Greeting banner ---
    function initGreeting() {
        const banner = document.getElementById('greetingBanner');
        if (!banner) return;

        const greetingLine = document.getElementById('greetingLine');
        const greetingEmoji = document.getElementById('greetingEmoji');
        const greetingSubline = document.getElementById('greetingSubline');
        const liveClock = document.getElementById('liveClock');
        const streakInfo = document.getElementById('streakInfo');
        const dailyQuote = document.getElementById('dailyQuote');

        const userName = localStorage.getItem('userName') || 'Otaku';

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
            "“Hard work is worthless for those that don't believe in themselves.” — Naruto Uzumaki"
        ];

        const today = new Date().toDateString();
        let streak = parseInt(localStorage.getItem('streak') || '0');
        const lastActive = localStorage.getItem('lastActive');

        // ---- STREAK CALCULATION (unchanged) ----
        if (lastActive !== today) {
            if (lastActive === new Date(Date.now() - 86400000).toDateString()) {
                streak += 1;
            } else {
                streak = 1;
            }
            localStorage.setItem('streak', streak);
            localStorage.setItem('lastActive', today);
        }

        function getGreetingData(hour) {
            if (hour < 12) return ['Good morning', '☀️', 'Fresh episodes, fresh start'];
            if (hour < 17) return ['Good afternoon', '🌤️', 'Perfect time to make progress'];
            if (hour < 22) return ['Good evening', '🌙', 'Relax and enjoy your favorites'];
            return ['Good night', '🌌', 'Late-night anime vibes'];
        }

        function updateGreeting() {
            const now = new Date();
            const hour = now.getHours();
            const [text, emoji, sub] = getGreetingData(hour);
            greetingLine.textContent = `${text}, ${userName}`;
            greetingEmoji.textContent = emoji;
            greetingSubline.textContent = sub;
            liveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            streakInfo.textContent = ` ${streak}-day streak`;
            dailyQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)];

            // ---- NEW: Apply streak styling ----
            updateStreakStyle(streak);
        }

        updateGreeting();
        setInterval(updateGreeting, 60000);
    }

    // --- Profile dropdown toggle ---
    function initProfileDropdown() {
        const toggle = document.getElementById('profileMenuToggle');
        const dropdown = document.querySelector('.profile-dropdown');
        if (toggle && dropdown) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            document.addEventListener('click', () => {
                dropdown.classList.remove('open');
            });
        }
    }

    // --- Init dashboard ---
    function initDashboard() {
        initGreeting();
        initProfileDropdown();
        setupStatWatcher();

        window.addEventListener('animeUpdate', function () {
            console.log('🔄 Data updated, refreshing stats...');
            if (typeof window.updateStats === 'function') window.updateStats();
            if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
        });

        window.addEventListener('storage', function (e) {
            if (e.key === 'animeData') {
                console.log('🔄 animeData changed in another tab, refreshing...');
                if (typeof window.updateAllComponents === 'function') {
                    window.updateAllComponents();
                }
            }
        });

        if (typeof window.initCharts === 'function') {
            const canvas = document.getElementById('monthlyProgressChart');
            if (canvas && !window.monthlyProgressChart) {
                window.initCharts();
            }
        }

        // Force sidebar update first (will also start the toggle)
        if (typeof window.updateSidebarUserInfo === 'function') {
            window.updateSidebarUserInfo();
        }

        setTimeout(() => {
            if (typeof window.updateAllComponents === 'function') {
                window.updateAllComponents();
            }
        }, 400);

        setTimeout(() => {
            console.log('🔄 Performing second refresh to ensure stats are loaded...');
            if (typeof window.updateAllComponents === 'function') {
                window.updateAllComponents();
            }
            if (typeof window.restoreStats === 'function') {
                window.restoreStats();
            }
        }, 1500);

        setTimeout(() => {
            if (typeof window.restoreStats === 'function') {
                window.restoreStats();
            }
        }, 3000);

        initQuickActions();
        console.log('✅ Dashboard initialized');
    }

    window.initDashboard = initDashboard;
})();