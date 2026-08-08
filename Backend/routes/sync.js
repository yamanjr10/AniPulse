const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(express.json({ limit: '50mb' }));

// Sync all data
router.post('/sync-all', verifyToken, async (req, res) => {
  const { animeData, activityLog, userProfile, unlockedAchievements, userXpHistory, animeContributions, appSettings, levelData } = req.body;
  const userId = req.userId;
  try {
    console.log(`🔄 Syncing all data for user: ${userId}`);
    const promises = [];

    if (animeData && Array.isArray(animeData)) {
      promises.push(
        db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).set({
          animeList: animeData,
          lastUpdated: new Date().toISOString(),
          count: animeData.length
        })
      );
    }
    if (activityLog && Array.isArray(activityLog)) {
      promises.push(
        db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).set({
          activities: activityLog,
          lastUpdated: new Date().toISOString(),
          count: activityLog.length
        })
      );
    }
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
    if (unlockedAchievements && Array.isArray(unlockedAchievements)) {
      promises.push(
        db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).set({
          unlocked: unlockedAchievements,
          lastUpdated: new Date().toISOString(),
          count: unlockedAchievements.length
        })
      );
    }
    if (userXpHistory && Array.isArray(userXpHistory)) {
      promises.push(
        db.collection(COLLECTIONS.XP_HISTORY).doc(userId).set({
          history: userXpHistory,
          lastUpdated: new Date().toISOString()
        })
      );
    }
    if (animeContributions) {
      promises.push(
        db.collection(COLLECTIONS.CONTRIBUTIONS).doc(userId).set({
          contributions: animeContributions,
          lastUpdated: new Date().toISOString()
        })
      );
    }
    if (appSettings) {
      promises.push(
        db.collection(COLLECTIONS.SETTINGS).doc(userId).set({
          settings: appSettings,
          lastUpdated: new Date().toISOString()
        })
      );
    }
    if (levelData) {
      const { getLevelFromXP, getTitleForLevel } = require('../utils/levelSystem');
      const level = levelData.level || getLevelFromXP(levelData.totalXP || 0);
      const title = levelData.title || getTitleForLevel(level);
      promises.push(
        db.collection(COLLECTIONS.USERS).doc(userId).set({
          totalXP: levelData.totalXP || 0,
          level,
          title,
          totalAnime: levelData.totalAnime || 0,
          totalHours: levelData.totalHours || 0,
          username: userProfile?.username || 'User',
          lastUpdated: new Date().toISOString()
        }, { merge: true })
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

// Load all data
router.get('/load-all', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const data = {};
    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    data.animeData = animeDoc.exists ? animeDoc.data().animeList || [] : [];

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
      data.levelData = {
        totalXP: userDoc.data().totalXP || 0,
        level: userDoc.data().level || 1,
        title: userDoc.data().title || 'Newbie',
        totalAnime: userDoc.data().totalAnime || 0,
        totalHours: userDoc.data().totalHours || 0
      };
    } else {
      data.levelData = { totalXP: 0, level: 1, title: 'Newbie', totalAnime: 0, totalHours: 0 };
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync status
router.get('/status', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    res.json({
      hasCloudData: animeDoc.exists,
      lastUpdated: animeDoc.exists ? animeDoc.data().lastUpdated : null,
      animeCount: animeDoc.exists ? (animeDoc.data().animeList?.length || 0) : 0,
      level: userDoc.exists ? userDoc.data().level : 1,
      totalXP: userDoc.exists ? userDoc.data().totalXP : 0
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;