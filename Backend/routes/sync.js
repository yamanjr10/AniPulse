const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Increase payload limit for this route
router.use(express.json({ limit: '50mb' }));

// ============================================
// VERIFY TOKEN MIDDLEWARE
// ============================================

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ No token in authorization header');
    return res.status(401).json({ error: 'Invalid token format' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user:', decoded.uid);
    req.userId = decoded.uid;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// SYNC ALL DATA
// ============================================

router.post('/sync-all', verifyToken, async (req, res) => {
  const { animeData, activityLog, userProfile, unlockedAchievements, userXpHistory, animeContributions, appSettings, levelData } = req.body;
  const userId = req.userId;
  
  try {
    console.log(`🔄 Syncing all data for user: ${userId}`);
    
    const promises = [];
    
    // Save Anime List
    if (animeData && Array.isArray(animeData)) {
      console.log(`  📊 Anime: ${animeData.length} items`);
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
      console.log(`  📝 Activity: ${activityLog.length} items`);
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
      delete cleanProfile.avatar; // Avatar stays local only
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
    
    // SAVE LEVEL DATA - CRITICAL FOR RANKING!
    if (levelData) {
      console.log(`  🏆 Level Data: Lv.${levelData.level} (${levelData.totalXP} XP)`);
      promises.push(
        db.collection(COLLECTIONS.USERS).doc(userId).set({
          totalXP: levelData.totalXP || 0,
          level: levelData.level || 1,
          title: levelData.title || 'Newbie',
          totalAnime: levelData.totalAnime || 0,
          totalHours: levelData.totalHours || 0,
          username: userProfile?.username || 'User',
          lastUpdated: new Date().toISOString()
        }, { merge: true })
      );
    }
    
    await Promise.all(promises);
    
    console.log(`✅ All data synced for user: ${userId}`);
    
    res.json({ 
      success: true, 
      message: 'All data synced to cloud successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LOAD ALL DATA
// ============================================

router.get('/load-all', verifyToken, async (req, res) => {
  const userId = req.userId;
  
  try {
    console.log(`📥 Loading all data for user: ${userId}`);
    
    const data = {};
    
    // Load Anime List
    const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    if (animeDoc.exists) {
      data.animeData = animeDoc.data().animeList || [];
      console.log(`  📊 Anime: ${data.animeData.length} items`);
    } else {
      data.animeData = [];
    }
    
    // Load Activity Log
    const activityDoc = await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(userId).get();
    if (activityDoc.exists) {
      data.activityLog = activityDoc.data().activities || [];
      console.log(`  📝 Activity: ${data.activityLog.length} items`);
    } else {
      data.activityLog = [];
    }
    
    // Load User Profile
    const profileDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (profileDoc.exists) {
      data.userProfile = profileDoc.data();
    }
    
    // Load Achievements
    const achievementsDoc = await db.collection(COLLECTIONS.ACHIEVEMENTS).doc(userId).get();
    if (achievementsDoc.exists) {
      data.unlockedAchievements = achievementsDoc.data().unlocked || [];
    } else {
      data.unlockedAchievements = [];
    }
    
    // Load XP History
    const xpDoc = await db.collection(COLLECTIONS.XP_HISTORY).doc(userId).get();
    if (xpDoc.exists) {
      data.userXpHistory = xpDoc.data().history || [];
    } else {
      data.userXpHistory = [];
    }
    
    // Load Contributions
    const contributionsDoc = await db.collection(COLLECTIONS.CONTRIBUTIONS).doc(userId).get();
    if (contributionsDoc.exists) {
      data.animeContributions = contributionsDoc.data().contributions || {};
    } else {
      data.animeContributions = {};
    }
    
    // Load Settings
    const settingsDoc = await db.collection(COLLECTIONS.SETTINGS).doc(userId).get();
    if (settingsDoc.exists) {
      data.appSettings = settingsDoc.data().settings || {};
    } else {
      data.appSettings = {};
    }
    
    // LOAD LEVEL DATA - CRITICAL FOR RANKING!
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (userDoc.exists) {
      data.levelData = {
        totalXP: userDoc.data().totalXP || 0,
        level: userDoc.data().level || 1,
        title: userDoc.data().title || 'Newbie',
        totalAnime: userDoc.data().totalAnime || 0,
        totalHours: userDoc.data().totalHours || 0
      };
      console.log(`  🏆 Level Data: Lv.${data.levelData.level} (${data.levelData.totalXP} XP)`);
    } else {
      data.levelData = {
        totalXP: 0,
        level: 1,
        title: 'Newbie',
        totalAnime: 0,
        totalHours: 0
      };
    }
    
    console.log(`✅ Loaded all data for user: ${userId}`);
    
    res.json({ success: true, data });
    
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SYNC STATUS
// ============================================

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