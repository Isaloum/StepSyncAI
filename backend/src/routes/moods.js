const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get mood entries
router.get('/', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const moods = await db.all(
            `SELECT * FROM mood_entries
             WHERE user_id = ? AND timestamp >= ?
             ORDER BY timestamp DESC`,
            [req.userId, startDate.toISOString()]
        );

        res.json(moods);
    } catch (error) {
        console.error('Get moods error:', error);
        res.status(500).json({ error: 'Error fetching mood entries' });
    }
});

// Get mood statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stats = await db.get(
            `SELECT
                COUNT(*) as total_entries,
                AVG(rating) as average_mood,
                MIN(rating) as lowest_mood,
                MAX(rating) as highest_mood
             FROM mood_entries
             WHERE user_id = ? AND timestamp >= ?`,
            [req.userId, startDate.toISOString()]
        );

        res.json(stats);
    } catch (error) {
        console.error('Get mood stats error:', error);
        res.status(500).json({ error: 'Error fetching mood statistics' });
    }
});

// Add mood entry
router.post('/', auth, async (req, res) => {
    try {
        const { rating, note } = req.body;

        if (rating < 1 || rating > 10) {
            return res.status(400).json({ error: 'Rating must be between 1 and 10' });
        }

        const result = await db.run(
            'INSERT INTO mood_entries (user_id, rating, note) VALUES (?, ?, ?)',
            [req.userId, rating, note || '']
        );

        const mood = await db.get('SELECT * FROM mood_entries WHERE id = ?', [result.id]);
        res.status(201).json(mood);
    } catch (error) {
        console.error('Add mood error:', error);
        res.status(500).json({ error: 'Error adding mood entry' });
    }
});

// Delete mood entry
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.run(
            'DELETE FROM mood_entries WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        res.json({ message: 'Mood entry deleted successfully' });
    } catch (error) {
        console.error('Delete mood error:', error);
        res.status(500).json({ error: 'Error deleting mood entry' });
    }
});

module.exports = router;
