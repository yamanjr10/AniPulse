// ============================================
// TOAST SYSTEM – Non-intrusive notifications
// ============================================

(function () {
    'use strict';

    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn('Toast container not found!');
            return;
        }

        // Remove any existing toasts of the same type (optional)
        // const existing = container.querySelectorAll('.toast');
        // existing.forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${getIcon(type)}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Auto-remove
        const timer = setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', function () {
            clearTimeout(timer);
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });

        // Click to dismiss
        toast.addEventListener('click', function (e) {
            if (e.target === toast) {
                clearTimeout(timer);
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        });
    }

    function getIcon(type) {
        const map = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return map[type] || 'fa-info-circle';
    }

    // Expose globally
    window.showToast = showToast;
    window.toast = { show: showToast };

    console.log('✅ Toast system loaded');
})();