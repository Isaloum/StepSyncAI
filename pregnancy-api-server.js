/**
 * Pregnancy Safety API Server
 * Simple Express server to handle pregnancy medication safety checks
 */

const express = require('express');
const path = require('path');
const MedicationTracker = require('./medication-tracker');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('docs')); // Serve the HTML UI

// Initialize medication tracker
const tracker = new MedicationTracker();

/**
 * Pregnancy safety check endpoint
 * POST /api/check-pregnancy-safety
 */
app.post('/api/check-pregnancy-safety', async (req, res) => {
  try {
    const { medicationName, weekOfPregnancy, patientId } = req.body;

    // Validate input
    if (!medicationName || !weekOfPregnancy) {
      return res.status(400).json({
        error: 'Missing required fields: medicationName and weekOfPregnancy'
      });
    }

    if (weekOfPregnancy < 1 || weekOfPregnancy > 42) {
      return res.status(400).json({
        error: 'Invalid pregnancy week. Must be between 1 and 42.'
      });
    }

    // Check pregnancy safety using Bumpie_Meds
    const safetyResult = await tracker.checkPregnancySafety(
      medicationName,
      weekOfPregnancy,
      { 
        patientId,
        sessionId: req.headers['x-session-id'] || null
      }
    );

    res.json(safetyResult);

  } catch (error) {
    console.error('Pregnancy safety check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      safe: false,
      recommendation: 'Unable to assess safety. Please consult your healthcare provider.'
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MindTrackAI Pregnancy Safety API',
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve main UI
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🤰 MindTrackAI Pregnancy Safety API Server              ║
║                                                           ║
║  Status: ✅ Running                                       ║
║  Port:   ${PORT}                                             ║
║  URL:    http://localhost:${PORT}                            ║
║                                                           ║
║  Endpoints:                                               ║
║  • GET  /                                                 ║
║  • GET  /api/health                                       ║
║  • POST /api/check-pregnancy-safety                       ║
║                                                           ║
║  🔒 Powered by Bumpie_Meds - FDA Compliant                ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
