require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { initDatabase } = require('./db');
const { auth, JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const assignmentsRoutes = require('./routes/assignments');
const messagesRoutes = require('./routes/messages');
const progressRoutes = require('./routes/progress');
const resourcesRoutes = require('./routes/resources');
const portfolioRoutes = require('./routes/portfolio');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

initDatabase();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Mount auth routes correctly at /api/auth
app.use('/api/auth', authRoutes);

app.use('/api/events', eventsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Socket.IO for real-time messaging
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next();
  }
});

io.on('connection', (socket) => {
  const user = socket.user ? socket.user.username : 'anonymous';
  console.log('Socket connected:', user);
  if (socket.user && socket.user.username) {
    socket.join(`user:${socket.user.username}`);
  }
});

// Make io accessible to routes
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
