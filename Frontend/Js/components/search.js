// ============================================
// ANIME SEARCH – FAST & LIGHTWEIGHT (No Proxy)
// ============================================

(function () {
    'use strict';

    // ─── SEARCH CONFIG ────────────────────────────
    const SEARCH_CONFIG = {
        CACHE_DURATION: 10 * 60 * 1000, // 10 min
        DEBOUNCE_DELAY: 300,
        MIN_QUERY_LENGTH: 2,
        MAX_RESULTS: 8,
        // ✅ Direct AniList GraphQL (no proxy, no fallback)
        ANILIST_URL: 'https://graphql.anilist.co',
        // Global search (unchanged)
        GLOBAL_DEBOUNCE: 300,
        GLOBAL_MIN_QUERY: 1,
        STORAGE_KEY: 'anipulse_search_query',
    };

    // ─── SEARCH CACHE (modal) ─────────────────────
    const searchCache = new Map();
    let searchTimeout = null;
    let isSearching = false;
    let currentSearchController = null;

    // ─── GLOBAL SEARCH STATE ──────────────────────
    let globalQuery = '';
    let globalDebounceTimer = null;
    let isNavigating = false;

    // ─── DOM REFS (lazy) ──────────────────────────
    function getDashboardSearchInput() {
        return document.getElementById('dashboardSearch');
    }

    function getAnimeListPage() {
        return document.getElementById('anime-list-page');
    }

    function getAnimeListMenuItem() {
        return document.querySelector('.menu-item[data-page="anime-list"]');
    }

    // ─── GLOBAL SEARCH ─────────────────────────────
    function navigateToAnimeList() {
        if (isNavigating) return;
        isNavigating = true;

        if (typeof navigateTo === 'function') {
            navigateTo('anime-list');
            const handler = function (e) {
                if (e.detail.page === 'anime-list') {
                    document.removeEventListener('pageChanged', handler);
                    applyGlobalSearch();
                    isNavigating = false;
                }
            };
            document.addEventListener('pageChanged', handler);
            setTimeout(() => {
                if (isNavigating) {
                    isNavigating = false;
                    applyGlobalSearch();
                }
            }, 500);
        } else {
            const menuItem = getAnimeListMenuItem();
            if (menuItem) {
                menuItem.click();
                setTimeout(() => {
                    applyGlobalSearch();
                    isNavigating = false;
                }, 400);
            } else {
                isNavigating = false;
            }
        }
    }

    function applyGlobalSearch() {
        if (typeof window.updateAnimeDisplay === 'function') {
            window.updateAnimeDisplay();
        }
    }

    // ─── FIXED: keep raw query (spaces preserved) ─
    function performGlobalSearch(query) {
        // Store raw query (including spaces) for display
        globalQuery = query;  // NO trim here
        try {
            localStorage.setItem(SEARCH_CONFIG.STORAGE_KEY, globalQuery);
        } catch (_) { /* ignore */ }

        const input = getDashboardSearchInput();
        if (input && input.value !== globalQuery) {
            input.value = globalQuery;
        }

        // Trim only when checking emptiness
        if (!globalQuery.trim()) {
            applyGlobalSearch();
            return;
        }

        const page = getAnimeListPage();
        if (!page || page.hidden) {
            navigateToAnimeList();
        } else {
            applyGlobalSearch();
        }
    }

    function clearGlobalSearch() {
        globalQuery = '';
        try {
            localStorage.removeItem(SEARCH_CONFIG.STORAGE_KEY);
        } catch (_) { /* ignore */ }
        const input = getDashboardSearchInput();
        if (input) {
            input.value = '';
        }
        applyGlobalSearch();
    }

    function handleGlobalSearchInput(event) {
        const query = event.target.value;
        clearTimeout(globalDebounceTimer);
        globalDebounceTimer = setTimeout(() => {
            performGlobalSearch(query);
        }, SEARCH_CONFIG.GLOBAL_DEBOUNCE);
    }

    function handleGlobalKeydown(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const input = getDashboardSearchInput();
            if (input) {
                input.focus();
                input.select();
            }
            return;
        }

        if (event.key === 'Escape') {
            const input = getDashboardSearchInput();
            if (input && document.activeElement === input) {
                event.preventDefault();
                clearGlobalSearch();
                input.blur();
            }
        }
    }

    // ─── PUBLIC GLOBAL SEARCH API ─────────────────
    const AniPulseSearch = {
        get query() { return globalQuery; },
        search(query) {
            const input = getDashboardSearchInput();
            if (input) input.value = query;
            performGlobalSearch(query);
        },
        clear() {
            clearGlobalSearch();
            const input = getDashboardSearchInput();
            if (input) input.focus();
        },
        refresh() { applyGlobalSearch(); },
        init() {
            const input = getDashboardSearchInput();
            if (!input) {
                console.warn('Global search input #dashboardSearch not found');
                return;
            }

            let savedQuery = '';
            try {
                savedQuery = localStorage.getItem(SEARCH_CONFIG.STORAGE_KEY) || '';
            } catch (_) { /* ignore */ }
            if (savedQuery) {
                input.value = savedQuery;
                globalQuery = savedQuery;
                const page = getAnimeListPage();
                if (page && !page.hidden) {
                    applyGlobalSearch();
                }
            }

            input.addEventListener('input', handleGlobalSearchInput);
            input.addEventListener('keydown', handleGlobalKeydown);
            document.addEventListener('keydown', handleGlobalKeydown);

            document.addEventListener('pageChanged', function (e) {
                if (e.detail.page === 'anime-list') {
                    const inp = getDashboardSearchInput();
                    if (inp && inp.value !== globalQuery) {
                        inp.value = globalQuery;
                    }
                    applyGlobalSearch();
                }
            });

            console.log('✅ Global Search System initialized');
        },
        destroy() {
            const input = getDashboardSearchInput();
            if (input) {
                input.removeEventListener('input', handleGlobalSearchInput);
                input.removeEventListener('keydown', handleGlobalKeydown);
            }
            document.removeEventListener('keydown', handleGlobalKeydown);
            clearTimeout(globalDebounceTimer);
        }
    };

    // ─── FAST ANILIST SEARCH (NO PROXY) ───────────
    async function searchAnilistFast(query, signal) {
        const graphqlQuery = `
            query ($search: String) {
                Page(page: 1, perPage: ${SEARCH_CONFIG.MAX_RESULTS}) {
                    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
                        id
                        title {
                            english
                            romaji
                            native
                        }
                        coverImage {
                            large
                        }
                        episodes
                        format
                        averageScore
                        genres
                        duration
                    }
                }
            }
        `;

        try {
            const response = await fetch(SEARCH_CONFIG.ANILIST_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { search: query },
                }),
                signal: signal,
            });

            if (!response.ok) {
                console.warn(`[AniList] HTTP ${response.status}`);
                return null;
            }

            const result = await response.json();
            if (result.errors) {
                console.warn('[AniList] GraphQL errors:', result.errors);
                return null;
            }

            const media = result.data?.Page?.media;
            if (!media || media.length === 0) {
                return null;
            }

            // Transform to our internal format
            return media.map(item => ({
                id: item.id,
                title: item.title.english || item.title.romaji || item.title.native || 'Unknown',
                title_english: item.title.english || '',
                title_romaji: item.title.romaji || '',
                type: item.format || 'TV',
                episodes: item.episodes || 0,
                score: item.averageScore ? item.averageScore / 10 : null,
                images: { jpg: { image_url: item.coverImage?.large || null } },
                genres: item.genres || [],
                duration: item.duration || 20,
            }));
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[Search] Request aborted');
                throw error;
            }
            console.warn('[AniList] Search failed:', error);
            return null;
        }
    }

    // ─── MAIN MODAL SEARCH ─────────────────────────
    async function performModalSearch(query) {
        const cacheKey = query.toLowerCase().trim();
        const cached = searchCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < SEARCH_CONFIG.CACHE_DURATION)) {
            console.log('[Search] Using cached results');
            return cached.data;
        }

        // Abort previous request
        if (currentSearchController) {
            currentSearchController.abort();
        }
        currentSearchController = new AbortController();
        const signal = currentSearchController.signal;

        try {
            const results = await searchAnilistFast(query, signal);
            if (results && results.length > 0) {
                searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
                return results;
            }
            return null;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[Search] Request aborted');
                return null;
            }
            console.warn('[Search] Error:', error);
            return null;
        } finally {
            currentSearchController = null;
        }
    }

    // ─── DISPLAY RESULTS ──────────────────────────
    function displaySearchResults(results, searchResults) {
        if (!searchResults) return;
        searchResults.innerHTML = '';

        if (!results || results.length === 0) {
            searchResults.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #94A3B8;">
                    <i class="fas fa-search" style="font-size: 28px; display: block; margin-bottom: 12px; color: #6366F1;"></i>
                    <div style="font-weight: 600; margin-bottom: 4px;">No results found</div>
                    <small>Try using different keywords</small>
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        results.forEach(anime => {
            const title = anime.title_english || anime.title_romaji || anime.title || 'Unknown';
            const coverUrl = anime.images?.jpg?.image_url || 'https://placehold.co/45x65/2DA3FB/white?text=No+Image';
            const genreDisplay = Array.isArray(anime.genres) ? anime.genres.slice(0, 3).join(', ') : '';

            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid rgba(45, 163, 251, 0.08);
                transition: all 0.2s ease;
            `;
            item.innerHTML = `
                <img src="${coverUrl}" 
                     style="width: 45px; height: 65px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='https://placehold.co/45x65/2DA3FB/white?text=No+Image'">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--text-primary, white); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.escapeHtml(title)}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.7rem; color: #94A3B8;">${anime.type || 'TV'}</span>
                        <span style="font-size: 0.7rem; color: #94A3B8;">${anime.episodes || '?'} eps</span>
                        ${anime.score ? `<span style="font-size: 0.7rem; color: #FBBF24;">⭐ ${anime.score}</span>` : ''}
                        ${genreDisplay ? `<span style="font-size: 0.6rem; color: #94A3B8; background: rgba(45,163,251,0.08); padding: 1px 8px; border-radius: 10px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${window.escapeHtml(genreDisplay)}">${window.escapeHtml(genreDisplay)}</span>` : ''}
                    </div>
                </div>
            `;

            const animeData = {
                id: anime.id,
                title: title,
                title_english: anime.title_english || '',
                title_romaji: anime.title_romaji || '',
                type: anime.type || 'TV',
                episodes: anime.episodes || 1,
                score: anime.score || null,
                images: anime.images || { jpg: { image_url: coverUrl } },
                genres: anime.genres || [],
                duration: anime.duration || 20,
            };

            item.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.selectAnimeFromSearch === 'function') {
                    window.selectAnimeFromSearch(animeData);
                }
            });
            searchResults.appendChild(item);
        });
        searchResults.style.display = 'block';
    }

    // ─── SELECT ANIME ─────────────────────────────
    window.selectAnimeFromSearch = function (anime) {
        console.log('🎯 Selecting anime:', anime.title);

        const titleInput = document.getElementById('animeTitle');
        const typeSelect = document.getElementById('animeType');
        const episodesInput = document.getElementById('animeEpisodes');
        const durationInput = document.getElementById('animeDuration');
        const coverInput = document.getElementById('animeCover');
        const genresInput = document.getElementById('animeGenres');
        const scoreInput = document.getElementById('animeScore');
        const searchResults = document.getElementById('searchResults');

        if (titleInput) {
            titleInput.value = anime.title || '';
            titleInput.style.border = '2px solid #2DA3FB';
            setTimeout(() => { titleInput.style.border = ''; }, 1000);
        }
        if (typeSelect) {
            typeSelect.value = anime.type || 'TV';
            const changeEvent = new Event('change');
            typeSelect.dispatchEvent(changeEvent);
        }
        if (episodesInput) {
            episodesInput.value = anime.episodes || 1;
            syncProgressMax();
        }
        if (durationInput) {
            if (anime.type === 'Movie') {
                durationInput.value = anime.duration ? Math.round(parseInt(anime.duration) || 120) : '120';
                durationInput.disabled = false;
            } else {
                durationInput.value = anime.duration || '20';
                durationInput.disabled = true;
            }
        }
        if (coverInput && anime.images) {
            const coverUrl = anime.images?.jpg?.image_url || '';
            if (coverUrl) coverInput.value = coverUrl;
        }

        if (genresInput && anime.genres) {
            let genreString = '';
            if (Array.isArray(anime.genres)) {
                genreString = anime.genres
                    .map(g => (typeof g === 'object' && g.name) ? g.name : g)
                    .filter(g => g && g !== 'Award Winning')
                    .join(', ');
            } else if (typeof anime.genres === 'string') {
                genreString = anime.genres;
            }
            genresInput.value = genreString;
            console.log('✅ Genres set to:', genreString);
        }

        if (scoreInput && anime.score) {
            const score = typeof anime.score === 'number' ? anime.score : parseFloat(anime.score);
            if (!isNaN(score)) scoreInput.value = score;
        }

        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }

        if (typeof showToast === 'function') {
            const genreCount = Array.isArray(anime.genres) ? anime.genres.length : 0;
            showToast(`✓ Selected: ${anime.title} (${genreCount} genres)`, 'success');
        }
        console.log('✅ Anime selected successfully');
    };

    function syncProgressMax() {
        if (typeof window.syncProgressMax === 'function') {
            window.syncProgressMax();
        }
    }

    // ─── SEARCH WRAPPER ────────────────────────────
    window.searchAnime = async function () {
        const searchInput = document.getElementById('animeTitle');
        if (!searchInput) return;
        const query = searchInput.value.trim();
        const searchResults = document.getElementById('searchResults');

        if (searchTimeout) clearTimeout(searchTimeout);
        if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
            if (searchResults) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            }
            const searchLoading = document.getElementById('searchLoading');
            if (searchLoading) searchLoading.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(async () => {
            if (isSearching) return;
            isSearching = true;
            const searchLoading = document.getElementById('searchLoading');
            if (searchLoading) {
                searchLoading.style.display = 'block';
                searchLoading.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Searching for "${window.escapeHtml(query)}"...`;
            }
            if (searchResults) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            }
            try {
                const results = await performModalSearch(query);
                displaySearchResults(results, searchResults);
            } catch (error) {
                console.error('Search error:', error);
                if (searchResults) {
                    searchResults.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #94A3B8;">
                            <i class="fas fa-exclamation-circle" style="font-size: 28px; color: #F87171; display: block; margin-bottom: 12px;"></i>
                            <div>Search failed. Please try again.</div>
                        </div>
                    `;
                    searchResults.style.display = 'block';
                }
            } finally {
                if (searchLoading) searchLoading.style.display = 'none';
                isSearching = false;
            }
        }, SEARCH_CONFIG.DEBOUNCE_DELAY);
    };

    // ─── CLOSE RESULTS ────────────────────────────
    window.closeSearchResults = function () {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }
        const searchLoading = document.getElementById('searchLoading');
        if (searchLoading) searchLoading.style.display = 'none';
    };

    // ─── INIT ──────────────────────────────────────
    function initSearchSystem() {
        console.log('🔍 Initializing fast search system (AniList direct)...');

        // 1. Modal search (add anime)
        const searchInput = document.getElementById('animeTitle');
        if (searchInput) {
            const newInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newInput, searchInput);
            newInput.addEventListener('input', window.searchAnime);
            newInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                        searchTimeout = null;
                    }
                    window.searchAnime();
                }
            });
        }

        // 2. Global search (dashboard)
        AniPulseSearch.init();

        // 3. Close results on Escape or outside click
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeSearchResults();
        });

        document.addEventListener('click', (e) => {
            const results = document.getElementById('searchResults');
            const input = document.getElementById('animeTitle');
            if (results && input) {
                if (!results.contains(e.target) && e.target !== input) {
                    results.style.display = 'none';
                }
            }
        });

        // 4. Dropdown toggle (dashboard search)
        const searchToggle = document.getElementById('searchToggle');
        const searchDropdown = document.querySelector('.search-dropdown');
        const dashboardSearch = document.getElementById('dashboardSearch');
        if (searchToggle && searchDropdown) {
            searchToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                searchDropdown.classList.toggle('open');
                if (dashboardSearch) dashboardSearch.focus();
            });
            searchDropdown.addEventListener('click', (e) => e.stopPropagation());
            document.addEventListener('click', () => {
                searchDropdown.classList.remove('open');
            });
        }

        console.log('✅ Fast search system initialized (direct AniList)');
    }

    // Expose
    window.initSearchSystem = initSearchSystem;
    window.AniPulseSearch = AniPulseSearch;

})();