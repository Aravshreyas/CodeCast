const express = require('express');
const router = express.Router();
const { createSession, getSessionDetails, joinSession, getLiveKitToken } = require('../controllers/sessionController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.post('/create', protect, instructor, createSession);
router.post('/join', protect, joinSession);
router.get('/:id', protect, getSessionDetails);
router.get('/:id/livekit-token', protect, getLiveKitToken); // New route for LiveKit token

module.exports = router;