const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    starterCode: {
        type: String,
        default: '// Start coding here!',
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, { timestamps: true });

module.exports = mongoose.model('Prompt', PromptSchema);