// ============================================
// PWA INSTALL PROMPT
// ============================================

(function () {
    'use strict';

    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('✅ Install prompt available!');
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App already installed');
        return;
    }

    function showInstallButton() {
        if (document.getElementById('pwa-install-btn')) return;
        if (localStorage.getItem('pwa-dismissed')) return;

        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;

        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'theme-toggle';
        installBtn.innerHTML = '<i class="fas fa-download"></i>';
        installBtn.title = 'Install App';
        installBtn.style.cursor = 'pointer';

        installBtn.onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBtn.remove();
                    if (typeof showToast === 'function') showToast('🎉 Installing AniPulse!', 'success');
                }
                deferredPrompt = null;
            } else {
                const msg = 'Click the install icon (⊕) in your browser address bar';
                alert(msg);
                if (typeof showToast === 'function') showToast(msg, 'info');
            }
        };

        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.insertAdjacentElement('afterend', installBtn);
        } else {
            userActions.appendChild(installBtn);
        }

        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.style.opacity = '0.5';
            }
        }, 30000);
    }

    // Optional: Dismiss on right-click
    setTimeout(() => {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) {
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                localStorage.setItem('pwa-dismissed', 'true');
                btn.remove();
                if (typeof showToast === 'function') showToast('Install prompt dismissed', 'info');
            });
        }
    }, 1000);

    console.log('✅ PWA install ready');
})();