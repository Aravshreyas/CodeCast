const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

const FileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    content: { type: String, default: '' },
    language: {type: String, default: 'javascript' }
});

const ClassroomSessionSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(),
  },
  active: {
    type: Boolean,
    default: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  files: {
      type: [FileSchema],
      default: [
          { name: 'index.html', content: '<h1>Hello World</h1>', language: 'html'},
          { name: 'script.js', content: "console.log('Hello from script!');", language: 'javascript' },
      ]
  }
}, { timestamps: true });

module.exports = mongoose.model('ClassroomSession', ClassroomSessionSchema);