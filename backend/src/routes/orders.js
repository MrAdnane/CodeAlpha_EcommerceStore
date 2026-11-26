const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const { ORDER_STATUSES } = require('../config/constants');
const c = require('../controllers/orderController');

const addressRules = (field) => body(`shippingAddress.${field}`).trim().notEmpty().withMessage(`${field} is required`);

router.post('/', protect,
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product in order'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  addressRules('fullName'), addressRules('street'), addressRules('city'),
  addressRules('state'), addressRules('zip'), addressRules('country'),
  body('coupon').optional().isString().trim().isLength({ max: 20 }),
  validate, c.createOrder);

router.get('/my', protect, c.getMyOrders);
router.get('/:id', protect, param('id').isMongoId().withMessage('Invalid order'), validate, c.getOrder);
router.get('/', protect, adminOnly, c.getAllOrders);
router.put('/:id/status', protect, adminOnly,
  param('id').isMongoId().withMessage('Invalid order'),
  body('status').isIn(ORDER_STATUSES).withMessage('Choose a valid status'),
  validate, c.updateOrderStatus);

module.exports = router;
