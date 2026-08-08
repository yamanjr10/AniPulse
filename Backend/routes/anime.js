﻿const express = require('express');
const { db, COLLECTIONS, admin } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const { createNotification } = require('./user');

const router = express.Router();

// Send friend request
router.post('/request/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const fromUserId = req.userId;
  if (fromUserId === userId) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }
  try {
    // Get sender name
    let senderDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(fromUserId).get();
    if (!senderDoc.exists) senderDoc = await db.collection(COLLECTIONS.USERS).doc(fromUserId).get();
    const senderData = senderDoc.data();
    const senderName = senderData.name || senderData.username || 'Someone';

    // Check if already friends
    const friendsDoc = await db.collection(COLLECTIONS.FRIENDS).doc(fromUserId).get();
    const friends = friendsDoc.data()?.friends || [];
    if (friends.includes(userId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check for pending request
    const existingRequest = await db.collection(COLLECTIONS.FRIEND_REQUESTS)
      .where('from', '==', fromUserId)
      .where('to', '==', userId)
      .where('status', '==', 'pending')
      .get();
    if (!existingRequest.empty) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    const request = {
      from: fromUserId,
      to: userId,
      fromName: senderName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const requestRef = await db.collection(COLLECTIONS.FRIEND_REQUESTS).add(request);
    await createNotification(
      userId,
      'friend_request',
      'New Friend Request',
      `${senderName} sent you a friend request`,
      { fromUserId, fromName: senderName, requestId: requestRef.id }
    );
    res.json({ success: true, message: 'Friend request sent', requestId: requestRef.id });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request (with transaction)
router.post('/accept/:requestId', verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;

  try {
    const requestDoc = await db.collection(COLLECTIONS.FRIEND_REQUESTS).doc(requestId).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });
    const request = requestDoc.data();
    if (request.to !== userId) return res.status(403).json({ error: 'Unauthorized' });

    // Get acceptor name
    let acceptorDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
    if (!acceptorDoc.exists) acceptorDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const acceptorName = acceptorDoc.data()?.name || acceptorDoc.data()?.username || 'Someone';

    // Use transaction for atomic updates
    await db.runTransaction(async (transaction) => {
      const fromRef = db.collection(COLLECTIONS.FRIENDS).doc(request.from);
      const toRef = db.collection(COLLECTIONS.FRIENDS).doc(request.to);
      transaction.update(fromRef, { friends: admin.firestore.FieldValue.arrayUnion(request.to) });
      transaction.update(toRef, { friends: admin.firestore.FieldValue.arrayUnion(request.from) });
      transaction.delete(requestDoc.ref);
    });

    await createNotification(
      request.from,
      'friend_accepted',
      'Friend Request Accepted',
      `${acceptorName} accepted your friend request`,
      { userId, userName: acceptorName }
    );

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Decline friend request
router.post('/decline/:requestId', verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;
  try {
    const requestDoc = await db.collection(COLLECTIONS.FRIEND_REQUESTS).doc(requestId).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });
    const request = requestDoc.data();
    if (request.to !== userId) return res.status(403).json({ error: 'Unauthorized' });
    await requestDoc.ref.delete();
    res.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    console.error('Decline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get friends list
router.get('/list', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const friendsDoc = await db.collection(COLLECTIONS.FRIENDS).doc(userId).get();
    const friendIds = friendsDoc.data()?.friends || [];
    const friends = [];
    for (const friendId of friendIds) {
      let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(friendId).get();
      if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(friendId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const displayName = userData.name || userData.username || 'User';
        friends.push({
          uid: friendId,
          name: displayName,
          username: displayName,
          title: userData.title || 'Newbie',
          level: userData.level || 1,
          totalXP: userData.totalXP || 0,
          totalAnime: userData.totalAnime || 0,
          totalHours: userData.totalHours || 0,
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366F1&color=fff`
        });
      }
    }
    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending friend requests
router.get('/requests', verifyToken, async (req, res) => {
  const userId = req.userId;
  try {
    const snapshot = await db.collection(COLLECTIONS.FRIEND_REQUESTS)
      .where('to', '==', userId)
      .where('status', '==', 'pending')
      .get();
    const requests = [];
    for (const doc of snapshot.docs) {
      const request = doc.data();
      let userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(request.from).get();
      if (!userDoc.exists) userDoc = await db.collection(COLLECTIONS.USERS).doc(request.from).get();
      const userData = userDoc.data();
      if (userData) {
        const displayName = userData.name || userData.username || 'User';
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
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove friend
router.delete('/remove/:friendId', verifyToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.userId;
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection(COLLECTIONS.FRIENDS).doc(userId);
      const friendRef = db.collection(COLLECTIONS.FRIENDS).doc(friendId);
      transaction.update(userRef, { friends: admin.firestore.FieldValue.arrayRemove(friendId) });
      transaction.update(friendRef, { friends: admin.firestore.FieldValue.arrayRemove(userId) });
    });
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;