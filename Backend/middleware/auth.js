const { auth } = require('../services/firebase');

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (token) {
    auth.verifyIdToken(token)
      .then(decodedToken => {
        req.user = decodedToken;
        next();
      })
      .catch(() => next());
  } else {
    next();
  }
}

module.exports = { verifyToken, optionalAuth };
