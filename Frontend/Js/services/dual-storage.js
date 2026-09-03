// ============================================
// UNIFIED SYNC MANAGER – Cloud Source of Truth
// ============================================

class DualStorageManager {
    constructor() {
        this.isSyncing = false;
        this.lastSyncTime = localStorage.getItem('lastCloudSyncTime');
        this._syncDebounceTimeout = null;
        this._dirtyKey = 'syncDirty';
        this._userIdKey = 'syncUserId';
        this.init();
    }

    init() {
        this.checkApiReady();
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        setInterval(() => {
            if (this.isLoggedIn() && navigator.onLine) {
                if (this.isDirty()) {
                    this.syncToCloud();
                }
            }
        }, 120000);

        document.addEventListener('animeUpdate', () => {
            if (!this.isLoggedIn()) return;
            this.markDirty();
            this.scheduleSync();
        });

        console.log('✅ Unified Sync Manager initialized (Cloud = Source of Truth)');
    }

    getToken() {
        return localStorage.getItem('authToken');
    }

    isLoggedIn() {
        return !!this.getToken();
    }

    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.uid || null;
    }

    isDirty() {
        return localStorage.getItem(this._dirtyKey) === 'true';
    }

    markDirty() {
        localStorage.setItem(this._dirtyKey, 'true');
        console.log('🟡 Local data marked as dirty');
    }

    clearDirty() {
        localStorage.removeItem(this._dirtyKey);
        console.log('🟢 Dirty flag cleared');
    }

    scheduleSync() {
        clearTimeout(this._syncDebounceTimeout);
        this._syncDebounceTimeout = setTimeout(() => {
            this.syncToCloud();
        }, 2000);
    }

    async syncToCloud() {
        if (!this.isLoggedIn()) {
            console.warn('⚠️ Not logged in, skipping sync');
            return false;
        }
        if (!navigator.onLine) {
            console.log('📴 Offline – changes will sync when online');
            this.showSyncStatus('Offline – changes saved locally', 'warning');
            return false;
        }
        if (this.isSyncing) return false;
        if (!this.isDirty()) {
            console.log('ℹ️ No local changes to upload');
            return false;
        }

        this.isSyncing = true;
        this.showSyncStatus('Syncing to cloud...', 'info');

        try {
            const payload = this.buildSyncPayload();
            const token = this.getToken();

            const response = await fetch(`${window.API_BASE_URL}/api/sync/sync-all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            if (result.success) {
                this.clearDirty();
                if (typeof window.clearLocalDirty === 'function') window.clearLocalDirty();

                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastCloudSyncTime', this.lastSyncTime);
                this.showSyncStatus('✅ Synced successfully', 'success');
                console.log(`✅ Uploaded ${payload.animeData?.length || 0} anime, ${payload.xpPendingQueue?.length || 0} queued XP`);

                this.clearLoadCache();
                return true;
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.showSyncStatus('⚠️ Sync failed – will retry', 'error');
            return false;
        } finally {
            this.isSyncing = false;
        }
    }

    buildSyncPayload() {
        const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
        const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
        const userXpHistory = JSON.parse(localStorage.getItem('userXpHistory') || '[]');
        const animeContributions = JSON.parse(localStorage.getItem('animeContributions') || '{}');
        const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        const levelData = this.getLevelData();

        const today = new Date().toDateString();
        const dailyXPKey = `dailyXP_${today}`;
        const todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');
        const xpPendingQueue = JSON.parse(localStorage.getItem('xpPendingQueue') || '[]');
        const lastResetDate = localStorage.getItem('lastResetDate') || today;
        const streakData = {
            streak: parseInt(localStorage.getItem('streak') || '0'),
            lastActive: localStorage.getItem('lastActive') || today
        };

        return {
            animeData,
            activityLog,
            userProfile,
            unlockedAchievements,
            userXpHistory,
            animeContributions,
            appSettings,
            levelData,
            dailyXP: { date: today, xp: todayXP },
            xpPendingQueue,
            lastResetDate,
            streakData,
            lastModified: new Date().toISOString()
        };
    }

    clearLoadCache() {
        try {
            if (window.rateLimiter && window.rateLimiter.cache) {
                const baseUrl = `${window.API_BASE_URL}/api/sync/load-all`;
                let deleted = 0;
                for (const key of window.rateLimiter.cache.keys()) {
                    if (key.startsWith(baseUrl)) {
                        window.rateLimiter.cache.delete(key);
                        deleted++;
                    }
                }
                console.log(`🗑️ Cleared ${deleted} load-all cache entries`);
            }
        } catch (e) { /* ignore */ }
    }

    async loadFromCloud() {
        const token = this.getToken();
        if (!token) {
            this.showSyncStatus('Please login first', 'warning');
            return { success: false, error: 'Not logged in' };
        }
        if (!navigator.onLine) {
            this.showSyncStatus('Offline – cannot load cloud data', 'error');
            return { success: false, error: 'Offline' };
        }

        try {
            // Use timestamp to bust cache – no custom headers (avoids CORS preflight)
            const url = `${window.API_BASE_URL}/api/sync/load-all?_t=${Date.now()}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to load');

            const { data, lastModified } = result;
            this.backupLocalData();

            if (data.animeData) {
                localStorage.setItem('animeData', JSON.stringify(data.animeData));
                window.animeData = data.animeData;
            }
            if (data.activityLog) {
                localStorage.setItem('activityLog', JSON.stringify(data.activityLog));
                window.activityLog = data.activityLog;
            }
            if (data.userProfile) {
                localStorage.setItem('userProfile', JSON.stringify(data.userProfile));
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const profile = data.userProfile;
                user.name = profile.name || profile.username || user.name;
                user.username = profile.username || profile.name || user.username;
                user.avatar = profile.avatar || user.avatar;
                localStorage.setItem('user', JSON.stringify(user));
                if (typeof updateSidebarUserInfo === 'function') updateSidebarUserInfo();
            }
            if (data.unlockedAchievements) {
                localStorage.setItem('unlockedAchievements', JSON.stringify(data.unlockedAchievements));
            }
            if (data.userXpHistory) {
                localStorage.setItem('userXpHistory', JSON.stringify(data.userXpHistory));
            }
            if (data.animeContributions) {
                localStorage.setItem('animeContributions', JSON.stringify(data.animeContributions));
            }
            if (data.appSettings) {
                localStorage.setItem('appSettings', JSON.stringify(data.appSettings));
            }
            if (data.levelData) {
                localStorage.setItem('userLevel', data.levelData.level.toString());
                localStorage.setItem('userLevelTitle', data.levelData.title);
                localStorage.setItem('userXP', data.levelData.totalXP.toString());
                if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.saveUserProfile === 'function') {
                    const profile = window.AniPulseLevelSystem.getUserProfile();
                    profile.totalExp = data.levelData.totalXP;
                    profile.level = data.levelData.level;
                    profile.title = data.levelData.title;
                    window.AniPulseLevelSystem.saveUserProfile(profile);
                    window.AniPulseLevelSystem.updateAllLevelUI();
                }
            }

            const today = new Date().toDateString();
            if (data.dailyXP) {
                if (data.dailyXP.date === today) {
                    localStorage.setItem(`dailyXP_${today}`, data.dailyXP.xp.toString());
                }
            }
            if (data.xpPendingQueue) {
                localStorage.setItem('xpPendingQueue', JSON.stringify(data.xpPendingQueue));
            }
            if (data.lastResetDate) {
                localStorage.setItem('lastResetDate', data.lastResetDate);
            }
            if (data.streakData) {
                localStorage.setItem('streak', data.streakData.streak.toString());
                localStorage.setItem('lastActive', data.streakData.lastActive);
            }

            this.clearDirty();
            if (typeof window.clearLocalDirty === 'function') window.clearLocalDirty();

            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastCloudSyncTime', this.lastSyncTime);

            this.showSyncStatus(`✅ Loaded ${data.animeData?.length || 0} anime from cloud`, 'success');

            if (typeof updateQueueStatusUI === 'function') setTimeout(updateQueueStatusUI, 300);
            if (typeof updateAllComponents === 'function') updateAllComponents();
            if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
                setTimeout(() => window.AniPulseLevelSystem.updateAllLevelUI(), 500);
            }

            this.clearLoadCache();

            window._cloudLoaded = true;
            window._needsCloudLoad = false;
            window.dispatchEvent(new CustomEvent('cloudDataLoaded'));
            if (typeof window._onCloudReady === 'function') {
                window._onCloudReady();
            }

            return { success: true, data };
        } catch (error) {
            console.error('❌ Load from cloud failed:', error);
            this.showSyncStatus('⚠️ Failed to load cloud data – using local cache', 'error');
            return { success: false, error: error.message };
        }
    }

    async handleOnline() {
        console.log('🟢 Online');
        if (this.isLoggedIn()) {
            const isDirty = this.isDirty() || (typeof window.isLocalDirty === 'function' && window.isLocalDirty());
            if (isDirty) {
                await this.syncToCloud();
            } else {
                await this.loadFromCloud();
            }
        }
    }

    handleOffline() {
        console.log('🔴 Offline');
        this.showSyncStatus('Offline – changes will sync when online', 'warning');
    }

    calculateTotalHours() {
        const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
        let totalMinutes = 0;
        animeData.forEach(anime => {
            if (anime.type === 'Movie') {
                totalMinutes += anime.duration || 120;
            } else {
                const eps = anime.progress || anime.episodes || 0;
                const epDur = anime.duration || 20;
                totalMinutes += eps * epDur;
            }
        });
        return Math.round(totalMinutes / 60);
    }

    getLevelData() {
        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
            const profile = window.AniPulseLevelSystem.getUserProfile();
            const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
            return {
                totalXP: profile.totalExp || 0,
                level: profile.level || 1,
                title: profile.title || 'Newbie',
                totalAnime: animeData.filter(a => a.userStatus === 'Completed').length,
                totalHours: this.calculateTotalHours()
            };
        }
        return {
            totalXP: parseInt(localStorage.getItem('userXP') || '0'),
            level: parseInt(localStorage.getItem('userLevel') || '1'),
            title: localStorage.getItem('userLevelTitle') || 'Newbie',
            totalAnime: JSON.parse(localStorage.getItem('animeData') || '[]').filter(a => a.userStatus === 'Completed').length,
            totalHours: this.calculateTotalHours()
        };
    }

    backupLocalData() {
        const backup = {
            timestamp: new Date().toISOString(),
            animeData: localStorage.getItem('animeData'),
            activityLog: localStorage.getItem('activityLog'),
            userProfile: localStorage.getItem('userProfile'),
            xpPendingQueue: localStorage.getItem('xpPendingQueue'),
            dailyXP: localStorage.getItem(`dailyXP_${new Date().toDateString()}`),
            lastResetDate: localStorage.getItem('lastResetDate'),
            streak: localStorage.getItem('streak'),
            lastActive: localStorage.getItem('lastActive')
        };
        localStorage.setItem('localBackupBeforeCloudSync', JSON.stringify(backup));
    }

    showSyncStatus(message, type) {
        const syncStatus = document.getElementById('syncStatusText');
        if (syncStatus) {
            syncStatus.innerHTML = message;
            syncStatus.style.color = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#F59E0B';
            setTimeout(() => {
                if (type !== 'error' && syncStatus.innerHTML === message) {
                    syncStatus.innerHTML = 'Cloud sync active';
                    syncStatus.style.color = '';
                }
            }, 3000);
        }
        if (typeof showToast === 'function') {
            const toastMessage = message.replace(/<[^>]*>/g, '');
            showToast(toastMessage, type);
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    async checkApiReady() {
        let attempts = 0;
        const maxAttempts = 30;
        while (!window.api && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (window.api) {
            console.log('✅ API ready');
            if (this.isLoggedIn() && navigator.onLine) {
                await this.handleOnline();
            }
        } else {
            console.warn('⚠️ API not available after 5 seconds');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.dualStorage = new DualStorageManager();
            console.log('✅ Dual Storage Manager (unified) ready');
        }, 1000);
    });
} else {
    setTimeout(() => {
        window.dualStorage = new DualStorageManager();
        console.log('✅ Dual Storage Manager (unified) ready');
    }, 1000);
}