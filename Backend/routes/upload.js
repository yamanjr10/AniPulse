// routes/upload.js – Avatar stored as base64 in Firestore (with size limit)
const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Max avatar size: 200KB (we already compress on frontend)
const MAX_AVATAR_SIZE_BYTES = 200 * 1024;

// ──────────────────────────────────────────────
// UPLOAD AVATAR (Base64 → Firestore)
// ──────────────────────────────────────────────
router.post('/avatar', verifyToken, async (req, res) => {
  try {
    const { avatar } = req.body; // base64 data URL
    if (!avatar) {
      return res.status(400).json({ error: 'No avatar data provided' });
    }

    // Validate: must be a valid base64 image data URL
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid avatar format. Must be a base64 image data URL.' });
    }

    // Calculate size in bytes
    const sizeInBytes = Buffer.byteLength(avatar, 'utf8');
    const sizeInKB = Math.round(sizeInBytes / 1024);

    if (sizeInBytes > MAX_AVATAR_SIZE_BYTES) {
      return res.status(400).json({
        error: `Avatar too large: ${sizeInKB}KB. Max ${MAX_AVATAR_SIZE_BYTES / 1024}KB. Please compress further.`
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
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;