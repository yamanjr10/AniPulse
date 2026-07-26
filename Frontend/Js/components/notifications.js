// ============================================
// REAL-TIME NOTIFICATION MANAGER
// ============================================

(function () {
    'use strict';

    class RealTimeNotificationManager {
        constructor() {
            this.notifications = [];
            this.unreadCount = 0;
            this.pollingInterval = null;
            this.isDropdownOpen = false;
            this.init();
        }

        init() {
            this.loadAllNotifications();
            this.setupEventListeners();
            this.startPolling();
            this.requestPermission();
        }

        async loadAllNotifications() {
            await this.loadSystemNotifications();
            await this.loadFriendRequests();
        }

        async loadSystemNotifications() {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            try {
                const response = await fetch('http://localhost:3000/api/user/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const systemNotifs = data.notifications || [];
                    const existingFriendReqs = this.notifications.filter(n => n.type === 'friend_request');
                    const allNotifs = [...systemNotifs, ...existingFriendReqs];
                    this.notifications = allNotifs.filter((n, i, arr) =>
                        arr.findIndex(x => x.id === n.id) === i
                    );
                    this.unreadCount = this.notifications.filter(n => !n.read).length;
                    this.renderNotifications();
                    this.updateBadge();
                }
            } catch (error) {
                console.error('Load system notifications error:', error);
            }
        }

        async loadFriendRequests() {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            try {
                const response = await fetch('http://localhost:3000/api/friends/requests', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const requests = await response.json();
                    const requestNotifications = requests.map(req => ({
                        id: req.id,
                        type: 'friend_request',
                        title: 'New Friend Request',
                        message: `${req.fromName} sent you a friend request`,
                        read: false,
                        createdAt: req.createdAt,
                        data: {
                            fromUserId: req.from,
                            fromName: req.fromName,
                            requestId: req.id
                        }
                    }));
                    const otherNotifications = this.notifications.filter(n => n.type !== 'friend_request');
                    const existingIds = new Set(otherNotifications.map(n => n.id));
                    const newRequests = requestNotifications.filter(r => !existingIds.has(r.id));
                    if (newRequests.length > 0) {
                        this.notifications = [...newRequests, ...otherNotifications];
                        this.unreadCount += newRequests.length;
                        this.renderNotifications();
                        this.updateBadge();
                        newRequests.forEach(req => {
                            this.showToast(req.message, 'friend_request');
                        });
                    } else {
                        this.notifications = [...requestNotifications, ...otherNotifications];
                        this.renderNotifications();
                    }
                }
            } catch (error) {
                console.error('Load friend requests error:', error);
            }
        }

        setupEventListeners() {
            const bell = document.getElementById('notificationBell');
            const dropdown = document.getElementById('notificationDropdown');
            if (bell) {
                bell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.isDropdownOpen = !this.isDropdownOpen;
                    if (dropdown) dropdown.style.display = this.isDropdownOpen ? 'block' : 'none';
                });
            }
            document.addEventListener('click', (e) => {
                if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
                    dropdown.style.display = 'none';
                    this.isDropdownOpen = false;
                }
            });
            const markAllBtn = document.getElementById('markAllReadBtn');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', () => this.markAllAsRead());
            }
        }

        renderNotifications() {
            const container = document.getElementById('notificationList');
            if (!container) return;
            if (this.notifications.length === 0) {
                container.innerHTML = `
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>No notifications yet</p>
                    </div>
                `;
                return;
            }
            container.innerHTML = this.notifications.map(notif => {
                const isAccepted = notif.type === 'friend_accepted';
                const acceptedClass = isAccepted ? 'notification-accepted' : '';
                return `
                    <div class="notification-item ${notif.read ? '' : 'unread'} ${acceptedClass}" data-id="${notif.id}" data-type="${notif.type}" data-data='${JSON.stringify(notif.data || {})}'>
                        <div class="notification-icon ${notif.type}">
                            <i class="fas ${this.getIcon(notif.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">${this.escapeHtml(notif.title)}</div>
                            <div class="notification-message">${this.escapeHtml(notif.message)}</div>
                            <div class="notification-time">${this.formatTime(notif.createdAt)}</div>
                            ${notif.type === 'friend_request' && !isAccepted ? `
                                <div class="notification-actions">
                                    <button class="accept" onclick="event.stopPropagation(); notificationManager.acceptFriendRequest('${notif.id}', '${notif.data?.requestId}')">Accept</button>
                                    <button class="decline" onclick="event.stopPropagation(); notificationManager.declineFriendRequest('${notif.id}', '${notif.data?.requestId}')">Decline</button>
                                </div>
                            ` : ''}
                            ${isAccepted ? `
                                <div class="notification-actions">
                                    <button class="view-friend" onclick="event.stopPropagation(); notificationManager.viewFriendProfile('${notif.data?.fromUserId || notif.data?.userId}')">View Friend</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            document.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    const type = item.dataset.type;
                    const data = JSON.parse(item.dataset.data || '{}');
                    this.handleNotificationClick(type, data);
                });
            });
        }

        getIcon(type) {
            const icons = {
                'friend_request': 'fa-user-plus',
                'friend_accepted': 'fa-user-check',
                'achievement': 'fa-trophy',
                'anime_complete': 'fa-check-circle'
            };
            return icons[type] || 'fa-bell';
        }

        formatTime(timestamp) {
            if (!timestamp) return 'Just now';
            const date = new Date(timestamp);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
            if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
            return date.toLocaleDateString();
        }

        escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        updateBadge() {
            const badge = document.getElementById('notificationBadge');
            if (this.unreadCount > 0) {
                if (badge) {
                    badge.style.display = 'flex';
                    badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                }
                const bell = document.getElementById('notificationBell');
                if (bell) {
                    bell.classList.add('has-notifications');
                    setTimeout(() => bell.classList.remove('has-notifications'), 500);
                }
            } else {
                if (badge) badge.style.display = 'none';
            }
        }

        async markAllAsRead() {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            try {
                await fetch('http://localhost:3000/api/user/notifications/mark-read', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ markAll: true })
                });
                this.notifications.forEach(n => n.read = true);
                this.unreadCount = 0;
                this.renderNotifications();
                this.updateBadge();
            } catch (error) {
                console.error('Mark all read error:', error);
            }
        }

        async acceptFriendRequest(notificationId, requestId) {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            const acceptBtn = document.querySelector(`.notification-item[data-id="${notificationId}"] .accept`);
            if (acceptBtn) { acceptBtn.textContent = 'Accepting...'; acceptBtn.disabled = true; }
            try {
                const response = await fetch(`http://localhost:3000/api/friends/accept/${requestId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const notification = this.notifications.find(n => n.id === notificationId);
                    const friendName = notification?.data?.fromName || 'your new friend';
                    const updatedNotification = {
                        id: notificationId + '_accepted',
                        type: 'friend_accepted',
                        title: '✓ Friend Request Accepted',
                        message: `You are now friends with ${friendName}! 🎉`,
                        read: false,
                        createdAt: new Date().toISOString(),
                        data: { ...notification?.data, status: 'accepted' }
                    };
                    const index = this.notifications.findIndex(n => n.id === notificationId);
                    if (index !== -1) {
                        this.notifications[index] = updatedNotification;
                    }
                    this.showToast(`You are now friends with ${friendName}! 🎉`, 'friend_accepted');
                    this.renderNotifications();
                    this.updateBadge();
                    if (typeof window.loadFriends === 'function') await window.loadFriends();
                    setTimeout(() => {
                        const dropdown = document.getElementById('notificationDropdown');
                        if (dropdown) dropdown.style.display = 'none';
                        this.isDropdownOpen = false;
                    }, 2000);
                } else {
                    this.showToast('Failed to accept friend request', 'error');
                    if (acceptBtn) { acceptBtn.textContent = 'Accept'; acceptBtn.disabled = false; }
                }
            } catch (error) {
                console.error('Accept error:', error);
                this.showToast('Error accepting friend request', 'error');
                if (acceptBtn) { acceptBtn.textContent = 'Accept'; acceptBtn.disabled = false; }
            }
        }

        async declineFriendRequest(notificationId, requestId) {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            const declineBtn = document.querySelector(`.notification-item[data-id="${notificationId}"] .decline`);
            if (declineBtn) { declineBtn.textContent = 'Declining...'; declineBtn.disabled = true; }
            try {
                const response = await fetch(`http://localhost:3000/api/friends/decline/${requestId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    this.notifications = this.notifications.filter(n => n.id !== notificationId);
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.showToast('Friend request declined', 'info');
                    this.renderNotifications();
                    this.updateBadge();
                    setTimeout(() => {
                        const dropdown = document.getElementById('notificationDropdown');
                        if (dropdown) dropdown.style.display = 'none';
                        this.isDropdownOpen = false;
                    }, 1500);
                } else {
                    this.showToast('Failed to decline friend request', 'error');
                    if (declineBtn) { declineBtn.textContent = 'Decline'; declineBtn.disabled = false; }
                }
            } catch (error) {
                console.error('Decline error:', error);
                this.showToast('Error declining friend request', 'error');
                if (declineBtn) { declineBtn.textContent = 'Decline'; declineBtn.disabled = false; }
            }
        }

        viewFriendProfile(userId) {
            if (userId && typeof window.openUserProfile === 'function') {
                window.openUserProfile(userId);
            }
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) dropdown.style.display = 'none';
            this.isDropdownOpen = false;
        }

        handleNotificationClick(type, data) {
            switch (type) {
                case 'anime_complete':
                    if (data?.animeId) window.location.href = `/anime/${data.animeId}`;
                    break;
                case 'friend_accepted':
                    this.showToast(`${data?.userName || 'Someone'} is now your friend! 🎉`, 'friend_accepted');
                    if (typeof window.loadFriends === 'function') window.loadFriends();
                    break;
            }
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) dropdown.style.display = 'none';
            this.isDropdownOpen = false;
        }

        showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            const icons = {
                friend_request: 'fa-user-plus',
                friend_accepted: 'fa-user-check',
                achievement: 'fa-trophy',
                anime_complete: 'fa-check-circle',
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };
            const titles = {
                friend_request: 'Friend Request',
                friend_accepted: 'Friend Added',
                achievement: 'Achievement Unlocked!',
                anime_complete: 'Anime Completed',
                success: 'Success',
                error: 'Error',
                info: 'Notification'
            };
            toast.innerHTML = `
                <div class="toast-icon"><i class="fas ${icons[type] || 'fa-bell'}"></i></div>
                <div class="toast-content">
                    <div class="toast-title">${titles[type] || 'Notification'}</div>
                    <div class="toast-message">${this.escapeHtml(message)}</div>
                </div>
                <button class="toast-close">&times;</button>
            `;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'toastSlideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.style.animation = 'toastSlideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            });
            toast.addEventListener('click', () => {
                if (type === 'friend_request') document.getElementById('notificationBell').click();
                toast.remove();
            });
        }

        startPolling() {
            this.pollingInterval = setInterval(() => {
                this.loadFriendRequests();
                this.loadSystemNotifications();
            }, 10000);
        }

        requestPermission() {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        async refresh() {
            await this.loadAllNotifications();
            console.log('✅ Notifications refreshed');
        }
    }

    // Singleton instance
    let notificationManager;

    function initNotifications() {
        if (!notificationManager) {
            notificationManager = new RealTimeNotificationManager();
            window.notificationManager = notificationManager;
        }
        console.log('✅ Notifications initialized');
    }

    window.initNotifications = initNotifications;
    window.notificationManager = notificationManager;

    // Auto-init if main doesn't call.
})();