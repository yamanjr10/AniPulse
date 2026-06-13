// Seed database with sample data
const { db } = require('../services/firebase');

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  // Add sample achievements
  const achievements = [
    { id: 'achievement_1', name: 'First Anime', description: 'Complete your first anime', xpReward: 50 },
    { id: 'achievement_2', name: '10 Hours', description: 'Watch 10 hours of anime', xpReward: 100 },
    { id: 'achievement_3', name: 'Genre Explorer', description: 'Watch 5 different genres', xpReward: 150 }
  ];
  
  for (const achievement of achievements) {
    await db.collection('globalAchievements').doc(achievement.id).set(achievement);
    console.log(`✅ Added achievement: ${achievement.name}`);
  }
  
  console.log('🎉 Database seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}

module.exports = { seedDatabase };
