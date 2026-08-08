﻿const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const { getLevelFromXP, getTitleForLevel } = require('../utils/levelSystem');

const router = express.Router();

// Global ranking (paginated)
router.get('/global-paginated', verifyToken, async (req, res) => {
  try {
    const { limit = 20, page = 1, type = 'xp' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const sortField = type === 'xp' ? 'totalXP' :
      type === 'level' ? 'level' :
        type === 'anime' ? 'totalAnime' :
          type === 'hours' ? 'totalHours' : 'totalXP';

    const snapshot = await db.collection(COLLECTIONS.USERS)
      .orderBy(sortField, 'desc')
      .offset(offset)
      .limit(parseInt(limit))
      .get();

    const rankings = [];
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const uid = doc.id;
      const displayName = userData.name || userData.username;
      if (!displayName || displayName === 'User') continue;
      const level = userData.level || 1;
      rankings.push({
        uid,
        username: displayName,
        name: displayName,
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff&bold=true&size=200`,
        level,
        title: getTitleForLevel(level),
        totalXP: userData.totalXP || 0,
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0,
        totalEpisodes: userData.totalEpisodes || 0,
        isCurrentUser: uid === req.userId
      });
    }

    // Total users count
    let totalUsers = 0;
    try {
      const countSnap = await db.collection(COLLECTIONS.USERS).count().get();
      totalUsers = countSnap.data().count || 0;
    } catch (e) {
      totalUsers = rankings.length;
    }

    // Current user rank (if not on this page)
    let userRank = null;
    if (req.userId) {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
      if (userDoc.exists) {
        const userXP = userDoc.data().totalXP || 0;
        const higher = await db.collection(COLLECTIONS.USERS)
          .where('totalXP', '>', userXP)
          .count()
          .get();
        userRank = higher.data().count + 1;
      }
    }

    const ranked = rankings.map((u, i) => ({ ...u, rank: offset + i + 1 }));

    res.json({
      rankings: ranked,
      totalUsers,
      currentUserRank: userRank,
      currentUserId: req.userId,
      page: parseInt(page),
      totalPages: Math.ceil(totalUsers / parseInt(limit))
    });
  } catch (error) {
    console.error('Global ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// My rank
router.get('/my-rank', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
    const userData = userDoc.data();
    if (!userData) {
      return res.json({ rank: 0, totalUsers: 0, level: 1, title: 'Newbie', totalXP: 0 });
    }
    const currentXP = userData.totalXP || 0;
    const currentLevel = getLevelFromXP(currentXP);
    const currentTitle = getTitleForLevel(currentLevel);
    const nextLevelXP = getXPToNextLevel(currentLevel, currentXP);
    const progress = getXPProgress(currentLevel, currentXP);

    let rank = 0, totalUsers = 0;
    try {
      const higher = await db.collection(COLLECTIONS.USERS)
        .where('totalXP', '>', currentXP)
        .count()
        .get();
      const countSnap = await db.collection(COLLECTIONS.USERS).count().get();
      totalUsers = countSnap.data().count || 0;
      rank = higher.data().count + 1;
    } catch (e) {
      rank = 1; totalUsers = 1;
    }

    res.json({
      rank,
      totalUsers,
      username: userData.username || userData.name || 'User',
      level: currentLevel,
      title: currentTitle,
      totalXP: currentXP,
      xpToNextLevel: Math.max(0, nextLevelXP),
      xpProgress: Math.min(100, Math.max(0, progress)),
      nextLevelTitle: getTitleForLevel(currentLevel + 1)
    });
  } catch (error) {
    console.error('My rank error:', error);
    res.status(500).json({ error: error.message });
  }
});

// XP curve (optional)
router.get('/xp-curve', async (req, res) => {
  const { LEVEL_THRESHOLDS, getTitleForLevel } = require('../utils/levelSystem');
  const curve = [];
  for (let level = 1; level <= 100; level++) {
    curve.push({
      level,
      title: getTitleForLevel(level),
      xpRequired: LEVEL_THRESHOLDS[level],
      xpToNext: LEVEL_THRESHOLDS[level + 1] ? LEVEL_THRESHOLDS[level + 1] - LEVEL_THRESHOLDS[level] : 0
    });
  }
  res.json(curve);
});

module.exports = router;