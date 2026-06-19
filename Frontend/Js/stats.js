// ============================================
// STATISTICS HERO SECTION - DYNAMIC DATA
// ============================================

(function() {
    'use strict';

    console.log('🚀 Loading Statistics Hero...');

    function updateStatsHero() {
        console.log('🔄 Updating Statistics Hero...');
        
        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        const userName = userProfile.name || 
                         JSON.parse(localStorage.getItem('user') || '{}').username || 
                         'AnimeFan';

        // ============================================
        // CALCULATE STATISTICS
        // ============================================
        
        // Completed
        const completed = animeData.filter(a => a.userStatus === 'Completed').length;
        
        // Total Episodes
        let totalEpisodes = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed') {
                totalEpisodes += a.episodes || 0;
            }
        });
        
        // Watch Time
        let totalHours = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed') {
                if (a.type === 'Movie') {
                    totalHours += (a.duration || 120) / 60;
                } else {
                    const eps = a.episodes || 0;
                    const duration = a.duration || 20;
                    totalHours += (eps * duration) / 60;
                }
            }
        });
        totalHours = Math.round(totalHours);
        
        let watchTimeDisplay = '';
        if (totalHours >= 8760) {
            const years = Math.floor(totalHours / 8760);
            const days = Math.floor((totalHours % 8760) / 24);
            watchTimeDisplay = `${years}y ${days}d`;
        } else if (totalHours >= 24) {
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;
            watchTimeDisplay = `${days}d ${hours}h`;
        } else {
            watchTimeDisplay = `${totalHours}h`;
        }
        
        // Average Rating
        const ratedAnime = animeData.filter(a => a.score && a.score > 0);
        let avgRating = 0;
        if (ratedAnime.length > 0) {
            const totalScore = ratedAnime.reduce((sum, a) => sum + a.score, 0);
            avgRating = (totalScore / ratedAnime.length);
        }
        const avgRatingDisplay = avgRating > 0 ? avgRating.toFixed(1) : '0.0';
        
        // Most Watched Genre
        const genreCount = {};
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.genres && Array.isArray(a.genres)) {
                a.genres.forEach(g => {
                    const genreName = typeof g === 'object' ? g.name : g;
                    if (genreName) {
                        genreCount[genreName] = (genreCount[genreName] || 0) + 1;
                    }
                });
            }
        });
        const topGenre = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';
        
        // Streak
        const completionMonths = new Set();
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = new Date(a.actualFinishDate);
                if (!isNaN(date.getTime())) {
                    const key = `${date.getFullYear()}-${date.getMonth()}`;
                    completionMonths.add(key);
                }
            }
        });
        const streakMonths = completionMonths.size;
        let streakDisplay = streakMonths > 0 ? `${streakMonths} month${streakMonths > 1 ? 's' : ''}` : 'Not started';

        // ============================================
        // UPDATE DOM
        // ============================================
        
        // Username
        const usernameEl = document.getElementById('heroUsername');
        if (usernameEl) usernameEl.textContent = userName;
        
        // Subtitle
        const subtitleEl = document.getElementById('heroSubtitle');
        if (subtitleEl) {
            if (completed === 0) {
                subtitleEl.textContent = 'Start your anime journey by adding your first anime! 🌟';
            } else if (completed < 10) {
                subtitleEl.textContent = 'You\'re just getting started! Keep exploring! 🚀';
            } else if (completed < 50) {
                subtitleEl.textContent = 'Building an impressive collection! 🎯';
            } else if (completed < 100) {
                subtitleEl.textContent = 'Dedicated anime fan! Keep it up! 🔥';
            } else if (completed < 500) {
                subtitleEl.textContent = 'Anime veteran! Your collection is legendary! 🏆';
            } else {
                subtitleEl.textContent = 'Anime God! Your dedication is inspiring! ⭐';
            }
        }
        
        // Insights
        const insight1 = document.getElementById('heroInsight1');
        const insight2 = document.getElementById('heroInsight2');
        const insight3 = document.getElementById('heroInsight3');
        
        if (insight1) {
            insight1.textContent = completed === 0 ? 'Add anime to discover' : topGenre;
        }
        
        if (insight2) {
            insight2.textContent = completed === 0 ? 'Complete anime' : streakDisplay;
        }
        
        if (insight3) {
            insight3.textContent = completed === 0 ? 'Rate your anime' : `${avgRatingDisplay}★`;
        }
        
        // Stat Cards
        const completedEl = document.getElementById('heroCompleted');
        const episodesEl = document.getElementById('heroEpisodes');
        const timeEl = document.getElementById('heroTime');
        const ratingEl = document.getElementById('heroRating');
        
        if (completedEl) completedEl.textContent = completed.toLocaleString();
        if (episodesEl) episodesEl.textContent = totalEpisodes.toLocaleString();
        if (timeEl) timeEl.textContent = watchTimeDisplay;
        if (ratingEl) ratingEl.textContent = avgRatingDisplay;
        
        console.log('✅ Statistics Hero updated:', { completed, totalEpisodes, totalHours, avgRating, topGenre, streakMonths });
    }

    // ============================================
    // INITIALIZE
    // ============================================

    function initStatsHero() {
        updateStatsHero();
        
        // Listen for data changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData' || e.key === 'userProfile' || e.key === 'user') {
                setTimeout(updateStatsHero, 200);
            }
        });
        
        // Listen for visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateStatsHero, 300);
            }
        });
    }

    // Hook into Statistics page navigation
    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(initStatsHero, 200);
        });
    }

    // Init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initStatsHero, 500);
        });
    } else {
        setTimeout(initStatsHero, 500);
    }

    // Hook into updateAllComponents
    const originalUpdateAllComponents = window.updateAllComponents;
    if (typeof originalUpdateAllComponents === 'function') {
        window.updateAllComponents = function() {
            originalUpdateAllComponents();
            setTimeout(updateStatsHero, 200);
        };
    }

    console.log('✅ Statistics Hero initialized!');

})();

// ============================================
// OVERVIEW METRICS - DYNAMIC DATA (No Count-up)
// ============================================

