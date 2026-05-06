const express = require('express');
const { body, validationResult } = require('express-validator');
const { allAsync, runAsync } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all portfolio entries for a student (visible to student and instructors)
router.get('/:author', auth, async (req, res) => {
  try {
    const author = req.params.author;
    const currentUser = req.user.username;

    // Only the author, dalvie, or martin can view portfolio
    if (currentUser !== author && currentUser !== 'dalvie' && currentUser !== 'martin') {
      return res.status(403).json({ message: 'Not authorized to view this portfolio' });
    }

    const entries = await allAsync(`
      SELECT id, author, title, content, entry_date, created_at, updated_at
      FROM portfolio
      WHERE author = ?
      ORDER BY entry_date DESC
    `, [author]);

    res.json({ entries });
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ message: 'Error fetching portfolio', error: err.message });
  }
});

// Create portfolio entry (students only)
router.post('/',
  auth,
  body('title').trim().notEmpty().withMessage('Title required'),
  body('content').trim().notEmpty().withMessage('Content required'),
  body('entry_date').trim().notEmpty().withMessage('Date required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only students can write portfolio entries
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can write portfolio entries' });
    }

    const { title, content, entry_date } = req.body;
    const author = req.user.username;

    try {
      const result = await runAsync(`
        INSERT INTO portfolio (author, title, content, entry_date)
        VALUES (?, ?, ?, ?)
      `, [author, title, content, entry_date]);

      res.status(201).json({
        message: 'Portfolio entry created',
        entry: {
          id: result.id,
          author,
          title,
          content,
          entry_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Error creating portfolio entry:', err);
      res.status(500).json({ message: 'Error creating portfolio entry', error: err.message });
    }
  }
);

// Update portfolio entry
router.put('/:id',
  auth,
  body('title').trim().notEmpty().withMessage('Title required'),
  body('content').trim().notEmpty().withMessage('Content required'),
  body('entry_date').trim().notEmpty().withMessage('Date required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, entry_date } = req.body;
    const entryId = req.params.id;
    const currentUser = req.user.username;

    try {
      // Check if user owns this entry
      const entry = await require('../db').getAsync('SELECT * FROM portfolio WHERE id = ?', [entryId]);
      if (!entry) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      if (entry.author !== currentUser) {
        return res.status(403).json({ message: 'Not authorized to edit this entry' });
      }

      await runAsync(`
        UPDATE portfolio
        SET title = ?, content = ?, entry_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [title, content, entry_date, entryId]);

      res.json({ message: 'Portfolio entry updated' });
    } catch (err) {
      console.error('Error updating portfolio entry:', err);
      res.status(500).json({ message: 'Error updating portfolio entry', error: err.message });
    }
  }
);

// Delete portfolio entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entryId = req.params.id;
    const currentUser = req.user.username;

    // Check if user owns this entry
    const entry = await require('../db').getAsync('SELECT * FROM portfolio WHERE id = ?', [entryId]);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.author !== currentUser) {
      return res.status(403).json({ message: 'Not authorized to delete this entry' });
    }

    await runAsync('DELETE FROM portfolio WHERE id = ?', [entryId]);
    res.json({ message: 'Portfolio entry deleted' });
  } catch (err) {
    console.error('Error deleting portfolio entry:', err);
    res.status(500).json({ message: 'Error deleting portfolio entry', error: err.message });
  }
});

module.exports = router;
