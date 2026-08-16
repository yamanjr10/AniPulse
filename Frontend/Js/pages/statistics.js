// ============================================
// STATISTICS PAGE – All charts, metrics, hero, analytics
// Full file – with Period Stats filter
// ============================================

(function () {
    'use strict';

    console.log('📊 Loading Statistics Page...');

    // ============================================
    // GLOBAL CHART REFERENCES
    // ============================================

    let monthlyProgressChart, genreDistributionChart, completionChart, scoreDistributionChart;
    let statusDistributionChart, typeDistributionChart, genreStatsChart;
    let episodesOverTimeChart, watchTimeByMonthChart;
    let currentGenreFilter = 'month';
    let currentEpisodesYear = null;
    let currentWatchTimeYear = null;
    let currentRange = 'all';
    let journeyCharts = {};

    window.AniPulseCharts = window.AniPulseCharts || {};

    // Store data globally (within this file) for tooltips
    let _monthlyChartData = [];
    let _monthlyChartCurrentMonth = new Date().getMonth();

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function parseDateSafely(dateString) {
        if (!dateString) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) return date;
        }
        if (/^\d{4}-\d{2}$/.test(dateString)) {
            const [year, month] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, 15);
            if (!isNaN(date.getTime())) return date;
        }
        if (dateString.includes('T')) {
            const part = dateString.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
                const [year, month, day] = part.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
        if (dateString.includes(' ')) {
            const part = dateString.split(' ')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
                const [year, month, day] = part.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
        if (/^\d{4}$/.test(dateString)) {
            const date = new Date(parseInt(dateString), 0, 1);
            if (!isNaN(date.getTime())) return date;
        }
        return null;
    }

    function getAvailableYears() {
        const data = window.animeData || [];
        const years = new Set();
        data.forEach(a => {
            if (a.userStatus === 'Completed' && a.finishDate) {
                const y = parseInt(a.finishDate.split('-')[0]);
                if (!isNaN(y)) years.add(y);
            }
        });
        if (years.size === 0) years.add(new Date().getFullYear());
        return Array.from(years).sort((a, b) => b - a);
    }

    function calculateEpisodesPerMonth(year) {
        const monthly = Array(12).fill(0);
        const data = window.animeData || [];
        const seen = new Set();
        data.forEach(a => {
            if (a.userStatus !== 'Completed') return;
            let date = null;
            if (a.actualFinishDate) date = parseDateSafely(a.actualFinishDate);
            if (!date && a.finishDate) date = parseDateSafely(a.finishDate);
            if (!date) return;
            if (date.getFullYear() !== year) return;
            const key = `${a.id}_${year}`;
            if (seen.has(key)) return;
            seen.add(key);
            const eps = a.type === 'Movie' ? 1 : (a.episodes || 0);
            monthly[date.getMonth()] += eps;
        });
        return monthly;
    }

    function calculateWatchTimePerMonth(year) {
        const monthly = Array(12).fill(0);
        const data = window.animeData || [];
        const seen = new Set();
        data.forEach(a => {
            if (a.userStatus !== 'Completed') return;
            let date = null;
            if (a.actualFinishDate) date = parseDateSafely(a.actualFinishDate);
            if (!date && a.finishDate) date = parseDateSafely(a.finishDate);
            if (!date) return;
            if (date.getFullYear() !== year) return;
            const key = `${a.id}_${year}`;
            if (seen.has(key)) return;
            seen.add(key);
            let hours = 0;
            if (a.type === 'Movie') {
                hours = (a.duration || 120) / 60;
            } else {
                hours = ((a.episodes || 0) * (a.duration || 20)) / 60;
            }
            monthly[date.getMonth()] += hours;
        });
        return monthly.map(h => Math.round(h * 10) / 10);
    }

    // ============================================
    // SECTION 1: STATISTICS HERO
    // ============================================

    function updateStatsHero() {
        console.log('🔄 Updating Statistics Hero...');

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        const userName = userProfile.name || userProfile.username || 'AnimeFan';

        const completed = animeData.filter(a => a.userStatus === 'Completed').length;

        let totalEpisodes = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed') {
                totalEpisodes += a.episodes || 0;
            }
        });

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

        const ratedAnime = animeData.filter(a => a.score && a.score > 0);
        let avgRating = 0;
        if (ratedAnime.length > 0) {
            const totalScore = ratedAnime.reduce((sum, a) => sum + a.score, 0);
            avgRating = (totalScore / ratedAnime.length);
        }
        const avgRatingDisplay = avgRating > 0 ? avgRating.toFixed(1) : '0.0';

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

        const completionMonths = new Set();
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = parseDateSafely(a.actualFinishDate);
                if (date && !isNaN(date.getTime())) {
                    const key = `${date.getFullYear()}-${date.getMonth()}`;
                    completionMonths.add(key);
                }
            }
        });
        const streakMonths = completionMonths.size;
        let streakDisplay = streakMonths > 0 ? `${streakMonths} month${streakMonths > 1 ? 's' : ''}` : 'Not started';

        // Update DOM
        const usernameEl = document.getElementById('heroUsername');
        if (usernameEl) usernameEl.textContent = userName;

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

        const completedEl = document.getElementById('heroCompleted');
        const episodesEl = document.getElementById('heroEpisodes');
        const timeEl = document.getElementById('heroTime');
        const ratingEl = document.getElementById('heroRating');

        if (completedEl) completedEl.textContent = completed.toLocaleString();
        if (episodesEl) episodesEl.textContent = totalEpisodes.toLocaleString();
        if (timeEl) timeEl.textContent = watchTimeDisplay;
        if (ratingEl) ratingEl.textContent = avgRatingDisplay;

        console.log('✅ Statistics Hero updated');
    }

    // ============================================
    // SECTION 2: OVERVIEW METRICS (overall totals)
    // ============================================

    function updateOverviewMetrics() {
        console.log('🔄 Updating Overview Metrics...');

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];

        const completed = animeData.filter(a => a.userStatus === 'Completed').length;

        let totalEpisodes = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed') {
                totalEpisodes += a.episodes || 0;
            }
        });

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

        const ratedAnime = animeData.filter(a => a.score && a.score > 0);
        let avgRating = 0;
        if (ratedAnime.length > 0) {
            const totalScore = ratedAnime.reduce((sum, a) => sum + a.score, 0);
            avgRating = (totalScore / ratedAnime.length);
        }
        const avgRatingDisplay = avgRating > 0 ? avgRating.toFixed(1) : '0.0';

        const totalAnime = animeData.length;
        const completionRate = totalAnime > 0 ? Math.round((completed / totalAnime) * 100) : 0;

        const watching = animeData.filter(a => a.userStatus === 'Watching').length;
        const planToWatch = animeData.filter(a => a.userStatus === 'Plan to Watch').length;

        const completionMonths = new Set();
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = parseDateSafely(a.actualFinishDate);
                if (date && !isNaN(date.getTime())) {
                    const key = `${date.getFullYear()}-${date.getMonth()}`;
                    completionMonths.add(key);
                }
            }
        });
        const streakMonths = completionMonths.size;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const completedThisMonth = animeData.filter(a => {
            if (a.userStatus !== 'Completed' || !a.actualFinishDate) return false;
            const date = parseDateSafely(a.actualFinishDate);
            return date && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;

        let episodesThisMonth = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = parseDateSafely(a.actualFinishDate);
                if (date && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    episodesThisMonth += a.episodes || 0;
                }
            }
        });

        let hoursThisMonth = 0;
        animeData.forEach(a => {
            if (a.userStatus === 'Completed' && a.actualFinishDate) {
                const date = parseDateSafely(a.actualFinishDate);
                if (date && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
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

        function updateMetric(elementId, value, suffix = '', prefix = '') {
            const el = document.getElementById(elementId);
            if (!el) return;
            const oldValue = el.textContent;
            const newValue = prefix + value + suffix;
            if (typeof value === 'number' && value >= 10000) {
                el.textContent = prefix + value.toLocaleString() + suffix;
            } else {
                el.textContent = newValue;
            }
            if (oldValue !== newValue && oldValue !== '0' && oldValue !== '0.0') {
                el.classList.add('counting');
                setTimeout(() => el.classList.remove('counting'), 300);
            }
        }

        updateMetric('metricCompleted', completed);
        updateMetric('metricEpisodes', totalEpisodes);

        const timeEl = document.getElementById('metricTime');
        if (timeEl) {
            timeEl.textContent = watchTimeDisplay;
            timeEl.setAttribute('title', watchTimeFull);
        }

        const ratingEl = document.getElementById('metricRating');
        if (ratingEl) {
            ratingEl.textContent = avgRatingDisplay + '★';
        }

        updateMetric('metricRate', completionRate, '%');
        updateMetric('metricWatching', watching);
        updateMetric('metricPlan', planToWatch);
        updateMetric('metricStreak', streakMonths);

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

        console.log('✅ Overview Metrics updated');
    }

    // ============================================
    // SECTION 3: PERIOD STATS (new dedicated section)
    // ============================================

    function getAvailableYearsForPeriod() {
        const data = window.animeData || [];
        const years = new Set();
        data.forEach(a => {
            if (a.userStatus === 'Completed' && a.finishDate) {
                const y = parseInt(a.finishDate.split('-')[0]);
                if (!isNaN(y)) years.add(y);
            }
        });
        // Always include current year
        years.add(new Date().getFullYear());
        return Array.from(years).sort((a, b) => b - a);
    }

    function calculatePeriodStats(month, year) {
        const data = window.animeData || [];
        let completed = 0, episodes = 0, hours = 0;

        data.forEach(a => {
            if (a.userStatus !== 'Completed') return;

            let date = null;
            if (a.actualFinishDate) date = parseDateSafely(a.actualFinishDate);
            if (!date && a.finishDate) date = parseDateSafely(a.finishDate);
            if (!date && a.completedTimestamp) date = parseDateSafely(a.completedTimestamp);
            if (!date) return;

            const animeYear = date.getFullYear();
            const animeMonth = date.getMonth() + 1; // 1-12

            if (year && animeYear !== year) return;
            if (month !== 'all' && animeMonth !== parseInt(month)) return;

            completed++;
            const isMovie = a.type === 'Movie';
            const episodeCount = a.episodes || 0;
            const duration = a.duration || (isMovie ? 120 : 20);

            if (isMovie) {
                episodes += 1;
                hours += duration / 60;
            } else {
                episodes += episodeCount;
                hours += (episodeCount * duration) / 60;
            }
        });

        return { completed, episodes, hours: Math.round(hours * 10) / 10 };
    }

    function updatePeriodStats() {
        const monthSelect = document.getElementById('periodMonth');
        const yearSelect = document.getElementById('periodYear');
        const label = document.getElementById('periodDisplayLabel');

        if (!monthSelect || !yearSelect) return;

        const month = monthSelect.value;
        const year = parseInt(yearSelect.value);

        const stats = calculatePeriodStats(month, year);

        document.getElementById('periodCompleted').textContent = stats.completed;
        document.getElementById('periodEpisodes').textContent = stats.episodes.toLocaleString();

        // ✅ Display hours as total hours (rounded)
        const totalHours = Math.round(stats.hours);
        document.getElementById('periodHours').textContent = `${totalHours} hrs`;

        // Update label
        let monthName = 'All Months';
        if (month !== 'all') {
            monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long' });
        }
        label.textContent = `Showing: ${monthName} ${year}`;

        // Save to localStorage
        localStorage.setItem('periodMonth', month);
        localStorage.setItem('periodYear', year);
    }

    function initPeriodStats() {
        const yearSelect = document.getElementById('periodYear');
        const monthSelect = document.getElementById('periodMonth');
        if (!yearSelect || !monthSelect) return;

        const years = getAvailableYearsForPeriod();
        const currentYear = new Date().getFullYear();

        // Populate year dropdown
        yearSelect.innerHTML = '';
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        });

        // Load saved values from localStorage
        const savedMonth = localStorage.getItem('periodMonth');
        const savedYear = localStorage.getItem('periodYear');

        // Set month – saved or current
        if (savedMonth && monthSelect.querySelector(`option[value="${savedMonth}"]`)) {
            monthSelect.value = savedMonth;
        } else {
            // default to current month
            monthSelect.value = new Date().getMonth() + 1;
        }

        // Set year – saved or current
        if (savedYear && yearSelect.querySelector(`option[value="${savedYear}"]`)) {
            yearSelect.value = parseInt(savedYear);
        } else {
            yearSelect.value = currentYear;
        }

        // Event listeners that save on change
        monthSelect.addEventListener('change', () => {
            localStorage.setItem('periodMonth', monthSelect.value);
            updatePeriodStats();
        });
        yearSelect.addEventListener('change', () => {
            localStorage.setItem('periodYear', yearSelect.value);
            updatePeriodStats();
        });

        // Initial update
        updatePeriodStats();
    }

    // ============================================
    // SECTION 4: LIBRARY ANALYTICS
    // ============================================

    function updateLibraryAnalytics() {
        console.log('🔄 Updating Library Analytics...');

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const totalEntries = animeData.length;

        const totalEl = document.getElementById('analyticsTotal');
        if (totalEl) totalEl.textContent = totalEntries;

        // Genre Distribution
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

        // Format Distribution
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

        // Insights
        const topGenre = sortedGenres.length > 0 ? sortedGenres[0] : null;
        const topGenreEl = document.getElementById('insightTopGenre');
        const topGenreCountEl = document.getElementById('insightTopGenreCount');
        if (topGenreEl) topGenreEl.textContent = topGenre ? topGenre[0] : '—';
        if (topGenreCountEl) topGenreCountEl.textContent = topGenre ? `${topGenre[1]} anime` : '0 anime';

        const secondGenre = sortedGenres.length > 1 ? sortedGenres[1] : null;
        const secondGenreEl = document.getElementById('insightSecondGenre');
        const secondGenreCountEl = document.getElementById('insightSecondGenreCount');
        if (secondGenreEl) secondGenreEl.textContent = secondGenre ? secondGenre[0] : '—';
        if (secondGenreCountEl) secondGenreCountEl.textContent = secondGenre ? `${secondGenre[1]} anime` : '0 anime';

        const topFormat = sortedFormats.length > 0 ? sortedFormats[0] : null;
        const formatLabel = topFormat ? (formatMap[topFormat[0]]?.label || topFormat[0]) : '—';
        const prefFormatEl = document.getElementById('insightPreferredFormat');
        const prefFormatCountEl = document.getElementById('insightPreferredFormatCount');
        if (prefFormatEl) prefFormatEl.textContent = formatLabel;
        if (prefFormatCountEl) prefFormatCountEl.textContent = topFormat ? `${topFormat[1]} anime` : '0 anime';

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

        const completed = animeData.filter(a => a.userStatus === 'Completed').length;
        const completionRate = totalEntries > 0 ? Math.round((completed / totalEntries) * 100) : 0;
        const completionEl = document.getElementById('insightCompletion');
        const completionDetailEl = document.getElementById('insightCompletionDetail');
        if (completionEl) completionEl.textContent = `${completionRate}%`;
        if (completionDetailEl) completionDetailEl.textContent = `${completed} completed`;

        const totalGenresEl = document.getElementById('insightTotalGenres');
        if (totalGenresEl) totalGenresEl.textContent = uniqueGenres;

        // Smart Insights
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
    // SECTION 5: RATING ANALYTICS
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

        const iconEl = document.getElementById('personalityIcon');
        if (iconEl) {
            iconEl.innerHTML = '<i class="fas fa-user-astronaut"></i>';
        }

        const totalEl = document.getElementById('ratingTotal');
        if (totalEl) totalEl.textContent = '0';
    }

    function updateRatingAnalytics() {
        console.log('🔄 Updating Rating Analytics...');

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];
        const ratedAnime = animeData.filter(a => a.score && a.score > 0);
        const totalRatings = ratedAnime.length;

        const totalEl = document.getElementById('ratingTotal');
        if (totalEl) totalEl.textContent = totalRatings;

        if (totalRatings === 0) {
            showNoRatingData();
            return;
        }

        // Score Distribution
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

        // Rating Behavior
        const totalScore = ratedAnime.reduce((sum, a) => sum + a.score, 0);
        const avgScore = totalScore / totalRatings;
        const avgScoreDisplay = avgScore.toFixed(1);

        document.getElementById('behaviorAvgScore').textContent = `${avgScoreDisplay} ★`;
        document.getElementById('behaviorAvgDetail').textContent = `from ${totalRatings} ratings`;

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

        const filteredGenres = Object.entries(genreScores)
            .filter(([_, data]) => data.count >= 2)
            .map(([genre, data]) => ({
                genre,
                avg: data.total / data.count,
                count: data.count
            }))
            .sort((a, b) => b.avg - a.avg);

        const highestGenre = filteredGenres.length > 0 ? filteredGenres[0] : null;
        if (highestGenre) {
            document.getElementById('behaviorHighestGenre').textContent = highestGenre.genre;
            document.getElementById('behaviorHighestDetail').textContent =
                `${highestGenre.avg.toFixed(1)} ★ from ${highestGenre.count} anime`;
        } else {
            document.getElementById('behaviorHighestGenre').textContent = '—';
            document.getElementById('behaviorHighestDetail').textContent = 'No data';
        }

        const lowestGenre = filteredGenres.length > 1 ? filteredGenres[filteredGenres.length - 1] : null;
        if (lowestGenre && filteredGenres.length > 1) {
            document.getElementById('behaviorLowestGenre').textContent = lowestGenre.genre;
            document.getElementById('behaviorLowestDetail').textContent =
                `${lowestGenre.avg.toFixed(1)} ★ from ${lowestGenre.count} anime`;
        } else {
            document.getElementById('behaviorLowestGenre').textContent = '—';
            document.getElementById('behaviorLowestDetail').textContent = 'No data';
        }

        // Rating Personality
        const highScores = (scoreDistribution[10] || 0) + (scoreDistribution[9] || 0);
        const midScores = (scoreDistribution[8] || 0) + (scoreDistribution[7] || 0) + (scoreDistribution[6] || 0);
        const lowScores = (scoreDistribution[5] || 0) + (scoreDistribution[4] || 0) +
            (scoreDistribution[3] || 0) + (scoreDistribution[2] || 0) + (scoreDistribution[1] || 0);
        const highPercent = (highScores / totalRatings) * 100;
        const midPercent = (midScores / totalRatings) * 100;
        const lowPercent = (lowScores / totalRatings) * 100;

        let personalityName = '', personalityDescription = '', personalityIcon = '';
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

        const allScores = [];
        ratedAnime.forEach(a => { if (a.score) allScores.push(a.score); });
        allScores.sort((a, b) => a - b);
        const median = allScores.length > 0 ? allScores[Math.floor(allScores.length / 2)] : 0;
        const spread = allScores.length > 0 ? (allScores[allScores.length - 1] - allScores[0]) : 0;

        document.getElementById('personalityName').textContent = personalityName;
        document.getElementById('personalityDescription').textContent = personalityDescription;
        document.getElementById('personalityIcon').innerHTML = `<i class="fas ${personalityIcon}"></i>`;
        document.getElementById('personalityAvg').textContent = avgScoreDisplay;
        document.getElementById('personalityMedian').textContent = median.toFixed(1);
        document.getElementById('personalitySpread').textContent = spread.toFixed(1);

        // Average Score by Genre
        const genreScoreContainer = document.getElementById('genreScoreChart');
        if (genreScoreContainer) {
            genreScoreContainer.innerHTML = '';
            const sortedGenres = filteredGenres.sort((a, b) => b.avg - a.avg).slice(0, 10);
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

        // Advanced Insights
        const advancedContainer = document.getElementById('advancedInsights');
        if (advancedContainer) {
            const insights = [];

            insights.push({
                icon: 'fas fa-chart-simple',
                text: `<strong>${mostCommonScore}★</strong> is your most frequently used score (${mostCommonCount} times).`
            });

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

            const perfectCount = scoreDistribution[10] || 0;
            if (perfectCount > 0) {
                const perfectPercent = (perfectCount / totalRatings) * 100;
                insights.push({
                    icon: 'fas fa-crown',
                    text: `You've given <strong>${perfectCount} perfect 10★</strong> ratings (${perfectPercent.toFixed(1)}% of all ratings).`
                });
            }

            const lowCount = (scoreDistribution[1] || 0) + (scoreDistribution[2] || 0) + (scoreDistribution[3] || 0);
            if (lowCount > 0) {
                const lowPercent = (lowCount / totalRatings) * 100;
                insights.push({
                    icon: 'fas fa-thumbs-down',
                    text: `<strong>${lowPercent.toFixed(1)}%</strong> of your ratings are below 4★ (${lowCount} anime).`
                });
            }

            if (highestGenre && avgScore > 0) {
                const diff = highestGenre.avg - avgScore;
                const diffText = diff > 0 ? `${diff.toFixed(1)}★ higher` : `${Math.abs(diff).toFixed(1)}★ lower`;
                insights.push({
                    icon: 'fas fa-trophy',
                    text: `You rate <strong>${highestGenre.genre}</strong> ${diffText} than your library average.`
                });
            }

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
    // SECTION 6: COMPLETION JOURNEY
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

    function renderCumulativeChart(labels, data, total) {
        const canvas = document.getElementById('completionJourneyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (journeyCharts.cumulative) {
            try { journeyCharts.cumulative.destroy(); } catch (e) { }
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
                interaction: { mode: 'index', intersect: false },
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
                            label: function (context) {
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

    function renderMonthlyChart(labels, data) {
        const canvas = document.getElementById('monthlyCompletionChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (journeyCharts.monthly) {
            try { journeyCharts.monthly.destroy(); } catch (e) { }
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
                            label: function (context) {
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

        const monthlyCounts = Object.values(monthlyGroups).map(g => g.count);
        const avgMonthly = monthlyCounts.length > 0 ? monthlyCounts.reduce((a, b) => a + b, 0) / monthlyCounts.length : 0;

        if (!isNaN(avgMonthly) && avgMonthly > 0) {
            insights.push({
                icon: 'fas fa-calendar-alt',
                text: `You complete an average of <strong>${avgMonthly.toFixed(1)}</strong> anime per month.`
            });
        }

        let fastestMonth = '', fastestCount = 0;
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

        let activeYear = '', activeCount = 0;
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

    function updateCompletionJourney() {
        console.log('🔄 Updating Completion Journey...');

        const animeData = JSON.parse(localStorage.getItem('animeData')) || [];

        let completedAnime = animeData
            .filter(a => a.userStatus === 'Completed')
            .map(a => {
                const date = getCompletionDate(a);
                return { ...a, completionDate: date };
            })
            .filter(a => a.completionDate && !isNaN(a.completionDate.getTime()))
            .sort((a, b) => a.completionDate - b.completionDate);

        if (currentRange !== 'all') {
            completedAnime = completedAnime.filter(a => isInRange(a.completionDate, currentRange));
        }

        const totalCompleted = completedAnime.length;

        if (totalCompleted === 0) {
            showEmptyJourney();
            return;
        }

        document.getElementById('journeyTotalCompleted').textContent = totalCompleted;

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

            if (!monthlyGroups[monthKey]) {
                monthlyGroups[monthKey] = { count: 0, date: date };
            }
            monthlyGroups[monthKey].count++;

            if (!yearlyGroups[yearKey]) {
                yearlyGroups[yearKey] = { count: 0 };
            }
            yearlyGroups[yearKey].count++;
        });

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

        renderCumulativeChart(chartLabels, chartData, totalCompleted);

        const monthlyLabels = Object.keys(monthlyGroups).sort();
        const monthlyCounts = monthlyLabels.map(key => monthlyGroups[key].count);
        const avgMonthly = monthlyCounts.length > 0 ? Math.round(monthlyCounts.reduce((a, b) => a + b, 0) / monthlyCounts.length) : 0;

        document.getElementById('journeyMonthlyAvg').textContent = avgMonthly;
        renderMonthlyChart(monthlyLabels, monthlyCounts);

        // Journey Insights
        const firstAnime = completedAnime[0];
        const firstDate = firstAnime.completionDate;
        document.getElementById('journeyFirstAnime').textContent = firstAnime.title;
        document.getElementById('journeyFirstDate').textContent = formatDateFull(firstDate);

        let fastestMonth = '', fastestCount = 0;
        Object.entries(monthlyGroups).forEach(([key, data]) => {
            if (data.count > fastestCount) {
                fastestCount = data.count;
                fastestMonth = key;
            }
        });
        const fastestMonthDate = monthlyGroups[fastestMonth]?.date;
        document.getElementById('journeyFastestMonth').textContent = fastestMonthDate ? formatDate(fastestMonthDate) : '—';
        document.getElementById('journeyFastestCount').textContent = `${fastestCount} anime`;

        let activeYear = '', activeCount = 0;
        Object.entries(yearlyGroups).forEach(([year, data]) => {
            if (data.count > activeCount) {
                activeCount = data.count;
                activeYear = year;
            }
        });
        document.getElementById('journeyActiveYear').textContent = activeYear || '—';
        document.getElementById('journeyActiveCount').textContent = `${activeCount} anime`;

        const firstDateObj = firstAnime.completionDate;
        const lastDateObj = completedAnime[completedAnime.length - 1].completionDate;
        const monthsDiff = (lastDateObj.getFullYear() - firstDateObj.getFullYear()) * 12 +
            (lastDateObj.getMonth() - firstDateObj.getMonth()) + 1;
        const pace = monthsDiff > 0 ? (totalCompleted / monthsDiff).toFixed(1) : totalCompleted;
        document.getElementById('journeyPace').textContent = pace;

        renderMilestones(completedAnime);
        renderPaceInsights(completedAnime, totalCompleted, monthlyGroups, yearlyGroups, currentRange);

        console.log('✅ Completion Journey updated');
    }

    // ============================================
    // SECTION 7: CHART FUNCTIONS (Dashboard & Statistics)
    // ============================================

    function calculateMonthlyProgressData() {
        const data = window.animeData || [];
        const monthlyData = Array(12).fill(0);
        const now = new Date();
        const currentYear = now.getFullYear();
        data.forEach(anime => {
            if (anime.userStatus === 'Completed' && anime.finishDate) {
                const [yearStr, monthStr] = anime.finishDate.split('-');
                const year = parseInt(yearStr, 10);
                const monthIndex = parseInt(monthStr, 10) - 1;
                if (!isNaN(year) && !isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11) {
                    if (year === currentYear) monthlyData[monthIndex]++;
                }
            }
        });
        return monthlyData;
    }

    // --- Genre filter helpers ---
    function getAnimeCompletionTime(anime) {
        if (anime.finishDate) {
            const date = parseDateSafely(anime.finishDate);
            if (date) return date;
        }
        if (anime.completedTimestamp) return new Date(anime.completedTimestamp);
        if (anime.updatedAt) {
            const date = parseDateSafely(anime.updatedAt);
            if (date) return date;
        }
        return null;
    }

    function getFilteredAnimeByTime(filterType) {
        const data = window.animeData || [];
        const completed = data.filter(a => a.userStatus === 'Completed');
        if (filterType === 'all') return completed;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return completed.filter(anime => {
            const date = getAnimeCompletionTime(anime);
            if (!date) return false;
            switch (filterType) {
                case 'month':
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                case 'lastMonth':
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
                case 'year':
                    return date.getFullYear() === currentYear;
                default:
                    return true;
            }
        });
    }

    function calculateGenreDistributionWithFilter(filteredAnime) {
        const genreCount = {};
        filteredAnime.forEach(anime => {
            if (anime.genres && Array.isArray(anime.genres) && anime.genres.length > 0) {
                anime.genres.forEach(genre => {
                    const clean = genre.trim();
                    if (clean) genreCount[clean] = (genreCount[clean] || 0) + 1;
                });
            }
        });
        return genreCount;
    }

    function updateGenreChartWithFilter() {
        if (!genreDistributionChart) return;
        const filtered = getFilteredAnimeByTime(currentGenreFilter);
        const distribution = calculateGenreDistributionWithFilter(filtered);
        const labels = Object.keys(distribution);
        const data = Object.values(distribution);

        const noDataMsg = document.getElementById('genreNoDataMessage');
        const canvas = document.getElementById('genreDistributionChart');

        if (labels.length === 0) {
            if (noDataMsg) noDataMsg.style.display = 'block';
            if (canvas) canvas.style.opacity = '0.5';
            genreDistributionChart.data.labels = ['No Data'];
            genreDistributionChart.data.datasets[0].data = [1];
            genreDistributionChart.data.datasets[0].backgroundColor = ['rgba(100,100,100,0.3)'];
            genreDistributionChart.update();
            return;
        }
        if (noDataMsg) noDataMsg.style.display = 'none';
        if (canvas) canvas.style.opacity = '1';

        const colorPalette = [
            '#ef4444', '#3b82f6', '#facc15', '#a855f7', '#10b981', '#ec4899', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
            '#c026d3', '#06b6d4', '#e11d48', '#78350f', '#22c55e', '#f59e0b', '#9333ea', '#64748b', '#f9e616'
        ];
        const backgroundColors = labels.map((_, i) => colorPalette[i % colorPalette.length]);

        genreDistributionChart.data.labels = labels;
        genreDistributionChart.data.datasets[0].data = data;
        genreDistributionChart.data.datasets[0].backgroundColor = backgroundColors;
        genreDistributionChart.update({ duration: 400, easing: 'easeInOutQuart' });
    }

    function initGenreFilters() {
        const buttons = document.querySelectorAll('.genre-filter-btn');
        if (!buttons.length) return;
        const saved = localStorage.getItem('genreFilterType');
        if (saved && ['month', 'lastMonth', 'year', 'all'].includes(saved)) currentGenreFilter = saved;

        buttons.forEach(btn => {
            const filterValue = btn.getAttribute('data-filter');
            if (filterValue === currentGenreFilter) btn.classList.add('active');
            btn.addEventListener('click', () => {
                const newFilter = btn.getAttribute('data-filter');
                if (!newFilter || newFilter === currentGenreFilter) return;
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentGenreFilter = newFilter;
                localStorage.setItem('genreFilterType', currentGenreFilter);
                updateGenreChartWithFilter();
            });
        });
        updateGenreChartWithFilter();
    }

    // --- EXTRACTED CHART UPDATE FUNCTIONS ---

    function populateYearDropdowns() {
        const years = getAvailableYears();
        const currentYear = new Date().getFullYear();

        const epsSelect = document.getElementById('episodesYearSelect');
        if (epsSelect) {
            epsSelect.innerHTML = '';
            years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                epsSelect.appendChild(opt);
            });
            currentEpisodesYear = years.includes(currentYear) ? currentYear : years[0];
            epsSelect.value = currentEpisodesYear;
            epsSelect.onchange = (e) => {
                const year = parseInt(e.target.value);
                currentEpisodesYear = year;
                updateEpisodesChart(year);
            };
        }

        const wtSelect = document.getElementById('watchTimeYearSelect');
        if (wtSelect) {
            wtSelect.innerHTML = '';
            years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                wtSelect.appendChild(opt);
            });
            currentWatchTimeYear = years.includes(currentYear) ? currentYear : years[0];
            wtSelect.value = currentWatchTimeYear;
            wtSelect.onchange = (e) => {
                const year = parseInt(e.target.value);
                currentWatchTimeYear = year;
                updateWatchTimeChart(year);
            };
        }
    }

    function updateEpisodesChart(year) {
        if (!episodesOverTimeChart) return;
        const data = calculateEpisodesPerMonth(year);
        const total = data.reduce((a, b) => a + b, 0);
        const totalEl = document.getElementById('yearly-total-episodes');
        if (totalEl) {
            const formatted = window.formatCompactNumber ? window.formatCompactNumber(total) : total;
            totalEl.innerHTML = `Total Eps: ${formatted}`;
        }
        episodesOverTimeChart.data.datasets[0].data = data;
        episodesOverTimeChart.data.datasets[0].label = `Episodes Watched (${year})`;
        const maxVal = Math.max(...data, 1);
        episodesOverTimeChart.options.scales.y.max = Math.ceil(maxVal * 1.1);
        episodesOverTimeChart.update();
    }

    function updateWatchTimeChart(year) {
        if (!watchTimeByMonthChart) return;
        const data = calculateWatchTimePerMonth(year);
        const total = Math.round(data.reduce((a, b) => a + b, 0));
        const totalEl = document.getElementById('monthly-total-hours');
        if (totalEl) {
            const formatted = window.formatCompactNumber ? window.formatCompactNumber(total) : total;
            totalEl.innerHTML = `Total Hrs: ${formatted}`;
        }
        watchTimeByMonthChart.data.datasets[0].data = data;
        const maxVal = Math.max(...data, 1);
        watchTimeByMonthChart.options.scales.y.max = Math.ceil(maxVal * 1.1);
        watchTimeByMonthChart.update();
    }

    function refreshAllCharts() {
        const data = window.animeData || [];
        const completed = data.filter(a => a.userStatus === 'Completed');
        const rated = data.filter(a => a.score && a.score > 0);

        if (window.AniPulseCharts.completionChart) {
            const yearly = [0, 0, 0, 0, 0];
            const years = [2024, 2025, 2026, 2027, 2028];
            completed.forEach(a => {
                if (a.finishDate) {
                    const y = parseInt(a.finishDate.split('-')[0]);
                    const idx = years.indexOf(y);
                    if (idx !== -1) yearly[idx]++;
                }
            });
            window.AniPulseCharts.completionChart.data.datasets[0].data = yearly;
            window.AniPulseCharts.completionChart.update();
        }

        if (window.AniPulseCharts.scoreChart) {
            const scoreRanges = [0, 0, 0, 0, 0, 0];
            rated.forEach(a => {
                if (a.score === 10) scoreRanges[0]++;
                else if (a.score >= 9) scoreRanges[1]++;
                else if (a.score >= 8) scoreRanges[2]++;
                else if (a.score >= 7) scoreRanges[3]++;
                else if (a.score >= 6) scoreRanges[4]++;
                else scoreRanges[5]++;
            });
            window.AniPulseCharts.scoreChart.data.datasets[0].data = scoreRanges;
            window.AniPulseCharts.scoreChart.update();
        }

        if (window.AniPulseCharts.statusChart) {
            const statusMap = { 'Completed': 0, 'Watching': 0, 'Plan to Watch': 0, 'Dropped': 0 };
            data.forEach(a => { if (statusMap.hasOwnProperty(a.userStatus)) statusMap[a.userStatus]++; });
            window.AniPulseCharts.statusChart.data.datasets[0].data = Object.values(statusMap);
            window.AniPulseCharts.statusChart.update();
        }

        if (window.AniPulseCharts.typeChart) {
            const types = {};
            data.forEach(a => { const t = a.type || 'TV'; types[t] = (types[t] || 0) + 1; });
            window.AniPulseCharts.typeChart.data.labels = Object.keys(types);
            window.AniPulseCharts.typeChart.data.datasets[0].data = Object.values(types);
            window.AniPulseCharts.typeChart.update();
        }

        if (window.AniPulseCharts.genreChart) {
            const genreCount = {};
            data.forEach(a => {
                if (a.genres && Array.isArray(a.genres)) {
                    a.genres.forEach(g => { if (g !== 'Award Winning') genreCount[g] = (genreCount[g] || 0) + 1; });
                }
            });
            const sorted = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
            window.AniPulseCharts.genreChart.data.labels = sorted.map(([k]) => k);
            window.AniPulseCharts.genreChart.data.datasets[0].data = sorted.map(([, v]) => v);
            window.AniPulseCharts.genreChart.update();
        }

        if (window.AniPulseCharts.avgScoreChart) {
            const genreScores = {};
            rated.forEach(a => {
                if (a.genres && Array.isArray(a.genres)) {
                    a.genres.forEach(g => {
                        if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
                        genreScores[g].total += a.score;
                        genreScores[g].count++;
                    });
                }
            });
            const labels = Object.keys(genreScores);
            const avgScores = labels.map(g => (genreScores[g].total / genreScores[g].count).toFixed(1));
            window.AniPulseCharts.avgScoreChart.data.labels = labels;
            window.AniPulseCharts.avgScoreChart.data.datasets[0].data = avgScores;
            window.AniPulseCharts.avgScoreChart.update();
        }

        if (episodesOverTimeChart && currentEpisodesYear) {
            updateEpisodesChart(currentEpisodesYear);
        }
        if (watchTimeByMonthChart && currentWatchTimeYear) {
            updateWatchTimeChart(currentWatchTimeYear);
        }

        populateYearDropdowns();

        // Genre filter chart
        updateGenreChartWithFilter();

        console.log('✅ All statistics charts refreshed');
    }

    // ============================================
    // SECTION 8: STATISTICS TABLES
    // ============================================

    function updateStatisticsTables() {
        const data = window.animeData || [];
        const totalAnime = data.length;
        const completed = data.filter(a => a.userStatus === 'Completed').length;
        const totalHours = typeof window.calculateTotalHours === 'function' ? window.calculateTotalHours() : 0;
        const avgScore = (() => {
            const rated = data.filter(a => a.score && a.score > 0);
            if (rated.length === 0) return 0;
            return (rated.reduce((s, a) => s + a.score, 0) / rated.length).toFixed(1);
        })();
        const completionRate = totalAnime > 0 ? Math.round((completed / totalAnime) * 100) : 0;

        const totalAnimeStats = document.getElementById('total-anime-stats');
        const totalHoursStats = document.getElementById('total-hours-stats');
        const avgScoreStats = document.getElementById('avg-score-stats');
        const completionRateEl = document.getElementById('completion-rate');
        if (totalAnimeStats) totalAnimeStats.textContent = totalAnime;
        if (totalHoursStats) totalHoursStats.textContent = totalHours;
        if (avgScoreStats) avgScoreStats.textContent = avgScore;
        if (completionRateEl) completionRateEl.textContent = completionRate + '%';

        // Yearly breakdown
        const yearlyBreakdownEl = document.getElementById('yearlyBreakdown');
        if (yearlyBreakdownEl) {
            const yearlyData = {};
            const currentYear = new Date().getFullYear();
            for (let y = 2020; y <= currentYear; y++) yearlyData[y] = 0;
            data.forEach(a => {
                if (a.finishDate) {
                    const y = new Date(a.finishDate).getFullYear();
                    if (yearlyData.hasOwnProperty(y)) yearlyData[y]++;
                }
            });
            const maxCount = Math.max(...Object.values(yearlyData), 1);
            yearlyBreakdownEl.innerHTML = Object.entries(yearlyData)
                .filter(([y, c]) => c > 0 || parseInt(y) === currentYear)
                .map(([year, count]) => `
                    <div class="stat-row">
                        <div class="stat-label-small">${year}</div>
                        <div class="stat-progress">
                            <div class="stat-progress-bar" style="width: ${(count / maxCount) * 100}%"></div>
                        </div>
                        <div class="stat-value-small">${count}</div>
                    </div>
                `).join('');
        }

        // Score analysis
        const scoreAnalysisEl = document.getElementById('scoreAnalysis');
        if (scoreAnalysisEl) {
            const rated = data.filter(a => a.score && a.score > 0);
            const avg = rated.length > 0 ? (rated.reduce((s, a) => s + a.score, 0) / rated.length).toFixed(1) : 0;
            const highest = rated.sort((a, b) => b.score - a.score)[0];
            const lowest = rated.sort((a, b) => a.score - b.score)[0];
            scoreAnalysisEl.innerHTML = `
                <div class="stat-row"><div class="stat-label-small">Rated Anime</div><div class="stat-value-small">${rated.length}</div></div>
                <div class="stat-row"><div class="stat-label-small">Average Score</div><div class="stat-value-small">${avg}</div></div>
                <div class="stat-row"><div class="stat-label-small">Highest Rated</div><div class="stat-value-small">${highest ? highest.score + ' (' + highest.title + ')' : 'N/A'}</div></div>
                <div class="stat-row"><div class="stat-label-small">Lowest Rated</div><div class="stat-value-small">${lowest ? lowest.score + ' (' + lowest.title + ')' : 'N/A'}</div></div>
            `;
        }
    }

    // ============================================
    // SECTION 9: MONTHLY STATS (for dashboard) – UPGRADED
    // ============================================

    function calculateMonthlyStats(options = {}) {
        const debug = options.debug || false;
        const data = window.animeData || [];
        if (!Array.isArray(data) || data.length === 0) {
            if (debug) console.warn('⚠️ No anime data found');
            return { hours: '0.0', completed: 0, movies: 0, episodes: 0 };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let hours = 0, completed = 0, movies = 0, episodes = 0;

        const parseDate = typeof window.parseDateSafely === 'function'
            ? window.parseDateSafely
            : function (dateStr) {
                if (!dateStr) return null;
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{4}-\d{2}$/.test(dateStr)) {
                    const parts = dateStr.split('-').map(Number);
                    const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
                    return isNaN(d.getTime()) ? null : d;
                }
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? null : d;
            };

        if (debug) console.log(`📊 calculateMonthlyStats: ${data.length} anime total`);

        data.forEach(a => {
            if (a.userStatus !== 'Completed') return;

            let completionDate = null;
            if (a.actualFinishDate) completionDate = parseDate(a.actualFinishDate);
            if (!completionDate && a.finishDate) completionDate = parseDate(a.finishDate);
            if (!completionDate && a.completedTimestamp) completionDate = parseDate(a.completedTimestamp);
            if (!completionDate && a.updatedAt) completionDate = parseDate(a.updatedAt);

            if (!completionDate) {
                if (debug) console.warn(`⚠️ No valid date for: ${a.title}`, a);
                return;
            }

            if (completionDate.getMonth() === currentMonth && completionDate.getFullYear() === currentYear) {
                const isMovie = a.type === 'Movie';
                const episodeCount = a.episodes || 0;
                const duration = a.duration || (isMovie ? 120 : 20);

                if (isMovie) {
                    movies++;
                    hours += duration / 60;
                    episodes += 1;
                } else {
                    episodes += episodeCount;
                    hours += (episodeCount * duration) / 60;
                }
                completed++;

                if (debug) console.log(`✅ ${a.title}: +1 completed (${episodeCount} eps)`);
            }
        });

        const result = {
            hours: hours.toFixed(1),
            completed,
            movies,
            episodes
        };

        if (debug) console.log('✅ Monthly stats result:', result);
        return result;
    }

    function updateStatCardsWithChanges(options = {}) {
        const debug = options.debug || false;
        const data = window.animeData || [];
        if (!Array.isArray(data)) {
            if (debug) console.warn('⚠️ Invalid anime data');
            return;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        function getStats(year, month) {
            let completed = 0, movies = 0, episodes = 0, hours = 0;

            const parseDate = typeof window.parseDateSafely === 'function'
                ? window.parseDateSafely
                : function (dateStr) {
                    if (!dateStr) return null;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{4}-\d{2}$/.test(dateStr)) {
                        const parts = dateStr.split('-').map(Number);
                        const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
                        return isNaN(d.getTime()) ? null : d;
                    }
                    const d = new Date(dateStr);
                    return isNaN(d.getTime()) ? null : d;
                };

            data.forEach(a => {
                if (a.userStatus !== 'Completed') return;

                let date = null;
                if (a.actualFinishDate) date = parseDate(a.actualFinishDate);
                if (!date && a.finishDate) date = parseDate(a.finishDate);
                if (!date && a.completedTimestamp) date = parseDate(a.completedTimestamp);
                if (!date) return;

                if (date.getFullYear() === year && date.getMonth() === month) {
                    completed++;
                    const isMovie = a.type === 'Movie';
                    const episodeCount = a.episodes || 0;
                    const duration = a.duration || (isMovie ? 120 : 20);

                    if (isMovie) {
                        movies++;
                        episodes += 1;
                        hours += duration / 60;
                    } else {
                        episodes += episodeCount;
                        hours += (episodeCount * duration) / 60;
                    }
                }
            });

            return { completed, movies, episodes, hours };
        }

        if (now.getMonth() === 0) {
            const statTypes = ['completed', 'movies', 'episodes', 'hours'];
            statTypes.forEach(stat => {
                const el = document.getElementById(`${stat}-change`);
                if (el) {
                    el.className = 'stat-change neutral';
                    el.innerHTML = `<i class="fas fa-minus"></i> <span>No Track</span>`;
                }
            });
            if (debug) console.log('📅 January: No previous month data');
            return;
        }

        const current = getStats(currentYear, currentMonth);

        let prevYear = currentYear, prevMonth = currentMonth - 1;
        if (prevMonth < 0) { prevMonth = 11; prevYear--; }
        const prev = getStats(prevYear, prevMonth);

        if (debug) console.log('📊 Current month:', current, 'Previous:', prev);

        const statTypes = ['completed', 'movies', 'episodes', 'hours'];
        statTypes.forEach(stat => {
            const el = document.getElementById(`${stat}-change`);
            if (!el) return;

            const curr = current[stat] || 0;
            const prevVal = prev[stat] || 0;

            let className = 'neutral';
            let icon = 'fa-minus';
            let text = 'No data';

            if (prevVal === 0 && curr === 0) {
                className = 'neutral';
                icon = 'fa-minus';
                text = 'No data';
            } else if (prevVal === 0 && curr > 0) {
                className = 'positive';
                icon = 'fa-arrow-up';
                text = 'New activity';
            } else if (prevVal > 0 && curr === 0) {
                className = 'negative';
                icon = 'fa-arrow-down';
                text = 'No activity';
            } else {
                const change = ((curr - prevVal) / prevVal) * 100;
                const absChange = Math.abs(change);

                if (absChange < 1) {
                    className = 'neutral';
                    icon = 'fa-minus';
                    text = 'No change';
                } else {
                    className = change > 0 ? 'positive' : 'negative';
                    icon = change > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                    text = `${absChange.toFixed(1)}% ${change > 0 ? 'more' : 'less'}`;
                }
            }

            el.className = `stat-change ${className}`;
            el.innerHTML = `<i class="fas ${icon}"></i> <span>${text}</span>`;
        });

        if (debug) console.log('✅ Stat cards updated');
    }

    // ============================================
    // SECTION 10: DASHBOARD CHARTS
    // ============================================

    function initCharts() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ffffff' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

        if (window.monthlyProgressChart) {
            if (typeof window.monthlyProgressChart.destroy === 'function') {
                window.monthlyProgressChart.destroy();
            }
            window.monthlyProgressChart = null;
        }

        const monthlyCtx = document.getElementById('monthlyProgressChart')?.getContext('2d');
        if (!monthlyCtx) {
            console.warn('⚠️ monthlyProgressChart canvas not found – skipping chart init');
            return;
        }

        const monthlyData = calculateMonthlyProgressData();
        _monthlyChartData = monthlyData;
        const currentMonth = new Date().getMonth();
        _monthlyChartCurrentMonth = currentMonth;

        const trendData = monthlyData.map((value, index) => {
            return index <= currentMonth ? value : null;
        });

        const total = monthlyData.reduce((sum, value) => sum + (Number(value) || 0), 0);
        const totalSpan = document.getElementById('monthly-total-anime');
        if (totalSpan) {
            totalSpan.textContent = `Total Completed: ${total}`;
        }

        window.monthlyProgressChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    {
                        type: 'line',
                        label: 'Trend',
                        data: trendData,
                        order: 1,
                        yAxisID: 'y',
                        fill: false,
                        tension: 0.45,
                        borderWidth: 4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBorderWidth: 2,
                        pointBorderColor: '#ffffff',
                        spanGaps: false,
                        pointBackgroundColor: (ctx) => {
                            const index = ctx.dataIndex;
                            if (index === 0) return '#9CA3AF';
                            if (index > currentMonth) return 'transparent';
                            const current = monthlyData[index];
                            const previous = monthlyData[index - 1];
                            if (current > previous) return '#22C55E';
                            if (current < previous) return '#EF4444';
                            return '#9CA3AF';
                        },
                        segment: {
                            borderColor: (ctx) => {
                                const start = ctx.p0DataIndex;
                                const end = ctx.p1DataIndex;
                                if (start === 0) return '#9CA3AF';
                                if (end > currentMonth) return 'transparent';
                                const previous = monthlyData[start];
                                const current = monthlyData[end];
                                if (current > previous) return '#22C55E';
                                if (current < previous) return '#EF4444';
                                return '#9CA3AF';
                            }
                        }
                    },
                    {
                        type: 'bar',
                        label: 'Anime Completed',
                        data: monthlyData,
                        order: 2,
                        backgroundColor: 'rgba(99,102,241,0.75)',
                        borderColor: 'rgba(99,102,241,1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        yAxisID: 'y',
                        barPercentage: 0.65,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                const datasetIndex = context.datasetIndex;
                                const dataIndex = context.dataIndex;
                                const rawValue = context.raw;

                                if (datasetIndex === 1) {
                                    return `Completed: ${rawValue}`;
                                }

                                if (datasetIndex === 0 && dataIndex > 0 && dataIndex <= _monthlyChartCurrentMonth) {
                                    const current = _monthlyChartData[dataIndex];
                                    const previous = _monthlyChartData[dataIndex - 1];

                                    if (previous === 0 && current === 0) {
                                        return 'No change (0 vs 0)';
                                    }
                                    if (previous === 0 && current > 0) {
                                        return `🚀 Started with ${current} anime (new activity!)`;
                                    }
                                    const change = ((current - previous) / previous) * 100;
                                    const absChange = Math.abs(change);
                                    if (change === 0) {
                                        return `No change (${current} anime)`;
                                    } else if (change > 0) {
                                        return `Increased by ${absChange.toFixed(1)}%`;
                                    } else {
                                        return `Decreased by ${absChange.toFixed(1)}%`;
                                    }
                                }
                                return null;
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
                        ticks: { color: textColor }
                    }
                }
            }
        });

        // Genre Distribution Chart
        const genreCtx = document.getElementById('genreDistributionChart')?.getContext('2d');
        if (genreCtx) {
            if (genreDistributionChart && typeof genreDistributionChart.destroy === 'function') {
                genreDistributionChart.destroy();
            }
            genreDistributionChart = new Chart(genreCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [],
                        borderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: { position: 'right', labels: { color: textColor, padding: 20, usePointStyle: true } },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            initGenreFilters();
        }

        console.log('✅ Dashboard charts initialized (auto-text tooltip with trend cutoff)');
    }

    window.updateMonthlyProgressChart = function () {
        if (!window.monthlyProgressChart) {
            console.warn('⚠️ monthlyProgressChart not initialized – re-initializing...');
            if (typeof window.initCharts === 'function') {
                window.initCharts();
            }
            return;
        }

        const chart = window.monthlyProgressChart;
        if (!chart.data || !chart.data.datasets || chart.data.datasets.length < 2) {
            console.warn('⚠️ monthlyProgressChart is missing required datasets – re-initializing...');
            try { chart.destroy(); } catch (e) { }
            window.monthlyProgressChart = null;
            if (typeof window.initCharts === 'function') {
                window.initCharts();
            }
            return;
        }

        const data = calculateMonthlyProgressData();
        const currentMonth = new Date().getMonth();

        _monthlyChartData = data;
        _monthlyChartCurrentMonth = currentMonth;

        chart.data.datasets[1].data = data;

        const trendData = data.map((value, index) => {
            return index <= currentMonth ? value : null;
        });
        chart.data.datasets[0].data = trendData;

        const total = data.reduce((sum, val) => sum + val, 0);
        const span = document.getElementById('monthly-total-anime');
        if (span) span.textContent = `Total Completed: ${total}`;

        chart.update();
    };

    // ============================================
    // SECTION 11: STATISTICS CHARTS (All charts)
    // ============================================

    function initStatisticsCharts() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

        function safeGetContext(id) {
            const canvas = document.getElementById(id);
            if (!canvas) return null;
            try { return canvas.getContext('2d'); } catch (e) { return null; }
        }

        function safeDestroy(ref) {
            if (ref && typeof ref.destroy === 'function') { try { ref.destroy(); } catch (e) { } }
            return null;
        }

        // Completion Chart
        const completionCtx = safeGetContext('completionChart');
        if (completionCtx) {
            window.AniPulseCharts.completionChart = safeDestroy(window.AniPulseCharts.completionChart);
            window.AniPulseCharts.completionChart = new Chart(completionCtx, {
                type: 'bar',
                data: {
                    labels: ['2024', '2025', '2026', '2027', '2028'],
                    datasets: [{
                        label: 'Anime Completed',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: '#48bb78',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                        x: { grid: { display: false }, ticks: { color: textColor } }
                    }
                }
            });
        }

        // Score Distribution
        const scoreCtx = safeGetContext('scoreDistributionChart');
        if (scoreCtx) {
            window.AniPulseCharts.scoreChart = safeDestroy(window.AniPulseCharts.scoreChart);
            window.AniPulseCharts.scoreChart = new Chart(scoreCtx, {
                type: 'polarArea',
                data: {
                    labels: ['10', '9', '8', '7', '6', '5 or less'],
                    datasets: [{
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: ['rgba(139,92,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(59,130,246,0.8)', 'rgba(156,163,175,0.8)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: textColor } } }
                }
            });
        }

        // Status Distribution
        const statusCtx = safeGetContext('statusDistributionChart');
        if (statusCtx) {
            window.AniPulseCharts.statusChart = safeDestroy(window.AniPulseCharts.statusChart);
            window.AniPulseCharts.statusChart = new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: ['Completed', 'Watching', 'Plan to Watch', 'Dropped'],
                    datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#48bb78', '#4299e1', '#ed8936', '#f56565'], borderWidth: 0 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: textColor } } }
                }
            });
        }

        // Type Distribution
        const typeCtx = safeGetContext('typeDistributionChart');
        if (typeCtx) {
            window.AniPulseCharts.typeChart = safeDestroy(window.AniPulseCharts.typeChart);
            window.AniPulseCharts.typeChart = new Chart(typeCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{ data: [], backgroundColor: ['#6a5acd', '#70db70', '#20b2aa', '#ff7f50', '#48bb78'], borderWidth: 0 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: textColor } } }
                }
            });
        }

        // Genre Stats
        const genreStatsCtx = safeGetContext('genreStatsChart');
        if (genreStatsCtx) {
            window.AniPulseCharts.genreChart = safeDestroy(window.AniPulseCharts.genreChart);
            window.AniPulseCharts.genreChart = new Chart(genreStatsCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{ label: 'Number of Anime', data: [], backgroundColor: 'rgba(106,90,205,0.7)', borderRadius: 8 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                        y: { grid: { display: false }, ticks: { color: textColor } }
                    }
                }
            });
        }

        // Avg Score by Genre
        const avgScoreCtx = safeGetContext('avgScoreByGenreChart');
        if (avgScoreCtx) {
            window.AniPulseCharts.avgScoreChart = safeDestroy(window.AniPulseCharts.avgScoreChart);
            window.AniPulseCharts.avgScoreChart = new Chart(avgScoreCtx, {
                type: 'bar',
                data: { labels: [], datasets: [{ label: 'Average Score', data: [], backgroundColor: 'rgba(106,90,205,0.7)' }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { beginAtZero: true, max: 10, grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { ticks: { color: textColor } }
                    }
                }
            });
        }

        // Episodes over time
        const epsCtx = safeGetContext('episodesOverTimeChart');
        if (epsCtx) {
            if (episodesOverTimeChart && typeof episodesOverTimeChart.destroy === 'function') {
                episodesOverTimeChart.destroy();
            }
            episodesOverTimeChart = new Chart(epsCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Episodes Watched',
                        data: Array(12).fill(0),
                        backgroundColor: 'rgba(139,92,246,0.7)',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                        x: { grid: { display: false }, ticks: { color: textColor } }
                    }
                }
            });
        }

        // Watch time chart
        const wtCtx = safeGetContext('watchTimeByMonthChart');
        if (wtCtx) {
            if (watchTimeByMonthChart && typeof watchTimeByMonthChart.destroy === 'function') {
                watchTimeByMonthChart.destroy();
            }
            watchTimeByMonthChart = new Chart(wtCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Hours Watched',
                        data: Array(12).fill(0),
                        borderColor: '#22D3EE',
                        backgroundColor: 'rgba(34,211,238,0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                        x: { grid: { display: false }, ticks: { color: textColor } }
                    }
                }
            });
        }

        populateYearDropdowns();
        refreshAllCharts();

        console.log('✅ Statistics charts initialized');
    }

    // ============================================
    // SECTION 12: INIT FUNCTIONS
    // ============================================

    function initStatsHero() {
        updateStatsHero();
        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData' || e.key === 'userProfile' || e.key === 'user') {
                setTimeout(updateStatsHero, 200);
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateStatsHero, 300);
            }
        });
    }

    function initOverviewMetrics() {
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

    function initRatingAnalytics() {
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

    function initCompletionJourney() {
        const filterBtns = document.querySelectorAll('.journey-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentRange = this.dataset.range;
                updateCompletionJourney();
            });
        });

        setTimeout(updateCompletionJourney, 400);
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

        const themeObserver = new MutationObserver(() => {
            if (document.getElementById('statistics-page')?.classList.contains('active')) {
                setTimeout(updateCompletionJourney, 300);
            }
        });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    // ============================================
    // SECTION 13: MAIN STATISTICS PAGE INIT
    // ============================================

    function initStatisticsPage() {
        console.log('📊 Initializing Statistics Page...');

        initStatsHero();
        initOverviewMetrics();
        initPeriodStats();          // <-- NEW: Period Stats filter
        initLibraryAnalytics();
        initRatingAnalytics();
        initCompletionJourney();

        setTimeout(() => {
            if (typeof window.initStatisticsCharts === 'function') {
                window.initStatisticsCharts();
            } else {
                initStatisticsCharts();
            }
            if (typeof window.updateStatisticsTables === 'function') {
                window.updateStatisticsTables();
            } else {
                updateStatisticsTables();
            }
            if (typeof window.refreshAllCharts === 'function') {
                window.refreshAllCharts();
            } else {
                refreshAllCharts();
            }
        }, 200);

        console.log('✅ Statistics Page initialized');
    }

    // ============================================
    // SECTION 14: EXPOSE GLOBALLY
    // ============================================

    window.initStatisticsPage = initStatisticsPage;
    window.initCharts = initCharts;
    window.initStatisticsCharts = initStatisticsCharts;
    window.refreshAllCharts = refreshAllCharts;
    window.populateYearDropdowns = populateYearDropdowns;
    window.updateEpisodesChart = updateEpisodesChart;
    window.updateWatchTimeChart = updateWatchTimeChart;
    window.updateStatisticsTables = updateStatisticsTables;
    window.updateStatsHero = updateStatsHero;
    window.updateOverviewMetrics = updateOverviewMetrics;
    window.updateLibraryAnalytics = updateLibraryAnalytics;
    window.updateRatingAnalytics = updateRatingAnalytics;
    window.updateCompletionJourney = updateCompletionJourney;
    window.calculateMonthlyStats = calculateMonthlyStats;
    window.updateStatCardsWithChanges = updateStatCardsWithChanges;
    window.refreshOverviewMetrics = updateOverviewMetrics;
    window.refreshLibraryAnalytics = updateLibraryAnalytics;
    window.refreshRatingAnalytics = updateRatingAnalytics;
    window.refreshCompletionJourney = updateCompletionJourney;

    // Hook into updateAllComponents
    const originalUpdateAllComponents = window.updateAllComponents;
    if (typeof originalUpdateAllComponents === 'function') {
        window.updateAllComponents = function () {
            originalUpdateAllComponents();
            setTimeout(() => {
                updateStatsHero();
                updateOverviewMetrics();
                updatePeriodStats();
                updateLibraryAnalytics();
                updateRatingAnalytics();
                updateCompletionJourney();
                if (typeof window.refreshAllCharts === 'function') window.refreshAllCharts();
            }, 200);
        };
    }

    // ============================================
    // SECTION 15: AUTO-INIT
    // ============================================

    const statsMenuItem = document.querySelector('.menu-item[data-page="statistics"]');
    if (statsMenuItem) {
        statsMenuItem.addEventListener('click', () => {
            setTimeout(initStatisticsPage, 200);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const statsPage = document.getElementById('statistics-page');
            if (statsPage && statsPage.classList.contains('active')) {
                setTimeout(initStatisticsPage, 500);
            }
        });
    } else {
        const statsPage = document.getElementById('statistics-page');
        if (statsPage && statsPage.classList.contains('active')) {
            setTimeout(initStatisticsPage, 500);
        }
    }

    console.log('✅ Statistics Page loaded successfully!');

})();