(function() {
    'use strict';

    console.log('🚀 Loading Overview Metrics...');

    // ============================================
    // UPDATE METRICS
    // ============================================

    function updateOverviewMetrics() {
        console.log('🔄 Updating Overview Metrics...');
        
        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];

        // ============================================
        // CALCULATE ALL METRICS
        // ============================================

        // 1. Total Completed
        const completed = animeData.filter(a => a.userStatus === 'Completed').length;

        // 2. Total Episodes
        let totalEpisodes = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed') {
                totalEpisodes += a.episodes || 0;
            }
        });

        // 3. Watch Time
        let totalHours = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed') {
                if (a.type === 'Movie') {
                    totalHours += (a.duration || 120) / 60;
                } else {
                    const eps = a.episodes || 0;
                    const duration = a.duration || 20;
                    totalHours += (eps * duration) / 60;
                }
            }
        });
        totalHours = Math.round(totalHours);

        let watchTimeDisplay = '';
        let watchTimeFull = '';
        if (totalHours >= 8760) {
            const years = (totalHours / 8760).toFixed(1);
            watchTimeDisplay = `${years} yr`;
            watchTimeFull = `${years} Years`;
        } else if (totalHours >= 24) {
            const days = Math.floor(totalHours / 24);
            watchTimeDisplay = `${days}d`;
            watchTimeFull = `${days} Days`;
        } else {
            watchTimeDisplay = `${totalHours}h`;
            watchTimeFull = `${totalHours} Hours`;
        }

        // 4. Average Rating
        const ratedAnime = animeData.filter(a => a.score && a.score > 0);
        let avgRating = 0;
        if (ratedAnime.length > 0) {
            const totalScore = ratedAnime.reduce((sum, a) => sum + a.score, 0);
            avgRating = (totalScore / ratedAnime.length);
        }
        const avgRatingDisplay = avgRating > 0 ? avgRating.toFixed(1) : '0.0';

        // 5. Completion Rate
        const totalAnime = animeData.length;
        const completionRate = totalAnime > 0 ? Math.round((completed / totalAnime) * 100) : 0;

        // 6. Currently Watching
        const watching = animeData.filter(a => a.userStatus === 'Watching').length;

        // 7. Plan to Watch
        const planToWatch = animeData.filter(a => a.userStatus === 'Plan to Watch').length;

        // 8. Current Streak (months with completed anime)
        const completionMonths = new Set();
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = new Date(a.actualFinishDate);
                if (!isNaN(date.getTime())) {
                    const key = `${date.getFullYear()}-${date.getMonth()}`;
                    completionMonths.add(key);
                }
            }
        });
        const streakMonths = completionMonths.size;

        // ============================================
        // CALCULATE MONTHLY CHANGES
        // ============================================

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Completed this month
        const completedThisMonth = animeData.filter(a => {
            if (a.userStatus !== 'Completed' || !a.actualFinishDate) return false;
            const date = new Date(a.actualFinishDate);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;

        // Episodes this month
        let episodesThisMonth = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = new Date(a.actualFinishDate);
                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    episodesThisMonth += a.episodes || 0;
                }
            }
        });

        // Hours this month
        let hoursThisMonth = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = new Date(a.actualFinishDate);
                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    if (a.type === 'Movie') {
                        hoursThisMonth += (a.duration || 120) / 60;
                    } else {
                        const eps = a.episodes || 0;
                        const duration = a.duration || 20;
                        hoursThisMonth += (eps * duration) / 60;
                    }
                }
            }
        });
        hoursThisMonth = Math.round(hoursThisMonth);

        // ============================================
        // UPDATE DOM - INSTANT VALUES (No Count-up)
        // ============================================

        // Helper to update element with pulse effect
        function updateMetric(elementId, value, suffix = '', prefix = '') {
            const el = document.getElementById(elementId);
            if (!el) return;
            
            // Store old value for comparison
            const oldValue = el.textContent;
            const newValue = prefix + value + suffix;
            
            // Update the value
            if (typeof value === 'number' && value >= 10000) {
                el.textContent = prefix + value.toLocaleString() + suffix;
            } else {
                el.textContent = newValue;
            }
            
            // Add pulse effect if value changed
            if (oldValue !== newValue && oldValue !== '0' && oldValue !== '0.0') {
                el.classList.add('counting');
                setTimeout(() => el.classList.remove('counting'), 300);
            }
        }

        // Update all metrics instantly
        updateMetric('metricCompleted', completed);
        updateMetric('metricEpisodes', totalEpisodes);
        
        // Watch Time
        const timeEl = document.getElementById('metricTime');
        if (timeEl) {
            timeEl.textContent = watchTimeDisplay;
            timeEl.setAttribute('title', watchTimeFull);
        }
        
        // Rating
        const ratingEl = document.getElementById('metricRating');
        if (ratingEl) {
            ratingEl.textContent = avgRatingDisplay + '★';
        }
        
        updateMetric('metricRate', completionRate, '%');
        updateMetric('metricWatching', watching);
        updateMetric('metricPlan', planToWatch);
        updateMetric('metricStreak', streakMonths);

        // Update change texts
        const changeElements = {
            metricCompletedChange: {
                text: `${completedThisMonth > 0 ? '+' : ''}${completedThisMonth} this month`,
                class: completedThisMonth > 0 ? 'positive' : completedThisMonth === 0 ? 'neutral' : 'negative'
            },
            metricEpisodesChange: {
                text: `${episodesThisMonth > 0 ? '+' : ''}${episodesThisMonth.toLocaleString()} this month`,
                class: episodesThisMonth > 0 ? 'positive' : episodesThisMonth === 0 ? 'neutral' : 'negative'
            },
            metricTimeChange: {
                text: `${hoursThisMonth > 0 ? '+' : ''}${hoursThisMonth}h this month`,
                class: hoursThisMonth > 0 ? 'positive' : hoursThisMonth === 0 ? 'neutral' : 'negative'
            },
            metricRatingChange: {
                text: `from ${ratedAnime.length} ratings`,
                class: 'neutral'
            },
            metricRateChange: {
                text: `${totalAnime} total entries`,
                class: 'neutral'
            },
            metricWatchingChange: {
                text: watching > 0 ? `${watching} active` : 'none active',
                class: watching > 0 ? 'positive' : 'neutral'
            },
            metricPlanChange: {
                text: `${planToWatch} in queue`,
                class: planToWatch > 0 ? 'neutral' : 'neutral'
            },
            metricStreakChange: {
                text: streakMonths > 0 ? `${streakMonths} month${streakMonths > 1 ? 's' : ''} watching` : 'not started',
                class: streakMonths > 0 ? 'positive' : 'neutral'
            }
        };

        Object.entries(changeElements).forEach(([id, data]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = data.text;
                el.className = 'metric-change ' + data.class;
            }
        });

        console.log('✅ Overview Metrics updated:', {
            completed,
            totalEpisodes,
            watchTimeDisplay,
            avgRatingDisplay,
            completionRate,
            watching,
            planToWatch,
            streakMonths
        });
    }

    // ============================================
    // INITIALIZE
    // ============================================

    function initOverviewMetrics() {
        console.log('🚀 Initializing Overview Metrics...');
        
        setTimeout(updateOverviewMetrics, 300);

        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData' || e.key === 'userProfile' || e.key === 'user') {
                setTimeout(updateOverviewMetrics, 300);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateOverviewMetrics, 400);
            }
        });

        window.addEventListener('animeUpdate', () => {
            setTimeout(updateOverviewMetrics, 300);
        });
    }

    // Hook into Statistics page navigation
    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(initOverviewMetrics, 300);
        });
    }

    // Init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initOverviewMetrics, 500);
        });
    } else {
        setTimeout(initOverviewMetrics, 500);
    }

    // Hook into updateAllComponents
    const originalUpdateAllComponents = window.updateAllComponents;
    if (typeof originalUpdateAllComponents === 'function') {
        window.updateAllComponents = function() {
            originalUpdateAllComponents();
            setTimeout(updateOverviewMetrics, 300);
        };
    }

    window.refreshOverviewMetrics = updateOverviewMetrics;

    console.log('✅ Overview Metrics initialized (No count-up)!');

})();

// ============================================
// LIBRARY ANALYTICS - DYNAMIC DATA
// ============================================

