// ============================================
// ANIME LIST – Data‑driven rendering
// ============================================

(function () {
    'use strict';

    // ─── RENDER TABLE ──────────────────────────────
    window.updateAnimeTableView = function (animeList) {
        const tableBody = document.getElementById('anime-table-body');
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

            let completionDate = '-', completionTooltip = '';
            if (anime.userStatus === 'Completed') {
                if (anime.finishDate && anime.finishDate.length >= 7) {
                    const [year, month] = anime.finishDate.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    completionDate = `${monthNames[parseInt(month) - 1]} ${year}`;
                }
                if (anime.actualFinishDate) {
                    const parts = anime.actualFinishDate.split('-');
                    if (parts.length >= 3) {
                        const [year, month] = parts;
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        completionTooltip = `Completed on: ${monthNames[parseInt(month) - 1]} ${year}`;
                    }
                } else if (anime.finishDate) {
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

            const scoreDisplay = anime.score ? `<span class="anime-score">${anime.score.toFixed(1)}</span>` : '-';
            const safeTitle = anime.title.length > 35 ? anime.title.slice(0, 35) + '...' : anime.title;

            let creationTooltip = '';
            if (anime.createdAt) {
                const parts = anime.createdAt.split(' ')[0].split('-');
                if (parts.length >= 3) {
                    const [year, month] = parts;
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    creationTooltip = `Added on: ${monthNames[parseInt(month) - 1]} ${year}`;
                }
            }
            const combinedTooltip = [creationTooltip, completionTooltip].filter(Boolean).join(' | ');

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
                    <td><span title="${window.escapeHtml(completionTooltip)}">${completionDate}</span></td>
                </tr>
            `;
        }).join('');

        // Re‑bind click handler (modal system attaches it)
        // The modal system uses attachTableClickHandler; we don't need to do it here.
    };

    // ─── UPDATE DISPLAY (core filter + render) ────
    window.updateAnimeDisplay = function () {
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const sortFilter = document.getElementById('sortFilter')?.value || 'id';
        const monthFilter = document.getElementById('monthFilter')?.value || 'all';
        const yearFilter = document.getElementById('yearFilter')?.value || 'all';

        // Get search query from global search manager
        const searchQuery = window.AniPulseSearch?.query || '';

        // 1. Start with full dataset
        let filtered = [...(window.animeData || [])];

        // 2. Apply search filter (if any)
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(anime => {
                // Build an array of searchable fields
                const searchableFields = [
                    anime.title,
                    anime.title_english,
                    anime.title_romaji,
                    anime.title_japanese,
                    anime.type,
                    anime.userStatus,
                    anime.studio,
                    anime.synopsis,
                    ...(anime.genres || []),
                ];
                return searchableFields.some(field =>
                    field && field.toString().toLowerCase().includes(lowerQuery)
                );
            });
        }

        // 3. Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => a.userStatus === statusFilter);
        }

        // 4. Apply month/year filters (only for completed anime? original logic uses finishDate)
        if (monthFilter !== 'all' || yearFilter !== 'all') {
            filtered = filtered.filter(anime => {
                const dateToCheck = anime.finishDate || anime.updatedAt || anime.createdAt;
                if (!dateToCheck) return false;
                const parts = dateToCheck.split('-');
                if (parts.length < 2) return false;
                const [year, month] = parts;
                if (monthFilter !== 'all' && month !== monthFilter) return false;
                if (yearFilter !== 'all' && year !== yearFilter) return false;
                return true;
            });
        }

        // 5. Apply sorting
        if (sortFilter === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
        else if (sortFilter === 'rating') filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
        else if (sortFilter === 'episodes') filtered.sort((a, b) => (b.episodes || 0) - (a.episodes || 0));
        else if (sortFilter === 'updated') filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        // default: keep original order (by id)

        // 6. Update counter
        const countEl = document.getElementById('anime-count');
        if (countEl) countEl.textContent = `Total Anime: ${filtered.length}`;

        // 7. Render the table
        window.updateAnimeTableView(filtered);
    };

    // ─── RESTORE FILTERS (from localStorage) ──────
    function restoreFilters() {
        const mappings = [
            { elId: 'statusFilter', storageKey: 'animeFilterStatus' },
            { elId: 'monthFilter', storageKey: 'animeFilterMonth' },
            { elId: 'yearFilter', storageKey: 'animeFilterYear' }
        ];
        let attempts = 0;
        const maxAttempts = 30;
        const interval = setInterval(() => {
            attempts++;
            const allReady = mappings.every(m => document.getElementById(m.elId));
            if (!allReady && attempts <= maxAttempts) return;
            clearInterval(interval);

            mappings.forEach(({ elId, storageKey }) => {
                const el = document.getElementById(elId);
                if (!el) return;
                const saved = localStorage.getItem(storageKey);
                if (saved && el.value !== saved) el.value = saved;
                el.addEventListener('change', (e) => {
                    localStorage.setItem(storageKey, e.target.value);
                    if (typeof window.updateAnimeDisplay === 'function') window.updateAnimeDisplay();
                });
            });
            // Initial render
            if (typeof window.updateAnimeDisplay === 'function') window.updateAnimeDisplay();
        }, 200);
    }

    // ─── INIT ──────────────────────────────────────
    window.initAnimeList = function () {
        restoreFilters();
        console.log('✅ Anime List initialized');
    };
})();