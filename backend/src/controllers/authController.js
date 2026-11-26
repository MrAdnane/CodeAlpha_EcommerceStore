const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Public user shape — never send the password hash.
const formatUser = (user, token) => ({
  _id: user._id, name: user.name, email: user.email,
  role: user.role, wishlist: user.wishlist, address: user.address, token,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    res.status(201).json(formatUser(user, generateToken(user._id)));
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json(formatUser(user, generateToken(user._id)));
  } catch (err) { next(err); }
};

exports.getProfile = (req, res) => res.json(req.user);

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email, address } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;
    const updated = await user.save();
    res.json(formatUser(updated, generateToken(updated._id)));
  } catch (err) { next(err); }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { currentPassword, newPassword } = req.body;
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword; // hashed by the pre-save hook
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
};

// Toggle a product in the account wishlist (backend, not localStorage).
// Uses ObjectId comparison — indexOf on a string would never match.
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { productId } = req.body;
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(productId);
    await user.save();
    res.json({ wishlist: user.wishlist, saved: idx === -1 });
  } catch (err) { next(err); }
};

exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (err) { next(err); }
};
