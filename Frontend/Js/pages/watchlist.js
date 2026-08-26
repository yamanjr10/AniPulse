(function () {
    'use strict';

    const itemsPerPage = 30;
    let currentPage = 1;
    let currentStatus = 'all';

    // ============================================
    // PAGINATION – Arrows only when needed
    // ============================================
    window.renderPagination = function (totalPages, activePage) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        // Ensure numbers
        totalPages = parseInt(totalPages) || 1;
        activePage = parseInt(activePage) || 1;

        // No pagination if only one page
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let buttons = '';

        // ----- Previous arrow (only if not on first page) -----
        if (activePage > 1) {
            buttons += `<button class="page-btn" data-page="${activePage - 1}">‹</button>`;
        }

        // ----- Page numbers with ellipsis -----
        const maxVisible = 3;
        let startPage = Math.max(1, activePage - maxVisible);
        let endPage = Math.min(totalPages, activePage + maxVisible);

        // First page + dots
        if (startPage > 1) {
            buttons += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) buttons += `<span class="page-dots">…</span>`;
        }

        // Visible range
        for (let i = startPage; i <= endPage; i++) {
            buttons += `<button class="page-btn ${i === activePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        // Last page + dots
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) buttons += `<span class="page-dots">…</span>`;
            buttons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // ----- Next arrow (only if not on last page) -----
        if (activePage < totalPages) {
            buttons += `<button class="page-btn" data-page="${activePage + 1}">›</button>`;
        }

        pagination.innerHTML = buttons;

        // ----- Attach click events -----
        pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const targetPage = parseInt(this.dataset.page);
                if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
                    window.updateWatchlist(currentStatus, targetPage);
                }
            });
        });
    };

    // ============================================
    // UPDATE WATCHLIST
    // ============================================
    window.updateWatchlist = function (status = 'all', page = 1) {
        const container = document.getElementById('watchlist-container');
        const pagination = document.getElementById('pagination');
        if (!container || !pagination) return;

        currentStatus = status;
        currentPage = page;

        // Filter data
        let filtered = [...(window.animeData || [])];
        if (status !== 'all') {
            filtered = filtered.filter(a => a.userStatus === status);
        }
        filtered.reverse(); // newest first

        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageAnime = filtered.slice(start, end);

        // Empty state
        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-anime">No anime found for "${status}".</div>`;
            pagination.innerHTML = '';
            return;
        }

        // Render cards
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

        // Render pagination
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
                window.updateWatchlist(this.getAttribute('data-status'), 1);
            });
        });
        // Initial load: show all
        window.updateWatchlist('all', 1);
        console.log('✅ Watchlist initialized');
    }

    // Expose init function globally
    window.initWatchlistFilters = initWatchlistFilters;
})();