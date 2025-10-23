const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get all coping strategies
router.get('/', auth, async (req, res) => {
    try {
        const strategies = await db.all(
            'SELECT * FROM coping_strategies WHERE user_id = ? ORDER BY effectiveness DESC NULLS LAST',
            [req.userId]
        );

        res.json(strategies);
    } catch (error) {
        console.error('Get coping strategies error:', error);
        res.status(500).json({ error: 'Error fetching coping strategies' });
    }
});

// Add coping strategy
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await db.run(
            'INSERT INTO coping_strategies (user_id, name, description) VALUES (?, ?, ?)',
            [req.userId, name, description || '']
        );

        const strategy = await db.get('SELECT * FROM coping_strategies WHERE id = ?', [result.id]);
        res.status(201).json(strategy);
    } catch (error) {
        console.error('Add coping strategy error:', error);
        res.status(500).json({ error: 'Error adding coping strategy' });
    }
});

// Use coping strategy
router.post('/:id/use', auth, async (req, res) => {
    try {
        const { rating } = req.body;

        // Increment times used
        await db.run(
            'UPDATE coping_strategies SET times_used = times_used + 1 WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        // Add rating if provided
        if (rating && rating >= 1 && rating <= 10) {
            await db.run(
                'INSERT INTO strategy_ratings (strategy_id, rating) VALUES (?, ?)',
                [req.params.id, rating]
            );

            // Update average effectiveness
            const avgResult = await db.get(
                'SELECT AVG(rating) as avg_rating FROM strategy_ratings WHERE strategy_id = ?',
                [req.params.id]
            );

            await db.run(
                'UPDATE coping_strategies SET effectiveness = ? WHERE id = ?',
                [avgResult.avg_rating, req.params.id]
            );
        }

        const strategy = await db.get('SELECT * FROM coping_strategies WHERE id = ?', [req.params.id]);
        res.json(strategy);
    } catch (error) {
        console.error('Use coping strategy error:', error);
        res.status(500).json({ error: 'Error using coping strategy' });
    }
});

// Update coping strategy
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        await db.run(
            'UPDATE coping_strategies SET name = ?, description = ? WHERE id = ? AND user_id = ?',
            [name, description, req.params.id, req.userId]
        );

        res.json({ message: 'Coping strategy updated successfully' });
    } catch (error) {
        console.error('Update coping strategy error:', error);
        res.status(500).json({ error: 'Error updating coping strategy' });
    }
});

// Delete coping strategy
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.run(
            'DELETE FROM coping_strategies WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        res.json({ message: 'Coping strategy deleted successfully' });
    } catch (error) {
        console.error('Delete coping strategy error:', error);
        res.status(500).json({ error: 'Error deleting coping strategy' });
    }
});

module.exports = router;
