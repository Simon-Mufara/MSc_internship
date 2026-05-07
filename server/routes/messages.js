const express = require('express');
const { body, validationResult } = require('express-validator');
const { allAsync, runAsync } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/:recipient', auth, async (req, res) => {
  try {
    const recipient = req.params.recipient;
    const currentUser = req.user.username;

    const messages = await allAsync(`
      SELECT id, sender, recipient, content, timestamp
      FROM messages
      WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)
      ORDER BY timestamp ASC
    `, [currentUser, recipient, recipient, currentUser]);

    res.json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
});

router.post('/',
  auth,
  body('recipient').trim().notEmpty().withMessage('Recipient required'),
  body('content').trim().notEmpty().withMessage('Content required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, content } = req.body;
    const sender = req.user.username;

    try {
      const result = await runAsync(`
        INSERT INTO messages (sender, recipient, content)
        VALUES (?, ?, ?)
      `, [sender, recipient, content]);

      const messageData = {
        id: result.id,
        sender,
        recipient,
        content,
        timestamp: new Date().toISOString()
      };

      // Emit via Socket.IO if available
      try {
        const io = req.app.get('io');
        if (io) {
          // send to both sender and recipient rooms
          io.to(`user:${recipient}`).emit('new_message', messageData);
          io.to(`user:${sender}`).emit('new_message', messageData);
        }
      } catch (emitErr) {
        console.error('Error emitting message via Socket.IO:', emitErr.message || emitErr);
      }

      res.status(201).json({ message: 'Message sent', messageData });
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ message: 'Error sending message', error: err.message });
    }
  }
);

router.delete('/:messageId', auth, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const currentUser = req.user.username;

    const message = await allAsync(`
      SELECT id, sender, recipient
      FROM messages
      WHERE id = ?
    `, [messageId]);

    const target = message[0];
    if (!target) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (target.sender !== currentUser && target.recipient !== currentUser) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await runAsync('DELETE FROM messages WHERE id = ?', [messageId]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Error deleting message', error: err.message });
  }
});

module.exports = router;
