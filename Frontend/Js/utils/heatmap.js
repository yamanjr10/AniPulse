// ============================================
// ACTIVITY HEATMAP (GitHub-style contributions)
// ============================================

(function () {
    'use strict';

    class ActivityHeatmap {
        constructor() {
            this.currentYear = new Date().getFullYear();
            this.currentDay = new Date();
            this.contributions = this.loadContributions();
            this.tooltip = null;
            this.init();
        }

        init() {
            this.createTooltip();
            this.render();
            this.attachEventListeners();
            this.startAutoRefresh();
            this.setupThemeObserver();
        }

        createTooltip() {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'heatmap-tooltip';
            this.tooltip.style.cssText = `
                position: fixed;
                background: linear-gradient(135deg, #1a1f2e, #0f1420);
                color: white;
                padding: 10px 16px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 500;
                border: 1px solid rgba(139,92,246,0.4);
                backdrop-filter: blur(8px);
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                white-space: nowrap;
                display: none;
                transition: opacity 0.2s ease;
            `;
            document.body.appendChild(this.tooltip);
        }

        parseDateSafely(dateValue) {
            if (!dateValue) return null;
            if (typeof dateValue === 'number') {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime()) && date.getFullYear() > 2000) return date;
            }
            if (typeof dateValue === 'string') {
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    const [y, m, d] = dateValue.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    if (!isNaN(date.getTime())) return date;
                }
                if (/^\d{4}-\d{2}$/.test(dateValue)) {
                    const [y, m] = dateValue.split('-').map(Number);
                    const date = new Date(y, m - 1, 15);
                    if (!isNaN(date.getTime())) return date;
                }
                if (dateValue.includes('T')) {
                    const part = dateValue.split('T')[0];
                    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
                        const [y, m, d] = part.split('-').map(Number);
                        const date = new Date(y, m - 1, d);
                        if (!isNaN(date.getTime())) return date;
                    }
                }
                if (dateValue.includes(' ')) {
                    const part = dateValue.split(' ')[0];
                    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
                        const [y, m, d] = part.split('-').map(Number);
                        const date = new Date(y, m - 1, d);
                        if (!isNaN(date.getTime())) return date;
                    }
                }
                if (/^\d{4}$/.test(dateValue)) {
                    const date = new Date(parseInt(dateValue), 0, 1);
                    if (!isNaN(date.getTime())) return date;
                }
            }
            return null;
        }

        formatDateKey(date) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        loadContributions() {
            const saved = localStorage.getItem('animeContributions');
            if (saved && Object.keys(JSON.parse(saved)).length > 0) {
                return JSON.parse(saved);
            }
            return this.generateFromAnimeData();
        }

        generateFromAnimeData() {
            const contributions = {};
            const data = JSON.parse(localStorage.getItem('animeData') || '[]');
            const processed = new Set();

            data.forEach(anime => {
                if (anime.userStatus !== 'Completed') return;
                let completionDate = null;
                if (anime.actualFinishDate) completionDate = this.parseDateSafely(anime.actualFinishDate);
                if (!completionDate && anime.finishDate) completionDate = this.parseDateSafely(anime.finishDate);
                if (!completionDate && anime.completedTimestamp) completionDate = this.parseDateSafely(anime.completedTimestamp);
                if (!completionDate && anime.updatedAt) completionDate = this.parseDateSafely(anime.updatedAt);
                if (!completionDate && anime.createdAt) completionDate = this.parseDateSafely(anime.createdAt);

                if (completionDate && !isNaN(completionDate.getTime())) {
                    const key = this.formatDateKey(completionDate);
                    const unique = `${anime.id || anime.title}_${key}`;
                    if (!processed.has(unique)) {
                        processed.add(unique);
                        contributions[key] = (contributions[key] || 0) + 1;
                    }
                }
            });
            return contributions;
        }

        saveContributions() {
            localStorage.setItem('animeContributions', JSON.stringify(this.contributions));
        }

        getContribution(date) {
            const key = this.formatDateKey(date);
            return this.contributions[key] || 0;
        }

        getTotalForYear(year) {
            let total = 0;
            for (const [date, count] of Object.entries(this.contributions)) {
                if (date.startsWith(year.toString())) total += count;
            }
            return total;
        }

        getColorLevel(count) {
            if (count === 0) return 0;
            if (count <= 1) return 1;
            if (count <= 2) return 2;
            if (count <= 3) return 3;
            return 4;
        }

        getColorForLevel(level) {
            const colors = { 0: '#2d3748', 1: '#9be9a8', 2: '#40c463', 3: '#30a14e', 4: '#216e39' };
            return colors[level] || colors[0];
        }

        getWeeksData(year) {
            const weeks = [];
            const today = new Date();
            const maxDate = (year === this.currentYear) ? today : new Date(year, 11, 31);
            const firstDay = new Date(year, 0, 1);
            let firstSunday = new Date(firstDay);
            firstSunday.setDate(firstDay.getDate() - firstDay.getDay());

            for (let week = 0; week < 53; week++) {
                const weekStart = new Date(firstSunday);
                weekStart.setDate(firstSunday.getDate() + (week * 7));
                if (weekStart > maxDate) break;

                const days = [];
                for (let day = 0; day < 7; day++) {
                    const currentDate = new Date(weekStart);
                    currentDate.setDate(weekStart.getDate() + day);
                    if (currentDate <= maxDate && currentDate >= new Date(year, 0, 1)) {
                        const count = this.getContribution(currentDate);
                        days.push({
                            date: new Date(currentDate),
                            count: count,
                            dateStr: this.formatDateKey(currentDate),
                            level: this.getColorLevel(count)
                        });
                    } else {
                        days.push(null);
                    }
                }
                if (days.some(d => d !== null)) weeks.push(days);
            }
            return weeks;
        }

        renderHeatmap() {
            const container = document.getElementById('heatmapGrid');
            if (!container) {
                console.warn('Heatmap grid element not found');
                return;
            }

            const weeks = this.getWeeksData(this.currentYear);
            container.innerHTML = '';

            weeks.forEach(week => {
                const col = document.createElement('div');
                col.className = 'heatmap-col';
                col.style.cssText = 'display:flex;flex-direction:column;gap:3px;';

                week.forEach(day => {
                    if (day === null) {
                        const empty = document.createElement('div');
                        empty.style.cssText = 'width:12px;height:12px;visibility:hidden;';
                        col.appendChild(empty);
                    } else {
                        const cell = document.createElement('div');
                        const color = this.getColorForLevel(day.level);
                        cell.className = `heatmap-cell level-${day.level}`;
                        cell.setAttribute('data-date', day.dateStr);
                        cell.setAttribute('data-count', day.count);
                        cell.style.cssText = `
                            width:12px; height:12px; border-radius:3px;
                            cursor:pointer; transition:all 0.15s ease;
                            background-color:${color};
                        `;
                        cell.addEventListener('mouseenter', (e) => this.showTooltip(e, day));
                        cell.addEventListener('mouseleave', () => this.hideTooltip());
                        col.appendChild(cell);
                    }
                });
                container.appendChild(col);
            });

            this.renderMonthLabels(weeks);
            console.log('✅ Heatmap rendered');
        }

        renderMonthLabels(weeks) {
            let container = document.getElementById('heatmapMonths');
            if (!container) {
                const wrapper = document.querySelector('.heatmap-wrapper');
                if (wrapper) {
                    container = document.createElement('div');
                    container.id = 'heatmapMonths';
                    container.className = 'heatmap-months';
                    wrapper.insertBefore(container, wrapper.firstChild);
                }
            }
            if (!container) return;

            const monthPositions = {};
            let currentMonth = -1;
            weeks.forEach((week, weekIndex) => {
                week.forEach((day) => {
                    if (day && day.date.getDate() <= 7 && day.date.getMonth() !== currentMonth) {
                        currentMonth = day.date.getMonth();
                        monthPositions[currentMonth] = {
                            name: day.date.toLocaleString('default', { month: 'short' }),
                            position: weekIndex * 15 + 10
                        };
                    }
                });
            });
        }

        getAvailableYears() {
            const data = JSON.parse(localStorage.getItem('animeData') || '[]');
            const years = new Set();
            const currentYear = new Date().getFullYear();
            data.forEach(a => {
                if (a.userStatus === 'Completed') {
                    if (a.actualFinishDate) {
                        const match = a.actualFinishDate.match(/^\d{4}/);
                        if (match) years.add(parseInt(match[0]));
                    }
                    if (a.finishDate) {
                        const match = a.finishDate.match(/^\d{4}/);
                        if (match) years.add(parseInt(match[0]));
                    }
                    if (a.completedTimestamp) {
                        const date = this.parseDateSafely(a.completedTimestamp);
                        if (date) years.add(date.getFullYear());
                    }
                }
            });
            if (years.size === 0) years.add(currentYear);
            return Array.from(years).sort((a, b) => b - a);
        }

        renderYearButtons() {
            const years = this.getAvailableYears();
            const container = document.getElementById('heatmapYears');
            if (!container) return;
            container.innerHTML = years.map(year =>
                `<button class="year-btn ${year === this.currentYear ? 'active' : ''}" data-year="${year}">${year}</button>`
            ).join('');
            container.querySelectorAll('.year-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.currentYear = parseInt(btn.dataset.year);
                    this.renderYearButtons();
                    this.renderHeatmap();
                    this.updateTotalDisplay();
                });
            });
        }

        updateTotalDisplay() {
            const total = this.getTotalForYear(this.currentYear);
            const totalSpan = document.getElementById('totalCount');
            const yearSpan = document.getElementById('currentYearDisplay');
            if (totalSpan) totalSpan.textContent = total;
            if (yearSpan) yearSpan.textContent = this.currentYear;
        }

        showTooltip(event, day) {
            if (!day) return;
            const count = day.count;
            const date = day.date;
            const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const text = count === 1 ? 'completion' : 'completions';
            this.tooltip.innerHTML = `${count} anime ${text} on ${formattedDate}`;
            this.tooltip.style.display = 'block';

            let left = event.clientX + 15;
            let top = event.clientY - 30;
            if (left + 200 > window.innerWidth) left = event.clientX - 200;
            if (top < 0) top = event.clientY + 20;
            this.tooltip.style.left = left + 'px';
            this.tooltip.style.top = top + 'px';
        }

        hideTooltip() {
            this.tooltip.style.display = 'none';
        }

        attachEventListeners() {
            window.addEventListener('animeUpdate', () => {
                setTimeout(() => this.refreshFromAnimeData(), 300);
            });
            window.addEventListener('storage', (e) => {
                if (e.key === 'animeContributions') {
                    this.contributions = JSON.parse(e.newValue) || {};
                    this.render();
                } else if (e.key === 'animeData') {
                    this.refreshFromAnimeData();
                }
            });
        }

        startAutoRefresh() {
            setInterval(() => {
                const newDay = new Date();
                if (newDay.getDate() !== this.currentDay.getDate()) {
                    this.currentDay = newDay;
                    if (this.currentYear === newDay.getFullYear()) {
                        this.refreshFromAnimeData();
                    } else {
                        this.render();
                    }
                }
            }, 60000);
        }

        setupThemeObserver() {
            const observer = new MutationObserver(() => {
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                const bg = isDark ? '#1a1f2e' : '#ffffff';
                const color = isDark ? 'white' : '#1a1f2e';
                if (this.tooltip) {
                    this.tooltip.style.background = bg;
                    this.tooltip.style.color = color;
                }
            });
            observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        }

        refreshFromAnimeData() {
            this.contributions = this.generateFromAnimeData();
            this.saveContributions();
            this.render();
        }

        render() {
            this.renderYearButtons();
            this.renderHeatmap();
            this.updateTotalDisplay();
        }
    }

    // --- Init ---
    function initHeatmap() {
        window.heatmap = new ActivityHeatmap();
        setTimeout(() => window.heatmap?.refreshFromAnimeData(), 500);
        console.log('✅ Heatmap initialized');
    }

    window.initHeatmap = initHeatmap;
    window.renderActivityHeatmap = function (data) {
        if (window.heatmap) {
            window.heatmap.refreshFromAnimeData();
        }
    };

    // Auto-init if main doesn't call.
})();