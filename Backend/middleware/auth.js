const express = require('express');
const { auth, db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Generate JWT token
function generateToken(uid) {
  return jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ============================================
// VERIFY JWT TOKEN (NOT Firebase ID token)
// ============================================
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Handle both "Bearer token" and "Bearer token" formats
  let token = authHeader;
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  } else if (token.startsWith('bearer ')) {
    token = token.slice(7);
  }
  
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

// Optional auth (for public routes that might have auth)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }
  
  let token = authHeader;
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  } else if (token.startsWith('bearer ')) {
    token = token.slice(7);
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.uid;
      req.user = decoded;
    } catch (error) {
      // Invalid token, but continue as unauthenticated
    }
  }
  next();
}

// ============================================
// REGISTER
// ============================================
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  
  try {
    // Check if username exists
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
    
    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      username: username,
      name: username,
      email,
      createdAt: new Date().toISOString(),
      totalXP: 0,
      level: 1,
      title: 'Newbie',
      totalAnime: 0,
      totalHours: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff`
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

// ============================================
// LOGIN
// ============================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Get user by email from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user profile from Firestore
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).get();
    let userProfile = userDoc.data();
    
    // If user profile doesn't exist, create it
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
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userRecord.displayName || email.split('@')[0])}&background=6366F1&color=fff`
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
        username: userProfile.username || userProfile.name,
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

// ============================================
// VERIFY TOKEN
// ============================================
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  let token = authHeader;
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
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
        username: userData.username || userData.name,
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

// ============================================
// EXPORT
// ============================================
module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.optionalAuth = optionalAuth;