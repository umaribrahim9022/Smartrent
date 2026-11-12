const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const errorHandler = require('./middlewares/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const rentPredictionRoutes = require('./routes/rentPredictionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const savedPropertyRoutes = require('./routes/savedPropertyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Middlewares (Parsers & CORS setup)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Setup for Real-time Messaging & Notifications
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Pass Socket.io instance to request object (Controllers can use req.io)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Connection Event Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinUser', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    }
  });

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room: ${conversationId}`);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.conversationId).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Mounting API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/rent-prediction', rentPredictionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messaging', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved-properties', savedPropertyRoutes);
app.use('/api/admin', adminRoutes);

// Root Health-Check Route
app.get('/', (req, res) => {
  res.send('SmartRent AI API is running');
});

// Global Error Handling Middleware (Must be after all routes)
app.use(errorHandler);

module.exports = { app, server, io };
