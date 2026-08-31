// Complete level thresholds (1‑100) – copied from ranking.js
const LEVEL_THRESHOLDS = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 1700, 8: 2300, 9: 3000,
  10: 4000, 11: 5200, 12: 6500, 13: 8000, 14: 10000, 15: 12500, 16: 15000,
  17: 18000, 18: 22000, 19: 27000, 20: 35000, 21: 45000,
  22: 53000, 23: 62000, 24: 72000, 25: 83000, 26: 95000,
  27: 108000, 28: 122000, 29: 137000, 30: 153000,
  31: 170000, 32: 188000, 33: 207000, 34: 227000, 35: 248000,
  36: 270000, 37: 293000, 38: 317000, 39: 342000, 40: 368000,
  41: 395000, 42: 423000, 43: 452000, 44: 482000, 45: 513000,
  46: 545000, 47: 578000, 48: 612000, 49: 647000, 50: 683000
};

const LEVEL_TITLES = {
  1: "Newbie", 2: "Scout", 3: "Viewer", 4: "Otaku", 5: "Fanatic",
  6: "Binge", 7: "Senpai", 8: "Shonen", 9: "Elite", 10: "Legend",
  11: "Sage", 12: "Keeper", 13: "Traveler", 14: "Master", 15: "Grand",
  16: "Hokage", 17: "Transc", 18: "Veteran", 19: "Watcher", 20: "Myth",
  21: "Deity", 22: "Mythic", 23: "Ascend", 24: "Divine", 25: "Cosmic",
  26: "Eternal", 27: "Godly", 28: "Celest", 29: "Potent", 30: "Absol",
  31: "Supreme", 32: "VLord", 33: "StarE", 34: "Galaxy", 35: "Walker",
  36: "DimLord", 37: "Weaver", 38: "TimeM", 39: "SpaceG", 40: "Etern",
  41: "Infini", 42: "Omni", 43: "Creator", 44: "Prime", 45: "Alpha",
  46: "Omega", 47: "Genesis", 48: "Apoc", 49: "Nirvana", 50: "Max"
};

function getLevelFromXP(xp) {
  for (let level = 100; level >= 1; level--) {
    if (xp >= LEVEL_THRESHOLDS[level]) return level;
  }
  return 1;
}

function getTitleForLevel(level) {
  return LEVEL_TITLES[level] || LEVEL_TITLES[100];
}

function getXPToNextLevel(currentLevel, currentXP) {
  const nextXP = LEVEL_THRESHOLDS[currentLevel + 1];
  if (!nextXP) return 0;
  return nextXP - currentXP;
}

function getXPProgress(currentLevel, currentXP) {
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel + 1] || currentLevelXP;
  if (nextLevelXP === currentLevelXP) return 100;
  return ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

module.exports = {
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  getLevelFromXP,
  getTitleForLevel,
  getXPToNextLevel,
  getXPProgress
};