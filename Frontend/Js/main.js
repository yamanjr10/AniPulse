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

    // 2. Data (already loaded via data.js)

    // 3. UI Components
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

    // 5. Load initial dashboard data
    if (typeof window.updateAllComponents === 'function') {
        setTimeout(window.updateAllComponents, 300);
    }

    // 6. Auto-reload (dev)
    if (typeof window.initAutoReload === 'function') {
        window.initAutoReload();
    }

    // 7. Service Worker
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

    console.log('✅ AniPulse initialized');

    // ---- NEW: Ensure cloud data is loaded after login ----
    setTimeout(ensureCloudDataLoaded, 3000);
});

// --- Auto-reload (for development) ---
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

// ---- Function to trigger cloud load ----
async function ensureCloudDataLoaded() {
    // Only run if we're on the dashboard page
    if (!window.location.pathname.includes('dashboard.html')) {
        console.log('ℹ️ Not on dashboard page, skipping cloud load');
        return;
    }

    if (!window._needsCloudLoad) {
        console.log('ℹ️ No cloud load needed (already loaded or no auth)');
        return;
    }

    // Wait for dualStorage to be ready
    let attempts = 0;
    while (!window.dualStorage && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.dualStorage) {
        console.warn('⚠️ DualStorage not available, cannot load cloud data');
        return;
    }

    try {
        console.log('📥 Loading cloud data after authentication...');
        const result = await window.dualStorage.loadFromCloud();
        if (result.success) {
            console.log('✅ Cloud data loaded successfully');
        } else {
            console.warn('⚠️ Cloud load failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error loading cloud data:', error);
    } finally {
        // Prevent repeated loads
        window._needsCloudLoad = false;
        window._cloudLoaded = true;
        // Refresh UI
        if (typeof updateAllComponents === 'function') {
            setTimeout(updateAllComponents, 500);
        }
        if (typeof updateSidebarUserInfo === 'function') {
            setTimeout(updateSidebarUserInfo, 500);
        }
    }
}