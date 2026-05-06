const express = require('express');
const { body, validationResult } = require('express-validator');
const { allAsync, runAsync } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const assignments = await allAsync(`
      SELECT id, title, description, due_date, status, created_by, created_at
      FROM assignments
      ORDER BY due_date ASC
    `);

    res.json({ assignments });
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ message: 'Error fetching assignments', error: err.message });
  }
});

router.post('/',
  auth,
  authorize('conveyor', 'supervisor'),
  body('title').trim().notEmpty().withMessage('Title required'),
  body('dueDate').isISO8601().withMessage('Invalid date'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate } = req.body;

    try {
      const result = await runAsync(`
        INSERT INTO assignments (title, description, due_date, created_by)
        VALUES (?, ?, ?, ?)
      `, [title, description || '', dueDate, req.user.username]);

      res.status(201).json({
        message: 'Assignment created',
        assignment: {
          id: result.id,
          title,
          description,
          dueDate,
          status: 'active',
          createdBy: req.user.username
        }
      });
    } catch (err) {
      console.error('Error creating assignment:', err);
      res.status(500).json({ message: 'Error creating assignment', error: err.message });
    }
  }
);

router.put('/:id',
  auth,
  body('title').optional().trim(),
  body('status').optional().isIn(['active', 'completed', 'overdue']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status } = req.body;
    const assignmentId = req.params.id;

    try {
      if (title) {
        await runAsync('UPDATE assignments SET title = ? WHERE id = ?', [title, assignmentId]);
      }
      if (description) {
        await runAsync('UPDATE assignments SET description = ? WHERE id = ?', [description, assignmentId]);
      }
      if (status) {
        await runAsync('UPDATE assignments SET status = ? WHERE id = ?', [status, assignmentId]);
      }

      res.json({ message: 'Assignment updated' });
    } catch (err) {
      console.error('Error updating assignment:', err);
      res.status(500).json({ message: 'Error updating assignment', error: err.message });
    }
  }
);

router.delete('/:id', auth, authorize('conveyor'), async (req, res) => {
  try {
    await runAsync('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ message: 'Error deleting assignment', error: err.message });
  }
});

module.exports = router;
