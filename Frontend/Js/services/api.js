// ============================================
// API SERVICE - Backend Communication
// ============================================

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

class AniPulseAPI {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.saveTimeout = null;
        this.activityTimeout = null;
        this.isSaving = false;
        this.pendingQueue = [];
        
        console.log('🔧 API Service initialized');
        if (this.token) {
            console.log('✅ Token found in localStorage');
        }
    }
    
    // ============================================
    // CORE REQUEST METHOD
    // ============================================
    
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Use token from property or localStorage
        const token = this.token || localStorage.getItem('authToken');
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });
            
            // Handle unauthorized
            if (response.status === 401) {
                console.warn('⚠️ Token expired or invalid');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                this.token = null;
                
                // Don't redirect if we're on login page
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = '/login.html';
                }
                throw new Error('Session expired');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
            
        } catch (error) {
            // Network error - queue for later
            if (error.message === 'Failed to fetch') {
                console.warn('📦 Network error, queueing request');
                this.queueRequest(endpoint, options);
                return { queued: true };
            }
            throw error;
        }
    }
    
    // ============================================
    // QUEUE SYSTEM FOR OFFLINE MODE
    // ============================================
    
    queueRequest(endpoint, options) {
        const queue = JSON.parse(localStorage.getItem('pendingApiRequests') || '[]');
        queue.push({
            endpoint,
            options,
            timestamp: Date.now()
        });
        localStorage.setItem('pendingApiRequests', JSON.stringify(queue));
        this.pendingQueue = queue;
        console.log(`📦 Request queued (${queue.length} total)`);
    }
    
    async processQueue() {
        if (!navigator.onLine) return;
        
        const queue = JSON.parse(localStorage.getItem('pendingApiRequests') || '[]');
        if (queue.length === 0) return;
        
        console.log(`📦 Processing ${queue.length} queued API requests`);
        
        const failedQueue = [];
        
        for (const item of queue) {
            try {
                await this.request(item.endpoint, item.options);
                console.log(`✅ Processed queued request: ${item.endpoint}`);
            } catch (error) {
                console.error(`❌ Failed to process: ${item.endpoint}`, error);
                failedQueue.push(item);
            }
        }
        
        // Keep failed requests for next time
        localStorage.setItem('pendingApiRequests', JSON.stringify(failedQueue));
        this.pendingQueue = failedQueue;
    }
    
    // ============================================
    // ANIME LIST OPERATIONS
    // ============================================
    
    async autoSaveAnimeList(animeList) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(async () => {
            if (this.isSaving) return;
            
            this.isSaving = true;
            
            try {
                const token = this.token || localStorage.getItem('authToken');
                if (!token) {
                    console.log('⚠️ No token, skipping auto-save');
                    return;
                }
                
                await this.request('/anime/save', {
                    method: 'POST',
                    body: JSON.stringify({ animeList })
                });
                console.log('✅ Auto-saved anime list to cloud');
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
            } finally {
                this.isSaving = false;
            }
        }, 2000);
    }
    
    async loadAnimeList() {
        const data = await this.request('/anime/load');
        return data.animeList || [];
    }
    
    async saveAnimeList(animeList) {
        const data = await this.request('/anime/save', {
            method: 'POST',
            body: JSON.stringify({ animeList })
        });
        return data;
    }
    
    // ============================================
    // ACTIVITY LOG OPERATIONS
    // ============================================
    
    async autoSaveActivity(activities) {
        if (this.activityTimeout) {
            clearTimeout(this.activityTimeout);
        }
        
        this.activityTimeout = setTimeout(async () => {
            try {
                const token = this.token || localStorage.getItem('authToken');
                if (!token) {
                    console.log('⚠️ No token, skipping activity save');
                    return;
                }
                
                await this.request('/anime/save-activity', {
                    method: 'POST',
                    body: JSON.stringify({ activities })
                });
                console.log('✅ Auto-saved activity log to cloud');
            } catch (error) {
                console.error('❌ Auto-save activity failed:', error);
            }
        }, 2000);
    }
    
    async loadActivityLog() {
        const data = await this.request('/anime/load-activity');
        return data.activities || [];
    }
    
    // ============================================
    // SYNC OPERATIONS
    // ============================================
    
    async syncAllData(allData) {
        const data = await this.request('/sync/sync-all', {
            method: 'POST',
            body: JSON.stringify(allData)
        });
        return data;
    }
    
    async loadAllData() {
        const data = await this.request('/sync/load-all');
        return data.data || {};
    }
    
    async getSyncStatus() {
        try {
            const data = await this.request('/sync/status');
            return data;
        } catch (error) {
            return { hasCloudData: false, error: error.message };
        }
    }
    
    // ============================================
    // USER OPERATIONS
    // ============================================
    
    async getProfile() {
        const data = await this.request('/auth/profile');
        return data;
    }
    
    async updateProfile(updates) {
        const data = await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        return data;
    }
    
    // ============================================
    // AUTHENTICATION
    // ============================================
    
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('✅ Login successful, token saved');
        }
        
        return data;
    }
    
    async register(email, password, username) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username })
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('✅ Registration successful, token saved');
        }
        
        return data;
    }
    
    async verifyToken() {
        if (!this.token && !localStorage.getItem('authToken')) {
            return { valid: false };
        }
        
        try {
            const data = await this.request('/auth/verify');
            return { valid: true, user: data.user };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    logout() {
        console.log('🚪 Logging out...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.token = null;
        window.location.href = '/login.html';
    }
    
    // ============================================
    // UTILITY
    // ============================================
    
    isLoggedIn() {
        const token = this.token || localStorage.getItem('authToken');
        return !!token;
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Create global API instance
window.api = new AniPulseAPI();

// Process queue when online
window.addEventListener('online', () => {
    console.log('🟢 Back online, processing queue...');
    window.api.processQueue();
});

// Also process queue on page load
document.addEventListener('DOMContentLoaded', () => {
    if (navigator.onLine && window.api.isLoggedIn()) {
        setTimeout(() => {
            window.api.processQueue();
        }, 2000);
    }
});

// Log initialization status
console.log('✅ API Service loaded');
if (window.api.isLoggedIn()) {
    console.log('✅ User is logged in');
} else {
    console.log('ℹ️ User not logged in');
}