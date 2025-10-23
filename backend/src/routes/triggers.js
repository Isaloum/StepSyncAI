const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get all triggers
router.get('/', auth, async (req, res) => {
    try {
        const triggers = await db.all(
            'SELECT * FROM triggers WHERE user_id = ? ORDER BY occurrences DESC',
            [req.userId]
        );

        res.json(triggers);
    } catch (error) {
        console.error('Get triggers error:', error);
        res.status(500).json({ error: 'Error fetching triggers' });
    }
});

// Add trigger
router.post('/', auth, async (req, res) => {
    try {
        const { description, intensity } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const result = await db.run(
            'INSERT INTO triggers (user_id, description, intensity) VALUES (?, ?, ?)',
            [req.userId, description, intensity || 5]
        );

        const trigger = await db.get('SELECT * FROM triggers WHERE id = ?', [result.id]);
        res.status(201).json(trigger);
    } catch (error) {
        console.error('Add trigger error:', error);
        res.status(500).json({ error: 'Error adding trigger' });
    }
});

// Log trigger occurrence
router.post('/:id/occurrence', auth, async (req, res) => {
    try {
        await db.run(
            `UPDATE triggers
             SET occurrences = occurrences + 1,
                 last_occurred = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [req.params.id, req.userId]
        );

        const trigger = await db.get('SELECT * FROM triggers WHERE id = ?', [req.params.id]);
        res.json(trigger);
    } catch (error) {
        console.error('Log trigger occurrence error:', error);
        res.status(500).json({ error: 'Error logging trigger occurrence' });
    }
});

// Update trigger
router.put('/:id', auth, async (req, res) => {
    try {
        const { description, intensity } = req.body;

        await db.run(
            'UPDATE triggers SET description = ?, intensity = ? WHERE id = ? AND user_id = ?',
            [description, intensity, req.params.id, req.userId]
        );

        res.json({ message: 'Trigger updated successfully' });
    } catch (error) {
        console.error('Update trigger error:', error);
        res.status(500).json({ error: 'Error updating trigger' });
    }
});

// Delete trigger
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.run(
            'DELETE FROM triggers WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        res.json({ message: 'Trigger deleted successfully' });
    } catch (error) {
        console.error('Delete trigger error:', error);
        res.status(500).json({ error: 'Error deleting trigger' });
    }
});

module.exports = router;
