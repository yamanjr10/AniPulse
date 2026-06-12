﻿const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID || "",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

// Check if we have the required credentials
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Missing Firebase credentials in environment variables!');
  console.error('Please set: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
} else {
  console.log('✅ Firebase credentials found');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

const COLLECTIONS = {
  USERS: 'users',
  ANIME_LISTS: 'animeLists',
  ACTIVITY_LOGS: 'activityLogs',
  ACHIEVEMENTS: 'achievements',
  XP_HISTORY: 'xpHistory',
  CONTRIBUTIONS: 'contributions',
  USER_PROFILES: 'userProfiles',
  SETTINGS: 'settings',
  FRIENDS: 'friends',
  FRIEND_REQUESTS: 'friendRequests'
};

console.log('✅ Firebase Admin SDK initialized');
console.log(`📁 Collections: ${Object.keys(COLLECTIONS).join(', ')}`);

module.exports = { admin, db, auth, COLLECTIONS };