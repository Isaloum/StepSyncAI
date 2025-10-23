const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get all goals
router.get('/', auth, async (req, res) => {
    try {
        const showCompleted = req.query.completed === 'true';

        let query = 'SELECT * FROM goals WHERE user_id = ?';
        if (!showCompleted) {
            query += ' AND completed = 0';
        }
        query += ' ORDER BY created_at DESC';

        const goals = await db.all(query, [req.userId]);
        res.json(goals);
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Error fetching goals' });
    }
});

// Add goal
router.post('/', auth, async (req, res) => {
    try {
        const { description, target_date } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const result = await db.run(
            'INSERT INTO goals (user_id, description, target_date) VALUES (?, ?, ?)',
            [req.userId, description, target_date || null]
        );

        const goal = await db.get('SELECT * FROM goals WHERE id = ?', [result.id]);
        res.status(201).json(goal);
    } catch (error) {
        console.error('Add goal error:', error);
        res.status(500).json({ error: 'Error adding goal' });
    }
});

// Complete goal
router.patch('/:id/complete', auth, async (req, res) => {
    try {
        await db.run(
            'UPDATE goals SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        const goal = await db.get('SELECT * FROM goals WHERE id = ?', [req.params.id]);
        res.json(goal);
    } catch (error) {
        console.error('Complete goal error:', error);
        res.status(500).json({ error: 'Error completing goal' });
    }
});

// Update goal
router.put('/:id', auth, async (req, res) => {
    try {
        const { description, target_date } = req.body;

        await db.run(
            'UPDATE goals SET description = ?, target_date = ? WHERE id = ? AND user_id = ?',
            [description, target_date, req.params.id, req.userId]
        );

        res.json({ message: 'Goal updated successfully' });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Error updating goal' });
    }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.run(
            'DELETE FROM goals WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Error deleting goal' });
    }
});

module.exports = router;
