require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const moodsRoutes = require('./routes/moods');
const journalRoutes = require('./routes/journal');
const symptomsRoutes = require('./routes/symptoms');
const triggersRoutes = require('./routes/triggers');
const copingRoutes = require('./routes/coping');
const contactsRoutes = require('./routes/contacts');
const goalsRoutes = require('./routes/goals');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Mental Health API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/moods', moodsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/symptoms', symptomsRoutes);
app.use('/api/triggers', triggersRoutes);
app.use('/api/coping', copingRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/goals', goalsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
