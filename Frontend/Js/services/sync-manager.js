// ============================================
// SYNC MANAGER - Handles LocalStorage to Firebase Sync
// ============================================

class SyncManager {
  constructor() {
    this.api = null;
    this.isSyncing = false;
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || null;
    this.syncQueue = [];
    this.init();
  }
  
  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Start periodic sync every 5 minutes
    setInterval(() => {
      if (navigator.onLine && this.api?.token) {
        this.syncToCloud();
      }
    }, 5 * 60 * 1000);
    
    console.log('🔄 Sync Manager initialized');
  }
  
  setApi(api) {
    this.api = api;
  }
  
  // ============================================
  // UPLOAD ALL LOCAL DATA TO CLOUD
  // ============================================
  
  async uploadAllLocalData() {
    if (!this.api?.token) {
      console.warn('⚠️ Not logged in, cannot upload');
      return { success: false, error: 'Not logged in' };
    }
    
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return { success: false, error: 'Sync in progress' };
    }
    
    this.isSyncing = true;
    this.showSyncNotification('Syncing your data to cloud...', 'info');
    
    try {
      // Collect all local data
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
        }
      };
      
      console.log('📦 Local data collected:', {
        animeCount: localData.animeData.length,
        activityCount: localData.activityLog.length,
        achievementsCount: localData.achievements.length
      });
      
      // Upload to cloud
      const response = await fetch('http://localhost:3000/api/sync/upload-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.api.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update last sync time
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('lastSyncTime', this.lastSyncTime);
        localStorage.setItem('cloudSyncEnabled', 'true');
        
        this.showSyncNotification('✅ All data synced to cloud successfully!', 'success');
        console.log('✅ Full upload completed:', result.results);
        
        return { success: true, results: result.results };
      } else {
        throw new Error(result.error);
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
  // DOWNLOAD DATA FROM CLOUD
  // ============================================
  
  async downloadCloudData() {
    if (!this.api?.token) {
      return { success: false, error: 'Not logged in' };
    }
    
    this.isSyncing = true;
    this.showSyncNotification('Downloading your cloud data...', 'info');
    
    try {
      const response = await fetch('http://localhost:3000/api/sync/download-all', {
        headers: { 'Authorization': `Bearer ${this.api.token}` }
      });
      
      const result = await response.json();
      
      if (result.success) {
        const { data } = result;
        
        // Backup current local data before overwriting
        this.backupLocalData();
        
        // Restore data to localStorage
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
          localStorage.setItem('userProfile', JSON.stringify(data.userProfile));
          localStorage.setItem('userName', data.userProfile.username);
        }
        
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('lastSyncTime', this.lastSyncTime);
        
        this.showSyncNotification(`✅ Downloaded ${data.animeData?.length || 0} anime entries from cloud!`, 'success');
        
        // Refresh UI
        if (typeof updateAllComponents === 'function') {
          updateAllComponents();
        }
        
        return { success: true, data };
      } else {
        throw new Error(result.error);
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
  // SMART SYNC - Merge local and cloud data
  // ============================================
  
  async smartSync() {
    if (!this.api?.token || !navigator.onLine) {
      return { success: false, error: 'Offline or not logged in' };
    }
    
    console.log('🔄 Starting smart sync...');
    
    try {
      // Check cloud status
      const statusResponse = await fetch('http://localhost:3000/api/sync/status', {
        headers: { 'Authorization': `Bearer ${this.api.token}` }
      });
      const status = await statusResponse.json();
      
      const localAnimeCount = JSON.parse(localStorage.getItem('animeData') || '[]').length;
      
      // Determine sync direction
      if (!status.hasCloudData && localAnimeCount > 0) {
        // Local has data, cloud empty → Upload
        console.log('📤 Uploading local data to cloud...');
        return await this.uploadAllLocalData();
        
      } else if (status.hasCloudData && localAnimeCount === 0) {
        // Cloud has data, local empty → Download
        console.log('📥 Downloading cloud data...');
        return await this.downloadCloudData();
        
      } else if (status.hasCloudData && localAnimeCount > 0) {
        // Both have data → Compare and merge
        console.log('🔄 Both have data, checking for conflicts...');
        return await this.mergeDataWithCloud();
        
      } else {
        console.log('ℹ️ No data to sync');
        return { success: true, message: 'No data to sync' };
      }
      
    } catch (error) {
      console.error('❌ Smart sync failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================
  // MERGE DATA - Handle conflicts
  // ============================================
  
  async mergeDataWithCloud() {
    try {
      // Download cloud data
      const cloudResponse = await fetch('http://localhost:3000/api/sync/download-all', {
        headers: { 'Authorization': `Bearer ${this.api.token}` }
      });
      const cloudResult = await cloudResponse.json();
      const cloudAnime = cloudResult.data?.animeData || [];
      
      // Get local data
      const localAnime = JSON.parse(localStorage.getItem('animeData') || '[]');
      
      // Merge logic: Cloud wins for conflicts, but preserve newer local updates
      const mergedAnime = this.mergeAnimeLists(localAnime, cloudAnime);
      
      // Ask user which version to keep
      const mergeChoice = await this.showMergeDialog(localAnime.length, cloudAnime.length);
      
      if (mergeChoice === 'cloud') {
        // Use cloud data
        localStorage.setItem('animeData', JSON.stringify(cloudAnime));
        await this.uploadAllLocalData(); // Re-upload to ensure cloud has latest
        this.showSyncNotification(`✅ Using cloud data (${cloudAnime.length} anime)`, 'success');
      } else if (mergeChoice === 'local') {
        // Use local data
        await this.uploadAllLocalData();
        this.showSyncNotification(`✅ Using local data (${localAnime.length} anime)`, 'success');
      } else {
        // Merge
        localStorage.setItem('animeData', JSON.stringify(mergedAnime));
        await this.uploadAllLocalData();
        this.showSyncNotification(`✅ Merged data (${mergedAnime.length} anime)`, 'success');
      }
      
      // Refresh UI
      if (typeof updateAllComponents === 'function') {
        updateAllComponents();
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Merge failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  mergeAnimeLists(local, cloud) {
    const merged = [...cloud];
    const cloudIds = new Set(cloud.map(a => a.id));
    
    // Add local anime not in cloud
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
              <div class="sync-stat">
                <strong>💻 Local:</strong> ${localCount} anime
              </div>
              <div class="sync-stat">
                <strong>☁️ Cloud:</strong> ${cloudCount} anime
              </div>
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
  // REAL-TIME SYNC - Auto-save changes to cloud
  // ============================================
  
  async saveToCloud(dataType, data) {
    if (!this.api?.token || !navigator.onLine) {
      // Queue for later sync
      this.queueSync(dataType, data);
      return false;
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/sync/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.api.token}`,
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
    if (!navigator.onLine || !this.api?.token) return;
    
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
      
      if (typeof updateAllComponents === 'function') {
        updateAllComponents();
      }
      
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
// INTEGRATION WITH EXISTING CODE
// ============================================

// Hook into existing saveData function
const originalSaveData = window.saveData;
if (originalSaveData) {
  window.saveData = function() {
    originalSaveData();
    
    // Also save to cloud if online
    if (window.syncManager && navigator.onLine && window.api?.token) {
      const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
      window.syncManager.saveToCloud('animeData', animeData);
    }
  };
}

// Auto-sync on login
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in and has cloud sync enabled
  const cloudSyncEnabled = localStorage.getItem('cloudSyncEnabled') === 'true';
  const token = localStorage.getItem('authToken');
  
  if (token && cloudSyncEnabled && navigator.onLine) {
    setTimeout(() => {
      window.syncManager?.smartSync();
    }, 3000);
  }
});