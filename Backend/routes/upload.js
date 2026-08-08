// routes/upload.js – Avatar stored as base64 in Firestore
const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// ──────────────────────────────────────────────
// UPLOAD AVATAR (Base64 → Firestore)
// ──────────────────────────────────────────────
router.post('/avatar', verifyToken, async (req, res) => {
  try {
    const { avatar } = req.body; // base64 data URL
    if (!avatar) {
      return res.status(400).json({ error: 'No avatar data provided' });
    }

    // Optional: validate size (max 500KB after compression)
    const sizeInKB = Math.round(avatar.length / 1024);
    if (sizeInKB > 500) {
      return res.status(400).json({
        error: `Avatar too large: ${sizeInKB}KB. Max 500KB.`
      });
    }

    const userId = req.userId;

    // Update both collections
    await db.collection(COLLECTIONS.USERS).doc(userId).set({
      avatar: avatar,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });

    await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
      avatar: avatar,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });

    console.log(`✅ Avatar saved for user: ${userId} (${sizeInKB}KB)`);

    res.json({
      success: true,
      avatarUrl: avatar,
      size: sizeInKB,
      message: 'Avatar saved successfully'
    });

  } catch (error) {
    console.error('Avatar save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// GET AVATAR
// ──────────────────────────────────────────────
router.get('/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    }
    const userData = userDoc.data();
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=6366F1&color=fff&bold=true&length=2&size=200`;
    res.json({
      avatarUrl: userData?.avatar || defaultAvatar,
      hasCustom: !!userData?.avatar
    });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// DELETE AVATAR (reset to default)
// ──────────────────────────────────────────────
router.delete('/avatar', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const username = userDoc.data()?.username || 'User';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&bold=true&length=2&size=200`;

    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      avatar: defaultAvatar,
      avatarUpdated: new Date().toISOString()
    });
    await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
      avatar: defaultAvatar,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, avatarUrl: defaultAvatar });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;