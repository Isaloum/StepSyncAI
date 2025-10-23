const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Register
router.post('/register',
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, name } = req.body;

            // Check if user exists
            const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const result = await db.run(
                'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                [email, hashedPassword, name]
            );

            // Create empty profile
            await db.run(
                'INSERT INTO user_profiles (user_id) VALUES (?)',
                [result.id]
            );

            // Generate token
            const token = jwt.sign({ userId: result.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.status(201).json({
                message: 'User created successfully',
                token,
                user: { id: result.id, email, name }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Error creating user' });
        }
    }
);

// Login
router.post('/login',
    body('email').isEmail(),
    body('password').notEmpty(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user
            const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, email: user.email, name: user.name }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Error logging in' });
        }
    }
);

module.exports = router;
