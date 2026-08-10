// ============================================
// APPLICATION DATA & PERSISTENCE
// ============================================

(function () {
    'use strict';

    // --- Data variables ---
    let animeData = JSON.parse(localStorage.getItem('animeData')) || [];
    let activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];
    let isEditing = false;
    let currentEditId = null;

    // Expose to global
    window.animeData = animeData;
    window.activityLog = activityLog;
    window.isEditing = isEditing;
    window.currentEditId = currentEditId;

    // --- Save data (with timestamp) ---
    window.saveData = function () {
        localStorage.setItem('animeData', JSON.stringify(animeData));
        // ✅ Always update the last modified timestamp
        const now = new Date().toISOString();
        localStorage.setItem('animeDataLastModified', now);
        console.log('💾 Data saved to localStorage', new Date(now).toLocaleTimeString());
    };

    // --- Log activity ---
    window.logActivity = function (action, animeTitle, timestamp) {
        const activity = {
            id: Date.now(),
            action: action,
            animeTitle: animeTitle,
            timestamp: timestamp || new Date().toISOString()
        };
        activityLog.unshift(activity);
        if (activityLog.length > 50) {
            activityLog = activityLog.slice(0, 50);
        }
        localStorage.setItem('activityLog', JSON.stringify(activityLog));
        window.activityLog = activityLog;

        // Dispatch event for any listeners
        window.dispatchEvent(new CustomEvent('activityLogged', { detail: activity }));
    };

    // --- Getters / setters for external modules ---
    window.getAnimeData = function () { return animeData; };
    window.setAnimeData = function (newData) {
        animeData = newData;
        window.animeData = animeData;
        window.saveData();
        // Notify other components
        window.dispatchEvent(new CustomEvent('animeUpdate', { detail: { data: animeData } }));
    };
    window.getActivityLog = function () { return activityLog; };

    // --- Next ID helper ---
    window.getNextId = function () {
        if (animeData.length === 0) return 1;
        const maxId = Math.max(...animeData.map(a => parseInt(a.id) || 0));
        return maxId + 1;
    };

    // --- Completion date helper ---
    window.getCompletionDate = function () {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getDate()).padStart(2, '0');
        const selectedYear = document.getElementById('animeYear')?.value;
        const selectedMonth = document.getElementById('animeMonth')?.value;
        if (selectedYear && selectedMonth) {
            const yearInt = parseInt(selectedYear);
            const monthInt = parseInt(selectedMonth);
            const isCurrentMonth = (yearInt === currentYear && monthInt === parseInt(currentMonth));
            const day = isCurrentMonth ? parseInt(currentDay) : 1;
            return {
                finishDate: selectedYear + '-' + selectedMonth,
                actualFinishDate: selectedYear + '-' + selectedMonth + '-' + String(day).padStart(2, '0')
            };
        }
        return {
            finishDate: currentYear + '-' + currentMonth,
            actualFinishDate: currentYear + '-' + currentMonth + '-' + currentDay
        };
    };

    console.log('✅ Data module loaded (with timestamp on save)');
})();