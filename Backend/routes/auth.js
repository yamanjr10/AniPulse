﻿const express = require('express');
const { auth, db, COLLECTIONS } = require('../services/firebase');
const router = express.Router();

// Register – uses Firebase Admin SDK to create user, then stores profile
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    // Check if username exists (case insensitive)
    const existingUser = await db.collection(COLLECTIONS.USERS)
      .where('username', '==', username)
      .get();
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username
    });

    const userProfile = {
      uid: userRecord.uid,
      username,
      name: username,
      email,
      createdAt: new Date().toISOString(),
      totalXP: 0,
      level: 1,
      title: 'Newbie',
      totalAnime: 0,
      totalHours: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6a5acd&color=fff`
    };

    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userProfile);
    await db.collection(COLLECTIONS.ANIME_LISTS).doc(userRecord.uid).set({ animeList: [], lastUpdated: new Date().toISOString() });
    await db.collection(COLLECTIONS.FRIENDS).doc(userRecord.uid).set({ friends: [], lastUpdated: new Date().toISOString() });

    // Return user data (no token – client will sign in with Firebase Client SDK)
    res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        username,
        name: username,
        email,
        level: 1,
        title: 'Newbie',
        avatar: userProfile.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login with Firebase ID token (client sends the token)
router.post('/login', async (req, res) => {
  const { token } = req.body; // Firebase ID token from client
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!userDoc.exists) {
      // If user profile missing, create one using decoded data
      const newUser = {
        uid,
        username: decoded.name || decoded.email.split('@')[0],
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        avatar: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name || 'User')}&background=6a5acd&color=fff`,
        createdAt: new Date().toISOString(),
        totalXP: 0,
        level: 1,
        title: 'Newbie',
        totalAnime: 0,
        totalHours: 0
      };
      await db.collection(COLLECTIONS.USERS).doc(uid).set(newUser);
      await db.collection(COLLECTIONS.ANIME_LISTS).doc(uid).set({ animeList: [], lastUpdated: new Date().toISOString() });
      await db.collection(COLLECTIONS.FRIENDS).doc(uid).set({ friends: [], lastUpdated: new Date().toISOString() });
      const userData = newUser;
      return res.json({
        success: true,
        user: {
          uid: userData.uid,
          username: userData.name || userData.username,
          name: userData.name || userData.username,
          email: userData.email,
          level: userData.level || 1,
          title: userData.title || 'Newbie',
          avatar: userData.avatar,
          totalXP: userData.totalXP || 0,
          totalAnime: userData.totalAnime || 0,
          totalHours: userData.totalHours || 0
        }
      });
    }
    const userData = userDoc.data();
    // Update last login
    await db.collection(COLLECTIONS.USERS).doc(uid).update({ lastLogin: new Date().toISOString() });

    res.json({
      success: true,
      user: {
        uid: userData.uid,
        username: userData.name || userData.username,
        name: userData.name || userData.username,
        email: userData.email,
        level: userData.level || 1,
        title: userData.title || 'Newbie',
        avatar: userData.avatar,
        totalXP: userData.totalXP || 0,
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Google Sign-In – same as login but specifically for Google (or just reuse /login)
// We'll keep it separate for clarity
router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });
  try {
    const decoded = await auth.verifyIdToken(token);
    // Same logic as /login – we can just call the same handler, but we duplicate for clarity.
    // In practice you can combine both into one endpoint.
    const uid = decoded.uid;
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!userDoc.exists) {
      const newUser = {
        uid,
        username: decoded.name || decoded.email.split('@')[0],
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        avatar: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name || 'User')}&background=6a5acd&color=fff`,
        createdAt: new Date().toISOString(),
        totalXP: 0,
        level: 1,
        title: 'Newbie',
        totalAnime: 0,
        totalHours: 0
      };
      await db.collection(COLLECTIONS.USERS).doc(uid).set(newUser);
      await db.collection(COLLECTIONS.ANIME_LISTS).doc(uid).set({ animeList: [], lastUpdated: new Date().toISOString() });
      await db.collection(COLLECTIONS.FRIENDS).doc(uid).set({ friends: [], lastUpdated: new Date().toISOString() });
      userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    }
    const userData = userDoc.data();
    await db.collection(COLLECTIONS.USERS).doc(uid).update({ lastLogin: new Date().toISOString() });

    res.json({
      success: true,
      user: {
        uid: userData.uid,
        username: userData.name || userData.username,
        name: userData.name || userData.username,
        email: userData.email,
        level: userData.level || 1,
        title: userData.title || 'Newbie',
        avatar: userData.avatar,
        totalXP: userData.totalXP || 0,
        totalAnime: userData.totalAnime || 0,
        totalHours: userData.totalHours || 0
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Verify token and return user (protected)
const { verifyToken } = require('../middleware/auth');
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const userData = userDoc.data();
    res.json({
      user: {
        uid: req.userId,
        username: userData.name || userData.username,
        name: userData.name || userData.username,
        email: userData.email,
        level: userData.level || 1,
        title: userData.title || 'Newbie',
        avatar: userData.avatar,
        totalXP: userData.totalXP || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;