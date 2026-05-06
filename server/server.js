require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./db');
const { auth } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const assignmentsRoutes = require('./routes/assignments');
const messagesRoutes = require('./routes/messages');
const progressRoutes = require('./routes/progress');
const resourcesRoutes = require('./routes/resources');

const app = express();
const PORT = process.env.PORT || 5000;

initDatabase();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.post('/api/auth/login', authRoutes);
app.post('/api/auth/logout', authRoutes);

app.use('/api/events', eventsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/resources', resourcesRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  🚀 MSc Dashboard Server                       ║
║                                                                ║
║  ✅ Server running on: http://localhost:${PORT}                  ║
║                                                                ║
║  📍 Open http://localhost:${PORT} in your browser                ║
║                                                                ║
║  🔐 Test Credentials:                                          ║
║     Username: simon, Role: Student, Password: simon2026        ║
║     Username: conveyor, Role: Conveyor, Password: dalvie2026   ║
║     Username: dalvie, Role: Supervisor, Password: martin2026   ║
║                                                                ║
║  💡 For multi-user testing:                                    ║
║     Open 2 browsers or 2 browser windows                       ║
║     Login with different roles                                 ║
║     Events and messages sync automatically!                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
