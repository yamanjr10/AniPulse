const express = require('express');
const router = express.Router();

// Proxy for AniList GraphQL API
router.post('/anilist', async (req, res) => {
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('AniList proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from AniList' });
    }
});

// Proxy for Kitsu API
router.get('/kitsu', async (req, res) => {
    try {
        const query = req.query.q || '';
        const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=10&sort=-averageRating`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.api+json',  // Kitsu requires this specific Accept header
            },
        });

        if (!response.ok) {
            throw new Error(`Kitsu API responded with ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Kitsu proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from Kitsu' });
    }
});

module.exports = router;