// Advanced RPG Level System - v1.2.0 (FIXED: Direct Completion + Status Change)

const LEVELS = [
	// Levels 1-21: Common titles
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
	{ level: 21, title: "Anime Deity", xpRequired: 45000 },

	// Levels 22-30: Rare titles
	{ level: 22, title: "Mythic", xpRequired: 53000 },
	{ level: 23, title: "Ascended", xpRequired: 62000 },
	{ level: 24, title: "Divine", xpRequired: 72000 },
	{ level: 25, title: "Cosmic", xpRequired: 83000 },
	{ level: 26, title: "Eternal", xpRequired: 95000 },
	{ level: 27, title: "Godly", xpRequired: 108000 },
	{ level: 28, title: "Celestial", xpRequired: 122000 },
	{ level: 29, title: "Omnipotent", xpRequired: 137000 },
	{ level: 30, title: "Absolute", xpRequired: 153000 },

	// Levels 31-40: Supreme titles
	{ level: 31, title: "Supreme Watcher", xpRequired: 170000 },
	{ level: 32, title: "Void Lord", xpRequired: 188000 },
	{ level: 33, title: "Star Eater", xpRequired: 207000 },
	{ level: 34, title: "Galaxy Seeker", xpRequired: 227000 },
	{ level: 35, title: "Universe Walker", xpRequired: 248000 },
	{ level: 36, title: "Dimension Lord", xpRequired: 270000 },
	{ level: 37, title: "Reality Weaver", xpRequired: 293000 },
	{ level: 38, title: "Time Master", xpRequired: 317000 },
	{ level: 39, title: "Space God", xpRequired: 342000 },
	{ level: 40, title: "Eternity Seeker", xpRequired: 368000 },

	// Levels 41-50: God tier
	{ level: 41, title: "Infinity Watcher", xpRequired: 395000 },
	{ level: 42, title: "Omni God", xpRequired: 423000 },
	{ level: 43, title: "Creator Level", xpRequired: 452000 },
	{ level: 44, title: "Prime Being", xpRequired: 482000 },
	{ level: 45, title: "Alpha Otaku", xpRequired: 513000 },
	{ level: 46, title: "Omega Watcher", xpRequired: 545000 },
	{ level: 47, title: "Genesis Seeker", xpRequired: 578000 },
	{ level: 48, title: "Apocalypse Binger", xpRequired: 612000 },
	{ level: 49, title: "Nirvana Master", xpRequired: 647000 },
	{ level: 50, title: "Enlightenment", xpRequired: 683000 },

	// Levels 51-60: Beyond god
	{ level: 51, title: "Transcendent God", xpRequired: 720000 },
	{ level: 52, title: "Ultimate Deity", xpRequired: 758000 },
	{ level: 53, title: "Absolute Being", xpRequired: 797000 },
	{ level: 54, title: "One Above All", xpRequired: 837000 },
	{ level: 55, title: "The Watcher", xpRequired: 878000 },
	{ level: 56, title: "The Seeker", xpRequired: 920000 },
	{ level: 57, title: "The Binger", xpRequired: 963000 },
	{ level: 58, title: "The Otaku", xpRequired: 1007000 },
	{ level: 59, title: "The Legend", xpRequired: 1052000 },
	{ level: 60, title: "The Myth", xpRequired: 1098000 },

	// Levels 61-70: Mythical
	{ level: 61, title: "Living Legend", xpRequired: 1145000 },
	{ level: 62, title: "Walking Deity", xpRequired: 1193000 },
	{ level: 63, title: "Anime Incarnate", xpRequired: 1242000 },
	{ level: 64, title: "Story Manifest", xpRequired: 1292000 },
	{ level: 65, title: "Plot Embodiment", xpRequired: 1343000 },
	{ level: 66, title: "Genre Avatar", xpRequired: 1395000 },
	{ level: 67, title: "Collection Spirit", xpRequired: 1448000 },
	{ level: 68, title: "Binge Force", xpRequired: 1502000 },
	{ level: 69, title: "Watch Essence", xpRequired: 1557000 },
	{ level: 70, title: "Anime Soul", xpRequired: 1613000 },

	// Levels 71-80: Ultimate
	{ level: 71, title: "Anime Heart", xpRequired: 1670000 },
	{ level: 72, title: "Otaku Core", xpRequired: 1728000 },
	{ level: 73, title: "Weeb Origin", xpRequired: 1787000 },
	{ level: 74, title: "Culture Icon", xpRequired: 1847000 },
	{ level: 75, title: "Media God", xpRequired: 1908000 },
	{ level: 76, title: "Entertainment Deity", xpRequired: 1970000 },
	{ level: 77, title: "Pop Culture Legend", xpRequired: 2033000 },
	{ level: 78, title: "Art Form Master", xpRequired: 2097000 },
	{ level: 79, title: "Expression God", xpRequired: 2162000 },
	{ level: 80, title: "Creation Deity", xpRequired: 2228000 },

	// Levels 81-90: Infinite
	{ level: 81, title: "Infinite Watcher", xpRequired: 2295000 },
	{ level: 82, title: "Eternal Seeker", xpRequired: 2363000 },
	{ level: 83, title: "Boundless Otaku", xpRequired: 2432000 },
	{ level: 84, title: "Limitless Binger", xpRequired: 2502000 },
	{ level: 85, title: "Endless Viewer", xpRequired: 2573000 },
	{ level: 86, title: "Timeless Watcher", xpRequired: 2645000 },
	{ level: 87, title: "Ageless Seeker", xpRequired: 2718000 },
	{ level: 88, title: "Immortal Otaku", xpRequired: 2792000 },
	{ level: 89, title: "Undying Legend", xpRequired: 2867000 },
	{ level: 90, title: "Deathless God", xpRequired: 2943000 },

	// Levels 91-100: Final
	{ level: 91, title: "Anime Messiah", xpRequired: 3020000 },
	{ level: 92, title: "Otaku Savior", xpRequired: 3098000 },
	{ level: 93, title: "Weeb Prophet", xpRequired: 3177000 },
	{ level: 94, title: "Culture God", xpRequired: 3257000 },
	{ level: 95, title: "Media Messiah", xpRequired: 3338000 },
	{ level: 96, title: "Entertainment God", xpRequired: 3420000 },
	{ level: 97, title: "Pop Culture Deity", xpRequired: 3503000 },
	{ level: 98, title: "Art Form God", xpRequired: 3587000 },
	{ level: 99, title: "Expression Incarnate", xpRequired: 3672000 },
	{ level: 100, title: "Max", xpRequired: 3758000 }
];

