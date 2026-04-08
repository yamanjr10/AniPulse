// =============================================
//UPDATE 1.0.0
// =============================================

// --- Search Debounce ---
let searchTimeout;
const originalSearch = searchAnime;
window.searchAnime = function () {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => originalSearch(), 400);
};

// --- Auto Backup Reminder ---
document.addEventListener('DOMContentLoaded', () => {
  const lastBackup = localStorage.getItem('lastBackup');
  const now = Date.now();
  if (!lastBackup || now - parseInt(lastBackup) > 7 * 24 * 60 * 60 * 1000) {
    showToast('Reminder: Export your AnimeTracker data for backup!', 'info');
  }
  localStorage.setItem('lastBackup', now.toString());
});

// --- Favorite Genres Over Time Chart (based on user animeData) ---
function calculateUserGenreTrends() {
  const genreTrends = {};
  const years = new Set();

  animeData.forEach(anime => {
    if (anime.userStatus === 'Completed' && anime.genres && anime.finishDate) {
      const finishYear = new Date(anime.finishDate).getFullYear();
      if (isNaN(finishYear)) return;
      years.add(finishYear);

      anime.genres.forEach(genre => {
        if (!genreTrends[genre]) genreTrends[genre] = {};
        genreTrends[genre][finishYear] = (genreTrends[genre][finishYear] || 0) + 1;
      });
    }
  });

  return {
    years: Array.from(years).sort((a, b) => a - b),
    data: genreTrends
  };
}

function initFavoriteGenresChart() {
  const ctx = document.getElementById('favoriteGenresChart')?.getContext('2d');
  if (!ctx) return;

  const { years, data } = calculateUserGenreTrends();
  const genreTotals = Object.entries(data)
    .map(([genre, yearly]) => ({
      genre,
      total: Object.values(yearly).reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const datasets = genreTotals.map(({ genre }, index) => ({
    label: genre,
    data: years.map(y => data[genre][y] || 0),
    borderWidth: 2,
    tension: 0.3,
    fill: true,
    borderColor: [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'
    ][index % 5],
    pointRadius: 4,
  }));

  if (window.favoriteGenresChartInstance) {
    window.favoriteGenresChartInstance.destroy();
  }

  window.favoriteGenresChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels: years, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-light') } },
      },
      scales: {
        x: {
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-light') },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-light') },
          grid: { color: getComputedStyle(document.body).getPropertyValue('--gray') }
        }
      }
    }
  });
}

// Extend initStatisticsCharts safely
const prevInitStats = window.initStatisticsCharts;
window.initStatisticsCharts = function () {
  prevInitStats();
  setTimeout(initFavoriteGenresChart, 500);
};

// --- Toast Queue ---
let toastQueue = [];
let showingToast = false;

const oldShowToast = showToast;
window.showToast = function (msg, type = 'info') {
  toastQueue.push({ msg, type });
  if (!showingToast) processNextToast();
};

function processNextToast() {
  if (toastQueue.length === 0) {
    showingToast = false;
    return;
  }
  showingToast = true;
  const { msg, type } = toastQueue.shift();
  oldShowToast(msg, type);
  setTimeout(processNextToast, 2000);
}

// =============================================
//Greatings
// =============================================

(function () {
  const banner = document.getElementById("greetingBanner");
  if (!banner) return;

  const greetingLine = document.getElementById("greetingLine");
  const greetingEmoji = document.getElementById("greetingEmoji");
  const greetingSubline = document.getElementById("greetingSubline");
  const liveClock = document.getElementById("liveClock");
  const dailyFocus = document.getElementById("dailyFocus");
  const streakInfo = document.getElementById("streakInfo");
  const dailyQuote = document.getElementById("dailyQuote");
  const dismissBtn = document.getElementById("dismissGreeting");

  const userName =
    window.userName ||
    localStorage.getItem("userName") ||
    "Otaku";

  // Anime Quotes Collection
  const quotes = [
    "“Whatever you lose, you'll find it again.” — One Piece",
    "“Push through the pain. Giving up hurts more.” — Naruto",
    "“If you don't take risks, you can't create a future.” — Luffy",
    "“No matter how deep the night, it always turns to day.” — Brook",
    "“People's lives don't end when they die. It ends when they lose faith.” — Itachi Uchiha",
    "“Reality is cruel, but you can't run from it forever. Face the facts.” — Akame",
    "“The world isn't perfect. But it's there for us, doing the best it can.” — Roy Mustang",
    "“A lesson without pain is meaningless. That's because getting hurt teaches us to grow.” — Tomoe",
    "“If you don't like your destiny, don't accept it. Instead, have the courage to change it.” — Naruto Uzumaki",
    "“Hard work is worthless for those that don't believe in themselves.” — Naruto Uzumaki",
    "“If you don't share someone's pain, you can never understand them.” — Nagato",
    "“You can die anytime, but living takes true courage.” — Kenshin Himura",
    "“We're not retreating, we're advancing in a different direction.” — Edward Elric",
    "“The moment you think of giving up, think of the reason why you held on so long.” — Natsu Dragneel",
    "“Never trust anyone too much; remember, the devil was once an angel.” — Kaneki Ken",
    "“You can't win a fight with your eyes closed.” — Killua Zoldyck",
    "“A true hero is one who overcomes life's misfortunes.” — Mumen Rider",
    "“The world is cruel, but also very beautiful.” — Mikasa Ackerman",
    "“Life is not a game of luck. If you wanna win, work hard.” — Sora",
    "“The world isn't perfect. But it's there for us, doing the best it can.” — Hachiman Hikigaya"
  ];

  // --- Streak logic ---
  const today = new Date().toDateString(); // "Mon Jan 10 2026"
  let streak = parseInt(localStorage.getItem("streak") || "0");
  const lastActive = localStorage.getItem("lastActive");

  // If user performed an action today, do nothing
  // If user comes after skipping one or more days, reset streak
  if (lastActive !== today) {
    if (lastActive === new Date(Date.now() - 86400000).toDateString()) {
      // Last active was yesterday → continue streak
      streak += 1;
    } else {
      // Last active was before yesterday → reset streak
      streak = 1;
    }
    localStorage.setItem("streak", streak);
    localStorage.setItem("lastActive", today);
  }

  function getGreetingData(hour) {
    if (hour < 12) return ["Good morning", "☀️", "Fresh episodes, fresh start"];
    if (hour < 17) return ["Good afternoon", "🌤️", "Perfect time to make progress"];
    if (hour < 22) return ["Good evening", "🌙", "Relax and enjoy your favorites"];
    return ["Good night", "🌌", "Late-night anime vibes"];
  }

  function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const [text, emoji, sub] = getGreetingData(hour);

    greetingLine.textContent = `${text}, ${userName}`;
    greetingEmoji.textContent = emoji;
    greetingSubline.textContent = sub;

    liveClock.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    streakInfo.textContent = `🔥 ${streak}-day streak`;

    dailyQuote.textContent =
      quotes[Math.floor(Math.random() * quotes.length)];
  }

  updateGreeting();
  setInterval(updateGreeting, 60 * 1000);
})();

