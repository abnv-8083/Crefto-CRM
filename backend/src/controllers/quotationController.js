const Quotation = require('../models/Quotation');

exports.getQuotations = async (req, res, next) => {
  try {
    const filter = { ...req.companyFilter };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('customer', 'name email')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Quotation.countDocuments(filter)
    ]);
    res.status(200).json({ success: true, count: quotations.length, total, page, pages: Math.ceil(total / limit), data: quotations });
  } catch (error) { next(error); }
};

exports.getQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, ...req.companyFilter })
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'firstName lastName email');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.status(200).json({ success: true, data: quotation });
  } catch (error) { next(error); }
};

exports.createQuotation = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    // Calculate totals
    let subtotal = 0, totalDiscount = 0, totalTax = 0;
    if (req.body.items) {
      req.body.items = req.body.items.map(item => {
        const lineTotal = item.quantity * item.unitPrice;
        const discountAmt = (lineTotal * (item.discount || 0)) / 100;
        const taxAmt = ((lineTotal - discountAmt) * (item.tax || 0)) / 100;
        const total = lineTotal - discountAmt + taxAmt;
        subtotal += lineTotal;
        totalDiscount += discountAmt;
        totalTax += taxAmt;
        return { ...item, total };
      });
    }
    req.body.subtotal = subtotal;
    req.body.totalDiscount = totalDiscount;
    req.body.totalTax = totalTax;
    req.body.grandTotal = subtotal - totalDiscount + totalTax;
    const quotation = await Quotation.create(req.body);
    res.status(201).json({ success: true, data: quotation });
  } catch (error) { next(error); }
};

exports.updateQuotation = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user._id;
    if (req.body.status === 'Sent') req.body.sentAt = new Date();
    if (req.body.status === 'Accepted') req.body.acceptedAt = new Date();
    if (req.body.status === 'Rejected') req.body.rejectedAt = new Date();
    const quotation = await Quotation.findOneAndUpdate({ _id: req.params.id, ...req.companyFilter }, req.body, { new: true })
      .populate('customer', 'name email');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.status(200).json({ success: true, data: quotation });
  } catch (error) { next(error); }
};

exports.deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.status(200).json({ success: true, message: 'Quotation deleted' });
  } catch (error) { next(error); }
};