(function() {
    'use strict';

    console.log('🚀 Loading Library Analytics...');

    function updateLibraryAnalytics() {
        console.log('🔄 Updating Library Analytics...');
        
        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const totalEntries = animeData.length;

        // Update total count
        const totalEl = document.getElementById('analyticsTotal');
        if (totalEl) totalEl.textContent = totalEntries;

        // ============================================
        // 1. GENRE DISTRIBUTION
        // ============================================

        const genreCount = {};
        animeData.forEach(anime => {
            if (anime.genres && Array.isArray(anime.genres)) {
                anime.genres.forEach(g => {
                    const genreName = typeof g === 'object' ? g.name : g;
                    if (genreName) {
                        genreCount[genreName] = (genreCount[genreName] || 0) + 1;
                    }
                });
            }
        });

        const sortedGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const maxGenreCount = sortedGenres.length > 0 ? sortedGenres[0][1] : 1;

        const genreContainer = document.getElementById('genreDistribution');
        if (genreContainer) {
            genreContainer.innerHTML = sortedGenres.map(([genre, count], index) => {
                const percentage = totalEntries > 0 ? (count / totalEntries) * 100 : 0;
                const barWidth = maxGenreCount > 0 ? (count / maxGenreCount) * 100 : 0;
                const colorClass = `color-${index % 10}`;
                
                return `
                    <div class="genre-bar-wrapper" title="${genre}: ${count} anime (${percentage.toFixed(1)}%)">
                        <span class="genre-bar-label">${genre}</span>
                        <div class="genre-bar-track">
                            <div class="genre-bar-fill ${colorClass}" style="width: ${barWidth}%;"></div>
                        </div>
                        <span class="genre-bar-count">${count}</span>
                        <span class="genre-bar-percent">${percentage.toFixed(1)}%</span>
                    </div>
                `;
            }).join('');
        }

        // ============================================
        // 2. FORMAT DISTRIBUTION
        // ============================================

        const formatMap = {
            'TV': { label: 'TV', icon: 'tv', color: 'tv' },
            'Movie': { label: 'Movie', icon: 'film', color: 'movie' },
            'OVA': { label: 'OVA', icon: 'play-circle', color: 'ova' },
            'ONA': { label: 'ONA', icon: 'globe', color: 'ona' },
            'Special': { label: 'Special', icon: 'star', color: 'special' },
            'Music': { label: 'Music', icon: 'music', color: 'music' }
        };

        const formatCount = {};
        animeData.forEach(anime => {
            const format = anime.type || 'TV';
            formatCount[format] = (formatCount[format] || 0) + 1;
        });

        const sortedFormats = Object.entries(formatCount)
            .sort((a, b) => b[1] - a[1]);

        const maxFormatCount = sortedFormats.length > 0 ? sortedFormats[0][1] : 1;

        const formatContainer = document.getElementById('formatDistribution');
        if (formatContainer) {
            formatContainer.innerHTML = sortedFormats.map(([format, count]) => {
                const percentage = totalEntries > 0 ? (count / totalEntries) * 100 : 0;
                const barWidth = maxFormatCount > 0 ? (count / maxFormatCount) * 100 : 0;
                const formatInfo = formatMap[format] || { label: format, icon: 'film', color: 'tv' };
                
                return `
                    <div class="format-bar-wrapper" title="${formatInfo.label}: ${count} anime (${percentage.toFixed(1)}%)">
                        <div class="format-bar-icon ${formatInfo.color}">
                            <i class="fas fa-${formatInfo.icon}"></i>
                        </div>
                        <span class="format-bar-label">${formatInfo.label}</span>
                        <div class="format-bar-track">
                            <div class="format-bar-fill color-${formatInfo.color}" style="width: ${barWidth}%;"></div>
                        </div>
                        <span class="format-bar-count">${count}</span>
                        <span class="format-bar-percent">${percentage.toFixed(1)}%</span>
                    </div>
                `;
            }).join('');
        }

        // ============================================
        // 3. INSIGHTS
        // ============================================

        // Most Watched Genre
        const topGenre = sortedGenres.length > 0 ? sortedGenres[0] : null;
        const topGenreEl = document.getElementById('insightTopGenre');
        const topGenreCountEl = document.getElementById('insightTopGenreCount');
        if (topGenreEl) topGenreEl.textContent = topGenre ? topGenre[0] : '—';
        if (topGenreCountEl) topGenreCountEl.textContent = topGenre ? `${topGenre[1]} anime` : '0 anime';

        // Second Favorite Genre
        const secondGenre = sortedGenres.length > 1 ? sortedGenres[1] : null;
        const secondGenreEl = document.getElementById('insightSecondGenre');
        const secondGenreCountEl = document.getElementById('insightSecondGenreCount');
        if (secondGenreEl) secondGenreEl.textContent = secondGenre ? secondGenre[0] : '—';
        if (secondGenreCountEl) secondGenreCountEl.textContent = secondGenre ? `${secondGenre[1]} anime` : '0 anime';

        // Preferred Format
        const topFormat = sortedFormats.length > 0 ? sortedFormats[0] : null;
        const formatLabel = topFormat ? (formatMap[topFormat[0]]?.label || topFormat[0]) : '—';
        const prefFormatEl = document.getElementById('insightPreferredFormat');
        const prefFormatCountEl = document.getElementById('insightPreferredFormatCount');
        if (prefFormatEl) prefFormatEl.textContent = formatLabel;
        if (prefFormatCountEl) prefFormatCountEl.textContent = topFormat ? `${topFormat[1]} anime` : '0 anime';

        // Library Diversity
        const uniqueGenres = Object.keys(genreCount).length;
        let diversityScore = 'Low';
        let diversityDetail = `${uniqueGenres} genres`;
        
        if (uniqueGenres >= 20) {
            diversityScore = 'High';
            diversityDetail = `${uniqueGenres} genres · Diverse library`;
        } else if (uniqueGenres >= 12) {
            diversityScore = 'Medium';
            diversityDetail = `${uniqueGenres} genres · Balanced watcher`;
        } else if (uniqueGenres >= 5) {
            diversityScore = 'Low';
            diversityDetail = `${uniqueGenres} genres · Specialist watcher`;
        } else {
            diversityScore = 'Very Low';
            diversityDetail = `${uniqueGenres} genres · Start exploring more`;
        }

        const diversityEl = document.getElementById('insightDiversity');
        const diversityDetailEl = document.getElementById('insightDiversityDetail');
        if (diversityEl) diversityEl.textContent = diversityScore;
        if (diversityDetailEl) diversityDetailEl.textContent = diversityDetail;

        // Completion Rate
        const completed = animeData.filter(a => a.userStatus === 'Completed').length;
        const completionRate = totalEntries > 0 ? Math.round((completed / totalEntries) * 100) : 0;
        const completionEl = document.getElementById('insightCompletion');
        const completionDetailEl = document.getElementById('insightCompletionDetail');
        if (completionEl) completionEl.textContent = `${completionRate}%`;
        if (completionDetailEl) completionDetailEl.textContent = `${completed} completed`;

        // Total Unique Genres
        const totalGenresEl = document.getElementById('insightTotalGenres');
        if (totalGenresEl) totalGenresEl.textContent = uniqueGenres;

        // ============================================
        // 4. SMART INSIGHTS
        // ============================================

        const smartInsights = document.getElementById('smartInsights');
        if (smartInsights) {
            const insights = [];

            if (topGenre) {
                const percentage = totalEntries > 0 ? ((topGenre[1] / totalEntries) * 100).toFixed(1) : 0;
                insights.push({
                    icon: 'fas fa-bullseye',
                    text: `Your library contains <strong>${topGenre[0]}</strong> (<span class="highlight">${topGenre[1]} anime</span>) making up <strong>${percentage}%</strong> of your collection.`
                });
            }

            if (topFormat) {
                const formatInfo = formatMap[topFormat[0]] || { label: topFormat[0] };
                const tvCount = formatCount['TV'] || 0;
                const movieCount = formatCount['Movie'] || 0;
                
                if (tvCount > 0 && movieCount > 0) {
                    const ratio = Math.round(tvCount / movieCount);
                    insights.push({
                        icon: 'fas fa-tv',
                        text: `You watch <strong>${formatInfo.label}</strong> ${ratio > 1 ? `${ratio}x more often` : 'as often as'} than Movies.`
                    });
                } else {
                    insights.push({
                        icon: 'fas fa-tv',
                        text: `<strong>${formatInfo.label}</strong> is your most watched format with <strong>${topFormat[1]}</strong> entries.`
                    });
                }
            }

            if (uniqueGenres > 0) {
                const topTwo = sortedGenres.slice(0, 2);
                if (topTwo.length >= 2) {
                    const combined = topTwo.reduce((sum, [_, count]) => sum + count, 0);
                    const combinedPercentage = totalEntries > 0 ? ((combined / totalEntries) * 100).toFixed(1) : 0;
                    insights.push({
                        icon: 'fas fa-palette',
                        text: `<strong>${topTwo[0][0]}</strong> and <strong>${topTwo[1][0]}</strong> account for over <strong>${combinedPercentage}%</strong> of your library.`
                    });
                } else {
                    insights.push({
                        icon: 'fas fa-palette',
                        text: `Your anime library spans <strong>${uniqueGenres}</strong> unique genres.`
                    });
                }
            }

            if (totalEntries > 0) {
                let completionInsight = '';
                if (completionRate >= 80) {
                    completionInsight = `You've completed <strong>${completionRate}%</strong> of your library! Impressive dedication!`;
                } else if (completionRate >= 50) {
                    completionInsight = `You've completed <strong>${completionRate}%</strong> of your library. Keep going!`;
                } else if (completionRate >= 30) {
                    completionInsight = `You've completed <strong>${completionRate}%</strong> of your library. Time to finish some shows!`;
                } else {
                    completionInsight = `You've completed <strong>${completionRate}%</strong> of your library. Start watching!`;
                }
                insights.push({
                    icon: 'fas fa-chart-line',
                    text: completionInsight
                });
            }

            smartInsights.innerHTML = insights.map(insight => `
                <div class="smart-insight">
                    <span class="smart-insight-icon"><i class="${insight.icon}"></i></span>
                    <span class="smart-insight-text">${insight.text}</span>
                </div>
            `).join('');
        }

        console.log('✅ Library Analytics updated');
    }

    // ============================================
    // INITIALIZE
    // ============================================

    function initLibraryAnalytics() {
        setTimeout(updateLibraryAnalytics, 400);

        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData') {
                setTimeout(updateLibraryAnalytics, 400);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateLibraryAnalytics, 500);
            }
        });

        window.addEventListener('animeUpdate', () => {
            setTimeout(updateLibraryAnalytics, 400);
        });
    }

    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(initLibraryAnalytics, 400);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initLibraryAnalytics, 600);
        });
    } else {
        setTimeout(initLibraryAnalytics, 600);
    }

    const originalUpdateAllComponents = window.updateAllComponents;
    if (typeof originalUpdateAllComponents === 'function') {
        window.updateAllComponents = function() {
            originalUpdateAllComponents();
            setTimeout(updateLibraryAnalytics, 400);
        };
    }

    window.refreshLibraryAnalytics = updateLibraryAnalytics;

    console.log('✅ Library Analytics initialized!');

})();

