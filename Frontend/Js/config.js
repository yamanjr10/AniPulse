// Use a unique global variable to track if already initialized
if (!window._apiConfigInitialized) {
    
    const currentHost = window.location.hostname;
    const isProduction = currentHost !== 'localhost' && currentHost !== '127.0.0.1';
    
    const API_BASE_URL = isProduction 
        ? 'https://anipulse-63jv.onrender.com'
        : 'http://localhost:3000';
    
    // Store on window object instead of using const
    window.API_BASE_URL = API_BASE_URL;
    
    console.log('🔧 Environment:', isProduction ? 'Production' : 'Development');
    console.log('📡 API Base URL:', API_BASE_URL);
    
    // Override fetch only once
    if (!window._fetchOverridden) {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && url.includes('localhost:3000')) {
                url = url.replace('http://localhost:3000', window.API_BASE_URL);
                console.log('🔄 Redirected API call to:', url);
            }
            return originalFetch(url, options);
        };
        window._fetchOverridden = true;
    }
    
    // Mark as initialized
    window._apiConfigInitialized = true;
}