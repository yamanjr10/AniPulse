﻿const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { verifyToken } = require('./auth');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Complete level thresholds (1-100)
const LEVEL_THRESHOLDS = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 1700, 8: 2300, 9: 3000,
  10: 4000, 11: 5200, 12: 6500, 13: 8000, 14: 10000, 15: 12500, 16: 15000,
  17: 18000, 18: 22000, 19: 27000, 20: 35000, 21: 45000,
  
  // Levels 22-30: Rare titles
  22: 53000, 23: 62000, 24: 72000, 25: 83000, 26: 95000,
  27: 108000, 28: 122000, 29: 137000, 30: 153000,
  
  // Levels 31-40: Supreme titles
  31: 170000, 32: 188000, 33: 207000, 34: 227000, 35: 248000,
  36: 270000, 37: 293000, 38: 317000, 39: 342000, 40: 368000,
  
  // Levels 41-50: God tier
  41: 395000, 42: 423000, 43: 452000, 44: 482000, 45: 513000,
  46: 545000, 47: 578000, 48: 612000, 49: 647000, 50: 683000,
  
  // Levels 51-60: Beyond god
  51: 720000, 52: 758000, 53: 797000, 54: 837000, 55: 878000,
  56: 920000, 57: 963000, 58: 1007000, 59: 1052000, 60: 1098000,
  
  // Levels 61-70: Mythical
  61: 1145000, 62: 1193000, 63: 1242000, 64: 1292000, 65: 1343000,
  66: 1395000, 67: 1448000, 68: 1502000, 69: 1557000, 70: 1613000,
  
  // Levels 71-80: Ultimate
  71: 1670000, 72: 1728000, 73: 1787000, 74: 1847000, 75: 1908000,
  76: 1970000, 77: 2033000, 78: 2097000, 79: 2162000, 80: 2228000,
  
  // Levels 81-90: Infinite
  81: 2295000, 82: 2363000, 83: 2432000, 84: 2502000, 85: 2573000,
  86: 2645000, 87: 2718000, 88: 2792000, 89: 2867000, 90: 2943000,
  
  // Levels 91-100: Final
  91: 3020000, 92: 3098000, 93: 3177000, 94: 3257000, 95: 3338000,
  96: 3420000, 97: 3503000, 98: 3587000, 99: 3672000, 100: 3758000
};

// Complete level titles (1-100)
const LEVEL_TITLES = {
  1: "Newbie", 2: "Scout", 3: "Viewer", 4: "Otaku", 5: "Fanatic",
  6: "Binge Hunter", 7: "Senpai", 8: "Shonen Hero", 9: "Elite Otaku", 10: "Anime Legend",
  11: "Sage", 12: "Archive Keeper", 13: "Dimension Traveler", 14: "Anime Master", 15: "Grand Senpai",
  16: "Hokage", 17: "Transcendent", 18: "Elite", 19: "Eternal Watcher", 20: "Legend", 21: "Anime Deity",
  
  // Levels 22-30: Rare titles
  22: "Mythic", 23: "Ascended", 24: "Divine", 25: "Cosmic", 26: "Eternal",
  27: "Godly", 28: "Celestial", 29: "Omnipotent", 30: "Absolute",
  
  // Levels 31-40: Supreme titles
  31: "Supreme Watcher", 32: "Void Lord", 33: "Star Eater", 34: "Galaxy Seeker", 35: "Universe Walker",
  36: "Dimension Lord", 37: "Reality Weaver", 38: "Time Master", 39: "Space God", 40: "Eternity Seeker",
  
  // Levels 41-50: God tier
  41: "Infinity Watcher", 42: "Omni God", 43: "Creator Level", 44: "Prime Being", 45: "Alpha Otaku",
  46: "Omega Watcher", 47: "Genesis Seeker", 48: "Apocalypse Binger", 49: "Nirvana Master", 50: "Enlightenment",
  
  // Levels 51-60: Beyond god
  51: "Transcendent God", 52: "Ultimate Deity", 53: "Absolute Being", 54: "One Above All", 55: "The Watcher",
  56: "The Seeker", 57: "The Binger", 58: "The Otaku", 59: "The Legend", 60: "The Myth",
  
  // Levels 61-70: Mythical
  61: "Living Legend", 62: "Walking Deity", 63: "Anime Incarnate", 64: "Story Manifest", 65: "Plot Embodiment",
  66: "Genre Avatar", 67: "Collection Spirit", 68: "Binge Force", 69: "Watch Essence", 70: "Anime Soul",
  
  // Levels 71-80: Ultimate
  71: "Anime Heart", 72: "Otaku Core", 73: "Weeb Origin", 74: "Culture Icon", 75: "Media God",
  76: "Entertainment Deity", 77: "Pop Culture Legend", 78: "Art Form Master", 79: "Expression God", 80: "Creation Deity",
  
  // Levels 81-90: Infinite
  81: "Infinite Watcher", 82: "Eternal Seeker", 83: "Boundless Otaku", 84: "Limitless Binger", 85: "Endless Viewer",
  86: "Timeless Watcher", 87: "Ageless Seeker", 88: "Immortal Otaku", 89: "Undying Legend", 90: "Deathless God",
  
  // Levels 91-100: Final
  91: "Anime Messiah", 92: "Otaku Savior", 93: "Weeb Prophet", 94: "Culture God", 95: "Media Messiah",
  96: "Entertainment God", 97: "Pop Culture Deity", 98: "Art Form God", 99: "Expression Incarnate", 100: "Max"
};

