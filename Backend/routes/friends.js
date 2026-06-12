const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import notification function from user.js
const userModule = require('./user');
const createNotification = userModule.createNotification;

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

// ============================================
// SEND FRIEND REQUEST - WITH NOTIFICATION
// ============================================
router.post('/request/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const fromUserId = req.userId;
  
  if (fromUserId === userId) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' });
  }
  
  try {
    // Get sender's name
    let senderDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(fromUserId).get();
    if (!senderDoc.exists) {
      senderDoc = await db.collection(COLLECTIONS.USERS).doc(fromUserId).get();
    }
    const senderData = senderDoc.data();
    let senderName = senderData.name || senderData.username || 'Someone';
    
    // Check if already friends
    const friendsDoc = await db.collection(COLLECTIONS.FRIENDS).doc(fromUserId).get();
    const friends = friendsDoc.data()?.friends || [];
    if (friends.includes(userId)) {
      return res.status(400).json({ error: 'Already friends' });
    }
    
    // Check if request already exists
    const existingRequest = await db.collection(COLLECTIONS.FRIEND_REQUESTS)
      .where('from', '==', fromUserId)
      .where('to', '==', userId)
      .where('status', '==', 'pending')
      .get();
    
    if (!existingRequest.empty) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }
    
    // Create friend request
    const request = {
      from: fromUserId,
      to: userId,
      fromName: senderName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const requestRef = await db.collection(COLLECTIONS.FRIEND_REQUESTS).add(request);
    
    console.log(`📤 Friend request sent from ${senderName} (${fromUserId}) to ${userId}`);
    
    // Send notification to target user
    if (createNotification) {
      await createNotification(
        userId, 
        'friend_request', 
        'New Friend Request', 
        `${senderName} sent you a friend request`,
        { 
          fromUserId: fromUserId, 
          fromName: senderName, 
          requestId: requestRef.id 
        }
      );
      console.log(`✅ Notification created for user ${userId}`);
    }
    
    res.json({ success: true, message: 'Friend request sent', requestId: requestRef.id });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ACCEPT FRIEND REQUEST - WITH NOTIFICATION
// ============================================
router.post('/accept/:requestId', verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;
  
  try {
    const requestDoc = await db.collection(COLLECTIONS.FRIEND_REQUESTS).doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = requestDoc.data();
    if (request.to !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get acceptor's name
    let acceptorDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!acceptorDoc.exists) {
      acceptorDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    }
    const acceptorData = acceptorDoc.data();
    const acceptorName = acceptorData.name || acceptorData.username || 'Someone';
    
    // Add to friends lists
    const admin = require('firebase-admin');
    await db.collection(COLLECTIONS.FRIENDS).doc(request.from).set({
      friends: admin.firestore.FieldValue.arrayUnion(request.to)
    }, { merge: true });
    
    await db.collection(COLLECTIONS.FRIENDS).doc(request.to).set({
      friends: admin.firestore.FieldValue.arrayUnion(request.from)
    }, { merge: true });
    
    // Send notification to the person who sent the request
    if (createNotification) {
      await createNotification(
        request.from,
        'friend_accepted',
        'Friend Request Accepted',
        `${acceptorName} accepted your friend request`,
        { userId: userId, userName: acceptorName }
      );
      console.log(`✅ Acceptance notification sent to ${request.from}`);
    }
    
    // Delete request
    await requestDoc.ref.delete();
    
    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DECLINE FRIEND REQUEST
// ============================================
router.post('/decline/:requestId', verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;
  
  try {
    const requestDoc = await db.collection(COLLECTIONS.FRIEND_REQUESTS).doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = requestDoc.data();
    if (request.to !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await requestDoc.ref.delete();
    
    res.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    console.error('Decline request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET FRIENDS LIST
// ============================================
router.get('/list', verifyToken, async (req, res) => {
  const userId = req.userId;
  
  console.log('📋 Getting friends list for user:', userId);
  
  try {
    const friendsDoc = await db.collection(COLLECTIONS.FRIENDS).doc(userId).get();
    const friendIds = friendsDoc.data()?.friends || [];
    
    console.log(`Found ${friendIds.length} friend IDs`);
    
    const friends = [];
    for (const friendId of friendIds) {
      let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(friendId).get();
      
      if (!userDoc.exists) {
        userDoc = await db.collection(COLLECTIONS.USERS).doc(friendId).get();
      }
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        let displayName = userData.name || userData.username;
        
        if (!displayName || displayName === 'User' || displayName === 'Anime Fan') {
          const avatarMatch = userData.avatar?.match(/name=([^&]+)/);
          if (avatarMatch) {
            displayName = decodeURIComponent(avatarMatch[1]);
          } else {
            displayName = 'User';
          }
        }
        
        let level = userData.level || 1;
        let title = userData.title || 'Newbie';
        
        friends.push({
          uid: friendId,
          name: displayName,
          username: displayName,
          title: title,
          level: level,
          totalXP: userData.totalXP || userData.totalExp || 0,
          totalAnime: userData.totalAnime || 0,
          totalHours: userData.totalHours || 0,
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`
        });
        
        console.log(`✅ Friend: ${displayName} (Lv.${level})`);
      }
    }
    
    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET PENDING FRIEND REQUESTS
// ============================================
router.get('/requests', verifyToken, async (req, res) => {
  const userId = req.userId;
  
  console.log(`📬 Getting pending requests for user: ${userId}`);
  
  try {
    const requestsSnapshot = await db.collection(COLLECTIONS.FRIEND_REQUESTS)
      .where('to', '==', userId)
      .where('status', '==', 'pending')
      .get();
    
    const requests = [];
    for (const doc of requestsSnapshot.docs) {
      const request = doc.data();
      
      let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(request.from).get();
      if (!userDoc.exists) {
        userDoc = await db.collection(COLLECTIONS.USERS).doc(request.from).get();
      }
      const userData = userDoc.data();
      
      if (userData) {
        let displayName = userData.name || userData.username;
        if (!displayName || displayName === 'User') {
          const avatarMatch = userData.avatar?.match(/name=([^&]+)/);
          if (avatarMatch) {
            displayName = decodeURIComponent(avatarMatch[1]);
          } else {
            displayName = 'User';
          }
        }
        
        requests.push({
          id: doc.id,
          from: request.from,
          fromName: request.fromName || displayName,
          fromUsername: displayName,
          fromAvatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`,
          fromLevel: userData.level || 1,
          createdAt: request.createdAt
        });
      }
    }
    
    console.log(`✅ Found ${requests.length} pending requests`);
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// REMOVE FRIEND
// ============================================
router.delete('/remove/:friendId', verifyToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.userId;
  
  try {
    const admin = require('firebase-admin');
    await db.collection(COLLECTIONS.FRIENDS).doc(userId).update({
      friends: admin.firestore.FieldValue.arrayRemove(friendId)
    });
    
    await db.collection(COLLECTIONS.FRIENDS).doc(friendId).update({
      friends: admin.firestore.FieldValue.arrayRemove(userId)
    });
    
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;