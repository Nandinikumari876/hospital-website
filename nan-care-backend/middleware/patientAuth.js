const jwt = require('jsonwebtoken');

// Protects routes that require a logged-in patient.
// Expects header: Authorization: Bearer <token>
function patientAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Login required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
    } catch (err) {
    console.error('JWT verify error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

module.exports = patientAuth;