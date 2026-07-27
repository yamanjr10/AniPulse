// ============================================
// ANIME SEARCH (Jikan, AniList, Kitsu fallback)
// + Global Search Manager (AniPulseSearch)
// + Modal search (add anime)
// ============================================

(function () {
    'use strict';

    // ─── SEARCH CONFIG ────────────────────────────
    const SEARCH_CONFIG = {
        CACHE_DURATION: 10 * 60 * 1000,
        TIMEOUT: 8000,
        DEBOUNCE_DELAY: 600,
        MIN_QUERY_LENGTH: 2,
        MAX_RESULTS: 10,
        JIKAN_API: 'https://api.jikan.moe/v4/anime',
        ANILIST_API: 'https://graphql.anilist.co',
        KITSU_API: 'https://kitsu.io/api/edge/anime',
        // Global search
        GLOBAL_DEBOUNCE: 300,
        GLOBAL_MIN_QUERY: 1,
        STORAGE_KEY: 'anipulse_search_query',
    };

    // ─── SEARCH CACHE (modal) ─────────────────────
    const searchCache = new Map();
    let isJikanAvailable = true;
    let apiCheckInProgress = false;
    let lastApiCheck = 0;
    let usingFallback = false;
    let searchTimeout = null;
    let isSearching = false;

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

    // ─── GLOBAL SEARCH ────────────────────────────
    function navigateToAnimeList() {
        if (isNavigating) return;
        isNavigating = true;

        // Use the central navigation system if available
        if (typeof navigateTo === 'function') {
            navigateTo('anime-list');
            // Wait for page to become active
            const handler = function (e) {
                if (e.detail.page === 'anime-list') {
                    document.removeEventListener('pageChanged', handler);
                    applyGlobalSearch();
                    isNavigating = false;
                }
            };
            document.addEventListener('pageChanged', handler);
            // Fallback: if event doesn't fire, apply after a short delay
            setTimeout(() => {
                if (isNavigating) {
                    isNavigating = false;
                    applyGlobalSearch();
                }
            }, 500);
        } else {
            // Fallback: simulate click on menu item
            const menuItem = getAnimeListMenuItem();
            if (menuItem) {
                menuItem.click();
                // Wait for page change via the old system (if no navigateTo)
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
        // This triggers a re‑render of the anime table
        if (typeof window.updateAnimeDisplay === 'function') {
            window.updateAnimeDisplay();
        } else {
            console.warn('updateAnimeDisplay not yet available');
        }
    }

    function performGlobalSearch(query) {
        globalQuery = query.trim();
        // Save to localStorage for persistence
        try {
            localStorage.setItem(SEARCH_CONFIG.STORAGE_KEY, globalQuery);
        } catch (_) { /* ignore */ }

        // Sync input field
        const input = getDashboardSearchInput();
        if (input && input.value !== globalQuery) {
            input.value = globalQuery;
        }

        // If query is empty, just refresh the list (clear filter)
        if (!globalQuery) {
            applyGlobalSearch();
            return;
        }

        // Navigate to anime list if not already there
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

    // ─── GLOBAL SEARCH INPUT HANDLERS ─────────────
    function handleGlobalSearchInput(event) {
        const query = event.target.value;
        clearTimeout(globalDebounceTimer);
        globalDebounceTimer = setTimeout(() => {
            performGlobalSearch(query);
        }, SEARCH_CONFIG.GLOBAL_DEBOUNCE);
    }

    function handleGlobalKeydown(event) {
        // Ctrl+K / Cmd+K → focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const input = getDashboardSearchInput();
            if (input) {
                input.focus();
                input.select();
            }
            return;
        }

        // Escape → clear search and blur
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
        get query() {
            return globalQuery;
        },

        search(query) {
            const input = getDashboardSearchInput();
            if (input) {
                input.value = query;
            }
            performGlobalSearch(query);
        },

        clear() {
            clearGlobalSearch();
            const input = getDashboardSearchInput();
            if (input) {
                input.focus();
            }
        },

        refresh() {
            applyGlobalSearch();
        },

        init() {
            const input = getDashboardSearchInput();
            if (!input) {
                console.warn('Global search input #dashboardSearch not found');
                return;
            }

            // Restore last query from localStorage
            let savedQuery = '';
            try {
                savedQuery = localStorage.getItem(SEARCH_CONFIG.STORAGE_KEY) || '';
            } catch (_) { /* ignore */ }
            if (savedQuery) {
                input.value = savedQuery;
                globalQuery = savedQuery;
                // If anime list is already visible, apply search immediately
                const page = getAnimeListPage();
                if (page && !page.hidden) {
                    applyGlobalSearch();
                }
            }

            // Attach event listeners
            input.addEventListener('input', handleGlobalSearchInput);
            input.addEventListener('keydown', handleGlobalKeydown);

            // Global keyboard shortcut (also handled in keydown, but need document listener)
            document.addEventListener('keydown', handleGlobalKeydown);

            // When the anime list page becomes active, re‑apply search
            document.addEventListener('pageChanged', function (e) {
                if (e.detail.page === 'anime-list') {
                    // Ensure input value matches global query
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

    // ─── MODAL SEARCH FUNCTIONS (preserved) ──────

    // --- Check API status ---
    async function checkApiAvailability() {
        const now = Date.now();
        if (now - lastApiCheck < 30000) return isJikanAvailable;
        if (apiCheckInProgress) return isJikanAvailable;
        apiCheckInProgress = true;
        lastApiCheck = now;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch('https://api.jikan.moe/v4/status', {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                isJikanAvailable = data.myanimelist_heartbeat?.status === 'HEALTHY' && !data.myanimelist_heartbeat?.down;
            } else {
                isJikanAvailable = false;
            }
        } catch (error) {
            isJikanAvailable = false;
        }
        apiCheckInProgress = false;
        usingFallback = !isJikanAvailable;
        return isJikanAvailable;
    }

    // --- Search with AniList ---
    async function searchAnilist(query) {
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
            const response = await fetch(SEARCH_CONFIG.ANILIST_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { search: query }
                })
            });
            if (!response.ok) throw new Error('AniList API error');
            const data = await response.json();
            if (!data.data?.Page?.media) return null;
            return {
                data: data.data.Page.media.map(media => ({
                    title: media.title.english || media.title.romaji || media.title.native || 'Unknown',
                    title_english: media.title.english || '',
                    title_romaji: media.title.romaji || '',
                    title_japanese: media.title.native || '',
                    type: media.format || 'TV',
                    episodes: media.episodes || 0,
                    score: media.averageScore ? media.averageScore / 10 : null,
                    images: { jpg: { image_url: media.coverImage?.large || media.coverImage?.medium || null } },
                    genres: media.genres || [],
                    synopsis: media.description || '',
                    duration: media.duration || 20,
                    source: 'anilist'
                }))
            };
        } catch (error) {
            console.warn('AniList search failed:', error);
            return null;
        }
    }

    // --- Search with Kitsu ---
    async function searchKitsu(query) {
        try {
            const response = await fetch(
                `${SEARCH_CONFIG.KITSU_API}?filter[text]=${encodeURIComponent(query)}&page[limit]=10&sort=-averageRating`,
                { headers: { 'Accept': 'application/json' } }
            );
            if (!response.ok) throw new Error('Kitsu API error');
            const data = await response.json();
            if (!data.data || data.data.length === 0) return null;
            return {
                data: data.data.map(item => {
                    const attrs = item.attributes;
                    return {
                        title: attrs.titles?.en || attrs.titles?.en_jp || attrs.canonicalTitle || 'Unknown',
                        title_english: attrs.titles?.en || '',
                        title_romaji: attrs.titles?.en_jp || '',
                        title_japanese: attrs.titles?.ja_jp || '',
                        type: attrs.showType || 'TV',
                        episodes: attrs.episodeCount || 0,
                        score: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : null,
                        images: { jpg: { image_url: attrs.posterImage?.original || attrs.posterImage?.large || null } },
                        genres: attrs.genres?.map(g => g.name) || [],
                        synopsis: attrs.synopsis || '',
                        duration: attrs.episodeLength || 20,
                        source: 'kitsu'
                    };
                })
            };
        } catch (error) {
            console.warn('Kitsu search failed:', error);
            return null;
        }
    }

    // --- Search with Jikan ---
    async function searchJikan(query) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const url = `${SEARCH_CONFIG.JIKAN_API}?q=${encodeURIComponent(query)}&limit=10`;
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);
            if (response.status === 504 || response.status === 429) throw new Error(`API error: ${response.status}`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('Jikan search failed:', error);
            throw error;
        }
    }

    // --- Main search (modal) ---
    async function performModalSearch(query) {
        const cacheKey = query.toLowerCase().trim();
        const cached = searchCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < SEARCH_CONFIG.CACHE_DURATION)) {
            console.log('📦 Using cached results');
            return cached.data;
        }
        try {
            await checkApiAvailability();
            if (isJikanAvailable) {
                try {
                    const data = await searchJikan(query);
                    if (data && data.data && data.data.length > 0) {
                        searchCache.set(cacheKey, { data, timestamp: Date.now() });
                        return data;
                    }
                } catch (jikanError) {
                    isJikanAvailable = false;
                    usingFallback = true;
                }
            }
            const anilistData = await searchAnilist(query);
            if (anilistData && anilistData.data && anilistData.data.length > 0) {
                searchCache.set(cacheKey, { data: anilistData, timestamp: Date.now() });
                return anilistData;
            }
            const kitsuData = await searchKitsu(query);
            if (kitsuData && kitsuData.data && kitsuData.data.length > 0) {
                searchCache.set(cacheKey, { data: kitsuData, timestamp: Date.now() });
                return kitsuData;
            }
            return null;
        } catch (error) {
            console.error('All search methods failed:', error);
            return null;
        }
    }

    // --- Display results (modal) ---
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
            const sourceIndicator = document.createElement('div');
            sourceIndicator.style.cssText = `
                padding: 8px 16px;
                background: rgba(139, 92, 246, 0.1);
                border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                font-size: 0.7rem;
                color: #A78BFA;
                text-align: center;
            `;
            sourceIndicator.innerHTML = `<i class="fas fa-info-circle"></i> Results from: ${source}`;
            searchResults.appendChild(sourceIndicator);
        }
        data.data.forEach(anime => {
            const title = anime.title_english || anime.title_romaji || anime.title || 'Unknown';
            let genreDisplay = '';
            if (anime.genres) {
                if (Array.isArray(anime.genres)) {
                    if (anime.genres.length > 0 && typeof anime.genres[0] === 'object') {
                        genreDisplay = anime.genres.slice(0, 3).map(g => g.name).join(', ');
                    } else {
                        genreDisplay = anime.genres.slice(0, 3).join(', ');
                    }
                }
            }
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                transition: all 0.2s ease;
            `;
            const coverUrl = anime.images?.jpg?.image_url ||
                anime.images?.large ||
                anime.coverImage?.large ||
                'https://placehold.co/45x65/6a5acd/white?text=No+Image';
            item.innerHTML = `
                <img src="${coverUrl}" 
                     style="width: 45px; height: 65px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='https://placehold.co/45x65/6a5acd/white?text=No+Image'">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--color-text-primary, white); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.escapeHtml(title)}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.7rem; color: #94A3B8;">${anime.type || 'TV'}</span>
                        <span style="font-size: 0.7rem; color: #94A3B8;">${anime.episodes || '?'} eps</span>
                        ${anime.score ? `<span style="font-size: 0.7rem; color: #FBBF24;">⭐ ${anime.score}</span>` : ''}
                        ${genreDisplay ? `<span style="font-size: 0.6rem; color: #94A3B8; background: rgba(139,92,246,0.08); padding: 1px 8px; border-radius: 10px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${window.escapeHtml(genreDisplay)}">${window.escapeHtml(genreDisplay)}</span>` : ''}
                        ${anime.source ? `<span style="font-size: 0.55rem; color: #64748B; background: rgba(139,92,246,0.1); padding: 1px 6px; border-radius: 10px;">${anime.source}</span>` : ''}
                    </div>
                </div>
            `;
            const animeData = {
                title: title,
                title_english: anime.title_english || '',
                title_romaji: anime.title_romaji || '',
                type: anime.type || 'TV',
                episodes: anime.episodes || 1,
                score: anime.score || null,
                images: { jpg: { image_url: coverUrl } },
                genres: anime.genres || [],
                synopsis: anime.synopsis || '',
                duration: anime.duration || 20,
                source: anime.source || source || 'unknown'
            };
            item.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.selectAnimeFromSearch === 'function') {
                    window.selectAnimeFromSearch(animeData);
                }
            };
            searchResults.appendChild(item);
        });
        searchResults.style.display = 'block';
    }

    // --- Select anime from search (fills form) ---
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
            titleInput.style.border = '2px solid #10B981';
            setTimeout(() => { titleInput.style.border = ''; }, 1000);
        }
        if (typeSelect) {
            typeSelect.value = anime.type || 'TV';
            const changeEvent = new Event('change');
            typeSelect.dispatchEvent(changeEvent);
        }
        if (episodesInput) {
            episodesInput.value = anime.episodes || 1;
        }
        if (durationInput) {
            if (anime.type === 'Movie') {
                durationInput.value = anime.duration ? Math.round(parseInt(anime.duration) || 120) : '120';
                durationInput.readOnly = false;
            } else {
                durationInput.value = anime.duration || '20';
                durationInput.readOnly = true;
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
        if (genresInput && anime.genres) {
            let genreString = '';
            if (Array.isArray(anime.genres)) {
                if (anime.genres.length > 0 && typeof anime.genres[0] === 'object') {
                    genreString = anime.genres.filter(g => g.name !== 'Award Winning').map(g => g.name).join(', ');
                } else {
                    genreString = anime.genres.join(', ');
                }
            } else if (typeof anime.genres === 'string') {
                genreString = anime.genres;
            }
            genresInput.value = genreString;
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

    // --- Main search function (for modal) ---
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
                const source = result?.data?.[0]?.source || (usingFallback ? 'AniList/Kitsu' : 'Jikan');
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

    // --- Close search results (modal) ---
    window.closeSearchResults = function () {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }
        const searchLoading = document.getElementById('searchLoading');
        if (searchLoading) searchLoading.style.display = 'none';
    };

    // --- Init search system (modal + global) ---
    function initSearchSystem() {
        console.log('🔍 Initializing search system...');

        // 1. Modal search (add anime)
        const searchInput = document.getElementById('animeTitle');
        if (searchInput) {
            // Clone to remove old listeners
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

        // 3. Close results on Escape or outside click (modal)
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

        checkApiAvailability();
        console.log('✅ Search system initialized');
    }

    window.initSearchSystem = initSearchSystem;
    window.AniPulseSearch = AniPulseSearch;

})();