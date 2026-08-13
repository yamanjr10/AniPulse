// ============================================
// COMMUNITY PAGE – Friends, Leaderboard, User Profile
// ============================================

(function () {
    'use strict';

    // ============================================
    // FRIENDS LIST
    // ============================================
    window.loadFriends = async function () {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const friendsList = document.getElementById('friendsList');
        const friendsCount = document.getElementById('friendsCount');
        if (!friendsList) return;

        friendsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading friends...</div>';

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/friends/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load friends');
            const friends = await response.json();
            if (friendsCount) friendsCount.textContent = friends.length;

            if (friends.length === 0) {
                friendsList.innerHTML = '<div class="empty-state">No friends yet. Search for users to add!</div>';
                return;
            }

            friendsList.innerHTML = friends.map(friend => {
                let displayName = friend.name || friend.username;
                if (!displayName || displayName === 'User' || displayName === 'Anime Fan') {
                    const avatarMatch = friend.avatar?.match(/name=([^&]+)/);
                    if (avatarMatch) displayName = decodeURIComponent(avatarMatch[1]);
                    else displayName = 'User';
                }
                const avatarUrl = friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`;
                const title = friend.title || 'Newbie';
                const level = friend.level || 1;

                return `
                    <div class="friend-card" onclick="window.openUserProfile('${friend.uid}')">
                        <img src="${avatarUrl}" class="friend-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff'">
                        <div class="friend-info">
                            <div class="friend-name">${window.escapeHtml(displayName)}</div>
                            <div class="friend-level">${window.escapeHtml(title)} • Lv.${level}</div>
                        </div>
                        <button class="remove-friend-btn" onclick="event.stopPropagation(); window.removeFriend('${friend.uid}')">
                            <i class="fas fa-user-minus"></i>
                        </button>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Failed to load friends:', error);
            friendsList.innerHTML = '<div class="empty-state">Failed to load friends. Please refresh.</div>';
        }
    };

    // ============================================
    // FRIEND REQUESTS
    // ============================================
    window.loadFriendRequests = async function () {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/friends/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const requests = await response.json();
            const requestsSection = document.getElementById('friendRequestsSection');
            const requestsList = document.getElementById('friendRequestsList');
            if (!requestsList) return;

            if (requests.length === 0) {
                if (requestsSection) requestsSection.style.display = 'none';
                return;
            }
            if (requestsSection) requestsSection.style.display = 'block';

            requestsList.innerHTML = requests.map(req => {
                let displayName = req.fromName || req.fromUsername;
                if (!displayName || displayName === 'User' || displayName === 'Anime Fan') {
                    const avatarMatch = req.fromAvatar?.match(/name=([^&]+)/);
                    if (avatarMatch) displayName = decodeURIComponent(avatarMatch[1]);
                    else displayName = 'User';
                }
                const avatarUrl = req.fromAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`;

                return `
                    <div class="friend-request-item">
                        <div class="friend-request-info">
                            <img src="${avatarUrl}" class="friend-request-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff'">
                            <div>
                                <div class="friend-request-name">${window.escapeHtml(displayName)}</div>
                                <div class="friend-request-level">Lv.${req.fromLevel || 1}</div>
                            </div>
                        </div>
                        <div class="friend-request-actions">
                            <button class="btn-accept" onclick="window.acceptFriendRequest('${req.id}')"><i class="fas fa-check"></i> Accept</button>
                            <button class="btn-decline" onclick="window.declineFriendRequest('${req.id}')"><i class="fas fa-times"></i> Decline</button>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Failed to load friend requests:', error);
        }
    };

    // ============================================
    // SEARCH USERS
    // ============================================
    window.searchUsers = async function () {
        const query = document.getElementById('searchUsersInput')?.value.trim();
        if (!query || query.length < 2) {
            if (typeof showToast === 'function') showToast('Please enter at least 2 characters', 'info');
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            if (typeof showToast === 'function') showToast('Please login first', 'error');
            return;
        }
        const resultsList = document.getElementById('searchResultsList');
        if (!resultsList) return;
        resultsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/user/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Search failed');
            const users = await response.json();

            if (users.length === 0) {
                resultsList.innerHTML = '<div class="empty-state">No users found. Try a different name.</div>';
                return;
            }

            resultsList.innerHTML = users.map(user => {
                const displayName = user.name || user.username || 'User';
                const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`;

                return `
                    <div class="search-result-item" onclick="window.openUserProfile('${user.uid}')">
                        <div class="search-result-info">
                            <img src="${avatarUrl}" class="search-result-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff'">
                            <div>
                                <div class="friend-request-name">${window.escapeHtml(displayName)}</div>
                                <div class="friend-request-level">${user.title || 'Newbie'} • Lv.${user.level || 1}</div>
                            </div>
                        </div>
                        <button class="btn-add-friend" onclick="event.stopPropagation(); window.sendFriendRequest('${user.uid}')">
                            <i class="fas fa-user-plus"></i> Add Friend
                        </button>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Search failed:', error);
            resultsList.innerHTML = '<div class="empty-state">Failed to search users. Please try again.</div>';
            if (typeof showToast === 'function') showToast('Search failed. Please try again.', 'error');
        }
    };

    // ============================================
    // FRIEND ACTIONS
    // ============================================
    window.sendFriendRequest = async function (userId) {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/friends/request/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (response.ok) {
                if (typeof showToast === 'function') showToast('Friend request sent!', 'success');
                document.getElementById('searchUsersInput').value = '';
                document.getElementById('searchResultsList').innerHTML = '';
            } else {
                if (typeof showToast === 'function') showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('Failed to send friend request:', error);
            if (typeof showToast === 'function') showToast('Failed to send friend request', 'error');
        }
    };

    window.acceptFriendRequest = async function (requestId) {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/friends/accept/${requestId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                if (typeof showToast === 'function') showToast('Friend request accepted!', 'success');
                window.loadFriendRequests();
                window.loadFriends();
            }
        } catch (error) {
            console.error('Failed to accept request:', error);
        }
    };

    window.declineFriendRequest = async function (requestId) {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/friends/decline/${requestId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                if (typeof showToast === 'function') showToast('Friend request declined', 'info');
                window.loadFriendRequests();
            }
        } catch (error) {
            console.error('Failed to decline request:', error);
        }
    };

    window.removeFriend = async function (friendId) {
        if (!confirm('Remove this friend?')) return;
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/friends/remove/${friendId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                if (typeof showToast === 'function') showToast('Friend removed', 'info');
                window.loadFriends();
            }
        } catch (error) {
            console.error('Failed to remove friend:', error);
        }
    };

    // ============================================
    // USER PROFILE MODAL
    // ============================================
    let _profileUserId = null;

    function safeSetText(id, value, defaultValue = '—') {
        const el = document.getElementById(id);
        if (el) el.textContent = value !== undefined && value !== null ? value : defaultValue;
        return el;
    }

    function safeSetHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html || '';
        return el;
    }

    function renderProfileAnimeList(type, animeList) {
        const containerId = `profile${type.charAt(0).toUpperCase() + type.slice(1)}List`;
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!animeList || animeList.length === 0) {
            container.innerHTML = `<div class="empty-state">No ${type} anime found</div>`;
            return;
        }
        container.innerHTML = animeList.slice(0, 10).map(anime => `
            <div class="profile-anime-card">
                <img src="${anime.cover || 'https://placehold.co/60x85/6a5acd/white?text=No+Image'}" 
                     class="profile-anime-cover" 
                     onerror="this.src='https://placehold.co/60x85/6a5acd/white?text=No+Image'">
                <div class="profile-anime-info">
                    <div class="profile-anime-title">${window.escapeHtml(anime.title)}</div>
                    ${anime.score ? `<div class="profile-anime-score">⭐ ${anime.score}</div>` : ''}
                    <div class="profile-anime-episodes">${anime.episodes || 0} episodes</div>
                </div>
            </div>
        `).join('');
    }

    // Main rendering function (for API data)
    function renderUserProfile(profile) {
        console.log('📝 Rendering user profile...');
        safeSetText('profileName', profile.name || profile.username || 'User');
        safeSetText('profileLevel', `Lv.${profile.level || 1}`);
        safeSetText('profileTitle', profile.levelTitle || profile.title || 'Newbie');

        const xpFillEl = document.getElementById('profileXpFill');
        if (xpFillEl) {
            const progress = Math.min(100, Math.max(0, profile.xpProgress || 0));
            xpFillEl.style.width = `${progress}%`;
        }
        const xpTextEl = document.getElementById('profileXpText');
        if (xpTextEl) {
            const currentXP = profile.totalXP || 0;
            const nextXP = (profile.totalXP + profile.xpToNextLevel) || 1000;
            xpTextEl.innerHTML = `
                <span class="xp-current">${window.formatCompactNumber(currentXP)}</span> / 
                <span class="xp-next">${window.formatCompactNumber(nextXP)}</span> XP
            `;
        }

        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) {
            const avatarUrl = profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
            avatarImg.src = avatarUrl;
            avatarImg.onerror = function () {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
            };
        }

        function updateStatElement(id, value) {
            const el = document.getElementById(id);
            if (el) {
                const num = value || 0;
                el.innerHTML = window.formatCompactNumber(num);
                el.setAttribute('title', num.toLocaleString());
            }
        }
        updateStatElement('profileTotalAnime', profile.stats?.totalAnime);
        updateStatElement('profileCompleted', profile.stats?.completed);
        updateStatElement('profileWatching', profile.stats?.watching);
        updateStatElement('profilePlanToWatch', profile.stats?.planToWatch);
        updateStatElement('profileEpisodes', profile.stats?.totalEpisodes);
        updateStatElement('profileHours', profile.stats?.totalHours);

        const friendBtn = document.getElementById('profileFriendBtn');
        if (friendBtn) {
            if (!profile.isCurrentUser) {
                friendBtn.style.display = 'block';
                if (profile.isFriend) {
                    friendBtn.innerHTML = '<i class="fas fa-user-check"></i> Friends';
                    friendBtn.disabled = true;
                    friendBtn.style.opacity = '0.6';
                    friendBtn.style.cursor = 'not-allowed';
                } else {
                    friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
                    friendBtn.disabled = false;
                    friendBtn.style.opacity = '1';
                    friendBtn.style.cursor = 'pointer';
                    friendBtn.onclick = () => {
                        if (typeof window.sendFriendRequest === 'function') window.sendFriendRequest(profile.uid);
                    };
                }
            } else {
                friendBtn.style.display = 'none';
            }
        }

        renderProfileAnimeList('completed', profile.animeList?.completed || []);
        renderProfileAnimeList('watching', profile.animeList?.watching || []);
        renderProfileAnimeList('plan', profile.animeList?.planToWatch || []);

        // ---- ACHIEVEMENTS (using global definitions) ----
        const achievements = profile.achievements || [];
        const container = document.getElementById('profileAchievementsList');
        if (container) {
            if (achievements.length > 0) {
                const defs = window.ACHIEVEMENTS_DEFINITIONS || [];
                container.innerHTML = achievements.map(achId => {
                    const def = defs.find(d => d.id === achId);
                    const title = def ? def.title : achId;
                    const desc = def ? def.desc : 'Unlocked achievement';
                    const icon = def ? def.icon : 'fa-trophy';
                    return `
                        <div class="profile-achievement-card">
                            <div class="profile-achievement-icon"><i class="fas ${icon}"></i></div>
                            <div class="profile-achievement-info">
                                <div class="profile-achievement-name">${window.escapeHtml(title)}</div>
                                <div class="profile-achievement-desc">${window.escapeHtml(desc)}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = '<div class="empty-state">No achievements unlocked yet</div>';
            }
        }

        const activities = profile.recentActivity || [];
        const activityContainer = document.getElementById('profileActivityList');
        if (activityContainer) {
            if (activities.length > 0) {
                activityContainer.innerHTML = activities.map(activity => {
                    let iconClass = 'added', iconName = 'plus-circle';
                    switch (activity.action) {
                        case 'completed': iconClass = 'completed'; iconName = 'check-circle'; break;
                        case 'added': iconClass = 'added'; iconName = 'plus-circle'; break;
                        case 'edited': iconClass = 'edited'; iconName = 'edit'; break;
                        default: iconClass = 'added'; iconName = 'plus-circle';
                    }
                    return `
                        <div class="profile-activity-item">
                            <div class="profile-activity-icon ${iconClass}">
                                <i class="fas fa-${iconName}"></i>
                            </div>
                            <div class="profile-activity-content">
                                <div class="profile-activity-text">
                                    ${activity.action === 'completed' ? 'Completed' :
                            activity.action === 'added' ? 'Added' : 'Updated'} 
                                    <strong>${window.escapeHtml(activity.animeTitle || 'anime')}</strong>
                                </div>
                                <div class="profile-activity-time">${window.formatTimeAgo(activity.timestamp)}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                activityContainer.innerHTML = '<div class="empty-state">No recent activity</div>';
            }
        }
        console.log('✅ User profile rendered successfully');
    }

    // Fallback render (for when full profile API fails)
    function renderUserProfileWithFallback(profile) {
        console.log('📝 Rendering user profile with fallback data...');
        safeSetText('profileName', profile.name || profile.username || 'User');
        safeSetText('profileLevel', `Lv.${profile.level || 1}`);
        safeSetText('profileTitle', profile.levelTitle || profile.title || 'Newbie');

        const xpFillEl = document.getElementById('profileXpFill');
        if (xpFillEl) {
            const progress = Math.min(100, Math.max(0, profile.xpProgress || 0));
            xpFillEl.style.width = `${progress}%`;
        }
        const xpTextEl = document.getElementById('profileXpText');
        if (xpTextEl) {
            const currentXP = profile.totalXP || 0;
            const nextXP = (profile.totalXP + profile.xpToNextLevel) || 1000;
            xpTextEl.innerHTML = `
                <span class="xp-current">${window.formatCompactNumber(currentXP)}</span> / 
                <span class="xp-next">${window.formatCompactNumber(nextXP)}</span> XP
            `;
        }

        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) {
            const avatarUrl = profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
            avatarImg.src = avatarUrl;
            avatarImg.onerror = function () {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366F1&color=fff`;
            };
        }

        function updateStatElement(id, value) {
            const el = document.getElementById(id);
            if (el) {
                const num = value || 0;
                el.innerHTML = window.formatCompactNumber(num);
                el.setAttribute('title', num.toLocaleString());
            }
        }
        updateStatElement('profileTotalAnime', profile.stats?.totalAnime || 0);
        updateStatElement('profileCompleted', profile.stats?.completed || 0);
        updateStatElement('profileWatching', profile.stats?.watching || 0);
        updateStatElement('profilePlanToWatch', profile.stats?.planToWatch || 0);
        updateStatElement('profileEpisodes', profile.stats?.totalEpisodes || 0);
        updateStatElement('profileHours', profile.stats?.totalHours || 0);

        const friendBtn = document.getElementById('profileFriendBtn');
        if (friendBtn) {
            if (!profile.isCurrentUser) {
                friendBtn.style.display = 'block';
                if (profile.isFriend) {
                    friendBtn.innerHTML = '<i class="fas fa-user-check"></i> Friends';
                    friendBtn.disabled = true;
                    friendBtn.style.opacity = '0.6';
                } else {
                    friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
                    friendBtn.disabled = false;
                    friendBtn.style.opacity = '1';
                    friendBtn.onclick = () => {
                        if (typeof window.sendFriendRequest === 'function') window.sendFriendRequest(profile.uid);
                    };
                }
            } else {
                friendBtn.style.display = 'none';
            }
        }

        renderProfileAnimeList('completed', profile.animeList?.completed || []);
        renderProfileAnimeList('watching', profile.animeList?.watching || []);
        renderProfileAnimeList('plan', profile.animeList?.planToWatch || []);

        // ---- ACHIEVEMENTS (using global definitions) ----
        const achievements = profile.achievements || [];
        const container = document.getElementById('profileAchievementsList');
        if (container) {
            if (achievements.length > 0) {
                const defs = window.ACHIEVEMENTS_DEFINITIONS || [];
                container.innerHTML = achievements.map(achId => {
                    const def = defs.find(d => d.id === achId);
                    const title = def ? def.title : achId;
                    const desc = def ? def.desc : 'Unlocked achievement';
                    const icon = def ? def.icon : 'fa-trophy';
                    return `
                        <div class="profile-achievement-card">
                            <div class="profile-achievement-icon"><i class="fas ${icon}"></i></div>
                            <div class="profile-achievement-info">
                                <div class="profile-achievement-name">${window.escapeHtml(title)}</div>
                                <div class="profile-achievement-desc">${window.escapeHtml(desc)}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = '<div class="empty-state">No achievements unlocked yet</div>';
            }
        }

        const activities = profile.recentActivity || [];
        const activityContainer = document.getElementById('profileActivityList');
        if (activityContainer) {
            if (activities.length > 0) {
                activityContainer.innerHTML = activities.map(activity => {
                    let iconClass = 'added', iconName = 'plus-circle';
                    switch (activity.action) {
                        case 'completed': iconClass = 'completed'; iconName = 'check-circle'; break;
                        case 'added': iconClass = 'added'; iconName = 'plus-circle'; break;
                        case 'edited': iconClass = 'edited'; iconName = 'edit'; break;
                        default: iconClass = 'added'; iconName = 'plus-circle';
                    }
                    return `
                        <div class="profile-activity-item">
                            <div class="profile-activity-icon ${iconClass}">
                                <i class="fas fa-${iconName}"></i>
                            </div>
                            <div class="profile-activity-content">
                                <div class="profile-activity-text">
                                    ${activity.action === 'completed' ? 'Completed' :
                            activity.action === 'added' ? 'Added' : 'Updated'} 
                                    <strong>${window.escapeHtml(activity.animeTitle || 'anime')}</strong>
                                </div>
                                <div class="profile-activity-time">${window.formatTimeAgo(activity.timestamp)}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                activityContainer.innerHTML = '<div class="empty-state">No recent activity</div>';
            }
        }
        console.log('✅ User profile rendered with fallback');
    }

    // Local data render (for current user)
    function renderLocalUserProfile() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');

        const completed = animeData.filter(a => a.userStatus === 'Completed');
        const totalAnime = completed.length;
        let totalEpisodes = 0, totalHours = 0;
        completed.forEach(a => {
            if (a.type === 'Movie') {
                totalEpisodes += 1;
                totalHours += (a.duration || 120) / 60;
            } else {
                const eps = a.episodes || 0;
                totalEpisodes += eps;
                totalHours += (eps * (a.duration || 20)) / 60;
            }
        });
        totalHours = Math.round(totalHours);

        let level = 1, title = 'Newbie', totalXP = 0;
        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
            const profile = window.AniPulseLevelSystem.getUserProfile();
            level = profile.level || 1;
            title = profile.title || 'Newbie';
            totalXP = profile.totalExp || 0;
        } else {
            level = parseInt(localStorage.getItem('userLevel') || '1');
            title = localStorage.getItem('userLevelTitle') || 'Newbie';
            totalXP = parseInt(localStorage.getItem('userXP') || '0');
        }

        const displayName = userProfile.name || user.username || 'You';

        // Load unlocked achievement IDs from localStorage (already stored as IDs)
        let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
        if (!Array.isArray(unlockedAchievements)) unlockedAchievements = [];
        // If old index-based, convert (safety)
        if (unlockedAchievements.length > 0 && typeof unlockedAchievements[0] === 'number') {
            const defs = window.ACHIEVEMENTS_DEFINITIONS || [];
            const newIds = unlockedAchievements.map(idx => defs[idx]?.id).filter(Boolean);
            unlockedAchievements = newIds;
            localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
        }

        const profile = {
            uid: 'current',
            name: displayName,
            avatar: userProfile.avatar || null,
            level: level,
            levelTitle: title,
            totalXP: totalXP,
            stats: {
                totalAnime: totalAnime,
                completed: totalAnime,
                watching: animeData.filter(a => a.userStatus === 'Watching').length,
                planToWatch: animeData.filter(a => a.userStatus === 'Plan to Watch').length,
                dropped: animeData.filter(a => a.userStatus === 'Dropped').length,
                totalEpisodes: totalEpisodes,
                totalHours: totalHours
            },
            animeList: {
                completed: completed.slice(0, 21),
                watching: animeData.filter(a => a.userStatus === 'Watching').slice(0, 21),
                planToWatch: animeData.filter(a => a.userStatus === 'Plan to Watch').slice(0, 21)
            },
            achievements: unlockedAchievements,
            recentActivity: JSON.parse(localStorage.getItem('activityLog') || '[]').slice(0, 10),
            isCurrentUser: true,
            isFriend: false,
            xpProgress: 0,
            xpToNextLevel: 0
        };

        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getXPProgress === 'function') {
            profile.xpProgress = window.AniPulseLevelSystem.getXPProgress(level, totalXP);
            profile.xpToNextLevel = window.AniPulseLevelSystem.getXPToNextLevel(level, totalXP);
        }

        renderUserProfile(profile);
    }

    // Friends fallback (for when profile endpoint fails)
    async function renderFriendsFallback(userId) {
        console.log('📝 Using friends fallback for user:', userId);
        const modal = document.getElementById('userProfileModal');
        if (!modal) return;

        let userData = null;
        let friendsList = [];
        const token = localStorage.getItem('authToken');

        try {
            const friendsResponse = await fetch(`${window.API_BASE_URL}/api/friends/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (friendsResponse.ok) friendsList = await friendsResponse.json();
        } catch (e) { console.warn('Could not fetch friends list:', e); }

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

        if (userId === currentUser.uid || userId === 'current') {
            userData = {
                name: userProfile.name || currentUser.username || 'You',
                avatar: userProfile.avatar || currentUser.avatar,
                level: currentUser.level || 1,
                title: currentUser.title || 'Newbie',
                totalXP: currentUser.totalXP || 0,
                stats: { totalAnime: 0, completed: 0, watching: 0, planToWatch: 0, totalEpisodes: 0, totalHours: 0 },
                isCurrentUser: true,
                achievements: ['🌟 Profile Loaded'],
                recentActivity: [],
                animeList: { completed: [], watching: [], planToWatch: [] }
            };
        } else {
            const foundFriend = friendsList.find(f => f.uid === userId);
            if (foundFriend) {
                userData = {
                    name: foundFriend.name || foundFriend.username || 'Friend',
                    avatar: foundFriend.avatar,
                    level: foundFriend.level || 1,
                    title: foundFriend.title || 'Newbie',
                    totalXP: foundFriend.totalXP || 0,
                    stats: { totalAnime: foundFriend.totalAnime || 0, completed: 0, watching: 0, planToWatch: 0, totalEpisodes: 0, totalHours: 0 },
                    isCurrentUser: false,
                    isFriend: true,
                    achievements: ['👥 Friend'],
                    recentActivity: [],
                    animeList: { completed: [], watching: [], planToWatch: [] }
                };
            } else {
                userData = {
                    name: 'Unknown User',
                    avatar: `https://ui-avatars.com/api/?name=Unknown&background=6366F1&color=fff`,
                    level: 1,
                    title: 'Newbie',
                    totalXP: 0,
                    stats: { totalAnime: 0, completed: 0, watching: 0, planToWatch: 0, totalEpisodes: 0, totalHours: 0 },
                    isCurrentUser: false,
                    isFriend: false,
                    achievements: ['🔍 User Not Found'],
                    recentActivity: [],
                    animeList: { completed: [], watching: [], planToWatch: [] }
                };
            }
        }

        if (friendsList.length > 0) {
            const friendNames = friendsList.slice(0, 3).map(f => f.name || f.username || 'Friend');
            if (friendNames.length > 0) {
                userData.achievements = [
                    ...userData.achievements,
                    `👥 Friends: ${friendNames.join(', ')}${friendsList.length > 3 ? ` +${friendsList.length - 3} more` : ''}`
                ];
            }
        }

        renderUserProfileWithFallback(userData);
        if (typeof showToast === 'function') showToast('Profile loaded with friends fallback', 'info');
    }

    // Open profile modal
    window.openUserProfile = async function (userId) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            if (typeof showToast === 'function') showToast('Please login first', 'error');
            return;
        }
        _profileUserId = userId;

        const modal = document.getElementById('userProfileModal');
        if (!modal) {
            console.error('User profile modal not found');
            if (typeof showToast === 'function') showToast('Profile modal not available', 'error');
            return;
        }

        modal.removeAttribute('hidden');
        modal.classList.add('active', 'show');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        modal.style.zIndex = '10000';

        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = '0';

        safeSetText('profileName', 'Loading...');
        safeSetHTML('profileCompletedList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading anime list...</div>');
        safeSetHTML('profileWatchingList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>');
        safeSetHTML('profilePlanList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>');
        safeSetHTML('profileAchievementsList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading achievements...</div>');
        safeSetHTML('profileActivityList', '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading activity...</div>');

        // Check if viewing own profile
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (userId === currentUser.uid || userId === 'current') {
            renderLocalUserProfile();
            return;
        }

        // For other users
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/user/full-profile/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Full profile endpoint not found, trying fallback...');
                    const fallbackResponse = await fetch(`${window.API_BASE_URL}/api/user/profile/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (fallbackResponse.ok) {
                        const profile = await fallbackResponse.json();
                        renderUserProfileWithFallback(profile);
                        return;
                    }
                    console.warn('Profile endpoints unavailable, using friends fallback...');
                    await renderFriendsFallback(userId);
                    return;
                }
                throw new Error(`Failed to load profile (${response.status})`);
            }

            const profile = await response.json();
            profile.stats = profile.stats || {};
            profile.animeList = profile.animeList || {};
            profile.achievements = profile.achievements || [];
            profile.recentActivity = profile.recentActivity || [];

            renderUserProfile(profile);

        } catch (error) {
            console.error('Failed to load profile:', error);
            if (typeof showToast === 'function') showToast('Failed to load user profile, showing friends instead', 'info');
            await renderFriendsFallback(userId);
        }
    };

    window.closeUserProfileModal = function () {
        const modal = document.getElementById('userProfileModal');
        if (modal) {
            modal.classList.remove('active', 'show');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            modal.setAttribute('hidden', '');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.body.style.top = '';
        }
        _profileUserId = null;
    };

    // Profile tab switching
    document.addEventListener('click', function (e) {
        const tab = e.target.closest('.profile-tab');
        if (!tab) return;
        const tabName = tab.dataset.tab;
        const container = tab.closest('.profile-modal-body');
        if (!container) return;

        container.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const contentMap = {
            'completed': 'profileTabCompleted',
            'watching': 'profileTabWatching',
            'plan': 'profileTabPlan',
            'achievements': 'profileTabAchievements',
            'activity': 'profileTabActivity'
        };
        Object.values(contentMap).forEach(contentId => {
            const content = document.getElementById(contentId);
            if (content) content.classList.remove('active');
        });
        const activeContent = document.getElementById(contentMap[tabName]);
        if (activeContent) activeContent.classList.add('active');
    });

    // ============================================
    // LEADERBOARD
    // ============================================
    class GlobalLeaderboard {
        constructor() {
            this.currentMode = localStorage.getItem('leaderboardMode') || 'friends';
            this.currentStat = localStorage.getItem('leaderboardStat') || 'level';
            this.currentPage = 1;
            this.totalPages = 1;
            this.itemsPerPage = 20;
            this.isLoading = false;
            this.rankings = [];
            this.totalUsers = 0;
            this.currentUserRank = null;
            this.currentUserId = null;
            this.cache = {};
            this.cacheTTL = 60000;
            this.apiUrl = window.API_BASE_URL || 'http://localhost:3000';
            console.log(`🌐 Leaderboard using API: ${this.apiUrl}`);
            console.log(`📌 Restored mode: ${this.currentMode}, stat: ${this.currentStat}`);
            this.init();
        }

        init() {
            this.restoreActiveTab();
            this.restoreActiveFilter();
            this.setupTabs();
            this.setupFilters();
            this.setupPagination();
            this.loadYourStats();
            this.loadLeaderboard(this.currentMode);
        }

        restoreActiveTab() {
            document.querySelectorAll('.leaderboard-mode-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.mode === this.currentMode);
            });
        }

        restoreActiveFilter() {
            document.querySelectorAll('.leaderboard-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.stat === this.currentStat);
            });
        }

        // ---- Load your stats from local data ----
        loadYourStats() {
            console.log('📊 Loading your stats from local data...');

            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');

            const completed = animeData.filter(a => a.userStatus === 'Completed');
            const totalAnime = completed.length;
            let totalEpisodes = 0, totalHours = 0;
            completed.forEach(a => {
                if (a.type === 'Movie') {
                    totalEpisodes += 1;
                    totalHours += (a.duration || 120) / 60;
                } else {
                    const eps = a.episodes || 0;
                    totalEpisodes += eps;
                    totalHours += (eps * (a.duration || 20)) / 60;
                }
            });
            totalHours = Math.round(totalHours);

            let level = 1, title = 'Newbie', totalXP = 0;
            if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
                const profile = window.AniPulseLevelSystem.getUserProfile();
                level = profile.level || 1;
                title = profile.title || 'Newbie';
                totalXP = profile.totalExp || 0;
            } else {
                level = parseInt(localStorage.getItem('userLevel') || '1');
                title = localStorage.getItem('userLevelTitle') || 'Newbie';
                totalXP = parseInt(localStorage.getItem('userXP') || '0');
            }

            const genreCount = {};
            completed.forEach(a => {
                if (a.genres && Array.isArray(a.genres)) {
                    a.genres.forEach(g => {
                        if (g !== 'Award Winning') {
                            genreCount[g] = (genreCount[g] || 0) + 1;
                        }
                    });
                }
            });
            const topGenres = Object.entries(genreCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([g]) => g);

            const stats = {
                name: userProfile.name || user.username || 'You',
                avatar: userProfile.avatar || user.avatar,
                level: level,
                title: title,
                totalXP: totalXP,
                totalAnime: totalAnime,
                totalEpisodes: totalEpisodes,
                totalHours: totalHours,
                topGenres: topGenres
            };

            this.updateYourStatsUI(stats);
        }

        updateYourStatsUI(stats) {
            const update = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value !== undefined && value !== null ? value : '0';
            };
            update('yourTotalXP', window.formatNumberShort(stats.totalXP || 0));
            update('yourTotalAnime', window.formatNumberShort(stats.totalAnime || 0));
            update('yourTotalEpisodes', window.formatNumberShort(stats.totalEpisodes || 0));
            update('yourTotalHours', window.formatNumberShort(stats.totalHours || 0));

            const avatarEl = document.getElementById('yourAvatar');
            if (avatarEl) {
                const displayName = stats.name || 'User';
                const avatarUrl = stats.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff&bold=true&size=200`;
                avatarEl.src = avatarUrl;
                avatarEl.onerror = function () {
                    this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff&bold=true&size=200`;
                };
            }
            const usernameEl = document.getElementById('yourUsername');
            if (usernameEl) usernameEl.textContent = stats.name || 'You';
            const levelEl = document.getElementById('yourLevel');
            if (levelEl) levelEl.textContent = `${stats.title || 'Newbie'} • Lv.${stats.level || 1}`;

            const topGenresEl = document.getElementById('yourTopGenres');
            if (topGenresEl) {
                if (stats.topGenres && stats.topGenres.length > 0) {
                    topGenresEl.innerHTML = stats.topGenres.slice(0, 5).map(g =>
                        `<span class="genre-tag">${window.escapeHtml(g)}</span>`
                    ).join('');
                } else {
                    topGenresEl.innerHTML = '<span class="genre-tag" style="color: rgba(255,255,255,0.4);">No genres yet</span>';
                }
            }
        }

        setupTabs() {
            document.querySelectorAll('.leaderboard-mode-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const mode = tab.dataset.mode;
                    if (mode === this.currentMode) return;
                    document.querySelectorAll('.leaderboard-mode-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.currentMode = mode;
                    localStorage.setItem('leaderboardMode', mode);
                    this.currentPage = 1;
                    this.loadLeaderboard(mode);
                });
            });
        }

        setupFilters() {
            document.querySelectorAll('.leaderboard-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const stat = btn.dataset.stat;
                    if (stat === this.currentStat) return;
                    document.querySelectorAll('.leaderboard-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentStat = stat;
                    localStorage.setItem('leaderboardStat', stat);
                    this.currentPage = 1;
                    this.loadLeaderboard(this.currentMode);
                });
            });
        }

        setupPagination() {
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.leaderboard-page-btn');
                if (!btn) return;
                const page = parseInt(btn.dataset.page);
                if (isNaN(page) || page === this.currentPage) return;
                this.currentPage = page;
                this.loadLeaderboard(this.currentMode);
            });
        }

        async apiCall(endpoint, options = {}) {
            const url = `${this.apiUrl}${endpoint}`;
            const token = localStorage.getItem('authToken');
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                ...options
            };
            try {
                const response = await fetch(url, defaultOptions);
                return response;
            } catch (error) {
                console.error(`API Error (${endpoint}):`, error);
                throw error;
            }
        }

        async loadLeaderboard(mode) {
            if (this.isLoading) return;
            const container = document.getElementById('friendLeaderboardList');
            if (!container) return;

            this.isLoading = true;
            container.innerHTML = this.getLoadingHTML();

            const totalPlayersContainer = document.getElementById('leaderboardTotalPlayersContainer');
            if (totalPlayersContainer) {
                totalPlayersContainer.style.display = mode === 'global' ? 'block' : 'none';
            }

            try {
                if (mode === 'friends') {
                    await this.loadFriendsLeaderboard(container);
                } else {
                    await this.loadGlobalLeaderboard(container);
                }
            } catch (error) {
                console.error('Leaderboard load error:', error);
                container.innerHTML = this.getErrorHTML(error.message);
            } finally {
                this.isLoading = false;
            }
        }

        async loadFriendsLeaderboard(container) {
            const token = localStorage.getItem('authToken');
            if (!token) {
                container.innerHTML = this.getEmptyHTML('Please login to see friends leaderboard');
                return;
            }

            try {
                const friendsResponse = await this.apiCall('/api/friends/list');
                if (!friendsResponse.ok) throw new Error('Failed to load friends');
                const friends = await friendsResponse.json();
                if (!friends || friends.length === 0) {
                    container.innerHTML = this.getEmptyHTML('Add friends to see leaderboard!');
                    return;
                }

                const friendStats = [];
                for (const friend of friends) {
                    try {
                        const statsResponse = await this.apiCall(`/api/user/full-stats/${friend.uid}?period=all`);
                        if (statsResponse.ok) {
                            const stats = await statsResponse.json();
                            friendStats.push({
                                uid: friend.uid,
                                name: stats.name || friend.name,
                                avatar: stats.avatar || friend.avatar,
                                level: stats.level || 1,
                                title: stats.title || 'Newbie',
                                totalXP: stats.totalXP || 0,
                                totalAnime: stats.totalAnime || 0,
                                totalEpisodes: stats.totalEpisodes || 0,
                                totalHours: stats.totalHours || 0,
                                topGenres: stats.topGenres || [],
                                isCurrentUser: false
                            });
                        }
                    } catch (e) { console.warn(`Could not get stats for ${friend.name}:`, e); }
                }

                // Add current user from local data
                const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const animeData = JSON.parse(localStorage.getItem('animeData') || '[]');
                const completed = animeData.filter(a => a.userStatus === 'Completed');
                let totalEpisodes = 0, totalHours = 0;
                completed.forEach(a => {
                    if (a.type === 'Movie') {
                        totalEpisodes += 1;
                        totalHours += (a.duration || 120) / 60;
                    } else {
                        const eps = a.episodes || 0;
                        totalEpisodes += eps;
                        totalHours += (eps * (a.duration || 20)) / 60;
                    }
                });
                totalHours = Math.round(totalHours);

                let level = 1, title = 'Newbie', totalXP = 0;
                if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
                    const profile = window.AniPulseLevelSystem.getUserProfile();
                    level = profile.level || 1;
                    title = profile.title || 'Newbie';
                    totalXP = profile.totalExp || 0;
                } else {
                    level = parseInt(localStorage.getItem('userLevel') || '1');
                    title = localStorage.getItem('userLevelTitle') || 'Newbie';
                    totalXP = parseInt(localStorage.getItem('userXP') || '0');
                }

                const currentUserStats = {
                    uid: 'current',
                    name: userProfile.name || user.username || 'You',
                    avatar: userProfile.avatar || user.avatar,
                    level: level,
                    title: title,
                    totalXP: totalXP,
                    totalAnime: completed.length,
                    totalEpisodes: totalEpisodes,
                    totalHours: totalHours,
                    topGenres: [],
                    isCurrentUser: true
                };

                const allUsers = [currentUserStats, ...friendStats];
                const sorted = this.sortUsers(allUsers);
                this.renderLeaderboard(container, sorted, 'friends');

            } catch (error) {
                console.error('Friends leaderboard error:', error);
                container.innerHTML = this.getErrorHTML('Failed to load friends leaderboard');
            }
        }

        async loadGlobalLeaderboard(container) {
            const token = localStorage.getItem('authToken');
            if (!token) {
                container.innerHTML = this.getEmptyHTML('Please login to see global leaderboard');
                return;
            }

            try {
                const cacheKey = `${this.currentStat}_${this.currentPage}`;
                const cached = this.cache[cacheKey];
                if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
                    console.log('📦 Using cached global leaderboard');
                    const data = cached.data;
                    this.rankings = data.rankings || [];
                    this.totalUsers = data.totalUsers || 0;
                    this.currentUserRank = data.currentUserRank;
                    this.currentUserId = data.currentUserId;
                    this.totalPages = Math.max(1, Math.ceil(this.totalUsers / this.itemsPerPage));
                    this.renderLeaderboard(container, data, 'global');
                    return;
                }

                const limit = Math.max(this.itemsPerPage * 2, 50);
                const response = await this.apiCall(`/api/ranking/global-paginated?limit=${limit}&page=${this.currentPage}&type=${this.currentStat}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to load global leaderboard (${response.status})`);
                }
                const result = await response.json();
                if (!result.rankings || result.rankings.length === 0) {
                    container.innerHTML = this.getEmptyHTML('No users found in global leaderboard');
                    return;
                }

                this.cache[cacheKey] = { data: result, timestamp: Date.now() };
                this.rankings = result.rankings || [];
                this.totalUsers = result.totalUsers || this.rankings.length;
                this.currentUserRank = result.currentUserRank;
                this.currentUserId = result.currentUserId;
                this.totalPages = Math.max(1, Math.ceil(this.totalUsers / this.itemsPerPage));

                this.renderLeaderboard(container, result, 'global');

            } catch (error) {
                console.error('Global leaderboard error:', error);
                container.innerHTML = this.getErrorHTML(error.message);
            }
        }

        sortUsers(users) {
            const statMap = { 'level': 'level', 'xp': 'totalXP', 'anime': 'totalAnime', 'episodes': 'totalEpisodes', 'hours': 'totalHours' };
            const sortField = statMap[this.currentStat] || 'totalXP';
            return users.sort((a, b) => {
                const valA = a[sortField] || 0;
                const valB = b[sortField] || 0;
                if (valA === valB) return (a.name || '').localeCompare(b.name || '');
                return valB - valA;
            });
        }

        renderLeaderboard(container, data, mode) {
            let rankings = data.rankings || data || [];
            if (Array.isArray(data) && !data.rankings) rankings = data;
            if (!Array.isArray(rankings)) rankings = [];
            if (rankings.length === 0) {
                container.innerHTML = this.getEmptyHTML('No users found');
                return;
            }

            const currentUserId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.uid : null;

            let html = '<div class="leaderboard-list">';
            rankings.forEach((user, index) => {
                const rank = user.rank || (index + 1);
                const isTop3 = rank <= 3;
                const rankClass = isTop3 ? `top-${rank}` : '';
                const isCurrentUser = user.isCurrentUser || user.uid === currentUserId || user.uid === 'current';
                const statDisplay = this.getStatDisplay(user);

                let rankIcon = `#${rank}`;
                if (rank === 1) rankIcon = '🥇';
                else if (rank === 2) rankIcon = '🥈';
                else if (rank === 3) rankIcon = '🥉';

                html += `
                    <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}" onclick="window.openUserProfile && window.openUserProfile('${user.uid}')">
                        <div class="leaderboard-rank ${rankClass}">${rankIcon}</div>
                        <div class="leaderboard-user">
                            <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366F1&color=fff`}" 
                                 class="leaderboard-avatar" 
                                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366F1&color=fff'">
                            <div class="leaderboard-info">
                                <div class="leaderboard-name">
                                    ${window.escapeHtml(user.name || 'User')} 
                                    ${isCurrentUser ? '<span class="leaderboard-you-badge">You</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="leaderboard-value">${statDisplay}</div>
                    </div>
                `;
            });
            html += '</div>';

            if (mode === 'global' && this.totalPages > 1) {
                html += this.getPaginationHTML();
            }

            container.innerHTML = html;

            if (mode === 'global') {
                const totalEl = document.getElementById('leaderboardTotalPlayers');
                if (totalEl) totalEl.textContent = this.totalUsers.toLocaleString();
            }
        }

        getStatDisplay(user) {
            const statMap = {
                'level': `Lv.${user.level || 1}`,
                'xp': `${window.formatNumberShort(user.totalXP || 0)} XP`,
                'anime': `${window.formatNumberShort(user.totalAnime || 0)} anime`,
                'episodes': `${window.formatNumberShort(user.totalEpisodes || 0)} eps`,
                'hours': `${window.formatNumberShort(user.totalHours || 0)} hrs`
            };
            return statMap[this.currentStat] || `Lv.${user.level || 1}`;
        }

        getPaginationHTML() {
            const currentPage = this.currentPage;
            const totalPages = this.totalPages;
            const maxVisible = 5;
            let html = '<div class="leaderboard-pagination">';
            html += `<button class="leaderboard-page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>`;

            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            if (startPage > 1) {
                html += `<button class="leaderboard-page-btn" data-page="1">1</button>`;
                if (startPage > 2) html += '<span class="leaderboard-page-dots">…</span>';
            }
            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="leaderboard-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) html += '<span class="leaderboard-page-dots">…</span>';
                html += `<button class="leaderboard-page-btn" data-page="${totalPages}">${totalPages}</button>`;
            }

            html += `<button class="leaderboard-page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>`;
            html += '</div>';
            return html;
        }

        getLoadingHTML() {
            return `<div class="leaderboard-loading"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</div>`;
        }

        getErrorHTML(message) {
            return `
                <div class="leaderboard-empty">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Something went wrong</h4>
                    <p>${window.escapeHtml(message || 'Please try again later')}</p>
                    <button class="leaderboard-retry-btn" onclick="window.globalLeaderboard?.loadLeaderboard('${this.currentMode}')">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }

        getEmptyHTML(message) {
            return `
                <div class="leaderboard-empty">
                    <i class="fas fa-users"></i>
                    <h4>No users to show</h4>
                    <p>${window.escapeHtml(message || 'Check back later')}</p>
                </div>
            `;
        }
    }

    let _leaderboardInstance = null;

    function initLeaderboard() {
        const container = document.getElementById('friendLeaderboardList');
        if (!container) {
            setTimeout(initLeaderboard, 300);
            return;
        }
        if (_leaderboardInstance) {
            const savedMode = localStorage.getItem('leaderboardMode') || 'friends';
            _leaderboardInstance.currentMode = savedMode;
            _leaderboardInstance.loadLeaderboard(savedMode);
            window.globalLeaderboard = _leaderboardInstance;
            return;
        }
        _leaderboardInstance = new GlobalLeaderboard();
        window.globalLeaderboard = _leaderboardInstance;
    }
    window.initLeaderboard = initLeaderboard;

    // ============================================
    // COMMUNITY TABS
    // ============================================
    function initCommunityTabs() {
        const tabs = document.querySelectorAll('.community-tab');
        const contents = document.querySelectorAll('.community-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                contents.forEach(c => c.classList.remove('active'));
                const activeContent = document.getElementById(`community-${tabName}-tab`);
                if (activeContent) activeContent.classList.add('active');

                if (tabName === 'friends') {
                    window.loadFriends();
                    window.loadFriendRequests();
                } else if (tabName === 'leaderboard') {
                    window.initLeaderboard();
                }
            });
        });
    }

    // ============================================
    // INIT COMMUNITY
    // ============================================
    function initCommunityPage() {
        initCommunityTabs();
        window.loadFriends();
        window.loadFriendRequests();

        const searchBtn = document.getElementById('searchUsersBtn');
        if (searchBtn) searchBtn.addEventListener('click', window.searchUsers);
        const searchInput = document.getElementById('searchUsersInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') window.searchUsers();
            });
        }

        const leaderboardTab = document.querySelector('.community-tab[data-tab="leaderboard"]');
        if (leaderboardTab) {
            leaderboardTab.addEventListener('click', () => setTimeout(window.initLeaderboard, 100));
        }

        console.log('✅ Community page initialized');
    }

    window.initCommunityPage = initCommunityPage;
})();