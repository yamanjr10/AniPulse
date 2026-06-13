// Data migration script
const { db } = require('../services/firebase');

async function migrateLocalData(userId, localData) {
  try {
    console.log(`Starting migration for user: ${userId}`);
    
    // Migrate anime list
    if (localData.animeList) {
      await db.collection('animeLists').doc(userId).set({
        animeList: localData.animeList,
        migratedAt: new Date().toISOString(),
        version: 1
      });
      console.log(`✅ Migrated ${localData.animeList.length} anime entries`);
    }
    
    // Migrate activity log
    if (localData.activityLog) {
      await db.collection('activityLogs').doc(userId).set({
        activities: localData.activityLog,
        migratedAt: new Date().toISOString()
      });
      console.log(`✅ Migrated ${localData.activityLog.length} activities`);
    }
    
    console.log('Migration completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { migrateLocalData };
