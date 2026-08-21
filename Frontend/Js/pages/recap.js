// ============================================
// 12-SLIDE RECAP SYSTEM
// ============================================

(function () {
    'use strict';

    const RECAP_ACTIVE = true;
    const RECAP_WINDOW_DAYS = 7;
    const TEST_MODE = false;
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    let recapSlides = [];
    let currentSlide = 0;

    // --- Date helpers ---
    function getCompletionTime(anime) {
        if (anime.finishDate) {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (regex.test(anime.finishDate)) {
                const [year, month, day] = anime.finishDate.split('-').map(Number);
                return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).getTime();
            }
        }
        if (anime.completedTimestamp) return anime.completedTimestamp;
        if (anime.updatedAt) {
            const date = new Date(anime.updatedAt);
            date.setHours(23, 59, 59, 999);
            return date.getTime();
        }
        return null;
    }

    function isRecapWindowOpen() {
        if (!RECAP_ACTIVE) return false;
        if (TEST_MODE) {
            const d = new Date();
            return d.getMonth() === 7 && d.getDate() <= 30;
        }
        const d = new Date();
        return d.getDate() <= RECAP_WINDOW_DAYS;
    }

    function getPreviousMonthForRecap() {
        const now = new Date();
        let month = now.getMonth() - 1;
        let year = now.getFullYear();
        if (month < 0) { month = 11; year--; }
        return { month, year };
    }

    function getPreviousYearForRecap() {
        return new Date().getFullYear() - 1;
    }

    // --- Build recap data ---
    function buildComprehensiveRecap(list, type, periodInfo = {}) {
        const isYearly = type === 'Yearly';
        const monthName = !isYearly && typeof periodInfo.month === 'number' ? MONTH_NAMES[periodInfo.month] : null;

        if (!list.length) {
            return {
                totalAnime: 0, totalHours: 0, totalEpisodes: 0, avgEpisodesPerDay: 0,
                avgScore: 0, topGenre: '—', secondGenre: '—', thirdGenre: '—',
                topAnime: null, completionMonth: null, animeByScore: [],
                avgDuration: 0, streakDays: 0, monthName, year: periodInfo.year, type
            };
        }

        const totalEpisodes = list.reduce((s, a) => s + (a.episodes || 0), 0);
        const totalMinutes = list.reduce((s, a) => s + (a.episodes * (a.duration || 0)), 0);
        const totalHours = totalMinutes / 60;

        const scored = list.filter(a => a.score && a.score > 0);
        const avgScore = scored.length ? (scored.reduce((s, a) => s + a.score, 0) / scored.length).toFixed(1) : 0;

        const genres = {};
        list.forEach(a => (a.genres || []).forEach(g => { genres[g] = (genres[g] || 0) + 1; }));
        const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]);

        const animeByScore = [...list].filter(a => a.score && a.score > 0).sort((a, b) => (b.score || 0) - (a.score || 0));

        const daysInPeriod = isYearly ? 365 : new Date(periodInfo.year, periodInfo.month + 1, 0).getDate();
        const avgEpisodesPerDay = (totalEpisodes / daysInPeriod).toFixed(1);
        const avgDuration = (list.reduce((s, a) => s + (a.duration || 0), 0) / list.length).toFixed(0);

        let completionMonth = null;
        if (isYearly) {
            const months = {};
            list.forEach(a => {
                const time = getCompletionTime(a);
                if (time) {
                    const m = new Date(time).getMonth();
                    months[m] = (months[m] || 0) + 1;
                }
            });
            const busiest = Object.entries(months).sort((a, b) => b[1] - a[1])[0];
            if (busiest) completionMonth = MONTH_NAMES[parseInt(busiest[0])];
        }

        const completionDays = new Set();
        list.forEach(a => {
            const time = getCompletionTime(a);
            if (time) completionDays.add(new Date(time).toISOString().split('T')[0]);
        });

        return {
            totalAnime: list.length,
            totalHours: totalHours.toFixed(1),
            totalEpisodes,
            avgEpisodesPerDay,
            avgScore,
            topGenre: topGenres[0]?.[0] || '—',
            secondGenre: topGenres[1]?.[0] || '—',
            thirdGenre: topGenres[2]?.[0] || '—',
            topAnime: animeByScore[0] || null,
            secondAnime: animeByScore[1] || null,
            thirdAnime: animeByScore[2] || null,
            completionMonth,
            animeByScore: animeByScore.slice(0, 3),
            avgDuration,
            streakDays: completionDays.size,
            monthName,
            year: periodInfo.year,
            type
        };
    }

    function getMonthlyRecap(year, month) {
        const start = new Date(year, month, 1).getTime();
        const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();
        const data = window.animeData || [];
        const completed = data.filter(a => {
            if (a.userStatus !== 'Completed') return false;
            const time = getCompletionTime(a);
            return time && time >= start && time <= end;
        });
        return buildComprehensiveRecap(completed, 'Monthly', { month, year });
    }

    function getYearlyRecap(year) {
        const start = new Date(year, 0, 1).getTime();
        const end = new Date(year, 11, 31, 23, 59, 59).getTime();
        const data = window.animeData || [];
        const completed = data.filter(a => {
            if (a.userStatus !== 'Completed') return false;
            const time = getCompletionTime(a);
            return time && time >= start && time <= end;
        });
        return buildComprehensiveRecap(completed, 'Yearly', { year });
    }

    // --- Slides generation ---
    function generateTwelveSlides(data, type, periodInfo) {
        const periodText = periodInfo.month ? `${data.monthName} ${data.year}` : `${data.year}`;
        const isYearly = type === 'Yearly';

        if (data.totalAnime === 0) {
            return [
                `<div class="slide-icon"><i class="fas fa-calendar-times"></i></div><h1>No anime completed</h1><p class="period">${periodText}</p><p class="hint">${isYearly ? 'This year' : 'This month'} was quiet...</p>`,
                `<div class="slide-icon"><i class="fas fa-search"></i></div><h1>Explore New Titles</h1><p class="subtitle">Discover hidden gems</p>`,
                `<div class="slide-icon"><i class="fas fa-bullseye"></i></div><h1>Set Watching Goals</h1><p class="subtitle">Plan for next ${isYearly ? 'year' : 'month'}</p>`,
                `<div class="slide-icon"><i class="fas fa-heart"></i></div><h1>Find Your Genre</h1><p class="subtitle">What do you enjoy most?</p>`,
                `<div class="slide-icon"><i class="fas fa-clock"></i></div><h1>Manage Your Time</h1><p class="subtitle">Balance watching schedule</p>`,
                `<div class="slide-icon"><i class="fas fa-users"></i></div><h1>Join Communities</h1><p class="subtitle">Share with other fans</p>`,
                `<div class="slide-icon"><i class="fas fa-star"></i></div><h1>Rate As You Watch</h1><p class="subtitle">Track your favorites</p>`,
                `<div class="slide-icon"><i class="fas fa-tags"></i></div><h1>Organize Your List</h1><p class="subtitle">Keep everything tidy</p>`,
                `<div class="slide-icon"><i class="fas fa-calendar-check"></i></div><h1>Mark Completion Dates</h1><p class="subtitle">For accurate recaps</p>`,
                `<div class="slide-icon"><i class="fas fa-chart-bar"></i></div><h1>Watch Progress Grow</h1><p class="subtitle">See your journey unfold</p>`,
                `<div class="slide-icon"><i class="fas fa-trophy"></i></div><h1>Achievements Await</h1><p class="subtitle">Unlock new milestones</p>`,
                `<div class="slide-icon"><i class="fas fa-flag-checkered"></i></div><h1>Ready for the Next Chapter</h1><p class="subtitle">${periodText} Recap Complete!</p><p class="hint">See you ${isYearly ? 'next year' : 'next month'}!</p>`
            ];
        }

        return [
            // Slide 1
            `<div class="slide-icon"><i class="fas fa-calendar-alt"></i></div><h1>${isYearly ? data.year : `${data.monthName} ${data.year}`}</h1><p class="subtitle">${isYearly ? `${data.year} Anime Recap` : `${data.monthName} Anime Recap`}</p><p class="hint">Let's look back at your journey</p><div class="slide-counter">1/12</div>`,
            // Slide 2
            `<div class="slide-icon"><i class="fas fa-tv"></i></div><h1>${data.totalAnime}</h1><p class="subtitle">Anime Completed</p><p class="hint">${isYearly ? 'Over 12 months' : 'In one month'}</p><div class="stat-badge"><span><i class="fas fa-film"></i> ${data.totalEpisodes} episodes</span></div><div class="slide-counter">2/12</div>`,
            // Slide 3
            `<div class="slide-icon"><i class="fas fa-clock"></i></div><h1>${data.totalHours}</h1><p class="subtitle">Hours Watched</p><p class="hint">That's ${Math.floor(data.totalHours / 24)} days!</p><div class="stat-badge"><span><i class="fas fa-calendar-day"></i> ${data.avgEpisodesPerDay} episodes/day</span></div><div class="slide-counter">3/12</div>`,
            // Slide 4
            `<div class="slide-icon"><i class="fas fa-star"></i></div><h1>${data.avgScore}</h1><p class="subtitle">Average Score</p><p class="hint">${data.avgScore >= 8 ? 'Great taste!' : data.avgScore >= 7 ? 'Solid picks!' : "You're critical!"}</p><div class="rating-meter"><div class="meter-fill" style="width: ${(data.avgScore / 10) * 100}%"></div></div><div class="slide-counter">4/12</div>`,
            // Slide 5
            `<div class="slide-icon"><i class="fas fa-tags"></i></div><h1>${data.topGenre}</h1><p class="subtitle">Favorite Genre</p><p class="hint">Your most watched category</p><div class="genre-list"><span class="genre-badge primary">${data.topGenre}</span>${data.secondGenre !== '—' ? `<span class="genre-badge secondary">${data.secondGenre}</span>` : ''}${data.thirdGenre !== '—' ? `<span class="genre-badge tertiary">${data.thirdGenre}</span>` : ''}</div><div class="slide-counter">5/12</div>`,
            // Slide 6
            `<div class="slide-icon"><i class="fas fa-crown"></i></div><h1>${data.topAnime?.title || 'None'}</h1><p class="subtitle">Top Rated Anime</p>${data.topAnime ? `<p class="score"><i class="fas fa-star"></i> ${data.topAnime.score}</p><p class="hint">Your highest rated</p>` : '<p class="hint">Rate your anime!</p>'}<div class="slide-counter">6/12</div>`,
            // Slide 7
            `<div class="slide-icon"><i class="fas fa-chart-line"></i></div><h1>${data.streakDays}</h1><p class="subtitle">Active Watching Days</p><p class="hint">${isYearly ? 'Out of 365 days' : 'Out of 30 days on average'}</p><div class="streak-bar"><div class="streak-fill" style="width: ${isYearly ? (data.streakDays / 365) * 100 : (data.streakDays / 30) * 100}%"></div></div>${isYearly && data.completionMonth ? `<p class="hint">Busiest month: ${data.completionMonth}</p>` : ''}<div class="slide-counter">7/12</div>`,
            // Slide 8
            `<div class="slide-icon"><i class="fas fa-running"></i></div><h1>${data.avgDuration}</h1><p class="subtitle">Average Episode Length</p><p class="hint">${data.avgDuration >= 20 ? 'Standard TV format' : 'Shorts & movies'}</p><div class="stat-badge"><span><i class="fas fa-hourglass-half"></i> ${data.totalEpisodes} total episodes</span></div><div class="slide-counter">8/12</div>`,
            // Slide 9
            `<div class="slide-icon"><i class="fas fa-medal"></i></div><h1>${data.secondAnime?.title || 'None'}</h1><p class="subtitle">Second Highest Rated</p>${data.secondAnime ? `<p class="score"><i class="fas fa-star"></i> ${data.secondAnime.score}</p>` : '<p class="hint">Need more ratings</p>'}<div class="slide-counter">9/12</div>`,
            // Slide 10
            `<div class="slide-icon"><i class="fas fa-calendar-check"></i></div><h1>${Math.round((data.streakDays / (isYearly ? 365 : 30)) * 100)}%</h1><p class="subtitle">Consistency Rate</p><p class="hint">Days with anime watching</p><div class="slide-counter">10/12</div>`,
            // Slide 11
            `<div class="slide-icon"><i class="fas fa-award"></i></div><h1>${data.thirdAnime?.title || 'None'}</h1><p class="subtitle">Third Highest Rated</p>${data.thirdAnime ? `<p class="score"><i class="fas fa-star"></i> ${data.thirdAnime.score}</p><p class="hint">Completing the podium!</p>` : '<p class="hint">Keep watching and rating</p>'}<div class="slide-counter">11/12</div>`,
            // Slide 12
            `<div class="slide-icon"><i class="fas fa-flag-checkered"></i></div><h1>Recap Complete!</h1><p class="subtitle">${periodText}</p><div class="recap-summary"><div class="summary-item"><i class="fas fa-tv"></i><span>${data.totalAnime} anime</span></div><div class="summary-item"><i class="fas fa-clock"></i><span>${data.totalHours} hours</span></div><div class="summary-item"><i class="fas fa-star"></i><span>${data.avgScore} avg score</span></div><div class="summary-item"><i class="fas fa-tags"></i><span>${data.topGenre}</span></div></div><p class="hint">See you ${isYearly ? 'next year' : 'next month'} for another recap!</p><div class="slide-counter">12/12</div>`
        ];
    }

    function renderSlide() {
        const slides = document.querySelectorAll('.recap-slide');
        slides.forEach(s => s.classList.remove('active'));
        const slide = document.getElementById(`slide-${currentSlide + 1}`);
        if (!slide) return;
        slide.innerHTML = recapSlides[currentSlide];
        slide.classList.add('active');
        updateProgressIndicator();
    }

    function updateProgressIndicator() {
        const progress = document.querySelector('.recap-progress');
        if (progress) {
            const percent = ((currentSlide + 1) / recapSlides.length) * 100;
            progress.style.width = `${percent}%`;
        }
        const counter = document.querySelector('.slide-counter-global');
        if (counter) counter.textContent = `${currentSlide + 1}/${recapSlides.length}`;
    }

    function openRecap(type, data, periodInfo = {}) {
        const modal = document.getElementById('recap-modal');
        if (!modal) {
            console.error('Recap modal not found!');
            return;
        }
        modal.classList.remove('hidden');

        const modalTitle = document.querySelector('.modal-title');
        if (modalTitle) {
            const periodText = periodInfo.month ? `${data.monthName} ${data.year}` : `${data.year}`;
            modalTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${type} Recap - ${periodText}`;
        }

        recapSlides = generateTwelveSlides(data, type, periodInfo);
        currentSlide = 0;
        renderSlide();
    }

    function openRecapManually() {
        if (!isRecapWindowOpen()) {
            if (typeof showToast === 'function') {
                showToast(`Recaps available 1-${RECAP_WINDOW_DAYS} of each month`, 'info');
            }
            return;
        }

        const { month, year } = getPreviousMonthForRecap();
        const monthlyData = getMonthlyRecap(year, month);
        if (monthlyData.totalAnime > 0) {
            openRecap('Monthly', monthlyData, { month, year });
            return;
        }

        const prevYear = getPreviousYearForRecap();
        const yearlyData = getYearlyRecap(prevYear);
        if (yearlyData.totalAnime > 0) {
            openRecap('Yearly', yearlyData, { year: prevYear });
            return;
        }

        if (typeof showToast === 'function') {
            showToast('No completed anime found for recap periods', 'info');
        }
    }

    // --- Auto popups ---
    function setupAutoPopups() {
        const now = new Date();

        // Yearly recap (2025)
        const yearlyYear = 2025;
        const yearlyKey = `recap-yearly-auto-${yearlyYear}`;
        if (!localStorage.getItem(yearlyKey)) {
            const data = getYearlyRecap(yearlyYear);
            if (data.totalAnime > 0) {
                setTimeout(() => {
                    if (typeof showToast === 'function') {
                        showToast(`Your ${yearlyYear} Yearly Recap is ready!`, 'success');
                    }
                    // Show a small notification with action
                    const toast = document.querySelector('.toast-container');
                    if (toast) {
                        const msg = document.createElement('div');
                        msg.className = 'toast success';
                        msg.innerHTML = `
                            <i class="fas fa-trophy"></i>
                            <span>Your ${yearlyYear} Yearly Recap is ready!</span>
                            <button onclick="window.openRecap('Yearly', window.getYearlyRecap(${yearlyYear}), {year: ${yearlyYear}}); this.parentElement.remove();">View</button>
                        `;
                        toast.appendChild(msg);
                        setTimeout(() => msg.remove(), 8000);
                    }
                    localStorage.setItem(yearlyKey, 'true');
                }, 1000);
            }
        }

        // Monthly recap
        const { month: prevMonth, year: mYear } = getPreviousMonthForRecap();
        const monthlyKey = `recap-monthly-auto-${mYear}-${prevMonth}`;
        if (!localStorage.getItem(monthlyKey)) {
            const data = getMonthlyRecap(mYear, prevMonth);
            if (data.totalAnime > 0) {
                setTimeout(() => {
                    if (typeof showToast === 'function') {
                        showToast(`Your ${data.monthName} Recap is ready!`, 'info');
                    }
                    const toast = document.querySelector('.toast-container');
                    if (toast) {
                        const msg = document.createElement('div');
                        msg.className = 'toast info';
                        msg.innerHTML = `
                            <i class="fas fa-chart-bar"></i>
                            <span>Your ${data.monthName} Recap is ready!</span>
                            <button onclick="window.openRecap('Monthly', window.getMonthlyRecap(${mYear}, ${prevMonth}), {month: ${prevMonth}, year: ${mYear}}); this.parentElement.remove();">View</button>
                        `;
                        toast.appendChild(msg);
                        setTimeout(() => msg.remove(), 8000);
                    }
                    localStorage.setItem(monthlyKey, 'true');
                }, 2500);
            }
        }
    }

    // --- Expose ---
    window.isRecapWindowOpen = isRecapWindowOpen;
    window.getPreviousMonthForRecap = getPreviousMonthForRecap;
    window.getPreviousYearForRecap = getPreviousYearForRecap;
    window.getMonthlyRecap = getMonthlyRecap;
    window.getYearlyRecap = getYearlyRecap;
    window.openRecap = openRecap;
    window.openRecapManually = openRecapManually;

    // --- Init ---
    function initRecapSystem() {
        // Modal controls
        document.getElementById('next-slide')?.addEventListener('click', () => {
            if (currentSlide < recapSlides.length - 1) { currentSlide++; renderSlide(); }
        });
        document.getElementById('prev-slide')?.addEventListener('click', () => {
            if (currentSlide > 0) { currentSlide--; renderSlide(); }
        });
        document.querySelector('.recap-close')?.addEventListener('click', () => {
            document.getElementById('recap-modal').classList.add('hidden');
        });

        // Settings button
        document.getElementById('openRecapFromSettings')?.addEventListener('click', openRecapManually);

        // Keyboard
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('recap-modal');
            if (!modal || modal.classList.contains('hidden')) return;
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault(); document.getElementById('next-slide')?.click();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault(); document.getElementById('prev-slide')?.click();
            } else if (e.key === 'Escape') {
                e.preventDefault(); document.querySelector('.recap-close')?.click();
            }
        });

        if (isRecapWindowOpen()) {
            setupAutoPopups();
        }

        console.log('✅ Recap system initialized');
    }

    window.initRecapSystem = initRecapSystem;
})();