const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Coupon = require('../models/Coupon');

// Public coupon check, used at checkout to preview the discount.
// The order itself re-validates the coupon server-side, so a forged
// preview can never change what is actually charged.
router.post('/validate',
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Invalid subtotal'),
  validate,
  async (req, res, next) => {
    try {
      const { code, subtotal } = req.body;
      const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
      if (!coupon) return res.status(400).json({ message: 'Invalid coupon code' });
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res.status(400).json({ message: 'This coupon has expired' });
      }
      if (subtotal < (coupon.minOrder || 0)) {
        return res.status(400).json({ message: `This coupon needs a minimum order of $${coupon.minOrder}` });
      }
      res.json({ code: coupon.code, percent: coupon.percent, discount: (subtotal * coupon.percent) / 100 });
    } catch (err) { next(err); }
  });

module.exports = router;
