const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get all emergency contacts
router.get('/', auth, async (req, res) => {
    try {
        const contacts = await db.all(
            'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC',
            [req.userId]
        );

        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Error fetching emergency contacts' });
    }
});

// Add emergency contact
router.post('/', auth, async (req, res) => {
    try {
        const { name, relationship, phone, notes } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        const result = await db.run(
            'INSERT INTO emergency_contacts (user_id, name, relationship, phone, notes) VALUES (?, ?, ?, ?, ?)',
            [req.userId, name, relationship || '', phone, notes || '']
        );

        const contact = await db.get('SELECT * FROM emergency_contacts WHERE id = ?', [result.id]);
        res.status(201).json(contact);
    } catch (error) {
        console.error('Add contact error:', error);
        res.status(500).json({ error: 'Error adding emergency contact' });
    }
});

// Update emergency contact
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, relationship, phone, notes } = req.body;

        await db.run(
            'UPDATE emergency_contacts SET name = ?, relationship = ?, phone = ?, notes = ? WHERE id = ? AND user_id = ?',
            [name, relationship, phone, notes, req.params.id, req.userId]
        );

        res.json({ message: 'Emergency contact updated successfully' });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: 'Error updating emergency contact' });
    }
});

// Delete emergency contact
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.run(
            'DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        res.json({ message: 'Emergency contact deleted successfully' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Error deleting emergency contact' });
    }
});

module.exports = router;
