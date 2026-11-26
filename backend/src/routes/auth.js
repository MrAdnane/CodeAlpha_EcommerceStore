const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/authController');

router.post('/register',
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate, c.register);

router.post('/login',
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate, c.login);

router.get('/profile', protect, c.getProfile);

router.put('/profile', protect,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  validate, c.updateProfile);

router.put('/password', protect,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate, c.updatePassword);

router.get('/wishlist', protect, c.getWishlist);

router.put('/wishlist', protect,
  body('productId').isMongoId().withMessage('Invalid product'),
  validate, c.toggleWishlist);

module.exports = router;
