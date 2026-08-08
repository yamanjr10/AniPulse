// ============================================
// API SERVICE – Firebase ID Token Auth (with name fallback)
// ============================================

const API_URL = window.API_BASE_URL ||
    (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://anipulse-63jv.onrender.com');

class AniPulseAPI {
    constructor() {
        // Read user from localStorage with proper name fallback
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        this.user = {
            uid: user.uid,
            name: user.name || user.username || 'User',
            username: user.username || user.name || 'User',
            email: user.email,
            avatar: user.avatar || null,
            level: user.level || 1,
            title: user.title || 'Newbie',
            totalXP: user.totalXP || 0,
            totalAnime: user.totalAnime || 0,
            totalHours: user.totalHours || 0
        };
        this.token = localStorage.getItem('authToken');
        this.saveTimeout = null;
        this.activityTimeout = null;
        this.isSaving = false;
        this.pendingQueue = [];
        console.log('🔧 API Service initialized');
    }

    // ============================================
    // CORE REQUEST METHOD
    // ============================================
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token');
        }

        // Debug token (first 20 chars)
        console.log(`🔑 Token (${endpoint}):`, token.substring(0, 20) + '...');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Try refreshing token
                const user = firebase.auth().currentUser;
                if (user) {
                    try {
                        const newToken = await user.getIdToken(true);
                        localStorage.setItem('authToken', newToken);
                        const retryHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
                        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                            ...options,
                            headers: retryHeaders
                        });
                        if (retryResponse.ok) {
                            const data = await retryResponse.json();
                            return data;
                        }
                    } catch (refreshError) {
                        console.warn('Token refresh failed:', refreshError);
                    }
                }
                // Redirect to login
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = '/login.html';
                }
                throw new Error('Session expired');
            }

            // Handle 429 Too Many Requests
            if (response.status === 429) {
                const errorText = await response.text();
                console.warn('⚠️ Rate limited:', errorText);
                // Queue the request for retry later
                this.queueRequest(endpoint, options);
                return { queued: true, message: 'Rate limited, queued for retry' };
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            return data;

        } catch (error) {
            if (error.message === 'Failed to fetch') {
                console.warn('📦 Network error, queueing request');
                this.queueRequest(endpoint, options);
                if (typeof showToast === 'function') {
                    showToast('Unable to reach server. Please check your internet connection.', 'error');
                }
                return { queued: true };
            }
            throw error;
        }
    }

    // ============================================
    // QUEUE SYSTEM
    // ============================================
    queueRequest(endpoint, options) {
        const queue = JSON.parse(localStorage.getItem('pendingApiRequests') || '[]');
        queue.push({ endpoint, options, timestamp: Date.now() });
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
        localStorage.setItem('pendingApiRequests', JSON.stringify(failedQueue));
        this.pendingQueue = failedQueue;
    }

    // ============================================
    // ANIME LIST OPERATIONS
    // ============================================
    async autoSaveAnimeList(animeList) {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            if (this.isSaving) return;
            this.isSaving = true;
            try {
                const token = localStorage.getItem('authToken');
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
    // ACTIVITY LOG
    // ============================================
    async autoSaveActivity(activities) {
        if (this.activityTimeout) clearTimeout(this.activityTimeout);
        this.activityTimeout = setTimeout(async () => {
            try {
                const token = localStorage.getItem('authToken');
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
    // SYNC
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
    // USER
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
    // AUTH
    // ============================================
    async verifyToken() {
        if (!localStorage.getItem('authToken')) {
            return { valid: false };
        }
        try {
            const data = await this.request('/auth/verify');
            // Update user info if needed
            if (data.user) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.name = data.user.name || data.user.username || user.name;
                user.username = data.user.username || data.user.name || user.username;
                user.avatar = data.user.avatar || user.avatar;
                user.level = data.user.level || user.level;
                user.title = data.user.title || user.title;
                user.totalXP = data.user.totalXP || user.totalXP;
                localStorage.setItem('user', JSON.stringify(user));
            }
            return { valid: true, user: data.user };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    logout() {
        console.log('🚪 Logging out...');
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }).catch(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        });
    }

    isLoggedIn() {
        return !!localStorage.getItem('authToken');
    }
}

// Create global API instance
window.api = new AniPulseAPI();

// Process queue when online
window.addEventListener('online', () => {
    console.log('🟢 Back online, processing queue...');
    window.api.processQueue();
});

document.addEventListener('DOMContentLoaded', () => {
    if (navigator.onLine && window.api.isLoggedIn()) {
        setTimeout(() => window.api.processQueue(), 2000);
    }
});

console.log('✅ API Service loaded');