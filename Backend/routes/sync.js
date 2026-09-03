const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(express.json({ limit: '50mb' }));

// ============================================
// SYNC ALL DATA (Upload to cloud)
// ============================================
router.post('/sync-all', verifyToken, async (req, res) => {
  const {
    animeData, activityLog, userProfile, unlockedAchievements,
    userXpHistory, animeContributions, appSettings, levelData,
    dailyXP, xpPendingQueue, lastResetDate, streakData
  } = req.body;

  const userId = req.userId;
  try {
    console.log(`🔄 Syncing all data for user: ${userId}`);

    // ---- Log payload contents ----
    console.log(`📦 Received animeData length: ${animeData?.length || 0}`);
    if (animeData && Array.isArray(animeData)) {
      // Log first 5 anime IDs
      const firstIds = animeData.slice(0, 5).map(a => a.id);
      console.log(`First 5 anime IDs: ${firstIds.join(', ')}`);

      // Specifically look for the anime we care about (ID 488)
      const edited = animeData.find(a => a.id === 488);
      if (edited) {
        console.log(`✅ Found anime ID 488 in payload:`);
        console.log(`   title: "${edited.title}"`);
        console.log(`   userStatus: "${edited.userStatus}"`);
        console.log(`   progress: ${edited.progress}`);
        console.log(`   actualFinishDate: ${edited.actualFinishDate || 'null'}`);
        console.log(`   finishDate: ${edited.finishDate || 'null'}`);
      } else {
        console.warn(`⚠️ Anime ID 488 NOT FOUND in payload!`);
      }
    } else {
      console.warn('⚠️ animeData is missing or not an array');
    }

    const promises = [];

    // ---- Save Anime List ----
    if (animeData && Array.isArray(animeData)) {
      promises.push(
        db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).set({
          animeList: animeData,
          lastUpdated: new Date().toISOString(),
          count: animeData.length
        })
          .then(() => console.log(`✅ ANIME_LISTS saved for user ${userId}`))
          .catch(err => console.error(`❌ Failed to save ANIME_LISTS:`, err))
      );
    }

    // ---- Save Activity Log ----
    if (activityLog && Array.isArray(activityLog)) {
      promises.push(
        db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).set({
          activities: activityLog,
          lastUpdated: new Date().toISOString(),
          count: activityLog.length
        })
          .then(() => console.log(`✅ ACTIVITY_LOGS saved for user ${userId}`))
          .catch(err => console.error(`❌ Failed to save ACTIVITY_LOGS:`, err))
      );
    }

    // ---- Save User Profile (without avatar) ----
    if (userProfile) {
      const cleanProfile = { ...userProfile };
      delete cleanProfile.avatar;
      promises.push(
        db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
          ...cleanProfile,
          lastSynced: new Date().toISOString()
        }, { merge: true })
          .then(() => console.log(`✅ USER_PROFILES saved for user ${userId}`))
          .catch(err => console.error(`❌ Failed to save USER_PROFILES:`, err))
      );
    }

    // ---- Save Achievements ----
    if (unlockedAchievements && Array.isArray(unlockedAchievements)) {
      promises.push(
        db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).set({
          unlocked: unlockedAchievements,
          lastUpdated: new Date().toISOString(),
          count: unlockedAchievements.length
        })
          .then(() => console.log(`✅ ACHIEVEMENTS saved for user ${userId}`))
          .catch(err => console.error(`❌ Failed to save ACHIEVEMENTS:`, err))
      );
    }

    // ---- Save XP History ----
    if (userXpHistory && Array.isArray(userXpHistory)) {
      promises.push(
        db.collection(COLLECTIONS.XP_HISTORY).doc(userId).set({
          history: userXpHistory,
          lastUpdated: new Date().toISOString()
        })
          .then(() => console.log(`✅ XP_HISTORY saved for user ${userId}`))
          .catch(err => console.error(`❌ Failed to save XP_HISTORY:`, err))
      );
    }

    // ---- Save Contributions (Heatmap) ----
    if (animeContributions) {
      promises.push(
        db.collection(COLLECTIONS.CONTRIBUTIONS).doc(userId).set({
          contributions: animeContributions,
          lastUpdated: new Date().toISOString()
        })
          .then(() => console.log(`✅ CONTRIBUTIONS saved for user ${userId}`))
          .catch(err => console.error(`❌ Failed to save CONTRIBUTIONS:`, err))
      );
    }

    // ---- Save Settings ----
    if (appSettings) {
      promises.push(
        db.collection(COLLECTIONS.SETTINGS).doc(userId).set({
          settings: appSettings,
          lastUpdated: new Date().toISOString()
        })
          .then(() => console.log(`✅ SETTINGS saved for user ${userId}`))
          .catch(err => console.error(`❌ Failed to save SETTINGS:`, err))
      );
    }

    // ---- Save Level Data & additional fields ----
    if (levelData) {
      const { getLevelFromXP, getTitleForLevel } = require('../utils/levelSystem');
      const level = levelData.level || getLevelFromXP(levelData.totalXP || 0);
      const title = levelData.title || getTitleForLevel(level);

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

      if (dailyXP) userUpdate.dailyXP = dailyXP;
      if (xpPendingQueue) userUpdate.xpPendingQueue = xpPendingQueue;
      if (lastResetDate) userUpdate.lastResetDate = lastResetDate;
      if (streakData) {
        userUpdate.streak = streakData.streak || 0;
        userUpdate.lastActive = streakData.lastActive || null;
      }

      promises.push(
        db.collection(COLLECTIONS.USERS).doc(userId).set(userUpdate, { merge: true })
          .then(() => console.log(`✅ USERS updated for user ${userId}`))
          .catch(err => console.error(`❌ Failed to update USERS:`, err))
      );
    }

    // ---- Wait for all promises ----
    await Promise.all(promises);
    console.log(`✅ All data synced for user: ${userId}`);
    res.json({ success: true, message: 'All data synced to cloud successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LOAD ALL DATA (Download from cloud)
// ============================================
router.get('/load-all', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    console.log(`📥 Loading all data for user: ${userId}`);
    const data = {};
    let lastModified = null;

    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    if (animeDoc.exists) {
      data.animeData = animeDoc.data().animeList || [];
      lastModified = animeDoc.data().lastUpdated || null;
      console.log(`📦 Loaded ${data.animeData.length} anime from cloud`);
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

    console.log(`✅ Load complete for user ${userId}`);
    res.json({ success: true, data, lastModified });
  } catch (error) {
    console.error('❌ Load error:', error);
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