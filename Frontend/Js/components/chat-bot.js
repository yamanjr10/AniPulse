// ============================================
// CHAT BOT – UI + Local Fallback
// ============================================

(function () {
    'use strict';

    let isOpen = false;
    let container = null;
    let closeTimeout = null;

    function getUserName() {
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        return profile.name || profile.username || null;
    }

    function createChatUI() {
        // If container already exists, just show it
        if (container) {
            container.style.display = 'flex';
            // Force reflow for animation
            void container.offsetWidth;
            container.classList.add('open');
            isOpen = true;
            const input = document.getElementById('chat-bot-input');
            if (input) input.focus();
            return;
        }

        // Create container
        container = document.createElement('div');
        container.id = 'chat-bot-container';
        container.innerHTML = `
            <div id="chat-bot-panel">
                <div id="chat-bot-header">
                    <span><i class="fas fa-robot"></i> AniPulse Bot</span>
                    <button id="chat-bot-close"><i class="fas fa-times"></i></button>
                </div>
                <div id="chat-bot-messages"></div>
                <div id="chat-bot-input-area">
                    <input type="text" id="chat-bot-input" placeholder="Ask me anything..." />
                    <button id="chat-bot-send"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Events
        document.getElementById('chat-bot-close').addEventListener('click', closeChat);
        document.getElementById('chat-bot-send').addEventListener('click', sendMessage);
        document.getElementById('chat-bot-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Personalized greeting
        const name = getUserName();
        const greeting = name
            ? `Hello ${name}! I'm your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.`
            : 'Hello! I\'m your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.';
        addMessage('bot', greeting);

        // Show with animation
        container.style.display = 'flex';
        setTimeout(() => {
            container.classList.add('open');
        }, 10);
        isOpen = true;
        document.getElementById('chat-bot-input').focus();
    }

    function closeChat() {
        if (!container) return;
        if (closeTimeout) clearTimeout(closeTimeout);
        container.classList.remove('open');
        closeTimeout = setTimeout(() => {
            container.style.display = 'none';
            isOpen = false;
            closeTimeout = null;
        }, 300);
        // Set isOpen false immediately to prevent double-close
        isOpen = false;
    }

    function addMessage(sender, text) {
        const messagesDiv = document.getElementById('chat-bot-messages');
        if (!messagesDiv) return;

        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${sender}`;
        msgEl.textContent = text;
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // ─── Local answer generator (fallback) ──────────────
    function getLocalAnswer(message) {
        const data = window.animeData || [];
        const msg = message.toLowerCase().trim();

        const total = data.length;
        const completed = data.filter(a => a.userStatus === 'Completed').length;
        const watching = data.filter(a => a.userStatus === 'Watching').length;
        const plan = data.filter(a => a.userStatus === 'Plan to Watch').length;
        const dropped = data.filter(a => a.userStatus === 'Dropped').length;

        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const username = userProfile.name || userProfile.username || 'Anime Fan';

        let totalXP = 0;
        let level = 1;
        let title = 'Newbie';
        if (window.AniPulseLevelSystem && typeof window.AniPulseLevelSystem.getUserProfile === 'function') {
            const prof = window.AniPulseLevelSystem.getUserProfile();
            totalXP = prof.totalExp || 0;
            level = prof.level || 1;
            title = prof.title || 'Newbie';
        } else {
            totalXP = parseInt(localStorage.getItem('userXP') || '0');
            level = parseInt(localStorage.getItem('userLevel') || '1');
            title = localStorage.getItem('userLevelTitle') || 'Newbie';
        }

        const dailyLimit = 1500;

        // Genre counts
        const genreCount = {};
        data.forEach(a => {
            if (a.genres && Array.isArray(a.genres)) {
                a.genres.forEach(g => genreCount[g] = (genreCount[g] || 0) + 1);
            }
        });
        const topGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([g]) => g);

        // Top rated
        const scored = data.filter(a => a.score && a.score > 0);
        scored.sort((a, b) => b.score - a.score);
        const topAnime = scored.slice(0, 3).map(a => `${a.title} (${a.score})`);

        if (msg.includes('total anime') || msg.includes('how many anime') || msg.includes('anime count')) {
            return `You have a total of ${total} anime. ${completed} completed, ${watching} watching, ${plan} plan to watch, ${dropped} dropped.`;
        }
        if (msg.includes('completed') && (msg.includes('how many') || msg.includes('count'))) {
            return `You've completed ${completed} anime.`;
        }
        if (msg.includes('watching') && (msg.includes('how many') || msg.includes('count'))) {
            return `You're currently watching ${watching} anime.`;
        }
        if (msg.includes('plan to watch') || msg.includes('planned')) {
            return `You have ${plan} anime in your "Plan to Watch" list.`;
        }
        if (msg.includes('xp') || msg.includes('experience')) {
            return `You have ${totalXP} XP. Level ${level} (${title}). Daily XP limit is ${dailyLimit}.`;
        }
        if (msg.includes('level') || msg.includes('title')) {
            return `You are level ${level} (${title}).`;
        }
        if (msg.includes('daily limit') || msg.includes('daily xp')) {
            return `The daily XP limit is ${dailyLimit} XP.`;
        }
        if (msg.includes('top genre') || msg.includes('favorite genre')) {
            if (topGenres.length) return `Your top genres: ${topGenres.join(', ')}.`;
            return "You haven't completed enough anime to determine top genres yet.";
        }
        if (msg.includes('recommend') || msg.includes('suggest')) {
            let recs = [];
            if (plan > 0) {
                const planList = data.filter(a => a.userStatus === 'Plan to Watch');
                const shuffled = planList.sort(() => 0.5 - Math.random());
                recs = shuffled.slice(0, 3);
            } else if (data.length > 0) {
                const shuffled = data.sort(() => 0.5 - Math.random());
                recs = shuffled.slice(0, 3);
            }
            if (recs.length) return `I recommend: ${recs.map(a => a.title).join(', ')}.`;
            return "You don't have any anime in your list yet. Add some to get recommendations!";
        }
        if (msg.includes('top rated') || msg.includes('best anime')) {
            if (topAnime.length) return `Your highest rated: ${topAnime.join(', ')}.`;
            return "You haven't rated any anime yet.";
        }
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            return `Hello, ${username}! I'm your AniPulse assistant. Ask me about your stats, get recommendations, or just chat.`;
        }
        if (msg.includes('help')) {
            return `I can tell you about your anime stats, recommend anime, or answer about XP, levels, and daily limits. Try "How many anime have I completed?" or "Recommend me an anime".`;
        }
        return null; // no local match
    }

    function sendMessage() {
        const input = document.getElementById('chat-bot-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        addMessage('user', text);
        input.value = '';
        input.disabled = true;
        const sendBtn = document.getElementById('chat-bot-send');
        if (sendBtn) sendBtn.disabled = true;

        // Typing indicator
        const messagesDiv = document.getElementById('chat-bot-messages');
        const typing = document.createElement('div');
        typing.className = 'chat-message bot typing';
        typing.textContent = '...';
        messagesDiv.appendChild(typing);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // First try local answer (quick)
        const localAnswer = getLocalAnswer(text);
        if (localAnswer) {
            typing.remove();
            addMessage('bot', localAnswer);
            input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            input.focus();
            return;
        }

        // No local answer → call backend
        fetch(`${window.API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ message: text })
        })
            .then(response => response.json())
            .then(data => {
                typing.remove();
                const reply = data.response || 'Sorry, I couldn\'t process that.';
                addMessage('bot', reply);
            })
            .catch(err => {
                typing.remove();
                addMessage('bot', 'I\'m having trouble connecting. Try asking something like "What\'s my total XP?"');
                console.error('Chat error:', err);
            })
            .finally(() => {
                input.disabled = false;
                if (sendBtn) sendBtn.disabled = false;
                input.focus();
            });
    }

    // ─── Open / Toggle from FAB ──────────────────────────
    window.openChatBot = function () {
        if (isOpen) {
            closeChat();
        } else {
            createChatUI();
        }
    };

    // Close on outside click (but not on FAB)
    document.addEventListener('click', function (e) {
        if (container && container.style.display !== 'none') {
            const panel = document.getElementById('chat-bot-panel');
            if (panel && !panel.contains(e.target) && e.target.id !== 'fab-main' && !e.target.closest('.fab-item')) {
                closeChat();
            }
        }
    });

    console.log('Chat Bot initialized (fixed open/close)');
})();