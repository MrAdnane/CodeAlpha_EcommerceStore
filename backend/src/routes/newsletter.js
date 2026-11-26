const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Subscriber = require('../models/Subscriber');

// Real newsletter signup — stored in MongoDB, not a fake toast.
router.post('/subscribe',
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const existing = await Subscriber.findOne({ email });
      if (existing) return res.json({ message: 'You are already subscribed' });
      await Subscriber.create({ email });
      res.status(201).json({ message: 'Subscribed' });
    } catch (err) { next(err); }
  });

module.exports = router;
