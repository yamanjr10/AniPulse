// ============================================
// DUAL STORAGE MANAGER – Full Cloud Sync
// ============================================

class DualStorageManager {
    constructor() {
        this.isSyncing = false;
        this.syncQueue = [];
        this.saveDebounceTimeout = null;
        this.lastSyncTime = localStorage.getItem('lastCloudSyncTime');
        this._syncDebounceTimeout = null;
        this.init();
    }

    init() {
        this.checkApiReady();
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        setInterval(() => this.autoSync(), 120000);

        // Listen for anime data changes (add, edit, delete) and sync to cloud with debounce
        document.addEventListener('animeUpdate', () => {
            if (!this.isLoggedIn() || !navigator.onLine) return;
            clearTimeout(this._syncDebounceTimeout);
            this._syncDebounceTimeout = setTimeout(() => {
                this.syncToCloud();
                this._syncDebounceTimeout = null;
            }, 2000);
        });

        console.log(' Dual Storage Manager initialized');
    }

    getToken() {
        return localStorage.getItem('authToken');
    }

    isLoggedIn() {
        return !!this.getToken();
    }

    async checkApiReady() {
        let attempts = 0;
        const maxAttempts = 30;
        while (!window.api && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (window.api) {
            console.log(' API ready for dual storage');
            setTimeout(() => {
                if (this.isLoggedIn() && navigator.onLine) {
                    this.syncToCloud();
                }
            }, 3000);
        } else {
            console.warn('⚠️ API not available after 5 seconds');
        }
    }

    async autoSync() {
        if (!this.isLoggedIn() || !navigator.onLine || this.isSyncing) return;
        await this.syncToCloud();
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

    // ============================================
    // SYNC TO CLOUD 
    // ============================================
    async syncToCloud() {
        const token = this.getToken();
        if (!token) {
            this.showSyncStatus('Please login to sync', 'warning');
            return false;
        }
        if (!navigator.onLine) {
            this.showSyncStatus('Offline - will sync when online', 'warning');
            return false;
        }
        if (this.isSyncing) return false;

        this.isSyncing = true;
        this.showSyncStatus('Syncing to cloud...', 'info');

        try {
            const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
            const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
            const userXpHistory = JSON.parse(localStorage.getItem('userXpHistory') || '[]');
            const animeContributions = JSON.parse(localStorage.getItem('animeContributions') || '{}');
            const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
            const levelData = this.getLevelData();

            // ---- Daily XP and Queue ----
            const today = new Date().toDateString();
            const dailyXPKey = `dailyXP_${today}`;
            const todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');
            const xpPendingQueue = JSON.parse(localStorage.getItem('xpPendingQueue') || '[]');
            const lastResetDate = localStorage.getItem('lastResetDate') || today;

            // ---- Streak ----
            const streakData = {
                streak: parseInt(localStorage.getItem('streak') || '0'),
                lastActive: localStorage.getItem('lastActive') || today
            };

            const now = new Date().toISOString();

            const allData = {
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
                lastModified: now
            };

            console.log(` Syncing ${animeData.length} anime, ${xpPendingQueue.length} queued, streak ${streakData.streak} days...`);

            const response = await fetch(`${window.API_BASE_URL}/api/sync/sync-all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(allData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            if (result.success) {
                this.lastSyncTime = now;
                localStorage.setItem('lastCloudSyncTime', now);
                localStorage.setItem('cloudSyncEnabled', 'true');
                localStorage.setItem('animeDataLastModified', now);
                this.showSyncStatus(` Synced ${animeData.length} anime, ${xpPendingQueue.length} queued, streak ${streakData.streak} (Level ${levelData.level})`, 'success');
                console.log(' Full sync completed (queue, daily XP, streak)');
                return true;
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.showSyncStatus('⚠️ Sync failed, will retry', 'error');
            return false;
        } finally {
            this.isSyncing = false;
        }
    }

    // ============================================
    // LOAD FROM CLOUD – Always fetches latest and merges
    // ============================================
    async loadFromCloud() {
        const token = this.getToken();
        if (!token) {
            this.showSyncStatus('Please login to load cloud data', 'warning');
            return { success: false, error: 'Not logged in' };
        }
        if (!navigator.onLine) {
            this.showSyncStatus('Offline - cannot load cloud data', 'error');
            return { success: false, error: 'Offline' };
        }

        // If local is dirty, push local to cloud first (so we don't lose unsaved changes)
        if (window.isLocalDirty && window.isLocalDirty()) {
            console.log('📌 Local data is dirty – pushing to cloud before merging.');
            await this.syncToCloud();
            window.clearLocalDirty();
        }

        // Now download and merge cloud data
        const result = await this.downloadAndApplyCloudData();
        return result;
    }

    // ============================================
    // DOWNLOAD AND APPLY CLOUD DATA (merge + queue + streak restore)
    // ============================================
    async downloadAndApplyCloudData() {
        const token = this.getToken();
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/sync/load-all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to load');

            const { data, lastModified } = result;
            this.backupLocalData();

            // ---- Anime list: MERGE (union) ----
            const localAnime = JSON.parse(localStorage.getItem('animeData') || '[]');
            const cloudAnime = data.animeData || [];
            const mergedAnime = this.mergeAnimeLists(localAnime, cloudAnime);
            localStorage.setItem('animeData', JSON.stringify(mergedAnime));
            localStorage.setItem('animeDataLastModified', lastModified || new Date().toISOString());
            window.animeData = mergedAnime;

            // ---- Activity log: MERGE, deduplicate by id, sort by timestamp ----
            const localActivity = JSON.parse(localStorage.getItem('activityLog') || '[]');
            const cloudActivity = data.activityLog || [];
            const mergedActivity = this.mergeActivityLogs(localActivity, cloudActivity);
            localStorage.setItem('activityLog', JSON.stringify(mergedActivity));
            window.activityLog = mergedActivity;

            // ---- User Profile: merge (cloud takes precedence for name, avatar) ----
            if (data.userProfile) {
                const existing = JSON.parse(localStorage.getItem('userProfile') || '{}');
                const mergedProfile = { ...existing, ...data.userProfile };
                localStorage.setItem('userProfile', JSON.stringify(mergedProfile));
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.name = mergedProfile.name || mergedProfile.username || user.name;
                user.username = mergedProfile.username || mergedProfile.name || user.username;
                user.avatar = mergedProfile.avatar || user.avatar;
                localStorage.setItem('user', JSON.stringify(user));
                if (typeof updateSidebarUserInfo === 'function') updateSidebarUserInfo();
            }

            // ---- Achievements ----
            if (data.unlockedAchievements) {
                localStorage.setItem('unlockedAchievements', JSON.stringify(data.unlockedAchievements));
            }

            // ---- XP History ----
            if (data.userXpHistory) {
                localStorage.setItem('userXpHistory', JSON.stringify(data.userXpHistory));
            }

            // ---- Contributions (heatmap) ----
            if (data.animeContributions) {
                localStorage.setItem('animeContributions', JSON.stringify(data.animeContributions));
            }

            // ---- App Settings ----
            if (data.appSettings) {
                localStorage.setItem('appSettings', JSON.stringify(data.appSettings));
            }

            // ---- Level Data: cloud takes precedence ----
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

            // ============================================
            // RESTORE DAILY XP, PENDING QUEUE, LAST RESET DATE, STREAK
            // ============================================
            const today = new Date().toDateString();

            // ---- Daily XP: only restore if cloud date matches today ----
            if (data.dailyXP) {
                if (data.dailyXP.date === today) {
                    localStorage.setItem(`dailyXP_${today}`, data.dailyXP.xp.toString());
                    console.log(` Restored today's XP: ${data.dailyXP.xp}`);
                } else {
                    console.log(`Cloud dailyXP date (${data.dailyXP.date}) differs from today (${today}) – keeping local today's XP.`);
                }
            }

            // ---- Pending Queue: cloud overwrites local completely ----
            if (data.xpPendingQueue) {
                localStorage.setItem('xpPendingQueue', JSON.stringify(data.xpPendingQueue));
                console.log(` Restored ${data.xpPendingQueue.length} queued XP items from cloud`);
            }

            // ---- Last Reset Date ----
            if (data.lastResetDate) {
                localStorage.setItem('lastResetDate', data.lastResetDate);
            }

            // ---- Streak: cloud overwrites local ----
            if (data.streakData) {
                localStorage.setItem('streak', data.streakData.streak.toString());
                localStorage.setItem('lastActive', data.streakData.lastActive);
                console.log(`Streak restored: ${data.streakData.streak} days (last active: ${data.streakData.lastActive})`);
            }

            // ---- Refresh queue UI ----
            if (typeof updateQueueStatusUI === 'function') {
                setTimeout(updateQueueStatusUI, 300);
            }

            // ---- Update sync time ----
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastCloudSyncTime', this.lastSyncTime);

            this.showSyncStatus(` Synced ${mergedAnime.length} anime, ${mergedActivity.length} activities, ${data.xpPendingQueue?.length || 0} queued XP, streak ${data.streakData?.streak || 0}`, 'success');

            // ---- Refresh everything else ----
            if (typeof updateAllComponents === 'function') updateAllComponents();
            if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
                setTimeout(() => window.AniPulseLevelSystem.updateAllLevelUI(), 500);
            }

            return { success: true, data };
        } catch (error) {
            console.error('❌ Download/merge failed:', error);
            this.showSyncStatus('⚠️ Failed to load from cloud', 'error');
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // MERGE HELPERS
    // ============================================
    mergeAnimeLists(local, cloud) {
        const map = new Map();
        // Start with cloud entries
        cloud.forEach(a => map.set(a.id, a));
        // Add local entries that are not in cloud (by id)
        local.forEach(a => {
            if (!map.has(a.id)) {
                map.set(a.id, a);
            }
            // If both have same id, keep cloud version (latest from other devices)
        });
        return Array.from(map.values());
    }

    mergeActivityLogs(local, cloud) {
        const map = new Map();
        // Start with cloud
        cloud.forEach(a => map.set(a.id, a));
        // Add local if id not exists
        local.forEach(a => {
            if (!map.has(a.id)) {
                map.set(a.id, a);
            }
        });
        const merged = Array.from(map.values());
        // Sort by timestamp descending
        merged.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
        // Keep only latest 50 to avoid bloating
        return merged.slice(0, 50);
    }

    // ============================================
    // UTILITIES
    // ============================================
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
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    handleOnline() {
        console.log(' Online - syncing to cloud...');
        this.syncToCloud();
        // Also try to load cloud data to get latest changes
        if (this.isLoggedIn()) {
            setTimeout(() => this.loadFromCloud(), 1000);
        }
    }

    handleOffline() {
        console.log(' Offline - changes will sync when online');
        this.showSyncStatus('Offline mode - changes will sync when online', 'warning');
    }
}

// Initialize dual storage
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.dualStorage = new DualStorageManager();
            console.log(' Dual Storage Manager ready');
        }, 1000);
    });
} else {
    setTimeout(() => {
        window.dualStorage = new DualStorageManager();
        console.log(' Dual Storage Manager ready');
    }, 1000);
}