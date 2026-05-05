const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getAsync, runAsync } = require('../db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login',
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await getAsync('SELECT * FROM users WHERE username = ?', [username]);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const passwordValid = bcrypt.compareSync(password, user.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.username, user.role);

      res.json({
        message: 'Login successful',
        token,
        user: {
          username: user.username,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
