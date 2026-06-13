// Application constants

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Ecchi', 'Mecha',
  'Psychological', 'Historical', 'Martial Arts', 'Music', 'Parody'
];

const ANIME_TYPES = ['TV', 'Movie', 'OVA', 'ONA', 'Special'];

const USER_STATUSES = ['Completed', 'Watching', 'Plan to Watch', 'Dropped'];

const POST_CATEGORIES = ['discussion', 'recommendation', 'question', 'achievement'];

const ACHIEVEMENTS = [
  { id: 'first_complete', name: 'First Completion', xpReward: 50 },
  { id: 'episode_100', name: '100 Episodes', xpReward: 100 },
  { id: 'anime_10', name: '10 Anime Completed', xpReward: 200 },
  { id: 'genre_master', name: 'Genre Master', xpReward: 150 },
  { id: 'streak_7', name: '7 Day Streak', xpReward: 100 }
];

module.exports = {
  GENRES,
  ANIME_TYPES,
  USER_STATUSES,
  POST_CATEGORIES,
  ACHIEVEMENTS
};
