// ============================================
// STATE MANAGER – Persistence & Page State
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
            this.init();
        }

        init() {
            this.restoreLastPage();
            this.restoreScrollPosition();
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
    }

    // --- Init ---
    function initStateManager() {
        window.stateManager = new StateManager();
        console.log('✅ State Manager initialized');
    }

    window.initStateManager = initStateManager;
})();