// ============================================
// RATING ANALYTICS - DYNAMIC DATA
// ============================================

(function() {
    'use strict';

    console.log('🚀 Loading Rating Analytics...');

    // ============================================
    // UPDATE RATING ANALYTICS
    // ============================================

    function updateRatingAnalytics() {
        console.log('🔄 Updating Rating Analytics...');
        
        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        
        // Get all rated anime
        const ratedAnime = animeData.filter(a => a.score && a.score > 0);
        const totalRatings = ratedAnime.length;

        // Update total count
        const totalEl = document.getElementById('ratingTotal');
        if (totalEl) totalEl.textContent = totalRatings;

        if (totalRatings === 0) {
            showNoRatingData();
            return;
        }

        // ============================================
        // 1. SCORE DISTRIBUTION
        // ============================================

        const scoreDistribution = {};
        ratedAnime.forEach(a => {
            const score = Math.round(a.score);
            if (score >= 1 && score <= 10) {
                scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
            }
        });

        const maxScoreCount = Math.max(...Object.values(scoreDistribution), 1);

        const scoreContainer = document.getElementById('scoreDistributionChart');
        if (scoreContainer) {
            scoreContainer.innerHTML = '';
            
            // Display scores 1-10 in descending order
            for (let s = 10; s >= 6; s--) {
                const count = scoreDistribution[s] || 0;
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                const barWidth = maxScoreCount > 0 ? (count / maxScoreCount) * 100 : 0;
                const colorClass = `color-${s}`;
                
                const wrapper = document.createElement('div');
                wrapper.className = 'score-bar-wrapper';
                wrapper.setAttribute('title', `${s}★: ${count} anime (${percentage.toFixed(1)}%)`);
                
                wrapper.innerHTML = `
                    <span class="score-bar-label">${s}</span>
                    <div class="score-bar-track">
                        <div class="score-bar-fill ${colorClass}" style="width: ${barWidth}%;"></div>
                    </div>
                    <span class="score-bar-count">${count}</span>
                    <span class="score-bar-percent">${percentage.toFixed(1)}%</span>
                `;
                
                scoreContainer.appendChild(wrapper);
            }
        }

        // ============================================
        // 2. RATING BEHAVIOR INSIGHTS
        // ============================================

        // Average Score
        const totalScore = ratedAnime.reduce((sum, a) => sum + a.score, 0);
        const avgScore = totalScore / totalRatings;
        const avgScoreDisplay = avgScore.toFixed(1);
        
        document.getElementById('behaviorAvgScore').textContent = `${avgScoreDisplay} ★`;
        document.getElementById('behaviorAvgDetail').textContent = `from ${totalRatings} ratings`;

        // Most Common Rating
        let mostCommonScore = 0;
        let mostCommonCount = 0;
        Object.entries(scoreDistribution).forEach(([score, count]) => {
            if (count > mostCommonCount) {
                mostCommonCount = count;
                mostCommonScore = parseInt(score);
            }
        });
        
        document.getElementById('behaviorMostCommon').textContent = `${mostCommonScore} ★`;
        document.getElementById('behaviorCommonCount').textContent = `${mostCommonCount} times`;

        // Highest and Lowest Rated Genres
        const genreScores = {};
        ratedAnime.forEach(a => {
            if (a.genres && Array.isArray(a.genres)) {
                a.genres.forEach(g => {
                    const genreName = typeof g === 'object' ? g.name : g;
                    if (genreName) {
                        if (!genreScores[genreName]) {
                            genreScores[genreName] = { total: 0, count: 0 };
                        }
                        genreScores[genreName].total += a.score;
                        genreScores[genreName].count++;
                    }
                });
            }
        });

        // Filter genres with at least 2 ratings
        const filteredGenres = Object.entries(genreScores)
            .filter(([_, data]) => data.count >= 2)
            .map(([genre, data]) => ({
                genre,
                avg: data.total / data.count,
                count: data.count
            }))
            .sort((a, b) => b.avg - a.avg);

        // Highest Rated Genre
        const highestGenre = filteredGenres.length > 0 ? filteredGenres[0] : null;
        if (highestGenre) {
            document.getElementById('behaviorHighestGenre').textContent = highestGenre.genre;
            document.getElementById('behaviorHighestDetail').textContent = 
                `${highestGenre.avg.toFixed(1)} ★ from ${highestGenre.count} anime`;
        } else {
            document.getElementById('behaviorHighestGenre').textContent = '—';
            document.getElementById('behaviorHighestDetail').textContent = 'No data';
        }

        // Lowest Rated Genre
        const lowestGenre = filteredGenres.length > 1 ? filteredGenres[filteredGenres.length - 1] : null;
        if (lowestGenre && filteredGenres.length > 1) {
            document.getElementById('behaviorLowestGenre').textContent = lowestGenre.genre;
            document.getElementById('behaviorLowestDetail').textContent = 
                `${lowestGenre.avg.toFixed(1)} ★ from ${lowestGenre.count} anime`;
        } else {
            document.getElementById('behaviorLowestGenre').textContent = '—';
            document.getElementById('behaviorLowestDetail').textContent = 'No data';
        }

        // ============================================
        // 3. RATING PERSONALITY
        // ============================================

        // Calculate distribution percentages
        const highScores = (scoreDistribution[10] || 0) + (scoreDistribution[9] || 0);
        const midScores = (scoreDistribution[8] || 0) + (scoreDistribution[7] || 0) + (scoreDistribution[6] || 0);
        const lowScores = (scoreDistribution[5] || 0) + (scoreDistribution[4] || 0) + 
                         (scoreDistribution[3] || 0) + (scoreDistribution[2] || 0) + (scoreDistribution[1] || 0);
        
        const highPercent = (highScores / totalRatings) * 100;
        const midPercent = (midScores / totalRatings) * 100;
        const lowPercent = (lowScores / totalRatings) * 100;

        // Determine personality
        let personalityName = '';
        let personalityDescription = '';
        let personalityIcon = '';

        if (highPercent >= 60) {
            personalityName = 'Generous Rater';
            personalityDescription = 'You tend to rate anime highly, often giving scores between 8 and 10.';
            personalityIcon = 'fa-face-smile';
        } else if (highPercent >= 40 && highPercent < 60) {
            personalityName = 'Balanced Critic';
            personalityDescription = 'You use the full scoring scale fairly evenly, giving thoughtful ratings.';
            personalityIcon = 'fa-scale-balanced';
        } else if (midPercent >= 50) {
            personalityName = 'Cautious Rater';
            personalityDescription = 'Most of your ratings fall in the middle range (6-8).';
            personalityIcon = 'fa-face-meh';
        } else if (lowPercent >= 30) {
            personalityName = 'Harsh Critic';
            personalityDescription = 'You tend to rate anime more strictly, with many scores between 5 and 7.';
            personalityIcon = 'fa-face-frown';
        } else if (avgScore >= 8.5) {
            personalityName = 'Optimistic Viewer';
            personalityDescription = 'You generally enjoy most anime you watch and rate them generously.';
            personalityIcon = 'fa-face-laugh';
        } else if (avgScore <= 6.5) {
            personalityName = 'Selective Reviewer';
            personalityDescription = 'You are selective about what you watch and rate critically.';
            personalityIcon = 'fa-face-grimace';
        } else {
            personalityName = 'Balanced Viewer';
            personalityDescription = 'You have a balanced approach to rating anime.';
            personalityIcon = 'fa-face-smile';
        }

        // Calculate median and spread
        const allScores = [];
        ratedAnime.forEach(a => {
            if (a.score) allScores.push(a.score);
        });
        allScores.sort((a, b) => a - b);
        
        const median = allScores.length > 0 ? allScores[Math.floor(allScores.length / 2)] : 0;
        const spread = allScores.length > 0 ? (allScores[allScores.length - 1] - allScores[0]) : 0;

        document.getElementById('personalityName').textContent = personalityName;
        document.getElementById('personalityDescription').textContent = personalityDescription;
        document.getElementById('personalityIcon').innerHTML = `<i class="fas ${personalityIcon}"></i>`;
        document.getElementById('personalityAvg').textContent = avgScoreDisplay;
        document.getElementById('personalityMedian').textContent = median.toFixed(1);
        document.getElementById('personalitySpread').textContent = spread.toFixed(1);

        // ============================================
        // 4. AVERAGE SCORE BY GENRE
        // ============================================

        const genreScoreContainer = document.getElementById('genreScoreChart');
        if (genreScoreContainer) {
            genreScoreContainer.innerHTML = '';

            const sortedGenres = filteredGenres
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 10);

            const maxGenreAvg = sortedGenres.length > 0 ? sortedGenres[0].avg : 1;

            sortedGenres.forEach(({ genre, avg, count }) => {
                const barWidth = maxGenreAvg > 0 ? (avg / maxGenreAvg) * 100 : 0;
                
                const wrapper = document.createElement('div');
                wrapper.className = 'genre-score-wrapper';
                wrapper.setAttribute('title', `${genre}: ${avg.toFixed(1)} ★ from ${count} anime`);
                
                wrapper.innerHTML = `
                    <span class="genre-score-label">${genre}</span>
                    <div class="genre-score-track">
                        <div class="genre-score-fill" style="width: ${barWidth}%;"></div>
                    </div>
                    <span class="genre-score-value">${avg.toFixed(1)}</span>
                    <span class="genre-score-count">(${count})</span>
                `;
                
                genreScoreContainer.appendChild(wrapper);
            });

            if (sortedGenres.length === 0) {
                genreScoreContainer.innerHTML = `
                    <div style="padding: 40px 20px; text-align: center; color: var(--color-text-tertiary);">
                        <i class="fas fa-info-circle" style="font-size: 24px; display: block; margin-bottom: 12px;"></i>
                        Rate more anime across different genres to see this breakdown.
                    </div>
                `;
            }
        }

        // ============================================
        // 5. ADVANCED INSIGHTS
        // ============================================

        const advancedContainer = document.getElementById('advancedInsights');
        if (advancedContainer) {
            const insights = [];

            // Insight 1: Most common score
            insights.push({
                icon: 'fas fa-chart-simple',
                text: `<strong>${mostCommonScore}★</strong> is your most frequently used score (${mostCommonCount} times).`
            });

            // Insight 2: Score range
            const scoreRange = Math.max(...Object.keys(scoreDistribution).map(Number)) - 
                              Math.min(...Object.keys(scoreDistribution).map(Number));
            if (scoreRange >= 6) {
                insights.push({
                    icon: 'fas fa-arrows-left-right',
                    text: `Your ratings span a wide range (<strong>${scoreRange} points</strong>), showing diverse taste.`
                });
            } else if (scoreRange >= 3) {
                insights.push({
                    icon: 'fas fa-arrows-left-right',
                    text: `Your ratings have a moderate spread (<strong>${scoreRange} points</strong>).`
                });
            } else {
                insights.push({
                    icon: 'fas fa-arrows-left-right',
                    text: `Your ratings are tightly clustered (<strong>${scoreRange} points</strong>), showing consistent taste.`
                });
            }

            // Insight 3: High score percentage
            const perfectCount = scoreDistribution[10] || 0;
            if (perfectCount > 0) {
                const perfectPercent = (perfectCount / totalRatings) * 100;
                insights.push({
                    icon: 'fas fa-crown',
                    text: `You've given <strong>${perfectCount} perfect 10★</strong> ratings (${perfectPercent.toFixed(1)}% of all ratings).`
                });
            }

            // Insight 4: Low score percentage
            const lowCount = (scoreDistribution[1] || 0) + (scoreDistribution[2] || 0) + (scoreDistribution[3] || 0);
            if (lowCount > 0) {
                const lowPercent = (lowCount / totalRatings) * 100;
                insights.push({
                    icon: 'fas fa-thumbs-down',
                    text: `<strong>${lowPercent.toFixed(1)}%</strong> of your ratings are below 4★ (${lowCount} anime).`
                });
            }

            // Insight 5: Genre comparison
            if (highestGenre && avgScore > 0) {
                const diff = highestGenre.avg - avgScore;
                const diffText = diff > 0 ? `${diff.toFixed(1)}★ higher` : `${Math.abs(diff).toFixed(1)}★ lower`;
                insights.push({
                    icon: 'fas fa-trophy',
                    text: `You rate <strong>${highestGenre.genre}</strong> ${diffText} than your library average.`
                });
            }

            // Insight 6: Rating consistency
            const stdDev = calculateStandardDeviation(allScores);
            if (stdDev < 1.0) {
                insights.push({
                    icon: 'fas fa-bullseye',
                    text: `Your ratings are <strong>very consistent</strong> (std dev: ${stdDev.toFixed(2)}).`
                });
            } else if (stdDev < 1.8) {
                insights.push({
                    icon: 'fas fa-bullseye',
                    text: `Your ratings are <strong>moderately consistent</strong> (std dev: ${stdDev.toFixed(2)}).`
                });
            } else {
                insights.push({
                    icon: 'fas fa-bullseye',
                    text: `Your ratings show <strong>good variety</strong> (std dev: ${stdDev.toFixed(2)}).`
                });
            }

            advancedContainer.innerHTML = insights.map(insight => `
                <div class="advanced-insight">
                    <span class="advanced-insight-icon"><i class="${insight.icon}"></i></span>
                    <span class="advanced-insight-text">${insight.text}</span>
                </div>
            `).join('');
        }

        console.log('✅ Rating Analytics updated');
    }

    // ============================================
    // HELPERS
    // ============================================

    function calculateStandardDeviation(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(variance);
    }

    function showNoRatingData() {
        const elements = [
            'scoreDistributionChart',
            'behaviorAvgScore',
            'behaviorAvgDetail',
            'behaviorMostCommon',
            'behaviorCommonCount',
            'behaviorHighestGenre',
            'behaviorHighestDetail',
            'behaviorLowestGenre',
            'behaviorLowestDetail',
            'personalityName',
            'personalityDescription',
            'personalityAvg',
            'personalityMedian',
            'personalitySpread',
            'genreScoreChart',
            'advancedInsights'
        ];

        elements.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            if (id === 'scoreDistributionChart' || id === 'genreScoreChart') {
                el.innerHTML = `
                    <div style="padding: 40px 20px; text-align: center; color: var(--color-text-tertiary);">
                        <i class="fas fa-star" style="font-size: 32px; display: block; margin-bottom: 12px; opacity: 0.3;"></i>
                        Start rating anime to see your analytics here.
                    </div>
                `;
            } else if (id === 'advancedInsights') {
                el.innerHTML = '';
            } else if (id === 'behaviorAvgScore') {
                el.textContent = '—';
            } else if (id === 'behaviorAvgDetail') {
                el.textContent = 'No ratings yet';
            } else if (id === 'behaviorMostCommon') {
                el.textContent = '—';
            } else if (id === 'behaviorCommonCount') {
                el.textContent = '0 times';
            } else if (id === 'behaviorHighestGenre' || id === 'behaviorLowestGenre') {
                el.textContent = '—';
            } else if (id === 'behaviorHighestDetail' || id === 'behaviorLowestDetail') {
                el.textContent = 'No data';
            } else if (id === 'personalityName') {
                el.textContent = 'No Data Yet';
            } else if (id === 'personalityDescription') {
                el.textContent = 'Rate some anime to discover your rating personality.';
            } else if (id === 'personalityAvg' || id === 'personalityMedian' || id === 'personalitySpread') {
                el.textContent = '0.0';
            }
        });

        // Update personality icon
        const iconEl = document.getElementById('personalityIcon');
        if (iconEl) {
            iconEl.innerHTML = '<i class="fas fa-user-astronaut"></i>';
        }

        // Update total
        const totalEl = document.getElementById('ratingTotal');
        if (totalEl) totalEl.textContent = '0';
    }

    // ============================================
    // INITIALIZE
    // ============================================

    function initRatingAnalytics() {
        console.log('🚀 Initializing Rating Analytics...');
        
        setTimeout(updateRatingAnalytics, 400);

        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData') {
                setTimeout(updateRatingAnalytics, 400);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateRatingAnalytics, 500);
            }
        });

        window.addEventListener('animeUpdate', () => {
            setTimeout(updateRatingAnalytics, 400);
        });
    }

    // Hook into Statistics page navigation
    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(initRatingAnalytics, 400);
        });
    }

    // Init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initRatingAnalytics, 600);
        });
    } else {
        setTimeout(initRatingAnalytics, 600);
    }

    // Hook into updateAllComponents
    const originalUpdateAllComponents = window.updateAllComponents;
    if (typeof originalUpdateAllComponents === 'function') {
        window.updateAllComponents = function() {
            originalUpdateAllComponents();
            setTimeout(updateRatingAnalytics, 400);
        };
    }

    window.refreshRatingAnalytics = updateRatingAnalytics;

    console.log('✅ Rating Analytics initialized!');

})();

