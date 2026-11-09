const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../controllers/chatController');

// Multer memory storage for in-memory audio buffer processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

router.post('/', chatController.handleChatMessage);
router.post('/voice', upload.single('audio'), chatController.handleVoiceTranscribe);

module.exports = router;