// Helper: Get level from XP
function getLevelFromXP(xp) {
  for (let level = 100; level >= 1; level--) {
    if (xp >= LEVEL_THRESHOLDS[level]) {
      return level;
    }
  }
  return 1;
}

// Helper: Get title for level
function getTitleForLevel(level) {
  return LEVEL_TITLES[level] || LEVEL_TITLES[100];
}

// Helper: Get XP needed for next level
function getXPToNextLevel(currentLevel, currentXP) {
  const nextXP = LEVEL_THRESHOLDS[currentLevel + 1];
  if (!nextXP) return 0;
  return nextXP - currentXP;
}

// Helper: Get XP progress percentage
function getXPProgress(currentLevel, currentXP) {
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel + 1] || currentLevelXP;
  if (nextLevelXP === currentLevelXP) return 100;
  return ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

// Get global rankings from users collection
router.get('/global', async (req, res) => {
  try {
    const { type = 'level', limit = 100 } = req.query;
    
    let orderField = 'level';
    let orderDirection = 'desc';
    
    if (type === 'xp') {
      orderField = 'totalXP';
    } else if (type === 'anime') {
      orderField = 'totalAnime';
    } else if (type === 'hours') {
      orderField = 'totalHours';
    } else if (type === 'level') {
      orderField = 'level';
    }
    
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .orderBy(orderField, orderDirection)
      .limit(parseInt(limit))
      .get();
    
    const rankings = [];
    let rank = 1;
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const level = userData.level || getLevelFromXP(userData.totalXP || 0);
      
      rankings.push({
        rank: rank++,
        uid: doc.id,
        username: userData.username || userData.name || 'Anime Fan',
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username || userData.name || 'User')}&background=6366F1&color=fff`,
        level: level,
        title: getTitleForLevel(level),
        totalXP: userData.totalXP || 0,
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0
      });
    }
    
    res.json(rankings);
  } catch (error) {
    console.error('Ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's rank
router.get('/my-rank', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return res.json({ 
        rank: 0, 
        totalUsers: 0, 
        level: 1, 
        title: 'Newbie', 
        totalXP: 0,
        xpToNextLevel: LEVEL_THRESHOLDS[2],
        xpProgress: 0,
        nextLevelTitle: 'Scout'
      });
    }
    
    const currentXP = userData.totalXP || 0;
    const currentLevel = getLevelFromXP(currentXP);
    const currentTitle = getTitleForLevel(currentLevel);
    const nextLevelXP = LEVEL_THRESHOLDS[currentLevel + 1] || currentXP;
    const currentLevelXP = LEVEL_THRESHOLDS[currentLevel] || 0;
    const xpToNextLevel = nextLevelXP - currentXP;
    const xpProgress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    const nextLevelTitle = getTitleForLevel(currentLevel + 1);
    
    // Count users with higher XP
    const higherUsers = await db.collection(COLLECTIONS.USERS)
      .where('totalXP', '>', currentXP)
      .count()
      .get();
    
    const totalUsers = (await db.collection(COLLECTIONS.USERS).count().get()).data().count;
    const rank = higherUsers.data().count + 1;
    
    res.json({
      rank,
      totalUsers,
      username: userData.username || userData.name || 'User',
      level: currentLevel,
      title: currentTitle,
      totalXP: currentXP,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      xpProgress: Math.min(100, Math.max(0, xpProgress)),
      nextLevelTitle: nextLevelTitle
    });
    
  } catch (error) {
    console.error('My rank error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard by specific level range
router.get('/by-level/:minLevel/:maxLevel', async (req, res) => {
  const { minLevel, maxLevel } = req.params;
  const { limit = 50 } = req.query;
  
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('level', '>=', parseInt(minLevel))
      .where('level', '<=', parseInt(maxLevel))
      .orderBy('totalXP', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const rankings = [];
    let rank = 1;
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      rankings.push({
        rank: rank++,
        uid: doc.id,
        username: userData.username || userData.name || 'Anime Fan',
        avatar: userData.avatar || null,
        level: userData.level || 1,
        title: getTitleForLevel(userData.level || 1),
        totalXP: userData.totalXP || 0
      });
    }
    
    res.json(rankings);
  } catch (error) {
    console.error('Level range ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get XP progression curve (for level up preview)
router.get('/xp-curve', async (req, res) => {
  try {
    const curve = [];
    for (let level = 1; level <= 100; level++) {
      curve.push({
        level: level,
        title: getTitleForLevel(level),
        xpRequired: LEVEL_THRESHOLDS[level],
        xpToNext: LEVEL_THRESHOLDS[level + 1] ? LEVEL_THRESHOLDS[level + 1] - LEVEL_THRESHOLDS[level] : 0
      });
    }
    res.json(curve);
  } catch (error) {
    console.error('XP curve error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;