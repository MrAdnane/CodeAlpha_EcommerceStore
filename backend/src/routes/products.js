const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const { CATEGORIES } = require('../config/constants');
const c = require('../controllers/productController');

const productRules = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('category').isIn(CATEGORIES).withMessage('Choose a valid category'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Original price must be 0 or more'),
];

router.get('/', c.getProducts);
router.get('/:id', param('id').isMongoId().withMessage('Invalid product'), validate, c.getProduct);
router.post('/', protect, adminOnly, productRules, validate, c.createProduct);
router.put('/:id', protect, adminOnly, productRules, validate, c.updateProduct);
router.delete('/:id', protect, adminOnly, c.deleteProduct);
router.post('/:id/reviews', protect,
  param('id').isMongoId().withMessage('Invalid product'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1 to 5'),
  body('comment').trim().isLength({ min: 2, max: 1000 }).withMessage('Comment must be 2 to 1000 characters'),
  validate, c.addReview);

module.exports = router;
