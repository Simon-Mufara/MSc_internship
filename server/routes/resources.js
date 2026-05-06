const express = require('express');
const { body, validationResult } = require('express-validator');
const { allAsync, runAsync, getAsync } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:type', auth, async (req, res) => {
  try {
    const type = req.params.type;

    if (!['lectures', 'recordings', 'materials'].includes(type)) {
      return res.status(400).json({ message: 'Invalid resource type' });
    }

    const resources = await allAsync(`
      SELECT id, name, type, size, data_url, mime_type, uploaded_by, created_at
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
  async (req, res, next) => {
    try {
      const { type } = req.body;
      if (!['lectures', 'recordings', 'materials'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type' });
      }

      const isStudentUpload = req.user.role === 'student' && type === 'materials';
      const isStaffUpload = ['conveyor', 'supervisor'].includes(req.user.role);

      if (!isStudentUpload && !isStaffUpload) {
        return res.status(403).json({ message: 'Not authorized to upload this resource type' });
      }

      return next();
    } catch (err) {
      return res.status(500).json({ message: 'Error validating upload', error: err.message });
    }
  },
  body('name').trim().notEmpty().withMessage('Name required'),
  body('type').isIn(['lectures', 'recordings', 'materials']).withMessage('Invalid type'),
  body('size').isFloat({ min: 0 }).withMessage('Invalid size'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, size, data_url, mime_type } = req.body;

    try {
      const result = await runAsync(`
        INSERT INTO resources (name, type, size, data_url, mime_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, type, size, data_url || null, mime_type || null, req.user.username]);

      res.status(201).json({
        message: 'Resource uploaded',
        resource: {
          id: result.id,
          name,
          type,
          size,
          data_url,
          mime_type,
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
  async (req, res) => {
    try {
      const resource = await getAsync('SELECT * FROM resources WHERE id = ?', [req.params.id]);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      const canDelete =
        req.user.role === 'supervisor' ||
        req.user.role === 'conveyor' ||
        (req.user.role === 'student' && resource.uploaded_by === req.user.username);

      if (!canDelete) {
        return res.status(403).json({ message: 'Not authorized to delete this resource' });
      }

      await runAsync('DELETE FROM resources WHERE id = ?', [req.params.id]);
      res.json({ message: 'Resource deleted' });
    } catch (err) {
      console.error('Error deleting resource:', err);
      res.status(500).json({ message: 'Error deleting resource', error: err.message });
    }
  }
);

module.exports = router;
