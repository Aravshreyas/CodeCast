const Prompt = require('../models/Prompt');

// @desc    Create a new prompt
// @route   POST /api/prompts
// @access  Private/Instructor
const createPrompt = async (req, res) => {
    try {
        const { title, description, starterCode } = req.body;
        const prompt = new Prompt({
            title,
            description,
            starterCode,
            instructor: req.user._id,
        });

        const createdPrompt = await prompt.save();
        res.status(201).json(createdPrompt);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not create prompt.' });
    }
};

// @desc    Get all prompts for the logged-in instructor
// @route   GET /api/prompts
// @access  Private/Instructor
const getMyPrompts = async (req, res) => {
    try {
        const prompts = await Prompt.find({ instructor: req.user._id });
        res.json(prompts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch prompts.' });
    }
};

module.exports = {
    createPrompt,
    getMyPrompts,
};