// profile Drop Down Menu toggle

const profileToggle = document.getElementById("profileMenuToggle");
const profileDropdown = document.querySelector(".profile-dropdown");

profileToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
  profileDropdown.classList.remove("open");
});

// search Drop Down Menu toggle

const searchToggle = document.getElementById("searchToggle");
const searchDropdown = document.querySelector(".search-dropdown");
const searchInput = document.getElementById("dashboardSearch");

/* Toggle when clicking the search icon */
searchToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  searchDropdown.classList.toggle("open");
  searchInput.focus();
});

/* Prevent closing when clicking inside the dropdown */
searchDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
});

/* Close when clicking outside */
document.addEventListener("click", () => {
  searchDropdown.classList.remove("open");
});

// =============================================
// DASHBOARD FEATURE — ANIME DNA
// =============================================

function calculateAnimeDNA() {
  if (!animeData || animeData.length === 0) {
    return {
      genre: 'N/A',
      avgScore: 'N/A',
      format: 'N/A'
    };
  }

  const genreCount = {};
  let scoreSum = 0;
  let scoreCount = 0;
  let movieCount = 0;

  animeData.forEach(anime => {
    if (Array.isArray(anime.genres)) {
      anime.genres.forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    }

    if (anime.score) {
      scoreSum += anime.score;
      scoreCount++;
    }

    if (anime.type === 'Movie') movieCount++;
  });

  const favoriteGenre =
    Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    genre: favoriteGenre,
    avgScore: scoreCount ? (scoreSum / scoreCount).toFixed(1) : 'N/A',
    format: movieCount > animeData.length / 2 ? 'Movies' : 'Series'
  };
}

function renderAnimeDNA() {
  const dna = calculateAnimeDNA();

  const genreEl = document.getElementById('dna-genre');
  const scoreEl = document.getElementById('dna-score');
  const formatEl = document.getElementById('dna-format');

  if (!genreEl || !scoreEl || !formatEl) return;

  genreEl.textContent = dna.genre;
  scoreEl.textContent = dna.avgScore;
  formatEl.textContent = dna.format;
}
document.addEventListener('DOMContentLoaded', renderAnimeDNA);

// =============================================
// DANGER ZONE — CLEAR ALL DATA
// =============================================

const clearBtn = document.getElementById("clearDataBtn");

clearBtn.addEventListener("click", function () {
    if (clearBtn.disabled) {
        return; 
    }

    const confirmDelete = confirm("Are you sure you want to delete all data?");
    if (confirmDelete) {
        localStorage.clear(); 
        location.reload();
    }
});

// =============================================
// No Background scroll
// =============================================

// Prevent background scroll when modal is open
function preventBodyScroll(prevent) {
  if (prevent) {
    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
    
    document.body.classList.add('modal-open');
    document.body.style.paddingRight = scrollbarWidth + 'px';
  } else {
    document.body.classList.remove('modal-open');
    document.body.style.paddingRight = '';
    document.documentElement.style.removeProperty('--scrollbar-width');
  }
}

// Attach to add anime modal
document.getElementById('addAnimeBtn')?.addEventListener('click', function() {
  document.getElementById('addAnimeModal').style.display = 'block';
  preventBodyScroll(true);
});

// Attach to import button
document.getElementById('importBtn')?.addEventListener('click', function() {
  document.getElementById('importModal').style.display = 'block';
  preventBodyScroll(true);
});

// Close modal handlers
document.querySelectorAll('.close-modal, .modal .btn-secondary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const modal = this.closest('.modal');
    if (modal) {
      modal.style.display = 'none';
      preventBodyScroll(false);
    }
  });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === this) {
      this.style.display = 'none';
      preventBodyScroll(false);
    }
  });
});

// Handle escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal[style*="display: block"], .modal[style*="display:block"], .modal.show');
    if (openModal) {
      openModal.style.display = 'none';
      preventBodyScroll(false);
    }
  }
});

 
