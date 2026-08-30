const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(express.json({ limit: '50mb' }));

// ============================================
// SYNC ALL DATA (Upload to cloud)
// ============================================
router.post('/sync-all', verifyToken, async (req, res) => {
  // Extract new fields
  const {
    animeData, activityLog, userProfile, unlockedAchievements,
    userXpHistory, animeContributions, appSettings, levelData,
    dailyXP, xpPendingQueue, lastResetDate, streakData // <-- NEW
  } = req.body;

  const userId = req.userId;
  try {
    console.log(`🔄 Syncing all data for user: ${userId}`);
    const promises = [];

    // ... (existing saves for anime, activity, profile, etc.) ...

    // Save Anime List
    if (animeData && Array.isArray(animeData)) {
      promises.push(
        db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).set({
          animeList: animeData,
          lastUpdated: new Date().toISOString(),
          count: animeData.length
        })
      );
    }

    // Save Activity Log
    if (activityLog && Array.isArray(activityLog)) {
      promises.push(
        db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).set({
          activities: activityLog,
          lastUpdated: new Date().toISOString(),
          count: activityLog.length
        })
      );
    }

    // Save User Profile (without avatar)
    if (userProfile) {
      const cleanProfile = { ...userProfile };
      delete cleanProfile.avatar;
      promises.push(
        db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
          ...cleanProfile,
          lastSynced: new Date().toISOString()
        }, { merge: true })
      );
    }

    // Save Achievements
    if (unlockedAchievements && Array.isArray(unlockedAchievements)) {
      promises.push(
        db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).set({
          unlocked: unlockedAchievements,
          lastUpdated: new Date().toISOString(),
          count: unlockedAchievements.length
        })
      );
    }

    // Save XP History
    if (userXpHistory && Array.isArray(userXpHistory)) {
      promises.push(
        db.collection(COLLECTIONS.XP_HISTORY).doc(userId).set({
          history: userXpHistory,
          lastUpdated: new Date().toISOString()
        })
      );
    }

    // Save Contributions (Heatmap)
    if (animeContributions) {
      promises.push(
        db.collection(COLLECTIONS.CONTRIBUTIONS).doc(userId).set({
          contributions: animeContributions,
          lastUpdated: new Date().toISOString()
        })
      );
    }

    // Save Settings
    if (appSettings) {
      promises.push(
        db.collection(COLLECTIONS.SETTINGS).doc(userId).set({
          settings: appSettings,
          lastUpdated: new Date().toISOString()
        })
      );
    }

    // Save Level Data & also store daily XP, queue, reset date, streak in USERS doc
    if (levelData) {
      const { getLevelFromXP, getTitleForLevel } = require('../utils/levelSystem');
      const level = levelData.level || getLevelFromXP(levelData.totalXP || 0);
      const title = levelData.title || getTitleForLevel(level);

      // Build the update object for USERS
      const userUpdate = {
        totalXP: levelData.totalXP || 0,
        level,
        title,
        totalAnime: levelData.totalAnime || 0,
        totalHours: levelData.totalHours || 0,
        username: userProfile?.username || 'User',
        name: userProfile?.name || userProfile?.username || 'User',
        lastUpdated: new Date().toISOString()
      };

      // Add new fields if they exist
      if (dailyXP) {
        userUpdate.dailyXP = dailyXP; // { date: string, xp: number }
      }
      if (xpPendingQueue) {
        userUpdate.xpPendingQueue = xpPendingQueue;
      }
      if (lastResetDate) {
        userUpdate.lastResetDate = lastResetDate;
      }
      if (streakData) {
        userUpdate.streak = streakData.streak || 0;
        userUpdate.lastActive = streakData.lastActive || null;
      }

      promises.push(
        db.collection(COLLECTIONS.USERS).doc(userId).set(userUpdate, { merge: true })
      );
    }

    await Promise.all(promises);
    console.log(`✅ All data synced for user: ${userId}`);
    res.json({ success: true, message: 'All data synced to cloud successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LOAD ALL DATA (Download from cloud)
// ============================================
router.get('/load-all', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const data = {};
    let lastModified = null;

    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    if (animeDoc.exists) {
      data.animeData = animeDoc.data().animeList || [];
      lastModified = animeDoc.data().lastUpdated || null;
    } else {
      data.animeData = [];
    }

    const activityDoc = await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).get();
    data.activityLog = activityDoc.exists ? activityDoc.data().activities || [] : [];

    const profileDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    data.userProfile = profileDoc.exists ? profileDoc.data() : null;

    const achievementsDoc = await db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).get();
    data.unlockedAchievements = achievementsDoc.exists ? achievementsDoc.data().unlocked || [] : [];

    const xpDoc = await db.collection(COLLECTIONS.XP_HISTORY).doc(userId).get();
    data.userXpHistory = xpDoc.exists ? xpDoc.data().history || [] : [];

    const contributionsDoc = await db.collection(COLLECTIONS.CONTRIBUTIONS).doc(userId).get();
    data.animeContributions = contributionsDoc.exists ? contributionsDoc.data().contributions || {} : {};

    const settingsDoc = await db.collection(COLLECTIONS.SETTINGS).doc(userId).get();
    data.appSettings = settingsDoc.exists ? settingsDoc.data().settings || {} : {};

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      data.levelData = {
        totalXP: userData.totalXP || 0,
        level: userData.level || 1,
        title: userData.title || 'Newbie',
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0
      };

      // NEW: extract daily XP, queue, reset date, streak
      if (userData.dailyXP) data.dailyXP = userData.dailyXP;
      if (userData.xpPendingQueue) data.xpPendingQueue = userData.xpPendingQueue;
      if (userData.lastResetDate) data.lastResetDate = userData.lastResetDate;
      if (userData.streak !== undefined) {
        data.streakData = {
          streak: userData.streak || 0,
          lastActive: userData.lastActive || null
        };
      }
    } else {
      data.levelData = { totalXP: 0, level: 1, title: 'Newbie', totalAnime: 0, totalHours: 0 };
    }

    res.json({ success: true, data, lastModified });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SYNC STATUS (optional – add streak info)
// ============================================
router.get('/status', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data() || {};
    res.json({
      hasCloudData: animeDoc.exists,
      lastUpdated: animeDoc.exists ? animeDoc.data().lastUpdated : null,
      animeCount: animeDoc.exists ? (animeDoc.data().animeList?.length || 0) : 0,
      level: userData.level || 1,
      totalXP: userData.totalXP || 0,
      streak: userData.streak || 0,
      lastActive: userData.lastActive || null
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;