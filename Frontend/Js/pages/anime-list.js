// ============================================
// ANIME LIST 
// ============================================

(function () {
    'use strict';

    // ─── DOM REFS ──────────────────────────────────
    function getFilters() {
        return {
            status: document.getElementById('statusFilter'),
            month: document.getElementById('monthFilter'),
            year: document.getElementById('yearFilter'),
        };
    }

    function getTableBody() {
        return document.getElementById('anime-table-body');
    }

    function getAnimeCount() {
        return document.getElementById('anime-count');
    }

    function getSearchInput() {
        return document.getElementById('dashboardSearch');
    }

    // ─── DATE PARSER ───────────────────────────────
    function parseDateSafely(dateStr) {
        if (!dateStr) return null;
        if (typeof dateStr === 'string') {
            const parts = dateStr.split('-');
            if (parts.length >= 2) {
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
                    const d = new Date(y, m, parts.length === 3 ? parseInt(parts[2]) : 1);
                    if (!isNaN(d.getTime())) return d;
                }
            }
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d;
        }
        if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
            return dateStr;
        }
        return null;
    }

    // ─── FORMAT DATE FOR DISPLAY ────────────────────
    function formatDateForDisplay(dateStr) {
        if (!dateStr) return '-';
        const d = parseDateSafely(dateStr);
        if (!d) return '-';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();
        const day = d.getDate();
        const hasDay = dateStr.split('-').length === 3;
        return hasDay ? `${month} ${day}, ${year}` : `${month} ${year}`;
    }

    function formatTooltip(label, dateStr) {
        if (!dateStr) return '';
        const d = parseDateSafely(dateStr);
        if (!d) return '';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();
        const day = d.getDate();
        const hasDay = dateStr.split('-').length === 3;
        const datePart = hasDay ? `${month} ${day}, ${year}` : `${month} ${year}`;
        return `${label}: ${datePart}`;
    }

    // ─── RENDER FUNCTION ──────────────────────────
    window.updateAnimeTableView = function (animeList) {
        const tableBody = getTableBody();
        if (!tableBody) return;

        if (animeList.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="7" class="no-anime">No anime found matching your filters. Add some anime to get started!</td></tr>
            `;
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

            let completionDisplay = '-';
            let completionTooltip = '';
            if (anime.userStatus === 'Completed') {
                const dateStr = anime.actualFinishDate || anime.finishDate;
                if (dateStr) {
                    completionDisplay = formatDateForDisplay(dateStr);
                    completionTooltip = formatTooltip('Completed on', dateStr);
                }
            }

            let creationTooltip = '';
            if (anime.createdAt) {
                creationTooltip = formatTooltip('Added on', anime.createdAt);
            }

            const combinedTooltip = [creationTooltip, completionTooltip].filter(Boolean).join(' | ');

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

            const scoreDisplay = anime.score ? `<span class="anime-score">${anime.score.toFixed(1)}</span>` : '-';
            const safeTitle = anime.title.length > 35 ? anime.title.slice(0, 35) + '...' : anime.title;

            const titleWithCover = `
                <div class="anime-title-cell" title="${window.escapeHtml(combinedTooltip)}">
                    <img src="${anime.cover || 'https://placehold.co/50x70/6a5acd/white?text=No+Image'}"
                         alt="${window.escapeHtml(safeTitle)}" class="anime-cover"
                         onerror="this.src='https://placehold.co/50x70/6a5acd/white?text=No+Image'">
                    <div class="anime-info">
                        <div class="anime-title" title="${window.escapeHtml(safeTitle)}">${window.escapeHtml(safeTitle)}</div>
                        ${anime.genres && anime.genres.length > 0
                    ? `<div class="anime-genres">${anime.genres.slice(0, 3).map(g => `<span>${window.escapeHtml(g)}</span>`).join('')}</div>`
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
                    <td><span title="${window.escapeHtml(completionTooltip)}">${completionDisplay}</span></td>
                </tr>
            `;
        }).join('');
    };

    // ─── SET DEFAULT FILTERS TO CURRENT MONTH/YEAR ──
    function setDefaultFilters() {
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentYear = String(now.getFullYear());

        const monthSelect = document.getElementById('monthFilter');
        const yearSelect = document.getElementById('yearFilter');

        if (monthSelect) {
            monthSelect.value = currentMonth;
        }

        if (yearSelect) {
            let yearExists = false;
            for (let opt of yearSelect.options) {
                if (opt.value === currentYear) {
                    yearExists = true;
                    break;
                }
            }
            if (!yearExists) {
                const opt = document.createElement('option');
                opt.value = currentYear;
                opt.textContent = currentYear;
                yearSelect.appendChild(opt);
            }
            yearSelect.value = currentYear;
        }
    }

    // ─── MAIN UPDATE FUNCTION ──────────────────────
    window.updateAnimeDisplay = function () {
        const data = window.animeData || [];
        const filters = getFilters();
        const searchInput = getSearchInput();

        const status = filters.status ? filters.status.value : 'all';
        let month = filters.month ? filters.month.value : 'all';
        let year = filters.year ? filters.year.value : 'all';
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = [...data];

        // 1. Status filter
        if (status !== 'all') {
            filtered = filtered.filter(a => a.userStatus === status);
        }

        // 2. Search filter (title) – if active, ignore month/year
        if (query) {
            filtered = filtered.filter(a => a.title.toLowerCase().includes(query));
            // Search overrides month/year
            month = 'all';
            year = 'all';
        }

        // 3. Month/Year filter 
        if (month !== 'all' || year !== 'all') {
            filtered = filtered.filter(a => {
                if (a.userStatus !== 'Completed') {
                    return true;
                }
                const dateStr = a.actualFinishDate || a.finishDate || a.completedTimestamp;
                if (!dateStr) return false;
                const d = parseDateSafely(dateStr);
                if (!d) return false;
                const animeYear = d.getFullYear();
                const animeMonth = d.getMonth() + 1;
                if (year !== 'all' && animeYear !== parseInt(year)) return false;
                if (month !== 'all' && animeMonth !== parseInt(month)) return false;
                return true;
            });
        }

        // Update counter
        const countEl = getAnimeCount();
        if (countEl) countEl.textContent = `Total Anime: ${filtered.length}`;

        // Render
        window.updateAnimeTableView(filtered);
    };

    // ─── INIT ──────────────────────────────────────
    function initAnimeList() {
        console.log(' Initializing Anime List (non‑completed always shown when status=All)');

        const filters = getFilters();
        const searchInput = getSearchInput();
        const tbody = getTableBody();
        if (!tbody) return;

        const attachEvent = (el, eventName, handler) => {
            if (!el) return;
            el.addEventListener(eventName, handler);
            if (eventName === 'change') {
                el.addEventListener('touchend', function () {
                    setTimeout(handler, 50);
                });
            }
        };

        attachEvent(filters.status, 'change', updateAnimeDisplay);
        attachEvent(filters.month, 'change', updateAnimeDisplay);
        attachEvent(filters.year, 'change', updateAnimeDisplay);

        if (searchInput) {
            searchInput.addEventListener('input', updateAnimeDisplay);
        }

        window.addEventListener('animeUpdate', updateAnimeDisplay);
        window.addEventListener('storage', function (e) {
            if (e.key === 'animeData') updateAnimeDisplay();
        });

        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) setTimeout(updateAnimeDisplay, 100);
        });

        document.addEventListener('pageChanged', function (e) {
            if (e.detail.page === 'anime-list') {
                setTimeout(updateAnimeDisplay, 100);
            }
        });

        // ── NEW: Set default month/year to current date ──
        setDefaultFilters();

        let attempts = 0;
        function initialRender() {
            if (window.animeData && window.animeData.length > 0) {
                updateAnimeDisplay();
            } else if (attempts < 5) {
                attempts++;
                setTimeout(initialRender, 200);
            } else {
                updateAnimeDisplay();
            }
        }
        setTimeout(initialRender, 100);

        console.log(' Anime List initialized with current month/year filter');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimeList);
    } else {
        setTimeout(initAnimeList, 50);
    }

})();