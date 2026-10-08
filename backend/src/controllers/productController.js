const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    const filter = { ...req.companyFilter };
    if (req.query.search) filter.$or = [{ name: new RegExp(req.query.search, 'i') }, { sku: new RegExp(req.query.search, 'i') }];
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) { next(error); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.createProduct = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user._id;
    const product = await Product.findOneAndUpdate({ _id: req.params.id, ...req.companyFilter }, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
};