const USER_PROFILE_KEY = 'userProfile';
const ANIME_DATA_KEY = 'animeData';
const MAX_DAILY_XP = window.TEST_MAX_DAILY_XP || 1500;

// DECLARE GLOBAL VARIABLES AT THE TOP
let _prevAnimeSnapshot = null;
const xpPopupQueue = [];
let showingXpPopup = false;
const recentPopupHashes = new Set();

// Safe localStorage helpers
function safeGet(key) {
	try {
		const v = localStorage.getItem(key);
		return v ? JSON.parse(v) : null;
	} catch (e) {
		console.warn('safeGet error', key, e);
		return null;
	}
}

function safeSet(key, val) {
	try {
		localStorage.setItem(key, JSON.stringify(val));
	} catch (e) {
		console.warn('safeSet error', key, e);
	}
}

// Initialize user profile if missing
function getUserProfile() {
	let profile = safeGet(USER_PROFILE_KEY);
	if (!profile) {
		profile = { totalExp: 0, level: 1, title: LEVELS[0].title, lastExpGainTime: 0 };
		safeSet(USER_PROFILE_KEY, profile);
	}
	return profile;
}

function saveUserProfile(profile) {
	profile.totalExp = Math.max(0, Math.floor(profile.totalExp || 0));
	// Recalculate level from totalExp
	for (let i = LEVELS.length - 1; i >= 0; i--) {
		if (profile.totalExp >= LEVELS[i].xpRequired) {
			profile.level = LEVELS[i].level;
			profile.title = LEVELS[i].title;
			break;
		}
	}
	safeSet(USER_PROFILE_KEY, profile);
}

// Calculate EXP according to spec
function calculateExpFromParts({ episodes = 0, progress = 0, duration = 20, type = 'TV', score = 0, hasScore = false, isCompleted = false }, options = {}) {
	const epsForEpisodeBonus = options.useProgress ? Math.max(0, progress) : Math.max(0, episodes);
	const episodeBonus = Math.floor(epsForEpisodeBonus / 2);

	let scoreBonus = 0;
	if (score >= 9) scoreBonus = 8;
	else if (score >= 8) scoreBonus = 5;
	else if (score >= 7) scoreBonus = 3;

	const movieBonus = (type && type.toLowerCase() === 'movie') ? 15 : 0;
	const progressBonus = Math.floor(progress / 5);
	const ratingBonus = hasScore ? 2 : 0;
	const totalMinutes = progress * duration;
	const timeBonus = Math.floor((totalMinutes / 60) * 2);

	const total = episodeBonus + scoreBonus + movieBonus + progressBonus + ratingBonus + timeBonus;
	return Math.max(0, Math.floor(total));
}

// Calculate total XP from anime list (single source of truth)
function calculateTotalExpFromAnimeList(animeList) {
	let totalExp = 0;
	animeList.forEach(anime => {
		if (anime.userStatus === 'Completed') {
			const xp = calculateExpFromParts({
				episodes: anime.episodes || 0,
				progress: anime.progress || 0,
				duration: anime.duration || 20,
				type: anime.type,
				score: anime.score || 0,
				hasScore: !!anime.score
			}, { useProgress: true });
			totalExp += xp + 10;
		}
	});
	return Math.max(0, Math.floor(totalExp));
}

// Recalculate and update profile
function recalculateTotalExp() {
	const animeList = safeGet(ANIME_DATA_KEY) || window.animeData || [];
	const profile = getUserProfile();
	const newTotalExp = calculateTotalExpFromAnimeList(animeList);

	if (profile.totalExp !== newTotalExp) {
		const oldExp = profile.totalExp;
		profile.totalExp = newTotalExp;
		saveUserProfile(profile);
		console.log(`🔄 XP recalculated: ${oldExp} → ${newTotalExp} XP`);
		dispatchXpUpdated();
	}

	return newTotalExp;
}

