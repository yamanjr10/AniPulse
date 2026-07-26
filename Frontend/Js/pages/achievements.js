// ============================================
// ACHIEVEMENTS PAGE – Grid with progress
// ============================================

(function () {
    'use strict';

    // --- Helpers ---
    function totalWatchHours(data) {
        return data.reduce((sum, a) => sum + ((a.episodes || 0) * (a.duration || 20)) / 60, 0);
    }

    function countConsecutiveMonths(data) {
        const monthStrings = [...new Set(
            data.filter(a => a.userStatus === 'Completed' && a.finishDate)
                .map(a => {
                    const d = new Date(a.finishDate);
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

    function getCompletedThisMonth(data) {
        const now = new Date();
        return data.filter(a => {
            if (a.userStatus !== 'Completed' || !a.finishDate) return false;
            const d = new Date(a.finishDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
    }

    function decadesWatched(data) {
        const decades = new Set();
        data.forEach(a => { if (a.startYear) decades.add(Math.floor(a.startYear / 10) * 10); });
        return Array.from(decades);
    }

    // --- Update achievements ---
    window.updateAchievements = function () {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const data = window.animeData || [];

        const achievements = [
            { icon: "fa-check-circle", title: "First Completion", desc: "Complete your first anime.", goal: 1, progress: d => d.filter(a => a.userStatus === "Completed").length },
            { icon: "fa-tv", title: "TV Enthusiast", desc: "Complete 10 TV series.", goal: 10, progress: d => d.filter(a => a.type === "TV" && a.userStatus === "Completed").length },
            { icon: "fa-film", title: "Movie Lover", desc: "Watch 5 anime movies.", goal: 5, progress: d => d.filter(a => a.type === "Movie" && a.userStatus === "Completed").length },
            { icon: "fa-trophy", title: "Pro Finisher", desc: "Complete 50 anime.", goal: 50, progress: d => d.filter(a => a.userStatus === "Completed").length },
            { icon: "fa-video", title: "Binge Master", desc: "Complete 100 anime.", goal: 100, progress: d => d.filter(a => a.userStatus === "Completed").length },
            { icon: "fa-crown", title: "Legendary Finisher", desc: "Complete 250 anime.", goal: 250, progress: d => d.filter(a => a.userStatus === "Completed").length },
            { icon: "fa-fire", title: "Episode Addict", desc: "Watch 100 total episodes.", goal: 100, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
            { icon: "fa-bolt", title: "Power Watcher", desc: "Watch 500 total episodes.", goal: 500, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
            { icon: "fa-meteor", title: "Series Slayer", desc: "Watch 1000 total episodes.", goal: 1000, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
            { icon: "fa-hourglass-half", title: "Watch Hour Collector", desc: "Watch 100 hours of anime.", goal: 100, progress: d => totalWatchHours(d) },
            { icon: "fa-clock", title: "Dedicated Watcher", desc: "Spend 250 hours watching anime.", goal: 250, progress: d => totalWatchHours(d) },
            { icon: "fa-infinity", title: "Marathon Legend", desc: "Spend 500 hours watching anime.", goal: 500, progress: d => totalWatchHours(d) },
            { icon: "fa-star", title: "Perfect Score", desc: "Rate an anime 10/10.", goal: 1, progress: d => d.filter(a => a.score === 10).length },
            { icon: "fa-heart", title: "Fan Favorite", desc: "Rate 10 anime 9 or higher.", goal: 10, progress: d => d.filter(a => a.score >= 9).length },
            { icon: "fa-star-half-alt", title: "Reviewer", desc: "Rate 25 anime.", goal: 25, progress: d => d.filter(a => a.score > 0).length },
            { icon: "fa-paint-brush", title: "Genre Explorer", desc: "Watch anime across 10 genres.", goal: 10, progress: d => new Set(d.flatMap(a => a.genres || [])).size },
            { icon: "fa-compass", title: "Genre Master", desc: "Watch anime from 20 genres.", goal: 20, progress: d => new Set(d.flatMap(a => a.genres || [])).size },
            { icon: "fa-calendar-alt", title: "Monthly Streak", desc: "Complete anime in 3 consecutive months.", goal: 3, progress: d => countConsecutiveMonths(d) },
            { icon: "fa-chart-line", title: "Consistent Viewer", desc: "Watch anime in 6 consecutive months.", goal: 6, progress: d => countConsecutiveMonths(d) },
            { icon: "fa-calendar-check", title: "Year of Anime", desc: "Watch anime in 12 consecutive months.", goal: 12, progress: d => countConsecutiveMonths(d) },
            { icon: "fa-fire-alt", title: "Hot Streak", desc: "Complete 5 anime this month.", goal: 5, progress: d => getCompletedThisMonth(d) },
            { icon: "fa-list", title: "Collector", desc: "Add 50 anime to your list.", goal: 50, progress: d => d.length },
            { icon: "fa-layer-group", title: "Library Keeper", desc: "Add 100 anime to your list.", goal: 100, progress: d => d.length },
            { icon: "fa-database", title: "Archivist", desc: "Add 250 anime to your list.", goal: 250, progress: d => d.length },
            { icon: "fa-brain", title: "Decade Jumper", desc: "Watch anime from 5 different decades.", goal: 5, progress: d => decadesWatched(d).length },
            { icon: "fa-smile", title: "Casual Enjoyer", desc: "Rate 10 anime 7 or higher.", goal: 10, progress: d => d.filter(a => a.score >= 7).length },
        ];

        let completed = 0, inProgress = 0;
        const unlockedIds = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
        const newUnlocks = [];

        achievements.forEach((a, i) => {
            const current = a.progress(data);
            const percent = Math.min((current / a.goal) * 100, 100);
            const done = current >= a.goal;

            let statusClass = 'status-locked', statusText = 'Locked';
            if (done) {
                statusClass = 'status-completed';
                statusText = 'Completed';
                completed++;
                if (!unlockedIds.includes(i)) {
                    unlockedIds.push(i);
                    newUnlocks.push(a.title);
                }
            } else if (current > 0) {
                statusClass = 'status-progress';
                statusText = `In Progress (${Math.floor(percent)}%)`;
                inProgress++;
            }

            const card = document.createElement('div');
            card.className = `achievement-card fade-in ${done ? 'unlocked' : ''}`;
            card.innerHTML = `
                <div class="achievement-icon"><i class="fas ${a.icon}"></i></div>
                <div class="achievement-title">${a.title}</div>
                <div class="achievement-desc">${a.desc}</div>
                <div class="achievement-status ${statusClass}">${statusText}</div>
                <div class="achievement-progress-bar">
                    <div class="achievement-progress" style="width:${percent}%;"></div>
                </div>
            `;
            grid.appendChild(card);
        });

        document.getElementById('totalAchievements').textContent = achievements.length;
        document.getElementById('completedAchievements').textContent = completed;
        document.getElementById('inProgressAchievements').textContent = inProgress;

        if (newUnlocks.length > 0) {
            newUnlocks.forEach(title => {
                if (typeof showToast === 'function') showToast(`Achievement Unlocked: ${title}! 🏆`, 'success');
            });
            localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedIds));
        }
    };

    // --- Init ---
    function initAchievements() {
        window.updateAchievements();
        console.log('✅ Achievements initialized');
    }

    window.initAchievements = initAchievements;
})();