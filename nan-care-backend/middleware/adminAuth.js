// Simple admin protection using a shared secret key.
// The frontend admin panel (or Postman/curl) must send this header:
//   x-admin-key: <ADMIN_KEY value from .env>
function adminAuth(req, res, next) {
  const key = req.header('x-admin-key');

  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_KEY not set' });
  }

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing admin key' });
  }

  next();
}

module.exports = adminAuth;
