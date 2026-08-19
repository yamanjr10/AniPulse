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


module.exports = router;