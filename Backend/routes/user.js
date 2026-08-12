﻿const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const { getLevelFromXP, getTitleForLevel, getXPToNextLevel, getXPProgress } = require('../utils/levelSystem');

const router = express.Router();

// Helper to get anime list for a user
async function getUserAnimeList(userId) {
  try {
    let animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    if (animeDoc.exists) {
      const data = animeDoc.data();
      if (data.animeList && Array.isArray(data.animeList)) return data.animeList;
    }
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (userDoc.exists && userDoc.data().animeList) return userDoc.data().animeList;
    return [];
  } catch (error) {
    console.error(`Error getting anime list for ${userId}:`, error);
    return [];
  }
}

// Get my stats
router.get('/my-stats', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data() || {};
    const displayName = userData.name || userData.username || 'User';

    // Recalculate level and title from totalXP
    const totalXP = userData.totalXP || 0;
    const level = getLevelFromXP(totalXP);
    const title = getTitleForLevel(level);

    res.json({
      uid: userId,
      username: displayName,
      name: displayName,
      avatar: userData.avatar || null,
      level: level,
      title: title,
      totalXP: totalXP,
      totalAnime: userData.totalAnime || 0,
      totalHours: userData.totalHours || 0
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile by ID
router.get('/profile/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const userData = userDoc.data();
    const displayName = userData.name || userData.username || 'Anime Fan';

    // Calculate totals if missing
    let totalAnime = userData.totalAnime || 0;
    let totalHours = userData.totalHours || 0;
    let totalEpisodes = 0;
    if (totalAnime === 0) {
      const animeList = await getUserAnimeList(userId);
      const completed = animeList.filter(a => a.userStatus === 'Completed');
      totalAnime = completed.length;
      let minutes = 0;
      completed.forEach(a => {
        if (a.type === 'Movie') {
          minutes += a.duration || 120;
          totalEpisodes += 1;
        } else {
          const eps = a.episodes || 0;
          totalEpisodes += eps;
          minutes += eps * (a.duration || 20);
        }
      });
      totalHours = Math.round(minutes / 60);
    }

    // Recalculate level and title from totalXP
    const totalXP = userData.totalXP || 0;
    const level = getLevelFromXP(totalXP);
    const title = getTitleForLevel(level);

    res.json({
      uid: userId,
      name: displayName,
      username: displayName,
      avatar: userData.avatar || null,
      level: level,
      title: title,
      totalXP: totalXP,
      totalAnime,
      totalEpisodes,
      totalHours
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search', verifyToken, async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.userId;
  if (!q || q.length < 2) return res.json([]);
  try {
    const snapshot = await db.collection(COLLECTIONS.USER_PROFILES).limit(100).get();
    const users = [];
    const searchLower = q.toLowerCase();
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      let displayName = userData.name || userData.username;
      if (!displayName) {
        const match = userData.avatar?.match(/name=([^&]+)/);
        if (match) displayName = decodeURIComponent(match[1]);
      }
      if (displayName && displayName.toLowerCase().includes(searchLower) && doc.id !== currentUserId) {
        // Recalc level/title from their totalXP
        const totalXP = userData.totalXP || 0;
        const level = getLevelFromXP(totalXP);
        const title = getTitleForLevel(level);
        users.push({
          uid: doc.id,
          name: displayName,
          username: displayName,
          title: title,
          level: level,
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`
        });
      }
    }
    res.json(users.slice(0, 20));
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Full stats with episodes and genres
router.get('/full-stats/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { period = 'all' } = req.query;
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data() || {};
    const animeList = await getUserAnimeList(userId);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const completed = animeList.filter(a => a.userStatus === 'Completed');
    const filtered = completed.filter(a => {
      let finishDate = a.finishDate ? new Date(a.finishDate) : (a.completedTimestamp ? new Date(a.completedTimestamp) : (a.updatedAt ? new Date(a.updatedAt) : null));
      if (!finishDate) return period === 'all';
      if (period === 'week') return finishDate >= currentWeekStart;
      if (period === 'month') return finishDate.getMonth() === currentMonth && finishDate.getFullYear() === currentYear;
      if (period === 'year') return finishDate.getFullYear() === currentYear;
      return true;
    });

    let totalXP = 0, totalEpisodes = 0, totalHours = 0;
    const genreCount = {};
    filtered.forEach(a => {
      let eps = a.type === 'Movie' ? 1 : (a.episodes || 0);
      totalEpisodes += eps;
      let hrs = a.type === 'Movie' ? (a.duration || 120) / 60 : (eps * (a.duration || 20)) / 60;
      totalHours += hrs;
      const scoreBonus = a.score ? (a.score >= 9 ? 8 : a.score >= 8 ? 5 : a.score >= 7 ? 3 : 0) : 0;
      const epBonus = Math.floor(eps / 2);
      totalXP += epBonus + scoreBonus + 10;
      if (a.genres && Array.isArray(a.genres)) {
        a.genres.forEach(g => genreCount[g] = (genreCount[g] || 0) + 1);
      }
    });

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g);

    const displayName = userData.name || userData.username || 'User';

    // Recalculate level and title from stored totalXP
    const storedTotalXP = userData.totalXP || 0;
    const level = getLevelFromXP(storedTotalXP);
    const title = getTitleForLevel(level);

    res.json({
      uid: userId,
      name: displayName,
      username: displayName,
      avatar: userData.avatar || null,
      level: level,
      title: title,
      totalXP: Math.round(storedTotalXP),
      totalAnime: filtered.length,
      totalEpisodes,
      totalHours: Math.round(totalHours),
      topGenres
    });
  } catch (error) {
    console.error('Full stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get avatar (public)
router.get('/avatar/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data();
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=6366F1&color=fff&bold=true&length=2&size=200`;
    res.json({ avatar: userData?.avatar || defaultAvatar, hasCustom: !!userData?.avatar });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Full profile (for social view)
router.get('/full-profile/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userId;
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const userData = userDoc.data();
    const displayName = userData.name || userData.username || 'Anime Fan';

    const animeList = await getUserAnimeList(userId);
    const sorted = [...animeList].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    const completed = sorted.filter(a => a.userStatus === 'Completed');
    const watching = sorted.filter(a => a.userStatus === 'Watching');
    const plan = sorted.filter(a => a.userStatus === 'Plan to Watch');
    const dropped = sorted.filter(a => a.userStatus === 'Dropped');

    let totalEpisodes = 0, totalMinutes = 0;
    completed.forEach(a => {
      if (a.type === 'Movie') { totalMinutes += a.duration || 120; totalEpisodes += 1; }
      else { const eps = a.episodes || 0; totalEpisodes += eps; totalMinutes += eps * (a.duration || 20); }
    });
    const totalHours = Math.round(totalMinutes / 60);

    const achievementsDoc = await db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).get();
    const unlocked = achievementsDoc.exists ? achievementsDoc.data().unlocked || [] : [];

    const totalXP = userData.totalXP || 0;
    const level = getLevelFromXP(totalXP);
    const levelTitle = getTitleForLevel(level);
    const nextXP = getXPToNextLevel(level, totalXP);
    const progress = getXPProgress(level, totalXP);

    let isFriend = false;
    if (currentUserId !== userId) {
      const fDoc = await db.collection(COLLECTIONS.FRIENDS).doc(currentUserId).get();
      const fList = fDoc.data()?.friends || [];
      isFriend = fList.includes(userId);
    }

    const activityDoc = await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).get();
    const recentActivity = activityDoc.exists ? (activityDoc.data().activities || []).slice(0, 10) : [];

    res.json({
      uid: userId,
      name: displayName,
      avatar: userData.avatar || null,
      level,
      levelTitle,
      totalXP,
      xpProgress: Math.min(100, Math.max(0, progress)),
      xpToNextLevel: Math.max(0, nextXP),
      nextLevelTitle: getTitleForLevel(level + 1),
      stats: {
        totalAnime: animeList.length,
        completed: completed.length,
        watching: watching.length,
        planToWatch: plan.length,
        dropped: dropped.length,
        totalHours,
        totalEpisodes
      },
      animeList: {
        completed: completed.slice(0, 21),
        watching: watching.slice(0, 21),
        planToWatch: plan.slice(0, 21)
      },
      achievements: unlocked,
      recentActivity,
      isFriend,
      isCurrentUser: currentUserId === userId
    });
  } catch (error) {
    console.error('Full profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== NOTIFICATION SYSTEM ==========
router.get('/notifications', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const doc = await db.collection('notifications').doc(userId).get();
    let notifications = doc.exists ? doc.data().notifications || [] : [];
    const unreadCount = notifications.filter(n => !n.read).length;
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ notifications: notifications.slice(0, 50), unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/mark-read', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { notificationId, markAll } = req.body;
  try {
    const ref = db.collection('notifications').doc(userId);
    const doc = await ref.get();
    if (doc.exists) {
      let notifications = doc.data().notifications || [];
      if (markAll) {
        notifications = notifications.map(n => ({ ...n, read: true }));
      } else if (notificationId) {
        notifications = notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        );
      }
      await ref.set({ notifications }, { merge: true });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create notification (exported for other routes)
async function createNotification(userId, type, title, message, data = null) {
  try {
    const ref = db.collection('notifications').doc(userId);
    const doc = await ref.get();
    let notifications = doc.exists ? doc.data().notifications || [] : [];

    // Duplicate prevention (10s window)
    const now = Date.now();
    const isDuplicate = notifications.some(existing => {
      if (existing.type !== type) return false;
      if (type === 'friend_accepted' && existing.data?.userId === data?.userId) {
        return (now - new Date(existing.createdAt).getTime()) < 10000;
      }
      if (type === 'friend_request' && existing.data?.fromUserId === data?.fromUserId) {
        return (now - new Date(existing.createdAt).getTime()) < 10000;
      }
      return false;
    });
    if (isDuplicate) return null;

    const newNotification = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      title,
      message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotification);
    if (notifications.length > 100) notifications = notifications.slice(0, 100);
    await ref.set({ notifications }, { merge: true });
    return newNotification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}
module.exports.createNotification = createNotification;

module.exports = router;