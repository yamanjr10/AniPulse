// ============================================
// FIREBASE CLIENT – Load config from backend ONLY
// ============================================

(function () {
    'use strict';

    let initialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 10;

    // ---- Compute API base URL ----
    const API_BASE_URL = window.API_BASE_URL || (() => {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        return 'https://anipulse-63jv.onrender.com';
    })();

    console.log('🔧 Using API base URL:', API_BASE_URL);

    // ---- Fetch config from backend (NO FALLBACK) ----
    async function loadFirebaseConfig() {
        try {
            const url = `${API_BASE_URL}/api/firebase-config`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const config = await response.json();
            console.log('✅ Firebase config loaded from backend');
            return config;
        } catch (error) {
            console.error('❌ Failed to load Firebase config:', error);
            return null;
        }
    }

    // ---- Initialize Firebase only with backend config ----
    async function initFirebase() {
        if (initialized) return;

        const config = await loadFirebaseConfig();

        if (!config) {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                const delay = Math.min(5000, retryCount * 1000);
                console.log(`⏳ Retrying in ${delay / 1000}s... (attempt ${retryCount}/${MAX_RETRIES})`);
                setTimeout(initFirebase, delay);
            } else {
                console.error('❌ Max retries reached. Please check your backend.');
                // Show a user-friendly error
                const msg = document.getElementById('messageDiv');
                if (msg) {
                    msg.innerHTML = `<div class="error-msg">⚠️ Could not connect to server. Please refresh or try again later.</div>`;
                }
            }
            return;
        }

        // Reset retry count on success
        retryCount = 0;

        if (!firebase.apps.length) {
            firebase.initializeApp(config);
            console.log('✅ Firebase client initialized with backend config');
            initialized = true;
        }

        // ---- Auth State Listener ----
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    localStorage.setItem('authToken', token);
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    if (!storedUser.uid || storedUser.uid !== user.uid) {
                        const userData = {
                            uid: user.uid,
                            email: user.email,
                            username: user.displayName || user.email.split('@')[0],
                            avatar: user.photoURL || null
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                    }
                    console.log('✅ User authenticated:', user.email);
                } catch (error) {
                    console.error('Failed to get ID token:', error);
                }
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                const currentPath = window.location.pathname;
                if (!currentPath.includes('login.html') && !currentPath.includes('index.html')) {
                    window.location.href = '/login.html';
                }
            }
        });

        // ---- Token auto-refresh ----
        setInterval(async () => {
            const user = firebase.auth().currentUser;
            if (user) {
                try {
                    const token = await user.getIdToken(true);
                    localStorage.setItem('authToken', token);
                    console.log('🔄 Firebase token refreshed');
                } catch (error) {
                    console.warn('Token refresh failed:', error);
                }
            }
        }, 10 * 60 * 1000);

        // ---- Expose Firebase globally ----
        window.firebase = firebase;
        window.firebaseAuth = firebase.auth();

        console.log('✅ Firebase Auth listener initialized');
    }

    // Wait for Firebase SDK to load, then start the init process
    if (typeof firebase !== 'undefined') {
        initFirebase();
    } else {
        window.addEventListener('load', () => {
            if (typeof firebase !== 'undefined') {
                initFirebase();
            } else {
                console.error('❌ Firebase SDK not loaded');
            }
        });
    }
})();