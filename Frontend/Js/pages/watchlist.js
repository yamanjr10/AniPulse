(function () {
    'use strict';

    const itemsPerPage = 30;
    let currentPage = 1;
    let currentStatus = 'all';
    let currentSearch = '';

    // ---- Expose state for auto‑refresh ----
    window.watchlistState = {
        status: 'all',
        page: 1,
        search: ''
    };

    // ============================================
    // PAGINATION
    // ============================================
    window.renderPagination = function (totalPages, activePage) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        totalPages = parseInt(totalPages) || 1;
        activePage = parseInt(activePage) || 1;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let buttons = '';

        if (activePage > 1) {
            buttons += `<button class="page-btn arrow-btn" data-page="${activePage - 1}">‹</button>`;
        }

        const maxVisible = 3;
        let startPage = Math.max(1, activePage - maxVisible);
        let endPage = Math.min(totalPages, activePage + maxVisible);

        if (startPage > 1) {
            buttons += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) buttons += `<span class="page-dots">…</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons += `<button class="page-btn ${i === activePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) buttons += `<span class="page-dots">…</span>`;
            buttons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        if (activePage < totalPages) {
            buttons += `<button class="page-btn arrow-btn" data-page="${activePage + 1}">›</button>`;
        }

        pagination.innerHTML = buttons;

        pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const targetPage = parseInt(this.dataset.page);
                if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
                    window.updateWatchlist(currentStatus, targetPage, currentSearch);
                }
            });
        });
    };

    // ============================================
    // UPDATE WATCHLIST – with state sync
    // ============================================
    window.updateWatchlist = function (status = 'all', page = 1, searchTerm = '') {
        const container = document.getElementById('watchlist-container');
        const pagination = document.getElementById('pagination');
        if (!container || !pagination) return;

        currentStatus = status;
        currentPage = page;
        currentSearch = searchTerm || '';

        // ---- Update global state ----
        window.watchlistState.status = currentStatus;
        window.watchlistState.page = currentPage;
        window.watchlistState.search = currentSearch;

        // 1. Start with full data
        let filtered = [...(window.animeData || [])];

        // 2. Filter by status
        if (currentStatus !== 'all') {
            filtered = filtered.filter(a => a.userStatus === currentStatus);
        }

        // 3. Filter by search term (case‑insensitive, title match)
        if (currentSearch.trim() !== '') {
            const term = currentSearch.trim().toLowerCase();
            filtered = filtered.filter(a => a.title.toLowerCase().includes(term));
        }

        // 4. Reverse for newest first
        filtered.reverse();

        // 5. Paginate
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageAnime = filtered.slice(start, end);

        // 6. Empty state
        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-anime">No anime found ${currentSearch ? 'matching "' + currentSearch + '"' : ''} for "${currentStatus}".</div>`;
            pagination.innerHTML = '';
            return;
        }

        // 7. Render cards
        container.innerHTML = pageAnime.map(anime => {
            const score = anime.score ? parseFloat(anime.score).toFixed(1) : null;
            const episodesText = anime.episodes ? `${anime.episodes} Eps` : '';
            const statusBadge = anime.userStatus || '';

            return `
                <div class="anime-card fade-in" data-id="${anime.id}" onclick="window.editAnime && window.editAnime('${anime.id}')">
                    <div class="anime-img-wrapper">
                        <img src="${anime.cover || 'https://placehold.co/300x400/6a5acd/white?text=No+Image'}"
                             alt="${window.escapeHtml(anime.title)}"
                             class="anime-cover"
                             loading="lazy"
                             onerror="this.src='https://placehold.co/300x400/6a5acd/white?text=No+Image'">
                        ${score ? `<div class="rating-badge">⭐ ${score}</div>` : ''}
                        ${statusBadge ? `<div class="anime-badge" data-status="${statusBadge}">${statusBadge}</div>` : ''}
                    </div>
                    <div class="anime-info">
                        <div class="anime-title" data-fulltitle="${window.escapeHtml(anime.title)}">${window.escapeHtml(anime.title)}</div>
                        <div class="anime-meta">
                            <span class="anime-type">${anime.type || 'TV'}</span>
                            ${episodesText ? `<span>${episodesText}</span>` : ''}
                        </div>
                        ${anime.userStatus === 'Watching' && anime.progress ? `
                            <div class="progress-container">
                                <div class="progress-bar" style="width: ${Math.min(100, (anime.progress / (anime.episodes || 1)) * 100)}%"></div>
                            </div>
                            <span class="progress-text">${anime.progress}/${anime.episodes || '?'}</span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 8. Pagination
        window.renderPagination(totalPages, page);
    };

    // ============================================
    // FILTER BUTTONS INIT
    // ============================================
    function initWatchlistFilters() {
        const filterBtns = document.querySelectorAll('.watchlist-filters .filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                window.updateWatchlist(this.getAttribute('data-status'), 1, currentSearch);
            });
        });

        // ---- SEARCH INPUT EVENT ----
        const searchInput = document.getElementById('watchlistSearch');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', function () {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    window.updateWatchlist(currentStatus, 1, this.value);
                }, 300);
            });
        }

        // Initial load
        window.updateWatchlist('all', 1, '');
        console.log('✅ Watchlist initialized with search and auto-refresh');
    }

    window.initWatchlistFilters = initWatchlistFilters;
})();