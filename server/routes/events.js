const express = require('express');
const { body, validationResult } = require('express-validator');
const { allAsync, runAsync } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const events = await allAsync(`
      SELECT id, title, type, date, end_date, description, created_by, reminder, created_at
      FROM events
      ORDER BY date ASC
    `);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

router.post('/',
  auth,
  body('title').trim().notEmpty(),
  body('type').isIn(['assessment', 'deadline', 'work', 'class']),
  body('date').isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, type, date, endDate, description, reminder } = req.body;
    try {
      const result = await runAsync(`
        INSERT INTO events (title, type, date, end_date, description, created_by, reminder)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [title, type, date, endDate || null, description || '', req.user.username, reminder ? 1 : 0]);

      res.status(201).json({ message: 'Event created', id: result.id });
    } catch (err) {
      res.status(500).json({ message: 'Error creating event', error: err.message });
    }
  }
);

router.put('/:id', auth, async (req, res) => {
  const { title, type, date, endDate, description, reminder } = req.body;
  try {
    await runAsync(`
      UPDATE events
      SET title = ?, type = ?, date = ?, end_date = ?, description = ?, reminder = ?
      WHERE id = ?
    `, [title, type, date, endDate || null, description || '', reminder ? 1 : 0, req.params.id]);
    res.json({ message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await runAsync('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
});

module.exports = router;
