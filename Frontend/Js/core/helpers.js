// ============================================
// SHARED UTILITY FUNCTIONS
// ============================================

(function () {
    'use strict';

    // --- Escape HTML to prevent XSS ---
    window.escapeHtml = function (text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // --- Format time ago ---
    window.formatTimeAgo = function (dateString) {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    // --- Compact number formatting (K/M) ---
    window.formatCompactNumber = function (num) {
        if (num === undefined || num === null) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return num.toString();
    };

    // --- Short number (no rounding up) ---
    window.formatNumberShort = function (num) {
        if (num === undefined || num === null) return '0';
        if (num >= 1_000_000) {
            let val = Math.floor(num / 100_000) / 10;
            return val % 1 === 0 ? val.toFixed(0) + 'M' : val + 'M';
        }
        if (num >= 1_000) {
            let val = Math.floor(num / 100) / 10;
            return val % 1 === 0 ? val.toFixed(0) + 'K' : val + 'K';
        }
        return num.toString();
    };

    // --- Simple hash for auto-reload ---
    window.simpleHash = function (str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    };

    // --- Safe date parsing (multiple formats) ---
    window.parseDateSafely = function (dateString) {
        if (!dateString) return null;
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) return date;
        }
        // YYYY-MM
        if (/^\d{4}-\d{2}$/.test(dateString)) {
            const [year, month] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, 15);
            if (!isNaN(date.getTime())) return date;
        }
        // ISO with T
        if (dateString.includes('T')) {
            const datePart = dateString.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                const [year, month, day] = datePart.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
        // Datetime with space
        if (dateString.includes(' ')) {
            const datePart = dateString.split(' ')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                const [year, month, day] = datePart.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
        // Just year
        if (/^\d{4}$/.test(dateString)) {
            const year = parseInt(dateString);
            const date = new Date(year, 0, 1);
            if (!isNaN(date.getTime())) return date;
        }
        return null;
    };

    // --- Timestamp for Nepal (UTC+5:45) ---
    window.getNepalTimestamp = function () {
        const now = new Date();
        const nepalOffset = 5 * 60 + 45;
        const utcOffset = now.getTimezoneOffset();
        const nepalTime = new Date(now.getTime() + (nepalOffset + utcOffset) * 60 * 1000);
        const year = nepalTime.getFullYear();
        const month = String(nepalTime.getMonth() + 1).padStart(2, '0');
        const day = String(nepalTime.getDate()).padStart(2, '0');
        const hours = String(nepalTime.getHours()).padStart(2, '0');
        const minutes = String(nepalTime.getMinutes()).padStart(2, '0');
        const seconds = String(nepalTime.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // --- Generic timestamp (local) ---
    window.getFormattedTimestamp = function () {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        return y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s;
    };

    // --- Get current month name ---
    window.getCurrentMonth = function () {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[new Date().getMonth()];
    };

    console.log('✅ Helpers loaded');
})();