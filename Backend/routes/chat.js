// routes/chat.js
const express = require('express');
const { db, COLLECTIONS } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Simple helper to get level/title from XP (copied from levelSystem)
function getLevelFromXP(xp) {
    // We'll keep it simple: levels every 1000 XP, max 50
    const level = Math.min(50, Math.floor(xp / 1000) + 1);
    const titles = [
        'Newbie', 'Scout', 'Viewer', 'Otaku', 'Fanatic',
        'Binge', 'Senpai', 'Shonen', 'Elite', 'Legend',
        'Sage', 'Keeper', 'Traveler', 'Master', 'Grand',
        'Hokage', 'Transc', 'Veteran', 'Watcher', 'Myth',
        'Deity', 'Mythic', 'Ascend', 'Divine', 'Cosmic',
        'Eternal', 'Godly', 'Celest', 'Potent', 'Absol',
        'Supreme', 'VLord', 'StarE', 'Galaxy', 'Walker',
        'DimLord', 'Weaver', 'TimeM', 'SpaceG', 'Etern',
        'Infini', 'Omni', 'Creator', 'Prime', 'Alpha',
        'Omega', 'Genesis', 'Apoc', 'Nirvana', 'Max'
    ];
    return {
        level: level,
        title: titles[level - 1] || 'Max'
    };
}

function getDailyLimit() {
    return 1500; // match MAX_DAILY_XP
}

// ─── Main chat endpoint ──────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    const { message } = req.body;
    const userId = req.userId;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Fetch user data from Firestore
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const animeDoc = await db.collection(COLLECTIONS.ANIME_LISTS).doc(userId).get();
        const animeList = animeDoc.exists ? (animeDoc.data().animeList || []) : [];

        const profileDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(userId).get();
        const profile = profileDoc.exists ? profileDoc.data() : {};

        // Build stats
        const totalAnime = animeList.length;
        const completed = animeList.filter(a => a.userStatus === 'Completed').length;
        const watching = animeList.filter(a => a.userStatus === 'Watching').length;
        const planToWatch = animeList.filter(a => a.userStatus === 'Plan to Watch').length;
        const dropped = animeList.filter(a => a.userStatus === 'Dropped').length;

        const totalXP = userData.totalXP || 0;
        const levelInfo = getLevelFromXP(totalXP);
        const dailyLimit = getDailyLimit();

        // Genres
        const genreCount = {};
        animeList.forEach(a => {
            if (a.genres && Array.isArray(a.genres)) {
                a.genres.forEach(g => {
                    genreCount[g] = (genreCount[g] || 0) + 1;
                });
            }
        });
        const topGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([g]) => g);

        // Top rated
        const scored = animeList.filter(a => a.score && a.score > 0);
        scored.sort((a, b) => b.score - a.score);
        const topAnime = scored.slice(0, 3);

        // Build context for the bot
        const context = {
            totalAnime,
            completed,
            watching,
            planToWatch,
            dropped,
            totalXP,
            level: levelInfo.level,
            title: levelInfo.title,
            dailyLimit,
            topGenres,
            topAnime: topAnime.map(a => `${a.title} (${a.score})`),
            username: profile.name || userData.username || 'Anime Fan'
        };

        // ─── Intent parsing ─────────────────────────────
        const msg = message.toLowerCase().trim();
        let response = '';

        // 1. Stats
        if (msg.includes('total anime') || msg.includes('how many anime') || msg.includes('anime count')) {
            response = `You have a total of ${context.totalAnime} anime in your list. ${context.completed} completed, ${context.watching} watching, ${context.planToWatch} plan to watch, and ${context.dropped} dropped.`;
        }
        else if (msg.includes('completed') && (msg.includes('how many') || msg.includes('count'))) {
            response = `You've completed ${context.completed} anime.`;
        }
        else if (msg.includes('watching') && (msg.includes('how many') || msg.includes('count'))) {
            response = `You're currently watching ${context.watching} anime.`;
        }
        else if (msg.includes('plan to watch') || msg.includes('planned')) {
            response = `You have ${context.planToWatch} anime in your "Plan to Watch" list.`;
        }
        else if (msg.includes('xp') || msg.includes('experience')) {
            response = `You have a total of ${context.totalXP} XP. You are level ${context.level} (${context.title}). The daily XP limit is ${context.dailyLimit} XP.`;
        }
        else if (msg.includes('level') || msg.includes('title')) {
            response = `You are level ${context.level} (${context.title}).`;
        }
        else if (msg.includes('daily limit') || msg.includes('daily xp')) {
            response = `The daily XP limit is ${context.dailyLimit} XP.`;
        }
        else if (msg.includes('top genre') || msg.includes('favorite genre')) {
            if (context.topGenres.length) {
                response = `Your top genres are: ${context.topGenres.join(', ')}.`;
            } else {
                response = "You haven't completed enough anime to determine top genres yet.";
            }
        }
        else if (msg.includes('recommend') || msg.includes('suggest')) {
            // Pick a random from Plan to Watch, or if empty, a random from the list
            let recs = [];
            if (planToWatch > 0) {
                const planList = animeList.filter(a => a.userStatus === 'Plan to Watch');
                const shuffled = planList.sort(() => 0.5 - Math.random());
                recs = shuffled.slice(0, 3);
            } else if (animeList.length > 0) {
                const shuffled = animeList.sort(() => 0.5 - Math.random());
                recs = shuffled.slice(0, 3);
            }
            if (recs.length) {
                response = `I recommend: ${recs.map(a => a.title).join(', ')}. ${recs.length > 1 ? 'Check them out!' : 'Enjoy!'}`;
            } else {
                response = "You don't have any anime in your list yet. Add some to get recommendations!";
            }
        }
        else if (msg.includes('top rated') || msg.includes('best anime')) {
            if (context.topAnime.length) {
                response = `Your highest rated anime: ${context.topAnime.join(', ')}.`;
            } else {
                response = "You haven't rated any anime yet. Start rating to see your top picks!";
            }
        }
        else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            response = `Hello, ${context.username}! I'm your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.`;
        }
        else if (msg.includes('help')) {
            response = `I can tell you about your anime stats, recommend anime, or answer questions about XP, levels, and daily limits. Try asking "How many anime have I completed?" or "Recommend me an anime".`;
        }
        else {
            // Fallback: general response
            response = `I'm not sure about that, ${context.username}. I can help with stats, recommendations, and general anime info. Try asking something like "What's my total XP?" or "Recommend me an anime".`;
        }

        res.json({ response });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

module.exports = router;