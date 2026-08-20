(function () {
    'use strict';

    const itemsPerPage = 30;
    let currentPage = 1;
    let currentStatus = 'all';

    window.renderPagination = function (totalPages, activePage) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        if (totalPages <= 1) { pagination.innerHTML = ''; return; }

        let buttons = '';
        buttons += `<button class="page-btn" ${activePage === 1 ? 'disabled' : ''} data-page="1">«</button>`;
        buttons += `<button class="page-btn" ${activePage === 1 ? 'disabled' : ''} data-page="${activePage - 1}">‹</button>`;

        const maxVisible = 3;
        let startPage = Math.max(1, activePage - maxVisible);
        let endPage = Math.min(totalPages, activePage + maxVisible);

        if (startPage > 2) {
            buttons += `<button class="page-btn" data-page="1">1</button>`;
            buttons += `<span class="page-dots">…</span>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            buttons += `<button class="page-btn ${i === activePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        if (endPage < totalPages - 1) {
            buttons += `<span class="page-dots">…</span>`;
            buttons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        buttons += `<button class="page-btn" ${activePage === totalPages ? 'disabled' : ''} data-page="${activePage + 1}">›</button>`;
        buttons += `<button class="page-btn" ${activePage === totalPages ? 'disabled' : ''} data-page="${totalPages}">»</button>`;

        pagination.innerHTML = buttons;

        pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetPage = parseInt(btn.dataset.page);
                if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
                    window.updateWatchlist(currentStatus, targetPage);
                }
            });
        });
    };

    window.updateWatchlist = function (status = 'all', page = 1) {
        const container = document.getElementById('watchlist-container');
        const pagination = document.getElementById('pagination');
        if (!container || !pagination) return;

        currentStatus = status;
        currentPage = page;

        let filtered = [...(window.animeData || [])];
        if (status !== 'all') filtered = filtered.filter(a => a.userStatus === status);
        filtered.reverse();

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageAnime = filtered.slice(start, end);

        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-anime">No anime found for "${status}".</div>`;
            pagination.innerHTML = '';
            return;
        }

        container.innerHTML = pageAnime.map(anime => {
            const score = anime.score ? parseFloat(anime.score).toFixed(1) : null;
            const episodesText = anime.episodes ? `${anime.episodes} Eps` : '';

            return `
        <div class="anime-card fade-in" data-id="${anime.id}" onclick="window.editAnime && window.editAnime('${anime.id}')">
            <div class="anime-img-wrapper">
                <img src="${anime.cover || 'https://placehold.co/300x400/6a5acd/white?text=No+Image'}"
                     alt="${window.escapeHtml(anime.title)}"
                     class="anime-cover"
                     loading="lazy"
                     onerror="this.src='https://placehold.co/300x400/6a5acd/white?text=No+Image'">
                ${score ? `<div class="rating-badge">⭐ ${score}</div>` : ''}
            </div>
            <div class="anime-info">
                <div class="anime-title" title="${window.escapeHtml(anime.title)}">${window.escapeHtml(anime.title)}</div>
                <div class="anime-meta">
                    <span>${anime.type || 'TV'}</span>
                    ${episodesText ? `<span>${episodesText}</span>` : ''}
                </div>
            </div>
        </div>
    `;
        }).join('');

        // Pagination (keep as is)
        window.renderPagination(totalPages, page);
    };

    function initWatchlistFilters() {
        const filterBtns = document.querySelectorAll('.watchlist-filters .filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.updateWatchlist(btn.getAttribute('data-status'), 1);
            });
        });
        window.updateWatchlist('all', 1);
        console.log('✅ Watchlist initialized');
    }

    window.initWatchlistFilters = initWatchlistFilters;
})();