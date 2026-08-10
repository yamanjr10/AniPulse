// ============================================
// SYNC MANAGER – Smart sync, conflict resolution, periodic sync
// (No save hook – only dualStorage handles uploads)
// ============================================

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || null;
    this.syncQueue = [];
    this.syncDebounceTimeout = null;
    this.init();
  }

  init() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    setInterval(() => {
      if (navigator.onLine && localStorage.getItem('authToken')) {
        this.syncToCloud();
      }
    }, 10 * 60 * 1000);
    console.log('🔄 Sync Manager initialized');
  }

  syncToCloud() {
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
      this.syncDebounceTimeout = null;
    }
    return new Promise((resolve) => {
      this.syncDebounceTimeout = setTimeout(async () => {
        this.syncDebounceTimeout = null;
        const result = await this.uploadAllLocalData();
        resolve(result);
      }, 2000);
    });
  }

  getDataChecksum() {
    const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
    const sorted = [...animeData].sort((a, b) => (a.id || 0) - (b.id || 0));
    const json = JSON.stringify(sorted);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  getDataChecksumFromArray(data) {
    const sorted = [...data].sort((a, b) => (a.id || 0) - (b.id || 0));
    const json = JSON.stringify(sorted);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  storeMergeDecision(strategy, checksum) {
    localStorage.setItem('mergeStrategy', strategy);
    localStorage.setItem('mergeChecksum', checksum);
  }

  getStoredMergeDecision() {
    return {
      strategy: localStorage.getItem('mergeStrategy') || null,
      checksum: localStorage.getItem('mergeChecksum') || null
    };
  }

  // ============================================
  // UPLOAD ALL LOCAL DATA TO CLOUD
  // ============================================
  async uploadAllLocalData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('⚠️ Not logged in, cannot upload');
      return { success: false, error: 'Not logged in' };
    }
    if (this.isSyncing) return { success: false, error: 'Sync in progress' };

    this.isSyncing = true;
    this.showSyncNotification('Syncing your data to cloud...', 'info');

    try {
      const localData = {
        animeData: JSON.parse(localStorage.getItem('animeData') || '[]'),
        activityLog: JSON.parse(localStorage.getItem('activityLog') || '[]'),
        achievements: JSON.parse(localStorage.getItem('unlockedAchievements') || '[]'),
        xpHistory: JSON.parse(localStorage.getItem('userXpHistory') || '[]'),
        contributions: JSON.parse(localStorage.getItem('animeContributions') || '{}'),
        userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
        levelData: {
          totalXP: parseInt(localStorage.getItem('userXP') || '0'),
          level: parseInt(localStorage.getItem('userLevel') || '1'),
          title: localStorage.getItem('userLevelTitle') || 'Newbie'
        },
        lastModified: new Date().toISOString()
      };

      const response = await fetch(`${window.API_BASE_URL}/api/sync/sync-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('lastSyncTime', this.lastSyncTime);
        localStorage.setItem('cloudSyncEnabled', 'true');
        this.showSyncNotification('✅ All data synced to cloud successfully!', 'success');
        return { success: true, results: result.results };
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      this.showSyncNotification('❌ Failed to sync data. Will retry later.', 'error');
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // ============================================
  // DOWNLOAD DATA FROM CLOUD – with count safety
  // ============================================
  async downloadCloudData() {
    const token = localStorage.getItem('authToken');
    if (!token) return { success: false, error: 'Not logged in' };

    this.isSyncing = true;
    this.showSyncNotification('Downloading your cloud data...', 'info');

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/sync/load-all`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        const { data, lastModified } = result;
        const localAnimeCount = JSON.parse(localStorage.getItem('animeData') || '[]').length;
        const cloudAnimeCount = data.animeData ? data.animeData.length : 0;

        // ---- SAFETY: if local has more anime than cloud, keep local and push to cloud ----
        if (localAnimeCount > cloudAnimeCount) {
          console.log(`📌 Local has ${localAnimeCount} anime, cloud has ${cloudAnimeCount} – keeping local and pushing to cloud.`);
          await this.uploadAllLocalData();
          return { success: true, message: 'Local data kept, cloud updated' };
        }

        // ---- Timestamp check ----
        const localTimestamp = localStorage.getItem('animeDataLastModified');
        if (localTimestamp && lastModified && new Date(localTimestamp) > new Date(lastModified) && localAnimeCount > 0) {
          console.log('📌 Local data is newer than cloud – keeping local and pushing to cloud.');
          await this.uploadAllLocalData();
          return { success: true, message: 'Local data kept, cloud updated' };
        }

        // ---- If cloud is empty but local has data, push local ----
        if ((!data.animeData || data.animeData.length === 0) && localAnimeCount > 0) {
          console.log('📌 Cloud is empty, but local has data – pushing local to cloud.');
          await this.uploadAllLocalData();
          return { success: true, message: 'Local data pushed to cloud' };
        }

        // ---- Otherwise, overwrite local with cloud data ----
        if (data.animeData && data.animeData.length >= localAnimeCount) {
          this.backupLocalData();

          if (data.animeData) {
            localStorage.setItem('animeData', JSON.stringify(data.animeData));
            localStorage.setItem('animeDataLastModified', lastModified || new Date().toISOString());
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
            const existing = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const merged = { ...existing, ...data.userProfile };
            localStorage.setItem('userProfile', JSON.stringify(merged));
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
          localStorage.setItem('lastSyncTime', this.lastSyncTime);
          this.showSyncNotification(`✅ Downloaded ${data.animeData?.length || 0} anime entries from cloud!`, 'success');

          if (typeof updateAllComponents === 'function') updateAllComponents();
          if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.updateAllLevelUI === 'function') {
            setTimeout(() => window.AniPulseLevelSystem.updateAllLevelUI(), 500);
          }
          return { success: true, data };
        } else {
          // Fallback: push local to cloud if local has more or equal data
          console.log(`📤 Local has ${localAnimeCount} anime, cloud has ${cloudAnimeCount} – pushing local to cloud.`);
          await this.uploadAllLocalData();
          return { success: true, message: 'Local data pushed to cloud' };
        }
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('❌ Download failed:', error);
      this.showSyncNotification('❌ Failed to download cloud data', 'error');
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // ============================================
  // SMART SYNC – Once per session
  // ============================================
  async smartSync() {
    if (window._smartSyncDone) {
      console.log('ℹ️ Smart sync already done this session, skipping.');
      return { success: true, message: 'Already synced' };
    }

    const token = localStorage.getItem('authToken');
    if (!token || !navigator.onLine) {
      return { success: false, error: 'Offline or not logged in' };
    }

    console.log('🔄 Starting smart sync...');

    try {
      const statusResponse = await fetch(`${window.API_BASE_URL}/api/sync/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!statusResponse.ok) throw new Error(`Status check failed: ${statusResponse.status}`);
      const status = await statusResponse.json();

      const localAnimeCount = JSON.parse(localStorage.getItem('animeData') || '[]').length;
      const currentChecksum = this.getDataChecksum();

      if (!status.hasCloudData && localAnimeCount > 0) {
        console.log('📤 Uploading local data to cloud...');
        const result = await this.uploadAllLocalData();
        window._smartSyncDone = true;
        return result;
      } else if (status.hasCloudData && localAnimeCount === 0) {
        console.log('📥 Downloading cloud data...');
        const result = await this.downloadCloudData();
        window._smartSyncDone = true;
        return result;
      } else if (status.hasCloudData && localAnimeCount > 0) {
        console.log('🔄 Both have data, checking for conflicts...');

        const stored = this.getStoredMergeDecision();
        if (stored.strategy && stored.checksum === currentChecksum) {
          console.log(`♻️ Using cached merge decision: ${stored.strategy}`);
          if (stored.strategy === 'cloud') {
            const result = await this.downloadCloudData();
            window._smartSyncDone = true;
            return result;
          } else if (stored.strategy === 'local') {
            const result = await this.uploadAllLocalData();
            window._smartSyncDone = true;
            return result;
          } else {
            console.log('✅ Data already merged, no action needed');
            window._smartSyncDone = true;
            return { success: true, message: 'Already merged' };
          }
        }

        const result = await this.mergeDataWithCloud();
        window._smartSyncDone = true;
        return result;
      } else {
        console.log('ℹ️ No data to sync');
        window._smartSyncDone = true;
        return { success: true, message: 'No data to sync' };
      }
    } catch (error) {
      console.error('❌ Smart sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // MERGE DATA
  // ============================================
  async mergeDataWithCloud() {
    try {
      const token = localStorage.getItem('authToken');
      const cloudResponse = await fetch(`${window.API_BASE_URL}/api/sync/load-all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!cloudResponse.ok) throw new Error(`Cloud download failed: ${cloudResponse.status}`);
      const cloudResult = await cloudResponse.json();
      const cloudAnime = cloudResult.data?.animeData || [];

      const localAnime = JSON.parse(localStorage.getItem('animeData') || '[]');
      const currentChecksum = this.getDataChecksum();
      const cloudChecksum = this.getDataChecksumFromArray(cloudAnime);

      if (currentChecksum === cloudChecksum) {
        console.log('✅ Local and cloud data are identical – no merge needed');
        this.storeMergeDecision('merge', currentChecksum);
        return { success: true, message: 'Data already in sync' };
      }

      const mergeChoice = await this.showMergeDialog(localAnime.length, cloudAnime.length);

      if (mergeChoice === 'cloud') {
        localStorage.setItem('animeData', JSON.stringify(cloudAnime));
        await this.uploadAllLocalData();
        this.storeMergeDecision('cloud', currentChecksum);
        this.showSyncNotification(`✅ Using cloud data (${cloudAnime.length} anime)`, 'success');
      } else if (mergeChoice === 'local') {
        await this.uploadAllLocalData();
        this.storeMergeDecision('local', currentChecksum);
        this.showSyncNotification(`✅ Using local data (${localAnime.length} anime)`, 'success');
      } else {
        const mergedAnime = this.mergeAnimeLists(localAnime, cloudAnime);
        localStorage.setItem('animeData', JSON.stringify(mergedAnime));
        await this.uploadAllLocalData();
        this.storeMergeDecision('merge', currentChecksum);
        this.showSyncNotification(`✅ Merged data (${mergedAnime.length} anime)`, 'success');
      }

      if (typeof updateAllComponents === 'function') updateAllComponents();
      return { success: true };
    } catch (error) {
      console.error('❌ Merge failed:', error);
      return { success: false, error: error.message };
    }
  }

  mergeAnimeLists(local, cloud) {
    const merged = [...cloud];
    const cloudIds = new Set(cloud.map(a => a.id));
    local.forEach(anime => {
      if (!cloudIds.has(anime.id)) {
        merged.push(anime);
      }
    });
    return merged;
  }

  showMergeDialog(localCount, cloudCount) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2 class="modal-title">Sync Conflict Detected</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>You have data in both local storage and cloud:</p>
                        <div class="sync-stats">
                            <div class="sync-stat"><strong>💻 Local:</strong> ${localCount} anime</div>
                            <div class="sync-stat"><strong>☁️ Cloud:</strong> ${cloudCount} anime</div>
                        </div>
                        <p>Which version would you like to keep?</p>
                    </div>
                    <div class="form-actions">
                        <button id="keepLocalBtn" class="btn btn-primary">Keep Local</button>
                        <button id="keepCloudBtn" class="btn btn-primary">Keep Cloud</button>
                        <button id="mergeBtn" class="btn btn-secondary">Merge Both</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);

      const closeModal = () => modal.remove();
      modal.querySelector('.close-modal').onclick = closeModal;
      modal.querySelector('#keepLocalBtn').onclick = () => { closeModal(); resolve('local'); };
      modal.querySelector('#keepCloudBtn').onclick = () => { closeModal(); resolve('cloud'); };
      modal.querySelector('#mergeBtn').onclick = () => { closeModal(); resolve('merge'); };
    });
  }

  // ============================================
  // REAL-TIME SYNC (partial updates – fallback)
  // ============================================
  async saveToCloud(dataType, data) {
    const token = localStorage.getItem('authToken');
    if (!token || !navigator.onLine) {
      this.queueSync(dataType, data);
      return false;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/sync/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dataType, data })
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to save to cloud:', error);
      this.queueSync(dataType, data);
      return false;
    }
  }

  queueSync(dataType, data) {
    this.syncQueue.push({ dataType, data, timestamp: Date.now() });
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  async processQueue() {
    if (!navigator.onLine || !localStorage.getItem('authToken')) return;

    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    if (queue.length === 0) return;

    console.log(`📦 Processing ${queue.length} queued items...`);
    for (const item of queue) {
      await this.saveToCloud(item.dataType, item.data);
    }
    localStorage.setItem('syncQueue', '[]');
    this.syncQueue = [];
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  backupLocalData() {
    const backup = {
      timestamp: new Date().toISOString(),
      animeData: localStorage.getItem('animeData'),
      activityLog: localStorage.getItem('activityLog'),
      achievements: localStorage.getItem('unlockedAchievements'),
      userProfile: localStorage.getItem('userProfile')
    };
    localStorage.setItem('localBackup', JSON.stringify(backup));
    console.log('💾 Local data backed up');
  }

  restoreFromBackup() {
    const backup = JSON.parse(localStorage.getItem('localBackup') || '{}');
    if (backup.animeData) {
      localStorage.setItem('animeData', backup.animeData);
      localStorage.setItem('activityLog', backup.activityLog || '[]');
      localStorage.setItem('unlockedAchievements', backup.achievements || '[]');
      localStorage.setItem('userProfile', backup.userProfile || '{}');
      if (typeof updateAllComponents === 'function') updateAllComponents();
      console.log('🔄 Restored from backup');
      return true;
    }
    return false;
  }

  showSyncNotification(message, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  handleOnline() {
    console.log('🟢 Back online! Syncing data...');
    this.processQueue();
    this.smartSync();
  }

  handleOffline() {
    console.log('🔴 Offline mode - changes will be queued');
    this.showSyncNotification('Offline mode. Changes will sync when online.', 'warning');
  }
}

// Initialize sync manager
window.syncManager = new SyncManager();

// ============================================
// ⚠️ REMOVED CONFLICTING SAVE HOOK
// ============================================

console.log('✅ Sync Manager loaded (save hook removed, using dualStorage)');

document.addEventListener('DOMContentLoaded', () => {
  const cloudSyncEnabled = localStorage.getItem('cloudSyncEnabled') === 'true';
  if (localStorage.getItem('authToken') && cloudSyncEnabled && navigator.onLine) {
    if (!window._smartSyncDone) {
      setTimeout(() => window.syncManager?.smartSync(), 3000);
    }
  }
});