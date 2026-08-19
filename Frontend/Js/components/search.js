// ============================================
// ANIME SEARCH – Primary: AniList (via proxy)
// Fallback: Jikan (direct, if needed)
// ============================================

(function () {
    'use strict';

    // ─── SEARCH CONFIG ────────────────────────────
    const SEARCH_CONFIG = {
        CACHE_DURATION: 10 * 60 * 1000,
        TIMEOUT: 5000,
        DEBOUNCE_DELAY: 300,
        MIN_QUERY_LENGTH: 2,
        MAX_RESULTS: 10,
        ANILIST_PROXY: `${window.API_BASE_URL || 'http://localhost:3000'}/api/proxy/anilist`,
        JIKAN_API: 'https://api.jikan.moe/v4/anime',
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
    let globalQuery = ''; // trimmed version used for filtering
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

    // ─── GLOBAL SEARCH ────────────────────────────
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
        } else {
            console.warn('updateAnimeDisplay not yet available');
        }
    }

    // ✅ Fixed: no longer overwrites the input value
    function performGlobalSearch(query) {
        globalQuery = query.trim(); // trimmed version used for filtering
        try {
            localStorage.setItem(SEARCH_CONFIG.STORAGE_KEY, globalQuery);
        } catch (_) { /* ignore */ }

        // ✅ IMPORTANT: Do NOT set input.value = globalQuery
        // This keeps the user's typed text intact (including spaces)

        if (!globalQuery) {
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

            // ✅ Page changed listener – no longer overwrites the input
            document.addEventListener('pageChanged', function (e) {
                if (e.detail.page === 'anime-list') {
                    // Keep the input value as is – do NOT set it to globalQuery
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

    // ─── MODAL SEARCH (unchanged, but with abort support) ──
    async function searchAnilist(query, signal) {
        const graphqlQuery = `
            query ($search: String) {
                Page(page: 1, perPage: 10) {
                    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
                        id
                        title { romaji english native }
                        coverImage { large medium }
                        episodes
                        format
                        averageScore
                        genres
                        status
                        description
                        duration
                    }
                }
            }
        `;
        try {
            console.log(`[AniList] Searching for: "${query}"`);
            const response = await fetch(SEARCH_CONFIG.ANILIST_PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { search: query }
                }),
                signal: signal
            });

            if (!response.ok) {
                console.warn(`[AniList] Proxy responded with ${response.status}`);
                return null;
            }

            const result = await response.json();

            if (result.errors) {
                console.warn('[AniList] GraphQL errors:', result.errors);
                return null;
            }

            const media = result.data?.Page?.media;
            if (!media || media.length === 0) {
                console.log('[AniList] No results');
                return null;
            }

            console.log(`[AniList] Found ${media.length} results`);

            return {
                data: media.map(item => ({
                    id: item.id,
                    title: item.title.english || item.title.romaji || item.title.native || 'Unknown',
                    title_english: item.title.english || '',
                    title_romaji: item.title.romaji || '',
                    title_japanese: item.title.native || '',
                    type: item.format || 'TV',
                    episodes: item.episodes || 0,
                    score: item.averageScore ? item.averageScore / 10 : null,
                    images: { jpg: { image_url: item.coverImage?.large || item.coverImage?.medium || null } },
                    genres: item.genres || [],
                    synopsis: item.description || '',
                    duration: item.duration || 20,
                    source: 'anilist',
                    status: item.status || '',
                }))
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[AniList] Request aborted');
                throw error;
            }
            console.warn('[AniList] Search failed:', error);
            return null;
        }
    }

    async function searchJikan(query, signal) {
        try {
            const url = `${SEARCH_CONFIG.JIKAN_API}?q=${encodeURIComponent(query)}&limit=10`;
            const response = await fetch(url, {
                signal: signal,
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`Jikan HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[Jikan] Request aborted');
                throw error;
            }
            console.warn('[Jikan] Search failed:', error);
            return null;
        }
    }

    async function performModalSearch(query) {
        const cacheKey = query.toLowerCase().trim();
        const cached = searchCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < SEARCH_CONFIG.CACHE_DURATION)) {
            console.log('[Search] Using cached results');
            return cached.data;
        }

        if (currentSearchController) {
            currentSearchController.abort();
        }
        currentSearchController = new AbortController();
        const signal = currentSearchController.signal;

        try {
            let result = await searchAnilist(query, signal);
            let source = 'anilist';

            if (!result || !result.data || result.data.length === 0) {
                console.log('[Search] AniList empty, trying Jikan');
                const jikanData = await searchJikan(query, signal);
                if (jikanData && jikanData.data && jikanData.data.length > 0) {
                    result = {
                        data: jikanData.data.map(item => ({
                            id: item.mal_id,
                            title: item.title || 'Unknown',
                            title_english: item.title_english || '',
                            title_romaji: '',
                            title_japanese: item.title_japanese || '',
                            type: item.type || 'TV',
                            episodes: item.episodes || 0,
                            score: item.score || null,
                            images: { jpg: { image_url: item.images?.jpg?.image_url || null } },
                            genres: item.genres?.map(g => g.name) || [],
                            synopsis: item.synopsis || '',
                            duration: item.duration || 20,
                            source: 'jikan'
                        }))
                    };
                    source = 'jikan';
                }
            }

            if (result && result.data && result.data.length > 0) {
                searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
                result._source = source;
                return result;
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

    function displaySearchResults(data, searchResults, source) {
        if (!searchResults) return;
        searchResults.innerHTML = '';
        if (!data || !data.data || data.data.length === 0) {
            searchResults.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #94A3B8;">
                    <i class="fas fa-search" style="font-size: 28px; display: block; margin-bottom: 12px; color: #6366F1;"></i>
                    <div style="font-weight: 600; margin-bottom: 4px;">No results found</div>
                    <small>Try using different keywords</small>
                    ${source ? `<div style="margin-top: 8px; font-size: 0.7rem; color: #64748B;">Searched via: ${source}</div>` : ''}
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        if (source) {
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                padding: 8px 16px;
                background: rgba(45, 163, 251, 0.1);
                border-bottom: 1px solid rgba(45, 163, 251, 0.1);
                font-size: 0.7rem;
                color: #6BB8FF;
                text-align: center;
            `;
            indicator.innerHTML = `<i class="fas fa-info-circle"></i> Results from: ${source}`;
            searchResults.appendChild(indicator);
        }

        data.data.forEach(anime => {
            const title = anime.title_english || anime.title_romaji || anime.title || 'Unknown';
            let genreDisplay = '';
            if (Array.isArray(anime.genres)) {
                genreDisplay = anime.genres.slice(0, 3).join(', ');
            }

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
            const coverUrl = anime.images?.jpg?.image_url ||
                anime.images?.large ||
                anime.coverImage?.large ||
                'https://placehold.co/45x65/2DA3FB/white?text=No+Image';
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
                        ${anime.source ? `<span style="font-size: 0.55rem; color: #64748B; background: rgba(45,163,251,0.1); padding: 1px 6px; border-radius: 10px;">${anime.source}</span>` : ''}
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
                synopsis: anime.synopsis || '',
                duration: anime.duration || 20,
                source: anime.source || source || 'unknown'
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
            const coverUrl = anime.images?.jpg?.image_url ||
                anime.images?.large ||
                anime.coverImage?.large ||
                anime.coverImage?.medium ||
                '';
            if (coverUrl) coverInput.value = coverUrl;
        }

        let genreString = '';
        if (Array.isArray(anime.genres)) {
            genreString = anime.genres
                .map(g => (typeof g === 'object' && g.name) ? g.name : g)
                .filter(g => g && g !== 'Award Winning')
                .join(', ');
        } else if (typeof anime.genres === 'string') {
            genreString = anime.genres;
        }
        if (genresInput) {
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
                const result = await performModalSearch(query);
                const source = result?._source || result?.data?.[0]?.source || 'AniList';
                displaySearchResults(result, searchResults, source);
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

    window.closeSearchResults = function () {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }
        const searchLoading = document.getElementById('searchLoading');
        if (searchLoading) searchLoading.style.display = 'none';
    };

    function initSearchSystem() {
        console.log('🔍 Initializing search system (AniList primary)...');

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

        AniPulseSearch.init();

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

        console.log('✅ Search system initialized (primary: AniList)');
    }

    window.initSearchSystem = initSearchSystem;
    window.AniPulseSearch = AniPulseSearch;

})();