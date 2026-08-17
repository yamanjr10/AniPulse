// ============================================
// APP LOADER – With stats animation & ready check
// ============================================

(function () {
    'use strict';

    let loaderFinished = false;
    let loaderStartTime = 0;
    let animationsStarted = false;
    const MIN_LOADER_TIME = 1800;
    const MAX_LOADER_TIME = 8000;

    // --- Animate a single element from 0 to target ---
    function animateCount(element, target, duration = 2000) {
        if (!element) return;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(start + (target - start) * eased);
            element.textContent = currentValue;
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target; 
            }
        }
        requestAnimationFrame(update);
    }

    // --- Hide loader ---
    function hideLoader() {
        if (loaderFinished) return;
        const elapsed = Date.now() - loaderStartTime;
        const wait = Math.max(0, MIN_LOADER_TIME - elapsed);

        setTimeout(() => {
            loaderFinished = true;
            const loader = document.getElementById('app-loader');
            if (loader) {
                loader.style.transition = 'opacity 0.35s ease';
                loader.style.opacity = '0';
                loader.style.pointerEvents = 'none';
                setTimeout(() => loader.remove(), 350);
            }
            document.body.classList.remove('loading');
            if (typeof window.startAnimationsAfterLoader === 'function') {
                window.startAnimationsAfterLoader();
            }
        }, wait);
    }
    window.hideLoader = hideLoader;

    // --- Fake progress bar animation ---
    function runFakeProgress() {
        const bar = document.getElementById('loader-progress');
        const percent = document.getElementById('loader-percent');
        if (!bar || !percent) return;
        let progress = 0;
        const timer = setInterval(() => {
            if (loaderFinished) {
                clearInterval(timer);
                return;
            }
            if (progress < 60) progress += 7;
            else if (progress < 80) progress += 4;
            else if (progress < 95) progress += 2;
            else progress += 0.5;
            progress = Math.min(progress, 100);
            bar.style.width = progress + '%';
            percent.textContent = Math.floor(progress) + '%';

            if (progress >= 100 && !loaderFinished) {
                percent.textContent = 'Ready!';
                percent.style.color = '#34D399';
                bar.style.background = 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)';
                bar.style.animation = 'none';
            }
        }, 90);
    }

    function isAppReady() {
        const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
        const statEl = document.querySelector('.stat-value');
        const hasData = animeData.length > 0 || (statEl && statEl.textContent !== '0');
        return hasData;
    }


    function waitForAppReady() {
        if (loaderFinished) return;
        if (isAppReady()) {
            hideLoader();
            if (typeof window.updateCurrentlyWatching === 'function') {
                window.updateCurrentlyWatching();
            }
            return;
        }
        
        setTimeout(waitForAppReady, 200);
    }

    // --- Start animations after loader ---
    window.startAnimationsAfterLoader = function () {
        if (animationsStarted) return;
        animationsStarted = true;

        // First, update everything to get the correct values
        try { if (typeof window.updateStats === 'function') window.updateStats(); } catch (e) { }
        try { if (typeof window.initCharts === 'function') window.initCharts(); } catch (e) { }
        try { if (typeof window.updateTopRatedAnime === 'function') window.updateTopRatedAnime(); } catch (e) { }
        try { if (typeof window.updateCurrentMonthAnime === 'function') window.updateCurrentMonthAnime(); } catch (e) { }
        try { if (typeof window.updateRecentActivity === 'function') window.updateRecentActivity(); } catch (e) { }
        try { if (typeof window.updateAnimeDisplay === 'function') window.updateAnimeDisplay(); } catch (e) { }
        try { if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo(); } catch (e) { }
        try { if (typeof window.updateCurrentDate === 'function') window.updateCurrentDate(); } catch (e) { }
        try { if (typeof window.renderAnimeDNA === 'function') window.renderAnimeDNA(); } catch (e) { }

        // Animate stats from 0 to the values that updateStats just set
        setTimeout(() => {
            const statIds = ['completed-count', 'movies-count', 'episodes-count', 'total-hours-count'];
            const targets = statIds.map(id => {
                const el = document.getElementById(id);
                return el ? parseInt(el.textContent) || 0 : 0;
            });
            statIds.forEach((id, i) => {
                const el = document.getElementById(id);
                if (el) {
                    const target = targets[i];
                    if (target > 0) {
                        el.textContent = 0;
                        animateCount(el, target, 2500);
                    } else {
                        el.textContent = target;
                    }
                }
            });
        }, 300);

       
        setTimeout(() => {
            const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
            try { if (typeof window.renderActivityHeatmap === 'function') window.renderActivityHeatmap(animeData); } catch (e) { }
        }, 300);

     
        try { if (typeof window.searchAnime === 'function') window.searchAnime(); } catch (e) { }
    };

    // --- Init loader ---
    function initLoader() {
        loaderStartTime = Date.now();
        document.body.classList.add('loading');
        runFakeProgress();

        setTimeout(waitForAppReady, 500);
        setTimeout(hideLoader, MAX_LOADER_TIME);

        console.log('✅ Loader initialized with stats animation and ready check');
    }

    window.initLoader = initLoader;
})();