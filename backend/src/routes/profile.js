const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get profile
router.get('/', auth, async (req, res) => {
    try {
        const profile = await db.get(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [req.userId]
        );

        res.json(profile || {});
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

// Update profile
router.put('/', auth, async (req, res) => {
    try {
        const { accident_date, accident_description } = req.body;

        await db.run(
            'UPDATE user_profiles SET accident_date = ?, accident_description = ? WHERE user_id = ?',
            [accident_date, accident_description, req.userId]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Error updating profile' });
    }
});

module.exports = router;
