const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const { JWT_SECRET, JWT_EXPIRES_IN = '7d' } = process.env;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing');
  }

  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

module.exports = generateToken;

