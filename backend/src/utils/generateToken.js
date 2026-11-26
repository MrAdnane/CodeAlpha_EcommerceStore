const jwt = require('jsonwebtoken');
const { JWT_EXPIRES_IN } = require('../config/constants');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

module.exports = generateToken;
