const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get symptoms
router.get('/', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const type = req.query.type;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let query = `SELECT * FROM symptoms
                     WHERE user_id = ? AND timestamp >= ?`;
        const params = [req.userId, startDate.toISOString()];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY timestamp DESC';

        const symptoms = await db.all(query, params);
        res.json(symptoms);
    } catch (error) {
        console.error('Get symptoms error:', error);
        res.status(500).json({ error: 'Error fetching symptoms' });
    }
});

// Get symptom statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stats = await db.all(
            `SELECT
                type,
                COUNT(*) as occurrences,
                AVG(severity) as avg_severity,
                MAX(severity) as max_severity
             FROM symptoms
             WHERE user_id = ? AND timestamp >= ?
             GROUP BY type
             ORDER BY occurrences DESC`,
            [req.userId, startDate.toISOString()]
        );

        res.json(stats);
    } catch (error) {
        console.error('Get symptom stats error:', error);
        res.status(500).json({ error: 'Error fetching symptom statistics' });
    }
});

// Add symptom
router.post('/', auth, async (req, res) => {
    try {
        const { type, severity, note } = req.body;

        const validTypes = [
            'anxiety', 'panic', 'flashback', 'nightmare',
            'depression', 'insomnia', 'irritability', 'avoidance',
            'hypervigilance', 'concentration', 'physical-pain', 'other'
        ];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid symptom type' });
        }

        if (severity < 1 || severity > 10) {
            return res.status(400).json({ error: 'Severity must be between 1 and 10' });
        }

        const result = await db.run(
            'INSERT INTO symptoms (user_id, type, severity, note) VALUES (?, ?, ?, ?)',
            [req.userId, type, severity, note || '']
        );

        const symptom = await db.get('SELECT * FROM symptoms WHERE id = ?', [result.id]);
        res.status(201).json(symptom);
    } catch (error) {
        console.error('Add symptom error:', error);
        res.status(500).json({ error: 'Error adding symptom' });
    }
});

// Delete symptom
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.run(
            'DELETE FROM symptoms WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        res.json({ message: 'Symptom deleted successfully' });
    } catch (error) {
        console.error('Delete symptom error:', error);
        res.status(500).json({ error: 'Error deleting symptom' });
    }
});

module.exports = router;