// ============================================
// COMPLETION JOURNEY - COMPLETE WITH FILTERS
// ============================================

(function() {
    'use strict';

    console.log('🚀 Loading Completion Journey...');

    // ============================================
    // STATE
    // ============================================

    let currentRange = 'all'; // all, year, 90d, 30d
    let journeyCharts = {};

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    function formatDateFull(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function getMonthKey(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    function getYearKey(date) {
        return new Date(date).getFullYear();
    }

    function getCompletionDate(anime) {
        if (anime.actualFinishDate) return new Date(anime.actualFinishDate);
        if (anime.finishDate) return new Date(anime.finishDate);
        if (anime.completedTimestamp) return new Date(anime.completedTimestamp);
        return null;
    }

    function isInRange(date, range) {
        if (range === 'all') return true;
        
        const now = new Date();
        const d = new Date(date);
        
        if (range === 'year') {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            return d >= yearAgo;
        }
        
        if (range === '90d') {
            const daysAgo = new Date(now);
            daysAgo.setDate(now.getDate() - 90);
            return d >= daysAgo;
        }
        
        if (range === '30d') {
            const daysAgo = new Date(now);
            daysAgo.setDate(now.getDate() - 30);
            return d >= daysAgo;
        }
        
        return true;
    }

    // ============================================
    // UPDATE COMPLETION JOURNEY
    // ============================================

    function updateCompletionJourney() {
        console.log('🔄 Updating Completion Journey...');

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        
        // Get all completed anime with valid dates
        let completedAnime = animeData
            .filter(a => a.userStatus === 'Completed')
            .map(a => {
                const date = getCompletionDate(a);
                return { ...a, completionDate: date };
            })
            .filter(a => a.completionDate && !isNaN(a.completionDate.getTime()))
            .sort((a, b) => a.completionDate - b.completionDate);

        // Apply date filter
        if (currentRange !== 'all') {
            completedAnime = completedAnime.filter(a => isInRange(a.completionDate, currentRange));
        }

        const totalCompleted = completedAnime.length;

        if (totalCompleted === 0) {
            showEmptyJourney();
            return;
        }

        // ============================================
        // UPDATE HEADER STATS
        // ============================================

        document.getElementById('journeyTotalCompleted').textContent = totalCompleted;

        // ============================================
        // 1. CUMULATIVE LINE CHART
        // ============================================

        const cumulativeData = [];
        let cumulativeCount = 0;
        const monthlyGroups = {};
        const yearlyGroups = {};

        completedAnime.forEach(anime => {
            const date = anime.completionDate;
            const monthKey = getMonthKey(date);
            const yearKey = getYearKey(date);

            cumulativeCount++;
            cumulativeData.push({
                date: date,
                count: cumulativeCount,
                monthKey: monthKey,
                yearKey: yearKey
            });

            // Group by month for monthly chart
            if (!monthlyGroups[monthKey]) {
                monthlyGroups[monthKey] = { count: 0, date: date };
            }
            monthlyGroups[monthKey].count++;

            // Group by year for yearly stats
            if (!yearlyGroups[yearKey]) {
                yearlyGroups[yearKey] = { count: 0 };
            }
            yearlyGroups[yearKey].count++;
        });

        // Create cumulative chart data points
        const chartLabels = [];
        const chartData = [];
        const monthlyKeys = Object.keys(monthlyGroups).sort();

        monthlyKeys.forEach((key) => {
            const monthData = monthlyGroups[key];
            const date = monthData.date;
            const monthEnd = new Date(date);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);

            let monthCumulative = 0;
            for (const item of cumulativeData) {
                if (item.date <= monthEnd) {
                    monthCumulative = item.count;
                }
            }
            
            chartLabels.push(formatDate(date));
            chartData.push(monthCumulative);
        });

        // Render cumulative chart
        renderCumulativeChart(chartLabels, chartData, totalCompleted);

        // ============================================
        // 2. MONTHLY BAR CHART
        // ============================================

        const monthlyLabels = Object.keys(monthlyGroups).sort();
        const monthlyCounts = monthlyLabels.map(key => monthlyGroups[key].count);
        const avgMonthly = monthlyCounts.length > 0 ? Math.round(monthlyCounts.reduce((a, b) => a + b, 0) / monthlyCounts.length) : 0;

        document.getElementById('journeyMonthlyAvg').textContent = avgMonthly;

        renderMonthlyChart(monthlyLabels, monthlyCounts);

        // ============================================
        // 3. JOURNEY INSIGHTS
        // ============================================

        // First Anime
        const firstAnime = completedAnime[0];
        const firstDate = firstAnime.completionDate;
        document.getElementById('journeyFirstAnime').textContent = firstAnime.title;
        document.getElementById('journeyFirstDate').textContent = formatDateFull(firstDate);

        // Fastest Month
        let fastestMonth = '';
        let fastestCount = 0;
        Object.entries(monthlyGroups).forEach(([key, data]) => {
            if (data.count > fastestCount) {
                fastestCount = data.count;
                fastestMonth = key;
            }
        });
        const fastestMonthDate = monthlyGroups[fastestMonth]?.date;
        document.getElementById('journeyFastestMonth').textContent = fastestMonthDate ? formatDate(fastestMonthDate) : '—';
        document.getElementById('journeyFastestCount').textContent = `${fastestCount} anime`;

        // Most Active Year
        let activeYear = '';
        let activeCount = 0;
        Object.entries(yearlyGroups).forEach(([year, data]) => {
            if (data.count > activeCount) {
                activeCount = data.count;
                activeYear = year;
            }
        });
        document.getElementById('journeyActiveYear').textContent = activeYear || '—';
        document.getElementById('journeyActiveCount').textContent = `${activeCount} anime`;

        // Completion Pace
        const firstDateObj = firstAnime.completionDate;
        const lastDateObj = completedAnime[completedAnime.length - 1].completionDate;
        const monthsDiff = (lastDateObj.getFullYear() - firstDateObj.getFullYear()) * 12 + 
                          (lastDateObj.getMonth() - firstDateObj.getMonth()) + 1;
        const pace = monthsDiff > 0 ? (totalCompleted / monthsDiff).toFixed(1) : totalCompleted;
        document.getElementById('journeyPace').textContent = pace;

        // ============================================
        // 4. MILESTONES
        // ============================================

        renderMilestones(completedAnime);

        // ============================================
        // 5. PACE ANALYSIS
        // ============================================

        renderPaceInsights(completedAnime, totalCompleted, monthlyGroups, yearlyGroups, currentRange);

        console.log('✅ Completion Journey updated');
    }

    // ============================================
    // RENDER CUMULATIVE CHART
    // ============================================

    function renderCumulativeChart(labels, data, total) {
        const canvas = document.getElementById('completionJourneyChart');
        if (!canvas) return;

        // Clear canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (journeyCharts.cumulative) {
            try { journeyCharts.cumulative.destroy(); } catch (e) {}
        }

        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

        // If no data, show empty state
        if (data.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data for selected period', canvas.width / 2, canvas.height / 2);
            return;
        }

        journeyCharts.cumulative = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Completed',
                    data: data,
                    borderColor: '#22D3EE',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#22D3EE',
                    pointBorderColor: '#06B6D4',
                    pointBorderWidth: 2,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                        titleColor: isDark ? '#F1F5F9' : '#1E293B',
                        bodyColor: isDark ? '#94A3B8' : '#64748B',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        callbacks: {
                            label: function(context) {
                                return `Total: ${context.parsed.y} anime`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor, stepSize: Math.max(1, Math.round(total / 15)) }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, maxTicksLimit: 20 }
                    }
                }
            }
        });
    }

    // ============================================
    // RENDER MONTHLY CHART
    // ============================================

    function renderMonthlyChart(labels, data) {
        const canvas = document.getElementById('monthlyCompletionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (journeyCharts.monthly) {
            try { journeyCharts.monthly.destroy(); } catch (e) {}
        }

        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

        if (data.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data for selected period', canvas.width / 2, canvas.height / 2);
            return;
        }

        journeyCharts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(l => l.split('-')[1] + '/' + l.split('-')[0].slice(-2)),
                datasets: [{
                    label: 'Anime Completed',
                    data: data,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    hoverBackgroundColor: 'rgba(139, 92, 246, 0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                        titleColor: isDark ? '#F1F5F9' : '#1E293B',
                        bodyColor: isDark ? '#94A3B8' : '#64748B',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} anime completed`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor, stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, maxTicksLimit: 20 }
                    }
                }
            }
        });
    }

    // ============================================
    // RENDER MILESTONES
    // ============================================

    function renderMilestones(completedAnime) {
        const container = document.getElementById('milestonesContainer');
        if (!container) return;

        const milestones = [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
        const achieved = [];

        completedAnime.forEach((anime, index) => {
            const count = index + 1;
            if (milestones.includes(count)) {
                achieved.push({ count, date: anime.completionDate, title: anime.title });
            }
        });

        const currentTotal = completedAnime.length;
        let nextMilestone = milestones.find(m => m > currentTotal);

        const allMilestones = [];
        
        achieved.forEach(m => {
            allMilestones.push({
                count: m.count,
                date: m.date,
                title: `${m.count} Anime Completed`,
                achieved: true
            });
        });

        if (nextMilestone) {
            allMilestones.push({
                count: nextMilestone,
                date: null,
                title: `${nextMilestone} Anime Completed`,
                achieved: false
            });
        }

        const nextIndex = milestones.indexOf(nextMilestone);
        if (nextIndex !== -1 && nextIndex < milestones.length - 1) {
            const upcoming = milestones[nextIndex + 1];
            allMilestones.push({
                count: upcoming,
                date: null,
                title: `${upcoming} Anime Completed`,
                achieved: false
            });
        }

        if (allMilestones.length === 0) {
            container.innerHTML = `
                <div class="milestone-item locked" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                    <span class="milestone-icon">🏆</span>
                    <div class="milestone-content">
                        <span class="milestone-title">Start your journey</span>
                        <span class="milestone-date">Complete anime to unlock milestones</span>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = allMilestones.map(m => `
            <div class="milestone-item ${m.achieved ? 'achieved' : 'locked'}">
                <span class="milestone-icon">${m.achieved ? '🏆' : '🔒'}</span>
                <div class="milestone-content">
                    <span class="milestone-title">${m.title}</span>
                    <span class="milestone-date">${m.achieved ? formatDateFull(m.date) : 'In Progress'}</span>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // RENDER PACE INSIGHTS
    // ============================================

    function renderPaceInsights(completedAnime, total, monthlyGroups, yearlyGroups, range) {
        const container = document.getElementById('paceInsights');
        if (!container) return;

        const firstDate = completedAnime[0]?.completionDate;
        const lastDate = completedAnime[completedAnime.length - 1]?.completionDate;
        const insights = [];

        if (total === 0) {
            container.innerHTML = `
                <div class="pace-insight" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                    <span class="pace-insight-icon"><i class="fas fa-info-circle"></i></span>
                    <span class="pace-insight-text">Complete anime to see your pace analysis</span>
                </div>
            `;
            return;
        }

        // Average per month
        const monthlyCounts = Object.values(monthlyGroups);
        const avgMonthly = monthlyCounts.length > 0 ? monthlyCounts.reduce((a, b) => a + b, 0) / monthlyCounts.length : 0;
        insights.push({
            icon: 'fas fa-calendar-alt',
            text: `You complete an average of <strong>${avgMonthly.toFixed(1)}</strong> anime per month.`
        });

        // Fastest month
        let fastestMonth = '';
        let fastestCount = 0;
        Object.entries(monthlyGroups).forEach(([key, data]) => {
            if (data.count > fastestCount) {
                fastestCount = data.count;
                fastestMonth = key;
            }
        });
        const fastestDate = monthlyGroups[fastestMonth]?.date;
        if (fastestDate) {
            insights.push({
                icon: 'fas fa-rocket',
                text: `Your fastest growth period was <strong>${formatDate(fastestDate)}</strong> with <strong>${fastestCount}</strong> anime completed.`
            });
        }

        // Year-over-year growth
        const years = Object.keys(yearlyGroups).sort();
        if (years.length >= 2) {
            const lastYear = years[years.length - 1];
            const prevYear = years[years.length - 2];
            const lastYearCount = yearlyGroups[lastYear].count;
            const prevYearCount = yearlyGroups[prevYear].count;
            const growth = prevYearCount > 0 ? ((lastYearCount - prevYearCount) / prevYearCount * 100).toFixed(0) : 0;
            if (growth > 0) {
                insights.push({
                    icon: 'fas fa-chart-line',
                    text: `Your library grew by <strong>${growth}%</strong> in <strong>${lastYear}</strong> compared to ${prevYear}.`
                });
            }
        }

        // Most active year
        let activeYear = '';
        let activeCount = 0;
        Object.entries(yearlyGroups).forEach(([year, data]) => {
            if (data.count > activeCount) {
                activeCount = data.count;
                activeYear = year;
            }
        });
        if (activeYear) {
            insights.push({
                icon: 'fas fa-trophy',
                text: `<strong>${activeYear}</strong> was your most active year with <strong>${activeCount}</strong> anime completed.`
            });
        }

        // Projection
        if (firstDate && lastDate) {
            const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                              (lastDate.getMonth() - firstDate.getMonth()) + 1;
            const pace = monthsDiff > 0 ? total / monthsDiff : total;
            const projectedNextYear = Math.round(total + (pace * 12));
            insights.push({
                icon: 'fas fa-eye',
                text: `Current pace projects <strong>${projectedNextYear}</strong> completed anime by next year.`
            });
        }

        // Range-specific insight
        if (range !== 'all') {
            const rangeLabel = range === 'year' ? 'last year' : range === '90d' ? 'last 90 days' : 'last 30 days';
            insights.push({
                icon: 'fas fa-clock',
                text: `Showing data for <strong>${rangeLabel}</strong> (${total} anime completed).`
            });
        }

        container.innerHTML = insights.map(insight => `
            <div class="pace-insight">
                <span class="pace-insight-icon"><i class="${insight.icon}"></i></span>
                <span class="pace-insight-text">${insight.text}</span>
            </div>
        `).join('');
    }

    // ============================================
    // SHOW EMPTY STATE
    // ============================================

    function showEmptyJourney() {
        const elements = [
            'completionJourneyChart',
            'monthlyCompletionChart',
            'milestonesContainer',
            'paceInsights'
        ];

        const isDark = document.body.getAttribute('data-theme') === 'dark';

        elements.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === 'completionJourneyChart' || id === 'monthlyCompletionChart') {
                const canvas = document.getElementById(id);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = 'rgba(255,255,255,0.05)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
                        ctx.font = '16px Inter, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('Complete your first anime to start your journey!', canvas.width / 2, canvas.height / 2);
                    }
                }
            } else if (id === 'milestonesContainer') {
                el.innerHTML = `
                    <div class="milestone-item locked" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                        <span class="milestone-icon">🏆</span>
                        <div class="milestone-content">
                            <span class="milestone-title">Start your journey</span>
                            <span class="milestone-date">Complete anime to unlock milestones</span>
                        </div>
                    </div>
                `;
            } else if (id === 'paceInsights') {
                el.innerHTML = `
                    <div class="pace-insight" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                        <span class="pace-insight-icon"><i class="fas fa-info-circle"></i></span>
                        <span class="pace-insight-text">Complete anime to see your pace analysis</span>
                    </div>
                `;
            }
        });

        document.getElementById('journeyTotalCompleted').textContent = '0';
        document.getElementById('journeyMonthlyAvg').textContent = '0';
        document.getElementById('journeyFirstAnime').textContent = '—';
        document.getElementById('journeyFirstDate').textContent = '—';
        document.getElementById('journeyFastestMonth').textContent = '—';
        document.getElementById('journeyFastestCount').textContent = '0 anime';
        document.getElementById('journeyActiveYear').textContent = '—';
        document.getElementById('journeyActiveCount').textContent = '0 anime';
        document.getElementById('journeyPace').textContent = '0';
    }

    // ============================================
    // FILTER HANDLERS
    // ============================================

    function initFilters() {
        const filterBtns = document.querySelectorAll('.journey-filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update current range
                currentRange = this.dataset.range;
                
                // Refresh data
                updateCompletionJourney();
            });
        });
    }

    // ============================================
    // THEME CHANGE HANDLER
    // ============================================

    function handleThemeChange() {
        // Re-render charts on theme change
        if (document.getElementById('statistics-page')?.classList.contains('active')) {
            setTimeout(updateCompletionJourney, 300);
        }
    }

    // ============================================
    // INITIALIZE
    // ============================================

    function initCompletionJourney() {
        console.log('🚀 Initializing Completion Journey...');

        // Initialize filters
        initFilters();

        // Initial update
        setTimeout(updateCompletionJourney, 400);

        // Listen for data changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData') {
                setTimeout(updateCompletionJourney, 400);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateCompletionJourney, 500);
            }
        });

        window.addEventListener('animeUpdate', () => {
            setTimeout(updateCompletionJourney, 400);
        });

        // Listen for theme changes
        const themeObserver = new MutationObserver(() => {
            handleThemeChange();
        });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    // Hook into Statistics page navigation
    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(initCompletionJourney, 400);
        });
    }

    // Init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initCompletionJourney, 600);
        });
    } else {
        setTimeout(initCompletionJourney, 600);
    }

    // Hook into updateAllComponents
    const originalUpdateAllComponents = window.updateAllComponents;
    if (typeof originalUpdateAllComponents === 'function') {
        window.updateAllComponents = function() {
            originalUpdateAllComponents();
            setTimeout(updateCompletionJourney, 400);
        };
    }

    // Expose refresh function
    window.refreshCompletionJourney = updateCompletionJourney;

    console.log('✅ Completion Journey initialized with filters!');

})();

