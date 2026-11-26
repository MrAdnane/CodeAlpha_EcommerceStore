const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 12, minPrice, maxPrice, featured } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (featured === 'true') query.featured = true;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    const sortMap = {
      'price-asc': { price: 1 }, 'price-desc': { price: -1 },
      rating: { rating: -1, numReviews: -1 }, newest: { createdAt: -1 },
    };
    const sortOpt = sortMap[sort] || { createdAt: -1 };
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOpt).skip((pageNum - 1) * limitNum).limit(limitNum),
      Product.countDocuments(query),
    ]);
    res.json({ products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
};

// Only the fields a product actually has — never pass req.body wholesale.
const pickProductFields = (body) => ({
  name: body.name, description: body.description, price: body.price,
  originalPrice: body.originalPrice ?? 0, category: body.category,
  images: body.images || [], image: body.image || (body.images && body.images[0]) || '',
  stock: body.stock ?? 0, featured: body.featured ?? false,
  badge: body.badge || '', tags: body.tags || [],
});

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(pickProductFields(req.body));
    res.status(201).json(product);
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, pickProductFields(req.body), { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(204).json();
  } catch (err) { next(err); }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.reviews.some((r) => r.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    // Recompute from real reviews only — never trust a stored fake count.
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (err) { next(err); }
};
