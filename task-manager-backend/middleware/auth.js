const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the "bearer tokenn"

  if (!token) {
    return res.status(401).json({ message: 'No token provided' }); // Return error if token is missing
  }

  try {
    // Verifies the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attaches the payload (userId) to req.user for later use
    req.user = { userId: decoded.userId };

    next(); // Passes control to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' }); // Handle invalid or expired tokens
  }
};

module.exports = protect;
