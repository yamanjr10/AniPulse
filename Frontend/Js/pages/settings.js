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
    // EXPORT DATA (manual JSON download)
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

    // ============================================
    // PERSISTENT AUTO‑BACKUP – MATCHES main.js EXACTLY
    // ============================================
    (function setupPersistentAutoBackup() {
        if (!('showSaveFilePicker' in window)) {
            console.warn('Auto-backup: File System Access API not supported in this browser.');
            const statusEl = document.getElementById('backupStatus');
            if (statusEl) {
                statusEl.textContent = '⚠️ Auto-backup requires Chrome/Edge (File System API).';
                statusEl.style.color = '#fbbf24';
            }
            return;
        }

        // ---------- IndexedDB helpers ----------
        const DB_NAME = 'AnimeTrackerDB';
        const STORE_NAME = 'backupHandleStore';

        async function openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onupgradeneeded = () => {
                    request.result.createObjectStore(STORE_NAME);
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function saveHandle(handle) {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(handle, 'backupHandle');
            await tx.complete;
            db.close();
        }

        async function loadHandle() {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get('backupHandle');
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
                tx.oncomplete = () => db.close();
            });
        }

        // ---------- State ----------
        let backupHandle = null;
        let saveTimeout = null;
        const SAVE_DELAY = 800;

        // ---------- Update status (only used for success / initial messages) ----------
        function updateBackupStatus(message, type = 'info') {
            const statusEl = document.getElementById('backupStatus');
            if (!statusEl) return;
            statusEl.textContent = message;
            statusEl.style.color =
                type === 'success' ? 'limegreen' :
                    type === 'error' ? '#ff6b6b' :
                        type === 'warning' ? '#fbbf24' : 'rgba(255,255,255,0.6)';
        }

        // ---------- Save function – IDENTICAL to main.js ----------
        async function saveBackupToFile() {
            if (!backupHandle) return;

            try {
                // Check permission – if denied, clear handle and stop
                const perm = await backupHandle.queryPermission({ mode: 'readwrite' });
                if (perm === 'denied') {
                    console.warn('Backup permission denied.');
                    backupHandle = null;
                    await deleteHandle();
                    if (typeof showToast === 'function') {
                        showToast('Backup permission denied. Re‑enable in Settings.', 'error');
                    }
                    return;
                }

                // Attempt to write – this may throw if permission not granted
                const writable = await backupHandle.createWritable();
                await writable.write(JSON.stringify(window.animeData || [], null, 2));
                await writable.close();

                const time = new Date().toLocaleTimeString();
                console.log('✅ Auto-backup updated at', time);
                // Only update status on success (like main.js)
                updateBackupStatus(`✅ Auto-backup enabled and file selected.`, 'success');
            } catch (err) {
                // Log error to console, do NOT update status (like main.js)
                console.error('❌ Backup save error:', err);
                // If file is missing, clear handle (like main.js does when NotFoundError)
                if (err.name === 'NotFoundError') {
                    backupHandle = null;
                    await deleteHandle();
                    if (typeof showToast === 'function') {
                        showToast('Backup file lost. Re‑enable in Settings.', 'error');
                    }
                }
                // For SecurityError/NotAllowedError, keep handle but don't update status
            }
        }

        // ---------- Debounced trigger ----------
        function triggerBackupSave() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveBackupToFile, SAVE_DELAY);
        }

        // ---------- Enable backup – always shows file picker ----------
        async function enableBackup() {
            try {
                backupHandle = await window.showSaveFilePicker({
                    suggestedName: 'AniPulse_Backup.json',
                    types: [{
                        description: 'AniPulse JSON Backup',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                await saveHandle(backupHandle);
                updateBackupStatus('✅ Auto-backup enabled and file selected.', 'success');
                if (typeof showToast === 'function') {
                    showToast('Backup file selected! Data will auto-save.', 'success');
                }
                await saveBackupToFile();
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'SecurityError') {
                    console.warn('Backup setup failed:', err);
                    updateBackupStatus('⚠️ Backup not enabled.', 'error');
                    if (typeof showToast === 'function') {
                        showToast('Backup setup canceled or failed.', 'info');
                    }
                } else {
                    updateBackupStatus('ℹ️ Backup setup canceled.', 'info');
                }
            }
        }

        // ---------- Restore saved handle on load ----------
        async function restoreHandle() {
            const saved = await loadHandle();
            if (saved) {
                backupHandle = saved;
                updateBackupStatus('✅ Auto-backup enabled and file selected.', 'success');
                console.log('🔁 Restored backup handle from IndexedDB.');
                // Try an immediate backup – if permission missing, it will log error but keep status
                triggerBackupSave();
            } else {
                updateBackupStatus('ℹ️ No backup file selected. Click "Enable Backup" to set one up.', 'info');
            }
        }

        // ---------- Delete helper ----------
        async function deleteHandle() {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete('backupHandle');
            await tx.complete;
            db.close();
        }

        // ---------- Hook into data changes ----------
        const originalSaveData = window.saveData;
        if (typeof originalSaveData === 'function') {
            window.saveData = function (...args) {
                originalSaveData.apply(this, args);
                triggerBackupSave();
            };
        } else {
            document.addEventListener('animeUpdate', triggerBackupSave);
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'animeData') triggerBackupSave();
        });

        let lastSnapshot = JSON.stringify(window.animeData || []);
        setInterval(() => {
            const current = JSON.stringify(window.animeData || []);
            if (current !== lastSnapshot) {
                localStorage.setItem('animeData', current);
                triggerBackupSave();
                lastSnapshot = current;
            }
        }, 5000);

        window.enableBackup = enableBackup;

        function attachBackupButton() {
            const btn = document.getElementById('enableBackupBtn');
            if (btn) {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', enableBackup);
                console.log('✅ Backup button attached.');
            } else {
                setTimeout(attachBackupButton, 500);
            }
        }

        restoreHandle();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachBackupButton);
        } else {
            attachBackupButton();
        }

        console.log('💾 Persistent auto-backup system loaded (settings).');
    })();

    // ============================================
    // MAIN SETTINGS INIT
    // ============================================
    window.initSettings = function () {
        initSettingsTabs();

        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            const current = localStorage.getItem('userName') || '';
            usernameInput.value = current;
        }

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

        document.getElementById('exportDataBtn')?.addEventListener('click', function () {
            if (typeof window.exportData === 'function') window.exportData();
        });

        initQueueStatusUI();
        console.log('✅ Settings initialized');
    };

})();