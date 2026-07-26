// ============================================
// DUAL STORAGE MANAGER - LocalStorage + Firebase
// Handles automatic sync between local and cloud
// AVATAR IS SYNCED TO CLOUD (cross-device)
// LEVEL DATA IS SYNCED (for ranking)
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
        // Wait for API to be ready
        this.checkApiReady();
        
        // Listen for online/offline
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Auto-sync every 2 minutes
        setInterval(() => {
            this.autoSync();
        }, 120000);
        
        console.log('💾 Dual Storage Manager initialized');
    }
    
    getToken() {
        const token = localStorage.getItem('authToken');
        if (token) return token;
        if (window.api?.token) return window.api.token;
        return null;
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
            if (!window.api.token && localStorage.getItem('authToken')) {
                window.api.token = localStorage.getItem('authToken');
            }
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
        if (!this.isLoggedIn()) {
            console.log('⚠️ Cannot sync: not logged in');
            return;
        }
        
        if (!navigator.onLine) {
            console.log('⚠️ Cannot sync: offline');
            return;
        }
        
        if (this.isSyncing) {
            console.log('⏳ Sync already in progress');
            return;
        }
        
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
        // Try to get from level-system.js first
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
        
        // Fallback to localStorage
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
            console.log('⚠️ Cannot sync: no auth token');
            this.showSyncStatus('Please login to sync', 'warning');
            return false;
        }
        
        if (!navigator.onLine) {
            console.log('⚠️ Cannot sync: offline');
            this.showSyncStatus('Offline - will sync when online', 'warning');
            return false;
        }
        
        if (this.isSyncing) {
            console.log('⏳ Sync already in progress');
            return false;
        }
        
        this.isSyncing = true;
        this.showSyncStatus('Syncing to cloud...', 'info');
        
        try {
            let userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
            const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
            
            // Get level data
            const levelData = this.getLevelData();
            
            // ✅ KEEP AVATAR - Do NOT delete (avatar syncs across devices now)
            const cleanUserProfile = { ...userProfile };
            // Avatar is kept for cross-device sync
            
            console.log(`📊 Syncing: ${animeData.length} anime, Level ${levelData.level} (${levelData.totalXP} XP)`);
            if (userProfile.avatar) {
                const avatarSize = Math.round(userProfile.avatar.length / 1024);
                console.log(`🖼️ Avatar included (${avatarSize}KB)`);
            }
            
            const allData = {
                animeData: animeData,
                activityLog: activityLog,
                userProfile: cleanUserProfile,  // Avatar included now
                unlockedAchievements: JSON.parse(localStorage.getItem('unlockedAchievements') || '[]'),
                userXpHistory: JSON.parse(localStorage.getItem('userXpHistory') || '[]'),
                animeContributions: JSON.parse(localStorage.getItem('animeContributions') || '{}'),
                appSettings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
                levelData: levelData
            };
            
            const response = await fetch('http://localhost:3000/api/sync/sync-all', {
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
            console.log('⚠️ Cannot load: not logged in');
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
            const response = await fetch('http://localhost:3000/api/sync/load-all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const { data } = result;
                
                // Backup current localStorage
                this.backupLocalData();
                
                // Restore anime data
                if (data.animeData) {
                    localStorage.setItem('animeData', JSON.stringify(data.animeData));
                    if (typeof window.animeData !== 'undefined') {
                        window.animeData = data.animeData;
                    }
                    console.log(`📥 Loaded ${data.animeData.length} anime from cloud`);
                }
                
                // Restore activity log
                if (data.activityLog) {
                    localStorage.setItem('activityLog', JSON.stringify(data.activityLog));
                    if (typeof window.activityLog !== 'undefined') {
                        window.activityLog = data.activityLog;
                    }
                }
                
                // RESTORE LEVEL DATA
                if (data.levelData) {
                    localStorage.setItem('userLevel', data.levelData.level.toString());
                    localStorage.setItem('userLevelTitle', data.levelData.title);
                    localStorage.setItem('userXP', data.levelData.totalXP.toString());
                    localStorage.setItem('userTotalAnime', data.levelData.totalAnime.toString());
                    localStorage.setItem('userTotalHours', data.levelData.totalHours.toString());
                    
                    // Update level-system.js profile
                    if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.saveUserProfile === 'function') {
                        const profile = window.AniPulseLevelSystem.getUserProfile();
                        profile.totalExp = data.levelData.totalXP;
                        profile.level = data.levelData.level;
                        profile.title = data.levelData.title;
                        window.AniPulseLevelSystem.saveUserProfile(profile);
                        window.AniPulseLevelSystem.updateAllLevelUI();
                    }
                    
                    console.log(`📥 Loaded level data: Level ${data.levelData.level} (${data.levelData.totalXP} XP)`);
                }
                
                // RESTORE USER PROFILE WITH AVATAR (sync avatar from cloud)
                if (data.userProfile) {
                    // Get current avatar from localStorage (to keep if cloud doesn't have one)
                    const existingUserProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    const currentAvatar = existingUserProfile.avatar;
                    
                    // Merge cloud data with local avatar (cloud avatar takes priority if exists)
                    const mergedProfile = {
                        ...data.userProfile,
                        avatar: data.userProfile.avatar || currentAvatar
                    };
                    localStorage.setItem('userProfile', JSON.stringify(mergedProfile));
                    
                    if (data.userProfile.avatar) {
                        console.log(`📥 Loaded avatar from cloud`);
                        // Update all avatars on page
                        if (typeof updateAllAvatars === 'function') {
                            updateAllAvatars(data.userProfile.avatar);
                        }
                    }
                }
                
                // Restore other data
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
                
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastCloudSyncTime', this.lastSyncTime);
                
                this.showSyncStatus(`✅ Loaded Level ${data.levelData?.level || 1} from cloud!`, 'success');
                
                // Refresh UI
                if (typeof updateAllComponents === 'function') {
                    updateAllComponents();
                }
                
                // Force level UI update
                if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
                    setTimeout(() => {
                        window.AniPulseLevelSystem.updateAllLevelUI();
                    }, 500);
                }
                
                return { success: true, data };
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