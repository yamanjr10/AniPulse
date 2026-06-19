﻿const express = require('express');
const { auth, db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Generate JWT token
function generateToken(uid) {
  return jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Register - FIXED: Stores real username properly
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
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username
    });
    
    // Create user profile in Firestore - STORE BOTH name AND username
    const userProfile = {
      uid: userRecord.uid,
      username: username,           // Store as username
      name: username,               // ALSO store as name for consistency
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
    
    // Initialize empty anime list
    await db.collection(COLLECTIONS.ANIME_LISTS).doc(userRecord.uid).set({
      animeList: [],
      lastUpdated: new Date().toISOString()
    });
    
    // Initialize empty friends list
    await db.collection(COLLECTIONS.FRIENDS).doc(userRecord.uid).set({
      friends: [],
      lastUpdated: new Date().toISOString()
    });
    
    const token = generateToken(userRecord.uid);
    
    // Return user data with both fields
    res.status(201).json({
      success: true,
      token,
      user: {
        uid: userRecord.uid,
        username: username,
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

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Get user by email from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user profile from Firestore
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).get();
    let userProfile = userDoc.data();
    
    // If user profile doesn't exist (legacy user), create it
    if (!userProfile) {
      userProfile = {
        uid: userRecord.uid,
        username: userRecord.displayName || email.split('@')[0],
        name: userRecord.displayName || email.split('@')[0],
        email,
        createdAt: new Date().toISOString(),
        totalXP: 0,
        level: 1,
        title: 'Newbie',
        totalAnime: 0,
        totalHours: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userRecord.displayName || email.split('@')[0])}&background=6a5acd&color=fff`
      };
      await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userProfile);
    }
    
    const token = generateToken(userRecord.uid);
    
    // Update last login
    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).update({
      lastLogin: new Date().toISOString()
    });
    
    res.json({
      success: true,
      token,
      user: {
        uid: userRecord.uid,
        username: userProfile.name || userProfile.username,
        name: userProfile.name || userProfile.username,
        email: userProfile.email,
        level: userProfile.level || 1,
        title: userProfile.title || 'Newbie',
        avatar: userProfile.avatar,
        totalXP: userProfile.totalXP || 0,
        totalAnime: userProfile.totalAnime || 0,
        totalHours: userProfile.totalHours || 0
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Verify token and get user
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    res.json({ 
      user: {
        uid: decoded.uid,
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
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;