// Escape HTML
function escapeHtml(s) {
	if (!s) return '';
	return String(s).replace(/[&<>"'`]/g, function (c) {
		return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;", "`": "&#96;" })[c];
	});
}

// Ensure toast container exists
function ensureToastContainer() {
	if (!document.getElementById('toastContainer')) {
		const container = document.createElement('div');
		container.id = 'toastContainer';
		container.style.position = 'fixed';
		container.style.bottom = '20px';
		container.style.right = '20px';
		container.style.zIndex = '99999';
		document.body.appendChild(container);
		console.log('✅ Toast container created');
	}
}
// Add popup styles - Pure CSS Premium Design (Blue Theme)
function addPopupStyles() {
	if (document.querySelector('#xp-popup-styles')) return;

	const style = document.createElement('style');
	style.id = 'xp-popup-styles';
	style.textContent = `
		/* ============================================
		   MAIN POPUP CONTAINER
		============================================ */
		.xp-popup {
			position: fixed;
			bottom: 24px;
			right: 24px;
			z-index: 100000;
			max-width: 380px;
			width: calc(100% - 48px);
			animation: xpSlideIn 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
			filter: drop-shadow(0 20px 25px -12px rgba(0, 0, 0, 0.5));
		}
		
		.xp-popup.exit {
			animation: xpSlideOut 0.3s ease-in forwards;
		}
		
		/* ============================================
		   INNER CARD - Glassmorphism (Blue Theme)
		============================================ */
		.xp-popup-inner {
			background: linear-gradient(135deg, 
				rgba(11, 17, 32, 0.98) 0%,
				rgba(26, 31, 46, 0.98) 100%);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			border-radius: 20px;
			padding: 16px;
			display: flex;
			gap: 16px;
			border: 1px solid rgba(59, 130, 246, 0.25);
			box-shadow: 0 25px 40px -12px rgba(0, 0, 0, 0.4),
						0 0 0 0.5px rgba(59, 130, 246, 0.15) inset;
			transition: transform 0.2s ease, box-shadow 0.2s ease;
		}
		
		.xp-popup-inner:hover {
			transform: translateX(-4px);
			box-shadow: 0 30px 45px -12px rgba(0, 0, 0, 0.5),
						0 0 0 1px rgba(59, 130, 246, 0.3) inset;
		}
		
		/* ============================================
		   COVER IMAGE
		============================================ */
		.xp-cover {
			width: 70px;
			height: 100px;
			background-size: cover;
			background-position: center;
			border-radius: 12px;
			flex-shrink: 0;
			position: relative;
			overflow: hidden;
			box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.3);
			transition: all 0.3s ease;
		}
		
		.xp-cover::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: linear-gradient(135deg, 
				rgba(59, 130, 246, 0.15) 0%,
				transparent 50%);
			pointer-events: none;
		}
		
		.xp-popup-inner:hover .xp-cover {
			transform: scale(1.02);
			box-shadow: 0 12px 25px -6px rgba(0, 0, 0, 0.4);
		}
		
		/* ============================================
		   INFO SECTION
		============================================ */
		.xp-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 6px;
			min-width: 0;
		}
		
		/* ============================================
		   XP AMOUNT BADGE - Blue/Indigo Gradient
		============================================ */
		.xp-amount {
			background: linear-gradient(135deg, #3B82F6, #6366F1);
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 5px 14px;
			border-radius: 40px;
			font-size: 12px;
			font-weight: 700;
			letter-spacing: 0.3px;
			color: white;
			width: fit-content;
			box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
			animation: xpGlowPulse 2s infinite;
			position: relative;
			overflow: hidden;
		}
		
		.xp-amount::after {
			content: '';
			position: absolute;
			top: -50%;
			left: -60%;
			width: 200%;
			height: 200%;
			background: linear-gradient(115deg, 
				rgba(255,255,255,0) 0%, 
				rgba(255,255,255,0.25) 50%, 
				rgba(255,255,255,0) 100%);
			transform: rotate(25deg);
			animation: xpShimmer 3s infinite;
		}
		
		/* ============================================
		   ANIME TITLE
		============================================ */
		.xp-title {
			font-size: 15px;
			font-weight: 700;
			margin: 2px 0 0 0;
			color: #F8FAFC;
			line-height: 1.3;
			letter-spacing: -0.2px;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		}
		
		/* ============================================
		   LEVEL META - Blue Light
		============================================ */
		.xp-meta {
			font-size: 11px;
			font-weight: 500;
			color: #60A5FA;
			margin-bottom: 4px;
		}
		
		/* ============================================
		   PROGRESS CONTAINER
		============================================ */
		.xp-progress-container {
			margin-top: 6px;
		}
		
		/* ============================================
		   PROGRESS BAR - Blue/Indigo
		============================================ */
		.xp-bar {
			background: rgba(255, 255, 255, 0.08);
			border-radius: 10px;
			height: 8px;
			overflow: hidden;
			margin-bottom: 8px;
		}
		
		.xp-fill {
			background: linear-gradient(90deg, #3B82F6, #6366F1, #60A5FA);
			background-size: 200% 100%;
			display: block;
			height: 100%;
			width: 0%;
			transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
			border-radius: 10px;
			animation: xpProgressShimmer 1.5s ease infinite;
		}
		
		/* ============================================
		   STATS ROW - Blue Tinted
		============================================ */
		.xp-stats {
			background: rgba(59, 130, 246, 0.06);
			border-radius: 12px;
			padding: 8px 10px;
			margin-top: 4px;
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			border: 1px solid rgba(59, 130, 246, 0.12);
			transition: all 0.2s ease;
			text-align: center;
		}
		
		.xp-stats:hover {
			background: rgba(59, 130, 246, 0.10);
			border-color: rgba(59, 130, 246, 0.25);
		}
		
		/* ============================================
		   CURRENT XP TEXT - Blue Light
		============================================ */
		.xp-current {
			font-size: 11px;
			font-weight: 600;
			color: #60A5FA;
			letter-spacing: 0.2px;
		}
		
		/* ============================================
		   XP NEXT TEXT
		============================================ */
		.xp-next {
			font-size: 10px;
			color: #94A3B8;
			display: block;
			margin-top: 4px;
			letter-spacing: 0.2px;
		}
		
		/* ============================================
		   ANIMATIONS
		============================================ */
		@keyframes xpSlideIn {
			0% {
				transform: translateX(100%) translateY(20px);
				opacity: 0;
			}
			60% {
				transform: translateX(-8px) translateY(0);
				opacity: 1;
			}
			100% {
				transform: translateX(0) translateY(0);
				opacity: 1;
			}
		}
		
		@keyframes xpSlideOut {
			0% {
				transform: translateX(0);
				opacity: 1;
			}
			100% {
				transform: translateX(100%);
				opacity: 0;
				visibility: hidden;
			}
		}
		
		@keyframes xpGlowPulse {
			0%, 100% {
				box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
			}
			50% {
				box-shadow: 0 4px 15px rgba(59, 130, 246, 0.7);
			}
		}
		
		@keyframes xpShimmer {
			0% {
				transform: translateX(-100%) rotate(25deg);
			}
			20%, 100% {
				transform: translateX(100%) rotate(25deg);
			}
		}
		
		@keyframes xpProgressShimmer {
			0% {
				background-position: 0% 50%;
			}
			100% {
				background-position: 200% 50%;
			}
		}
		
		/* ============================================
		   LEVEL UP SPECIAL EFFECT - Blue Glow
		============================================ */
		.xp-popup.level-up .xp-popup-inner {
			background: linear-gradient(135deg, 
				rgba(59, 130, 246, 0.25) 0%,
				rgba(99, 102, 241, 0.15) 100%);
			border: 1px solid rgba(59, 130, 246, 0.5);
			animation: xpLevelUpPulse 0.5s ease;
		}
		
		@keyframes xpLevelUpPulse {
			0%, 100% {
				transform: scale(1);
				box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6);
			}
			50% {
				transform: scale(1.02);
				box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
			}
		}
		
		/* ============================================
		   RESPONSIVE DESIGN
		============================================ */
		@media (max-width: 480px) {
			.xp-popup {
				bottom: 16px;
				right: 16px;
				max-width: 340px;
				width: calc(100% - 32px);
			}
			
			.xp-popup-inner {
				padding: 12px;
				gap: 12px;
			}
			
			.xp-cover {
				width: 55px;
				height: 78px;
			}
			
			.xp-title {
				font-size: 13px;
			}
			
			.xp-amount {
				font-size: 10px;
				padding: 4px 10px;
			}
			
			.xp-stats {
				padding: 6px 8px;
			}
			
			.xp-current {
				font-size: 10px;
			}
		}
		
		/* ============================================
		   LIGHT THEME COMPATIBILITY
		============================================ */
		[data-theme="light"] .xp-popup-inner {
			background: linear-gradient(135deg, 
				rgba(255, 255, 255, 0.98) 0%,
				rgba(248, 250, 252, 0.98) 100%);
			border: 1px solid rgba(59, 130, 246, 0.25);
			box-shadow: 0 25px 40px -12px rgba(0, 0, 0, 0.08);
		}
		
		[data-theme="light"] .xp-title {
			color: #0F172A;
		}
		
		[data-theme="light"] .xp-meta {
			color: #3B82F6;
		}
		
		[data-theme="light"] .xp-stats {
			background: rgba(59, 130, 246, 0.04);
			border-color: rgba(59, 130, 246, 0.08);
		}
		
		[data-theme="light"] .xp-stats:hover {
			background: rgba(59, 130, 246, 0.06);
			border-color: rgba(59, 130, 246, 0.15);
		}
		
		[data-theme="light"] .xp-current {
			color: #2563EB;
		}
		
		[data-theme="light"] .xp-amount {
			background: linear-gradient(135deg, #2563EB, #4F46E5);
			box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
		}
		
		[data-theme="light"] .xp-bar {
			background: rgba(0, 0, 0, 0.06);
		}
		
		[data-theme="light"] .xp-popup.level-up .xp-popup-inner {
			background: linear-gradient(135deg, 
				rgba(59, 130, 246, 0.12) 0%,
				rgba(99, 102, 241, 0.08) 100%);
			border: 1px solid rgba(59, 130, 246, 0.35);
		}
		
		[data-theme="light"] .xp-cover::after {
			background: linear-gradient(135deg, 
				rgba(59, 130, 246, 0.08) 0%,
				transparent 50%);
		}
		
		/* ============================================
		   TOAST CONTAINER STYLES
		============================================ */
		#toastContainer {
			position: fixed;
			bottom: 20px;
			right: 20px;
			z-index: 99999;
			display: flex;
			flex-direction: column;
			gap: 12px;
			pointer-events: none;
		}
		
		#toastContainer > * {
			pointer-events: auto;
		}
		
		/* ============================================
		   ACCESSIBILITY - Reduced Motion
		============================================ */
		@media (prefers-reduced-motion: reduce) {
			.xp-popup,
			.xp-popup.exit,
			.xp-popup-inner,
			.xp-fill,
			.xp-amount,
			.xp-amount::after {
				animation: none !important;
				transition: none !important;
			}
			
			.xp-popup {
				opacity: 1;
				transform: none;
			}
		}
	`;
	document.head.appendChild(style);
	console.log('✅ Premium popup styles added (Blue Theme)');
}

// FIXED Popup queue functions
function showXpPopup(data) {
	try { window.__lastXpAward = { xp: data.xp || 0, ts: Date.now(), animeId: data.animeId || '' }; } catch (e) { }
	
	ensureToastContainer();
	addPopupStyles();
	
	xpPopupQueue.push(data);
	try { window.__justAwardedXp = true; setTimeout(() => { try { window.__justAwardedXp = false; } catch (e) { } }, 4500); } catch (e) { }
	if (!showingXpPopup) processXpQueue();
}

function processXpQueue() {
	if (xpPopupQueue.length === 0) {
		showingXpPopup = false;
		return;
	}
	showingXpPopup = true;
	const d = xpPopupQueue.shift();

	const hash = `${d.animeId || 'anon'}|${d.title}|${d.xp}|${d.prevLevel}|${d.newLevel}`;
	if (recentPopupHashes.has(hash)) {
		setTimeout(processXpQueue, 300);
		return;
	}
	recentPopupHashes.add(hash);
	setTimeout(() => recentPopupHashes.delete(hash), 7000);

	const container = document.getElementById('toastContainer') || document.body;
	const popup = document.createElement('div');
	popup.className = 'xp-popup';

	const currXP = d.profile.totalExp || 0;
	
	// Calculate level progression
	let currentLevelObj = LEVELS[0];
	let nextLevelObj = LEVELS[1];
	
	for (let i = 0; i < LEVELS.length; i++) {
		if (currXP >= LEVELS[i].xpRequired) {
			currentLevelObj = LEVELS[i];
			nextLevelObj = LEVELS[i + 1] || LEVELS[i];
		}
	}
	
	const xpForNextLevel = nextLevelObj.xpRequired;
	const xpNeededForNext = Math.max(0, xpForNextLevel - currXP);
	const xpInCurrentLevel = currXP - currentLevelObj.xpRequired;
	const xpRequiredForCurrentLevel = nextLevelObj.xpRequired - currentLevelObj.xpRequired;
	const percent = Math.min(100, Math.floor((xpInCurrentLevel / Math.max(1, xpRequiredForCurrentLevel)) * 100));

	popup.innerHTML = `
		<div class="xp-popup-inner">
			<div class="xp-cover" style="background-image:url('${d.cover || ''}')"></div>
			<div class="xp-info">
				<div class="xp-amount"> + ${d.xp} XP Earned!</div>
				<div class="xp-title">${escapeHtml(d.title || 'Unknown')}</div>
				<div class="xp-meta"> LVL ${d.profile.level} • ${escapeHtml(d.profile.title)}</div>
				<div class="xp-progress-container">
					<div class="xp-stats">
						<span class="xp-current"> Total: ${currXP} / ${xpForNextLevel} XP</span>
					</div>
				</div>
			</div>
		</div>
	`;
	container.appendChild(popup);

	requestAnimationFrame(() => {
		popup.classList.add('enter');
		const fill = popup.querySelector('.xp-fill');
		setTimeout(() => {
			if (fill) fill.style.width = percent + '%';
		}, 250);
	});

	setTimeout(() => {
		popup.classList.remove('enter');
		popup.classList.add('exit');
		setTimeout(() => { popup.remove(); processXpQueue(); }, 700);
	}, 4200);
}

// Update all UI elements showing level/XP
function updateAllLevelUI() {
	const profile = getUserProfile();

	const sidebarLevel = document.getElementById('sidebarLevelNumber') || document.getElementById('levelBadgeText');
	const sidebarTitle = document.getElementById('sidebarLevelTitle') || document.getElementById('levelTitleText');
	const sidebarXpText = document.getElementById('sidebarXpText');
	const sidebarXpFill = document.querySelector('#sidebarXpBar .xp-fill');

	if (sidebarLevel) sidebarLevel.textContent = sidebarLevel.id === 'levelBadgeText' ? `Lv.${profile.level}` : 'LVL ' + profile.level;
	if (sidebarTitle) sidebarTitle.textContent = profile.title;
	if (sidebarXpText) {
		const curr = profile.totalExp || 0;
		const lvlObj = LEVELS.slice().reverse().find(l => curr >= l.xpRequired) || LEVELS[0];
		const next = LEVELS.find(l => l.level === lvlObj.level + 1) || lvlObj;
		sidebarXpText.textContent = `${curr} / ${next.xpRequired} XP`;
	}
	if (sidebarXpFill) {
		const curr = profile.totalExp || 0;
		const lvlObj = LEVELS.slice().reverse().find(l => curr >= l.xpRequired) || LEVELS[0];
		const next = LEVELS.find(l => l.level === lvlObj.level + 1) || lvlObj;
		const percent = next && next.xpRequired ? Math.min(100, Math.floor(((curr - lvlObj.xpRequired) / Math.max(1, next.xpRequired - lvlObj.xpRequired)) * 100)) : 100;
		sidebarXpFill.style.width = percent + '%';
	}

	const settingsLevel = document.getElementById('settingsLevelNumber');
	const settingsTitle = document.getElementById('settingsLevelTitle');
	const settingsXpText = document.getElementById('settingsXpText');
	const settingsXpFill = document.getElementById('settingsProgressFill') || document.querySelector('#settingsLevelCard .xp-fill');
	const settingsCurrentXP = document.getElementById('settingsCurrentXP');
	const settingsNextXP = document.getElementById('settingsNextXP');
	const settingsNextInfo = document.getElementById('settingsNextInfo');
	const settingsNextLevel = LEVELS.find(l => l.level === (profile.level + 1));

	if (settingsLevel) settingsLevel.textContent = `Level ${profile.level}`;
	if (settingsTitle) settingsTitle.textContent = profile.title;

	const curr = profile.totalExp || 0;
	const lvlObj = LEVELS.slice().reverse().find(l => curr >= l.xpRequired) || LEVELS[0];
	const next = settingsNextLevel || lvlObj;
	const nextXp = next.xpRequired || lvlObj.xpRequired;
	const percent = next && next.xpRequired ? Math.min(100, Math.floor(((curr - lvlObj.xpRequired) / Math.max(1, nextXp - lvlObj.xpRequired)) * 100)) : 100;

	if (settingsXpText) settingsXpText.textContent = `${curr} / ${nextXp} XP`;
	if (settingsCurrentXP) settingsCurrentXP.textContent = curr;
	if (settingsNextXP) settingsNextXP.textContent = nextXp;
	if (settingsXpFill) settingsXpFill.style.width = `${percent}%`;
	if (settingsNextInfo) settingsNextInfo.textContent = settingsNextLevel ? `Next: ${settingsNextLevel.title} at ${settingsNextLevel.xpRequired} XP` : `Max level reached`;

	const settingsPercentEl = document.getElementById('settingsProgressPercent');
	if (settingsPercentEl) settingsPercentEl.textContent = `${percent}%`;

	const xpDeltaEl = document.getElementById('settingsXpDelta');
	try {
		const last = window.__lastXpAward;
		if (xpDeltaEl) {
			if (last && window.__justAwardedXp && (Date.now() - (last.ts || 0)) < 4500) {
				xpDeltaEl.textContent = `+${last.xp} XP`;
				xpDeltaEl.style.display = 'inline-block';
				xpDeltaEl.classList.add('show');
				setTimeout(() => { if (xpDeltaEl) { xpDeltaEl.classList.remove('show'); xpDeltaEl.style.display = 'none'; } }, 4200);
			} else if (xpDeltaEl) {
				xpDeltaEl.classList.remove('show');
				xpDeltaEl.style.display = 'none';
			}
		}
	} catch (e) { }
}

function dispatchXpUpdated() {
	window.dispatchEvent(new CustomEvent('xpUpdated'));
}

function canGainNow() {
	const profile = getUserProfile();
	const now = Date.now();
	if ((now - (profile.lastExpGainTime || 0)) < 3000) return false;
	profile.lastExpGainTime = now;
	saveUserProfile(profile);
	return true;
}

// ============================================
// XP QUEUE SYSTEM - No XP Lost Forever!
// ============================================

const XP_QUEUE_KEY = 'xpPendingQueue';

function getPendingXPQueue() {
	const queue = localStorage.getItem(XP_QUEUE_KEY);
	return queue ? JSON.parse(queue) : [];
}

function savePendingXPQueue(queue) {
	localStorage.setItem(XP_QUEUE_KEY, JSON.stringify(queue));
}

function addToPendingQueue(animeData, earned) {
	const queue = getPendingXPQueue();
	queue.push({
		animeId: animeData.id,
		animeTitle: animeData.title,
		xp: earned,
		cover: animeData.cover,
		timestamp: Date.now(),
		retryCount: 0
	});
	savePendingXPQueue(queue);
	console.log(`📦 XP queued: +${earned} XP for "${animeData.title}"`);
}

function processPendingXPQueue() {
	const queue = getPendingXPQueue();
	if (queue.length === 0) return;

	const today = new Date().toDateString();
	const dailyXPKey = `dailyXP_${today}`;
	let todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');
	const profile = getUserProfile();

	let remainingCapacity = MAX_DAILY_XP - todayXP;
	let processedCount = 0;
	const stillPending = [];

	console.log(`📦 Processing ${queue.length} queued XP items. Daily capacity left: ${remainingCapacity} XP`);

	for (const pending of queue) {
		if (pending.xp <= remainingCapacity) {
			todayXP += pending.xp;
			remainingCapacity -= pending.xp;
			profile.totalExp += pending.xp;
			processedCount++;

			if (typeof showToast === 'function') {
				showToast(`📦 Queued XP added: +${pending.xp} XP for "${pending.animeTitle}"`, 'success');
			}

			console.log(`✅ Processed queued XP: +${pending.xp} for "${pending.animeTitle}"`);
		} else if (remainingCapacity > 0 && pending.xp > remainingCapacity) {
			const partialXP = remainingCapacity;
			const leftoverXP = pending.xp - remainingCapacity;

			todayXP += partialXP;
			profile.totalExp += partialXP;
			remainingCapacity = 0;

			pending.xp = leftoverXP;
			pending.retryCount++;
			stillPending.push(pending);

			console.log(`⚠️ Partial processing: +${partialXP}/${pending.xp} XP for "${pending.animeTitle}". ${leftoverXP} XP remains queued.`);

			if (typeof showToast === 'function') {
				showToast(`📦 Partial XP added: +${partialXP}/${pending.xp} XP for "${pending.animeTitle}". ${leftoverXP} XP will be added tomorrow.`, 'info');
			}
		} else {
			stillPending.push(pending);
		}

		if (remainingCapacity <= 0) break;
	}

	localStorage.setItem(dailyXPKey, todayXP);
	saveUserProfile(profile);
	savePendingXPQueue(stillPending);

	if (processedCount > 0) {
		dispatchXpUpdated();
		if (typeof updateAllLevelUI === 'function') updateAllLevelUI();
	}

	if (stillPending.length > 0) {
		const totalQueuedXP = stillPending.reduce((sum, p) => sum + p.xp, 0);
		if (typeof showToast === 'function') {
			showToast(`📦 ${stillPending.length} item(s) still queued (${totalQueuedXP} XP total). Will process tomorrow!`, 'info');
		}
	}

	return { processed: processedCount, remaining: stillPending.length };
}

function showQueueStatus() {
	const queue = getPendingXPQueue();
	if (queue.length === 0) {
		if (typeof showToast === 'function') {
			showToast(`✅ No pending XP in queue.`, 'info');
		}
		return;
	}

	const totalQueuedXP = queue.reduce((sum, p) => sum + p.xp, 0);

	if (typeof showToast === 'function') {
		showToast(`📦 ${queue.length} item(s) queued (${totalQueuedXP} XP total). Will be added when daily limit resets.`, 'info');
	}

	console.log(`📦 Queued XP: ${queue.length} items, ${totalQueuedXP} total XP`);
}

// ============================================
// CLEAN UP QUEUE AND HISTORY WHEN ANIME IS DELETED
// ============================================

function removeAnimeFromQueue(animeId) {
    const queue = getPendingXPQueue();
    const originalLength = queue.length;
    
    const filteredQueue = queue.filter(item => item.animeId != animeId);
    
    if (filteredQueue.length !== originalLength) {
        savePendingXPQueue(filteredQueue);
        console.log(`🗑️ Removed ${originalLength - filteredQueue.length} queued item(s) for anime ID: ${animeId}`);
        
        if (typeof showToast === 'function') {
            showToast(`🗑️ Removed ${originalLength - filteredQueue.length} queued XP item(s) for deleted anime`, 'info');
        }
        
        if (typeof updateQueueStatusUI === 'function') {
            updateQueueStatusUI();
        }
    }
    
    return filteredQueue.length;
}

function removeAnimeFromCompletedHistory(animeId) {
    const history = getCompletedAnimeHistory();
    
    if (history[animeId]) {
        const xpEarned = history[animeId].xpEarned || 0;
        
        const today = new Date().toDateString();
        const dailyXPKey = `dailyXP_${today}`;
        const animeList = safeGet(ANIME_DATA_KEY) || window.animeData || [];
        let todayXPRecalc = 0;
        
        animeList.forEach(anime => {
            if (anime.userStatus === 'Completed' && anime.finishDate && anime.id != animeId) {
                const completedDate = new Date(anime.finishDate).toDateString();
                if (completedDate === today) {
                    const xp = calculateExpFromParts({
                        episodes: anime.episodes || 0,
                        progress: anime.progress || 0,
                        duration: anime.duration || 20,
                        type: anime.type,
                        score: anime.score || 0,
                        hasScore: !!anime.score
                    }) + 10;
                    todayXPRecalc += xp;
                }
            }
        });
        
        localStorage.setItem(dailyXPKey, todayXPRecalc);
        console.log(`🗑️ Recalculated today's XP: ${todayXPRecalc}`);
        
        delete history[animeId];
        saveCompletedAnimeHistory(history);
        console.log(`🗑️ Removed anime from completed history: ${animeId} (${xpEarned} XP)`);
        
        if (typeof updateQueueStatusUI === 'function') {
            updateQueueStatusUI();
        }
        
        return true;
    }
    return false;
}

