// ============================================
// THEME MANAGEMENT (Dark/Light/System)
// ============================================

(function () {
    'use strict';

    // --- Apply theme ---
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon(theme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
        // Also update body for compatibility
        document.body.setAttribute('data-theme', theme);
    }

    // --- Update icon ---
    function updateThemeIcon(theme) {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    // --- Toggle theme ---
    window.toggleTheme = function () {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        // Save preference
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        settings.theme = newTheme;
        localStorage.setItem('appSettings', JSON.stringify(settings));
        if (navigator.vibrate) navigator.vibrate(5);
    };

    // --- Set theme preference (for settings page) ---
    window.setThemePreference = function (pref) {
        localStorage.setItem('themePreference', pref);
        if (pref === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            applyTheme(systemTheme);
        } else {
            applyTheme(pref);
        }
    };

    // --- Initialize theme ---
    window.initializeTheme = function () {
        const stored = localStorage.getItem('theme');
        const pref = localStorage.getItem('themePreference');
        const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');

        if (stored) {
            applyTheme(stored);
        } else if (pref === 'system' || !pref) {
            const systemTheme = darkMedia.matches ? 'dark' : 'light';
            applyTheme(systemTheme);
        } else {
            applyTheme(pref);
        }

        // Listen for OS changes
        const handleSystemChange = (e) => {
            const storedPref = localStorage.getItem('themePreference');
            if (storedPref === 'system' || !storedPref) {
                const systemTheme = e.matches ? 'dark' : 'light';
                applyTheme(systemTheme);
            }
        };
        if (darkMedia.addEventListener) {
            darkMedia.addEventListener('change', handleSystemChange);
        } else {
            darkMedia.addListener(handleSystemChange);
        }

        // Theme toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            const newBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
            newBtn.addEventListener('click', window.toggleTheme);
        }

        // Theme cards in settings
        document.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', function () {
                const theme = this.dataset.theme;
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                window.setThemePreference(theme);
            });
        });

        // Sync with body dataset
        document.body.dataset.theme = document.documentElement.getAttribute('data-theme');

        console.log('✅ Theme initialized');
    };

    // Auto-init if main doesn't call.
})();