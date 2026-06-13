// Helper functions

function formatDate(date) {
  return new Date(date).toISOString();
}

function calculateTotalHours(animeList) {
  return animeList.reduce((total, anime) => {
    if (anime.userStatus !== 'Completed') return total;
    const hours = anime.type === 'Movie'
      ? (anime.duration || 120) / 60
      : ((anime.episodes || 0) * (anime.duration || 20)) / 60;
    return total + hours;
  }, 0);
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

function paginate(array, page, limit) {
  const start = (page - 1) * limit;
  const end = page * limit;
  return {
    data: array.slice(start, end),
    total: array.length,
    page,
    totalPages: Math.ceil(array.length / limit)
  };
}

module.exports = {
  formatDate,
  calculateTotalHours,
  generateId,
  paginate
};
