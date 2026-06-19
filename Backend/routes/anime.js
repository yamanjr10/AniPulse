﻿const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const router = express.Router();

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Auto-save anime list
router.post('/save', verifyToken, async (req, res) => {
  const { animeList } = req.body;
  try {
    await db.collection(COLLECTIONS.ANIME_LISTS).doc(req.userId).set({
      animeList,
      lastUpdated: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Load anime list
router.get('/load', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(req.userId).get();
    res.json({ animeList: doc.exists ? doc.data().animeList || [] : [] });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Load anime list for a specific user (for leaderboard)
router.get('/load-user/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    let animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    if (!animeDoc.exists) {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      if (userDoc.exists && userDoc.data().animeList) {
        return res.json({ animeList: userDoc.data().animeList });
      }
    }
    res.json({ animeList: animeDoc.exists ? animeDoc.data().animeList || [] : [] });
  } catch (error) {
    console.error('Load user anime error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save activity log
router.post('/save-activity', verifyToken, async (req, res) => {
  const { activities } = req.body;
  try {
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(req.userId).set({
      activities,
      lastUpdated: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Save activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Load activity log
router.get('/load-activity', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(req.userId).get();
    res.json({ activities: doc.exists ? doc.data().activities || [] : [] });
  } catch (error) {
    console.error('Load activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add to the anime save endpoint
router.post('/save', verifyToken, async (req, res) => {
  const { animeList } = req.body;
  const userId = req.userId;
  
  try {
    // Get previous anime list to check for newly completed anime
    const oldDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
    const oldAnimeList = oldDoc.exists ? oldDoc.data().animeList || [] : [];
    
    // Find newly completed anime
    const oldCompletedIds = new Set(
      oldAnimeList.filter(a => a.userStatus === 'Completed').map(a => a.animeId || a.id)
    );
    
    const newCompletedAnime = animeList.filter(a => 
      a.userStatus === 'Completed' && 
      !oldCompletedIds.has(a.animeId || a.id)
    );
    
    // Create notifications for newly completed anime
    for (const anime of newCompletedAnime) {
      const title = anime.title || 'Anime';
      const message = `You completed "${title}"!`;
      
      await createNotification(userId, 'anime_complete', 'Anime Completed', message, {
        animeId: anime.animeId || anime.id,
        animeTitle: title,
        score: anime.score
      });
      
      // Check for achievements
      await checkAchievements(userId, animeList);
    }
    
    // Save the anime list
    await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).set({
      animeList,
      lastUpdated: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Achievement checking function
async function checkAchievements(userId, animeList) {
  const completedCount = animeList.filter(a => a.userStatus === 'Completed').length;
  const achievementsToUnlock = [];
  
  // Check for achievements
  if (completedCount >= 1 && completedCount < 5) {
    achievementsToUnlock.push({ name: 'First Step', message: 'Completed your first anime!' });
  }
  if (completedCount >= 5 && completedCount < 10) {
    achievementsToUnlock.push({ name: 'Getting Started', message: 'Completed 5 anime!' });
  }
  if (completedCount >= 10 && completedCount < 25) {
    achievementsToUnlock.push({ name: 'Anime Enthusiast', message: 'Completed 10 anime!' });
  }
  if (completedCount >= 25 && completedCount < 50) {
    achievementsToUnlock.push({ name: 'Marathon Runner', message: 'Completed 25 anime!' });
  }
  if (completedCount >= 50 && completedCount < 100) {
    achievementsToUnlock.push({ name: 'Elite Watcher', message: 'Completed 50 anime!' });
  }
  if (completedCount >= 100) {
    achievementsToUnlock.push({ name: 'Anime Legend', message: 'Completed 100 anime!' });
  }
  
  // Unlock achievements and create notifications
  for (const achievement of achievementsToUnlock) {
    await createNotification(userId, 'achievement', 'Achievement Unlocked!', achievement.message, {
      achievement: achievement.name
    });
  }
}



module.exports = router;