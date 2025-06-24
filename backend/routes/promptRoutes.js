const express = require('express');
const router = express.Router();
const { createPrompt, getMyPrompts } = require('../controllers/promptController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/').post(protect, instructor, createPrompt).get(protect, instructor, getMyPrompts);

module.exports = router;