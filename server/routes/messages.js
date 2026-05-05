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

      res.status(201).json({
        message: 'Message sent',
        messageData: {
          id: result.id,
          sender,
          recipient,
          content,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ message: 'Error sending message', error: err.message });
    }
  }
);

module.exports = router;
