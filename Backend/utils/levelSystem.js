// Level System Configuration (Mirrors frontend)
const LEVELS = [
  { level: 1, title: "Newbie", xpRequired: 0 },
  { level: 2, title: "Scout", xpRequired: 100 },
  { level: 3, title: "Viewer", xpRequired: 250 },
  { level: 4, title: "Otaku", xpRequired: 500 },
  { level: 5, title: "Fanatic", xpRequired: 800 },
  { level: 6, title: "Binge Hunter", xpRequired: 1200 },
  { level: 7, title: "Senpai", xpRequired: 1700 },
  { level: 8, title: "Shonen Hero", xpRequired: 2300 },
  { level: 9, title: "Elite Otaku", xpRequired: 3000 },
  { level: 10, title: "Anime Legend", xpRequired: 4000 },
  { level: 11, title: "Sage", xpRequired: 5200 },
  { level: 12, title: "Archive Keeper", xpRequired: 6500 },
  { level: 13, title: "Dimension Traveler", xpRequired: 8000 },
  { level: 14, title: "Anime Master", xpRequired: 10000 },
  { level: 15, title: "Grand Senpai", xpRequired: 12500 },
  { level: 16, title: "Hokage", xpRequired: 15000 },
  { level: 17, title: "Transcendent", xpRequired: 18000 },
  { level: 18, title: "Elite", xpRequired: 22000 },
  { level: 19, title: "Eternal Watcher", xpRequired: 27000 },
  { level: 20, title: "Legend", xpRequired: 35000 },
  { level: 21, title: "Anime Deity", xpRequired: 45000 }
];

function getLevelFromXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

function calculateXPToNextLevel(currentXP) {
  const currentLevel = getLevelFromXP(currentXP);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  if (!nextLevel) return 0;
  return nextLevel.xpRequired - currentXP;
}

function calculateXPProgress(currentXP) {
  const currentLevel = getLevelFromXP(currentXP);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  if (!nextLevel) return 100;
  const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;
  const xpEarned = currentXP - currentLevel.xpRequired;
  return (xpEarned / xpNeeded) * 100;
}

module.exports = {
  LEVELS,
  getLevelFromXP,
  calculateXPToNextLevel,
  calculateXPProgress
};
