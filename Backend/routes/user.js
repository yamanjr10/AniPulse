﻿const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { verifyToken } = require('./auth');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.uid;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Helper function to get anime list for a user
async function getUserAnimeList(userId) {
  try {
    let animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    
    if (animeDoc.exists) {
      const data = animeDoc.data();
      if (data.animeList && Array.isArray(data.animeList)) {
        return data.animeList;
      }
    }
    
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.animeList && Array.isArray(userData.animeList)) {
        return userData.animeList;
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Error getting anime list for ${userId}:`, error);
    return [];
  }
}

// Get current user's stats
router.get('/my-stats', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    }
    const userData = userDoc.data() || {};
    
    let displayName = userData.name || userData.username;
    if (!displayName || displayName === 'User') {
      const avatarMatch = userData.avatar?.match(/name=([^&]+)/);
      if (avatarMatch) displayName = decodeURIComponent(avatarMatch[1]);
      else displayName = 'User';
    }
    
    res.json({
      uid: userId,
      username: displayName,
      name: displayName,
      avatar: userData.avatar || null,
      level: userData.level || 1,
      title: userData.title || 'Newbie',
      totalXP: userData.totalXP || userData.totalExp || 0,
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
    if (!userDoc.exists) {
      userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    }
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    
    const userData = userDoc.data();
    let displayName = userData.name || userData.username;
    if (!displayName || displayName === 'User') {
      const avatarMatch = userData.avatar?.match(/name=([^&]+)/);
      if (avatarMatch) displayName = decodeURIComponent(avatarMatch[1]);
      else displayName = 'Anime Fan';
    }
    
    let totalAnime = userData.totalAnime || 0;
    let totalHours = userData.totalHours || 0;
    let totalEpisodes = 0;
    
    if (totalAnime === 0 || totalHours === 0) {
      let animeList = [];
      let animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
      
      if (animeDoc.exists) {
        animeList = animeDoc.data().animeList || [];
      }
      
      if (animeList.length === 0 && userData.animeList) {
        animeList = userData.animeList;
      }
      
      const completedAnime = animeList.filter(anime => anime.userStatus === 'Completed');
      totalAnime = completedAnime.length;
      
      let totalMinutes = 0;
      completedAnime.forEach(anime => {
        if (anime.type === 'Movie') {
          totalMinutes += anime.duration || 120;
          totalEpisodes += 1;
        } else {
          const episodes = anime.episodes || 0;
          const duration = anime.duration || 20;
          totalMinutes += episodes * duration;
          totalEpisodes += episodes;
        }
      });
      totalHours = Math.round(totalMinutes / 60);
    }
    
    res.json({
      uid: userId,
      name: displayName,
      username: displayName,
      avatar: userData.avatar || null,
      level: userData.level || 1,
      title: userData.title || 'Newbie',
      totalXP: userData.totalXP || userData.totalExp || 0,
      totalAnime: totalAnime,
      totalEpisodes: totalEpisodes,
      totalHours: totalHours
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users by name
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
        const avatarMatch = userData.avatar?.match(/name=([^&]+)/);
        if (avatarMatch) displayName = decodeURIComponent(avatarMatch[1]);
      }
      if (displayName && displayName.toLowerCase().includes(searchLower) && doc.id !== currentUserId) {
        users.push({
          uid: doc.id,
          name: displayName,
          username: displayName,
          title: userData.title || 'Newbie',
          level: userData.level || 1,
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

// ============================================
// FULL STATS WITH EPISODES AND GENRES
// ============================================

router.get('/full-stats/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { period = 'all' } = req.query;
  
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    }
    const userData = userDoc.data() || {};
    
    let animeList = await getUserAnimeList(userId);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const completedAnime = animeList.filter(anime => anime.userStatus === 'Completed');
    
    const filteredAnime = completedAnime.filter(anime => {
      let finishDate = null;
      if (anime.finishDate) {
        finishDate = new Date(anime.finishDate);
      } else if (anime.completedTimestamp) {
        finishDate = new Date(anime.completedTimestamp);
      } else if (anime.updatedAt) {
        finishDate = new Date(anime.updatedAt);
      }
      if (!finishDate) return period === 'all';
      
      switch(period) {
        case 'week': return finishDate >= currentWeekStart;
        case 'month': return finishDate.getMonth() === currentMonth && finishDate.getFullYear() === currentYear;
        case 'year': return finishDate.getFullYear() === currentYear;
        default: return true;
      }
    });
    
    let totalXP = 0;
    let totalAnime = filteredAnime.length;
    let totalEpisodes = 0;
    let totalHours = 0;
    const genreCount = {};
    
    filteredAnime.forEach(anime => {
      let episodes = 0;
      if (anime.type === 'Movie') {
        episodes = 1;
      } else {
        episodes = anime.episodes || 0;
      }
      totalEpisodes += episodes;
      
      let hours = 0;
      if (anime.type === 'Movie') {
        hours = (anime.duration || 120) / 60;
      } else {
        hours = (episodes * (anime.duration || 20)) / 60;
      }
      totalHours += hours;
      
      const scoreBonus = anime.score ? (anime.score >= 9 ? 8 : anime.score >= 8 ? 5 : anime.score >= 7 ? 3 : 0) : 0;
      const episodeBonus = Math.floor(episodes / 2);
      const xp = episodeBonus + scoreBonus + 10;
      totalXP += xp;
      
      if (anime.genres && Array.isArray(anime.genres)) {
        anime.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });
    
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);
    
    let displayName = userData.name || userData.username;
    if (!displayName || displayName === 'User') {
      const avatarMatch = userData.avatar?.match(/name=([^&]+)/);
      if (avatarMatch) {
        displayName = decodeURIComponent(avatarMatch[1]);
      } else {
        displayName = 'User';
      }
    }
    
    const result = {
      uid: userId,
      name: displayName,
      username: displayName,
      avatar: userData.avatar || null,
      level: userData.level || 1,
      title: userData.title || 'Newbie',
      totalXP: Math.round(totalXP),
      totalAnime: totalAnime,
      totalEpisodes: totalEpisodes,
      totalHours: Math.round(totalHours),
      topGenres: topGenres
    };
    
    res.json(result);
  } catch (error) {
    console.error('Get full stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AVATAR UPLOAD
// ============================================

router.post('/avatar', verifyToken, async (req, res) => {
  const { avatar } = req.body;
  const userId = req.userId;
  
  if (!avatar) {
    return res.status(400).json({ error: 'No avatar data provided' });
  }
  
  const sizeInKB = Math.round(avatar.length / 1024);
  if (sizeInKB > 500) {
    return res.status(400).json({ error: `Avatar too large: ${sizeInKB}KB. Max 500KB.` });
  }
  
  try {
    await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
      avatar: avatar,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });
    
    await db.collection(COLLECTIONS.USERS).doc(userId).set({
      avatar: avatar,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });
    
    res.json({ 
      success: true, 
      avatar: avatar,
      size: sizeInKB,
      message: 'Avatar updated successfully' 
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/avatar/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    }
    
    const userData = userDoc.data();
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=6366F1&color=fff&bold=true&length=2&size=200`;
    
    res.json({ 
      avatar: userData?.avatar || defaultAvatar,
      hasCustom: !!userData?.avatar
    });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER PROFILE ENDPOINTS 
// ============================================

router.get('/full-profile/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.userId;
  
  try {
    let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    }
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    let displayName = userData.name || userData.username;
    if (!displayName || displayName === 'User') {
      const avatarMatch = userData.avatar?.match(/name=([^&]+)/);
      if (avatarMatch) displayName = decodeURIComponent(avatarMatch[1]);
      else displayName = 'Anime Fan';
    }
    
    let animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    let animeList = animeDoc.exists ? animeDoc.data().animeList || [] : [];
    
    // Sort by updatedAt or createdAt (newest first)
    const sortedByRecent = [...animeList].sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || '';
      const dateB = b.updatedAt || b.createdAt || '';
      return new Date(dateB) - new Date(dateA);
    });
    
    const completedAnime = sortedByRecent.filter(a => a.userStatus === 'Completed');
    const watchingAnime = sortedByRecent.filter(a => a.userStatus === 'Watching');
    const planToWatch = sortedByRecent.filter(a => a.userStatus === 'Plan to Watch');
    const droppedAnime = sortedByRecent.filter(a => a.userStatus === 'Dropped');
    
    let totalMinutes = 0;
    let totalEpisodes = 0;
    completedAnime.forEach(anime => {
      if (anime.type === 'Movie') {
        totalMinutes += anime.duration || 120;
        totalEpisodes += 1;
      } else {
        const episodes = anime.episodes || 0;
        totalEpisodes += episodes;
        totalMinutes += episodes * (anime.duration || 20);
      }
    });
    const totalHours = Math.round(totalMinutes / 60);
    
    const achievementsDoc = await db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).get();
    const unlockedAchievements = achievementsDoc.exists ? achievementsDoc.data().unlocked || [] : [];
    
    const totalXP = userData.totalXP || 0;
    const level = calculateLevelFromXP(totalXP);
    const levelTitle = getLevelTitle(level);
    const nextLevelXP = getNextLevelXP(level);
    const xpProgress = ((totalXP - getCurrentLevelXP(level)) / (nextLevelXP - getCurrentLevelXP(level))) * 100;
    
    let isFriend = false;
    if (currentUserId !== userId) {
      const friendsDoc = await db.collection(COLLECTIONS.FRIENDS).doc(currentUserId).get();
      const friends = friendsDoc.data()?.friends || [];
      isFriend = friends.includes(userId);
    }
    
    const activityDoc = await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).get();
    const recentActivity = activityDoc.exists ? (activityDoc.data().activities || []).slice(0, 10) : [];
    
    res.json({
      uid: userId,
      name: displayName,
      avatar: userData.avatar || null,
      level: level,
      levelTitle: levelTitle,
      totalXP: totalXP,
      xpProgress: Math.min(100, Math.max(0, xpProgress)),
      xpToNextLevel: nextLevelXP - totalXP,
      nextLevelTitle: getLevelTitle(level + 1),
      stats: {
        totalAnime: animeList.length,
        completed: completedAnime.length,
        watching: watchingAnime.length,
        planToWatch: planToWatch.length,
        dropped: droppedAnime.length,
        totalHours: totalHours,
        totalEpisodes: totalEpisodes
      },
      animeList: {
        completed: completedAnime.slice(0, 21),  
        watching: watchingAnime.slice(0, 21),   
        planToWatch: planToWatch.slice(0, 21)  
      },
      achievements: unlockedAchievements,
      recentActivity: recentActivity,
      isFriend: isFriend,
      isCurrentUser: currentUserId === userId
    });
    
  } catch (error) {
    console.error('Get full profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for level calculation
function calculateLevelFromXP(xp) {
  const levelThresholds = {
    1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 1700, 8: 2300, 9: 3000,
    10: 4000, 11: 5200, 12: 6500, 13: 8000, 14: 10000, 15: 12500, 16: 15000,
    17: 18000, 18: 22000, 19: 27000, 20: 35000, 21: 45000, 22: 53000, 23: 62000,
    24: 72000, 25: 83000, 26: 95000, 27: 108000, 28: 122000, 29: 137000, 30: 153000
  };
  
  for (let level = 30; level >= 1; level--) {
    if (xp >= (levelThresholds[level] || 0)) {
      return level;
    }
  }
  return 1;
}

function getLevelTitle(level) {
  const titles = {
    1: 'Newbie', 2: 'Scout', 3: 'Viewer', 4: 'Otaku', 5: 'Fanatic',
    6: 'Binge Hunter', 7: 'Senpai', 8: 'Shonen Hero', 9: 'Elite Otaku', 10: 'Anime Legend',
    11: 'Sage', 12: 'Archive Keeper', 13: 'Dimension Traveler', 14: 'Anime Master', 15: 'Grand Senpai',
    16: 'Hokage', 17: 'Transcendent', 18: 'Elite', 19: 'Eternal Watcher', 20: 'Legend', 21: 'Anime Deity',
    22: 'Mythic', 23: 'Ascended', 24: 'Divine', 25: 'Cosmic', 26: 'Eternal',
    27: 'Godly', 28: 'Celestial', 29: 'Omnipotent', 30: 'Absolute'
  };
  return titles[level] || 'Anime Deity';
}

function getCurrentLevelXP(level) {
  const thresholds = { 1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 1700, 8: 2300, 9: 3000,
    10: 4000, 11: 5200, 12: 6500, 13: 8000, 14: 10000, 15: 12500, 16: 15000,
    17: 18000, 18: 22000, 19: 27000, 20: 35000, 21: 45000, 22: 53000, 23: 62000,
    24: 72000, 25: 83000, 26: 95000, 27: 108000, 28: 122000, 29: 137000, 30: 153000 };
  return thresholds[level] || 0;
}

function getNextLevelXP(level) {
  const nextThresholds = { 1: 100, 2: 250, 3: 500, 4: 800, 5: 1200, 6: 1700, 7: 2300, 8: 3000, 9: 4000,
    10: 5200, 11: 6500, 12: 8000, 13: 10000, 14: 12500, 15: 15000, 16: 18000, 17: 22000,
    18: 27000, 19: 35000, 20: 45000, 21: 53000, 22: 62000, 23: 72000, 24: 83000, 25: 95000,
    26: 108000, 27: 122000, 28: 137000, 29: 153000 };
  return nextThresholds[level] || 153000;
}

// ============================================
// NOTIFICATION SYSTEM ENDPOINTS
// ============================================

router.get('/notifications', verifyToken, async (req, res) => {
  const userId = req.userId;
  
  try {
    const notificationsRef = db.collection('notifications').doc(userId);
    const doc = await notificationsRef.get();
    
    let notifications = [];
    let unreadCount = 0;
    
    if (doc.exists) {
      const data = doc.data();
      notifications = data.notifications || [];
      unreadCount = notifications.filter(n => !n.read).length;
    }
    
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      notifications: notifications.slice(0, 50),
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/mark-read', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { notificationId, markAll } = req.body;
  
  try {
    const notificationsRef = db.collection('notifications').doc(userId);
    const doc = await notificationsRef.get();
    
    if (doc.exists) {
      let notifications = doc.data().notifications || [];
      
      if (markAll) {
        notifications = notifications.map(n => ({ ...n, read: true }));
      } else if (notificationId) {
        notifications = notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
      }
      
      await notificationsRef.set({ notifications }, { merge: true });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create notification (utility function)
async function createNotification(userId, type, title, message, data = null) {
  try {
    const notificationsRef = db.collection('notifications').doc(userId);
    const doc = await notificationsRef.get();
    
    let notifications = [];
    if (doc.exists) {
      notifications = doc.data().notifications || [];
    }
    
    // Check for duplicate notification within last 10 seconds
    const now = Date.now();
    const isDuplicate = notifications.some(existing => {
      if (existing.type !== type) return false;
      if (type === 'friend_accepted' && existing.data?.userId === data?.userId) {
        const timeDiff = now - new Date(existing.createdAt).getTime();
        return timeDiff < 10000;
      }
      if (type === 'friend_request' && existing.data?.fromUserId === data?.fromUserId) {
        const timeDiff = now - new Date(existing.createdAt).getTime();
        return timeDiff < 10000;
      }
      return false;
    });
    
    if (isDuplicate) {
      console.log(`⚠️ Duplicate notification prevented for ${type}`);
      return null;
    }
    
    const newNotification = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      type: type,
      title: title,
      message: message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.unshift(newNotification);
    
    if (notifications.length > 100) {
      notifications = notifications.slice(0, 100);
    }
    
    await notificationsRef.set({ notifications }, { merge: true });
    
    console.log(`✅ Notification created for ${userId}: ${title}`);
    return newNotification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

module.exports = router;
module.exports.createNotification = createNotification;