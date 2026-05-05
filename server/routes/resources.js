const express = require('express');
const { body, validationResult } = require('express-validator');
const { allAsync, runAsync } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:type', auth, async (req, res) => {
  try {
    const type = req.params.type;

    if (!['lectures', 'recordings', 'materials'].includes(type)) {
      return res.status(400).json({ message: 'Invalid resource type' });
    }

    const resources = await allAsync(`
      SELECT id, name, type, size, uploaded_by, created_at
      FROM resources
      WHERE type = ?
      ORDER BY created_at DESC
    `, [type]);

    res.json({ resources });
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ message: 'Error fetching resources', error: err.message });
  }
});

router.post('/',
  auth,
  authorize('conveyor'),
  body('name').trim().notEmpty().withMessage('Name required'),
  body('type').isIn(['lectures', 'recordings', 'materials']).withMessage('Invalid type'),
  body('size').isFloat({ min: 0 }).withMessage('Invalid size'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, size } = req.body;

    try {
      const result = await runAsync(`
        INSERT INTO resources (name, type, size, uploaded_by)
        VALUES (?, ?, ?, ?)
      `, [name, type, size, req.user.username]);

      res.status(201).json({
        message: 'Resource uploaded',
        resource: {
          id: result.id,
          name,
          type,
          size,
          uploadedBy: req.user.username
        }
      });
    } catch (err) {
      console.error('Error uploading resource:', err);
      res.status(500).json({ message: 'Error uploading resource', error: err.message });
    }
  }
);

router.delete('/:id',
  auth,
  authorize('conveyor'),
  async (req, res) => {
    try {
      await runAsync('DELETE FROM resources WHERE id = ?', [req.params.id]);
      res.json({ message: 'Resource deleted' });
    } catch (err) {
      console.error('Error deleting resource:', err);
      res.status(500).json({ message: 'Error deleting resource', error: err.message });
    }
  }
);

module.exports = router;
