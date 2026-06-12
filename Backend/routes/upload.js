const express = require('express');
const multer = require('multer');
const path = require('path');
const { bucket, db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP allowed.'));
    }
  }
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.uid;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Upload avatar
router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.userId;
    const timestamp = Date.now();
    const filename = `avatars/${userId}_${timestamp}.webp`;
    const file = bucket.file(filename);
    
    // Compress and convert image to WebP using sharp
    let imageBuffer = req.file.buffer;
    
    try {
      // Compress image (max 200x200, quality 80)
      imageBuffer = await sharp(req.file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (sharpError) {
      console.warn('Sharp compression failed, using original:', sharpError.message);
      // If sharp fails, use original but still try to upload
    }
    
    // Upload to Firebase Storage
    await file.save(imageBuffer, {
      metadata: { 
        contentType: 'image/webp',
        metadata: {
          uploadedBy: userId,
          originalName: req.file.originalname
        }
      }
    });
    
    // Make file publicly accessible
    await file.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    
    // Update user profile in Firestore - USERS collection
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      avatar: publicUrl,
      avatarUpdated: new Date().toISOString()
    }).catch(async () => {
      // If user doesn't exist, create it
      await db.collection(COLLECTIONS.USERS).doc(userId).set({
        avatar: publicUrl,
        avatarUpdated: new Date().toISOString(),
        username: req.body.username || 'User',
        createdAt: new Date().toISOString()
      });
    });
    
    // Also update userProfile collection
    await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).set({
      avatar: publicUrl,
      avatarUpdated: new Date().toISOString()
    }, { merge: true });
    
    console.log(`✅ Avatar uploaded for user: ${userId}`);
    
    res.json({
      success: true,
      avatarUrl: publicUrl,
      message: 'Avatar uploaded successfully'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get avatar URL
router.get('/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    
    if (userDoc.exists && userDoc.data().avatar) {
      res.json({ avatarUrl: userDoc.data().avatar });
    } else {
      // Generate default avatar using UI Avatars
      const username = userDoc.data()?.username || 'User';
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&bold=true&length=2&size=200`;
      res.json({ avatarUrl: defaultAvatar });
    }
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete avatar
router.delete('/avatar', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get current avatar URL
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const currentAvatar = userDoc.data()?.avatar;
    
    if (currentAvatar && currentAvatar.includes('storage.googleapis.com')) {
      // Extract filename from URL
      const filename = currentAvatar.split('/').pop();
      const file = bucket.file(`avatars/${filename}`);
      await file.delete().catch(() => {});
    }
    
    // Set default avatar
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
    
    res.json({
      success: true,
      avatarUrl: defaultAvatar,
      message: 'Avatar removed'
    });
    
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;