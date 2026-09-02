// main.js
// ============================================
// ORCHESTRATOR – Initializes all modules
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 AniPulse starting...');

    // 1. Theme
    if (typeof window.initializeTheme === 'function') {
        window.initializeTheme();
    }

    // 2. Initialize core infrastructure (does not depend on data)
    if (typeof window.initModalSystem === 'function') {
        window.initModalSystem();
    }
    if (typeof window.initSearchSystem === 'function') {
        window.initSearchSystem();
    }
    if (typeof window.initNotifications === 'function') {
        window.initNotifications();
    }
    if (typeof window.initAvatarSystem === 'function') {
        window.initAvatarSystem();
    }
    if (typeof window.initNameEntry === 'function') {
        window.initNameEntry();
    }
    if (typeof window.initPWA === 'function') {
        window.initPWA();
    }
    if (typeof window.initLoader === 'function') {
        window.initLoader();
    }

    // 3. Determine authentication state
    const isLoggedIn = !!localStorage.getItem('authToken');

    if (!isLoggedIn) {
        console.log('👤 Not logged in – using local cache');
        initializePagesAndUI();
        return;
    }

    // ── Logged in: wait for cloud data ──────────

    if (window._cloudLoaded) {
        console.log('☁️ Cloud data already loaded – rendering');
        initializePagesAndUI();
        return;
    }

    console.log('⏳ Waiting for cloud data...');

    let cloudLoaded = false;
    let timeoutFired = false;
    let timeoutId = null;

    function onCloudReady() {
        if (cloudLoaded) return;
        cloudLoaded = true;
        clearTimeout(timeoutId);
        console.log('✅ Cloud data ready – rendering application');

        if (timeoutFired) {
            if (typeof window.updateAllComponents === 'function') {
                setTimeout(window.updateAllComponents, 300);
            }
            return;
        }

        initializePagesAndUI();
    }

    // Set global callback for dual-storage.js (race condition safety)
    window._onCloudReady = onCloudReady;

    // Listen for the cloudDataLoaded event
    document.addEventListener('cloudDataLoaded', onCloudReady);

    // Also check if cloud is already loaded (flag set by dual-storage)
    if (window._cloudLoaded) {
        onCloudReady();
    }

    // Safety timeout: if cloud doesn't load within 5 seconds, render with local data
    timeoutId = setTimeout(() => {
        if (!cloudLoaded) {
            timeoutFired = true;
            console.warn('⚠️ Cloud load timeout – rendering with local data');
            initializePagesAndUI();
        }
    }, 5000);

    // ── Shared initialization function ───────────

    function initializePagesAndUI() {
        // 4. Pages
        if (typeof window.initDashboard === 'function') {
            window.initDashboard();
        }
        if (typeof window.initAnimeList === 'function') {
            window.initAnimeList();
        }
        if (typeof window.initWatchlistFilters === 'function') {
            window.initWatchlistFilters();
        }
        if (typeof window.initStatisticsPage === 'function') {
            window.initStatisticsPage();
        }
        if (typeof window.initAchievements === 'function') {
            window.initAchievements();
        }
        if (typeof window.initCommunityPage === 'function') {
            window.initCommunityPage();
        }
        if (typeof window.initSettings === 'function') {
            window.initSettings();
        }
        if (typeof window.initRecapSystem === 'function') {
            window.initRecapSystem();
        }
        if (typeof window.initHeatmap === 'function') {
            window.initHeatmap();
        }
        if (typeof window.initStateManager === 'function') {
            window.initStateManager();
        }

        // 5. Load initial dashboard data (after all init)
        if (typeof window.updateAllComponents === 'function') {
            setTimeout(window.updateAllComponents, 300);
        }

        // 6. Auto-reload (dev)
        if (typeof window.initAutoReload === 'function') {
            window.initAutoReload();
        }

        console.log('✅ AniPulse initialized');
    }

    // 7. Service Worker (always)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('✅ ServiceWorker registered successfully:', registration.scope);
                })
                .catch(error => {
                    console.log('❌ ServiceWorker registration failed:', error);
                });
        });
    }

    // Remove the explicit cloud load call – dualStorage handles it
});

// ─── Auto-reload (development only) ──────────────

window.initAutoReload = function () {
    let lastChecksum = null;
    let autoReloadInterval = null;

    function calculatePageChecksum() {
        return window.simpleHash ? window.simpleHash(document.documentElement.innerHTML).slice(0, 20) : null;
    }

    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        autoReloadInterval = setInterval(async () => {
            try {
                const response = await fetch(window.location.href, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                const html = await response.text();
                const newChecksum = window.simpleHash ? window.simpleHash(html).slice(0, 20) : null;
                if (lastChecksum === null) {
                    lastChecksum = newChecksum;
                } else if (lastChecksum !== newChecksum) {
                    console.log('🔄 Changes detected! Reloading page...');
                    if (typeof window.showToast === 'function') {
                        window.showToast('Changes detected! Refreshing...', 'info');
                    }
                    setTimeout(() => window.location.reload(), 500);
                }
            } catch (error) {
                console.error('Auto-reload check failed:', error);
            }
        }, 1000);
    }

    window.stopAutoReload = function () {
        if (autoReloadInterval) {
            clearInterval(autoReloadInterval);
            autoReloadInterval = null;
        }
    };
};