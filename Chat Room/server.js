const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Socket.io setup with proper CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Serve static files from the public directory
app.use(express.static('public'));

// Supabase setup with fallback values
const supabaseUrl = process.env.SUPABASE_URL || 'https://cyporxvxzrzgshiajtvi.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cG9yeHZ4enJ6Z3NoaWFqdHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzU0NDYsImV4cCI6MjA2MDk1MTQ0Nn0.tcOAK6bHQ15pVDn0KGWTXcCyARHMvhlHnG6HSbzgaqE';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials are required. Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token provided'));

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return next(new Error('Invalid token'));

    socket.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.email);
  
  // Add user to online users
  onlineUsers.set(socket.user.id, {
    id: socket.user.id,
    email: socket.user.email,
    socketId: socket.id
  });

  // Broadcast updated user list
  io.emit('userList', Array.from(onlineUsers.values()));

  // Handle private messages
  socket.on('privateMessage', async ({ content, receiverId }) => {
    try {
      console.log('Received private message:', { 
        content, 
        receiverId, 
        senderId: socket.user.id,
        senderEmail: socket.user.email 
      });

      // Validate receiver exists
      const receiver = onlineUsers.get(receiverId);
      if (!receiver) {
        console.error('Receiver not found:', receiverId);
        throw new Error('Receiver not found');
      }

      // Validate message content
      if (!content || typeof content !== 'string') {
        console.error('Invalid message content:', content);
        throw new Error('Invalid message content');
      }

      // First, verify the sender and receiver exist in the users table
      const { data: senderData, error: senderError } = await supabase
        .from('users')
        .select('id')
        .eq('id', socket.user.id)
        .single();

      if (senderError || !senderData) {
        console.error('Sender not found in database:', senderError);
        throw new Error('Sender not found in database');
      }

      const { data: receiverData, error: receiverError } = await supabase
        .from('users')
        .select('id')
        .eq('id', receiverId)
        .single();

      if (receiverError || !receiverData) {
        console.error('Receiver not found in database:', receiverError);
        throw new Error('Receiver not found in database');
      }

      // Insert message into database
      const { data, error } = await supabase
        .from('messages')
        .insert([{ 
          sender_id: socket.user.id, 
          receiver_id: receiverId, 
          content
        }])
        .select();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to save message to database: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insert');
        throw new Error('Failed to save message: No data returned');
      }

      const message = data[0];
      console.log('Message saved successfully:', message);
      
      // Emit to sender
      socket.emit('messageSent', message);
      
      // Emit to receiver if online
      if (receiver) {
        console.log('Sending message to receiver:', receiver.email);
        io.to(receiver.socketId).emit('newPrivateMessage', message);
      }
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('error', { 
        message: error.message || 'Failed to send message',
        details: error.toString()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.email);
    onlineUsers.delete(socket.user.id);
    io.emit('userList', Array.from(onlineUsers.values()));
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});