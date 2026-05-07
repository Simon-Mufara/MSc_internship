const express = require('express');
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const progress = await getAsync(`
      SELECT id, user_id, monthly_update, pty6027, pty6028, supervisor_feedback, modules_json, updated_at
      FROM progress
      WHERE user_id = ?
    `, [userId]);

    if (!progress) {
      return res.json({
        progress: {
          userId,
          monthlyUpdate: '',
          pty6027: 0,
          pty6028: 0,
          supervisorFeedback: '',
          modules: []
        }
      });
    }

    let modules = [];
    try {
      modules = progress.modules_json ? JSON.parse(progress.modules_json) : [];
    } catch (parseError) {
      modules = [];
    }

    res.json({
      progress: {
        userId: progress.user_id,
        monthlyUpdate: progress.monthly_update,
        pty6027: progress.pty6027,
        pty6028: progress.pty6028,
        supervisorFeedback: progress.supervisor_feedback,
        modules,
        updatedAt: progress.updated_at
      }
    });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ message: 'Error fetching progress', error: err.message });
  }
});

router.put('/:userId',
  auth,
  body('monthlyUpdate').optional().trim(),
  body('pty6027').optional().isInt({ min: 0, max: 100 }),
  body('pty6028').optional().isInt({ min: 0, max: 100 }),
  body('modules').optional().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.userId;
    const { monthlyUpdate, pty6027, pty6028, supervisorFeedback, modules } = req.body;
    const modulesJson = Array.isArray(modules) ? JSON.stringify(modules) : '[]';

    if (req.user.username !== userId && req.user.role !== 'supervisor') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    try {
      const existing = await getAsync('SELECT id FROM progress WHERE user_id = ?', [userId]);

      if (existing) {
        await runAsync(`
          UPDATE progress
          SET monthly_update = ?, pty6027 = ?, pty6028 = ?, supervisor_feedback = ?, modules_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [monthlyUpdate || '', pty6027 || 0, pty6028 || 0, supervisorFeedback || '', modulesJson, userId]);
      } else {
        await runAsync(`
          INSERT INTO progress (user_id, monthly_update, pty6027, pty6028, supervisor_feedback, modules_json)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, monthlyUpdate || '', pty6027 || 0, pty6028 || 0, supervisorFeedback || '', modulesJson]);
      }

      res.json({ message: 'Progress updated' });
    } catch (err) {
      console.error('Error updating progress:', err);
      res.status(500).json({ message: 'Error updating progress', error: err.message });
    }
  }
);

module.exports = router;
