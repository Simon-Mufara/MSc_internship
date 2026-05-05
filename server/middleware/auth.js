const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'msc-dashboard-secret-key-change-in-prod';

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }

    next();
  };
};

const generateToken = (username, role) => {
  return jwt.sign(
    { username, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { auth, authorize, generateToken, JWT_SECRET };