// ============================================
// ANTI-ABUSE & SPAM PROTECTION SYSTEM
// ============================================

const COMPLETED_ANIME_KEY = 'completedAnimeHistory';

function getCompletedAnimeHistory() {
	const history = safeGet(COMPLETED_ANIME_KEY);
	return history || {};
}

function saveCompletedAnimeHistory(history) {
	safeSet(COMPLETED_ANIME_KEY, history);
}

function markAnimeAsCompleted(animeId, animeTitle, xpEarned) {
	const history = getCompletedAnimeHistory();
	history[animeId] = {
		title: animeTitle,
		xpEarned: xpEarned,
		completedAt: Date.now(),
		earnedDate: new Date().toDateString(),
		episodeCount: (window.animeData || []).find(a => a.id == animeId)?.episodes || 0
	};
	saveCompletedAnimeHistory(history);
}

function wasAnimeEverCompleted(animeId) {
	const history = getCompletedAnimeHistory();
	return !!history[animeId];
}

function getOriginalCompletedXP(animeId) {
	const history = getCompletedAnimeHistory();
	return history[animeId]?.xpEarned || 0;
}

function isEpisodeCountSuspicious(animeId, newEpisodeCount) {
	const history = getCompletedAnimeHistory();
	const oldRecord = history[animeId];

	if (!oldRecord) return false;

	const oldEpisodes = oldRecord.episodeCount;
	const increase = newEpisodeCount - oldEpisodes;

	return increase > 50;
}

