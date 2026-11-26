const { validationResult } = require('express-validator');

// Run after the express-validator chain on a route.
// If any rule failed, return 400 with the messages — do not reach the controller.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
};

module.exports = validate;
