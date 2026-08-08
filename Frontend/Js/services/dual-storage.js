// ============================================
// DUAL STORAGE MANAGER – LocalStorage + Firestore (auto‑load, name fix)
// ============================================

class DualStorageManager {
    constructor() {
        this.isSyncing = false;
        this.syncQueue = [];
        this.saveDebounceTimeout = null;
        this.lastSyncTime = localStorage.getItem('lastCloudSyncTime');
        this.init();
    }

    init() {
        this.checkApiReady();
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        setInterval(() => this.autoSync(), 120000);
        console.log('💾 Dual Storage Manager initialized');
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
            console.log('✅ API ready for dual storage');
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
            let userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
            const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
            const levelData = this.getLevelData();

            const allData = {
                animeData,
                activityLog,
                userProfile,
                unlockedAchievements: JSON.parse(localStorage.getItem('unlockedAchievements') || '[]'),
                userXpHistory: JSON.parse(localStorage.getItem('userXpHistory') || '[]'),
                animeContributions: JSON.parse(localStorage.getItem('animeContributions') || '{}'),
                appSettings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
                levelData
            };

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
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastCloudSyncTime', this.lastSyncTime);
                localStorage.setItem('cloudSyncEnabled', 'true');
                this.showSyncStatus(`✅ Synced Level ${levelData.level} (${levelData.totalXP} XP)`, 'success');
                console.log('✅ Full sync completed (avatar included)');
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

        this.isSyncing = true;
        this.showSyncStatus('Loading from cloud...', 'info');

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/sync/load-all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            if (result.success && result.data) {
                const { data } = result;
                this.backupLocalData();

                if (data.animeData) {
                    localStorage.setItem('animeData', JSON.stringify(data.animeData));
                    window.animeData = data.animeData;
                }
                if (data.activityLog) {
                    localStorage.setItem('activityLog', JSON.stringify(data.activityLog));
                    window.activityLog = data.activityLog;
                }
                if (data.achievements) {
                    localStorage.setItem('unlockedAchievements', JSON.stringify(data.achievements));
                }
                if (data.xpHistory) {
                    localStorage.setItem('userXpHistory', JSON.stringify(data.xpHistory));
                }
                if (data.contributions) {
                    localStorage.setItem('animeContributions', JSON.stringify(data.contributions));
                }
                if (data.userProfile) {
                    // Merge with existing local profile
                    const existing = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    const merged = { ...existing, ...data.userProfile };
                    localStorage.setItem('userProfile', JSON.stringify(merged));
                    // Update user object with name
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    user.name = merged.name || merged.username || user.name;
                    user.username = merged.username || merged.name || user.username;
                    user.avatar = merged.avatar || user.avatar;
                    localStorage.setItem('user', JSON.stringify(user));
                    if (typeof updateSidebarUserInfo === 'function') {
                        updateSidebarUserInfo();
                    }
                }
                if (data.levelData) {
                    localStorage.setItem('userLevel', data.levelData.level.toString());
                    localStorage.setItem('userLevelTitle', data.levelData.title);
                    localStorage.setItem('userXP', data.levelData.totalXP.toString());
                    localStorage.setItem('userTotalAnime', data.levelData.totalAnime.toString());
                    localStorage.setItem('userTotalHours', data.levelData.totalHours.toString());
                    if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.saveUserProfile === 'function') {
                        const profile = window.AniPulseLevelSystem.getUserProfile();
                        profile.totalExp = data.levelData.totalXP;
                        profile.level = data.levelData.level;
                        profile.title = data.levelData.title;
                        window.AniPulseLevelSystem.saveUserProfile(profile);
                        window.AniPulseLevelSystem.updateAllLevelUI();
                    }
                }

                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastCloudSyncTime', this.lastSyncTime);
                this.showSyncStatus(`✅ Loaded Level ${data.levelData?.level || 1} from cloud!`, 'success');

                if (typeof updateAllComponents === 'function') updateAllComponents();
                if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
                    setTimeout(() => window.AniPulseLevelSystem.updateAllLevelUI(), 500);
                }
                return { success: true, data };
            } else {
                throw new Error(result.error || 'No data returned');
            }
        } catch (error) {
            console.error('❌ Load failed:', error);
            this.showSyncStatus('⚠️ Failed to load from cloud', 'error');
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    backupLocalData() {
        const backup = {
            timestamp: new Date().toISOString(),
            animeData: localStorage.getItem('animeData'),
            activityLog: localStorage.getItem('activityLog'),
            userProfile: localStorage.getItem('userProfile')
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
        console.log('🟢 Online - syncing to cloud...');
        this.syncToCloud();
    }

    handleOffline() {
        console.log('🔴 Offline - changes will sync when online');
        this.showSyncStatus('Offline mode - changes will sync when online', 'warning');
    }
}

// Initialize dual storage
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.dualStorage = new DualStorageManager();
            console.log('✅ Dual Storage Manager ready');
        }, 1000);
    });
} else {
    setTimeout(() => {
        window.dualStorage = new DualStorageManager();
        console.log('✅ Dual Storage Manager ready');
    }, 1000);
}