// ============================================
// HANDLE DIRECTLY COMPLETED ANIME (NO STATUS CHANGE)
// ============================================

function checkForDirectlyCompletedAnime(animeList) {
    if (!animeList || animeList.length === 0) return false;
    
    const history = getCompletedAnimeHistory();
    let newCompletedFound = false;
    
    animeList.forEach(anime => {
        if (anime.userStatus !== 'Completed') return;
        if (history[anime.id]) {
            console.log(`⏭️ Skipping ${anime.title} - already in history`);
            return;
        }
        
        console.log(`🎯 Directly completed anime detected: ${anime.title}`);
        
        const earned = calculateExpFromParts({
            episodes: anime.episodes || 0,
            progress: anime.progress || anime.episodes || 0,
            duration: anime.duration || 20,
            type: anime.type,
            score: anime.score || 0,
            hasScore: !!anime.score
        }) + 10;
        
        markAnimeAsCompleted(anime.id, anime.title, earned);
        
        const profile = getUserProfile();
        const today = new Date().toDateString();
        const dailyXPKey = `dailyXP_${today}`;
        let todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');
        
        if (todayXP + earned <= MAX_DAILY_XP) {
            todayXP += earned;
            localStorage.setItem(dailyXPKey, todayXP);
            profile.totalExp += earned;
            saveUserProfile(profile);
            
            console.log(`✅ Showing popup for direct completion: +${earned} XP`);
            showXpPopup({
                animeId: anime.id,
                xp: earned,
                title: anime.title,
                cover: anime.cover || '',
                prevLevel: profile.level,
                newLevel: profile.level,
                profile: profile
            });
            newCompletedFound = true;
            
        } else if (todayXP < MAX_DAILY_XP) {
            const remainingToday = MAX_DAILY_XP - todayXP;
            const excessXP = earned - remainingToday;
            
            todayXP += remainingToday;
            localStorage.setItem(dailyXPKey, todayXP);
            profile.totalExp += remainingToday;
            saveUserProfile(profile);
            
            showXpPopup({
                animeId: anime.id,
                xp: remainingToday,
                title: anime.title,
                cover: anime.cover || '',
                prevLevel: profile.level,
                newLevel: profile.level,
                profile: profile
            });
            
            addToPendingQueue(anime, excessXP);
            console.log(`📦 Direct completion: ${remainingToday} XP added, ${excessXP} XP queued`);
            newCompletedFound = true;
            
        } else {
            addToPendingQueue(anime, earned);
            console.log(`📦 Direct completion: ${earned} XP queued (daily limit reached)`);
            
            if (typeof showToast === 'function') {
                showToast(`📦 ${earned} XP queued for tomorrow (daily limit reached)`, 'info');
            }
        }
    });
    
    if (newCompletedFound) {
        dispatchXpUpdated();
        updateAllLevelUI();
    }
    
    return newCompletedFound;
}

