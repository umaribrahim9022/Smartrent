const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/conversations', messageController.createConversation);
router.get('/conversations', messageController.getConversations);
router.post('/messages', messageController.sendMessage);
router.get('/messages/:conversationId', messageController.getMessages);

module.exports = router;