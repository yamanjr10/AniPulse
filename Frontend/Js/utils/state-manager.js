// ============================================
// STATE MANAGER – Persistence & Auto-Refresh
// ============================================

(function () {
    'use strict';

    class StateManager {
        constructor() {
            this.currentPage = localStorage.getItem('lastActivePage') || 'dashboard';
            this.lastScrollPosition = parseInt(localStorage.getItem('lastScrollPosition')) || 0;
            this.filters = {
                status: localStorage.getItem('animeFilterStatus') || 'all',
                month: localStorage.getItem('animeFilterMonth') || 'all',
                year: localStorage.getItem('animeFilterYear') || 'all',
                sort: localStorage.getItem('animeSortFilter') || 'id'
            };
            this.refreshInterval = null;
            this.init();
        }

        init() {
            this.restoreLastPage();
            this.restoreScrollPosition();
            this.startAutoRefresh();
            window.addEventListener('beforeunload', () => this.saveCurrentState());
            window.addEventListener('scroll', () => {
                localStorage.setItem('lastScrollPosition', window.scrollY);
            });
            console.log('📌 State Manager initialized - Last page:', this.currentPage);
        }

        restoreLastPage() {
            const menuItem = document.querySelector(`.menu-item[data-page="${this.currentPage}"]`);
            if (menuItem && !menuItem.classList.contains('active')) {
                setTimeout(() => menuItem.click(), 100);
            }
        }

        restoreScrollPosition() {
            setTimeout(() => {
                window.scrollTo({ top: this.lastScrollPosition, behavior: 'auto' });
            }, 200);
        }

        saveCurrentState() {
            const activeMenuItem = document.querySelector('.menu-item.active');
            if (activeMenuItem) {
                const page = activeMenuItem.getAttribute('data-page');
                if (page) localStorage.setItem('lastActivePage', page);
            }
            localStorage.setItem('lastScrollPosition', window.scrollY);

            const statusFilter = document.getElementById('statusFilter');
            const monthFilter = document.getElementById('monthFilter');
            const yearFilter = document.getElementById('yearFilter');
            const sortFilter = document.getElementById('sortFilter');
            if (statusFilter) localStorage.setItem('animeFilterStatus', statusFilter.value);
            if (monthFilter) localStorage.setItem('animeFilterMonth', monthFilter.value);
            if (yearFilter) localStorage.setItem('animeFilterYear', yearFilter.value);
            if (sortFilter) localStorage.setItem('animeSortFilter', sortFilter.value);
        }

        startAutoRefresh() {
            this.refreshInterval = setInterval(() => {
                if (!document.hidden) {
                    this.refreshCurrentPageData();
                }
            }, 30000);
        }

        stopAutoRefresh() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        }

        async refreshCurrentPageData() {
            const activePage = document.querySelector('.page.active');
            if (!activePage) return;
            const pageId = activePage.id;
            console.log(`🔄 Auto-refreshing data for: ${pageId}`);

            try {
                if (pageId === 'dashboard-page') {
                    if (typeof window.updateStats === 'function') window.updateStats();
                    if (typeof window.updateTopRatedAnime === 'function') window.updateTopRatedAnime();
                    if (typeof window.updateCurrentMonthAnime === 'function') window.updateCurrentMonthAnime();
                    if (typeof window.updateRecentActivity === 'function') window.updateRecentActivity();
                    if (typeof window.updateCurrentlyWatching === 'function') window.updateCurrentlyWatching();
                    if (typeof window.renderAnimeDNA === 'function') window.renderAnimeDNA();
                    if (typeof window.updateCharts === 'function') window.updateCharts();
                } else if (pageId === 'anime-list-page') {
                    if (typeof window.updateAnimeDisplay === 'function') window.updateAnimeDisplay();
                } else if (pageId === 'watchlist-page') {
                    const status = document.querySelector('.filter-btn.active')?.getAttribute('data-status') || 'all';
                    if (typeof window.updateWatchlist === 'function') window.updateWatchlist(status, 1);
                } else if (pageId === 'statistics-page') {
                    if (typeof window.initStatisticsCharts === 'function') window.initStatisticsCharts();
                    if (typeof window.updateStatisticsTables === 'function') window.updateStatisticsTables();
                    if (typeof window.refreshAllCharts === 'function') window.refreshAllCharts();
                } else if (pageId === 'achievements-page') {
                    if (typeof window.updateAchievements === 'function') window.updateAchievements();
                } else if (pageId === 'community-page') {
                    if (typeof window.loadFriends === 'function') window.loadFriends();
                    if (typeof window.loadFriendRequests === 'function') window.loadFriendRequests();
                    if (document.querySelector('.community-tab.active')?.dataset.tab === 'leaderboard') {
                        if (typeof window.loadFriendLeaderboard === 'function') window.loadFriendLeaderboard();
                    }
                } else if (pageId === 'settings-page') {
                    if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo();
                    if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
                        window.AniPulseLevelSystem.updateAllLevelUI();
                    }
                }
                this.showRefreshNotification();
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }

        showRefreshNotification() {
            let notification = document.querySelector('.auto-refresh-toast');
            if (notification) notification.remove();
            notification = document.createElement('div');
            notification.className = 'auto-refresh-toast';
            notification.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Data refreshed';
            notification.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: linear-gradient(135deg, #10B981, #059669);
                color: white; padding: 8px 16px; border-radius: 30px;
                font-size: 12px; font-weight: 500; z-index: 9999;
                animation: slideInRight 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }
    }

    // --- Init ---
    function initStateManager() {
        window.stateManager = new StateManager();
        console.log('✅ State Manager initialized');
    }

    window.initStateManager = initStateManager;
})();