// ============================================
// ENHANCED processAnimeDelta WITH ANTI-ABUSE AND POPUP TRIGGER
// ============================================

function processAnimeDelta(oldA, newA) {
	if (!newA || typeof newA !== 'object') return newA;

	const profile = getUserProfile();

	if (typeof newA.progress === 'number' && typeof newA.episodes === 'number') {
		if (newA.progress > newA.episodes) {
			newA.progress = newA.episodes;
		}
	}

	if (typeof newA.earnedEpisodesExp !== 'number') {
		newA.earnedEpisodesExp = Math.max(0, Math.floor(newA.progress || 0));
	}

	const oldStatus = oldA ? oldA.userStatus : null;
	const newStatus = newA.userStatus;
	const existingAnime = Boolean(oldA && typeof oldA === 'object');

	if (!existingAnime) {
		return newA;
	}

	const wasCompleted = wasAnimeEverCompleted(newA.id);

	if (wasCompleted && oldStatus !== 'Completed' && newStatus === 'Completed') {
		console.warn(`⚠️ Anti-abuse: ${newA.title} was already completed before! No XP awarded.`);

		if (typeof showToast === 'function') {
			showToast(`⚠️ "${newA.title}" was already completed! No XP awarded.`, 'warning');
		}

		newA.userStatus = newStatus;
		return newA;
	}

	if (wasCompleted && isEpisodeCountSuspicious(newA.id, newA.episodes || 0)) {
		console.warn(`⚠️ Anti-abuse: Suspicious episode increase detected for ${newA.title}`);
		if (typeof showToast === 'function') {
			showToast(`⚠️ Suspicious activity detected! Episode increase too large.`, 'error');
		}
		return newA;
	}

	let earned = 0;

	if (!wasCompleted && oldStatus !== 'Completed' && newStatus === 'Completed') {
		earned = calculateExpFromParts({
			episodes: newA.episodes || 0,
			progress: newA.progress || 0,
			duration: newA.duration || 20,
			type: newA.type,
			score: newA.score || 0,
			hasScore: !!newA.score
		}) + 10;
		newA.earnedEpisodesExp = Math.max(newA.progress || 0, newA.earnedEpisodesExp || 0);

		markAnimeAsCompleted(newA.id, newA.title, earned);
		
		console.log(`🎉 ANIME COMPLETED: ${newA.title} - +${earned} XP earned!`);
	}

	if (earned === 0) {
		return newA;
	}

	earned = Math.max(0, Math.min(50000, Math.floor(earned)));

	if (earned > 0 && canGainNow()) {
		const today = new Date().toDateString();
		const dailyXPKey = `dailyXP_${today}`;
		let todayXP = parseInt(localStorage.getItem(dailyXPKey) || '0');

		if (todayXP + earned > MAX_DAILY_XP) {
			const remainingToday = MAX_DAILY_XP - todayXP;
			const excessXP = earned - remainingToday;

			console.log(`📦 Daily limit reached! Adding ${remainingToday} XP now, queuing ${excessXP} XP for later.`);

			if (typeof showToast === 'function') {
				showToast(`📦 Daily limit reached! +${remainingToday} XP added now. ${excessXP} XP queued for tomorrow.`, 'info');
			}

			todayXP += remainingToday;
			localStorage.setItem(dailyXPKey, todayXP);

			addToPendingQueue(newA, excessXP);

			profile.totalExp += remainingToday;
			saveUserProfile(profile);

			showXpPopup({
				animeId: newA.id || '',
				xp: remainingToday,
				title: newA.title || 'Anime',
				cover: newA.cover || '',
				prevLevel: profile.level,
				newLevel: profile.level,
				profile
			});

			dispatchXpUpdated();
			return newA;
		}

		todayXP += earned;
		localStorage.setItem(dailyXPKey, todayXP);

		setTimeout(() => {
			localStorage.removeItem(dailyXPKey);
		}, 24 * 60 * 60 * 1000);

		const prevLevel = profile.level;
		profile.totalExp = (profile.totalExp || 0) + earned;
		saveUserProfile(profile);

		console.log(`🎯 Triggering XP popup for +${earned} XP`);
		showXpPopup({
			animeId: newA.id || '',
			xp: earned,
			title: newA.title || 'Anime',
			cover: newA.cover || '',
			prevLevel,
			newLevel: profile.level,
			profile
		});

		dispatchXpUpdated();
	}

	return newA;
}

