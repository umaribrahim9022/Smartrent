const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.createConversation = async (req, res, next) => {
  try {
    const { landlordId } = req.body;
    let conversation = await Conversation.findOne({
      tenant: req.user._id,
      landlord: landlordId
    });

    if (!conversation) {
      conversation = await Conversation.create({
        tenant: req.user._id,
        landlord: landlordId
      });
    }

    res.status(200).json({ success: true, data: { conversation } });
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ tenant: req.user._id }, { landlord: req.user._id }]
    }).populate('tenant landlord', 'name email profileImage');

    res.status(200).json({ success: true, data: { conversations } });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, messageText } = req.body;

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      messageText
    });

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      const isTenant = conversation.tenant.toString() === req.user._id.toString();
      const updateData = { $set: { lastMessage: messageText } };
      if (isTenant) {
        updateData.$inc = { unreadCountLandlord: 1 };
      } else {
        updateData.$inc = { unreadCountTenant: 1 };
      }
      await Conversation.findByIdAndUpdate(conversationId, updateData);
      
      const recipientId = isTenant ? conversation.landlord : conversation.tenant;
      const User = require('../models/User');
      const { notifyUser, generateEmailTemplate } = require('../utils/notifyUser');

      const recipient = await User.findById(recipientId);
      if (recipient) {
        const preview = messageText.length > 35 ? messageText.substring(0, 35) + '...' : messageText;
        const msgEmailHtml = generateEmailTemplate({
          title: `New Message from ${req.user.name}`,
          contentHtml: `
            <p>Hello <strong>${recipient.name}</strong>,</p>
            <p>You received a new message from <strong>${req.user.name}</strong> regarding your property inquiry:</p>
            <div class="info-box">
              <p style="margin: 0; color: #ffffff; font-style: italic;">"${messageText}"</p>
            </div>
            <p>Reply directly on SmartRent to keep the conversation going.</p>
          `,
          actionUrl: 'http://localhost:5173/messages',
          actionText: 'Open Chat & Reply'
        });

        await notifyUser({
          userId: recipient._id,
          userEmail: recipient.email,
          userName: recipient.name,
          text: `New message from ${req.user.name}: "${preview}"`,
          type: 'message',
          io: req.io,
          emailSubject: `💬 New Message from ${req.user.name} on SmartRent`,
          emailHtml: msgEmailHtml
        });
      }
    }

    if (req.io) {
      req.io.to(conversationId).emit('receiveMessage', message);
    }

    res.status(201).json({ success: true, data: { message } });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    // Reset unread count for the current user when they fetch messages
    const conversation = await Conversation.findById(req.params.conversationId);
    if (conversation) {
      const isTenant = conversation.tenant.toString() === req.user._id.toString();
      const updateData = {};
      if (isTenant) {
        updateData.unreadCountTenant = 0;
      } else {
        updateData.unreadCountLandlord = 0;
      }
      await Conversation.findByIdAndUpdate(req.params.conversationId, updateData);
    }

    res.status(200).json({ success: true, data: { messages } });
  } catch (error) {
    next(error);
  }
};