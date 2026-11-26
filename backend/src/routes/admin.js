const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const c = require('../controllers/adminController');

// Every route here is admin-only.
router.use(protect, adminOnly);

router.get('/stats', c.getStats);
router.get('/customers', c.getCustomers);
router.get('/reviews', c.getReviews);
router.delete('/products/:productId/reviews/:reviewId',
  param('productId').isMongoId(), param('reviewId').isMongoId(), validate, c.deleteReview);
router.get('/coupons', c.getCoupons);
router.post('/coupons',
  body('code').trim().isLength({ min: 2, max: 20 }).withMessage('Coupon code is required'),
  body('percent').isInt({ min: 1, max: 100 }).withMessage('Percent must be 1 to 100'),
  body('minOrder').optional().isFloat({ min: 0 }),
  validate, c.createCoupon);
router.put('/coupons/:id',
  body('percent').isInt({ min: 1, max: 100 }).withMessage('Percent must be 1 to 100'),
  validate, c.updateCoupon);
router.delete('/coupons/:id', c.deleteCoupon);
router.get('/subscribers', c.getSubscribers);

module.exports = router;