// ============================================
// ADMIN/DEBUG FUNCTIONS
// ============================================

window.resetAbuseRecords = function () {
	if (confirm('⚠️ This will reset all anti-abuse records. Continue?')) {
		localStorage.removeItem(COMPLETED_ANIME_KEY);
		const keys = Object.keys(localStorage);
		keys.forEach(key => {
			if (key.startsWith('dailyXP_')) {
				localStorage.removeItem(key);
			}
		});
		console.log('✅ Anti-abuse records reset');
		if (typeof showToast === 'function') {
			showToast('Anti-abuse records reset', 'info');
		}
	}
};

// ============================================
// DAILY RESET CHECK
// ============================================

function checkDailyReset() {
	const lastResetDate = localStorage.getItem('lastResetDate');
	const today = new Date().toDateString();

	if (lastResetDate !== today) {
		const keys = Object.keys(localStorage);
		keys.forEach(key => {
			if (key.startsWith('dailyXP_') && key !== `dailyXP_${today}`) {
				localStorage.removeItem(key);
			}
		});

		console.log('📅 New day detected! Processing pending XP queue...');
		processPendingXPQueue();

		localStorage.setItem('lastResetDate', today);
	}
}

setInterval(checkDailyReset, 60 * 60 * 1000);
checkDailyReset();

