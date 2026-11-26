import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in.' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
};

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.admin?.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to do that.' });
