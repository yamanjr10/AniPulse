// ============================================
// CONFIG.JS - WITH RATE LIMITING & OPTIMIZATIONS
// ============================================

// Use a unique global variable to track if already initialized
if (!window._apiConfigInitialized) {
    
    const currentHost = window.location.hostname;
    const isProduction = currentHost !== 'localhost' && currentHost !== '127.0.0.1';
    
    const API_BASE_URL = isProduction 
        ? 'https://anipulse-63jv.onrender.com'
        : 'http://localhost:3000';
    
    // Store on window object
    window.API_BASE_URL = API_BASE_URL;
    
    console.log('🔧 Environment:', isProduction ? 'Production' : 'Development');
    console.log('📡 API Base URL:', API_BASE_URL);
    
    // ============================================
    // RATE LIMITER SYSTEM
    // ============================================
    
    class RateLimiter {
        constructor() {
            this.calls = new Map();
            this.defaultLimit = 30; // Max calls per minute
            this.defaultWindow = 60000; // 1 minute window
            this.pendingRequests = new Map();
            this.cache = new Map();
            this.cacheTTL = 30000; // 30 seconds cache
        }
        
        isAllowed(endpoint, limit = this.defaultLimit, windowMs = this.defaultWindow) {
            const now = Date.now();
            const key = endpoint;
            
            if (!this.calls.has(key)) {
                this.calls.set(key, []);
            }
            
            const timestamps = this.calls.get(key);
            
            // Remove old timestamps outside window
            while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
                timestamps.shift();
            }
            
            // Check if limit reached
            if (timestamps.length >= limit) {
                const oldest = timestamps[0];
                const waitTime = (oldest + windowMs) - now;
                if (waitTime > 0) {
                    console.warn(`⏱️ Rate limit reached for ${endpoint}. Wait ${Math.ceil(waitTime / 1000)}s`);
                    return false;
                }
            }
            
            // Add current timestamp
            timestamps.push(now);
            return true;
        }
        
        // Get cached data
        getCache(key) {
            const cached = this.cache.get(key);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
            return null;
        }
        
        // Set cache data
        setCache(key, data) {
            this.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
            // Auto-clear after TTL
            setTimeout(() => {
                if (this.cache.get(key)?.timestamp === Date.now() - this.cacheTTL) {
                    this.cache.delete(key);
                }
            }, this.cacheTTL);
        }
        
        // Debounce API calls
        debounce(endpoint, apiCall, delay = 500) {
            if (this.pendingRequests.has(endpoint)) {
                clearTimeout(this.pendingRequests.get(endpoint));
            }
            
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(async () => {
                    this.pendingRequests.delete(endpoint);
                    try {
                        const result = await apiCall();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }, delay);
                
                this.pendingRequests.set(endpoint, timeoutId);
            });
        }
        
        getStatus(endpoint) {
            const timestamps = this.calls.get(endpoint) || [];
            const remaining = Math.max(0, this.defaultLimit - timestamps.length);
            return {
                remaining,
                used: timestamps.length,
                limit: this.defaultLimit,
                resetIn: timestamps.length > 0 
                    ? (timestamps[0] + this.defaultWindow) - Date.now() 
                    : 0
            };
        }
        
        reset(endpoint) {
            this.calls.delete(endpoint);
            this.pendingRequests.delete(endpoint);
        }
        
        clearCache() {
            this.cache.clear();
        }
    }
    
    // Create global rate limiter instance
    window.rateLimiter = new RateLimiter();
    
    // ============================================
    // OPTIMIZED FETCH WITH RATE LIMITING & CACHING
    // ============================================
    
    if (!window._fetchOverridden) {
        const originalFetch = window.fetch;
        
        window.fetch = async function(url, options = {}) {
            // Handle URL conversion for localhost
            let finalUrl = url;
            if (typeof url === 'string' && url.includes('localhost:3000')) {
                finalUrl = url.replace('http://localhost:3000', window.API_BASE_URL);
            }
            
            // Extract endpoint for rate limiting
            let endpoint = 'unknown';
            if (typeof finalUrl === 'string') {
                // Extract API endpoint path
                const match = finalUrl.match(/\/api\/([^?]+)/);
                if (match) {
                    endpoint = match[1];
                } else {
                    endpoint = finalUrl.split('?')[0].split('/').pop() || 'unknown';
                }
            }
            
            // Skip rate limiting for non-API calls and static assets
            const isApiCall = typeof finalUrl === 'string' && finalUrl.includes('/api/');
            const isStaticAsset = typeof finalUrl === 'string' && (
                finalUrl.includes('.css') || 
                finalUrl.includes('.js') || 
                finalUrl.includes('.json') ||
                finalUrl.includes('.png') ||
                finalUrl.includes('.jpg') ||
                finalUrl.includes('.svg')
            );
            
            // For GET requests, check cache first
            const isGetRequest = !options.method || options.method === 'GET';
            if (isGetRequest && isApiCall && !isStaticAsset) {
                const cachedData = window.rateLimiter.getCache(finalUrl);
                if (cachedData) {
                    console.log(`📦 Cache hit for ${endpoint}`);
                    return new Response(JSON.stringify(cachedData), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Apply rate limiting only to API calls
            if (isApiCall && !isStaticAsset) {
                // Different rate limits for different endpoints
                let limit = 30;
                let windowMs = 60000;
                
                // Stricter limits for certain endpoints
                if (endpoint.includes('search')) {
                    limit = 10;
                    windowMs = 60000;
                } else if (endpoint.includes('notifications') || endpoint.includes('requests')) {
                    limit = 15;
                    windowMs = 60000;
                } else if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
                    limit = 20;
                    windowMs = 60000;
                }
                
                if (!window.rateLimiter.isAllowed(endpoint, limit, windowMs)) {
                    const status = window.rateLimiter.getStatus(endpoint);
                    console.warn(`🚫 Rate limited: ${endpoint}. ${status.remaining} remaining`);
                    
                    // Return cached response if available
                    const cached = window.rateLimiter.getCache(`${finalUrl}_error`);
                    if (cached) {
                        return new Response(JSON.stringify(cached), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // Return rate limit error
                    return new Response(JSON.stringify({ 
                        error: 'Rate limit exceeded. Please try again later.',
                        retryAfter: Math.ceil(status.resetIn / 1000)
                    }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Execute fetch
            try {
                const response = await originalFetch(finalUrl, options);
                
                // Cache successful GET responses
                if (isGetRequest && response.ok && isApiCall && !isStaticAsset) {
                    const clone = response.clone();
                    clone.json().then(data => {
                        window.rateLimiter.setCache(finalUrl, data);
                    }).catch(() => {
                        // Not JSON, don't cache
                    });
                }
                
                return response;
                
            } catch (error) {
                console.error(`❌ Fetch failed for ${endpoint}:`, error);
                
                // Return cached error response if available
                const cached = window.rateLimiter.getCache(`${finalUrl}_error`);
                if (cached) {
                    return new Response(JSON.stringify(cached), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                throw error;
            }
        };
        
        window._fetchOverridden = true;
    }
    
    // ============================================
    // OPTIMIZED API CALL WRAPPERS
    // ============================================
    
    // Debounced API call helper
    window.debouncedApiCall = function(endpoint, apiCall, delay = 500) {
        return window.rateLimiter.debounce(endpoint, apiCall, delay);
    };
    
    // Throttled API call helper
    window.throttledApiCall = async function(endpoint, apiCall, minInterval = 1000) {
        const key = `throttle_${endpoint}`;
        const lastCall = window.rateLimiter.calls.get(key)?.lastCall || 0;
        const now = Date.now();
        
        if (now - lastCall < minInterval) {
            console.log(`⏳ Throttling ${endpoint}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, minInterval - (now - lastCall)));
        }
        
        if (!window.rateLimiter.calls.has(key)) {
            window.rateLimiter.calls.set(key, {});
        }
        window.rateLimiter.calls.get(key).lastCall = now;
        
        return apiCall();
    };
    
    // ============================================
    // OPTIMIZED INTERVAL MANAGEMENT
    // ============================================
    
    window.activeIntervals = new Map();
    
    window.setOptimizedInterval = function(callback, interval, id) {
        // Clear existing interval
        if (window.activeIntervals.has(id)) {
            clearInterval(window.activeIntervals.get(id));
        }
        
        let isRunning = true;
        
        const intervalId = setInterval(() => {
            // Only run when page is visible
            if (!document.hidden && isRunning) {
                callback();
            }
        }, interval);
        
        window.activeIntervals.set(id, intervalId);
        
        // Return cleanup function
        return () => {
            isRunning = false;
            clearInterval(intervalId);
            window.activeIntervals.delete(id);
        };
    };
    
    // ============================================
    // VISIBILITY CHANGE HANDLER
    // ============================================
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('📱 Page hidden - pausing background API calls');
        } else {
            console.log('📱 Page visible - resuming');
            // Trigger refresh of critical data
            setTimeout(() => {
                // Clear some cache to get fresh data
                window.rateLimiter.clearCache();
            }, 1000);
        }
    });
    
    // ============================================
    // BATCH API CALLS FOR FRIENDS
    // ============================================
    
    window.batchFriendsStats = async function(friendIds) {
        if (!friendIds || friendIds.length === 0) return [];
        
        const cacheKey = `batch_stats_${friendIds.join(',')}`;
        const cached = window.rateLimiter.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${window.API_BASE_URL}/api/user/batch-stats?ids=${friendIds.join(',')}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                window.rateLimiter.setCache(cacheKey, data);
                return data;
            }
        } catch (error) {
            console.error('Batch stats failed:', error);
        }
        
        return [];
    };
    
    // ============================================
    // DEBUG HELPERS (only in development)
    // ============================================
    
    if (!isProduction) {
        window.debugRateLimiter = {
            status: () => console.log('Rate Limiter Status:', window.rateLimiter.calls),
            reset: (endpoint) => window.rateLimiter.reset(endpoint),
            clearCache: () => window.rateLimiter.clearCache(),
            getStatus: (endpoint) => window.rateLimiter.getStatus(endpoint)
        };
        console.log('🐛 Debug helpers available: debugRateLimiter');
    }
    
    // Mark as initialized
    window._apiConfigInitialized = true;
    
    console.log('✅ Rate limiting and optimizations enabled');
}