setTimeout(() => {
	console.log('🚀 App started, checking for queued XP...');
	processPendingXPQueue();
}, 2000);

function takeSnapshot(list) {
	const map = new Map();
	(list || []).forEach(a => map.set(a.id, JSON.parse(JSON.stringify(a))));
	return map;
}

function pollForChanges() {
	const list = safeGet(ANIME_DATA_KEY) || window.animeData || [];

	if (_prevAnimeSnapshot === null) {
		_prevAnimeSnapshot = takeSnapshot(list);
		setTimeout(() => {
			checkForDirectlyCompletedAnime(list);
		}, 1000);
		return;
	}

	const currMap = takeSnapshot(list);
	let hasChanges = false;
	let directlyCompletedAnime = [];

	_prevAnimeSnapshot.forEach((oldA, id) => {
		if (!currMap.has(id)) {
			console.log(`🗑️ Anime deleted: ${oldA.title}`);
			hasChanges = true;
			removeAnimeFromQueue(id);
			removeAnimeFromCompletedHistory(id);
		}
	});

	currMap.forEach((newA, id) => {
		const oldA = _prevAnimeSnapshot.get(id) || null;
		if (!oldA) {
			hasChanges = true;
			if (newA.userStatus === 'Completed') {
				directlyCompletedAnime.push(newA);
			}
		} else {
			const changed = JSON.stringify({
				status: oldA.userStatus,
				progress: oldA.progress,
				episodes: oldA.episodes
			}) !== JSON.stringify({
				status: newA.userStatus,
				progress: newA.progress,
				episodes: newA.episodes
			});
			if (changed) {
				hasChanges = true;
				const updated = processAnimeDelta(oldA, newA);
				if (updated && JSON.stringify(updated) !== JSON.stringify(newA)) {
					try {
						const full = safeGet(ANIME_DATA_KEY) || window.animeData || [];
						const idx = full.findIndex(x => x.id === id);
						if (idx !== -1) {
							full[idx] = Object.assign({}, full[idx], updated);
							safeSet(ANIME_DATA_KEY, full);
						}
					} catch (e) { }
				}
			}
		}
	});

	if (directlyCompletedAnime.length > 0) {
		console.log(`🎯 Found ${directlyCompletedAnime.length} anime added directly as Completed`);
		checkForDirectlyCompletedAnime(directlyCompletedAnime);
	}

	if (hasChanges) {
		recalculateTotalExp();
	}

	_prevAnimeSnapshot = currMap;
}

function migrateAndSeedProfile() {
	const animeList = safeGet(ANIME_DATA_KEY) || window.animeData || [];
	const profile = getUserProfile();

	if ((profile.totalExp || 0) === 0 && Array.isArray(animeList) && animeList.length > 0) {
		recalculateTotalExp();
		safeSet(ANIME_DATA_KEY, animeList);
	}
}

window.addEventListener('xpUpdated', updateAllLevelUI);

document.addEventListener('DOMContentLoaded', () => {
	migrateAndSeedProfile();
	updateAllLevelUI();
	setInterval(pollForChanges, 900);
});

// ============================================
// SYNC LEVEL DATA TO CLOUD
// ============================================

function syncLevelToCloud() {
    const profile = getUserProfile();
    const animeData = safeGet(ANIME_DATA_KEY) || window.animeData || [];
    
    let totalMinutes = 0;
    animeData.forEach(anime => {
        if (anime.type === 'Movie') {
            totalMinutes += anime.duration || 120;
        } else {
            const eps = anime.progress || anime.episodes || 0;
            const epDur = anime.duration || 20;
            totalMinutes += eps * epDur;
        }
    });
    const totalHours = Math.round(totalMinutes / 60);
    
    const levelData = {
        totalXP: profile.totalExp || 0,
        level: profile.level || 1,
        title: profile.title || 'Newbie',
        totalAnime: animeData.filter(a => a.userStatus === 'Completed').length,
        totalHours: totalHours
    };
    
    localStorage.setItem('userLevel', levelData.level.toString());
    localStorage.setItem('userLevelTitle', levelData.title);
    localStorage.setItem('userXP', levelData.totalXP.toString());
    localStorage.setItem('userTotalAnime', levelData.totalAnime.toString());
    localStorage.setItem('userTotalHours', levelData.totalHours.toString());
    
    if (window.dualStorage && window.dualStorage.isLoggedIn && window.dualStorage.isLoggedIn()) {
        console.log(`📤 Syncing level to cloud: Level ${levelData.level} (${levelData.totalXP} XP)`);
        setTimeout(() => {
            window.dualStorage.syncToCloud();
        }, 1000);
    }
}

const originalSaveUserProfile = saveUserProfile;
saveUserProfile = function(profile) {
    originalSaveUserProfile(profile);
    syncLevelToCloud();
};

window.addEventListener('xpUpdated', () => {
    syncLevelToCloud();
});

window.syncLevelToCloud = syncLevelToCloud;

// ============================================
// EXPOSE PUBLIC API
// ============================================

window.AniPulseLevelSystem = {
	LEVELS,
	getUserProfile,
	saveUserProfile,
	calculateExpFromParts,
	calculateTotalExpFromAnimeList,
	recalculateTotalExp,
	showXpPopup,
	updateAllLevelUI,
	processAnimeDelta,
	MAX_DAILY_XP,
	getPendingXPQueue,
	savePendingXPQueue,
	addToPendingQueue,
	processPendingXPQueue,
	removeAnimeFromQueue,
	removeAnimeFromCompletedHistory,
	showQueueStatus,
	checkForDirectlyCompletedAnime
};

// Initialize popup styles and container on load
ensureToastContainer();
addPopupStyles();

console.log('✅ Level System v1.2.0 loaded with Direct Completion + Status Change support!');