const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get journal entries
router.get('/', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const type = req.query.type;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let query = `SELECT * FROM journal_entries
                     WHERE user_id = ? AND timestamp >= ?`;
        const params = [req.userId, startDate.toISOString()];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY timestamp DESC';

        const entries = await db.all(query, params);
        res.json(entries);
    } catch (error) {
        console.error('Get journal entries error:', error);
        res.status(500).json({ error: 'Error fetching journal entries' });
    }
});

// Add journal entry
router.post('/', auth, async (req, res) => {
    try {
        const { content, type } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const result = await db.run(
            'INSERT INTO journal_entries (user_id, content, type) VALUES (?, ?, ?)',
            [req.userId, content, type || 'general']
        );

        const entry = await db.get('SELECT * FROM journal_entries WHERE id = ?', [result.id]);
        res.status(201).json(entry);
    } catch (error) {
        console.error('Add journal entry error:', error);
        res.status(500).json({ error: 'Error adding journal entry' });
    }
});

// Update journal entry
router.put('/:id', auth, async (req, res) => {
    try {
        const { content, type } = req.body;

        await db.run(
            'UPDATE journal_entries SET content = ?, type = ? WHERE id = ? AND user_id = ?',
            [content, type, req.params.id, req.userId]
        );

        res.json({ message: 'Journal entry updated successfully' });
    } catch (error) {
        console.error('Update journal entry error:', error);
        res.status(500).json({ error: 'Error updating journal entry' });
    }
});

// Delete journal entry
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.run(
            'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        res.json({ message: 'Journal entry deleted successfully' });
    } catch (error) {
        console.error('Delete journal entry error:', error);
        res.status(500).json({ error: 'Error deleting journal entry' });
    }
});

module.exports = router;
