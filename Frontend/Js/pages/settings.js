// ============================================
// SETTINGS PAGE – Profile, Theme, Sync, Queue, Danger Zone
// ============================================

(function () {
    'use strict';

    // ============================================
    // QUEUE STATUS UI
    // ============================================
    window.updateQueueStatusUI = function () {
        const queuedXPEl = document.getElementById('queuedXPAmount');
        if (!queuedXPEl) return;

        const queue = JSON.parse(localStorage.getItem('xpPendingQueue') || '[]');
        const totalQueuedXP = queue.reduce((sum, item) => sum + (item.xp || 0), 0);
        const queueCount = queue.length;

        const today = new Date().toDateString();
        const dailyXPKey = `dailyXP_${today}`;
        const todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');

        let maxDailyXP = 5000;
        if (window.AniPulseLevelSystem && window.AniPulseLevelSystem.MAX_DAILY_XP) {
            maxDailyXP = window.AniPulseLevelSystem.MAX_DAILY_XP;
        } else if (typeof MAX_DAILY_XP !== 'undefined') {
            maxDailyXP = MAX_DAILY_XP;
        }

        const queuedCountEl = document.getElementById('queuedItemsCount');
        const todayXPEl = document.getElementById('todayXPAmount');
        const dailyLimitEl = document.getElementById('dailyLimit');
        const queueFillEl = document.getElementById('queueProgressFill');
        const queuePercentEl = document.getElementById('queuePercent');
        const queueMessageEl = document.getElementById('queueMessage');

        if (queuedXPEl) {
            const old = parseInt(queuedXPEl.textContent);
            queuedXPEl.textContent = totalQueuedXP.toLocaleString();
            if (old !== totalQueuedXP && totalQueuedXP > 0) {
                queuedXPEl.classList.add('updated');
                setTimeout(() => queuedXPEl.classList.remove('updated'), 400);
            }
        }
        if (queuedCountEl) queuedCountEl.textContent = queueCount;
        if (todayXPEl) todayXPEl.textContent = todayXP;
        if (dailyLimitEl) dailyLimitEl.textContent = maxDailyXP.toLocaleString();

        const dailyPercent = Math.min(100, (todayXP / maxDailyXP) * 100);
        if (queueFillEl) queueFillEl.style.width = dailyPercent + '%';
        if (queuePercentEl) queuePercentEl.textContent = Math.floor(dailyPercent) + '%';

        if (queueMessageEl) {
            if (queueCount > 0) {
                queueMessageEl.className = 'queue-message has-queue';
                queueMessageEl.innerHTML = `<i class="fas fa-clock"></i> ${queueCount} item(s) queued (${totalQueuedXP.toLocaleString()} XP total). Will be added when daily limit resets.`;
            } else {
                queueMessageEl.className = 'queue-message';
                queueMessageEl.innerHTML = `<i class="fas fa-check-circle"></i> No pending XP in queue`;
            }
        }
    };

    function initQueueStatusUI() {
        const queueCard = document.querySelector('.queue-status-card');
        if (!queueCard) return;
        window.updateQueueStatusUI();
        setInterval(() => {
            const settingsPage = document.getElementById('settings-page');
            if (settingsPage && settingsPage.classList.contains('active')) {
                window.updateQueueStatusUI();
            }
        }, 30000);
    }

    // ============================================
    // SYNC UI
    // ============================================
    window.initSyncUI = function () {
        const lastSyncSpan = document.getElementById('lastSyncTime');
        const lastSync = localStorage.getItem('lastCloudSyncTime');
        if (lastSync) lastSyncSpan.textContent = new Date(lastSync).toLocaleString();

        document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
            if (window.dualStorage) {
                await window.dualStorage.syncToCloud();
                const newSync = localStorage.getItem('lastCloudSyncTime');
                if (newSync) lastSyncSpan.textContent = new Date(newSync).toLocaleString();
            }
        });

        document.getElementById('loadFromCloudBtn')?.addEventListener('click', async () => {
            if (confirm('⚠️ This will replace your local data with cloud data. Continue?')) {
                const result = await window.dualStorage?.loadFromCloud();
                if (result?.success) location.reload();
            }
        });
    };

    // ============================================
    // SETTINGS TABS
    // ============================================
    function initSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const contents = document.querySelectorAll('.settings-tab-content');
        if (!tabs.length || !contents.length) return;

        const savedTab = localStorage.getItem('settingsActiveTab') || 'profile';
        tabs.forEach(tab => {
            const tabName = tab.dataset.tab;
            tab.classList.toggle('active', tabName === savedTab);
        });
        contents.forEach(content => {
            const contentId = content.id.replace('tab-', '');
            content.classList.toggle('active', contentId === savedTab);
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const tabName = this.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                contents.forEach(content => {
                    const contentId = content.id.replace('tab-', '');
                    content.classList.toggle('active', contentId === tabName);
                });
                localStorage.setItem('settingsActiveTab', tabName);
            });
        });
        console.log('✅ Settings tabs initialized');
    }

    // ============================================
    // MAIN SETTINGS INIT
    // ============================================
    window.initSettings = function () {
        initSettingsTabs();

        // Username input sync (handled in name-entry.js)
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            const current = localStorage.getItem('userName') || '';
            usernameInput.value = current;
        }

        // Clear data button
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (this.disabled) return;
                if (confirm('Are you sure you want to delete all data?')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }

        // Export data
        document.getElementById('exportDataBtn')?.addEventListener('click', function () {
            if (typeof window.exportData === 'function') window.exportData();
        });

        // Backup (persistent file)
        const enableBackupBtn = document.getElementById('enableBackupBtn');
        if (enableBackupBtn) {
            enableBackupBtn.addEventListener('click', async () => {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: 'AnimeTracker_Backup.json',
                        types: [{ description: 'AnimeTracker JSON Backup', accept: { 'application/json': ['.json'] } }]
                    });
                    const writable = await handle.createWritable();
                    const data = JSON.stringify(window.animeData || [], null, 2);
                    await writable.write(data);
                    await writable.close();
                    const statusEl = document.getElementById('backupStatus');
                    if (statusEl) statusEl.textContent = '✅ Auto backup enabled and file selected.';
                } catch (err) {
                    console.warn('Backup setup canceled or failed:', err);
                    const statusEl = document.getElementById('backupStatus');
                    if (statusEl) statusEl.textContent = '⚠️ Backup not enabled.';
                }
            });
        }

        // Queue status
        initQueueStatusUI();

        console.log('✅ Settings initialized');
    };

    // ============================================
    // EXPORT DATA (reused)
    // ============================================
    window.exportData = function () {
        const data = window.animeData || [];
        if (!data.length) {
            if (typeof showToast === 'function') showToast('No data to export.', 'error');
            return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'My Anime List.json';
        link.click();
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('Data exported successfully!', 'success');
    };

})();