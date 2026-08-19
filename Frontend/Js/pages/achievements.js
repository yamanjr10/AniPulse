// ============================================
// ACHIEVEMENTS – 50 Unique Milestones
// Day & Month streaks: max for unlock, current for progress
// ============================================

(function () {
    'use strict';

    const ACHIEVEMENTS = [
        // ─── Firsts ──────────────────────────────
        { id: 'first_anime', icon: 'fa-check-circle', title: '1. First Step', desc: 'Add your first anime to the list.', goal: 1 },
        { id: 'first_complete', icon: 'fa-check-circle', title: '2. First Finish', desc: 'Complete your first anime.', goal: 1 },
        { id: 'first_movie', icon: 'fa-film', title: '3. First Movie', desc: 'Complete your first movie.', goal: 1 },
        { id: 'first_10', icon: 'fa-star', title: '4. Perfect Score', desc: 'Rate an anime 10/10.', goal: 1 },

        // ─── Completion Milestones ──────────────
        { id: 'complete_5', icon: 'fa-check-circle', title: '5. Five Down', desc: 'Complete 5 anime.', goal: 5 },
        { id: 'complete_15', icon: 'fa-check-circle', title: '6. Fifteen Club', desc: 'Complete 15 anime.', goal: 15 },
        { id: 'complete_30', icon: 'fa-check-circle', title: '7. Thirty Strong', desc: 'Complete 30 anime.', goal: 30 },
        { id: 'complete_50', icon: 'fa-trophy', title: '8. Half-Century', desc: 'Complete 50 anime.', goal: 50 },
        { id: 'complete_100', icon: 'fa-trophy', title: '9. Century Mark', desc: 'Complete 100 anime.', goal: 100 },
        { id: 'complete_250', icon: 'fa-crown', title: '10. Quarter Grand', desc: 'Complete 250 anime.', goal: 250 },
        { id: 'complete_500', icon: 'fa-crown', title: '11. Grand Master', desc: 'Complete 500 anime.', goal: 500 },
        { id: 'complete_1000', icon: 'fa-crown', title: '12. Legendary', desc: 'Complete 1000 anime.', goal: 1000 },

        // ─── Episode Milestones ──────────────────
        { id: 'ep_100', icon: 'fa-fire', title: '13. 100 Episodes', desc: 'Watch 100 episodes.', goal: 100 },
        { id: 'ep_500', icon: 'fa-fire', title: '14. 500 Episodes', desc: 'Watch 500 episodes.', goal: 500 },
        { id: 'ep_1000', icon: 'fa-fire', title: '15. 1K Episodes', desc: 'Watch 1000 episodes.', goal: 1000 },
        { id: 'ep_5000', icon: 'fa-fire', title: '16. 5K Episodes', desc: 'Watch 5000 episodes.', goal: 5000 },
        { id: 'ep_10000', icon: 'fa-fire', title: '17. 10K Episodes', desc: 'Watch 10000 episodes.', goal: 10000 },

        // ─── Hours Watched ──────────────────────
        { id: 'hour_24', icon: 'fa-clock', title: '18. Day Marathon', desc: 'Watch 24 hours in total.', goal: 24 },
        { id: 'hour_100', icon: 'fa-clock', title: '19. 100 Hours', desc: 'Watch 100 hours.', goal: 100 },
        { id: 'hour_500', icon: 'fa-clock', title: '20. 500 Hours', desc: 'Watch 500 hours.', goal: 500 },
        { id: 'hour_1000', icon: 'fa-clock', title: '21. 1000 Hours', desc: 'Watch 1000 hours.', goal: 1000 },
        { id: 'hour_5000', icon: 'fa-clock', title: '22. 5000 Hours', desc: 'Watch 5000 hours.', goal: 5000 },

        // ─── Rating Activity ─────────────────────
        { id: 'rate_10', icon: 'fa-star-half-alt', title: '23. 10 Ratings', desc: 'Rate 10 different anime.', goal: 10 },
        { id: 'rate_50', icon: 'fa-star-half-alt', title: '24. 50 Ratings', desc: 'Rate 50 anime.', goal: 50 },
        { id: 'rate_100', icon: 'fa-star-half-alt', title: '25. 100 Ratings', desc: 'Rate 100 anime.', goal: 100 },
        { id: 'avg_high', icon: 'fa-star', title: '26. High Standards', desc: 'Maintain average rating ≥ 8.0 (min 10 ratings).', goal: 1 },

        // ─── Genres ──────────────────────────────
        { id: 'genre_3', icon: 'fa-paint-brush', title: '27. 3 Flavors', desc: 'Watch anime from 3 distinct genres.', goal: 3 },
        { id: 'genre_6', icon: 'fa-paint-brush', title: '28. 6 Flavors', desc: 'Watch from 6 distinct genres.', goal: 6 },
        { id: 'genre_10', icon: 'fa-paint-brush', title: '29. 10 Flavors', desc: 'Watch from 10 distinct genres.', goal: 10 },
        { id: 'genre_15', icon: 'fa-paint-brush', title: '30. 15 Flavors', desc: 'Watch from 15 distinct genres.', goal: 15 },
        { id: 'genre_20', icon: 'fa-paint-brush', title: '31. 20 Flavors', desc: 'Watch from 20 distinct genres.', goal: 20 },

        // ─── Formats ─────────────────────────────
        { id: 'movie_10', icon: 'fa-film', title: '32. Movie Buff', desc: 'Complete 10 movies.', goal: 10 },
        { id: 'tv_10', icon: 'fa-tv', title: '33. TV Addict', desc: 'Complete 10 TV series.', goal: 10 },
        { id: 'ova_5', icon: 'fa-play-circle', title: '34. OVA Collector', desc: 'Complete 5 OVAs/ONAs.', goal: 5 },

        // ─── Streaks ─────────────────────────────
        { id: 'streak_week', icon: 'fa-calendar-week', title: '35. 7-Day Streak', desc: 'Complete at least 1 anime each day for 7 consecutive days (any time).', goal: 7 },
        { id: 'streak_month', icon: 'fa-calendar-alt', title: '36. 30-Day Streak', desc: 'Complete at least 1 anime each day for 30 consecutive days (any time).', goal: 30 },
        { id: 'streak_3m', icon: 'fa-calendar-check', title: '37. 3-Month Streak', desc: 'Complete anime in 3 consecutive months.', goal: 3 },
        { id: 'streak_6m', icon: 'fa-calendar-check', title: '38. 6-Month Streak', desc: 'Complete anime in 6 consecutive months.', goal: 6 },
        { id: 'streak_12m', icon: 'fa-calendar-check', title: '39. Year-Long Streak', desc: 'Complete anime in 12 consecutive months.', goal: 12 },

        // ─── List Growth ─────────────────────────
        { id: 'list_10', icon: 'fa-list', title: '40. 10 in List', desc: 'Have 10 anime in your list (any status).', goal: 10 },
        { id: 'list_25', icon: 'fa-list', title: '41. 25 in List', desc: 'Have 25 anime in your list.', goal: 25 },
        { id: 'list_50', icon: 'fa-list', title: '42. 50 in List', desc: 'Have 50 anime in your list.', goal: 50 },
        { id: 'list_100', icon: 'fa-list', title: '43. 100 in List', desc: 'Have 100 anime in your list.', goal: 100 },
        { id: 'list_250', icon: 'fa-list', title: '44. 250 in List', desc: 'Have 250 anime in your list.', goal: 250 },

        // ─── Special ─────────────────────────────
        { id: 'decade_3', icon: 'fa-calendar-plus', title: '45. Time Traveler', desc: 'Watch anime from 3 different decades.', goal: 3 },
        { id: 'decade_5', icon: 'fa-calendar-plus', title: '46. Decade Hopper', desc: 'Watch anime from 5 different decades.', goal: 5 },
        { id: 'score_9plus', icon: 'fa-thumbs-up', title: '47. Fan Favorite', desc: 'Give a score of 9+ to 10 anime.', goal: 10 },
        { id: 'watching_5', icon: 'fa-eye', title: '48. Multi-Tasker', desc: 'Have 5 anime in your "Watching" list at once.', goal: 5 },
        { id: 'plan_10', icon: 'fa-clock', title: '49. Planner', desc: 'Have 10 anime in "Plan to Watch".', goal: 10 },
        { id: 'dropped_5', icon: 'fa-trash', title: '50. Dropper', desc: 'Drop 5 anime (it’s okay to let go).', goal: 5 },
    ];

    window.ACHIEVEMENTS_DEFINITIONS = ACHIEVEMENTS;

    // ---- Helpers ----

    function totalWatchHours(data) {
        return data.reduce((sum, a) => sum + ((a.episodes || 0) * (a.duration || 20)) / 60, 0);
    }

    function decadesWatched(data) {
        const decades = new Set();
        data.forEach(a => { if (a.startYear) decades.add(Math.floor(a.startYear / 10) * 10); });
        return Array.from(decades);
    }

    // ---- Max consecutive months (any time) ----
    function getMaxMonthStreak(data) {
        const monthStrings = [...new Set(
            data.filter(a => a.userStatus === 'Completed' && (a.actualFinishDate || a.finishDate))
                .map(a => {
                    const d = new Date(a.actualFinishDate || a.finishDate);
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    return `${d.getFullYear()}-${month}`;
                })
        )];
        const months = monthStrings.map(s => {
            const [y, m] = s.split('-').map(Number);
            return { year: y, month: m };
        }).sort((a, b) => a.year - b.year || a.month - b.month);
        if (months.length === 0) return 0;
        let maxStreak = 1, streak = 1;
        for (let i = 1; i < months.length; i++) {
            const prev = months[i - 1], curr = months[i];
            const diff = (curr.year - prev.year) * 12 + (curr.month - prev.month);
            if (diff === 1) { streak++; } else { streak = 1; }
            maxStreak = Math.max(maxStreak, streak);
        }
        return maxStreak;
    }

    // ---- Current consecutive months (from this month backwards) ----
    function getCurrentMonthStreak(data) {
        const monthSet = new Set(
            data.filter(a => a.userStatus === 'Completed' && (a.actualFinishDate || a.finishDate))
                .map(a => {
                    const d = new Date(a.actualFinishDate || a.finishDate);
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    return `${d.getFullYear()}-${month}`;
                })
        );
        if (monthSet.size === 0) return 0;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1-12

        let streak = 0;
        let year = currentYear;
        let month = currentMonth;
        while (true) {
            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (monthSet.has(key)) {
                streak++;
                // Move to previous month
                month--;
                if (month === 0) { month = 12; year--; }
            } else {
                break;
            }
        }
        return streak;
    }

    // ---- Max consecutive days (any time) ----
    function getMaxDayStreak(data) {
        const dateStrings = data
            .filter(a => a.userStatus === 'Completed')
            .map(a => a.actualFinishDate || a.finishDate)
            .filter(d => d && d.length >= 10);

        if (dateStrings.length === 0) return 0;

        const dates = dateStrings
            .map(d => {
                const date = new Date(d);
                if (isNaN(date.getTime())) return null;
                date.setHours(0, 0, 0, 0);
                return date;
            })
            .filter(d => d !== null);

        if (dates.length === 0) return 0;

        const uniqueTimestamps = new Set(dates.map(d => d.getTime()));
        const uniqueDates = Array.from(uniqueTimestamps)
            .map(ts => new Date(ts))
            .sort((a, b) => a - b);

        let maxStreak = 0;
        let currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const diffDays = (uniqueDates[i] - uniqueDates[i - 1]) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
                currentStreak++;
                if (currentStreak > maxStreak) maxStreak = currentStreak;
            } else {
                currentStreak = 1;
            }
        }
        if (uniqueDates.length > 0 && maxStreak === 0) maxStreak = 1;
        return maxStreak;
    }

    // ---- Current consecutive days (from today backwards) ----
    function getCurrentDayStreak(data) {
        const dateStrings = data
            .filter(a => a.userStatus === 'Completed')
            .map(a => a.actualFinishDate || a.finishDate)
            .filter(d => d && d.length >= 10);

        if (dateStrings.length === 0) return 0;

        const dates = dateStrings
            .map(d => {
                const date = new Date(d);
                if (isNaN(date.getTime())) return null;
                date.setHours(0, 0, 0, 0);
                return date;
            })
            .filter(d => d !== null);

        if (dates.length === 0) return 0;

        const uniqueTimestamps = new Set(dates.map(d => d.getTime()));
        const uniqueDates = Array.from(uniqueTimestamps)
            .map(ts => new Date(ts))
            .sort((a, b) => a - b);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let currentDate = new Date(today);
        while (true) {
            const hasCompletion = uniqueDates.some(d => d.getTime() === currentDate.getTime());
            if (hasCompletion) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    // ---- Progress functions map ----
    function getProgressFunctions(data) {
        const completed = () => data.filter(a => a.userStatus === 'Completed').length;
        const totalEps = () => data.reduce((s, a) => s + (a.episodes || 0), 0);
        const totalHours = () => totalWatchHours(data);
        const totalRated = () => data.filter(a => a.score > 0).length;
        const uniqueGenres = () => new Set(data.flatMap(a => a.genres || [])).size;
        const listSize = () => data.length;

        const avgRatingHigh = () => {
            const rated = data.filter(a => a.score && a.score > 0);
            if (rated.length < 10) return 0;
            const avg = rated.reduce((s, a) => s + a.score, 0) / rated.length;
            return avg >= 8.0 ? 1 : 0;
        };

        const movies = () => data.filter(a => a.type === 'Movie' && a.userStatus === 'Completed').length;
        const tv = () => data.filter(a => a.type === 'TV' && a.userStatus === 'Completed').length;
        const ova = () => data.filter(a => (a.type === 'OVA' || a.type === 'ONA') && a.userStatus === 'Completed').length;

        const decadeCount = () => decadesWatched(data).length;
        const planCount = () => data.filter(a => a.userStatus === 'Plan to Watch').length;
        const watchingCount = () => data.filter(a => a.userStatus === 'Watching').length;
        const droppedCount = () => data.filter(a => a.userStatus === 'Dropped').length;
        const score9plus = () => data.filter(a => a.score >= 9).length;

        // We'll handle streaks directly in update loop, so not needed here.

        return {
            first_anime: listSize,
            first_complete: completed,
            first_movie: movies,
            first_10: () => data.filter(a => a.score === 10).length,
            complete_5: completed,
            complete_15: completed,
            complete_30: completed,
            complete_50: completed,
            complete_100: completed,
            complete_250: completed,
            complete_500: completed,
            complete_1000: completed,
            ep_100: totalEps,
            ep_500: totalEps,
            ep_1000: totalEps,
            ep_5000: totalEps,
            ep_10000: totalEps,
            hour_24: totalHours,
            hour_100: totalHours,
            hour_500: totalHours,
            hour_1000: totalHours,
            hour_5000: totalHours,
            rate_10: totalRated,
            rate_50: totalRated,
            rate_100: totalRated,
            avg_high: avgRatingHigh,
            genre_3: uniqueGenres,
            genre_6: uniqueGenres,
            genre_10: uniqueGenres,
            genre_15: uniqueGenres,
            genre_20: uniqueGenres,
            movie_10: movies,
            tv_10: tv,
            ova_5: ova,
            list_10: listSize,
            list_25: listSize,
            list_50: listSize,
            list_100: listSize,
            list_250: listSize,
            decade_3: decadeCount,
            decade_5: decadeCount,
            score_9plus: score9plus,
            watching_5: watchingCount,
            plan_10: planCount,
            dropped_5: droppedCount,
        };
    }

    // ---- Update achievements ----
    window.updateAchievements = function () {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const data = window.animeData || [];
        const progressFns = getProgressFunctions(data);

        // Pre‑compute streak values
        const maxDayStreak = getMaxDayStreak(data);
        const currentDayStreak = getCurrentDayStreak(data);
        const maxMonthStreak = getMaxMonthStreak(data);
        const currentMonthStreak = getCurrentMonthStreak(data);

        let unlockedIds = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
        if (!Array.isArray(unlockedIds)) unlockedIds = [];
        if (unlockedIds.length > 0 && typeof unlockedIds[0] === 'number') {
            const newIds = unlockedIds.map(idx => ACHIEVEMENTS[idx]?.id).filter(Boolean);
            unlockedIds = newIds;
            localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedIds));
        }

        let completed = 0, inProgress = 0;
        const newUnlocks = [];

        ACHIEVEMENTS.forEach(ach => {
            let current, goal, percent, done;

            // ─── Special handling for streak achievements ───
            if (ach.id === 'streak_week' || ach.id === 'streak_month') {
                goal = ach.goal;
                done = maxDayStreak >= goal;
                const valueForProgress = done ? goal : Math.min(currentDayStreak, goal);
                percent = Math.min((valueForProgress / goal) * 100, 100);
                current = valueForProgress;
            } else if (ach.id === 'streak_3m' || ach.id === 'streak_6m' || ach.id === 'streak_12m') {
                goal = ach.goal;
                done = maxMonthStreak >= goal;
                const valueForProgress = done ? goal : Math.min(currentMonthStreak, goal);
                percent = Math.min((valueForProgress / goal) * 100, 100);
                current = valueForProgress;
            } else {
                current = progressFns[ach.id] ? progressFns[ach.id]() : 0;
                goal = ach.goal;
                percent = Math.min((current / goal) * 100, 100);
                done = current >= goal;
            }

            if (done) {
                if (!unlockedIds.includes(ach.id)) {
                    unlockedIds.push(ach.id);
                    newUnlocks.push(ach.title);
                }
                completed++;
            } else if (current > 0) {
                inProgress++;
            }

            const statusClass = done ? 'status-completed' : (current > 0 ? 'status-progress' : 'status-locked');
            const statusText = done ? 'Completed' : (current > 0 ? `In Progress (${Math.floor(percent)}%)` : 'Locked');

            const card = document.createElement('div');
            card.className = `achievement-card fade-in ${done ? 'unlocked' : ''}`;
            card.innerHTML = `
                <div class="achievement-icon"><i class="fas ${ach.icon}"></i></div>
                <div class="achievement-title">${ach.title}</div>
                <div class="achievement-desc">${ach.desc}</div>
                <div class="achievement-status ${statusClass}">${statusText}</div>
                <div class="achievement-progress-bar">
                    <div class="achievement-progress" style="width:${percent}%;"></div>
                </div>
            `;
            grid.appendChild(card);
        });

        document.getElementById('totalAchievements').textContent = ACHIEVEMENTS.length;
        document.getElementById('completedAchievements').textContent = completed;
        document.getElementById('inProgressAchievements').textContent = inProgress;

        if (newUnlocks.length > 0) {
            newUnlocks.forEach(title => {
                if (typeof showToast === 'function') showToast(`Achievement Unlocked: ${title}! 🏆`, 'success');
            });
            localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedIds));
            if (window.dualStorage) {
                window.dualStorage.syncToCloud();
            }
        }
    };

    function initAchievements() {
        window.updateAchievements();
        console.log('✅ Achievements initialized – day & month streaks: max for unlock, current for progress');
    }

    window.initAchievements = initAchievements;
})();